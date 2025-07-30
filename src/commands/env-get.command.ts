import { Command } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig } from '../utils/project';

@Injectable()
@Command({
  name: 'env:get',
  arguments: '<key>',
  description: 'Get a specific environment variable',
})
export class EnvGetCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      const key = passedParams[0];

      if (!key) {
        console.error('Error: Environment variable key is required');
        console.log('Usage: superjolt env:get KEY');
        process.exit(1);
      }

      // Get service ID from .superjolt file
      const config = readSuperjoltConfig();
      if (!config?.serviceId) {
        console.error('No service found. Deploy first with: superjolt deploy');
        process.exit(1);
      }

      const response = await this.apiService.getEnvVar(config.serviceId, key);
      console.log(`${key}=${response[key]}`);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        console.error(`Environment variable '${passedParams[0]}' not found`);
      } else {
        console.error(`\n${error.message}`);
      }
      process.exit(1);
    }
  }
}
