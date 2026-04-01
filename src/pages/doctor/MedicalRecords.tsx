
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { userService } from '@/services/userService';
import { medicalRecordsService, type MedicalRecord } from '@/services/medicalRecordsService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUp, Plus, FileText, Search, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Timestamp } from 'firebase/firestore';
import { useIsMobile } from '@/hooks/use-mobile';

const MedicalRecords = () => {
  const { t } = useTranslation(['medicalRecords', 'common', 'errors']);
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [recordType, setRecordType] = useState<string>('diagnosis');
  const [recordTitle, setRecordTitle] = useState<string>('');
  const [recordDescription, setRecordDescription] = useState<string>('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    const loadPatients = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const doctorPatients = await userService.getDoctorPatients(currentUser.uid);
        
        if (doctorPatients.length === 0) {
          const allPatients = await userService.getAllPatients();
          setPatients(allPatients);
        } else {
          setPatients(doctorPatients);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
        toast({
          title: t('errors:generic'),
          description: t('errors:dataNotFound'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPatients();
  }, [currentUser, t, toast]);
  
  useEffect(() => {
    loadRecords();
  }, [currentUser]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(record => 
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  const loadRecords = async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      const records = await medicalRecordsService.getDoctorRecords(currentUser.uid);
      setRecords(records);
      setFilteredRecords(records); // Initialize filtered records with all records
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        title: t('errors:generic'),
        description: t('errors:dataNotFound'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async () => {
    if (!currentUser?.uid || !selectedPatient || !recordType || !recordTitle) {
      toast({
        title: t('errors:validationError'),
        description: t('errors:fillRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedPatientData = patients.find(p => p.id === selectedPatient);
      const newRecord: Omit<MedicalRecord, 'id'> = {
        patientId: selectedPatient,
        patientName: selectedPatientData?.name || t('common:unknown'),
        type: recordType,
        title: recordTitle,
        description: recordDescription,
        date: new Date(),
        doctorId: currentUser.uid,
        doctorName: userData?.name || t('common:unknown')
      };

      await medicalRecordsService.createRecord(newRecord);
      toast({ 
        title: t('common:success'),
        description: t('medicalRecords:addRecord') + ' ' + t('common:success').toLowerCase()
      });
      loadRecords();
      setRecordTitle('');
      setRecordDescription('');
    } catch (error) {
      console.error('Error creating record:', error);
      toast({
        title: t('errors:generic'),
        description: t('errors:tryAgain'),
        variant: "destructive",
      });
    }
  };

  const handleUpdateRecord = async () => {
    if (!selectedRecord?.id) return;

    try {
      await medicalRecordsService.updateRecord(selectedRecord.id, {
        title: recordTitle,
        description: recordDescription,
        type: recordType
      });
      
      toast({ 
        title: t('common:success'),
        description: t('medicalRecords:editRecord') + ' ' + t('common:success').toLowerCase()
      });
      loadRecords();
      setIsDialogOpen(false);
      setSelectedRecord(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: t('errors:generic'),
        description: t('errors:tryAgain'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord?.id) return;

    try {
      await medicalRecordsService.deleteRecord(selectedRecord.id);
      toast({ 
        title: t('common:success'),
        description: t('medicalRecords:deleteRecord') + ' ' + t('common:success').toLowerCase()
      });
      loadRecords();
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: t('errors:generic'),
        description: t('errors:tryAgain'),
        variant: "destructive",
      });
    }
  };

  const recordTypes = [
    { value: 'diagnosis', label: t('medicalRecords:diagnosis') },
    { value: 'treatment', label: t('medicalRecords:treatment') },
    { value: 'prescription', label: t('medicalRecords:prescription') },
    { value: 'labResults', label: t('medicalRecords:labResults') },
    { value: 'allergies', label: t('medicalRecords:allergies') },
    { value: 'medications', label: t('medicalRecords:medications') },
  ];

  // Function to format date properly, handling both Date and Timestamp
  const formatRecordDate = (date: Date | Timestamp) => {
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'PP');
    }
    return format(date, 'PP');
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('medicalRecords:title')}</h1>
          <p className="text-muted-foreground">
            {t('medicalRecords:patientRecords')}
          </p>
        </div>
        
        <Tabs defaultValue="records">
          <TabsList className="mb-4 w-full md:w-auto flex overflow-x-auto">
            <TabsTrigger value="records" className="whitespace-nowrap">
              <FileText className="h-4 w-4 mr-2" />
              {t('medicalRecords:patientRecords')}
            </TabsTrigger>
            <TabsTrigger value="create" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              {t('medicalRecords:addRecord')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>{t('medicalRecords:patientRecords')}</CardTitle>
                    <CardDescription>
                      {t('medicalRecords:patientRecords')}
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t('medicalRecords:selectPatient')} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder={t('common:search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-full sm:w-[180px]"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : filteredRecords.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRecords.map((record) => (
                      <div 
                        key={record.id} 
                        className="flex flex-col p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-semibold">{record.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                {recordTypes.find(t => t.value === record.type)?.label || record.type}
                              </span>
                            </div>
                            <p className="text-sm">{record.description}</p>
                            <div className="text-xs text-muted-foreground">
                              <span>{record.patientName}</span>
                              <span className="mx-2">•</span>
                              <span>{formatRecordDate(record.date)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(record);
                                setRecordTitle(record.title);
                                setRecordDescription(record.description);
                                setRecordType(record.type);
                                setIsEditing(true);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              {t('common:edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {t('common:delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    {searchTerm ? t('common:noResults') : t('medicalRecords:noRecords')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>{t('medicalRecords:addRecord')}</CardTitle>
                <CardDescription>
                  {t('medicalRecords:patientRecords')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="patient">{t('medicalRecords:selectPatient')}</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger id="patient">
                        <SelectValue placeholder={t('medicalRecords:selectPatient')} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="recordType">{t('medicalRecords:recordType')}</Label>
                    <Select value={recordType} onValueChange={setRecordType}>
                      <SelectTrigger id="recordType">
                        <SelectValue placeholder={t('medicalRecords:recordType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {recordTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="recordTitle">{t('medicalRecords:recordTitle')}</Label>
                    <Input 
                      id="recordTitle" 
                      value={recordTitle}
                      onChange={(e) => setRecordTitle(e.target.value)}
                      placeholder={t('medicalRecords:recordTitle')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recordDescription">{t('medicalRecords:recordDescription')}</Label>
                    <Textarea 
                      id="recordDescription" 
                      value={recordDescription}
                      onChange={(e) => setRecordDescription(e.target.value)}
                      placeholder={t('medicalRecords:recordDescription')}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>{t('medicalRecords:recordAttachments')}</Label>
                    <div className="mt-2">
                      <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
                        <div className="text-center">
                          <FileUp className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                          <p className="text-sm font-medium">{t('medicalRecords:uploadFile')}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, PDF up to 10MB
                          </p>
                          <Button variant="outline" size="sm" className="mt-4">
                            {t('common:chooseFile')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateRecord}>
                  {t('medicalRecords:saveRecord')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Record Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('medicalRecords:editRecord')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editRecordType">{t('medicalRecords:recordType')}</Label>
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger id="editRecordType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="editRecordTitle">{t('medicalRecords:recordTitle')}</Label>
              <Input 
                id="editRecordTitle" 
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="editRecordDescription">{t('medicalRecords:recordDescription')}</Label>
              <Textarea 
                id="editRecordDescription" 
                value={recordDescription}
                onChange={(e) => setRecordDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={handleUpdateRecord}>
              {t('medicalRecords:updateRecord')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('medicalRecords:deleteRecord')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('medicalRecords:confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className="bg-destructive text-destructive-foreground">
              {t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DoctorLayout>
  );
};

export default MedicalRecords;
