#!/usr/bin/env bun

/**
 * API Key Management System for OAuth Authentication
 * Handles secure storage, retrieval, and validation of API keys
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

interface ApiKeyEntry {
  id: string;
  encryptedKey: string;
  provider: string;
  createdAt: number;
  expiresAt: number;
  userId: string;
  scope: string[];
  salt: string;
  iv: string;
}

interface ApiKeyStore {
  keys: Record<string, ApiKeyEntry>;
  version: string;
}

export class ApiKeyManager {
  private storePath: string;
  private encryptionKey: string;

  constructor(
    storePath: string = "/tmp/api-keys.json",
    encryptionKey?: string,
  ) {
    this.storePath = storePath;
    this.encryptionKey =
      encryptionKey ||
      process.env.API_KEY_ENCRYPTION_KEY ||
      this.generateEncryptionKey();
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private encrypt(
    text: string,
    salt: string,
  ): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(
      this.encryptionKey,
      salt,
      100000,
      32,
      "sha256",
    );
    const cipher = crypto.createCipher("aes-256-cbc", key);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted: encrypted,
      iv: iv.toString("hex"),
    };
  }

  private decrypt(encryptedData: string, salt: string, _iv: string): string {
    const key = crypto.pbkdf2Sync(
      this.encryptionKey,
      salt,
      100000,
      32,
      "sha256",
    );
    const decipher = crypto.createDecipher("aes-256-cbc", key);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  private loadStore(): ApiKeyStore {
    if (!fs.existsSync(this.storePath)) {
      return { keys: {}, version: "1.0.0" };
    }

    try {
      const data = fs.readFileSync(this.storePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.warn("Failed to load API key store, creating new one");
      return { keys: {}, version: "1.0.0" };
    }
  }

  private saveStore(store: ApiKeyStore): void {
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.storePath, JSON.stringify(store, null, 2));
  }

  /**
   * Store an API key securely
   */
  async storeApiKey(
    userId: string,
    provider: string,
    apiKey: string,
    scope: string[] = [],
    expiresInHours: number = 24,
  ): Promise<string> {
    const store = this.loadStore();
    const id = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString("hex");
    const { encrypted, iv } = this.encrypt(apiKey, salt);

    const entry: ApiKeyEntry = {
      id,
      encryptedKey: encrypted,
      provider,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000,
      userId,
      scope,
      salt,
      iv,
    };

    store.keys[id] = entry;
    this.saveStore(store);

    return id;
  }

  /**
   * Retrieve and decrypt an API key
   */
  async getApiKey(keyId: string, userId: string): Promise<string | null> {
    const store = this.loadStore();
    const entry = store.keys[keyId];

    if (!entry) {
      return null;
    }

    if (entry.userId !== userId) {
      throw new Error("Unauthorized access to API key");
    }

    if (Date.now() > entry.expiresAt) {
      delete store.keys[keyId];
      this.saveStore(store);
      throw new Error("API key has expired");
    }

    try {
      return this.decrypt(entry.encryptedKey, entry.salt, entry.iv);
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      return null;
    }
  }

  /**
   * Validate if an API key exists and is valid
   */
  async validateApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const key = await this.getApiKey(keyId, userId);
      return key !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all API keys for a user (without decrypting)
   */
  async listApiKeys(
    userId: string,
  ): Promise<Array<Omit<ApiKeyEntry, "encryptedKey" | "salt" | "iv">>> {
    const store = this.loadStore();
    return Object.values(store.keys)
      .filter((entry) => entry.userId === userId)
      .map(({ encryptedKey, salt, iv, ...entry }) => entry);
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    const store = this.loadStore();
    const entry = store.keys[keyId];

    if (!entry || entry.userId !== userId) {
      return false;
    }

    delete store.keys[keyId];
    this.saveStore(store);
    return true;
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const store = this.loadStore();
    const now = Date.now();
    let deletedCount = 0;

    for (const [keyId, entry] of Object.entries(store.keys)) {
      if (now > entry.expiresAt) {
        delete store.keys[keyId];
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.saveStore(store);
    }

    return deletedCount;
  }

  /**
   * Get API key statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    providerStats: Record<string, number>;
  }> {
    const store = this.loadStore();
    const now = Date.now();
    const stats = {
      totalKeys: 0,
      activeKeys: 0,
      expiredKeys: 0,
      providerStats: {} as Record<string, number>,
    };

    for (const entry of Object.values(store.keys)) {
      stats.totalKeys++;

      if (now > entry.expiresAt) {
        stats.expiredKeys++;
      } else {
        stats.activeKeys++;
      }

      stats.providerStats[entry.provider] =
        (stats.providerStats[entry.provider] || 0) + 1;
    }

    return stats;
  }
}
