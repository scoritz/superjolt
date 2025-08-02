import { Test, TestingModule } from '@nestjs/testing';
import { StatusCommand } from '../../src/commands/status.command';
import { AuthService } from '../../src/services/auth.service';
import { StorageService } from '../../src/services/storage.service';
import { ConfigService } from '../../src/services/config.service';
import * as fs from 'fs';
import { LoggerService } from '../../src/services/logger.service';

jest.mock('fs');
jest.mock('../../src/utils/project');
jest.mock('open');
jest.mock('nanoid');

describe('StatusCommand', () => {
  let command: StatusCommand;
  let authService: AuthService;
  let storageService: StorageService;
  let configService: ConfigService;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock console.log
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock fs.readFileSync for package.json
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        version: '0.1.0-beta.1',
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusCommand,
        {
          provide: AuthService,
          useValue: {
            getToken: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            listKeys: jest.fn(),
            getJson: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getApiUrl: jest.fn(),
            getBaseUrl: jest.fn(),
          },
        },
        LoggerService,
      ],
    }).compile();

    command = module.get<StatusCommand>(StatusCommand);
    authService = module.get<AuthService>(AuthService);
    storageService = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('run', () => {
    it('should display version information', async () => {
      // Setup mocks
      (configService.getApiUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com/v1/cli',
      );
      (configService.getBaseUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com',
      );
      (authService.getToken as jest.Mock).mockResolvedValue(null);
      (storageService.listKeys as jest.Mock).mockReturnValue([]);
      (storageService.getJson as jest.Mock).mockResolvedValue(null);

      await command.run();

      // Check that the output contains expected information
      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Superjolt CLI Status');
      expect(output).toContain('CLI Version');
      expect(output).toContain('0.1.0-beta.1');
      expect(output).toContain('Node Version');
    });

    it('should display API configuration', async () => {
      const customApiUrl = 'http://localhost:3000/v1/cli';
      (configService.getApiUrl as jest.Mock).mockReturnValue(customApiUrl);
      (configService.getBaseUrl as jest.Mock).mockReturnValue(
        'http://localhost:3000',
      );
      (authService.getToken as jest.Mock).mockResolvedValue(null);
      (storageService.listKeys as jest.Mock).mockReturnValue([]);
      (storageService.getJson as jest.Mock).mockResolvedValue(null);

      await command.run();

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('API Configuration');
      expect(output).toContain(customApiUrl);
    });

    it('should display authentication status when authenticated', async () => {
      const mockToken = 'test-token-1234567890abcdef';
      (configService.getApiUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com/v1/cli',
      );
      (configService.getBaseUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com',
      );
      (authService.getToken as jest.Mock).mockResolvedValue(mockToken);
      (storageService.listKeys as jest.Mock).mockReturnValue(['token']);
      (storageService.getJson as jest.Mock).mockResolvedValue(null);

      await command.run();

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Authentication');
      expect(output).toContain('Authenticated');
      // Check for masked token
      expect(output).toContain('test-tok...90abcdef');
    });

    it('should display not authenticated status when no token', async () => {
      (configService.getApiUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com/v1/cli',
      );
      (configService.getBaseUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com',
      );
      (authService.getToken as jest.Mock).mockResolvedValue(null);
      (storageService.listKeys as jest.Mock).mockReturnValue([]);
      (storageService.getJson as jest.Mock).mockResolvedValue(null);

      await command.run();

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Not authenticated');
      expect(output).toContain('superjolt login');
    });

    it('should display stored data', async () => {
      (configService.getApiUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com/v1/cli',
      );
      (configService.getBaseUrl as jest.Mock).mockReturnValue(
        'https://api.superjolt.com',
      );
      (authService.getToken as jest.Mock).mockResolvedValue(null);
      (storageService.listKeys as jest.Mock).mockReturnValue([
        'token',
        'update-check',
        'cache',
      ]);
      (storageService.getJson as jest.Mock).mockResolvedValue({
        lastCheck: new Date().toISOString(),
        latestVersion: '0.1.0-beta.1',
        currentVersion: '0.1.0-beta.1',
      });

      await command.run();

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Local Storage');
      expect(output).toContain('token');
      expect(output).toContain('update-check');
      expect(output).toContain('cache');
    });
  });
});
