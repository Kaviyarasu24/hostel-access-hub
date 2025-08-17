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
        .select(`
          *,
          profiles!inner(full_name),
          student_details!inner(roll_number, room_number)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }

      setRequests((data as any) || []);
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
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-primary-foreground p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Warden Dashboard</h1>
              <p className="opacity-90">Total Students: {totalStudents}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{counts.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{counts.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <FileText className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{counts.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Gatepass Requests</CardTitle>
            <CardDescription>Review and manage student gatepass requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
                <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No requests found in this category.
                    </div>
                  ) : (
                    filteredRequests.map((request) => (
                      <Card key={request.id} className="hover:shadow-elevated transition-smooth">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg">{request.profiles?.full_name}</h3>
                                <StatusBadge status={request.status} />
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Roll: {request.student_details?.roll_number} | Room: {request.student_details?.room_number}</p>
                                <p>Submitted: {new Date(request.created_at).toLocaleString()}</p>
                                <p>Place: {request.place} | Contact: {request.contact_number}</p>
                              </div>
                            </div>
                            {request.status === "pending" && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  className="bg-accent hover:bg-accent/90"
                                  onClick={() => handleReview(request, "approve")}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleReview(request, "reject")}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-muted rounded-lg p-3 mb-3">
                            <p className="text-sm"><span className="font-medium">Reason:</span> {request.reason}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">From:</span> {new Date(request.from_date_time).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">To:</span> {new Date(request.to_date_time).toLocaleString()}
                            </div>
                          </div>
                          
                          {request.warden_remarks && (
                            <div className="mt-3 p-3 bg-secondary rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium">Remarks:</span> {request.warden_remarks}
                              </p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Gatepass Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Review request from ${selectedRequest.profiles?.full_name} (${selectedRequest.student_details?.roll_number})`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm"><span className="font-medium">Student:</span> {selectedRequest.profiles?.full_name}</p>
                <p className="text-sm"><span className="font-medium">Place:</span> {selectedRequest.place}</p>
                <p className="text-sm"><span className="font-medium">Contact:</span> {selectedRequest.contact_number}</p>
                <p className="text-sm"><span className="font-medium">Reason:</span> {selectedRequest.reason}</p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Duration:</span> {new Date(selectedRequest.from_date_time).toLocaleString()} 
                  to {new Date(selectedRequest.to_date_time).toLocaleString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks or conditions..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-accent hover:bg-accent/90"
              onClick={() => handleSubmitReview("approve")}
            >
              Approve
            </Button>
            <Button 
              variant="destructive"
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