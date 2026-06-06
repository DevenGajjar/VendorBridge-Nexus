import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

const breadcrumbMap: Record<string, string[]> = {
  '/': ['Dashboard'],
  '/vendors': ['Vendors', 'Vendor Management'],
  '/vendors/new': ['Vendors', 'New Vendor Onboarding'],
  '/rfq': ['Procurement', 'RFQ Management'],
  '/quotations': ['Procurement', 'Quotation Comparison'],
  '/approvals': ['Workflow', 'Approval Tracking'],
  '/orders': ['Orders', 'Purchase Orders'],
  '/invoices': ['Finance', 'Invoice Generation'],
  '/reports': ['Analytics', 'Reports & Insights'],
};

export function Header() {
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const breadcrumbs = breadcrumbMap[location.pathname] || ['Dashboard'];

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userName = user ? `${user.first_name} ${user.last_name}` : "Sarah Chen";
  const rawRole = user ? (user.role?.name || "ADMIN") : "ADMIN";
  
  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    PROCUREMENT_OFFICER: 'Procurement Officer',
    MANAGER: 'Manager',
    VENDOR: 'Vendor',
  };
  const userRole = roleLabels[rawRole] || rawRole;
  
  const userInitials = user ? `${user.first_name[0] || 'A'}${user.last_name[0] || 'D'}`.toUpperCase() : "SC";
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Notifications live state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function loadNotifications() {
    try {
      const res = await apiFetch("/notifications?page=1&page_size=20");
      if (res && res.success && res.data && res.data.items) {
        setNotifications(res.data.items);
      }
      const countRes = await apiFetch("/notifications/unread-count");
      if (countRes && countRes.success && countRes.data) {
        setUnreadCount(countRes.data.unread_count);
      }
    } catch (err) {
      console.error("Failed to load notifications: ", err);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch("/notifications/read-all", { method: 'POST' });
      if (res && res.success) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setToastMessage("All notifications marked as read!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Mark all read failed: ", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <header className="fixed top-0 right-0 left-[240px] h-16 bg-[#090C18]/80 backdrop-blur-xl border-b border-white/5 z-30 flex items-center justify-between px-6">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-[#64748B]">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-[#94A3B8]'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div
          className={`relative flex items-center bg-[#1B2240] rounded-lg border transition-all duration-200 ${
            searchFocused ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20 w-72' : 'border-transparent w-64'
          }`}
        >
          <Search className="w-4 h-4 text-[#64748B] ml-3" />
          <input
            type="text"
            placeholder="Search vendors, orders, RFQs..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-[#64748B] px-3 py-2 w-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-[#94A3B8]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4F46E5] rounded-full ring-2 ring-[#090C18]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 bg-[#111827] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    <span 
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#4F46E5] font-medium cursor-pointer hover:underline"
                    >
                      Mark all read
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#64748B]">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={async () => {
                            if (!notif.is_read) {
                              try {
                                await apiFetch(`/notifications/${notif.id}/read`, { method: 'POST' });
                                setNotifications((prev) =>
                                  prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                                );
                                setUnreadCount((c) => Math.max(0, c - 1));
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                            !notif.is_read ? 'bg-[#4F46E5]/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.is_read && <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-1.5 flex-shrink-0" />}
                            {notif.is_read && <div className="w-2 h-2 rounded-full bg-transparent mt-1.5 flex-shrink-0" />}
                            <div>
                              <p className="text-sm text-white leading-snug">{notif.title}</p>
                              <p className="text-xs text-[#94A3B8] mt-0.5">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-white/5 text-center">
                    <span 
                      onClick={() => {
                        loadNotifications();
                        setToastMessage("Notification list refreshed!");
                        setTimeout(() => setToastMessage(null), 2000);
                      }}
                      className="text-xs text-[#94A3B8] hover:text-white cursor-pointer transition-colors"
                    >
                      Refresh list
                    </span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 16, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="fixed top-0 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-xs px-4 py-2.5 rounded-lg shadow-lg z-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-4 border-l border-white/5 cursor-pointer hover:opacity-80 transition-all"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-white leading-none">{userName}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{userRole}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-sm font-semibold text-white">
              {userInitials}
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </div>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-48 bg-[#111827] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-[#64748B]">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user?.email || "admin@vendorbridge.com"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                  >
                    Logout / Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
