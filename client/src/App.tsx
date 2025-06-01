import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import ProfilePage from "@/pages/profile";
import CommunityPage from "@/pages/community";
import ActivityPage from "@/pages/activity";
import AdminPage from "@/pages/admin";
import ProjectInsightsPage from "@/pages/project-insights";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();

  // Don't render routes while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/profile">
        {user ? <ProfilePage /> : <LoginPage />}
      </Route>
      <Route path="/insights">
        {user ? <ProjectInsightsPage /> : <LoginPage />}
      </Route>
      <Route path="/community" component={CommunityPage} />
      <Route path="/activity" component={ActivityPage} />
      <Route path="/admin">
        {user?.isAdmin ? <AdminPage /> : <NotFound />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
