import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
          404
        </h1>

        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h2>

        <p className="text-gray-600 text-lg mb-2">
          Oops! The page you're looking for doesn't exist.
        </p>
        
        <p className="text-gray-500 text-sm mb-8">
          The requested path: <span className="font-mono text-gray-700">{location.pathname}</span>
        </p>

        {/* Return Button */}
        <a href="/">
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-11 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
