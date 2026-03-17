import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');
  const userProfile = localStorage.getItem('userProfile');
  const isAuthenticated = !!(userId && userProfile);
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 