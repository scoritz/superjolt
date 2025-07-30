import { Command, Option } from 'nest-commander';
import { AuthenticatedCommand } from './authenticated.command';
import { ApiService } from '../services/api.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { readSuperjoltConfig } from '../utils/project';

interface LogsOptions {
  follow?: boolean;
  tail?: number;
}

@Injectable()
@Command({
  name: 'logs',
  arguments: '[serviceId]',
  description: 'Get logs for a service',
})
export class LogsCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    private readonly configService: ConfigService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: LogsOptions,
  ): Promise<void> {
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
          console.log('Usage: superjolt logs [options] <serviceId>');
          console.log(
            '\nNo .superjolt file found. Run "superjolt deploy" first or provide a service ID.',
          );
          process.exit(1);
        }
      }

      if (options.follow) {
        await this.followLogs(serviceId, options.tail || 20);
      } else {
        await this.getStaticLogs(serviceId, options.tail || 20);
      }
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  @Option({
    flags: '-f, --follow',
    description: 'Follow log output (like tail -f)',
  })
  parseFollow(): boolean {
    return true;
  }

  @Option({
    flags: '-n, --tail <lines>',
    description:
      'Number of lines to show from the end of the logs (default: 20)',
  })
  parseTail(val: string): number {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      throw new Error('Tail value must be a positive number');
    }
    return num;
  }

  private async getStaticLogs(serviceId: string, tail: number): Promise<void> {
    console.log(`Fetching last ${tail} lines for service: ${serviceId}...`);
    console.log('');

    const response = await this.apiService.getServiceLogs(serviceId, { tail });

    // Display the logs
    console.log(response.logs);

    // Display metadata if available
    if (response.metadata) {
      console.log('');
      console.log('─'.repeat(80));
      console.log(
        `Lines: ${response.metadata.lines}${response.metadata.truncated ? ' (truncated)' : ''}`,
      );
    }
  }

  private async followLogs(serviceId: string, tail: number): Promise<void> {
    const { EventSource } = require('eventsource');
    const chalkModule = require('chalk');
    const chalk = chalkModule.default || chalkModule;

    console.log(
      `Following logs for service: ${serviceId} (showing last ${tail} lines + new logs)...`,
    );
    console.log('Press Ctrl+C to stop following');
    console.log('');

    const apiUrl = this.configService.getApiUrl();
    const token = await this.authService.getToken();
    // Token is guaranteed to exist because AuthenticatedCommand handles auth

    // EventSource doesn't support custom headers, so we need to pass the token as a query parameter
    const streamUrl = `${apiUrl}/service/${serviceId}/logs/stream?tail=${tail}&token=${encodeURIComponent(token || '')}`;

    const eventSource = new EventSource(streamUrl);

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event: any) => {
        try {
          const logEvent = JSON.parse(event.data);

          switch (logEvent.type) {
            case 'connected':
              console.log(chalk.blue('📡 Connected to log stream'));
              console.log('');
              break;

            case 'log':
              // Write log data directly without extra formatting
              if (logEvent.data) {
                process.stdout.write(logEvent.data);
              }
              break;

            case 'error':
              console.error(
                chalk.red(`❌ Log stream error: ${logEvent.error}`),
              );
              eventSource.close();
              reject(new Error(logEvent.error));
              break;

            case 'end':
              console.log('');
              console.log(chalk.yellow('📡 Log stream ended'));
              eventSource.close();
              resolve();
              break;

            default:
              console.log(
                chalk.gray(
                  `[${logEvent.type}] ${logEvent.message || JSON.stringify(logEvent)}`,
                ),
              );
          }
        } catch {
          console.error('Failed to parse log event:', event.data);
        }
      };

      eventSource.onerror = () => {
        console.error('');
        console.error(chalk.red('❌ Connection to log stream failed'));
        eventSource.close();
        reject(new Error('Log stream connection failed'));
      };

      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        console.log('');
        console.log(chalk.yellow('📡 Stopping log stream...'));
        eventSource.close();
        resolve();
      });
    });
  }
}
