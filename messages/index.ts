import { formatMessage, type Locale } from "@softure-ai/core";
import { en, type AppMessages } from "./en.ts";
import { pl } from "./pl.ts";

const DICTIONARIES: Readonly<Record<Locale, AppMessages | undefined>> = { en, pl };

export type { AppMessages };

/** The app's copy in `locale`: its own dictionary, English for a locale COCKPIT has no copy for. */
export function getMessages(locale: Locale): AppMessages {
  return DICTIONARIES[locale] ?? en;
}

/** Fills `{name}` placeholders of one message. */
export function fillMessage(message: string, values: Readonly<Record<string, string | number>>): string {
  return formatMessage(message, values);
}
