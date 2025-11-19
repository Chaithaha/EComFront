import React, { useState, useEffect, useRef, useCallback } from "react";
import LoadingSpinner from "./common/LoadingSpinner";
import { chatService } from "../services/chatService";
import ChatSessionsSidebar from "./chat/ChatSessionsSidebar";
import ChatInterface from "./chat/ChatInterface";
import "./ChatPage.css";

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
  const [newMessage, setNewMessage] = useState("");
  // Typing indicators (not implemented in demo)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [wsConnectionError, setWsConnectionError] = useState(false);
  const [wsConnectionStatus, setWsConnectionStatus] = useState("connecting");

  // Get location state to check if we're coming from a product card
  const location = window.location;

  // Refs
  const messagesEndRef = useRef(null);
  // typingTimeoutRef not used in demo mode
  const wsRetryTimeoutRef = useRef(null);

  // Debug activeSession changes
  useEffect(() => {
    console.log("activeSession changed:", activeSession);
  }, [activeSession]);

  // Handle new message from subscription
  const handleNewMessage = useCallback(
    (payload) => {
      if (payload.eventType === "INSERT") {
        const newMessage = payload.new;
        setMessages((prev) => [...prev, newMessage]);

        // Update session last message
        if (activeSession && activeSession.id === newMessage.chat_session_id) {
          const updatedSessions = sessions.map((session) =>
            session.id === activeSession.id
              ? {
                  ...session,
                  last_message: newMessage.content,
                  updated_at: newMessage.created_at,
                }
              : session,
          );
          setSessions(updatedSessions);
        }

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    },
    [activeSession, sessions],
  );

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
      setUser({ id: "demo-user-id", name: "Demo User" });

      // Check if we're coming from a product card
      const state = location.state;
      if (state && state.productId) {
        // Create a new demo chat session for this product
        await handleCreateNewSession(
          state.productId,
          state.sellerId,
          state.productTitle,
          state.productPrice,
        );
      } else {
        // For now, show empty state since we don't have authentication
        // TODO: Implement proper authentication system
        setSessions([]);
        setActiveSession(null);
      }

      console.log("Chat initialized in demo mode (no authentication)");
    } catch (err) {
      console.error("Error initializing chat:", err);
      setError("Failed to initialize chat. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle session selection
  const handleSessionSelect = async (session) => {
    try {
      setActiveSession(session);
      console.log("Setting activeSession to:", session);
      setMessages([]);

      // For demo mode, show empty messages
      // TODO: Implement real message loading when authentication is added
      setMessages([]);

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      console.log("Demo session selected:", session);
    } catch (err) {
      console.error("Error selecting session:", err);
      setError("Failed to load session messages.");
    }
  };

  // Setup real-time subscription for session
  const setupSessionSubscription = useCallback(
    (sessionId) => {
      // Cleanup existing subscription
      cleanupSubscriptions();

      setWsConnectionStatus("connecting");
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
            if (
              status === "CLOSED" ||
              status === "TIMED_OUT" ||
              status === "ERROR"
            ) {
              setWsConnectionError(true);
              // Auto-retry connection after error
              setTimeout(() => {
                if (activeSession) {
                  setupSessionSubscription(activeSession.id);
                }
              }, 3000);
            } else if (status === "OPEN") {
              setWsConnectionError(false);
            }
          },
        );

        // Store cleanup functions
        window.chatCleanupFunctions = {
          message: messageCleanup,
        };
      } catch (err) {
        console.error("WebSocket connection error:", err);
        setWsConnectionError(true);
        setWsConnectionStatus("ERROR");
        setError(
          "Failed to establish real-time connection. Messages may not update in real-time.",
        );
        // Auto-retry connection after error
        setTimeout(() => {
          if (activeSession) {
            setupSessionSubscription(activeSession.id);
          }
        }, 3000);
      }
    },
    [activeSession, handleNewMessage],
  );

  // Retry WebSocket connection
  const retryWebSocketConnection = useCallback(() => {
    if (wsRetryTimeoutRef.current) {
      clearTimeout(wsRetryTimeoutRef.current);
    }

    // Set connecting status
    setWsConnectionStatus("connecting");
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
      setNewMessage("");

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
          avatar_url: null,
        },
      };

      // Add message to local state immediately for better UX
      setMessages((prev) => [...prev, mockMessage]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      console.log("Demo message sent:", messageContent);

      // Check if message is "hello" (case-insensitive) and send auto-response
      const lowerCaseMessage = messageContent.toLowerCase();
      if (lowerCaseMessage === "hello") {
        setTimeout(() => {
          const sellerResponse = {
            id: Date.now().toString(),
            content: "Hello, are you interested in buying this?",
            sender_id: "demo-seller",
            created_at: new Date().toISOString(),
            sender: {
              id: "demo-seller",
              username: "Demo Seller",
              full_name: "Demo Seller",
              avatar_url: null,
            },
          };
          
          setMessages((prev) => [...prev, sellerResponse]);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          
          console.log("Auto-response sent: Hello, are you interested in buying this?");
        }, 2000); // 2 second delay
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create new chat session (demo mode)
  const handleCreateNewSession = async (
    productId,
    sellerId,
    productTitle,
    productPrice,
  ) => {
    if (!user) return;

    setIsCreatingSession(true);
    try {
      // Create a mock session for demo
      const mockSession = {
        id: Date.now().toString(),
        product_id: productId || "demo-product",
        buyer_id: user.id,
        seller_id: sellerId || "demo-seller",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: {
          id: productId || "demo-product",
          name: productTitle || "Demo Product",
          image_url: null,
          price: productPrice || 99.99,
        },
        buyer: {
          id: user.id,
          username: user.name,
          full_name: user.name,
          avatar_url: null,
        },
        seller: {
          id: sellerId || "demo-seller",
          username: "Demo Seller",
          full_name: "Demo Seller",
          avatar_url: null,
        },
      };

      setSessions((prev) => [mockSession, ...prev]);
      console.log("Calling handleSessionSelect with:", mockSession);
      handleSessionSelect(mockSession);

      console.log("Demo session created:", mockSession);
      console.log("Current activeSession state:", activeSession);
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Failed to create new chat session.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Create new chat session without parameters (for demo button)
  const handleCreateNewSessionNoParams = async () => {
    if (!user) return;

    setIsCreatingSession(true);
    try {
      // Create a mock session for demo
      const mockSession = {
        id: Date.now().toString(),
        product_id: "demo-product",
        buyer_id: user.id,
        seller_id: "demo-seller",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: {
          id: "demo-product",
          name: "Demo Product",
          image_url: null,
          price: 99.99,
        },
        buyer: {
          id: user.id,
          username: user.name,
          full_name: user.name,
          avatar_url: null,
        },
        seller: {
          id: "demo-seller",
          username: "Demo Seller",
          full_name: "Demo Seller",
          avatar_url: null,
        },
      };

      setSessions((prev) => [mockSession, ...prev]);
      console.log("Calling handleSessionSelect with:", mockSession);
      handleSessionSelect(mockSession);

      console.log("Demo session created:", mockSession);
      console.log("Current activeSession state:", activeSession);
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Failed to create new chat session.");
    } finally {
      setIsCreatingSession(false);
    }
  };


  // Create a demo chat session with default values
  const createDemoChat = () => {
    console.log("createDemoChat called");
    handleCreateNewSessionNoParams();
  };

  // Filter sessions based on search
  const filteredSessions = sessions.filter(
    (session) =>
      session.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.buyer?.username
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      session.seller?.username
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

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
          <button className="chat-error-state-button" onClick={initializeChat}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page-with-header">
      <div className="chat-page">
        {/* Chat Sessions Sidebar - aligned with navbar */}
        <div className="chat-sessions-sidebar">
          <ChatSessionsSidebar
            sessions={filteredSessions}
            activeSession={activeSession}
            onSessionSelect={handleSessionSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onCreateNewSession={createDemoChat}
            isCreatingSession={isCreatingSession}
          />
        </div>

        {/* Chat Interface - fills remaining space */}
        <ChatInterface
          activeSession={activeSession}
          messages={messages}
          newMessage={newMessage}
          onMessageChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onSendMessage={handleSendMessage}
          isSendingMessage={isSendingMessage}
          wsConnectionStatus={wsConnectionStatus}
          wsConnectionError={wsConnectionError}
          onRetryConnection={retryWebSocketConnection}
          user={user}
        />
      </div>
    </div>
  );
};

export default ChatPage;
