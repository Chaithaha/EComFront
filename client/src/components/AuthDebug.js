import React from "react";
import { useAuth } from "../contexts/AuthContext";

const AuthDebug = () => {
  const { user, isAuthenticated, loading, error } = useAuth();

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "#f0f0f0",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <h4>Auth Debug:</h4>
      <div>
        <strong>Loading:</strong> {loading ? "Yes" : "No"}
      </div>
      <div>
        <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
      </div>
      <div>
        <strong>Error:</strong> {error || "None"}
      </div>
      {user && (
        <div>
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Full Name:</strong> {user.full_name}
          </div>
          <div>
            <strong>Role:</strong> {user.role}
          </div>
        </div>
      )}
      <div>
        <strong>Auth Method:</strong> Direct Supabase Authentication
      </div>
      <div>
        <strong>Session Management:</strong> Handled by Supabase SDK
      </div>
    </div>
  );
};

export default AuthDebug;
