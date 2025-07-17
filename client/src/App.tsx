import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Calculator from "@/pages/calculator";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { setupOnlineOfflineHandlers, handleInstallClick, isOnline } from "@/lib/pwa";
import { Button } from "@/components/ui/button";
import { Download, Wifi, WifiOff } from "lucide-react";

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
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline());

  useEffect(() => {
    // Setup PWA features
    setupOnlineOfflineHandlers();
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setShowInstallButton(true);
    });

    // Listen for online/offline events
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="athletics-calculator-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          
          {/* PWA Status Bar */}
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-2 bg-black/90 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 text-xs ${isOnlineStatus ? 'text-green-400' : 'text-red-400'}`}>
                {isOnlineStatus ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnlineStatus ? 'Online' : 'Offline'}
              </div>
            </div>
            
            {showInstallButton && (
              <Button
                size="sm"
                onClick={() => {
                  handleInstallClick();
                  setShowInstallButton(false);
                }}
                className="glass-button bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-blue-400/30 text-xs px-2 py-1 h-6"
              >
                <Download className="h-3 w-3 mr-1" />
                Install App
              </Button>
            )}
          </div>

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
