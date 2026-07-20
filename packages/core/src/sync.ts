import { SimpleGit } from 'simple-git';
import { SyncOptions, SyncResult, ForkStatus, DEFAULT_OPTIONS } from './types';
import { detectUpstream } from './upstream';

export async function sync(
  git: SimpleGit,
  opts: Partial<SyncOptions> = {}
): Promise<SyncResult> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const { name: remoteName } = await detectUpstream(git);
  const branch = (await git.branch()).current;
  const upstreamRef = `${remoteName}/${options.branch}`;

  await git.fetch(remoteName, options.branch);

  try {
    if (options.strategy === 'rebase') {
      await git.rebase([upstreamRef]);
    } else {
      await git.merge([upstreamRef]);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('CONFLICT') || message.includes('conflict')) {
      return {
        status: 'conflict',
        branch,
        upstream: upstreamRef,
        message: `Conflicts detected. Resolve them, then run:\n  git ${options.strategy} --continue`,
      };
    }
    return {
      status: 'error',
      branch,
      upstream: upstreamRef,
      message: message,
    };
  }

  if (options.push) {
    const pushArgs = options.strategy === 'rebase' ? ['--force-with-lease'] : [];
    await git.push('origin', branch, pushArgs);
  }

  return {
    status: 'success',
    branch,
    upstream: upstreamRef,
    message: `Synced ${branch} with ${upstreamRef} via ${options.strategy}.${options.push ? ' Pushed to origin.' : ''}`,
  };
}

export async function getStatus(git: SimpleGit, upstreamBranch = 'main'): Promise<ForkStatus> {
  const { name: remoteName, url } = await detectUpstream(git);
  const currentBranch = (await git.branch()).current;
  const upstreamRef = `${remoteName}/${upstreamBranch}`;

  await git.fetch(remoteName, upstreamBranch);

  let ahead = 0;
  let behind = 0;
  try {
    const log = await git.log([`${upstreamRef}..HEAD`]);
    ahead = log.total;
    const logBehind = await git.log([`HEAD..${upstreamRef}`]);
    behind = logBehind.total;
  } catch {
    // upstream ref may not exist yet
  }

  return {
    currentBranch,
    upstreamRemote: remoteName,
    upstreamUrl: url,
    ahead,
    behind,
  };
}
