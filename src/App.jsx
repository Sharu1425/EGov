import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/user/Dashboard';
import PublicHub from './pages/user/PublicHub';
import AdminDashboard from './pages/admin/Dashboard';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/public-hub"
            element={
              <PrivateRoute>
                <PublicHub />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
