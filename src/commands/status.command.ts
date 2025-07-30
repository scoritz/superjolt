import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { ConfigService } from '../services/config.service';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readSuperjoltConfig } from '../utils/project';
import { createInfoTable } from '../utils/table.utils';
import Table from 'cli-table3';

@Injectable()
@Command({
  name: 'status',
  aliases: ['info', 'config'],
  description: 'Display CLI status, configuration, and stored data',
})
export class StatusCommand extends CommandRunner {
  constructor(
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log(chalk.cyan('\n━━━ Superjolt CLI Status ━━━\n'));

    // Version Info
    const pkgPath = path.join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    console.log(chalk.bold.cyan('🔧 System Information\n'));
    const versionTable = createInfoTable();
    versionTable.push(
      [chalk.bold('CLI Version'), chalk.green(pkg.version)],
      [chalk.bold('Node Version'), chalk.green(process.version)],
      [
        chalk.bold('Platform'),
        chalk.green(`${process.platform} ${os.release()}`),
      ],
      [chalk.bold('Architecture'), chalk.green(process.arch)],
    );
    console.log(versionTable.toString());

    // API Configuration
    console.log(chalk.bold.cyan('\n🌐 API Configuration\n'));
    const apiTable = createInfoTable();
    const apiUrl = this.configService.getApiUrl();
    const baseUrl = this.configService.getBaseUrl();
    const isDefault = baseUrl === 'https://api.superjolt.com';

    apiTable.push([
      chalk.bold('API URL'),
      `${chalk.green(apiUrl)} ${isDefault ? chalk.dim('(default)') : chalk.yellow('(custom)')}`,
    ]);

    if (process.env.SUPERJOLT_API_URL) {
      apiTable.push([
        chalk.bold('Source'),
        chalk.yellow('Environment variable'),
      ]);
    }

    console.log(apiTable.toString());

    // Authentication Status
    console.log(chalk.bold.cyan('\n🔐 Authentication\n'));
    const authTable = createInfoTable();
    const token = await this.authService.getToken();

    if (token) {
      // Show partial token for security
      const maskedToken = `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
      authTable.push(
        [chalk.bold('Status'), chalk.green('Authenticated')],
        [chalk.bold('Token'), chalk.dim(maskedToken)],
      );

      // Check if using keytar or file
      try {
        const keytar = require('keytar');
        const keytarToken = await keytar.getPassword('superjolt-cli', 'token');
        if (keytarToken) {
          authTable.push([
            chalk.bold('Storage'),
            chalk.green('System Keychain (secure)'),
          ]);
        } else {
          authTable.push([
            chalk.bold('Storage'),
            chalk.yellow('File (fallback)'),
          ]);
        }
      } catch {
        authTable.push([
          chalk.bold('Storage'),
          chalk.yellow('File (keytar unavailable)'),
        ]);
      }
    } else {
      authTable.push(
        [chalk.bold('Status'), chalk.red('Not authenticated')],
        [
          chalk.bold('Action'),
          chalk.dim('Run "superjolt login" to authenticate'),
        ],
      );
    }

    console.log(authTable.toString());

    // Project Configuration
    console.log(chalk.bold.cyan('\n📁 Project Configuration\n'));
    const projectTable = createInfoTable();
    const projectConfig = readSuperjoltConfig();

    if (projectConfig) {
      projectTable.push(
        [chalk.bold('Service ID'), chalk.green(projectConfig.serviceId)],
        [chalk.bold('Config File'), chalk.dim('.superjolt')],
      );
    } else {
      projectTable.push(
        [chalk.bold('Status'), chalk.dim('No project configuration found')],
        [
          chalk.bold('Action'),
          chalk.dim('Run "superjolt deploy" to initialize'),
        ],
      );
    }

    console.log(projectTable.toString());

    // Storage Information
    console.log(chalk.bold.cyan('\n💾 Local Storage\n'));
    const storageTable = new Table({
      head: [chalk.bold.cyan('Type'), chalk.bold.cyan('Description')],
      style: { head: [], border: [] },
      chars: {
        top: '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        bottom: '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        left: '│',
        'left-mid': '├',
        mid: '─',
        'mid-mid': '┼',
        right: '│',
        'right-mid': '┤',
        middle: '│',
      },
    });

    const configDir = path.join(os.homedir(), '.config', 'superjolt');
    storageTable.push([chalk.bold('Config Directory'), chalk.dim(configDir)]);

    // List stored files
    const storedKeys = this.storageService.listKeys();
    if (storedKeys.length > 0) {
      for (const key of storedKeys) {
        if (key === 'token') {
          storageTable.push(['token', chalk.dim('Authentication credentials')]);
        } else if (key === 'update-check') {
          const updateData =
            await this.storageService.getJson<any>('update-check');
          if (updateData) {
            const lastCheck = new Date(updateData.lastCheck).toLocaleString();
            storageTable.push([
              'update-check',
              chalk.dim(`Last checked: ${lastCheck}`),
            ]);
          } else {
            storageTable.push([
              'update-check',
              chalk.dim('Update check cache'),
            ]);
          }
        } else {
          storageTable.push([key, chalk.dim('Cached data')]);
        }
      }
    } else {
      storageTable.push([chalk.dim('Empty'), chalk.dim('No stored data')]);
    }

    console.log(storageTable.toString());

    // Environment Variables
    console.log(chalk.bold.cyan('\n🔧 Environment Variables\n'));
    const envTable = createInfoTable();
    const envVars = [
      'SUPERJOLT_API_URL',
      'SUPERJOLT_NO_UPDATE_CHECK',
      'CI',
      'CONTINUOUS_INTEGRATION',
    ];

    let hasEnvVars = false;
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        envTable.push([chalk.bold(envVar), chalk.green(process.env[envVar])]);
        hasEnvVars = true;
      }
    }

    if (!hasEnvVars) {
      envTable.push([
        chalk.dim('Status'),
        chalk.dim('No Superjolt environment variables set'),
      ]);
    }

    console.log(envTable.toString());

    // Update Status
    console.log(chalk.bold.cyan('\n🔄 Update Settings\n'));
    const updateTable = createInfoTable();
    const updateCache = await this.storageService.getJson<any>('update-check');

    // Use the already declared pkg.version from above
    const actualCurrentVersion = pkg.version;

    if (updateCache) {
      updateTable.push([
        chalk.bold('Last Check'),
        chalk.green(new Date(updateCache.lastCheck).toLocaleString()),
      ]);

      if (updateCache.latestVersion) {
        // Compare with actual current version, not cached version
        const isOutdated = updateCache.latestVersion !== actualCurrentVersion;
        if (isOutdated) {
          updateTable.push([
            chalk.bold('Latest Version'),
            `${chalk.yellow(updateCache.latestVersion)} ${chalk.yellow('(update available)')}`,
          ]);
        } else {
          updateTable.push([
            chalk.bold('Latest Version'),
            `${chalk.green(updateCache.latestVersion)} ${chalk.green('(up to date)')}`,
          ]);
        }
      }
    } else {
      updateTable.push([chalk.bold('Last Check'), chalk.dim('Never')]);
    }

    updateTable.push([
      chalk.bold('Auto-Update'),
      process.env.SUPERJOLT_NO_UPDATE_CHECK
        ? chalk.red('Disabled')
        : chalk.green('Enabled'),
    ]);

    console.log(updateTable.toString());

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }
}
