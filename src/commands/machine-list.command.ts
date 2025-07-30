import { Command } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthenticatedCommand } from './authenticated.command';
import {
  createResourceTable,
  formatStatus,
  formatDate,
  formatBytes,
} from '../utils/table.utils';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'machine:list',
  aliases: ['machines'],
  description: 'List all machines',
})
export class MachineListCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(): Promise<void> {
    try {
      console.log(chalk.dim('Fetching machines...\n'));

      const [response, currentUser] = await Promise.all([
        this.apiService.listMachines(),
        this.apiService.getCurrentUser().catch(() => null),
      ]);

      if (response.machines.length === 0) {
        console.log(chalk.yellow('No machines found.'));
        console.log(chalk.dim('\nCreate your first machine with:'));
        console.log(chalk.cyan('  superjolt machine:create'));
        return;
      }

      // Create the table
      const table = createResourceTable(
        ['ID', 'Name', 'Status', 'Specs', 'CPU', 'Memory', 'Disk', 'Created'],
        {
          wordWrap: true,
          colWidths: [23, 20, 12, 20, 15, 15, 15, 12],
        },
      );

      // Add rows
      response.machines.forEach((machine) => {
        const isDefault = currentUser?.lastUsedMachineId === machine.id;
        const id = isDefault
          ? chalk.blue(`→ ${machine.id}`)
          : `  ${machine.id}`;
        const name = machine.name;
        const status = formatStatus(machine.status || 'unknown');
        const created = formatDate(machine.createdAt);

        // Format specs
        const cpuCores = machine.cpuCores || 2; // Default to 2 if not provided
        const memoryTotal = machine.memoryTotal || 2147483648; // Default to 2GB
        const diskTotal = machine.diskTotal || 53687091200; // Default to 50GB
        const specs = `${cpuCores} vCPU\n${formatBytes(memoryTotal)} RAM\n${formatBytes(diskTotal)} Disk`;

        // Format CPU usage
        const cpuUsage =
          machine.cpuUsage !== undefined
            ? `${machine.cpuUsage.toFixed(1)}%`
            : '-';

        // Format memory usage with percentage
        let memoryDisplay = '-';
        if (machine.memoryUsage !== undefined && machine.memoryTotal) {
          const memPercent = (
            (machine.memoryUsage / machine.memoryTotal) *
            100
          ).toFixed(1);
          memoryDisplay = `${formatBytes(machine.memoryUsage)}\n${memPercent}%`;
        }

        // Format disk usage with percentage
        let diskDisplay = '-';
        if (machine.diskUsage !== undefined && machine.diskTotal) {
          const diskPercent = (
            (machine.diskUsage / machine.diskTotal) *
            100
          ).toFixed(1);
          diskDisplay = `${formatBytes(machine.diskUsage)}\n${diskPercent}%`;
        }

        table.push([
          id,
          name,
          status,
          specs,
          cpuUsage,
          memoryDisplay,
          diskDisplay,
          created,
        ]);
      });

      console.log(table.toString());

      // Summary
      const runningCount = response.machines.filter(
        (m) => m.status?.toLowerCase() === 'running',
      ).length;
      const stoppedCount = response.machines.length - runningCount;

      let summary = chalk.dim(
        `\nTotal: ${response.total} machine${response.total !== 1 ? 's' : ''}`,
      );
      if (runningCount > 0 || stoppedCount > 0) {
        summary += chalk.dim(
          ` (${runningCount} running, ${stoppedCount} stopped)`,
        );
      }

      // Add usage info if available
      if (currentUser?.tenant) {
        const { machineCount, maxMachines } = currentUser.tenant;
        summary += chalk.dim(` | Usage: ${machineCount}/${maxMachines}`);

        const percentUsed = (machineCount / maxMachines) * 100;
        if (percentUsed >= 100) {
          summary += chalk.red(' (limit reached!)');
        } else if (percentUsed >= 80) {
          summary += chalk.yellow(` (${Math.round(percentUsed)}% used)`);
        }
      }

      console.log(summary);

      if (currentUser?.lastUsedMachineId) {
        console.log(
          chalk.dim(
            `\nDefault machine: ${chalk.blue(currentUser.lastUsedMachineId)}`,
          ),
        );
      }
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
