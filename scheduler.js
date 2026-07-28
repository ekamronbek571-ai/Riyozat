import { dbInstance } from './db.js';
import { sendNotification } from './bot.js';

let schedulerInterval = null;

export function startScheduler() {
  console.log('⏰ Notification scheduler started (running minute checks)...');
  
  // Run check immediately on start, then every 60 seconds
  checkReminders();
  
  schedulerInterval = setInterval(() => {
    checkReminders();
  }, 60000); // 60 seconds
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    console.log('⏰ Notification scheduler stopped.');
  }
}

function checkReminders() {
  const now = new Date();
  
  // Format hours and minutes to HH:MM (matching user settings, e.g. "05:00")
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;
  
  // Format current date to YYYY-MM-DD
  const yyyy = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const currentDateStr = `${yyyy}-${month}-${dd}`;
  
  const users = dbInstance.getAllUsers();
  
  for (const user of users) {
    if (!user.settings || !user.settings.notificationsEnabled) {
      continue;
    }
    
    let dbUpdated = false;
    
    // Check habits (including prayers and sleep)
    if (user.habits && Array.isArray(user.habits)) {
      for (const habit of user.habits) {
        if (!habit.enabled || !habit.time) continue;
        
        // Match current time
        if (habit.time === currentTime) {
          if (habit.lastNotificationDate !== currentDateStr) {
            const lang = user.settings?.language || 'uz';
            
            const transMap = {
              uz: {
                reminder: `Eslatma: "${habit.name}" vaqti bo'ldi! ⏰`,
                namoz: `🕌 Namoz vaqti: ${habit.name} kirdi. Duo va ibodatlar qabul bo'lsin! 🙏`,
                sleep_morn: `🌅 Xayrli tong! Ertalabki uyg'onish vaqti bo'ldi. Kuningiz barakali o'tsin! 💪`,
                sleep_eve: `🌙 Kechki uxlash vaqti bo'ldi. Sokin tun va shirin tushlar hamrohingiz bo'lsin! 😴`
              },
              ru: {
                reminder: `Напоминание: Время для привычки "${habit.name}"! ⏰`,
                namoz: `🕌 Время молитвы: наступила ${habit.name}. Пусть ваши молитвы будут приняты! 🙏`,
                sleep_morn: `🌅 Доброе утро! Время просыпаться. Желаем продуктивного дня! 💪`,
                sleep_eve: `🌙 Время сна. Спокойной ночи и приятных снов! 😴`
              },
              en: {
                reminder: `Reminder: It's time for "${habit.name}"! ⏰`,
                namoz: `🕌 Prayer time: ${habit.name} has started. May your prayers be accepted! 🙏`,
                sleep_morn: `🌅 Good morning! Time to wake up. Have a blessed day! 💪`,
                sleep_eve: `🌙 Sleep time. Have a peaceful night and sweet dreams! 😴`
              }
            };
            
            const userTrans = transMap[lang] || transMap['uz'];
            let message = '';
            
            if (habit.category === 'namoz') {
              message = userTrans.namoz;
            } else if (habit.id === 'sleep-morning') {
              message = userTrans.sleep_morn;
            } else if (habit.id === 'sleep-evening') {
              message = userTrans.sleep_eve;
            } else {
              message = userTrans.reminder;
            }
            
            sendNotification(user.id, message, !!habit.voiceEnabled, habit.voiceAudio);
            
            habit.lastNotificationDate = currentDateStr;
            dbUpdated = true;
          }
        }
      }
    }

    // ----------------------------------------------------
    // parent Accountability Notification Check (at 19:30 daily)
    // ----------------------------------------------------
    if (currentTime === "19:30" && user.parentChatId && user.parentAlertsEnabled !== false) {
      if (user.lastParentAlertDate !== currentDateStr) {
        const activeHabits = (user.habits || []).filter(h => h.enabled);
        const uncompleted = activeHabits.filter(h => {
          return !h.completedDates || !h.completedDates[currentDateStr];
        });

        if (uncompleted.length > 0) {
          const names = uncompleted.map(h => `"${h.name}"`).join(', ');
          const alertMsg = `⚠️ **Ota-ona nazorati:**\nFarzandingiz (${user.firstName || 'Foydalanuvchi'}) bugun quyidagi rejalashtirilgan odatlarni bajarmadi:\n${names}\n\nIltimah, uni ogohlantirib, qo'llab-quvvatlang! 💪`;
          
          sendNotification(user.parentChatId, alertMsg);
        }
        user.lastParentAlertDate = currentDateStr;
        dbUpdated = true;
      }
    }

    // ----------------------------------------------------
    // Daily Expense Comparison Report (Svodka at 21:00 daily)
    // ----------------------------------------------------
    if (currentTime === "21:00") {
      if (user.lastDailySvodkaDate !== currentDateStr) {
        const txs = user.transactions || [];
        const todayTxs = txs.filter(t => t.type === 'expense' && t.date === currentDateStr);
        const todayTotal = todayTxs.reduce((sum, t) => sum + t.amount, 0);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        const yesterdayTxs = txs.filter(t => t.type === 'expense' && t.date === yStr);
        const yesterdayTotal = yesterdayTxs.reduce((sum, t) => sum + t.amount, 0);

        let reportMsg = '';
        if (todayTotal > yesterdayTotal) {
          const diff = todayTotal - yesterdayTotal;
          reportMsg = `📉 **Kunlik Xarajatlar Svodkasi:**\nBugun jami **${todayTotal.toLocaleString('uz-UZ')} so'm** sarfladingiz.\nBu kechagiga qaraganda **${diff.toLocaleString('uz-UZ')} so'm ko'p**! Ehtiyot bo'ling, pulni tejang! ⚠️`;
        } else if (todayTotal < yesterdayTotal) {
          const diff = yesterdayTotal - todayTotal;
          reportMsg = `📈 **Kunlik Xarajatlar Svodkasi:**\nBugun jami **${todayTotal.toLocaleString('uz-UZ')} so'm** sarfladingiz.\nBarakalla! Kechagiga qaraganda **${diff.toLocaleString('uz-UZ')} so'm tejadingiz**! Mulohazali tejashda davom eting. 🌟`;
        } else {
          reportMsg = `📊 **Kunlik Xarajatlar Svodkasi:**\nBugun ham, kecha ham jami **${todayTotal.toLocaleString('uz-UZ')} so'm** sarfladingiz. Moliyaviy barqarorlik! ⚖️`;
        }

        sendNotification(user.id, reportMsg);
        user.lastDailySvodkaDate = currentDateStr;
        dbUpdated = true;
      }
    }

    // ----------------------------------------------------
    // Weekly Expense Category-wise Report (Svodka on Sundays at 21:15)
    // ----------------------------------------------------
    if (currentTime === "21:15" && now.getDay() === 0) {
      if (user.lastWeeklySvodkaDate !== currentDateStr) {
        const txs = user.transactions || [];
        
        const dThisWeek = new Date();
        dThisWeek.setDate(dThisWeek.getDate() - 7);
        const dPrevWeek = new Date();
        dPrevWeek.setDate(dPrevWeek.getDate() - 14);

        const parseDate = (dStr) => new Date(dStr);

        const thisWeekTxs = txs.filter(t => t.type === 'expense' && parseDate(t.date) >= dThisWeek);
        const prevWeekTxs = txs.filter(t => t.type === 'expense' && parseDate(t.date) >= dPrevWeek && parseDate(t.date) < dThisWeek);

        const thisWeekTotal = thisWeekTxs.reduce((sum, t) => sum + t.amount, 0);
        const prevWeekTotal = prevWeekTxs.reduce((sum, t) => sum + t.amount, 0);

        const catMap = {};
        thisWeekTxs.forEach(t => {
          const cat = t.category || 'general';
          catMap[cat] = (catMap[cat] || 0) + t.amount;
        });

        const categoryLabels = {
          food: '🍏 Yeb-ichish',
          transport: '🚗 Taksi/Transport',
          home: '🏠 Uy/Ro\'zg\'or',
          entertainment: '🎮 O\'yin-kulgi',
          gift: '🎁 Sovg\'alar',
          loan: '💸 Qarzlar',
          general: '⚙️ Boshqa'
        };

        let catSummary = '';
        Object.entries(catMap).forEach(([cat, amt]) => {
          const lbl = categoryLabels[cat] || cat;
          catSummary += `- ${lbl}: **${amt.toLocaleString('uz-UZ')} so'm**\n`;
        });

        let comparisonStr = '';
        if (thisWeekTotal > prevWeekTotal) {
          const diff = thisWeekTotal - prevWeekTotal;
          comparisonStr = `Bu hafta jami **${thisWeekTotal.toLocaleString('uz-UZ')} so'm** sarfladingiz. Bu o'tgan haftadagidan **${diff.toLocaleString('uz-UZ')} so'm ko'p** bo'ldi. ⚠️`;
        } else {
          const diff = prevWeekTotal - thisWeekTotal;
          comparisonStr = `Bu hafta jami **${thisWeekTotal.toLocaleString('uz-UZ')} so'm** sarfladingiz. Barakalla! O'tgan haftadagidan **${diff.toLocaleString('uz-UZ')} so'm kam** sarfladingiz! 🎉`;
        }

        const weeklyReportMsg = `📊 **Haftalik Moliyaviy Svodka:**\n\n${comparisonStr}\n\n**Toifalar bo'yicha xarajatlar:**\n${catSummary || 'Bu hafta xarajatlar qilinmadi.'}`;
        
        sendNotification(user.id, weeklyReportMsg);
        user.lastWeeklySvodkaDate = currentDateStr;
        dbUpdated = true;
      }
    }
    
    if (dbUpdated) {
      dbInstance.saveUser(user.id, user);
    }
  }
}
