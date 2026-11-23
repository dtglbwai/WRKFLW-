import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarClock,
  Car,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Gauge,
  GitBranch,
  MapPin,
  Package,
  Phone,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
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
} from '../types';
import { calculateJobTotals, formatINR } from '../data/workshopSeed';
import { useWorkshopTheme, WORKSHOP_THEMES } from '../context/ThemeContext';
import { useSaas } from '../context/SaasContext';

interface OverviewViewProps {
  jobCards: JobCard[];
  bays: ServiceBay[];
  vehicles: Vehicle[];
  customers: Customer[];
  parts: PartItem[];
  technicians: Technician[];
  appointments: Appointment[];
  activeLinkedRepo: string;
  onNavigate: (view: ActiveView) => void;
  onOpenJobCard: (jobId: string) => void;
  onOpenJobsByStatus: (status: 'All' | JobStatus) => void;
  onTriggerNewJob: () => void;
}

const WEEKLY_REVENUE_DATA = [
  { day: 'Mon', labor: 38500, parts: 29400 },
  { day: 'Tue', labor: 46200, parts: 35800 },
  { day: 'Wed', labor: 34900, parts: 22100 },
  { day: 'Thu', labor: 54800, parts: 41600 },
  { day: 'Fri', labor: 63400, parts: 49200 },
  { day: 'Sat', labor: 44100, parts: 31500 },
];

const PIPELINE_STAGES: {
  status: JobStatus;
  icon: React.ElementType;
}[] = [
  { status: 'Intake', icon: ClipboardList },
  { status: 'Diagnostics', icon: Activity },
  { status: 'Awaiting Parts', icon: Package },
  { status: 'In Repair', icon: Wrench },
  { status: 'Quality Check', icon: ShieldCheck },
  { status: 'Ready for Pickup', icon: Car },
  { status: 'Invoiced', icon: Receipt },
];

const FEATURED_SERVICES = [
  {
    code: '01.',
    title: 'Performance & Engine Repair',
    summary:
      'Timing kit replacements, cylinder head overhaul, turbocharger diagnostics, and cooling circuit service.',
    rateLabel: 'From ₹850 / hr',
    icon: Wrench,
    targetView: 'job-cards' as ActiveView,
  },
  {
    code: '02.',
    title: 'Computerized OBD-II Diagnostics',
    summary:
      'OEM CAN-Bus fault scanning, BS6 DPF regeneration, injector coding, and live telemetry tracing.',
    rateLabel: 'From ₹1,499 / scan',
    icon: Activity,
    targetView: 'bays-appointments' as ActiveView,
  },
  {
    code: '03.',
    title: 'Brake System & Hydraulics',
    summary:
      'Ceramic brake pad replacement, vented disc skimming, ABS hydraulic bleeding, and caliper rebuilds.',
    rateLabel: 'From ₹950 / hr',
    icon: ShieldCheck,
    targetView: 'job-cards' as ActiveView,
  },
  {
    code: '04.',
    title: 'Tyre & 4-Wheel Alignment',
    summary:
      '3D laser camber and toe geometry calibration, suspension bush work, and road-force balancing.',
    rateLabel: 'From ₹1,299 / set',
    icon: SlidersHorizontal,
    targetView: 'bays-appointments' as ActiveView,
  },
  {
    code: '05.',
    title: 'Transmission & Fluid Service',
    summary:
      'Full synthetic engine oil service, dual-clutch DSG fluid flush, and differential oil replacement.',
    rateLabel: 'From ₹750 / hr',
    icon: Gauge,
    targetView: 'bays-appointments' as ActiveView,
  },
  {
    code: '06.',
    title: 'EV High-Voltage & Electrical',
    summary:
      'High-voltage battery thermal coolant service, inverter check, and auxiliary 12V electrical repair.',
    rateLabel: 'EV L3 Certified',
    icon: Zap,
    targetView: 'technicians' as ActiveView,
  },
];

const WORKSHOP_PILLARS = [
  {
    title: 'Certified Master Technicians',
    detail:
      'OEM-trained BS6 diesel, hybrid, brake, and EV high-voltage specialists assigned per bay.',
    icon: Users,
  },
  {
    title: 'Modern Diagnostic Telemetry',
    detail:
      'Live OBD-II code capture, oscilloscope waveforms, and 3D 4-wheel laser alignment benches.',
    icon: Activity,
  },
  {
    title: 'Transparent GST Estimates',
    detail:
      'Upfront labor hours and OEM part SKU pricing in ₹ with 18% GST breakdown before work begins.',
    icon: Receipt,
  },
  {
    title: '24-Month Service Guarantee',
    detail:
      'Complete digital service history linked by RTO plate and VIN with 25,000 km coverage.',
    icon: ShieldCheck,
  },
];

type ShowcaseCategory =
  | 'All'
  | 'Powertrain'
  | 'Brakes & Chassis'
  | 'Diagnostics & EV';

function getBayEquipmentIcon(bayType: ServiceBay['bayType']) {
  switch (bayType) {
    case 'Diagnostics':
      return Activity;
    case 'Alignment':
      return SlidersHorizontal;
    case 'Quick Lube':
      return Gauge;
    case 'Body & Paint':
      return ShieldCheck;
    default:
      return Wrench;
  }
}

export default function OverviewView({
  jobCards,
  bays,
  vehicles,
  customers,
  parts,
  technicians,
  appointments,
  activeLinkedRepo,
  onNavigate,
  onOpenJobCard,
  onOpenJobsByStatus,
  onTriggerNewJob,
}: OverviewViewProps) {
  const [quickQuery, setQuickQuery] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [aboutImgFailed, setAboutImgFailed] = useState(false);
  const [showcaseFilter, setShowcaseFilter] = useState<ShowcaseCategory>('All');
  const { themeId, setThemeId, currentPreset } = useWorkshopTheme();
  const { activeTenant, activePlan, activeRole, ownershipCert } = useSaas();

  const activeJobs = jobCards.filter((j) => j.status !== 'Invoiced');
  const occupiedBays = bays.filter((b) => b.status === 'Occupied').length;
  const utilizationPct = bays.length
    ? Math.round((occupiedBays / bays.length) * 100)
    : 0;
  const lowStockParts = parts.filter((p) => p.quantity <= p.reorderLevel);
  const scheduledAppointments = appointments.filter(
    (a) => a.status === 'Scheduled'
  );

  const totalRevenue = jobCards.reduce(
    (sum, job) => sum + calculateJobTotals(job).grandTotal,
    0
  );
  const collectedRevenue = jobCards.reduce(
    (sum, job) => sum + job.paidAmount,
    0
  );

  const laborStats = useMemo(() => {
    let totalHours = 0;
    let totalLaborBilled = 0;
    let mpiPass = 0;
    let mpiMonitor = 0;
    let mpiFail = 0;

    for (const job of jobCards) {
      for (const item of job.laborItems) {
        totalHours += item.hours;
        totalLaborBilled += item.hours * item.hourlyRate;
      }
      for (const check of job.inspectionChecklist) {
        if (check.status === 'Pass') mpiPass += 1;
        else if (check.status === 'Monitor') mpiMonitor += 1;
        else if (check.status === 'Fail') mpiFail += 1;
      }
    }

    const effectiveRate = totalHours > 0 ? totalLaborBilled / totalHours : 0;
    return {
      totalHours,
      effectiveRate,
      mpiPass,
      mpiMonitor,
      mpiFail,
    };
  }, [jobCards]);

  const quickMatches = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return [];
    return jobCards
      .filter((job) => {
        const vehicle = vehicles.find((v) => v.id === job.vehicleId);
        const customer = customers.find((c) => c.id === job.customerId);
        return (
          job.jobNumber.toLowerCase().includes(q) ||
          job.customerComplaint.toLowerCase().includes(q) ||
          vehicle?.plateNumber.toLowerCase().includes(q) ||
          vehicle?.vin.toLowerCase().includes(q) ||
          `${vehicle?.make} ${vehicle?.model}`.toLowerCase().includes(q) ||
          customer?.name.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);
  }, [quickQuery, jobCards, vehicles, customers]);

  const portfolioJobs = useMemo(() => {
    const mapped = jobCards.slice(0, 6).map((job, idx) => {
      const vehicle = vehicles.find((v) => v.id === job.vehicleId);
      const complaintLower = job.customerComplaint.toLowerCase();
      let category: Exclude<ShowcaseCategory, 'All'> = 'Powertrain';
      let image = '/src/assets/images/service_engine_diagnostics_1795341270582.jpg';

      if (
        complaintLower.includes('brake') ||
        complaintLower.includes('rotor') ||
        complaintLower.includes('alignment') ||
        complaintLower.includes('tyre') ||
        complaintLower.includes('tire')
      ) {
        category = 'Brakes & Chassis';
        image = '/src/assets/images/service_brake_alignment_1795341270319.jpg';
      } else if (
        vehicle?.fuelType === 'Electric' ||
        vehicle?.fuelType === 'Hybrid' ||
        job.obdCodes.length > 0
      ) {
        category = 'Diagnostics & EV';
        image =
          idx % 2 === 0
            ? '/src/assets/images/autorex_bay_showcase_1795341269026.jpg'
            : '/src/assets/images/service_engine_diagnostics_1795341270582.jpg';
      }

      return { job, vehicle, category, image };
    });

    if (showcaseFilter === 'All') return mapped.slice(0, 3);
    return mapped.filter((item) => item.category === showcaseFilter).slice(0, 3);
  }, [jobCards, vehicles, showcaseFilter]);

  return (
    <div className="space-y-8">
      {/* 1. Deep Navy Utility Header Strip + Color Template Switcher */}
      <div className="tb-navy-panel rounded-xl px-5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-slate-200">
          <span className="inline-flex items-center gap-1.5">
            <MapPin
              className="w-3.5 h-3.5 shrink-0"
              strokeWidth={1.75}
              style={{ color: 'var(--tb-accent)' }}
            />
            <span>{activeTenant.name} · {activePlan.name}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
            <Clock
              className="w-3.5 h-3.5 shrink-0"
              strokeWidth={1.75}
              style={{ color: 'var(--tb-accent)' }}
            />
            <span>Role: {activeRole}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
            <Phone
              className="w-3.5 h-3.5 shrink-0"
              strokeWidth={1.75}
              style={{ color: 'var(--tb-accent)' }}
            />
            <span>{activeTenant.phone}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-300 mr-1">
            Color Template:
          </span>
          {WORKSHOP_THEMES.map((preset) => {
            const isSelected = preset.id === themeId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setThemeId(preset.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--tb-accent)'
                    : 'rgba(255, 255, 255, 0.08)',
                  borderColor: isSelected
                    ? 'var(--tb-accent)'
                    : 'rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                }}
              >
                <span className="inline-flex items-center gap-0.5">
                  {preset.swatches.map((hex, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-sm border border-white/25"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span>{preset.name.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Deep Navy & Crimson Car Service Hero Banner Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 tb-navy-panel rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300">
              <span
                className="font-semibold uppercase tracking-wider"
                style={{ color: 'var(--tb-accent)' }}
              >
                WRKFLW Automotive Service
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{bays.length} Service Bays</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{activeLinkedRepo}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white text-balance leading-[1.12]">
              Tuneup Your Car To Next Level
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl">
              Precision mechanical maintenance, factory OBD-II diagnostics, brake hydraulics, 3D wheel alignment, and multi-bay repair order dispatch engineered for high-throughput Indian automotive service workshops.
            </p>

            {/* Quick Plate / VIN / RO# Lookup */}
            <div className="relative pt-1">
              <Search
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Lookup repair order by RTO plate (e.g. MH-02), VIN, RO#, or customer..."
                className="w-full h-10 pl-10 pr-4 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-red-500"
              />
              {quickMatches.length > 0 && (
                <div
                  className="mt-2 rounded-lg border divide-y overflow-hidden"
                  style={{
                    borderColor: 'var(--tb-border)',
                    backgroundColor: 'var(--tb-surface-solid)',
                    color: 'var(--tb-text)',
                  }}
                >
                  {quickMatches.map((job) => {
                    const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                    const customer = customers.find((c) => c.id === job.customerId);
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => onOpenJobCard(job.id)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left text-xs transition-colors hover:opacity-90"
                        style={{ borderColor: 'var(--tb-border)' }}
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-semibold mr-2">
                            {job.jobNumber}
                          </span>
                          <span className="font-medium">
                            {vehicle?.year} {vehicle?.make} {vehicle?.model}
                          </span>
                          <span
                            className="ml-2 font-mono"
                            style={{ color: 'var(--tb-text-muted)' }}
                          >
                            {vehicle?.plateNumber} · {customer?.name}
                          </span>
                        </div>
                        <span
                          className="font-medium shrink-0 inline-flex items-center gap-1"
                          style={{ color: 'var(--tb-accent)' }}
                        >
                          {job.status}
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onTriggerNewJob}
              className="tb-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              Create Repair Order
            </button>
            <button
              type="button"
              onClick={() => onNavigate('bays-appointments')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border border-white/25 bg-white/10 text-white hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
            >
              <CalendarClock className="w-4 h-4" strokeWidth={1.75} />
              Book Service Bay
            </button>
            <button
              type="button"
              onClick={() => onNavigate('github-repos')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border border-white/20 bg-transparent text-slate-200 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              <GitBranch className="w-4 h-4" strokeWidth={1.75} />
              GitHub Catalogs
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 tb-surface rounded-xl overflow-hidden relative min-h-[290px]">
          {!heroImgFailed ? (
            <img
              src="/src/assets/images/autorex_bay_showcase_1795341269026.jpg"
              alt="Clean automotive vehicle raised on hydraulic service bay lift"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-6">
              <Wrench className="w-8 h-8 mb-2" style={{ color: 'var(--tb-accent)' }} />
              <span className="text-sm font-medium">WRKFLW Service Facility</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-slate-200 font-mono tabular-nums">
                {occupiedBays} of {bays.length} bays occupied · {utilizationPct}% utilization
              </p>
              <p className="text-base font-display font-semibold mt-0.5">
                Hydraulic Lifts &amp; OEM Diagnostics Floor
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bays-appointments')}
              className="text-xs font-semibold text-white hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Live Bays
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Full-Width 4-Column Operational KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="tb-surface rounded-xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
              Active Repair Orders
            </p>
            <p className="text-2xl font-display font-bold font-mono tabular-nums mt-1.5">
              {activeJobs.length}
            </p>
            <p
              className="text-xs font-mono tabular-nums mt-1"
              style={{ color: 'var(--tb-accent)' }}
            >
              {jobCards.filter((j) => j.priority === 'Urgent').length} urgent SLA
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--tb-surface-muted)',
              color: 'var(--tb-accent)',
            }}
          >
            <ClipboardCheck className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </div>
        </div>

        <div className="tb-surface rounded-xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
              Service Bay Utilization
            </p>
            <p className="text-2xl font-display font-bold font-mono tabular-nums mt-1.5">
              {utilizationPct}%
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums mt-1">
              {occupiedBays}/{bays.length} active ·{' '}
              {bays.filter((b) => b.status === 'Available').length} open
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--tb-surface-muted)',
              color: 'var(--tb-accent)',
            }}
          >
            <Gauge className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </div>
        </div>

        <div className="tb-surface rounded-xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
              Pipeline &amp; Effective Rate
            </p>
            <p className="text-2xl font-display font-bold font-mono tabular-nums mt-1.5">
              {formatINR(totalRevenue)}
            </p>
            <p
              className="text-xs font-mono tabular-nums mt-1"
              style={{ color: 'var(--tb-text-muted)' }}
            >
              {formatINR(collectedRevenue)} paid · ELR{' '}
              {formatINR(laborStats.effectiveRate)}/hr
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--tb-surface-muted)',
              color: 'var(--tb-accent)',
            }}
          >
            <Receipt className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </div>
        </div>

        <div className="tb-surface rounded-xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
              Parts Reorder Alerts
            </p>
            <p className="text-2xl font-display font-bold font-mono tabular-nums mt-1.5">
              {lowStockParts.length}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('parts-inventory')}
              className="text-xs font-semibold hover:underline whitespace-nowrap mt-1"
              style={{ color: 'var(--tb-accent)' }}
            >
              Inspect warehouse
            </button>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--tb-surface-muted)',
              color: 'var(--tb-accent)',
            }}
          >
            <Package className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </div>
        </div>
      </section>

      {/* 4. Welcome To WRKFLW Workshop + Experience Block + Quality Pillars */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 tb-surface rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900 relative">
            {!aboutImgFailed ? (
              <img
                src="/src/assets/images/service_engine_diagnostics_1795341270582.jpg"
                alt="Engine bay diagnostics and digital multimeter inspection"
                referrerPolicy="no-referrer"
                onError={() => setAboutImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Activity className="w-8 h-8" style={{ color: 'var(--tb-accent)' }} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white font-mono">
              <span>OEM Diagnostic Bench</span>
              <span>BS6 · Hybrid · EV</span>
            </div>
          </div>

          <div className="tb-navy-panel m-4 rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--tb-accent)', color: '#ffffff' }}
              >
                <Award className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xl font-display font-bold font-mono tabular-nums text-white leading-none">
                  18+ Years
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Experience in Indian Multi-Brand Car Service
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('billing')}
              className="text-xs font-semibold text-white hover:underline whitespace-nowrap shrink-0"
            >
              GST Billing
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 tb-surface rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--tb-accent)' }}
              >
                Welcome To WRKFLW Workshop
              </p>
              <h3 className="text-xl font-display font-bold tracking-tight mt-0.5">
                Why Choose Our Service Center
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--tb-text-muted)' }}>
                Dealership-grade mechanical standards backed by live multi-point inspection metrics
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono tabular-nums shrink-0">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {laborStats.mpiPass} Pass
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {laborStats.mpiMonitor} Monitor
              </span>
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {laborStats.mpiFail} Fail
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WORKSHOP_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-4 rounded-lg border flex items-start gap-3"
                  style={{
                    backgroundColor: 'var(--tb-surface-muted)',
                    borderColor: 'var(--tb-border)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: 'var(--tb-surface-solid)',
                      color: 'var(--tb-accent)',
                    }}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{pillar.title}</h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      {pillar.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Our Featured Services 3x2 Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--tb-accent)' }}
            >
              Our Services
            </p>
            <h3 className="text-lg font-display font-bold tracking-tight mt-0.5">
              Workshop Mechanical &amp; Diagnostic Services
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
              Standardized repair operations with flat-rate INR labor pricing and direct bay routing
            </p>
          </div>
          <button
            type="button"
            onClick={onTriggerNewJob}
            className="text-xs font-semibold hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            style={{ color: 'var(--tb-accent)' }}
          >
            Open New Repair Order
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURED_SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.code}
                className="tb-surface rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: 'var(--tb-accent)' }}
                    >
                      {svc.code}
                    </span>
                    <h4 className="text-base font-display font-semibold">
                      {svc.title}
                    </h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      {svc.summary}
                    </p>
                  </div>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--tb-surface-muted)',
                      color: 'var(--tb-accent)',
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </div>
                </div>

                <div
                  className="pt-3 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: 'var(--tb-border)' }}
                >
                  <span
                    className="font-mono font-medium tabular-nums"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    {svc.rateLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate(svc.targetView)}
                    className="font-semibold hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    style={{ color: 'var(--tb-text)' }}
                  >
                    Schedule Service
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Navy Workshop Readiness Strip + 7-Stage Pipeline & Weekly Revenue Chart */}
      <section className="space-y-6">
        <div className="tb-navy-panel rounded-xl px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div>
            <p className="text-xs text-slate-300">Facility Lift Capacity</p>
            <p className="text-lg font-display font-bold font-mono tabular-nums text-white mt-0.5">
              {bays.length} Active Service Bays
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Certified Technicians</p>
            <p className="text-lg font-display font-bold font-mono tabular-nums text-white mt-0.5">
              {technicians.length} Bay Specialists
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Open Job Card Pipeline</p>
            <p className="text-lg font-display font-bold font-mono tabular-nums text-white mt-0.5">
              {formatINR(totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Taxation &amp; Invoicing</p>
            <p className="text-lg font-display font-bold font-mono tabular-nums text-white mt-0.5">
              18% GST · UPI Ready
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Interactive 7-Stage Repair Order Pipeline */}
          <div className="lg:col-span-5 tb-surface rounded-xl p-6 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-display font-semibold">
                  Repair Order Workflow Pipeline
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                  Click any stage to filter active shop repair orders
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenJobsByStatus('All')}
                className="text-xs font-semibold hover:underline whitespace-nowrap shrink-0"
                style={{ color: 'var(--tb-accent)' }}
              >
                View all ({jobCards.length})
              </button>
            </div>

            <div className="space-y-1.5">
              {PIPELINE_STAGES.map(({ status, icon: StageIcon }) => {
                const stageJobs = jobCards.filter((j) => j.status === status);
                const stageTotal = stageJobs.reduce(
                  (sum, j) => sum + calculateJobTotals(j).grandTotal,
                  0
                );

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onOpenJobsByStatus(status)}
                    className="w-full px-3 py-2 rounded-lg border flex items-center justify-between gap-3 text-left transition-colors"
                    style={{
                      backgroundColor: 'var(--tb-surface-muted)',
                      borderColor: 'var(--tb-border)',
                    }}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'var(--tb-surface-solid)',
                          color:
                            stageJobs.length > 0
                              ? 'var(--tb-accent)'
                              : 'var(--tb-text-muted)',
                        }}
                      >
                        <StageIcon className="w-4 h-4" strokeWidth={1.75} />
                      </span>
                      <span className="text-xs font-medium truncate">{status}</span>
                    </span>

                    <span className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                      <span style={{ color: 'var(--tb-text-muted)' }}>
                        {formatINR(stageTotal)}
                      </span>
                      <span className="font-semibold w-5 text-right">
                        {stageJobs.length}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly Labor & Parts Revenue Chart */}
          <div className="lg:col-span-7 tb-surface rounded-xl p-6 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-display font-semibold">
                  Weekly Labor &amp; Parts Revenue (INR)
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                  Billable workshop hours vs. OEM &amp; aftermarket spare parts
                </p>
              </div>
              <div
                className="flex items-center gap-3 text-xs shrink-0"
                style={{ color: 'var(--tb-text-secondary)' }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: currentPreset.chartColors.labor }}
                  />
                  Labor
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: currentPreset.chartColors.parts }}
                  />
                  Parts
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_REVENUE_DATA} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={currentPreset.chartColors.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: currentPreset.chartColors.tick, fontSize: 12 }}
                    axisLine={{ stroke: currentPreset.chartColors.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: currentPreset.chartColors.tick, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatINR(value), '']}
                    contentStyle={{
                      backgroundColor: 'var(--tb-surface-solid)',
                      borderColor: 'var(--tb-border)',
                      color: 'var(--tb-text)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="labor"
                    name="Labor"
                    fill={currentPreset.chartColors.labor}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="parts"
                    name="Parts"
                    fill={currentPreset.chartColors.parts}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              className="pt-4 border-t space-y-2.5"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Users
                    className="w-4 h-4"
                    strokeWidth={1.75}
                    style={{ color: 'var(--tb-accent)' }}
                  />
                  Technician Floor Status
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('technicians')}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--tb-accent)' }}
                >
                  Roster ({technicians.length})
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {technicians.slice(0, 4).map((tech) => (
                  <div
                    key={tech.id}
                    className="px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2"
                    style={{
                      backgroundColor: 'var(--tb-surface-muted)',
                      borderColor: 'var(--tb-border)',
                    }}
                  >
                    <span className="truncate font-medium">{tech.name}</span>
                    <span
                      className={`shrink-0 font-mono ${
                        tech.status === 'On Bay'
                          ? 'text-amber-600 dark:text-amber-400'
                          : tech.status === 'Available'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ''
                      }`}
                    >
                      {tech.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Filterable Recent Workshop Jobs & Technical Showcase */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--tb-accent)' }}
            >
              Workshop Portfolio
            </p>
            <h3 className="text-lg font-display font-bold tracking-tight mt-0.5">
              Recent Workshop Jobs &amp; Technical Showcase
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
              Active and completed service jobs grouped by mechanical discipline
            </p>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-lg self-start overflow-x-auto"
            style={{ backgroundColor: 'var(--tb-surface-muted)' }}
          >
            {(
              ['All', 'Powertrain', 'Brakes & Chassis', 'Diagnostics & EV'] as ShowcaseCategory[]
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setShowcaseFilter(cat)}
                className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
                style={
                  showcaseFilter === cat
                    ? {
                        backgroundColor: 'var(--tb-surface-solid)',
                        color: 'var(--tb-text)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      }
                    : { color: 'var(--tb-text-muted)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {portfolioJobs.map(({ job, vehicle, category, image }) => {
            const totals = calculateJobTotals(job);
            return (
              <div
                key={job.id}
                className="tb-surface rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-900">
                  <img
                    src={image}
                    alt={`${vehicle?.make || 'Vehicle'} ${category} workshop service`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white font-mono">
                    <span>{job.jobNumber}</span>
                    <span>{vehicle?.plateNumber}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      <span>{category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.status}</span>
                    </div>
                    <h4 className="text-base font-display font-semibold">
                      {vehicle?.year} {vehicle?.make} {vehicle?.model}
                    </h4>
                    <p
                      className="text-xs line-clamp-2"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      {job.customerComplaint}
                    </p>
                  </div>

                  <div
                    className="pt-3 border-t flex items-center justify-between text-xs"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <span className="font-mono font-semibold tabular-nums">
                      {formatINR(totals.grandTotal, 2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenJobCard(job.id)}
                      className="font-semibold hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                      style={{ color: 'var(--tb-accent)' }}
                    >
                      Inspect Job Card
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Live Service Bay Matrix + Service Lane Reception & Parts Reorder Queues */}
      <section className="space-y-6">
        <div className="tb-surface rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-display font-semibold">
                Live Service Bay &amp; Lift Dispatch
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
                Real-time hydraulic lift, diagnostic bay, and 3D alignment stall assignments
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bays-appointments')}
              className="text-xs font-semibold hover:underline whitespace-nowrap shrink-0"
              style={{ color: 'var(--tb-accent)' }}
            >
              Manage bays
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {bays.map((bay) => {
              const job = bay.activeJobId
                ? jobCards.find((j) => j.id === bay.activeJobId)
                : undefined;
              const vehicle = job
                ? vehicles.find((v) => v.id === job.vehicleId)
                : undefined;
              const customer = job
                ? customers.find((c) => c.id === job.customerId)
                : undefined;
              const tech = bay.assignedTechId
                ? technicians.find((t) => t.id === bay.assignedTechId)
                : undefined;
              const EquipIcon = getBayEquipmentIcon(bay.bayType);

              return (
                <div
                  key={bay.id}
                  className="rounded-lg p-4 border flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--tb-surface-muted)',
                    borderColor: 'var(--tb-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5"
                        style={{
                          backgroundColor: 'var(--tb-surface-solid)',
                          borderColor: 'var(--tb-border)',
                          color: 'var(--tb-text-secondary)',
                        }}
                      >
                        <EquipIcon className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          <span
                            className="font-mono font-semibold"
                            style={{ color: 'var(--tb-text)' }}
                          >
                            {bay.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{bay.bayType}</span>
                        </div>
                        <h4 className="text-sm font-semibold mt-0.5 truncate">
                          {bay.name}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${
                        bay.status === 'Occupied'
                          ? 'text-amber-600 dark:text-amber-400'
                          : bay.status === 'Available'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {bay.status === 'Occupied' && (
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                      {bay.status === 'Available' && (
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                      {bay.status === 'Maintenance' && (
                        <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                      {bay.status}
                    </span>
                  </div>

                  {job && vehicle ? (
                    <div
                      className="pt-2.5 border-t space-y-1"
                      style={{ borderColor: 'var(--tb-border)' }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold">
                          {vehicle.plateNumber} · {vehicle.fuelType}
                        </span>
                        <span style={{ color: 'var(--tb-text-muted)' }}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          {customer?.name} · {tech?.name || 'Unassigned'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenJobCard(job.id)}
                          className="text-xs font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
                          style={{ color: 'var(--tb-accent)' }}
                        >
                          {job.jobNumber}
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="pt-2.5 border-t flex items-center justify-between text-xs"
                      style={{
                        borderColor: 'var(--tb-border)',
                        color: 'var(--tb-text-muted)',
                      }}
                    >
                      <span>
                        {bay.status === 'Available'
                          ? 'Ready for vehicle intake'
                          : 'Lift calibration'}
                      </span>
                      {bay.status === 'Available' && (
                        <button
                          type="button"
                          onClick={() => onNavigate('bays-appointments')}
                          className="font-semibold hover:underline"
                          style={{ color: 'var(--tb-text)' }}
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tb-surface rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-semibold">
                Service Lane Reception Queue
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('bays-appointments')}
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--tb-accent)' }}
              >
                Schedule ({scheduledAppointments.length})
              </button>
            </div>

            {scheduledAppointments.length === 0 ? (
              <p
                className="text-sm py-6 text-center"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                No pending appointments scheduled.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--tb-border)' }}>
                {scheduledAppointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    className="py-3 flex items-center justify-between gap-4"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {apt.vehicleSummary} ·{' '}
                        <span
                          className="font-mono text-xs"
                          style={{ color: 'var(--tb-text-secondary)' }}
                        >
                          {apt.plateNumber}
                        </span>
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {apt.customerName} · {apt.serviceType}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-semibold tabular-nums">
                        {apt.timeSlot}
                      </p>
                      <p
                        className="text-xs font-mono tabular-nums"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {apt.scheduledDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tb-surface rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-semibold">
                Parts Reorder &amp; Backorder Queue
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('parts-inventory')}
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--tb-accent)' }}
              >
                Open warehouse
              </button>
            </div>

            {lowStockParts.length === 0 ? (
              <p
                className="text-sm py-6 text-center"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                All parts are above minimum reorder thresholds.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--tb-border)' }}>
                {lowStockParts.map((part) => (
                  <div
                    key={part.id}
                    className="py-3 flex items-center justify-between gap-4"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{part.name}</p>
                      <p
                        className="text-xs truncate"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        <span className="font-mono">{part.sku}</span> ·{' '}
                        {part.binLocation} · {part.supplierName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-mono font-semibold tabular-nums ${
                          part.quantity === 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {part.quantity} left
                      </p>
                      <p
                        className="text-xs font-mono tabular-nums"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        Min {part.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. Deep Navy Enterprise SaaS Workshop Footer */}
      <footer className="tb-navy-panel rounded-xl px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <p className="text-slate-200 font-medium">
            WRKFLW Cloud SaaS · Indian Car Service &amp; Workshop Platform (INR / GST)
          </p>
          <p className="text-[11px] font-mono text-slate-400">
            Proprietary License: {ownershipCert.ownershipCode} · Proprietor: {ownershipCert.ownerEmail} · Unauthorized replication prohibited
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-slate-300">
          <button
            type="button"
            onClick={() => onNavigate('job-cards')}
            className="hover:text-white hover:underline whitespace-nowrap"
          >
            Repair Orders
          </button>
          <button
            type="button"
            onClick={() => onNavigate('bays-appointments')}
            className="hover:text-white hover:underline whitespace-nowrap"
          >
            Bay Dispatch
          </button>
          <button
            type="button"
            onClick={() => onNavigate('parts-inventory')}
            className="hover:text-white hover:underline whitespace-nowrap"
          >
            Parts Warehouse
          </button>
          <button
            type="button"
            onClick={() => onNavigate('billing')}
            className="hover:text-white hover:underline whitespace-nowrap"
          >
            GST Billing
          </button>
          <button
            type="button"
            onClick={() => onNavigate('saas-console')}
            className="hover:text-white hover:underline whitespace-nowrap"
          >
            SaaS &amp; Licensing
          </button>
        </div>
      </footer>
    </div>
  );
}
