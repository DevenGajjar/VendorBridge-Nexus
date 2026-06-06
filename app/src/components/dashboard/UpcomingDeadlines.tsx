import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { upcomingDeadlines } from '@/data/mockData';

export function UpcomingDeadlines() {
  const getDaysLeft = (dateStr: string) => {
    const today = new Date('2026-06-06');
    const deadline = new Date(dateStr);
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 1) return '#EF4444';
    if (days <= 3) return '#F59E0B';
    return '#10B981';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-[#111827] border border-white/5 rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#F59E0B]" />
        <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
      </div>
      <div className="space-y-3">
        {upcomingDeadlines.map((deadline, i) => {
          const daysLeft = getDaysLeft(deadline.date);
          const color = getUrgencyColor(daysLeft);
          return (
            <motion.div
              key={deadline.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className="flex items-center justify-between p-3 bg-[#1B2240] rounded-lg hover:bg-[#1B2240]/80 transition-colors cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{deadline.title}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">{deadline.vendor}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="text-[10px] text-[#94A3B8]">{deadline.date}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {daysLeft}d
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
