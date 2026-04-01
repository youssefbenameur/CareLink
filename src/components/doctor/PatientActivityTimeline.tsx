
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from '@/services/activityService';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { activityService } from '@/services/activityService';
import { userService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';

export const PatientActivityTimeline = () => {
  const { currentUser } = useAuth();
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ['doctorPatientActivities', currentUser?.uid],
    queryFn: async () => {
      const activitiesData = await activityService.getDoctorPatientActivities(currentUser?.uid || '');
      
      // Fetch patient details for each activity
      const activitiesWithPatients = await Promise.all(
        activitiesData.map(async (activity) => {
          const patientData = await userService.getUserById(activity.userId);
          return {
            ...activity,
            patientName: patientData?.name || 'Unknown Patient'
          };
        })
      );
      
      return activitiesWithPatients;
    },
    enabled: !!currentUser?.uid,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Activity</CardTitle>
          <CardDescription>Recent activity from your patients</CardDescription>
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
      <CardHeader>
        <CardTitle>Patient Activity</CardTitle>
        <CardDescription>Recent activity from your patients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recent patient activity</p>
          ) : (
            activities?.map((activity, index) => (
              <div 
                key={activity.id || index}
                className="flex items-start justify-between p-4 rounded-lg border space-x-4"
              >
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium">{activity.patientName}</p>
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      activity.timestamp instanceof Timestamp 
                        ? activity.timestamp.toDate() 
                        : new Date(activity.timestamp),
                      'PPp'
                    )}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/doctor/patients/${activity.userId}`}>
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
