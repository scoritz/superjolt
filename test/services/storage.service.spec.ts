import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../../src/services/storage.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('fs');
jest.mock('os');

// Mock keytar to simulate it not being available
jest.mock('keytar', () => {
  throw new Error('Module not found');
});

describe('StorageService', () => {
  let service: StorageService;
  const mockConfigDir = '/mock/home/.config/superjolt';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock os.homedir
    (os.homedir as jest.Mock).mockReturnValue('/mock/home');

    // Mock fs methods
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.readFileSync as jest.Mock).mockImplementation(() => '');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return null when key does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });

    it('should return value from file storage when key exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('test-value\n');

      const result = await service.get('test-key');

      expect(result).toBe('test-value');
      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join(mockConfigDir, 'test-key'),
        'utf-8',
      );
    });
  });

  describe('set', () => {
    it('should write value to file storage', async () => {
      await service.set('test-key', 'test-value');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(mockConfigDir, 'test-key'),
        'test-value',
        { encoding: 'utf-8', mode: 0o644 },
      );
    });

    it('should use restricted permissions for secure storage', async () => {
      await service.set('test-key', 'test-value', { secure: true });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(mockConfigDir, 'test-key'),
        'test-value',
        { encoding: 'utf-8', mode: 0o600 },
      );
    });
  });

  describe('delete', () => {
    it('should delete file if it exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.delete('test-key');

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        path.join(mockConfigDir, 'test-key'),
      );
    });

    it('should not throw if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.delete('test-key')).resolves.not.toThrow();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('getJson', () => {
    it('should parse and return JSON value', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{"foo":"bar"}');

      const result = await service.getJson('test-key');

      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null for invalid JSON', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const result = await service.getJson('test-key');

      expect(result).toBeNull();
    });
  });

  describe('setJson', () => {
    it('should stringify and store JSON value', async () => {
      const data = { foo: 'bar', nested: { value: 123 } };

      await service.setJson('test-key', data);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(mockConfigDir, 'test-key'),
        JSON.stringify(data, null, 2),
        { encoding: 'utf-8', mode: 0o644 },
      );
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('value');

      const result = await service.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('listKeys', () => {
    it('should return list of non-hidden files', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'token',
        'cache',
        '.hidden',
        'update-check',
      ]);

      const result = service.listKeys();

      expect(result).toEqual(['token', 'cache', 'update-check']);
    });

    it('should return empty array when config dir does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.listKeys();

      expect(result).toEqual([]);
    });
  });
});
