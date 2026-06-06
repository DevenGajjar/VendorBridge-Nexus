import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { API_BASE_URL } from '@/lib/api';

interface RoleOption {
  id: string;
  name: string;
  description: string;
}

export function AppLayout() {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  
  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Load roles for signup
  useEffect(() => {
    if (!token) {
      fetch(`${API_BASE_URL}/auth/roles`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data) {
            setRoles(resData.data);
            if (resData.data.length > 0) {
              setSelectedRoleId(resData.data[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Sync token from localStorage (useful for session expiry triggers)
  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Authentication failed");
      }

      const { access_token, refresh_token, user } = resData.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(user));
      
      setToken(access_token);
      setSuccessMsg("Logged in successfully!");
      // Force page reload to sync all components
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Pre-validate password rules (Phase 7 Security Rules)
    const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMsg("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setErrorMsg("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/\d/.test(password)) {
      setErrorMsg("Password must contain at least one digit.");
      return;
    }
    if (![...password].some((c) => specialChars.includes(c))) {
      setErrorMsg("Password must contain at least one special character.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          password,
          role_id: selectedRoleId,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Registration failed");
      }

      setSuccessMsg("Account registered successfully! Please log in.");
      setIsLoginTab(true);
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || "Could not register account");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#090C18] flex items-center justify-center relative overflow-hidden px-4">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#4F46E5]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7C3AED]/10 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111827]/80 backdrop-blur-2xl border border-white/5 p-8 rounded-2xl shadow-2xl relative z-10"
        >
          {/* Logo / Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#4F46E5] flex items-center justify-center mx-auto mb-3 shadow-glow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight leading-none">VendorBridge Nexus</h2>
            <p className="text-xs text-[#64748B] mt-1.5 uppercase tracking-wider font-semibold">Procurement & Vendor ERP Portal</p>
          </div>

          {/* Error and Success Alerts */}
          {errorMsg && (
            <div className="mb-4 bg-red-950/40 border border-red-500/20 text-red-200 text-xs px-4 py-2.5 rounded-lg">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 text-xs px-4 py-2.5 rounded-lg">
              {successMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-[#1B2240] p-1 rounded-lg mb-6">
            <button
              onClick={() => { setIsLoginTab(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                isLoginTab ? 'bg-[#4F46E5] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
                !isLoginTab ? 'bg-[#4F46E5] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms */}
          {isLoginTab ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@vendorbridge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>
              <div className="text-[10px] text-[#64748B] bg-[#1B2240]/40 p-2.5 rounded-lg">
                <strong>Demo Hint:</strong> Use <code className="text-white">admin@vendorbridge.com</code> with <code className="text-white">password123</code> to access the ERP dashboard.
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-lg shadow-glow hover:shadow-glow-lg transition-all"
              >
                {loading ? "Authenticating..." : "Sign In to Nexus"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Role Group</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id} className="bg-[#111827]">
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#64748B] outline-none transition-all"
                />
              </div>
              <div className="text-[10px] text-[#64748B] bg-[#1B2240]/40 p-2.5 rounded-lg leading-normal">
                <strong>Password Rules:</strong> Min 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character (e.g. <code className="text-white">SecurePass123!</code>).
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-lg shadow-glow transition-all"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090C18]">
      <Sidebar />
      <Header />
      <main className="ml-[240px] mt-16 min-h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="p-6"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
