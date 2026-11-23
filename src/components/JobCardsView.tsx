import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Printer,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  Customer,
  JobCard,
  JobStatus,
  PartItem,
  PriorityLevel,
  ServiceBay,
  Technician,
  Vehicle,
} from '../types';
import { calculateJobTotals, formatINR } from '../data/workshopSeed';

interface JobCardsViewProps {
  jobCards: JobCard[];
  vehicles: Vehicle[];
  customers: Customer[];
  bays: ServiceBay[];
  technicians: Technician[];
  parts: PartItem[];
  selectedJobId: string | null;
  onSelectJobId: (id: string | null) => void;
  onCreateJobCard: (newJob: Omit<JobCard, 'id' | 'jobNumber'>) => void;
  onUpdateJobCard: (updated: JobCard) => void;
  onConsumePart: (partId: string, qtyDelta: number) => void;
  openCreateModalSignal: number;
  initialStatusFilter?: 'All' | JobStatus;
  statusFilterSignal?: number;
}

const JOB_STATUSES: ('All' | JobStatus)[] = [
  'All',
  'Intake',
  'Diagnostics',
  'Awaiting Parts',
  'In Repair',
  'Quality Check',
  'Ready for Pickup',
  'Invoiced',
];

const WORKFLOW_ORDER: JobStatus[] = [
  'Intake',
  'Diagnostics',
  'Awaiting Parts',
  'In Repair',
  'Quality Check',
  'Ready for Pickup',
  'Invoiced',
];

export default function JobCardsView({
  jobCards,
  vehicles,
  customers,
  bays,
  technicians,
  parts,
  selectedJobId,
  onSelectJobId,
  onCreateJobCard,
  onUpdateJobCard,
  onConsumePart,
  openCreateModalSignal,
  initialStatusFilter = 'All',
  statusFilterSignal = 0,
}: JobCardsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | JobStatus>(initialStatusFilter);
  const [isCreating, setIsCreating] = useState(false);

  const [newVehicleId, setNewVehicleId] = useState(vehicles[0]?.id || '');
  const [newBayId, setNewBayId] = useState('');
  const [newTechId, setNewTechId] = useState(technicians[0]?.id || '');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('Standard');
  const [newComplaint, setNewComplaint] = useState('');
  const [newPromisedDate, setNewPromisedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );

  const [laborDesc, setLaborDesc] = useState('');
  const [laborHours, setLaborHours] = useState('1.0');
  const [laborRate, setLaborRate] = useState('850');
  const [selectedPartId, setSelectedPartId] = useState(parts[0]?.id || '');
  const [partQty, setPartQty] = useState('1');

  useEffect(() => {
    if (statusFilterSignal > 0) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter, statusFilterSignal]);

  useEffect(() => {
    if (openCreateModalSignal > 0) {
      setIsCreating(true);
    }
  }, [openCreateModalSignal]);

  const activeJob = selectedJobId
    ? jobCards.find((j) => j.id === selectedJobId) || null
    : null;

  const filteredJobs = jobCards.filter((job) => {
    const vehicle = vehicles.find((v) => v.id === job.vehicleId);
    const customer = customers.find((c) => c.id === job.customerId);
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      job.jobNumber.toLowerCase().includes(q) ||
      job.customerComplaint.toLowerCase().includes(q) ||
      vehicle?.plateNumber.toLowerCase().includes(q) ||
      `${vehicle?.make} ${vehicle?.model}`.toLowerCase().includes(q) ||
      customer?.name.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === newVehicleId);
    if (!vehicle) return;

    onCreateJobCard({
      vehicleId: vehicle.id,
      customerId: vehicle.customerId,
      bayId: newBayId || undefined,
      technicianId: newTechId || undefined,
      status: 'Intake',
      priority: newPriority,
      intakeDate: new Date().toISOString().slice(0, 10),
      promisedDate: newPromisedDate,
      odometerIn: vehicle.odometerKm,
      customerComplaint:
        newComplaint.trim() || 'Routine multi-point inspection and diagnostic check.',
      diagnosticNotes: '',
      obdCodes: [],
      laborItems: [
        {
          id: `l-${Date.now()}`,
          description: 'Initial Vehicle Intake & Multi-Point Inspection',
          hours: 0.5,
          hourlyRate: 750,
        },
      ],
      partsUsed: [],
      inspectionChecklist: [
        { id: `ic-${Date.now()}-1`, system: 'Engine & Fluids', status: 'Pass', notes: 'Checked at intake' },
        { id: `ic-${Date.now()}-2`, system: 'Brakes & Tires', status: 'Pass', notes: 'Visual check complete' },
        { id: `ic-${Date.now()}-3`, system: 'Battery & Electrical', status: 'Pass', notes: 'Voltage verified' },
      ],
      taxRatePercent: 18,
      discountAmount: 0,
      paymentStatus: 'Estimate',
      paidAmount: 0,
    });

    setNewComplaint('');
    setIsCreating(false);
  };

  const handleAddLabor = (job: JobCard) => {
    if (!laborDesc.trim()) return;
    const hrs = Math.max(0.25, Number(laborHours) || 1);
    const rate = Math.max(100, Number(laborRate) || 850);
    onUpdateJobCard({
      ...job,
      laborItems: [
        ...job.laborItems,
        {
          id: `l-${Date.now()}`,
          description: laborDesc.trim(),
          hours: hrs,
          hourlyRate: rate,
        },
      ],
    });
    setLaborDesc('');
  };

  const handleAddPart = (job: JobCard) => {
    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) return;
    const qty = Math.max(1, Number(partQty) || 1);
    if (part.quantity < qty) return;

    onConsumePart(part.id, -qty);
    onUpdateJobCard({
      ...job,
      partsUsed: [
        ...job.partsUsed,
        {
          id: `pu-${Date.now()}`,
          partId: part.id,
          sku: part.sku,
          name: part.name,
          quantity: qty,
          unitPrice: part.sellingPrice,
        },
      ],
    });
  };

  const handleAdvanceStatus = (job: JobCard) => {
    const idx = WORKFLOW_ORDER.indexOf(job.status);
    if (idx >= 0 && idx < WORKFLOW_ORDER.length - 1) {
      const nextStatus = WORKFLOW_ORDER[idx + 1];
      onUpdateJobCard({
        ...job,
        status: nextStatus,
        paymentStatus:
          nextStatus === 'Invoiced' && job.paymentStatus === 'Estimate'
            ? 'Unpaid'
            : job.paymentStatus,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="no-print flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--tb-text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search job #, plate, vehicle, or customer..."
            className="tb-input w-full h-10 pl-9 pr-4 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0">
          <div
            className="flex items-center gap-1 p-1 rounded-lg shrink-0"
            style={{ backgroundColor: 'var(--tb-surface-muted)' }}
          >
            {JOB_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
                style={
                  statusFilter === status
                    ? {
                        backgroundColor: 'var(--tb-surface-solid)',
                        color: 'var(--tb-text)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      }
                    : { color: 'var(--tb-text-muted)' }
                }
              >
                {status}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="tb-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Job Card
          </button>
        </div>
      </div>

      {/* Job Cards Table */}
      <div className="no-print tb-surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-xs font-medium"
                style={{
                  borderColor: 'var(--tb-border)',
                  backgroundColor: 'var(--tb-surface-muted)',
                  color: 'var(--tb-text-muted)',
                }}
              >
                <th className="py-3 px-4">Job #</th>
                <th className="py-3 px-4">Vehicle &amp; Plate</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Bay / Tech</th>
                <th className="py-3 px-4">Workflow Stage</th>
                <th className="py-3 px-4 text-right">Estimate / Total</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: 'var(--tb-border)' }}>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    No job cards match the current filter.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                  const customer = customers.find((c) => c.id === job.customerId);
                  const bay = bays.find((b) => b.id === job.bayId);
                  const tech = technicians.find((t) => t.id === job.technicianId);
                  const totals = calculateJobTotals(job);

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJobId(job.id)}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderColor: 'var(--tb-border)',
                        backgroundColor:
                          selectedJobId === job.id
                            ? 'var(--tb-accent-soft)'
                            : 'transparent',
                      }}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold whitespace-nowrap">
                        {job.jobNumber}
                        <div
                          className="text-[11px] font-sans font-normal"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          {job.priority} · {job.intakeDate}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium">
                          {vehicle
                            ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                            : 'Unknown Vehicle'}
                        </div>
                        <div
                          className="text-xs font-mono"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          {vehicle?.plateNumber} · {job.odometerIn.toLocaleString()} km
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{customer?.name || 'Walk-in'}</div>
                        <div
                          className="text-xs truncate max-w-[200px]"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          {job.customerComplaint}
                        </div>
                      </td>
                      <td
                        className="py-3.5 px-4 text-xs whitespace-nowrap"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <div className="font-medium">
                          {bay ? bay.code : 'Unassigned'}
                        </div>
                        <div style={{ color: 'var(--tb-text-muted)' }}>
                          {tech ? tech.name : 'No tech'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            job.status === 'Ready for Pickup' ||
                            job.status === 'Invoiced'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : job.status === 'Awaiting Parts'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {job.status === 'Ready for Pickup' ||
                          job.status === 'Invoiced' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : job.status === 'Awaiting Parts' ? (
                            <AlertCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="font-semibold">
                          {formatINR(totals.grandTotal, 2)}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          {job.paymentStatus}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJobId(job.id);
                          }}
                          className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--tb-accent)' }}
                        >
                          Inspect
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Card Inspector & Editor Modal */}
      {activeJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="print-container tb-surface-solid rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto workshop-scroll">
            {(() => {
              const vehicle = vehicles.find((v) => v.id === activeJob.vehicleId);
              const customer = customers.find((c) => c.id === activeJob.customerId);
              const totals = calculateJobTotals(activeJob);

              return (
                <div className="p-6 space-y-6">
                  <div
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div>
                      <div
                        className="flex items-center gap-2 text-xs font-mono"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        <span
                          className="font-semibold"
                          style={{ color: 'var(--tb-text)' }}
                        >
                          {activeJob.jobNumber}
                        </span>
                        <span>·</span>
                        <span>Intake {activeJob.intakeDate}</span>
                        <span>·</span>
                        <span>Promised {activeJob.promisedDate}</span>
                      </div>
                      <h2 className="text-xl font-display font-bold mt-1">
                        {vehicle
                          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                          : 'Vehicle'}{' '}
                        ({vehicle?.plateNumber})
                      </h2>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Owner: {customer?.name} · {customer?.phone} · Odometer:{' '}
                        {activeJob.odometerIn.toLocaleString()} km
                      </p>
                    </div>

                    <div className="no-print flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="tb-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Sheet
                      </button>
                      {activeJob.status !== 'Invoiced' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(activeJob)}
                          className="tb-btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
                        >
                          Advance Stage
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectJobId(null)}
                        className="p-2 rounded-lg hover:opacity-75"
                        aria-label="Close job card inspector"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Assignment Controls */}
                  <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Workflow Stage
                      </label>
                      <select
                        value={activeJob.status}
                        onChange={(e) =>
                          onUpdateJobCard({
                            ...activeJob,
                            status: e.target.value as JobStatus,
                          })
                        }
                        className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                      >
                        {WORKFLOW_ORDER.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Assigned Service Bay
                      </label>
                      <select
                        value={activeJob.bayId || ''}
                        onChange={(e) =>
                          onUpdateJobCard({
                            ...activeJob,
                            bayId: e.target.value || undefined,
                          })
                        }
                        className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                      >
                        <option value="">Unassigned</option>
                        {bays.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code} — {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Lead Technician
                      </label>
                      <select
                        value={activeJob.technicianId || ''}
                        onChange={(e) =>
                          onUpdateJobCard({
                            ...activeJob,
                            technicianId: e.target.value || undefined,
                          })
                        }
                        className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                      >
                        <option value="">Unassigned</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Complaint & Diagnostics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        className="block text-xs font-medium"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Customer Complaint
                      </label>
                      <textarea
                        rows={3}
                        value={activeJob.customerComplaint}
                        onChange={(e) =>
                          onUpdateJobCard({
                            ...activeJob,
                            customerComplaint: e.target.value,
                          })
                        }
                        className="tb-input w-full p-3 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="block text-xs font-medium"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Technician Diagnostic Notes
                      </label>
                      <textarea
                        rows={3}
                        value={activeJob.diagnosticNotes}
                        onChange={(e) =>
                          onUpdateJobCard({
                            ...activeJob,
                            diagnosticNotes: e.target.value,
                          })
                        }
                        placeholder="Record fault codes, measurements, and repair findings..."
                        className="tb-input w-full p-3 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Labor Operations Table */}
                  <div
                    className="space-y-3 pt-2 border-t"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <h3 className="text-sm font-semibold">Labor Operations</h3>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr
                          className="border-b text-xs"
                          style={{
                            borderColor: 'var(--tb-border)',
                            color: 'var(--tb-text-muted)',
                          }}
                        >
                          <th className="py-2 text-left">Operation Description</th>
                          <th className="py-2 text-right">Hours</th>
                          <th className="py-2 text-right">Rate</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="no-print py-2 w-8" />
                        </tr>
                      </thead>
                      <tbody
                        className="divide-y"
                        style={{ borderColor: 'var(--tb-border)' }}
                      >
                        {activeJob.laborItems.map((item) => (
                          <tr key={item.id} style={{ borderColor: 'var(--tb-border)' }}>
                            <td className="py-2">{item.description}</td>
                            <td
                              className="py-2 text-right font-mono tabular-nums"
                              style={{ color: 'var(--tb-text-secondary)' }}
                            >
                              {item.hours.toFixed(2)}
                            </td>
                            <td
                              className="py-2 text-right font-mono tabular-nums"
                              style={{ color: 'var(--tb-text-secondary)' }}
                            >
                              {formatINR(item.hourlyRate, 2)}
                            </td>
                            <td className="py-2 text-right font-mono tabular-nums font-medium">
                              {formatINR(item.hours * item.hourlyRate, 2)}
                            </td>
                            <td className="no-print py-2 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateJobCard({
                                    ...activeJob,
                                    laborItems: activeJob.laborItems.filter(
                                      (l) => l.id !== item.id
                                    ),
                                  })
                                }
                                className="hover:text-red-600"
                                style={{ color: 'var(--tb-text-muted)' }}
                                aria-label="Remove labor line"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="no-print flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={laborDesc}
                        onChange={(e) => setLaborDesc(e.target.value)}
                        placeholder="Add labor task (e.g., Timing belt replacement)"
                        className="tb-input flex-1 min-w-[200px] h-9 px-3 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        step="0.25"
                        value={laborHours}
                        onChange={(e) => setLaborHours(e.target.value)}
                        placeholder="Hrs"
                        className="tb-input w-20 h-9 px-2.5 rounded-lg text-xs font-mono"
                      />
                      <input
                        type="number"
                        value={laborRate}
                        onChange={(e) => setLaborRate(e.target.value)}
                        placeholder="₹/hr"
                        className="tb-input w-24 h-9 px-2.5 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddLabor(activeJob)}
                        className="tb-btn-secondary px-3 h-9 rounded-lg text-xs font-semibold whitespace-nowrap"
                      >
                        Add Labor
                      </button>
                    </div>
                  </div>

                  {/* Parts Consumed Table */}
                  <div
                    className="space-y-3 pt-2 border-t"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <h3 className="text-sm font-semibold">
                      Parts &amp; Consumables
                    </h3>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr
                          className="border-b text-xs"
                          style={{
                            borderColor: 'var(--tb-border)',
                            color: 'var(--tb-text-muted)',
                          }}
                        >
                          <th className="py-2 text-left">SKU / Part Name</th>
                          <th className="py-2 text-right">Qty</th>
                          <th className="py-2 text-right">Unit Price</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="no-print py-2 w-8" />
                        </tr>
                      </thead>
                      <tbody
                        className="divide-y"
                        style={{ borderColor: 'var(--tb-border)' }}
                      >
                        {activeJob.partsUsed.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-3 text-xs"
                              style={{ color: 'var(--tb-text-muted)' }}
                            >
                              No spare parts billed to this work order yet.
                            </td>
                          </tr>
                        ) : (
                          activeJob.partsUsed.map((partLine) => (
                            <tr
                              key={partLine.id}
                              style={{ borderColor: 'var(--tb-border)' }}
                            >
                              <td className="py-2">
                                <span
                                  className="font-mono text-xs mr-2"
                                  style={{ color: 'var(--tb-text-muted)' }}
                                >
                                  {partLine.sku}
                                </span>
                                {partLine.name}
                              </td>
                              <td
                                className="py-2 text-right font-mono tabular-nums"
                                style={{ color: 'var(--tb-text-secondary)' }}
                              >
                                {partLine.quantity}
                              </td>
                              <td
                                className="py-2 text-right font-mono tabular-nums"
                                style={{ color: 'var(--tb-text-secondary)' }}
                              >
                                {formatINR(partLine.unitPrice, 2)}
                              </td>
                              <td className="py-2 text-right font-mono tabular-nums font-medium">
                                {formatINR(partLine.quantity * partLine.unitPrice, 2)}
                              </td>
                              <td className="no-print py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onConsumePart(partLine.partId, partLine.quantity);
                                    onUpdateJobCard({
                                      ...activeJob,
                                      partsUsed: activeJob.partsUsed.filter(
                                        (p) => p.id !== partLine.id
                                      ),
                                    });
                                  }}
                                  className="hover:text-red-600"
                                  style={{ color: 'var(--tb-text-muted)' }}
                                  aria-label="Remove part and restore stock"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    <div className="no-print flex flex-wrap items-center gap-2">
                      <select
                        value={selectedPartId}
                        onChange={(e) => setSelectedPartId(e.target.value)}
                        className="tb-input flex-1 min-w-[220px] h-9 px-3 rounded-lg text-xs"
                      >
                        {parts.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                            {p.sku} — {p.name} ({p.quantity} in stock · {formatINR(p.sellingPrice)})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={partQty}
                        onChange={(e) => setPartQty(e.target.value)}
                        className="tb-input w-20 h-9 px-2.5 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddPart(activeJob)}
                        className="tb-btn-secondary px-3 h-9 rounded-lg text-xs font-semibold whitespace-nowrap"
                      >
                        Issue Part
                      </button>
                    </div>
                  </div>

                  {/* Multi-Point Inspection Checklist */}
                  <div
                    className="space-y-3 pt-2 border-t"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <h3 className="text-sm font-semibold">
                      Safety &amp; Mechanical Inspection Checklist
                    </h3>
                    <div
                      className="divide-y border rounded-lg"
                      style={{ borderColor: 'var(--tb-border)' }}
                    >
                      {activeJob.inspectionChecklist.map((check) => (
                        <div
                          key={check.id}
                          className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          style={{ borderColor: 'var(--tb-border)' }}
                        >
                          <div>
                            <p className="font-semibold">{check.system}</p>
                            <p style={{ color: 'var(--tb-text-muted)' }}>
                              {check.notes}
                            </p>
                          </div>
                          <div
                            className="no-print flex items-center gap-1 p-0.5 rounded-md shrink-0"
                            style={{ backgroundColor: 'var(--tb-surface-muted)' }}
                          >
                            {(['Pass', 'Monitor', 'Fail'] as const).map((state) => (
                              <button
                                key={state}
                                type="button"
                                onClick={() =>
                                  onUpdateJobCard({
                                    ...activeJob,
                                    inspectionChecklist:
                                      activeJob.inspectionChecklist.map((c) =>
                                        c.id === check.id ? { ...c, status: state } : c
                                      ),
                                  })
                                }
                                className={`px-2.5 py-1 rounded text-xs font-medium ${
                                  check.status === state
                                    ? state === 'Pass'
                                      ? 'bg-emerald-600 text-white'
                                      : state === 'Monitor'
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-red-600 text-white'
                                    : ''
                                }`}
                                style={
                                  check.status !== state
                                    ? { color: 'var(--tb-text-muted)' }
                                    : undefined
                                }
                              >
                                {state}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals Summary Footer */}
                  <div
                    className="pt-4 border-t flex flex-col sm:flex-row sm:items-end justify-between gap-4"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div
                      className="text-xs"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      {activeJob.sourceRepoRef && (
                        <span>Workflow Schema: {activeJob.sourceRepoRef}</span>
                      )}
                    </div>
                    <div className="w-full sm:w-72 space-y-1.5 text-sm">
                      <div
                        className="flex justify-between"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <span>Labor Subtotal</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(totals.laborSubtotal, 2)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <span>Parts Subtotal</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(totals.partsSubtotal, 2)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <span>GST ({activeJob.taxRatePercent}%)</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(totals.taxAmount, 2)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between font-bold pt-2 border-t text-base"
                        style={{ borderColor: 'var(--tb-border)' }}
                      >
                        <span>Grand Total</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(totals.grandTotal, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create Job Card Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="tb-surface-solid rounded-xl w-full max-w-lg p-6 space-y-4"
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <h2 className="text-lg font-display font-bold">
                Create New Job Card
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-md"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Vehicle
                </label>
                <select
                  required
                  value={newVehicleId}
                  onChange={(e) => setNewVehicleId(e.target.value)}
                  className="tb-input w-full h-10 px-3 rounded-lg text-sm"
                >
                  {vehicles.map((v) => {
                    const owner = customers.find((c) => c.id === v.customerId);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} — {v.year} {v.make} {v.model} ({owner?.name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    Assign Bay (Optional)
                  </label>
                  <select
                    value={newBayId}
                    onChange={(e) => setNewBayId(e.target.value)}
                    className="tb-input w-full h-10 px-3 rounded-lg text-sm"
                  >
                    <option value="">Assign later</option>
                    {bays
                      .filter((b) => b.status === 'Available')
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} — {b.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    Technician
                  </label>
                  <select
                    value={newTechId}
                    onChange={(e) => setNewTechId(e.target.value)}
                    className="tb-input w-full h-10 px-3 rounded-lg text-sm"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="tb-input w-full h-10 px-3 rounded-lg text-sm"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Priority">Priority</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    Promised Completion
                  </label>
                  <input
                    type="date"
                    value={newPromisedDate}
                    onChange={(e) => setNewPromisedDate(e.target.value)}
                    className="tb-input w-full h-10 px-3 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Reported Issue / Service Request
                </label>
                <textarea
                  required
                  rows={3}
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  placeholder="Describe symptoms, noises, warning lights, or requested maintenance..."
                  className="tb-input w-full p-3 rounded-lg text-sm"
                />
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-2 pt-3 border-t"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-medium"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tb-btn-primary px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Open Job Card
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
