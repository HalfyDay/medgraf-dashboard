export type DoctorDirectoryEntry = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  specialties: string[];
  photoUrl?: string | null;
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
