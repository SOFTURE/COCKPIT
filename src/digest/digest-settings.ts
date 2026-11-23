// When and to whom the digest goes (FR-12), from the environment: notification recipients are runtime configuration,
// never committed. `DIGEST_AT` is a local time of day (`HH:MM` in `APP_TIMEZONE`), 08:00 by default; a malformed
// value stops the app at start instead of mailing at a time nobody chose. `DIGEST_RECIPIENTS` lists addresses,
// comma-separated; `MAIL_FROM` is the verified sender.
export const DEFAULT_DIGEST_AT = "08:00";

/** Used only so the configuration loads without a sender; the digest never sends while `MAIL_FROM` is unset. */
export const PLACEHOLDER_SENDER = "COCKPIT <digest@example.com>";

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface DigestSettings {
  readonly recipients: readonly string[];
}

export function getDigestAt(value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_DIGEST_AT;
  }
  const time = value.trim();
  if (!TIME_OF_DAY.test(time)) {
    throw new Error("getDigestAt: DIGEST_AT must be a local time of day as HH:MM, for example 08:00");
  }
  return time;
}

export function getDigestRecipients(value: string | undefined): string[] {
  return [...new Set((value ?? "").split(",").map((address) => address.trim()).filter((address) => address !== ""))];
}

/** The digest's settings, or null when it is not configured (no recipient or no sender): nothing is sent then. */
export function getDigestSettings(env: Readonly<Record<string, string | undefined>>): DigestSettings | null {
  const recipients = getDigestRecipients(env.DIGEST_RECIPIENTS);
  const hasSender = (env.MAIL_FROM ?? "").trim() !== "";
  return recipients.length > 0 && hasSender ? { recipients } : null;
}
