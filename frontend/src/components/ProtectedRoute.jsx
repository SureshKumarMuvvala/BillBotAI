import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, isLocalBypass } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (isLocalBypass || isAuthenticated) {
    return children;
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
}
