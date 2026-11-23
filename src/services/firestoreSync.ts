/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 * Multi-Tenant Firebase Auth & Firestore Cloud Synchronization Service.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  Appointment,
  AuditLogEntry,
  Customer,
  JobCard,
  PartItem,
  TenantMember,
  TenantWorkspace,
  Vehicle,
} from '../types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogleSaas(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function signOutSaas(): Promise<void> {
  await firebaseSignOut(auth);
}

function clampString(val: string | undefined, max: number): string {
  return (val || '').trim().slice(0, max);
}

export async function provisionTenantInFirestore(
  tenant: TenantWorkspace,
  member: TenantMember
): Promise<void> {
  const tenantPath = `tenants/${tenant.id}`;
  try {
    await setDoc(
      doc(db, 'tenants', tenant.id),
      {
        name: clampString(tenant.name, 120),
        city: clampString(tenant.city, 80),
        gstin: clampString(tenant.gstin, 20),
        planId: tenant.planId,
        ownerUid: clampString(member.uid, 128),
        ownerEmail: clampString(member.email, 120),
        ownershipCode: 'SGSR14061977820DLVR',
        createdAt: tenant.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, tenantPath);
  }

  const memberPath = `tenants/${tenant.id}/members/${member.uid}`;
  try {
    await setDoc(
      doc(db, 'tenants', tenant.id, 'members', member.uid),
      {
        uid: clampString(member.uid, 128),
        email: clampString(member.email, 120),
        displayName: clampString(member.displayName, 100),
        role: member.role,
        status: member.status,
        assignedAt: member.assignedAt,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, memberPath);
  }
}

export async function syncTenantOperationalBundle(
  tenantId: string,
  payload: {
    customers: Customer[];
    vehicles: Vehicle[];
    jobCards: JobCard[];
    parts: PartItem[];
    appointments: Appointment[];
  }
): Promise<void> {
  const batch = writeBatch(db);
  const basePath = `tenants/${tenantId}`;

  payload.customers.slice(0, 40).forEach((c) => {
    batch.set(
      doc(db, 'tenants', tenantId, 'customers', c.id),
      {
        id: c.id,
        tenantId,
        name: clampString(c.name, 120),
        phone: clampString(c.phone, 30),
        email: clampString(c.email, 120),
        address: clampString(c.address, 240),
        customerType: c.customerType,
        ...(c.companyName ? { companyName: clampString(c.companyName, 120) } : {}),
        createdAt: clampString(c.createdAt, 32),
      },
      { merge: true }
    );
  });

  payload.vehicles.slice(0, 40).forEach((v) => {
    batch.set(
      doc(db, 'tenants', tenantId, 'vehicles', v.id),
      {
        id: v.id,
        tenantId,
        customerId: clampString(v.customerId, 128),
        plateNumber: clampString(v.plateNumber, 24),
        vin: clampString(v.vin, 24),
        make: clampString(v.make, 60),
        model: clampString(v.model, 80),
        year: Number(v.year) || 2023,
        fuelType: v.fuelType,
        color: clampString(v.color, 40),
        odometerKm: Math.max(0, Number(v.odometerKm) || 0),
        ...(v.lastServiceDate ? { lastServiceDate: v.lastServiceDate } : {}),
      },
      { merge: true }
    );
  });

  payload.jobCards.slice(0, 40).forEach((j) => {
    batch.set(
      doc(db, 'tenants', tenantId, 'jobCards', j.id),
      {
        ...j,
        tenantId,
        jobNumber: clampString(j.jobNumber, 32),
        vehicleId: clampString(j.vehicleId, 128),
        customerId: clampString(j.customerId, 128),
      },
      { merge: true }
    );
  });

  payload.parts.slice(0, 60).forEach((p) => {
    batch.set(
      doc(db, 'tenants', tenantId, 'partsInventory', p.id),
      {
        ...p,
        tenantId,
        sku: clampString(p.sku, 40),
        name: clampString(p.name, 140),
        quantity: Math.max(0, Number(p.quantity) || 0),
        sellingPrice: Math.max(0, Number(p.sellingPrice) || 0),
      },
      { merge: true }
    );
  });

  payload.appointments.slice(0, 40).forEach((a) => {
    batch.set(
      doc(db, 'tenants', tenantId, 'appointments', a.id),
      {
        ...a,
        tenantId,
        appointmentNumber: clampString(a.appointmentNumber, 32),
        customerName: clampString(a.customerName, 120),
        plateNumber: clampString(a.plateNumber, 24),
      },
      { merge: true }
    );
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, basePath);
  }
}

export async function appendCloudAuditLog(
  tenantId: string,
  entry: AuditLogEntry
): Promise<void> {
  const logPath = `tenants/${tenantId}/auditLogs/${entry.id}`;
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'auditLogs', entry.id), {
      tenantId,
      actorUid: clampString(entry.actorUid, 128),
      actorEmail: clampString(entry.actorEmail, 120),
      action: clampString(entry.action, 100),
      targetType: clampString(entry.targetType, 60),
      summary: clampString(entry.summary, 240),
      createdAt: clampString(entry.createdAt, 40),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, logPath);
  }
}

export function subscribeTenantAuditLogs(
  tenantId: string,
  onData: (logs: AuditLogEntry[]) => void
): Unsubscribe {
  const logsPath = `tenants/${tenantId}/auditLogs`;
  return onSnapshot(
    collection(db, 'tenants', tenantId, 'auditLogs'),
    (snap) => {
      const rows: AuditLogEntry[] = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          tenantId,
          actorUid: raw.actorUid || '',
          actorEmail: raw.actorEmail || '',
          actorRole: raw.actorRole || 'Workshop Admin',
          action: raw.action || '',
          targetType: raw.targetType || '',
          summary: raw.summary || '',
          createdAt: raw.createdAt || new Date().toISOString(),
        };
      });
      onData(rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, logsPath);
    }
  );
}
