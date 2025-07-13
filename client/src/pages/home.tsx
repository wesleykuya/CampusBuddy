import { useAuth } from "@/lib/auth";
import { NavigationHeader } from "@/components/navigation-header";
import { RealisticCampusMap } from "@/components/realistic-campus-map";
import { NotificationToast } from "@/components/notification-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Map, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 bg-white border-r border-gray-200 p-6 space-y-6 overflow-y-auto">
          {/* User Welcome */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Welcome, {user?.fullName}</CardTitle>
              <CardDescription>
                Role: {user?.role?.replace("_", " ").toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {user?.department && <div>Department: {user.department}</div>}
                {user?.studentId && <div>Student ID: {user.studentId}</div>}
              </div>
            </CardContent>
          </Card>

          {/* Role-based Navigation */}
          {user?.role === "super_admin" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5" />
                  Admin Controls
                </CardTitle>
                <CardDescription>
                  Manage users and system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/super-admin">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Super Admin Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Map className="w-5 h-5" />
                Campus Navigation
              </CardTitle>
              <CardDescription>
                Find buildings and plan your route
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/navigation">
                <Button variant="outline" className="w-full justify-start">
                  <Map className="w-4 h-4 mr-2" />
                  Enhanced 3D Navigation
                </Button>
              </Link>
              <div className="text-sm">
                <div className="font-medium mb-2">New Features:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 3D building visualization</li>
                  <li>• Real-time GPS tracking</li>
                  <li>• Indoor positioning with beacons</li>
                  <li>• AR navigation (coming soon)</li>
                  <li>• Turn-by-turn directions</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Quick View */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Quick Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Schedule features coming soon...
              </div>
            </CardContent>
          </Card>
        </div>

        <main className="flex-1 p-6">
          <RealisticCampusMap />
        </main>
      </div>
      <NotificationToast />
    </div>
  );
}