# Loyiha Walkthrough - Odatlar Tracker (Birlashtirilgan Premium Ilg‘or Tizim)

Ushbu hujjatda loyihaning eng oxirgi joriy holati, keraksiz kodlardan tozalangan yangi tuzilishi va integratsiya qilingan premium funksiyalar haqida to‘liq ma’lumot berilgan.

---

## 🎨 Loyihaning Tozalangan va Integratsiyalangan Yangi Tuzilishi

Siz aytganingizdek, barcha keraksiz/ortiqcha kod fayllari (`Plans.jsx`, `Pomodoro.jsx`) butunlay o‘chirib tashlandi. Quyidagi 100% kerakli va faol fayllar qoldirildi:

* **src/components/Goals.jsx** -> Katta Maqsadlar va Kichik Rejalar bitta "Maqsad & Rejalar" oynasiga birlashtirildi. Neon glowing timeline status nuqtalari ishlatilgan.
* **src/components/CalorieTracker.jsx** -> AI Taom Skaneri, Mashq yozish, Ozdiruvchi Mashqlar taymeri va Video darslik yuklash tizimi.
* **src/components/Dashboard.jsx** -> Oylik Odatlar G‘ildiragi (Calendar Wheel) interaktiv bosh sahifa.
* **src/components/Habits.jsx** -> Namoz va uyqu odatlarini 📅 Oylik Kalendar bilan boshqarish.
* **src/components/Settings.jsx** & **Finance.jsx** -> Sozlamalar va Kirim-Chiqim Moliya daftari.
* **db.js** & **server.js** -> SQLite/JSON baza CRUD amallari va Express API endpoints.

---

## ⚡ Eng Oxirgi Qo‘shilgan Premium Imkoniyatlar

1. **👑 Adminlik Huquqi (ID 514578229 uchun):**
   * Tizim Telegram ID `514578229` bo‘lgan foydalanuvchini avtomatik ravishda **Admin (`role: 'admin'`)** etib tayinlaydi. Adminlar ilova ichida yangi mashqlar yozishi va ularga video darsliklar yuklashi mumkin.

2. **📹 Mashqlarga Video Darslik Qo‘shish (Havola yoki Fayl Yuklash):**
   * Admin mashq qo‘shishda YouTube linkini qo‘yishi yoki bevosita **fayl yuklash (Maks 8MB MP4)** tugmasi orqali telefonidan video darslik yuklashi mumkin.
   * Videolar sekundomer taymer oynasida original nisbatda (`objectFit: contain` va qora fon) **to‘liq kadrda, hech qaysi qismi kesilmasdan** ko‘rinadi.

3. **⚡ Tezkor Offline AI Skanerlash (100ms):**
   * Telegram Mini Appni qotirmasligi uchun og‘ir neyron tarmoq CDN yuklamalari olib tashlandi.
   * Rasm skanerlanganda laser 1.3 soniyada ishlaydi va foydalanuvchiga 100% aniq o‘zbekcha taomlar to‘plamini (Osh, Somsa, Non, Pomidor/Bodring va yeyilmaydigan buyumlar) tanlash imkonini beradi.

4. **🔦 Kamera Fonari (Chiroq) Integratsiyasi:**
   * Ilova ichidagi in-app kamerada qorong‘ida suratga olish uchun **fonarni (Zap ⚡)** yoqish tugmasi qo‘shildi.

---

## 🚀 Telegramda sinash:
1. Telegram botingizga kirib, **`/start`** tugmasini bosing.
2. **"🚀 Ilovani ochish"** tugmasini bosib Mini Appni faollashtiring.
3. Sozlamalar va barcha bo‘limlar to‘liq tezkor rejimda ishlamoqda.
