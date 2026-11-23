import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Wrench,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Appointment, ServiceBay, Technician, JobCard } from '../types';

interface BaysAppointmentsViewProps {
  bays: ServiceBay[];
  appointments: Appointment[];
  technicians: Technician[];
  jobCards: JobCard[];
  onToggleBayMaintenance: (bayId: string) => void;
  onAddAppointment: (apt: Omit<Appointment, 'id' | 'appointmentNumber'>) => void;
  onCheckInAppointment: (appointmentId: string, bayId: string) => void;
  onOpenJobCard: (jobId: string) => void;
}

export default function BaysAppointmentsView({
  bays,
  appointments,
  technicians,
  jobCards,
  onToggleBayMaintenance,
  onAddAppointment,
  onCheckInAppointment,
  onOpenJobCard,
}: BaysAppointmentsViewProps) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleSummary, setVehicleSummary] = useState('');
  const [serviceType, setServiceType] = useState('Periodic Maintenance & Oil Service');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [preferredBayType, setPreferredBayType] =
    useState<ServiceBay['bayType']>('Hydraulic Lift');
  const [notes, setNotes] = useState('');

  const availableBays = bays.filter((b) => b.status === 'Available');

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAppointment({
      customerName: customerName.trim(),
      phone: phone.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      vehicleSummary: vehicleSummary.trim(),
      serviceType: serviceType.trim(),
      scheduledDate,
      timeSlot,
      preferredBayType,
      status: 'Scheduled',
      notes: notes.trim(),
    });
    setCustomerName('');
    setPhone('');
    setPlateNumber('');
    setVehicleSummary('');
    setNotes('');
    setShowBookingModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Service Bays Control Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-semibold">
              Workshop Service Bays
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
              Real-time bay availability, equipment status, and active technician assignments
            </p>
          </div>
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: 'var(--tb-text-secondary)' }}
          >
            {availableBays.length} of {bays.length} bays available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bays.map((bay) => {
            const tech = bay.assignedTechId
              ? technicians.find((t) => t.id === bay.assignedTechId)
              : undefined;
            const job = bay.activeJobId
              ? jobCards.find((j) => j.id === bay.activeJobId)
              : undefined;

            return (
              <div
                key={bay.id}
                className="tb-surface rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-xs font-mono"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      {bay.code} · {bay.bayType}
                    </p>
                    <h3 className="text-base font-semibold mt-0.5">{bay.name}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      bay.status === 'Occupied'
                        ? 'text-amber-600 dark:text-amber-400'
                        : bay.status === 'Available'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {bay.status === 'Occupied' && <Clock className="w-3.5 h-3.5" />}
                    {bay.status === 'Available' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {bay.status === 'Maintenance' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {bay.status}
                  </span>
                </div>

                <div
                  className="pt-3 border-t flex items-center justify-between gap-2 text-xs"
                  style={{ borderColor: 'var(--tb-border)' }}
                >
                  {bay.status === 'Occupied' && job ? (
                    <>
                      <span style={{ color: 'var(--tb-text-secondary)' }}>
                        {job.jobNumber} · {tech?.name || 'Tech assigned'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenJobCard(job.id)}
                        className="font-semibold hover:underline whitespace-nowrap"
                        style={{ color: 'var(--tb-accent)' }}
                      >
                        View Job
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--tb-text-muted)' }}>
                        {bay.status === 'Available'
                          ? 'Ready for next check-in'
                          : 'Lift / tool calibration'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleBayMaintenance(bay.id)}
                        className="font-medium hover:underline whitespace-nowrap"
                        style={{ color: 'var(--tb-text)' }}
                      >
                        {bay.status === 'Maintenance'
                          ? 'Mark Available'
                          : 'Set Maintenance'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointments Queue */}
      <div className="tb-surface rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-semibold">
              Scheduled Appointments &amp; Drop-Offs
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
              Check in arriving vehicles directly into an open service bay to generate a Job Card
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBookingModal(true)}
            className="tb-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-xs font-medium"
                style={{
                  borderColor: 'var(--tb-border)',
                  color: 'var(--tb-text-muted)',
                }}
              >
                <th className="py-3 px-3">Booking #</th>
                <th className="py-3 px-3">Customer &amp; Vehicle</th>
                <th className="py-3 px-3">Requested Service</th>
                <th className="py-3 px-3">Schedule</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Bay Check-In</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: 'var(--tb-border)' }}>
              {appointments.map((apt) => (
                <tr key={apt.id} style={{ borderColor: 'var(--tb-border)' }}>
                  <td className="py-3.5 px-3 font-mono text-xs font-semibold whitespace-nowrap">
                    {apt.appointmentNumber}
                    <div
                      className="font-sans font-normal"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      {apt.preferredBayType}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-medium">
                      {apt.customerName} ·{' '}
                      <span
                        className="font-mono text-xs"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        {apt.plateNumber}
                      </span>
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      {apt.vehicleSummary} · {apt.phone}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div>{apt.serviceType}</div>
                    {apt.notes && (
                      <div
                        className="text-xs truncate max-w-[260px]"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {apt.notes}
                      </div>
                    )}
                  </td>
                  <td
                    className="py-3.5 px-3 font-mono text-xs whitespace-nowrap tabular-nums"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    <div>{apt.scheduledDate}</div>
                    <div style={{ color: 'var(--tb-text-muted)' }}>{apt.timeSlot}</div>
                  </td>
                  <td className="py-3.5 px-3 text-xs font-medium whitespace-nowrap">
                    <span
                      className={
                        apt.status === 'Checked In'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : apt.status === 'Scheduled'
                          ? 'text-amber-600 dark:text-amber-400'
                          : ''
                      }
                    >
                      {apt.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    {apt.status === 'Scheduled' ? (
                      availableBays.length > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            onCheckInAppointment(apt.id, availableBays[0].id)
                          }
                          className="tb-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Check In ({availableBays[0].code})
                        </button>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          No bay open
                        </span>
                      )
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        Processed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleBookSubmit}
            className="tb-surface-solid rounded-xl w-full max-w-lg p-6 space-y-4"
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: 'var(--tb-accent)' }} />
                <h2 className="text-lg font-display font-bold">
                  Book Service Appointment
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="p-1.5 rounded-md"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Customer Name
                </label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Phone Number
                </label>
                <input
                  required
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  License Plate
                </label>
                <input
                  required
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="MH-02-AB-1234"
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Vehicle Year / Make / Model
                </label>
                <input
                  required
                  type="text"
                  value={vehicleSummary}
                  onChange={(e) => setVehicleSummary(e.target.value)}
                  placeholder="2023 Hyundai Creta SX"
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Date
                </label>
                <input
                  required
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Time Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                >
                  <option>08:30 AM</option>
                  <option>09:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:30 AM</option>
                  <option>01:30 PM</option>
                  <option>03:00 PM</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Service Type &amp; Bay Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    required
                    type="text"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="tb-input h-9 px-3 rounded-lg text-sm"
                  />
                  <select
                    value={preferredBayType}
                    onChange={(e) =>
                      setPreferredBayType(e.target.value as ServiceBay['bayType'])
                    }
                    className="tb-input h-9 px-3 rounded-lg text-sm"
                  >
                    <option value="Hydraulic Lift">Hydraulic Lift</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Quick Lube">Quick Lube</option>
                    <option value="Alignment">Alignment</option>
                    <option value="Body & Paint">Body &amp; Paint</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="tb-input w-full p-2.5 rounded-lg text-sm"
                />
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-2 pt-3 border-t"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-xs font-medium"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tb-btn-primary px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
