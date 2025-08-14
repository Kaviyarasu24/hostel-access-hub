import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, User, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WardenDashboardProps {
  onBack: () => void;
}

interface GatepassRequest {
  id: string;
  name: string;
  rollNumber: string;
  roomNumber: string;
  reason: string;
  exitDateTime: string;
  returnDateTime: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  submittedAt: string;
}

export const WardenDashboard = ({ onBack }: WardenDashboardProps) => {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<GatepassRequest | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Mock data - in real app this would come from database
  const [requests, setRequests] = useState<GatepassRequest[]>([
    {
      id: "1",
      name: "John Doe",
      rollNumber: "CS21B001",
      roomNumber: "A-101",
      reason: "Medical appointment with family doctor for regular checkup",
      exitDateTime: "2024-01-15T10:00",
      returnDateTime: "2024-01-15T18:00",
      status: "pending",
      submittedAt: "2024-01-14T15:30",
    },
    {
      id: "2",
      name: "Jane Smith",
      rollNumber: "CS21B002",
      roomNumber: "B-205",
      reason: "Family function - cousin's wedding",
      exitDateTime: "2024-01-20T16:00",
      returnDateTime: "2024-01-21T09:00",
      status: "pending",
      submittedAt: "2024-01-18T10:15",
    },
    {
      id: "3",
      name: "Mike Johnson",
      rollNumber: "CS21B003",
      roomNumber: "C-301",
      reason: "Job interview at tech company",
      exitDateTime: "2024-01-12T09:00",
      returnDateTime: "2024-01-12T17:00",
      status: "approved",
      remarks: "Approved for career development opportunity",
      submittedAt: "2024-01-10T14:20",
    },
    {
      id: "4",
      name: "Sarah Wilson",
      rollNumber: "CS21B004",
      roomNumber: "A-150",
      reason: "Personal work",
      exitDateTime: "2024-01-08T11:00",
      returnDateTime: "2024-01-08T15:00",
      status: "rejected",
      remarks: "Insufficient reason provided. Please specify the nature of personal work.",
      submittedAt: "2024-01-07T16:45",
    },
  ]);

  const handleReview = (request: GatepassRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewDialog(true);
  };

  const handleSubmitReview = (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: action === "approve" ? "approved" : "rejected", remarks }
        : req
    ));

    toast({
      title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
      description: `Gatepass request for ${selectedRequest.name} has been ${action === "approve" ? "approved" : "rejected"}.`,
    });

    setReviewDialog(false);
    setSelectedRequest(null);
    setRemarks("");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-primary-foreground p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Warden Dashboard</h1>
              <p className="opacity-90">Review and manage gatepass requests</p>
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
                                <h3 className="font-semibold text-lg">{request.name}</h3>
                                <StatusBadge status={request.status} />
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Roll: {request.rollNumber} | Room: {request.roomNumber}</p>
                                <p>Submitted: {new Date(request.submittedAt).toLocaleString()}</p>
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
                              <span className="font-medium">Exit:</span> {new Date(request.exitDateTime).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Return:</span> {new Date(request.returnDateTime).toLocaleString()}
                            </div>
                          </div>
                          
                          {request.remarks && (
                            <div className="mt-3 p-3 bg-secondary rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium">Remarks:</span> {request.remarks}
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
              {selectedRequest && `Review request from ${selectedRequest.name} (${selectedRequest.rollNumber})`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm"><span className="font-medium">Reason:</span> {selectedRequest.reason}</p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Duration:</span> {new Date(selectedRequest.exitDateTime).toLocaleString()} 
                  to {new Date(selectedRequest.returnDateTime).toLocaleString()}
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