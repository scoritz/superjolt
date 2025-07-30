import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig } from '../utils/project';

@Injectable()
@Command({
  name: 'service:start',
  aliases: ['start'],
  arguments: '[serviceId]',
  description: 'Start a stopped service',
})
export class ServiceStartCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
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
          console.log('Usage: superjolt service:start <serviceId>');
          console.log('   or: superjolt start <serviceId>');
          console.log(
            '\nNo .superjolt file found. Run "superjolt deploy" first or provide a service ID.',
          );
          process.exit(1);
        }
      }

      console.log(`Starting service: ${serviceId}...`);

      const response = await this.apiService.startService(serviceId);
      console.log(`✅ ${response.message}`);
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
