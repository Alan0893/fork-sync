# fork-sync

CLI + VS Code extension to sync your fork with upstream in one command.

## Installation

```bash
npm install -g fork-sync
```

Or run directly with npx:
```bash
npx fork-sync status
```

## CLI Usage

```bash
# Add the upstream remote (one-time setup)
fork-sync setup https://github.com/owner/repo.git

# Check how far behind you are
fork-sync status

# Sync your branch with upstream (rebase by default)
fork-sync sync

# Sync and push in one shot
fork-sync sync --push

# Use merge instead of rebase
fork-sync sync --strategy merge

# Sync against a different upstream branch
fork-sync sync --branch develop
```

### Commands

| Command | Description |
|---|---|
| `fork-sync sync` | Sync current branch with upstream |
| `fork-sync status` | Show ahead/behind counts |
| `fork-sync setup <url>` | Add or update the upstream remote |

### Options for `sync`

| Flag | Description | Default |
|---|---|---|
| `-b, --branch <branch>` | Upstream branch to sync with | `main` |
| `-s, --strategy <strategy>` | `rebase` or `merge` | `rebase` |
| `-p, --push` | Push to origin after sync | `false` |

## VS Code Extension

Open a forked repo in VS Code, then use the command palette:

- **Fork Sync: Set Upstream** — add the upstream remote URL
- **Fork Sync: Sync with Upstream** — sync using your configured strategy
- **Fork Sync: Show Status** — show ahead/behind in a notification

The status bar shows sync state at a glance: `fork-sync ↓3` when behind, `✓ fork-sync` when up to date.

### Extension Settings

| Setting | Description | Default |
|---|---|---|
| `forkSync.strategy` | Sync strategy (`rebase` or `merge`) | `rebase` |
| `forkSync.defaultBranch` | Upstream branch to sync with | `main` |
| `forkSync.autoPush` | Auto-push after syncing | `false` |

## Project Structure

```
fork-sync/
├── packages/
│   ├── core/      # Shared sync logic (simple-git)
│   ├── cli/       # CLI entry point (commander + chalk)
│   └── vscode/    # VS Code extension
├── package.json   # npm workspaces root
└── tsconfig.json
```

## License

MIT
