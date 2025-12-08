// Built-in Accommodation Gem - Professional AI Assistant
// Replaces external Gemini Gem link with integrated functionality
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Mic, Camera, X, Sparkles, FileText, Image as ImageIcon, 
  Loader2, Send, Trash2, Wand2, FileUp, Volume2, VolumeX, Plus, 
  MessageSquare, User, Clock, ExternalLink
} from 'lucide-react';
import { GeminiService, getTheme } from './utils';
import { ChatHistoryService } from './chatHistory';

export default function AccommodationGem({ isDark, user, onBack, isEmbedded = false, onFirstUse = null }) {
  const theme = getTheme(isDark);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistories, setChatHistories] = useState([]);
  const [deletedChats, setDeletedChats] = useState([]);
  const [showRecovery, setShowRecovery] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load Google Drive Picker API
  useEffect(() => {
    const loadGoogleDrivePicker = () => {
      if (window.gapi && window.gapi.load) {
        window.gapi.load('picker', () => {
          setGapiLoaded(true);
        });
      } else {
        // Wait for script to load from index.html
        const checkGapi = setInterval(() => {
          if (window.gapi && window.gapi.load) {
            clearInterval(checkGapi);
            window.gapi.load('picker', () => {
              setGapiLoaded(true);
            });
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkGapi);
          if (!gapiLoaded) {
            console.warn('Google Picker API failed to load');
          }
        }, 5000);
      }
    };
    
    // Small delay to ensure script is loaded
    setTimeout(loadGoogleDrivePicker, 500);
  }, []);

  // Load chat histories on mount
  useEffect(() => {
    const histories = ChatHistoryService.getAll();
    setChatHistories(histories);
    const deleted = ChatHistoryService.getDeletedChats();
    setDeletedChats(deleted);
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      // Generate chat ID from profile or use generic one
      let chatId = currentChatId;
      if (!chatId) {
        if (studentProfile) {
          chatId = ChatHistoryService.generateChatId(studentProfile);
        } else {
          chatId = ChatHistoryService.generateChatId('accommodation-chat-' + Date.now());
        }
      }
      setCurrentChatId(chatId);
      
      ChatHistoryService.save(chatId, studentProfile || 'Accommodation Chat', messages);
      // Refresh histories
      setChatHistories(ChatHistoryService.getAll());
    }
  }, [messages, studentProfile]);

  // Load a chat history
  const loadChat = (chatId) => {
    const chat = ChatHistoryService.get(chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setStudentProfile(chat.profile);
      setMessages(chat.messages || []);
      setIsFirstMessage(false); // Hide welcome for returning profiles
      // Update last accessed
      ChatHistoryService.save(chat.id, chat.profile, chat.messages || []);
      setChatHistories(ChatHistoryService.getAll());
    }
  };

  // Create new chat
  const createNewChat = () => {
    setCurrentChatId(null);
    setStudentProfile(null);
    setMessages([]);
    setIsFirstMessage(true);
  };

  // Delete a chat
  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    if (confirm('Delete this chat history?')) {
      ChatHistoryService.delete(chatId);
      setChatHistories(ChatHistoryService.getAll());
      setDeletedChats(ChatHistoryService.getDeletedChats());
      if (currentChatId === chatId) {
        createNewChat();
      }
    }
  };

  // Recover a deleted chat
  const recoverChat = (chatId, e) => {
    e.stopPropagation();
    if (ChatHistoryService.recover(chatId)) {
      setChatHistories(ChatHistoryService.getAll());
      setDeletedChats(ChatHistoryService.getDeletedChats());
      // Load the recovered chat
      loadChat(chatId);
    }
  };

  // Get profile summary for display
  const getProfileSummary = (profile) => {
    if (!profile) return 'New Chat';
    
    if (typeof profile === 'string') {
      // Try to extract key info from profile text
      const gradeMatch = profile.match(/(\d+)(?:st|nd|rd|th)?\s*grade/i);
      const challengeMatch = profile.match(/(dyslexia|adhd|autism|dysgraphia|processing)/i);
      const grade = gradeMatch ? gradeMatch[0] : '';
      const challenge = challengeMatch ? challengeMatch[0] : '';
      if (grade && challenge) {
        return `${grade} - ${challenge}`;
      }
      if (profile.length > 30) {
        return profile.substring(0, 30) + '...';
      }
      return profile;
    }
    return 'Accommodation Chat';
  };

  // Initialize speech recognition
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      alert('Speech recognition error. Please try again.');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e, type = 'document') => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      // For images, we'll extract text or describe the image
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target.result;
        setUploadedFiles(prev => [...prev, {
          id: Date.now(),
          name: file.name,
          type: 'image',
          data: imageData,
          file: file
        }]);
        
        // Auto-add message about the image - this will be sent to the multimodal API
        const imageMessage = `I've uploaded an image: ${file.name}. Please analyze this and provide accommodations.`;
        setInput(prev => prev + (prev ? ' ' : '') + imageMessage);
      };
      reader.readAsDataURL(file);
    } else {
      // For documents, handle PDF, Word docs (.doc, .docx), and text files
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isWordDoc = file.type === 'application/msword' || 
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       file.name.toLowerCase().endsWith('.doc') || 
                       file.name.toLowerCase().endsWith('.docx');
      const isGoogleDoc = file.type === 'application/vnd.google-apps.document';
      
      if (isPdf) {
        // PDF handling - extract text from PDF
        const extractPDFText = async () => {
          try {
            // Try to use pdfjs-dist if available
            let pdfjsLib;
            try {
              const pdfjsModule = await import('pdfjs-dist');
              pdfjsLib = pdfjsModule.default || pdfjsModule;
            } catch (importError) {
              // If import fails, try to use from window (if loaded via CDN)
              pdfjsLib = window.pdfjsLib;
            }
            
            if (pdfjsLib) {
              // Set worker source - use CDN for better compatibility
              if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
              }
              
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullText = '';
              
              // Extract text from all pages (limit to first 20 pages for better coverage)
              const maxPages = Math.min(pdf.numPages, 20);
              for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
              }
              
              if (pdf.numPages > 20) {
                fullText += `\n[Note: Document has ${pdf.numPages} pages, showing first 20 pages]`;
              }
              
              // Store PDF with extracted content - this will be sent to the API
              const pdfContent = fullText.trim();
              setUploadedFiles(prev => [...prev, {
                id: Date.now(),
                name: file.name,
                type: 'pdf',
                file: file,
                content: pdfContent // Full extracted text - will be sent to API
              }]);
              setInput(prev => prev + (prev ? ' ' : '') + `I've uploaded a PDF document: ${file.name}. Please analyze this document and provide accommodations.`);
            } else {
              throw new Error('PDF library not available');
            }
          } catch (error) {
            console.warn('PDF text extraction failed, storing file for analysis:', error);
            // Fallback: store file without extracted text - AI will still analyze it
            setUploadedFiles(prev => [...prev, {
              id: Date.now(),
              name: file.name,
              type: 'pdf',
              file: file
            }]);
            setInput(prev => prev + (prev ? ' ' : '') + `I've uploaded a PDF document: ${file.name}. Please analyze this and provide accommodations.`);
          }
        };
        
        extractPDFText();
      } else if (isWordDoc || isGoogleDoc) {
        // Word document handling - attempt to read as text (may need server-side processing for full support)
        const reader = new FileReader();
        reader.onload = (event) => {
          // For .doc/.docx, the text extraction may be limited in browser
          // Store the file for potential server-side processing
          setUploadedFiles(prev => [...prev, {
            id: Date.now(),
            name: file.name,
            type: 'word',
            file: file,
            content: event.target.result || 'Word document uploaded - content extraction may require server processing'
          }]);
          setInput(prev => prev + (prev ? ' ' : '') + `I've uploaded a Word document: ${file.name}. Please analyze this and provide accommodations.`);
        };
        reader.onerror = () => {
          // If text reading fails, still store the file
          setUploadedFiles(prev => [...prev, {
            id: Date.now(),
            name: file.name,
            type: 'word',
            file: file
          }]);
          setInput(prev => prev + (prev ? ' ' : '') + `I've uploaded a Word document: ${file.name}. Please analyze this and provide accommodations.`);
        };
        // Try to read as text (works for some Word docs, may need server processing for full support)
        reader.readAsText(file);
      } else {
        // Text files and other documents
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          setUploadedFiles(prev => [...prev, {
            id: Date.now(),
            name: file.name,
            type: 'text',
            content: text
          }]);
          setInput(prev => prev + (prev ? ' ' : '') + `I've uploaded a document: ${file.name}. Content: ${text.substring(0, 500)}...`);
        };
        reader.readAsText(file);
      }
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    // Track first use if callback provided (for IP tracking)
    if (onFirstUse && messages.length === 0) {
      onFirstUse();
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      files: [...uploadedFiles]
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentFiles = [...uploadedFiles];
    setInput('');
    setUploadedFiles([]);
    setLoading(true);

    try {
      // Check if this is a document upload request (PDF, image, etc.) - these should be analyzed, not treated as profile
      const hasFileUpload = currentFiles.length > 0;
      const isFileAnalysisRequest = hasFileUpload || 
        currentInput.toLowerCase().includes('uploaded') || 
        currentInput.toLowerCase().includes('analyze') ||
        currentInput.toLowerCase().includes('document') ||
        currentInput.toLowerCase().includes('pdf');
      
      // Check if this looks like profile information (first message or contains profile keywords)
      // BUT exclude file upload requests from being treated as profile info
      const profileKeywords = ['grade', 'reading level', 'dyslexia', 'adhd', 'iep', '504', 'challenge', 'age', 'autism', 'dysgraphia', 'processing speed'];
      const isProfileInfo = !isFileAnalysisRequest && (isFirstMessage || profileKeywords.some(keyword => 
        currentInput.toLowerCase().includes(keyword)
      ));

      // Store profile information if detected (will be updated after AI response if AI extracts it)
      // But NOT if this is a file upload/analysis request
      if (isProfileInfo && isFirstMessage && !studentProfile && !isFileAnalysisRequest) {
        setStudentProfile(currentInput);
        setIsFirstMessage(false);
      }

      // Build prompt with full context including conversation history
      // CRITICAL: Set isFirstMessage to false when user sends a message to prevent welcome message loops
      const wasFirstMessage = isFirstMessage;
      if (isFirstMessage) {
        setIsFirstMessage(false);
      }

      let promptData = {
        message: currentInput,
        prompt: currentInput,
        files: currentFiles,
        studentProfile: studentProfile,
        isFirstMessage: false, // Always false when user sends a message - prevents welcome loops
        conversationHistory: messages, // Pass existing conversation history so AI knows what was said before
        isFileAnalysisRequest: isFileAnalysisRequest // Flag to indicate this is a document analysis request
      };

      // Generate accommodation response using the full Gem prompt
      const response = await GeminiService.generate(promptData, 'accommodation');

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to generate accommodations. Please try again.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Export to Google Docs using clipboard and direct link
  const handleExportToGoogleDocs = async () => {
    // Get the last AI message (accommodations)
    const lastAIMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
    if (!lastAIMessage || !lastAIMessage.content) {
      alert('No accommodations to export. Please generate accommodations first.');
      return;
    }

    try {
      // Copy content to clipboard
      const content = lastAIMessage.content;
      await navigator.clipboard.writeText(content);
      
      // Open Google Docs in a new tab
      const googleDocsUrl = 'https://docs.google.com/document/create';
      const docsWindow = window.open(googleDocsUrl, '_blank');
      
      // Show instructions
      setTimeout(() => {
        alert('Content copied to clipboard!\n\n1. Google Docs has been opened in a new tab\n2. Paste the content (Ctrl+V or Cmd+V) into the new document\n3. The accommodations are ready to use!');
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      // Fallback: just open Google Docs
      window.open('https://docs.google.com/document/create', '_blank');
      alert('Please copy the accommodations text above and paste it into the new Google Doc.');
    }
  };

  // Import from Google Drive using Picker API
  const handleImportFromGoogleDrive = async () => {
    try {
      if (!gapiLoaded || !window.gapi || !window.google) {
        // Fallback: open Google Drive and provide instructions
        const driveUrl = 'https://drive.google.com/drive/my-drive';
        window.open(driveUrl, '_blank');
        alert('To import from Google Drive:\n\n1. In the Google Drive window, find your file\n2. Right-click the file → Download\n3. Come back here and use the Upload Document button (📄) to upload the downloaded file\n\nAlternatively, you can drag and drop the downloaded file directly into this chat area.');
        return;
      }

      // Create and show a picker dialog for Google Drive
      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .addView(window.google.picker.ViewId.DOCUMENTS)
        .addView(window.google.picker.ViewId.PRESENTATIONS)
        .addView(window.google.picker.ViewId.SPREADSHEETS)
        .addView(window.google.picker.ViewId.PDFS)
        .setCallback((data) => {
          if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
            const file = data[window.google.picker.Response.DOCUMENTS][0];
            const fileId = file.id;
            const fileName = file.name;
            
            // Download file from Google Drive
            if (fileId) {
              // Determine file type and export URL
              let exportUrl;
              if (file.mimeType && file.mimeType.includes('document')) {
                exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
              } else if (file.mimeType && file.mimeType.includes('spreadsheet')) {
                exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=pdf`;
              } else if (file.mimeType && file.mimeType.includes('presentation')) {
                exportUrl = `https://docs.google.com/presentation/d/${fileId}/export?format=pdf`;
              } else {
                // For PDFs and other files, try direct download
                exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
              }
              
              // Try to fetch the file
              fetch(exportUrl)
                .then(response => {
                  if (!response.ok) throw new Error('Download failed');
                  return response.blob();
                })
                .then(blob => {
                  const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'pdf';
                  const mimeType = blob.type || 'application/pdf';
                  const file = new File([blob], fileName || `drive-file.${fileExtension}`, { type: mimeType });
                  const fakeEvent = { target: { files: [file] } };
                  handleFileUpload(fakeEvent, 'document');
                })
                .catch(error => {
                  console.error('Error downloading from Drive:', error);
                  // Fallback: open the file in a new tab and let user download manually
                  window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
                  alert('Please download the file from Google Drive and upload it here using the Upload Document button.');
                });
            }
          }
        })
        .build();
      
      picker.setVisible(true);
    } catch (error) {
      console.error('Google Drive Picker error:', error);
      // Fallback to manual method
      const driveUrl = 'https://drive.google.com/drive/my-drive';
      window.open(driveUrl, '_blank');
      alert('Please download the file from Google Drive and upload it here using the Upload Document button.');
    }
  };

  return (
    <div className={`${isEmbedded ? '' : 'min-h-screen'} ${theme.bg} ${theme.text} font-sans flex`}>
      {/* Chat History Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} ${isEmbedded ? 'hidden' : ''} transition-all duration-300 overflow-hidden border-r ${theme.cardBorder} ${theme.cardBg} flex flex-col`}>
        <div className={`p-4 border-b ${theme.cardBorder} flex items-center justify-between`}>
          <h3 className={`font-bold ${theme.text} flex items-center gap-2`}>
            <MessageSquare size={18} className="text-cyan-400" />
            Chat History
          </h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`${theme.textMuted} hover:${theme.text}`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={createNewChat}
            className={`w-full mb-2 px-3 py-2 rounded-lg border ${theme.cardBorder} ${theme.inputBg} hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all flex items-center gap-2 text-sm font-medium ${theme.text}`}
          >
            <Plus size={16} className="text-cyan-400" />
            New Chat
          </button>
          {chatHistories.map((chat) => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`mb-2 p-3 rounded-lg border cursor-pointer transition-all ${
                currentChatId === chat.id
                  ? `${isDark ? 'bg-cyan-900/30' : 'bg-cyan-100'} border-cyan-500/50`
                  : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-500/30`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${theme.text} text-sm mb-1 truncate`}>
                    {getProfileSummary(chat.profile)}
                  </div>
                  <div className={`text-xs ${theme.textMuted} flex items-center gap-1`}>
                    <Clock size={12} />
                    {new Date(chat.lastAccessed).toLocaleDateString()}
                  </div>
                  {chat.messages && chat.messages.length > 0 && (
                    <div className={`text-xs ${theme.textMuted} mt-1`}>
                      {chat.messages.length} messages
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className={`${theme.textMuted} hover:text-red-400 transition-colors`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {chatHistories.length === 0 && deletedChats.length === 0 && (
            <div className={`text-center py-8 ${theme.textMuted} text-sm`}>
              <User size={32} className="mx-auto mb-2 opacity-50" />
              <p>No profiles yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          )}
          
          {/* Recovery Section */}
          {deletedChats.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${theme.cardBorder}`}>
              <button
                onClick={() => setShowRecovery(!showRecovery)}
                className={`w-full mb-2 px-3 py-2 rounded-lg border ${theme.cardBorder} ${theme.inputBg} hover:bg-amber-500/10 hover:border-amber-500/50 transition-all flex items-center gap-2 text-sm font-medium ${theme.text}`}
              >
                <Trash2 size={16} className="text-amber-400" />
                Deleted ({deletedChats.length})
              </button>
              {showRecovery && deletedChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`mb-2 p-3 rounded-lg border ${theme.cardBorder} ${theme.cardBg} opacity-75`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${theme.text} text-sm mb-1 truncate`}>
                        {getProfileSummary(chat.profile)}
                      </div>
                      <div className={`text-xs ${theme.textMuted} flex items-center gap-1`}>
                        <Clock size={12} />
                        Deleted {new Date(chat.deletedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => recoverChat(chat.id, e)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} transition-colors`}
                      title="Recover this chat"
                    >
                      Recover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - only show if not embedded */}
        {!isEmbedded && (
          <header className={`sticky top-0 z-50 border-b ${theme.cardBorder} ${theme.navBg} backdrop-blur-md`}>
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className={`p-2 rounded-lg ${theme.textMuted} hover:${theme.text}`}
                  >
                    <MessageSquare size={20} />
                  </button>
                )}
                <Sparkles className="text-cyan-400" size={24} />
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">
                  Accessible Learning Companion
                </span>
              </div>
              {onBack && (
                <button 
                  onClick={onBack}
                  className={`px-4 py-2 rounded-full border ${theme.cardBorder} ${theme.textMuted} hover:${theme.text} transition-colors text-sm font-bold`}
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </header>
        )}

        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Welcome Section - Show welcome message on first load */}
        {messages.length === 0 && isFirstMessage && (
          <div className="text-center mb-8 animate-in fade-in">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 mb-6">
              <Sparkles className="text-cyan-400" size={48} />
            </div>
            <h1 className={`text-4xl font-bold ${theme.text} mb-4`}>
              Welcome to your Accessible Learning Companion!
            </h1>
            <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 max-w-3xl mx-auto text-left mb-8`}>
              <p className={`${theme.text} mb-6 leading-relaxed`}>
                I am here to take the stress out of adapting curriculum for your learner. To give you the best support, I need to understand your child's unique learning profile.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className={`font-bold ${theme.text} mb-2`}>Option A: Paste an IEP/504 Summary</h3>
                  <p className={`${theme.textMuted} text-sm`}>
                    You can paste the "Accommodations" or "Present Levels" section of their IEP here.
                  </p>
                  <p className={`${theme.textMuted} text-xs italic mt-1`}>
                    (Privacy Tip: Please remove the child's real name and address before pasting! You can refer to them as "The Student" or use a nickname.)
                  </p>
                </div>
                <div>
                  <h3 className={`font-bold ${theme.text} mb-2`}>Option B: Tell me about them manually</h3>
                  <p className={`${theme.textMuted} text-sm mb-2`}>If you don't have paperwork handy, just tell me:</p>
                  <ul className={`${theme.textMuted} text-sm list-disc list-inside space-y-1 ml-4`}>
                    <li><strong>Current Grade/Age:</strong> (e.g., "3rd grade, 8 years old")</li>
                    <li><strong>Actual Reading Level:</strong> (e.g., "Reads at a 2nd-grade level")</li>
                    <li><strong>Specific Challenges:</strong> (e.g., Dyslexia, ADHD, poor working memory, gets overwhelmed by text walls)</li>
                    <li><strong>What helps them?</strong> (e.g., Bullet points, bold text, definitions provided first)</li>
                  </ul>
                </div>
              </div>
              <p className={`${theme.text} mt-6 font-medium`}>
                Once you provide this, I will lock it in and adapt all future requests to fit these needs!
              </p>
            </div>
          </div>
        )}

        {/* Export/Import Buttons - Show when there are AI messages */}
        {messages.some(msg => msg.role === 'assistant') && (
          <div className="mb-4 flex justify-end gap-2">
            <button
              onClick={handleImportFromGoogleDrive}
              className={`px-4 py-2 rounded-lg border ${theme.cardBorder} ${isDark ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-green-50 text-green-700 hover:bg-green-100'} transition-colors flex items-center gap-2 text-sm font-medium`}
              title="Import from Google Drive"
            >
              <FileUp size={16} />
              Import from Drive
            </button>
            <button
              onClick={handleExportToGoogleDocs}
              className={`px-4 py-2 rounded-lg border ${theme.cardBorder} ${isDark ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} transition-colors flex items-center gap-2 text-sm font-medium`}
              title="Export to Google Docs"
            >
              <ExternalLink size={16} />
              Export to Docs
            </button>
          </div>
        )}

        {/* Messages */}
        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto`}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <FileText className={`${theme.textMuted} mb-4`} size={64} />
              <p className={theme.textMuted}>Start a conversation to get accommodations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? `${isDark ? 'bg-cyan-900/30' : 'bg-cyan-100'} ${isDark ? 'text-cyan-100' : 'text-cyan-900'}`
                        : `${theme.cardBg} ${theme.text} border ${theme.cardBorder}`
                    }`}
                  >
                    {msg.files && msg.files.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {msg.files.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 text-xs opacity-75">
                            {file.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-4 flex items-center gap-2`}>
                    <Loader2 className="animate-spin text-cyan-400" size={20} />
                    <span className={theme.textMuted}>Generating accommodations...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 mb-4 flex flex-wrap gap-2`}>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'} border ${theme.cardBorder}`}
              >
                {file.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                <span className="text-sm">{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-4`}>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg border ${theme.cardBorder} ${theme.textMuted} hover:${theme.text} transition-colors`}
              title="Upload Document"
            >
              <FileUp size={20} />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className={`p-2 rounded-lg border ${theme.cardBorder} ${theme.textMuted} hover:${theme.text} transition-colors`}
              title="Upload Photo"
            >
              <Camera size={20} />
            </button>
            <button
              onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
              className={`p-2 rounded-lg border ${theme.cardBorder} ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/50' : `${theme.textMuted} hover:${theme.text}`} transition-colors`}
              title="Speech to Text"
            >
              {isRecording ? <VolumeX size={20} /> : <Mic size={20} />}
            </button>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Describe the student's challenge or ask for accommodations..."
              className={`flex-1 ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
            />
            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && uploadedFiles.length === 0)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-cyan-500/25 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.google-apps.document"
          onChange={(e) => handleFileUpload(e, 'document')}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileUpload(e, 'image')}
          className="hidden"
        />
      </main>
      </div>
    </div>
  );
}

