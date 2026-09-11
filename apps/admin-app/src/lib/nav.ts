import {
  LayoutDashboard,
  Package,
  PackageSearch,
  ShoppingCart,
  Users,
  UserCog,
  FileBarChart,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Truck,
  Lock,
  Folder,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  // Scope required to see this item. SUPER/ADMIN always pass.
  scope?: string;
  superOnly?: boolean;
}

// Top-level sidebar entries, grouped so the rail stays uncramped.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, group: 'Main' },
  { label: 'Products', href: '/dashboard/products', icon: Package, group: 'Manage', scope: 'products' },
  { label: 'Categories', href: '/dashboard/categories', icon: Folder, group: 'Manage', scope: 'products' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: PackageSearch, group: 'Manage', scope: 'inventory' },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, group: 'Manage', scope: 'orders' },
  { label: 'Customers', href: '/dashboard/customers', icon: Users, group: 'Manage', scope: 'customers' },
  { label: 'Attendants', href: '/dashboard/attendants', icon: UserCog, group: 'Manage', scope: 'attendants' },
  { label: 'Admins', href: '/dashboard/admins', icon: Shield, group: 'Manage', superOnly: true },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard, group: 'Manage', scope: 'payments' },
  { label: 'Delivery Fees', href: '/dashboard/delivery-fees', icon: Truck, group: 'Manage', scope: 'delivery_fees' },
  { label: 'Access Control', href: '/dashboard/access-control', icon: Lock, group: 'Manage', superOnly: true },
  { label: 'Reports', href: '/dashboard/reports', icon: FileBarChart, group: 'Insights', scope: 'reports' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, group: 'Insights', scope: 'notifications' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'System' },
];

export const NAV_GROUPS = ['Main', 'Manage', 'Insights', 'System'];

// Resolve a human page title / breadcrumb from a pathname.
export function titleFromPath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '');
  const exact = NAV_ITEMS.find((i) => i.href === clean);
  if (exact) return exact.label === 'Overview' ? 'Dashboard Overview' : exact.label;
  const seg = clean.split('/').filter(Boolean).pop() || 'dashboard';
  return seg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function breadcrumbFromPath(pathname: string): string[] {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  // Drop the leading "dashboard" and title-case the rest.
  const rest = parts.slice(1);
  const crumbs = ['Dashboard', ...rest.map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))];
  return crumbs;
}
