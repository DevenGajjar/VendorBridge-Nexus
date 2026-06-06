import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import VendorManagement from './pages/VendorManagement';
import VendorWizard from './pages/VendorWizard';
import RFQManagement from './pages/RFQManagement';
import QuotationComparison from './pages/QuotationComparison';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import PurchaseOrders from './pages/PurchaseOrders';
import InvoiceGeneration from './pages/InvoiceGeneration';
import ReportsAnalytics from './pages/ReportsAnalytics';
import UsersList from './pages/UsersList';
import AuditLogs from './pages/AuditLogs';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import Unauthorized from './pages/Unauthorized';
import { roleAllowedRoutes, type UserRole } from './config/roleConfig';

function RouteGuard() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userRole: UserRole = user?.role?.name || "PROCUREMENT_OFFICER";
  const allowed = roleAllowedRoutes[userRole] || [];

  const path = location.pathname;
  const isAllowed = allowed.includes(path) || (path.startsWith('/vendors/new') && allowed.includes('/vendors/new'));

  if (!isAllowed) {
    return <Unauthorized />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route element={<AppLayout />}>
          {/* Apply Route Guarding middleware wrapper */}
          <Route element={<RouteGuard />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendors" element={<VendorManagement />} />
            <Route path="/vendors/new" element={<VendorWizard />} />
            <Route path="/rfq" element={<RFQManagement />} />
            <Route path="/quotations" element={<QuotationComparison />} />
            <Route path="/approvals" element={<ApprovalWorkflow />} />
            <Route path="/orders" element={<PurchaseOrders />} />
            <Route path="/invoices" element={<InvoiceGeneration />} />
            <Route path="/reports" element={<ReportsAnalytics />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
