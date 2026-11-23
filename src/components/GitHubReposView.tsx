import React, { useState, useEffect } from 'react';
import {
  Search,
  GitBranch,
  Star,
  GitFork,
  Folder,
  FileCode,
  ArrowLeft,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  CURATED_GARAGE_REPOS,
  fetchRawFileContent,
  fetchRepositoryContents,
  fetchRepositoryDetails,
  fetchRepositoryReadme,
  searchGarageRepositories,
} from '../lib/githubApi';
import { GITHUB_WORKSHOP_PRESETS } from '../data/workshopSeed';
import {
  GitHubContentEntry,
  GitHubRepoSummary,
  WorkshopPresetTemplate,
} from '../types';

interface GitHubReposViewProps {
  activeLinkedRepo: string;
  onLinkRepo: (repoFullName: string) => void;
  onImportPreset: (preset: WorkshopPresetTemplate) => void;
}

export default function GitHubReposView({
  activeLinkedRepo,
  onLinkRepo,
  onImportPreset,
}: GitHubReposViewProps) {
  const [searchQuery, setSearchQuery] = useState('garage management system');
  const [directRepoInput, setDirectRepoInput] = useState('');
  const [searchResults, setSearchResults] = useState<GitHubRepoSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepoSummary | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState<GitHubContentEntry[]>([]);
  const [readmeContent, setReadmeContent] = useState('');
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    path: string;
    content: string;
  } | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'readme' | 'files'>('files');
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  useEffect(() => {
    handleSearch('garage management system');
    handleInspectRepo(activeLinkedRepo || 'rene98c/carcareco');
  }, []);

  const handleSearch = async (queryOverride?: string) => {
    const q = (queryOverride ?? searchQuery).trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await searchGarageRepositories(q, 10);
      setSearchResults(res.items || []);
    } catch (err: any) {
      setSearchError(err?.message || 'Unable to query GitHub public API.');
    } finally {
      setSearching(false);
    }
  };

  const handleInspectRepo = async (fullName: string) => {
    const clean = fullName.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (!clean.includes('/')) {
      setRepoError('Enter a valid public GitHub repository in owner/repo format.');
      return;
    }
    setLoadingRepo(true);
    setRepoError(null);
    setPreviewFile(null);
    setCurrentPath('');
    try {
      const [details, rootEntries, readme] = await Promise.all([
        fetchRepositoryDetails(clean),
        fetchRepositoryContents(clean, ''),
        fetchRepositoryReadme(clean),
      ]);
      setSelectedRepo(details);
      setContents(rootEntries);
      setReadmeContent(readme);
      onLinkRepo(details.full_name);
    } catch (err: any) {
      setRepoError(err?.message || 'Failed to fetch repository data from GitHub.');
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleOpenDirectory = async (path: string) => {
    if (!selectedRepo) return;
    setLoadingRepo(true);
    setRepoError(null);
    setPreviewFile(null);
    try {
      const entries = await fetchRepositoryContents(selectedRepo.full_name, path);
      setContents(entries);
      setCurrentPath(path);
    } catch (err: any) {
      setRepoError(err?.message || 'Failed to open directory.');
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleOpenFile = async (entry: GitHubContentEntry) => {
    if (!selectedRepo) return;
    setLoadingRepo(true);
    setRepoError(null);
    try {
      const content = await fetchRawFileContent(selectedRepo.full_name, entry.path);
      setPreviewFile({ name: entry.name, path: entry.path, content });
    } catch (err: any) {
      setRepoError(err?.message || 'Unable to preview file.');
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    handleOpenDirectory(parts.join('/'));
  };

  const triggerPresetImport = (preset: WorkshopPresetTemplate) => {
    onImportPreset(preset);
    onLinkRepo(preset.repoFullName);
    setImportNotice(
      `Imported "${preset.title}" (${preset.partsPack.length} SKUs & ${preset.laborRates.length} service ops) from ${preset.repoFullName}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Direct Fetch Header */}
      <div className="tb-surface rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-semibold">
              GitHub Public Repository Fetcher
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tb-text-muted)' }}>
              Search live public garage and workshop management repositories via GitHub REST API, inspect source files, and import workflow presets
            </p>
          </div>
          <div
            className="text-xs font-mono shrink-0"
            style={{ color: 'var(--tb-text-secondary)' }}
          >
            Active Source:{' '}
            <span className="font-semibold" style={{ color: 'var(--tb-text)' }}>
              {activeLinkedRepo}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--tb-text-muted)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search GitHub repos (e.g. workshop management system)"
                className="tb-input w-full h-9 pl-9 pr-3 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="tb-btn-primary px-4 h-9 disabled:opacity-60 text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              {searching ? 'Searching...' : 'Search GitHub'}
            </button>
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (directRepoInput.trim()) handleInspectRepo(directRepoInput);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={directRepoInput}
              onChange={(e) => setDirectRepoInput(e.target.value)}
              placeholder="Fetch specific public repo (owner/repo)"
              className="tb-input flex-1 h-9 px-3 rounded-lg text-sm font-mono"
            />
            <button
              type="submit"
              disabled={loadingRepo}
              className="tb-btn-secondary px-4 h-9 text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              Fetch Repo
            </button>
          </form>
        </div>

        {/* Curated Open-Source Garage Repos */}
        <div
          className="pt-3 border-t"
          style={{ borderColor: 'var(--tb-border)' }}
        >
          <p
            className="text-xs font-medium mb-2"
            style={{ color: 'var(--tb-text-muted)' }}
          >
            Verified Open-Source Garage &amp; Workshop Repositories
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
            {CURATED_GARAGE_REPOS.map((repo) => {
              const isSelected =
                selectedRepo?.full_name.toLowerCase() === repo.fullName.toLowerCase();
              return (
                <button
                  key={repo.fullName}
                  type="button"
                  onClick={() => handleInspectRepo(repo.fullName)}
                  className="p-3 rounded-lg border text-left transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--tb-accent-soft)'
                      : 'var(--tb-surface-solid)',
                    borderColor: isSelected
                      ? 'var(--tb-accent)'
                      : 'var(--tb-border)',
                  }}
                >
                  <p className="text-xs font-semibold truncate">{repo.label}</p>
                  <p
                    className="text-[11px] font-mono truncate mt-0.5"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    {repo.fullName}
                  </p>
                  <p
                    className="text-[11px] mt-1 line-clamp-2"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    {repo.stack}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {importNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {importNotice}
          </span>
          <button
            type="button"
            onClick={() => setImportNotice(null)}
            className="font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split: Live Search Results + Live Repo File/README Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Search Results + Preset Importer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="tb-surface rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Live GitHub Search Results
              </h3>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="text-xs inline-flex items-center gap-1 hover:underline"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${searching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {searchError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            {searching ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-14 rounded-lg opacity-60"
                    style={{ backgroundColor: 'var(--tb-surface-muted)' }}
                  />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <p
                className="text-xs py-6 text-center"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                No public repositories matched that query.
              </p>
            ) : (
              <div
                className="divide-y max-h-[380px] overflow-y-auto workshop-scroll"
                style={{ borderColor: 'var(--tb-border)' }}
              >
                {searchResults.map((repo) => (
                  <div
                    key={repo.id}
                    className="py-3 space-y-1"
                    style={{ borderColor: 'var(--tb-border)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectRepo(repo.full_name)}
                        className="text-xs font-mono font-semibold hover:underline truncate text-left"
                      >
                        {repo.full_name}
                      </button>
                      <span
                        className="inline-flex items-center gap-2 text-[11px] font-mono shrink-0 tabular-nums"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500" />
                          {repo.stargazers_count}
                        </span>
                        {repo.language && <span>{repo.language}</span>}
                      </span>
                    </div>
                    <p
                      className="text-xs line-clamp-2"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preset Schema Importers */}
          <div className="tb-surface rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Import Workshop Catalog &amp; Job Templates
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                Populate WRKFLW inventory SKUs, INR labor templates, and inspection checklists modeled from public GitHub repos
              </p>
            </div>

            <div className="space-y-3">
              {GITHUB_WORKSHOP_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3.5 border rounded-lg space-y-2"
                  style={{
                    borderColor: 'var(--tb-border)',
                    backgroundColor: 'var(--tb-surface-solid)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className="text-xs font-mono"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {preset.repoFullName}
                      </p>
                      <h4 className="text-sm font-semibold">{preset.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerPresetImport(preset)}
                      className="tb-btn-primary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md shrink-0 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Import
                    </button>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    {preset.architectureNotes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Repository Inspector */}
        <div className="lg:col-span-7 tb-surface rounded-xl p-5 space-y-4">
          {repoError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{repoError}</span>
            </div>
          )}

          {loadingRepo && !selectedRepo ? (
            <div className="space-y-3 py-8">
              <div
                className="h-6 w-1/2 rounded opacity-60"
                style={{ backgroundColor: 'var(--tb-surface-muted)' }}
              />
              <div
                className="h-4 w-3/4 rounded opacity-60"
                style={{ backgroundColor: 'var(--tb-surface-muted)' }}
              />
              <div
                className="h-48 rounded opacity-60"
                style={{ backgroundColor: 'var(--tb-surface-muted)' }}
              />
            </div>
          ) : selectedRepo ? (
            <>
              <div
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b"
                style={{ borderColor: 'var(--tb-border)' }}
              >
                <div>
                  <div
                    className="flex items-center gap-2 text-xs font-mono"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    <GitBranch className="w-3.5 h-3.5" style={{ color: 'var(--tb-accent)' }} />
                    <span>{selectedRepo.default_branch}</span>
                    <span>·</span>
                    <span>{selectedRepo.language || 'Multi-language'}</span>
                    {selectedRepo.license?.spdx_id && (
                      <>
                        <span>·</span>
                        <span>{selectedRepo.license.spdx_id}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-display font-bold mt-1">
                    {selectedRepo.full_name}
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    {selectedRepo.description || 'Public GitHub repository'}
                  </p>
                </div>

                <div
                  className="flex items-center gap-3 shrink-0 text-xs font-mono tabular-nums"
                  style={{ color: 'var(--tb-text-secondary)' }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    {selectedRepo.stargazers_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {selectedRepo.forks_count}
                  </span>
                  <a
                    href={selectedRepo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-sans font-semibold hover:underline"
                    style={{ color: 'var(--tb-accent)' }}
                  >
                    GitHub
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Inspector Sub-Tabs */}
              <div className="flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-1 p-1 rounded-lg"
                  style={{ backgroundColor: 'var(--tb-surface-muted)' }}
                >
                  <button
                    type="button"
                    onClick={() => setInspectorTab('files')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={
                      inspectorTab === 'files'
                        ? {
                            backgroundColor: 'var(--tb-surface-solid)',
                            color: 'var(--tb-text)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          }
                        : { color: 'var(--tb-text-muted)' }
                    }
                  >
                    Repository Files
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab('readme')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={
                      inspectorTab === 'readme'
                        ? {
                            backgroundColor: 'var(--tb-surface-solid)',
                            color: 'var(--tb-text)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          }
                        : { color: 'var(--tb-text-muted)' }
                    }
                  >
                    README.md
                  </button>
                </div>

                {inspectorTab === 'files' && currentPath && (
                  <button
                    type="button"
                    onClick={handleNavigateUp}
                    className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                    style={{ color: 'var(--tb-text-secondary)' }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back ({currentPath})
                  </button>
                )}
              </div>

              {inspectorTab === 'files' ? (
                previewFile ? (
                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--tb-surface-muted)',
                        borderColor: 'var(--tb-border)',
                      }}
                    >
                      <span className="font-mono font-semibold">
                        {previewFile.path}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewFile(null)}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--tb-accent)' }}
                      >
                        Close Preview
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-[420px] workshop-scroll leading-relaxed">
                      {previewFile.content}
                    </pre>
                  </div>
                ) : (
                  <div
                    className="border rounded-lg divide-y max-h-[460px] overflow-y-auto workshop-scroll"
                    style={{
                      borderColor: 'var(--tb-border)',
                      backgroundColor: 'var(--tb-surface-solid)',
                    }}
                  >
                    {loadingRepo ? (
                      <div
                        className="p-6 text-xs text-center"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        Fetching directory tree from GitHub...
                      </div>
                    ) : (
                      contents.map((entry) => (
                        <button
                          key={entry.path}
                          type="button"
                          onClick={() =>
                            entry.type === 'dir'
                              ? handleOpenDirectory(entry.path)
                              : handleOpenFile(entry)
                          }
                          className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left text-xs transition-colors"
                          style={{ borderColor: 'var(--tb-border)' }}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            {entry.type === 'dir' ? (
                              <Folder
                                className="w-4 h-4 shrink-0"
                                style={{ color: 'var(--tb-accent)' }}
                              />
                            ) : (
                              <FileCode
                                className="w-4 h-4 shrink-0"
                                style={{ color: 'var(--tb-text-muted)' }}
                              />
                            )}
                            <span className="font-mono truncate">
                              {entry.name}
                            </span>
                          </span>
                          <span
                            className="font-mono text-[11px] shrink-0 tabular-nums"
                            style={{ color: 'var(--tb-text-muted)' }}
                          >
                            {entry.type === 'file'
                              ? `${(entry.size / 1024).toFixed(1)} KB`
                              : 'dir'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-5 max-h-[460px] overflow-y-auto workshop-scroll"
                  style={{
                    borderColor: 'var(--tb-border)',
                    backgroundColor: 'var(--tb-surface-solid)',
                    color: 'var(--tb-text-secondary)',
                  }}
                >
                  <ReactMarkdown>{readmeContent}</ReactMarkdown>
                </div>
              )}
            </>
          ) : (
            <p
              className="text-sm py-12 text-center"
              style={{ color: 'var(--tb-text-muted)' }}
            >
              Select a repository on the left to inspect its structure and files.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
