import React, { useState } from 'react';
import { Printer, CheckCircle2, CreditCard, X } from 'lucide-react';
import { Customer, JobCard, Vehicle } from '../types';
import { calculateJobTotals, formatINR } from '../data/workshopSeed';
import { useSaas } from '../context/SaasContext';

interface BillingViewProps {
  jobCards: JobCard[];
  vehicles: Vehicle[];
  customers: Customer[];
  onRecordPayment: (
    jobId: string,
    amount: number,
    method: NonNullable<JobCard['paymentMethod']>
  ) => void;
}

export default function BillingView({
  jobCards,
  vehicles,
  customers,
  onRecordPayment,
}: BillingViewProps) {
  const { activeTenant, can, ownershipCert } = useSaas();
  const canCollect = can('billing:collect');
  const [filterStatus, setFilterStatus] = useState<
    'All' | 'Estimate' | 'Unpaid' | 'Partial' | 'Paid'
  >('All');
  const [invoiceJobId, setInvoiceJobId] = useState<string | null>(null);
  const [paymentJobId, setPaymentJobId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<NonNullable<JobCard['paymentMethod']>>('UPI');

  const filtered = jobCards.filter(
    (j) => filterStatus === 'All' || j.paymentStatus === filterStatus
  );

  const totalBilled = jobCards.reduce(
    (sum, j) => sum + calculateJobTotals(j).grandTotal,
    0
  );
  const totalCollected = jobCards.reduce((sum, j) => sum + j.paidAmount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);

  const invoiceJob = invoiceJobId
    ? jobCards.find((j) => j.id === invoiceJobId) || null
    : null;
  const paymentJob = paymentJobId
    ? jobCards.find((j) => j.id === paymentJobId) || null
    : null;

  const openPaymentModal = (job: JobCard) => {
    const balance = Math.max(
      0,
      calculateJobTotals(job).grandTotal - job.paidAmount
    );
    setPaymentAmount(balance.toFixed(2));
    setPaymentJobId(job.id);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentJob) return;
    onRecordPayment(
      paymentJob.id,
      Math.max(0, Number(paymentAmount) || 0),
      paymentMethod
    );
    setPaymentJobId(null);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="tb-surface rounded-xl p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
            Total Estimates &amp; GST Invoices
          </p>
          <p className="text-xl font-display font-bold font-mono mt-1 tabular-nums">
            {formatINR(totalBilled, 2)}
          </p>
        </div>
        <div className="tb-surface rounded-xl p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
            Collected Revenue
          </p>
          <p className="text-xl font-display font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 tabular-nums">
            {formatINR(totalCollected, 2)}
          </p>
        </div>
        <div className="tb-surface rounded-xl p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
            Receivable Balance
          </p>
          <p
            className="text-xl font-display font-bold font-mono mt-1 tabular-nums"
            style={{ color: 'var(--tb-accent)' }}
          >
            {formatINR(totalOutstanding, 2)}
          </p>
        </div>
      </div>

      {/* Filter Segmented Bar */}
      <div className="no-print flex items-center justify-between gap-4">
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ backgroundColor: 'var(--tb-surface-muted)' }}
        >
          {(['All', 'Estimate', 'Unpaid', 'Partial', 'Paid'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
                style={
                  filterStatus === st
                    ? {
                        backgroundColor: 'var(--tb-surface-solid)',
                        color: 'var(--tb-text)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      }
                    : { color: 'var(--tb-text-muted)' }
                }
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Invoices Table */}
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
                <th className="py-3 px-4">Invoice / RO #</th>
                <th className="py-3 px-4">Client &amp; Vehicle</th>
                <th className="py-3 px-4 text-right">Labor</th>
                <th className="py-3 px-4 text-right">Parts</th>
                <th className="py-3 px-4 text-right">Grand Total (incl. GST)</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: 'var(--tb-border)' }}>
              {filtered.map((job) => {
                const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                const customer = customers.find((c) => c.id === job.customerId);
                const totals = calculateJobTotals(job);
                const balance = Math.max(0, totals.grandTotal - job.paidAmount);

                return (
                  <tr key={job.id} style={{ borderColor: 'var(--tb-border)' }}>
                    <td className="py-3 px-4 font-mono text-xs font-semibold whitespace-nowrap">
                      {job.jobNumber}
                      <div
                        className="font-sans font-normal"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {job.intakeDate}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{customer?.name}</div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {vehicle?.plateNumber} · {vehicle?.make} {vehicle?.model}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 text-right font-mono text-xs tabular-nums"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      {formatINR(totals.laborSubtotal, 2)}
                    </td>
                    <td
                      className="py-3 px-4 text-right font-mono text-xs tabular-nums"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      {formatINR(totals.partsSubtotal, 2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums">
                      {formatINR(totals.grandTotal, 2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums">
                      {formatINR(balance, 2)}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium whitespace-nowrap">
                      <span
                        className={
                          job.paymentStatus === 'Paid'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : job.paymentStatus === 'Partial'
                            ? 'text-amber-600 dark:text-amber-400'
                            : job.paymentStatus === 'Unpaid'
                            ? 'text-red-600 dark:text-red-400'
                            : ''
                        }
                        style={
                          job.paymentStatus === 'Estimate'
                            ? { color: 'var(--tb-text-secondary)' }
                            : undefined
                        }
                      >
                        {job.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      {job.paymentStatus !== 'Paid' && canCollect && (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(job)}
                          className="tb-btn-primary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold"
                        >
                          <CreditCard className="w-3.5 h-3.5" strokeWidth={1.75} />
                          Pay
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setInvoiceJobId(job.id)}
                        className="tb-btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium"
                      >
                        <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Indian GST Tax Invoice Modal */}
      {invoiceJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="print-container tb-surface-solid rounded-xl w-full max-w-2xl p-8 space-y-6 shadow-xl">
            {(() => {
              const vehicle = vehicles.find((v) => v.id === invoiceJob.vehicleId);
              const customer = customers.find((c) => c.id === invoiceJob.customerId);
              const totals = calculateJobTotals(invoiceJob);
              return (
                <>
                  <div
                    className="flex items-start justify-between border-b pb-4"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div>
                      <h2 className="text-xl font-display font-bold">
                        {activeTenant.name}
                      </h2>
                      <p
                        className="text-xs mt-0.5 font-mono"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        Tax Invoice {invoiceJob.jobNumber} · Date: {invoiceJob.intakeDate} · GSTIN: {activeTenant.gstin}
                      </p>
                    </div>
                    <div className="no-print flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="tb-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceJobId(null)}
                        className="p-1.5"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Billed To
                      </p>
                      <p className="font-medium mt-1">{customer?.name}</p>
                      <p style={{ color: 'var(--tb-text-secondary)' }}>
                        {customer?.address}
                      </p>
                      <p
                        className="font-mono"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        {customer?.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-semibold"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Vehicle
                      </p>
                      <p className="font-medium mt-1">
                        {vehicle?.year} {vehicle?.make} {vehicle?.model}
                      </p>
                      <p
                        className="font-mono"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Reg: {vehicle?.plateNumber}
                      </p>
                      <p
                        className="font-mono"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        Odometer: {invoiceJob.odometerIn.toLocaleString('en-IN')} km
                      </p>
                    </div>
                  </div>

                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr
                        className="border-y"
                        style={{
                          borderColor: 'var(--tb-border)',
                          color: 'var(--tb-text-muted)',
                        }}
                      >
                        <th className="py-2 text-left">Description</th>
                        <th className="py-2 text-right">Qty / Hrs</th>
                        <th className="py-2 text-right">Rate / Price</th>
                        <th className="py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--tb-border)' }}>
                      {invoiceJob.laborItems.map((l) => (
                        <tr key={l.id} style={{ borderColor: 'var(--tb-border)' }}>
                          <td className="py-2">{l.description}</td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {l.hours.toFixed(2)} hr
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {formatINR(l.hourlyRate, 2)}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums font-medium">
                            {formatINR(l.hours * l.hourlyRate, 2)}
                          </td>
                        </tr>
                      ))}
                      {invoiceJob.partsUsed.map((p) => (
                        <tr key={p.id} style={{ borderColor: 'var(--tb-border)' }}>
                          <td className="py-2">
                            <span
                              className="font-mono mr-1.5"
                              style={{ color: 'var(--tb-text-muted)' }}
                            >
                              [{p.sku}]
                            </span>
                            {p.name}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {p.quantity}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {formatINR(p.unitPrice, 2)}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums font-medium">
                            {formatINR(p.quantity * p.unitPrice, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div
                    className="border-t pt-4 flex justify-end"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div className="w-64 space-y-1.5 text-xs">
                      <div
                        className="flex justify-between"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <span>Taxable Subtotal</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(totals.subtotal, 2)}
                        </span>
                      </div>
                      {invoiceJob.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Discount</span>
                          <span className="font-mono tabular-nums">
                            -{formatINR(invoiceJob.discountAmount, 2)}
                          </span>
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <span>GST ({invoiceJob.taxRatePercent}%)</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(totals.taxAmount, 2)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between font-bold text-sm pt-2 border-t"
                        style={{ borderColor: 'var(--tb-border)' }}
                      >
                        <span>Grand Total (INR)</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(totals.grandTotal, 2)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{ color: 'var(--tb-text-secondary)' }}
                      >
                        <span>Paid ({invoiceJob.paymentStatus})</span>
                        <span className="font-mono tabular-nums">
                          {formatINR(invoiceJob.paidAmount, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="pt-3 border-t text-[11px] font-mono flex flex-wrap items-center justify-between gap-2"
                    style={{
                      borderColor: 'var(--tb-border)',
                      color: 'var(--tb-text-muted)',
                    }}
                  >
                    <span>
                      WRKFLW SaaS Platform · License {ownershipCert.ownershipCode}
                    </span>
                    <span>Proprietor: {ownershipCert.ownerEmail}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePaymentSubmit}
            className="tb-surface-solid rounded-xl w-full max-w-sm p-6 space-y-4 shadow-xl"
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <h3 className="text-base font-display font-bold">
                Record Payment · {paymentJob.jobNumber}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentJobId(null)}
                className="p-1"
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
                  Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as NonNullable<JobCard['paymentMethod']>
                    )
                  }
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm"
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card / RuPay</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">NEFT / IMPS Transfer</option>
                </select>
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-2 pt-3 border-t"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <button
                type="button"
                onClick={() => setPaymentJobId(null)}
                className="px-4 py-2 text-xs font-medium"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
