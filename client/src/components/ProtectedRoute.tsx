import { ReactNode, useEffect } from 'react';
// Import wouter from our compatibility layer using ESM syntax
import { useLocation } from "../wouter-compat.js";
import { useAuth } from '../lib/auth-context.js';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If user is not yet checked, verify authentication
    if (!isAuthenticated && !loading) {
      // Try to refresh authentication status
      const verifyAuth = async () => {
        const isAuthed = await checkAuth();
        
        // If still not authenticated after checking, redirect to login
        if (!isAuthed) {
          // Redirect to login with the current path as the 'from' parameter
          setLocation(`/login?from=${encodeURIComponent(location)}`);
        }
      };
      
      verifyAuth();
    }
  }, [isAuthenticated, loading, location, checkAuth, setLocation]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the protected content
  return isAuthenticated ? <>{children}</> : null;
}
