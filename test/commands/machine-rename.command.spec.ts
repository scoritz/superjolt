import { Test, TestingModule } from '@nestjs/testing';
import { MachineRenameCommand } from '../../src/commands/machine-rename.command';
import { ApiService } from '../../src/services/api.service';
import { AuthService } from '../../src/services/auth.service';

describe('MachineRenameCommand', () => {
  let command: MachineRenameCommand;
  let mockApiService: {
    renameMachine: jest.Mock;
    getCurrentUser: jest.Mock;
  };
  let mockAuthService: {
    getToken: jest.Mock;
    performOAuthFlow: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      renameMachine: jest.fn(),
      getCurrentUser: jest.fn(),
    };

    mockAuthService = {
      getToken: jest.fn(),
      performOAuthFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachineRenameCommand,
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

    command = module.get<MachineRenameCommand>(MachineRenameCommand);

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
    it('should rename machine with provided machine ID and name', async () => {
      const machineId = 'machine-123';
      const newName = 'new-machine-name';
      mockApiService.renameMachine.mockResolvedValue({
        message: 'Machine renamed successfully',
        machineId,
        name: newName,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run([machineId, newName]);

      expect(mockApiService.renameMachine).toHaveBeenCalledWith(
        machineId,
        newName,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Renaming machine`),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Machine renamed successfully'),
      );

      consoleLogSpy.mockRestore();
    });

    it('should use default machine when only name provided', async () => {
      const defaultMachineId = 'default-machine-123';
      const newName = 'new-machine-name';

      mockApiService.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        lastUsedMachineId: defaultMachineId,
      });

      mockApiService.renameMachine.mockResolvedValue({
        message: 'Machine renamed successfully',
        machineId: defaultMachineId,
        name: newName,
      });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run([newName]);

      expect(mockApiService.getCurrentUser).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Using default machine: ${defaultMachineId}`,
      );
      expect(mockApiService.renameMachine).toHaveBeenCalledWith(
        defaultMachineId,
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
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Usage: superjolt machine:rename <machineId> <newName>',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '   or: superjolt machine:rename <newName> (uses default machine)',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should show error when no default machine exists', async () => {
      mockApiService.getCurrentUser.mockResolvedValue({
        id: 'user-123',
        lastUsedMachineId: null,
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run(['new-name'])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: No default machine found',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Create a machine first with: superjolt machine:create',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should validate name format', async () => {
      const machineId = 'machine-123';
      const invalidName = 'Invalid-Name-123'; // Contains uppercase

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([machineId, invalidName])).rejects.toThrow(
        'process.exit',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Machine name must start with a lowercase letter',
        ),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const machineId = 'machine-123';
      const newName = 'new-name';
      const errorMessage = 'Machine not found';
      mockApiService.renameMachine.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([machineId, newName])).rejects.toThrow(
        'process.exit',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
