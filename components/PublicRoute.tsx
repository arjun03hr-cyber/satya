import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, supabaseReady } = useAuth();

  // If Supabase isn't configured, allow access (dev mode)
  if (!supabaseReady) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // If user is already authenticated, redirect them to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default PublicRoute;
