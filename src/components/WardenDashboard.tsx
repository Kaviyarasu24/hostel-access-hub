import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, User, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WardenDashboardProps {
  onBack: () => void;
}

interface GatepassRequest {
  id: string;
  user_id: string;
  from_date_time: string;
  to_date_time: string;
  place: string;
  contact_number: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  warden_remarks?: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  student_details?: {
    roll_number: string;
    room_number: string;
  };
}

export const WardenDashboard = ({ onBack }: WardenDashboardProps) => {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<GatepassRequest | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<GatepassRequest[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    fetchRequests();
    fetchTotalStudents();
  }, []);

  const fetchTotalStudents = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      if (error) {
        console.error('Error fetching student count:', error);
        return;
      }

      setTotalStudents(count || 0);
    } catch (error) {
      console.error('Error in fetchTotalStudents:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('gatepass_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }

      // Fetch profile and student details separately and combine
      const requestsWithDetails = await Promise.all(
        (data || []).map(async (request) => {
          const [profileResult, studentResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', request.user_id)
              .maybeSingle(),
            supabase
              .from('student_details')
              .select('roll_number, room_number')
              .eq('user_id', request.user_id)
              .maybeSingle()
          ]);

          return {
            ...request,
            status: request.status as "pending" | "approved" | "rejected",
            profiles: profileResult.data || undefined,
            student_details: studentResult.data || undefined
          } as GatepassRequest;
        })
      );

      setRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error in fetchRequests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request: GatepassRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewDialog(true);
  };

  const handleSubmitReview = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('gatepass_requests')
        .update({
          status: action === "approve" ? "approved" : "rejected",
          warden_remarks: remarks || null,
        })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('Error updating request:', error);
        toast({
          title: "Error",
          description: "Failed to update request. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `Gatepass request has been ${action === "approve" ? "approved" : "rejected"}.`,
      });

      setReviewDialog(false);
      setSelectedRequest(null);
      setRemarks("");
      fetchRequests();
    } catch (error) {
      console.error('Error in handleSubmitReview:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === "all") return true;
    return req.status === activeTab;
  });

  const getRequestCounts = () => {
    return {
      pending: requests.filter(req => req.status === "pending").length,
      approved: requests.filter(req => req.status === "approved").length,
      rejected: requests.filter(req => req.status === "rejected").length,
    };
  };

  const counts = getRequestCounts();

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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
              <h1 className="text-3xl font-bold">Warden Dashboard</h1>
              <p className="text-green-100 text-sm">Managing {totalStudents} Students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Pending Requests</p>
                  <p className="text-4xl font-bold text-gray-900">{counts.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-7 h-7 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Approved</p>
                  <p className="text-4xl font-bold text-green-600">{counts.approved}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <User className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Rejected</p>
                  <p className="text-4xl font-bold text-red-600">{counts.rejected}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <FileText className="w-7 h-7 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Requests</p>
                  <p className="text-4xl font-bold text-blue-600">{requests.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-green-50 border-b">
            <CardTitle className="text-2xl text-green-900">Gatepass Requests</CardTitle>
            <CardDescription className="text-gray-600">Review and manage all student gatepass requests</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="pending" className="text-base">Pending ({counts.pending})</TabsTrigger>
                <TabsTrigger value="approved" className="text-base">Approved ({counts.approved})</TabsTrigger>
                <TabsTrigger value="rejected" className="text-base">Rejected ({counts.rejected})</TabsTrigger>
                <TabsTrigger value="all" className="text-base">All ({requests.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                <div className="space-y-4">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No requests found in this category.</p>
                    </div>
                  ) : (
                    filteredRequests.map((request) => (
                      <Card key={request.id} className="shadow-md border-0 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-bold text-lg text-gray-900">{request.profiles?.full_name}</h3>
                                <StatusBadge status={request.status} />
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-semibold">Roll:</span> {request.student_details?.roll_number} | <span className="font-semibold">Room:</span> {request.student_details?.room_number}</p>
                                <p><span className="font-semibold">Submitted:</span> {new Date(request.created_at).toLocaleString()}</p>
                                <p><span className="font-semibold">Place:</span> {request.place} | <span className="font-semibold">Contact:</span> {request.contact_number}</p>
                              </div>
                            </div>
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                                  onClick={() => handleReview(request, "approve")}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                                  onClick={() => handleReview(request, "reject")}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-green-500">
                            <p className="text-gray-700"><span className="font-semibold text-gray-900">Reason:</span> {request.reason}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-gray-900">From:</span>
                              <p className="text-gray-600 mt-1">{new Date(request.from_date_time).toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">To:</span>
                              <p className="text-gray-600 mt-1">{new Date(request.to_date_time).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {request.warden_remarks && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm font-semibold text-gray-900">Your Remarks:</p>
                              <p className="text-gray-700 mt-1">{request.warden_remarks}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Review Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && `From: ${selectedRequest.profiles?.full_name} (${selectedRequest.student_details?.roll_number})`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Destination:</p>
                  <p className="text-gray-900">{selectedRequest.place}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Contact:</p>
                  <p className="text-gray-900">{selectedRequest.contact_number}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Reason:</p>
                  <p className="text-gray-900">{selectedRequest.reason}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Duration:</p>
                  <p className="text-gray-900">{new Date(selectedRequest.from_date_time).toLocaleString()} to {new Date(selectedRequest.to_date_time).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="remarks" className="text-gray-700 font-semibold">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add conditions or feedback..."
                  className="mt-2 min-h-24 border-gray-300"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setReviewDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={() => handleSubmitReview("approve")}
            >
              Approve
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={() => handleSubmitReview("reject")}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};