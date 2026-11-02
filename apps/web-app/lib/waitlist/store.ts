import fs from 'fs';
import path from 'path';

export interface WaitlistRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  institution?: string;
  createdAt: string;
  ip?: string;
}

export interface WaitlistStore {
  add(record: Omit<WaitlistRecord, 'id' | 'createdAt'>): Promise<WaitlistRecord>;
  findByEmail(email: string): Promise<WaitlistRecord | null>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'waitlist.json');

class FileWaitlistStore implements WaitlistStore {
  private ensureStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      }
    } catch (e) {
      // ignore
    }
  }

  async add(record: Omit<WaitlistRecord, 'id' | 'createdAt'>): Promise<WaitlistRecord> {
    this.ensureStore();
    const newRecord: WaitlistRecord = {
      ...record,
      id: `wl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    try {
      let records: WaitlistRecord[] = [];
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        records = JSON.parse(content);
      }
      records.push(newRecord);
      fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    } catch (e) {
      console.warn('File storage fallback write failed:', e);
    }

    return newRecord;
  }

  async findByEmail(email: string): Promise<WaitlistRecord | null> {
    this.ensureStore();
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const records: WaitlistRecord[] = JSON.parse(content);
        return records.find((r) => r.email.toLowerCase() === email.toLowerCase()) || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }
}

export const waitlistStore = new FileWaitlistStore();
