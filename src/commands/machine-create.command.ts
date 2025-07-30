import { Command } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
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
  ) {
    super();
  }

  protected async execute(): Promise<void> {
    try {
      console.log('Creating machine...');

      const machine = await this.apiService.createMachine();

      console.log('\nMachine created successfully!');
      console.log(`ID: ${machine.id}`);
      console.log(`Name: ${machine.name}`);
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }
}
