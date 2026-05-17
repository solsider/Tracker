import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useDrawerStore } from './store/drawer.store';
import { Layout } from './components/layout/Layout';
import { IssueDrawer } from './components/issue-detail/IssueDrawer';
import { authApi } from './api/auth.api';
import { useSocket } from './hooks/useSocket';
import { ToastNotifications } from './components/realtime/ToastNotifications';
import { ReconnectingBanner } from './components/realtime/ReconnectingBanner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// ── Eagerly loaded (auth critical path) ──────────────────────────────────────
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// ── Lazily loaded (split per route) ──────────────────────────────────────────
const ProjectsPage        = lazy(() => import('./pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage   = lazy(() => import('./pages/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })));
const KanbanPage          = lazy(() => import('./pages/projects/KanbanPage').then((m) => ({ default: m.KanbanPage })));
const IssuesPage          = lazy(() => import('./pages/issues/IssuesPage').then((m) => ({ default: m.IssuesPage })));
const BacklogPage         = lazy(() => import('./pages/backlog/BacklogPage').then((m) => ({ default: m.BacklogPage })));
// Heavy pages — loaded on demand
const GanttPage           = lazy(() => import('./pages/projects/GanttPage').then((m) => ({ default: m.GanttPage })));
const VelocityPage        = lazy(() => import('./pages/projects/VelocityPage').then((m) => ({ default: m.VelocityPage })));
const AnalyticsPage       = lazy(() => import('./pages/projects/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ProjectDashboardPage = lazy(() => import('./pages/projects/ProjectDashboardPage').then((m) => ({ default: m.ProjectDashboardPage })));
const CalendarPage        = lazy(() => import('./pages/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const DashboardPage       = lazy(() => import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProfilePage         = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));

// ── Route skeleton fallback ───────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-dash-border/60 rounded-lg" />
      <div className="h-4 w-72 bg-dash-border/40 rounded" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-dash-border/50 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-dash-border/40 rounded-xl mt-4" />
    </div>
  );
}

function useTokenValidation() {
  const { isAuthenticated, clearAuth, setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    authApi
      .me()
      .then((user) => setAuth(user))
      .catch(() => {
        clearAuth();
        navigate('/login', { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function IssueUrlSync() {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { open, isOpen, issueNumber } = useDrawerStore();

  useEffect(() => {
    const issueParam = searchParams.get('issue');
    if (issueParam && projectId) {
      const num = parseInt(issueParam, 10);
      if (!isNaN(num) && (!isOpen || issueNumber !== num)) {
        open(projectId, num);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function AppRoutes() {
  useTokenValidation();
  useSocket();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
            <Route path="projects/:id" element={<ErrorBoundary><IssueUrlSync /><ProjectDetailPage /></ErrorBoundary>} />
            <Route path="projects/:id/issues" element={<ErrorBoundary><IssueUrlSync /><IssuesPage /></ErrorBoundary>} />
            <Route path="projects/:id/board" element={<ErrorBoundary><IssueUrlSync /><KanbanPage /></ErrorBoundary>} />
            <Route path="projects/:id/backlog" element={<ErrorBoundary><IssueUrlSync /><BacklogPage /></ErrorBoundary>} />
            <Route path="projects/:id/gantt" element={<ErrorBoundary><IssueUrlSync /><GanttPage /></ErrorBoundary>} />
            <Route path="projects/:id/velocity" element={<ErrorBoundary><VelocityPage /></ErrorBoundary>} />
            <Route path="projects/:id/analytics" element={<ErrorBoundary><IssueUrlSync /><AnalyticsPage /></ErrorBoundary>} />
            <Route path="projects/:id/dashboard" element={<ErrorBoundary><IssueUrlSync /><ProjectDashboardPage /></ErrorBoundary>} />
            <Route path="projects/:id/calendar" element={<ErrorBoundary><IssueUrlSync /><CalendarPage /></ErrorBoundary>} />
            <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      <AppRoutes />
      <IssueDrawer />
      <ToastNotifications />
      <ReconnectingBanner />
    </>
  );
}
