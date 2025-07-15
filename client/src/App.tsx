import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import SuperAdminPortal from "@/pages/super-admin";
import SchedulesPage from "@/pages/schedules";
import RemindersPage from "@/pages/reminders";
import ProfilePage from "@/pages/profile";
import EnhancedNavigation from "@/pages/enhanced-navigation";
import AdminDashboard from "./pages/admin-dashboard";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/" component={Login} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/navigation" component={EnhancedNavigation} />
      <Route path="/schedules" component={SchedulesPage} />
      <Route path="/reminders" component={RemindersPage} />
      <Route path="/profile" component={ProfilePage} />
      {user.role === "super_admin" && (
        <Route path="/super-admin" component={SuperAdminPortal} />
      )}
      <Route path="/admin-portal" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;