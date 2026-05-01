
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { ChevronRight } from 'lucide-react';

export const DashboardPatientList = () => {
  const { currentUser } = useAuth();
  
  const { data: patients, isLoading } = useQuery({
    queryKey: ['doctorPatients', currentUser?.uid],
    queryFn: () => userService.getDoctorPatients(currentUser?.uid || ''),
    enabled: !!currentUser?.uid,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
          <CardDescription>Manage your patient list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Patients</CardTitle>
          <CardDescription>Manage your patient list</CardDescription>
        </div>
        <Button asChild>
          <Link to="/doctor/patients">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients?.slice(0, 5).map((patient) => (
            <div key={patient.id} className="flex items-center justify-between space-x-4 p-3 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={patient.avatarBase64} alt={patient.name} />
                  <AvatarFallback>
                    {patient.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/doctor/patients/${patient.id}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link to="/doctor/patients">
            View All Patients
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
