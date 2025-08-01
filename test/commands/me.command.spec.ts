import { Test, TestingModule } from '@nestjs/testing';
import { MeCommand } from '../../src/commands/me.command';
import { ApiService } from '../../src/services/api.service';
import { AuthService } from '../../src/services/auth.service';
import * as tableUtils from '../../src/utils/table.utils';
import { LoggerService } from '../../src/services/logger.service';

jest.mock('../../src/utils/table.utils');

describe('MeCommand', () => {
  let command: MeCommand;
  let mockApiService: {
    getCurrentUser: jest.Mock;
  };
  let mockAuthService: {
    getToken: jest.Mock;
    performOAuthFlow: jest.Mock;
  };
  let mockTable: {
    push: jest.Mock;
    toString: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      getCurrentUser: jest.fn(),
    };

    mockAuthService = {
      getToken: jest.fn(),
      performOAuthFlow: jest.fn(),
    };

    mockTable = {
      push: jest.fn(),
      toString: jest.fn().mockReturnValue('mocked table'),
    };

    (tableUtils.createInfoTable as jest.Mock).mockReturnValue(mockTable);
    (tableUtils.createProgressBar as jest.Mock).mockReturnValue('[===>   ]');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeCommand,
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

    command = module.get<MeCommand>(MeCommand);
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

    it('should display user information without organization', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        githubUsername: 'testuser',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockApiService.getCurrentUser.mockResolvedValue(mockUser);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(mockApiService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(tableUtils.createInfoTable).toHaveBeenCalled();

      // The first push call has two items: name and email
      expect(mockTable.push).toHaveBeenCalledTimes(4); // 1st call (name, email), github, avatar, user id

      // Check the first call had both name and email
      expect(mockTable.push).toHaveBeenNthCalledWith(
        1,
        ['Name', 'Test User'],
        ['Email', 'test@example.com'],
      );

      // Check other calls
      expect(mockTable.push).toHaveBeenCalledWith(['GitHub', '@testuser']);
      expect(mockTable.push).toHaveBeenCalledWith([
        'Avatar',
        'https://example.com/avatar.jpg',
      ]);
      expect(mockTable.push).toHaveBeenCalledWith(['User ID', 'user-123']);

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should display user and organization information', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        tenant: {
          name: 'Test Organization',
          machineCount: 3,
          maxMachines: 5,
        },
        lastUsedMachineId: 'machine-456',
      };

      mockApiService.getCurrentUser.mockResolvedValue(mockUser);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(tableUtils.createProgressBar).toHaveBeenCalledWith(3, 5, 15);
      expect(mockTable.push).toHaveBeenCalledWith([
        expect.stringContaining('Machine Usage'),
        expect.stringContaining('3/5'),
      ]);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Last Used Machine'),
      );

      consoleLogSpy.mockRestore();
    });

    it('should show warning when machine limit is reached', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        tenant: {
          name: 'Test Organization',
          machineCount: 5,
          maxMachines: 5,
        },
      };

      mockApiService.getCurrentUser.mockResolvedValue(mockUser);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Machine limit reached'),
      );

      consoleLogSpy.mockRestore();
    });

    it('should show warning when approaching machine limit', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        tenant: {
          name: 'Test Organization',
          machineCount: 4,
          maxMachines: 5,
        },
      };

      mockApiService.getCurrentUser.mockResolvedValue(mockUser);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Approaching machine limit'),
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockApiService.getCurrentUser.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });

      await expect(command.run()).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(`\n${errorMessage}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should handle minimal user data', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockApiService.getCurrentUser.mockResolvedValue(mockUser);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.run();

      expect(mockTable.push).toHaveBeenCalledTimes(2); // 1st call (name, email), 2nd call (user id)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quick actions'),
      );

      consoleLogSpy.mockRestore();
    });
  });
});
