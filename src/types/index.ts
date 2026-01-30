export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'owner' | 'pet_master';
  avatar_url: string | null;
  identity_verified: boolean;
  identity_verification_status: string;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  size: 'small' | 'medium' | 'large';
  age: number | null;
  special_notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface PetMaster {
  id: string;
  bio: string | null;
  hourly_rate: number;
  service_radius: number;
  is_available: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  rating: number;
  total_walks: number;
  verified: boolean;
  service_type: 'walker' | 'hotel' | 'vet';
  specialties: string[];
  facilities: string[];
  capacity: number;
  emergency_service: boolean;
  price_per_night: number | null;
}

export interface Booking {
  id: string;
  owner_id: string;
  pet_master_id: string | null;
  pet_id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  duration_minutes: number;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  total_amount: number;
  special_instructions: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  has_rating: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  is_default: boolean;
  card_last4: string | null;
  card_brand: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  stripe_payment_method_id: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  booking_id: string;
  pet_master_id: string;
  owner_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
