import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
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
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      const serviceId = passedParams[0];

      if (!serviceId) {
        console.error('Error: Service ID is required');
        console.log('Usage: superjolt service:delete <serviceId>');
        console.log('   or: superjolt delete <serviceId>');
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
        console.log('Deletion cancelled');
        return;
      }

      console.log(`Deleting service: ${serviceId}...`);

      const response = await this.apiService.deleteService(serviceId);
      console.log(`✅ ${response.message}`);

      // Check if .superjolt file contains this serviceId
      const config = readSuperjoltConfig();
      if (config?.serviceId === serviceId) {
        if (deleteSuperjoltConfig()) {
          console.log('✅ Removed .superjolt file (service was deleted)');
        }
      }
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
