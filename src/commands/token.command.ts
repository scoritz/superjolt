import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import chalk from 'chalk';

@Injectable()
@Command({
  name: 'token',
  description: 'Display your authentication token for CI/CD use',
})
export class TokenCommand extends CommandRunner {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async run(_inputs: string[], options: { show?: boolean }): Promise<void> {
    const token = await this.authService.getToken();

    if (!token) {
      this.logger.error(
        chalk.red('\n❌ Not authenticated. Run "superjolt login" first.\n'),
      );
      process.exit(1);
    }

    if (options.show) {
      // Output just the token for easy scripting
      console.log(token);
    } else {
      // Show masked token with instructions
      const maskedToken = `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;

      this.logger.log(chalk.cyan('\n🔐 Authentication Token\n'));
      this.logger.log(`Token: ${chalk.dim(maskedToken)}`);
      this.logger.log(chalk.yellow('\n⚠️  Security Warning:'));
      this.logger.log(
        chalk.dim(
          '  Never share your token publicly or commit it to version control.',
        ),
      );
      this.logger.log(
        chalk.dim('  Tokens provide full access to your Superjolt account.\n'),
      );
      this.logger.log(chalk.bold('To display the full token for CI/CD use:'));
      this.logger.log(chalk.green('  superjolt token --show\n'));
      this.logger.log(chalk.bold('To use in CI/CD environments:'));
      this.logger.log(
        chalk.green('  export SUPERJOLT_TOKEN=$(superjolt token --show)'),
      );
      this.logger.log(
        chalk.dim(
          '  Then set SUPERJOLT_TOKEN as a secret in your CI/CD platform.\n',
        ),
      );
    }
  }

  @Option({
    flags: '-s, --show',
    description: 'Show the full token (for CI/CD use)',
  })
  parseShow(): boolean {
    return true;
  }
}
