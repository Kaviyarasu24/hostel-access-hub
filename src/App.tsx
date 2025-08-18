import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { StudentDashboard } from "./components/StudentDashboard";
import { WardenDashboard } from "./components/WardenDashboard";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredRole }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      setUserRole(profile?.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session || userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard onBack={() => supabase.auth.signOut()} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warden-dashboard"
            element={
              <ProtectedRoute requiredRole="warden">
                <WardenDashboard onBack={() => supabase.auth.signOut()} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
