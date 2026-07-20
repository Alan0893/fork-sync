export interface SyncOptions {
  strategy: 'rebase' | 'merge';
  branch: string;
  push: boolean;
}

export interface SyncResult {
  status: 'success' | 'conflict' | 'error';
  branch: string;
  upstream: string;
  message: string;
}

export interface ForkStatus {
  currentBranch: string;
  upstreamRemote: string;
  upstreamUrl: string;
  ahead: number;
  behind: number;
}

export const DEFAULT_OPTIONS: SyncOptions = {
  strategy: 'rebase',
  branch: 'main',
  push: false,
};
