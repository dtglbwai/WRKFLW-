/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 * Unauthorized copying, distribution, or replication without prior written permission is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Menu, Plus, Palette, AlertCircle } from 'lucide-react';
import SidebarNav from './components/SidebarNav';
import OverviewView from './components/OverviewView';
import JobCardsView from './components/JobCardsView';
import BaysAppointmentsView from './components/BaysAppointmentsView';
import VehiclesCustomersView from './components/VehiclesCustomersView';
import InventoryView from './components/InventoryView';
import TechniciansView from './components/TechniciansView';
import BillingView from './components/BillingView';
import GitHubReposView from './components/GitHubReposView';
import SaasConsoleView from './components/SaasConsoleView';
import ThemeModal from './components/ThemeModal';
import ErrorBoundary from './components/ErrorBoundary';
import { WorkshopThemeProvider } from './context/ThemeContext';
import { SaasProvider, useSaas } from './context/SaasContext';
import {
  ActiveView,
  Appointment,
  Customer,
  JobCard,
  JobStatus,
  PartItem,
  ServiceBay,
  Technician,
  Vehicle,
  WorkshopPresetTemplate,
} from './types';
import {
  calculateJobTotals,
  INITIAL_APPOINTMENTS,
  INITIAL_BAYS,
  INITIAL_CUSTOMERS,
  INITIAL_JOB_CARDS,
  INITIAL_PARTS,
  INITIAL_TECHNICIANS,
  INITIAL_VEHICLES,
} from './data/workshopSeed';
import { validateStatusTransition } from './core/saas/workflowEngine';
import { syncTenantOperationalBundle } from './services/firestoreSync';
import { testConnection } from './lib/firebase';

const TENANT_DATA_PREFIX = 'wrkflw_saas_tenant_v1_';

interface WorkshopStoreState {
  customers: Customer[];
  vehicles: Vehicle[];
  technicians: Technician[];
  bays: ServiceBay[];
  parts: PartItem[];
  jobCards: JobCard[];
  appointments: Appointment[];
  activeLinkedRepo: string;
}

const VIEW_LABELS: Record<ActiveView, string> = {
  overview: 'Service Console',
  'job-cards': 'Repair Orders',
  'bays-appointments': 'Bays & Dispatch',
  'vehicles-customers': 'Vehicles & Clients',
  'parts-inventory': 'Parts Warehouse',
  technicians: 'Technicians',
  billing: 'GST Billing',
  'github-repos': 'GitHub Repos',
  'saas-console': 'SaaS & Licensing',
};

function createSeedForTenant(tenantId: string): WorkshopStoreState {
  if (tenantId === 'tenant-mum-andheri') {
    return {
      customers: INITIAL_CUSTOMERS,
      vehicles: INITIAL_VEHICLES,
      technicians: INITIAL_TECHNICIANS,
      bays: INITIAL_BAYS,
      parts: INITIAL_PARTS,
      jobCards: INITIAL_JOB_CARDS,
      appointments: INITIAL_APPOINTMENTS,
      activeLinkedRepo: 'rene98c/carcareco',
    };
  }

  return {
    customers: INITIAL_CUSTOMERS.slice(0, 2),
    vehicles: INITIAL_VEHICLES.slice(0, 2),
    technicians: INITIAL_TECHNICIANS.slice(0, 3),
    bays: INITIAL_BAYS.map((b) => ({
      ...b,
      status: b.status === 'Maintenance' ? 'Maintenance' : 'Available',
      activeJobId: undefined,
      assignedTechId: undefined,
    })),
    parts: INITIAL_PARTS,
    jobCards: INITIAL_JOB_CARDS.slice(0, 2),
    appointments: INITIAL_APPOINTMENTS.slice(0, 2),
    activeLinkedRepo: 'Irshaduu/workshopos-v1',
  };
}

function loadTenantStore(tenantId: string): WorkshopStoreState {
  try {
    const raw = localStorage.getItem(`${TENANT_DATA_PREFIX}${tenantId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.jobCards)) {
        return parsed;
      }
    }
  } catch {
    // fallback to seed state
  }
  return createSeedForTenant(tenantId);
}

function WorkshopShell() {
  const {
    tenants,
    activeTenant,
    activePlan,
    activeRole,
    switchTenant,
    can,
    checkQuota,
    recordAudit,
    provisionActiveTenantCloud,
  } = useSaas();

  const [store, setStore] = useState<WorkshopStoreState>(() =>
    loadTenantStore(activeTenant.id)
  );
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [openCreateJobSignal, setOpenCreateJobSignal] = useState(0);
  const [jobStatusFilter, setJobStatusFilter] = useState<'All' | JobStatus>('All');
  const [jobStatusFilterSignal, setJobStatusFilterSignal] = useState(0);
  const [policyNotice, setPolicyNotice] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    setStore(loadTenantStore(activeTenant.id));
    setSelectedJobId(null);
    setPolicyNotice(null);
  }, [activeTenant.id]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${TENANT_DATA_PREFIX}${activeTenant.id}`,
        JSON.stringify(store)
      );
    } catch {
      // ignore storage quota errors
    }
  }, [store, activeTenant.id]);

  const showPolicyAlert = (msg: string) => {
    setPolicyNotice(msg);
    setTimeout(() => {
      setPolicyNotice((curr) => (curr === msg ? null : curr));
    }, 5500);
  };

  const handleOpenJobCard = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveView('job-cards');
  };

  const handleOpenJobsByStatus = (status: 'All' | JobStatus) => {
    setJobStatusFilter(status);
    setJobStatusFilterSignal((n) => n + 1);
    setSelectedJobId(null);
    setActiveView('job-cards');
  };

  const handleTriggerNewJob = () => {
    if (!can('ro:create')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" does not have permission to create Repair Orders.`
      );
      return;
    }
    const activeCount = store.jobCards.filter(
      (j) => j.status !== 'Invoiced'
    ).length;
    const quota = checkQuota('activeJobs', activeCount);
    if (!quota.allowed) {
      showPolicyAlert(
        `SaaS Quota Reached: ${activePlan.name} allows up to ${quota.limit} active repair orders.`
      );
      return;
    }

    setActiveView('job-cards');
    setSelectedJobId(null);
    setOpenCreateJobSignal((n) => n + 1);
  };

  const handleCreateJobCard = (newJobData: Omit<JobCard, 'id' | 'jobNumber'>) => {
    if (!can('ro:create')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot create Repair Orders.`
      );
      return;
    }

    const id = `job-${Date.now()}`;
    const jobNumber = `RO-2026-${1045 + store.jobCards.length}`;
    const created: JobCard = { ...newJobData, id, jobNumber };

    setStore((prev) => ({
      ...prev,
      jobCards: [created, ...prev.jobCards],
      bays: newJobData.bayId
        ? prev.bays.map((b) =>
            b.id === newJobData.bayId
              ? {
                  ...b,
                  status: 'Occupied',
                  activeJobId: id,
                  assignedTechId: newJobData.technicianId,
                }
              : b
          )
        : prev.bays,
    }));
    setSelectedJobId(id);
    recordAudit(
      'REPAIR_ORDER_CREATED',
      'JobCard',
      `Created ${jobNumber} in ${activeTenant.code}`
    );
  };

  const handleUpdateJobCard = (updated: JobCard) => {
    if (!can('ro:update')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" has read-only access to Repair Orders.`
      );
      return;
    }

    const existing = store.jobCards.find((j) => j.id === updated.id);
    if (existing && existing.status !== updated.status) {
      const check = validateStatusTransition(existing, updated.status, activeRole);
      if (!check.allowed) {
        showPolicyAlert(check.reason || 'Workflow transition denied.');
        return;
      }
    }

    setStore((prev) => {
      const nextBays = prev.bays.map((bay) => {
        if (bay.activeJobId === updated.id && updated.bayId !== bay.id) {
          return {
            ...bay,
            status: 'Available' as const,
            activeJobId: undefined,
            assignedTechId: undefined,
          };
        }
        if (updated.bayId === bay.id) {
          if (
            updated.status === 'Invoiced' ||
            updated.status === 'Ready for Pickup'
          ) {
            return {
              ...bay,
              status: 'Available' as const,
              activeJobId: undefined,
              assignedTechId: undefined,
            };
          }
          return {
            ...bay,
            status: 'Occupied' as const,
            activeJobId: updated.id,
            assignedTechId: updated.technicianId,
          };
        }
        return bay;
      });

      return {
        ...prev,
        jobCards: prev.jobCards.map((j) => (j.id === updated.id ? updated : j)),
        bays: nextBays,
      };
    });

    recordAudit(
      'REPAIR_ORDER_UPDATED',
      'JobCard',
      `Updated ${updated.jobNumber} (${updated.status})`
    );
  };

  const handleConsumePart = (partId: string, qtyDelta: number) => {
    setStore((prev) => ({
      ...prev,
      parts: prev.parts.map((p) =>
        p.id === partId
          ? { ...p, quantity: Math.max(0, p.quantity + qtyDelta) }
          : p
      ),
    }));
  };

  const handleToggleBayMaintenance = (bayId: string) => {
    if (!can('bay:manage')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot alter Bay Maintenance status.`
      );
      return;
    }
    setStore((prev) => ({
      ...prev,
      bays: prev.bays.map((b) =>
        b.id === bayId && b.status !== 'Occupied'
          ? {
              ...b,
              status: b.status === 'Maintenance' ? 'Available' : 'Maintenance',
            }
          : b
      ),
    }));
  };

  const handleAddAppointment = (
    apt: Omit<Appointment, 'id' | 'appointmentNumber'>
  ) => {
    if (!can('bay:manage')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot book appointments.`
      );
      return;
    }
    const id = `apt-${Date.now()}`;
    const appointmentNumber = `APT-${884 + store.appointments.length}`;
    setStore((prev) => ({
      ...prev,
      appointments: [{ ...apt, id, appointmentNumber }, ...prev.appointments],
    }));
    recordAudit(
      'APPOINTMENT_BOOKED',
      'Appointment',
      `Scheduled ${appointmentNumber} for ${apt.plateNumber}`
    );
  };

  const handleCheckInAppointment = (appointmentId: string, bayId: string) => {
    if (!can('ro:create')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot check in vehicles to Repair Orders.`
      );
      return;
    }

    const apt = store.appointments.find((a) => a.id === appointmentId);
    if (!apt) return;

    const existingVeh = store.vehicles.find(
      (v) => v.plateNumber.toUpperCase() === apt.plateNumber.toUpperCase()
    );

    let vehicleId = existingVeh?.id;
    let customerId = existingVeh?.customerId;
    let newCustomers = store.customers;
    let newVehicles = store.vehicles;

    if (!existingVeh) {
      customerId = `cust-${Date.now()}`;
      const newCust: Customer = {
        id: customerId,
        name: apt.customerName,
        phone: apt.phone,
        email: `${apt.customerName.toLowerCase().replace(/\s+/g, '.')}@client.local`,
        address: 'Walk-in / Scheduled Drop-off',
        customerType: 'Individual',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      vehicleId = `veh-${Date.now()}`;
      const parts = apt.vehicleSummary.split(' ');
      const parsedYear = Number(parts[0]) || 2022;
      const parsedMake = parts[1] || 'Vehicle';
      const parsedModel = parts.slice(2).join(' ') || 'Standard';

      const newVeh: Vehicle = {
        id: vehicleId,
        customerId,
        plateNumber: apt.plateNumber,
        vin: `VIN${Date.now().toString().slice(-14)}`,
        make: parsedMake,
        model: parsedModel,
        year: parsedYear,
        fuelType: 'Petrol',
        color: 'Unlisted',
        odometerKm: 45000,
      };
      newCustomers = [newCust, ...newCustomers];
      newVehicles = [newVeh, ...newVehicles];
    }

    const freeTech =
      store.technicians.find((t) => t.status === 'Available') ||
      store.technicians[0];
    const jobId = `job-${Date.now()}`;
    const jobNumber = `RO-2026-${1045 + store.jobCards.length}`;

    const newJob: JobCard = {
      id: jobId,
      jobNumber,
      vehicleId: vehicleId!,
      customerId: customerId!,
      bayId,
      technicianId: freeTech?.id,
      status: 'Intake',
      priority: 'Standard',
      intakeDate: new Date().toISOString().slice(0, 10),
      promisedDate: apt.scheduledDate,
      odometerIn: existingVeh?.odometerKm || 45000,
      customerComplaint: `${apt.serviceType}. ${apt.notes}`.trim(),
      diagnosticNotes: '',
      obdCodes: [],
      laborItems: [
        {
          id: `l-${Date.now()}`,
          description: apt.serviceType,
          hours: 1.0,
          hourlyRate: freeTech?.hourlyRate || 850,
        },
      ],
      partsUsed: [],
      inspectionChecklist: [
        {
          id: `ic-${Date.now()}-1`,
          system: 'Intake Walkaround',
          status: 'Pass',
          notes: 'Checked in from appointment',
        },
        {
          id: `ic-${Date.now()}-2`,
          system: 'Fluids & Safety',
          status: 'Pass',
          notes: 'Pending technician check',
        },
      ],
      taxRatePercent: 18,
      discountAmount: 0,
      paymentStatus: 'Estimate',
      paidAmount: 0,
    };

    setStore((prev) => ({
      ...prev,
      customers: newCustomers,
      vehicles: newVehicles,
      jobCards: [newJob, ...prev.jobCards],
      appointments: prev.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'Checked In' } : a
      ),
      bays: prev.bays.map((b) =>
        b.id === bayId
          ? {
              ...b,
              status: 'Occupied',
              activeJobId: jobId,
              assignedTechId: freeTech?.id,
            }
          : b
      ),
    }));

    recordAudit(
      'APPOINTMENT_CHECKED_IN',
      'JobCard',
      `Checked in ${apt.appointmentNumber} as ${jobNumber}`
    );
    setSelectedJobId(jobId);
    setActiveView('job-cards');
  };

  const handleAddCustomer = (
    customer: Omit<Customer, 'id' | 'createdAt'>
  ): string => {
    const id = `cust-${Date.now()}`;
    const created: Customer = {
      ...customer,
      id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setStore((prev) => ({ ...prev, customers: [created, ...prev.customers] }));
    recordAudit('CUSTOMER_CREATED', 'Customer', `Registered client ${created.name}`);
    return id;
  };

  const handleAddVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const id = `veh-${Date.now()}`;
    setStore((prev) => ({ ...prev, vehicles: [{ ...vehicle, id }, ...prev.vehicles] }));
    recordAudit(
      'VEHICLE_REGISTERED',
      'Vehicle',
      `Added ${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})`
    );
  };

  const handleRestockPart = (partId: string, addQty: number) => {
    if (!can('inventory:manage')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot restock warehouse inventory.`
      );
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setStore((prev) => ({
      ...prev,
      parts: prev.parts.map((p) =>
        p.id === partId
          ? { ...p, quantity: p.quantity + addQty, lastRestocked: today }
          : p
      ),
    }));
    recordAudit(
      'PART_RESTOCKED',
      'PartItem',
      `Added +${addQty} units to inventory SKU (${partId})`
    );
  };

  const handleAddPart = (part: Omit<PartItem, 'id' | 'lastRestocked'>) => {
    if (!can('inventory:manage')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot add inventory SKUs.`
      );
      return;
    }
    const id = `part-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    setStore((prev) => ({
      ...prev,
      parts: [{ ...part, id, lastRestocked: today }, ...prev.parts],
    }));
    recordAudit('PART_SKU_CREATED', 'PartItem', `Created SKU ${part.sku}`);
  };

  const handleAddTechnician = (
    tech: Omit<Technician, 'id' | 'completedJobsMonth'>
  ) => {
    if (!can('technician:manage')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot add technicians.`
      );
      return;
    }
    const quota = checkQuota('technicians', store.technicians.length);
    if (!quota.allowed) {
      showPolicyAlert(
        `SaaS Quota Reached: ${activePlan.name} allows up to ${quota.limit} technicians. Upgrade plan in SaaS & Licensing.`
      );
      return;
    }
    const id = `tech-${Date.now()}`;
    setStore((prev) => ({
      ...prev,
      technicians: [
        ...prev.technicians,
        { ...tech, id, completedJobsMonth: 0 },
      ],
    }));
    recordAudit('TECHNICIAN_ADDED', 'Technician', `Added technician ${tech.name}`);
  };

  const handleUpdateTechStatus = (
    techId: string,
    status: Technician['status']
  ) => {
    setStore((prev) => ({
      ...prev,
      technicians: prev.technicians.map((t) =>
        t.id === techId ? { ...t, status } : t
      ),
    }));
  };

  const handleRecordPayment = (
    jobId: string,
    amount: number,
    method: NonNullable<JobCard['paymentMethod']>
  ) => {
    if (!can('billing:collect')) {
      showPolicyAlert(
        `RBAC Policy: Role "${activeRole}" cannot collect payments or finalize GST invoices.`
      );
      return;
    }

    setStore((prev) => ({
      ...prev,
      jobCards: prev.jobCards.map((j) => {
        if (j.id !== jobId) return j;
        const total = calculateJobTotals(j).grandTotal;
        const nextPaid = Math.min(total, j.paidAmount + amount);
        const paymentStatus =
          nextPaid >= total - 0.01
            ? 'Paid'
            : nextPaid > 0
            ? 'Partial'
            : 'Unpaid';
        return {
          ...j,
          paidAmount: nextPaid,
          paymentMethod: method,
          paymentStatus,
          status: paymentStatus === 'Paid' ? 'Invoiced' : j.status,
        };
      }),
    }));

    recordAudit(
      'PAYMENT_RECORDED',
      'JobCard',
      `Recorded ₹${amount.toFixed(2)} via ${method} for job ${jobId}`
    );
  };

  const handleImportPreset = (preset: WorkshopPresetTemplate) => {
    if (!can('github:sync') || !activePlan.githubSyncEnabled) {
      showPolicyAlert(
        !activePlan.githubSyncEnabled
          ? `SaaS Entitlement: GitHub Catalog Sync requires Multi-Bay Pro or Enterprise plan.`
          : `RBAC Policy: Role "${activeRole}" cannot import GitHub catalog presets.`
      );
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setStore((prev) => {
      const existingSkus = new Set(prev.parts.map((p) => p.sku));
      const importedParts: PartItem[] = preset.partsPack
        .filter((p) => !existingSkus.has(p.sku))
        .map((p, idx) => ({
          ...p,
          id: `part-gh-${Date.now()}-${idx}`,
          lastRestocked: today,
        }));

      return {
        ...prev,
        parts: [...importedParts, ...prev.parts],
        activeLinkedRepo: preset.repoFullName,
      };
    });
    recordAudit(
      'GITHUB_CATALOG_IMPORTED',
      'PartItem',
      `Imported catalog preset from ${preset.repoFullName}`
    );
  };

  const handleSyncWorkspaceCloud = async () => {
    await provisionActiveTenantCloud();
    await syncTenantOperationalBundle(activeTenant.id, {
      customers: store.customers,
      vehicles: store.vehicles,
      jobCards: store.jobCards,
      parts: store.parts,
      appointments: store.appointments,
    });
    recordAudit(
      'CLOUD_BUNDLE_SYNCED',
      'Tenant',
      `Synced ${store.jobCards.length} ROs and ${store.parts.length} SKUs to Firestore`
    );
  };

  const counts = {
    activeJobs: store.jobCards.filter((j) => j.status !== 'Invoiced').length,
    lowStock: store.parts.filter((p) => p.quantity <= p.reorderLevel).length,
    scheduledAppointments: store.appointments.filter(
      (a) => a.status === 'Scheduled'
    ).length,
    unpaidInvoices: store.jobCards.filter(
      (j) => j.paymentStatus === 'Unpaid' || j.paymentStatus === 'Partial'
    ).length,
  };

  return (
    <div className="min-h-screen tb-canvas flex">
      <SidebarNav
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        counts={counts}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb + Tenant Selector Left / Primary Actions Right */}
        <header className="no-print h-16 tb-surface border-t-0 border-l-0 border-r-0 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-md"
              style={{ color: 'var(--tb-text-secondary)' }}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span
                className="hidden sm:inline whitespace-nowrap font-semibold"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                WRKFLW
              </span>
              <span
                className="hidden sm:inline"
                style={{ color: 'var(--tb-border-strong)' }}
              >
                /
              </span>
              <select
                aria-label="Select SaaS tenant branch"
                value={activeTenant.id}
                onChange={(e) => switchTenant(e.target.value)}
                className="hidden md:inline-block tb-input h-7 px-2 rounded-md text-xs font-mono font-semibold max-w-[180px] truncate"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} · {t.city}
                  </option>
                ))}
              </select>
              <span
                className="hidden md:inline"
                style={{ color: 'var(--tb-border-strong)' }}
              >
                /
              </span>
              <h1 className="font-display font-semibold truncate whitespace-nowrap">
                {VIEW_LABELS[activeView]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="tb-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0"
            >
              <Palette
                className="w-4 h-4"
                strokeWidth={1.75}
                style={{ color: 'var(--tb-accent)' }}
              />
              Themes
            </button>
            <button
              type="button"
              onClick={handleTriggerNewJob}
              className="tb-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              New Repair Order
            </button>
          </div>
        </header>

        {/* Live RBAC / SaaS Quota Enforcement Notice */}
        {policyNotice && (
          <div className="no-print px-4 sm:px-8 pt-4 max-w-[1440px] w-full mx-auto">
            <div
              className="rounded-lg border px-4 py-2.5 text-xs flex items-center justify-between gap-3"
              style={{
                backgroundColor: 'var(--tb-surface-solid)',
                borderColor: 'var(--tb-accent)',
                color: 'var(--tb-text)',
              }}
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <AlertCircle
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--tb-accent)' }}
                />
                {policyNotice}
              </span>
              <button
                type="button"
                onClick={() => setActiveView('saas-console')}
                className="text-xs font-semibold hover:underline whitespace-nowrap shrink-0"
                style={{ color: 'var(--tb-accent)' }}
              >
                Open SaaS &amp; Licensing
              </button>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto">
          {activeView === 'overview' && (
            <OverviewView
              jobCards={store.jobCards}
              bays={store.bays}
              vehicles={store.vehicles}
              customers={store.customers}
              parts={store.parts}
              technicians={store.technicians}
              appointments={store.appointments}
              activeLinkedRepo={store.activeLinkedRepo}
              onNavigate={(v) => setActiveView(v)}
              onOpenJobCard={handleOpenJobCard}
              onOpenJobsByStatus={handleOpenJobsByStatus}
              onTriggerNewJob={handleTriggerNewJob}
            />
          )}

          {activeView === 'job-cards' && (
            <JobCardsView
              jobCards={store.jobCards}
              vehicles={store.vehicles}
              customers={store.customers}
              bays={store.bays}
              technicians={store.technicians}
              parts={store.parts}
              selectedJobId={selectedJobId}
              onSelectJobId={setSelectedJobId}
              onCreateJobCard={handleCreateJobCard}
              onUpdateJobCard={handleUpdateJobCard}
              onConsumePart={handleConsumePart}
              openCreateModalSignal={openCreateJobSignal}
              initialStatusFilter={jobStatusFilter}
              statusFilterSignal={jobStatusFilterSignal}
            />
          )}

          {activeView === 'bays-appointments' && (
            <BaysAppointmentsView
              bays={store.bays}
              appointments={store.appointments}
              technicians={store.technicians}
              jobCards={store.jobCards}
              onToggleBayMaintenance={handleToggleBayMaintenance}
              onAddAppointment={handleAddAppointment}
              onCheckInAppointment={handleCheckInAppointment}
              onOpenJobCard={handleOpenJobCard}
            />
          )}

          {activeView === 'vehicles-customers' && (
            <VehiclesCustomersView
              vehicles={store.vehicles}
              customers={store.customers}
              jobCards={store.jobCards}
              onAddCustomer={handleAddCustomer}
              onAddVehicle={handleAddVehicle}
              onOpenJobCard={handleOpenJobCard}
            />
          )}

          {activeView === 'parts-inventory' && (
            <InventoryView
              parts={store.parts}
              onRestockPart={handleRestockPart}
              onAddPart={handleAddPart}
            />
          )}

          {activeView === 'technicians' && (
            <TechniciansView
              technicians={store.technicians}
              bays={store.bays}
              jobCards={store.jobCards}
              onAddTechnician={handleAddTechnician}
              onUpdateStatus={handleUpdateTechStatus}
            />
          )}

          {activeView === 'billing' && (
            <BillingView
              jobCards={store.jobCards}
              vehicles={store.vehicles}
              customers={store.customers}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {activeView === 'github-repos' && (
            <GitHubReposView
              activeLinkedRepo={store.activeLinkedRepo}
              onLinkRepo={(repo) =>
                setStore((prev) => ({ ...prev, activeLinkedRepo: repo }))
              }
              onImportPreset={handleImportPreset}
            />
          )}

          {activeView === 'saas-console' && (
            <SaasConsoleView
              currentBayCount={store.bays.length}
              currentTechCount={store.technicians.length}
              currentActiveJobsCount={counts.activeJobs}
              onSyncWorkspaceCloud={handleSyncWorkspaceCloud}
            />
          )}
        </main>
      </div>

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WorkshopThemeProvider>
        <SaasProvider>
          <WorkshopShell />
        </SaasProvider>
      </WorkshopThemeProvider>
    </ErrorBoundary>
  );
}
