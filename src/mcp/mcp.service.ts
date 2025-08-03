import { Injectable } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class McpService {
  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  async createServer(): Promise<Server> {
    const server = new Server(
      {
        name: 'superjolt',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    // Register the main tool list handler that returns ALL tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Auth tools
        {
          name: 'check_auth',
          description: 'Check if user is authenticated with Superjolt',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_current_user',
          description: 'Get information about the currently authenticated user',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        // Machine tools
        {
          name: 'list_machines',
          description: 'List all machines',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'create_machine',
          description: 'Create a new machine',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Machine name (optional)',
              },
            },
            required: [],
          },
        },
        {
          name: 'delete_machine',
          description: 'Delete a machine',
          inputSchema: {
            type: 'object',
            properties: {
              machineId: {
                type: 'string',
                description: 'Machine ID',
              },
            },
            required: ['machineId'],
          },
        },
        {
          name: 'rename_machine',
          description: 'Rename a machine',
          inputSchema: {
            type: 'object',
            properties: {
              machineId: {
                type: 'string',
                description: 'Machine ID',
              },
              newName: {
                type: 'string',
                description: 'New name for the machine',
              },
            },
            required: ['machineId', 'newName'],
          },
        },
        {
          name: 'set_default_machine',
          description: 'Set the default machine for deployments',
          inputSchema: {
            type: 'object',
            properties: {
              machineId: {
                type: 'string',
                description: 'Machine ID',
              },
            },
            required: ['machineId'],
          },
        },
        // Service tools
        {
          name: 'list_services',
          description: 'List all services',
          inputSchema: {
            type: 'object',
            properties: {
              machineId: {
                type: 'string',
                description: 'Machine ID to filter services (optional)',
              },
            },
            required: [],
          },
        },
        {
          name: 'start_service',
          description: 'Start a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['serviceId'],
          },
        },
        {
          name: 'stop_service',
          description: 'Stop a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['serviceId'],
          },
        },
        {
          name: 'restart_service',
          description: 'Restart a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['serviceId'],
          },
        },
        {
          name: 'delete_service',
          description: 'Delete a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['serviceId'],
          },
        },
        {
          name: 'rename_service',
          description: 'Rename a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
              newName: {
                type: 'string',
                description: 'New name for the service',
              },
            },
            required: ['serviceId', 'newName'],
          },
        },
        // Env tools
        {
          name: 'list_env_vars',
          description: 'List environment variables for a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['serviceId'],
          },
        },
        {
          name: 'set_env_vars',
          description: 'Set environment variables',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Environment variable key',
              },
              value: {
                type: 'string',
                description: 'Environment variable value',
              },
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['key', 'value', 'serviceId'],
          },
        },
        {
          name: 'get_env_var',
          description: 'Get an environment variable value',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Environment variable key',
              },
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['key', 'serviceId'],
          },
        },
        {
          name: 'delete_env_var',
          description: 'Remove an environment variable',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Environment variable key',
              },
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['key', 'serviceId'],
          },
        },
        {
          name: 'push_env_file',
          description: 'Push a .env file to a service',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description:
                  'Path to .env file (defaults to .env in current directory)',
              },
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
            },
            required: ['serviceId'],
          },
        },
        // Log tools
        {
          name: 'get_logs',
          description: 'Get logs for a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
              lines: {
                type: 'number',
                description:
                  'Number of recent log lines to fetch (default: 100)',
              },
              follow: {
                type: 'boolean',
                description: 'Follow logs in real-time (default: false)',
              },
            },
            required: ['serviceId'],
          },
        },
        // Custom domain tools
        {
          name: 'add_custom_domain',
          description: 'Add a custom domain to a service',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'The custom domain (e.g., app.example.com)',
              },
              serviceId: {
                type: 'string',
                description: 'Service ID',
              },
              primary: {
                type: 'boolean',
                description: 'Set as primary domain (default: false)',
              },
            },
            required: ['domain', 'serviceId'],
          },
        },
        {
          name: 'list_custom_domains',
          description: 'List custom domains for a service or all services',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'Service ID (optional, lists all if not provided)',
              },
            },
            required: [],
          },
        },
        {
          name: 'remove_custom_domain',
          description: 'Remove a custom domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'The custom domain to remove',
              },
            },
            required: ['domain'],
          },
        },
        {
          name: 'get_custom_domain_status',
          description: 'Get the status of a custom domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'The custom domain to check',
              },
            },
            required: ['domain'],
          },
        },
      ],
    }));

    // Get all tool handlers
    const authHandler = this.createAuthToolsHandler();
    const serviceHandler = this.createServiceToolsHandler();
    const machineHandler = this.createMachineToolsHandler();
    const envHandler = this.createEnvToolsHandler();
    const logHandler = this.createLogToolsHandler();
    const domainHandler = this.createDomainToolsHandler();

    // Register the main CallToolRequestSchema handler that routes to all tools
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;

      // Route to the appropriate handler based on tool name
      if (toolName === 'check_auth' || toolName === 'get_current_user') {
        return authHandler(request);
      }

      if (
        [
          'list_services',
          'start_service',
          'stop_service',
          'restart_service',
          'delete_service',
          'rename_service',
        ].includes(toolName)
      ) {
        return serviceHandler(request);
      }

      if (
        [
          'list_machines',
          'create_machine',
          'delete_machine',
          'rename_machine',
          'set_default_machine',
        ].includes(toolName)
      ) {
        return machineHandler(request);
      }

      if (
        [
          'list_env_vars',
          'set_env_vars',
          'get_env_var',
          'delete_env_var',
          'push_env_file',
        ].includes(toolName)
      ) {
        return envHandler(request);
      }

      if (toolName === 'get_logs') {
        return logHandler(request);
      }

      if (
        [
          'add_custom_domain',
          'list_custom_domains',
          'remove_custom_domain',
          'get_custom_domain_status',
        ].includes(toolName)
      ) {
        return domainHandler(request);
      }

      // Unknown tool
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${toolName}`,
          },
        ],
        isError: true,
      };
    });

    // Set up error handling
    server.onerror = (error) => {
      // Write errors to stderr to avoid breaking JSON-RPC protocol
      process.stderr.write(`[MCP Error] ${error.message || error}\n`);
    };

    return server;
  }

  private createAuthToolsHandler() {
    return async (request: any) => {
      if (request.params.name === 'check_auth') {
        try {
          const token = await this.authService.getToken();
          return {
            content: [
              {
                type: 'text',
                text: token
                  ? 'Authenticated'
                  : 'Not authenticated. Run "superjolt login" to authenticate.',
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error checking authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'get_current_user') {
        try {
          const token = await this.authService.getToken();
          if (!token) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Not authenticated. Run "superjolt login" to authenticate.',
                },
              ],
            };
          }

          // Try to get user info without triggering re-authentication
          try {
            const user = await this.apiService.getCurrentUser();
            return {
              content: [
                {
                  type: 'text',
                  text: `User: ${user.name} (${user.email})\nGitHub: ${user.githubUsername}`,
                },
              ],
            };
          } catch (apiError: any) {
            // If it's a 401, the token might be invalid
            if (
              apiError.message?.includes('401') ||
              apiError.message?.includes('Authentication') ||
              apiError.response?.status === 401
            ) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Authentication token is invalid or expired. Run "superjolt login" to re-authenticate.',
                  },
                ],
              };
            }
            throw apiError;
          }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting user info: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      // This should not be reached as routing is handled in main handler
      throw new Error(
        `Unexpected tool in auth handler: ${request.params.name}`,
      );
    };
  }

  private createServiceToolsHandler() {
    const ServiceActionSchema = z.object({
      serviceId: z.string().describe('Service ID'),
    });

    const ListServicesSchema = z.object({
      machineId: z
        .string()
        .optional()
        .describe('Machine ID to filter services'),
    });

    const RenameServiceSchema = z.object({
      serviceId: z.string().describe('Service ID'),
      newName: z.string().describe('New name for the service'),
    });

    return async (request: any) => {
      const { name } = request.params;

      switch (name) {
        case 'list_services': {
          try {
            const args = ListServicesSchema.parse(request.params.arguments);
            const response = await this.apiService.listServices(args.machineId);
            const services = response.services || [];

            if (services.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'No services found',
                  },
                ],
              };
            }

            const serviceList = services
              .map(
                (s: any) =>
                  `- ${s.name} (${s.id}): ${s.state || s.status || 'unknown'} - ${s.url || 'No URL'}`,
              )
              .join('\n');

            return {
              content: [
                {
                  type: 'text',
                  text: serviceList,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error listing services: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'start_service': {
          try {
            const args = ServiceActionSchema.parse(request.params.arguments);
            await this.apiService.startService(args.serviceId);
            return {
              content: [
                {
                  type: 'text',
                  text: `Service ${args.serviceId} started successfully`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error starting service: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'stop_service': {
          try {
            const args = ServiceActionSchema.parse(request.params.arguments);
            await this.apiService.stopService(args.serviceId);
            return {
              content: [
                {
                  type: 'text',
                  text: `Service ${args.serviceId} stopped successfully`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error stopping service: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'restart_service': {
          try {
            const args = ServiceActionSchema.parse(request.params.arguments);
            await this.apiService.restartService(args.serviceId);
            return {
              content: [
                {
                  type: 'text',
                  text: `Service ${args.serviceId} restarted successfully`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error restarting service: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'delete_service': {
          try {
            const args = ServiceActionSchema.parse(request.params.arguments);
            await this.apiService.deleteService(args.serviceId);
            return {
              content: [
                {
                  type: 'text',
                  text: `Service ${args.serviceId} deleted successfully`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error deleting service: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'rename_service': {
          try {
            const args = RenameServiceSchema.parse(request.params.arguments);
            await this.apiService.renameService(args.serviceId, args.newName);
            return {
              content: [
                {
                  type: 'text',
                  text: `Service ${args.serviceId} renamed to "${args.newName}"`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error renaming service: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          // This should not be reached as routing is handled in main handler
          throw new Error(`Unexpected tool in service handler: ${name}`);
      }
    };
  }

  private createMachineToolsHandler() {
    const CreateMachineSchema = z.object({
      name: z.string().optional().describe('Machine name'),
    });

    const MachineActionSchema = z.object({
      machineId: z.string().describe('Machine ID'),
    });

    const RenameMachineSchema = z.object({
      machineId: z.string().describe('Machine ID'),
      newName: z.string().describe('New name for the machine'),
    });

    return async (request: any) => {
      const { name } = request.params;

      switch (name) {
        case 'list_machines': {
          try {
            const response = await this.apiService.listMachines();
            const machines = response.machines || [];
            const machineList = machines
              .map(
                (m: any) =>
                  `- ${m.name} (${m.id}): ${m.status} - ${m.region || 'Unknown region'}`,
              )
              .join('\n');

            return {
              content: [
                {
                  type: 'text',
                  text: machineList || 'No machines found',
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error listing machines: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'create_machine': {
          try {
            const args = CreateMachineSchema.parse(request.params.arguments);
            const machine = await this.apiService.createMachine();

            // If a name was provided, rename the machine
            if (args.name) {
              await this.apiService.renameMachine(machine.id, args.name);
              machine.name = args.name;
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Machine created successfully!\nID: ${machine.id}\nName: ${machine.name}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error creating machine: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'delete_machine': {
          try {
            const args = MachineActionSchema.parse(request.params.arguments);
            await this.apiService.deleteMachine(args.machineId);
            return {
              content: [
                {
                  type: 'text',
                  text: `Machine ${args.machineId} deleted successfully`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error deleting machine: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'rename_machine': {
          try {
            const args = RenameMachineSchema.parse(request.params.arguments);
            await this.apiService.renameMachine(args.machineId, args.newName);
            return {
              content: [
                {
                  type: 'text',
                  text: `Machine ${args.machineId} renamed to "${args.newName}"`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error renaming machine: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'set_default_machine': {
          try {
            const args = MachineActionSchema.parse(request.params.arguments);
            await this.apiService.setDefaultMachine(args.machineId);
            return {
              content: [
                {
                  type: 'text',
                  text: `Default machine set to ${args.machineId}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error setting default machine: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          // This should not be reached as routing is handled in main handler
          throw new Error(`Unexpected tool in machine handler: ${name}`);
      }
    };
  }

  private createEnvToolsHandler() {
    const ListEnvSchema = z.object({
      serviceId: z.string().describe('Service ID'),
    });

    const SetEnvSchema = z.object({
      key: z.string().describe('Environment variable key'),
      value: z.string().describe('Environment variable value'),
      serviceId: z.string().describe('Service ID'),
    });

    const GetEnvSchema = z.object({
      key: z.string().describe('Environment variable key'),
      serviceId: z.string().describe('Service ID'),
    });

    const DeleteEnvSchema = z.object({
      key: z.string().describe('Environment variable key'),
      serviceId: z.string().describe('Service ID'),
    });

    const PushEnvFileSchema = z.object({
      path: z.string().optional().describe('Path to .env file'),
      serviceId: z.string().describe('Service ID'),
    });

    return async (request: any) => {
      const { name } = request.params;

      switch (name) {
        case 'list_env_vars': {
          try {
            const args = ListEnvSchema.parse(request.params.arguments);
            const envVars = await this.apiService.listEnvVars(args.serviceId);

            const envList = Object.entries(envVars)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n');

            return {
              content: [
                {
                  type: 'text',
                  text: envList || 'No environment variables set',
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error listing environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'set_env_vars': {
          try {
            const args = SetEnvSchema.parse(request.params.arguments);
            await this.apiService.setEnvVars(args.serviceId, {
              [args.key]: args.value,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `Environment variable ${args.key} set successfully`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error setting environment variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'get_env_var': {
          try {
            const args = GetEnvSchema.parse(request.params.arguments);
            const envVar = await this.apiService.getEnvVar(
              args.serviceId,
              args.key,
            );
            const value = envVar[args.key];
            return {
              content: [
                {
                  type: 'text',
                  text: value
                    ? `${args.key}=${value}`
                    : `Environment variable ${args.key} not found`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error getting environment variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'delete_env_var': {
          try {
            const args = DeleteEnvSchema.parse(request.params.arguments);
            await this.apiService.deleteEnvVar(args.serviceId, args.key);
            return {
              content: [
                {
                  type: 'text',
                  text: `Environment variable ${args.key} removed successfully`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error removing environment variable: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        case 'push_env_file': {
          try {
            const args = PushEnvFileSchema.parse(request.params.arguments);
            const envPath = args.path || join(process.cwd(), '.env');

            const envContent = await readFile(envPath, 'utf-8');
            const envVars: Record<string, string> = {};

            envContent.split('\n').forEach((line) => {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key) {
                  envVars[key.trim()] = valueParts.join('=').trim();
                }
              }
            });

            await this.apiService.setEnvVars(args.serviceId, envVars);

            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully pushed ${Object.keys(envVars).length} environment variables`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error pushing environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          // This should not be reached as routing is handled in main handler
          throw new Error(`Unexpected tool in env handler: ${name}`);
      }
    };
  }

  private createLogToolsHandler() {
    const GetLogsSchema = z.object({
      serviceId: z.string().describe('Service ID'),
      lines: z
        .number()
        .optional()
        .describe('Number of recent log lines to fetch'),
      follow: z.boolean().optional().describe('Follow logs in real-time'),
    });

    return async (request: any) => {
      if (request.params.name === 'get_logs') {
        try {
          const args = GetLogsSchema.parse(request.params.arguments);

          // Get logs using the existing API method
          const logsResponse = await this.apiService.getServiceLogs(
            args.serviceId,
            {
              tail: args.lines || 100,
            },
          );

          const logs = logsResponse.logs || '';

          return {
            content: [
              {
                type: 'text',
                text: logs || 'No logs available',
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      // This should not be reached as routing is handled in main handler
      throw new Error(`Unexpected tool in log handler: ${request.params.name}`);
    };
  }

  private createDomainToolsHandler() {
    const AddCustomDomainSchema = z.object({
      domain: z.string(),
      serviceId: z.string(),
      primary: z.boolean().optional(),
    });

    const ListCustomDomainsSchema = z.object({
      serviceId: z.string().optional(),
    });

    const RemoveCustomDomainSchema = z.object({
      domain: z.string(),
    });

    const GetCustomDomainStatusSchema = z.object({
      domain: z.string(),
    });

    return async (request: any) => {
      if (request.params.name === 'add_custom_domain') {
        try {
          const args = AddCustomDomainSchema.parse(request.params.arguments);

          const response = await this.apiService.createCustomDomain({
            domain: args.domain,
            serviceId: args.serviceId,
            isPrimary: args.primary,
          });

          return {
            content: [
              {
                type: 'text',
                text: `Custom domain ${response.domain} added to service ${response.serviceId}\nStatus: ${response.status}\nSSL Status: ${response.sslStatus}${response.validationTarget ? `\nValidation URL: ${response.validationTarget}` : ''}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error adding custom domain: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'list_custom_domains') {
        try {
          const args = ListCustomDomainsSchema.parse(request.params.arguments);

          const response = await this.apiService.listCustomDomains(
            args.serviceId,
          );

          if (response.domains.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: args.serviceId
                    ? `No custom domains found for service ${args.serviceId}`
                    : 'No custom domains found',
                },
              ],
            };
          }

          const domainList = response.domains
            .map(
              (d) =>
                `- ${d.domain} (${d.serviceId})${d.isPrimary ? ' [PRIMARY]' : ''} - Status: ${d.status}, SSL: ${d.sslStatus}`,
            )
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Custom domains (${response.total}):\n${domainList}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error listing custom domains: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'remove_custom_domain') {
        try {
          const args = RemoveCustomDomainSchema.parse(request.params.arguments);

          await this.apiService.deleteCustomDomain(args.domain);

          return {
            content: [
              {
                type: 'text',
                text: `Custom domain ${args.domain} has been successfully removed`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error removing custom domain: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (request.params.name === 'get_custom_domain_status') {
        try {
          const args = GetCustomDomainStatusSchema.parse(
            request.params.arguments,
          );

          const response = await this.apiService.getCustomDomainStatus(
            args.domain,
          );

          return {
            content: [
              {
                type: 'text',
                text: `Domain: ${response.domain}\nStatus: ${response.status}\nSSL Status: ${response.sslStatus}${response.isPrimary ? '\nPrimary: Yes' : ''}${response.validationTarget ? `\nValidation URL: ${response.validationTarget}` : ''}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting domain status: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      // This should not be reached as routing is handled in main handler
      throw new Error(
        `Unexpected tool in domain handler: ${request.params.name}`,
      );
    };
  }
}
