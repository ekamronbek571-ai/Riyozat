import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Clock, Image as ImageIcon, Mic, StopCircle, Play, Trash, Calendar as CalendarIcon } from 'lucide-react';
export default function Habits({ user, onAddHabit, onUpdateHabit, onDeleteHabit, onRestoreDefaultPrayers, t, prefilledHabit, clearPrefilledHabit, onUpdateWaterIntake }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [subTab, setSubTab] = useState('list'); // 'list', 'namoz', 'water'

  // Compass state
  const [heading, setHeading] = useState(0);
  const [compassOffset, setCompassOffset] = useState(() => {
    return Number(localStorage.getItem('qibla_compass_offset') || '0');
  });
  const [qiblaAngle, setQiblaAngle] = useState(263.15); // Default to Tashkent (Uzbekistan)
  const [userLocation, setUserLocation] = useState(null); // { lat, lon }
  const [needsCompassPermission, setNeedsCompassPermission] = useState(
    typeof DeviceOrientationEvent !== 'undefined' && 
    typeof DeviceOrientationEvent.requestPermission === 'function'
  );

  const getDistanceToMecca = (lat, lon) => {
    const R = 6371; // Earth radius in km
    const dLat = ((21.4225 - lat) * Math.PI) / 180;
    const dLon = ((39.8262 - lon) * Math.PI) / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(21.4225 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const getQiblaBearing = (lat, lon) => {
    const phi1 = (lat * Math.PI) / 180;
    const phi2 = (21.4225 * Math.PI) / 180; // Kaaba latitude
    const lambda1 = (lon * Math.PI) / 180;
    const lambda2 = (39.8262 * Math.PI) / 180; // Kaaba longitude
    
    const y = Math.sin(lambda2 - lambda1);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(lambda2 - lambda1);
    
    let qibla = Math.atan2(y, x);
    qibla = (qibla * 180) / Math.PI;
    qibla = (qibla + 360) % 360;
    return qibla;
  };

  // Get GPS location on mount to dynamically calculate Kaaba bearing
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const angle = getQiblaBearing(lat, lon);
          setQiblaAngle(angle);
          setUserLocation({ lat, lon });
        },
        (err) => {
          console.warn("Location access denied/failed:", err);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const adjustedHeading = (heading + compassOffset + 360) % 360;
  const qiblaDiff = Math.abs(adjustedHeading - qiblaAngle);
  const qiblaDetected = qiblaDiff < 6 || qiblaDiff > 354;

  useEffect(() => {
    const handleOrientation = (e) => {
      let compass = e.webkitCompassHeading;
      
      if (compass === undefined || compass === null) {
        if (e.alpha !== null && e.alpha !== undefined) {
          compass = (360 - e.alpha) % 360;
        }
      }
      
      if (compass !== undefined && compass !== null && !isNaN(compass)) {
        setHeading(Math.round(compass));
      }
    };

    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation);
      } else {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  const requestCompassPermission = () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            setNeedsCompassPermission(false);
            window.location.reload();
          } else {
            alert("Kompasingiz ruxsati berilmadi. Kompas to'g'ri ishlashi uchun telefon sozlamalaridan Safari/Chrome kompas ruxsatini yoqing!");
          }
        })
        .catch(err => {
          console.error("Compass permission error:", err);
        });
    }
  };

  // Prayer Countdown state
  const [countdownStr, setCountdownStr] = useState('');
  const [nextPrayerName, setNextPrayerName] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const activePrayers = (user?.habits || []).filter(h => h.category === 'namoz');
      if (activePrayers.length === 0) {
        setCountdownStr('');
        return;
      }

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const prayerTimes = activePrayers.map(p => {
        const [h, m] = p.time.split(':').map(Number);
        return {
          name: p.name,
          minutes: h * 60 + m,
          timeStr: p.time
        };
      });

      prayerTimes.sort((a, b) => a.minutes - b.minutes);

      let next = prayerTimes.find(p => p.minutes > currentMinutes);
      let isNextDay = false;

      if (!next) {
        next = prayerTimes[0];
        isNextDay = true;
      }

      if (next) {
        setNextPrayerName(next.name);
        let diffMinutes = 0;
        if (isNextDay) {
          diffMinutes = (1440 - currentMinutes) + next.minutes;
        } else {
          diffMinutes = next.minutes - currentMinutes;
        }

        const secRemaining = 60 - now.getSeconds();
        const finalMinutes = diffMinutes - 1;
        const h = Math.floor(finalMinutes / 60);
        const m = finalMinutes % 60;
        const s = secRemaining === 60 ? 0 : secRemaining;

        const pad = (n) => String(n).padStart(2, '0');
        setCountdownStr(`${pad(h)}:${pad(m)}:${pad(s)}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Form states for new habit
  const [habitName, setHabitName] = useState('');
  const [habitTime, setHabitTime] = useState('12:00');
  const [habitCategory, setHabitCategory] = useState('custom');
  const [habitImage, setHabitImage] = useState('');
  const [habitVoice, setHabitVoice] = useState(false);
  const [habitVoiceAudio, setHabitVoiceAudio] = useState(''); // base64 recorded user voice
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardCardId, setRewardCardId] = useState('');

  // Form states for editing habit
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTime, setEditTime] = useState('12:00');
  const [editCategory, setEditCategory] = useState('custom');
  const [editImage, setEditImage] = useState('');
  const [editVoice, setEditVoice] = useState(false);
  const [editVoiceAudio, setEditVoiceAudio] = useState(''); // base64 recorded user voice
  const [editRewardAmount, setEditRewardAmount] = useState('');
  const [editRewardCardId, setEditRewardCardId] = useState('');  // Recording State variables
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const streamRef = useRef(null);

  // Toggle calendar display per-habit card
  const [showCalendarHabitId, setShowCalendarHabitId] = useState({});

  const now = new Date();
  const yyyy = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Auto-open suggestion modal if prefilledHabit changes
  useEffect(() => {
    if (prefilledHabit) {
      setHabitName(prefilledHabit.name);
      setHabitCategory(prefilledHabit.category);
      setHabitTime('08:00'); // default suggestion time
      setHabitImage('');
      setHabitVoice(false);
      setHabitVoiceAudio('');
      setShowAddModal(true);
      clearPrefilledHabit();
    }
  }, [prefilledHabit]);

  const habits = user.habits || [];
  const prayerHabits = habits.filter(h => h.category === 'namoz');
  const sleepHabits = habits.filter(h => h.category === 'sleep');
  const customHabits = habits.filter(h => h.category !== 'namoz' && h.category !== 'sleep');

  // Handle image upload
  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert(t('avatar_size_error'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditImage(reader.result);
      } else {
        setHabitImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice recording control
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      const localChunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          localChunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(localChunks, { type: recorder.mimeType || 'audio/mp4' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (showEditModal) {
            setEditVoiceAudio(reader.result);
          } else {
            setHabitVoiceAudio(reader.result);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Clean up tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert(user.settings?.language === 'ru' ? "Доступ к микрофону отклонен." : (user.settings?.language === 'en' ? "Microphone access denied." : "Mikrofondan foydalanishga ruxsat berilmadi yoki qo'llab-quvvatlanmaydi."));
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const handleDeleteAudio = () => {
    if (showEditModal) {
      setEditVoiceAudio('');
    } else {
      setHabitVoiceAudio('');
    }
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    onAddHabit(
      habitName, 
      habitTime, 
      habitCategory, 
      habitImage, 
      habitVoice, 
      habitVoiceAudio, 
      parseFloat(rewardAmount) || 0, 
      rewardCardId || null
    );
    
    setHabitName('');
    setHabitTime('12:00');
    setHabitCategory('custom');
    setHabitImage('');
    setHabitVoice(false);
    setHabitVoiceAudio('');
    setRewardAmount('');
    setRewardCardId('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (habit) => {
    setEditingHabitId(habit.id);
    setEditName(habit.name);
    setEditTime(habit.time);
    setEditCategory(habit.category);
    setEditImage(habit.image || '');
    setEditVoice(!!habit.voiceEnabled);
    setEditVoiceAudio(habit.voiceAudio || '');
    setEditRewardAmount(habit.rewardAmount || '');
    setEditRewardCardId(habit.rewardCardId || '');
    setShowEditModal(true);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    onUpdateHabit(editingHabitId, {
      name: editName,
      time: editTime,
      category: editCategory,
      image: editImage,
      voiceEnabled: editVoice,
      voiceAudio: editVoiceAudio,
      rewardAmount: parseFloat(editRewardAmount) || 0,
      rewardCardId: editRewardCardId || null
    });
    setShowEditModal(false);
  };
  const handleToggleEnable = (habitId, currentStatus) => {
    onUpdateHabit(habitId, { enabled: !currentStatus });
  };

  const handleToggleCalendarDate = (habit, dateString) => {
    const currentCompleted = habit.completedDates || {};
    const updatedDates = { ...currentCompleted };

    if (currentCompleted[dateString]) {
      delete updatedDates[dateString];
    } else {
      updatedDates[dateString] = true;
    }

    onUpdateHabit(habit.id, { completedDates: updatedDates });
  };

  const toggleCalendarView = (habitId) => {
    setShowCalendarHabitId(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };

  // Helper to render habit icon
  const renderHabitIcon = (habit, defaultEmoji, iconClass) => {
    if (habit.image) {
      return (
        <div className="habit-icon-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
          <img src={habit.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        </div>
      );
    }
    return (
      <div className={`habit-icon-wrapper ${iconClass}`}>{defaultEmoji}</div>
    );
  };

  // Calendar calculations
  const daysInMonth = new Date(yyyy, now.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(yyyy, now.getMonth(), 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const getWeekdayHeaders = () => {
    const lang = user.settings?.language || 'uz';
    if (lang === 'ru') return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    if (lang === 'en') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return ['Dsh', 'Ssh', 'Chr', 'Pay', 'Jum', 'Shn', 'Yak'];
  };
  const weekdays = getWeekdayHeaders();

  // Refactored Habit Card Renderer with collapsible calendar logging (Satisfies "Kalendar qo'shish" request)
  const renderHabitCard = (habit, defaultEmoji, iconClass) => {
    const isCalOpen = !!showCalendarHabitId[habit.id];
    const completedDates = habit.completedDates || {};
    
    // Count completed days in current month
    const completedDaysThisMonth = Object.keys(completedDates).filter(dateKey => {
      return dateKey.startsWith(`${yyyy}-${month}`);
    }).length;

    // Localized voice notification badge
    const voiceBadgeText = user.settings?.language === 'uz' ? 'Shaxsiy Ovoz' : (user.settings?.language === 'ru' ? 'Свой Голос' : 'Custom Voice');
    const genericVoiceText = user.settings?.language === 'uz' ? 'Ovozli' : (user.settings?.language === 'ru' ? 'Голосовое' : 'Voice-Enabled');

    return (
      <div key={habit.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
        
        {/* Habit Card Header Row */}
        <div className="habit-card" style={{ marginBottom: '0' }}>
          <div className="habit-info">
            {renderHabitIcon(habit, defaultEmoji, iconClass)}
            <div className="habit-details">
              <span className="habit-name">{habit.name}</span>
              <span className="habit-time" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Clock size={12} /> {habit.time}
                {habit.voiceEnabled && (
                  <span style={{ marginLeft: '8px', color: 'var(--primary)', fontSize: '10.5px', fontWeight: '700', background: 'rgba(124,58,237,0.08)', padding: '1px 5px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    🔊 {habit.voiceAudio ? voiceBadgeText : genericVoiceText}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          <div className="habit-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className="btn" 
              style={{ padding: '8px', borderColor: isCalOpen ? 'var(--primary)' : 'var(--surface-border)', background: isCalOpen ? 'rgba(124,58,237,0.06)' : 'var(--surface-color)' }} 
              onClick={() => toggleCalendarView(habit.id)}
              title={t('calendar_toggle')}
            >
              <CalendarIcon size={13} color="var(--primary)" />
            </button>
            <button className="btn" style={{ padding: '8px', background: 'var(--surface-color)', borderColor: 'var(--surface-border)' }} onClick={() => handleOpenEdit(habit)}>
              <Edit2 size={13} stroke="var(--text-secondary)" />
            </button>
            <button className="btn" style={{ padding: '8px', color: 'var(--danger)', background: 'var(--surface-hover)', borderColor: 'var(--surface-border)' }} onClick={() => onDeleteHabit(habit.id)}>
              <Trash2 size={13} />
            </button>
            <label className="switch" style={{ marginLeft: '4px' }}>
              <input 
                type="checkbox" 
                checked={habit.enabled}
                onChange={() => handleToggleEnable(habit.id, habit.enabled)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Collapsible Calendar Grid Panel */}
        {isCalOpen && (
          <div 
            className="animate-fade-in" 
            style={{ 
              background: 'var(--surface-hover)', 
              border: '1px solid var(--surface-border)', 
              borderTop: 'none',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              padding: '14px', 
              boxShadow: '0 4px 15px rgba(109,40,217,0.015)',
              margin: '0 8px'
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>
                🗓 {user.settings?.language === 'uz' ? 'Ushbu oydagi natijalar' : (user.settings?.language === 'ru' ? 'Результаты в этом месяце' : 'Monthly Results')}
              </span>
              <span style={{ fontSize: '9px', background: 'var(--success-gradient)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                {t('completed')}: {completedDaysThisMonth} {t('count_unit')}
              </span>
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
              {weekdays.map((w, idx) => (
                <span key={`habit-w-lbl-${idx}`} style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {w}
                </span>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
              {/* offset cells */}
              {Array.from({ length: startOffset }).map((_, idx) => (
                <div key={`offset-hb-${idx}`} style={{ height: '24px' }}></div>
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const d = idx + 1;
                const dateStr = `${yyyy}-${month}-${String(d).padStart(2, '0')}`;
                const isDayCompleted = !!completedDates[dateStr];
                const isToday = d === now.getDate();

                return (
                  <button
                    key={`cell-hb-${d}`}
                    type="button"
                    onClick={() => handleToggleCalendarDate(habit, dateStr)}
                    style={{
                      height: '24px',
                      borderRadius: '50%',
                      border: isToday ? '1.5px solid var(--primary)' : '1px solid transparent',
                      background: isDayCompleted ? 'var(--primary-gradient)' : 'var(--surface-color)',
                      color: isDayCompleted ? 'white' : 'var(--text-primary)',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isDayCompleted ? '0 2px 6px rgba(124,58,237,0.2)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  };

  // Water Tracker stats
  const activeLocale = user?.settings?.language === 'ru' ? 'ru-RU' : (user?.settings?.language === 'en' ? 'en-US' : 'uz-UZ');
  const todayDate = new Date();
  const yLog = todayDate.getFullYear();
  const mLog = String(todayDate.getMonth() + 1).padStart(2, '0');
  const dLog = String(todayDate.getDate()).padStart(2, '0');
  const todayStr = `${yLog}-${mLog}-${dLog}`;
  const currentWaterAmount = user?.waterLogs?.[todayStr] || 0;
  const waterPercentage = Math.min(100, Math.round((currentWaterAmount / 2000) * 100));

  return (
    <div style={{ paddingBottom: '30px' }}>
      <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{t('habits')}</h1>
        {subTab === 'list' && (
          <button className="btn btn-primary btn-icon" onClick={() => { setHabitImage(''); setHabitVoice(false); setHabitVoiceAudio(''); setShowAddModal(true); }}>
            <Plus size={22} />
          </button>
        )}
      </div>

      {/* Sub-tab navigation */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--surface-color)', 
        border: '1.5px solid var(--surface-border)', 
        borderRadius: '16px', 
        padding: '4px', 
        marginBottom: '20px',
        gap: '4px'
      }}>
        {[
          { id: 'list', label: '⚡ Odatlar' },
          { id: 'namoz', label: '🕌 Qibla & Namoz' },
          { id: 'water', label: '💧 Suv Balansi' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: '12px',
              border: 'none',
              background: subTab === tab.id ? 'var(--primary-gradient)' : 'transparent',
              color: subTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: subTab === tab.id ? 'var(--primary-glow)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'list' && (
        <>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: '500', lineHeight: '1.4' }}>
            {t('habits_subtitle')}
          </p>

          {/* category: NAMOZ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="habits-category-title">{t('prayer_times')}</h3>
              {prayerHabits.length < 5 && (
                <button 
                  onClick={onRestoreDefaultPrayers}
                  className="btn" 
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', color: 'var(--primary)', borderColor: 'rgba(124, 58, 237, 0.2)', background: 'var(--surface-hover)' }}
                >
                  {t('restore')}
                </button>
              )}
            </div>
            
            {prayerHabits.length > 0 ? (
              prayerHabits.map(habit => renderHabitCard(habit, '🕌', 'habit-icon-namoz'))
            ) : (
              <div className="glass-card" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {t('empty_prayers')}
              </div>
            )}
          </div>

          {/* category: SLEEP */}
          <div style={{ marginTop: '20px' }}>
            <h3 className="habits-category-title">{t('sleep_schedule')}</h3>
            {sleepHabits.length > 0 ? (
              sleepHabits.map(habit => renderHabitCard(habit, habit.id === 'sleep-morning' ? '🌅' : '🌙', 'habit-icon-sleep'))
            ) : (
              <div className="glass-card" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {t('empty_sleep')}
              </div>
            )}
          </div>

          {/* category: CUSTOM */}
          <div style={{ marginTop: '20px', marginBottom: '30px' }}>
            <h3 className="habits-category-title">{t('personal_habits')}</h3>
            {customHabits.length > 0 ? (
              customHabits.map(habit => renderHabitCard(habit, '🎯', 'habit-icon-custom'))
            ) : (
              <div className="glass-card" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {t('empty_custom')}
              </div>
            )}
          </div>
        </>
      )}

      {subTab === 'namoz' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            
            <h2 style={{ fontSize: '15px', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
              🧭 Qibla Yo'nalishi
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', maxWidth: '85%', lineHeight: '1.4' }}>
              {userLocation ? (
                <>
                  📍 Joylashuv: <b>{userLocation.lat.toFixed(2)}° N, {userLocation.lon.toFixed(2)}° E</b><br />
                  Qibla burchagi: <b>{Math.round(qiblaAngle)}°</b> | Ka'bagacha masofa: <b>{getDistanceToMecca(userLocation.lat, userLocation.lon).toLocaleString('uz-UZ')} km</b>
                </>
              ) : (
                <>Toshkent burchagi: <b>263°</b> | Masofa: <b>~3,420 km</b><br />GPS ruxsat berilsa, masofa va burchak aniq hisoblanadi.</>
              )}
            </p>

            {needsCompassPermission && (
              <button 
                type="button"
                className="btn btn-primary"
                onClick={requestCompassPermission}
                style={{ 
                  padding: '10px 18px', 
                  fontSize: '12px', 
                  borderRadius: '12px', 
                  marginBottom: '20px', 
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' 
                }}
              >
                🧭 Kompas Ruxsatini Yoqish (iOS)
              </button>
            )}

            <div style={{ 
              width: '160px', 
              height: '160px', 
              borderRadius: '50%', 
              border: '4px solid var(--surface-border)',
              background: 'var(--surface-color)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
              transform: `rotate(${-adjustedHeading}deg)`,
              transition: 'transform 0.25s ease-out'
            }}>
              <span style={{ position: 'absolute', top: '8px', fontSize: '11px', fontWeight: '900', color: 'var(--danger)' }}>N</span>
              <span style={{ position: 'absolute', right: '8px', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)' }}>E</span>
              <span style={{ position: 'absolute', bottom: '8px', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)' }}>S</span>
              <span style={{ position: 'absolute', left: '8px', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)' }}>W</span>
              
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: `rotate(${qiblaAngle}deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  width: '0',
                  height: '0',
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: '16px solid var(--success)',
                  filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.3))'
                }}></div>
                <div style={{ position: 'absolute', top: '30px', fontSize: '9px', fontWeight: '900', color: 'var(--success)' }}>QIBLA</div>
              </div>

              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', zIndex: 2 }}></div>
            </div>

            {/* Manual Calibration Slider/Buttons */}
            <div style={{ marginTop: '14px', width: '100%' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => {
                    const newOffset = compassOffset - 5;
                    setCompassOffset(newOffset);
                    localStorage.setItem('qibla_compass_offset', newOffset.toString());
                  }}
                  style={{ padding: '6px 8px', fontSize: '10px', borderRadius: '8px', minWidth: '34px' }}
                >
                  -5°
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => {
                    const newOffset = compassOffset - 1;
                    setCompassOffset(newOffset);
                    localStorage.setItem('qibla_compass_offset', newOffset.toString());
                  }}
                  style={{ padding: '6px 8px', fontSize: '10px', borderRadius: '8px', minWidth: '34px' }}
                >
                  -1°
                </button>
                <span style={{ fontSize: '11px', fontWeight: '750', margin: '0 4px', color: 'var(--text-secondary)' }}>
                  Kalibrlash: <b style={{ color: 'var(--primary)' }}>{compassOffset > 0 ? `+${compassOffset}` : compassOffset}°</b>
                </span>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => {
                    const newOffset = compassOffset + 1;
                    setCompassOffset(newOffset);
                    localStorage.setItem('qibla_compass_offset', newOffset.toString());
                  }}
                  style={{ padding: '6px 8px', fontSize: '10px', borderRadius: '8px', minWidth: '34px' }}
                >
                  +1°
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => {
                    const newOffset = compassOffset + 5;
                    setCompassOffset(newOffset);
                    localStorage.setItem('qibla_compass_offset', newOffset.toString());
                  }}
                  style={{ padding: '6px 8px', fontSize: '10px', borderRadius: '8px', minWidth: '34px' }}
                >
                  +5°
                </button>
                {compassOffset !== 0 && (
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => {
                      setCompassOffset(0);
                      localStorage.setItem('qibla_compass_offset', '0');
                    }}
                    style={{ padding: '6px 8px', fontSize: '10px', borderRadius: '8px', color: '#ef4444' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: '750', color: 'var(--text-secondary)' }}>
              Yo'nalishingiz: <span style={{ color: 'var(--text-primary)', fontWeight: '850' }}>{adjustedHeading}°</span>
              {qiblaDetected ? (
                <span style={{ color: 'var(--success)', display: 'block', marginTop: '6px', fontSize: '12px', fontWeight: '800', animation: 'pulse 1.5s infinite' }}>
                  🎯 Qibla yo'nalishidasiz!
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px', fontSize: '10px', fontWeight: '500', maxWidth: '80%', margin: '6px auto 0 auto', lineHeight: '1.3' }}>
                  💡 Agar kompas noto'g'ri bo'lsa, telefoningizni havoda "8" shakli ko'rinishida aylantiring yoki qo'lda sozlang.
                </span>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⏳ Keyingi Namozgacha Vaqt
            </h2>
            
            {countdownStr ? (
              <div style={{ 
                background: 'var(--surface-hover)', 
                border: '1px solid var(--surface-border)', 
                borderRadius: '16px', 
                padding: '16px', 
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {nextPrayerName} vaqtigacha qoldi
                </span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)', fontFamily: 'monospace', margin: '4px 0' }}>
                  {countdownStr}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                Hozircha namoz odatlari faollashtirilmagan.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(user?.habits || []).filter(h => h.category === 'namoz').map(p => (
                <div 
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: p.name === nextPrayerName ? 'var(--primary-glow)' : 'var(--surface-color)',
                    border: '1.5px solid',
                    borderColor: p.name === nextPrayerName ? 'var(--primary)' : 'var(--surface-border)',
                    borderRadius: '12px'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-primary)' }}>
                    🕌 {p.name}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '850', color: 'var(--primary)' }}>
                    {p.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'water' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px', position: 'relative', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
              🥤 Kunlik Suv Balansi
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Kunlik maqsad: **2000 ml** (Sog'lom hidratsiya)
            </p>

            <div style={{
              width: '120px',
              height: '180px',
              border: '4px solid var(--text-primary)',
              borderTop: 'none',
              borderRadius: '0 0 24px 24px',
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)',
              boxShadow: '0 12px 30px rgba(124, 58, 237, 0.05)',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column-reverse'
            }}>
              <div style={{
                height: `${waterPercentage}%`,
                width: '100%',
                background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                position: 'relative',
                transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'inset 0 10px 10px rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '0',
                  width: '200%',
                  height: '20px',
                  background: '#38bdf8',
                  borderRadius: '40%',
                  animation: 'wave 4s linear infinite',
                  opacity: 0.8
                }}></div>
              </div>

              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '900',
                color: waterPercentage > 45 ? 'white' : 'var(--text-primary)',
                mixBlendMode: 'difference',
                pointerEvents: 'none',
                zIndex: 2
              }}>
                {waterPercentage}%
              </div>
            </div>

            <div style={{ fontSize: '15px', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>
              Ichildi: <span style={{ color: 'var(--primary)', fontSize: '18px' }}>{currentWaterAmount} ml</span> / 2000 ml
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
              {[
                { amount: 100, label: '💧 100 ml (Qultum)' },
                { amount: 250, label: '🥤 250 ml (Stakan)' },
                { amount: 500, label: '🍼 500 ml (Butulka)' },
                { amount: 0, label: '🔄 Reset (Nollash)', isReset: true }
              ].map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onUpdateWaterIntake(btn.amount)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--surface-border)',
                    background: btn.isReset ? 'rgba(244, 63, 94, 0.05)' : 'var(--surface-color)',
                    color: btn.isReset ? 'var(--danger)' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderColor: btn.isReset ? 'rgba(244, 63, 94, 0.15)' : 'var(--surface-border)'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      </div> {/* close animate-fade-in containing block */}

      {/* ADD HABIT MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t('modal_add_habit')}</h2>
            <form onSubmit={handleSubmitAdd} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>{t('habit_name_lbl')}</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder={t('habit_name_placeholder')}
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{t('habit_time_lbl')}</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={habitTime}
                    onChange={(e) => setHabitTime(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('habit_category_lbl')}</label>
                  <select 
                    className="form-control"
                    style={{ background: 'var(--surface-color)' }}
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                  >
                    <option value="custom">⚡️ {t('category_custom')}</option>
                    <option value="namoz">🕌 {t('category_namoz')}</option>
                    <option value="sleep">🛌 {t('category_sleep')}</option>
                  </select>
                </div>
              </div>

              {/* Rasm qo'shish */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="var(--primary)" /> {t('habit_image_lbl')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageChange(e, false)}
                    style={{ fontSize: '12px' }}
                  />
                  {habitImage && (
                    <img 
                      src={habitImage} 
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--surface-border)' }} 
                      alt="" 
                    />
                  )}
                </div>
              </div>

              {/* Ovozli alarm sozlash */}
              <div className="form-group" style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700' }}>
                  <input 
                    type="checkbox" 
                    checked={habitVoice}
                    onChange={(e) => setHabitVoice(e.target.checked)}
                  />
                  🔊 {t('habit_voice_record_lbl')}
                </label>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px', marginLeft: '22px' }}>
                  {t('habit_voice_desc')}
                </span>

                {habitVoice && (
                  <div style={{ marginTop: '12px', marginLeft: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {!recording ? (
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ padding: '6px 12px', fontSize: '11.5px', background: 'var(--surface-color)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          onClick={startRecording}
                        >
                          <Mic size={13} style={{ marginRight: '4px', display: 'inline' }} /> {t('habit_record_start')}
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '11.5px', background: '#ef4444', animation: 'pulse 1.5s infinite' }}
                          onClick={stopRecording}
                        >
                          <StopCircle size={13} style={{ marginRight: '4px', display: 'inline' }} /> {t('habit_record_stop')}
                        </button>
                      )}

                      {habitVoiceAudio && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            type="button"
                            className="btn"
                            style={{ padding: '6px', background: 'var(--surface-color)' }}
                            onClick={() => {
                              const audio = new Audio(habitVoiceAudio);
                              audio.play();
                            }}
                          >
                            <Play size={11} fill="var(--text-primary)" stroke="none" />
                          </button>
                          <button 
                            type="button"
                            className="btn"
                            style={{ padding: '6px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                            onClick={handleDeleteAudio}
                          >
                            <Trash size={11} />
                          </button>
                          <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '700' }}>✓ {t('completed')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Habit Reward / Auto-savings setting */}
              <div className="form-group" style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.12)', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#059669', fontSize: '12.5px' }}>
                  🎯 {user.settings?.language === 'uz' ? 'Avto-Jamg\'arma Mukofoti' : (user.settings?.language === 'ru' ? 'Награда Авто-Копилки' : 'Auto-Savings Reward')}
                </label>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  {user.settings?.language === 'uz' ? 'Odatni bajarganingizda kartangizdan Jamg\'armaga avtomat pul o\'tkaziladi!' : 'Автоматический перевод денег с карты в копилку при выполнении!'}
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <input 
                    type="number"
                    className="form-control"
                    placeholder="Soni (masalan: 5000)"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                  />
                  <select
                    className="form-control"
                    style={{ background: 'var(--surface-color)', fontSize: '11px' }}
                    value={rewardCardId}
                    onChange={(e) => setRewardCardId(e.target.value)}
                  >
                    <option value="">{user.settings?.language === 'uz' ? '-- Kartani tanlang --' : '-- Выберите карту --'}</option>
                    {(user.cards || []).filter(c => c.id !== 'card-savings').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HABIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t('modal_edit_habit')}</h2>
            <form onSubmit={handleSubmitEdit} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>{t('habit_name_lbl')}</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{t('habit_time_lbl')}</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('habit_category_lbl')}</label>
                  <select 
                    className="form-control"
                    style={{ background: 'var(--surface-color)' }}
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="custom">⚡️ {t('category_custom')}</option>
                    <option value="namoz">🕌 {t('category_namoz')}</option>
                    <option value="sleep">🛌 {t('category_sleep')}</option>
                  </select>
                </div>
              </div>

              {/* Rasm tahrirlash */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="var(--primary)" /> {t('habit_image_lbl')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageChange(e, true)}
                    style={{ fontSize: '12px' }}
                  />
                  {editImage && (
                    <img 
                      src={editImage} 
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--surface-border)' }} 
                      alt="" 
                    />
                  )}
                </div>
              </div>

              {/* Ovozli alarm tahrirlash */}
              <div className="form-group" style={{ background: 'var(--surface-hover)', padding: '12px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700' }}>
                  <input 
                    type="checkbox" 
                    checked={editVoice}
                    onChange={(e) => setEditVoice(e.target.checked)}
                  />
                  🔊 {t('habit_voice_record_lbl')}
                </label>

                {editVoice && (
                  <div style={{ marginTop: '12px', marginLeft: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {!recording ? (
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ padding: '6px 12px', fontSize: '11.5px', background: 'var(--surface-color)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          onClick={startRecording}
                        >
                          <Mic size={13} style={{ marginRight: '4px', display: 'inline' }} /> {t('habit_record_start')}
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '11.5px', background: '#ef4444', animation: 'pulse 1.5s infinite' }}
                          onClick={stopRecording}
                        >
                          <StopCircle size={13} style={{ marginRight: '4px', display: 'inline' }} /> {t('habit_record_stop')}
                        </button>
                      )}

                      {editVoiceAudio && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            type="button"
                            className="btn"
                            style={{ padding: '6px', background: 'var(--surface-color)' }}
                            onClick={() => {
                              const audio = new Audio(editVoiceAudio);
                              audio.play();
                            }}
                          >
                            <Play size={11} fill="var(--text-primary)" stroke="none" />
                          </button>
                          <button 
                            type="button"
                            className="btn"
                            style={{ padding: '6px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                            onClick={handleDeleteAudio}
                          >
                            <Trash size={11} />
                          </button>
                          <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '700' }}>✓ {t('completed')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Habit Reward / Auto-savings setting */}
              <div className="form-group" style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.12)', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#059669', fontSize: '12.5px' }}>
                  🎯 {user.settings?.language === 'uz' ? 'Avto-Jamg\'arma Mukofoti' : (user.settings?.language === 'ru' ? 'Награда Авто-Копилки' : 'Auto-Savings Reward')}
                </label>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  {user.settings?.language === 'uz' ? 'Odatni bajarganingizda kartangizdan Jamg\'armaga avtomat pul o\'tkaziladi!' : 'Автоматический перевод денег с карты в копилку при выполнении!'}
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <input 
                    type="number"
                    className="form-control"
                    placeholder="Soni (masalan: 5000)"
                    value={editRewardAmount}
                    onChange={(e) => setEditRewardAmount(e.target.value)}
                  />
                  <select
                    className="form-control"
                    style={{ background: 'var(--surface-color)', fontSize: '11px' }}
                    value={editRewardCardId}
                    onChange={(e) => setEditRewardCardId(e.target.value)}
                  >
                    <option value="">{user.settings?.language === 'uz' ? '-- Kartani tanlang --' : '-- Выберите карту --'}</option>
                    {(user.cards || []).filter(c => c.id !== 'card-savings').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
