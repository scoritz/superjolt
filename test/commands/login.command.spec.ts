import { Test, TestingModule } from '@nestjs/testing';
import { LoginCommand } from '../../src/commands/login.command';
import { ApiService } from '../../src/services/api.service';
import { AuthService } from '../../src/services/auth.service';

describe('LoginCommand', () => {
  let command: LoginCommand;
  let mockApiService: {
    getCurrentUser: jest.Mock;
  };
  let mockAuthService: {
    getToken: jest.Mock;
    deleteToken: jest.Mock;
    performOAuthFlow: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      getCurrentUser: jest.fn(),
    };

    mockAuthService = {
      getToken: jest.fn(),
      deleteToken: jest.fn(),
      performOAuthFlow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginCommand,
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

    command = module.get<LoginCommand>(LoginCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('run', () => {
    it('should show already logged in message when token is valid', async () => {
      mockAuthService.getToken.mockResolvedValue('valid-token');
      mockApiService.getCurrentUser.mockResolvedValue({ id: 'user-123' });

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(mockAuthService.getToken).toHaveBeenCalledTimes(1);
      expect(mockApiService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockAuthService.performOAuthFlow).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ You are already logged in!',
      );

      consoleLogSpy.mockRestore();
    });

    it('should perform OAuth flow when no token exists', async () => {
      mockAuthService.getToken.mockResolvedValue(null);
      mockAuthService.performOAuthFlow.mockResolvedValue(undefined);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(mockAuthService.getToken).toHaveBeenCalledTimes(1);
      expect(mockApiService.getCurrentUser).not.toHaveBeenCalled();
      expect(mockAuthService.performOAuthFlow).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'You are now logged in to Superjolt.',
      );

      consoleLogSpy.mockRestore();
    });

    it('should perform OAuth flow when existing token is invalid', async () => {
      mockAuthService.getToken.mockResolvedValue('invalid-token');
      mockApiService.getCurrentUser.mockRejectedValue(
        new Error('Unauthorized'),
      );
      mockAuthService.performOAuthFlow.mockResolvedValue(undefined);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(mockAuthService.getToken).toHaveBeenCalledTimes(1);
      expect(mockApiService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockAuthService.deleteToken).toHaveBeenCalledTimes(1);
      expect(mockAuthService.performOAuthFlow).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'You are now logged in to Superjolt.',
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle OAuth flow errors', async () => {
      const errorMessage = 'OAuth failed';
      mockAuthService.getToken.mockResolvedValue(null);
      mockAuthService.performOAuthFlow.mockRejectedValue(
        new Error(errorMessage),
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run()).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `\n❌ Authentication failed: ${errorMessage}`,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
});
