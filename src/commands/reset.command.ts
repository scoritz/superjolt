import { Command, Option } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@nestjs/common';
import { AuthenticatedCommand } from './authenticated.command';
import * as readline from 'readline';

interface ResetOptions {
  force?: boolean;
}

@Injectable()
@Command({
  name: 'reset',
  description: 'Delete all machines and services (DESTRUCTIVE)',
})
export class ResetCommand extends AuthenticatedCommand {
  constructor(
    private readonly apiService: ApiService,
    protected readonly authService: AuthService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: ResetOptions,
  ): Promise<void> {
    try {
      if (!options.force) {
        console.log(
          '🚨 WARNING: This will DELETE ALL your machines and services!',
        );
        console.log(
          '   This action is IRREVERSIBLE and will destroy all deployed applications.',
        );
        console.log('');

        const confirmed = await this.askForConfirmation();
        if (!confirmed) {
          console.log('Reset cancelled.');
          return;
        }
      }

      console.log('\n🧹 Starting reset process...');

      const response = await this.apiService.resetAllResources();

      console.log('✅ Reset completed successfully!');
      console.log(
        `   Deleted ${response.deletedServices} services and ${response.deletedMachines} machines.`,
      );
    } catch (error: any) {
      console.error(`\n${error.message}`);
      process.exit(1);
    }
  }

  private async askForConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question('Type "DELETE ALL" to confirm: ', (answer) => {
        rl.close();
        resolve(answer.trim() === 'DELETE ALL');
      });
    });
  }

  @Option({
    flags: '-f, --force',
    description: 'Skip confirmation prompt (dangerous)',
  })
  parseForce(): boolean {
    return true;
  }
}
