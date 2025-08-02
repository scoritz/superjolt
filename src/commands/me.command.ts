import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import { createInfoTable, createProgressBar } from '../utils/table.utils';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'me',
  description: 'Show current user information',
})
export class MeCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(): Promise<void> {
    try {
      const response = await this.apiService.getCurrentUser();

      this.logger.log(chalk.cyan('\n👤 User Profile\n'));

      // User info table
      const userTable = createInfoTable();
      userTable.push(
        [chalk.bold('Name'), response.name],
        [chalk.bold('Email'), response.email],
      );

      if (response.githubUsername) {
        userTable.push([
          chalk.bold('GitHub'),
          chalk.blue(`@${response.githubUsername}`),
        ]);
      }

      if (response.avatarUrl) {
        userTable.push([chalk.bold('Avatar'), chalk.dim(response.avatarUrl)]);
      }

      userTable.push([chalk.bold('User ID'), chalk.dim(response.id)]);

      this.logger.log(userTable.toString());

      // Organization info
      if (response.tenant) {
        this.logger.log(chalk.cyan('\n🏢 Organization\n'));

        const orgTable = createInfoTable();
        orgTable.push(
          [chalk.bold('Name'), response.tenant.name],
          [chalk.bold('Tenant ID'), chalk.dim(response.tenantId)],
        );

        // Machine usage with progress bar
        const { machineCount, maxMachines } = response.tenant;
        const progressBar = createProgressBar(machineCount, maxMachines, 15);
        orgTable.push([
          chalk.bold('Machine Usage'),
          `${machineCount}/${maxMachines} ${progressBar}`,
        ]);

        this.logger.log(orgTable.toString());

        // Show warning if approaching limit
        const percentUsed = (machineCount / maxMachines) * 100;
        if (percentUsed >= 100) {
          this.logger.log(
            chalk.red(
              '\n⚠️  Machine limit reached! Delete unused machines to continue.',
            ),
          );
        } else if (percentUsed >= 80) {
          this.logger.log(
            chalk.yellow(
              `\n⚠️  Approaching machine limit (${Math.round(percentUsed)}% used)`,
            ),
          );
        }
      }

      // Last used machine
      if (response.lastUsedMachineId) {
        this.logger.log(
          chalk.dim(
            `\n📍 Last Used Machine: ${chalk.blue(response.lastUsedMachineId)}`,
          ),
        );
      }

      // Quick actions
      this.logger.log(chalk.dim('\nQuick actions:'));
      this.logger.log(
        chalk.dim('  superjolt machines     - List all machines'),
      );
      this.logger.log(
        chalk.dim('  superjolt deploy       - Deploy an application'),
      );
      this.logger.log(chalk.dim('  superjolt logout       - Sign out'));
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
