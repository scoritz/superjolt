import { Test, TestingModule } from '@nestjs/testing';
import { LogoutCommand } from '../../src/commands/logout.command';
import { AuthService } from '../../src/services/auth.service';

describe('LogoutCommand', () => {
  let command: LogoutCommand;
  let mockAuthService: {
    getToken: jest.Mock;
    deleteToken: jest.Mock;
  };

  beforeEach(async () => {
    mockAuthService = {
      getToken: jest.fn(),
      deleteToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutCommand,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    command = module.get<LogoutCommand>(LogoutCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('run', () => {
    it('should successfully logout when user is logged in', async () => {
      mockAuthService.getToken.mockResolvedValue('test-token');
      mockAuthService.deleteToken.mockResolvedValue(undefined);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(mockAuthService.getToken).toHaveBeenCalledTimes(1);
      expect(mockAuthService.deleteToken).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Successfully logged out from Superjolt.',
      );

      consoleLogSpy.mockRestore();
    });

    it('should show message when user is not logged in', async () => {
      mockAuthService.getToken.mockResolvedValue(null);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(mockAuthService.getToken).toHaveBeenCalledTimes(1);
      expect(mockAuthService.deleteToken).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('You are not logged in.');

      consoleLogSpy.mockRestore();
    });

    it('should handle errors during logout', async () => {
      const errorMessage = 'Failed to delete token';
      mockAuthService.getToken.mockResolvedValue('test-token');
      mockAuthService.deleteToken.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run()).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `\nError logging out: ${errorMessage}`,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle errors when checking token', async () => {
      const errorMessage = 'Failed to get token';
      mockAuthService.getToken.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run()).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `\nError logging out: ${errorMessage}`,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(mockAuthService.deleteToken).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
