import { Command, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig, findProjectRoot } from '../utils/project';
import * as fs from 'fs';
import * as path from 'path';

interface EnvPushOptions {
  file?: string;
}

@Injectable()
@Command({
  name: 'env:push',
  description: 'Upload environment variables from a file',
})
export class EnvPushCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: EnvPushOptions,
  ): Promise<void> {
    try {
      // Get service ID from .superjolt file
      const config = readSuperjoltConfig();
      if (!config?.serviceId) {
        console.error('No service found. Deploy first with: superjolt deploy');
        process.exit(1);
      }

      // Find project root
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error('Could not find project root');
        process.exit(1);
      }

      // Determine env file path
      const envFileName = options.file || '.env';
      const envPath = path.join(projectRoot, envFileName);

      if (!fs.existsSync(envPath)) {
        console.error(`File not found: ${envFileName}`);
        process.exit(1);
      }

      console.log(`Reading ${envFileName}...`);

      // Read and parse env file
      const content = fs.readFileSync(envPath, 'utf8');
      const envVars = this.parseEnvFile(content);

      const varCount = Object.keys(envVars).length;
      if (varCount === 0) {
        console.log(`No valid environment variables found in ${envFileName}`);
        return;
      }

      console.log(`Setting ${varCount} environment variable(s)...`);

      await this.apiService.setEnvVars(config.serviceId, envVars);
      console.log(
        `✅ Set ${varCount} environment variable(s) from ${envFileName}`,
      );
      console.log(
        '\n⚠️  Note: Run "superjolt deploy" for changes to take effect',
      );
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '-f, --file <file>',
    description: 'Environment file to use (default: .env)',
  })
  parseFile(val: string): string {
    return val;
  }

  private parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }

      const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    }

    return envVars;
  }
}
