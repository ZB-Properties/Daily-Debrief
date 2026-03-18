import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';


const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  console.log('🔐 PrivateRoute - user:', !!user, 'loading:', loading);
  
  if (loading) {
    console.log('⏳ PrivateRoute - Loading...');
    return <LoadingSpinner fullScreen text="Authenticating..." />;
  }
  
  if (!user) {
    console.log('🔐 PrivateRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('🔐 PrivateRoute - User authenticated, rendering outlet');
  return <Outlet />;
};

export default PrivateRoute;