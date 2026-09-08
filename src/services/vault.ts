import { getDb } from "../db/client.ts";

export interface VaultMetadata {
  hash: string;
  key_name: string;
  created_at: number;
}

export interface VaultStoreResult {
  hash: string;
  key_name: string;
  recoveryKey?: string; // Only returned on first store
  created_at: number;
}

export class VaultService {
  private static ITERATIONS = 100000;

  // Utility: array buffer to hex string
  private static buf2hex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Utility: hex string to Uint8Array
  private static hex2buf(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  // Derive AES-GCM key from passphrase and salt using PBKDF2
  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as any,
        iterations: this.ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Store a secret in the zero-knowledge vault
   */
  static async storeSecret(
    userId: string,
    keyName: string,
    plaintextSecret: string,
    passphrase: string
  ): Promise<VaultStoreResult> {
    const db = getDb();
    const cleanKeyName = keyName.trim();
    if (!cleanKeyName) throw new Error("key_name cannot be empty");
    if (!passphrase) throw new Error("Passphrase is required for vault encryption");

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await this.deriveKey(passphrase, salt);

    const enc = new TextEncoder();
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as any, tagLength: 128 },
      aesKey,
      enc.encode(plaintextSecret)
    );

    // In WebCrypto AES-GCM, the auth tag is appended to the ciphertext (last 16 bytes)
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
    const authTagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

    const ciphertextHex = this.buf2hex(ciphertextBytes);
    const authTagHex = this.buf2hex(authTagBytes);
    const ivHex = this.buf2hex(iv);
    const saltHex = this.buf2hex(salt);

    const now = Math.floor(Date.now() / 1000);
    // Hash identifier for this vault record
    const hashData = new TextEncoder().encode(`${userId}:${cleanKeyName}:${now}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", hashData);
    const hash = this.buf2hex(hashBuffer);

    // Check if recovery key already exists for this user
    let recoveryKey: string | undefined;
    const existingRec = await db.execute({
      sql: "SELECT user_id FROM vault_recovery WHERE user_id = ? LIMIT 1;",
      args: [userId],
    });

    if (existingRec.rows.length === 0) {
      // First vault store: generate one-time recovery key
      const recoveryBytes = crypto.getRandomValues(new Uint8Array(32));
      recoveryKey = this.buf2hex(recoveryBytes);

      const recoverySalt = crypto.getRandomValues(new Uint8Array(16));
      const recoveryDeriveKey = await this.deriveKey(recoveryKey, recoverySalt);
      const exportedMaster = await crypto.subtle.exportKey("raw", aesKey);
      const wrapped = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: new Uint8Array(12) as any, tagLength: 128 },
        recoveryDeriveKey,
        exportedMaster
      );

      await db.execute({
        sql: "INSERT INTO vault_recovery (user_id, wrapped_master_key, recovery_salt, created_at) VALUES (?, ?, ?, ?);",
        args: [userId, this.buf2hex(wrapped), this.buf2hex(recoverySalt), now],
      });
    }

    // Upsert into vault_entries
    await db.execute({
      sql: `
        INSERT INTO vault_entries (hash, user_id, key_name, ciphertext, iv, salt, auth_tag, kdf, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pbkdf2', ?)
        ON CONFLICT(user_id, key_name) DO UPDATE SET
          ciphertext=excluded.ciphertext,
          iv=excluded.iv,
          salt=excluded.salt,
          auth_tag=excluded.auth_tag,
          created_at=excluded.created_at;
      `,
      args: [hash, userId, cleanKeyName, ciphertextHex, ivHex, saltHex, authTagHex, now],
    });

    return { hash, key_name: cleanKeyName, recoveryKey, created_at: now };
  }

  /**
   * Retrieve and decrypt a secret in RAM on-the-fly
   */
  static async retrieveSecret(
    userId: string,
    keyName: string,
    passphrase: string
  ): Promise<string> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM vault_entries WHERE user_id = ? AND key_name = ? LIMIT 1;",
      args: [userId, keyName.trim()],
    });

    if (res.rows.length === 0) {
      throw new Error(`Vault entry '${keyName}' not found`);
    }

    const row = res.rows[0];
    const salt = this.hex2buf(row.salt as string);
    const iv = this.hex2buf(row.iv as string);
    const ciphertext = this.hex2buf(row.ciphertext as string);
    const authTag = this.hex2buf(row.auth_tag as string);

    // Combine ciphertext + authTag for AES-GCM decryption
    const fullCipher = new Uint8Array(ciphertext.length + authTag.length);
    fullCipher.set(ciphertext);
    fullCipher.set(authTag, ciphertext.length);

    try {
      const aesKey = await this.deriveKey(passphrase, salt);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as any, tagLength: 128 },
        aesKey,
        fullCipher as any
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (_err) {
      throw new Error("Vault decryption failed: Invalid passphrase or corrupted secret");
    }
  }

  /**
   * List vault keys for user (zero plaintext)
   */
  static async listKeys(userId: string): Promise<VaultMetadata[]> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT hash, key_name, created_at FROM vault_entries WHERE user_id = ? ORDER BY created_at DESC;",
      args: [userId],
    });

    return res.rows.map((r) => ({
      hash: r.hash as string,
      key_name: r.key_name as string,
      created_at: Number(r.created_at),
    }));
  }

  /**
   * Delete vault entry
   */
  static async deleteSecret(userId: string, keyName: string): Promise<boolean> {
    const db = getDb();
    const res = await db.execute({
      sql: "DELETE FROM vault_entries WHERE user_id = ? AND key_name = ?;",
      args: [userId, keyName.trim()],
    });
    return res.rowsAffected > 0;
  }
}
