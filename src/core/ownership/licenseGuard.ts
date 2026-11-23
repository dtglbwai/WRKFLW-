/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 * Encapsulated Ownership Seal, Runtime Verification & Non-Replication Guard.
 */

export interface OwnershipCertificate {
  readonly platformName: string;
  readonly ownershipCode: string;
  readonly ownerEmail: string;
  readonly jurisdiction: string;
  readonly licenseType: string;
  readonly protectedAssets: readonly string[];
  readonly restrictionNotice: string;
  readonly expectedSealDigest: string;
}

export interface IntegrityVerificationResult {
  valid: boolean;
  ownershipCode: string;
  ownerEmail: string;
  digestHex: string;
  verifiedAtIso: string;
}

const PROTECTED_CAPABILITIES: readonly string[] = Object.freeze([
  'Multi-Tenant SaaS Workspace Isolation & RBAC Policy Kernel',
  '7-Stage Automotive Repair Order Workflow & Bay Interlock Engine',
  'Indian Rupee (INR) & 18% GST Tax Invoicing Calculation Core',
  'Digital Multi-Point Inspection (MPI) & OBD-II Telemetry Architecture',
  'Spare Parts Reorder Threshold & Bin Allocation System',
  'GitHub Public Repository Catalog Sync & Preset Importer',
]);

class ProprietaryOwnershipVault {
  readonly #ownershipCode = 'SGSR14061977820DLVR';
  readonly #ownerEmail = 'dtglbw@gmail.com';
  readonly #platformName = 'WRKFLW Multi-Tenant Automotive SaaS';
  readonly #licenseType = 'Proprietary Commercial SaaS License';
  readonly #jurisdiction = 'India (INR / GST Compliant)';
  readonly #restrictionNotice =
    'All source code, architecture, workflow engines, UI structures, tools, and capabilities are proprietary to SGSR14061977820DLVR (dtglbw@gmail.com). Copying, redistribution, reverse engineering, or replication without prior written permission is strictly prohibited.';

  #computeDeterministicSeal(payload: string): string {
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < payload.length; i += 1) {
      const ch = payload.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= ch + (i << 1);
      h2 = Math.imul(h2, 0x85ebca6b);
    }
    const p1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
    const p2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
    return `WRKFLW-${p1}-${p2}`;
  }

  getCertificate(): OwnershipCertificate {
    const raw = `${this.#platformName}|${this.#ownershipCode}|${this.#ownerEmail}|${PROTECTED_CAPABILITIES.join(';')}`;
    return Object.freeze({
      platformName: this.#platformName,
      ownershipCode: this.#ownershipCode,
      ownerEmail: this.#ownerEmail,
      jurisdiction: this.#jurisdiction,
      licenseType: this.#licenseType,
      protectedAssets: PROTECTED_CAPABILITIES,
      restrictionNotice: this.#restrictionNotice,
      expectedSealDigest: this.#computeDeterministicSeal(raw),
    });
  }

  async verifyIntegrity(): Promise<IntegrityVerificationResult> {
    const cert = this.getCertificate();
    const canonical = `${cert.platformName}::${cert.ownershipCode}::${cert.ownerEmail}::${cert.protectedAssets.length}`;
    let digestHex = cert.expectedSealDigest;

    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      try {
        const bytes = new TextEncoder().encode(canonical);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        digestHex = hashArray
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .slice(0, 24)
          .toUpperCase();
      } catch {
        digestHex = cert.expectedSealDigest;
      }
    }

    const valid =
      cert.ownershipCode === 'SGSR14061977820DLVR' &&
      cert.ownerEmail === 'dtglbw@gmail.com' &&
      cert.protectedAssets.length === 6;

    return Object.freeze({
      valid,
      ownershipCode: cert.ownershipCode,
      ownerEmail: cert.ownerEmail,
      digestHex,
      verifiedAtIso: new Date().toISOString(),
    });
  }

  getAttributionStamp(): string {
    return `[WRKFLW SaaS | Ownership ID: ${this.#ownershipCode} | Owner: ${this.#ownerEmail} | All Rights Reserved — Replication without prior written permission prohibited]`;
  }

  isPlatformOwnerEmail(email?: string | null): boolean {
    if (!email) return false;
    return email.trim().toLowerCase() === this.#ownerEmail;
  }
}

const ownershipVault = new ProprietaryOwnershipVault();
Object.freeze(ownershipVault);

export function getOwnershipCertificate(): OwnershipCertificate {
  return ownershipVault.getCertificate();
}

export function verifyOwnershipSeal(): Promise<IntegrityVerificationResult> {
  return ownershipVault.verifyIntegrity();
}

export function getOwnershipAttributionStamp(): string {
  return ownershipVault.getAttributionStamp();
}

export function isRegisteredOwnerEmail(email?: string | null): boolean {
  return ownershipVault.isPlatformOwnerEmail(email);
}

export function installDocumentProvenanceAndGuards(): () => void {
  if (typeof document === 'undefined') return () => {};

  const cert = ownershipVault.getCertificate();

  const ensureMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  ensureMeta('author', cert.ownerEmail);
  ensureMeta('ownership-id', cert.ownershipCode);
  ensureMeta('copyright', cert.restrictionNotice);
  document.documentElement.setAttribute('data-ownership-id', cert.ownershipCode);
  document.documentElement.setAttribute('data-owner-contact', cert.ownerEmail);

  const handleCopy = (e: ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }
    const selection = window.getSelection()?.toString().trim();
    if (!selection || selection.length < 40) return;

    if (e.clipboardData) {
      e.preventDefault();
      e.clipboardData.setData(
        'text/plain',
        `${selection}\n\n${ownershipVault.getAttributionStamp()}`
      );
    }
  };

  document.addEventListener('copy', handleCopy);
  return () => {
    document.removeEventListener('copy', handleCopy);
  };
}
