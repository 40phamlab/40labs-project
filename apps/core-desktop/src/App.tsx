import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryList } from './features/inventory/InventoryList';
import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface">
        <InventoryList />
      </div>
    </QueryClientProvider>
  );
}

export default App;
