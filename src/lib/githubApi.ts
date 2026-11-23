import { GitHubContentEntry, GitHubRepoSummary } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

const headers: HeadersInit = {
  Accept: 'application/vnd.github+json',
};

export interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepoSummary[];
}

export async function searchGarageRepositories(
  query: string,
  perPage = 12
): Promise<GitHubSearchResponse> {
  const cleanQuery = query.trim() || 'garage management system';
  const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(
    cleanQuery
  )}&sort=stars&order=desc&per_page=${perPage}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub public API rate limit reached. Try again in a minute.');
    }
    throw new Error(`GitHub search failed (${response.status})`);
  }
  return response.json();
}

export async function fetchRepositoryDetails(
  fullName: string
): Promise<GitHubRepoSummary> {
  const url = `${GITHUB_API_BASE}/repos/${fullName}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository "${fullName}" was not found or is private.`);
    }
    if (response.status === 403) {
      throw new Error('GitHub public API rate limit reached.');
    }
    throw new Error(`Failed to fetch repository (${response.status})`);
  }
  return response.json();
}

export async function fetchRepositoryContents(
  fullName: string,
  path = ''
): Promise<GitHubContentEntry[]> {
  const cleanPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  const url = `${GITHUB_API_BASE}/repos/${fullName}/contents${cleanPath}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Unable to read directory contents (${response.status})`);
  }
  const data = await response.json();
  const entries: GitHubContentEntry[] = Array.isArray(data) ? data : [data];
  return entries.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });
}

export async function fetchRepositoryReadme(fullName: string): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${fullName}/readme`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 404) return 'No README found in this repository.';
    throw new Error(`Unable to fetch README (${response.status})`);
  }
  const data = await response.json();
  if (data?.content) {
    return decodeBase64Utf8(data.content);
  }
  if (data?.download_url) {
    const raw = await fetch(data.download_url);
    return raw.text();
  }
  return 'README content unavailable.';
}

export async function fetchRawFileContent(
  fullName: string,
  filePath: string
): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${fullName}/contents/${filePath.replace(/^\/+/, '')}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch file "${filePath}" (${response.status})`);
  }
  const data = await response.json();
  if (data?.content) {
    return decodeBase64Utf8(data.content);
  }
  if (data?.download_url) {
    const rawResp = await fetch(data.download_url);
    return rawResp.text();
  }
  throw new Error('File preview not available for binary or large file.');
}

function decodeBase64Utf8(base64: string): string {
  const sanitized = base64.replace(/\n/g, '');
  const binaryString = atob(sanitized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

export const CURATED_GARAGE_REPOS: {
  fullName: string;
  label: string;
  stack: string;
  focus: string;
}[] = [
  {
    fullName: 'rene98c/carcareco',
    label: 'CarCare (.NET + Next.js)',
    stack: 'Next.js / .NET / Tailwind',
    focus: 'Job orders, vehicle service histories, PDF estimates & parts inventory',
  },
  {
    fullName: 'Irshaduu/workshopos-v1',
    label: 'WorkshopOS (Django 5.2)',
    stack: 'Python / Django / PostgreSQL',
    focus: '3-tier RBAC, job cards, spare parts shop ledger & cashbook analytics',
  },
  {
    fullName: 'ChanMeng666/automotive-repair-management-system',
    label: 'Automotive Repair MS',
    stack: 'Python / Flask / MySQL',
    focus: 'Admin & mechanic dual portals, intake-to-handover job cards & billing',
  },
  {
    fullName: 'ShaikhMazin/Garage-Management-System',
    label: 'Garage Management System',
    stack: 'Python / Flask / MySQL',
    focus: 'Plate-number vehicle search, dynamic service rows & printable invoices',
  },
  {
    fullName: '0xmahmoudd/Mechanic-Shop',
    label: 'Mechanic Shop Workflow',
    stack: 'Full-Stack Repair Ledger',
    focus: 'Work order scheduling, technician assignment & auto parts consumption',
  },
];
