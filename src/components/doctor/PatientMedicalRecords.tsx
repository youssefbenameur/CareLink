
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { MedicalRecord } from '@/services/medicalRecordsService';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile";
import ImageLightbox from '@/components/ui/ImageLightbox';
import { convertToDate } from '@/services/appointmentService';

interface PatientMedicalRecordsProps {
  records: MedicalRecord[];
}

export const PatientMedicalRecords = ({ records }: PatientMedicalRecordsProps) => {
  const { t } = useTranslation(['medicalRecords', 'common']);
  const isMobile = useIsMobile();
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const formatDate = (date: any) => {
    return format(convertToDate(date), 'PPp');
  };

  return (
    <>
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
                  </div>
                  <p className="text-sm">{record.description}</p>
                  <div className="text-sm text-muted-foreground">
                    {t('medicalRecords:addedBy', { doctor: `Dr. ${record.doctorName}` })}
                  </div>
                  {record.attachments && record.attachments.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
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
          )}
        </CardContent>
      </Card>

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
