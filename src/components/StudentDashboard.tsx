import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentDashboardProps {
  onBack: () => void;
}

interface GatepassRequest {
  id: string;
  from_date_time: string;
  to_date_time: string;
  place: string;
  contact_number: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  warden_remarks?: string;
  created_at: string;
}

interface StudentProfile {
  full_name: string;
  roll_number: string;
  room_number: string;
}

export const StudentDashboard = ({ onBack }: StudentDashboardProps) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [formData, setFormData] = useState({
    place: "",
    contactNumber: "",
    reason: "",
    fromDateTime: "",
    toDateTime: "",
  });
  const [requests, setRequests] = useState<GatepassRequest[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: studentData, error: studentError } = await supabase
        .from('student_details')
        .select('roll_number, room_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || studentError) {
        console.error('Error fetching profile:', profileError || studentError);
        return;
      }

      if (profileData && studentData) {
        setProfile({
          full_name: profileData.full_name,
          roll_number: studentData.roll_number,
          room_number: studentData.room_number,
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('gatepass_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }

      setRequests((data as GatepassRequest[]) || []);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('gatepass_requests')
        .insert({
          user_id: user.id,
          from_date_time: formData.fromDateTime,
          to_date_time: formData.toDateTime,
          place: formData.place,
          contact_number: formData.contactNumber,
          reason: formData.reason,
        });

      if (error) {
        console.error('Error submitting request:', error);
        toast({
          title: "Error",
          description: "Failed to submit request. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setFormData({
        place: "",
        contactNumber: "",
        reason: "",
        fromDateTime: "",
        toDateTime: "",
      });
      setShowForm(false);
      fetchRequests();
      
      toast({
        title: "Gatepass Request Submitted",
        description: "Your request has been submitted and is pending approval.",
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-5 h-5 text-accent" />;
      case "rejected": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-primary-foreground p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="opacity-90">{profile?.full_name} - {profile?.roll_number}</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {showForm && (
          <Card className="mb-6 shadow-card">
            <CardHeader>
              <CardTitle>New Gatepass Request</CardTitle>
              <CardDescription>Fill in your details to request a gatepass</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="place">Place</Label>
                    <Input
                      id="place"
                      value={formData.place}
                      onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                      placeholder="Where are you going?"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="Your contact number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromDateTime">From Date & Time</Label>
                    <Input
                      id="fromDateTime"
                      type="datetime-local"
                      value={formData.fromDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, fromDateTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDateTime">To Date & Time</Label>
                    <Input
                      id="toDateTime"
                      type="datetime-local"
                      value={formData.toDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, toDateTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Please provide a detailed reason for your gatepass..."
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="bg-gradient-primary">
                    Submit Request
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Requests</h2>
          {requests.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No gatepass requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="shadow-card hover:shadow-elevated transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <h3 className="font-semibold">{request.place}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  
                  <div className="mb-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm"><span className="font-medium">Reason:</span> {request.reason}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">From:</span> {new Date(request.from_date_time).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {new Date(request.to_date_time).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {request.contact_number}
                    </div>
                  </div>
                  
                  {request.warden_remarks && (
                    <div className="mt-4 p-3 bg-secondary rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">Warden Remarks:</span> {request.warden_remarks}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};