import { motion } from 'framer-motion';
import { FileText, MessageSquare, Clock, ShoppingCart, Receipt } from 'lucide-react';
import { pipelineData } from '@/data/mockData';

const stages = [
  { key: 'rfqCreated', label: 'RFQ Created', icon: FileText, color: '#4F46E5' },
  { key: 'quotationsReceived', label: 'Quotations Received', icon: MessageSquare, color: '#10B981' },
  { key: 'approvalPending', label: 'Approval Pending', icon: Clock, color: '#F59E0B' },
  { key: 'poGenerated', label: 'PO Generated', icon: ShoppingCart, color: '#3B82F6' },
  { key: 'invoiceGenerated', label: 'Invoice Generated', icon: Receipt, color: '#8B5CF6' },
];

export function ProcurementPipeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-[#111827] border border-white/5 rounded-xl p-6 mb-6"
    >
      <h3 className="text-sm font-semibold text-white mb-6">Procurement Pipeline</h3>
      <div className="flex items-center justify-between">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const count = pipelineData[stage.key as keyof typeof pipelineData];
          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300 }}
                  className="relative"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stage.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stage.color }} />
                  </div>
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: stage.color }}
                  >
                    {count}
                  </div>
                </motion.div>
                <p className="text-xs text-[#94A3B8] mt-3 text-center font-medium">{stage.label}</p>
              </div>
              {i < stages.length - 1 && (
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10 mx-2 mb-5" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
