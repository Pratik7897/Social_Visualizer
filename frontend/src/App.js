import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import Sidebar from './components/layout/Sidebar';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import FriendsPage from './pages/FriendsPage';
import ProfilePage from './pages/ProfilePage';
import DSVizPage from './pages/DSVizPage';
import './styles/global.css';

function PrivateLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
            <Route path="/search" element={<PrivateLayout><SearchPage /></PrivateLayout>} />
            <Route path="/friends" element={<PrivateLayout><FriendsPage /></PrivateLayout>} />
            <Route path="/profile/:id" element={<PrivateLayout><ProfilePage /></PrivateLayout>} />
            <Route path="/ds-viz" element={<PrivateLayout><DSVizPage /></PrivateLayout>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
