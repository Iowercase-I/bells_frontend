"use client";

import { NintondoProvider } from "nintondo-sdk/react";

export default function Providers({ children }: React.PropsWithChildren) {
  return <NintondoProvider>{children}</NintondoProvider>;
}

