import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, getAuthHeaders } from "@/lib/auth";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Book, 
  Building2, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin,
  Calendar,
  Clock,
  GraduationCap
} from "lucide-react";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<SystemCourse | null>(null);
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    description: "",
    department: "",
    credits: "",
    instructor: ""
  });

  // Fetch system courses
  const { data: systemCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/admin/system-courses"],
    queryFn: async () => {
      const response = await fetch("/api/admin/system-courses", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch system courses");
      }
      return response.json();
    },
  });

  // Fetch buildings
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ["/api/buildings"],
    queryFn: async () => {
      const response = await fetch("/api/buildings");
      if (!response.ok) {
        throw new Error("Failed to fetch buildings");
      }
      return response.json();
    },
  });

  // Create system course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await fetch("/api/admin/system-courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(courseData),
      });
      if (!response.ok) {
        throw new Error("Failed to create course");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      setCourseDialogOpen(false);
      resetCourseForm();
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

  // Update system course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...courseData }: any) => {
      const response = await fetch(`/api/admin/system-courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(courseData),
      });
      if (!response.ok) {
        throw new Error("Failed to update course");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      setCourseDialogOpen(false);
      setEditingCourse(null);
      resetCourseForm();
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

  // Delete system course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/system-courses/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to delete course");
      }
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

  const resetCourseForm = () => {
    setCourseForm({
      name: "",
      code: "",
      description: "",
      department: "",
      credits: "",
      instructor: ""
    });
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const courseData = {
      name: courseForm.name,
      code: courseForm.code,
      description: courseForm.description || undefined,
      department: courseForm.department || undefined,
      credits: courseForm.credits ? parseInt(courseForm.credits) : undefined,
      instructor: courseForm.instructor || undefined,
      isSystemCourse: true,
    };

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, ...courseData });
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  const handleEditCourse = (course: SystemCourse) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      description: course.description || "",
      department: course.department || "",
      credits: course.credits?.toString() || "",
      instructor: course.instructor || ""
    });
    setCourseDialogOpen(true);
  };

  const handleDeleteCourse = (id: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      deleteCourseMutation.mutate(id);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavigationHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage campus resources and system settings</p>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">System Courses</TabsTrigger>
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

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
  createdAt: string;
  updatedAt: string;
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<SystemCourse | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);

  // Check admin access
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
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ["/api/admin/system-courses"],
    queryFn: async () => {
      const response = await fetch("/api/admin/system-courses", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }
      return response.json();
    },
  });

  // Fetch buildings
  const { data: buildings = [], isLoading: buildingsLoading, error: buildingsError } = useQuery({
    queryKey: ["/api/buildings"],
    queryFn: async () => {
      const response = await fetch("/api/buildings", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch buildings: ${response.status}`);
      }
      return response.json();
    },
  });

  // Fetch users (super admin only)
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      return response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Course mutations
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: Omit<SystemCourse, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch("/api/admin/system-courses", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(courseData),
      });
      if (!response.ok) {
        throw new Error(`Failed to create course: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      setCourseDialogOpen(false);
      setEditingCourse(null);
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (courseData: SystemCourse) => {
      const response = await fetch(`/api/admin/system-courses/${courseData.id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(courseData),
      });
      if (!response.ok) {
        throw new Error(`Failed to update course: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      setCourseDialogOpen(false);
      setEditingCourse(null);
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch(`/api/admin/system-courses/${courseId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete course: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-courses"] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Building mutations
  const createBuildingMutation = useMutation({
    mutationFn: async (buildingData: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch("/api/buildings", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildingData),
      });
      if (!response.ok) {
        throw new Error(`Failed to create building: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buildings"] });
      setBuildingDialogOpen(false);
      setEditingBuilding(null);
      toast({
        title: "Success",
        description: "Building created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: async (buildingData: Building) => {
      const response = await fetch(`/api/buildings/${buildingData.id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildingData),
      });
      if (!response.ok) {
        throw new Error(`Failed to update building: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buildings"] });
      setBuildingDialogOpen(false);
      setEditingBuilding(null);
      toast({
        title: "Success",
        description: "Building updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const courseData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string || undefined,
      department: formData.get('department') as string || undefined,
      credits: formData.get('credits') ? parseInt(formData.get('credits') as string) : undefined,
      isActive: true,
    };

    if (editingCourse) {
      updateCourseMutation.mutate({ ...editingCourse, ...courseData });
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  const handleBuildingSubmit = (e: React.FormEvent) => {
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
      amenities: formData.get('amenities') ? 
        (formData.get('amenities') as string).split(',').map(s => s.trim()) : [],
      isActive: true,
    };

    if (editingBuilding) {
      updateBuildingMutation.mutate({ ...editingBuilding, ...buildingData });
    } else {
      createBuildingMutation.mutate(buildingData);
    }
  };

  if (coursesLoading || buildingsLoading || (user.role === 'super_admin' && usersLoading)) {
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

  if (coursesError || buildingsError || (user.role === 'super_admin' && usersError)) {
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage system courses, buildings, and users</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">
              <Book className="w-4 h-4 mr-2" />
              System Courses
            </TabsTrigger>
            <TabsTrigger value="buildings">
              <Building2 className="w-4 h-4 mr-2" />
              Buildings
            </TabsTrigger>
            {user.role === 'super_admin' && (
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* System Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      System Courses ({systemCourses.length})
                    </CardTitle>
                    <CardDescription>
                      Manage courses available for student enrollment
                    </CardDescription>
                  </div>
                  <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingCourse(null);
                        resetCourseForm();
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCourse ? 'Edit Course' : 'Create New Course'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingCourse ? 'Update course information' : 'Add a new course that students can select'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCourseSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="code">Course Code</Label>
                            <Input
                              id="code"
                              value={courseForm.code}
                              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                              placeholder="CS101"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                              id="department"
                              value={courseForm.department}
                              onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                              placeholder="Computer Science"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Course Name</Label>
                          <Input
                            id="name"
                            value={courseForm.name}
                            onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                            placeholder="Introduction to Programming"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instructor">Instructor</Label>
                          <Input
                            id="instructor"
                            value={courseForm.instructor}
                            onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                            placeholder="Dr. Smith"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="credits">Credits</Label>
                            <Input
                              id="credits"
                              type="number"
                              value={courseForm.credits}
                              onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                              placeholder="3"
                              min="1"
                              max="6"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={courseForm.description}
                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                            placeholder="Course description..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setCourseDialogOpen(false);
                              setEditingCourse(null);
                              resetCourseForm();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                          >
                            {editingCourse ? 'Update' : 'Create'} Course
                          </Button>
                        </div>
                      </form></DialogContent>
                  </Dialog>
                      <form onSubmit={handleCourseSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="code">Course Code</Label>
                            <Input
                              id="code"
                              name="code"
                              defaultValue={editingCourse?.code}
                              placeholder="e.g., CS101"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="credits">Credits</Label>
                            <Input
                              id="credits"
                              name="credits"
                              type="number"
                              defaultValue={editingCourse?.credits}
                              placeholder="3"
                              min="1"
                              max="6"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Course Name</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={editingCourse?.name}
                            placeholder="e.g., Introduction to Computer Science"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            name="department"
                            defaultValue={editingCourse?.department}
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={editingCourse?.description}
                            placeholder="Course description..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setCourseDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createCourseMutation.isPending || updateCourseMutation.isPending}>
                            {editingCourse ? 'Update' : 'Create'} Course
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading courses...</p>
                  </div>
                ) : systemCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No system courses found</p>
                    <Button onClick={() => {
                      resetCourseForm();
                      setCourseDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Course
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemCourses.map((course: SystemCourse) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{course.department || "N/A"}</TableCell>
                          <TableCell>{course.credits || "N/A"}</TableCell>
                          <TableCell>{course.instructor || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={course.isActive ? "default" : "secondary"}>
                              {course.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCourse(course)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCourse(course.id)}
                                disabled={deleteCourseMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
                          <TableCell className="font-medium">{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{course.department || 'Not specified'}</TableCell>
                          <TableCell>{course.credits || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={course.isActive ? "default" : "secondary"}>
                              {course.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCourse(course);
                                  setCourseDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteCourseMutation.mutate(course.id)}
                                disabled={deleteCourseMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                      Campus Buildings ({buildings.length})
                    </CardTitle>
                    <CardDescription>
                      Manage campus buildings and facilities
                    </CardDescription>
                  </div>
                  <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingBuilding(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Building
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingBuilding ? 'Edit Building' : 'Create New Building'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingBuilding ? 'Update building information' : 'Add a new campus building'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBuildingSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="building-code">Building Code</Label>
                            <Input
                              id="building-code"
                              name="code"
                              defaultValue={editingBuilding?.code}
                              placeholder="e.g., SCI"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="building-type">Type</Label>
                            <Select name="type" defaultValue={editingBuilding?.type || "Academic"}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Academic">Academic</SelectItem>
                                <SelectItem value="Administrative">Administrative</SelectItem>
                                <SelectItem value="Residential">Residential</SelectItem>
                                <SelectItem value="Recreation">Recreation</SelectItem>
                                <SelectItem value="Dining">Dining</SelectItem>
                                <SelectItem value="Library">Library</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="building-name">Building Name</Label>
                          <Input
                            id="building-name"
                            name="name"
                            defaultValue={editingBuilding?.name}
                            placeholder="e.g., Science Hall"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                              id="latitude"
                              name="latitude"
                              type="number"
                              step="any"
                              defaultValue={editingBuilding?.latitude}
                              placeholder="40.7589"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                              id="longitude"
                              name="longitude"
                              type="number"
                              step="any"
                              defaultValue={editingBuilding?.longitude}
                              placeholder="-73.9851"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="building-amenities">Amenities (comma-separated)</Label>
                          <Input
                            id="building-amenities"
                            name="amenities"
                            defaultValue={editingBuilding?.amenities?.join(', ')}
                            placeholder="WiFi, Library, Study Rooms"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="building-description">Description</Label>
                          <Textarea
                            id="building-description"
                            name="description"
                            defaultValue={editingBuilding?.description}
                            placeholder="Building description..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setBuildingDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createBuildingMutation.isPending || updateBuildingMutation.isPending}>
                            {editingBuilding ? 'Update' : 'Create'} Building
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {buildings.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No buildings found</p>
                    <Button onClick={() => setBuildingDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Building
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Amenities</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buildings.map((building: Building) => (
                        <TableRow key={building.id}>
                          <TableCell className="font-medium">{building.code}</TableCell>
                          <TableCell>{building.name}</TableCell>
                          <TableCell>{building.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {building.latitude}, {building.longitude}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {building.amenities?.slice(0, 2).map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {building.amenities?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{building.amenities.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingBuilding(building);
                                  setBuildingDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab (Super Admin Only) */}
          {user.role === 'super_admin' && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        System Users ({users.length})
                      </CardTitle>
                      <CardDescription>
                        Manage user accounts and permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No users found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.fullName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'super_admin' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.department || 'Not specified'}</TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}