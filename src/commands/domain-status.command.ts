import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'domain:status',
  arguments: '<domain>',
  description: 'Check the status of a custom domain',
})
export class DomainStatusCommand extends AuthenticatedCommand {
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
        this.logger.log('Usage: superjolt domain:status <domain>');
        this.logger.log('Example: superjolt domain:status app.example.com');
        process.exit(1);
      }

      this.logger.log(chalk.dim(`Checking status for domain ${domain}...`));

      const status = await this.apiService.getCustomDomainStatus(domain);

      this.logger.log('');
      this.logger.log(chalk.cyan('Domain Status:'));
      this.logger.log(`Domain: ${chalk.bold(status.domain)}`);
      this.logger.log(`Status: ${this.formatStatus(status.status)}`);
      this.logger.log(`SSL Status: ${this.formatStatus(status.sslStatus)}`);
      this.logger.log(`Validation Method: ${status.validationMethod}`);

      if (status.isPrimary) {
        this.logger.log(`Primary: ${chalk.green('Yes')}`);
      }

      if (status.validationTarget && status.status === 'pending_validation') {
        this.logger.log('');
        this.logger.log(chalk.yellow('⚠️  Domain validation required:'));
        this.logger.log(
          `Validation URL: ${chalk.cyan(status.validationTarget)}`,
        );
        this.logger.log('');
        this.logger.log(
          chalk.dim(
            'The domain will be automatically validated once DNS propagates.',
          ),
        );
        this.logger.log(chalk.dim('This usually takes a few minutes.'));
      }

      if (status.status === 'active' && status.sslStatus === 'active') {
        this.logger.log('');
        this.logger.log(
          chalk.green('✅ Domain is active and SSL certificate is ready!'),
        );
        this.logger.log(
          chalk.dim(
            `Your service is accessible at: ${chalk.cyan(`https://${status.domain}`)}`,
          ),
        );
      } else if (
        status.status === 'active' &&
        status.sslStatus === 'pending_validation'
      ) {
        this.logger.log('');
        this.logger.log(
          chalk.yellow(
            '⚠️  Domain is active but SSL certificate is still being provisioned.',
          ),
        );
        this.logger.log(
          chalk.dim('This usually completes within a few minutes.'),
        );
      } else if (status.status === 'failed') {
        this.logger.log('');
        this.logger.log(chalk.red('❌ Domain validation failed.'));
        this.logger.log(
          chalk.dim('Please check your DNS settings and try again.'),
        );
      }
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'active':
        return chalk.green('● Active');
      case 'pending_validation':
        return chalk.yellow('● Pending Validation');
      case 'failed':
        return chalk.red('● Failed');
      case 'expired':
        return chalk.red('● Expired');
      default:
        return chalk.gray(`● ${status}`);
    }
  }
}
