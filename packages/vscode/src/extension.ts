import * as vscode from 'vscode';
import { createStatusBar, updateStatusBar } from './statusBar';
import { syncCommand, statusCommand, setupCommand } from './commands';

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = createStatusBar();
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.commands.registerCommand('forkSync.sync', syncCommand),
    vscode.commands.registerCommand('forkSync.status', statusCommand),
    vscode.commands.registerCommand('forkSync.setup', setupCommand)
  );

  updateStatusBar();

  const interval = setInterval(() => updateStatusBar(), 5 * 60 * 1000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

export function deactivate(): void {}
