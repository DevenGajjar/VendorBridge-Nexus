import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  BarChart3,
  FileCode2,
  Settings,
  UserCheck,
  User,
} from 'lucide-react';

export type UserRole = 'ADMIN' | 'PROCUREMENT_OFFICER' | 'MANAGER' | 'VENDOR';

export interface NavItemConfig {
  icon: any;
  label: string;
  path: string;
}

export const roleDashboardTitles: Record<UserRole, string> = {
  ADMIN: 'System Overview Dashboard',
  PROCUREMENT_OFFICER: 'Procurement Pipeline Control',
  MANAGER: 'Pending Approvals & Decisions',
  VENDOR: 'Vendor Workspace Portal',
};

export const roleSidebarItems: Record<UserRole, NavItemConfig[]> = {
  ADMIN: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: UserCheck, label: 'Users', path: '/users' },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: FileText, label: 'RFQs', path: '/rfq' },
    { icon: ClipboardList, label: 'Quotations', path: '/quotations' },
    { icon: FileCode2, label: 'Approvals', path: '/approvals' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/orders' },
    { icon: CreditCard, label: 'Invoices', path: '/invoices' },
    { icon: BarChart3, label: 'Reports & Analytics', path: '/reports' },
    { icon: FileText, label: 'Audit Logs', path: '/audit-logs' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ],
  PROCUREMENT_OFFICER: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: FileText, label: 'RFQ Management', path: '/rfq' },
    { icon: ClipboardList, label: 'Quotations', path: '/quotations' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/orders' },
    { icon: CreditCard, label: 'Invoices', path: '/invoices' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ],
  MANAGER: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileCode2, label: 'Approvals', path: '/approvals' },
    { icon: ClipboardList, label: 'Quotations', path: '/quotations' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/orders' },
    { icon: CreditCard, label: 'Invoices', path: '/invoices' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ],
  VENDOR: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'My RFQs', path: '/rfq' },
    { icon: ClipboardList, label: 'My Quotations', path: '/quotations' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/orders' },
    { icon: CreditCard, label: 'Invoices', path: '/invoices' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
};

export const roleAllowedRoutes: Record<UserRole, string[]> = {
  ADMIN: [
    '/',
    '/users',
    '/vendors',
    '/vendors/new',
    '/rfq',
    '/quotations',
    '/approvals',
    '/orders',
    '/invoices',
    '/reports',
    '/audit-logs',
    '/settings',
  ],
  PROCUREMENT_OFFICER: [
    '/',
    '/vendors',
    '/vendors/new',
    '/rfq',
    '/quotations',
    '/orders',
    '/invoices',
    '/reports',
    '/settings',
  ],
  MANAGER: [
    '/',
    '/approvals',
    '/quotations',
    '/orders',
    '/invoices',
    '/reports',
    '/settings',
  ],
  VENDOR: [
    '/',
    '/rfq',
    '/quotations',
    '/orders',
    '/invoices',
    '/profile',
  ],
};

export const roleLandingPages: Record<UserRole, string> = {
  ADMIN: '/',
  PROCUREMENT_OFFICER: '/',
  MANAGER: '/',
  VENDOR: '/',
};
