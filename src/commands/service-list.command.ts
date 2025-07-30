import { Command, Option } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import {
  createResourceTable,
  formatStatus,
  formatDate,
  formatBytes,
} from '../utils/table.utils';
import chalk from 'chalk';

interface ServiceListOptions {
  machineId?: string;
}

@Injectable()
@Command({
  name: 'service:list',
  aliases: ['list', 'services'],
  description: 'List services for a machine',
})
export class ServiceListCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: ServiceListOptions,
  ): Promise<void> {
    try {
      const machineId = options.machineId || passedParams[0];

      if (machineId) {
        console.log(
          chalk.dim(`Fetching services for machine: ${machineId}...`),
        );
      } else {
        console.log(chalk.dim('Fetching services...'));
      }

      const response = await this.apiService.listServices(machineId);

      // Check if machine selection is needed
      if (response.needsSelection) {
        console.log(
          chalk.cyan('\n🖥️  Multiple machines available. Please select one:'),
        );
        const machines = response.availableMachines;

        // Create selection table
        const selectionTable = createResourceTable([
          '#',
          'ID',
          'Name',
          'Status',
        ]);

        machines.forEach((machine: any, index: number) => {
          selectionTable.push([
            chalk.yellow(`${index + 1}`),
            machine.id,
            machine.name,
            formatStatus(machine.status || 'unknown'),
          ]);
        });

        console.log(selectionTable.toString());

        // Prompt for selection
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const selection = await new Promise<number>((resolve) => {
          rl.question(
            chalk.cyan('\nSelect a machine (enter number): '),
            (answer) => {
              rl.close();
              resolve(parseInt(answer));
            },
          );
        });

        if (selection < 1 || selection > machines.length) {
          console.error(chalk.red('Invalid selection'));
          process.exit(1);
        }

        const selectedMachine = machines[selection - 1];
        console.log(
          chalk.dim(
            `\nFetching services for machine: ${selectedMachine.id}...`,
          ),
        );

        // Retry with selected machine
        const retryResponse = await this.apiService.listServices(
          selectedMachine.id,
        );
        Object.assign(response, retryResponse);
      }

      if (response.total === 0) {
        console.log(chalk.yellow('\nNo services found for this machine.'));
        console.log(chalk.dim('\nDeploy a service with:'));
        console.log(chalk.cyan('  superjolt deploy'));
        return;
      }

      const displayMachineId = response.machineId || machineId;
      console.log(chalk.cyan(`\nServices for machine ${displayMachineId}:`));

      // Create the table
      const table = createResourceTable(
        ['ID', 'Name', 'Status', 'CPU %', 'Memory', 'Created'],
        {
          wordWrap: true,
          wrapOnWordBoundary: false,
        },
      );

      // Sort services - running first
      const sortedServices = [...response.services].sort((a, b) => {
        const aRunning =
          (a.state || a.status || '').toLowerCase() === 'running' ? 0 : 1;
        const bRunning =
          (b.state || b.status || '').toLowerCase() === 'running' ? 0 : 1;
        return aRunning - bRunning;
      });

      // Add rows
      sortedServices.forEach((service) => {
        // Use state for the indicator, and show the status text if available
        const state = service.state || 'unknown';
        const statusText =
          service.status && service.status !== state
            ? `${formatStatus(state)} (${service.status})`
            : formatStatus(state);

        // Format metrics
        const cpuUsage =
          service.stats?.cpuPercent !== undefined
            ? `${service.stats.cpuPercent.toFixed(1)}%`
            : '-';
        const memoryUsage =
          service.stats?.memoryUsage !== undefined
            ? formatBytes(service.stats.memoryUsage)
            : '-';

        // Format name with URL
        const nameWithUrl = service.url
          ? `${service.name}\n${chalk.dim(service.url)}`
          : service.name;

        table.push([
          service.id,
          nameWithUrl,
          statusText,
          cpuUsage,
          memoryUsage,
          formatDate(service.createdAt || new Date().toISOString()),
        ]);
      });

      console.log(table.toString());

      // Summary
      const statusCounts = response.services.reduce(
        (acc: Record<string, number>, s: any) => {
          const state = (s.state || s.status || 'unknown').toLowerCase();
          acc[state] = (acc[state] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      let summary = chalk.dim(
        `\nTotal: ${response.total} service${response.total === 1 ? '' : 's'}`,
      );

      const statusParts: string[] = [];
      if (statusCounts.running)
        statusParts.push(`${statusCounts.running} running`);
      if (statusCounts.stopped)
        statusParts.push(`${statusCounts.stopped} stopped`);
      if (statusCounts.deployed)
        statusParts.push(`${statusCounts.deployed} deployed`);
      if (statusCounts.unknown)
        statusParts.push(`${statusCounts.unknown} pending`);

      if (statusParts.length > 0) {
        summary += chalk.dim(` (${statusParts.join(', ')})`);
      }

      console.log(summary);
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '-m, --machineId <machineId>',
    description: 'Machine ID to list services for',
  })
  parseMachineId(val: string): string {
    return val;
  }
}
