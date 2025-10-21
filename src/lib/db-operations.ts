import { db, Challenge, Match, Message, ExpertProfile, User, MatchingConfig, MatchingEvent, Notification } from './db';

// Challenge operations
export const createChallenge = async (challenge: Omit<Challenge, 'id' | 'createdAt'>): Promise<Challenge> => {
  await db.init();
  const newChallenge: Challenge = {
    ...challenge,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['challenges'], 'readwrite');
    const store = transaction.objectStore('challenges');
    const request = store.add(newChallenge);

    request.onsuccess = () => resolve(newChallenge);
    request.onerror = () => reject(request.error);
  });
};

export const getChallengesByEmpresa = async (empresaId: string): Promise<Challenge[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['challenges'], 'readonly');
    const store = transaction.objectStore('challenges');
    const index = store.index('empresaId');
    const request = index.getAll(empresaId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getAllActiveChallenges = async (): Promise<Challenge[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['challenges'], 'readonly');
    const store = transaction.objectStore('challenges');
    const index = store.index('status');
    const request = index.getAll('active');

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Match operations
export const createMatch = async (match: Omit<Match, 'id' | 'createdAt'>): Promise<Match> => {
  await db.init();
  const newMatch: Match = {
    ...match,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matches'], 'readwrite');
    const store = transaction.objectStore('matches');
    const request = store.add(newMatch);

    request.onsuccess = () => resolve(newMatch);
    request.onerror = () => reject(request.error);
  });
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<void> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matches'], 'readwrite');
    const store = transaction.objectStore('matches');
    const getRequest = store.get(matchId);

    getRequest.onsuccess = () => {
      const match = getRequest.result;
      if (match) {
        const updatedMatch = { ...match, ...updates };
        const putRequest = store.put(updatedMatch);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Match not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getMatchesByEmpresa = async (empresaId: string): Promise<Match[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matches'], 'readonly');
    const store = transaction.objectStore('matches');
    const index = store.index('empresaId');
    const request = index.getAll(empresaId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getMatchesByExperto = async (expertoId: string): Promise<Match[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matches'], 'readonly');
    const store = transaction.objectStore('matches');
    const index = store.index('expertoId');
    const request = index.getAll(expertoId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Message operations
export const createMessage = async (message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> => {
  await db.init();
  const newMessage: Message = {
    ...message,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const request = store.add(newMessage);

    request.onsuccess = () => resolve(newMessage);
    request.onerror = () => reject(request.error);
  });
};

export const getMessagesByMatch = async (matchId: string): Promise<Message[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('matchId');
    const request = index.getAll(matchId);

    request.onsuccess = () => {
      const messages = request.result || [];
      messages.sort((a, b) => a.createdAt - b.createdAt);
      resolve(messages);
    };
    request.onerror = () => reject(request.error);
  });
};

// Profile operations
export const saveExpertProfile = async (profile: ExpertProfile): Promise<void> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    const request = store.put({ ...profile, updatedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getExpertProfile = async (userId: string): Promise<ExpertProfile | null> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['profiles'], 'readonly');
    const store = transaction.objectStore('profiles');
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getChallengeById = async (challengeId: string): Promise<Challenge | null> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['challenges'], 'readonly');
    const store = transaction.objectStore('challenges');
    const request = store.get(challengeId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// Admin operations
export const getAllUsers = async (): Promise<User[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const updateUserStatus = async (userId: string, status: User['status']): Promise<void> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const getRequest = store.get(userId);

    getRequest.onsuccess = () => {
      const user = getRequest.result;
      if (user) {
        const updatedUser = { ...user, status };
        const putRequest = store.put(updatedUser);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('User not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const updateChallengeStatus = async (challengeId: string, status: Challenge['status']): Promise<void> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['challenges'], 'readwrite');
    const store = transaction.objectStore('challenges');
    const getRequest = store.get(challengeId);

    getRequest.onsuccess = () => {
      const challenge = getRequest.result;
      if (challenge) {
        const updatedChallenge = { ...challenge, status };
        const putRequest = store.put(updatedChallenge);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Challenge not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const validateExpertProfile = async (userId: string, validated: boolean): Promise<void> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    const getRequest = store.get(userId);

    getRequest.onsuccess = () => {
      const profile = getRequest.result;
      if (profile) {
        const updatedProfile = { ...profile, validated, updatedAt: Date.now() };
        const putRequest = store.put(updatedProfile);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Profile not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Matching config operations
export const saveMatchingConfig = async (config: Omit<MatchingConfig, 'id' | 'updatedAt'>): Promise<MatchingConfig> => {
  await db.init();

  const configId = 'default';
  const newConfig: MatchingConfig = {
    ...config,
    id: configId,
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matchingConfig'], 'readwrite');
    const store = transaction.objectStore('matchingConfig');
    const request = store.put(newConfig);

    request.onsuccess = () => resolve(newConfig);
    request.onerror = () => reject(request.error);
  });
};

export const getMatchingConfig = async (): Promise<MatchingConfig | null> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matchingConfig'], 'readonly');
    const store = transaction.objectStore('matchingConfig');
    const request = store.get('default');

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// Matching event operations
export const createMatchingEvent = async (event: Omit<MatchingEvent, 'id'>): Promise<MatchingEvent> => {
  await db.init();

  const newEvent: MatchingEvent = {
    ...event,
    id: crypto.randomUUID(),
  };

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matchingEvents'], 'readwrite');
    const store = transaction.objectStore('matchingEvents');
    const request = store.add(newEvent);

    request.onsuccess = () => resolve(newEvent);
    request.onerror = () => reject(request.error);
  });
};

export const updateMatchingEvent = async (eventId: string, updates: Partial<MatchingEvent>): Promise<void> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matchingEvents'], 'readwrite');
    const store = transaction.objectStore('matchingEvents');
    const getRequest = store.get(eventId);

    getRequest.onsuccess = () => {
      const event = getRequest.result;
      if (event) {
        const updatedEvent = { ...event, ...updates };
        const putRequest = store.put(updatedEvent);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Event not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getAllMatchingEvents = async (): Promise<MatchingEvent[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matchingEvents'], 'readonly');
    const store = transaction.objectStore('matchingEvents');
    const request = store.getAll();

    request.onsuccess = () => {
      const events = request.result || [];
      events.sort((a, b) => (b.scheduledAt || b.startedAt || 0) - (a.scheduledAt || a.startedAt || 0));
      resolve(events);
    };
    request.onerror = () => reject(request.error);
  });
};

// Notification operations
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
  await db.init();

  const newNotification: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    const request = store.add(newNotification);

    request.onsuccess = () => resolve(newNotification);
    request.onerror = () => reject(request.error);
  });
};

export const getAllNotifications = async (): Promise<Notification[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const request = store.getAll();

    request.onsuccess = () => {
      const notifications = request.result || [];
      notifications.sort((a, b) => b.createdAt - a.createdAt);
      resolve(notifications);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllMatches = async (): Promise<Match[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['matches'], 'readonly');
    const store = transaction.objectStore('matches');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getAllChallenges = async (): Promise<Challenge[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['challenges'], 'readonly');
    const store = transaction.objectStore('challenges');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const getAllProfiles = async (): Promise<ExpertProfile[]> => {
  await db.init();

  return new Promise((resolve, reject) => {
    const transaction = (db as any).db!.transaction(['profiles'], 'readonly');
    const store = transaction.objectStore('profiles');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};
