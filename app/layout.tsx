import { ThemeScript } from "@softure-ai/ui";
import { TooltipProvider } from "@softure-ai/theme-notion";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getMessages } from "../messages/index.ts";
import config from "../softure.config.ts";
import "./globals.css";

const messages = getMessages(config.locale);

export const metadata: Metadata = {
  title: messages.meta.title,
  description: messages.meta.description,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang={config.locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
