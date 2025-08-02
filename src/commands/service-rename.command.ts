import { Command } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import { readSuperjoltConfig } from '../utils/project';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'service:rename',
  aliases: ['rename'],
  arguments: '[serviceId] [newName]',
  description: 'Rename a service',
})
export class ServiceRenameCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(passedParams: string[]): Promise<void> {
    try {
      // Check if no arguments provided
      if (passedParams.length === 0) {
        console.error('Error: New name is required');
        console.log('Usage: superjolt service:rename <serviceId> <newName>');
        console.log('   or: superjolt rename <newName> (uses .superjolt file)');
        process.exit(1);
      }

      let serviceId = passedParams[0];

      // If only one parameter provided, assume it's the new name and get service ID from config
      if (passedParams.length === 1) {
        const config = readSuperjoltConfig();
        if (config?.serviceId) {
          serviceId = config.serviceId;
          passedParams[1] = passedParams[0]; // Move the name to the correct position
          console.log(`Using service ID from .superjolt file: ${serviceId}`);
        } else {
          // No config file, so we can't determine if the param is service ID or name
          console.error('Error: Service ID is required');
          console.log('Usage: superjolt service:rename <serviceId> <newName>');
          console.log(
            '   or: superjolt rename <newName> (uses .superjolt file)',
          );
          console.log(
            '\nNo .superjolt file found. Run "superjolt deploy" first or provide a service ID.',
          );
          process.exit(1);
        }
      }

      // Validate inputs after parameter adjustment
      if (!serviceId) {
        console.error('Error: Service ID is required');
        console.log('Usage: superjolt service:rename <serviceId> <newName>');
        console.log('   or: superjolt rename <newName> (uses .superjolt file)');
        console.log(
          '\nNo .superjolt file found. Run "superjolt deploy" first or provide a service ID.',
        );
        process.exit(1);
      }

      if (!passedParams[1]) {
        console.error('Error: New name is required');
        console.log('Usage: superjolt service:rename <serviceId> <newName>');
        console.log('   or: superjolt rename <newName> (uses .superjolt file)');
        process.exit(1);
      }

      const finalNewName = passedParams[1];

      // Validate name format (similar to npm package names)
      const nameRegex = /^[a-z0-9][a-z0-9-._]*$/;
      if (!nameRegex.test(finalNewName)) {
        console.error(
          'Error: Service name must start with a lowercase letter or number, and can only contain lowercase letters, numbers, hyphens, periods, and underscores.',
        );
        process.exit(1);
      }

      console.log(
        `Renaming service ${chalk.cyan(serviceId)} to ${chalk.cyan(finalNewName)}...`,
      );

      const response = await this.apiService.renameService(
        serviceId,
        finalNewName,
      );

      console.log(chalk.green(`✅ ${response.message}`));
      console.log(
        `Service ${chalk.cyan(serviceId)} renamed to ${chalk.cyan(response.name)}`,
      );
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
