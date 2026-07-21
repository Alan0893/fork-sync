import { Command } from 'commander';
import chalk from 'chalk';
import { createGit, sync, getStatus, setupUpstream, detectUpstream } from '@fork-sync/core';

const program = new Command();

program
  .name('fork-sync')
  .description('Sync your fork with upstream')
  .version('0.1.0');

program
  .command('sync', { isDefault: true })
  .description('Sync current branch with upstream')
  .option('-b, --branch <branch>', 'upstream branch to sync with', 'main')
  .option('-s, --strategy <strategy>', 'merge strategy (rebase or merge)', 'rebase')
  .option('-p, --push', 'push to origin after sync', false)
  .action(async (opts) => {
    const git = createGit();
    try {
      const remotes = await git.getRemotes(true);
      const hadUpstream = remotes.some((r) => r.name === 'upstream');

      const result = await sync(git, {
        branch: opts.branch,
        strategy: opts.strategy,
        push: opts.push,
      });

      if (!hadUpstream) {
        const { url } = await detectUpstream(git);
        console.log(chalk.blue('ℹ'), `Auto-detected upstream: ${chalk.cyan(url)}`);
      }

      if (result.status === 'success') {
        console.log(chalk.green('✓'), result.message);
      } else if (result.status === 'conflict') {
        console.log(chalk.yellow('⚠'), result.message);
        process.exit(1);
      } else {
        console.log(chalk.red('✗'), result.message);
        process.exit(2);
      }
    } catch (err) {
      console.error(chalk.red('✗'), err instanceof Error ? err.message : err);
      process.exit(2);
    }
  });

program
  .command('status')
  .description('Show sync status with upstream')
  .option('-b, --branch <branch>', 'upstream branch to check against', 'main')
  .action(async (opts) => {
    const git = createGit();
    try {
      const status = await getStatus(git, opts.branch);
      console.log(chalk.bold('Fork Status'));
      console.log(`  Branch:   ${chalk.cyan(status.currentBranch)}`);
      console.log(`  Upstream: ${chalk.gray(status.upstreamRemote)} (${status.upstreamUrl})`);
      if (status.behind === 0) {
        console.log(`  ${chalk.green('✓ Up to date')}`);
      } else {
        console.log(`  ${chalk.yellow(`↓ ${status.behind} commit${status.behind !== 1 ? 's' : ''} behind`)}`);
      }
      if (status.ahead > 0) {
        console.log(`  ${chalk.blue(`↑ ${status.ahead} commit${status.ahead !== 1 ? 's' : ''} ahead`)}`);
      }
    } catch (err) {
      console.error(chalk.red('✗'), err instanceof Error ? err.message : err);
      process.exit(2);
    }
  });

program
  .command('setup <url>')
  .description('Add or update the upstream remote')
  .action(async (url) => {
    const git = createGit();
    try {
      const message = await setupUpstream(git, url);
      console.log(chalk.green('✓'), message);
    } catch (err) {
      console.error(chalk.red('✗'), err instanceof Error ? err.message : err);
      process.exit(2);
    }
  });

program.parse();
