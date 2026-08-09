"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  attribute: string;
  defaultTheme: string;
  enableSystem: boolean;
}

export function ThemeProvider({
  children,
  attribute,
  defaultTheme,
  enableSystem,
}: Props) {
  return (
    <NextThemesProvider
      attribute={attribute as any}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
    >
      {children}
    </NextThemesProvider>
  );
}
