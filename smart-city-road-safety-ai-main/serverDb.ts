import { MongoClient, Db, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserRecord {
  _id?: ObjectId | string;
  userId: string;
  mobileNumber: string;
  email: string;
  createdAt: string;
  lastLoginAt: string;
  totalLocationsChosen?: number;
}

export interface OtpRecord {
  _id?: ObjectId | string;
  mobileNumber: string;
  email: string;
  otp: string;
  createdAt: string;
  expiresAt: string;
  verified: boolean;
}

export interface UserLocationHistoryRecord {
  _id?: ObjectId | string;
  id: string;
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
  timestamp: string;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_city_safety';
const DB_NAME = 'smart_city_safety';

// Local storage fallback file
const FALLBACK_DIR = path.resolve(__dirname, '.db_data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'smart_city_store.json');

interface FallbackStore {
  users: UserRecord[];
  otp_verifications: OtpRecord[];
  user_location_history: UserLocationHistoryRecord[];
}

let client: MongoClient | null = null;
let db: Db | null = null;
let isMongoConnected = false;
let mongoConnectionError: string | null = null;

// Initialize file fallback store
function loadFallbackStore(): FallbackStore {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading fallback store:', err);
  }
  return { users: [], otp_verifications: [], user_location_history: [] };
}

function saveFallbackStore(store: FallbackStore) {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing fallback store:', err);
  }
}

let inMemoryStore: FallbackStore = loadFallbackStore();

// Connect to MongoDB
export async function initDatabase(): Promise<{ isConnected: boolean; uri: string; error?: string }> {
  const timeoutPromise = new Promise<{ isConnected: boolean; uri: string; error: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        isConnected: false,
        uri: MONGODB_URI,
        error: 'Connection check completed. Local daemon not running at localhost:27017, embedded storage active.',
      });
    }, 600);
  });

  const connectPromise = (async () => {
    try {
      console.log(`[Database] Target: ${MONGODB_URI}`);
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 500,
        connectTimeoutMS: 500,
      });
      await client.connect();
      db = client.db(DB_NAME);
      isMongoConnected = true;
      mongoConnectionError = null;
      console.log(`[Database] Successfully connected to MongoDB at ${MONGODB_URI}`);

      // Create indexes safely
      try {
        await db.collection('users').createIndex({ userId: 1 }, { unique: true });
        await db.collection('otp_verifications').createIndex({ mobileNumber: 1, email: 1 });
        await db.collection('user_location_history').createIndex({ userId: 1, timestamp: -1 });
      } catch (idxErr) {
        console.warn('[Database] Index creation notice:', idxErr);
      }

      return { isConnected: true, uri: MONGODB_URI };
    } catch (error: any) {
      isMongoConnected = false;
      mongoConnectionError = error.message || String(error);
      return { isConnected: false, uri: MONGODB_URI, error: mongoConnectionError || undefined };
    }
  })();

  const result = await Promise.race([connectPromise, timeoutPromise]);
  if (!result.isConnected) {
    isMongoConnected = false;
    mongoConnectionError = result.error || 'Local MongoDB offline';
    console.log(`[Database] Note: ${mongoConnectionError}. Using resilient JSON document store.`);
  }
  return result;
}

// Database Status
export function getDatabaseStatus() {
  return {
    targetUri: MONGODB_URI,
    databaseName: DB_NAME,
    isMongoConnected,
    connectionError: mongoConnectionError,
    engine: isMongoConnected ? 'MongoDB (Native Daemon)' : 'Embedded Resilient JSON Storage (MongoDB Compatible)',
    totalUsers: isMongoConnected ? null : inMemoryStore.users.length,
    totalLocationRecords: isMongoConnected ? null : inMemoryStore.user_location_history.length,
  };
}

// 1. Generate & Save OTP
export async function saveOtp(mobileNumber: string, email: string, otp: string): Promise<OtpRecord> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

  const record: OtpRecord = {
    mobileNumber: mobileNumber.trim(),
    email: email.trim().toLowerCase(),
    otp,
    createdAt: now.toISOString(),
    expiresAt,
    verified: false,
  };

  if (isMongoConnected && db) {
    try {
      await db.collection<OtpRecord>('otp_verifications').insertOne({ ...record });
      return record;
    } catch (err) {
      console.error('[Database] Mongo saveOtp error, saving to fallback:', err);
    }
  }

  // Fallback
  inMemoryStore.otp_verifications = inMemoryStore.otp_verifications.filter(
    (o) => !(o.mobileNumber === record.mobileNumber && o.email === record.email),
  );
  inMemoryStore.otp_verifications.push(record);
  saveFallbackStore(inMemoryStore);
  return record;
}

// 2. Verify OTP
export async function verifyOtp(mobileNumber: string, email: string, enteredOtp: string): Promise<{ valid: boolean; message: string }> {
  const cleanMobile = mobileNumber.trim();
  const cleanEmail = email.trim().toLowerCase();
  const nowIso = new Date().toISOString();

  if (isMongoConnected && db) {
    try {
      const match = await db.collection<OtpRecord>('otp_verifications')
        .find({
          mobileNumber: cleanMobile,
          email: cleanEmail,
          verified: false,
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

      if (!match || match.length === 0) {
        return { valid: false, message: 'No OTP generated for this mobile and email combination.' };
      }

      const activeOtp = match[0];
      if (activeOtp.expiresAt < nowIso) {
        return { valid: false, message: 'OTP has expired. Please generate a new one.' };
      }

      if (activeOtp.otp !== enteredOtp.trim()) {
        return { valid: false, message: 'Invalid OTP code. Please check and try again.' };
      }

      // Mark verified
      await db.collection('otp_verifications').updateOne(
        { _id: activeOtp._id as any },
        { $set: { verified: true } },
      );

      return { valid: true, message: 'OTP verified successfully.' };
    } catch (err) {
      console.error('[Database] Mongo verifyOtp error, using fallback:', err);
    }
  }

  // Fallback
  const found = inMemoryStore.otp_verifications
    .filter((o) => o.mobileNumber === cleanMobile && o.email === cleanEmail && !o.verified)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!found) {
    return { valid: false, message: 'No OTP generated for this mobile and email combination.' };
  }

  if (found.expiresAt < nowIso) {
    return { valid: false, message: 'OTP has expired. Please generate a new one.' };
  }

  if (found.otp !== enteredOtp.trim()) {
    return { valid: false, message: 'Invalid OTP code. Please check and try again.' };
  }

  found.verified = true;
  saveFallbackStore(inMemoryStore);
  return { valid: true, message: 'OTP verified successfully.' };
}

// 3. Upsert User Login Profile
export async function upsertUser(mobileNumber: string, email: string): Promise<UserRecord> {
  const cleanMobile = mobileNumber.trim();
  const cleanEmail = email.trim().toLowerCase();
  const userId = `usr_${cleanMobile.replace(/\D/g, '') || Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  if (isMongoConnected && db) {
    try {
      const existing = await db.collection<UserRecord>('users').findOne({
        $or: [{ mobileNumber: cleanMobile }, { email: cleanEmail }],
      });

      if (existing) {
        await db.collection('users').updateOne(
          { _id: existing._id as any },
          { $set: { lastLoginAt: now, mobileNumber: cleanMobile, email: cleanEmail } },
        );
        return {
          ...existing,
          lastLoginAt: now,
          mobileNumber: cleanMobile,
          email: cleanEmail,
        };
      } else {
        const newUser: UserRecord = {
          userId,
          mobileNumber: cleanMobile,
          email: cleanEmail,
          createdAt: now,
          lastLoginAt: now,
          totalLocationsChosen: 0,
        };
        await db.collection('users').insertOne(newUser as any);
        return newUser;
      }
    } catch (err) {
      console.error('[Database] Mongo upsertUser error, using fallback:', err);
    }
  }

  // Fallback
  let user = inMemoryStore.users.find(
    (u) => u.mobileNumber === cleanMobile || u.email === cleanEmail,
  );

  if (user) {
    user.lastLoginAt = now;
    user.mobileNumber = cleanMobile;
    user.email = cleanEmail;
  } else {
    user = {
      userId,
      mobileNumber: cleanMobile,
      email: cleanEmail,
      createdAt: now,
      lastLoginAt: now,
      totalLocationsChosen: 0,
    };
    inMemoryStore.users.push(user);
  }

  saveFallbackStore(inMemoryStore);
  return user;
}

// 4. Save Location Chosen by User
export async function saveUserLocationChoice(data: {
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
}): Promise<UserLocationHistoryRecord> {
  const record: UserLocationHistoryRecord = {
    id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: data.userId,
    mobileNumber: data.mobileNumber,
    email: data.email,
    currentLocation: data.currentLocation,
    destination: data.destination,
    speed: data.speed,
    vehicleType: data.vehicleType,
    weatherCondition: data.weatherCondition,
    surfaceQuality: data.surfaceQuality,
    riskLevel: data.riskLevel,
    accidentProbabilityScore: data.accidentProbabilityScore,
    alternateRouteCorridor: data.alternateRouteCorridor,
    timestamp: new Date().toISOString(),
  };

  if (isMongoConnected && db) {
    try {
      await db.collection<UserLocationHistoryRecord>('user_location_history').insertOne({ ...record });
      await db.collection('users').updateOne(
        { userId: data.userId },
        { $inc: { totalLocationsChosen: 1 } },
      );
      return record;
    } catch (err) {
      console.error('[Database] Mongo saveUserLocationChoice error, using fallback:', err);
    }
  }

  // Fallback
  inMemoryStore.user_location_history.unshift(record);
  const user = inMemoryStore.users.find((u) => u.userId === data.userId);
  if (user) {
    user.totalLocationsChosen = (user.totalLocationsChosen || 0) + 1;
  }
  saveFallbackStore(inMemoryStore);
  return record;
}

// 5. Get User Location History
export async function getUserLocationHistory(userId: string): Promise<UserLocationHistoryRecord[]> {
  if (isMongoConnected && db) {
    try {
      const records = await db.collection<UserLocationHistoryRecord>('user_location_history')
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();
      return records;
    } catch (err) {
      console.error('[Database] Mongo getUserLocationHistory error, using fallback:', err);
    }
  }

  // Fallback
  return inMemoryStore.user_location_history
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 50);
}

// 6. Clear History for User
export async function clearUserLocationHistory(userId: string): Promise<boolean> {
  if (isMongoConnected && db) {
    try {
      await db.collection('user_location_history').deleteMany({ userId });
      return true;
    } catch (err) {
      console.error('[Database] Mongo clearUserLocationHistory error:', err);
    }
  }

  // Fallback
  inMemoryStore.user_location_history = inMemoryStore.user_location_history.filter(
    (r) => r.userId !== userId,
  );
  saveFallbackStore(inMemoryStore);
  return true;
}
