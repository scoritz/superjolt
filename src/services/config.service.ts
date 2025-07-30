import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  private readonly defaultBaseUrl = 'https://api.superjolt.com';

  constructor(private nestConfigService: NestConfigService) {}

  /**
   * Get the base API URL (e.g., https://api.superjolt.com)
   */
  getBaseUrl(): string {
    return this.nestConfigService.get<string>(
      'SUPERJOLT_API_URL',
      this.defaultBaseUrl,
    );
  }

  /**
   * Get the CLI API URL with version prefix (e.g., https://api.superjolt.com/v1/cli)
   */
  getApiUrl(): string {
    return `${this.getBaseUrl()}/v1/cli`;
  }

  /**
   * Get versioned URL for non-CLI endpoints (e.g., /v1/auth)
   */
  getVersionedUrl(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.getBaseUrl()}/v1/${cleanPath}`;
  }
}
