/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 */

import React, { useState } from 'react';
import {
  Building2,
  Check,
  Cloud,
  CloudOff,
  CreditCard,
  FileCheck2,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useSaas } from '../context/SaasContext';
import {
  getAllSaasRoles,
  getRolePermissionList,
} from '../core/saas/rbacEngine';
import { formatINR } from '../data/workshopSeed';
import { PermissionAction, SaasPlanId, SaasRole } from '../types';

interface SaasConsoleViewProps {
  currentBayCount: number;
  currentTechCount: number;
  currentActiveJobsCount: number;
  onSyncWorkspaceCloud: () => Promise<void>;
}

type SaasTab = 'workspaces' | 'plans' | 'rbac' | 'ownership';

const PERMISSION_LABELS: Record<PermissionAction, string> = {
  'ro:create': 'Create Repair Orders',
  'ro:update': 'Edit Diagnostics & Status',
  'bay:manage': 'Manage Bays & Dispatch',
  'inventory:manage': 'Parts Restock & SKUs',
  'technician:manage': 'Technician Roster & Rates',
  'billing:collect': 'Collect Payments & GST Invoices',
  'github:sync': 'Sync GitHub Catalogs',
  'saas:admin': 'Tenant, Plan & RBAC Admin',
};

export default function SaasConsoleView({
  currentBayCount,
  currentTechCount,
  currentActiveJobsCount,
  onSyncWorkspaceCloud,
}: SaasConsoleViewProps) {
  const {
    tenants,
    activeTenant,
    activePlan,
    allPlans,
    members,
    activeRole,
    setActiveRole,
    can,
    switchTenant,
    createTenantBranch,
    upgradeTenantPlan,
    addTenantMember,
    updateMemberRole,
    auditLogs,
    authUser,
    cloudBusy,
    cloudStatusMessage,
    signInGoogle,
    signOutGoogle,
    ownershipCert,
    integrityResult,
  } = useSaas();

  const [activeTab, setActiveTab] = useState<SaasTab>('workspaces');
  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    gstin: '',
    phone: '+91 ',
    planId: 'pro' as SaasPlanId,
  });

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    displayName: '',
    email: '',
    role: 'Service Advisor' as SaasRole,
  });

  const isAdmin = can('saas:admin');
  const allRoles = getAllSaasRoles();

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim() || !branchForm.city.trim()) return;
    const res = createTenantBranch(branchForm);
    if (!res.ok) {
      setBranchError(res.error || 'Quota limit reached.');
      return;
    }
    setBranchError(null);
    setBranchFormOpen(false);
    setBranchForm({
      name: '',
      code: '',
      city: '',
      state: '',
      gstin: '',
      phone: '+91 ',
      planId: 'pro',
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.displayName.trim() || !memberForm.email.trim()) return;
    addTenantMember(memberForm);
    setMemberFormOpen(false);
    setMemberForm({
      displayName: '',
      email: '',
      role: 'Service Advisor',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top SaaS Executive Banner */}
      <div className="tb-navy-panel rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono">
            <span className="font-semibold text-white">WRKFLW Cloud SaaS</span>
            <span aria-hidden="true">·</span>
            <span>{activeTenant.code}</span>
            <span aria-hidden="true">·</span>
            <span>Plan: {activePlan.name}</span>
            <span aria-hidden="true">·</span>
            <span>Owner ID: {ownershipCert.ownershipCode}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
            Multi-Tenant Architecture, Subscriptions, RBAC &amp; IP Ownership
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Manage isolated workshop branches, enforce role-based access controls, monitor subscription capacity quotas, and inspect encapsulated ownership safeguards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {authUser ? (
            <>
              <button
                type="button"
                onClick={onSyncWorkspaceCloud}
                disabled={cloudBusy}
                className="tb-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${cloudBusy ? 'animate-spin' : ''}`}
                  strokeWidth={1.75}
                />
                Sync Tenant to Firestore
              </button>
              <button
                type="button"
                onClick={signOutGoogle}
                disabled={cloudBusy}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-white/25 bg-white/10 text-white hover:bg-white/15 whitespace-nowrap shrink-0"
              >
                <CloudOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                Sign Out ({authUser.email})
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={signInGoogle}
              disabled={cloudBusy}
              className="tb-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Cloud className="w-4 h-4" strokeWidth={1.75} />
              {cloudBusy ? 'Connecting...' : 'Sign In with Google (Cloud Sync)'}
            </button>
          )}
        </div>
      </div>

      {cloudStatusMessage && (
        <div
          className="tb-surface rounded-lg px-4 py-3 text-xs flex items-center justify-between gap-3"
          style={{ color: 'var(--tb-text)' }}
        >
          <span>{cloudStatusMessage}</span>
          <span
            className="font-mono text-xs shrink-0"
            style={{ color: 'var(--tb-text-muted)' }}
          >
            {authUser ? 'Firestore Connected' : 'Local Tenant Sandbox'}
          </span>
        </div>
      )}

      {/* Segmented SaaS Navigation Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg overflow-x-auto w-fit"
        style={{ backgroundColor: 'var(--tb-surface-muted)' }}
      >
        {(
          [
            { id: 'workspaces', label: 'Tenant Branches', icon: Building2 },
            { id: 'plans', label: 'Plans & Quotas', icon: CreditCard },
            { id: 'rbac', label: 'Team & RBAC', icon: Users },
            { id: 'ownership', label: 'Ownership Seal & Audit', icon: Lock },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all"
              style={
                active
                  ? {
                      backgroundColor: 'var(--tb-surface-solid)',
                      color: 'var(--tb-text)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }
                  : { color: 'var(--tb-text-muted)' }
              }
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Multi-Tenant Branch Workspaces */}
      {activeTab === 'workspaces' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-semibold">
                Tenant Workshop Branches ({tenants.length} / {activePlan.maxBranches})
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                Each tenant maintains isolated repair orders, customer/vehicle registries, parts stock, and GST invoicing
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setBranchError(null);
                  setBranchFormOpen((v) => !v);
                }}
                className="tb-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" strokeWidth={1.75} />
                Provision New Tenant Branch
              </button>
            )}
          </div>

          {branchError && (
            <div
              className="rounded-lg border px-4 py-3 text-xs text-red-600 dark:text-red-400"
              style={{
                backgroundColor: 'var(--tb-surface-solid)',
                borderColor: 'var(--tb-accent)',
              }}
            >
              {branchError}
            </div>
          )}

          {branchFormOpen && (
            <form
              onSubmit={handleCreateBranch}
              className="tb-surface rounded-xl p-5 space-y-4"
            >
              <h4 className="text-sm font-display font-semibold">
                Provision Isolated Workshop Tenant
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Branch Name
                  </label>
                  <input
                    required
                    value={branchForm.name}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, name: e.target.value })
                    }
                    placeholder="WRKFLW Pune · Wakad Hub"
                    className="tb-input w-full h-9 px-3 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Branch Code
                  </label>
                  <input
                    required
                    value={branchForm.code}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, code: e.target.value })
                    }
                    placeholder="PNQ-03"
                    className="tb-input w-full h-9 px-3 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">City</label>
                  <input
                    required
                    value={branchForm.city}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, city: e.target.value })
                    }
                    placeholder="Pune"
                    className="tb-input w-full h-9 px-3 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">State</label>
                  <input
                    required
                    value={branchForm.state}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, state: e.target.value })
                    }
                    placeholder="Maharashtra"
                    className="tb-input w-full h-9 px-3 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Branch GSTIN
                  </label>
                  <input
                    required
                    value={branchForm.gstin}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, gstin: e.target.value })
                    }
                    placeholder="27AABCU9603R1ZP"
                    className="tb-input w-full h-9 px-3 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Contact Phone
                  </label>
                  <input
                    required
                    value={branchForm.phone}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, phone: e.target.value })
                    }
                    className="tb-input w-full h-9 px-3 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBranchFormOpen(false)}
                  className="tb-btn-secondary px-4 py-2 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tb-btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Create Tenant Workspace
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => {
              const isCurrent = t.id === activeTenant.id;
              const plan = allPlans.find((p) => p.id === t.planId) || activePlan;
              return (
                <div
                  key={t.id}
                  className="tb-surface rounded-xl p-5 flex flex-col justify-between gap-4"
                  style={{
                    borderColor: isCurrent
                      ? 'var(--tb-accent)'
                      : 'var(--tb-border)',
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-xs font-mono font-semibold"
                        style={{ color: 'var(--tb-accent)' }}
                      >
                        {t.code} · {plan.name}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {isCurrent ? 'Active Workspace' : 'Standby'}
                      </span>
                    </div>
                    <h4 className="text-base font-display font-bold">{t.name}</h4>
                    <div
                      className="text-xs space-y-1 font-mono"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      <p>
                        {t.city}, {t.state} · {t.phone}
                      </p>
                      <p>GSTIN: {t.gstin}</p>
                      <p style={{ color: 'var(--tb-text-muted)' }}>
                        Owner: {t.ownerEmail} · Seal: {t.ownershipCode}
                      </p>
                    </div>
                  </div>

                  <div
                    className="pt-3 border-t flex items-center justify-between"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <span
                      className="text-xs font-mono tabular-nums"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      {formatINR(plan.monthlyPriceInr)} / mo + GST
                    </span>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => switchTenant(t.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
                        isCurrent ? 'tb-btn-secondary opacity-70' : 'tb-btn-primary'
                      }`}
                    >
                      {isCurrent ? 'Currently Selected' : 'Switch to Branch'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Subscription Plans & Concrete Quotas */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Live Usage Meters */}
          <div className="tb-surface rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-display font-semibold">
                  Active Tenant Resource Usage ({activePlan.name})
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                  Real-time capacity limits enforced across {activeTenant.name}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold">
                {formatINR(activePlan.monthlyPriceInr)}/mo + 18% GST
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Service Bays',
                  used: currentBayCount,
                  limit: activePlan.maxBays,
                },
                {
                  label: 'Technician Seats',
                  used: currentTechCount,
                  limit: activePlan.maxTechnicians,
                },
                {
                  label: 'Active Repair Orders',
                  used: currentActiveJobsCount,
                  limit: activePlan.maxActiveJobs,
                },
                {
                  label: 'Workshop Branches',
                  used: tenants.length,
                  limit: activePlan.maxBranches,
                },
              ].map((meter) => {
                const pct = Math.min(
                  100,
                  Math.round((meter.used / meter.limit) * 100)
                );
                return (
                  <div
                    key={meter.label}
                    className="p-4 rounded-lg border space-y-2"
                    style={{
                      backgroundColor: 'var(--tb-surface-muted)',
                      borderColor: 'var(--tb-border)',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--tb-text-secondary)' }}>
                        {meter.label}
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {meter.used} / {meter.limit}
                      </span>
                    </div>
                    <div className="h-2 rounded-sm bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            pct >= 90 ? '#dc2626' : 'var(--tb-accent)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 Subscription Plan Tier Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {allPlans.map((plan) => {
              const isCurrent = plan.id === activeTenant.planId;
              const gstMonthly = Math.round(plan.monthlyPriceInr * 0.18);
              return (
                <div
                  key={plan.id}
                  className="tb-surface rounded-xl p-6 flex flex-col justify-between gap-6"
                  style={{
                    borderColor: isCurrent
                      ? 'var(--tb-accent)'
                      : 'var(--tb-border)',
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: 'var(--tb-accent)' }}
                      >
                        {plan.audience}
                      </p>
                      <h4 className="text-lg font-display font-bold mt-1">
                        {plan.name}
                      </h4>
                    </div>

                    <div>
                      <p className="text-2xl font-display font-bold font-mono tabular-nums">
                        {formatINR(plan.monthlyPriceInr)}
                        <span
                          className="text-xs font-normal ml-1"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          / month
                        </span>
                      </p>
                      <p
                        className="text-xs font-mono tabular-nums mt-0.5"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        +{formatINR(gstMonthly)} (18% GST)
                      </p>
                    </div>

                    <div
                      className="pt-4 border-t space-y-2.5 text-xs"
                      style={{ borderColor: 'var(--tb-border)' }}
                    >
                      <div className="flex items-center justify-between font-mono tabular-nums">
                        <span style={{ color: 'var(--tb-text-secondary)' }}>
                          Max Service Bays
                        </span>
                        <span className="font-semibold">{plan.maxBays} Bays</span>
                      </div>
                      <div className="flex items-center justify-between font-mono tabular-nums">
                        <span style={{ color: 'var(--tb-text-secondary)' }}>
                          Technician Seats
                        </span>
                        <span className="font-semibold">
                          {plan.maxTechnicians} Staff
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono tabular-nums">
                        <span style={{ color: 'var(--tb-text-secondary)' }}>
                          Active RO Quota
                        </span>
                        <span className="font-semibold">
                          {plan.maxActiveJobs} ROs
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono tabular-nums">
                        <span style={{ color: 'var(--tb-text-secondary)' }}>
                          Multi-Branch Limit
                        </span>
                        <span className="font-semibold">
                          {plan.maxBranches} Hub(s)
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono tabular-nums">
                        <span style={{ color: 'var(--tb-text-secondary)' }}>
                          GitHub Repo Sync
                        </span>
                        <span className="font-semibold">
                          {plan.githubSyncEnabled ? 'Included' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono tabular-nums">
                        <span style={{ color: 'var(--tb-text-secondary)' }}>
                          Audit Retention
                        </span>
                        <span className="font-semibold">
                          {plan.cloudAuditRetentionDays} Days
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent || !isAdmin}
                    onClick={() => upgradeTenantPlan(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold whitespace-nowrap ${
                      isCurrent
                        ? 'tb-btn-secondary opacity-75'
                        : 'tb-btn-primary disabled:opacity-50'
                    }`}
                  >
                    {isCurrent
                      ? 'Current Active Plan'
                      : isAdmin
                      ? `Switch to ${plan.name}`
                      : 'Admin Required'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Team Members & RBAC Access Matrix */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          {/* Active Role Simulation / Context Switcher */}
          <div className="tb-surface rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-display font-semibold flex items-center gap-2">
                <KeyRound
                  className="w-4 h-4"
                  strokeWidth={1.75}
                  style={{ color: 'var(--tb-accent)' }}
                />
                Active RBAC Session Role: <span className="font-mono">{activeRole}</span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                Switch active operator role context to verify live module gating across Repair Orders, Inventory, and GST Billing
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {allRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className="px-2.5 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 transition-all"
                  style={
                    activeRole === role
                      ? {
                          backgroundColor: 'var(--tb-accent)',
                          borderColor: 'var(--tb-accent)',
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: 'var(--tb-surface-muted)',
                          borderColor: 'var(--tb-border)',
                          color: 'var(--tb-text-secondary)',
                        }
                  }
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Staff Roster */}
            <div className="xl:col-span-7 tb-surface rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-display font-semibold">
                    Tenant Staff &amp; Role Assignments ({members.length})
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                    Scoped strictly to {activeTenant.name}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setMemberFormOpen((v) => !v)}
                    className="tb-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Add Member
                  </button>
                )}
              </div>

              {memberFormOpen && (
                <form
                  onSubmit={handleAddMember}
                  className="p-4 rounded-lg border space-y-3"
                  style={{
                    backgroundColor: 'var(--tb-surface-muted)',
                    borderColor: 'var(--tb-border)',
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      required
                      value={memberForm.displayName}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, displayName: e.target.value })
                      }
                      placeholder="Full Name"
                      className="tb-input h-9 px-3 rounded-lg text-xs"
                    />
                    <input
                      required
                      type="email"
                      value={memberForm.email}
                      onChange={(e) =>
                        setMemberForm({ ...memberForm, email: e.target.value })
                      }
                      placeholder="staff@wrkflw.in"
                      className="tb-input h-9 px-3 rounded-lg text-xs"
                    />
                    <select
                      value={memberForm.role}
                      onChange={(e) =>
                        setMemberForm({
                          ...memberForm,
                          role: e.target.value as SaasRole,
                        })
                      }
                      className="tb-input h-9 px-3 rounded-lg text-xs"
                    >
                      {allRoles
                        .filter((r) => r !== 'Platform Owner')
                        .map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setMemberFormOpen(false)}
                      className="tb-btn-secondary px-3 py-1.5 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="tb-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      Assign Role
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y" style={{ borderColor: 'var(--tb-border)' }}>
                {members.map((m) => (
                  <div
                    key={m.uid}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.displayName}
                      </p>
                      <p
                        className="text-xs font-mono truncate"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {m.email} · {m.status}
                      </p>
                    </div>
                    <select
                      disabled={!isAdmin || m.role === 'Platform Owner'}
                      value={m.role}
                      onChange={(e) =>
                        updateMemberRole(m.uid, e.target.value as SaasRole)
                      }
                      className="tb-input h-8 px-2.5 rounded-md text-xs font-medium shrink-0 disabled:opacity-75"
                    >
                      {allRoles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Role Permission Matrix */}
            <div className="xl:col-span-5 tb-surface rounded-xl p-6 space-y-4">
              <div>
                <h4 className="text-base font-display font-semibold">
                  Role Permission Matrix ({activeRole})
                </h4>
                <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                  Enforced by encapsulated SaasPolicyKernel
                </p>
              </div>

              <div className="space-y-2">
                {(Object.keys(PERMISSION_LABELS) as PermissionAction[]).map(
                  (perm) => {
                    const granted = getRolePermissionList(activeRole).includes(perm);
                    return (
                      <div
                        key={perm}
                        className="px-3.5 py-2.5 rounded-lg border flex items-center justify-between text-xs"
                        style={{
                          backgroundColor: 'var(--tb-surface-muted)',
                          borderColor: 'var(--tb-border)',
                        }}
                      >
                        <span>{PERMISSION_LABELS[perm]}</span>
                        <span
                          className={`font-mono font-semibold inline-flex items-center gap-1 ${
                            granted
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {granted ? (
                            <>
                              <Check className="w-3.5 h-3.5" strokeWidth={2} />
                              Allowed
                            </>
                          ) : (
                            'Restricted'
                          )}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Ownership Seal, Encapsulation Manifest & Immutable Audit Trail */}
      {activeTab === 'ownership' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Ownership Certificate Card */}
          <div className="xl:col-span-6 tb-surface rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--tb-accent)' }}
                >
                  Proprietary IP &amp; Encapsulation Registry
                </p>
                <h3 className="text-lg font-display font-bold">
                  {ownershipCert.platformName}
                </h3>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--tb-accent-soft)',
                  color: 'var(--tb-accent)',
                }}
              >
                <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
              </div>
            </div>

            <div
              className="p-4 rounded-lg border space-y-2 text-xs font-mono"
              style={{
                backgroundColor: 'var(--tb-surface-muted)',
                borderColor: 'var(--tb-border)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--tb-text-muted)' }}>
                  Ownership Code
                </span>
                <span className="font-bold">{ownershipCert.ownershipCode}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--tb-text-muted)' }}>
                  Registered Proprietor
                </span>
                <span className="font-bold">{ownershipCert.ownerEmail}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--tb-text-muted)' }}>
                  License Classification
                </span>
                <span>{ownershipCert.licenseType}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--tb-text-muted)' }}>
                  SHA-256 Runtime Seal
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {integrityResult?.valid ? 'Verified' : 'Checking'} ·{' '}
                  {integrityResult?.digestHex || ownershipCert.expectedSealDigest}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--tb-text-muted)' }}>
                Encapsulated Core Modules &amp; Capabilities
              </h4>
              <ul className="space-y-1.5 text-xs" style={{ color: 'var(--tb-text-secondary)' }}>
                {ownershipCert.protectedAssets.map((asset, idx) => (
                  <li key={asset} className="flex items-start gap-2">
                    <span className="font-mono font-semibold" style={{ color: 'var(--tb-accent)' }}>
                      0{idx + 1}.
                    </span>
                    <span>{asset}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p
              className="text-xs leading-relaxed pt-3 border-t"
              style={{
                borderColor: 'var(--tb-border)',
                color: 'var(--tb-text-muted)',
              }}
            >
              {ownershipCert.restrictionNotice}
            </p>
          </div>

          {/* Immutable Audit Trail */}
          <div className="xl:col-span-6 tb-surface rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-display font-semibold flex items-center gap-2">
                  <FileCheck2
                    className="w-4 h-4"
                    strokeWidth={1.75}
                    style={{ color: 'var(--tb-accent)' }}
                  />
                  Tenant Security &amp; Operational Audit Trail
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                  Append-only event stream for {activeTenant.code} ({auditLogs.length} entries)
                </p>
              </div>
            </div>

            <div className="divide-y max-h-[420px] overflow-y-auto workshop-scroll" style={{ borderColor: 'var(--tb-border)' }}>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 space-y-1"
                  style={{ borderColor: 'var(--tb-border)' }}
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span
                      className="font-mono font-semibold"
                      style={{ color: 'var(--tb-accent)' }}
                    >
                      {log.action}
                    </span>
                    <span
                      className="font-mono tabular-nums"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      {log.createdAt.slice(0, 19).replace('T', ' ')}
                    </span>
                  </div>
                  <p className="text-xs">{log.summary}</p>
                  <p
                    className="text-xs font-mono"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    {log.actorEmail} · {log.actorRole} · {log.targetType}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
