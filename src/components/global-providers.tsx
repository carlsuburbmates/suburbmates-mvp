
'use client';

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ChatWidget } from "./chat-widget";

export function GlobalProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      {children}
      <ChatWidget />
    </FirebaseClientProvider>
  );
}
