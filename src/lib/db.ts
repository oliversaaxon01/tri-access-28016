// IndexedDB utilities for authentication and user management
const DB_NAME = 'AuthSystemDB';
const DB_VERSION = 4;
const USERS_STORE = 'users';
const SESSIONS_STORE = 'sessions';
const CHALLENGES_STORE = 'challenges';
const MATCHES_STORE = 'matches';
const MESSAGES_STORE = 'messages';
const PROFILES_STORE = 'profiles';
const MATCHING_CONFIG_STORE = 'matchingConfig';
const MATCHING_EVENTS_STORE = 'matchingEvents';
const NOTIFICATIONS_STORE = 'notifications';

export type UserRole = 'admin' | 'empresa' | 'experto';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  status: 'pending' | 'approved' | 'suspended' | 'deleted';
  createdAt: number;
}

export interface Session {
  userId: string;
  token: string;
  createdAt: number;
}

export interface Challenge {
  id: string;
  empresaId: string;
  title: string;
  description: string;
  category: string;
  categories: string[];
  budget: string;
  deadline: string;
  status: 'active' | 'in_progress' | 'completed';
  createdAt: number;
}

export interface Match {
  id: string;
  challengeId: string;
  empresaId: string;
  expertoId: string;
  empresaInterested: boolean;
  expertoInterested: boolean;
  status: 'potential' | 'pending' | 'matched' | 'rejected';
  createdAt: number;
  matchScore?: number;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: number;
}

export interface ExpertProfile {
  userId: string;
  expertise: string[];
  categories: string[];
  experience: string;
  availability: string;
  hourlyRate: string;
  bio: string;
  validated: boolean;
  updatedAt: number;
}

export interface MatchingConfig {
  id: string;
  weights: {
    expertise: number;
    budget: number;
    deadline: number;
    availability: number;
  };
  threshold: number;
  categories: string[];
  updatedAt: number;
}

export interface MatchingEvent {
  id: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  matchesCreated: number;
  createdBy: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  targetRole?: UserRole;
  createdBy: string;
  createdAt: number;
}

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const userStore = db.createObjectStore(USERS_STORE, { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('role', 'role', { unique: false });
        }

        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: 'token' });
        }

        if (!db.objectStoreNames.contains(CHALLENGES_STORE)) {
          const challengeStore = db.createObjectStore(CHALLENGES_STORE, { keyPath: 'id' });
          challengeStore.createIndex('empresaId', 'empresaId', { unique: false });
          challengeStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(MATCHES_STORE)) {
          const matchStore = db.createObjectStore(MATCHES_STORE, { keyPath: 'id' });
          matchStore.createIndex('challengeId', 'challengeId', { unique: false });
          matchStore.createIndex('empresaId', 'empresaId', { unique: false });
          matchStore.createIndex('expertoId', 'expertoId', { unique: false });
          matchStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const messageStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
          messageStore.createIndex('matchId', 'matchId', { unique: false });
          messageStore.createIndex('senderId', 'senderId', { unique: false });
        }

        if (!db.objectStoreNames.contains(PROFILES_STORE)) {
          db.createObjectStore(PROFILES_STORE, { keyPath: 'userId' });
        }

        if (!db.objectStoreNames.contains(MATCHING_CONFIG_STORE)) {
          db.createObjectStore(MATCHING_CONFIG_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(MATCHING_EVENTS_STORE)) {
          const eventsStore = db.createObjectStore(MATCHING_EVENTS_STORE, { keyPath: 'id' });
          eventsStore.createIndex('status', 'status', { unique: false });
          eventsStore.createIndex('createdBy', 'createdBy', { unique: false });
        }

        if (!db.objectStoreNames.contains(NOTIFICATIONS_STORE)) {
          const notifStore = db.createObjectStore(NOTIFICATIONS_STORE, { keyPath: 'id' });
          notifStore.createIndex('targetRole', 'targetRole', { unique: false });
          notifStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (!this.db) await this.init();

    // Check if admin already exists
    if (user.role === 'admin') {
      const existingAdmin = await this.getUserByRole('admin');
      if (existingAdmin) {
        throw new Error('Ya existe un administrador en el sistema');
      }
    }

    // Check if email already exists
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
      throw new Error('Este email ya está registrado');
    }

    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      status: user.role === 'admin' ? 'approved' : 'pending',
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.add(newUser);

      request.onsuccess = () => resolve(newUser);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByRole(role: UserRole): Promise<User | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const index = store.index('role');
      const request = index.get(role);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async createSession(userId: string): Promise<string> {
    if (!this.db) await this.init();

    const token = crypto.randomUUID();
    const session: Session = {
      userId,
      token,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.add(session);

      request.onsuccess = () => resolve(token);
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(token: string): Promise<Session | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(token);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(token: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.delete(token);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
