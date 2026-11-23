import React, { useState } from 'react';
import { Search, Plus, X, Car, UserCheck } from 'lucide-react';
import { Customer, JobCard, Vehicle } from '../types';
import { calculateJobTotals, formatINR } from '../data/workshopSeed';

interface VehiclesCustomersViewProps {
  vehicles: Vehicle[];
  customers: Customer[];
  jobCards: JobCard[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => string;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onOpenJobCard: (jobId: string) => void;
}

export default function VehiclesCustomersView({
  vehicles,
  customers,
  jobCards,
  onAddCustomer,
  onAddVehicle,
  onOpenJobCard,
}: VehiclesCustomersViewProps) {
  const [subTab, setSubTab] = useState<'vehicles' | 'customers'>('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    vehicles[0]?.id || null
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const [ownerMode, setOwnerMode] = useState<'existing' | 'new'>('existing');
  const [existingCustomerId, setExistingCustomerId] = useState(
    customers[0]?.id || ''
  );
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<'Individual' | 'Fleet'>('Individual');

  const [plateNumber, setPlateNumber] = useState('');
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2023');
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>('Petrol');
  const [color, setColor] = useState('');
  const [odometerKm, setOdometerKm] = useState('15000');

  const filteredVehicles = vehicles.filter((v) => {
    const owner = customers.find((c) => c.id === v.customerId);
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      v.plateNumber.toLowerCase().includes(q) ||
      v.vin.toLowerCase().includes(q) ||
      `${v.make} ${v.model}`.toLowerCase().includes(q) ||
      owner?.name.toLowerCase().includes(q)
    );
  });

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q)
    );
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedVehicleOwner = selectedVehicle
    ? customers.find((c) => c.id === selectedVehicle.customerId)
    : undefined;
  const vehicleHistory = selectedVehicle
    ? jobCards.filter((j) => j.vehicleId === selectedVehicle.id)
    : [];

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    let targetCustomerId = existingCustomerId;
    if (ownerMode === 'new') {
      targetCustomerId = onAddCustomer({
        name: custName.trim(),
        phone: custPhone.trim(),
        email: custEmail.trim(),
        address: custAddress.trim(),
        customerType: custType,
      });
    }
    onAddVehicle({
      customerId: targetCustomerId,
      plateNumber: plateNumber.trim().toUpperCase(),
      vin: vin.trim().toUpperCase(),
      make: make.trim(),
      model: model.trim(),
      year: Number(year) || 2023,
      fuelType,
      color: color.trim() || 'Silver',
      odometerKm: Number(odometerKm) || 0,
    });
    setPlateNumber('');
    setVin('');
    setMake('');
    setModel('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="flex items-center gap-1 p-1 rounded-lg self-start"
          style={{ backgroundColor: 'var(--tb-surface-muted)' }}
        >
          <button
            type="button"
            onClick={() => setSubTab('vehicles')}
            className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
            style={
              subTab === 'vehicles'
                ? {
                    backgroundColor: 'var(--tb-surface-solid)',
                    color: 'var(--tb-text)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  }
                : { color: 'var(--tb-text-muted)' }
            }
          >
            Vehicles ({vehicles.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('customers')}
            className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
            style={
              subTab === 'customers'
                ? {
                    backgroundColor: 'var(--tb-surface-solid)',
                    color: 'var(--tb-text)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  }
                : { color: 'var(--tb-text-muted)' }
            }
          >
            Customers &amp; Fleets ({customers.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--tb-text-muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, VIN, or owner..."
              className="tb-input w-full h-9 pl-9 pr-3 rounded-lg text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="tb-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Register Vehicle
          </button>
        </div>
      </div>

      {subTab === 'vehicles' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 tb-surface rounded-xl overflow-hidden">
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
                    <th className="py-3 px-4">Plate / VIN</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4 text-right">Odometer</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm" style={{ borderColor: 'var(--tb-border)' }}>
                  {filteredVehicles.map((v) => {
                    const owner = customers.find((c) => c.id === v.customerId);
                    const isSelected = v.id === selectedVehicleId;
                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className="cursor-pointer transition-colors"
                        style={{
                          borderColor: 'var(--tb-border)',
                          backgroundColor: isSelected
                            ? 'var(--tb-accent-soft)'
                            : 'transparent',
                        }}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs font-semibold">
                            {v.plateNumber}
                          </div>
                          <div
                            className="font-mono text-[11px]"
                            style={{ color: 'var(--tb-text-muted)' }}
                          >
                            {v.vin}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {v.year} {v.make} {v.model}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: 'var(--tb-text-muted)' }}
                          >
                            {v.fuelType} · {v.color}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{owner?.name}</div>
                          <div
                            className="text-xs"
                            style={{ color: 'var(--tb-text-muted)' }}
                          >
                            {owner?.phone}
                          </div>
                        </td>
                        <td
                          className="py-3 px-4 text-right font-mono text-xs tabular-nums"
                          style={{ color: 'var(--tb-text-secondary)' }}
                        >
                          {v.odometerKm.toLocaleString()} km
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 tb-surface rounded-xl p-5 space-y-4">
            {selectedVehicle ? (
              <>
                <div
                  className="pb-3 border-b"
                  style={{ borderColor: 'var(--tb-border)' }}
                >
                  <div
                    className="flex items-center gap-2 text-xs font-mono"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    <Car className="w-3.5 h-3.5" style={{ color: 'var(--tb-accent)' }} />
                    <span>{selectedVehicle.plateNumber}</span>
                    <span>·</span>
                    <span>{selectedVehicle.vin}</span>
                  </div>
                  <h3 className="text-base font-display font-bold mt-1">
                    {selectedVehicle.year} {selectedVehicle.make}{' '}
                    {selectedVehicle.model}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    Owner: {selectedVehicleOwner?.name} ·{' '}
                    {selectedVehicleOwner?.email}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4
                    className="text-xs font-semibold"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    Service &amp; Repair History ({vehicleHistory.length})
                  </h4>

                  {vehicleHistory.length === 0 ? (
                    <p
                      className="text-xs py-6 text-center"
                      style={{ color: 'var(--tb-text-muted)' }}
                    >
                      No workshop job cards recorded for this vehicle yet.
                    </p>
                  ) : (
                    <div
                      className="divide-y"
                      style={{ borderColor: 'var(--tb-border)' }}
                    >
                      {vehicleHistory.map((job) => {
                        const totals = calculateJobTotals(job);
                        return (
                          <div
                            key={job.id}
                            className="py-3 space-y-1.5"
                            style={{ borderColor: 'var(--tb-border)' }}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => onOpenJobCard(job.id)}
                                className="font-mono font-semibold hover:underline"
                                style={{ color: 'var(--tb-accent)' }}
                              >
                                {job.jobNumber}
                              </button>
                              <span
                                className="font-mono tabular-nums"
                                style={{ color: 'var(--tb-text-muted)' }}
                              >
                                {job.intakeDate} · {formatINR(totals.grandTotal, 2)}
                              </span>
                            </div>
                            <p className="text-xs">{job.customerComplaint}</p>
                            <p
                              className="text-xs"
                              style={{ color: 'var(--tb-text-muted)' }}
                            >
                              Stage: {job.status} · {job.partsUsed.length} parts ·{' '}
                              {job.laborItems.length} labor ops
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p
                className="text-sm py-8 text-center"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                Select a vehicle to view its complete service history.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="tb-surface rounded-xl overflow-hidden">
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
                  <th className="py-3 px-4">Customer / Fleet</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Registered Vehicles</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: 'var(--tb-border)' }}>
                {filteredCustomers.map((c) => {
                  const custVehicles = vehicles.filter((v) => v.customerId === c.id);
                  const custJobs = jobCards.filter((j) => j.customerId === c.id);
                  const spend = custJobs.reduce(
                    (sum, j) => sum + calculateJobTotals(j).grandTotal,
                    0
                  );

                  return (
                    <tr key={c.id} style={{ borderColor: 'var(--tb-border)' }}>
                      <td className="py-3.5 px-4">
                        <div className="font-medium flex items-center gap-1.5">
                          <UserCheck
                            className="w-3.5 h-3.5"
                            style={{ color: 'var(--tb-text-muted)' }}
                          />
                          {c.name}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: 'var(--tb-text-muted)' }}
                        >
                          {c.customerType}
                          {c.companyName ? ` · ${c.companyName}` : ''}
                        </div>
                      </td>
                      <td
                        className="py-3.5 px-4 text-xs"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <div className="font-mono">{c.phone}</div>
                        <div>{c.email}</div>
                      </td>
                      <td
                        className="py-3.5 px-4 text-xs"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        {c.address}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">
                        {custVehicles.length}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold tabular-nums">
                        {formatINR(spend, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveNew}
            className="tb-surface-solid rounded-xl w-full max-w-lg p-6 space-y-4"
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <h2 className="text-lg font-display font-bold">
                Register Vehicle &amp; Owner
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

            <div
              className="flex items-center gap-1 p-1 rounded-lg"
              style={{ backgroundColor: 'var(--tb-surface-muted)' }}
            >
              <button
                type="button"
                onClick={() => setOwnerMode('existing')}
                className="flex-1 py-1.5 rounded-md text-xs font-medium"
                style={
                  ownerMode === 'existing'
                    ? {
                        backgroundColor: 'var(--tb-surface-solid)',
                        color: 'var(--tb-text)',
                      }
                    : { color: 'var(--tb-text-muted)' }
                }
              >
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setOwnerMode('new')}
                className="flex-1 py-1.5 rounded-md text-xs font-medium"
                style={
                  ownerMode === 'new'
                    ? {
                        backgroundColor: 'var(--tb-surface-solid)',
                        color: 'var(--tb-text)',
                      }
                    : { color: 'var(--tb-text-muted)' }
                }
              >
                New Customer
              </button>
            </div>

            {ownerMode === 'existing' ? (
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Select Customer
                </label>
                <select
                  value={existingCustomerId}
                  onChange={(e) => setExistingCustomerId(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Full name"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="tb-input h-9 px-3 rounded-lg text-sm"
                />
                <input
                  required
                  placeholder="Phone"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="tb-input h-9 px-3 rounded-lg text-sm"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="tb-input h-9 px-3 rounded-lg text-sm"
                />
                <select
                  value={custType}
                  onChange={(e) =>
                    setCustType(e.target.value as 'Individual' | 'Fleet')
                  }
                  className="tb-input h-9 px-3 rounded-lg text-sm"
                >
                  <option value="Individual">Individual</option>
                  <option value="Fleet">Fleet Account</option>
                </select>
                <input
                  placeholder="Address"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="tb-input col-span-2 h-9 px-3 rounded-lg text-sm"
                />
              </div>
            )}

            <div
              className="grid grid-cols-2 gap-3 pt-2 border-t"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <input
                required
                placeholder="Plate Number (e.g. MH-02-AB-4821)"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm font-mono uppercase"
              />
              <input
                required
                placeholder="VIN / Chassis (17 chars)"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm font-mono uppercase"
              />
              <input
                required
                placeholder="Make (e.g. Tata)"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm"
              />
              <input
                required
                placeholder="Model (e.g. Harrier XZ+)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm"
              />
              <input
                required
                type="number"
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm font-mono"
              />
              <select
                value={fuelType}
                onChange={(e) =>
                  setFuelType(e.target.value as Vehicle['fuelType'])
                }
                className="tb-input h-9 px-3 rounded-lg text-sm"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
              <input
                placeholder="Color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm"
              />
              <input
                required
                type="number"
                placeholder="Odometer (km)"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm font-mono"
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
                Save Registration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
