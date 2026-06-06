import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

const colors = {
  success: 'text-[#10B981]',
  error: 'text-[#EF4444]',
  info: 'text-[#3B82F6]',
  warning: 'text-[#F59E0B]',
};

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-20 right-6 z-[100] space-y-3 w-80">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-[#111827] border border-white/10 rounded-xl shadow-2xl p-4 flex items-start gap-3"
            >
              <Icon className={`w-5 h-5 mt-0.5 ${colors[toast.type]} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-[#94A3B8] mt-0.5">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => onRemove(toast.id)}
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <ToastTimer id={toast.id} onRemove={onRemove} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastTimer({ id, onRemove }: { id: string; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);
  return null;
}
