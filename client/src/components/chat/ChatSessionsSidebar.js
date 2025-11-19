import React from "react";

/**
 * ChatSessionsSidebar Component
 * Displays the list of chat sessions with search functionality
 *
 * Props:
 * - sessions: Array of chat sessions
 * - activeSession: Currently selected session
 * - onSessionSelect: Function to handle session selection
 * - searchTerm: Current search term
 * - onSearchChange: Function to handle search input changes
 * - onCreateNewSession: Function to create new session
 * - isCreatingSession: Loading state for session creation
 */
const ChatSessionsSidebar = ({
  sessions,
  activeSession,
  onSessionSelect,
  searchTerm,
  onSearchChange,
  onCreateNewSession,
  isCreatingSession,
}) => {
  return (
    <div className="chat-sessions-sidebar">
      <div className="chat-sessions-header">
        <h2>Chats</h2>
      </div>

      <div className="chat-sessions-search">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="chat-sessions-search-icon">🔍</div>
      </div>

      <div className="chat-sessions-list">
        {sessions.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-state-icon">💬</div>
            <h3>Demo Mode</h3>
            <p>
              Chat functionality is in demo mode. Authentication system not yet
              implemented.
            </p>
            <button
              className="chat-demo-button"
              onClick={onCreateNewSession}
              disabled={isCreatingSession}
            >
              {isCreatingSession ? "Creating..." : "Create Demo Chat"}
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`chat-session-item ${activeSession?.id === session.id ? "active" : ""}`}
              onClick={() => onSessionSelect(session)}
            >
              <div className="chat-session-avatar">
                {session.product?.name?.charAt(0).toUpperCase() || "C"}
              </div>
              <div className="chat-session-info">
                <div className="chat-session-title">
                  {session.product?.name || "Chat"}
                </div>
                <div className="chat-session-preview">
                  {session.messages?.[0]?.content || "No messages yet"}
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
  );
};

export default ChatSessionsSidebar;
