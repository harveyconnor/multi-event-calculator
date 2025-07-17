import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Calculator from "@/pages/calculator";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { setupOnlineOfflineHandlers, handleInstallClick } from "@/lib/pwa";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calculator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Setup PWA features
    setupOnlineOfflineHandlers();
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setShowInstallButton(true);
    });
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="athletics-calculator-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          
          {/* PWA Install Button */}
          {showInstallButton && (
            <div className="fixed top-4 right-4 z-50">
              <Button
                size="sm"
                onClick={() => {
                  handleInstallClick();
                  setShowInstallButton(false);
                }}
                className="glass-button bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-blue-400/30 text-xs px-3 py-2"
              >
                <Download className="h-3 w-3 mr-1" />
                Install App
              </Button>
            </div>
          )}

          {/* Main Content with top padding for status bar */}
          <div className="pt-10">
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
