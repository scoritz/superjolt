import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'machine:rename',
  arguments: '[machineId] [newName]',
  description: 'Rename a machine',
})
export class MachineRenameCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      // Check if no arguments provided
      if (passedParams.length === 0) {
        this.logger.error('Error: New name is required');
        this.logger.log(
          'Usage: superjolt machine:rename <machineId> <newName>',
        );
        this.logger.log(
          '   or: superjolt machine:rename <newName> (uses default machine)',
        );
        process.exit(1);
      }

      let machineId: string;
      let newName: string;

      // If only one parameter provided, assume it's the new name and get default machine ID
      if (passedParams.length === 1) {
        const currentUser = await this.apiService.getCurrentUser();
        if (!currentUser.lastUsedMachineId) {
          this.logger.error('Error: No default machine found');
          this.logger.log(
            'Create a machine first with: superjolt machine:create',
          );
          this.logger.log(
            'Or specify machine ID: superjolt machine:rename <machineId> <newName>',
          );
          process.exit(1);
        }
        machineId = currentUser.lastUsedMachineId;
        newName = passedParams[0];
        this.logger.log(`Using default machine: ${machineId}`);
      } else {
        // Two parameters: machineId and newName
        machineId = passedParams[0];
        newName = passedParams[1];
      }

      // Validate name format (similar to service names)
      const nameRegex = /^[a-z0-9][a-z0-9-._]*$/;
      if (!nameRegex.test(newName)) {
        this.logger.error(
          'Error: Machine name must start with a lowercase letter or number, and can only contain lowercase letters, numbers, hyphens, periods, and underscores.',
        );
        process.exit(1);
      }

      this.logger.log(
        `Renaming machine ${chalk.cyan(machineId)} to ${chalk.cyan(newName)}...`,
      );

      const response = await this.apiService.renameMachine(machineId, newName);

      this.logger.log(chalk.green(`✅ ${response.message}`));
      this.logger.log(
        `Machine ${chalk.cyan(machineId)} renamed to ${chalk.cyan(response.name)}`,
      );
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
