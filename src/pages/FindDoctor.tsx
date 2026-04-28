import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, Calendar, MapPin, SlidersHorizontal, X, UserSearch,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAllDoctors } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { RouteMap } from '@/components/map/RouteMap';

// Tunisian governorate cities
const TUNISIAN_CITIES = [
  'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana',
  'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul',
  'Tataouine', 'Béja', 'Jendouba', 'El Kef', 'Mahdia', 'Sidi Bouzid',
  'Tozeur', 'Siliana', 'Zaghouan', 'Kebili', 'Manouba',
];

interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  experience?: string;
  languages?: string[] | string;
  education?: string;
  available?: boolean;
  email?: string;
  clinicLocation?: string;
  clinicLat?: number;
  clinicLng?: number;
  consultationFee?: number | string;
  avatarBase64?: string;
  practiceType?: string;
}

const FindDoctor = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [maxFee, setMaxFee] = useState<number>(500);
  const [hasLocation, setHasLocation] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'fee_asc' | 'fee_desc'>('name');

  // Location dialog
  const [locationDoctor, setLocationDoctor] = useState<Doctor | null>(null);

  const { toast } = useToast();
  const { t } = useTranslation(['findDoctor', 'common']);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const rawDoctors = await getAllDoctors('approved');
        const doctorData: Doctor[] = rawDoctors.map((data: any) => ({
          id: data.id,
          name: data.name || 'Unknown',
          specialty: data.specialty || data.specialization || '',
          experience: data.experience || '',
          languages: data.languages || [],
          education: data.education || '',
          available: true,
          email: data.email || '',
          clinicLocation: data.clinicLocation || '',
          clinicLat: data.clinicLat || null,
          clinicLng: data.clinicLng || null,
          consultationFee: data.consultationFee ? Number(data.consultationFee) : null,
          avatarBase64: data.avatarBase64 || '',
          practiceType: data.practiceType || '',
        }));
        setDoctors(doctorData);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast({ title: 'Error', description: 'Failed to load doctors.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Derived filter options
  const specialties = useMemo(() => {
    const s = new Set(doctors.map((d) => d.specialty).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [doctors]);

  const absoluteMaxFee = useMemo(() => {
    const fees = doctors.map((d) => Number(d.consultationFee)).filter((f) => !isNaN(f) && f > 0);
    return fees.length > 0 ? Math.max(...fees) : 500;
  }, [doctors]);

  // Active filter count
  const activeFilterCount = [
    selectedSpecialty !== 'all',
    selectedCity !== 'all',
    maxFee < absoluteMaxFee,
    hasLocation,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedSpecialty('all');
    setSelectedCity('all');
    setMaxFee(absoluteMaxFee);
    setHasLocation(false);
    setSortBy('name');
  };

  const filteredDoctors = useMemo(() => {
    let result = doctors.filter((d) => {
      // Search
      const term = searchTerm.toLowerCase();
      if (term && !d.name.toLowerCase().includes(term) && !d.specialty?.toLowerCase().includes(term)) {
        return false;
      }
      // Specialty
      if (selectedSpecialty !== 'all' && d.specialty !== selectedSpecialty) return false;

      // City — when a city filter is active, doctors with null/empty clinicLocation
      // are automatically excluded (they cannot satisfy the city requirement).
      if (selectedCity !== 'all') {
        if (!d.clinicLocation || !d.clinicLocation.trim()) return false;
        if (!d.clinicLocation.toLowerCase().includes(selectedCity.toLowerCase())) return false;
      }

      // Fee — when a fee filter is active (slider moved below max), doctors with
      // null/zero consultationFee are automatically excluded (no fee = unverified data).
      if (maxFee < absoluteMaxFee) {
        const fee = Number(d.consultationFee);
        if (!d.consultationFee || isNaN(fee) || fee <= 0 || fee > maxFee) return false;
      }

      // Has location
      if (hasLocation && !d.clinicLat && !d.clinicLocation) return false;

      return true;
    });

    // Sort
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'fee_asc') result.sort((a, b) => (Number(a.consultationFee) || 0) - (Number(b.consultationFee) || 0));
    else if (sortBy === 'fee_desc') result.sort((a, b) => (Number(b.consultationFee) || 0) - (Number(a.consultationFee) || 0));

    return result;
  }, [doctors, searchTerm, selectedSpecialty, selectedCity, maxFee, absoluteMaxFee, hasLocation, sortBy]);

  const handleBookAppointment = (doctor: Doctor) => {
    navigate(`/appointments?doctorId=${doctor.id}&doctorName=${encodeURIComponent(doctor.name)}&tab=schedule`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t('findDoctor:title')}</h1>
          <p className="text-muted-foreground">{t('findDoctor:description')}</p>
        </div>

        {/* Search + Sort + Filter bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('findDoctor:searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="fee_asc">Fee: Low to High</SelectItem>
              <SelectItem value="fee_desc">Fee: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filters
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Specialty */}
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All specialties</SelectItem>
                      {specialties.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cities</SelectItem>
                      {TUNISIAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Max fee */}
                <div className="space-y-3">
                  <Label>Max Consultation Fee: <span className="font-semibold">{maxFee} TND</span></Label>
                  <Slider
                    min={0}
                    max={absoluteMaxFee || 500}
                    step={10}
                    value={[maxFee]}
                    onValueChange={([v]) => setMaxFee(v)}
                  />
                </div>

                {/* Has location */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="has-location">Has clinic location</Label>
                  <Switch
                    id="has-location"
                    checked={hasLocation}
                    onCheckedChange={setHasLocation}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Result count */}
        <p className="text-sm text-muted-foreground">
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="ml-2 text-primary hover:underline text-xs">
              Clear filters
            </button>
          )}
        </p>

        {/* Doctor cards */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64">
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-5">
              <UserSearch className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold">{t('findDoctor:noDoctors')}</h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-sm">
              {activeFilterCount > 0
                ? "No doctors match your current filters. Try broadening your search."
                : t('findDoctor:tryDifferent')}
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear filters
                </Button>
              )}
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  <Search className="h-4 w-4 mr-2" />
                  Clear search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {doctor.avatarBase64 ? (
                      <img src={doctor.avatarBase64} alt={doctor.name} className="h-12 w-12 rounded-full object-cover border" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {doctor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{doctor.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">{doctor.specialty}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {doctor.practiceType && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{
                        doctor.practiceType === 'hospital' ? '🏥 Hospital' :
                        doctor.practiceType === 'clinic' ? '🏨 Clinic' :
                        doctor.practiceType === 'private_cabinet' ? '🚪 Private Cabinet' :
                        doctor.practiceType === 'teleconsultation' ? '💻 Teleconsultation Only' :
                        doctor.practiceType === 'home_visits' ? '🏠 Home Visits' :
                        '📍 ' + doctor.practiceType
                      }</span>
                    </div>
                  )}
                  {doctor.clinicLocation && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      <span className="truncate">{doctor.clinicLocation}</span>
                    </div>
                  )}
                  {doctor.experience && (
                    <p className="text-sm text-muted-foreground">{doctor.experience} years experience</p>
                  )}
                  {doctor.consultationFee && (
                    <p className="text-sm font-semibold text-primary">{doctor.consultationFee} TND / session</p>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    {(doctor.clinicLocation || doctor.clinicLat) && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocationDoctor(doctor)}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        See Location
                      </Button>
                    )}
                    <Button className="w-full" onClick={() => handleBookAppointment(doctor)}>
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

      {/* Location dialog */}
      <Dialog open={!!locationDoctor} onOpenChange={(open) => !open && setLocationDoctor(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              {locationDoctor?.name} — Clinic Location
            </DialogTitle>
          </DialogHeader>
          {locationDoctor && (
            <div className="px-6 pb-6">
              <RouteMap
                doctorName={locationDoctor.name}
                doctorAddress={locationDoctor.clinicLocation || ''}
                doctorLat={locationDoctor.clinicLat}
                doctorLng={locationDoctor.clinicLng}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FindDoctor;
