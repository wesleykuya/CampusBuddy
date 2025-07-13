import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { NavigationHeader } from "@/components/navigation-header";
import { Enhanced3DCampusMap } from "@/components/enhanced-3d-campus-map";
import { IndoorNavigation } from "@/components/indoor-navigation";
import { AdminNavigationPanel } from "@/components/admin-navigation-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Map, Compass, Shield } from "lucide-react";

export default function EnhancedNavigation() {
  const { user } = useAuth();
  const [selectedBuilding, setSelectedBuilding] = useState<string>("lib-001");
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Campus Navigation</h1>
          <p className="text-gray-600">
            Advanced 3D navigation with real-time positioning, indoor wayfinding, and AR capabilities
          </p>
        </div>

        <Tabs defaultValue="3d-map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="3d-map" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              3D Campus Map
            </TabsTrigger>
            <TabsTrigger value="indoor" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Indoor Navigation
            </TabsTrigger>
            <TabsTrigger value="ar" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              AR Navigation
            </TabsTrigger>
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Panel
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="3d-map">
            <Enhanced3DCampusMap />
          </TabsContent>

          <TabsContent value="indoor">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Indoor Navigation System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IndoorNavigation 
                  buildingId={selectedBuilding} 
                  selectedFloor={selectedFloor} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Compass className="h-5 w-5" />
                  Augmented Reality Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                    <Compass className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">AR Navigation Coming Soon</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Experience immersive augmented reality navigation with real-time directions 
                    overlaid on your camera view. Point your device at buildings and get instant 
                    information about rooms, facilities, and navigation paths.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div>✓ Real-time camera overlay navigation</div>
                    <div>✓ 3D directional arrows and markers</div>
                    <div>✓ Interactive building information</div>
                    <div>✓ Voice-guided directions</div>
                    <div>✓ Multi-language support</div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    This feature requires device camera permissions and is optimized for mobile devices.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <TabsContent value="admin">
              <AdminNavigationPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}