/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 * Encapsulated Multi-Tenant RBAC, Subscription Plans & Quota Enforcement Kernel.
 */

import {
  AuditLogEntry,
  PermissionAction,
  SaasPlanId,
  SaasPlanTier,
  SaasRole,
} from '../../types';

const PLANS: readonly SaasPlanTier[] = Object.freeze([
  Object.freeze({
    id: 'starter',
    name: 'Starter Garage',
    audience: 'For single-location service centers',
    monthlyPriceInr: 4999,
    maxBays: 4,
    maxTechnicians: 6,
    maxActiveJobs: 35,
    maxBranches: 1,
    githubSyncEnabled: false,
    cloudAuditRetentionDays: 30,
  }),
  Object.freeze({
    id: 'pro',
    name: 'Multi-Bay Pro',
    audience: 'For scaling multi-bay workshops',
    monthlyPriceInr: 11999,
    maxBays: 12,
    maxTechnicians: 20,
    maxActiveJobs: 200,
    maxBranches: 5,
    githubSyncEnabled: true,
    cloudAuditRetentionDays: 180,
  }),
  Object.freeze({
    id: 'enterprise',
    name: 'Enterprise Dealer Group',
    audience: 'For regional automotive service chains',
    monthlyPriceInr: 24999,
    maxBays: 99,
    maxTechnicians: 150,
    maxActiveJobs: 2000,
    maxBranches: 50,
    githubSyncEnabled: true,
    cloudAuditRetentionDays: 365,
  }),
]);

const ROLE_PERMISSIONS_MAP: Readonly<Record<SaasRole, readonly PermissionAction[]>> =
  Object.freeze({
    'Platform Owner': Object.freeze([
      'ro:create',
      'ro:update',
      'bay:manage',
      'inventory:manage',
      'technician:manage',
      'billing:collect',
      'github:sync',
      'saas:admin',
    ] as const),
    'Workshop Admin': Object.freeze([
      'ro:create',
      'ro:update',
      'bay:manage',
      'inventory:manage',
      'technician:manage',
      'billing:collect',
      'github:sync',
      'saas:admin',
    ] as const),
    'Service Advisor': Object.freeze([
      'ro:create',
      'ro:update',
      'bay:manage',
      'inventory:manage',
    ] as const),
    'Master Technician': Object.freeze(['ro:update', 'bay:manage'] as const),
    'Inventory Manager': Object.freeze(['inventory:manage', 'github:sync'] as const),
    'Billing Accountant': Object.freeze(['billing:collect'] as const),
  });

class SaasPolicyKernel {
  readonly #plans = PLANS;
  readonly #matrix = ROLE_PERMISSIONS_MAP;

  listPlans(): readonly SaasPlanTier[] {
    return this.#plans;
  }

  getPlan(planId: SaasPlanId): SaasPlanTier {
    return (
      this.#plans.find((p) => p.id === planId) || this.#plans[1]
    );
  }

  hasPermission(role: SaasRole, action: PermissionAction): boolean {
    const allowed = this.#matrix[role];
    return Boolean(allowed && allowed.includes(action));
  }

  getRolePermissions(role: SaasRole): readonly PermissionAction[] {
    return this.#matrix[role] || [];
  }

  listRoles(): readonly SaasRole[] {
    return Object.freeze([
      'Platform Owner',
      'Workshop Admin',
      'Service Advisor',
      'Master Technician',
      'Inventory Manager',
      'Billing Accountant',
    ]);
  }

  checkCapacityQuota(
    planId: SaasPlanId,
    resource: 'bays' | 'technicians' | 'activeJobs' | 'branches',
    currentCount: number
  ): { allowed: boolean; limit: number; remaining: number } {
    const plan = this.getPlan(planId);
    const limit =
      resource === 'bays'
        ? plan.maxBays
        : resource === 'technicians'
        ? plan.maxTechnicians
        : resource === 'activeJobs'
        ? plan.maxActiveJobs
        : plan.maxBranches;

    return {
      allowed: currentCount < limit,
      limit,
      remaining: Math.max(0, limit - currentCount),
    };
  }

  buildAuditRecord(params: {
    tenantId: string;
    actorUid: string;
    actorEmail: string;
    actorRole: SaasRole;
    action: string;
    targetType: string;
    summary: string;
  }): AuditLogEntry {
    return Object.freeze({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: params.tenantId.slice(0, 128),
      actorUid: params.actorUid.slice(0, 128),
      actorEmail: params.actorEmail.slice(0, 120),
      actorRole: params.actorRole,
      action: params.action.slice(0, 100),
      targetType: params.targetType.slice(0, 60),
      summary: params.summary.slice(0, 240),
      createdAt: new Date().toISOString(),
    });
  }
}

const saasPolicyKernel = new SaasPolicyKernel();
Object.freeze(saasPolicyKernel);

export function getSaasPlans(): readonly SaasPlanTier[] {
  return saasPolicyKernel.listPlans();
}

export function getSaasPlanById(planId: SaasPlanId): SaasPlanTier {
  return saasPolicyKernel.getPlan(planId);
}

export function canRolePerform(role: SaasRole, action: PermissionAction): boolean {
  return saasPolicyKernel.hasPermission(role, action);
}

export function getRolePermissionList(role: SaasRole): readonly PermissionAction[] {
  return saasPolicyKernel.getRolePermissions(role);
}

export function getAllSaasRoles(): readonly SaasRole[] {
  return saasPolicyKernel.listRoles();
}

export function evaluateTenantQuota(
  planId: SaasPlanId,
  resource: 'bays' | 'technicians' | 'activeJobs' | 'branches',
  currentCount: number
) {
  return saasPolicyKernel.checkCapacityQuota(planId, resource, currentCount);
}

export function createTenantAuditEntry(params: {
  tenantId: string;
  actorUid: string;
  actorEmail: string;
  actorRole: SaasRole;
  action: string;
  targetType: string;
  summary: string;
}): AuditLogEntry {
  return saasPolicyKernel.buildAuditRecord(params);
}
