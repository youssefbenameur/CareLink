
import { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Edit, Trash2, Search, AlertCircle, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { AnimatedSection } from '@/components/ui/animated-section';
import { adminService, User } from '@/services/adminService';
import { convertToDate } from '@/services/appointmentService';

// Transform users from Firestore to expected format
const transformUserData = (users: User[]) => {
  return users.map((user) => ({
    id: user.id || '',
    firstName: user.firstName || (typeof (user as any).name === 'string' ? (user as any).name.split(' ')[0] : ''),
    lastName: user.lastName || (typeof (user as any).name === 'string' ? (user as any).name.split(' ').slice(1).join(' ') : ''),
    email: user.email || '',
    role: user.role || 'patient',
    status: user.status || 'active',
    doctorVerificationStatus: (user as any).doctorVerificationStatus ?? undefined,
    createdAt: convertToDate(user.createdAt ?? null),
    lastLogin: convertToDate(user.lastLogin ?? null),
  }));
};

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Form refs for editing and creating users
  const editFormRef = useRef<HTMLFormElement>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Fetch a larger page so doctors show up too (seeded users share the same createdAt)
        const userData = await adminService.getUsers(200);
        const transformedUsers = transformUserData(userData.users).filter(u =>
          u.role !== 'doctor' || u.doctorVerificationStatus === 'approved'
        );
        
        setUsers(transformedUsers);
        setFilteredUsers(transformedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  useEffect(() => {
    let result = users;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      // Prepare user data for update
      const userData: Partial<User> = {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      };
      
      await adminService.updateUser(updatedUser.id || '', userData);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === updatedUser.id ? {...user, ...updatedUser} : user
      ));
      
      toast({
        title: "Success",
        description: `User ${updatedUser.firstName} ${updatedUser.lastName} updated`,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Update failed",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Delete failed",
      });
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormRef.current) return;
    
    const formData = new FormData(createFormRef.current);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as "admin" | "doctor" | "patient";
    const status = formData.get('status') as "active" | "suspended";
    
    try {
      // Create user with proper User type
      const newUser: User = {
        firstName,
        lastName,
        email,
        role,
        status,
        joinedDate: new Date(),
        lastLogin: new Date()
      };
      
      const createdUser = await adminService.createUser(newUser);
      
      // Add to local state
      setUsers([...users, createdUser]);
      
      toast({
        title: "Success",
        description: `User ${firstName} ${lastName} created`,
      });
      
      // Close dialog
      document.querySelector('[data-state="open"]')?.setAttribute('data-state', 'closed');
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Create failed",
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormRef.current || !userToEdit) return;
    
    const formData = new FormData(editFormRef.current);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as "admin" | "doctor" | "patient";
    const status = formData.get('status') as "active" | "suspended";
    
    const updatedUser: User = {
      ...userToEdit,
      firstName,
      lastName,
      email,
      role,
      status
    };
    
    handleUpdateUser(updatedUser);
  };

  const getVerificationBadge = (user: User) => {
    if (user.role !== 'doctor') return null;
    switch (user.doctorVerificationStatus) {
      case 'approved':  return <Badge className="bg-green-600 text-xs">Approved</Badge>;
      case 'pending':   return <Badge className="bg-yellow-500 text-xs">Pending</Badge>;
      case 'resubmit':  return <Badge className="bg-orange-500 text-xs">Re-upload</Badge>;
      case 'rejected':  return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default:          return <Badge variant="outline" className="text-xs">Unverified</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600">Admin</Badge>;
      case 'doctor':
        return <Badge className="bg-blue-600">Doctor</Badge>;
      case 'patient':
        return <Badge className="bg-green-600">Patient</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await adminService.updateUser(user.id || '', { status: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      toast({
        title: newStatus === 'active' ? 'User activated' : 'User suspended',
        description: `${user.firstName} ${user.lastName} is now ${newStatus}.`,
      });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Update failed" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles and permissions
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with appropriate role and permissions
                </DialogDescription>
              </DialogHeader>
              
              <form ref={createFormRef} onSubmit={handleCreateUser} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" required placeholder="First Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" required placeholder="Last Name" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="Email" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="patient">
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Initial Password" />
                </div>
                
                <DialogFooter>
                  <Button type="submit">Add New User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>User Accounts</CardTitle>
            <CardDescription>
              Manage all registered users in the system
            </CardDescription>
          </CardHeader>
          
          <div className="p-6 pb-0 flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="w-40">
                <Label htmlFor="roleFilter" className="sr-only">All Roles</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="roleFilter">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-40">
                <Label htmlFor="statusFilter" className="sr-only">All Statuses</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="statusFilter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                title="Reset"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-6">
            {filteredUsers.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {convertToDate(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {convertToDate(user.lastLogin).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.status === 'active'
                                ? <ShieldOff className="h-4 w-4 text-destructive" />
                                : <ShieldCheck className="h-4 w-4 text-green-600" />}
                            </Button>
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => setUserToEdit(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </SheetTrigger>
                              <SheetContent>
                                <SheetHeader>
                                  <SheetTitle>Edit User</SheetTitle>
                                  <SheetDescription>
                                    Update user information and permissions
                                  </SheetDescription>
                                </SheetHeader>
                                
                                {userToEdit && (
                                  <form ref={editFormRef} onSubmit={handleEditSubmit} className="py-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input 
                                          id="firstName"
                                          name="firstName"
                                          required
                                          defaultValue={userToEdit.firstName}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input 
                                          id="lastName"
                                          name="lastName"
                                          required 
                                          defaultValue={userToEdit.lastName} 
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="email">Email</Label>
                                      <Input 
                                        id="email"
                                        name="email" 
                                        type="email"
                                        required 
                                        defaultValue={userToEdit.email} 
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="role">Role</Label>
                                      <Select name="role" defaultValue={userToEdit.role}>
                                        <SelectTrigger id="role">
                                          <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="doctor">Doctor</SelectItem>
                                          <SelectItem value="patient">Patient</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="status">Status</Label>
                                      <Select name="status" defaultValue={userToEdit.status}>
                                        <SelectTrigger id="status">
                                          <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <SheetFooter>
                                      <Button type="submit">Save Changes</Button>
                                    </SheetFooter>
                                  </form>
                                )}
                              </SheetContent>
                            </Sheet>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center gap-2 py-4 text-amber-600">
                                  <AlertCircle className="h-5 w-5" />
                                  <p className="text-sm">All data associated with this user will be permanently removed.</p>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline">Cancel</Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    Delete User
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {`Showing ${filteredUsers.length} of ${users.length} users`}
            </div>
            
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ManageUsers;
