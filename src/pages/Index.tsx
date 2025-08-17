import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { RoleSelection } from '@/components/RoleSelection';
import { StudentDashboard } from '@/components/StudentDashboard';
import { WardenDashboard } from '@/components/WardenDashboard';
import { Auth } from '@/pages/Auth';

type UserRole = 'student' | 'warden' | null;
type ViewState = 'role-selection' | 'auth' | 'dashboard';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [viewState, setViewState] = useState<ViewState>('role-selection');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (profile) {
        setUserRole(profile.role);
        setViewState('dashboard');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false);
    }
  };

  const handleAuthSuccess = (user: User, role: string) => {
    setUser(user);
    setUserRole(role as UserRole);
    setViewState('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setViewState('role-selection');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-primary-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (viewState === 'auth') {
    return (
      <Auth 
        onAuthSuccess={handleAuthSuccess}
        onBack={() => setViewState('role-selection')}
      />
    );
  }

  if (viewState === 'dashboard' && userRole === 'student') {
    return <StudentDashboard onBack={handleLogout} />;
  }

  if (viewState === 'dashboard' && userRole === 'warden') {
    return <WardenDashboard onBack={handleLogout} />;
  }

  return (
    <RoleSelection 
      onRoleSelect={setUserRole} 
      onAuthSelect={() => setViewState('auth')}
    />
  );
};

export default Index;
