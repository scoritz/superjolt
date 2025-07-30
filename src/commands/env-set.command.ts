import { Command } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig } from '../utils/project';

@Injectable()
@Command({
  name: 'env:set',
  arguments: '[vars...]',
  description: 'Set environment variables (format: KEY=VALUE)',
})
export class EnvSetCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      if (passedParams.length === 0) {
        console.error('Error: At least one KEY=VALUE pair is required');
        console.log('Usage: superjolt env:set KEY=VALUE [KEY2=VALUE2 ...]');
        console.log(
          'Example: superjolt env:set DATABASE_URL=postgres://localhost API_KEY=secret',
        );
        process.exit(1);
      }

      // Get service ID from .superjolt file
      const config = readSuperjoltConfig();
      if (!config?.serviceId) {
        console.error('No service found. Deploy first with: superjolt deploy');
        process.exit(1);
      }

      // Parse KEY=VALUE pairs
      const envVars: Record<string, string> = {};
      for (const param of passedParams) {
        const match = param.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) {
          console.error(
            `Error: Invalid format '${param}'. Expected: KEY=VALUE`,
          );
          console.log(
            'Keys must start with a letter or underscore and contain only letters, numbers, and underscores',
          );
          process.exit(1);
        }
        envVars[match[1]] = match[2];
      }

      console.log(
        `Setting ${Object.keys(envVars).length} environment variable(s)...`,
      );

      const response = await this.apiService.setEnvVars(
        config.serviceId,
        envVars,
      );
      console.log(`✅ ${response.message}`);
      console.log(
        '\n⚠️  Note: Run "superjolt deploy" for changes to take effect',
      );
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
