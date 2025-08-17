import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserCheck, Shield } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: User, role: string) => void;
  onBack: () => void;
}

interface StudentFormData {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  rollNumber: string;
  course: string;
  department: string;
  yearOfStudy: number;
  semester: number;
  hostelName: string;
  roomNumber: string;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  bloodGroup: string;
  address: string;
}

interface WardenFormData {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export const Auth = ({ onAuthSuccess, onBack }: AuthProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [userRole, setUserRole] = useState<'student' | 'warden'>('student');
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  const [studentForm, setStudentForm] = useState<StudentFormData>({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    rollNumber: '',
    course: '',
    department: '',
    yearOfStudy: 1,
    semester: 1,
    hostelName: '',
    roomNumber: '',
    guardianName: '',
    guardianPhone: '',
    emergencyContact: '',
    bloodGroup: '',
    address: ''
  });

  const [wardenForm, setWardenForm] = useState<WardenFormData>({
    username: '',
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            ensureProfileAndDetails(session.user).then(() => {
              fetchUserProfile(session.user.id);
            });
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const ensureProfileAndDetails = async (currentUser: User) => {
    try {
      const md: any = (currentUser as any).user_metadata || {};
      const { data: existingProfile, error: profileSelectError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (profileSelectError) {
        console.error('Profile select error:', profileSelectError);
        return;
      }

      if (!existingProfile) {
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            user_id: currentUser.id,
            role: (md.role || 'student'),
            username: md.username || '',
            full_name: md.full_name || '',
            email: currentUser.email || md.email || '',
            phone: md.phone || null,
          });

        if (profileInsertError) {
          console.error('Profile insert error:', profileInsertError);
          toast({ title: 'Error', description: 'Failed to create profile', variant: 'destructive' });
          return;
        }
      }

      const roleToUse = (existingProfile?.role as string) || (md.role as string) || 'student';
      if (roleToUse === 'student') {
        const { data: existingDetails, error: detailsSelectError } = await supabase
          .from('student_details')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (detailsSelectError) {
          console.error('Student details select error:', detailsSelectError);
          return;
        }

        if (!existingDetails) {
          const { error: detailsInsertError } = await supabase
            .from('student_details')
            .insert({
              user_id: currentUser.id,
              roll_number: md.roll_number || '',
              course: md.course || '',
              department: md.department || '',
              year_of_study: md.year_of_study ? parseInt(md.year_of_study) : 1,
              semester: md.semester ? parseInt(md.semester) : 1,
              hostel_name: md.hostel_name || '',
              room_number: md.room_number || '',
              guardian_name: md.guardian_name || '',
              guardian_phone: md.guardian_phone || '',
              emergency_contact: md.emergency_contact || '',
              blood_group: md.blood_group || '',
              address: md.address || '',
            });

          if (detailsInsertError) {
            console.error('Student details insert error:', detailsInsertError);
          }
        }
      }
    } catch (e) {
      console.error('ensureProfileAndDetails error:', e);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      // Add retry logic with exponential backoff for profile creation timing
      let retries = 3;
      let profile = null;
      
      while (retries > 0 && !profile) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          profile = data;
          break;
        }

        // Wait before retrying (100ms, 200ms, 400ms)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
        retries--;
      }

      if (profile) {
        onAuthSuccess(user!, profile.role);
      } else {
        console.error('Profile not found after retries');
        toast({
          title: "Error",
          description: "Profile not found. Please try logging in again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const identifier = loginForm.username.trim();
      let emailToUse: string | null = null;

      if (identifier.includes('@')) {
        // User entered an email directly
        emailToUse = identifier;
      } else {
        // Try to find email by username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .maybeSingle();

        if (!profileError && profile) {
          emailToUse = profile.email;
        }
      }

      if (!emailToUse) {
        // Fall back to trying the identifier as email
        emailToUse = identifier;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: loginForm.password
      });

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Success', description: 'Logged in successfully' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    }

    setLoading(false);
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: studentForm.email,
        password: studentForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: 'student',
            username: studentForm.username,
            full_name: studentForm.fullName,
            phone: studentForm.phone,
            roll_number: studentForm.rollNumber,
            course: studentForm.course,
            department: studentForm.department,
            year_of_study: String(studentForm.yearOfStudy),
            semester: String(studentForm.semester),
            hostel_name: studentForm.hostelName,
            room_number: studentForm.roomNumber,
            guardian_name: studentForm.guardianName,
            guardian_phone: studentForm.guardianPhone,
            emergency_contact: studentForm.emergencyContact,
            blood_group: studentForm.bloodGroup,
            address: studentForm.address,
            email: studentForm.email,
          }
        }
      });

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Account created. Please check your email to verify, then log in."
        });
        setActiveTab('login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleWardenSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: wardenForm.email,
        password: wardenForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: 'warden',
            username: wardenForm.username,
            full_name: wardenForm.fullName,
            phone: wardenForm.phone,
            email: wardenForm.email,
          }
        }
      });

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Account created. Please check your email to verify, then log in."
        });
        setActiveTab('login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Role Selection
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Hostel GatePass Manager</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4">
                  <div>
                    <Label>Account Type</Label>
                    <Tabs value={userRole} onValueChange={(value) => setUserRole(value as 'student' | 'warden')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="student" className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Student
                        </TabsTrigger>
                        <TabsTrigger value="warden" className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Warden
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="student">
                        <form onSubmit={handleStudentSignup} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="student-username">Username *</Label>
                              <Input
                                id="student-username"
                                value={studentForm.username}
                                onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-fullname">Full Name *</Label>
                              <Input
                                id="student-fullname"
                                value={studentForm.fullName}
                                onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-email">Email *</Label>
                              <Input
                                id="student-email"
                                type="email"
                                value={studentForm.email}
                                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-password">Password *</Label>
                              <Input
                                id="student-password"
                                type="password"
                                value={studentForm.password}
                                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-phone">Phone</Label>
                              <Input
                                id="student-phone"
                                value={studentForm.phone}
                                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-roll">Roll Number *</Label>
                              <Input
                                id="student-roll"
                                value={studentForm.rollNumber}
                                onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-course">Course *</Label>
                              <Input
                                id="student-course"
                                value={studentForm.course}
                                onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-department">Department *</Label>
                              <Input
                                id="student-department"
                                value={studentForm.department}
                                onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-year">Year of Study *</Label>
                              <Select
                                value={studentForm.yearOfStudy.toString()}
                                onValueChange={(value) => setStudentForm({ ...studentForm, yearOfStudy: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1st Year</SelectItem>
                                  <SelectItem value="2">2nd Year</SelectItem>
                                  <SelectItem value="3">3rd Year</SelectItem>
                                  <SelectItem value="4">4th Year</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-semester">Semester *</Label>
                              <Select
                                value={studentForm.semester.toString()}
                                onValueChange={(value) => setStudentForm({ ...studentForm, semester: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                    <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-hostel">Hostel Name *</Label>
                              <Input
                                id="student-hostel"
                                value={studentForm.hostelName}
                                onChange={(e) => setStudentForm({ ...studentForm, hostelName: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-room">Room Number *</Label>
                              <Input
                                id="student-room"
                                value={studentForm.roomNumber}
                                onChange={(e) => setStudentForm({ ...studentForm, roomNumber: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-guardian">Guardian Name *</Label>
                              <Input
                                id="student-guardian"
                                value={studentForm.guardianName}
                                onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-guardian-phone">Guardian Phone *</Label>
                              <Input
                                id="student-guardian-phone"
                                value={studentForm.guardianPhone}
                                onChange={(e) => setStudentForm({ ...studentForm, guardianPhone: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-emergency">Emergency Contact *</Label>
                              <Input
                                id="student-emergency"
                                value={studentForm.emergencyContact}
                                onChange={(e) => setStudentForm({ ...studentForm, emergencyContact: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="student-blood">Blood Group</Label>
                              <Select
                                value={studentForm.bloodGroup}
                                onValueChange={(value) => setStudentForm({ ...studentForm, bloodGroup: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent>
                                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                                    <SelectItem key={group} value={group}>{group}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="student-address">Address *</Label>
                            <Textarea
                              id="student-address"
                              value={studentForm.address}
                              onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating Student Account...' : 'Create Student Account'}
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="warden">
                        <form onSubmit={handleWardenSignup} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="warden-username">Username *</Label>
                              <Input
                                id="warden-username"
                                value={wardenForm.username}
                                onChange={(e) => setWardenForm({ ...wardenForm, username: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="warden-fullname">Full Name *</Label>
                              <Input
                                id="warden-fullname"
                                value={wardenForm.fullName}
                                onChange={(e) => setWardenForm({ ...wardenForm, fullName: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="warden-email">Email *</Label>
                              <Input
                                id="warden-email"
                                type="email"
                                value={wardenForm.email}
                                onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="warden-password">Password *</Label>
                              <Input
                                id="warden-password"
                                type="password"
                                value={wardenForm.password}
                                onChange={(e) => setWardenForm({ ...wardenForm, password: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="warden-phone">Phone</Label>
                              <Input
                                id="warden-phone"
                                value={wardenForm.phone}
                                onChange={(e) => setWardenForm({ ...wardenForm, phone: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating Warden Account...' : 'Create Warden Account'}
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};