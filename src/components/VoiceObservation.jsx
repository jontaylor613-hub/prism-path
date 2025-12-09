import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, X, Send } from 'lucide-react';
import { getTheme } from '../utils';

/**
 * Voice-to-Data Observation Tracker
 * Uses Web Speech API to record voice observations and parse them into structured data
 */
export default function VoiceObservation({ 
  students = [], 
  onObservationSubmit,
  isDark = true 
}) {
  const theme = getTheme(isDark);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    setError('');
    setTranscript('');
    setParsedData(null);
    setIsRecording(true);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsRecording(false);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const parseObservation = async () => {
    if (!transcript.trim()) {
      setError('Please record an observation first.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Call API to parse the observation
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'neuro_driver', // Using neuro_driver mode, or could create a new 'data_extractor' mode
          userInput: `Extract the following JSON from this text: "${transcript}". Return ONLY valid JSON in this format: {"studentName": "name", "time": "time", "antecedent": "what happened before", "behavior": "the behavior", "consequence": "what happened after"}. If any field cannot be determined, use null.`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse observation');
      }

      const data = await response.json();
      let parsed;

      // Try to extract JSON from the response
      try {
        // The API might return JSON wrapped in text, so we try to extract it
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(data.result);
        }
      } catch (parseError) {
        // If direct parsing fails, try to extract fields manually using a simpler approach
        // Fallback: create a simple parser
        parsed = {
          studentName: extractStudentName(transcript, students),
          time: extractTime(transcript),
          antecedent: extractField(transcript, ['because of', 'due to', 'after', 'when']),
          behavior: extractField(transcript, ['had', 'showed', 'displayed', 'exhibited']),
          consequence: extractField(transcript, ['resulted in', 'led to', 'caused']),
        };
      }

      setParsedData(parsed);
    } catch (err) {
      console.error('Error parsing observation:', err);
      setError('Failed to parse observation. Please try again or fill the form manually.');
      
      // Fallback: create basic parsed data from transcript
      setParsedData({
        studentName: extractStudentName(transcript, students),
        time: extractTime(transcript),
        antecedent: null,
        behavior: transcript,
        consequence: null,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for fallback parsing
  const extractStudentName = (text, students) => {
    for (const student of students) {
      if (text.toLowerCase().includes(student.name.toLowerCase())) {
        return student.name;
      }
    }
    return null;
  };

  const extractTime = (text) => {
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)/i) || 
                      text.match(/(\d{1,2})\s*(am|pm|AM|PM)/i) ||
                      text.match(/at\s+(\d{1,2}):?(\d{2})?/i);
    return timeMatch ? timeMatch[0] : null;
  };

  const extractField = (text, keywords) => {
    for (const keyword of keywords) {
      const index = text.toLowerCase().indexOf(keyword.toLowerCase());
      if (index !== -1) {
        const afterKeyword = text.substring(index + keyword.length).trim();
        // Extract sentence or phrase after keyword
        const match = afterKeyword.match(/^[^.!?]+/);
        return match ? match[0].trim() : null;
      }
    }
    return null;
  };

  const handleSubmit = () => {
    if (parsedData && onObservationSubmit) {
      onObservationSubmit(parsedData);
      // Reset form
      setTranscript('');
      setParsedData(null);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setParsedData(null);
    setError('');
  };

  return (
    <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 shadow-lg`}>
      <h3 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
        <Mic className="text-cyan-400" size={20} />
        Voice Observation Tracker
      </h3>
      <p className={`text-sm ${theme.textMuted} mb-6`}>
        Record a voice observation and it will be automatically parsed into a behavior log.
      </p>

      {/* Recording Button */}
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50'
              : 'bg-gradient-to-br from-cyan-500 to-fuchsia-500 hover:from-cyan-600 hover:to-fuchsia-600 text-white shadow-lg shadow-cyan-500/25'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <p className={`text-sm ${theme.textMuted} mt-3`}>
          {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
        </p>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className={`mb-4 p-4 rounded-xl border ${theme.cardBorder} ${theme.inputBg}`}>
          <p className={`text-sm font-medium ${theme.textMuted} mb-2`}>Transcript:</p>
          <p className={theme.text}>{transcript}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10`}>
          <p className={`text-sm text-red-400`}>{error}</p>
        </div>
      )}

      {/* Parse Button */}
      {transcript && !parsedData && (
        <button
          onClick={parseObservation}
          disabled={isProcessing}
          className={`w-full px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-4 ${
            isProcessing
              ? 'bg-slate-500 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:shadow-lg shadow-cyan-500/25'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              <span>Parse Observation</span>
            </>
          )}
        </button>
      )}

      {/* Parsed Data Form */}
      {parsedData && (
        <div className={`mb-4 p-4 rounded-xl border ${theme.cardBorder} ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-bold ${theme.text}`}>Parsed Data:</p>
            <button
              onClick={handleClear}
              className={`p-1 rounded-lg hover:bg-slate-500/10 ${theme.textMuted}`}
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-bold uppercase ${theme.textMuted} mb-1 block`}>Student Name</label>
              <input
                type="text"
                value={parsedData.studentName || ''}
                onChange={(e) => setParsedData({ ...parsedData, studentName: e.target.value })}
                className={`w-full ${theme.inputBg} p-2 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                placeholder="Student name"
              />
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase ${theme.textMuted} mb-1 block`}>Time</label>
              <input
                type="text"
                value={parsedData.time || ''}
                onChange={(e) => setParsedData({ ...parsedData, time: e.target.value })}
                className={`w-full ${theme.inputBg} p-2 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                placeholder="Time of incident"
              />
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase ${theme.textMuted} mb-1 block`}>Antecedent</label>
              <textarea
                value={parsedData.antecedent || ''}
                onChange={(e) => setParsedData({ ...parsedData, antecedent: e.target.value })}
                className={`w-full ${theme.inputBg} p-2 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                placeholder="What happened before"
                rows={2}
              />
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase ${theme.textMuted} mb-1 block`}>Behavior</label>
              <textarea
                value={parsedData.behavior || ''}
                onChange={(e) => setParsedData({ ...parsedData, behavior: e.target.value })}
                className={`w-full ${theme.inputBg} p-2 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                placeholder="The behavior observed"
                rows={2}
              />
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase ${theme.textMuted} mb-1 block`}>Consequence</label>
              <textarea
                value={parsedData.consequence || ''}
                onChange={(e) => setParsedData({ ...parsedData, consequence: e.target.value })}
                className={`w-full ${theme.inputBg} p-2 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                placeholder="What happened after"
                rows={2}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Send size={18} />
            <span>Submit Behavior Log</span>
          </button>
        </div>
      )}

      {/* Mobile Optimization Note */}
      <p className={`text-xs ${theme.textMuted} text-center mt-4`}>
        💡 Optimized for mobile devices. Works best with Chrome or Edge browsers.
      </p>
    </div>
  );
}

