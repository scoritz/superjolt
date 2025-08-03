import { Command, Option } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig } from '../utils/project';
import chalk from 'chalk';

interface DomainAddOptions {
  primary?: boolean;
}

@Injectable()
@Command({
  name: 'domain:add',
  arguments: '<domain> [serviceId]',
  description: 'Add a custom domain to a service',
})
export class DomainAddCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: DomainAddOptions,
  ): Promise<void> {
    try {
      const domain = passedParams[0];
      let serviceId = passedParams[1];

      if (!domain) {
        this.logger.error('Error: Domain is required');
        this.logger.log('Usage: superjolt domain:add <domain> [serviceId]');
        this.logger.log('Example: superjolt domain:add app.example.com');
        this.logger.log(
          '         superjolt domain:add app.example.com happy-blue-fox',
        );
        process.exit(1);
      }

      // If no service ID provided, try to read from .superjolt file
      if (!serviceId) {
        const config = readSuperjoltConfig();
        if (config?.serviceId) {
          serviceId = config.serviceId;
          this.logger.log(
            chalk.dim(`Using service ID from .superjolt file: ${serviceId}`),
          );
        } else {
          this.logger.error('Error: Service ID is required');
          this.logger.log('Usage: superjolt domain:add <domain> [serviceId]');
          this.logger.log(
            '\nNo .superjolt file found. Run "superjolt deploy" first or provide a service ID.',
          );
          process.exit(1);
        }
      }

      // Validate domain format
      const domainRegex =
        /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        this.logger.error('Error: Invalid domain format');
        this.logger.log(
          'Domain must be a valid domain name (e.g., app.example.com)',
        );
        process.exit(1);
      }

      this.logger.log(
        chalk.dim(`Adding custom domain ${domain} to service ${serviceId}...`),
      );

      const response = await this.apiService.createCustomDomain({
        domain,
        serviceId,
        isPrimary: options.primary,
      });

      this.logger.log(chalk.green(`✅ Custom domain added successfully!`));
      this.logger.log('');
      this.logger.log(`Domain: ${chalk.cyan(response.domain)}`);
      this.logger.log(`Service: ${response.serviceId}`);
      this.logger.log(`Status: ${this.formatStatus(response.status)}`);
      this.logger.log(`SSL Status: ${this.formatStatus(response.sslStatus)}`);

      if (response.isPrimary) {
        this.logger.log(`Primary: ${chalk.green('Yes')}`);
      }

      if (response.validationTarget) {
        this.logger.log('');
        this.logger.log(chalk.yellow('⚠️  Domain validation required:'));
        this.logger.log(`Validation Method: ${response.validationMethod}`);
        this.logger.log(
          `Validation URL: ${chalk.cyan(response.validationTarget)}`,
        );
        this.logger.log('');
        this.logger.log(
          'The domain will be automatically validated once DNS propagates.',
        );
        this.logger.log('This usually takes a few minutes.');
      }

      this.logger.log('');
      this.logger.log(chalk.dim('Check domain status with:'));
      this.logger.log(chalk.cyan(`  superjolt domain:status ${domain}`));
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '-p, --primary',
    description: 'Set this domain as the primary domain for the service',
  })
  parsePrimary(): boolean {
    return true;
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
