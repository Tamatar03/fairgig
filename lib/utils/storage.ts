import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ProctoringDB extends DBSchema {
  frames: {
    key: number;
    value: {
      id?: number;
      sessionId: string;
      sequenceNumber: number;
      timestamp: string;
      frameData: string;
      synced: boolean;
    };
    indexes: { 'by-session': string; 'by-synced': number };
  };
  events: {
    key: number;
    value: {
      id?: number;
      sessionId: string;
      type: string;
      timestamp: string;
      data: any;
      synced: boolean;
    };
    indexes: { 'by-session': string; 'by-synced': number };
  };
}

let dbInstance: IDBPDatabase<ProctoringDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ProctoringDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<ProctoringDB>('proctoring-db', 1, {
    upgrade(db) {
      // Frames store
      const frameStore = db.createObjectStore('frames', {
        keyPath: 'id',
        autoIncrement: true,
      });
      frameStore.createIndex('by-session', 'sessionId');
      frameStore.createIndex('by-synced', 'synced');
      
      // Events store
      const eventStore = db.createObjectStore('events', {
        keyPath: 'id',
        autoIncrement: true,
      });
      eventStore.createIndex('by-session', 'sessionId');
      eventStore.createIndex('by-synced', 'synced');
    },
  });
  
  return dbInstance;
}

export async function saveFrame(
  sessionId: string,
  sequenceNumber: number,
  frameData: string
): Promise<void> {
  const db = await getDB();
  await db.add('frames', {
    sessionId,
    sequenceNumber,
    timestamp: new Date().toISOString(),
    frameData,
    synced: false,
  });
}

export async function getUnsyncedFrames(sessionId: string, limit: number = 50) {
  const db = await getDB();
  const tx = db.transaction('frames', 'readonly');
  const index = tx.store.index('by-synced');
  
  const frames = await index.getAll(IDBKeyRange.only(0), limit);
  return frames.filter(frame => frame.sessionId === sessionId);
}

export async function markFramesSynced(frameIds: number[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('frames', 'readwrite');
  
  for (const id of frameIds) {
    const frame = await tx.store.get(id);
    if (frame) {
      frame.synced = true;
      await tx.store.put(frame);
    }
  }
  
  await tx.done;
}

export async function saveEvent(
  sessionId: string,
  type: string,
  data: any
): Promise<void> {
  const db = await getDB();
  await db.add('events', {
    sessionId,
    type,
    timestamp: new Date().toISOString(),
    data,
    synced: false,
  });
}

export async function getUnsyncedEvents(sessionId: string) {
  const db = await getDB();
  const tx = db.transaction('events', 'readonly');
  const index = tx.store.index('by-synced');
  
  const events = await index.getAll(IDBKeyRange.only(0));
  return events.filter(event => event.sessionId === sessionId);
}

export async function markEventsSynced(eventIds: number[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('events', 'readwrite');
  
  for (const id of eventIds) {
    const event = await tx.store.get(id);
    if (event) {
      event.synced = true;
      await tx.store.put(event);
    }
  }
  
  await tx.done;
}

export async function clearSessionData(sessionId: string): Promise<void> {
  const db = await getDB();
  
  // Clear frames
  const frameTx = db.transaction('frames', 'readwrite');
  const frameIndex = frameTx.store.index('by-session');
  let frameCursor = await frameIndex.openCursor(IDBKeyRange.only(sessionId));
  
  while (frameCursor) {
    await frameCursor.delete();
    frameCursor = await frameCursor.continue();
  }
  
  await frameTx.done;
  
  // Clear events
  const eventTx = db.transaction('events', 'readwrite');
  const eventIndex = eventTx.store.index('by-session');
  let eventCursor = await eventIndex.openCursor(IDBKeyRange.only(sessionId));
  
  while (eventCursor) {
    await eventCursor.delete();
    eventCursor = await eventCursor.continue();
  }
  
  await eventTx.done;
}

export async function getStorageStats() {
  const db = await getDB();
  const frameCount = await db.count('frames');
  const eventCount = await db.count('events');
  
  return {
    frames: frameCount,
    events: eventCount,
  };
}
