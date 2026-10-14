import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { printBootBanner } from "./lib/debugLog";
import App from "./App";

// Initialize theme immediately to prevent flash
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('40labs_theme');
  const initialTheme = saved === 'light' || saved === 'dark' ? saved : 'dark';
  document.documentElement.setAttribute('data-theme', initialTheme);
  document.documentElement.style.colorScheme = initialTheme;
}

if (typeof window !== 'undefined') {
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
}
