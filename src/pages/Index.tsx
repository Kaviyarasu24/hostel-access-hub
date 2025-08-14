import { useState } from 'react';
import { RoleSelection } from '@/components/RoleSelection';
import { StudentDashboard } from '@/components/StudentDashboard';
import { WardenDashboard } from '@/components/WardenDashboard';

type UserRole = 'student' | 'warden' | null;

const Index = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);

  if (userRole === 'student') {
    return <StudentDashboard onBack={() => setUserRole(null)} />;
  }

  if (userRole === 'warden') {
    return <WardenDashboard onBack={() => setUserRole(null)} />;
  }

  return <RoleSelection onRoleSelect={setUserRole} />;
};

export default Index;
