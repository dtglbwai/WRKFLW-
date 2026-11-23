/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 * Encapsulated Automotive Repair Order, GST Calculation & Bay Dispatch Engine.
 */

import { JobCard, JobStatus, SaasRole } from '../../types';

export interface InvoiceFinancialBreakdown {
  readonly laborSubtotal: number;
  readonly partsSubtotal: number;
  readonly taxableSubtotal: number;
  readonly discountAmount: number;
  readonly cgstAmount: number;
  readonly sgstAmount: number;
  readonly taxAmount: number;
  readonly grandTotal: number;
  readonly balanceDue: number;
}

class WorkshopWorkflowKernel {
  readonly #stageSequence: readonly JobStatus[] = Object.freeze([
    'Intake',
    'Diagnostics',
    'Awaiting Parts',
    'In Repair',
    'Quality Check',
    'Ready for Pickup',
    'Invoiced',
  ]);

  computeTotals(job: JobCard): InvoiceFinancialBreakdown {
    const laborSubtotal = job.laborItems.reduce(
      (sum, item) => sum + Math.max(0, item.hours) * Math.max(0, item.hourlyRate),
      0
    );
    const partsSubtotal = job.partsUsed.reduce(
      (sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
      0
    );
    const gross = laborSubtotal + partsSubtotal;
    const discountAmount = Math.min(gross, Math.max(0, job.discountAmount || 0));
    const taxableSubtotal = Math.max(0, gross - discountAmount);
    const taxRate = Math.max(0, job.taxRatePercent ?? 18);
    const taxAmount = taxableSubtotal * (taxRate / 100);
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;
    const grandTotal = taxableSubtotal + taxAmount;
    const balanceDue = Math.max(0, grandTotal - Math.max(0, job.paidAmount || 0));

    return Object.freeze({
      laborSubtotal,
      partsSubtotal,
      taxableSubtotal,
      discountAmount,
      cgstAmount,
      sgstAmount,
      taxAmount,
      grandTotal,
      balanceDue,
    });
  }

  canTransitionStatus(
    current: JobCard,
    nextStatus: JobStatus,
    actorRole: SaasRole
  ): { allowed: boolean; reason?: string } {
    if (
      current.status === 'Invoiced' &&
      current.paymentStatus === 'Paid' &&
      nextStatus !== 'Invoiced' &&
      actorRole !== 'Platform Owner' &&
      actorRole !== 'Workshop Admin'
    ) {
      return {
        allowed: false,
        reason:
          'Paid & Invoiced repair orders are terminally locked. Admin authorization required to reopen.',
      };
    }

    if (!this.#stageSequence.includes(nextStatus)) {
      return { allowed: false, reason: 'Invalid workflow stage.' };
    }

    return { allowed: true };
  }

  formatInrCurrency(amount: number, decimals = 0): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }
}

const workflowKernel = new WorkshopWorkflowKernel();
Object.freeze(workflowKernel);

export function computeRepairOrderTotals(
  job: JobCard
): InvoiceFinancialBreakdown {
  return workflowKernel.computeTotals(job);
}

export function validateStatusTransition(
  current: JobCard,
  nextStatus: JobStatus,
  actorRole: SaasRole
) {
  return workflowKernel.canTransitionStatus(current, nextStatus, actorRole);
}

export function formatInrAmount(amount: number, decimals = 0): string {
  return workflowKernel.formatInrCurrency(amount, decimals);
}
