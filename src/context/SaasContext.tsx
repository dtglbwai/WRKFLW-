/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 * Multi-Tenant SaaS Context: Tenants, RBAC, Plan Quotas, Cloud Auth & Audit Trail.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  AuditLogEntry,
  PermissionAction,
  SaasPlanId,
  SaasPlanTier,
  SaasRole,
  TenantMember,
  TenantWorkspace,
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_TENANT_MEMBERS,
  INITIAL_TENANTS,
} from '../data/workshopSeed';
import {
  canRolePerform,
  createTenantAuditEntry,
  evaluateTenantQuota,
  getSaasPlanById,
  getSaasPlans,
} from '../core/saas/rbacEngine';
import {
  getOwnershipCertificate,
  installDocumentProvenanceAndGuards,
  IntegrityVerificationResult,
  isRegisteredOwnerEmail,
  OwnershipCertificate,
  verifyOwnershipSeal,
} from '../core/ownership/licenseGuard';
import {
  appendCloudAuditLog,
  provisionTenantInFirestore,
  signInWithGoogleSaas,
  signOutSaas,
} from '../services/firestoreSync';

const SAAS_META_STORAGE_KEY = 'wrkflw_saas_control_v1';

interface SaasControlPersistedState {
  tenants: TenantWorkspace[];
  activeTenantId: string;
  membersByTenant: Record<string, TenantMember[]>;
  activeRole: SaasRole;
  auditLogs: AuditLogEntry[];
}

function loadInitialSaasState(): SaasControlPersistedState {
  try {
    const raw = localStorage.getItem(SAAS_META_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tenants) && parsed.tenants.length > 0) {
        return parsed;
      }
    }
  } catch {
    // default
  }
  return {
    tenants: INITIAL_TENANTS,
    activeTenantId: INITIAL_TENANTS[0].id,
    membersByTenant: {
      [INITIAL_TENANTS[0].id]: INITIAL_TENANT_MEMBERS,
      [INITIAL_TENANTS[1].id]: INITIAL_TENANT_MEMBERS.slice(0, 3),
    },
    activeRole: 'Platform Owner',
    auditLogs: INITIAL_AUDIT_LOGS,
  };
}

interface SaasContextValue {
  tenants: TenantWorkspace[];
  activeTenant: TenantWorkspace;
  activePlan: SaasPlanTier;
  allPlans: readonly SaasPlanTier[];
  members: TenantMember[];
  activeRole: SaasRole;
  setActiveRole: (role: SaasRole) => void;
  can: (action: PermissionAction) => boolean;
  checkQuota: (
    resource: 'bays' | 'technicians' | 'activeJobs' | 'branches',
    currentCount: number
  ) => { allowed: boolean; limit: number; remaining: number };
  switchTenant: (tenantId: string) => void;
  createTenantBranch: (input: {
    name: string;
    code: string;
    city: string;
    state: string;
    gstin: string;
    phone: string;
    planId: SaasPlanId;
  }) => { ok: boolean; error?: string };
  upgradeTenantPlan: (planId: SaasPlanId) => void;
  addTenantMember: (input: {
    displayName: string;
    email: string;
    role: SaasRole;
  }) => void;
  updateMemberRole: (uid: string, role: SaasRole) => void;
  auditLogs: AuditLogEntry[];
  recordAudit: (action: string, targetType: string, summary: string) => void;
  authUser: User | null;
  authReady: boolean;
  cloudBusy: boolean;
  cloudStatusMessage: string | null;
  signInGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  provisionActiveTenantCloud: () => Promise<void>;
  ownershipCert: OwnershipCertificate;
  integrityResult: IntegrityVerificationResult | null;
}

const SaasContext = createContext<SaasContextValue | null>(null);

export function SaasProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SaasControlPersistedState>(
    loadInitialSaasState
  );
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(
    null
  );
  const [integrityResult, setIntegrityResult] =
    useState<IntegrityVerificationResult | null>(null);

  const ownershipCert = useMemo(() => getOwnershipCertificate(), []);

  useEffect(() => {
    const cleanup = installDocumentProvenanceAndGuards();
    verifyOwnershipSeal().then(setIntegrityResult);
    return cleanup;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user && isRegisteredOwnerEmail(user.email)) {
        setState((prev) => ({ ...prev, activeRole: 'Platform Owner' }));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SAAS_META_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota
    }
  }, [state]);

  const activeTenant = useMemo(() => {
    return (
      state.tenants.find((t) => t.id === state.activeTenantId) ||
      state.tenants[0]
    );
  }, [state.tenants, state.activeTenantId]);

  const activePlan = useMemo(
    () => getSaasPlanById(activeTenant.planId),
    [activeTenant.planId]
  );

  const allPlans = useMemo(() => getSaasPlans(), []);

  const members = useMemo(
    () => state.membersByTenant[activeTenant.id] || INITIAL_TENANT_MEMBERS,
    [state.membersByTenant, activeTenant.id]
  );

  const recordAudit = (action: string, targetType: string, summary: string) => {
    const entry = createTenantAuditEntry({
      tenantId: activeTenant.id,
      actorUid: authUser?.uid || 'owner-sgsr-primary',
      actorEmail: authUser?.email || ownershipCert.ownerEmail,
      actorRole: state.activeRole,
      action,
      targetType,
      summary,
    });

    setState((prev) => ({
      ...prev,
      auditLogs: [entry, ...prev.auditLogs].slice(0, 120),
    }));

    if (authUser) {
      appendCloudAuditLog(activeTenant.id, entry).catch(() => {
        // non-blocking when rules reject demo-only edits
      });
    }
  };

  const can = (action: PermissionAction) =>
    canRolePerform(state.activeRole, action);

  const checkQuota = (
    resource: 'bays' | 'technicians' | 'activeJobs' | 'branches',
    currentCount: number
  ) => evaluateTenantQuota(activeTenant.planId, resource, currentCount);

  const setActiveRole = (role: SaasRole) => {
    setState((prev) => ({ ...prev, activeRole: role }));
    recordAudit(
      'RBAC_ROLE_CONTEXT_SWITCH',
      'TenantMember',
      `Switched active RBAC permission context to ${role}`
    );
  };

  const switchTenant = (tenantId: string) => {
    const target = state.tenants.find((t) => t.id === tenantId);
    if (!target) return;
    setState((prev) => ({ ...prev, activeTenantId: tenantId }));
    const entry = createTenantAuditEntry({
      tenantId,
      actorUid: authUser?.uid || 'owner-sgsr-primary',
      actorEmail: authUser?.email || ownershipCert.ownerEmail,
      actorRole: state.activeRole,
      action: 'TENANT_WORKSPACE_SWITCHED',
      targetType: 'Tenant',
      summary: `Switched active SaaS branch workspace to ${target.name}`,
    });
    setState((prev) => ({
      ...prev,
      auditLogs: [entry, ...prev.auditLogs].slice(0, 120),
    }));
  };

  const createTenantBranch = (input: {
    name: string;
    code: string;
    city: string;
    state: string;
    gstin: string;
    phone: string;
    planId: SaasPlanId;
  }) => {
    const quota = evaluateTenantQuota(
      activeTenant.planId,
      'branches',
      state.tenants.length
    );
    if (!quota.allowed) {
      return {
        ok: false,
        error: `Current plan (${activePlan.name}) allows up to ${quota.limit} branch(es). Upgrade to Enterprise Dealer Group to add more branches.`,
      };
    }

    const id = `tenant-${Date.now()}`;
    const created: TenantWorkspace = {
      id,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      city: input.city.trim(),
      state: input.state.trim(),
      gstin: input.gstin.trim().toUpperCase(),
      phone: input.phone.trim(),
      planId: input.planId,
      ownerUid: authUser?.uid || 'owner-sgsr-primary',
      ownerEmail: authUser?.email || ownershipCert.ownerEmail,
      ownershipCode: ownershipCert.ownershipCode,
      createdAt: new Date().toISOString(),
    };

    const ownerMember: TenantMember = {
      uid: authUser?.uid || 'owner-sgsr-primary',
      displayName:
        authUser?.displayName ||
        `Platform Proprietor (${ownershipCert.ownershipCode})`,
      email: authUser?.email || ownershipCert.ownerEmail,
      role: 'Platform Owner',
      status: 'Active',
      assignedAt: created.createdAt,
    };

    setState((prev) => ({
      ...prev,
      tenants: [...prev.tenants, created],
      activeTenantId: id,
      membersByTenant: {
        ...prev.membersByTenant,
        [id]: [ownerMember],
      },
    }));

    if (authUser) {
      provisionTenantInFirestore(created, ownerMember).catch((err) => {
        console.error(err);
      });
    }

    recordAudit(
      'TENANT_BRANCH_CREATED',
      'Tenant',
      `Provisioned SaaS branch ${created.name} (${created.code}) under plan ${created.planId}`
    );
    return { ok: true };
  };

  const upgradeTenantPlan = (planId: SaasPlanId) => {
    const plan = getSaasPlanById(planId);
    setState((prev) => ({
      ...prev,
      tenants: prev.tenants.map((t) =>
        t.id === activeTenant.id ? { ...t, planId } : t
      ),
    }));
    recordAudit(
      'SUBSCRIPTION_PLAN_UPDATED',
      'Tenant',
      `Updated ${activeTenant.code} subscription tier to ${plan.name} (₹${plan.monthlyPriceInr}/mo)`
    );
  };

  const addTenantMember = (input: {
    displayName: string;
    email: string;
    role: SaasRole;
  }) => {
    const member: TenantMember = {
      uid: `usr-${Date.now()}`,
      displayName: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      status: 'Active',
      assignedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      membersByTenant: {
        ...prev.membersByTenant,
        [activeTenant.id]: [
          ...(prev.membersByTenant[activeTenant.id] || []),
          member,
        ],
      },
    }));
    recordAudit(
      'RBAC_MEMBER_INVITED',
      'TenantMember',
      `Assigned ${member.email} to role ${member.role}`
    );
  };

  const updateMemberRole = (uid: string, role: SaasRole) => {
    setState((prev) => ({
      ...prev,
      membersByTenant: {
        ...prev.membersByTenant,
        [activeTenant.id]: (prev.membersByTenant[activeTenant.id] || []).map(
          (m) => (m.uid === uid ? { ...m, role } : m)
        ),
      },
    }));
    recordAudit(
      'RBAC_MEMBER_ROLE_UPDATED',
      'TenantMember',
      `Changed member (${uid}) permission role to ${role}`
    );
  };

  const signInGoogle = async () => {
    setCloudBusy(true);
    setCloudStatusMessage(null);
    try {
      const user = await signInWithGoogleSaas();
      if (user) {
        const ownerMember: TenantMember = {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Authenticated User',
          email: user.email || ownershipCert.ownerEmail,
          role: isRegisteredOwnerEmail(user.email)
            ? 'Platform Owner'
            : 'Workshop Admin',
          status: 'Active',
          assignedAt: new Date().toISOString(),
        };
        await provisionTenantInFirestore(activeTenant, ownerMember);
        setCloudStatusMessage(
          `Connected to Firebase Cloud (${user.email})`
        );
        recordAudit(
          'CLOUD_AUTH_CONNECTED',
          'Auth',
          `Signed in via Google OAuth as ${user.email}`
        );
      }
    } catch (error) {
      setCloudStatusMessage(
        error instanceof Error
          ? error.message
          : 'Google Sign-In was cancelled or blocked.'
      );
    } finally {
      setCloudBusy(false);
    }
  };

  const signOutGoogle = async () => {
    setCloudBusy(true);
    try {
      await signOutSaas();
      setCloudStatusMessage('Disconnected from Firebase session (Sandbox active).');
    } finally {
      setCloudBusy(false);
    }
  };

  const provisionActiveTenantCloud = async () => {
    if (!authUser) {
      setCloudStatusMessage('Sign in with Google first to sync tenant metadata.');
      return;
    }
    setCloudBusy(true);
    setCloudStatusMessage(null);
    try {
      const member: TenantMember = {
        uid: authUser.uid,
        displayName: authUser.displayName || 'Workshop Admin',
        email: authUser.email || ownershipCert.ownerEmail,
        role: isRegisteredOwnerEmail(authUser.email)
          ? 'Platform Owner'
          : state.activeRole,
        status: 'Active',
        assignedAt: new Date().toISOString(),
      };
      await provisionTenantInFirestore(activeTenant, member);
      setCloudStatusMessage(
        `Tenant ${activeTenant.code} provisioned in Firestore (${activeTenant.id}).`
      );
      recordAudit(
        'CLOUD_TENANT_PROVISIONED',
        'Tenant',
        `Synchronized tenant ${activeTenant.name} with Firestore`
      );
    } catch (error) {
      setCloudStatusMessage(
        error instanceof Error ? error.message : 'Cloud provisioning failed.'
      );
    } finally {
      setCloudBusy(false);
    }
  };

  const tenantAuditLogs = useMemo(
    () => state.auditLogs.filter((l) => l.tenantId === activeTenant.id),
    [state.auditLogs, activeTenant.id]
  );

  return (
    <SaasContext.Provider
      value={{
        tenants: state.tenants,
        activeTenant,
        activePlan,
        allPlans,
        members,
        activeRole: state.activeRole,
        setActiveRole,
        can,
        checkQuota,
        switchTenant,
        createTenantBranch,
        upgradeTenantPlan,
        addTenantMember,
        updateMemberRole,
        auditLogs: tenantAuditLogs,
        recordAudit,
        authUser,
        authReady,
        cloudBusy,
        cloudStatusMessage,
        signInGoogle,
        signOutGoogle,
        provisionActiveTenantCloud,
        ownershipCert,
        integrityResult,
      }}
    >
      {children}
    </SaasContext.Provider>
  );
}

export function useSaas() {
  const ctx = useContext(SaasContext);
  if (!ctx) {
    throw new Error('useSaas must be used inside SaasProvider');
  }
  return ctx;
}
