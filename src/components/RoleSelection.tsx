import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield } from "lucide-react";

interface RoleSelectionProps {
  onRoleSelect: (role: 'student' | 'warden') => void;
  onAuthSelect: () => void;
}

export const RoleSelection = ({ onRoleSelect, onAuthSelect }: RoleSelectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-primary-foreground mb-8">
          <h1 className="text-4xl font-bold mb-2">Hostel GatePass</h1>
          <p className="text-lg opacity-90">Management System</p>
        </div>
        
        <div className="space-y-4">
          <Card className="shadow-floating transition-bounce hover:scale-105 cursor-pointer" 
                onClick={() => onRoleSelect('student')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Student Portal</CardTitle>
              <CardDescription>
                Request gatepass and track your application status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary hover:shadow-elevated" size="lg">
                Continue as Student
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-floating transition-bounce hover:scale-105 cursor-pointer"
                onClick={() => onRoleSelect('warden')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Warden Portal</CardTitle>
              <CardDescription>
                Review and manage gatepass requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary hover:shadow-elevated" size="lg">
                Continue as Warden
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="pt-6 text-center">
          <Button 
            variant="outline" 
            onClick={onAuthSelect}
            className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
          >
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};