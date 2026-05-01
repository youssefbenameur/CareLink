
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export const useAppointmentQueryParams = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const doctorId = searchParams.get('doctorId');
    const doctorName = searchParams.get('doctorName');
    
    if (doctorId && doctorName) {
      toast({
        title: "Doctor Selected",
        description: `Ready to book with Dr. ${decodeURIComponent(doctorName)}`,
        duration: 5000,
      });
      
      console.log('Doctor selected for appointment:', {
        doctorId,
        doctorName: decodeURIComponent(doctorName)
      });
    }
  }, [searchParams, toast]);
};
