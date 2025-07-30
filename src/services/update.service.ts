import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { StorageService } from './storage.service';
import * as semver from 'semver';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

interface UpdateCache {
  lastCheck: number;
  latestVersion: string;
  currentVersion: string;
  hasNotified: boolean;
}

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name);
  private readonly packageName = 'superjolt';
  private readonly currentVersion: string;
  private readonly UPDATE_CACHE_KEY = 'update-check';

  constructor(
    private readonly httpService: HttpService,
    private readonly storageService: StorageService,
  ) {
    // Get current version from package.json
    const pkgPath = path.join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    this.currentVersion = pkg.version;
  }

  async checkForUpdates(force = false): Promise<void> {
    // Skip in CI environments
    if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
      return;
    }

    // Skip if user opted out (after 1.0 release)
    if (process.env.SUPERJOLT_NO_UPDATE_CHECK && !this.isBeta()) {
      return;
    }

    try {
      const cache = await this.readCache();
      const now = Date.now();
      const checkInterval = this.isBeta()
        ? 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000; // 1 hour for beta, 1 week for stable

      // Force check or interval passed
      if (force || !cache || now - cache.lastCheck > checkInterval) {
        await this.performUpdateCheck();
      } else if (cache && cache.latestVersion && !cache.hasNotified) {
        // Show notification if update available and not yet notified
        // But first check if we're actually outdated
        if (semver.lt(this.currentVersion, cache.latestVersion)) {
          await this.showUpdateNotification(cache);
        } else {
          // We're up to date now, clear the notification flag
          cache.hasNotified = true;
          await this.writeCache(cache);
        }
      }

      // During beta: Auto-update if significantly outdated
      if (this.isBeta()) {
        await this.enforceMinimumVersion();
      }
    } catch (error) {
      // Silently fail - don't interrupt user's work
      this.logger.debug('Update check failed:', error);
    }
  }

  async performUpdateCheck(): Promise<void> {
    try {
      const latestVersion = await this.getLatestVersion();

      const cache: UpdateCache = {
        lastCheck: Date.now(),
        latestVersion,
        currentVersion: this.currentVersion,
        hasNotified: false,
      };

      await this.writeCache(cache);

      if (semver.lt(this.currentVersion, latestVersion)) {
        await this.showUpdateNotification(cache);
      }
    } catch {
      this.logger.debug('Failed to check for updates');
    }
  }

  async getLatestVersion(): Promise<string> {
    try {
      const packageJson = (await import('package-json')).default;
      const data = await packageJson(this.packageName, { version: 'latest' });
      return data.version;
    } catch {
      throw new Error('Failed to fetch latest version from npm');
    }
  }

  private async showUpdateNotification(cache: UpdateCache): Promise<void> {
    // Mark as notified
    cache.hasNotified = true;
    await this.writeCache(cache);

    const isMajorUpdate =
      semver.major(cache.latestVersion) > semver.major(this.currentVersion);
    const updateType = isMajorUpdate
      ? chalk.red('MAJOR')
      : chalk.yellow('UPDATE');

    console.log('\n' + '─'.repeat(50));
    console.log(
      `🚀 ${updateType} available! ${chalk.dim(this.currentVersion)} → ${chalk.green(cache.latestVersion)}`,
    );

    if (this.isBeta()) {
      console.log(
        chalk.yellow('   Beta version - auto-update may be required'),
      );
    }

    console.log(`   Run ${chalk.cyan('superjolt update')} to update`);

    if (!this.isBeta()) {
      console.log(chalk.dim(`   Disable: SUPERJOLT_NO_UPDATE_CHECK=1`));
    }

    console.log('─'.repeat(50) + '\n');
  }

  private async enforceMinimumVersion(): Promise<void> {
    try {
      // During beta, force update if CLI is severely outdated (e.g., major version behind)
      const latestVersion = await this.getLatestVersion();
      const majorBehind =
        semver.major(latestVersion) > semver.major(this.currentVersion);
      const minorBehind =
        semver.major(latestVersion) === semver.major(this.currentVersion) &&
        semver.minor(latestVersion) > semver.minor(this.currentVersion) + 1; // More than 1 minor version behind

      if (majorBehind || minorBehind) {
        console.log('\n' + chalk.red('━'.repeat(50)));
        console.log(chalk.red('⚠️  CRITICAL UPDATE REQUIRED'));
        console.log(
          chalk.yellow(
            `Your CLI version (${this.currentVersion}) is incompatible with the API.`,
          ),
        );
        console.log(chalk.yellow(`Updating to ${latestVersion}...`));
        console.log(chalk.red('━'.repeat(50)) + '\n');

        await this.performAutoUpdate();
      }
    } catch (error) {
      this.logger.debug('Failed to enforce minimum version:', error);
    }
  }

  async performAutoUpdate(): Promise<void> {
    try {
      console.log('🔄 Auto-updating Superjolt CLI...');

      // Check if globally installed
      const isGlobal = await this.isGloballyInstalled();

      if (isGlobal) {
        console.log('📦 Installing latest version globally...');
        execSync('npm install -g superjolt@latest', { stdio: 'inherit' });
      } else {
        console.log(
          chalk.yellow('⚠️  Cannot auto-update non-global installation'),
        );
        console.log(chalk.cyan('Please run: npx superjolt@latest'));
        process.exit(1);
      }

      console.log(
        chalk.green('✅ Update complete! Please run your command again.'),
      );
      process.exit(0);
    } catch {
      console.error(
        chalk.red('❌ Auto-update failed. Please update manually:'),
      );
      console.error(chalk.cyan('   npm install -g superjolt@latest'));
      process.exit(1);
    }
  }

  async manualUpdate(): Promise<void> {
    try {
      const latestVersion = await this.getLatestVersion();

      if (semver.gte(this.currentVersion, latestVersion)) {
        console.log(chalk.green('✅ You are already on the latest version!'));
        return;
      }

      console.log(`\nCurrent version: ${chalk.dim(this.currentVersion)}`);
      console.log(`Latest version:  ${chalk.green(latestVersion)}\n`);

      const isGlobal = await this.isGloballyInstalled();

      if (isGlobal) {
        console.log('📦 Updating globally installed CLI...');
        execSync('npm install -g superjolt@latest', { stdio: 'inherit' });
        console.log(chalk.green('\n✅ Update complete!'));
      } else {
        console.log(chalk.yellow('ℹ️  You are using a local installation.'));
        console.log(chalk.cyan('To use the latest version, run:'));
        console.log(chalk.cyan('   npx superjolt@latest <command>'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Update failed:'), error.message);
      console.error(chalk.cyan('\nTry updating manually:'));
      console.error(chalk.cyan('   npm install -g superjolt@latest'));
    }
  }

  private async isGloballyInstalled(): Promise<boolean> {
    try {
      const npmRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
      const globalPath = path.join(npmRoot, this.packageName);
      return fs.existsSync(globalPath);
    } catch {
      return false;
    }
  }

  private isBeta(): boolean {
    return this.currentVersion.includes('beta');
  }

  private async readCache(): Promise<UpdateCache | null> {
    return await this.storageService.getJson<UpdateCache>(
      this.UPDATE_CACHE_KEY,
    );
  }

  private async writeCache(cache: UpdateCache): Promise<void> {
    await this.storageService.setJson(this.UPDATE_CACHE_KEY, cache);
  }
}
