/**
 * CSV Roster Import Component
 * 
 * Allows teachers to bulk-upload student data via CSV file
 * Integrates with Firebase and mock state via studentData service
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, Download, X, BookOpen, Loader2 } from 'lucide-react';
import { parseRosterCSV, downloadCSVTemplate } from '../lib/csvParser';
import { createStudent } from '../studentData';
import { GoogleIntegration, getGoogleAccessToken, isGoogleIntegrationAvailable } from '../lib/googleService';

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
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [classroomRoster, setClassroomRoster] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const fileInputRef = useRef(null);

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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.students.length === 0) {
      return;
    }

    if (parseResult.errors.length > 0) {
      return; // Don't import if there are errors
    }

    setIsProcessing(true);
    try {
      const importedStudents = [];
      const errors = [];

      // Import each student using the studentData service
      for (const studentData of parseResult.students) {
        try {
          // Map CSV data to the format expected by createStudent
          const studentRecord = {
            name: studentData.name,
            grade: studentData.grade,
            need: studentData.diagnosis, // Map diagnosis to 'need' field
            // Store IEP goals and accommodations in a way that can be retrieved later
            // These will need to be stored separately if your studentData structure requires it
          };

          // Create student via Firebase/mock service
          const createdStudent = await createStudent(
            studentRecord,
            user?.uid || 'system',
            user?.role || 'teacher'
          );

          // If IEP goals or accommodations exist, we might need to update the student record
          // This depends on your studentData structure - you may need to extend createStudent
          // to accept these fields, or update them separately
          if (studentData.iepGoals && studentData.iepGoals.length > 0) {
            // Store IEP goals - you may need to call an update function or extend createStudent
            console.log(`IEP Goals for ${studentData.name}:`, studentData.iepGoals);
          }

          if (studentData.accommodations && studentData.accommodations.length > 0) {
            // Store accommodations - you may need to call an update function or extend createStudent
            console.log(`Accommodations for ${studentData.name}:`, studentData.accommodations);
          }

          importedStudents.push(createdStudent);
        } catch (error) {
          errors.push(`Failed to import ${studentData.name}: ${error.message}`);
          console.error(`Error importing student ${studentData.name}:`, error);
        }
      }

      if (errors.length > 0) {
        setParseResult({
          ...parseResult,
          errors: [...(parseResult.errors || []), ...errors]
        });
        setImportStatus('error');
      } else {
        setImportStatus('success');
        
        // Notify parent components
        if (onImportComplete) {
          onImportComplete(importedStudents);
        }
        
        if (onStudentsUpdate) {
          onStudentsUpdate(importedStudents);
        }

        // Clear the preview after a short delay
        setTimeout(() => {
          setParseResult(null);
          setImportStatus('idle');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      }
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

  const handleReset = () => {
    setParseResult(null);
    setImportStatus('idle');
    setIsDragging(false);
    setClassroomRoster(null);
    setSelectedCourseId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load Google Classroom courses when source is changed to 'classroom'
  useEffect(() => {
    if (importSource === 'classroom' && courses.length === 0 && !isLoadingCourses) {
      loadCourses();
    }
  }, [importSource]);

  // Load roster when a course is selected
  useEffect(() => {
    if (selectedCourseId && importSource === 'classroom') {
      loadCourseRoster(selectedCourseId);
    }
  }, [selectedCourseId, importSource]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const accessToken = await getGoogleAccessToken();
      const google = new GoogleIntegration(accessToken);
      const courseList = await google.listCourses();
      setCourses(courseList);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setParseResult({
        students: [],
        errors: ['Failed to load Google Classroom courses. Make sure you are signed in with Google.'],
        warnings: []
      });
      setImportStatus('error');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadCourseRoster = async (courseId) => {
    setIsLoadingRoster(true);
    setClassroomRoster(null);
    try {
      const accessToken = await getGoogleAccessToken();
      const google = new GoogleIntegration(accessToken);
      const roster = await google.getCourseRoster(courseId);
      setClassroomRoster(roster);
      
      // Convert Google Classroom roster format to our student format
      const students = roster.map((student) => {
        const profile = student.profile || {};
        const name = profile.name || {};
        const fullName = name.fullName || `${name.givenName || ''} ${name.familyName || ''}`.trim() || profile.emailAddress || 'Unknown';
        
        return {
          name: fullName,
          email: profile.emailAddress || '',
          grade: '', // Not available from Classroom API
          diagnosis: '', // Not available from Classroom API
          iepGoals: [],
          accommodations: []
        };
      });

      setParseResult({
        students,
        errors: [],
        warnings: students.length === 0 ? ['No students found in this course.'] : []
      });
    } catch (error) {
      console.error('Failed to load roster:', error);
      setParseResult({
        students: [],
        errors: ['Failed to load course roster. Please try again.'],
        warnings: []
      });
      setImportStatus('error');
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const previewStudents = parseResult?.students.slice(0, 5) || [];

  // Use theme from props or default
  const safeTheme = theme || {
    cardBg: 'bg-white/80 backdrop-blur-xl',
    cardBorder: 'border border-slate-200',
    text: 'text-slate-800',
    textMuted: 'text-slate-500',
    primaryText: 'text-cyan-600',
    primaryBg: 'bg-cyan-600',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-300'
  };

  return (
    <div className={`w-full ${safeTheme.cardBg} ${safeTheme.cardBorder} rounded-lg p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xl font-semibold ${safeTheme.text}`}>
          Import Student Roster
        </h3>
        {parseResult && (
          <button
            onClick={handleReset}
            className={`p-1 rounded ${safeTheme.textMuted} hover:${safeTheme.text}`}
            aria-label="Reset"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Import Source Toggle */}
      <div className="mb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setImportSource('csv');
              handleReset();
            }}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-all
              ${importSource === 'csv'
                ? `${safeTheme.primaryBg} text-white`
                : `${safeTheme.inputBg} ${safeTheme.text} border ${safeTheme.inputBorder} hover:border-cyan-400`
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <UploadCloud size={16} />
              Upload CSV
            </div>
          </button>
          <button
            onClick={() => {
              setImportSource('classroom');
              handleReset();
            }}
            disabled={!isGoogleIntegrationAvailable()}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium transition-all
              ${importSource === 'classroom'
                ? `${safeTheme.primaryBg} text-white`
                : `${safeTheme.inputBg} ${safeTheme.text} border ${safeTheme.inputBorder} hover:border-cyan-400`
              }
              ${!isGoogleIntegrationAvailable() ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen size={16} />
              Google Classroom
            </div>
          </button>
        </div>
        {!isGoogleIntegrationAvailable() && (
          <p className={`text-xs ${safeTheme.textMuted} italic`}>
            Google Classroom integration requires authentication. Using mock data in dev mode.
          </p>
        )}
      </div>

      {/* CSV Template Download - Only show for CSV source */}
      {importSource === 'csv' && (
        <div className="mb-4">
          <button
            onClick={downloadCSVTemplate}
            className={`flex items-center gap-2 text-sm ${safeTheme.primaryText} hover:underline`}
          >
            <Download size={16} />
            Download CSV Template
          </button>
          <p className={`text-xs mt-1 ${safeTheme.textMuted}`}>
            Use the template to ensure your CSV has the correct format
          </p>
        </div>
      )}

      {/* Google Classroom Course Selection */}
      {importSource === 'classroom' && !classroomRoster && (
        <div className="mb-4">
          {isLoadingCourses ? (
            <div className="flex flex-col items-center gap-2 p-8">
              <Loader2 size={32} className="animate-spin text-cyan-600" />
              <p className={safeTheme.textMuted}>Loading courses...</p>
            </div>
          ) : courses.length > 0 ? (
            <div>
              <label className={`block text-sm font-medium ${safeTheme.text} mb-2`}>
                Select a Course
              </label>
              <select
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className={`
                  w-full ${safeTheme.inputBg} border ${safeTheme.inputBorder} rounded-lg p-3
                  ${safeTheme.text} focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none
                `}
              >
                <option value="">-- Choose a course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} {course.section ? `(${course.section})` : ''}
                  </option>
                ))}
              </select>
              {isLoadingRoster && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 size={16} className="animate-spin text-cyan-600" />
                  <p className={`text-xs ${safeTheme.textMuted}`}>Loading roster...</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-4 ${safeTheme.inputBg} border ${safeTheme.inputBorder} rounded-lg text-center`}>
              <p className={safeTheme.textMuted}>No courses found. Make sure you're signed in with Google.</p>
            </div>
          )}
        </div>
      )}

      {/* Drag and Drop Zone - Only show for CSV source */}
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
              : safeTheme.cardBorder || 'border-slate-300'
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
              <p className={safeTheme.textMuted}>Processing CSV...</p>
            </div>
          ) : (
            <>
              <UploadCloud 
                size={48} 
                className={`mx-auto mb-4 ${isDragging ? 'text-cyan-500' : safeTheme.textMuted || 'text-slate-400'}`} 
              />
              <p className={`text-lg font-medium mb-2 ${safeTheme.text}`}>
                Drag and drop your CSV file here
              </p>
              <p className={`text-sm ${safeTheme.textMuted}`}>
                or click to browse
              </p>
              <p className={`text-xs mt-2 ${safeTheme.textMuted}`}>
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
      {parseResult && parseResult.warnings && parseResult.warnings.length > 0 && (
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
          <h4 className={`font-semibold mb-3 ${safeTheme.text}`}>
            Preview ({parseResult.students.length} student{parseResult.students.length !== 1 ? 's' : ''} found)
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${safeTheme.cardBorder || 'border-slate-200'}`}>
                  <th className={`text-left p-2 font-semibold ${safeTheme.text}`}>Name</th>
                  <th className={`text-left p-2 font-semibold ${safeTheme.text}`}>Grade</th>
                  <th className={`text-left p-2 font-semibold ${safeTheme.text}`}>Diagnosis</th>
                  <th className={`text-left p-2 font-semibold ${safeTheme.text}`}>IEP Goals</th>
                  <th className={`text-left p-2 font-semibold ${safeTheme.text}`}>Accommodations</th>
                </tr>
              </thead>
              <tbody>
                {previewStudents.map((student, index) => (
                  <tr 
                    key={index} 
                    className={`border-b ${safeTheme.cardBorder || 'border-slate-100'}`}
                  >
                    <td className={`p-2 ${safeTheme.text}`}>{student.name}</td>
                    <td className={`p-2 ${safeTheme.textMuted || 'text-slate-600'}`}>{student.grade || '—'}</td>
                    <td className={`p-2 ${safeTheme.textMuted || 'text-slate-600'}`}>{student.diagnosis || '—'}</td>
                    <td className={`p-2 ${safeTheme.textMuted || 'text-slate-600'}`}>
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
                    <td className={`p-2 ${safeTheme.textMuted || 'text-slate-600'}`}>
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
              <p className={`text-xs mt-2 text-center ${safeTheme.textMuted}`}>
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
