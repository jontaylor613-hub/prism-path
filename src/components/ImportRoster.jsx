/**
 * CSV Roster Import Component (Updated with Google Classroom Integration)
 * 
 * File: /components/ImportRoster.jsx
 * 
 * Allows teachers to bulk-upload student data via CSV file or import from Google Classroom
 * Works with both Firebase and mock store via unified studentService
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, Download, X, GraduationCap, Loader2 } from 'lucide-react';
import { GoogleIntegration, getGoogleAccessToken, isGoogleIntegrationAvailable } from '../lib/googleService';
import { DevModeService } from '../devMode';

// NOTE: Import paths for csvParser and studentService need to be adjusted based on your project structure
// The original component uses: import from '../../lib/csvParser' and '../../lib/studentService'
// If these files are in a different location, update the paths below

// Try to import CSV parser - adjust path as needed
let parseRosterCSV, downloadCSVTemplate, importStudentsFromCSV;

// Dynamic import helper - will be called when needed
const loadDependencies = async () => {
  // Try importing from common locations (adjust these paths to match your structure)
  const csvPaths = [
    '../../prism-path/lib/csvParser.js',
    '../lib/csvParser.js',
    '../../lib/csvParser.js'
  ];
  
  const servicePaths = [
    '../../prism-path/lib/studentService.js',
    '../lib/studentService.js',
    '../../lib/studentService.js'
  ];

  // Load CSV parser
  for (const path of csvPaths) {
    try {
      const csvModule = await import(/* @vite-ignore */ path);
      parseRosterCSV = csvModule.parseRosterCSV;
      downloadCSVTemplate = csvModule.downloadCSVTemplate;
      break;
    } catch (e) {
      // Continue to next path
    }
  }

  // Load student service
  for (const path of servicePaths) {
    try {
      const serviceModule = await import(/* @vite-ignore */ path);
      importStudentsFromCSV = serviceModule.importStudentsFromCSV;
      break;
    } catch (e) {
      // Continue to next path
    }
  }

  // Fallback if imports fail
  if (!parseRosterCSV) {
    parseRosterCSV = async () => {
      throw new Error('CSV parser not found. Please ensure csvParser.js is available.');
    };
    downloadCSVTemplate = () => {
      alert('CSV template download requires csvParser.js to be configured.');
    };
  }

  if (!importStudentsFromCSV) {
    importStudentsFromCSV = async () => {
      throw new Error('Student service not found. Please ensure studentService.js is available.');
    };
  }
};

export default function ImportRoster({ 
  onImportComplete, 
  onStudentsUpdate,
  user = null,
  theme 
}) {
  const [importSource, setImportSource] = useState('csv'); // 'csv' | 'classroom'
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const fileInputRef = useRef(null);
  
  // Google Classroom state
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  // Initialize dependencies on mount
  useEffect(() => {
    loadDependencies();
  }, []);

  // Load courses when switching to Classroom mode
  useEffect(() => {
    if (importSource === 'classroom') {
      loadCourses();
    } else {
      setCourses([]);
      setSelectedCourseId('');
      setGoogleError(null);
    }
  }, [importSource]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    setGoogleError(null);
    
    try {
      const accessToken = await getGoogleAccessToken();
      const google = new GoogleIntegration(accessToken);
      const courseList = await google.listCourses();
      setCourses(courseList);
      
      if (courseList.length > 0) {
        setSelectedCourseId(courseList[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setGoogleError('Failed to load courses. Using mock data for testing.');
      // Still set mock courses for UI testing
      const google = new GoogleIntegration(null);
      const mockCourses = google.getMockCourses();
      setCourses(mockCourses);
      if (mockCourses.length > 0) {
        setSelectedCourseId(mockCourses[0].id);
      }
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleImportFromClassroom = async () => {
    if (!selectedCourseId) {
      setImportStatus('error');
      setParseResult({
        students: [],
        errors: ['Please select a course'],
        warnings: []
      });
      return;
    }

    setIsProcessing(true);
    setImportStatus('idle');
    setParseResult(null);

    try {
      const accessToken = await getGoogleAccessToken();
      const google = new GoogleIntegration(accessToken);
      const roster = await google.getCourseRoster(selectedCourseId);

      // Convert Google Classroom roster to our student format
      const students = roster.map((student, index) => {
        const profile = student.profile || {};
        const name = profile.name || {};
        const fullName = name.fullName || `${name.givenName || ''} ${name.familyName || ''}`.trim() || `Student ${index + 1}`;
        
        return {
          name: fullName,
          grade: '', // Google Classroom doesn't provide grade - user will need to fill
          diagnosis: '', // User will need to fill
          iepGoals: [],
          accommodations: [],
          email: profile.emailAddress || ''
        };
      });

      setParseResult({
        students: students,
        errors: [],
        warnings: students.length === 0 
          ? ['No students found in this course']
          : ['Note: Grade and Diagnosis fields need to be filled manually']
      });
    } catch (error) {
      setImportStatus('error');
      setParseResult({
        students: [],
        errors: [error.message || 'Failed to import from Google Classroom'],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setImportStatus('error');
      setParseResult({
        students: [],
        errors: ['Please upload a CSV file (.csv extension required)'],
        warnings: []
      });
      return;
    }

    setIsProcessing(true);
    setImportStatus('idle');
    setParseResult(null);

    try {
      const result = await parseRosterCSV(file);
      setParseResult(result);
      
      if (result.errors.length > 0) {
        setImportStatus('error');
      }
    } catch (error) {
      setImportStatus('error');
      setParseResult({
        students: [],
        errors: [error.message || 'Failed to parse CSV file'],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (importSource === 'csv') {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFile(files[0]);
      }
    }
  }, [importSource]);

  const handleFileSelect = useCallback(async (e) => {
    if (importSource === 'csv') {
      const files = e.target.files;
      if (files && files.length > 0) {
        await processFile(files[0]);
      }
    }
  }, [importSource]);

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.students.length === 0) {
      return;
    }

    setIsProcessing(true);
    try {
      // Use unified service (tries Firebase, falls back to mock)
      const importedStudents = await importStudentsFromCSV(
        parseResult.students,
        user?.uid || null,
        user?.role || 'admin'
      );
      
      // Notify parent components
      if (onImportComplete) {
        onImportComplete(importedStudents);
      }
      
      if (onStudentsUpdate) {
        onStudentsUpdate(importedStudents);
      }
      
      setImportStatus('success');
      
      // Clear the preview after a short delay
      setTimeout(() => {
        setParseResult(null);
        setImportStatus('idle');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error) {
      setImportStatus('error');
      setParseResult({
        ...parseResult,
        errors: [
          ...(parseResult.errors || []),
          error.message || 'Failed to import students'
        ]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
  };

  const handleReset = () => {
    setParseResult(null);
    setImportStatus('idle');
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewStudents = parseResult?.students.slice(0, 5) || [];

  return (
    <div className={`w-full ${theme?.cardBg || 'bg-white/80 backdrop-blur-xl'} ${theme?.cardBorder || 'border border-slate-200'} rounded-lg p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xl font-semibold ${theme?.text || 'text-slate-800'}`}>
          Import Student Roster
        </h3>
        {parseResult && (
          <button
            onClick={handleReset}
            className={`p-1 rounded ${theme?.textMuted || 'text-slate-500'} hover:${theme?.text || 'text-slate-800'}`}
            aria-label="Reset"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Import Source Toggle */}
      <div className="mb-4">
        <label className={`block text-xs font-bold ${theme?.textMuted || 'text-slate-500'} uppercase mb-2`}>
          Import Source
        </label>
        <div className={`flex gap-2 p-1 ${theme?.inputBg || 'bg-slate-100'} rounded-lg`}>
          <button
            onClick={() => setImportSource('csv')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              importSource === 'csv'
                ? `${theme?.primaryText || 'text-white'} ${theme?.primaryBg || 'bg-cyan-600'} shadow-md`
                : `${theme?.textMuted || 'text-slate-600'} hover:${theme?.text || 'text-slate-800'}`
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UploadCloud size={16} />
              Upload CSV
            </div>
          </button>
          <button
            onClick={() => setImportSource('classroom')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              importSource === 'classroom'
                ? `${theme?.primaryText || 'text-white'} ${theme?.primaryBg || 'bg-cyan-600'} shadow-md`
                : `${theme?.textMuted || 'text-slate-600'} hover:${theme?.text || 'text-slate-800'}`
            }`}
            disabled={!isGoogleIntegrationAvailable() && !DevModeService.isActive()}
          >
            <div className="flex items-center justify-center gap-2">
              <GraduationCap size={16} />
              Google Classroom
            </div>
          </button>
        </div>
        {importSource === 'classroom' && (!isGoogleIntegrationAvailable() && !DevModeService.isActive()) && (
          <p className={`text-xs mt-2 ${theme?.textMuted || 'text-slate-500'}`}>
            Google integration not available. Enable in settings or use dev mode.
          </p>
        )}
      </div>

      {/* Google Classroom Course Selection */}
      {importSource === 'classroom' && (
        <div className="mb-4 space-y-3">
          {isLoadingCourses ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={20} className="animate-spin text-cyan-600" />
              <span className={theme?.textMuted || 'text-slate-500'}>Loading courses...</span>
            </div>
          ) : (
            <>
              <div>
                <label className={`block text-xs font-bold ${theme?.textMuted || 'text-slate-500'} uppercase mb-2`}>
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className={`w-full ${theme?.inputBg || 'bg-white'} border ${theme?.inputBorder || 'border-slate-300'} rounded-lg p-3 ${theme?.text || 'text-slate-800'} outline-none focus:border-cyan-500`}
                >
                  {courses.length === 0 ? (
                    <option value="">No courses available</option>
                  ) : (
                    courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} {course.section ? `(${course.section})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                onClick={handleImportFromClassroom}
                disabled={!selectedCourseId || isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  !selectedCourseId || isProcessing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'
                }`}
              >
                {isProcessing ? 'Importing...' : 'Import Roster from Course'}
              </button>
              {googleError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">{googleError}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* CSV Template Download (only for CSV mode) */}
      {importSource === 'csv' && (
        <div className="mb-4">
          <button
            onClick={handleDownloadTemplate}
            className={`flex items-center gap-2 text-sm ${theme?.primaryText || 'text-cyan-600'} hover:underline`}
          >
            <Download size={16} />
            Download CSV Template
          </button>
          <p className={`text-xs mt-1 ${theme?.textMuted || 'text-slate-500'}`}>
            Use the template to ensure your CSV has the correct format
          </p>
        </div>
      )}

      {/* Drag and Drop Zone (only for CSV mode) */}
      {importSource === 'csv' && !parseResult && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-cyan-500 bg-cyan-50/50' 
              : theme?.cardBorder || 'border-slate-300'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-cyan-400'}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <p className={theme?.textMuted || 'text-slate-500'}>Processing CSV...</p>
            </div>
          ) : (
            <>
              <UploadCloud 
                size={48} 
                className={`mx-auto mb-4 ${isDragging ? 'text-cyan-500' : theme?.textMuted || 'text-slate-400'}`} 
              />
              <p className={`text-lg font-medium mb-2 ${theme?.text || 'text-slate-800'}`}>
                Drag and drop your CSV file here
              </p>
              <p className={`text-sm ${theme?.textMuted || 'text-slate-500'}`}>
                or click to browse
              </p>
              <p className={`text-xs mt-2 ${theme?.textMuted || 'text-slate-400'}`}>
                Required columns: Student Name, Grade, Diagnosis, IEP Goals, Accommodations
              </p>
            </>
          )}
        </div>
      )}

      {/* Errors */}
      {parseResult && parseResult.errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-2">Import Errors</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {parseResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {parseResult && parseResult.warnings.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-800 mb-2">Warnings</h4>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                {parseResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {importStatus === 'success' && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">
              Successfully imported {parseResult?.students.length || 0} student(s)!
            </p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {parseResult && parseResult.students.length > 0 && parseResult.errors.length === 0 && (
        <div className="mb-4">
          <h4 className={`font-semibold mb-3 ${theme?.text || 'text-slate-800'}`}>
            Preview ({parseResult.students.length} student{parseResult.students.length !== 1 ? 's' : ''} found)
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${theme?.cardBorder || 'border-slate-200'}`}>
                  <th className={`text-left p-2 font-semibold ${theme?.text || 'text-slate-800'}`}>Name</th>
                  <th className={`text-left p-2 font-semibold ${theme?.text || 'text-slate-800'}`}>Grade</th>
                  <th className={`text-left p-2 font-semibold ${theme?.text || 'text-slate-800'}`}>Diagnosis</th>
                  <th className={`text-left p-2 font-semibold ${theme?.text || 'text-slate-800'}`}>IEP Goals</th>
                  <th className={`text-left p-2 font-semibold ${theme?.text || 'text-slate-800'}`}>Accommodations</th>
                </tr>
              </thead>
              <tbody>
                {previewStudents.map((student, index) => (
                  <tr 
                    key={index} 
                    className={`border-b ${theme?.cardBorder || 'border-slate-100'}`}
                  >
                    <td className={`p-2 ${theme?.text || 'text-slate-800'}`}>{student.name}</td>
                    <td className={`p-2 ${theme?.textMuted || 'text-slate-600'}`}>{student.grade || '—'}</td>
                    <td className={`p-2 ${theme?.textMuted || 'text-slate-600'}`}>{student.diagnosis || '—'}</td>
                    <td className={`p-2 ${theme?.textMuted || 'text-slate-600'}`}>
                      {student.iepGoals && student.iepGoals.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {student.iepGoals.slice(0, 2).map((goal, i) => (
                            <li key={i} className="text-xs">{goal}</li>
                          ))}
                          {student.iepGoals.length > 2 && (
                            <li className="text-xs text-slate-400">
                              +{student.iepGoals.length - 2} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className={`p-2 ${theme?.textMuted || 'text-slate-600'}`}>
                      {student.accommodations && student.accommodations.length > 0 ? (
                        <span className="text-xs">
                          {student.accommodations.slice(0, 2).join(', ')}
                          {student.accommodations.length > 2 && ` +${student.accommodations.length - 2}`}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {parseResult.students.length > 5 && (
              <p className={`text-xs mt-2 text-center ${theme?.textMuted || 'text-slate-500'}`}>
                Showing first 5 of {parseResult.students.length} students
              </p>
            )}
          </div>

          {/* Confirm Import Button */}
          {importStatus !== 'success' && (
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing || parseResult.errors.length > 0}
              className={`
                mt-4 w-full py-3 px-4 rounded-lg font-semibold transition-all
                ${parseResult.errors.length > 0 || isProcessing
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'
                }
              `}
            >
              {isProcessing ? 'Processing...' : `Confirm Import (${parseResult.students.length} students)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

