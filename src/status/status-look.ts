// How each project status looks: a distinct icon shape and a colour, always shown with its word (FR-8).
import { CircleArrowRight, CirclePause, CircleX, Hand, Moon, type LucideIcon } from "lucide-react";
import type { PaletteColor } from "@softure-ai/theme-notion";
import type { ProjectStatus } from "./project-status.ts";

export const STATUS_LOOKS: Readonly<Record<ProjectStatus, { readonly color: PaletteColor; readonly icon: LucideIcon }>> = {
  broken: { color: "red", icon: CircleX },
  waiting: { color: "orange", icon: Hand },
  stalled: { color: "yellow", icon: CirclePause },
  moving: { color: "blue", icon: CircleArrowRight },
  idle: { color: "gray", icon: Moon },
};
