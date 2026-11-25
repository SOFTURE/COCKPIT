// The shown tab of a screen with tabs (CT-21): the requested key when it is one of the screen's tabs, otherwise the
// screen's fallback; and each tab's link, which keeps the shown tab in the address.

export function pickTab<Key extends string>(keys: readonly Key[], requested: string | undefined, fallback: Key): Key {
  return keys.find((key) => key === requested) ?? fallback;
}

export function tabHref(basePath: string, key: string, param = "tab"): string {
  return `${basePath}?${param}=${encodeURIComponent(key)}`;
}
