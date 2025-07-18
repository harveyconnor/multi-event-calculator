import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import Calculator from "./pages/calculator";
import NotFound from "./pages/not-found";
import { useEffect } from "react";
import { setupOnlineOfflineHandlers } from "./lib/pwa";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calculator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    console.log("App component mounted");
    // Setup PWA features
    setupOnlineOfflineHandlers();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="athletics-calculator-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
