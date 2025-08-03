import { Command, Option } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import { createResourceTable, formatDate } from '../utils/table.utils';
import chalk from 'chalk';

interface DomainListOptions {
  serviceId?: string;
}

@Injectable()
@Command({
  name: 'domain:list',
  aliases: ['domains'],
  description: 'List custom domains',
})
export class DomainListCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: DomainListOptions,
  ): Promise<void> {
    try {
      const serviceId = options.serviceId || passedParams[0];

      if (serviceId) {
        this.logger.log(
          chalk.dim(`Fetching custom domains for service: ${serviceId}...`),
        );
      } else {
        this.logger.log(chalk.dim('Fetching all custom domains...'));
      }

      const response = await this.apiService.listCustomDomains(serviceId);

      if (response.total === 0) {
        this.logger.log(chalk.yellow('\nNo custom domains found.'));
        this.logger.log(chalk.dim('\nAdd a custom domain with:'));
        this.logger.log(
          chalk.cyan('  superjolt domain:add <domain> <serviceId>'),
        );
        return;
      }

      if (serviceId) {
        this.logger.log(
          chalk.cyan(`\nCustom domains for service ${serviceId}:`),
        );
      } else {
        this.logger.log(chalk.cyan('\nCustom domains:'));
      }

      // Create the table
      const table = createResourceTable(
        ['Domain', 'Service', 'Status', 'SSL', 'Primary', 'Created'],
        {
          wordWrap: true,
          wrapOnWordBoundary: false,
        },
      );

      // Sort domains - primary first, then active, then by creation date
      const sortedDomains = [...response.domains].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;

        const aActive = a.status === 'active' ? 0 : 1;
        const bActive = b.status === 'active' ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      // Add rows
      sortedDomains.forEach((domain) => {
        const domainDisplay = domain.isPrimary
          ? `${domain.domain} ${chalk.green('★')}`
          : domain.domain;

        table.push([
          domainDisplay,
          domain.serviceId,
          this.formatStatus(domain.status),
          this.formatStatus(domain.sslStatus),
          domain.isPrimary ? chalk.green('Yes') : chalk.gray('No'),
          formatDate(domain.createdAt),
        ]);
      });

      this.logger.log(table.toString());

      // Summary
      const statusCounts = response.domains.reduce(
        (acc: Record<string, number>, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      let summary = chalk.dim(
        `\nTotal: ${response.total} domain${response.total === 1 ? '' : 's'}`,
      );

      const statusParts: string[] = [];
      if (statusCounts.active)
        statusParts.push(`${statusCounts.active} active`);
      if (statusCounts.pending_validation)
        statusParts.push(`${statusCounts.pending_validation} pending`);
      if (statusCounts.failed)
        statusParts.push(`${statusCounts.failed} failed`);
      if (statusCounts.expired)
        statusParts.push(`${statusCounts.expired} expired`);

      if (statusParts.length > 0) {
        summary += chalk.dim(` (${statusParts.join(', ')})`);
      }

      this.logger.log(summary);

      // Show help for pending domains
      const pendingDomains = response.domains.filter(
        (d) => d.status === 'pending_validation',
      );
      if (pendingDomains.length > 0) {
        this.logger.log('');
        this.logger.log(
          chalk.yellow('⚠️  Some domains are pending validation'),
        );
        this.logger.log(chalk.dim('Check domain status with:'));
        this.logger.log(chalk.cyan('  superjolt domain:status <domain>'));
      }
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '-s, --serviceId <serviceId>',
    description: 'Filter domains by service ID',
  })
  parseServiceId(val: string): string {
    return val;
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'active':
        return chalk.green('● Active');
      case 'pending_validation':
        return chalk.yellow('● Pending');
      case 'failed':
        return chalk.red('● Failed');
      case 'expired':
        return chalk.red('● Expired');
      default:
        return chalk.gray(`● ${status}`);
    }
  }
}
