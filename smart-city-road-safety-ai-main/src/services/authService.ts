import {
  DbStatusResponse,
  LoginResponse,
  SendOtpResponse,
  UserProfile,
  UserLocationRecord,
  VerifyOtpResponse,
} from '../types/auth';

const STORAGE_KEY_USER = 'smart_city_user_session';

export const authService = {
  // Get active session from localStorage
  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Set active session in localStorage
  setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  },

  // Direct Login without OTP
  async login(mobileNumber: string, email: string): Promise<LoginResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }

    if (data.user) {
      this.setCurrentUser(data.user);
    }
    return data;
  },

  // 1. Send / Generate OTP
  async sendOtp(mobileNumber: string, email: string): Promise<SendOtpResponse> {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to generate OTP');
    }
    return data;
  },

  // 2. Verify OTP
  async verifyOtp(mobileNumber: string, email: string, otp: string): Promise<VerifyOtpResponse> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, email, otp }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid or expired OTP');
    }

    if (data.user) {
      this.setCurrentUser(data.user);
    }
    return data;
  },

  // 3. Logout
  logout() {
    this.setCurrentUser(null);
  },

  // 4. Save Location Choice to Backend Database
  async saveLocationChoice(payload: {
    userId: string;
    mobileNumber: string;
    email: string;
    currentLocation: string;
    destination: string;
    speed: number;
    vehicleType: string;
    weatherCondition: string;
    surfaceQuality: string;
    riskLevel: string;
    accidentProbabilityScore: number;
    alternateRouteCorridor?: string;
  }): Promise<UserLocationRecord> {
    const res = await fetch('/api/locations/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save location to backend');
    }
    return data.record;
  },

  // 5. Get Location History from Backend Database
  async getLocationHistory(userId: string): Promise<UserLocationRecord[]> {
    const res = await fetch(`/api/locations/history?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch location history');
    }
    return data.history || [];
  },

  // 6. Clear Location History
  async clearLocationHistory(userId: string): Promise<void> {
    const res = await fetch('/api/locations/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to clear history');
    }
  },

  // 7. Get Database Status (MongoDB / Resilient Store)
  async getDatabaseStatus(): Promise<DbStatusResponse> {
    const res = await fetch('/api/db/status');
    const data = await res.json();
    return data;
  },
};
