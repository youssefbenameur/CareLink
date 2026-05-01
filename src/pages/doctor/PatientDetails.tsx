
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { userService, UserData } from '@/services/userService';
import { patientNotesService, PatientNote } from '@/services/patientNotesService';
import { moodTrackerService, MoodEntry } from '@/services/moodTracker';
import { medicalRecordsService, MedicalRecord } from '@/services/medicalRecordsService';
import { useAuth } from '@/contexts/AuthContext';
import { PatientInfo } from '@/components/doctor/PatientInfo';
import { PatientNotes } from '@/components/doctor/PatientNotes';
import { PatientMoods } from '@/components/doctor/PatientMoods';
import { PatientMedicalRecords } from '@/components/doctor/PatientMedicalRecords';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PatientDetails = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId || !currentUser?.uid) {
        console.error("No patient ID or doctor ID provided");
        toast({
          title: "Error",
          description: "Invalid patient or doctor ID",
          variant: "destructive"
        });
        navigate('/doctor/patients');
        return;
      }

      try {
        setLoading(true);
        const [
          patientData,
          patientNotes,
          patientMoods,
          patientRecords
        ] = await Promise.all([
          userService.getUserById(patientId),
          patientNotesService.getPatientNotes(patientId, currentUser.uid),
          moodTrackerService.getUserMoodEntries(patientId),
          medicalRecordsService.getPatientRecordsByDoctor(patientId, currentUser.uid)
        ]);

        if (patientData) {
          setPatient(patientData);
          setNotes(patientNotes);
          setMoods(patientMoods);
          setRecords(patientRecords);
        } else {
          toast({
            title: "Error",
            description: "Patient not found",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, currentUser, toast, navigate]);

  const handleChatClick = () => {
    navigate(`/doctor/chat/${patientId}`);
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Patient Details</h1>
          </div>
          <div className="w-full space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DoctorLayout>
    );
  }

  if (!patient) {
    return (
      <DoctorLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-600">Patient Not Found</h2>
          <p className="mt-2">The requested patient was not found.</p>
          <Button 
            onClick={() => navigate('/doctor/patients')}
            className="mt-4"
          >
            Back to Patient List
          </Button>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <p className="text-muted-foreground">Patient ID: {patientId}</p>
          </div>
          <Button onClick={handleChatClick} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat with Patient
          </Button>
        </div>

        <PatientInfo patient={patient} loading={false} />

        <Tabs defaultValue="notes" className="w-full">
          <TabsList>
            <TabsTrigger value="notes">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="moods">Mood History</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-6">
            <PatientNotes
              patientId={patientId}
              doctorId={currentUser?.uid || ''}
              notes={notes}
              onNotesUpdate={setNotes}
            />
          </TabsContent>

          <TabsContent value="moods" className="mt-6">
            <PatientMoods moods={moods} />
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <PatientMedicalRecords records={records} />
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
};

export default PatientDetails;
