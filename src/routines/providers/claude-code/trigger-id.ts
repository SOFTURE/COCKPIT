// A routine's trigger id, as the owner pastes it (CT-10): the id itself (`trig_…`) or the routine's fire URL
// `https://api.anthropic.com/v1/claude_code/routines/<trigger_id>/fire`, from which the id is taken.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const FIRE_PATH = /\/v1\/claude_code\/routines\/([^/]+)\/fire\/?$/;

/** The trigger id from an id or a fire URL; null when neither reads as one. */
export function parseTriggerId(input: string): string | null {
  const text = input.trim();
  if (ID_PATTERN.test(text)) {
    return text;
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }
  const match = FIRE_PATH.exec(url.pathname);
  const id = match?.[1] === undefined ? "" : decodeURIComponent(match[1]);
  return ID_PATTERN.test(id) ? id : null;
}
