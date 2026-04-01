
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export const useAppointmentQueryParams = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation(['appointments', 'common']);

  useEffect(() => {
    const doctorId = searchParams.get('doctorId');
    const doctorName = searchParams.get('doctorName');
    
    if (doctorId && doctorName) {
      toast({
        title: t('common:success'),
        description: t('appointments:readyToBook', { doctorName: decodeURIComponent(doctorName) }),
        duration: 5000,
      });
      
      console.log('Doctor selected for appointment:', {
        doctorId,
        doctorName: decodeURIComponent(doctorName)
      });
    }
  }, [searchParams, toast, t]);
};
