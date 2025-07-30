import { Test, TestingModule } from '@nestjs/testing';
import { EnvGetCommand } from '../../src/commands/env-get.command';
import { ApiService } from '../../src/services/api.service';
import { AuthService } from '../../src/services/auth.service';
import * as projectUtils from '../../src/utils/project';

jest.mock('../../src/utils/project');

describe('EnvGetCommand', () => {
  let command: EnvGetCommand;
  let mockApiService: {
    getEnvVar: jest.Mock;
  };
  let mockAuthService: {
    getToken: jest.Mock;
    performOAuthFlow: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      getEnvVar: jest.fn(),
    };

    mockAuthService = {
      getToken: jest.fn(),
      performOAuthFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvGetCommand,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    command = module.get<EnvGetCommand>(EnvGetCommand);

    // Mock successful authentication
    mockAuthService.getToken.mockResolvedValue('test-token');

    // Default mock for readSuperjoltConfig
    (projectUtils.readSuperjoltConfig as jest.Mock).mockReturnValue({
      serviceId: 'service-123',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('execute', () => {
    it('should get environment variable successfully', async () => {
      const key = 'NODE_ENV';
      const value = 'production';
      mockApiService.getEnvVar.mockResolvedValue({ [key]: value });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run([key]);

      expect(mockApiService.getEnvVar).toHaveBeenCalledWith('service-123', key);
      expect(consoleLogSpy).toHaveBeenCalledWith(`${key}=${value}`);

      consoleLogSpy.mockRestore();
    });

    it('should show error when key is not provided', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: Environment variable key is required',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Usage: superjolt env:get KEY',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should show error when no service is configured', async () => {
      (projectUtils.readSuperjoltConfig as jest.Mock).mockReturnValue(null);

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run(['NODE_ENV'])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'No service found. Deploy first with: superjolt deploy',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle environment variable not found', async () => {
      const key = 'MISSING_VAR';
      mockApiService.getEnvVar.mockRejectedValue(
        new Error('Environment variable not found'),
      );

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([key])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Environment variable '${key}' not found`,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockApiService.getEnvVar.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run(['NODE_ENV'])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});