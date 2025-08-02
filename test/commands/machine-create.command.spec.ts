import { Test, TestingModule } from '@nestjs/testing';
import { MachineCreateCommand } from '../../src/commands/machine-create.command';
import { ApiService } from '../../src/services/api.service';
import { AuthService } from '../../src/services/auth.service';
import { LoggerService } from '../../src/services/logger.service';

describe('MachineCreateCommand', () => {
  let command: MachineCreateCommand;
  let mockApiService: {
    createMachine: jest.Mock;
  };
  let mockAuthService: {
    getToken: jest.Mock;
    performOAuthFlow: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      createMachine: jest.fn(),
    };

    mockAuthService = {
      getToken: jest.fn(),
      performOAuthFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachineCreateCommand,
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

    command = module.get<MachineCreateCommand>(MachineCreateCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('execute', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockAuthService.getToken.mockResolvedValue('test-token');
    });

    it('should create a machine successfully', async () => {
      const mockMachine = {
        id: 'machine-123',
        name: 'test-machine',
      };

      mockApiService.createMachine.mockResolvedValue(mockMachine);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(consoleLogSpy).toHaveBeenCalledWith('Creating machine...');
      expect(mockApiService.createMachine).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '\nMachine created successfully!',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('ID: machine-123');
      expect(consoleLogSpy).toHaveBeenCalledWith('Name: test-machine');

      consoleLogSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to create machine';
      mockApiService.createMachine.mockRejectedValue(new Error(errorMessage));

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run()).rejects.toThrow('process.exit');

      expect(consoleLogSpy).toHaveBeenCalledWith('Creating machine...');
      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
