import * as vscode from 'vscode';
import { createGit, sync, getStatus, setupUpstream } from '@fork-sync/core';
import { updateStatusBar } from './statusBar';

function getWorkspacePath(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export async function syncCommand(): Promise<void> {
  const cwd = getWorkspacePath();
  if (!cwd) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  const config = vscode.workspace.getConfiguration('forkSync');
  const git = createGit(cwd);

  const result = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Syncing with upstream...' },
    () =>
      sync(git, {
        strategy: config.get('strategy', 'rebase'),
        branch: config.get('defaultBranch', 'main'),
        push: config.get('autoPush', false),
      })
  );

  if (result.status === 'success') {
    vscode.window.showInformationMessage(result.message);
  } else if (result.status === 'conflict') {
    vscode.window.showWarningMessage(result.message);
  } else {
    vscode.window.showErrorMessage(result.message);
  }

  await updateStatusBar();
}

export async function statusCommand(): Promise<void> {
  const cwd = getWorkspacePath();
  if (!cwd) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  const config = vscode.workspace.getConfiguration('forkSync');
  const git = createGit(cwd);

  try {
    const status = await getStatus(git, config.get('defaultBranch', 'main'));
    const parts = [`Branch: ${status.currentBranch}`, `Upstream: ${status.upstreamRemote}`];

    if (status.behind === 0) {
      parts.push('Up to date');
    } else {
      parts.push(`${status.behind} commit(s) behind`);
    }
    if (status.ahead > 0) {
      parts.push(`${status.ahead} commit(s) ahead`);
    }

    vscode.window.showInformationMessage(parts.join(' | '));
  } catch (err) {
    vscode.window.showErrorMessage(err instanceof Error ? err.message : String(err));
  }
}

export async function setupCommand(): Promise<void> {
  const cwd = getWorkspacePath();
  if (!cwd) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  const url = await vscode.window.showInputBox({
    prompt: 'Enter the upstream repository URL',
    placeHolder: 'https://github.com/owner/repo.git',
  });

  if (!url) return;

  const git = createGit(cwd);
  try {
    const message = await setupUpstream(git, url);
    vscode.window.showInformationMessage(message);
    await updateStatusBar();
  } catch (err) {
    vscode.window.showErrorMessage(err instanceof Error ? err.message : String(err));
  }
}
