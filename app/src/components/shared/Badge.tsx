import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

const variantStyles = {
  primary: 'bg-[#4F46E5]/20 text-[#4F46E5]',
  success: 'bg-[#10B981]/20 text-[#10B981]',
  warning: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  danger: 'bg-[#EF4444]/20 text-[#EF4444]',
  info: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  default: 'bg-white/10 text-[#94A3B8]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
