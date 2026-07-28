import React, { useState, useRef } from 'react';
import { Bell, Shield, Send, Trash2, Camera, Sparkles, Volume2 } from 'lucide-react';

export default function Settings({ user, onUpdateSettings, onTriggerTestReminder, isMockMode, onClearMockLogs, onUpdateAvatar, t, theme, setTheme, onUpdateParentSettings }) {
  const [testSent, setTestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const [syncingAvatar, setSyncingAvatar] = useState(false);

  const handleSyncTelegramAvatar = async () => {
    if (syncingAvatar) return;
    setSyncingAvatar(true);
    try {
      const res = await fetch(`/api/user/${user.id}/sync-telegram-avatar`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          onUpdateAvatar(data.user.avatar);
        } else {
          alert("Telegramda profil rasmingiz topilmadi.");
        }
      } else {
        const data = await res.json();
        alert(data.error || "Rasm yuklashda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      alert("Aloqa xatosi: " + err.message);
    } finally {
      setSyncingAvatar(false);
    }
  };

  const [parentId, setParentId] = useState(user.parentChatId || '');
  const [parentAlerts, setParentAlerts] = useState(user.parentAlertsEnabled || false);
  const [parentSuccessMsg, setParentSuccessMsg] = useState('');

  const handleToggleNotifications = () => {
    onUpdateSettings({ notificationsEnabled: !user.settings.notificationsEnabled });
  };

  const handleLanguageChange = (lang) => {
    onUpdateSettings({ language: lang });
  };

  const handleTestReminder = async () => {
    setIsSending(true);
    await onTriggerTestReminder();
    setIsSending(false);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to 1MB size limit
    if (file.size > 1024 * 1024) {
      alert(t('avatar_size_error'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const currentLang = user.settings?.language || 'uz';

  // Stats calculation
  const activeHabitsCount = user.habits ? user.habits.filter(h => h.enabled).length : 0;
  const goalsCount = user.goals ? user.goals.length : 0;
  const plansCount = user.plans ? user.plans.length : 0;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '20px' }}>
      <h1>{t('settings')}</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: '500' }}>
        {t('settings_profile_subtitle')}
      </p>

      {/* 3D LIQUID GLASS VIP PROFILE CARD (Highly aesthetic, matches "shaxsiyat") */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '24px 20px', 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(245, 243, 255, 0.8) 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.65)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 15px 35px rgba(109, 40, 217, 0.08)',
          borderRadius: '28px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px'
        }}
      >
        {/* Glow light background highlights */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

        {/* Top Info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(124, 58, 237, 0.08)', paddingBottom: '18px', marginBottom: '16px' }}>
          
          {/* Circular avatar wrapper with camera overlay */}
          <div style={{ position: 'relative', width: '76px', height: '76px', cursor: 'pointer', flexShrink: 0 }} onClick={handleAvatarClick}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3.5px solid white', boxShadow: '0 4px 14px rgba(124,58,237,0.18)' }} 
                alt="Avatar" 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: 'bold', border: '3.5px solid white', boxShadow: '0 4px 14px rgba(124,58,237,0.18)' }}>
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '0', right: '0', width: '24px', height: '24px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
              <Camera size={12} color="var(--primary)" />
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />

          {/* Name & ID labels */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(124, 58, 237, 0.08)', padding: '2px 8px', borderRadius: '8px', fontSize: '9px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px', border: '1px solid rgba(124,58,237,0.12)' }}>
              <Sparkles size={9} fill="var(--primary)" stroke="none" /> {t('premium_member')}
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px 0', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.firstName || 'Foydalanuvchi'}
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              @{user.username || 'username'}
            </span>
            <div style={{ display: 'block' }}>
              <button
                type="button"
                onClick={handleSyncTelegramAvatar}
                disabled={syncingAvatar}
                style={{
                  background: 'rgba(124, 58, 237, 0.06)',
                  border: '1px solid rgba(124, 58, 237, 0.1)',
                  borderRadius: '6px',
                  color: 'var(--primary)',
                  fontSize: '9.5px',
                  fontWeight: '750',
                  cursor: syncingAvatar ? 'not-allowed' : 'pointer',
                  padding: '4px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '6px',
                  opacity: syncingAvatar ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                🔄 {syncingAvatar ? 'Yuklanmoqda...' : 'Telegram rasmini yuklash'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats row with vertical dividers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
              {t('habits_lbl')}
            </span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {activeHabitsCount} {t('count_unit')}
            </span>
          </div>
          <div style={{ borderLeft: '1px solid rgba(124, 58, 237, 0.08)', borderRight: '1px solid rgba(124, 58, 237, 0.08)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
              {t('goals_lbl')}
            </span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {goalsCount} {t('count_unit')}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
              {t('plans_lbl')}
            </span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {plansCount} {t('count_unit')}
            </span>
          </div>
        </div>

      </div>

      {/* Main Settings Group */}
      <div className="glass-card settings-section">
        
        {/* Dynamic Themes Accent Customizer Selector */}
        <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', borderBottom: '1px solid rgba(124, 58, 237, 0.08)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div className="setting-info">
            <span className="setting-title">🎨 {user.settings?.language === 'uz' ? 'Ilova Ranglari & Dizayni' : (user.settings?.language === 'ru' ? 'Тема и Оформление' : 'App Theme Accent')}</span>
            <span className="setting-desc">{user.settings?.language === 'uz' ? 'O\'zingizga yoqimli premium rangni tanlang' : (user.settings?.language === 'ru' ? 'Выберите премиальное цветовое оформление' : 'Choose your premium neon glow accent color')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
            {[
              { id: 'light', label: '🔮 Lavender', color: '#7c3aed' },
              { id: 'cyberpunk', label: '🔥 Cyberpunk', color: '#f97316' },
              { id: 'forest', label: '🟢 Forest Mint', color: '#10b981' },
              { id: 'royal', label: '👑 Royal Gold', color: '#d97706' }
            ].map(thm => (
              <button
                key={thm.id}
                type="button"
                onClick={() => setTheme(thm.id)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '12px',
                  border: '1.5px solid',
                  borderColor: theme === thm.id ? thm.color : 'var(--surface-border)',
                  background: theme === thm.id ? 'var(--surface-hover)' : 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: theme === thm.id ? `0 4px 12px ${thm.color}20` : 'none'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: thm.color, display: 'inline-block' }}></span>
                {thm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Satisfying Sound FX Toggle */}
        <div className="setting-row" style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.08)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={18} color="var(--primary)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="setting-title">{user.settings?.language === 'uz' ? 'ASMR Ovozli Effektlar' : (user.settings?.language === 'ru' ? 'ASMR Звуковые эффекты' : 'Satisfying Sound FX')}</span>
              <span className="setting-desc">{user.settings?.language === 'uz' ? 'Odat va moliya kiritilganda chiroyli zen chimes chalish' : (user.settings?.language === 'ru' ? 'Приятные звуки при отметке привычек' : 'Play satisfying audio on checks')}</span>
            </div>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={user.settings ? user.settings.soundEffectsEnabled !== false : true} 
              onChange={() => onUpdateSettings({ soundEffectsEnabled: user.settings ? user.settings.soundEffectsEnabled === false : true })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <span className="setting-title">{t('settings_notif_title')}</span>
            <span className="setting-desc">{t('settings_notif_desc')}</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={user.settings ? user.settings.notificationsEnabled : true} 
              onChange={handleToggleNotifications}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Language Selector */}
        <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
          <div className="setting-info">
            <span className="setting-title">{t('settings_lang_title')}</span>
            <span className="setting-desc">{t('settings_lang_desc')}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
            <button 
              type="button" 
              className="lang-selector-btn"
              style={{ 
                flex: 1, 
                justifyContent: 'center',
                background: currentLang === 'uz' ? 'var(--primary-gradient)' : 'white',
                color: currentLang === 'uz' ? 'white' : 'var(--text-primary)',
                borderColor: currentLang === 'uz' ? 'transparent' : '#ede9fe',
                boxShadow: currentLang === 'uz' ? 'var(--primary-glow)' : 'none',
                padding: '10px'
              }}
              onClick={() => handleLanguageChange('uz')}
            >
              🇺🇿 {t('lang_uz')}
            </button>
            <button 
              type="button" 
              className="lang-selector-btn"
              style={{ 
                flex: 1, 
                justifyContent: 'center',
                background: currentLang === 'ru' ? 'var(--primary-gradient)' : 'white',
                color: currentLang === 'ru' ? 'white' : 'var(--text-primary)',
                borderColor: currentLang === 'ru' ? 'transparent' : '#ede9fe',
                boxShadow: currentLang === 'ru' ? 'var(--primary-glow)' : 'none',
                padding: '10px'
              }}
              onClick={() => handleLanguageChange('ru')}
            >
              🇷🇺 {t('lang_ru')}
            </button>
            <button 
              type="button" 
              className="lang-selector-btn"
              style={{ 
                flex: 1, 
                justifyContent: 'center',
                background: currentLang === 'en' ? 'var(--primary-gradient)' : 'white',
                color: currentLang === 'en' ? 'white' : 'var(--text-primary)',
                borderColor: currentLang === 'en' ? 'transparent' : '#ede9fe',
                boxShadow: currentLang === 'en' ? 'var(--primary-glow)' : 'none',
                padding: '10px'
              }}
              onClick={() => handleLanguageChange('en')}
            >
              🇬🇧 {t('lang_en')}
            </button>
          </div>
        </div>

        {/* City Selector for Prayer Times */}
        <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
          <div className="setting-info">
            <span className="setting-title">{t('city_lbl')}</span>
            <span className="setting-desc">{t('city_desc')}</span>
          </div>
          <div style={{ width: '100%', marginTop: '4px' }}>
            <select
              className="form-control"
              style={{ width: '100%', background: 'var(--surface-color)', padding: '10px 14px', borderRadius: '12px', fontSize: '13.5px', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
              value={user.settings?.city || 'Tashkent'}
              onChange={(e) => onUpdateSettings({ city: e.target.value })}
            >
              <option value="Tashkent">🇺🇿 {t('tashkent')}</option>
              <option value="Samarkand">🇺🇿 {t('samarkand')}</option>
              <option value="Bukhara">🇺🇿 {t('bukhara')}</option>
              <option value="Andijan">🇺🇿 {t('andijan')}</option>
              <option value="Fergana">🇺🇿 {t('fergana')}</option>
              <option value="Namangan">🇺🇿 {t('namangan')}</option>
              <option value="Nukus">🇺🇿 {t('nukus')}</option>
              <option value="Karshi">🇺🇿 {t('karshi')}</option>
              <option value="Urgench">🇺🇿 {t('urgench')}</option>
              <option value="Navoiy">🇺🇿 {t('navoiy')}</option>
              <option value="Jizzakh">🇺🇿 {t('jizzakh')}</option>
              <option value="Gulistan">🇺🇿 {t('gulistan')}</option>
              <option value="Termez">🇺🇿 {t('termez')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* BUDGET LIMITS SECTION */}
      <div className="glass-card settings-section">
        <h2 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)', fontWeight: '850' }}>
          <Sparkles size={16} color="var(--primary)" /> {t('budget_settings_title')}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4', fontWeight: '500' }}>
          {user.settings?.language === 'uz' 
            ? "Har bir toifa uchun oylik xarajat cheklovlarini belgilang (limitni o'chirish uchun 0 kiriting):" 
            : (user.settings?.language === 'ru' 
              ? "Установите месячные лимиты расходов по категориям (введите 0 для отключения лимита):" 
              : "Set monthly spending limits for each category (enter 0 to disable limit):")}
        </p>

        {Object.entries({
          food: '🍏 Oziq-ovqat / Food',
          transport: '🚗 Transport',
          home: '🏠 Uy / Home',
          entertainment: '🎮 O\'yin-kulgi / Entertainment',
          gift: '🎁 Sovg\'a / Gifts',
          loan: '💸 Qarz / Loans',
          general: '⚙️ Boshqa / General'
        }).map(([catKey, catLabel]) => {
          const limits = user.settings?.budgetLimits || {};
          const currentLimitVal = limits[catKey] || 0;

          return (
            <div key={catKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', flex: 1 }}>{catLabel}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="number"
                  placeholder="0"
                  className="form-control"
                  style={{ width: '120px', padding: '6px 10px', fontSize: '12.5px', borderRadius: '10px', textAlign: 'right' }}
                  value={currentLimitVal === 0 ? '' : currentLimitVal}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    const updatedLimits = {
                      ...(user.settings?.budgetLimits || {}),
                      [catKey]: val
                    };
                    onUpdateSettings({ budgetLimits: updatedLimits });
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  {user.settings?.language === 'uz' ? 'so\'m' : (user.settings?.language === 'ru' ? 'сум' : 'UZS')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* PARENT ACCOUNTABILITY CONNECTION PANEL */}
      <div className="glass-card settings-section">
        <h2 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)', fontWeight: '850' }}>
          🛡️ {user.settings?.language === 'uz' ? 'Ota-ona nazorati' : (user.settings?.language === 'ru' ? 'Родительский контроль' : 'Parent Accountability')}
        </h2>
        
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4', fontWeight: '500' }}>
          {user.settings?.language === 'uz' 
            ? "Ota-onangiz yoki nazoratchingizning Telegram Chat ID raqamini kiriting. Agar har kuni kechqurun soat 19:30 gacha odatlaringizni bajarmasangiz, bot ota-onangizga eslatma yuboradi." 
            : (user.settings?.language === 'ru' 
              ? "Введите Telegram Chat ID вашего родителя или опекуна. Если вы не выполните свои привычки до 19:30 ежедневно, бот автоматически отправит им предупреждение." 
              : "Enter your parent's Telegram Chat ID. If you do not complete your habits by 7:30 PM daily, the bot will automatically send them an alert.")}
        </p>

        {parentSuccessMsg && (
          <div style={{ padding: '10px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '12px', color: 'var(--success)', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
            {parentSuccessMsg}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: '750', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
            {user.settings?.language === 'uz' ? 'Ota-ona Telegram Chat ID' : (user.settings?.language === 'ru' ? 'Chat ID Родителя' : 'Parent Chat ID')}
          </label>
          <input 
            type="text" 
            placeholder="Masalan: 514578229" 
            className="form-control"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            style={{ width: '100%', fontSize: '13.5px' }}
          />
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            {user.settings?.language === 'uz' ? 'Ota-onangiz botga start bosib, o\'z Chat ID sini shu yerga yozishi kerak.' : 'Родитель должен запустить бота и ввести свой Chat ID здесь.'}
          </span>
        </div>

        <div className="setting-row" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '16px' }}>
          <div className="setting-info">
            <span className="setting-title" style={{ fontSize: '13px' }}>{user.settings?.language === 'uz' ? 'Nazoratni yoqish' : 'Включить контроль'}</span>
            <span className="setting-desc" style={{ fontSize: '10.5px' }}>{user.settings?.language === 'uz' ? 'Bajarilmagan odatlar haqida xabar yuborish' : 'Отправлять отчет о невыполненных задачах'}</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={parentAlerts}
              onChange={(e) => setParentAlerts(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <button 
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', borderRadius: '12px', padding: '10px' }}
          onClick={() => {
            onUpdateParentSettings(parentId, parentAlerts);
            setParentSuccessMsg(user.settings?.language === 'uz' ? 'Ota-ona sozlamalari muvaffaqiyatli saqlandi! ✅' : 'Настройки родительского контроля сохранены! ✅');
            setTimeout(() => setParentSuccessMsg(''), 4000);
          }}
        >
          {user.settings?.language === 'uz' ? 'Sozlamalarni Saqlash' : 'Сохранить настройки'}
        </button>
      </div>

      {/* Bot Connection Status */}
      <div className="glass-card settings-section">
        <h2 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--primary)" /> {t('settings_bot_status')}
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{t('settings_connection')}</span>
          {isMockMode ? (
            <span style={{ color: 'var(--warning)', fontWeight: '700' }}>⚠️ MOCK MODE</span>
          ) : (
            <span style={{ color: 'var(--success)', fontWeight: '700' }}>🚀 ACTIVE</span>
          )}
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4', fontWeight: '500' }}>
          {isMockMode ? t('settings_mock_desc') : t('settings_real_desc')}
        </p>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', gap: '8px', borderRadius: '14px' }}
          onClick={handleTestReminder}
          disabled={isSending}
        >
          <Send size={16} /> 
          {isSending ? t('settings_sending') : testSent ? t('settings_sent') : t('settings_test_btn')}
        </button>

        {/* Dynamic Bot System Restart section */}
        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(124, 58, 237, 0.08)', paddingTop: '16px' }}>
          <span className="setting-title" style={{ fontSize: '13px', display: 'block', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
            🔄 {user.settings?.language === 'uz' ? 'Tizimni Yangilash (Qayta ishga tushirish)' : 'Обновление системы (Перезапуск)'}
          </span>
          <span className="setting-desc" style={{ fontSize: '11px', display: 'block', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
            {user.settings?.language === 'uz' 
              ? 'Ilova yangilanganda yoki eslatmalar kelmay qolganda, Telegram botingizni yangilash va qayta ishga tushirish uchun pastdagi tugmani bosing.' 
              : 'В случае обновления приложения или если уведомления перестали приходить, нажмите кнопку ниже для обновления и перезапуска бота.'}
          </span>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              try {
                const res = await fetch(`/api/user/${user.id}/restart-bot`, { method: 'POST' });
                if (res.ok) {
                  alert(user.settings?.language === 'uz' 
                    ? "Bot muvaffaqiyatli qayta ishga tushirildi! ✅ Telegram chatingizga tasdiq xabari yuborildi." 
                    : "Бот успешно перезапущен! ✅ Подтверждение отправлено в ваш Telegram.");
                } else {
                  alert("Botni qayta ishga tushirib bo'lmadi.");
                }
              } catch (e) {
                alert("Xatolik: " + e.message);
              }
            }}
            style={{ width: '100%', borderRadius: '12px', padding: '10px', fontSize: '12.5px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            🤖 {user.settings?.language === 'uz' ? 'Botni ishga tushirish (Start)' : 'Запустить бота (Start)'}
          </button>
        </div>
      </div>

      {/* Notification Logs */}
      <div>
        <div className="notif-logs-header">
          <h2 style={{ marginBottom: 0 }}>{t('settings_log_title')}</h2>
          {user.settings && user.settings.mockNotifications && user.settings.mockNotifications.length > 0 && (
            <button 
              onClick={onClearMockLogs}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
            >
              <Trash2 size={12} /> {t('settings_log_clear')}
            </button>
          )}
        </div>

        {user.settings && user.settings.mockNotifications && user.settings.mockNotifications.length > 0 ? (
          <div className="notif-logs-list">
            {user.settings.mockNotifications.map(notif => (
              <div key={notif.id} className="notif-log-item glass-card animate-fade-in" style={{ padding: '12px 16px' }}>
                <div style={{ color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: '500' }}>{notif.message}</div>
                <div className="notif-log-time">
                  {new Date(notif.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} | {new Date(notif.timestamp).toLocaleDateString('uz-UZ')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <Bell size={24} style={{ marginBottom: '8px', opacity: 0.4, stroke: 'var(--primary)' }} />
            <p>{t('settings_empty_logs')}</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              {t('settings_logs_help')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
