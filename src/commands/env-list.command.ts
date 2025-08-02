import { Command } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig } from '../utils/project';
import { createKeyValueTable, truncate } from '../utils/table.utils';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'env:list',
  aliases: ['env'],
  description: 'List all environment variables',
})
export class EnvListCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(): Promise<void> {
    try {
      // Get service ID from .superjolt file
      const config = readSuperjoltConfig();
      if (!config?.serviceId) {
        this.logger.error(
          'No service found. Deploy first with: superjolt deploy',
        );
        process.exit(1);
      }

      this.logger.log(chalk.dim('Fetching environment variables...\n'));

      const envVars = await this.apiService.listEnvVars(config.serviceId);
      const keys = Object.keys(envVars);

      if (keys.length === 0) {
        this.logger.log(chalk.yellow('No environment variables set'));
        this.logger.log(chalk.dim('\nSet variables with:'));
        this.logger.log(chalk.cyan('  superjolt env:set KEY=VALUE'));
        return;
      }

      this.logger.log(chalk.cyan('Environment Variables:'));

      // Create the table
      const table = createKeyValueTable();

      // Sort keys alphabetically and add to table
      keys.sort().forEach((key) => {
        const value = envVars[key];

        // Highlight different types of values
        let displayValue = value;

        // Mask sensitive values
        if (
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('key')
        ) {
          displayValue = chalk.dim('•'.repeat(8) + value.slice(-4));
        } else if (value.match(/^https?:\/\//)) {
          // URLs
          displayValue = chalk.blue(truncate(value, 45));
        } else if (value.match(/^\d+$/)) {
          // Numbers
          displayValue = chalk.yellow(value);
        } else if (value === 'true' || value === 'false') {
          // Booleans
          displayValue = chalk.magenta(value);
        } else {
          // Regular strings
          displayValue = truncate(value, 45);
        }

        table.push([chalk.bold(key), displayValue]);
      });

      this.logger.log(table.toString());

      this.logger.log(
        chalk.dim(
          `\n${keys.length} environment variable${keys.length !== 1 ? 's' : ''} set`,
        ),
      );

      this.logger.log(chalk.dim('\nManage variables with:'));
      this.logger.log(
        chalk.dim('  superjolt env:set KEY=VALUE    - Set a variable'),
      );
      this.logger.log(
        chalk.dim('  superjolt env:unset KEY        - Remove a variable'),
      );
      this.logger.log(
        chalk.dim('  superjolt env:push             - Upload from .env file'),
      );
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
