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
  onBack?: () => void;
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

      const { data: authData, error } = await supabase.auth.signInWithPassword({
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
        // Get the user's profile to determine their role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (profileError) {
          toast({
            title: 'Error',
            description: 'Could not fetch user profile',
            variant: 'destructive'
          });
        } else if (profile) {
          toast({ title: 'Success', description: 'Logged in successfully' });
          // Call the callback with user and role
          onAuthSuccess(authData.user, profile.role);
        } else {
          toast({
            title: 'Error',
            description: 'User profile not found',
            variant: 'destructive'
          });
        }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hostel Access Hub
            </h1>
            <p className="text-gray-600 text-lg">Manage gatepass requests seamlessly</p>
          </div>

          {/* Main Card */}
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
            <CardContent className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="login" className="text-base">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-base">Create Account</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-700 font-semibold">Username or Email</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username or email"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Label className="text-gray-700 font-semibold block mb-3">Account Type</Label>
                      <Tabs value={userRole} onValueChange={(value) => setUserRole(value as 'student' | 'warden')}>
                        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
                          <TabsTrigger value="student" className="flex items-center gap-2 text-base">
                            <UserCheck className="w-5 h-5" />
                            Student
                          </TabsTrigger>
                          <TabsTrigger value="warden" className="flex items-center gap-2 text-base">
                            <Shield className="w-5 h-5" />
                            Warden
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="student" className="mt-4">
                          <form onSubmit={handleStudentSignup} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <Label htmlFor="student-username" className="text-gray-700 font-semibold">Username *</Label>
                                <Input
                                  id="student-username"
                                  placeholder="Choose a username"
                                  value={studentForm.username}
                                  onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-fullname" className="text-gray-700 font-semibold">Full Name *</Label>
                                <Input
                                  id="student-fullname"
                                  placeholder="Your full name"
                                  value={studentForm.fullName}
                                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-email" className="text-gray-700 font-semibold">Email *</Label>
                                <Input
                                  id="student-email"
                                  type="email"
                                  placeholder="your.email@college.edu"
                                  value={studentForm.email}
                                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-password" className="text-gray-700 font-semibold">Password *</Label>
                                <Input
                                  id="student-password"
                                  type="password"
                                  placeholder="Create a strong password"
                                  value={studentForm.password}
                                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-phone" className="text-gray-700 font-semibold">Phone</Label>
                                <Input
                                  id="student-phone"
                                  placeholder="Your phone number"
                                  value={studentForm.phone}
                                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-roll" className="text-gray-700 font-semibold">Roll Number *</Label>
                                <Input
                                  id="student-roll"
                                  placeholder="e.g., CSE2024001"
                                  value={studentForm.rollNumber}
                                  onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-course" className="text-gray-700 font-semibold">Course *</Label>
                                <Input
                                  id="student-course"
                                  placeholder="e.g., B.Tech"
                                  value={studentForm.course}
                                  onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-department" className="text-gray-700 font-semibold">Department *</Label>
                                <Input
                                  id="student-department"
                                  placeholder="e.g., Computer Science"
                                  value={studentForm.department}
                                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-year" className="text-gray-700 font-semibold">Year of Study *</Label>
                                <Select
                                  value={studentForm.yearOfStudy.toString()}
                                  onValueChange={(value) => setStudentForm({ ...studentForm, yearOfStudy: parseInt(value) })}
                                >
                                  <SelectTrigger className="h-11">
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
                                <Label htmlFor="student-semester" className="text-gray-700 font-semibold">Semester *</Label>
                                <Select
                                  value={studentForm.semester.toString()}
                                  onValueChange={(value) => setStudentForm({ ...studentForm, semester: parseInt(value) })}
                                >
                                  <SelectTrigger className="h-11">
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
                                <Label htmlFor="student-hostel" className="text-gray-700 font-semibold">Hostel Name *</Label>
                                <Input
                                  id="student-hostel"
                                  placeholder="e.g., Hostel A"
                                  value={studentForm.hostelName}
                                  onChange={(e) => setStudentForm({ ...studentForm, hostelName: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-room" className="text-gray-700 font-semibold">Room Number *</Label>
                                <Input
                                  id="student-room"
                                  placeholder="e.g., 201"
                                  value={studentForm.roomNumber}
                                  onChange={(e) => setStudentForm({ ...studentForm, roomNumber: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-guardian" className="text-gray-700 font-semibold">Guardian Name *</Label>
                                <Input
                                  id="student-guardian"
                                  placeholder="Parent/Guardian name"
                                  value={studentForm.guardianName}
                                  onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-guardian-phone" className="text-gray-700 font-semibold">Guardian Phone *</Label>
                                <Input
                                  id="student-guardian-phone"
                                  placeholder="Guardian's phone number"
                                  value={studentForm.guardianPhone}
                                  onChange={(e) => setStudentForm({ ...studentForm, guardianPhone: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-emergency" className="text-gray-700 font-semibold">Emergency Contact *</Label>
                                <Input
                                  id="student-emergency"
                                  placeholder="Emergency contact number"
                                  value={studentForm.emergencyContact}
                                  onChange={(e) => setStudentForm({ ...studentForm, emergencyContact: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="student-blood" className="text-gray-700 font-semibold">Blood Group</Label>
                                <Select
                                  value={studentForm.bloodGroup}
                                  onValueChange={(value) => setStudentForm({ ...studentForm, bloodGroup: value })}
                                >
                                  <SelectTrigger className="h-11">
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
                              <Label htmlFor="student-address" className="text-gray-700 font-semibold">Address *</Label>
                              <Textarea
                                id="student-address"
                                placeholder="Your full residential address"
                                value={studentForm.address}
                                onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                                className="min-h-24"
                                required
                              />
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base"
                              disabled={loading}
                            >
                              {loading ? 'Creating Account...' : 'Create Student Account'}
                            </Button>
                          </form>
                        </TabsContent>

                        <TabsContent value="warden" className="mt-4">
                          <form onSubmit={handleWardenSignup} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <Label htmlFor="warden-username" className="text-gray-700 font-semibold">Username *</Label>
                                <Input
                                  id="warden-username"
                                  placeholder="Choose a username"
                                  value={wardenForm.username}
                                  onChange={(e) => setWardenForm({ ...wardenForm, username: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="warden-fullname" className="text-gray-700 font-semibold">Full Name *</Label>
                                <Input
                                  id="warden-fullname"
                                  placeholder="Your full name"
                                  value={wardenForm.fullName}
                                  onChange={(e) => setWardenForm({ ...wardenForm, fullName: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="warden-email" className="text-gray-700 font-semibold">Email *</Label>
                                <Input
                                  id="warden-email"
                                  type="email"
                                  placeholder="your.email@college.edu"
                                  value={wardenForm.email}
                                  onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="warden-password" className="text-gray-700 font-semibold">Password *</Label>
                                <Input
                                  id="warden-password"
                                  type="password"
                                  placeholder="Create a strong password"
                                  value={wardenForm.password}
                                  onChange={(e) => setWardenForm({ ...wardenForm, password: e.target.value })}
                                  className="h-11"
                                  required
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="warden-phone" className="text-gray-700 font-semibold">Phone</Label>
                                <Input
                                  id="warden-phone"
                                  placeholder="Your phone number"
                                  value={wardenForm.phone}
                                  onChange={(e) => setWardenForm({ ...wardenForm, phone: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base"
                              disabled={loading}
                            >
                              {loading ? 'Creating Account...' : 'Create Warden Account'}
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
    </div>
  );
};

export default Auth;