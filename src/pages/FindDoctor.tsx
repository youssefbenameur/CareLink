import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, MapPin, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAllDoctors } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from "@/components/ui/badge";

interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  experience?: string;
  languages?: string[] | string;
  education?: string;
  rating?: number;
  available?: boolean;
  email?: string;
  phone?: string;
  location?: string;
  clinicLocation?: string;
  consultationFee?: string;
  about?: string;
}

const FindDoctor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { t } = useTranslation(['findDoctor', 'common']);
  const navigate = useNavigate();

  // Load only approved doctors from Firebase
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);

        const rawDoctors = await getAllDoctors('approved');

        const doctorData: Doctor[] = rawDoctors.map(data => {
          let languagesArray: string[] = [];
          if (Array.isArray(data.languages)) {
            languagesArray = data.languages;
          } else if (typeof data.languages === 'string') {
            languagesArray = [data.languages];
          } else {
            languagesArray = ["English"];
          }

          return {
            id: data.id,
            name: data.name || t('common:unknown'),
            specialty: data.specialty || t('common:general'),
            experience: data.experience || t('common:notSpecified'),
            languages: languagesArray,
            education: data.education || t('common:notSpecified'),
            rating: data.rating || (4 + Math.random()).toFixed(1),
            available: true,
            email: data.email || null,
            phone: data.phone || null,
            location: data.location || null,
            clinicLocation: data.clinicLocation || null,
            consultationFee: data.consultationFee || null,
            about: data.about || null,
          };
        });

        setDoctors(doctorData);
        setFilteredDoctors(doctorData);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        toast({
          title: t('errors.generic'),
          description: t('errors.tryAgain'),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [toast, t]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(term) || 
      (doctor.specialty && doctor.specialty.toLowerCase().includes(term))
    );
    
    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    navigate(`/appointments?doctorId=${doctor.id}&doctorName=${encodeURIComponent(doctor.name)}&tab=schedule`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('findDoctor:title')}</h1>
          <p className="text-muted-foreground mb-4">
            {t('findDoctor:description')}
          </p>
        </div>
        
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder={t('findDoctor:searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 w-full"
          />
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-[400px]">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-700">{t('findDoctor:noDoctors')}</h3>
            <p className="text-gray-500 mt-2">{t('findDoctor:tryDifferent')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{doctor.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    {doctor.specialty}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {doctor.clinicLocation && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{doctor.clinicLocation}</span>
                        </div>
                      )}
                      
                      {doctor.experience && (
                        <div className="flex items-center text-sm">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{doctor.experience} years experience</span>
                        </div>
                      )}
                      
                      {doctor.consultationFee && (
                        <div className="flex items-center text-sm font-semibold">
                          <span className="text-primary">Consultation: {doctor.consultationFee} TND</span>
                        </div>
                      )}
                    </div>

                    <Button 
                        className="w-full mt-4"
                        onClick={() => handleBookAppointment(doctor)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('findDoctor:bookAppointment')}
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FindDoctor;
