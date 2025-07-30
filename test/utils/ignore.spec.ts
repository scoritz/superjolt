import * as fs from 'fs';
import * as path from 'path';
import {
  readSuperjoltIgnore,
  combineIgnorePatterns,
  DEFAULT_IGNORE_PATTERNS,
} from '../../src/utils/ignore';

jest.mock('fs');

describe('Ignore utilities', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readSuperjoltIgnore', () => {
    it('should return null when .superjoltignore does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toBeNull();
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        path.join('/test/project', '.superjoltignore'),
      );
    });

    it('should parse a simple .superjoltignore file', () => {
      const ignoreContent = `# Test ignore file
node_modules/
*.log
/dist
test/**/*.spec.js`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(ignoreContent);

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toEqual({
        patterns: [
          '**/node_modules/**',
          '*.log',
          'dist',
          '**/test/**/*.spec.js',
        ],
        source: '/test/project/.superjoltignore',
      });
    });

    it('should handle patterns without leading slash or wildcards', () => {
      const ignoreContent = `build
docs
temp`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(ignoreContent);

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toEqual({
        patterns: ['**/build', '**/docs', '**/temp'],
        source: '/test/project/.superjoltignore',
      });
    });

    it('should handle directory patterns ending with slash', () => {
      const ignoreContent = `coverage/
.cache/
tmp/`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(ignoreContent);

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toEqual({
        patterns: ['**/coverage/**', '**/.cache/**', '**/tmp/**'],
        source: '/test/project/.superjoltignore',
      });
    });

    it('should skip empty lines and comments', () => {
      const ignoreContent = `# Comment line
      
# Another comment
*.log

# More comments
test/

`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(ignoreContent);

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toEqual({
        patterns: ['*.log', '**/test/**'],
        source: '/test/project/.superjoltignore',
      });
    });

    it('should handle root-relative patterns', () => {
      const ignoreContent = `/absolute-path
/src/generated/`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(ignoreContent);

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toEqual({
        patterns: ['absolute-path', 'src/generated/**'],
        source: '/test/project/.superjoltignore',
      });
    });

    it('should handle patterns that already have wildcards', () => {
      const ignoreContent = `**/*.test.js
*.config.js
**/dist/**`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(ignoreContent);

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toEqual({
        patterns: ['**/*.test.js', '*.config.js', '**/dist/**'],
        source: '/test/project/.superjoltignore',
      });
    });

    it('should handle file read errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = readSuperjoltIgnore('/test/project');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Failed to read .superjoltignore'),
        'Permission denied',
      );

      consoleSpy.mockRestore();
    });

    it('should use current directory when no project root is provided', () => {
      const cwd = process.cwd();
      mockFs.existsSync.mockReturnValue(false);

      readSuperjoltIgnore();

      expect(mockFs.existsSync).toHaveBeenCalledWith(
        path.join(cwd, '.superjoltignore'),
      );
    });
  });

  describe('combineIgnorePatterns', () => {
    it('should return default patterns when no custom patterns provided', () => {
      const result = combineIgnorePatterns();

      expect(result).toEqual(DEFAULT_IGNORE_PATTERNS);
    });

    it('should combine default and custom patterns', () => {
      const customPatterns = ['**/*.test.js', 'docs/', 'examples/'];

      const result = combineIgnorePatterns(customPatterns);

      expect(result).toContain('**/node_modules/**');
      expect(result).toContain('**/.git/**');
      expect(result).toContain('**/*.test.js');
      expect(result).toContain('docs/');
      expect(result).toContain('examples/');
    });

    it('should remove duplicate patterns', () => {
      const customPatterns = [
        '**/node_modules/**', // duplicate
        '**/.git/**', // duplicate
        'custom-pattern',
      ];

      const result = combineIgnorePatterns(customPatterns);

      // Count occurrences of node_modules pattern
      const nodeModulesCount = result.filter(
        (p) => p === '**/node_modules/**',
      ).length;
      expect(nodeModulesCount).toBe(1);

      // Custom pattern should be included
      expect(result).toContain('custom-pattern');
    });

    it('should handle empty custom patterns array', () => {
      const result = combineIgnorePatterns([]);

      expect(result).toEqual(DEFAULT_IGNORE_PATTERNS);
    });
  });

  describe('DEFAULT_IGNORE_PATTERNS', () => {
    it('should contain essential ignore patterns', () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain('**/node_modules/**');
      expect(DEFAULT_IGNORE_PATTERNS).toContain('**/.git/**');
      expect(DEFAULT_IGNORE_PATTERNS).toContain('**/.env*');
      expect(DEFAULT_IGNORE_PATTERNS).toContain('**/*.log');
      expect(DEFAULT_IGNORE_PATTERNS).toContain('**/.superjolt');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(DEFAULT_IGNORE_PATTERNS)).toBe(true);
      expect(DEFAULT_IGNORE_PATTERNS.length).toBeGreaterThan(0);
      DEFAULT_IGNORE_PATTERNS.forEach((pattern) => {
        expect(typeof pattern).toBe('string');
      });
    });
  });
});
