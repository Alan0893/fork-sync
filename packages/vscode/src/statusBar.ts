import * as vscode from 'vscode';
import { createGit, getStatus } from '@fork-sync/core';

let statusBarItem: vscode.StatusBarItem;

export function createStatusBar(): vscode.StatusBarItem {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  statusBarItem.command = 'forkSync.sync';
  statusBarItem.tooltip = 'Click to sync with upstream';
  statusBarItem.text = '$(git-compare) fork-sync';
  statusBarItem.show();
  return statusBarItem;
}

export async function updateStatusBar(): Promise<void> {
  if (!statusBarItem) return;
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    statusBarItem.hide();
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration('forkSync');
    const branch = config.get<string>('defaultBranch', 'main');
    const git = createGit(folders[0].uri.fsPath);
    const status = await getStatus(git, branch);

    if (status.behind === 0) {
      statusBarItem.text = '$(check) fork-sync';
      statusBarItem.tooltip = 'Up to date with upstream';
    } else {
      statusBarItem.text = `$(arrow-down) fork-sync ↓${status.behind}`;
      statusBarItem.tooltip = `${status.behind} commit(s) behind upstream — click to sync`;
    }
    statusBarItem.show();
  } catch {
    statusBarItem.text = '$(git-compare) fork-sync';
    statusBarItem.tooltip = 'No upstream remote configured';
  }
}
