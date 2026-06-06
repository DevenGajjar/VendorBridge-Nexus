import { motion } from 'framer-motion';
import { vendorHealthData } from '@/data/mockData';

export function VendorHealthWidget() {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-[#10B981]';
      case 'Good': return 'text-[#3B82F6]';
      case 'Fair': return 'text-[#F59E0B]';
      case 'At Risk': return 'text-[#EF4444]';
      default: return 'text-[#94A3B8]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-[#111827] border border-white/5 rounded-xl p-6"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Vendor Health</h3>
      <div className="space-y-4">
        {vendorHealthData.map((vendor, i) => (
          <motion.div
            key={vendor.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white font-medium">{vendor.name}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${getStatusVariant(vendor.status)}`}>
                  {vendor.status}
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">{vendor.score}</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#1B2240] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${vendor.score}%` }}
                transition={{ duration: 0.8, delay: 0.7 + i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: getScoreColor(vendor.score) }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
