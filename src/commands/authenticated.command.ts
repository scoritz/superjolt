import { CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export abstract class AuthenticatedCommand extends CommandRunner {
  protected abstract authService: AuthService;
  protected abstract logger: LoggerService;

  async run(...args: unknown[]): Promise<void> {
    // Check if we have a token
    const token = await this.authService.getToken();

    if (!token) {
      // No token - trigger auth flow
      this.logger.log('🔐 Authentication required. Starting login flow...\n');
      await this.authService.performOAuthFlow();
    }

    // For commands that use ApiService, let ApiService handle token validation
    // It has its own 401 handling that will re-authenticate if needed

    // Now execute the actual command logic
    return this.execute(...args);
  }

  protected abstract execute(...args: unknown[]): Promise<void>;
}
