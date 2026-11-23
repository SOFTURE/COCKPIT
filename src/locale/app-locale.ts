// The language COCKPIT speaks: English by default, Polish on request. A locale without its own copy reads English.
export const SUPPORTED_LOCALES = ["en", "pl"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_APP_LOCALE: AppLocale = "en";

function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** The app's locale from a setting such as `APP_LOCALE` (`pl`, `pl-PL`, `pl_PL.UTF-8`); English when unset or unknown. */
export function getAppLocale(setting: string | undefined): AppLocale {
  const language = (setting ?? "").trim().toLowerCase().split(/[-_.@]/u)[0] ?? "";
  return isAppLocale(language) ? language : DEFAULT_APP_LOCALE;
}

/** The CLI's locale: `COCKPIT_LOCALE`, else the terminal's language (`LC_ALL`, then `LANG`). */
export function getTerminalLocale(env: Readonly<Record<string, string | undefined>>): AppLocale {
  const setting = [env.COCKPIT_LOCALE, env.LC_ALL, env.LANG].find((value) => value !== undefined && value.trim() !== "");
  return getAppLocale(setting);
}
