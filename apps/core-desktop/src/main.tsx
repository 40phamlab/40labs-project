import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { invoke } from "@tauri-apps/api/core";
import { printBootBanner } from "./lib/debugLog";
import App from "./App";

if (typeof window !== 'undefined') {
  if (import.meta.env.DEV) {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    const forwardToRust = (level: string, args: any[]) => {
      const msg = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      if (!msg.includes('[FRONTEND]')) {
        invoke('frontend_log', { level, msg }).catch(() => {});
      }
    };

    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      forwardToRust('debug', args);
    };
    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      forwardToRust('info', args);
    };
    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      forwardToRust('warn', args);
    };
    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      forwardToRust('error', args);
    };
    console.debug = (...args: any[]) => {
      originalConsole.debug(...args);
      forwardToRust('debug', args);
    };
  }
  printBootBanner();
}

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
