import { Command, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { AuthenticatedCommand } from './authenticated.command';
import * as readline from 'readline';

@Injectable()
@Command({
  name: 'machine:delete',
  description: 'Delete a machine',
})
export class MachineDeleteCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options?: { id?: string; yes?: boolean },
  ): Promise<void> {
    try {
      const machineId = options?.id || passedParams[0];

      if (!machineId) {
        this.logger.error(
          'Error: Machine ID is required. Use --id <machine-id> or provide it as an argument.',
        );
        process.exit(1);
      }

      // Skip confirmation if --yes flag is provided
      if (!options?.yes) {
        const confirmed = await this.confirmDeletion(machineId);
        if (!confirmed) {
          this.logger.log('Deletion cancelled.');
          return;
        }
      }

      this.logger.log(`\nDeleting machine ${machineId}...`);

      await this.apiService.deleteMachine(machineId);

      this.logger.log(`\nMachine ${machineId} deleted successfully.`);
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '-i, --id <machineId>',
    description: 'Machine ID to delete',
  })
  parseId(val: string): string {
    return val;
  }

  @Option({
    flags: '-y, --yes',
    description: 'Skip confirmation prompt',
  })
  parseYes(): boolean {
    return true;
  }

  private async confirmDeletion(machineId: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(
        `\nAre you sure you want to delete machine "${machineId}"? This action cannot be undone. (yes/no): `,
        (answer) => {
          rl.close();
          resolve(
            answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y',
          );
        },
      );
    });
  }
}
