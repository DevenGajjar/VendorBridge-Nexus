import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { orderTrackingData, kpiData } from '@/data/mockData';

export function OrderTrackingWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-[#111827] border border-white/5 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white">Track Orders</h3>
        <button className="text-xs text-[#4F46E5] hover:text-[#6366F1] font-medium transition-colors">
          View Report
        </button>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderTrackingData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {orderTrackingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white font-mono">{kpiData.activeOrders.toLocaleString()}</span>
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
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
    </motion.div>
  );
}
