import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { roleSidebarItems, type UserRole } from '@/config/roleConfig';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userRole: UserRole = user?.role?.name || "PROCUREMENT_OFFICER";
  const navItems = roleSidebarItems[userRole] || [];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#111827] border-r border-white/5 z-40 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm tracking-tight leading-none">VendorBridge</h1>
            <span className="text-[10px] text-[#64748B] font-medium tracking-wide">NEXUS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-[#4F46E5] rounded-lg"
                  style={{ boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] relative z-10" strokeWidth={isActive ? 2 : 1.5} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="bg-[#1B2240] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs text-[#94A3B8] font-medium">System Status</span>
          </div>
          <p className="text-xs text-[#64748B]">All systems operational</p>
        </div>
      </div>
    </aside>
  );
}
