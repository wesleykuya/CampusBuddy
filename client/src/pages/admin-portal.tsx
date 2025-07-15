import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth, getAuthHeaders } from "@/lib/auth";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit, Book, Building2, MapPin, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SystemCourse {
  id: number;
  name: string;
  code: string;
  description?: string;
  department?: string;
  credits?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Building {
  id: number;
  name: string;
  code: string;
  description?: string;
  latitude: string;
  longitude: string;
  type: string;
  amenities: string[];
  isActive: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  studentId?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPortal() {
  const [selectedCourse, setSelectedCourse] = useState<SystemCourse | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isBuildingDialogOpen, setIsBuildingDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false);
  const [isEditBuildingDialogOpen, setIsEditBuildingDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { user } = useAuth();

  // Check if user has admin access
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-lg text-red-600 mb-2">Access Denied</div>
              <p className="text-gray-600">Admin privileges required to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch system courses
  const { data: systemCourses = [], isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ["/api/admin/system-courses"],
    queryFn: async () => {
      const response = await fetch("/api/admin/system-courses", {
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
        },
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('System courses API error:', response.status, errorText);
        throw new Error(`Failed to fetch system courses: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
  });

  // Fetch buildings
  const { data: buildings = [], isLoading: buildingsLoading, error: buildingsError } = useQuery({
    queryKey: ["/api/buildings"],
    queryFn: async () => {
      const response = await fetch("/api/buildings", {
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
        },
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Buildings API error:', response.status, errorText);
        throw new Error(`Failed to fetch buildings: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
  });

  // Fetch users (super admin only)
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
        },
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Users API error:', response.status, errorText);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: user?.role === 'super_admin',
  });

  // Course mutations
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest("POST", "/api/admin/system-courses", courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      setIsCourseDialogOpen(false);
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...courseData }: any) => {
      const response = await apiRequest("PUT", `/api/admin/system-courses/${id}`, courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      setIsEditCourseDialogOpen(false);
      setSelectedCourse(null);
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/system-courses/${courseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  // Building mutations
  const createBuildingMutation = useMutation({
    mutationFn: async (buildingData: any) => {
      const response = await apiRequest("POST", "/api/buildings", buildingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buildings"] });
      setIsBuildingDialogOpen(false);
      toast({
        title: "Success",
        description: "Building created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create building",
        variant: "destructive",
      });
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: async ({ id, ...buildingData }: any) => {
      const response = await apiRequest("PUT", `/api/buildings/${id}`, buildingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buildings"] });
      setIsEditBuildingDialogOpen(false);
      setSelectedBuilding(null);
      toast({
        title: "Success",
        description: "Building updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update building",
        variant: "destructive",
      });
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: async (buildingId: number) => {
      const response = await apiRequest("DELETE", `/api/buildings/${buildingId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buildings"] });
      toast({
        title: "Success",
        description: "Building deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete building",
        variant: "destructive",
      });
    },
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const courseData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string || undefined,
      department: formData.get('department') as string || undefined,
      credits: formData.get('credits') ? parseInt(formData.get('credits') as string) : undefined,
    };
    
    createCourseMutation.mutate(courseData);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const courseData = {
      id: selectedCourse.id,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string || undefined,
      department: formData.get('department') as string || undefined,
      credits: formData.get('credits') ? parseInt(formData.get('credits') as string) : undefined,
    };
    
    updateCourseMutation.mutate(courseData);
  };

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const buildingData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string || undefined,
      latitude: formData.get('latitude') as string,
      longitude: formData.get('longitude') as string,
      type: formData.get('type') as string,
      amenities: formData.get('amenities') ? (formData.get('amenities') as string).split(',').map(s => s.trim()) : [],
    };
    
    createBuildingMutation.mutate(buildingData);
  };

  const handleUpdateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const buildingData = {
      id: selectedBuilding.id,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string || undefined,
      latitude: formData.get('latitude') as string,
      longitude: formData.get('longitude') as string,
      type: formData.get('type') as string,
      amenities: formData.get('amenities') ? (formData.get('amenities') as string).split(',').map(s => s.trim()) : [],
    };
    
    updateBuildingMutation.mutate(buildingData);
  };

  if (coursesLoading || buildingsLoading || (user?.role === 'super_admin' && usersLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (coursesError || buildingsError || (user?.role === 'super_admin' && usersError)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">
              Error loading data. Please try again later.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground">Manage system courses, buildings, and users</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">System Courses</TabsTrigger>
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            {user.role === 'super_admin' && (
              <TabsTrigger value="users">Users</TabsTrigger>
            )}
          </TabsList>

          {/* System Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Book className="w-5 h-5" />
                      System Courses
                    </CardTitle>
                    <CardDescription>
                      Manage courses that students can add to their schedules
                    </CardDescription>
                  </div>
                  <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Course</DialogTitle>
                        <DialogDescription>
                          Add a new course that students can select for their schedules.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCourse} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Course Name</Label>
                            <Input id="name" name="name" placeholder="e.g., Introduction to Computer Science" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="code">Course Code</Label>
                            <Input id="code" name="code" placeholder="e.g., CS101" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" placeholder="Course description..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" name="department" placeholder="e.g., Computer Science" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="credits">Credits</Label>
                            <Input id="credits" name="credits" type="number" placeholder="3" min="1" max="6" />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsCourseDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createCourseMutation.isPending}>
                            {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {systemCourses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No courses available. Create your first course to get started.
                    </div>
                  ) : (
                    systemCourses.map((course: SystemCourse) => (
                      <Card key={course.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Book className="w-4 h-4 text-blue-600" />
                                <Badge variant="outline">{course.code}</Badge>
                                {course.credits && (
                                  <Badge variant="secondary">{course.credits} credits</Badge>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{course.name}</h3>
                                {course.description && (
                                  <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                                )}
                                {course.department && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Department: {course.department}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setIsEditCourseDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteCourseMutation.mutate(course.id)}
                                disabled={deleteCourseMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buildings Tab */}
          <TabsContent value="buildings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Campus Buildings
                    </CardTitle>
                    <CardDescription>
                      Manage campus buildings for navigation and room scheduling
                    </CardDescription>
                  </div>
                  <Dialog open={isBuildingDialogOpen} onOpenChange={setIsBuildingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Building
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Building</DialogTitle>
                        <DialogDescription>
                          Add a new campus building for navigation and scheduling.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateBuilding} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="building-name">Building Name</Label>
                            <Input id="building-name" name="name" placeholder="e.g., Science Hall" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="building-code">Building Code</Label>
                            <Input id="building-code" name="code" placeholder="e.g., SCI" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="building-description">Description</Label>
                          <Textarea id="building-description" name="description" placeholder="Building description..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input id="latitude" name="latitude" placeholder="40.7589" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input id="longitude" name="longitude" placeholder="-73.9851" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="building-type">Type</Label>
                            <Select name="type" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="academic">Academic</SelectItem>
                                <SelectItem value="amenity">Amenity</SelectItem>
                                <SelectItem value="dormitory">Dormitory</SelectItem>
                                <SelectItem value="administrative">Administrative</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amenities">Amenities</Label>
                            <Input id="amenities" name="amenities" placeholder="WiFi, Library, Cafeteria" />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsBuildingDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createBuildingMutation.isPending}>
                            {createBuildingMutation.isPending ? "Creating..." : "Create Building"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {buildings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No buildings available. Add your first building to get started.
                    </div>
                  ) : (
                    buildings.map((building: Building) => (
                      <Card key={building.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-4 h-4 text-green-600" />
                                <Badge variant="outline">{building.code}</Badge>
                                <Badge variant="secondary">{building.type}</Badge>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{building.name}</h3>
                                {building.description && (
                                  <p className="text-sm text-gray-600 mt-1">{building.description}</p>
                                )}
                                <div className="flex items-center space-x-2 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-xs text-gray-500">
                                    {building.latitude}, {building.longitude}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBuilding(building);
                                  setIsEditBuildingDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteBuildingMutation.mutate(building.id)}
                                disabled={deleteBuildingMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab - Super Admin Only */}
          {user.role === 'super_admin' && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        User Management
                      </CardTitle>
                      <CardDescription>
                        Manage user accounts and permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No users available.
                      </div>
                    ) : (
                      users.map((user: User) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={user.role === 'super_admin' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'}>
                                    {user.role.replace('_', ' ')}
                                  </Badge>
                                  {!user.isActive && (
                                    <Badge variant="destructive">Inactive</Badge>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{user.fullName}</h3>
                                  <p className="text-sm text-gray-600">@{user.username} • {user.email}</p>
                                  {user.department && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Department: {user.department}
                                    </p>
                                  )}
                                  {user.studentId && (
                                    <p className="text-xs text-gray-500">
                                      Student ID: {user.studentId}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Course Dialog */}
        <Dialog open={isEditCourseDialogOpen} onOpenChange={setIsEditCourseDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update course information.
              </DialogDescription>
            </DialogHeader>
            {selectedCourse && (
              <form onSubmit={handleUpdateCourse} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Course Name</Label>
                    <Input 
                      id="edit-name" 
                      name="name" 
                      defaultValue={selectedCourse.name}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">Course Code</Label>
                    <Input 
                      id="edit-code" 
                      name="code" 
                      defaultValue={selectedCourse.code}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description"
                    defaultValue={selectedCourse.description || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Input 
                      id="edit-department" 
                      name="department"
                      defaultValue={selectedCourse.department || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-credits">Credits</Label>
                    <Input 
                      id="edit-credits" 
                      name="credits" 
                      type="number"
                      defaultValue={selectedCourse.credits || ""}
                      min="1" 
                      max="6"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditCourseDialogOpen(false);
                      setSelectedCourse(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCourseMutation.isPending}>
                    {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Building Dialog */}
        <Dialog open={isEditBuildingDialogOpen} onOpenChange={setIsEditBuildingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Building</DialogTitle>
              <DialogDescription>
                Update building information.
              </DialogDescription>
            </DialogHeader>
            {selectedBuilding && (
              <form onSubmit={handleUpdateBuilding} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-building-name">Building Name</Label>
                    <Input 
                      id="edit-building-name" 
                      name="name" 
                      defaultValue={selectedBuilding.name}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-building-code">Building Code</Label>
                    <Input 
                      id="edit-building-code" 
                      name="code" 
                      defaultValue={selectedBuilding.code}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-building-description">Description</Label>
                  <Textarea 
                    id="edit-building-description" 
                    name="description"
                    defaultValue={selectedBuilding.description || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-latitude">Latitude</Label>
                    <Input 
                      id="edit-latitude" 
                      name="latitude"
                      defaultValue={selectedBuilding.latitude}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-longitude">Longitude</Label>
                    <Input 
                      id="edit-longitude" 
                      name="longitude"
                      defaultValue={selectedBuilding.longitude}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-building-type">Type</Label>
                    <Select name="type" defaultValue={selectedBuilding.type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="amenity">Amenity</SelectItem>
                        <SelectItem value="dormitory">Dormitory</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-amenities">Amenities</Label>
                    <Input 
                      id="edit-amenities" 
                      name="amenities"
                      defaultValue={selectedBuilding.amenities ? selectedBuilding.amenities.join(", ") : ""}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditBuildingDialogOpen(false);
                      setSelectedBuilding(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateBuildingMutation.isPending}>
                    {updateBuildingMutation.isPending ? "Updating..." : "Update Building"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}