import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Users, BarChart3 } from 'lucide-react';

const actions = [
  { label: 'Create RFQ', icon: Plus, path: '/rfq', color: '#4F46E5' },
  { label: 'New Vendor', icon: Users, path: '/vendors/new', color: '#10B981' },
  { label: 'View Reports', icon: BarChart3, path: '/reports', color: '#F59E0B' },
  { label: 'Quotations', icon: FileText, path: '/quotations', color: '#8B5CF6' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 bg-[#1B2240] rounded-xl hover:bg-[#1B2240]/80 transition-colors group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs text-[#94A3B8] group-hover:text-white transition-colors font-medium">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
