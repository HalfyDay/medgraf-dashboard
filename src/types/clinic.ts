export type DoctorDirectoryEntry = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  numberComments?: number | null;
  institution?: string | null;
  experience?: number | null;
  childrenAppointment?: boolean | null;
  specialties: string[];
  photoUrl?: string | null;
  services?: DoctorServiceEntry[];
};

export type DoctorServiceEntry = {
  id: string;
  name: string;
  durationMinutes?: number | null;
  price?: number | null;
  currency?: string | null;
};

export type ServiceDirectoryEntry = {
  id: string;
  category: string;
  subcategory?: string | null;
  name: string;
  price?: number | null;
  currency?: string | null;
  durationMinutes?: number | null;
};
