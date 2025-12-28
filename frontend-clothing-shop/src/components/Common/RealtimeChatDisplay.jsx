import React, { useState, useEffect, useRef } from 'react';
import { chatRealtimeService } from '../../services/chatRealtimeService';
import { parseMarkdown } from '../../utils/chatParser';

/**
 * Realtime Chat Display Component
 * Displays chat histories with real-time updates from Supabase
 */
const RealtimeChatDisplay = ({ 
  sessionId = null, 
  height = '400px',
  showSessionSelector = true,
  autoScroll = true,
  className = ''
}) => {
  const [sessions, setSessions] = useState({});
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Initialize chat service
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load initial history
        const initialSessions = await chatRealtimeService.loadInitialHistory(100, sessionId);
        setSessions(initialSessions);

        // Set current session if not specified
        if (!currentSessionId && Object.keys(initialSessions).length > 0) {
          const latestSessionId = Object.values(initialSessions)
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))[0]?.sessionId;
          setCurrentSessionId(latestSessionId);
        }

        // Subscribe to realtime changes
        const success = await chatRealtimeService.subscribe(sessionId);
        setIsConnected(success);

        if (success) {
          // Register event handlers
          chatRealtimeService.on('onNewMessage', handleNewMessage);
          chatRealtimeService.on('onMessageUpdate', handleMessageUpdate);
          chatRealtimeService.on('onMessageDelete', handleMessageDelete);
          chatRealtimeService.on('onError', handleError);
        }

      } catch (err) {
        console.error('Failed to initialize chat:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      chatRealtimeService.off('onNewMessage', handleNewMessage);
      chatRealtimeService.off('onMessageUpdate', handleMessageUpdate);
      chatRealtimeService.off('onMessageDelete', handleMessageDelete);
      chatRealtimeService.off('onError', handleError);
      chatRealtimeService.unsubscribe();
    };
  }, [sessionId]);

  // Auto scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId]);

  // Event handlers
  const handleNewMessage = ({ allSessions }) => {
    setSessions(allSessions);
  };

  const handleMessageUpdate = ({ allSessions }) => {
    setSessions(allSessions);
  };

  const handleMessageDelete = ({ allSessions }) => {
    setSessions(allSessions);
  };

  const handleError = (error) => {
    console.error('Chat realtime error:', error);
    setError(error.message || 'Realtime connection error');
    setIsConnected(false);
  };

  // Get current session messages
  const currentMessages = currentSessionId && sessions[currentSessionId] 
    ? sessions[currentSessionId].messages 
    : [];

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render message content
  const renderMessageContent = (message) => {
    if (message.isUser) {
      return (
        <div className="text-gray-800">
          {message.content}
        </div>
      );
    } else {
      return (
        <div>
          <div 
            className="text-gray-800 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: parseMarkdown(message.content) 
            }}
          />
          {message.showMetadata && message.metadata && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <details>
                <summary className="cursor-pointer text-blue-600 font-medium">
                  Metadata
                </summary>
                <pre className="mt-1 text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(message.metadata, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Đang tải chat histories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Lỗi kết nối</div>
          <div className="text-sm text-gray-600">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white border rounded-lg shadow-sm ${className}`} style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-800">Chat Histories</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-gray-500">
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {showSessionSelector && Object.keys(sessions).length > 1 && (
          <select
            value={currentSessionId || ''}
            onChange={(e) => setCurrentSessionId(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            {Object.values(sessions)
              .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
              .map(session => (
                <option key={session.sessionId} value={session.sessionId}>
                  Session: {session.sessionId.substring(0, 8)}... ({session.messages.length} tin nhắn)
                </option>
              ))}
          </select>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {currentMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <div>Chưa có tin nhắn nào</div>
            {currentSessionId && (
              <div className="text-sm mt-1">Session: {currentSessionId}</div>
            )}
          </div>
        ) : (
          currentMessages.map((message, index) => (
            <div
              key={`${message.id}-${index}`}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {renderMessageContent(message)}
                <div className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
        {Object.keys(sessions).length} session(s) • {
          Object.values(sessions).reduce((total, session) => total + session.messages.length, 0)
        } tin nhắn • Real-time từ Supabase
      </div>
    </div>
  );
};

export default RealtimeChatDisplay;