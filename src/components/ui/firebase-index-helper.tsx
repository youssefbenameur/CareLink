
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FirestoreIndexProps {
  collection: string;
  fields: Array<{
    fieldPath: string;
    order?: "ASCENDING" | "DESCENDING"
  }>;
  queryScope?: "COLLECTION" | "COLLECTION_GROUP"
}

export const FirestoreIndexHelper: React.FC<FirestoreIndexProps> = ({ 
  collection, 
  fields,
  queryScope = "COLLECTION" 
}) => {
  const indexConfiguration = {
    collectionGroup: collection,
    queryScope: queryScope,
    fields: fields
  };

  const indexJson = JSON.stringify(indexConfiguration, null, 2);
  const firebaseConsoleUrl = `https://console.firebase.google.com/project/_/firestore/indexes`;

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Firestore Index Required</AlertTitle>
      <AlertDescription>
        <p className="mb-2">You need to create a composite index in Firebase for this query to work:</p>
        <pre className="p-2 bg-muted rounded text-xs overflow-auto">
          {indexJson}
        </pre>
        <p className="mt-2">
          <a 
            href={firebaseConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Go to Firebase Console
          </a> and add the index manually, or click on the link in the Firebase error message.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default FirestoreIndexHelper;
