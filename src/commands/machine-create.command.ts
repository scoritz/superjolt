import { Command } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { AuthenticatedCommand } from './authenticated.command';

@Injectable()
@Command({
  name: 'machine:create',
  description: 'Create a new machine',
})
export class MachineCreateCommand extends AuthenticatedCommand {
  constructor(
    protected readonly apiService: ApiService,
    protected readonly authService: AuthService,
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(): Promise<void> {
    try {
      this.logger.log('Creating machine...');

      const machine = await this.apiService.createMachine();

      this.logger.log('\nMachine created successfully!');
      this.logger.log(`ID: ${machine.id}`);
      this.logger.log(`Name: ${machine.name}`);
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
