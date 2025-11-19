import React, { useRef } from "react";

/**
 * ChatInterface Component
 * Displays the active chat with messages and input area
 *
 * Props:
 * - activeSession: Currently selected session object
 * - messages: Array of messages for the active session
 * - newMessage: Current message input value
 * - onMessageChange: Function to handle message input changes
 * - onKeyPress: Function to handle key press events
 * - onSendMessage: Function to send a new message
 * - isSendingMessage: Loading state for message sending
 * - wsConnectionStatus: WebSocket connection status
 * - wsConnectionError: WebSocket error state
 * - onRetryConnection: Function to retry WebSocket connection
 * - user: Current user object
 */
const ChatInterface = ({
  activeSession,
  messages,
  newMessage,
  onMessageChange,
  onKeyPress,
  onSendMessage,
  isSendingMessage,
  wsConnectionStatus,
  wsConnectionError,
  onRetryConnection,
  user,
}) => {
  console.log("ChatInterface received activeSession:", activeSession);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when active session changes
  React.useEffect(() => {
    if (activeSession && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSession]);

  // Render message bubble
  const renderMessage = (message) => {
    const isSent = message.sender_id === user?.id;
    const time = new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        key={message.id}
        className={`chat-message ${isSent ? "sent" : "received"}`}
      >
        <div className="chat-message-avatar">
          {isSent
            ? "You"
            : message.sender?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="chat-message-content">
          <div className="chat-message-bubble">{message.content}</div>
          <div className="chat-message-time">{time}</div>
        </div>
      </div>
    );
  };

  if (!activeSession) {
    console.log("No active session in ChatInterface, showing empty state");
    return (
      <div className="chat-interface">
        <div className="chat-empty-state">
          <div className="chat-empty-state-icon">💬</div>
          <h3>Demo Chat Mode</h3>
          <p>
            Chat functionality is in demo mode. No real sessions available yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {activeSession.product?.name?.charAt(0).toUpperCase() || "C"}
          </div>
          <div className="chat-header-title">
            {activeSession.product?.name || "Chat"}
          </div>
        </div>
        {/* WebSocket Connection Status */}
        <div
          className={`ws-connection-status ${wsConnectionError ? "error" : wsConnectionStatus === "OPEN" ? "connected" : "connecting"}`}
          onClick={wsConnectionError ? onRetryConnection : undefined}
          style={{ cursor: wsConnectionError ? "pointer" : "default" }}
        >
          <div className="ws-status-indicator"></div>
          <span className="ws-status-text">
            {wsConnectionError
              ? "Connection Error - Click to Retry"
              : wsConnectionStatus === "OPEN"
                ? "Connected"
                : wsConnectionStatus === "connecting"
                  ? "Connecting..."
                  : wsConnectionStatus}
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
            onChange={onMessageChange}
            onKeyPress={onKeyPress}
            rows={1}
          />
          <button
            className="chat-input-button"
            onClick={onSendMessage}
            disabled={!newMessage.trim() || isSendingMessage}
          >
            {isSendingMessage ? (
              <div className="chat-sending-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
