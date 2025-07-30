import * as fs from 'fs';
import * as path from 'path';

export interface IgnoreConfig {
  patterns: string[];
  source: string;
}

export const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.env*',
  '**/*.log',
  '**/coverage/**',
  '**/.nyc_output/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.cache/**',
  '**/tmp/**',
  '**/temp/**',
  '**/.superjolt',
];

export function readSuperjoltIgnore(projectRoot?: string): IgnoreConfig | null {
  const ignoreFilePath = path.join(
    projectRoot || process.cwd(),
    '.superjoltignore',
  );

  try {
    if (!fs.existsSync(ignoreFilePath)) {
      return null;
    }

    const content = fs.readFileSync(ignoreFilePath, 'utf-8');
    const lines = content.split('\n');
    const patterns: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Convert .gitignore style patterns to glob patterns
      // The ignore package handles .gitignore syntax, but archiver uses glob
      // So we need to convert certain patterns
      let pattern = trimmed;

      // If pattern doesn't start with /, **, or *, add **/ to make it match anywhere
      if (
        !pattern.startsWith('/') &&
        !pattern.startsWith('**') &&
        !pattern.startsWith('*')
      ) {
        pattern = `**/${pattern}`;
      }

      // If pattern starts with /, remove it and make it relative to root
      if (pattern.startsWith('/')) {
        pattern = pattern.substring(1);
      }

      // If pattern ends with /, add ** to match everything inside
      if (pattern.endsWith('/')) {
        pattern = `${pattern}**`;
      }

      patterns.push(pattern);
    }

    return {
      patterns,
      source: ignoreFilePath,
    };
  } catch (error) {
    console.warn(
      `Warning: Failed to read .superjoltignore file at ${ignoreFilePath}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export function combineIgnorePatterns(customPatterns: string[] = []): string[] {
  // Combine default patterns with custom patterns
  // Use a Set to avoid duplicates
  const allPatterns = new Set<string>([
    ...DEFAULT_IGNORE_PATTERNS,
    ...customPatterns,
  ]);

  return Array.from(allPatterns);
}
