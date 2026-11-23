// The iOS home screen icon: full bleed, iOS rounds it itself.
import { APPLE_ICON_SIZE, drawAppIcon } from "@softure-ai/theme-kit/next";
import { theme } from "@softure-ai/theme-notion";
import { Gauge } from "lucide";

export const size = APPLE_ICON_SIZE;
export const contentType = "image/png";

export default function AppleIcon(): Response {
  return drawAppIcon({ theme, icon: Gauge, size: APPLE_ICON_SIZE, shape: "square" });
}
