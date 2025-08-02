import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCommand } from '../../src/commands/update.command';
import { UpdateService } from '../../src/services/update.service';
import { LoggerService } from '../../src/services/logger.service';

describe('UpdateCommand', () => {
  let command: UpdateCommand;
  let mockUpdateService: {
    checkForUpdates: jest.Mock;
    manualUpdate: jest.Mock;
  };

  beforeEach(async () => {
    mockUpdateService = {
      checkForUpdates: jest.fn(),
      manualUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCommand,
        {
          provide: UpdateService,
          useValue: mockUpdateService,
        },
        LoggerService,
      ],
    }).compile();

    command = module.get<UpdateCommand>(UpdateCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('run', () => {
    it('should call manualUpdate when no options are provided', async () => {
      await command.run([], {});

      expect(mockUpdateService.manualUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdateService.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should call checkForUpdates with true when --check option is provided', async () => {
      await command.run([], { check: true });

      expect(mockUpdateService.checkForUpdates).toHaveBeenCalledWith(true);
      expect(mockUpdateService.checkForUpdates).toHaveBeenCalledTimes(1);
      expect(mockUpdateService.manualUpdate).not.toHaveBeenCalled();
    });

    it('should handle errors from manualUpdate', async () => {
      const errorMessage = 'Update failed';
      mockUpdateService.manualUpdate.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([], {})).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle errors from checkForUpdates', async () => {
      const errorMessage = 'Check failed';
      mockUpdateService.checkForUpdates.mockRejectedValue(
        new Error(errorMessage),
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run([], { check: true })).rejects.toThrow(
        'process.exit',
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe('parseCheck', () => {
    it('should return true', () => {
      const result = command.parseCheck();
      expect(result).toBe(true);
    });
  });
});
