import simpleGit, { SimpleGit } from 'simple-git';

export function createGit(cwd?: string): SimpleGit {
  return simpleGit(cwd);
}

export async function detectUpstream(git: SimpleGit): Promise<{ name: string; url: string }> {
  const remotes = await git.getRemotes(true);
  const upstream = remotes.find((r) => r.name === 'upstream');
  if (upstream) {
    return { name: upstream.name, url: upstream.refs.fetch };
  }
  if (remotes.length === 1) {
    throw new Error(
      'Only one remote found (origin). Add an upstream remote:\n  fork-sync setup <upstream-url>'
    );
  }
  const nonOrigin = remotes.find((r) => r.name !== 'origin');
  if (nonOrigin) {
    return { name: nonOrigin.name, url: nonOrigin.refs.fetch };
  }
  throw new Error(
    'No upstream remote found. Add one:\n  fork-sync setup <upstream-url>'
  );
}

export async function setupUpstream(git: SimpleGit, url: string): Promise<string> {
  const remotes = await git.getRemotes(true);
  if (remotes.find((r) => r.name === 'upstream')) {
    await git.remote(['set-url', 'upstream', url]);
    return 'Updated upstream remote URL.';
  }
  await git.addRemote('upstream', url);
  return 'Added upstream remote.';
}
