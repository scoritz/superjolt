import { Command, Option } from 'nest-commander';
import { AuthenticatedCommand } from './authenticated.command';
import { Injectable } from '@nestjs/common';
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import {
  readSuperjoltConfig,
  writeSuperjoltConfig,
  findProjectRoot,
  readPackageJson,
} from '../utils/project';
import chalk from 'chalk';

interface DeployOptions {
  path?: string;
  service?: string;
  machine?: string;
  name?: string;
  verbose?: boolean;
}

@Injectable()
@Command({
  name: 'deploy',
  description: 'Deploy a Node.js application to a machine or service',
})
export class DeployCommand extends AuthenticatedCommand {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: DeployOptions,
  ): Promise<void> {
    const machineId = options.machine || passedParams[0];
    let serviceId = options.service;

    // Find project root first
    const projectRoot = findProjectRoot();

    // Track if serviceId came from .superjolt file
    let serviceIdFromConfig = false;

    // Check for .superjolt file if no service ID provided
    if (!serviceId && projectRoot) {
      const config = readSuperjoltConfig(projectRoot);
      if (config?.serviceId) {
        serviceId = config.serviceId;
        serviceIdFromConfig = true;
        console.log(
          `${chalk.dim('Using service ID from .superjolt file:')} ${chalk.cyan(serviceId)}`,
        );
      }
    }

    // Note: Both machine ID and service ID are now optional
    // The API will handle smart machine selection if neither is provided

    // Get service name - use --name flag or package.json name for new services
    let serviceName = options.name;
    if (!serviceName && !serviceId && projectRoot) {
      const packageJson = readPackageJson(projectRoot);
      if (packageJson?.name) {
        serviceName = packageJson.name;
        console.log(
          `${chalk.dim('Using service name from package.json:')} ${chalk.cyan(serviceName)}`,
        );
      }
    }

    try {
      // Use project root as deploy path if found and no explicit path provided
      let deployPath = options.path || projectRoot || process.cwd();

      // Security: Validate all deployment paths, not just those from -p option
      const resolvedDeployPath = path.resolve(deployPath);
      const currentDir = process.cwd();

      // Allow deployment from current directory or its subdirectories only
      // Exception: If projectRoot is found above current directory, allow it
      // but warn the user
      if (!resolvedDeployPath.startsWith(currentDir)) {
        if (deployPath === projectRoot && projectRoot) {
          console.warn(
            chalk.yellow('\n⚠️  Warning: Deploying from parent directory:'),
            chalk.cyan(resolvedDeployPath),
          );
          console.warn(
            chalk.yellow(
              '   Use -p option to explicitly specify a different path\n',
            ),
          );
        } else {
          console.error(
            chalk.red(
              'Error: Path must be within the current directory or its subdirectories',
            ),
          );
          console.error(chalk.red(`  Current directory: ${currentDir}`));
          console.error(chalk.red(`  Requested path: ${resolvedDeployPath}`));
          process.exit(1);
        }
      }

      deployPath = resolvedDeployPath;

      // Validate the path exists
      if (!fs.existsSync(deployPath)) {
        console.error(`Path does not exist: ${deployPath}`);
        process.exit(1);
      }

      console.log(`\n📦 Preparing deployment from: ${chalk.cyan(deployPath)}`);

      // Create a temporary zip file
      const tempZipPath = `/tmp/deploy-${Date.now()}.zip`;
      const output = fs.createWriteStream(tempZipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      // Handle archive errors
      archive.on('error', (err) => {
        throw err;
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add files to the archive, excluding common patterns
      archive.glob('**/*', {
        cwd: deployPath,
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/build/**',
          '**/.env*',
          '**/*.log',
          '**/coverage/**',
          '**/.nyc_output/**',
          '**/.next/**',
          '**/.nuxt/**',
          '**/.cache/**',
          '**/tmp/**',
          '**/temp/**',
          '**/.superjolt',
        ],
        dot: true, // Include dot files
      });

      // Debug: log archive warning/entry events
      let fileCount = 0;
      const files: string[] = [];
      archive.on('entry', (entry) => {
        fileCount++;
        files.push(entry.name);
      });

      // Finalize the archive
      await archive.finalize();

      // Wait for the stream to finish
      await new Promise<void>((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      const stats = fs.statSync(tempZipPath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(
        `   ${chalk.green('✓')} Created ${sizeInMB} MB archive (${fileCount} files)`,
      );

      if (options.verbose && fileCount < 20) {
        console.log(chalk.gray('   Files:', files.join(', ')));
      }

      // Create form data for multipart upload
      const form = new FormData();
      form.append('file', createReadStream(tempZipPath), {
        filename: 'deploy.zip',
        contentType: 'application/zip',
      });

      console.log(`\n🚀 Deploying to Superjolt...`);

      // Make the API request
      const apiUrl = this.configService.getApiUrl();

      // Always use streaming deployment
      await this.deployWithStreaming(
        apiUrl,
        machineId,
        form,
        tempZipPath,
        serviceId,
        projectRoot,
        serviceIdFromConfig,
        serviceName,
        options.verbose,
      );
    } catch (error) {
      // Clean up temp file if it exists
      try {
        const tempFiles = fs
          .readdirSync('/tmp')
          .filter((f) => f.startsWith('deploy-') && f.endsWith('.zip'));
        tempFiles.forEach((f) => fs.unlinkSync(path.join('/tmp', f)));
      } catch {
        /* intentionally empty */
      }

      if (error instanceof Error && 'response' in error && error.response) {
        const response = error.response as {
          data?: { message?: string };
          statusText?: string;
        };
        console.error(
          `\n${chalk.red('❌ Deployment failed:')} ${response.data?.message || response.statusText}`,
        );
      } else if (
        error &&
        typeof error === 'object' &&
        'request' in error &&
        error.request
      ) {
        console.error(
          `\n${chalk.red('❌ Network Error:')} Unable to connect to the API`,
        );
        console.error(chalk.dim('   Please check your internet connection'));
      } else {
        console.error(
          `\n${chalk.red('❌ Error:')} ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      process.exit(1);
    }
  }

  @Option({
    flags: '-p, --path <path>',
    description:
      'Path to the application directory (defaults to current directory)',
  })
  parsePath(val: string): string {
    const resolvedPath = path.resolve(val);
    const currentDir = process.cwd();

    // Security: Ensure the path is within the current directory or its subdirectories
    // This prevents directory traversal attacks (e.g., ../../sensitive-data)
    if (!resolvedPath.startsWith(currentDir)) {
      throw new Error(
        'Path must be within the current directory or its subdirectories',
      );
    }

    return resolvedPath;
  }

  @Option({
    flags: '-s, --service <serviceId>',
    description: 'Deploy to existing service (optional)',
  })
  parseService(val: string): string {
    return val;
  }

  @Option({
    flags: '-m, --machine <machineId>',
    description: 'Machine ID to deploy to',
  })
  parseMachine(val: string): string {
    return val;
  }

  @Option({
    flags: '-n, --name <name>',
    description:
      'Service name (defaults to package.json name for new services)',
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Show detailed build output and logs',
  })
  parseVerbose(): boolean {
    return true;
  }

  private async deployWithStreaming(
    apiUrl: string,
    machineId: string,
    form: FormData,
    tempZipPath: string,
    serviceId?: string,
    projectRoot?: string | null,
    serviceIdFromConfig?: boolean,
    serviceName?: string,
    verbose?: boolean,
  ): Promise<void> {
    const { EventSource } = await import('eventsource');

    try {
      // Get token - trigger auth flow if needed
      let token = await this.authService.getToken();
      if (!token) {
        // No token, trigger auth flow
        await this.authService.performOAuthFlow();
        token = await this.authService.getToken();
        if (!token) {
          throw new Error('Authentication failed');
        }
      }
      // Start async deployment
      let deployUrl = `${apiUrl}/service/deploy`;
      const params = new URLSearchParams();

      if (machineId) params.append('machineId', machineId);
      if (serviceId) params.append('serviceId', serviceId);
      if (serviceIdFromConfig) params.append('serviceIdFromConfig', 'true');
      if (serviceName) params.append('name', serviceName);

      deployUrl += `?${params.toString()}`;

      const response = await firstValueFrom(
        this.httpService.post(deployUrl, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }),
      );

      // Check if machine selection is needed
      const responseData = response.data as {
        needsSelection?: boolean;
        availableMachines?: Array<{
          id: string;
          name: string;
          status?: string;
        }>;
      };
      if (responseData.needsSelection) {
        console.log(`\n${chalk.yellow('🖥️  Multiple machines available')}`);
        console.log(chalk.dim('Please select a machine to deploy to:\n'));
        const machines = responseData.availableMachines || [];

        // Display available machines
        machines.forEach(
          (
            machine: { id: string; name: string; status?: string },
            index: number,
          ) => {
            const status =
              machine.status === 'running' ? chalk.green('●') : chalk.red('○');
            const number = chalk.cyan(`${index + 1}.`);
            console.log(
              `  ${number} ${status} ${chalk.bold(machine.id)} ${chalk.dim(`(${machine.name})`)}`,
            );
          },
        );

        // Prompt for selection
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const selection = await new Promise<number>((resolve) => {
          rl.question(
            '\nSelect a machine (enter number): ',
            (answer: string) => {
              rl.close();
              resolve(parseInt(answer));
            },
          );
        });

        if (selection < 1 || selection > machines.length) {
          console.error('Invalid selection');
          process.exit(1);
        }

        const selectedMachine = machines[selection - 1] as {
          id: string;
          name: string;
          status?: string;
        };
        console.log(
          `\n${chalk.green('✓')} Selected machine: ${chalk.cyan(selectedMachine.id)}`,
        );

        // Retry deployment with selected machine
        await this.deployWithStreaming(
          apiUrl,
          selectedMachine.id,
          form,
          tempZipPath,
          serviceId,
          projectRoot,
          serviceIdFromConfig,
          serviceName,
          verbose,
        );
        return;
      }

      const deployResponse = response.data as {
        streamId: string;
        serviceId?: string;
        machineId?: string;
        message?: string;
        url?: string;
      };
      const {
        streamId,
        serviceId: deployedServiceId,
        machineId: responseMachineId,
        message,
        url: serviceUrl,
      } = deployResponse;

      // Show deployment target
      if (serviceName) {
        console.log(`   ${chalk.dim('Service:')} ${chalk.cyan(serviceName)}`);
      }

      if (deployedServiceId || serviceId) {
        const idToShow = deployedServiceId || serviceId;
        console.log(`   ${chalk.dim('Service ID:')} ${chalk.cyan(idToShow)}`);
      } else if (responseMachineId) {
        console.log(
          `   ${chalk.dim('Machine:')} ${chalk.cyan(responseMachineId)}`,
        );
      }

      if (message && message.includes('created')) {
        console.log(`   ${chalk.green('✓')} ${message}`);
      }

      // Connect to SSE stream - use machineId from response
      // SECURITY NOTE: EventSource API doesn't support custom headers for authentication.
      // We pass the token as a query parameter as a workaround. This is acceptable because:
      // 1. The connection uses HTTPS, encrypting the URL in transit
      // 2. The token is properly URL-encoded
      // 3. This is a temporary connection for deployment streaming only
      // Consider migrating to WebSockets in the future for proper header support.
      const streamUrl = `${apiUrl}/service/${responseMachineId}/deploy/stream/${streamId}?token=${encodeURIComponent(token)}`;

      const eventSource = new EventSource(streamUrl) as EventSource & {
        onmessage: (event: MessageEvent) => void;
        onerror: (error: Event) => void;
      };

      return new Promise((resolve, reject) => {
        // Track if we've seen completion
        let isCompleted = false;
        let hasConnected = false;
        let buildOutputStarted = false;
        let currentStage = '';
        let spinnerInterval: NodeJS.Timeout | null = null;
        let spinnerIndex = 0;
        const spinnerFrames = [
          '⠋',
          '⠙',
          '⠹',
          '⠸',
          '⠼',
          '⠴',
          '⠦',
          '⠧',
          '⠇',
          '⠏',
        ];

        const stageIcons = {
          connected: '🔗',
          extracting: '📦',
          uploading: '☁️ ',
          building: '🔨',
          starting: '🏃',
          'capturing-logs': '📝',
          complete: '✅',
        };

        eventSource.onmessage = (event: MessageEvent) => {
          try {
            const progress = JSON.parse(event.data as string) as {
              type: string;
              stage?: string;
              message?: string;
              data?: {
                buildLog?: string;
                startupLog?: string;
                output?: string;
                error?: string;
              };
            };

            switch (progress.type) {
              case 'status':
                if (progress.stage === 'connected') {
                  hasConnected = true;
                  console.log(
                    `\n${stageIcons['connected'] || ''} Connected to deployment service`,
                  );
                } else if (progress.stage && progress.stage !== currentStage) {
                  // If we were showing "Building application" progress, add a checkmark
                  if (
                    buildOutputStarted &&
                    !verbose &&
                    currentStage === 'building'
                  ) {
                    // Stop spinner if it's running
                    if (spinnerInterval) {
                      clearInterval(spinnerInterval);
                      spinnerInterval = null;
                    }
                    // Overwrite spinner with checkmark
                    process.stdout.write(`\b${chalk.green('✓')}\n`);
                    buildOutputStarted = false;
                  }

                  currentStage = progress.stage;
                  const icon = stageIcons[progress.stage] || '🔸';
                  const stageName =
                    progress.stage.charAt(0).toUpperCase() +
                    progress.stage.slice(1).replace(/-/g, ' ');
                  console.log(`\n${icon} ${stageName}...`);
                }
                break;

              case 'log-stream':
                // Handle real-time streaming build output
                if (progress.data?.buildLog && verbose) {
                  if (!buildOutputStarted) {
                    console.log('\n' + chalk.gray('Build output:'));
                    console.log(chalk.gray('─'.repeat(80)));
                    buildOutputStarted = true;
                  }
                  // Write chunks directly without newline to preserve formatting
                  process.stdout.write(progress.data.buildLog);
                } else if (
                  progress.data?.buildLog &&
                  !verbose &&
                  !buildOutputStarted
                ) {
                  // Show a simple progress indicator for non-verbose mode
                  buildOutputStarted = true;
                  process.stdout.write(
                    `   ${chalk.dim('Building application')} ${chalk.blue(spinnerFrames[0])}`,
                  );

                  // Start spinner animation
                  spinnerInterval = setInterval(() => {
                    spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
                    // Move cursor back, clear the spinner character, and write new one
                    process.stdout.write(
                      `\b${chalk.blue(spinnerFrames[spinnerIndex])}`,
                    );
                  }, 80);
                }
                break;

              case 'log':
                // Complete logs (build completed, startup logs, etc.)
                // If we were showing "Building application" progress, complete it
                if (buildOutputStarted && !verbose) {
                  // Stop spinner if it's running
                  if (spinnerInterval) {
                    clearInterval(spinnerInterval);
                    spinnerInterval = null;
                  }
                  // Overwrite spinner with checkmark
                  process.stdout.write(`\b${chalk.green('✓')}\n`);
                }

                if (verbose) {
                  if (progress.data?.buildLog && !buildOutputStarted) {
                    // Only show if we didn't stream it already
                    console.log('\n' + chalk.gray('Build output:'));
                    console.log(chalk.gray('─'.repeat(80)));
                    console.log(progress.data.buildLog);
                  }
                  if (progress.data?.startupLog) {
                    console.log('\n' + chalk.gray('Startup logs:'));
                    console.log(chalk.gray('─'.repeat(80)));
                    console.log(progress.data.startupLog);
                  }
                  if (progress.data?.output) {
                    console.log('\n' + chalk.gray('Output:'));
                    console.log(chalk.gray('─'.repeat(80)));
                    console.log(progress.data.output);
                  }
                } else {
                  // In non-verbose mode, check for errors in startup logs
                  if (
                    progress.data?.startupLog &&
                    progress.data.startupLog.toLowerCase().includes('error')
                  ) {
                    console.log(
                      '\n' +
                        chalk.yellow(
                          '⚠️  Startup warnings detected. Run with --verbose to see details.',
                        ),
                    );
                  }
                }
                // Reset build output flag for next deployment
                buildOutputStarted = false;
                break;

              case 'complete':
                if (buildOutputStarted && !verbose) {
                  // Stop spinner if it's running
                  if (spinnerInterval) {
                    clearInterval(spinnerInterval);
                    spinnerInterval = null;
                  }
                  // Overwrite spinner with checkmark
                  process.stdout.write(`\b${chalk.green('✓')}\n`);
                }
                console.log(
                  `\n${chalk.green('✅ Deployment completed successfully!')}`,
                );

                // Save serviceId to .superjolt file
                if (deployedServiceId) {
                  try {
                    writeSuperjoltConfig(
                      { serviceId: deployedServiceId },
                      projectRoot || undefined,
                    );
                    console.log(
                      `   ${chalk.green('✓')} Saved service ID to .superjolt file`,
                    );
                  } catch (error) {
                    const errorMessage =
                      error instanceof Error ? error.message : String(error);
                    console.warn(
                      chalk.yellow(
                        '⚠️  Could not save .superjolt file:',
                        errorMessage,
                      ),
                    );
                  }
                }

                // Display the service URL
                if (serviceUrl) {
                  console.log(
                    '\n' + chalk.cyan('🌐 Your app is now available at:'),
                  );
                  console.log('   ' + chalk.bold.underline(serviceUrl));
                  console.log();
                }

                isCompleted = true;
                eventSource.close();

                // Clean up temp file
                fs.unlinkSync(tempZipPath);
                resolve();
                break;

              case 'error':
                console.error(
                  '\n' + chalk.red(`❌ Deployment failed: ${progress.message}`),
                );
                if (progress.data?.error) {
                  console.error(chalk.red(progress.data.error));
                }
                eventSource.close();

                // Clean up temp file
                fs.unlinkSync(tempZipPath);
                reject(new Error(progress.message));
                break;

              default:
                console.log(
                  chalk.gray(`[${progress.type}] ${progress.message}`),
                );
            }
          } catch {
            console.error('Failed to parse event:', event.data);
          }
        };

        eventSource.onerror = (error: Event) => {
          // If we already completed, ignore the error
          if (isCompleted) {
            return;
          }

          // If we connected but then immediately got an error, the deployment likely completed
          if (hasConnected && !isCompleted) {
            console.log(
              `\n${chalk.yellow('⚠️  Lost connection to deployment stream')}`,
            );
            console.log(
              chalk.dim('   The deployment may have completed successfully'),
            );
            console.log(
              chalk.dim(
                `   Run ${chalk.cyan(`superjolt status`)} to check the service status`,
              ),
            );

            // Consider this a success since we connected
            eventSource.close();
            try {
              fs.unlinkSync(tempZipPath);
            } catch {
              /* intentionally empty */
            }
            resolve();
            return;
          }

          console.error(`\n${chalk.red('❌ Stream connection error')}`);
          if (verbose) {
            console.error(chalk.dim('Stream URL:'), streamUrl);
            if (error) {
              console.error(chalk.dim('Error details:'), error);
            }
          } else {
            console.error(
              chalk.dim('   Run with --verbose to see connection details'),
            );
          }

          eventSource.close();

          // Clean up temp file
          try {
            fs.unlinkSync(tempZipPath);
          } catch {
            /* intentionally empty */
          }

          reject(new Error('Stream connection failed'));
        };
      });
    } catch (error) {
      // Clean up temp file
      try {
        fs.unlinkSync(tempZipPath);
      } catch {
        /* intentionally empty */
      }

      throw error;
    }
  }
}
