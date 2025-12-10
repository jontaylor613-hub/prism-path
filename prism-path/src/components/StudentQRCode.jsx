import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { getTheme } from '../utils';
import { generateStudentToken } from '../studentData';
import { getStudentGoals } from '../studentData';

/**
 * StudentQRCode Component
 * Displays a printable QR code card for rapid mobile data collection
 */
export default function StudentQRCode({ 
  student, 
  user, 
  isDark = true,
  onTokenGenerated 
}) {
  const theme = getTheme(isDark);
  const [token, setToken] = useState(student?.trackingToken || null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef(null);

  // Load goals
  useEffect(() => {
    const loadGoals = async () => {
      if (!student?.id || !user?.uid) return;
      try {
        const studentGoals = await getStudentGoals(student.id, user.uid);
        // Filter to only active goals
        const activeGoals = studentGoals.filter(g => !g.isCompleted && !g.isArchived);
        setGoals(activeGoals);
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };
    loadGoals();
  }, [student, user]);

  // Generate token if not exists
  useEffect(() => {
    const ensureToken = async () => {
      if (!student?.id || !user?.uid || token) return;
      
      setGenerating(true);
      try {
        const newToken = await generateStudentToken(student.id, user.uid);
        setToken(newToken);
        if (onTokenGenerated) {
          onTokenGenerated(newToken);
        }
      } catch (error) {
        console.error('Error generating token:', error);
      } finally {
        setGenerating(false);
      }
    };
    ensureToken();
  }, [student, user, token, onTokenGenerated]);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the QR code card');
      return;
    }

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${student?.name || 'Student'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              padding: 20px;
            }
            .qr-card {
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              padding: 32px;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .qr-header {
              text-align: center;
              margin-bottom: 24px;
            }
            .qr-header h2 {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .qr-code-container {
              display: flex;
              justify-content: center;
              margin: 32px 0;
              padding: 20px;
              background: #f9fafb;
              border-radius: 12px;
            }
            .qr-goals {
              margin-top: 24px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
            }
            .qr-goals h3 {
              font-size: 14px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
            }
            .qr-goals ul {
              list-style: none;
            }
            .qr-goals li {
              font-size: 14px;
              color: #374151;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .qr-goals li:last-child {
              border-bottom: none;
            }
            @media print {
              body { background: white; padding: 0; }
              .qr-card { box-shadow: none; border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (!student) {
    return (
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6`}>
        <p className={`text-center ${theme.textMuted}`}>No student selected</p>
      </div>
    );
  }

  const trackingUrl = token 
    ? `${window.location.origin}/track/${token}`
    : 'Generating token...';

  return (
    <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${theme.text}`}>QR Code Card</h3>
        <button
          onClick={handlePrint}
          disabled={!token || generating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            token && !generating
              ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:shadow-lg'
              : 'bg-slate-500/50 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Printer size={18} />
          Print Card
        </button>
      </div>

      {/* Printable Card */}
      <div ref={printRef} className="qr-card bg-white border-2 border-slate-200 rounded-2xl p-8 max-w-md mx-auto">
        {/* Header */}
        <div className="qr-header">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{student.name}</h2>
          {student.grade && (
            <p className="text-sm text-slate-600">Grade {student.grade}</p>
          )}
        </div>

        {/* QR Code */}
        <div className="qr-code-container bg-slate-50 rounded-xl p-5 flex justify-center">
          {token && !generating ? (
            <QRCodeSVG
              value={trackingUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-200 rounded">
              <p className="text-sm text-slate-500">Generating...</p>
            </div>
          )}
        </div>

        {/* Goals List */}
        {goals.length > 0 && (
          <div className="qr-goals">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Active IEP Goals
            </h3>
            <ul>
              {goals.slice(0, 5).map((goal, index) => (
                <li key={goal.id || index} className="text-sm text-slate-700 py-2 border-b border-slate-100 last:border-0">
                  {goal.description || goal.text || goal.title || `Goal ${index + 1}`}
                </li>
              ))}
            </ul>
            {goals.length > 5 && (
              <p className="text-xs text-slate-400 mt-2">+ {goals.length - 5} more goals</p>
            )}
          </div>
        )}

        {goals.length === 0 && (
          <div className="qr-goals">
            <p className="text-sm text-slate-400 italic">No active goals</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} border ${theme.cardBorder}`}>
        <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
          <strong className={theme.text}>How it works:</strong> Print this card and place it in the classroom. 
          Teachers can scan the QR code with their phone to quickly track student progress without logging in.
        </p>
      </div>
    </div>
  );
}

