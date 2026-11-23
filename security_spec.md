# Security Specification — WRKFLW Multi-Tenant SaaS Platform
Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com

## Data Invariants
- Global default-deny safety net rejects any unmatched Firestore document path.
- Platform Owner (`dtglbw@gmail.com`, `email_verified == true`) and active Tenant Admins govern tenant creation, subscription plans, and member RBAC assignments.
- Every operational subcollection (`/customers`, `/vehicles`, `/jobCards`, `/partsInventory`, `/appointments`, `/auditLogs`) enforces the Master Gate against `/tenants/{tenantId}/members/{uid}`.
- PII collections (`customers`, `members`) restrict reads strictly to verified active tenant members or the Platform Owner—zero blanket unauthenticated or cross-tenant reads.
- `auditLogs` are strictly append-only (`allow update, delete: if false` for non-owners) with server-verified `actorUid == request.auth.uid`.
- All document IDs enforce `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), and all strings enforce explicit `.size()` bounds.

## The "Dirty Dozen" Denial Scenarios
1. Unauthenticated read or write on `/tenants/{tenantId}` or any subcollection.
2. Cross-tenant read attempt by a user belonging only to Tenant A querying Tenant B's `/customers`.
3. Spoofed `email_verified: false` login attempting to escalate as `dtglbw@gmail.com`.
4. Member attempting to self-promote role to `Platform Owner` or `Workshop Admin` in `/members/{uid}`.
5. Shadow field injection (`isEnterpriseOverride: true`) into `/tenants/{tenantId}`.
6. Modifying immutable `ownershipCode` (`SGSR14061977820DLVR`) or `ownerUid` on an existing tenant.
7. Technician attempting to mutate `planId` or delete `auditLogs`.
8. Injecting a 10KB string into `plateNumber`, `sku`, or `jobNumber`.
9. Writing a `JobCard` with negative `paidAmount` or invalid status outside the 7-stage enum.
10. Updating an `Invoiced` + `Paid` JobCard back to `Intake` without Admin/Owner role (terminal state lock).
11. Creating an `AuditLog` with a forged `actorUid` belonging to another user.
12. Deleting a Tenant workspace by a non-owner account.
