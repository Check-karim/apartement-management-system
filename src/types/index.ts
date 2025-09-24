// User and Authentication Types
export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'manager';
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'manager';
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

// Building Types
export interface Building {
  id: number;
  name: string;
  address: string;
  manager_id?: number;
  manager?: User;
  total_apartments: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBuildingData {
  name: string;
  address: string;
  manager_id?: number;
}

// Apartment Types
export interface Apartment {
  id: number;
  building_id: number;
  building?: Building;
  apartment_number: string;
  floor_number?: number;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  deposit_amount: number;
  square_feet?: number;
  is_occupied: boolean;
  lease_start_date?: string;
  lease_end_date?: string;
  tenant_name?: string;
  tenant_phone?: string;
  tenant_email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApartmentData {
  building_id: number;
  apartment_number: string;
  floor_number?: number;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  deposit_amount: number;
  square_feet?: number;
  tenant_name?: string;
  tenant_phone?: string;
  tenant_email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  lease_start_date?: string;
  lease_end_date?: string;
}

// Notification Types
export interface Notification {
  id: number;
  apartment_id?: number;
  building_id?: number;
  apartment?: Apartment;
  building?: Building;
  title: string;
  message: string;
  notification_type: 'rent_due' | 'rent_overdue' | 'maintenance' | 'general' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_sent: boolean;
  sent_at?: string;
  created_by?: number;
  created_at: string;
}

export interface CreateNotificationData {
  apartment_id?: number;
  building_id?: number;
  title: string;
  message: string;
  notification_type: 'rent_due' | 'rent_overdue' | 'maintenance' | 'general' | 'emergency';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// Rent Payment Types
export interface RentPayment {
  id: number;
  apartment_id: number;
  apartment?: Apartment;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'online';
  receipt_number?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
}

export interface CreateRentPaymentData {
  apartment_id: number;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'online';
  receipt_number?: string;
  notes?: string;
}

// Maintenance Request Types
export interface MaintenanceRequest {
  id: number;
  apartment_id: number;
  apartment?: Apartment;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reported_by?: string;
  assigned_to?: number;
  assigned_user?: User;
  estimated_cost?: number;
  actual_cost?: number;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceRequestData {
  apartment_id: number;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  reported_by?: string;
  estimated_cost?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface SearchFilters {
  building_id?: number;
  is_occupied?: boolean;
  rent_min?: number;
  rent_max?: number;
  bedrooms?: number;
  bathrooms?: number;
}

// UI Component Types
export interface DropdownOption {
  value: string | number;
  label: string;
}

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

// App State Types
export interface AppState {
  isOnline: boolean;
  showInstallPrompt: boolean;
  user: User | null;
}

// Database Types
export interface DatabaseConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

// NextAuth Types
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      username: string;
      role: 'admin' | 'manager';
      full_name: string;
      email: string;
    };
  }

  interface User {
    id: number;
    username: string;
    role: 'admin' | 'manager';
    full_name: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    username: string;
    role: 'admin' | 'manager';
    full_name: string;
    email: string;
  }
} 