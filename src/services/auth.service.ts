import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';
import { firstValueFrom } from 'rxjs';

const TOKEN_KEY = 'token';

@Injectable()
export class AuthService {
  private tokenCache: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  async getToken(): Promise<string | null> {
    // Check cache first
    if (this.tokenCache) {
      return this.tokenCache;
    }

    // Get from storage (will try keytar first, then file)
    const token = await this.storageService.get(TOKEN_KEY, { secure: true });
    if (token) {
      this.tokenCache = token;
      return token;
    }

    return null;
  }

  async setToken(token: string): Promise<void> {
    this.tokenCache = token;
    // Store securely (will try keytar first, then file)
    await this.storageService.set(TOKEN_KEY, token, { secure: true });
  }

  async deleteToken(): Promise<void> {
    this.tokenCache = null;
    // Delete from storage (will handle both keytar and file)
    await this.storageService.delete(TOKEN_KEY, { secure: true });
  }

  async performOAuthFlow(): Promise<string> {
    console.log('🔐 Authenticating with Superjolt...\n');

    // Generate state for auth flow using dynamic import
    const { nanoid } = await import('nanoid');
    const state = nanoid();

    // Get auth URL from API
    const authEndpoint = this.configService.getVersionedUrl(
      `auth/github?state=${state}&source=cli`,
    );

    console.log(`Fetching auth URL from: ${authEndpoint}`);

    const authResponse = await firstValueFrom(
      this.httpService.get(authEndpoint, {
        timeout: 10000, // 10 second timeout
      }),
    );
    console.log('>>', authResponse.data);
    const authUrl = authResponse.data.url;

    console.log('Opening browser for GitHub authentication...');
    console.log('If the browser does not open, please visit:');
    console.log(`\n${authUrl}\n`);

    // Open browser using dynamic import
    const open = (await import('open')).default;
    await open(authUrl);

    // Poll for completion
    console.log('⏳ Waiting for authentication...');

    const startTime = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    while (Date.now() - startTime < timeout) {
      try {
        const pollResponse = await firstValueFrom(
          this.httpService.get(
            this.configService.getVersionedUrl(`auth/poll?state=${state}`),
          ),
        );

        const { status, token } = pollResponse.data;

        if (status === 'completed' && token) {
          // Save token
          await this.setToken(token);
          console.log('\n✅ Authentication successful!\n');
          return token;
        } else if (status === 'failed') {
          throw new Error('Authentication failed');
        } else if (status === 'expired') {
          throw new Error('Authentication session expired');
        }

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Session might have expired
          throw new Error('Authentication session expired');
        }
        throw error;
      }
    }

    throw new Error('Authentication timed out');
  }
}
