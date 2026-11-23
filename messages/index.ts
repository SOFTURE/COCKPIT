import { formatMessage, type Locale } from "@softure-ai/core";
import { en, type AppMessages } from "./en.ts";

const DICTIONARIES: Readonly<Record<Locale, AppMessages | undefined>> = { en };

export type { AppMessages };

/** The app's copy in `locale`: English, its only language, for any locale. */
export function getMessages(locale: Locale): AppMessages {
  return DICTIONARIES[locale] ?? en;
}

/** Fills `{name}` placeholders of one message. */
export function fillMessage(message: string, values: Readonly<Record<string, string | number>>): string {
  return formatMessage(message, values);
}
