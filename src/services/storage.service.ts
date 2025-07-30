import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const SERVICE_NAME = 'superjolt-cli';

interface StorageOptions {
  secure?: boolean; // Use keytar if available
  encrypt?: boolean; // Future: encrypt file storage
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly configDir = path.join(os.homedir(), '.config', 'superjolt');
  private keytarAvailable: boolean | null = null;
  private keytar: any = null;

  constructor() {
    // Ensure config directory exists
    this.ensureConfigDir();
  }

  private async loadKeytar(): Promise<boolean> {
    if (this.keytarAvailable !== null) {
      return this.keytarAvailable;
    }

    try {
      this.keytar = require('keytar');
      this.keytarAvailable = true;
      return true;
    } catch {
      this.keytarAvailable = false;
      return false;
    }
  }

  /**
   * Get a value from storage
   * @param key Storage key
   * @param options Storage options
   * @returns The stored value or null if not found
   */
  async get(key: string, options: StorageOptions = {}): Promise<string | null> {
    if (options.secure && (await this.loadKeytar())) {
      try {
        const value = await this.keytar.getPassword(SERVICE_NAME, key);
        if (value) return value;
      } catch (error) {
        this.logger.debug(`Failed to get secure value for ${key}:`, error);
      }
    }

    // Fallback to file storage
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      try {
        return fs.readFileSync(filePath, 'utf-8').trim();
      } catch (error) {
        this.logger.debug(`Failed to read file for ${key}:`, error);
      }
    }

    return null;
  }

  /**
   * Set a value in storage
   * @param key Storage key
   * @param value Value to store
   * @param options Storage options
   */
  async set(
    key: string,
    value: string,
    options: StorageOptions = {},
  ): Promise<void> {
    if (options.secure && (await this.loadKeytar())) {
      try {
        await this.keytar.setPassword(SERVICE_NAME, key, value);

        // If keytar succeeded, remove any file fallback
        const filePath = this.getFilePath(key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return;
      } catch (error) {
        this.logger.debug(`Failed to set secure value for ${key}:`, error);
        // Fall through to file storage
      }
    }

    // Fallback to file storage
    const filePath = this.getFilePath(key);
    fs.writeFileSync(filePath, value, {
      encoding: 'utf-8',
      mode: options.secure ? 0o600 : 0o644, // Restrict permissions for secure items
    });
  }

  /**
   * Delete a value from storage
   * @param key Storage key
   * @param options Storage options
   */
  async delete(key: string, options: StorageOptions = {}): Promise<void> {
    // Try to delete from keytar if it was secure
    if (options.secure && (await this.loadKeytar())) {
      try {
        await this.keytar.deletePassword(SERVICE_NAME, key);
      } catch {
        // Ignore keytar errors
      }
    }

    // Also delete file if it exists
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Get JSON data from storage
   * @param key Storage key
   * @returns Parsed JSON or null
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.debug(`Failed to parse JSON for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set JSON data in storage
   * @param key Storage key
   * @param data Data to store
   */
  async setJson<T>(key: string, data: T): Promise<void> {
    const value = JSON.stringify(data, null, 2);
    await this.set(key, value);
  }

  /**
   * Check if a key exists in storage
   * @param key Storage key
   * @param options Storage options
   */
  async exists(key: string, options: StorageOptions = {}): Promise<boolean> {
    const value = await this.get(key, options);
    return value !== null;
  }

  /**
   * List all keys in file storage (not keytar)
   */
  listKeys(): string[] {
    if (!fs.existsSync(this.configDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(this.configDir);
      return files.filter((file) => !file.startsWith('.'));
    } catch {
      return [];
    }
  }

  /**
   * Clear all storage (use with caution!)
   */
  async clearAll(): Promise<void> {
    // Clear file storage
    if (fs.existsSync(this.configDir)) {
      const files = fs.readdirSync(this.configDir);
      for (const file of files) {
        if (!file.startsWith('.')) {
          fs.unlinkSync(path.join(this.configDir, file));
        }
      }
    }

    // Note: We don't clear keytar as we don't know all keys
    this.logger.warn('Cleared all file storage (keytar storage unchanged)');
  }

  private getFilePath(key: string): string {
    // Sanitize key to be filesystem-safe
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.configDir, safeKey);
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }
}
