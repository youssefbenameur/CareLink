
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { patientNotesService, PatientNote } from '@/services/patientNotesService';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from 'lucide-react';

interface PatientNotesProps {
  patientId: string;
  doctorId: string;
  notes: PatientNote[];
  onNotesUpdate: (notes: PatientNote[]) => void;
}

export const PatientNotes = ({ patientId, doctorId, notes, onNotesUpdate }: PatientNotesProps) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editNote, setEditNote] = useState<PatientNote | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Note cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const note = await patientNotesService.addNote(patientId, doctorId, newNote);
      
      // Add the new note to the existing notes
      const updatedNotes = [...notes, note];
      onNotesUpdate(updatedNotes);
      
      setNewNote('');
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editNote || !editNote.content.trim() || !editNote.id) {
      toast({
        title: "Error",
        description: "Note cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await patientNotesService.updateNote(editNote.id, {
        content: editNote.content
      });
      
      // Update the note in the existing notes array
      const updatedNotes = notes.map(note => 
        note.id === editNote.id ? { ...note, content: editNote.content } : note
      );
      onNotesUpdate(updatedNotes);
      
      setEditNote(null);
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;

    try {
      setIsSubmitting(true);
      await patientNotesService.deleteNote(deleteNoteId);
      
      // Remove the note from the notes array
      const updatedNotes = notes.filter(note => note.id !== deleteNoteId);
      onNotesUpdate(updatedNotes);
      
      setDeleteNoteId(null);
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to safely format date from Timestamp or Date
  const formatDate = (date: Date | Timestamp | string | undefined) => {
    if (!date) return "Unknown date";
    
    try {
      // Handle Firestore Timestamp
      if (typeof date === 'object' && date && 'toDate' in date) {
        return format(date.toDate(), 'PPP p');
      }
      // Handle string date
      else if (typeof date === 'string') {
        return format(new Date(date), 'PPP p');
      }
      // Handle Date object
      else if (date instanceof Date) {
        return format(date, 'PPP p');
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
        <CardTitle>Patient Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <Textarea
            placeholder="Add a new note about this patient..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleAddNote} 
            disabled={isSubmitting || !newNote.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </Button>
        </div>
        
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold">Previous Notes</h3>
          
          {notes.length === 0 ? (
            <p className="text-muted-foreground italic">No notes yet. Add your first note above.</p>
          ) : (
            <div className="space-y-4">
              {notes
                .sort((a, b) => {
                  const dateA = a.createdAt instanceof Date ? 
                    a.createdAt : 
                    (typeof a.createdAt === 'object' && a.createdAt && 'toDate' in a.createdAt ? 
                      a.createdAt.toDate() : 
                      new Date(a.createdAt as any));
                      
                  const dateB = b.createdAt instanceof Date ? 
                    b.createdAt : 
                    (typeof b.createdAt === 'object' && b.createdAt && 'toDate' in b.createdAt ? 
                      b.createdAt.toDate() : 
                      new Date(b.createdAt as any));
                      
                  return dateB.getTime() - dateA.getTime();
                })
                .map((note, index) => (
                  <div key={note.id || index} className="p-4 border rounded-lg">
                    <div className="flex justify-between">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      <div className="flex gap-2 ml-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteNoteId(note.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))
              }
            </div>
          )}
        </div>
        
        {/* Edit Note Dialog */}
        <Dialog open={editNote !== null} onOpenChange={(open) => !open && setEditNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>
                Update the patient note below.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={editNote?.content || ''}
              onChange={(e) => setEditNote(prev => prev ? { ...prev, content: e.target.value } : null)}
              className="min-h-[150px]"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleUpdateNote}
                disabled={isSubmitting || !editNote?.content?.trim()}
              >
                {isSubmitting ? 'Updating...' : 'Update Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteNoteId !== null} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteNote}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
