import { Test, TestingModule } from '@nestjs/testing';
import { ServiceRenameCommand } from '../../src/commands/service-rename.command';
import { ApiService } from '../../src/services/api.service';
import { AuthService } from '../../src/services/auth.service';
import * as projectUtils from '../../src/utils/project';
import { LoggerService } from '../../src/services/logger.service';

jest.mock('../../src/utils/project');

describe('ServiceRenameCommand', () => {
  let command: ServiceRenameCommand;
  let mockApiService: {
    renameService: jest.Mock;
  };
  let mockAuthService: {
    getToken: jest.Mock;
    performOAuthFlow: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      renameService: jest.fn(),
    };

    mockAuthService = {
      getToken: jest.fn(),
      performOAuthFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRenameCommand,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        LoggerService,
      ],
    }).compile();

    command = module.get<ServiceRenameCommand>(ServiceRenameCommand);

    // Mock successful authentication
    mockAuthService.getToken.mockResolvedValue('test-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('execute', () => {
    it('should rename service with provided service ID and name', async () => {
      const serviceId = 'service-123';
      const newName = 'new-service-name';
      mockApiService.renameService.mockResolvedValue({
        message: 'Service renamed successfully',
        serviceId,
        name: newName,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run([serviceId, newName]);

      expect(mockApiService.renameService).toHaveBeenCalledWith(
        serviceId,
        newName,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Renaming service`),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Service renamed successfully'),
      );

      consoleLogSpy.mockRestore();
    });

    it('should use service ID from .superjolt file when only name provided', async () => {
      const serviceId = 'config-service-456';
      const newName = 'new-name';
      (projectUtils.readSuperjoltConfig as jest.Mock).mockReturnValue({
        serviceId,
      });

      mockApiService.renameService.mockResolvedValue({
        message: 'Service renamed successfully',
        serviceId,
        name: newName,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run([newName]);

      expect(projectUtils.readSuperjoltConfig).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Using service ID from .superjolt file: ${serviceId}`,
      );
      expect(mockApiService.renameService).toHaveBeenCalledWith(
        serviceId,
        newName,
      );

      consoleLogSpy.mockRestore();
    });

    it('should show error when no arguments provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: New name is required',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should show error when only one parameter and no .superjolt file', async () => {
      (projectUtils.readSuperjoltConfig as jest.Mock).mockReturnValue(null);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run(['new-name'])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: Service ID is required',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No .superjolt file found'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should validate name format', async () => {
      const serviceId = 'service-123';
      const invalidName = 'Invalid-Name-123'; // Contains uppercase

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([serviceId, invalidName])).rejects.toThrow(
        'process.exit',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Service name must start with a lowercase letter',
        ),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const serviceId = 'service-123';
      const newName = 'new-name';
      const errorMessage = 'Service not found';
      mockApiService.renameService.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([serviceId, newName])).rejects.toThrow(
        'process.exit',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
