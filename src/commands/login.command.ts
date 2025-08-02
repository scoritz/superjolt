import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
@Command({
  name: 'login',
  description: 'Authenticate with Superjolt using GitHub',
})
export class LoginCommand extends CommandRunner {
  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async run(): Promise<void> {
    // Check if already logged in
    const existingToken = await this.authService.getToken();
    if (existingToken) {
      try {
        // Verify token is still valid
        await this.apiService.getCurrentUser();
        this.logger.log('✅ You are already logged in!');
        return;
      } catch {
        // Token is invalid, continue with login
        await this.authService.deleteToken();
      }
    }

    try {
      await this.authService.performOAuthFlow();
      this.logger.log('You are now logged in to Superjolt.');
    } catch (error: any) {
      this.logger.error(`\n❌ Authentication failed: ${error.message}`);
      process.exit(1);
    }
  }
}
