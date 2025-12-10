/**
 * CSV Roster Parser Utility
 * 
 * Handles parsing of student roster CSV files with validation
 * Uses papaparse for robust CSV parsing
 */

// Expected CSV column headers
const REQUIRED_HEADERS = ['Student Name', 'Grade', 'Diagnosis'];
const OPTIONAL_HEADERS = ['IEP Goals', 'Accommodations'];

/**
 * Parse a CSV file containing student roster data
 * 
 * @param {File} file - The CSV file to parse
 * @returns {Promise<{students: Array, errors: Array, warnings: Array}>}
 */
export async function parseRosterCSV(file) {
  return new Promise((resolve, reject) => {
    // Dynamically import papaparse (handle case where it might not be installed yet)
    import('papaparse').then((Papa) => {
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(), // Trim whitespace from headers
        complete: (results) => {
          const errors = [];
          const warnings = [];
          const students = [];

          // Validate headers
          if (!results.meta.fields || results.meta.fields.length === 0) {
            errors.push('CSV file appears to be empty or has no headers');
            resolve({ students: [], errors, warnings });
            return;
          }

          const headers = results.meta.fields.map(h => h.trim());
          
          // Check for required headers (case-insensitive)
          const headerMap = {};
          headers.forEach(header => {
            // Normalize header name for matching
            const normalized = header.toLowerCase().trim();
            headerMap[normalized] = header;
          });

          // Check required headers
          const missingHeaders = [];
          REQUIRED_HEADERS.forEach(required => {
            const normalized = required.toLowerCase();
            if (!headerMap[normalized]) {
              missingHeaders.push(required);
            }
          });

          if (missingHeaders.length > 0) {
            errors.push(
              `Missing required columns: ${missingHeaders.join(', ')}. ` +
              `Required columns are: ${REQUIRED_HEADERS.join(', ')}`
            );
            resolve({ students: [], errors, warnings });
            return;
          }

          // Warn about missing optional headers
          OPTIONAL_HEADERS.forEach(optional => {
            const normalized = optional.toLowerCase();
            if (!headerMap[normalized]) {
              warnings.push(`Optional column "${optional}" not found. Students will be imported without this data.`);
            }
          });

          // Parse each row
          results.data.forEach((row, index) => {
            const rowNum = index + 2; // +2 because index is 0-based and we skip header row

            try {
              // Get values with case-insensitive matching
              const getValue = (headerName) => {
                const normalized = headerName.toLowerCase();
                const actualHeader = headerMap[normalized];
                if (!actualHeader) return '';
                
                const value = row[actualHeader];
                return value ? String(value).trim() : '';
              };

              const name = getValue('Student Name');
              const grade = getValue('Grade');
              const diagnosis = getValue('Diagnosis');
              const iepGoalsStr = getValue('IEP Goals');
              const accommodationsStr = getValue('Accommodations');

              // Skip empty rows
              if (!name && !grade && !diagnosis) {
                return;
              }

              // Validate required fields
              if (!name) {
                warnings.push(`Row ${rowNum}: Missing student name, skipping row`);
                return;
              }

              // Parse semicolon-separated lists
              const parseSemicolonList = (str) => {
                if (!str || str.trim() === '') return [];
                return str.split(';')
                  .map(item => item.trim())
                  .filter(item => item.length > 0);
              };

              const student = {
                name: name,
                grade: grade || '',
                diagnosis: diagnosis || '',
                iepGoals: parseSemicolonList(iepGoalsStr),
                accommodations: parseSemicolonList(accommodationsStr)
              };

              students.push(student);
            } catch (error) {
              warnings.push(`Row ${rowNum}: Error parsing row - ${error.message}`);
            }
          });

          if (students.length === 0 && errors.length === 0) {
            warnings.push('No valid student rows found in CSV file');
          }

          resolve({ students, errors, warnings });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    }).catch((importError) => {
      // If papaparse is not installed, provide helpful error
      reject(new Error(
        'CSV parsing library not found. Please install papaparse: npm install papaparse'
      ));
    });
  });
}

/**
 * Download a CSV template file with correct headers and sample data
 */
export function downloadCSVTemplate() {
  // Create CSV content with headers and one sample row
  const headers = ['Student Name', 'Grade', 'Diagnosis', 'IEP Goals', 'Accommodations'];
  const sampleRow = [
    'Alex Johnson',
    '5',
    'ADHD',
    'Improve focus during independent work; Complete assignments on time',
    'Extended time on tests; Movement breaks every 20 minutes; Chunking assignments'
  ];

  const csvContent = [
    headers.join(','),
    sampleRow.join(','),
    // Add a blank row to show structure
    ['', '', '', '', ''].join(',')
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'student_roster_template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

