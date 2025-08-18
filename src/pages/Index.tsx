import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { StudentDashboard } from '@/components/StudentDashboard';
import { WardenDashboard } from '@/components/WardenDashboard';
import { Auth } from '@/pages/Auth';

type UserRole = 'student' | 'warden' | null;

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
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
      console.log('Fetching profile for user:', userId);
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

      console.log('Profile data:', profile);
      if (profile) {
        console.log('Setting user role to:', profile.role);
        setUserRole(profile.role);
      } else {
        console.log('No profile found for user');
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  console.log('Current state:', { user: !!user, userRole, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  // Show dashboards if user is authenticated and has a role
  if (user && userRole === 'student') {
    console.log('Rendering StudentDashboard');
    return <StudentDashboard onBack={handleLogout} />;
  }

  if (user && userRole === 'warden') {
    console.log('Rendering WardenDashboard');
    return <WardenDashboard onBack={handleLogout} />;
  }

  console.log('Rendering Auth page');
  // Show auth page as landing page
  return <Auth onAuthSuccess={handleAuthSuccess} />;
};

export default Index;
