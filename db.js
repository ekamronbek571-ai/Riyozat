import fs from 'fs';
import path from 'path';
import pg from 'pg';

const DB_FILE = path.resolve('data/db.json');

const defaultGlobalExercises = [
  { 
    id: 'burpees', 
    name: 'Burpi Mashqi 🔥', 
    desc: 'Butun tana mushaklarini chiniqtiradigan jadal kardio mashqi.',
    burnRate: 14, 
    defaultDuration: 60,
    icon: '🔥',
    color: '#ef4444',
    videoUrl: ''
  },
  { 
    id: 'jumping_jacks', 
    name: 'Sakrash (Jumping Jacks) 🏃', 
    desc: 'Yurak urishini tezlashtiradigan va yog‘ eritishni boshlovchi kardio.',
    burnRate: 10,
    defaultDuration: 60,
    icon: '🏃',
    color: '#3b82f6',
    videoUrl: ''
  },
  { 
    id: 'mountain_climbers', 
    name: 'Alpinist (Climbers) 🧗', 
    desc: 'Qorin pressi va oyoqlarni mustahkamlovchi jadal harakat.',
    burnRate: 12,
    defaultDuration: 60,
    icon: '🧗',
    color: '#10b981',
    videoUrl: ''
  },
  { 
    id: 'plank', 
    name: 'Planka (Core Hold) 🧘', 
    desc: 'Butun tana tayanch mushaklarini chiniqtiruvchi statik mashq.',
    burnRate: 5,
    defaultDuration: 60,
    icon: '🧘',
    color: '#a78bfa',
    videoUrl: ''
  }
];

export class Database {
  constructor() {
    this.pool = null;
    this.isPostgres = false;
    this.cache = { users: {}, globalExercises: defaultGlobalExercises };
  }

  async init() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log("🌐 PostgreSQL Database URL detected. Initializing cloud database...");
      try {
        this.pool = new pg.default.Pool({
          connectionString: dbUrl,
          ssl: {
            rejectUnauthorized: false
          }
        });
        
        // Test connection & create table
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS app_data (
            key VARCHAR(100) PRIMARY KEY,
            val JSONB
          );
        `);
        
        const res = await this.pool.query("SELECT key, val FROM app_data");
        const rows = res.rows;
        
        let foundUsers = false;
        let foundEx = false;
        
        rows.forEach(row => {
          if (row.key === 'users') {
            this.cache.users = row.val;
            foundUsers = true;
          } else if (row.key === 'globalExercises') {
            this.cache.globalExercises = row.val;
            foundEx = true;
          }
        });
        
        if (!foundUsers) {
          console.log("Creating default 'users' row in cloud database...");
          await this.pool.query("INSERT INTO app_data (key, val) VALUES ('users', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(this.cache.users)]);
        }
        if (!foundEx) {
          console.log("Creating default 'globalExercises' row in cloud database...");
          await this.pool.query("INSERT INTO app_data (key, val) VALUES ('globalExercises', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(this.cache.globalExercises)]);
        }
        
        this.isPostgres = true;
        console.log("✅ Cloud PostgreSQL Database initialized and loaded successfully.");
      } catch (err) {
        console.error("❌ Failed to connect to PostgreSQL. Falling back to local json storage.", err);
        this.initLocal();
      }
    } else {
      console.log("📂 No PostgreSQL URL found. Initializing local database file...");
      this.initLocal();
    }
  }

  initLocal() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, globalExercises: defaultGlobalExercises }, null, 2), 'utf-8');
    }
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      this.cache = JSON.parse(data);
      console.log("✅ Local JSON Database loaded successfully.");
    } catch (error) {
      console.error('Error reading database file, resetting cache...', error);
      this.cache = { users: {}, globalExercises: defaultGlobalExercises };
      this.write(this.cache);
    }
  }

  read() {
    return this.cache;
  }

  write(data) {
    this.cache = data;
    if (this.isPostgres && this.pool) {
      // Async background write to cloud DB
      this.pool.query("INSERT INTO app_data (key, val) VALUES ('users', $1) ON CONFLICT (key) DO UPDATE SET val = $1", [JSON.stringify(this.cache.users)])
        .catch(err => console.error("Postgres write users error:", err));
      
      this.pool.query("INSERT INTO app_data (key, val) VALUES ('globalExercises', $1) ON CONFLICT (key) DO UPDATE SET val = $1", [JSON.stringify(this.cache.globalExercises)])
        .catch(err => console.error("Postgres write globalExercises error:", err));
    } else {
      // Sync write to local file
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (error) {
        console.error('Error writing to database file:', error);
        return false;
      }
    }
    return true;
  }

  // Get user data or create if not exists
  getUser(userId, defaultInfo = {}) {
    const id = String(userId);
    
    if (!this.cache.users[id]) {
      this.cache.users[id] = this.createNewUserTemplate(id, defaultInfo);
      if (id === '514578229') {
        this.cache.users[id].role = 'admin';
      }
      this.write(this.cache);
    } else {
      // Ensure backward compatibility & schema upgrades
      let modified = false;
      
      // Auto upgrade 514578229 user to admin
      if (id === '514578229' && this.cache.users[id].role !== 'admin') {
        this.cache.users[id].role = 'admin';
        modified = true;
      }

      if (this.cache.users[id].xp === undefined) {
        this.cache.users[id].xp = 0;
        modified = true;
      }
      if (this.cache.users[id].level === undefined) {
        this.cache.users[id].level = 1;
        modified = true;
      }
      if (!this.cache.users[id].settings) {
        this.cache.users[id].settings = {};
        modified = true;
      }
      if (!this.cache.users[id].settings.budgetLimits) {
        this.cache.users[id].settings.budgetLimits = {
          food: 0, transport: 0, salary: 0, home: 0, entertainment: 0, gift: 0, loan: 0, general: 0
        };
        modified = true;
      }
      if (!this.cache.users[id].cards) {
        this.cache.users[id].cards = [
          { id: "card-1", name: "Naqd Hamyon", balance: 0, type: "cash", cardNumber: "Naqd", color: "purple" },
          { id: "card-2", name: "Uzcard / Humo", balance: 0, type: "uzcard", cardNumber: "8600", color: "blue" },
          { id: "card-savings", name: "Jamg'arma Sandiqcha 🎯", balance: 0, type: "savings", cardNumber: "SAVE", color: "green" }
        ];
        modified = true;
      }
      if (!this.cache.users[id].waterLogs) {
        this.cache.users[id].waterLogs = {};
        modified = true;
      }
      if (this.cache.users[id].parentChatId === undefined) {
        this.cache.users[id].parentChatId = '';
        modified = true;
      }
      if (this.cache.users[id].parentAlertsEnabled === undefined) {
        this.cache.users[id].parentAlertsEnabled = false;
        modified = true;
      }
      if (!this.cache.users[id].calorieLogs) {
        this.cache.users[id].calorieLogs = {};
        modified = true;
      }
      if (!this.cache.users[id].weightLogs) {
        this.cache.users[id].weightLogs = {};
        modified = true;
      }
      if (!this.cache.users[id].recurringTransactions) {
        this.cache.users[id].recurringTransactions = [];
        modified = true;
      }
      if (modified) {
        this.write(this.cache);
      }
    }
    return this.cache.users[id];
  }

  // Save/Update user data
  saveUser(userId, userData) {
    const id = String(userId);
    this.cache.users[id] = { ...this.cache.users[id], ...userData };
    return this.write(this.cache);
  }

  // Get all users (useful for notification scheduler)
  getAllUsers() {
    return Object.values(this.cache.users);
  }

  // Global Exercises CRUD
  getGlobalExercises() {
    if (!this.cache.globalExercises) {
      this.cache.globalExercises = [...defaultGlobalExercises];
      this.write(this.cache);
    }
    return this.cache.globalExercises;
  }

  saveGlobalExercise(exercise) {
    if (!this.cache.globalExercises) {
      this.cache.globalExercises = [...defaultGlobalExercises];
    }
    const idx = this.cache.globalExercises.findIndex(e => e.id === exercise.id);
    if (idx !== -1) {
      this.cache.globalExercises[idx] = { ...this.cache.globalExercises[idx], ...exercise };
    } else {
      this.cache.globalExercises.push(exercise);
    }
    this.write(this.cache);
    return this.cache.globalExercises;
  }

  deleteGlobalExercise(exerciseId) {
    if (this.cache.globalExercises) {
      this.cache.globalExercises = this.cache.globalExercises.filter(e => e.id !== exerciseId);
      this.write(this.cache);
    }
    return this.cache.globalExercises;
  }

  createNewUserTemplate(id, info) {
    return {
      id: id,
      username: info.username || 'user',
      firstName: info.first_name || 'Foydalanuvchi',
      createdAt: new Date().toISOString(),
      xp: 0,
      level: 1,
      role: id === '514578229' ? 'admin' : 'user',
      settings: {
        notificationsEnabled: true,
        language: 'uz',
        mockNotifications: [], // Log of sent notifications for visual review in UI
        budgetLimits: {
          food: 0, transport: 0, salary: 0, home: 0, entertainment: 0, gift: 0, loan: 0, general: 0
        }
      },
      habits: [
        // 5 Daily Prayers
        { id: 'prayer-bomdod', name: 'Bomdod namozi', category: 'namoz', time: '05:00', enabled: true, completedDates: {} },
        { id: 'prayer-peshin', name: 'Peshin namozi', category: 'namoz', time: '13:00', enabled: true, completedDates: {} },
        { id: 'prayer-asr', name: 'Asr namozi', category: 'namoz', time: '17:30', enabled: true, completedDates: {} },
        { id: 'prayer-shom', name: 'Shom namozi', category: 'namoz', time: '19:50', enabled: true, completedDates: {} },
        { id: 'prayer-xufton', name: 'Xufton namozi', category: 'namoz', time: '21:30', enabled: true, completedDates: {} },
        // Sleep habits
        { id: 'sleep-morning', name: 'Ertalabki uyg\'onish', category: 'sleep', time: '06:30', enabled: true, completedDates: {} },
        { id: 'sleep-evening', name: 'Kechki uxlash', category: 'sleep', time: '23:00', enabled: true, completedDates: {} }
      ],
      goals: [
        { id: 'goal-1', title: 'Kunlik 2 litr suv ichish', target: 30, current: 0, unit: 'kun', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 'goal-2', title: 'Kitob o\'qish', target: 15, current: 0, unit: 'sahifa', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ],
      plans: [],
      transactions: [],
      waterLogs: {},
      calorieLogs: {},
      weightLogs: {},
      recurringTransactions: [],
      parentChatId: '',
      parentAlertsEnabled: false,
      cards: [
        { id: "card-1", name: "Naqd Hamyon", balance: 0, type: "cash", cardNumber: "Naqd", color: "purple" },
        { id: "card-2", name: "Uzcard / Humo", balance: 0, type: "uzcard", cardNumber: "8600", color: "blue" },
        { id: "card-savings", name: "Jamg\'arma Sandiqcha 🎯", balance: 0, type: "savings", cardNumber: "SAVE", color: "green" }
      ]
    };
  }
}

export const dbInstance = new Database();
