import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
@Command({
  name: 'logout',
  description: 'Log out from Superjolt',
})
export class LogoutCommand extends CommandRunner {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async run(): Promise<void> {
    try {
      const token = await this.authService.getToken();

      if (!token) {
        console.log('You are not logged in.');
        return;
      }

      await this.authService.deleteToken();
      console.log('✅ Successfully logged out from Superjolt.');
    } catch (error: any) {
      console.error(`\nError logging out: ${error.message}`);
      process.exit(1);
    }
  }
}
