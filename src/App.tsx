/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import Candidates from './pages/Candidates';
import Admin from './pages/Admin';
import Analysis from './pages/Ranker';
import ResumeBuilder from './pages/ResumeBuilder';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'recruiter' }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  if (role && profile?.role !== role && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/jobs" element={
            <ProtectedRoute role="recruiter">
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/candidates" element={
            <ProtectedRoute role="recruiter">
              <Layout>
                <Candidates />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/ranker/:resumeId?" element={
            <ProtectedRoute role="recruiter">
              <Layout>
                <Analysis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/resume-builder" element={
            <ProtectedRoute role="recruiter">
              <Layout>
                <ResumeBuilder />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

