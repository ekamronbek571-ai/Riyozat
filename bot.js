import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { dbInstance } from './db.js';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

let bot = null;
let isMockMode = false;

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || BOT_TOKEN.trim() === '') {
  console.warn('⚠️ Telegram Bot Token is missing or placeholder. Bot will run in MOCK MODE.');
  isMockMode = true;
} else {
  try {
    bot = new Telegraf(BOT_TOKEN);
    console.log('🤖 Telegram Bot successfully initialized in REAL MODE.');
  } catch (error) {
    console.error('❌ Failed to initialize Telegraf Bot:', error);
    isMockMode = true;
  }
}

// Bot Command Handlers
if (!isMockMode && bot) {
  // Start command
  bot.command('start', async (ctx) => {
    const from = ctx.from;
    const userId = from.id;
    
    // Register or get user
    const user = dbInstance.getUser(userId, {
      username: from.username,
      first_name: from.first_name
    });

    const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5000';

    const welcomeMsg = `<b>Sog'lom va tartibli hayot sari ilk qadam! 🌟</b>\n\n` +
      `Assalomu alaykum, <b>${user.firstName}</b>!\n` +
      `Ushbu bot orqali siz kunlik odatlaringizni (jumladan 5 vaqt namoz va uyqu rejimini) shakllantirishingiz, ` +
      `va maqsadlar qo'yishingiz mumkin.\n\n` +
      `🚀 Ilovani brauzerda ochish uchun bosing: ${miniAppUrl}`;

    const replyOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    if (miniAppUrl.startsWith('https://')) {
      replyOptions.reply_markup = {
        inline_keyboard: [
          [{ text: "🚀 Ilovani ochish", web_app: { url: miniAppUrl } }]
        ]
      };
    }

    await ctx.reply(welcomeMsg, replyOptions);
  });

  // Help command
  bot.command('help', async (ctx) => {
    const helpMsg = `📖 <b>Yordam bo'limi</b>:\n\n` +
      `• <b>Ilovani ochish</b> - /start buyrug'ini bosing va 'Ilovani ochish' tugmasini bosing.\n` +
      `• <b>Besh vaqt namoz</b> - Ilova ichida 5 vaqt namoz odat sifatida avtomat qo'shilgan, ularni o'chirish yoki vaqtini tahrirlash mumkin.\n` +
      `• <b>Maqsad & Rejalar</b> - Katta maqsadlar va kunlik rejalar ro'yxatini yozing.\n` +
      `• <b>Sport & Kaloriya</b> - Taomlaringizni skaner qiling va ozish mashqlarini bajaring.\n` +
      `• <b>Moliya hisobi</b> - Kirim-chiqimlar va qarzlar daftari.\n` +
      `• <b>Eslatmalar</b> - Siz belgilagan vaqtlarda Telegram bot sizga ovozli va matnli eslatmalar yuboradi.`;
    
    await ctx.reply(helpMsg, { parse_mode: 'HTML' });
  });

  // Menu command
  bot.command('menu', async (ctx) => {
    const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5000';
    await ctx.reply(`📱 <b>Asosiy menyu</b>:\n\nKunlik odatlaringiz, maqsadlaringiz, kaloriya skaneri va moliya bo'limini boshqarish uchun pastdagi tugmani bosing:`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Ilovani ochish", web_app: { url: miniAppUrl } }]
        ]
      }
    });
  });

  // Webapp command
  bot.command('webapp', async (ctx) => {
    const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5000';
    await ctx.reply(`🔗 <b>Mini App havolasi</b>:\n\n<code>${miniAppUrl}</code>`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Ilovani ochish", web_app: { url: miniAppUrl } }]
        ]
      }
    });
  });

  // Default handler for text messages
  bot.on('message', async (ctx) => {
    if (ctx.chat.type === 'private' && (!ctx.message.text || !ctx.message.text.startsWith('/'))) {
      const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5000';
      await ctx.reply(`👋 Salom! Odatlar va faolligingizni kuzatish tizimiga xush kelibsiz.\n\nKunlik odatlar, kaloriya skaneri va moliya daftarchangizga kirish uchun quyidagi tugma orqali ilovani oching:`, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Ilovani ochish", web_app: { url: miniAppUrl } }]
          ]
        }
      });
    }
  });

  // Launch bot
  bot.telegram.deleteWebhook().then(() => {
    console.log('🧹 Cleared any conflicting webhooks.');
    
    // Register commands menu globally
    return bot.telegram.setMyCommands([
      { command: 'start', description: 'Botni ishga tushirish va ilovani ochish' },
      { command: 'menu', description: 'Asosiy menyu va ilovani ochish' },
      { command: 'webapp', description: 'Ilovani to\'g\'ridan-to\'g\'ri ochish havolasi' },
      { command: 'help', description: 'Yordam va yo\'riqnoma' }
    ]);
  }).then(() => {
    console.log('⚙️ Bot commands registered successfully.');
    bot.launch();
    console.log('🚀 Telegram Bot started long polling...');
  }).catch((err) => {
    console.error('❌ Error starting Telegram bot:', err);
    isMockMode = true;
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// Escape markdown characters helper
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// Function to send notifications
export async function sendNotification(userId, message, isVoice = false, voiceAudio = null) {
  const user = dbInstance.getUser(userId);
  if (!user || !user.settings || !user.settings.notificationsEnabled) {
    return false;
  }

  const timestamp = new Date().toISOString();
  const lang = user.settings?.language || 'uz';
  
  if (isMockMode) {
    const isCustomVoice = voiceAudio && voiceAudio.startsWith('data:audio');
    const displayMsg = isVoice 
      ? (isCustomVoice ? `🔊 [SHAXSIY OVOZLI ESLATMA] ${message}` : `🔊 [TTS OVOZLI ESLATMA] ${message}`) 
      : message;
    console.log(`[MOCK BOT NOTIFICATION] User: ${userId} (${user.firstName}), Time: ${timestamp}, Message: "${displayMsg}"`);
    
    // Add to mock notifications log in DB
    const mockNotifications = user.settings.mockNotifications || [];
    mockNotifications.unshift({
      id: Math.random().toString(36).substring(2, 9),
      message: displayMsg,
      timestamp
    });
    // Keep only last 20 mock notifications
    if (mockNotifications.length > 20) {
      mockNotifications.pop();
    }
    user.settings.mockNotifications = mockNotifications;
    dbInstance.saveUser(userId, user);
    return true;
  } else {
    try {
      if (isVoice) {
        if (voiceAudio && voiceAudio.includes(';base64,')) {
          // Parse base64 recorded user audio
          const base64Data = voiceAudio.split(';base64,').pop();
          const buffer = Buffer.from(base64Data, 'base64');
          
          await bot.telegram.sendVoice(userId, { source: buffer }, {
            caption: message
          });
          console.log(`[REAL BOT NOTIFICATION] Sent custom voice message to ${userId}: "${message}"`);
        } else {
          // Fallback to Google Translate TTS URL
          const voiceUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(message)}&tl=${lang}&client=tw-ob`;
          await bot.telegram.sendAudio(userId, voiceUrl, {
            caption: message
          });
          console.log(`[REAL BOT NOTIFICATION] Sent voice TTS notification to ${userId}: "${message}"`);
        }
      } else {
        await bot.telegram.sendMessage(userId, message);
        console.log(`[REAL BOT NOTIFICATION] Sent notification to ${userId}: "${message}"`);
      }
      
      // Also log for user visibility in WebApp
      const mockNotifications = user.settings.mockNotifications || [];
      mockNotifications.unshift({
        id: Math.random().toString(36).substring(2, 9),
        message: `${isVoice ? '🔊 [OVOZLI] ' : '🔔 '} ${message}`,
        timestamp
      });
      if (mockNotifications.length > 20) {
        mockNotifications.pop();
      }
      user.settings.mockNotifications = mockNotifications;
      dbInstance.saveUser(userId, user);
      return true;
    } catch (error) {
      console.error(`❌ Error sending notification to user ${userId}:`, error);
      return false;
    }
  }
}

export { bot, isMockMode };
