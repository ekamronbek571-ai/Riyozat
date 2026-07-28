import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, CheckSquare, Target, Wallet, Settings as SettingsIcon, Apple } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import Habits from './components/Habits.jsx';
import Goals from './components/Goals.jsx';
import Settings from './components/Settings.jsx';
import Finance from './components/Finance.jsx';
import CalorieTracker from './components/CalorieTracker.jsx';

// Get Telegram WebApp object
const tg = window.Telegram?.WebApp;

// Multilingual Dictionary
const translations = {
  uz: {
    dashboard: "Dashboard",
    habits: "Odatlar",
    goals: "Maqsadlar",
    plans: "Rejalar",
    settings: "Sozlamalar",
    streak: "kunlik streak",
    completed: "Bajarildi",
    today_progress: "Bugungi Progress",
    progress_desc: "Bugun {total} ta odatdan {completed} tasi bajarildi.",
    active_goals: "Maqsadlar Progressi",
    today_habits: "Bugungi Odatlar",
    manage: "Boshqarish",
    all: "Barchasi",
    add_habit: "Yangi Odat",
    add_goal: "Yangi Maqsad",
    no_goals: "Hozircha maqsadlar yo'q.",
    no_habits: "Barcha odatlar o'chirilgan yoki qo'shilmagan.",
    restore: "Tiklash",
    welcome_back: "Kuningiz xayrli o'tsin!",
    habits_subtitle: "Eslatmalar yoqilgan odatlaringiz uchun belgilangan vaqtda Telegram botingiz orqali xabar yuboriladi.",
    prayer_times: "🕌 Namoz Vaqtlari",
    sleep_schedule: "🛌 Uyqu Rejimi",
    personal_habits: "⚡️ Shaxsiy Odatlar",
    empty_prayers: "Barcha namoz odatlari o'chirilgan. Tiklash tugmasini bosib ularni qaytarishingiz mumkin.",
    empty_sleep: "Uyqu tartibi odatlari o'chirilgan.",
    empty_custom: "Hozircha shaxsiy odatlar yo'q. \"+\" tugmasini bosib yangi odat qo'shing.",
    modal_add_habit: "Yangi Odat Qo'shish",
    modal_edit_habit: "Odatni Tahrirlash",
    habit_name_lbl: "Odat Nomi",
    habit_name_placeholder: "Masalan: Kitob o'qish, Sport...",
    habit_time_lbl: "Eslatma Vaqti",
    habit_category_lbl: "Kategoriya",
    category_custom: "Shaxsiy Odat",
    category_namoz: "Namoz Odat",
    category_sleep: "Uyqu Odat",
    cancel: "Bekor qilish",
    save: "Saqlash",
    change: "O'zgartirish",
    goals_subtitle: "O'z oldingizga aniq maqsadlar qo'ying va kunlik progressni oshirib boring. Kichik qadamlar katta muvaffaqiyatga yetaklaydi!",
    until: "gacha",
    update_progress: "Progressni yangilash:",
    congrats: "Tabriklaymiz! Maqsadga erishildi 🎉",
    modal_add_goal: "Yangi Maqsad Qo'shish",
    goal_name_lbl: "Maqsad Nomi",
    goal_name_placeholder: "Masalan: Kitob o'qish, Suv ichish...",
    goal_target_lbl: "Maqsad Miqdori",
    goal_unit_lbl: "O'lchov Birligi",
    goal_unit_placeholder: "bet, litr, marta...",
    goal_deadline_lbl: "Oxirgi Muddat",
    no_goals_desc: "Yangi maqsad qo'shing va muvaffaqiyat sari intiling!",
    settings_subtitle: "Loyiha sozlamalarini o'zgartiring va bildirishnomalarni sinab ko'ring.",
    settings_notif_title: "Telegram Eslatmalar",
    settings_notif_desc: "Odatlar vaqtida botdan xabar yuborish",
    settings_lang_title: "Tizim Tili",
    settings_lang_desc: "Ilova tilini tanlang",
    settings_bot_status: "Bot Holati",
    settings_connection: "Ulanish Turi:",
    settings_real_desc: "Bot Telegram bilan muvaffaqiyatli bog'langan. Eslatmalar to'g'ridan-to'g'ri Telegram akkauntingizga boradi.",
    settings_mock_desc: "Bot tokeni kiritilmagani sababli test rejimida ishlamoqda. Eslatmalar Telegramga yuborilmaydi, lekin pastdagi jurnalda va server konsolida simulyatsiya qilinadi.",
    settings_test_btn: "Eslatmani Sinab Ko'rish",
    settings_sending: "Yuborilmoqda...",
    settings_sent: "Eslatma yuborildi! ✅",
    settings_log_title: "🔔 Eslatmalar Jurnali",
    settings_log_clear: "Tozalash",
    settings_empty_logs: "Hozircha eslatmalar yuborilmadi.",
    settings_logs_help: "Sinash uchun yuqoridagi 'Sinab Ko'rish' tugmasini bosing.",
    lang_uz: "O'zbekcha",
    lang_ru: "Русский",
    lang_en: "English",
    choose_habit: "Odat Turini Tanlang",
    meditation: "Meditatsiya",
    reading: "Kitob o'qish",
    exercise: "Jismoniy mashq",
    diary: "Kundalik yozish",
    habit_form_title: "Hayotingizni o'zgartiring",

    // Profile Settings
    premium_member: "Premium A'zo",
    habits_lbl: "Odatlar",
    goals_lbl: "Maqsadlar",
    plans_lbl: "Rejalar",
    count_unit: "ta",
    settings_profile_subtitle: "Shaxsiy profil kartangiz hamda tizim eslatma sozlamalari",
    avatar_size_error: "Profil rasmi hajmi juda katta! 1MB dan kamroq rasm yuklang.",

    // Finance Tab
    finance_title: "Moliya",
    finance_subtitle: "Kundalik xarajatlaringizni toifalarga bo'lingan holda interaktiv kuzatib boring.",
    net_balance: "Sof Balansingiz",
    total_income: "Jami Kirim",
    total_expense: "Jami Chiqim",
    lent_lbl: "Berilgan Qarz (Lent)",
    borrowed_lbl: "Olingan Qarz (Borrowed)",
    people_lent_you: "Siz odamlardan {amount} qarzdorsiz.",
    people_borrowed_from_you: "Odamlar sizdan {amount} qarzdor.",
    expense_breakdown: "Xarajatlar Taqsimoti",
    add_tx_title: "Yangi Amal Kiritish",
    amount_placeholder: "Miqdori (masalan: 25000)",
    desc_placeholder: "Izoh (masalan: Go'sht, Maosh...)",
    tx_expense: "🔴 Chiqim (Xarajat)",
    tx_income: "🟢 Kirim (Daromad)",
    tx_lend: "↗️ Qarz Berish (Lend)",
    tx_borrow: "↙️ Qarz Olish (Borrow)",
    cat_general: "Boshqa amallar",
    cat_food: "Oziq-ovqat",
    cat_transport: "Transport",
    cat_salary: "Maosh / Daromad",
    cat_home: "Uy-ro'zg'or",
    cat_entertainment: "Ko'ngilochar",
    cat_gift: "Sovg'a",
    cat_loan: "Qarz oldi-berdi",
    history_title: "Amallar Tarixi",
    filter_lbl: "Saralash",
    filter_all: "Barchasi",
    filter_expense: "🔴 Chiqimlar",
    filter_income: "🟢 Kirimlar",
    filter_loan: "🤝 Qarzlar",
    delete_action: "O'chirish",
    settled_action: "Yopildi",
    settle_loan_confirm: "Ushbu qarz aloqasini yopilgan deb belgilamoqchimisiz?",
    valid_amount_error: "Iltimos, to'g'ri miqdor kiriting.",
    valid_desc_error: "Iltimos, izoh yozing.",
    no_tx_desc: "Ushbu turdagi moliyaviy amallar mavjud emas.",

    // Plans Tab
    plans_title: "Rejalashtirish",
    add_plan_title: "Yangi Reja Qo'shish",
    plans_subtitle: "Kichik qadamlar bilan haftalik va oylik rejalar yordamida maqsadlaringizga erishing.",
    weekly_plans: "Haftalik Rejalar",
    monthly_plans: "Oylik Rejalar",
    completed_plans: "bajarildi",
    new_plan_placeholder: "Yangi reja kiritish...",
    add_plan_btn: "Qo'shish",
    plan_growth: "Rivojlanish",
    plan_health: "Salomatlik",
    plan_work: "Ish/O'qish",
    plan_other: "Boshqa",
    plan_type_weekly: "📅 Haftalik",
    plan_type_monthly: "🗓️ Oylik",
    no_plans_desc: "Hozircha rejalar yo'q. Yangi reja qo'shing!",
    plans_count_lbl: "{count} ta reja",
    link_finance: "Moliya bilan bog'lash",
    link_finance_desc: "Ushbu reja bajarilganda tranzaksiya avtomat qo'shiladi",
    linked_amount: "Bog'langan summa",
    linked_transaction_msg: "Reja bajarildi! Moliya bo'limiga {amount} ({type}) yozildi.",
    level_badge_title: "Daraja",
    level_title_1: "🌱 Yangi O'quvchi",
    level_title_2: "🛡️ Intizomli Kurashchi",
    level_title_3: "⚡ Odatlar Ustasi",
    level_title_4: "👑 Odatlar Qiroli",
    next_level_xp: "Keyingi darajaga: {xp} XP",
    budget_limit_lbl: "Budjet limiti",
    budget_settings_title: "Budjet Limitlarini O'rnatish",
    monthly_limit_lbl: "Oylik limit",
    limit_reached_warn: "⚠️ Diqqat! Limit to'ldi!",
    limit_warning: "⚠️ Budjetingiz {percent}% ga yetdi!",
    share_challenge_btn: "Do'stlarni chellenjga taklif qilish",
    share_challenge_text: "Men bilan odat shakllantirish musobaqasiga qo'shiling! Telegram Mini App: {link}",
    invite_copied_msg: "Taklif havolasi nusxalandi!",

    // Goals & Habits additions
    today_done: "Bugun qildim",
    not_done: "Qilmadim",
    motivation_badge: "Motivatsiya",
    calendar_toggle: "Kalendar",
    prayer_bomdod: "Bomdod",
    prayer_peshin: "Peshin",
    prayer_asr: "Asr",
    prayer_shom: "Shom",
    prayer_xufton: "Xufton",
    habit_voice_record_lbl: "Eslatmada Ovozli Xabarni eshittirish",
    habit_voice_desc: "Eslatma vaqti kelganda shaxsiy yozib olingan ovozingiz bilan signal beradi",
    habit_record_start: "Ovoz yozishni boshlash",
    habit_record_stop: "Ovozni to'xtatish",
    habit_record_playing: "Eshitib ko'rish",
    habit_record_delete: "Ovozni o'chirish",
    habit_image_lbl: "Daldalovchi Rasm yuklash (Rasm/Fon)",
    radial_wheel_title: "📊 Oylik Odatlar G'ildiragi (Calendar Wheel)",
    suggestion_quick_add: "Tavsiyalar: Tezkor Odat Qo'shish",
    voice_input_start: "Ovoz orqali kiritish",
    voice_listening: "Eshitmoqdaman...",
    voice_parse_error: "Tushunarsiz ovoz, iltimos miqdor va izohni aniqroq gapiring.",
    voice_mic_blocked: "Mikrofondan foydalanishga ruxsat berilmadi yoki qo'llab-quvvatlanmaydi.",
    currency_unit: "so'm",
    voice_not_supported: "Sizning brauzeringizda ovozni aniqlash tizimi qo'llab-quvvatlanmaydi."
  },
  ru: {
    dashboard: "Панель",
    habits: "Привычки",
    goals: "Цели",
    plans: "Планы",
    settings: "Настройки",
    streak: "дн. подряд",
    completed: "Выполнено",
    today_progress: "Прогресс сегодня",
    progress_desc: "Сегодня выполнено {completed} из {total} привычек.",
    active_goals: "Прогресс целей",
    today_habits: "Привычки на сегодня",
    manage: "Управлять",
    all: "Все",
    add_habit: "Новая Привычка",
    add_goal: "Новая Цель",
    no_goals: "Пока нет целей.",
    no_habits: "Все привычки отключены или не добавлены.",
    restore: "Восстановить",
    welcome_back: "Хорошего дня!",
    habits_subtitle: "Уведомления для включенных привычек будут отправлены через Telegram бот в указанное время.",
    prayer_times: "🕌 Время Молитвы",
    sleep_schedule: "🛌 Режим Сна",
    personal_habits: "⚡️ Личные Привычки",
    empty_prayers: "Все привычки молитв отключены. Нажмите «Восстановить», чтобы вернуть их.",
    empty_sleep: "Привычки режима сна отключены.",
    empty_custom: "Личных привычек пока нет. Нажмите «+», чтобы добавить.",
    modal_add_habit: "Добавить Привычку",
    modal_edit_habit: "Редактировать Привычку",
    habit_name_lbl: "Название Привычки",
    habit_name_placeholder: "Например: Чтение книги, Спорт...",
    habit_time_lbl: "Время Уведомления",
    habit_category_lbl: "Категория",
    category_custom: "Личная привычка",
    category_namoz: "Молитва",
    category_sleep: "Режим сна",
    cancel: "Отмена",
    save: "Сохранить",
    change: "Изменить",
    goals_subtitle: "Ставьте четкие цели и отслеживайте ежедневный прогресс. Маленькие шаги ведут к большому успеху!",
    until: "до",
    update_progress: "Обновить прогресс:",
    congrats: "Поздравляем! Цель достигнута 🎉",
    modal_add_goal: "Добавить Цель",
    goal_name_lbl: "Название Цели",
    goal_name_placeholder: "Например: Чтение книги, Пить воду...",
    goal_target_lbl: "Количество цели",
    goal_unit_lbl: "Единица Измерения",
    goal_unit_placeholder: "стр., литр, раз...",
    goal_deadline_lbl: "Крайний Срок",
    no_goals_desc: "Добавьте новую цель и стремитесь к успеху!",
    settings_subtitle: "Изменяйте настройки проекта и тестируйте уведомления.",
    settings_notif_title: "Telegram Уведомления",
    settings_notif_desc: "Отправлять сообщения в назначенное время привычки",
    settings_lang_title: "Язык Системы",
    settings_lang_desc: "Выберите язык приложения",
    settings_bot_status: "Статус Бота",
    settings_connection: "Подключение:",
    settings_real_desc: "Бот успешно подключен к Telegram. Уведомления будут приходить напрямую в ваш Telegram.",
    settings_mock_desc: "Бот запущен в тестовом режиме. Уведомления не будут отправляться в Telegram, но будут симулироваться в журнале ниже.",
    settings_test_btn: "Проверить Уведомление",
    settings_sending: "Отправка...",
    settings_sent: "Уведомление отправлено! ✅",
    settings_log_title: "🔔 Журнал Уведомлений",
    settings_log_clear: "Очистить",
    settings_empty_logs: "Уведомления еще не отправлялись.",
    settings_logs_help: "Нажмите 'Проверить' выше, чтобы протестировать.",
    lang_uz: "O'zbekcha",
    lang_ru: "Русский",
    lang_en: "English",
    choose_habit: "Выберите тип привычки",
    meditation: "Медитация",
    reading: "Чтение книг",
    exercise: "Физкультура",
    diary: "Ведение дневника",
    habit_form_title: "Измените свою жизнь",

    // Profile Settings
    premium_member: "VIP Участник",
    habits_lbl: "Привычки",
    goals_lbl: "Цели",
    plans_lbl: "Планы",
    count_unit: "ед",
    settings_profile_subtitle: "Ваша личная карточка и настройки системных уведомлений",
    avatar_size_error: "Размер изображения аватара слишком велик! Загрузите файл менее 1 МБ.",

    // Finance Tab
    finance_title: "Финансы",
    finance_subtitle: "Ежедневный интерактивный учет доходов и расходов по категориям.",
    net_balance: "Чистый Баланс",
    total_income: "Всего Доходов",
    total_expense: "Всего Расходов",
    lent_lbl: "Дано в долг (Lent)",
    borrowed_lbl: "Взято в долг (Borrowed)",
    people_lent_you: "Вы должны людям {amount}.",
    people_borrowed_from_you: "Люди должны вам {amount}.",
    expense_breakdown: "Категории расходов",
    add_tx_title: "Добавить запись",
    amount_placeholder: "Сумма (например: 25000)",
    desc_placeholder: "Описание (например: Продукты, Зарплата...)",
    tx_expense: "🔴 Расход (Списание)",
    tx_income: "🟢 Доход (Зачисление)",
    tx_lend: "↗️ Дать в долг (Lent)",
    tx_borrow: "↙️ Взять в долг (Borrow)",
    cat_general: "Другие операции",
    cat_food: "Продукты питания",
    cat_transport: "Транспорт",
    cat_salary: "Зарплата / Доход",
    cat_home: "Дом и быт",
    cat_entertainment: "Развлечения",
    cat_gift: "Подарки",
    cat_loan: "Взаиморасчеты",
    history_title: "История операций",
    filter_lbl: "Фильтр",
    filter_all: "Все",
    filter_expense: "🔴 Расходы",
    filter_income: "🟢 Доходы",
    filter_loan: "🤝 Долги",
    delete_action: "Удалить",
    settled_action: "Закрыто",
    settle_loan_confirm: "Вы хотите отметить эту кредитную операцию как закрытую?",
    valid_amount_error: "Пожалуйста, введите правильную сумму.",
    valid_desc_error: "Пожалуйста, введите описание.",
    no_tx_desc: "Нет финансовых записей данного типа.",

    // Plans Tab
    plans_title: "Планирование",
    add_plan_title: "Добавить новый план",
    plans_subtitle: "Достигайте целей с помощью еженедельных и ежемесячных чек-листов.",
    weekly_plans: "Планы на неделю",
    monthly_plans: "Планы на месяц",
    completed_plans: "выполнено",
    new_plan_placeholder: "Добавить новый план...",
    add_plan_btn: "Добавить",
    plan_growth: "Развитие",
    plan_health: "Здоровье",
    plan_work: "Работа / Учеба",
    plan_other: "Другое",
    plan_type_weekly: "📅 Еженедельно",
    plan_type_monthly: "🗓️ Ежемесячно",
    no_plans_desc: "Нет активных планов. Добавьте новый пункт!",
    plans_count_lbl: "Пунктов: {count}",
    link_finance: "Связать с финансами",
    link_finance_desc: "Транзакция добавится автоматически при выполнении плана",
    linked_amount: "Связанная сумма",
    linked_transaction_msg: "План выполнен! В финансы записано {amount} ({type}).",
    level_badge_title: "Уровень",
    level_title_1: "🌱 Новичок",
    level_title_2: "🛡️ Дисциплинированный боец",
    level_title_3: "⚡ Мастер привычек",
    level_title_4: "👑 Король привычек",
    next_level_xp: "До следующего уровня: {xp} XP",
    budget_limit_lbl: "Лимит бюджета",
    budget_settings_title: "Установка лимитов бюджета",
    monthly_limit_lbl: "Месячный лимит",
    limit_reached_warn: "⚠️ Внимание! Лимит исчерпан!",
    limit_warning: "⚠️ Бюджет достиг {percent}%!",
    share_challenge_btn: "Пригласить друзей на челлендж",
    share_challenge_text: "Присоединяйтесь к моему челленджу привычек! Telegram Mini App: {link}",
    invite_copied_msg: "Ссылка-приглашение скопирована!",

    // Goals & Habits additions
    today_done: "Сделал сегодня",
    not_done: "Не сделал",
    motivation_badge: "Мотивация",
    calendar_toggle: "Календарь",
    prayer_bomdod: "Фаджр (Бомдод)",
    prayer_peshin: "Зухр (Пешин)",
    prayer_asr: "Аср",
    prayer_shom: "Магриб (Шом)",
    prayer_xufton: "Иша (Хуфтон)",
    habit_voice_record_lbl: "Воспроизвести голосовую запись в уведомлении",
    habit_voice_desc: "Проиграет ваш личный записанный голос при наступлении времени напоминания",
    habit_record_start: "Начать запись",
    habit_record_stop: "Остановить",
    habit_record_playing: "Воспроизвести",
    habit_record_delete: "Удалить голос",
    habit_image_lbl: "Загрузить мотивационный фон карточки",
    radial_wheel_title: "📊 Месячный круг привычек (Calendar Wheel)",
    suggestion_quick_add: "Предложения: Быстрое добавление",
    voice_input_start: "Голосовой ввод",
    voice_listening: "Слушаю...",
    voice_parse_error: "Не распознано. Произнесите сумму и описание четче.",
    voice_mic_blocked: "Доступ к микрофону отклонен или не поддерживается.",
    currency_unit: "сум",
    voice_not_supported: "Голосовой ввод не поддерживается в этом браузере."
  },
  en: {
    dashboard: "Dashboard",
    habits: "Habits",
    goals: "Goals",
    plans: "Plans",
    settings: "Settings",
    streak: "day streak",
    completed: "Completed",
    today_progress: "Today's Progress",
    progress_desc: "Today {completed} out of {total} habits completed.",
    active_goals: "Goals Progress",
    today_habits: "Today's Habits",
    manage: "Manage",
    all: "All",
    add_habit: "New Habit",
    add_goal: "New Goal",
    no_goals: "No goals set yet.",
    no_habits: "All habits disabled or not added.",
    restore: "Restore",
    welcome_back: "Have a great day!",
    habits_subtitle: "Reminders will be sent via Telegram bot at the specified time for enabled habits.",
    prayer_times: "🕌 Prayer Times",
    sleep_schedule: "🛌 Sleep Schedule",
    personal_habits: "⚡️ Personal Habits",
    empty_prayers: "All prayer habits disabled. Click 'Restore' to return them.",
    empty_sleep: "Sleep schedule habits disabled.",
    empty_custom: "No personal habits yet. Click '+' to add a new habit.",
    modal_add_habit: "Add New Habit",
    modal_edit_habit: "Edit Habit",
    habit_name_lbl: "Habit Name",
    habit_name_placeholder: "e.g. Reading book, Exercise...",
    habit_time_lbl: "Reminder Time",
    habit_category_lbl: "Category",
    category_custom: "Personal Habit",
    category_namoz: "Prayer",
    category_sleep: "Sleep Schedule",
    cancel: "Cancel",
    save: "Save",
    change: "Change",
    goals_subtitle: "Set clear goals and track daily progress. Small steps lead to big success!",
    until: "until",
    update_progress: "Update progress:",
    congrats: "Congratulations! Goal achieved 🎉",
    modal_add_goal: "Add New Goal",
    goal_name_lbl: "Goal Name",
    goal_name_placeholder: "e.g. Reading book, Drink water...",
    goal_target_lbl: "Target Amount",
    goal_unit_lbl: "Measurement Unit",
    goal_unit_placeholder: "pages, liters, times...",
    goal_deadline_lbl: "Deadline Date",
    no_goals_desc: "Add a new goal and strive for success!",
    settings_subtitle: "Change project settings and test notifications.",
    settings_notif_title: "Telegram Reminders",
    settings_notif_desc: "Send messages when habit time arrives",
    settings_lang_title: "System Language",
    settings_lang_desc: "Select application language",
    settings_bot_status: "Bot Status",
    settings_connection: "Connection:",
    settings_real_desc: "Bot is successfully connected to Telegram. Reminders will arrive directly in your Telegram.",
    settings_mock_desc: "Bot is running in mock mode. Reminders will not be sent to Telegram, but will be simulated in the log below.",
    settings_test_btn: "Test Notification",
    settings_sending: "Sending...",
    settings_sent: "Notification sent! ✅",
    settings_log_title: "🔔 Notification Log",
    settings_log_clear: "Clear",
    settings_empty_logs: "No notifications sent yet.",
    settings_logs_help: "Click 'Test Notification' above to test.",
    lang_uz: "O'zbekcha",
    lang_ru: "Русский",
    lang_en: "English",
    choose_habit: "Choose first habit",
    meditation: "Meditation",
    reading: "Reading Book",
    exercise: "Exercise",
    diary: "Write Diary",
    habit_form_title: "Transform your life",

    // Profile Settings
    premium_member: "Premium Member",
    habits_lbl: "Habits",
    goals_lbl: "Goals",
    plans_lbl: "Plans",
    count_unit: "items",
    settings_profile_subtitle: "Your personal profile card and system notification settings",
    avatar_size_error: "Avatar image size is too large! Upload an image less than 1MB.",

    // Finance Tab
    finance_title: "Finance",
    finance_subtitle: "Track your daily expenses interactively, broken down by categories.",
    net_balance: "Net Balance",
    total_income: "Total Income",
    total_expense: "Total Expense",
    lent_lbl: "Lent Amount",
    borrowed_lbl: "Borrowed Amount",
    people_lent_you: "You owe people {amount}.",
    people_borrowed_from_you: "People owe you {amount}.",
    expense_breakdown: "Expense Breakdown",
    add_tx_title: "Add New Transaction",
    amount_placeholder: "Amount (e.g. 25000)",
    desc_placeholder: "Description (e.g. Groceries, Salary...)",
    tx_expense: "🔴 Expense",
    tx_income: "🟢 Income",
    tx_lend: "↗️ Lend Money",
    tx_borrow: "↙️ Borrow Money",
    cat_general: "Other",
    cat_food: "Food",
    cat_transport: "Transport",
    cat_salary: "Salary / Income",
    cat_home: "Household",
    cat_entertainment: "Entertainment",
    cat_gift: "Gift",
    cat_loan: "Debt / Loan",
    history_title: "Transaction History",
    filter_lbl: "Filter",
    filter_all: "All",
    filter_expense: "🔴 Expenses",
    filter_income: "🟢 Incomes",
    filter_loan: "🤝 Loans",
    delete_action: "Delete",
    settled_action: "Settled",
    settle_loan_confirm: "Do you want to mark this loan transaction as settled?",
    valid_amount_error: "Please enter a valid amount.",
    valid_desc_error: "Please enter a description.",
    no_tx_desc: "No financial transactions of this type.",

    // Plans Tab
    plans_title: "Planning",
    add_plan_title: "Add New Plan",
    plans_subtitle: "Achieve your goals using weekly and monthly checklists in small steps.",
    weekly_plans: "Weekly Plans",
    monthly_plans: "Monthly Plans",
    completed_plans: "completed",
    new_plan_placeholder: "Enter new plan...",
    add_plan_btn: "Add",
    plan_growth: "Growth",
    plan_health: "Health",
    plan_work: "Work/Study",
    plan_other: "Other",
    plan_type_weekly: "📅 Weekly",
    plan_type_monthly: "🗓️ Monthly",
    no_plans_desc: "No plans yet. Add a new item!",
    plans_count_lbl: "{count} plans",
    link_finance: "Link to Finance",
    link_finance_desc: "Transaction will be automatically created upon plan completion",
    linked_amount: "Linked Amount",
    linked_transaction_msg: "Plan completed! Added {amount} ({type}) to finance.",
    level_badge_title: "Level",
    level_title_1: "🌱 Novice",
    level_title_2: "🛡️ Disciplined Fighter",
    level_title_3: "⚡ Habit Master",
    level_title_4: "👑 Habit King",
    next_level_xp: "To next level: {xp} XP",
    budget_limit_lbl: "Budget limit",
    budget_settings_title: "Set Budget Limits",
    monthly_limit_lbl: "Monthly limit",
    limit_reached_warn: "⚠️ Warning! Limit reached!",
    limit_warning: "⚠️ Budget has reached {percent}%!",
    share_challenge_btn: "Invite friends to challenge",
    share_challenge_text: "Join my habit challenge! Telegram Mini App: {link}",
    invite_copied_msg: "Invite link copied!",

    // Goals & Habits additions
    today_done: "Done today",
    not_done: "Not done",
    motivation_badge: "Motivation",
    calendar_toggle: "Calendar",
    prayer_bomdod: "Fajr (Bomdod)",
    prayer_peshin: "Dhuhr (Peshin)",
    prayer_asr: "Asr",
    prayer_shom: "Maghrib (Shom)",
    prayer_xufton: "Isha (Xufton)",
    habit_voice_record_lbl: "Play custom voice audio in notification",
    habit_voice_desc: "Will play your custom recorded voice when reminder time comes",
    habit_record_start: "Start Recording",
    habit_record_stop: "Stop",
    habit_record_playing: "Play Audio",
    habit_record_delete: "Delete voice",
    habit_image_lbl: "Upload motivational card background",
    radial_wheel_title: "📊 Monthly Habit Calendar Wheel",
    suggestion_quick_add: "Suggestions: Quick Add",
    voice_input_start: "Voice Input",
    voice_listening: "Listening...",
    voice_parse_error: "Could not understand. Please state amount and description clearly.",
    voice_mic_blocked: "Microphone access denied or not supported.",
    currency_unit: "UZS",
    voice_not_supported: "Voice input is not supported in this browser."
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    triggerHaptic('selection');
  };
  const [user, setUser] = useState(null);
  const [isMockMode, setIsMockMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prefilledHabit, setPrefilledHabit] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [togglingHabits, setTogglingHabits] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Reset all theme classes
    document.body.classList.remove('dark-theme', 'theme-cyberpunk', 'theme-forest', 'theme-royal');
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (theme === 'cyberpunk') {
      document.body.classList.add('theme-cyberpunk');
    } else if (theme === 'forest') {
      document.body.classList.add('theme-forest');
    } else if (theme === 'royal') {
      document.body.classList.add('theme-royal');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auto-theme sync with Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const tgScheme = tg.colorScheme; // 'dark' or 'light'
      const storedTheme = localStorage.getItem('theme');
      
      if (!storedTheme && tgScheme) {
        setTheme(tgScheme);
      }
      
      const handleThemeChange = () => {
        const newScheme = tg.colorScheme;
        if (newScheme) {
          setTheme(newScheme);
        }
      };
      
      tg.onEvent('themeChanged', handleThemeChange);
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, []);

  const triggerHaptic = (type = 'light') => {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      try {
        if (type === 'success' || type === 'warning' || type === 'error') {
          tg.HapticFeedback.notificationOccurred(type);
        } else if (type === 'light' || type === 'medium' || type === 'heavy' || type === 'rigid' || type === 'soft') {
          tg.HapticFeedback.impactOccurred(type);
        } else if (type === 'selection') {
          tg.HapticFeedback.selectionChanged();
        }
      } catch (e) {
        console.error("Haptic feedback error:", e);
      }
    }
  };

  // Satisfying ASMR Synthesizer
  const playSound = (type) => {
    const soundEnabled = user?.settings?.soundEffectsEnabled !== false;
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'chime') {
        const now = ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gainNode.gain.setValueAtTime(0.12, now + idx * 0.08);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.55);
        });
      } else if (type === 'cash') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        
        // Metallic snap (white noise click)
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.06, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        source.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        source.start(now);
        source.stop(now + 0.08);
      } else if (type === 'level') {
        const now = ctx.currentTime;
        const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gainNode.gain.setValueAtTime(0.08, now + idx * 0.07);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.4);
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.45);
        });
      }
    } catch (e) {
      console.warn("Sound blocked", e);
    }
  };

  const spiritualAudioRef = useRef(null);
  const achievementAudioRef = useRef(null);

  useEffect(() => {
    spiritualAudioRef.current = new Audio('/audio/spiritual_voice.mp3');
    spiritualAudioRef.current.preload = 'auto';
    spiritualAudioRef.current.load();

    achievementAudioRef.current = new Audio('/audio/achievement_voice.mp3');
    achievementAudioRef.current.preload = 'auto';
    achievementAudioRef.current.load();
  }, []);

  const speakNotification = (text, type = 'spiritual') => {
    const soundEnabled = user?.settings?.soundEffectsEnabled !== false;
    if (!soundEnabled) return;
    try {
      const audio = type === 'spiritual' ? spiritualAudioRef.current : achievementAudioRef.current;
      if (audio) {
        audio.currentTime = 0; // Reset to start for instant playback
        audio.volume = 0.9;
        audio.play().catch(err => {
          console.warn("Preloaded audio play blocked, falling back to speech synthesis:", err);
          // Fallback to local device Text-to-Speech
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const trVoice = voices.find(v => v.lang.toLowerCase().startsWith('tr'));
            if (trVoice) utterance.voice = trVoice;
            else utterance.lang = 'uz-UZ';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          }
        });
      } else {
        // Fallback if not initialized yet
        const audioPath = type === 'spiritual' ? '/audio/spiritual_voice.mp3' : '/audio/achievement_voice.mp3';
        const fallbackAudio = new Audio(audioPath);
        fallbackAudio.volume = 0.9;
        fallbackAudio.play().catch(e => console.warn("Fallback audio play blocked:", e));
      }
    } catch (err) {
      console.warn("Audio play failed:", err);
    }
  };

  // Telegram User Information Fallbacks
  const userId = tg?.initDataUnsafe?.user?.id || 'test-user-id';
  const firstName = tg?.initDataUnsafe?.user?.first_name || 'Foydalanuvchi';
  const username = tg?.initDataUnsafe?.user?.username || 'user';

  // Translation Helper
  const currentLang = user?.settings?.language || 'uz';
  const t = (key) => {
    return translations[currentLang]?.[key] || translations['uz']?.[key] || key;
  };

  const [playedAlarms, setPlayedAlarms] = useState({});

  // Real-time client-side voice talking alarm clock
  useEffect(() => {
    if (!user || !user.habits) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;
      
      const yyyy = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${month}-${dd}`;

      user.habits.forEach(habit => {
        if (!habit.enabled || !habit.voiceEnabled || habit.time !== currentTime) return;

        // Check if already played today
        if (playedAlarms[habit.id] === todayStr) return;

        // Trigger voice alarm
        if (habit.voiceAudio && habit.voiceAudio.startsWith('data:audio')) {
          const audio = new Audio(habit.voiceAudio);
          audio.play().catch(e => console.warn("Autoplay blocked by browser policy:", e));
        } else {
          // Speak using browser text-to-speech fallback
          let speakText = `Eslatma: ${habit.name} vaqti bo'ldi!`;
          if (habit.category === 'namoz') {
            speakText = `Namoz vaqti: ${habit.name} kirdi.`;
          }
          const utterance = new SpeechSynthesisUtterance(speakText);
          // Phonetically adapt uzbek language using Turkish TTS engine since Turkish sounds closest and is supported by mobile browser engines
          utterance.lang = currentLang === 'uz' ? 'tr-TR' : (currentLang === 'ru' ? 'ru-RU' : 'en-US');
          window.speechSynthesis.speak(utterance);
        }

        // Mark as played
        setPlayedAlarms(prev => ({ ...prev, [habit.id]: todayStr }));
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [user, playedAlarms, currentLang]);

  // Initialize WebApp
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      document.body.classList.add('tg-theme');
    }
    
    // Load config and user data
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch bot mode configuration
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          setIsMockMode(configData.isMockMode);
        }

        // 2. Fetch or create user
        const userRes = await fetch(`/api/user/${userId}?firstName=${encodeURIComponent(firstName)}&username=${encodeURIComponent(username)}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        } else {
          throw new Error("Failed to load user data");
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [userId, firstName, username]);

  // Refetch user data utility
  const refreshUser = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error("User refresh failed:", e);
    }
  };

  // Suggestion Handler
  const handleSelectSuggestion = (name, category) => {
    setPrefilledHabit({ name, category });
    setActiveTab('habits');
  };

  // Optimistic Toggle Habit Handler (Snappy Clicks with Race Condition Locking!)
  const handleToggleHabit = (habitId, completed) => {
    if (togglingHabits[habitId]) return;

    // Set lock
    setTogglingHabits(prev => ({ ...prev, [habitId]: true }));

    const today = new Date();
    const yyyy = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${month}-${dd}`;

    // Play satisfying Zen chime, speak notification, and show glowing toast (dynamic based on category)
    if (completed) {
      playSound('chime');
      triggerHaptic('success');
      
      const toggledHabit = user?.habits?.find(h => h.id === habitId);
      const isNamoz = toggledHabit?.category === 'namoz';

      if (isNamoz) {
        const spiritualMsg = currentLang === 'uz' ? "Bir qadam Allohga yaqinlashdingiz" : (currentLang === 'ru' ? "Вы стали на один шаг ближе к Аллаху" : "You drew one step closer to Allah");
        speakNotification(spiritualMsg, 'spiritual');
        setToastMessage(currentLang === 'uz' ? "Bir qadam Allohga yaqinlashdingiz! 🕋" : (currentLang === 'ru' ? "Вы стали на шаг ближе к Аллаху! 🕋" : "You drew one step closer to Allah! 🕋"));
      } else {
        const achievementMsg = currentLang === 'uz' ? "Bugun buni uddaladingiz" : (currentLang === 'ru' ? "Сегодня вы справились с этим" : "You made it today");
        speakNotification(achievementMsg, 'achievement');
        setToastMessage(currentLang === 'uz' ? "Siz bugun buni uddaladingiz! 🌟" : (currentLang === 'ru' ? "Сегодня вы справились с этим! 🌟" : "You made it today! 🌟"));
      }
      setTimeout(() => setToastMessage(''), 3500);
    }

    // 1. Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      
      // Level up sound check logic: if XP is about to cross level boundary
      if (completed) {
        const oldXp = prevUser.xp || 0;
        const newXp = oldXp + 10;
        const oldLevel = Math.floor(Math.sqrt(oldXp / 100)) + 1;
        const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
        if (newLevel > oldLevel) {
          setTimeout(() => playSound('level'), 600);
        }
      }

      const updatedHabits = prevUser.habits.map(habit => {
        if (habit.id === habitId) {
          const completedDates = { ...(habit.completedDates || {}) };
          if (completed) {
            completedDates[todayStr] = true;
          } else {
            delete completedDates[todayStr];
          }
          return { ...habit, completedDates };
        }
        return habit;
      });
      return { ...prevUser, habits: updatedHabits };
    });

    // 2. Background Sync with Lock Release
    fetch(`/api/user/${userId}/habit/${habitId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayStr, completed })
    }).then(res => {
      if (res.ok) {
        res.json().then(data => {
          setUser(prevUser => {
            if (!prevUser) return prevUser;
            return {
              ...prevUser,
              xp: data.user.xp,
              level: data.user.level,
              streak: data.user.streak
            };
          });
        });
      } else {
        // Revert on server error
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          const updatedHabits = prevUser.habits.map(h => {
            if (h.id === habitId) {
              const completedDates = { ...(h.completedDates || {}) };
              if (completed) {
                delete completedDates[todayStr];
              } else {
                completedDates[todayStr] = true;
              }
              return { ...h, completedDates };
            }
            return h;
          });
          return { ...prevUser, habits: updatedHabits };
        });
      }
    })
    .catch(e => {
      console.error("Toggle sync failed:", e);
      // Revert on network error
      setUser(prevUser => {
        if (!prevUser) return prevUser;
        const updatedHabits = prevUser.habits.map(h => {
          if (h.id === habitId) {
            const completedDates = { ...(h.completedDates || {}) };
            if (completed) {
              delete completedDates[todayStr];
            } else {
              completedDates[todayStr] = true;
            }
            return { ...h, completedDates };
          }
          return h;
        });
        return { ...prevUser, habits: updatedHabits };
      });
    })
    .finally(() => {
      // Release lock
      setTogglingHabits(prev => {
        const next = { ...prev };
        delete next[habitId];
        return next;
      });
    });
  };

  const handleUpdateWater = async (amount) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${month}-${dd}`;

    if (amount > 0) {
      playSound('chime');
    }

    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const logs = { ...(prevUser.waterLogs || {}) };
      if (amount === 0) {
        logs[todayStr] = 0;
      } else {
        logs[todayStr] = Math.max(0, (logs[todayStr] || 0) + amount);
      }
      return { ...prevUser, waterLogs: logs };
    });

    try {
      const res = await fetch(`/api/user/${userId}/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr, amount })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Water update sync failed:", e);
    }
  };

  const handleUpdateWeight = async (weight) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${month}-${dd}`;

    playSound('chime');
    triggerHaptic('success');

    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const logs = { ...(prevUser.weightLogs || {}) };
      const val = parseFloat(weight);
      if (val > 0) {
        logs[todayStr] = val;
      } else {
        delete logs[todayStr];
      }
      return { ...prevUser, weightLogs: logs };
    });

    try {
      const res = await fetch(`/api/user/${userId}/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr, weight })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Weight update sync failed:", e);
    }
  };

  const handleLogCalorie = async (date, type, name, calories, protein, carbs, fats) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const logs = { ...(prevUser.calorieLogs || {}) };
      if (!logs[date]) {
        logs[date] = { consumed: 0, burned: 0, items: [] };
      }
      const tempItem = {
        id: 'temp-' + Date.now(),
        type,
        name,
        calories,
        protein,
        carbs,
        fats,
        timestamp: new Date().toISOString()
      };
      const newItems = [...logs[date].items, tempItem];
      let consumed = 0;
      let burned = 0;
      newItems.forEach(item => {
        if (item.type === 'food') consumed += item.calories;
        else if (item.type === 'workout') burned += item.calories;
      });
      logs[date] = { consumed, burned, items: newItems };
      const oldXp = prevUser.xp || 0;
      const nextXp = oldXp + 15;
      const currentLevel = prevUser.level || 1;
      const nextLevelNeedXp = Math.pow(currentLevel, 2) * 100;
      const newLevel = nextXp >= nextLevelNeedXp ? currentLevel + 1 : currentLevel;
      return { ...prevUser, calorieLogs: logs, xp: nextXp, level: newLevel };
    });

    try {
      const res = await fetch(`/api/user/${userId}/calorie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, name, calories, protein, carbs, fats })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Calorie log failed:", e);
    }
  };

  const handleResetCalorie = async (date) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const logs = { ...(prevUser.calorieLogs || {}) };
      logs[date] = { consumed: 0, burned: 0, items: [] };
      return { ...prevUser, calorieLogs: logs };
    });

    try {
      const res = await fetch(`/api/user/${userId}/calorie/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Calorie reset failed:", e);
    }
  };

  const handleDeleteCalorie = async (date, itemId) => {
    setUser(prevUser => {
      if (!prevUser || !prevUser.calorieLogs || !prevUser.calorieLogs[date]) return prevUser;
      const logs = { ...prevUser.calorieLogs };
      const items = (logs[date].items || []).filter(item => item.id !== itemId);
      
      let consumed = 0;
      let burned = 0;
      items.forEach(item => {
        if (item.type === 'food') consumed += item.calories;
        else if (item.type === 'workout') burned += item.calories;
      });
      logs[date] = { consumed, burned, items };
      
      // Deduct XP
      const nextXp = Math.max(0, (prevUser.xp || 0) - 15);
      return { ...prevUser, calorieLogs: logs, xp: nextXp };
    });

    try {
      const res = await fetch(`/api/user/${userId}/calorie/${date}/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Calorie delete failed:", e);
    }
  };

  const handleUpdateParentSettings = async (parentChatId, parentAlertsEnabled) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        parentChatId,
        parentAlertsEnabled
      };
    });

    try {
      const res = await fetch(`/api/user/${userId}/parent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentChatId, parentAlertsEnabled })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error("Parent settings sync failed:", e);
    }
  };

  const handleAddHabit = async (name, time, category, image, voiceEnabled, voiceAudio, rewardAmount = 0, rewardCardId = null) => {
    try {
      const res = await fetch(`/api/user/${userId}/habit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, time, category, image, voiceEnabled, voiceAudio, rewardAmount, rewardCardId })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateHabit = async (habitId, updateData) => {
    // 1. Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const updatedHabits = prevUser.habits.map(habit => {
        if (habit.id === habitId) {
          return { ...habit, ...updateData };
        }
        return habit;
      });
      return { ...prevUser, habits: updatedHabits };
    });

    // 2. Sync
    try {
      const res = await fetch(`/api/user/${userId}/habit/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    // 1. Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        habits: prevUser.habits.filter(h => h.id !== habitId)
      };
    });

    // 2. Sync
    try {
      const res = await fetch(`/api/user/${userId}/habit/${habitId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreDefaultPrayers = async () => {
    if (!user) return;
    
    const prayerNamesMap = {
      uz: ['Bomdod namozi', 'Peshin namozi', 'Asr namozi', 'Shom namozi', 'Xufton namozi'],
      ru: ['Утренняя молитва (Бомдод)', 'Полуденная молитва (Пешин)', 'Послеполуденная молитва (Аср)', 'Вечерняя молитва (Шом)', 'Ночная молитва (Хуфтон)'],
      en: ['Fajr Prayer', 'Dhuhr Prayer', 'Asr Prayer', 'Maghrib Prayer', 'Isha Prayer']
    };

    const currentNames = prayerNamesMap[currentLang] || prayerNamesMap['uz'];
    const times = ['05:00', '13:00', '17:30', '19:50', '21:30'];
    const existingNames = user.habits.map(h => h.name.toLowerCase());
    
    for (let i = 0; i < currentNames.length; i++) {
      if (!existingNames.includes(currentNames[i].toLowerCase())) {
        await handleAddHabit(currentNames[i], times[i], 'namoz', null);
      }
    }
  };

  const handleAddGoal = async (title, target, unit, deadline, image) => {
    try {
      const res = await fetch(`/api/user/${userId}/goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, target, unit, deadline, image })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Optimistic Goal Update Handler (Instant incremental progress!)
  const handleUpdateGoal = (goalId, updateData) => {
    // 1. Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const updatedGoals = prevUser.goals.map(goal => {
        if (goal.id === goalId) {
          let nextCurrent = goal.current;
          if (updateData.current !== undefined) {
            nextCurrent = Math.max(0, Math.min(goal.target, Number(updateData.current)));
          }
          return { ...goal, ...updateData, current: nextCurrent };
        }
        return goal;
      });
      return { ...prevUser, goals: updatedGoals };
    });

    // 2. Sync
    fetch(`/api/user/${userId}/goal/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    }).then(res => {
      if (res.ok) {
        res.json().then(data => setUser(data.user));
      }
    }).catch(e => console.error("Goal update sync failed:", e));
  };

  const handleDeleteGoal = async (goalId) => {
    // 1. Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        goals: prevUser.goals.filter(g => g.id !== goalId)
      };
    });

    // 2. Sync
    try {
      const res = await fetch(`/api/user/${userId}/goal/${goalId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleUpdateSettings = async (settingsData) => {
    // 1. Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        settings: { ...prevUser.settings, ...settingsData }
      };
    });

    // 2. Sync
    try {
      const res = await fetch(`/api/user/${userId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }

      // If city is changed, trigger prayer time API sync!
      if (settingsData.city) {
        const syncRes = await fetch(`/api/user/${userId}/sync-prayer-times`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: settingsData.city })
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          setUser(syncData.user);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleTriggerTestReminder = async () => {
    const testMessages = {
      uz: "🔔 Sinov: Siz belgilagan odat vaqti bo'ldi! Tracker tizimingiz a'lo darajada ishlamoqda. 💪",
      ru: "🔔 Тест: Пришло время вашей привычки! Ваша система трекера работает отлично. 💪",
      en: "🔔 Test: It's time for your habit! Your tracker system is working perfectly. 💪"
    };
    const testMsg = testMessages[currentLang] || testMessages['uz'];

    try {
      const res = await fetch(`/api/user/${userId}/test-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMsg })
      });
      if (res.ok) {
        await refreshUser(); // Fetch logs
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearMockLogs = async () => {
    if (!user) return;
    const updatedUser = {
      ...user,
      settings: {
        ...user.settings,
        mockNotifications: []
      }
    };
    try {
      const res = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleAddPlan = async (text, type, linkedFinance = null) => {
    try {
      const res = await fetch(`/api/user/${userId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type, linkedFinance })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleUpdatePlan = (planId, updateData) => {
    // Check if the plan is being checked (completed = true)
    if (updateData.completed === true && user) {
      const plan = user.plans.find(p => p.id === planId);
      if (plan && plan.linkedFinance && plan.linkedFinance.amount > 0) {
        // Trigger automated transaction creation!
        handleAddTransaction(
          plan.linkedFinance.amount,
          plan.text.startsWith('__cat:') ? plan.text.split('__').slice(2).join('__') : plan.text, // Description is the clean plan text
          plan.linkedFinance.type,
          plan.linkedFinance.category
        );
        
        // Show Telegram-style visual alert toast
        const formatVal = plan.linkedFinance.amount.toLocaleString('uz-UZ') + 
          (currentLang === 'uz' ? ' so\'m' : (currentLang === 'ru' ? ' сум' : ' UZS'));
        const typeLabels = {
          uz: { expense: 'chiqim', income: 'kirim', lend: 'qarz', borrow: 'qarz' },
          ru: { expense: 'расход', income: 'доход', lend: 'долг', borrow: 'долг' },
          en: { expense: 'expense', income: 'income', lend: 'lend', borrow: 'borrow' }
        };
        const activeTypeLabel = (typeLabels[currentLang] || typeLabels['uz'])[plan.linkedFinance.type];
        
        const templateMsg = translations[currentLang]?.linked_transaction_msg || 
          "Reja bajarildi! Moliya bo'limiga {amount} ({type}) yozildi.";
        const displayAlertMsg = templateMsg
          .replace('{amount}', formatVal)
          .replace('{type}', activeTypeLabel);
          
        alert(displayAlertMsg);
      }
    }

    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const updatedPlans = prevUser.plans.map(p => {
        if (p.id === planId) {
          return { ...p, ...updateData };
        }
        return p;
      });
      return { ...prevUser, plans: updatedPlans };
    });

    fetch(`/api/user/${userId}/plan/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    }).then(res => {
      if (res.ok) {
        res.json().then(data => setUser(data.user));
      }
    }).catch(e => console.error("Plan update sync failed:", e));
  };

  const handleDeletePlan = async (planId) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        plans: prevUser.plans.filter(p => p.id !== planId)
      };
    });

    try {
      const res = await fetch(`/api/user/${userId}/plan/${planId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTransaction = async (amount, description, type, category, cardId = null) => {
    try {
      const res = await fetch(`/api/user/${userId}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, type, category, cardId })
      });
      if (res.ok) {
        playSound('cash');
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        transactions: prevUser.transactions.filter(t => t.id !== txId)
      };
    });

    try {
      const res = await fetch(`/api/user/${userId}/transaction/${txId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCard = async (name, balance, type, cardNumber, color) => {
    try {
      const res = await fetch(`/api/user/${userId}/card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, balance, type, cardNumber, color })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      const res = await fetch(`/api/user/${userId}/card/${cardId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCard = async (cardId, updatedData) => {
    try {
      const res = await fetch(`/api/user/${userId}/card/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAvatar = async (base64Image) => {
    const updatedUser = {
      ...user,
      avatar: base64Image
    };
    setUser(updatedUser);
    
    try {
      const res = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(124,58,237,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '24px', textAlign: 'center', background: 'var(--bg-color)' }}>
        <p style={{ color: 'var(--danger)', fontSize: '16px', fontWeight: '600' }}>Error occurred!</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px', marginBottom: '20px' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Quick Top Bar Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '-10px', position: 'relative', zIndex: 10 }}>
        <button 
          onClick={() => setActiveTab(activeTab === 'settings' ? 'dashboard' : 'settings')}
          style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--surface-border)',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            transition: 'all 0.2s',
            color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
          title={t('settings')}
        >
          <SettingsIcon size={16} />
        </button>
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--surface-border)',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            transition: 'all 0.2s',
            fontSize: '16px'
          }}
          title={theme === 'light' ? 'Tungi rejim' : 'Kunduzgi rejim'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Tab Panels */}
      <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
        <Dashboard 
          user={user} 
          onToggleHabit={handleToggleHabit} 
          togglingHabits={togglingHabits}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          t={t}
          currentLang={currentLang}
          onSelectSuggestion={handleSelectSuggestion}
          triggerHaptic={triggerHaptic}
        />
      </div>

      <div className={`tab-content ${activeTab === 'habits' ? 'active' : ''}`}>
        <Habits 
          user={user} 
          onAddHabit={handleAddHabit} 
          onUpdateHabit={handleUpdateHabit} 
          onDeleteHabit={handleDeleteHabit} 
          onRestoreDefaultPrayers={handleRestoreDefaultPrayers}
          t={t}
          prefilledHabit={prefilledHabit}
          clearPrefilledHabit={() => setPrefilledHabit(null)}
          onUpdateWaterIntake={handleUpdateWater}
          triggerHaptic={triggerHaptic}
        />
      </div>

      <div className={`tab-content ${activeTab === 'goals' ? 'active' : ''}`}>
        <Goals 
          user={user} 
          onAddGoal={handleAddGoal} 
          onUpdateGoal={handleUpdateGoal} 
          onDeleteGoal={handleDeleteGoal} 
          onAddPlan={handleAddPlan}
          onUpdatePlan={handleUpdatePlan}
          onDeletePlan={handleDeletePlan}
          t={t}
          triggerHaptic={triggerHaptic}
        />
      </div>

      <div className={`tab-content ${activeTab === 'calorie' ? 'active' : ''}`}>
        <CalorieTracker
          user={user}
          onLogCalorie={handleLogCalorie}
          onResetCalorie={handleResetCalorie}
          onDeleteCalorie={handleDeleteCalorie}
          onUpdateWaterIntake={handleUpdateWater}
          onUpdateWeight={handleUpdateWeight}
          triggerHaptic={triggerHaptic}
          t={t}
        />
      </div>

      <div className={`tab-content ${activeTab === 'finance' ? 'active' : ''}`}>
        <Finance 
          user={user} 
          onAddTransaction={handleAddTransaction} 
          onDeleteTransaction={handleDeleteTransaction} 
          onAddCard={handleAddCard}
          onDeleteCard={handleDeleteCard}
          onUpdateCard={handleUpdateCard}
          t={t}
          isMockMode={isMockMode}
          triggerHaptic={triggerHaptic}
        />
      </div>

      <div className={`tab-content ${activeTab === 'settings' ? 'active' : ''}`}>
        <Settings 
          user={user} 
          onUpdateSettings={handleUpdateSettings} 
          onTriggerTestReminder={handleTriggerTestReminder}
          isMockMode={isMockMode}
          onClearMockLogs={handleClearMockLogs}
          t={t}
          onUpdateAvatar={handleUpdateAvatar}
          theme={theme}
          setTheme={setTheme}
          onUpdateParentSettings={handleUpdateParentSettings}
        />
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <LayoutDashboard />
          <span>{t('dashboard')}</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => handleTabChange('habits')}
        >
          <CheckSquare />
          <span>{t('habits')}</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => handleTabChange('goals')}
        >
          <Target />
          <span>{user.settings?.language === 'uz' ? 'Maqsad & Rejalar' : (user.settings?.language === 'ru' ? 'Цели & Планы' : 'Goals & Plans')}</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => handleTabChange('finance')}
        >
          <Wallet />
          <span>{t('finance_title')}</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'calorie' ? 'active' : ''}`}
          onClick={() => handleTabChange('calorie')}
        >
          <Apple />
          <span>{user.settings?.language === 'uz' ? 'Sport & Kaloriya' : (user.settings?.language === 'ru' ? 'Спорт & Калории' : 'Sport & Calories')}</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <SettingsIcon />
          <span>{t('settings')}</span>
        </button>
      </nav>

      {/* Toast Notification with Emerald Islamic Theme */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '12px 22px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3), 0 0 12px rgba(255, 255, 255, 0.15)',
          zIndex: 99999,
          fontSize: '12px',
          fontWeight: '900',
          textAlign: 'center',
          animation: 'toastBounceIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          whiteSpace: 'nowrap'
        }}>
          <span>🕋</span> {toastMessage}
        </div>
      )}
      
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes toastBounceIn {
          0% { transform: translate(-50%, 30px) scale(0.85); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
