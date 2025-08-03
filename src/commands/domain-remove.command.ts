import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'domain:remove',
  aliases: ['domain:delete'],
  arguments: '<domain>',
  description: 'Remove a custom domain',
})
export class DomainRemoveCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      const domain = passedParams[0];

      if (!domain) {
        this.logger.error('Error: Domain is required');
        this.logger.log('Usage: superjolt domain:remove <domain>');
        this.logger.log('Example: superjolt domain:remove app.example.com');
        process.exit(1);
      }

      // Prompt for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const confirmed = await new Promise<boolean>((resolve) => {
        rl.question(
          chalk.yellow(
            `Are you sure you want to remove domain ${domain}? (y/N): `,
          ),
          (answer: string) => {
            rl.close();
            resolve(
              answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes',
            );
          },
        );
      });

      if (!confirmed) {
        this.logger.log('Domain removal cancelled');
        return;
      }

      this.logger.log(chalk.dim(`Removing custom domain ${domain}...`));

      const response = await this.apiService.deleteCustomDomain(domain);

      if (response.success) {
        this.logger.log(chalk.green(`✅ ${response.message}`));
      } else {
        this.logger.error(chalk.red(`❌ ${response.message}`));
        process.exit(1);
      }
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
