// A routine's token at rest (CT-10): AES-256-GCM under a key derived with HKDF-SHA256 from ROUTINE_TOKEN_SECRET,
// stored as `v1.<iv>.<tag>.<ciphertext>` (base64url). Only the server opens it, right before a fire; the browser, the
// logs, MCP and the CLI only ever see the last four characters. No @softure-ai package encrypts a secret at rest yet
// (filed in SOFTURE/AI), so this stays one small file.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/** The environment variable that keys the encryption: at least 32 characters, e.g. `openssl rand -base64 32`. */
export const TOKEN_SECRET_ENV = "ROUTINE_TOKEN_SECRET";
export const MIN_SECRET_LENGTH = 32;

const VERSION = "v1";
const HKDF_INFO = "cockpit.routine-token.v1";
const IV_BYTES = 12;

export interface TokenBox {
  seal(token: string): string;
  /** The token, or null when the sealed text was not made with this secret or was changed. */
  open(sealed: string): string | null;
}

/** The secret from the environment, or null when it is missing or too short to key anything. */
export function getTokenSecret(env: Readonly<Record<string, string | undefined>>): string | null {
  const secret = env[TOKEN_SECRET_ENV]?.trim() ?? "";
  return secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

function deriveKey(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", Buffer.from(secret, "utf8"), Buffer.alloc(0), Buffer.from(HKDF_INFO, "utf8"), 32));
}

export function createTokenBox(secret: string): TokenBox {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`createTokenBox: the secret must be at least ${String(MIN_SECRET_LENGTH)} characters`);
  }
  const key = deriveKey(secret);
  return {
    seal: (token) => {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
      return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
    },
    open: (sealed) => {
      const [version, iv, tag, ciphertext] = sealed.split(".");
      if (version !== VERSION || iv === undefined || tag === undefined || ciphertext === undefined) {
        return null;
      }
      try {
        const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
        decipher.setAuthTag(Buffer.from(tag, "base64url"));
        return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
      } catch {
        // A wrong key or a changed text fails the authentication tag: the token cannot be opened.
        return null;
      }
    },
  };
}

/** What may be shown of a token: its last four characters. */
export function getTokenLast4(token: string): string {
  return token.slice(-4);
}
