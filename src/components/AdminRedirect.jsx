import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AdminRedirect = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      const userProfile = localStorage.getItem('userProfile');
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
      
      console.log('🔍 AdminRedirect Debug:', {
        token: token ? 'Present' : 'Missing',
        isLoggedIn,
        userProfile: userProfile ? 'Present' : 'Missing',
        timestamp: new Date().toISOString()
      });
      
      // User is considered authenticated if they have token and user profile
      // We don't need to check isLoggedIn flag as it's redundant with token presence
      const authenticated = !!(token && userProfile);
      
      console.log('🔐 Authentication Status:', authenticated ? 'Authenticated' : 'Not Authenticated');
      
      // If we have a token but no userProfile, try to restore from sessionStorage
      if (token && !userProfile) {
        const sessionProfile = sessionStorage.getItem('userProfile');
        if (sessionProfile) {
          localStorage.setItem('userProfile', sessionProfile);
          localStorage.setItem('isAdminLoggedIn', 'true');
          console.log('🔄 Restored user profile from sessionStorage');
        }
      }
      
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f3efe6] to-[#f3efe6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2a4d32] mx-auto mb-4"></div>
          <p className="text-[#2a4d32]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    console.log('🚀 Redirecting to: /admin/events');
    return <Navigate to="/admin/events" replace />;
  } else {
    console.log('🚀 Redirecting to: /admin/login');
    return <Navigate to="/admin/login" replace />;
  }
};

export default AdminRedirect;
