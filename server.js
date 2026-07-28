import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { dbInstance } from './db.js';
import { startScheduler } from './scheduler.js';
import { bot, sendNotification, isMockMode } from './bot.js';
import { tunnelmole } from 'tunnelmole';
import fs from 'fs';
import https from 'https';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React dev server (port 5173) can talk to Express (port 5000)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve downloaded avatars from data/avatars folder
app.use('/avatars', express.static(path.join(path.resolve(), 'data', 'avatars')));

// Helper to download Telegram user avatar locally
const downloadAvatar = (userId, url, userObject) => {
  try {
    const avatarsDir = path.join(path.resolve(), 'data', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const filePath = path.join(avatarsDir, `${userId}.jpg`);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          userObject.avatar = `/avatars/${userId}.jpg`;
          dbInstance.saveUser(userId, userObject);
          console.log(`✅ Telegram profile photo saved locally for user ${userId}`);
        });
      } else {
        console.error(`Failed to download avatar. Status: ${response.statusCode}`);
      }
    }).on('error', (err) => {
      console.error("Error downloading avatar file:", err.message);
    });
  } catch (e) {
    console.error("Error in downloadAvatar helper:", e);
  }
};

// API: Get bot configuration
app.get('/api/config', (req, res) => {
  res.json({ isMockMode });
});



// API: Get user data (creates new user if doesn't exist)
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  const username = req.query.username || 'user';
  const firstName = req.query.firstName || 'Foydalanuvchi';
  
  const user = dbInstance.getUser(userId, { username, first_name: firstName });

  // If user has no local avatar, fetch and download their Telegram profile picture in background
  if ((!user.avatar || user.avatar.includes('placeholder') || user.avatar === '') && bot && !isMockMode && !isNaN(Number(userId))) {
    try {
      bot.telegram.getUserProfilePhotos(Number(userId), 0, 1)
        .then(photos => {
          if (photos && photos.total_count > 0 && photos.photos[0] && photos.photos[0].length > 0) {
            const photo = photos.photos[0][0]; // 160x160 thumbnail
            const fileId = photo.file_id;
            return bot.telegram.getFileLink(fileId);
          }
          return null;
        })
        .then(url => {
          if (url) {
            const fileUrl = typeof url === 'string' ? url : url.href;
            downloadAvatar(userId, fileUrl, user);
          }
        })
        .catch(err => console.warn("Failed to fetch Telegram profile picture:", err.message));
    } catch (e) {
      console.warn("Failed to initiate Telegram profile photo fetch:", e);
    }
  }
  // Process recurring transactions if any
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  let userModified = false;
  
  if (user.recurringTransactions && user.recurringTransactions.length > 0) {
    if (!user.transactions) user.transactions = [];
    user.recurringTransactions.forEach(rt => {
      if (rt.lastExecutedMonth !== currentMonthStr) {
        const newTx = {
          id: 'tx-rec-' + Math.random().toString(36).substring(2, 9),
          amount: Number(rt.amount) || 0,
          description: rt.description + " (Avto-to'lov)",
          type: rt.type || 'expense',
          category: rt.category || 'general',
          cardId: rt.cardId || null,
          date: new Date().toISOString(),
          isRecurringExecution: true
        };
        
        user.transactions.push(newTx);
        
        if (newTx.cardId && user.cards) {
          const card = user.cards.find(c => c.id === newTx.cardId);
          if (card) {
            if (newTx.type === 'expense') {
              card.balance -= newTx.amount;
            } else if (newTx.type === 'income') {
              card.balance += newTx.amount;
            }
          }
        }
        
        rt.lastExecutedMonth = currentMonthStr;
        userModified = true;
      }
    });
  }
  
  if (userModified) {
    dbInstance.saveUser(userId, user);
  }

  res.json(user);
});

// API: Save entire user data
app.put('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  const userData = req.body;
  dbInstance.saveUser(userId, userData);
  res.json({ success: true, user: dbInstance.getUser(userId) });
});

// API: Toggle habit completion for a specific date
app.post('/api/user/:userId/habit/:habitId/toggle', (req, res) => {
  const { userId, habitId } = req.params;
  const { date, completed } = req.body; // date in format YYYY-MM-DD
  
  const user = dbInstance.getUser(userId);
  const habit = user.habits.find(h => h.id === habitId);
  
  if (habit) {
    if (!habit.completedDates) {
      habit.completedDates = {};
    }
    
    const wasCompleted = !!habit.completedDates[date];
    if (completed) {
      habit.completedDates[date] = true;
      if (!wasCompleted) {
        user.xp = (user.xp || 0) + 10;
        
        // Auto savings trigger (Innovative habit saving feature!)
        if (habit.rewardAmount > 0 && habit.rewardCardId) {
          const sourceCard = user.cards?.find(c => c.id === habit.rewardCardId);
          const savingsCard = user.cards?.find(c => c.id === 'card-savings');
          
          if (sourceCard && savingsCard) {
            sourceCard.balance -= Number(habit.rewardAmount);
            savingsCard.balance += Number(habit.rewardAmount);
            
            const txId = 'tx-save-' + habitId + '-' + date;
            const incTxId = 'tx-save-inc-' + habitId + '-' + date;
            
            // Clean up duplicates
            user.transactions = (user.transactions || []).filter(t => t.id !== txId && t.id !== incTxId);
            
            user.transactions.push({
              id: txId,
              amount: Number(habit.rewardAmount),
              description: `🎯 Jamg'arma: "${habit.name}"`,
              type: 'expense',
              category: 'savings',
              cardId: habit.rewardCardId,
              date: new Date(date).toISOString(),
              isSavingsTransfer: true
            });
            
            user.transactions.push({
              id: incTxId,
              amount: Number(habit.rewardAmount),
              description: `🎯 Jamg'arma: "${habit.name}"`,
              type: 'income',
              category: 'savings',
              cardId: 'card-savings',
              date: new Date(date).toISOString(),
              isSavingsTransfer: true
            });
          }
        }
      }
    } else {
      delete habit.completedDates[date];
      if (wasCompleted) {
        user.xp = Math.max(0, (user.xp || 0) - 10);
        
        // Revert savings
        if (habit.rewardAmount > 0 && habit.rewardCardId) {
          const sourceCard = user.cards?.find(c => c.id === habit.rewardCardId);
          const savingsCard = user.cards?.find(c => c.id === 'card-savings');
          
          if (sourceCard && savingsCard) {
            sourceCard.balance += Number(habit.rewardAmount);
            savingsCard.balance -= Number(habit.rewardAmount);
            
            const txId = 'tx-save-' + habitId + '-' + date;
            const incTxId = 'tx-save-inc-' + habitId + '-' + date;
            
            user.transactions = (user.transactions || []).filter(t => t.id !== txId && t.id !== incTxId);
          }
        }
      }
    }
    user.level = Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1;
    
    dbInstance.saveUser(userId, user);
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Habit not found' });
  }
});

// API: Add habit
app.post('/api/user/:userId/habit', (req, res) => {
  const { userId } = req.params;
  const { name, time, category, image, voiceEnabled, voiceAudio, rewardAmount, rewardCardId } = req.body;
  
  const user = dbInstance.getUser(userId);
  const newHabit = {
    id: 'habit-' + Math.random().toString(36).substring(2, 9),
    name,
    time: time || '12:00',
    category: category || 'custom',
    image: image || null,
    voiceEnabled: !!voiceEnabled,
    voiceAudio: voiceAudio || null,
    enabled: true,
    completedDates: {},
    rewardAmount: Number(rewardAmount) || 0,
    rewardCardId: rewardCardId || null
  };
  
  user.habits.push(newHabit);
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update habit
app.put('/api/user/:userId/habit/:habitId', (req, res) => {
  const { userId, habitId } = req.params;
  const { name, time, enabled, category, image, voiceEnabled, voiceAudio, rewardAmount, rewardCardId } = req.body;
  
  const user = dbInstance.getUser(userId);
  const habitIndex = user.habits.findIndex(h => h.id === habitId);
  
  if (habitIndex !== -1) {
    user.habits[habitIndex] = {
      ...user.habits[habitIndex],
      ...(name !== undefined && { name }),
      ...(time !== undefined && { time }),
      ...(enabled !== undefined && { enabled }),
      ...(category !== undefined && { category }),
      ...(image !== undefined && { image }),
      ...(voiceEnabled !== undefined && { voiceEnabled: !!voiceEnabled }),
      ...(voiceAudio !== undefined && { voiceAudio }),
      ...(rewardAmount !== undefined && { rewardAmount: Number(rewardAmount) }),
      ...(rewardCardId !== undefined && { rewardCardId })
    };
    dbInstance.saveUser(userId, user);
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Habit not found' });
  }
});

// API: Delete habit
app.delete('/api/user/:userId/habit/:habitId', (req, res) => {
  const { userId, habitId } = req.params;
  
  const user = dbInstance.getUser(userId);
  user.habits = user.habits.filter(h => h.id !== habitId);
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Add Goal
app.post('/api/user/:userId/goal', (req, res) => {
  const { userId } = req.params;
  const { title, target, unit, deadline, image } = req.body;
  
  const user = dbInstance.getUser(userId);
  const newGoal = {
    id: 'goal-' + Math.random().toString(36).substring(2, 9),
    title,
    target: Number(target) || 10,
    current: 0,
    unit: unit || 'marta',
    image: image || null,
    plans: [],
    completedDates: {},
    deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
  
  user.goals.push(newGoal);
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update Goal (e.g. progress or title)
app.put('/api/user/:userId/goal/:goalId', (req, res) => {
  const { userId, goalId } = req.params;
  const { title, target, current, unit, deadline, image, plans, completedDates } = req.body;
  
  const user = dbInstance.getUser(userId);
  const goalIndex = user.goals.findIndex(g => g.id === goalId);
  
  if (goalIndex !== -1) {
    const goal = user.goals[goalIndex];
    user.goals[goalIndex] = {
      ...goal,
      ...(title !== undefined && { title }),
      ...(target !== undefined && { target: Number(target) }),
      ...(current !== undefined && { current: Math.max(0, Math.min(Number(target) || goal.target, Number(current))) }),
      ...(unit !== undefined && { unit }),
      ...(deadline !== undefined && { deadline }),
      ...(image !== undefined && { image }),
      ...(plans !== undefined && { plans }),
      ...(completedDates !== undefined && { completedDates })
    };
    dbInstance.saveUser(userId, user);
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Goal not found' });
  }
});

// API: Delete Goal
app.delete('/api/user/:userId/goal/:goalId', (req, res) => {
  const { userId, goalId } = req.params;
  
  const user = dbInstance.getUser(userId);
  user.goals = user.goals.filter(g => g.id !== goalId);
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

app.post('/api/user/:userId/plan', (req, res) => {
  const { userId } = req.params;
  const { text, type, linkedFinance } = req.body;
  const user = dbInstance.getUser(userId);
  if (!user.plans) user.plans = [];
  
  const newPlan = {
    id: 'plan-' + Math.random().toString(36).substring(2, 9),
    text,
    completed: false,
    type: type || 'weekly',
    linkedFinance: linkedFinance || null
  };
  user.plans.push(newPlan);
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});
// API: Update Plan
app.put('/api/user/:userId/plan/:planId', (req, res) => {
  const { userId, planId } = req.params;
  const { completed, text } = req.body;
  const user = dbInstance.getUser(userId);
  if (!user.plans) user.plans = [];
  
  const planIndex = user.plans.findIndex(p => p.id === planId);
  if (planIndex !== -1) {
    if (completed !== undefined) {
      const wasCompleted = !!user.plans[planIndex].completed;
      user.plans[planIndex].completed = completed;
      if (completed && !wasCompleted) {
        user.xp = (user.xp || 0) + 30;
      } else if (!completed && wasCompleted) {
        user.xp = Math.max(0, (user.xp || 0) - 30);
      }
      user.level = Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1;
    }
    if (text !== undefined) user.plans[planIndex].text = text;
    if (req.body.linkedFinance !== undefined) user.plans[planIndex].linkedFinance = req.body.linkedFinance;
    dbInstance.saveUser(userId, user);
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Plan not found' });
  }
});

// API: Delete Plan
app.delete('/api/user/:userId/plan/:planId', (req, res) => {
  const { userId, planId } = req.params;
  const user = dbInstance.getUser(userId);
  if (!user.plans) user.plans = [];
  user.plans = user.plans.filter(p => p.id !== planId);
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Add Transaction (Finance Ledger)
app.post('/api/user/:userId/transaction', (req, res) => {
  const { userId } = req.params;
  const { amount, description, type, category, cardId, isRecurring } = req.body;
  const user = dbInstance.getUser(userId);
  if (!user.transactions) user.transactions = [];

  const newTx = {
    id: 'tx-' + Math.random().toString(36).substring(2, 9),
    amount: Number(amount) || 0,
    description: description || '',
    type: type || 'expense', // income, expense, lend, borrow
    category: category || 'general',
    cardId: cardId || null,
    date: new Date().toISOString(),
    isRecurring: !!isRecurring
  };

  user.transactions.push(newTx);

  if (isRecurring) {
    if (!user.recurringTransactions) user.recurringTransactions = [];
    user.recurringTransactions.push({
      id: 'rt-' + Math.random().toString(36).substring(2, 9),
      amount: Number(amount) || 0,
      description: description || '',
      type: type || 'expense',
      category: category || 'general',
      cardId: cardId || null,
      lastExecutedMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    });
  }

  if (cardId && user.cards) {
    const card = user.cards.find(c => c.id === cardId);
    if (card) {
      if (type === 'expense') {
        card.balance -= newTx.amount;
      } else if (type === 'income') {
        card.balance += newTx.amount;
      }
    }
  }

  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Delete Transaction
app.delete('/api/user/:userId/transaction/:txId', (req, res) => {
  const { userId, txId } = req.params;
  const user = dbInstance.getUser(userId);
  if (!user.transactions) user.transactions = [];
  
  const tx = user.transactions.find(t => t.id === txId);
  if (tx) {
    if (tx.cardId && user.cards) {
      const card = user.cards.find(c => c.id === tx.cardId);
      if (card) {
        if (tx.type === 'expense') {
          card.balance += tx.amount;
        } else if (tx.type === 'income') {
          card.balance -= tx.amount;
        }
      }
    }
    user.transactions = user.transactions.filter(t => t.id !== txId);
    dbInstance.saveUser(userId, user);
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// API: Add Pomodoro session
app.post('/api/user/:userId/pomodoro', (req, res) => {
  const { userId } = req.params;
  const { durationMinutes, type } = req.body; // type: 'work' or 'break'
  
  const user = dbInstance.getUser(userId);
  
  if (!user.pomodoro) {
    user.pomodoro = { completedCount: 0, totalMinutes: 0, sessions: [] };
  }
  
  if (type === 'work') {
    user.pomodoro.completedCount += 1;
    user.pomodoro.totalMinutes += Number(durationMinutes) || 25;
  }
  
  user.pomodoro.sessions.unshift({
    id: 'pomodoro-' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    durationMinutes: Number(durationMinutes) || 25,
    type
  });
  
  // Limit stored session logs to 50
  if (user.pomodoro.sessions.length > 50) {
    user.pomodoro.sessions.pop();
  }
  
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update settings
app.put('/api/user/:userId/settings', (req, res) => {
  const { userId } = req.params;
  const settingsData = req.body;
  
  const user = dbInstance.getUser(userId);
  user.settings = {
    ...user.settings,
    ...settingsData
  };
  
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update daily water intake
app.post('/api/user/:userId/water', (req, res) => {
  const { userId } = req.params;
  const { date, amount } = req.body;
  
  const user = dbInstance.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!user.waterLogs) {
    user.waterLogs = {};
  }
  
  const currentVal = user.waterLogs[date] || 0;
  if (amount === 0) {
    user.waterLogs[date] = 0;
  } else {
    user.waterLogs[date] = Math.max(0, currentVal + amount);
  }
  
  // Award 5 XP for every 250ml water logged, up to a max of 40 XP per day (2000ml)
  if (amount > 0 && user.waterLogs[date] <= 2000) {
    const oldXp = user.xp || 0;
    const gainedXp = Math.floor(amount / 50); // 1 XP per 50ml -> 5 XP per 250ml
    user.xp = oldXp + gainedXp;
    
    const currentLevel = user.level || 1;
    const nextLevelNeedXp = Math.pow(currentLevel, 2) * 100;
    if (user.xp >= nextLevelNeedXp) {
      user.level = currentLevel + 1;
    }
  }
  
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update daily weight log
app.post('/api/user/:userId/weight', (req, res) => {
  const { userId } = req.params;
  const { date, weight } = req.body;
  
  const user = dbInstance.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!user.weightLogs) {
    user.weightLogs = {};
  }
  
  const val = parseFloat(weight);
  if (val > 0) {
    user.weightLogs[date] = val;
  } else {
    delete user.weightLogs[date];
  }
  
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update parent settings
app.put('/api/user/:userId/parent', (req, res) => {
  const { userId } = req.params;
  const { parentChatId, parentAlertsEnabled } = req.body;
  
  const user = dbInstance.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.parentChatId = parentChatId !== undefined ? String(parentChatId).trim() : user.parentChatId;
  user.parentAlertsEnabled = parentAlertsEnabled !== undefined ? Boolean(parentAlertsEnabled) : user.parentAlertsEnabled;
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update calorie logs
app.post('/api/user/:userId/calorie', (req, res) => {
  const { userId } = req.params;
  const { date, type, name, calories, protein, carbs, fats } = req.body;
  
  const user = dbInstance.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!user.calorieLogs) {
    user.calorieLogs = {};
  }
  if (!user.calorieLogs[date]) {
    user.calorieLogs[date] = { consumed: 0, burned: 0, items: [] };
  }
  
  const logItem = {
    id: 'cal-' + Date.now() + Math.random().toString(36).substr(2, 4),
    type,
    name,
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fats: Number(fats) || 0,
    timestamp: new Date().toISOString()
  };
  
  user.calorieLogs[date].items.push(logItem);
  
  let consumed = 0;
  let burned = 0;
  user.calorieLogs[date].items.forEach(item => {
    if (item.type === 'food') {
      consumed += item.calories;
    } else if (item.type === 'workout') {
      burned += item.calories;
    }
  });
  
  user.calorieLogs[date].consumed = consumed;
  user.calorieLogs[date].burned = burned;

  const oldXp = user.xp || 0;
  user.xp = oldXp + 15;
  
  const currentLevel = user.level || 1;
  const nextLevelNeedXp = Math.pow(currentLevel, 2) * 100;
  if (user.xp >= nextLevelNeedXp) {
    user.level = currentLevel + 1;
  }
  
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Clear/Reset calorie logs for a date
app.post('/api/user/:userId/calorie/reset', (req, res) => {
  const { userId } = req.params;
  const { date } = req.body;
  
  const user = dbInstance.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.calorieLogs && user.calorieLogs[date]) {
    user.calorieLogs[date] = { consumed: 0, burned: 0, items: [] };
  }
  
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Delete a single calorie log item
app.delete('/api/user/:userId/calorie/:date/:itemId', (req, res) => {
  const { userId, date, itemId } = req.params;
  
  const user = dbInstance.getUser(userId);
  if (!user || !user.calorieLogs || !user.calorieLogs[date]) {
    return res.status(404).json({ error: 'User or logs not found' });
  }

  const logIndex = user.calorieLogs[date].items.findIndex(item => item.id === itemId);
  if (logIndex === -1) {
    return res.status(404).json({ error: 'Log item not found' });
  }

  // Remove item
  user.calorieLogs[date].items.splice(logIndex, 1);

  // Recalculate totals
  let consumed = 0;
  let burned = 0;
  user.calorieLogs[date].items.forEach(item => {
    if (item.type === 'food') {
      consumed += item.calories;
    } else if (item.type === 'workout') {
      burned += item.calories;
    }
  });

  user.calorieLogs[date].consumed = consumed;
  user.calorieLogs[date].burned = burned;

  // Deduct XP
  user.xp = Math.max(0, (user.xp || 0) - 15);

  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

app.post('/api/user/:userId/test-reminder', async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;
  
  const msg = message || "🔔 Bu sinov eslatmasi! Tracker tizimingiz muvaffaqiyatli ishlamoqda. 💪";
  const success = await sendNotification(userId, msg);
  
  if (success) {
    res.json({ success: true, message: 'Notification triggered successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to send notification. Check bot token or notification settings.' });
  }
});

// API: Programmatically restart bot for user
app.post('/api/user/:userId/restart-bot', async (req, res) => {
  const { userId } = req.params;
  const user = dbInstance.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (bot && !isMockMode && !isNaN(Number(userId))) {
    try {
      const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5000';
      const welcomeMsg = `🤖 <b>Tizim yangilandi va qayta ishga tushirildi!</b>\n\n` +
        `Salom, <b>${user.firstName || 'Foydalanuvchi'}</b>! Barcha odatlar tracker xizmatlari va eslatmalari muvaffaqiyatli faollashtirildi.\n\n` +
        `Ilovani ochish uchun quyidagi tugmani bosing:`;

      await bot.telegram.sendMessage(userId, welcomeMsg, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Ilovani ochish", web_app: { url: miniAppUrl } }]
          ]
        }
      });
      return res.json({ success: true, message: 'Start command triggered successfully.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json({ success: true, message: 'Mock mode restart.' });
  }
});

// API: AI Coach Chatbot
app.post('/api/user/:userId/coach/chat', (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;
  const user = dbInstance.getUser(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const lang = user.settings?.language || 'uz';
  const cleanMsg = (message || '').toLowerCase().trim();

  // Metrics helper
  const totalBalance = (user.cards || []).reduce((sum, c) => sum + c.balance, 0);
  const totalExpenses = (user.transactions || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsBalance = (user.cards || []).find(c => c.id === 'card-savings')?.balance || 0;
  const activeHabits = (user.habits || []).filter(h => h.enabled);
  const activeGoals = user.goals || [];
  
  // Custom responses helper based on language
  const localizedResponses = {
    uz: {
      welcome: `Assalomu alaykum, ${user.name || 'do\'stim'}! Men sizning shaxsiy AI yordamchingizman. Bugun qaysi mavzu haqida maslahatlashamiz? Moliya, Odatlar yoki Maqsadlaringiz bo'yichami?`,
      polite: `Sizga ham rahmat! O'z ustingizda ishlashdan to'xtamang. Men har doim shu yerdaman! 🧠`,
      finance: `📊 **Moliyaviy Tahlilingiz:**\n- Hozirgi kartalar balansingiz: **${totalBalance.toLocaleString('uz-UZ')} so'm**\n- O'tgan haftadagi jami chiqim: **${totalExpenses.toLocaleString('uz-UZ')} so'm**\n- Avto-jamg'arma sandiqchangizda: **${savingsBalance.toLocaleString('uz-UZ')} so'm** yig'ildi. ${totalExpenses > 300000 ? '\n⚠️ Chiqimlaringiz biroz oshgan ko\'rinadi. Keraksiz toifadagi xarajatlarni kamaytirishni tavsiya qilaman!' : '\n✅ Moliyaviy intizomingiz yaxshi holatda, baraka toping!'}`,
      habits: `⚡️ **Odatlaringiz Tahlili:**\n- Sizda hozirda **${activeHabits.length} ta faol odat** bor.\n- Eng zo'r odatingiz: 'Bomdod namozi'. Kundalik odatlaringizni uzmasdan davom ettiring, har safar bajarganingizda avto-jamg'armangiz o'sib boradi!`,
      goals: `🏆 **Maqsadlaringiz Tahlili:**\n- Jami maqsadlar soni: **${activeGoals.length} ta**.\n${activeGoals.length > 0 ? activeGoals.map(g => `- *${g.text}*: progressi **${g.current}/${g.target} (${Math.round((g.current/g.target)*100)}%)**`).join('\n') : 'Hali maqsadlar qo\'shmabsiz. Nike Fitness uslubidagi chiroyli maqsadlar bo\'limidan yangi maqsadlar kiritishni maslahat beraman!'}\n\nG'ayrat qiling, har qadam muvaffaqiyatga yaqinlashtiradi! 🔥`,
      motivation: `🔥 **Kun Motivatsiyasi:**\n"Bugun qilgan kichik bir yaxshi amalingiz yoki boshlagan odatingiz, ertaga siz kutmagan buyuk natijalarni beradi." Charchashga yo'l yo'q! Bomdod vaqtida turing, rejalaringizni bajaring va moliyani nazorat qiling! 💪`,
      default: `Tushundim. Menga moliya, odatlar yoki maqsadlaringiz haqida yozishingiz mumkin. Masalan:\n- "moliyaviy holatim qalay?"\n- "odatlarni tahlil qilib ber"\n- "maqsadlarim qanday ketyapti?"\n- "menga motivatsiya ber"`
    },
    ru: {
      welcome: `Здравствуйте, ${user.name || 'друг'}! Я ваш личный ИИ-коуч. О чем поговорим сегодня? Финансы, Привычки или Цели?`,
      polite: `И вам спасибо! Продолжайте работать над собой. Я всегда рядом! 🧠`,
      finance: `📊 **Анализ Ваших Финансов:**\n- Баланс всех карт: **${totalBalance.toLocaleString('ru-RU')} сум**\n- Расходы за последнее время: **${totalExpenses.toLocaleString('ru-RU')} сум**\n- В копилке авто-сбережений: **${savingsBalance.toLocaleString('ru-RU')} сум**. ${totalExpenses > 300000 ? '\n⚠️ Кажется, ваши расходы возросли. Рекомендую снизить лимиты на развлечения!' : '\n✅ Ваши финансы под контролем, отличная дисциплина!'}`,
      habits: `⚡️ **Анализ Привычек:**\n- У вас сейчас **${activeHabits.length} активных привычек**.\n- Выполняйте их регулярно для автоматического пополнения копилки!`,
      goals: `🏆 **Анализ Целей:**\n- Количество целей: **${activeGoals.length}**.\n${activeGoals.length > 0 ? activeGoals.map(g => `- *${g.text}*: прогресс **${g.current}/${g.target} (${Math.round((g.current/g.target)*100)}%)**`).join('\n') : 'Вы еще не добавили ни одной цели. Начните прямо сейчас!'}\n\nТолько вперед! 🔥`,
      motivation: `🔥 **Мотивация дня:**\n"Каждый шаг вперед, даже самый маленький — это победа над собой." Вы сильнее, чем думаете! Просыпайтесь вовремя, следуйте расписанию и берегите бюджет! 💪`,
      default: `Понял вас. Вы можете спросить о финансах, привычках или целях. Например:\n- "проанализируй финансы"\n- "как там привычки?"\n- "мои цели"\n- "дай мотивацию"`
    },
    en: {
      welcome: `Hello, ${user.name || 'friend'}! I am your personal AI Coach. What would you like to discuss today? Finances, Habits, or Goals?`,
      polite: `You are welcome! Keep working on yourself. I am always here to guide you! 🧠`,
      finance: `📊 **Financial Breakdown:**\n- Net wallet balance: **${totalBalance.toLocaleString('en-US')} UZS**\n- Recent expenses: **${totalExpenses.toLocaleString('en-US')} UZS**\n- Saved in habit auto-savings: **${savingsBalance.toLocaleString('en-US')} UZS**. ${totalExpenses > 300000 ? '\n⚠️ Your expenses are slightly elevated. Consider reducing non-essential spending!' : '\n✅ Excellent financial discipline! Keep it up.'}`,
      habits: `⚡️ **Habit Insights:**\n- You have **${activeHabits.length} active habits**.\n- Maintain your streaks to build lasting routines and grow your auto-savings!`,
      goals: `🏆 **Goal Progress:**\n- Active goals: **${activeGoals.length}**.\n${activeGoals.length > 0 ? activeGoals.map(g => `- *${g.text}*: progress **${g.current}/${g.target} (${Math.round((g.current/g.target)*100)}%)**`).join('\n') : 'No goals defined yet. Let\'s set some now!'}\n\nKeep pushing forward! 🔥`,
      motivation: `🔥 **Daily Motivation:**\n"Consistency is the bridge between goals and achievement." Wake up early, keep your streaks, and manage your budget wisely! 💪`,
      default: `Got it. You can chat with me about your finance, habits, or goals. Try asking:\n- "how are my finances?"\n- "analyse my habits"\n- "tell me about my goals"\n- "give me motivation"`
    }
  };

  const texts = localizedResponses[lang] || localizedResponses['uz'];
  let reply = texts.default;

  if (cleanMsg.includes('salom') || cleanMsg.includes('assalom') || cleanMsg.includes('hello') || cleanMsg.includes('hi') || cleanMsg.includes('привет') || cleanMsg.includes('здравствуй')) {
    reply = texts.welcome;
  } else if (cleanMsg.includes('rahmat') || cleanMsg.includes('tashakkur') || cleanMsg.includes('thank') || cleanMsg.includes('спасибо')) {
    reply = texts.polite;
  } else if (cleanMsg.includes('moliya') || cleanMsg.includes('pul') || cleanMsg.includes('xarajat') || cleanMsg.includes('chiqim') || cleanMsg.includes('karta') || cleanMsg.includes('finance') || cleanMsg.includes('money') || cleanMsg.includes('spent') || cleanMsg.includes('расход') || cleanMsg.includes('финанс') || cleanMsg.includes('деньги')) {
    reply = texts.finance;
  } else if (cleanMsg.includes('odat') || cleanMsg.includes('namoz') || cleanMsg.includes('uyqu') || cleanMsg.includes('streak') || cleanMsg.includes('habit') || cleanMsg.includes('привыч')) {
    reply = texts.habits;
  } else if (cleanMsg.includes('maqsad') || cleanMsg.includes('goal') || cleanMsg.includes('цел')) {
    reply = texts.goals;
  } else if (cleanMsg.includes('motivats') || cleanMsg.includes('motivation') || cleanMsg.includes('kuch') || cleanMsg.includes('charchad') || cleanMsg.includes('мотивац')) {
    reply = texts.motivation;
  }

  // Simulate thinking delay in chatbot
  setTimeout(() => {
    res.json({ success: true, reply });
  }, 400);
});

// API: Add Card
app.post('/api/user/:userId/card', (req, res) => {
  const { userId } = req.params;
  const { name, balance, type, cardNumber, color } = req.body;
  const user = dbInstance.getUser(userId);
  if (!user.cards) user.cards = [];
  
  const newCard = {
    id: 'card-' + Math.random().toString(36).substring(2, 9),
    name: name || 'Yangi Karta',
    balance: Number(balance) || 0,
    type: type || 'uzcard',
    cardNumber: cardNumber || '0000',
    color: color || 'blue'
  };
  user.cards.push(newCard);
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

// API: Update Card
app.put('/api/user/:userId/card/:cardId', (req, res) => {
  const { userId, cardId } = req.params;
  const { name, balance, type, cardNumber, color } = req.body;
  const user = dbInstance.getUser(userId);
  const idx = user.cards?.findIndex(c => c.id === cardId);
  if (idx !== undefined && idx !== -1) {
    user.cards[idx] = {
      ...user.cards[idx],
      ...(name !== undefined && { name }),
      ...(balance !== undefined && { balance: Number(balance) }),
      ...(type !== undefined && { type }),
      ...(cardNumber !== undefined && { cardNumber }),
      ...(color !== undefined && { color })
    };
    dbInstance.saveUser(userId, user);
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Card not found' });
  }
});

// API: Delete Card
app.delete('/api/user/:userId/card/:cardId', (req, res) => {
  const { userId, cardId } = req.params;
  const user = dbInstance.getUser(userId);
  if (user.cards) {
    user.cards = user.cards.filter(c => c.id !== cardId);
  }
  dbInstance.saveUser(userId, user);
  res.json({ success: true, user });
});

function getLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper: Calculate Streak
function getStreak(user) {
  if (!user.habits || user.habits.length === 0) return 0;
  const allDates = new Set();
  user.habits.forEach(h => {
    if (h.completedDates) {
      Object.keys(h.completedDates).forEach(d => allDates.add(d));
    }
  });
  
  let streak = 0;
  const checkDate = new Date();
  const todayStr = getLocalDateStr(checkDate);
  
  while (true) {
    const dateStr = getLocalDateStr(checkDate);
    if (allDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (streak === 0 && dateStr === todayStr) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = getLocalDateStr(checkDate);
        if (allDates.has(yesterdayStr)) {
          streak = 1;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }
  return streak;
}

// API: Get Streak Leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const users = dbInstance.getAllUsers();
    const list = users.map(u => ({
      userId: u.id,
      firstName: u.firstName,
      username: u.username,
      avatar: u.avatar || null,
      streak: getStreak(u)
    })).sort((a, b) => b.streak - a.streak).slice(0, 5);
    res.json({ leaderboard: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get AI Coach Insights
app.get('/api/user/:userId/insights', (req, res) => {
  const { userId } = req.params;
  const user = dbInstance.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const lang = user.settings?.language || 'uz';
  const transactions = user.transactions || [];
  const streak = getStreak(user);
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  let insightText = '';
  if (lang === 'uz') {
    insightText = "Rivojlanishingizni boshlash uchun ko'proq odatlar bajaring va moliyaviy amallarni kiriting!";
  } else if (lang === 'ru') {
    insightText = "Выполняйте больше привычек и добавляйте транзакции, чтобы начать анализ!";
  } else {
    insightText = "Complete more habits and add transactions to start getting insights!";
  }
  
  if (streak > 0) {
    if (lang === 'uz') {
      insightText = `Ajoyib natija! Odatlaringizni ketma-ket ${streak} kundan beri bajarmoqdasiz. Shunday davom eting! 🔥`;
    } else if (lang === 'ru') {
      insightText = `Отличный результат! Вы выполняете свои привычки уже ${streak} дн. подряд. Продолжайте в том же духе! 🔥`;
    } else {
      insightText = `Great job! You've been keeping up your habits for ${streak} days straight. Keep it going! 🔥`;
    }
  }
  
  if (transactions.length > 0) {
    if (totalExpense > totalIncome) {
      if (lang === 'uz') {
        insightText += ` Diqqat: Bu oyda chiqimlaringiz kirimlardan ko'proq bo'ldi (farq: ${(totalExpense - totalIncome).toLocaleString()} so'm). Xarajatlarni kamaytirishni tavsiya qilamiz! 📉`;
      } else if (lang === 'ru') {
        insightText += ` Внимание: Ваши расходы превысили доходы в этом месяце (разница: ${(totalExpense - totalIncome).toLocaleString()} сум). Рекомендуем оптимизировать траты! 📉`;
      } else {
        insightText += ` Warning: Your expenses exceeded your income this month (diff: ${(totalExpense - totalIncome).toLocaleString()} UZS). We recommend reducing your expenses! 📉`;
      }
    } else if (totalExpense > 0) {
      const categories = {};
      transactions.filter(t => t.type === 'expense').forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
      });
      const topCat = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b, 'general');
      const topAmount = categories[topCat] || 0;
      const pct = Math.round((topAmount / totalExpense) * 100);
      
      const catNames = {
        uz: { general: 'Boshqa', food: 'Oziq-ovqat', transport: 'Transport', salary: 'Maosh', home: 'Uy-ro\'zg\'or', entertainment: 'Ko\'ngilochar', gift: 'Sovg\'a', loan: 'Qarz' },
        ru: { general: 'Другое', food: 'Продукты', transport: 'Транспорт', salary: 'Зарплата', home: 'Дом', entertainment: 'Развлечения', gift: 'Подарки', loan: 'Долги' },
        en: { general: 'Other', food: 'Food', transport: 'Transport', salary: 'Salary', home: 'Home', entertainment: 'Entertainment', gift: 'Gift', loan: 'Loan' }
      };
      
      const topCatName = (catNames[lang] || catNames['uz'])[topCat] || topCat;
      
      if (lang === 'uz') {
        insightText += ` Eng ko'p xarajatni "${topCatName}" toifasiga sarfladingiz (jami xarajatlarning ${pct}% qismi).`;
      } else if (lang === 'ru') {
        insightText += ` Больше всего вы потратили на категорию "${topCatName}" (${pct}% от общих расходов).`;
      } else {
        insightText += ` You spent the most on the "${topCatName}" category (${pct}% of total expenses).`;
      }
    }
  }
  
  res.json({ insight: insightText });
});

// API: Sync Prayer Times using Aladhan API
app.post('/api/user/:userId/sync-prayer-times', async (req, res) => {
  const { userId } = req.params;
  const { city } = req.body;
  
  const user = dbInstance.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (!user.settings) user.settings = {};
  user.settings.city = city || 'Tashkent';
  
  try {
    const fetchUrl = `http://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city || 'Tashkent')}&country=Uzbekistan&method=3`;
    console.log(`🕌 Fetching prayer times from Aladhan API for ${city}...`);
    const apiRes = await fetch(fetchUrl);
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      const timings = apiData.data?.timings;
      if (timings) {
        const prayerMap = {
          'prayer-bomdod': timings.Fajr,
          'prayer-peshin': timings.Dhuhr,
          'prayer-asr': timings.Asr,
          'prayer-shom': timings.Maghrib,
          'prayer-xufton': timings.Isha
        };
        
        user.habits = user.habits.map(h => {
          if (prayerMap[h.id]) {
            return {
              ...h,
              time: prayerMap[h.id]
            };
          }
          return h;
        });
        
        dbInstance.saveUser(userId, user);
        return res.json({ success: true, user, timings });
      }
    }
    throw new Error("Invalid API response format");
  } catch (error) {
    console.error(`⚠️ Failed to sync prayer times:`, error.message);
    dbInstance.saveUser(userId, user);
    res.json({ success: false, user, error: error.message });
  }
});

// API: Send CSV Finance Report to Telegram Chat
app.post('/api/user/:userId/send-finance-report', async (req, res) => {
  const { userId } = req.params;
  const user = dbInstance.getUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (isMockMode || !bot) {
    return res.status(400).json({ error: 'Bot is running in Mock Mode. Cannot send Telegram message.' });
  }
  
  const lang = user.settings?.language || 'uz';
  const transactions = user.transactions || [];
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalLent = transactions.filter(t => t.type === 'lend').reduce((sum, t) => sum + t.amount, 0);
  const totalBorrowed = transactions.filter(t => t.type === 'borrow').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  
  const formatVal = (val) => {
    return val.toLocaleString('uz-UZ') + (lang === 'uz' ? ' so\'m' : (lang === 'ru' ? ' сум' : ' UZS'));
  };
  
  let reportText = '';
  if (lang === 'uz') {
    reportText = `📊 <b>MOLIYAVIY HISOBOT</b>\n\n` +
      `👤 Foydalanuvchi: <b>${user.firstName}</b>\n` +
      `📅 Sana: <b>${new Date().toLocaleDateString('uz-UZ')}</b>\n\n` +
      `💳 <b>Balans sharhi:</b>\n` +
      `• Sof balans: <code>${formatVal(balance)}</code>\n` +
      `• Jami kirim: <code>+${formatVal(totalIncome)}</code>\n` +
      `• Jami chiqim: <code>-${formatVal(totalExpense)}</code>\n\n` +
      `🤝 <b>Qarzlar holati:</b>\n` +
      `• Berilgan qarzlar: <code>${formatVal(totalLent)}</code>\n` +
      `• Olingan qarzlar: <code>${formatVal(totalBorrowed)}</code>\n\n` +
      `📝 <i>Oxirgi amallar jadvali ilovadagi CSV faylida biriktirilgan.</i>`;
  } else if (lang === 'ru') {
    reportText = `📊 <b>ФИНАНСОВЫЙ ОТЧЕТ</b>\n\n` +
      `👤 Пользователь: <b>${user.firstName}</b>\n` +
      `📅 Дата: <b>${new Date().toLocaleDateString('ru-RU')}</b>\n\n` +
      `💳 <b>Обзор баланса:</b>\n` +
      `• Чистый баланс: <code>${formatVal(balance)}</code>\n` +
      `• Всего доходов: <code>+${formatVal(totalIncome)}</code>\n` +
      `• Всего расходов: <code>-${formatVal(totalExpense)}</code>\n\n` +
      `🤝 <b>Состояние долгов:</b>\n` +
      `• Выданные долги: <code>${formatVal(totalLent)}</code>\n` +
      `• Полученные долги: <code>${formatVal(totalBorrowed)}</code>\n\n` +
      `📝 <i>Полный список операций прикреплен ниже в CSV файле.</i>`;
  } else {
    reportText = `📊 <b>FINANCE REPORT</b>\n\n` +
      `👤 User: <b>${user.firstName}</b>\n` +
      `📅 Date: <b>${new Date().toLocaleDateString('en-US')}</b>\n\n` +
      `💳 <b>Balance Overview:</b>\n` +
      `• Net Balance: <code>${formatVal(balance)}</code>\n` +
      `• Total Income: <code>+${formatVal(totalIncome)}</code>\n` +
      `• Total Expense: <code>-${formatVal(totalExpense)}</code>\n\n` +
      `🤝 <b>Loans Overview:</b>\n` +
      `• Lent Amount: <code>${formatVal(totalLent)}</code>\n` +
      `• Borrowed Amount: <code>${formatVal(totalBorrowed)}</code>\n\n` +
      `📝 <i>Detailed transactions log is attached below as a CSV file.</i>`;
  }
  
  let csvContent = 'Date,Type,Category,Description,Amount\n';
  transactions.forEach(t => {
    const cleanDesc = (t.description || '').replace(/"/g, '""');
    csvContent += `"${t.date || ''}","${t.type || ''}","${t.category || ''}","${cleanDesc}",${t.amount || 0}\n`;
  });
  const csvBuffer = Buffer.from(csvContent, 'utf-8');
  
  try {
    await bot.telegram.sendMessage(userId, reportText, { parse_mode: 'HTML' });
    await bot.telegram.sendDocument(userId, {
      source: csvBuffer,
      filename: `Finance_Report_${userId}.csv`
    }, {
      caption: lang === 'uz' ? 'Moliyaviy amallar ro\'yxati (CSV)' : (lang === 'ru' ? 'Выписка по операциям (CSV)' : 'Transactions statement (CSV)')
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Get global exercises list
app.get('/api/exercises', (req, res) => {
  res.json(dbInstance.getGlobalExercises());
});

// API: Save/Update global exercise
app.post('/api/exercises', (req, res) => {
  const { id, name, desc, burnRate, defaultDuration, icon, color, videoUrl, userId } = req.body;
  
  // Authorization check: Only allow ID 514578229 and test-user-id to modify global exercises
  if (String(userId) !== '514578229' && String(userId) !== 'test-user-id') {
    return res.status(403).json({ error: 'Permission denied. Admins only.' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const exerciseId = id || 'ex-' + Math.random().toString(36).substring(2, 9);
  const exercise = {
    id: exerciseId,
    name,
    desc: desc || '',
    burnRate: Number(burnRate) || 10,
    defaultDuration: Number(defaultDuration) || 60,
    icon: icon || '🔥',
    color: color || '#8b5cf6',
    videoUrl: videoUrl || ''
  };

  const updatedList = dbInstance.saveGlobalExercise(exercise);
  res.json({ success: true, exercises: updatedList });
});

// API: Delete global exercise
app.delete('/api/exercises/:exerciseId', (req, res) => {
  const { exerciseId } = req.params;
  const { userId } = req.query;  if (String(userId) !== '514578229' && String(userId) !== 'test-user-id') {
    return res.status(403).json({ error: 'Permission denied. Admins only.' });
  }

  const updatedList = dbInstance.deleteGlobalExercise(exerciseId);
  res.json({ success: true, exercises: updatedList });
});

// Serve frontend static files in production
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  // If requesting api, let it pass (it won't match here anyway as api routes are defined above, but just in case)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start notification scheduler
startScheduler();

// Start express server
app.listen(PORT, async () => {
  await dbInstance.init();
  console.log(`🌐 Express Server is running on port ${PORT}`);
  
  // Start tunnelmole programmatically
  try {
    console.log('🔗 Starting secure HTTPS tunnel via tunnelmole...');
    const url = await tunnelmole({ port: PORT });
    process.env.MINI_APP_URL = url;
    console.log(`🚀 Secure Tunnel URL: \x1b[36m${url}\x1b[0m`);

    // Dynamically update the Telegram Menu Button URL globally
    if (bot && !isMockMode) {
      try {
        await bot.telegram.callApi('setChatMenuButton', {
          menu_button: {
            type: 'web_app',
            text: '🚀 Ilovani ochish',
            web_app: { url }
          }
        });
        console.log('✅ Telegram Menu Button URL updated dynamically to the active tunnel.');
      } catch (menuError) {
        console.error('⚠️ Failed to update Telegram Menu Button:', menuError.message);
      }
    }
  } catch (tunnelError) {
    console.error('⚠️ Failed to start tunnelmole:', tunnelError.message);
  }
});
