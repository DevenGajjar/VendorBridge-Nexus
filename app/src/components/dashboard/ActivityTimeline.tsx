import { motion } from 'framer-motion';
import { FileText, MessageSquare, CheckCircle, Receipt, UserPlus, CreditCard } from 'lucide-react';
import { recentActivity } from '@/data/mockData';

const iconMap: Record<string, React.ElementType> = {
  rfq: FileText,
  quote: MessageSquare,
  approval: CheckCircle,
  invoice: Receipt,
  vendor: UserPlus,
  payment: CreditCard,
};

const colorMap: Record<string, string> = {
  rfq: '#4F46E5',
  quote: '#10B981',
  approval: '#3B82F6',
  invoice: '#8B5CF6',
  vendor: '#F59E0B',
  payment: '#10B981',
};

export function ActivityTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-[#111827] border border-white/5 rounded-xl p-6"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {recentActivity.map((activity, i) => {
          const Icon = iconMap[activity.type] || FileText;
          const color = colorMap[activity.type] || '#4F46E5';
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-start gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-snug">{activity.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#94A3B8]">{activity.user}</span>
                  <span className="text-[#64748B]">·</span>
                  <span className="text-xs text-[#64748B]">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
