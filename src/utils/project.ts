import * as fs from 'fs';
import * as path from 'path';

export interface SuperjoltConfig {
  serviceId: string;
}

export function findProjectRoot(
  startPath: string = process.cwd(),
): string | null {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  while (currentPath !== root) {
    // Check for .superjolt file first (highest priority)
    if (fs.existsSync(path.join(currentPath, '.superjolt'))) {
      return currentPath;
    }

    // Check for package.json (Node.js project)
    if (fs.existsSync(path.join(currentPath, 'package.json'))) {
      return currentPath;
    }

    // Check for .git directory (git repository)
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }

    // Move up one directory
    currentPath = path.dirname(currentPath);
  }

  return null;
}

export function readSuperjoltConfig(
  projectRoot?: string,
): SuperjoltConfig | null {
  const root = projectRoot || findProjectRoot();
  if (!root) {
    return null;
  }

  const configPath = path.join(root, '.superjolt');
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Validate the config has at least serviceId
    if (!config.serviceId) {
      console.error('Invalid .superjolt file: missing serviceId');
      return null;
    }

    return config as SuperjoltConfig;
  } catch (error) {
    console.error('Error reading .superjolt file:', error.message);
    return null;
  }
}

export function writeSuperjoltConfig(
  config: SuperjoltConfig,
  projectRoot?: string,
): void {
  const root = projectRoot || findProjectRoot() || process.cwd();
  const configPath = path.join(root, '.superjolt');

  try {
    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, content + '\n', 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write .superjolt file: ${error.message}`);
  }
}

export function deleteSuperjoltConfig(projectRoot?: string): boolean {
  const root = projectRoot || findProjectRoot();
  if (!root) {
    return false;
  }

  const configPath = path.join(root, '.superjolt');
  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    fs.unlinkSync(configPath);
    return true;
  } catch (error) {
    console.error('Error deleting .superjolt file:', error.message);
    return false;
  }
}

export function readPackageJson(
  projectRoot?: string,
): { name?: string } | null {
  const root = projectRoot || findProjectRoot();
  if (!root) {
    return null;
  }

  const packageJsonPath = path.join(root, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg;
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    return null;
  }
}
