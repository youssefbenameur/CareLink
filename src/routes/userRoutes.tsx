
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import UserProfile from '../pages/UserProfile';
import FindDoctor from '../pages/FindDoctor';
import FindDoctorPage from '../pages/FindDoctor';

const UserRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/find-doctor" 
        element={
          <ProtectedRoute>
            <FindDoctorPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default UserRoutes;
