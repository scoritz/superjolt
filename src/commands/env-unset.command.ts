import { Command } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig } from '../utils/project';

@Injectable()
@Command({
  name: 'env:unset',
  arguments: '<key>',
  description: 'Remove an environment variable',
})
export class EnvUnsetCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      const key = passedParams[0];

      if (!key) {
        this.logger.error('Error: Environment variable key is required');
        this.logger.log('Usage: superjolt env:unset KEY');
        process.exit(1);
      }

      // Get service ID from .superjolt file
      const config = readSuperjoltConfig();
      if (!config?.serviceId) {
        this.logger.error(
          'No service found. Deploy first with: superjolt deploy',
        );
        process.exit(1);
      }

      this.logger.log(`Removing environment variable '${key}'...`);

      const response = await this.apiService.deleteEnvVar(
        config.serviceId,
        key,
      );
      this.logger.log(`✅ ${response.message}`);
      this.logger.log(
        '\n⚠️  Note: Run "superjolt deploy" for changes to take effect',
      );
    } catch (error: any) {
      if (error.message.includes('not found')) {
        this.logger.error(
          `Environment variable '${passedParams[0]}' not found`,
        );
      } else {
        this.logger.error(`\n${error.message}`);
      }
      process.exit(1);
    }
  }
}
