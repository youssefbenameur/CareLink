
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
import { convertToDate } from '@/services/appointmentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import ImageLightbox from '@/components/ui/ImageLightbox';

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
  const [attachments, setAttachments] = useState<{ name: string; base64: string; type: string }[]>([]);
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        toast({ title: "Photos only", description: `${file.name} is not a JPG or PNG and was skipped.`, variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB.`, variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, base64: reader.result as string, type: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        toast({ title: "Photos only", description: `${file.name} is not a JPG or PNG and was skipped.`, variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB.`, variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setEditAttachments((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeEditAttachment = (index: number) => {
    setEditAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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
        doctorName: userData?.name || t('common:unknown'),
        attachments: attachments.map((a) => a.base64),
      };

      await medicalRecordsService.createRecord(newRecord);
      toast({ 
        title: t('common:success'),
        description: t('medicalRecords:addRecord') + ' ' + t('common:success').toLowerCase()
      });
      loadRecords();
      setRecordTitle('');
      setRecordDescription('');
      setAttachments([]);
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
        type: recordType,
        attachments: editAttachments,
      });
      
      toast({ 
        title: t('common:success'),
        description: t('medicalRecords:editRecord') + ' ' + t('common:success').toLowerCase()
      });
      loadRecords();
      setIsDialogOpen(false);
      setSelectedRecord(null);
      setIsEditing(false);
      setEditAttachments([]);
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

  // Format date using the global convertToDate helper
  const formatRecordDate = (date: any) => {
    return format(convertToDate(date), 'PP');
  };

  return (
    <>
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
                                setEditAttachments(record.attachments ?? []);
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
                        {record.attachments && record.attachments.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {record.attachments.map((src, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setLightbox({ images: record.attachments!, index: i })}
                                className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                              >
                                <img
                                  src={src}
                                  alt={`Attachment ${i + 1}`}
                                  className="w-full h-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                />
                              </button>
                            ))}
                          </div>
                        )}
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
                    <Label>Photos</Label>
                    <div className="mt-2">
                      <label
                        htmlFor="attachmentInput"
                        className="flex items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="text-center">
                          <FileUp className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                          <p className="text-sm font-medium">Upload Photo</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG up to 10MB
                          </p>
                          <span className="mt-4 inline-flex items-center px-3 py-1.5 rounded-md border text-sm font-medium bg-background hover:bg-muted transition-colors">
                            {t('common:chooseFile')}
                          </span>
                        </div>
                      </label>
                      <input
                        id="attachmentInput"
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {attachments.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {attachments.map((att, i) => (
                            <div key={i} className="relative group rounded-md overflow-hidden border">
                              <img
                                src={att.base64}
                                alt={att.name}
                                className="w-full h-24 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeAttachment(i)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                              >
                                ✕
                              </button>
                              <p className="text-[10px] text-muted-foreground truncate px-1 pb-1">{att.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
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
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditAttachments([]); }}>
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

            <div>
              <Label>Photos</Label>
              <div className="mt-2">
                {/* Existing photos */}
                {editAttachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {editAttachments.map((src, i) => (
                      <div key={i} className="relative group rounded-md overflow-hidden border">
                        <img src={src} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditAttachment(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add new photos */}
                <label
                  htmlFor="editAttachmentInput"
                  className="flex items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="text-center">
                    <FileUp className="h-6 w-6 text-muted-foreground mb-1 mx-auto" />
                    <p className="text-xs font-medium">Add Photos</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
                  </div>
                </label>
                <input
                  id="editAttachmentInput"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={handleEditFileChange}
                />
              </div>
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
    {lightbox && (
      <ImageLightbox
        images={lightbox.images}
        startIndex={lightbox.index}
        onClose={() => setLightbox(null)}
      />
    )}
    </>
  );
};

export default MedicalRecords;
