import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, FileText, ClipboardList, ShoppingCart, 
  CreditCard, DollarSign, Activity, Clock, ShieldAlert, 
  CheckCircle2, XCircle, Award, ArrowUpRight, Shield, Zap, Settings
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { kpiData, pipelineData, vendorHealthData } from '@/data/mockData';
import { ProcurementPipeline } from '@/components/dashboard/ProcurementPipeline';
import { RecentPaymentsTable } from '@/components/dashboard/RecentPaymentsTable';
import { OrderTrackingWidget } from '@/components/dashboard/OrderTrackingWidget';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { VendorHealthWidget } from '@/components/dashboard/VendorHealthWidget';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { roleDashboardTitles, type UserRole } from '@/config/roleConfig';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<any>({
    active_vendors: 20,
    inactive_vendors: 5,
    total_rfqs: 15,
    pending_approvals: 6,
    total_purchase_orders: 16,
    total_invoices: 16,
    monthly_spend_formatted: '$5,839,890.95',
  });

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userRole: UserRole = user?.role?.name || "PROCUREMENT_OFFICER";

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await apiFetch("/analytics/dashboard");
        if (res && res.success && res.data) {
          const data = res.data;
          
          // Overwrite global mock reference properties
          kpiData.totalActiveVendors = data.active_vendors;
          kpiData.activeOrders = data.total_purchase_orders;
          kpiData.pendingRFQs = data.total_rfqs;
          kpiData.pendingApprovals = data.pending_approvals;
          kpiData.generatedInvoices = data.total_invoices;
          
          if (data.top_vendors && data.top_vendors.length > 0) {
            const sum = data.top_vendors.reduce((acc: number, curr: any) => acc + curr.vendor_rating, 0);
            kpiData.avgVendorRating = parseFloat((sum / data.top_vendors.length).toFixed(1));
            
            // Overwrite vendor health scores
            vendorHealthData.length = 0;
            data.top_vendors.forEach((v: any) => {
              vendorHealthData.push({
                name: v.vendor_name,
                score: Math.round(v.overall_score),
                status: v.recommendation
              });
            });
          }
          
          let formattedSpend = '$5,839,890.95';
          if (data.monthly_spend && data.monthly_spend.length > 0) {
            const latestSpend = data.monthly_spend[data.monthly_spend.length - 1].spend;
            kpiData.monthlySpend = latestSpend;
            formattedSpend = `$${latestSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }

          pipelineData.rfqCreated = data.total_rfqs;
          pipelineData.approvalPending = data.pending_approvals;
          pipelineData.poGenerated = data.total_purchase_orders;
          pipelineData.invoiceGenerated = data.total_invoices;

          setStats({
            active_vendors: data.active_vendors,
            inactive_vendors: data.inactive_vendors,
            total_rfqs: data.total_rfqs,
            pending_approvals: data.pending_approvals,
            total_purchase_orders: data.total_purchase_orders,
            total_invoices: data.total_invoices,
            monthly_spend_formatted: formattedSpend,
          });

          setLoaded(true);
        }
      } catch (err) {
        console.error("Dashboard analytics fetch failed: ", err);
      }
    }
    loadDashboard();
  }, []);

  // Define Cards per Role
  const renderCards = () => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card icon={UserCheck} title="Total Active Users" value="10" color="indigo" />
            <Card icon={Users} title="System Vendors" value={`${stats.active_vendors + stats.inactive_vendors}`} color="green" />
            <Card icon={FileText} title="Active RFQs" value={`${stats.total_rfqs}`} color="amber" />
            <Card icon={ShieldAlert} title="Pending Approvals" value={`${stats.pending_approvals}`} color="purple" />
            <Card icon={DollarSign} title="Total Monthly Spend" value={stats.monthly_spend_formatted} color="emerald" />
            <Card icon={CreditCard} title="Invoices Generated" value={`${stats.total_invoices}`} color="sky" />
          </div>
        );
      case 'PROCUREMENT_OFFICER':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card icon={FileText} title="Open RFQs" value={`${stats.total_rfqs}`} color="indigo" />
            <Card icon={ClipboardList} title="Received Quotations" value="30" color="amber" />
            <Card icon={ShieldAlert} title="Approval Queue" value={`${stats.pending_approvals}`} color="purple" />
            <Card icon={ShoppingCart} title="Generated POs" value={`${stats.total_purchase_orders}`} color="green" />
            <Card icon={CreditCard} title="Invoices Logged" value={`${stats.total_invoices}`} color="sky" />
            <Card icon={DollarSign} title="Spend Control Value" value={stats.monthly_spend_formatted} color="emerald" />
          </div>
        );
      case 'MANAGER':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card icon={ShieldAlert} title="Pending Approvals" value={`${stats.pending_approvals}`} color="purple" />
            <Card icon={CheckCircle2} title="Approved Requests" value="15" color="green" />
            <Card icon={XCircle} title="Rejected Requests" value="2" color="red" />
            <Card icon={Clock} title="Avg Approval Time" value="2.4 Days" color="indigo" />
            <Card icon={Activity} title="Approval Success Rate" value="100%" color="emerald" />
          </div>
        );
      case 'VENDOR':
        return (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card icon={FileText} title="Invited RFQs" value="5" color="indigo" />
            <Card icon={ClipboardList} title="Submitted Bids" value="3" color="amber" />
            <Card icon={CheckCircle2} title="Won Quotations" value="2" color="green" />
            <Card icon={ShoppingCart} title="Active Purchase Orders" value="2" color="emerald" />
            <Card icon={CreditCard} title="Unpaid Invoices" value="1" color="sky" />
            <Card icon={Award} title="Vendor Score" value="92 / 100" color="purple" />
          </div>
        );
    }
  };

  // Define Quick Actions per Role
  const renderQuickActions = () => {
    let actions: any[] = [];
    switch (userRole) {
      case 'ADMIN':
        actions = [
          { label: 'Manage Users', icon: UserCheck, path: '/users', color: '#4F46E5' },
          { label: 'Audit Log Ledger', icon: Shield, path: '/audit-logs', color: '#8B5CF6' },
          { label: 'System Configuration', icon: Settings, path: '/settings', color: '#64748B' },
        ];
        break;
      case 'PROCUREMENT_OFFICER':
        actions = [
          { label: 'Create RFQ', icon: FileText, path: '/rfq', color: '#4F46E5' },
          { label: 'Compare Quotations', icon: ClipboardList, path: '/quotations', color: '#8B5CF6' },
          { label: 'Order Processing', icon: ShoppingCart, path: '/orders', color: '#10B981' },
          { label: 'Log Invoice', icon: CreditCard, path: '/invoices', color: '#0EA5E9' },
        ];
        break;
      case 'MANAGER':
        actions = [
          { label: 'Approval Inbox', icon: ShieldAlert, path: '/approvals', color: '#8B5CF6' },
          { label: 'View Quotation Bids', icon: ClipboardList, path: '/quotations', color: '#F59E0B' },
          { label: 'Spend Analysis Reports', icon: Activity, path: '/reports', color: '#10B981' },
        ];
        break;
      case 'VENDOR':
        actions = [
          { label: 'My Quotations', icon: ClipboardList, path: '/quotations', color: '#F59E0B' },
          { label: 'Open RFQs', icon: FileText, path: '/rfq', color: '#4F46E5' },
          { label: 'Manage Profile', icon: UserCheck, path: '/profile', color: '#10B981' },
        ];
        break;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
          <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Action Hub
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {actions.map((act, i) => {
            const Icon = act.icon;
            return (
              <motion.button
                key={act.label}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(act.path)}
                className="flex items-center gap-3 p-4 bg-[#1B2240] rounded-xl hover:bg-[#1B2240]/80 transition-all text-left group"
              >
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${act.color}15` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: act.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-semibold group-hover:text-[#4F46E5] transition-colors truncate">{act.label}</p>
                  <span className="text-[10px] text-[#64748B] flex items-center gap-0.5 mt-0.5">
                    Navigate <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Define Layout per Role
  const renderDashboardLayout = () => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <>
            <ProcurementPipeline />
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 space-y-6">
                <RecentPaymentsTable />
              </div>
              <div className="col-span-4 space-y-6">
                <OrderTrackingWidget />
                <ActivityTimeline />
                <VendorHealthWidget />
              </div>
            </div>
          </>
        );
      case 'PROCUREMENT_OFFICER':
        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <ProcurementPipeline />
              <RecentPaymentsTable />
            </div>
            <div className="col-span-4 space-y-6">
              <OrderTrackingWidget />
              <VendorHealthWidget />
              <UpcomingDeadlines />
            </div>
          </div>
        );
      case 'MANAGER':
        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <RecentPaymentsTable />
            </div>
            <div className="col-span-4 space-y-6">
              <ActivityTimeline />
              <UpcomingDeadlines />
            </div>
          </div>
        );
      case 'VENDOR':
        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <RecentPaymentsTable />
            </div>
            <div className="col-span-4 space-y-6">
              <OrderTrackingWidget />
              <UpcomingDeadlines />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {roleDashboardTitles[userRole] || 'ERP Command Center'}
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          {userRole === 'VENDOR' 
            ? 'Access bid requests, check active purchase orders, and monitor your scorecards' 
            : 'Operational monitoring, analytical spent logs, and approval workflows'}
        </p>
      </div>

      {/* KPI Cards */}
      {renderCards()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Main Content Grid */}
      {renderDashboardLayout()}
    </div>
  );
}

// Sub-component for individual metric cards
interface CardProps {
  icon: any;
  title: string;
  value: string;
  color: 'indigo' | 'green' | 'amber' | 'purple' | 'emerald' | 'sky' | 'red';
}

function Card({ icon: Icon, title, value, color }: CardProps) {
  const colorsMap = {
    indigo: { text: 'text-[#4F46E5]', bg: 'bg-[#4F46E5]/10', border: 'hover:border-[#4F46E5]/30' },
    green: { text: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'hover:border-[#10B981]/30' },
    amber: { text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'hover:border-[#F59E0B]/30' },
    purple: { text: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10', border: 'hover:border-[#8B5CF6]/30' },
    emerald: { text: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'hover:border-[#10B981]/30' },
    sky: { text: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'hover:border-[#0EA5E9]/30' },
    red: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'hover:border-red-500/30' },
  };

  const selectedColor = colorsMap[color] || colorsMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#111827] border border-white/5 rounded-xl p-5 shadow-2xl transition-all duration-300 ${selectedColor.border} flex items-center justify-between group`}
    >
      <div className="min-w-0">
        <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-xl font-bold text-white font-mono truncate">
          {value}
        </h3>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedColor.bg}`}>
        <Icon className={`w-5 h-5 ${selectedColor.text}`} />
      </div>
    </motion.div>
  );
}
