import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '../../src/services/config.service';
import { ConfigService as NestConfigService } from '@nestjs/config';

describe('ConfigService', () => {
  let service: ConfigService;
  let mockNestConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockNestConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: NestConfigService,
          useValue: mockNestConfigService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBaseUrl', () => {
    it('should return custom base URL when SUPERJOLT_API_URL is set', () => {
      const customUrl = 'http://localhost:3000';
      mockNestConfigService.get.mockReturnValue(customUrl);

      const result = service.getBaseUrl();

      expect(result).toBe(customUrl);
      expect(mockNestConfigService.get).toHaveBeenCalledWith(
        'SUPERJOLT_API_URL',
        'https://api.superjolt.com',
      );
    });

    it('should return default base URL when SUPERJOLT_API_URL is not set', () => {
      mockNestConfigService.get.mockImplementation(
        (key, defaultValue) => defaultValue,
      );

      const result = service.getBaseUrl();

      expect(result).toBe('https://api.superjolt.com');
      expect(mockNestConfigService.get).toHaveBeenCalledWith(
        'SUPERJOLT_API_URL',
        'https://api.superjolt.com',
      );
    });
  });

  describe('getApiUrl', () => {
    it('should return CLI API URL with version prefix', () => {
      mockNestConfigService.get.mockReturnValue('http://localhost:3000');

      const result = service.getApiUrl();

      expect(result).toBe('http://localhost:3000/v1/cli');
    });

    it('should return default CLI API URL when base URL is default', () => {
      mockNestConfigService.get.mockImplementation(
        (key, defaultValue) => defaultValue,
      );

      const result = service.getApiUrl();

      expect(result).toBe('https://api.superjolt.com/v1/cli');
    });
  });

  describe('getVersionedUrl', () => {
    it('should return versioned URL for given path', () => {
      mockNestConfigService.get.mockReturnValue('http://localhost:3000');

      const result = service.getVersionedUrl('auth/github');

      expect(result).toBe('http://localhost:3000/v1/auth/github');
    });

    it('should handle paths with leading slash', () => {
      mockNestConfigService.get.mockReturnValue('http://localhost:3000');

      const result = service.getVersionedUrl('/auth/github');

      expect(result).toBe('http://localhost:3000/v1/auth/github');
    });

    it('should work with default base URL', () => {
      mockNestConfigService.get.mockImplementation(
        (key, defaultValue) => defaultValue,
      );

      const result = service.getVersionedUrl('auth/poll');

      expect(result).toBe('https://api.superjolt.com/v1/auth/poll');
    });
  });
});
