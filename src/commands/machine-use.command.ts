import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';

@Injectable()
@Command({
  name: 'machine:use',
  aliases: ['use'],
  arguments: '[machineId]',
  description: 'Set the default machine to use for commands',
})
export class MachineUseCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      let machineId = passedParams[0];

      if (!machineId) {
        // Get list of machines for selection
        const machinesResponse = await this.apiService.listMachines();

        if (machinesResponse.machines.length === 0) {
          this.logger.error(
            'No machines available. Create a machine first with: superjolt machine:create',
          );
          process.exit(1);
        }

        // Get current user to show current default
        const currentUser = await this.apiService
          .getCurrentUser()
          .catch(() => null);

        this.logger.log('\n🖥️  Select a machine to set as default:\n');

        // Display available machines
        const chalkModule = require('chalk');
        const chalk = chalkModule.default || chalkModule;

        machinesResponse.machines.forEach((machine: any, index: number) => {
          const status =
            machine.status === 'running' ? chalk.green('●') : chalk.red('○');
          const isCurrentDefault =
            currentUser?.lastUsedMachineId === machine.id;
          const defaultLabel = isCurrentDefault
            ? chalk.gray(' (current default)')
            : '';
          this.logger.log(
            `  ${index + 1}. ${status} ${machine.id} (${machine.name})${defaultLabel}`,
          );
        });

        // Prompt for selection
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const selection = await new Promise<number>((resolve) => {
          rl.question('\nSelect a machine (enter number): ', (answer) => {
            rl.close();
            resolve(parseInt(answer));
          });
        });

        if (selection < 1 || selection > machinesResponse.machines.length) {
          this.logger.error('Invalid selection');
          process.exit(1);
        }

        machineId = machinesResponse.machines[selection - 1].id;
      }

      this.logger.log(`\nSetting default machine to: ${machineId}...`);

      const response = await this.apiService.setDefaultMachine(machineId);
      this.logger.log(`✅ ${response.message}`);
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
