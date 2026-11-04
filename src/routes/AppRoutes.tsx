import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { LoadingSpinner } from '../components/common/Card.js';

const MainLayout = React.lazy(() => import('../layouts/MainLayout.js').then(({ MainLayout }) => ({ default: MainLayout })));
const AuthLayout = React.lazy(() => import('../layouts/AuthLayout.js').then(({ AuthLayout }) => ({ default: AuthLayout })));

const LoginPage = React.lazy(() => import('../pages/auth/LoginPage.js').then(({ LoginPage }) => ({ default: LoginPage })));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage.js').then(({ RegisterPage }) => ({ default: RegisterPage })));
const DashboardPage = React.lazy(() => import('../pages/dashboard/DashboardPage.js').then(({ DashboardPage }) => ({ default: DashboardPage })));
const ProjectsPage = React.lazy(() => import('../pages/projects/ProjectsPage.js').then(({ ProjectsPage }) => ({ default: ProjectsPage })));
const ProjectDetailPage = React.lazy(() => import('../pages/projects/ProjectDetailPage.js').then(({ ProjectDetailPage }) => ({ default: ProjectDetailPage })));
const DatasetsPage = React.lazy(() => import('../pages/datasets/DatasetsPage.js').then(({ DatasetsPage }) => ({ default: DatasetsPage })));
const NormalizationPage = React.lazy(() => import('../pages/normalization/NormalizationPage.js').then(({ NormalizationPage }) => ({ default: NormalizationPage })));
const VersionsPage = React.lazy(() => import('../pages/versions/VersionsPage.js').then(({ VersionsPage }) => ({ default: VersionsPage })));
const ChatPage = React.lazy(() => import('../pages/chat/ChatPage.js').then(({ ChatPage }) => ({ default: ChatPage })));
const NotificationsPage = React.lazy(() => import('../pages/notifications/NotificationsPage.js').then(({ NotificationsPage }) => ({ default: NotificationsPage })));
const ProfilePage = React.lazy(() => import('../pages/profile/ProfilePage.js').then(({ ProfilePage }) => ({ default: ProfilePage })));
const SettingsPage = React.lazy(() => import('../pages/settings/SettingsPage.js').then(({ SettingsPage }) => ({ default: SettingsPage })));
const AdminPage = React.lazy(() => import('../pages/admin/AdminPage.js').then(({ AdminPage }) => ({ default: AdminPage })));

// Route Guard for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner text="Đang tải phiên làm việc DataHub..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Route Guard to redirect already logged in users away from login/register
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <LoadingSpinner text="Đang tải trang..." />
        </div>
      }
    >
      <Routes>
      {/* Auth Layout for Public Auth Pages */}
      <Route
        element={
          <PublicOnlyRoute>
            <AuthLayout />
          </PublicOnlyRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main Layout for Authenticated Pages */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/normalization" element={<NormalizationPage />} />
        <Route path="/versions" element={<VersionsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};
