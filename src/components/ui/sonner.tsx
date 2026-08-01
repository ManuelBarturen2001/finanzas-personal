"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Wrapper del Toaster de sonner.
 * De momento la app usa siempre el tema claro (no se implementó dark mode
 * en la Fase 1), por eso no se integra next-themes aquí todavía.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
