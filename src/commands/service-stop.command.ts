import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { readSuperjoltConfig } from '../utils/project';
import { AuthenticatedCommand } from './authenticated.command';

@Injectable()
@Command({
  name: 'service:stop',
  aliases: ['stop'],
  arguments: '[serviceId]',
  description: 'Stop a running service',
})
export class ServiceStopCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
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
          this.logger.log(
            `Using service ID from .superjolt file: ${serviceId}`,
          );
        } else {
          this.logger.error('Error: Service ID is required');
          this.logger.log('Usage: superjolt service:stop <serviceId>');
          this.logger.log('   or: superjolt stop <serviceId>');
          this.logger.log(
            '\nNo .superjolt file found. Run "superjolt deploy" first or provide a service ID.',
          );
          process.exit(1);
        }
      }

      this.logger.log(`Stopping service: ${serviceId}...`);

      const response = await this.apiService.stopService(serviceId);
      this.logger.log(`✅ ${response.message}`);
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
