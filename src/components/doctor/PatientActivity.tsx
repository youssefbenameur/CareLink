
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile";

interface PatientActivityProps {
  activities: Array<{
    type: string;
    description: string;
    timestamp: Date | Timestamp;
  }>;
}

export const PatientActivity = ({ activities }: PatientActivityProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  const formatTimestamp = (timestamp: Date | Timestamp) => {
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), 'PPp');
    }
    return format(timestamp, 'PPp');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('patients.patientActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t('patients.noActivity')}</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
                <span className="text-sm px-2 py-1 rounded-full bg-primary/10 self-start">
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
