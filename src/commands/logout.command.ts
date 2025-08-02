import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
@Command({
  name: 'logout',
  description: 'Log out from Superjolt',
})
export class LogoutCommand extends CommandRunner {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async run(): Promise<void> {
    try {
      const token = await this.authService.getToken();

      if (!token) {
        this.logger.log('You are not logged in.');
        return;
      }

      await this.authService.deleteToken();
      this.logger.log('✅ Successfully logged out from Superjolt.');
    } catch (error: any) {
      this.logger.error(`\nError logging out: ${error.message}`);
      process.exit(1);
    }
  }
}
