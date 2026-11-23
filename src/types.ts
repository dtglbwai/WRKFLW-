/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 * Unauthorized copying, distribution, or replication without prior written permission is prohibited.
 */

export type JobStatus =
  | 'Intake'
  | 'Diagnostics'
  | 'Awaiting Parts'
  | 'In Repair'
  | 'Quality Check'
  | 'Ready for Pickup'
  | 'Invoiced';

export type PriorityLevel = 'Standard' | 'Priority' | 'Urgent';

export type BayStatus = 'Occupied' | 'Available' | 'Maintenance';

export type SaasPlanId = 'starter' | 'pro' | 'enterprise';

export type SaasRole =
  | 'Platform Owner'
  | 'Workshop Admin'
  | 'Service Advisor'
  | 'Master Technician'
  | 'Inventory Manager'
  | 'Billing Accountant';

export type PermissionAction =
  | 'ro:create'
  | 'ro:update'
  | 'bay:manage'
  | 'inventory:manage'
  | 'technician:manage'
  | 'billing:collect'
  | 'github:sync'
  | 'saas:admin';

export interface SaasPlanTier {
  id: SaasPlanId;
  name: string;
  audience: string;
  monthlyPriceInr: number;
  maxBays: number;
  maxTechnicians: number;
  maxActiveJobs: number;
  maxBranches: number;
  githubSyncEnabled: boolean;
  cloudAuditRetentionDays: number;
}

export interface TenantWorkspace {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  gstin: string;
  phone: string;
  planId: SaasPlanId;
  ownerUid: string;
  ownerEmail: string;
  ownershipCode: string;
  createdAt: string;
}

export interface TenantMember {
  uid: string;
  displayName: string;
  email: string;
  role: SaasRole;
  status: 'Active' | 'Suspended';
  assignedAt: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorUid: string;
  actorEmail: string;
  actorRole: SaasRole;
  action: string;
  targetType: string;
  summary: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customerType: 'Individual' | 'Fleet';
  companyName?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  plateNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  fuelType: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  color: string;
  odometerKm: number;
  lastServiceDate?: string;
}

export interface Technician {
  id: string;
  name: string;
  role:
    | 'Master Technician'
    | 'Diagnostic Specialist'
    | 'Brake & Suspension Tech'
    | 'Electrical Tech'
    | 'Quick Service Tech'
    | 'Service Advisor';
  specialty: string;
  phone: string;
  hourlyRate: number;
  status: 'On Bay' | 'Available' | 'Off Duty';
  assignedBayId?: string;
  completedJobsMonth: number;
  certifications: string[];
}

export interface ServiceBay {
  id: string;
  code: string;
  name: string;
  bayType:
    | 'Hydraulic Lift'
    | 'Diagnostics'
    | 'Quick Lube'
    | 'Alignment'
    | 'Body & Paint';
  status: BayStatus;
  activeJobId?: string;
  assignedTechId?: string;
}

export interface PartItem {
  id: string;
  sku: string;
  name: string;
  category:
    | 'Engine & Filters'
    | 'Brakes & Suspension'
    | 'Electrical & Battery'
    | 'Fluids & Lubricants'
    | 'Belts & Cooling'
    | 'Tires & Alignment';
  brand: string;
  binLocation: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  supplierName: string;
  supplierPhone: string;
  lastRestocked: string;
}

export interface JobLaborItem {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
}

export interface JobPartLine {
  id: string;
  partId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface InspectionCheckItem {
  id: string;
  system: string;
  status: 'Pass' | 'Monitor' | 'Fail';
  notes: string;
}

export interface JobCard {
  id: string;
  jobNumber: string;
  vehicleId: string;
  customerId: string;
  bayId?: string;
  technicianId?: string;
  status: JobStatus;
  priority: PriorityLevel;
  intakeDate: string;
  promisedDate: string;
  odometerIn: number;
  customerComplaint: string;
  diagnosticNotes: string;
  obdCodes: string[];
  laborItems: JobLaborItem[];
  partsUsed: JobPartLine[];
  inspectionChecklist: InspectionCheckItem[];
  taxRatePercent: number;
  discountAmount: number;
  paymentStatus: 'Estimate' | 'Unpaid' | 'Partial' | 'Paid';
  paidAmount: number;
  paymentMethod?: 'Card' | 'Cash' | 'Bank Transfer' | 'UPI';
  sourceRepoRef?: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  customerName: string;
  phone: string;
  plateNumber: string;
  vehicleSummary: string;
  serviceType: string;
  scheduledDate: string;
  timeSlot: string;
  preferredBayType: ServiceBay['bayType'];
  status: 'Scheduled' | 'Checked In' | 'Completed' | 'Cancelled';
  notes: string;
}

export interface GitHubRepoSummary {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  updated_at: string;
  topics?: string[];
  license?: {
    spdx_id: string;
    name: string;
  } | null;
}

export interface GitHubContentEntry {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size: number;
  html_url: string;
  download_url: string | null;
}

export interface WorkshopPresetTemplate {
  id: string;
  repoFullName: string;
  title: string;
  architectureNotes: string;
  laborRates: { description: string; hours: number; hourlyRate: number }[];
  partsPack: Omit<PartItem, 'id' | 'lastRestocked'>[];
  inspectionTemplate: { system: string; defaultNotes: string }[];
}

export type ActiveView =
  | 'overview'
  | 'job-cards'
  | 'bays-appointments'
  | 'vehicles-customers'
  | 'parts-inventory'
  | 'technicians'
  | 'billing'
  | 'github-repos'
  | 'saas-console';
