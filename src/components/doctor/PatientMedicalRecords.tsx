
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { MedicalRecord } from '@/services/medicalRecordsService';
import { FileText, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile";

interface PatientMedicalRecordsProps {
  records: MedicalRecord[];
}

export const PatientMedicalRecords = ({ records }: PatientMedicalRecordsProps) => {
  const { t } = useTranslation(['medicalRecords', 'common']);
  const isMobile = useIsMobile();
  
  const formatDate = (date: Date | Timestamp) => {
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'PPp');
    }
    return format(date, 'PPp');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('medicalRecords:title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t('medicalRecords:noRecords')}</p>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <h3 className="font-semibold">{record.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {record.type} - {formatDate(record.date)}
                    </p>
                  </div>
                  {record.attachments && record.attachments.length > 0 && (
                    <Button variant="outline" size="sm" className="self-start mt-2 sm:mt-0">
                      <Download className="h-4 w-4 mr-2" />
                      {t('common:download')}
                    </Button>
                  )}
                </div>
                <p className="text-sm">{record.description}</p>
                <div className="text-sm text-muted-foreground">
                  {t('medicalRecords:addedBy', { doctor: `Dr. ${record.doctorName}` })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
