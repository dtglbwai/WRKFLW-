import React, { useState } from 'react';
import { Plus, X, Award, Phone } from 'lucide-react';
import { JobCard, ServiceBay, Technician } from '../types';
import { formatINR } from '../data/workshopSeed';

interface TechniciansViewProps {
  technicians: Technician[];
  bays: ServiceBay[];
  jobCards: JobCard[];
  onAddTechnician: (tech: Omit<Technician, 'id' | 'completedJobsMonth'>) => void;
  onUpdateStatus: (techId: string, status: Technician['status']) => void;
}

export default function TechniciansView({
  technicians,
  bays,
  jobCards,
  onAddTechnician,
  onUpdateStatus,
}: TechniciansViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Technician['role']>('Master Technician');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('850');
  const [certs, setCerts] = useState('BS6 Certified');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTechnician({
      name: name.trim(),
      role,
      specialty: specialty.trim() || 'General Mechanical & Maintenance',
      phone: phone.trim(),
      hourlyRate: Math.max(250, Number(hourlyRate) || 750),
      status: 'Available',
      certifications: certs
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    });
    setName('');
    setSpecialty('');
    setPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-semibold">
            Workshop Mechanics &amp; Advisors
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
            Track technician certifications, INR hourly labor rates, and live bay assignments
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="tb-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          Add Technician
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technicians.map((tech) => {
          const activeJobs = jobCards.filter(
            (j) => j.technicianId === tech.id && j.status !== 'Invoiced'
          );
          const assignedBay = tech.assignedBayId
            ? bays.find((b) => b.id === tech.assignedBayId)
            : undefined;

          return (
            <div
              key={tech.id}
              className="tb-surface rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs" style={{ color: 'var(--tb-text-muted)' }}>
                    {tech.role} ·{' '}
                    <span
                      className="font-mono font-semibold tabular-nums"
                      style={{ color: 'var(--tb-text)' }}
                    >
                      {formatINR(tech.hourlyRate)}/hr
                    </span>
                  </div>
                  <h3 className="text-base font-display font-bold mt-0.5">
                    {tech.name}
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    {tech.specialty}
                  </p>
                </div>

                <select
                  value={tech.status}
                  onChange={(e) =>
                    onUpdateStatus(tech.id, e.target.value as Technician['status'])
                  }
                  className={`tb-input h-8 px-2.5 rounded-md text-xs font-medium ${
                    tech.status === 'On Bay'
                      ? 'text-amber-600 dark:text-amber-400'
                      : tech.status === 'Available'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : ''
                  }`}
                >
                  <option value="Available">Available</option>
                  <option value="On Bay">On Bay</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>

              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-3 border-t"
                style={{
                  borderColor: 'var(--tb-border)',
                  color: 'var(--tb-text-muted)',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="font-mono">{tech.phone}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {tech.certifications.join(' · ')}
                </span>
              </div>

              <div
                className="flex items-center justify-between text-xs pt-3 border-t"
                style={{ borderColor: 'var(--tb-border)' }}
              >
                <span style={{ color: 'var(--tb-text-secondary)' }}>
                  {assignedBay ? `Assigned: ${assignedBay.code}` : 'Unassigned bay'} ·{' '}
                  <span className="font-mono tabular-nums">
                    {activeJobs.length} active jobs
                  </span>
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ color: 'var(--tb-text-muted)' }}
                >
                  {tech.completedJobsMonth} completed / mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="tb-surface-solid rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl"
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <h2 className="text-lg font-display font-bold">
                Add Workshop Technician
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="tb-input w-full h-9 px-3 rounded-lg text-sm"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Technician['role'])}
                className="tb-input w-full h-9 px-3 rounded-lg text-sm"
              >
                <option value="Master Technician">Master Technician</option>
                <option value="Diagnostic Specialist">Diagnostic Specialist</option>
                <option value="Brake & Suspension Tech">Brake &amp; Suspension Tech</option>
                <option value="Electrical Tech">Electrical Tech</option>
                <option value="Quick Service Tech">Quick Service Tech</option>
                <option value="Service Advisor">Service Advisor</option>
              </select>
              <input
                required
                placeholder="Specialty (e.g. Transmission & Cooling)"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="tb-input w-full h-9 px-3 rounded-lg text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Phone (+91 ...)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="tb-input h-9 px-3 rounded-lg text-sm font-mono"
                />
                <input
                  required
                  type="number"
                  placeholder="Hourly Rate (₹)"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="tb-input h-9 px-3 rounded-lg text-sm font-mono"
                />
              </div>
              <input
                placeholder="Certifications (comma separated)"
                value={certs}
                onChange={(e) => setCerts(e.target.value)}
                className="tb-input w-full h-9 px-3 rounded-lg text-sm"
              />
            </div>

            <div
              className="flex items-center justify-end gap-2 pt-3 border-t"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tb-btn-primary px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Save Technician
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
