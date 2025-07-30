import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@nestjs/common';
import { readSuperjoltConfig } from '../utils/project';
import { AuthenticatedCommand } from './authenticated.command';

@Injectable()
@Command({
  name: 'service:restart',
  aliases: ['restart'],
  arguments: '[serviceId]',
  description: 'Restart a service',
})
export class ServiceRestartCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      let serviceId = passedParams[0];

      // If no service ID provided, try to read from .superjolt file
      if (!serviceId) {
        const config = readSuperjoltConfig();
        if (config?.serviceId) {
          serviceId = config.serviceId;
          console.log(`Using service ID from .superjolt file: ${serviceId}`);
        } else {
          console.error('Error: Service ID is required');
          console.log('Usage: superjolt service:restart <serviceId>');
          console.log('   or: superjolt restart <serviceId>');
          console.log(
            '\nNo .superjolt file found. Run "superjolt deploy" first or provide a service ID.',
          );
          process.exit(1);
        }
      }

      console.log(`Restarting service: ${serviceId}...`);

      const response = await this.apiService.restartService(serviceId);
      console.log(`✅ ${response.message}`);
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
