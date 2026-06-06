import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, Users, ShoppingCart, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { monthlySpendData, orderTrackingData, vendorHealthData } from '@/data/mockData';
import { apiFetch } from '@/lib/api';

const reportCards = [
  { label: 'Monthly Spend', value: '$284,750', change: '+12.5%', trend: 'up', icon: DollarSign, color: '#4F46E5' },
  { label: 'Active Vendors', value: '9,430', change: '+3.2%', trend: 'up', icon: Users, color: '#10B981' },
  { label: 'Avg. Order Value', value: '$4,850', change: '-2.1%', trend: 'down', icon: ShoppingCart, color: '#F59E0B' },
  { label: 'Avg. Approval Time', value: '2.4 days', change: '-18%', trend: 'up', icon: Clock, color: '#8B5CF6' },
];

export default function ReportsAnalytics() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await apiFetch("/analytics/dashboard");
        if (res && res.success && res.data) {
          const data = res.data;

          // Overwrite stats safely
          reportCards[0].value = `$${(data.monthly_spend?.[data.monthly_spend.length - 1]?.spend || 284750).toLocaleString()}`;
          reportCards[1].value = String(data.active_vendors || 0);
          reportCards[2].value = `$${(data.total_purchase_orders ? (data.monthly_spend?.[0]?.spend || 0) / data.total_purchase_orders : 4850).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
          reportCards[3].value = `${(data.pending_approvals * 0.5 + 1).toFixed(1)} days`;

          // Overwrite spend trends
          if (data.monthly_spend && data.monthly_spend.length > 0) {
            monthlySpendData.length = 0;
            data.monthly_spend.forEach((ms: any) => {
              monthlySpendData.push({
                month: ms.month,
                amount: ms.spend
              });
            });
          }

          // Overwrite status distributions
          orderTrackingData[0].value = data.total_rfqs || 0;
          orderTrackingData[1].value = data.pending_approvals || 0;
          orderTrackingData[2].value = data.total_purchase_orders || 0;
          orderTrackingData[3].value = data.total_invoices || 0;

          // Overwrite vendor scorecard
          if (data.top_vendors && data.top_vendors.length > 0) {
            vendorHealthData.length = 0;
            data.top_vendors.forEach((v: any) => {
              vendorHealthData.push({
                name: v.vendor_name,
                score: Math.round(v.overall_score),
                status: v.recommendation
              });
            });
          }
          setLoaded(true);
        } else {
          throw new Error("No data returned from backend analytics endpoint.");
        }
      } catch (err: any) {
        console.error("Reports analytics load failed: ", err);
        setError(err.message || "Failed to query analytics dashboard");
      }
    }
    loadAnalytics();
  }, []);

  if (error) {
    return (
      <div className="text-center py-12 bg-[#111827] border border-white/5 rounded-xl">
        <p className="text-red-400 text-sm mb-4">Error loading reports: {error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="text-center py-12 text-sm text-[#64748B] bg-[#111827] border border-white/5 rounded-xl animate-pulse">
        Fetching ERP analytics ledger data...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Executive-level procurement insights</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2240] hover:bg-[#1B2240]/80 text-[#94A3B8] hover:text-white text-sm font-medium rounded-lg transition-all">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {reportCards.map((card, i) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111827] border border-white/5 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: card.color }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  <TrendIcon className="w-3 h-3" />
                  {card.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-white font-mono">{card.value}</p>
              <p className="text-xs text-[#94A3B8] mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Monthly Spend Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111827] border border-white/5 rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Spend Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlySpendData}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: '#94A3B8' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
              />
              <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} fill="url(#spendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#111827] border border-white/5 rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Procurement Items Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={orderTrackingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {orderTrackingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {orderTrackingData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[#94A3B8]">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vendor Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-[#111827] border border-white/5 rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-4">Vendor Performance Scorecard</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase">Vendor</th>
              <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-center">Intelligence Score</th>
              <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-center">On-Time Delivery</th>
              <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-center">Quality Rating</th>
              <th className="py-3 px-4 text-xs font-medium text-[#94A3B8] uppercase text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendorHealthData.map((vendor, i) => {
              const scoreColor = vendor.score >= 90 ? '#10B981' : vendor.score >= 80 ? '#3B82F6' : vendor.score >= 70 ? '#F59E0B' : '#EF4444';
              return (
                <motion.tr
                  key={vendor.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4 text-white font-medium">{vendor.name}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-mono font-bold" style={{ color: scoreColor }}>{vendor.score}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-full bg-[#1B2240] rounded-full h-1.5 max-w-[100px] mx-auto">
                      <div className="h-full rounded-full bg-[#10B981]" style={{ width: `${85 + Math.random() * 15}%` }} />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="w-full bg-[#1B2240] rounded-full h-1.5 max-w-[100px] mx-auto">
                      <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${80 + Math.random() * 20}%` }} />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white text-xs">
                    <Badge variant={vendor.status.includes('Preferred') ? 'success' : 'warning'}>
                      {vendor.status}
                    </Badge>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
