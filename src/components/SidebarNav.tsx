import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  Car,
  Package,
  Users,
  Receipt,
  GitBranch,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
  Building2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ActiveView } from '../types';
import { useSaas } from '../context/SaasContext';

interface SidebarNavProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    activeJobs: number;
    lowStock: number;
    scheduledAppointments: number;
    unpaidInvoices: number;
  };
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  section:
    | 'Service Operations'
    | 'Workshop Assets'
    | 'Billing & Integrations'
    | 'Platform & Security';
  countKey?: keyof SidebarNavProps['counts'];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Service Console', icon: LayoutDashboard, section: 'Service Operations' },
  { id: 'job-cards', label: 'Repair Orders', icon: ClipboardList, section: 'Service Operations', countKey: 'activeJobs' },
  { id: 'bays-appointments', label: 'Bays & Dispatch', icon: CalendarClock, section: 'Service Operations', countKey: 'scheduledAppointments' },
  { id: 'vehicles-customers', label: 'Vehicles & Clients', icon: Car, section: 'Workshop Assets' },
  { id: 'parts-inventory', label: 'Parts Warehouse', icon: Package, section: 'Workshop Assets', countKey: 'lowStock' },
  { id: 'technicians', label: 'Technicians', icon: Users, section: 'Workshop Assets' },
  { id: 'billing', label: 'GST Billing', icon: Receipt, section: 'Billing & Integrations', countKey: 'unpaidInvoices' },
  { id: 'github-repos', label: 'GitHub Repos', icon: GitBranch, section: 'Billing & Integrations' },
  { id: 'saas-console', label: 'SaaS & Licensing', icon: ShieldCheck, section: 'Platform & Security' },
];

const SECTIONS: NavItem['section'][] = [
  'Service Operations',
  'Workshop Assets',
  'Billing & Integrations',
  'Platform & Security',
];

export default function SidebarNav({
  activeView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  counts,
}: SidebarNavProps) {
  const { activeTenant, ownershipCert } = useSaas();
  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Workshop navigation"
        className={`no-print tb-surface-solid flex flex-col shrink-0 transition-[width] duration-200 z-50 border-t-0 border-b-0 border-l-0 ${
          isCollapsed ? 'w-[72px]' : 'w-[256px]'
        } ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 flex'
            : 'hidden lg:flex sticky top-0 h-screen'
        }`}
      >
        {/* Brand Header */}
        <div
          className="h-16 px-4 border-b flex items-center justify-between gap-2 shrink-0"
          style={{ borderColor: 'var(--tb-border)' }}
        >
          <button
            type="button"
            onClick={() => {
              onSelectView('overview');
              onCloseMobile();
            }}
            className="flex items-center gap-3 min-w-0 text-left rounded-md focus-visible:outline-none focus-visible:ring-2"
            title="WRKFLW Car Service & Workshop Operations"
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--tb-primary-btn)',
                color: 'var(--tb-primary-btn-text)',
              }}
            >
              <Wrench className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </span>
            {!isCollapsed && (
              <span className="font-display font-extrabold text-base tracking-tight whitespace-nowrap truncate">
                WRKFLW
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:opacity-80"
            style={{ color: 'var(--tb-text-muted)' }}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.75} />
            )}
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-md"
            style={{ color: 'var(--tb-text-muted)' }}
            aria-label="Close navigation"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        {/* Vertical Navigation Links */}
        <nav className="flex-1 overflow-y-auto workshop-scroll py-4 px-3 space-y-6">
          {SECTIONS.map((section) => {
            const items = NAV_ITEMS.filter((item) => item.section === section);
            return (
              <div key={section} className="space-y-1">
                {!isCollapsed && (
                  <div
                    className="px-3 pb-1 text-xs font-medium"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    {section}
                  </div>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  const count = item.countKey ? counts[item.countKey] : undefined;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectView(item.id);
                        onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                        isCollapsed ? 'justify-center px-0' : ''
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--tb-primary-btn)',
                              color: 'var(--tb-primary-btn-text)',
                              fontWeight: 600,
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
                            }
                          : {
                              color: 'var(--tb-text-secondary)',
                              fontWeight: 500,
                            }
                      }
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon
                          className="w-[18px] h-[18px] shrink-0"
                          strokeWidth={1.75}
                          style={{
                            color: isActive
                              ? 'var(--tb-primary-btn-text)'
                              : 'var(--tb-text-muted)',
                          }}
                        />
                        {!isCollapsed && (
                          <span className="truncate whitespace-nowrap">
                            {item.label}
                          </span>
                        )}
                      </span>

                      {!isCollapsed && typeof count === 'number' && count > 0 && (
                        <span
                          className="text-xs font-mono tabular-nums shrink-0"
                          style={{
                            opacity: isActive ? 0.92 : 0.7,
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Indian Service Facility Footer (No Human Faces) */}
        <div
          className="p-3 border-t shrink-0"
          style={{ borderColor: 'var(--tb-border)' }}
        >
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? 'justify-center' : 'px-2 py-1.5'
            }`}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: 'var(--tb-surface-muted)',
                borderColor: 'var(--tb-border)',
                color: 'var(--tb-accent)',
              }}
            >
              <Building2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-semibold truncate">{activeTenant.name}</p>
                <p
                  className="text-[11px] font-mono truncate mt-0.5"
                  style={{ color: 'var(--tb-text-muted)' }}
                >
                  ID: {ownershipCert.ownershipCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
