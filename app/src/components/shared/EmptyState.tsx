import { motion } from 'framer-motion';
import { Package, Users, FileText, Receipt, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'vendors' | 'rfq' | 'quotations' | 'invoices' | 'analytics';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const config = {
  vendors: {
    icon: Users,
    defaultTitle: 'No Vendors Yet',
    defaultDescription: 'Get started by adding your first vendor to the system.',
    defaultAction: 'Add Vendor',
  },
  rfq: {
    icon: FileText,
    defaultTitle: 'No RFQs Created',
    defaultDescription: 'Create your first Request for Quotation to start the procurement process.',
    defaultAction: 'Create RFQ',
  },
  quotations: {
    icon: Receipt,
    defaultTitle: 'No Quotations Received',
    defaultDescription: 'Quotations will appear here once vendors respond to your RFQs.',
    defaultAction: 'View RFQs',
  },
  invoices: {
    icon: Package,
    defaultTitle: 'No Invoices Generated',
    defaultDescription: 'Invoices will be generated automatically after PO approval.',
    defaultAction: 'View Orders',
  },
  analytics: {
    icon: BarChart3,
    defaultTitle: 'No Data Available',
    defaultDescription: 'Analytics will appear once you have procurement activity.',
    defaultAction: 'Create RFQ',
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { icon: Icon, defaultTitle, defaultDescription, defaultAction } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#1B2240] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#4F46E5]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title || defaultTitle}</h3>
      <p className="text-sm text-[#94A3B8] text-center max-w-sm mb-6">
        {description || defaultDescription}
      </p>
      {onAction && (
        <Button
          onClick={onAction}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-glow-sm hover:shadow-glow transition-all duration-200"
        >
          {actionLabel || defaultAction}
        </Button>
      )}
    </motion.div>
  );
}
