import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { TenantProvider, useTenant } from './tenants/TenantContext';
import AuthPage from './auth/AuthPage';
import CreateTenant from './tenants/CreateTenant';
import DashboardLayout from './layouts/DashboardLayout';
import CrmDashboard from './crm/CrmDashboard';
import LeadPipelines from './crm/LeadPipelines';
import IntegrationsDashboard from './integrations/IntegrationsDashboard';
import InboxDashboard from './inbox/InboxDashboard';
import SocialEngagement from './inbox/SocialEngagement';
import MediaLibrary from './media/MediaLibrary';
import PublishingDashboard from './publishing/PublishingDashboard';
import AutomationDashboard from './automation/AutomationDashboard';
import WorkflowBuilder from './automation/WorkflowBuilder';
import CampaignDashboard from './campaigns/CampaignDashboard';
import CreateCampaign from './campaigns/CreateCampaign';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import AdsDashboard from './advertising/AdsDashboard';
import OAuthCallback from './integrations/OAuthCallback';
import PlatformSurfaces from './platform/PlatformSurfaces';
import GoogleSuiteDashboard from './integrations/GoogleSuiteDashboard';

/**
 * Dashboard home — shows real metrics from the analytics API.
 * Metrics are rendered by AnalyticsDashboard which owns that data-fetching logic.
 */
const DashboardHome = () => {
  return <AnalyticsDashboard />;
};

/**
 * Guards authenticated routes. Redirects to /login if no session.
 * If logged in but has no tenant, redirects to /create-workspace.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const { tenants, loading } = useTenant();

  if (!session) return <Navigate to="/login" replace />;
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading workspace...</div>;
  if (!loading && tenants.length === 0) return <Navigate to="/create-workspace" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage initialMode="signup" />} />
            <Route path="/integrations/callback" element={<OAuthCallback />} />

            {/* Workspace creation — authenticated but no tenant required */}
            <Route path="/create-workspace" element={
              (() => { const { session } = useAuth(); return session ? <CreateTenant /> : <Navigate to="/login" replace />; })()
            } />

            {/* Protected app routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout><DashboardHome /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/crm" element={
              <ProtectedRoute>
                <DashboardLayout><CrmDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/crm/pipelines" element={
              <ProtectedRoute>
                <DashboardLayout><LeadPipelines /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/inbox" element={
              <ProtectedRoute>
                <DashboardLayout><InboxDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/inbox/social" element={<ProtectedRoute><DashboardLayout><SocialEngagement /></DashboardLayout></ProtectedRoute>} />
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <DashboardLayout><CampaignDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/campaigns/new" element={
              <ProtectedRoute>
                <DashboardLayout><CreateCampaign /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/publishing" element={
              <ProtectedRoute>
                <DashboardLayout><PublishingDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/media" element={
              <ProtectedRoute>
                <DashboardLayout><MediaLibrary /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/automation" element={
              <ProtectedRoute>
                <DashboardLayout><AutomationDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/automation/builder" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div className="h-[calc(100vh-120px)] rounded-lg overflow-hidden border shadow-sm">
                    <WorkflowBuilder />
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <DashboardLayout><AnalyticsDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/advertising" element={
              <ProtectedRoute>
                <DashboardLayout><AdsDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/integrations" element={
              <ProtectedRoute>
                <DashboardLayout><IntegrationsDashboard /></DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/google" element={<ProtectedRoute><DashboardLayout><GoogleSuiteDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><DashboardLayout><PlatformSurfaces initialTab="settings" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><PlatformSurfaces initialTab="notifications" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><DashboardLayout><PlatformSurfaces initialTab="reports" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute><DashboardLayout><PlatformSurfaces initialTab="audit" /></DashboardLayout></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><DashboardLayout><PlatformSurfaces initialTab="billing" /></DashboardLayout></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
