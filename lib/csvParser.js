/**
 * CSV Roster Parser Utility
 * 
 * File: /lib/csvParser.js
 * 
 * Parses CSV files containing student roster data with validation
 */

// Expected CSV headers (case-insensitive matching)
const REQUIRED_HEADERS = [
  'Student Name',
  'Grade',
  'Diagnosis',
  'IEP Goals',
  'Accommodations'
];

/**
 * Normalize header names for case-insensitive matching
 */
function normalizeHeader(header) {
  return header.trim().toLowerCase();
}

/**
 * Validate that all required headers exist in the CSV
 */
function validateHeaders(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const requiredNormalized = REQUIRED_HEADERS.map(normalizeHeader);
  
  const missing = requiredNormalized.filter(
    required => !normalizedHeaders.includes(required)
  );
  
  return {
    valid: missing.length === 0,
    missing: missing.map((missingHeader) => {
      // Map back to original case
      return REQUIRED_HEADERS[requiredNormalized.indexOf(missingHeader)];
    })
  };
}

/**
 * Parse semicolon-separated values into an array
 */
function parseSemicolonList(value) {
  if (!value || typeof value !== 'string') {
    return [];
  }
  
  return value
    .split(';')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Parse a CSV file and return an array of student objects
 * 
 * @param {File} file - The CSV file to parse
 * @returns {Promise<{students: Array, errors: Array, warnings: Array}>} - Parsed students with errors/warnings
 */
export async function parseRosterCSV(file) {
  // Dynamic import of papaparse (only load when needed)
  const Papa = (await import('papaparse')).default;
  
  return new Promise((resolve, reject) => {
    const result = {
      students: [],
      errors: [],
      warnings: []
    };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (parsed) => {
        try {
          // Check for parsing errors
          if (parsed.errors && parsed.errors.length > 0) {
            const criticalErrors = parsed.errors.filter(
              err => err.type === 'Quotes' || err.type === 'Delimiter'
            );
            if (criticalErrors.length > 0) {
              result.errors.push(
                `CSV parsing error: ${criticalErrors[0].message}`
              );
              resolve(result);
              return;
            }
          }

          // Validate headers
          if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
            result.errors.push('CSV file appears to be empty or has no headers');
            resolve(result);
            return;
          }

          const headerValidation = validateHeaders(parsed.meta.fields);
          
          if (!headerValidation.valid) {
            result.errors.push(
              `Missing required columns: ${headerValidation.missing.join(', ')}`
            );
            result.errors.push(
              `Required columns: ${REQUIRED_HEADERS.join(', ')}`
            );
            resolve(result);
            return;
          }

          // Parse each row
          parsed.data.forEach((row, index) => {
            const rowNumber = index + 2; // +2 because row 1 is headers, and index is 0-based
            
            try {
              // Find the correct column names (case-insensitive)
              const nameKey = parsed.meta.fields.find(
                f => normalizeHeader(f) === normalizeHeader('Student Name')
              ) || 'Student Name';
              
              const gradeKey = parsed.meta.fields.find(
                f => normalizeHeader(f) === normalizeHeader('Grade')
              ) || 'Grade';
              
              const diagnosisKey = parsed.meta.fields.find(
                f => normalizeHeader(f) === normalizeHeader('Diagnosis')
              ) || 'Diagnosis';
              
              const iepGoalsKey = parsed.meta.fields.find(
                f => normalizeHeader(f) === normalizeHeader('IEP Goals')
              ) || 'IEP Goals';
              
              const accommodationsKey = parsed.meta.fields.find(
                f => normalizeHeader(f) === normalizeHeader('Accommodations')
              ) || 'Accommodations';

              const name = row[nameKey]?.toString().trim() || '';
              const grade = row[gradeKey]?.toString().trim() || '';
              const diagnosis = row[diagnosisKey]?.toString().trim() || '';
              const iepGoalsRaw = row[iepGoalsKey]?.toString() || '';
              const accommodationsRaw = row[accommodationsKey]?.toString() || '';

              // Validate required fields
              if (!name) {
                result.warnings.push(`Row ${rowNumber}: Missing student name, skipping`);
                return;
              }

              if (!grade) {
                result.warnings.push(`Row ${rowNumber}: Missing grade for ${name}`);
              }

              if (!diagnosis) {
                result.warnings.push(`Row ${rowNumber}: Missing diagnosis for ${name}`);
              }

              // Parse semicolon-separated lists
              const iepGoals = parseSemicolonList(iepGoalsRaw);
              const accommodations = parseSemicolonList(accommodationsRaw);

              const student = {
                name,
                grade,
                diagnosis,
                iepGoals,
                accommodations
              };

              result.students.push(student);
            } catch (error) {
              result.warnings.push(
                `Row ${rowNumber}: Error parsing row - ${error.message || 'Unknown error'}`
              );
            }
          });

          if (result.students.length === 0) {
            result.errors.push('No valid student records found in CSV file');
          }

          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error.message || 'Unknown error'}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Generate a CSV template with sample data
 * 
 * @returns {string} - CSV content as a string
 */
export function generateCSVTemplate() {
  const headers = REQUIRED_HEADERS.join(',');
  const sampleRow = [
    'Alex Johnson',
    '5',
    'ADHD',
    'Improve focus during independent work; Complete assignments on time',
    'Extended time; Chunking; Movement breaks'
  ].join(',');

  return `${headers}\n${sampleRow}`;
}

/**
 * Download the CSV template file
 */
export function downloadCSVTemplate() {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'student_roster_template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

