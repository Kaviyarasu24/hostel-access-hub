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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={onBack} 
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Logout
            </Button>
            <div className="border-l border-white/30 pl-4">
              <h1 className="text-3xl font-bold">Welcome Back, {profile?.full_name}</h1>
              <p className="text-blue-100 text-sm">Roll: {profile?.roll_number} | Room: {profile?.room_number}</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold h-12 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {showForm && (
          <Card className="mb-6 shadow-lg border-0">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-2xl text-blue-900">Submit New Gatepass Request</CardTitle>
              <CardDescription className="text-gray-600">Fill in all details to request a gatepass</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="place" className="text-gray-700 font-semibold">Destination Place *</Label>
                    <Input
                      id="place"
                      value={formData.place}
                      onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                      placeholder="Where are you going?"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactNumber" className="text-gray-700 font-semibold">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="Your contact number"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromDateTime" className="text-gray-700 font-semibold">From Date & Time *</Label>
                    <Input
                      id="fromDateTime"
                      type="datetime-local"
                      value={formData.fromDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, fromDateTime: e.target.value }))}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDateTime" className="text-gray-700 font-semibold">To Date & Time *</Label>
                    <Input
                      id="toDateTime"
                      type="datetime-local"
                      value={formData.toDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, toDateTime: e.target.value }))}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="reason" className="text-gray-700 font-semibold">Reason for Gatepass *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Provide a detailed reason for your gatepass..."
                      className="min-h-28 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-11 px-8"
                  >
                    Submit Request
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    className="h-11 px-8"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Your Gatepass Requests</h2>
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">{requests.length} Total</span>
          </div>

          {requests.length === 0 ? (
            <Card className="shadow-md border-0">
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No gatepass requests yet.</p>
                <p className="text-gray-500 text-sm">Click the "New Request" button above to submit one.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card 
                key={request.id} 
                className="shadow-md border-0 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        {getStatusIcon(request.status)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{request.place}</h3>
                        <p className="text-sm text-gray-500">
                          Submitted on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
                    <p className="text-gray-700"><span className="font-semibold text-gray-900">Reason:</span> {request.reason}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4 pb-4 border-b">
                    <div>
                      <span className="font-semibold text-gray-900">From:</span>
                      <p className="text-gray-600 mt-1">{new Date(request.from_date_time).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">To:</span>
                      <p className="text-gray-600 mt-1">{new Date(request.to_date_time).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Contact:</span>
                      <p className="text-gray-600 mt-1">{request.contact_number}</p>
                    </div>
                  </div>
                  
                  {request.warden_remarks && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">Warden Remarks:</span>
                      </p>
                      <p className="text-gray-700 mt-1">{request.warden_remarks}</p>
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