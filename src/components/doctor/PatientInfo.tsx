
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserData } from "@/services/userService";
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface PatientInfoProps {
  patient: UserData | null;
  loading: boolean;
}

export const PatientInfo = ({ patient, loading }: PatientInfoProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Patient Not Found</h2>
          <p className="mt-2 text-gray-600">
            The requested patient could not be found. Please check the patient ID and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format date if it exists
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not specified";
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  // Function to safely format createdAt date
  const formatCreatedAt = (createdAt: Date | Timestamp | string | undefined) => {
    if (!createdAt) return "Unknown";
    
    try {
      // Handle Firestore Timestamp
      if (typeof createdAt === 'object' && createdAt && 'toDate' in createdAt) {
        return format(createdAt.toDate(), 'PPP');
      }
      // Handle string date
      else if (typeof createdAt === 'string') {
        return format(new Date(createdAt), 'PPP');
      }
      // Handle Date object
      else if (createdAt instanceof Date) {
        return format(createdAt, 'PPP');
      }
      return "Invalid date format";
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date format error";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-muted-foreground">Name</h3>
              <p className="text-lg">{patient.name || "Not specified"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Email</h3>
              <p>{patient.email || "Not specified"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Phone</h3>
              <p>{patient.phone || "Not specified"}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-muted-foreground">Date of Birth</h3>
              <p>{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "Not specified"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Address</h3>
              <p>{patient.address || "Not specified"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Joined</h3>
              <p>{patient.createdAt ? formatCreatedAt(patient.createdAt) : "Unknown"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
