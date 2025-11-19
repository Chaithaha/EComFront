import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from './common/LoadingSpinner';
import { chatService } from '../services/chatService';
import './ChatPage.css';

/**
 * ChatPage Component
 * Provides a complete chat interface with sessions list and individual chat
 * Features real-time updates, error handling, and responsive design
 */
const ChatPage = ({ initialSession }) => {
  // State management
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  // Typing indicators (not implemented in demo)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [wsConnectionError, setWsConnectionError] = useState(false);
  const [wsConnectionStatus, setWsConnectionStatus] = useState('connecting');
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  // typingTimeoutRef not used in demo mode
  const wsRetryTimeoutRef = useRef(null);

  // Handle new message from subscription
  const handleNewMessage = useCallback((payload) => {
    if (payload.eventType === 'INSERT') {
      const newMessage = payload.new;
      setMessages(prev => [...prev, newMessage]);
      
      // Update session last message
      if (activeSession && activeSession.id === newMessage.chat_session_id) {
        const updatedSessions = sessions.map(session => 
          session.id === activeSession.id 
            ? { ...session, last_message: newMessage.content, updated_at: newMessage.created_at }
            : session
        );
        setSessions(updatedSessions);
      }
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [activeSession, sessions]);

  // Initialize component
  useEffect(() => {
    initializeChat();
    
    // Set initial session if provided
    if (initialSession) {
      setActiveSession(initialSession);
      setMessages([]);
    }
    
    // Cleanup on unmount
    return () => {
      cleanupSubscriptions();
    };
  }, [initialSession]);

  // Initialize chat functionality
  const initializeChat = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Set demo user for now (no authentication system yet)
      setUser({ id: 'demo-user-id', name: 'Demo User' });
      
      // For now, show empty state since we don't have authentication
      // TODO: Implement proper authentication system
      setSessions([]);
      setActiveSession(null);
      
      console.log('Chat initialized in demo mode (no authentication)');
    } catch (err) {
      console.error('Error initializing chat:', err);
      setError('Failed to initialize chat. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle session selection
  const handleSessionSelect = async (session) => {
    try {
      setActiveSession(session);
      setMessages([]);
      
      // For demo mode, show empty messages
      // TODO: Implement real message loading when authentication is added
      setMessages([]);
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
      
      console.log('Demo session selected:', session);
    } catch (err) {
      console.error('Error selecting session:', err);
      setError('Failed to load session messages.');
    }
  };

  // Setup real-time subscription for session
  const setupSessionSubscription = useCallback((sessionId) => {
    // Cleanup existing subscription
    cleanupSubscriptions();
    
    setWsConnectionStatus('connecting');
    setWsConnectionError(false);
    
    try {
        // Subscribe to new messages
        const messageCleanup = chatService.subscribeToChat(
          sessionId,
          (payload) => {
            handleNewMessage(payload);
          },
          (status) => {
          setWsConnectionStatus(status);
          if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'ERROR') {
            setWsConnectionError(true);
            // Auto-retry connection after error
            setTimeout(() => {
              if (activeSession) {
                setupSessionSubscription(activeSession.id);
              }
            }, 3000);
          } else if (status === 'OPEN') {
            setWsConnectionError(false);
          }
        }
      );
      
      // Store cleanup functions
      window.chatCleanupFunctions = {
        message: messageCleanup
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setWsConnectionError(true);
      setWsConnectionStatus('ERROR');
      setError('Failed to establish real-time connection. Messages may not update in real-time.');
      // Auto-retry connection after error
      setTimeout(() => {
        if (activeSession) {
          setupSessionSubscription(activeSession.id);
        }
      }, 3000);
    }
  }, [activeSession, handleNewMessage]);

  // Retry WebSocket connection
  const retryWebSocketConnection = useCallback(() => {
    if (wsRetryTimeoutRef.current) {
      clearTimeout(wsRetryTimeoutRef.current);
    }

    // Set connecting status
    setWsConnectionStatus('connecting');
    setWsConnectionError(null);

    // Retry after 3 seconds
    wsRetryTimeoutRef.current = setTimeout(() => {
      if (activeSession) {
        setupSessionSubscription(activeSession.id);
      }
    }, 3000);
  }, [activeSession, setupSessionSubscription]);

  // Cleanup subscriptions
  const cleanupSubscriptions = () => {
    if (window.chatCleanupFunctions) {
      window.chatCleanupFunctions.message?.();
      window.chatCleanupFunctions = null;
    }
    
    // Clear retry timeout
    if (wsRetryTimeoutRef.current) {
      clearTimeout(wsRetryTimeoutRef.current);
      wsRetryTimeoutRef.current = null;
    }
  };

  // (handled above via memoized handleNewMessage)

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSendingMessage) return;
    
    try {
      setIsSendingMessage(true);
      // Clear input and send
      const messageContent = newMessage.trim();
      setNewMessage('');
      
      // For demo mode, create a mock message
      const mockMessage = {
        id: Date.now().toString(),
        content: messageContent,
        sender_id: user.id,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          username: user.name,
          full_name: user.name,
          avatar_url: null
        }
      };
      
      // Add message to local state immediately for better UX
      setMessages(prev => [...prev, mockMessage]);
      scrollToBottom();
      
      console.log('Demo message sent:', messageContent);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      // Restore message content on error
      setNewMessage(newMessage); // Use original newMessage instead of undefined messageContent
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create new chat session (demo mode)
  const handleCreateNewSession = async (productId, sellerId) => {
    if (!user) return;
    
    setIsCreatingSession(true);
    try {
      // Create a mock session for demo
      const mockSession = {
        id: Date.now().toString(),
        product_id: productId || 'demo-product',
        buyer_id: user.id,
        seller_id: sellerId || 'demo-seller',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: {
          id: productId || 'demo-product',
          name: 'Demo Product',
          image_url: null,
          price: 99.99
        },
        buyer: {
          id: user.id,
          username: user.name,
          full_name: user.name,
          avatar_url: null
        },
        seller: {
          id: sellerId || 'demo-seller',
          username: 'Demo Seller',
          full_name: 'Demo Seller',
          avatar_url: null
        }
      };
      
      setSessions(prev => [mockSession, ...prev]);
      handleSessionSelect(mockSession);
      
      console.log('Demo session created:', mockSession);
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create new chat session.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Filter sessions based on search
  const filteredSessions = sessions.filter(session =>
    session.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.buyer?.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (session.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when active session changes
  useEffect(() => {
    if (activeSession && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSession]);

  // Render message bubble
  const renderMessage = (message) => {
    const isSent = message.sender_id === user?.id;
    const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div key={message.id} className={`chat-message ${isSent ? 'sent' : 'received'}`}>
        <div className="chat-message-avatar">
          {isSent ? 'You' : (message.sender?.username?.charAt(0).toUpperCase() || 'U')}
        </div>
        <div className="chat-message-content">
          <div className="chat-message-bubble">
            {message.content}
          </div>
          <div className="chat-message-time">
            {time}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-loading">
          <LoadingSpinner />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-page">
        <div className="chat-error-state">
          <div className="chat-error-state-icon">⚠️</div>
          <h3>Chat Error</h3>
          <p>{error}</p>
          <button 
            className="chat-error-state-button"
            onClick={initializeChat}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Chat Sessions Sidebar */}
      <div className="chat-sessions-sidebar">
        <div className="chat-sessions-header">
          <h2>Chats</h2>
        </div>
        
        <div className="chat-sessions-search">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="chat-sessions-search-icon">🔍</div>
        </div>
        
        <div className="chat-sessions-list">
          {filteredSessions.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-state-icon">💬</div>
              <h3>Demo Mode</h3>
              <p>Chat functionality is in demo mode. Authentication system not yet implemented.</p>
              <button 
                className="chat-demo-button"
                onClick={() => handleCreateNewSession()}
                disabled={isCreatingSession}
              >
                {isCreatingSession ? 'Creating...' : 'Create Demo Chat'}
              </button>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                className={`chat-session-item ${activeSession?.id === session.id ? 'active' : ''}`}
                onClick={() => handleSessionSelect(session)}
              >
                <div className="chat-session-avatar">
                  {session.product?.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="chat-session-info">
                  <div className="chat-session-title">
                    {session.product?.name || 'Chat'}
                  </div>
                  <div className="chat-session-preview">
                    {session.messages?.[0]?.content || 'No messages yet'}
                  </div>
                </div>
                <div className="chat-session-meta">
                  <div className="chat-session-time">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="chat-interface">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {activeSession.product?.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="chat-header-title">
                  {activeSession.product?.name || 'Chat'}
                </div>
                <div className="chat-header-subtitle">
                  with {activeSession.seller?.username || 'Seller'}
                </div>
              </div>
              {/* WebSocket Connection Status */}
              <div
                className={`ws-connection-status ${wsConnectionError ? 'error' : wsConnectionStatus === 'OPEN' ? 'connected' : 'connecting'}`}
                onClick={wsConnectionError ? retryWebSocketConnection : undefined}
                style={{ cursor: wsConnectionError ? 'pointer' : 'default' }}
              >
                <div className="ws-status-indicator"></div>
                <span className="ws-status-text">
                  {wsConnectionError ? 'Connection Error - Click to Retry' :
                   wsConnectionStatus === 'OPEN' ? 'Connected' :
                   wsConnectionStatus === 'connecting' ? 'Connecting...' :
                   wsConnectionStatus}
                </span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="chat-messages-container">
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <div className="chat-empty-state-icon">💬</div>
                    <h3>No Messages Yet</h3>
                    <p>Start the conversation by sending a message</p>
                  </div>
                ) : (
                  messages.map(renderMessage)
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  rows={1}
                />
                <button
                  className="chat-input-button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                >
                  {isSendingMessage ? (
                    <div className="chat-sending-spinner">
                      <div className="spinner"></div>
                    </div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-empty-state">
            <div className="chat-empty-state-icon">💬</div>
            <h3>Demo Chat Mode</h3>
            <p>Chat functionality is in demo mode. No real sessions available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;