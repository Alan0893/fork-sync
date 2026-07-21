import simpleGit, { SimpleGit } from 'simple-git';
import https from 'https';

export function createGit(cwd?: string): SimpleGit {
  return simpleGit(cwd);
}

function parseGitHubRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

function fetchParentRepo(owner: string, repo: string): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: { 'User-Agent': 'fork-sync-cli', Accept: 'application/vnd.github.v3+json' } },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data.fork && data.parent?.clone_url ? data.parent.clone_url : null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

export async function detectUpstream(git: SimpleGit): Promise<{ name: string; url: string }> {
  const remotes = await git.getRemotes(true);
  const upstream = remotes.find((r) => r.name === 'upstream');
  if (upstream) {
    return { name: upstream.name, url: upstream.refs.fetch };
  }

  const nonOrigin = remotes.find((r) => r.name !== 'origin');
  if (nonOrigin) {
    return { name: nonOrigin.name, url: nonOrigin.refs.fetch };
  }

  // Auto-detect: look up the parent repo via GitHub API
  const origin = remotes.find((r) => r.name === 'origin');
  if (origin) {
    const parsed = parseGitHubRepo(origin.refs.fetch);
    if (parsed) {
      const parentUrl = await fetchParentRepo(parsed.owner, parsed.repo);
      if (parentUrl) {
        await git.addRemote('upstream', parentUrl);
        return { name: 'upstream', url: parentUrl };
      }
    }
  }

  throw new Error(
    'Could not auto-detect upstream. This repo may not be a GitHub fork.\n  Add one manually: fork-sync setup <upstream-url>'
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
