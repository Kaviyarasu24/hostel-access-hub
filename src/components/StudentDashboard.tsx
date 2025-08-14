import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentDashboardProps {
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

export const StudentDashboard = ({ onBack }: StudentDashboardProps) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    roomNumber: "",
    reason: "",
    exitDateTime: "",
    returnDateTime: "",
  });

  // Mock data - in real app this would come from database
  const [requests, setRequests] = useState<GatepassRequest[]>([
    {
      id: "1",
      name: "John Doe",
      rollNumber: "CS21B001",
      roomNumber: "A-101",
      reason: "Medical appointment",
      exitDateTime: "2024-01-15T10:00",
      returnDateTime: "2024-01-15T18:00",
      status: "approved",
      remarks: "Approved for medical emergency",
      submittedAt: "2024-01-14T15:30",
    },
    {
      id: "2",
      name: "John Doe",
      rollNumber: "CS21B001",
      roomNumber: "A-101",
      reason: "Family function",
      exitDateTime: "2024-01-20T16:00",
      returnDateTime: "2024-01-21T09:00",
      status: "pending",
      submittedAt: "2024-01-18T10:15",
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRequest: GatepassRequest = {
      id: Date.now().toString(),
      ...formData,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    setRequests(prev => [newRequest, ...prev]);
    setFormData({
      name: "",
      rollNumber: "",
      roomNumber: "",
      reason: "",
      exitDateTime: "",
      returnDateTime: "",
    });
    setShowForm(false);
    
    toast({
      title: "Gatepass Request Submitted",
      description: "Your request has been submitted and is pending approval.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-5 h-5 text-accent" />;
      case "rejected": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-primary-foreground p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="opacity-90">Manage your gatepass requests</p>
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
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, rollNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input
                      id="roomNumber"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="exitDateTime">Exit Date & Time</Label>
                    <Input
                      id="exitDateTime"
                      type="datetime-local"
                      value={formData.exitDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, exitDateTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="returnDateTime">Return Date & Time</Label>
                    <Input
                      id="returnDateTime"
                      type="datetime-local"
                      value={formData.returnDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, returnDateTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="reason">Reason for Exit</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Please provide a detailed reason for your exit..."
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
                        <h3 className="font-semibold">{request.reason}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(request.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
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
                    <div className="mt-4 p-3 bg-muted rounded-lg">
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
      </div>
    </div>
  );
};