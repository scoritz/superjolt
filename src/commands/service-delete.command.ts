import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { readSuperjoltConfig, deleteSuperjoltConfig } from '../utils/project';
import { AuthenticatedCommand } from './authenticated.command';

@Injectable()
@Command({
  name: 'service:delete',
  aliases: ['delete'],
  arguments: '<serviceId>',
  description: 'Delete a service',
})
export class ServiceDeleteCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      const serviceId = passedParams[0];

      if (!serviceId) {
        this.logger.error('Error: Service ID is required');
        this.logger.log('Usage: superjolt service:delete <serviceId>');
        this.logger.log('   or: superjolt delete <serviceId>');
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
          `Are you sure you want to delete service ${serviceId}? (y/N): `,
          (answer: string) => {
            rl.close();
            resolve(
              answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes',
            );
          },
        );
      });

      if (!confirmed) {
        this.logger.log('Deletion cancelled');
        return;
      }

      this.logger.log(`Deleting service: ${serviceId}...`);

      const response = await this.apiService.deleteService(serviceId);
      this.logger.log(`✅ ${response.message}`);

      // Check if .superjolt file contains this serviceId
      const config = readSuperjoltConfig();
      if (config?.serviceId === serviceId) {
        if (deleteSuperjoltConfig()) {
          this.logger.log('✅ Removed .superjolt file (service was deleted)');
        }
      }
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
