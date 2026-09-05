import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentLab } from './ComponentLab';
import './App.css';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen bg-surface text-text font-ui overflow-hidden">
        <main className="flex-1 relative overflow-hidden">
          <ComponentLab />
        </main>
      </div>
    </QueryClientProvider>
  );
}
