import { Command, Option } from 'nest-commander';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
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
    protected readonly logger: LoggerService,
  ) {
    super();
  }

  protected async execute(
    passedParams: string[],
    options: ResetOptions,
  ): Promise<void> {
    try {
      if (!options.force) {
        this.logger.log(
          '🚨 WARNING: This will DELETE ALL your machines and services!',
        );
        this.logger.log(
          '   This action is IRREVERSIBLE and will destroy all deployed applications.',
        );
        this.logger.log('');

        const confirmed = await this.askForConfirmation();
        if (!confirmed) {
          this.logger.log('Reset cancelled.');
          return;
        }
      }

      this.logger.log('\n🧹 Starting reset process...');

      const response = await this.apiService.resetAllResources();

      this.logger.log('✅ Reset completed successfully!');
      this.logger.log(
        `   Deleted ${response.deletedServices} services and ${response.deletedMachines} machines.`,
      );
    } catch (error: any) {
      this.logger.error(`\n${error.message}`);
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
