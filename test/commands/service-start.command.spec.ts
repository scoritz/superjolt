import { Test, TestingModule } from '@nestjs/testing';
import { ServiceStartCommand } from '../../src/commands/service-start.command';
import { ApiService } from '../../src/services/api.service';
import { AuthService } from '../../src/services/auth.service';
import * as projectUtils from '../../src/utils/project';

jest.mock('../../src/utils/project');

describe('ServiceStartCommand', () => {
  let command: ServiceStartCommand;
  let mockApiService: {
    startService: jest.Mock;
  };
  let mockAuthService: {
    getToken: jest.Mock;
    performOAuthFlow: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      startService: jest.fn(),
    };

    mockAuthService = {
      getToken: jest.fn(),
      performOAuthFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceStartCommand,
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

    command = module.get<ServiceStartCommand>(ServiceStartCommand);

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
    it('should start service with provided service ID', async () => {
      const serviceId = 'service-123';
      mockApiService.startService.mockResolvedValue({
        message: 'Service started successfully',
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run([serviceId]);

      expect(mockApiService.startService).toHaveBeenCalledWith(serviceId);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Starting service: ${serviceId}...`,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Service started successfully',
      );

      consoleLogSpy.mockRestore();
    });

    it('should use service ID from .superjolt file when no ID provided', async () => {
      const serviceId = 'config-service-456';
      (projectUtils.readSuperjoltConfig as jest.Mock).mockReturnValue({
        serviceId,
      });

      mockApiService.startService.mockResolvedValue({
        message: 'Service started successfully',
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run([]);

      expect(projectUtils.readSuperjoltConfig).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Using service ID from .superjolt file: ${serviceId}`,
      );
      expect(mockApiService.startService).toHaveBeenCalledWith(serviceId);

      consoleLogSpy.mockRestore();
    });

    it('should show error when no service ID and no .superjolt file', async () => {
      (projectUtils.readSuperjoltConfig as jest.Mock).mockReturnValue(null);

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
        'Error: Service ID is required',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: superjolt service:start'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const serviceId = 'service-123';
      const errorMessage = 'Service not found';
      mockApiService.startService.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([serviceId])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});