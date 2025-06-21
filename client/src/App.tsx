// Import wouter from our compatibility layer using ESM syntax
import { Switch, Route, Redirect } from "./wouter-compat.js";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster.js";
import { TooltipProvider } from "@/components/ui/tooltip.js";
import { Sidebar } from "@/components/Sidebar.js";
import { MobileNav } from "@/components/MobileNav.js";
import Dashboard from "@/pages/dashboard.js";
import Chat from "@/pages/chat.js";
import Settings from "@/pages/settings.js";
import Health from "@/pages/health.js";
import Integrations from "@/pages/integrations.js";
import OmiIntegration from "@/pages/omi-integration.js";
import NotFound from "@/pages/not-found.js";
import Login from "@/pages/login.js";
import { AuthProvider } from "./lib/auth-context.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { useAuth } from "./lib/auth-context.js";
import { useState, useEffect } from "react";
import { OnboardingProvider } from "./components/onboarding/OnboardingProvider.js";

function Router() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  // Regular protected layout (with sidebar)
  const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative flex w-64 flex-col bg-white dark:bg-gray-800">
              <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <MobileNav onMenuClick={() => setIsSidebarOpen(true)} />
          </div>
          
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
  
  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated && !loading ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      <Route path="/dashboard">
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      </Route>
      
      <Route path="/chat">
        <ProtectedLayout>
          <Chat />
        </ProtectedLayout>
      </Route>
      
      <Route path="/chat/:conversationId">
        {(params: { conversationId: string }) => (
          <ProtectedLayout>
            <Chat key={params.conversationId} />
          </ProtectedLayout>
        )}
      </Route>
      
      <Route path="/health">
        <ProtectedLayout>
          <Health />
        </ProtectedLayout>
      </Route>
      
      <Route path="/settings">
        <ProtectedLayout>
          <Settings />
        </ProtectedLayout>
      </Route>
      
      <Route path="/integrations">
        <ProtectedLayout>
          <Integrations />
        </ProtectedLayout>
      </Route>
      
      <Route path="/omi-integration">
        <ProtectedLayout>
          <OmiIntegration />
        </ProtectedLayout>
      </Route>
      
      <Route>
        <ProtectedLayout>
          <NotFound />
        </ProtectedLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
