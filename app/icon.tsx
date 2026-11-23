// The tab and bookmark icon: the theme's primary colours behind a gauge, drawn the way every SOFTURE app draws it.
import { APP_ICON_SIZE, drawAppIcon } from "@softure-ai/theme-kit/next";
import { theme } from "@softure-ai/theme-notion";
import { Gauge } from "lucide";

export const size = APP_ICON_SIZE;
export const contentType = "image/png";

export default function Icon(): Response {
  return drawAppIcon({ theme, icon: Gauge });
}
