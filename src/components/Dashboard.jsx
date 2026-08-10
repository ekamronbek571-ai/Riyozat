import React from 'react';
import { Flame, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
export default function Dashboard({ user, onToggleHabit, togglingHabits = {}, activeTab, setActiveTab, t, currentLang, onSelectSuggestion }) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${month}-${dd}`;

  const [insights, setInsights] = React.useState('');
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [loadingInsights, setLoadingInsights] = React.useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = React.useState(true);

  // Chatbot states
  const [showChat, setShowChat] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState([
    { 
      sender: 'coach', 
      text: currentLang === 'ru' 
        ? 'Привет! Я твой ИИ-коуч. Спроси меня о привычках, целях или финансах!' 
        : (currentLang === 'en' 
            ? 'Hello! I am your AI Coach. Ask me about habits, goals, or finances!' 
            : 'Salom! Men sizning shaxsiy AI Ustozingizman. Odatlar, maqsadlar yoki moliya haqida istalgan narsani so\'rang!')
    }
  ]);
  const [userMessage, setUserMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || userMessage;
    if (!textToSend.trim()) return;

    // Add user message
    const newMsg = { sender: 'user', text: textToSend.trim() };
    setChatMessages(prev => [...prev, newMsg]);
    if (!msgText) setUserMessage('');
    
    setIsTyping(true);

    try {
      const res = await fetch(`/api/user/${user.id}/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'coach', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { 
          sender: 'coach', 
          text: currentLang === 'uz' ? 'Kechirasiz, tarmoqda xatolik yuz berdi.' : (currentLang === 'ru' ? 'Извините, произошла ошибка сети.' : 'Sorry, a network error occurred.')
        }]);
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { 
        sender: 'coach', 
        text: currentLang === 'uz' ? 'Kechirasiz, ulanishda xatolik.' : (currentLang === 'ru' ? 'Ошибка подключения.' : 'Connection error.')
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  React.useEffect(() => {
    // 1. Fetch AI Coach Insights
    fetch(`/api/user/${user.id}/insights`)
      .then(res => res.json())
      .then(data => {
        setInsights(data.insight);
        setLoadingInsights(false);
      })
      .catch(() => setLoadingInsights(false));

    // 2. Fetch Leaderboard
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setLoadingLeaderboard(false);
      })
      .catch(() => setLoadingLeaderboard(false));
  }, [user.id, user.transactions, user.habits]);
  
  const localeMap = {
    uz: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US'
  };
  const activeLocale = localeMap[currentLang] || 'uz-UZ';
  
  const getFormattedDate = () => {
    const daysUz = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const monthsUz = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    
    const daysRu = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const monthsRu = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const monthIndex = now.getMonth();

    if (currentLang === 'ru') {
      return `${daysRu[dayOfWeek]}, ${dayOfMonth} ${monthsRu[monthIndex]}`;
    } else if (currentLang === 'en') {
      return `${daysEn[dayOfWeek]}, ${monthsEn[monthIndex]} ${dayOfMonth}`;
    } else {
      return `${daysUz[dayOfWeek]}, ${dayOfMonth}-${monthsUz[monthIndex]}`;
    }
  };
  const formattedDate = getFormattedDate();
  // Active habits (enabled habits)
  const activeHabits = user.habits ? user.habits.filter(h => h.enabled) : [];
  
  // Calculate completed habits for today
  const completedTodayCount = activeHabits.filter(h => h.completedDates && h.completedDates[todayStr]).length;
  const totalActiveCount = activeHabits.length;
  const completionPercentage = totalActiveCount > 0 
    ? Math.round((completedTodayCount / totalActiveCount) * 100) 
    : 0;

  // Calculate streak (consecutive days)
  const calculateStreak = () => {
    if (!user.habits || user.habits.length === 0) return 0;
    
    const allDates = new Set();
    user.habits.forEach(habit => {
      if (habit.completedDates) {
        Object.keys(habit.completedDates).forEach(date => {
          allDates.add(date);
        });
      }
    });

    let streak = 0;
    const checkDate = new Date();
    
    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      if (allDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0 && dateStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yYesterday = checkDate.getFullYear();
          const mYesterday = String(checkDate.getMonth() + 1).padStart(2, '0');
          const dYesterday = String(checkDate.getDate()).padStart(2, '0');
          const yesterdayStr = `${yYesterday}-${mYesterday}-${dYesterday}`;
          
          if (allDates.has(yesterdayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
            streak = 1;
            continue;
          }
        }
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  // Dynamic Badges/Achievements calculations
  const totalCompletedHabits = (user.habits || []).reduce((acc, h) => {
    return acc + Object.keys(h.completedDates || {}).length;
  }, 0);
  const badge1Unlocked = totalCompletedHabits > 0;
  
  const badge2Unlocked = totalActiveCount > 0 && completedTodayCount === totalActiveCount;
  
  const completedNamozCount = (user.habits || [])
    .filter(h => h.category === 'namoz')
    .reduce((acc, h) => acc + Object.keys(h.completedDates || {}).length, 0);
  const badge3Unlocked = completedNamozCount > 0;
  
  const badge4Unlocked = (user.transactions || []).length > 0;
  
  const totalWaterLogged = Object.values(user.waterLogs || {}).reduce((acc, v) => acc + v, 0);
  const totalCaloriesLogged = Object.values(user.calorieLogs || {}).reduce((acc, log) => acc + (log.consumed || 0), 0);
  const badge5Unlocked = totalWaterLogged > 0 || totalCaloriesLogged > 0;
  
  const completedGoalsCount = (user.goals || []).filter(g => g.current >= g.target).length;
  const badge6Unlocked = completedGoalsCount > 0;

  // Calculate activity level for the last 30 days
  const getActivityHeatmapData = () => {
    const data = [];
    const habitsList = user.habits || [];
    
    // We only count active enabled habits
    const activeHabitsList = habitsList.filter(h => h.enabled);
    if (activeHabitsList.length === 0) {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        data.push({ date: d, count: 0, level: 0 });
      }
      return data;
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      let completedCount = 0;
      activeHabitsList.forEach(h => {
        if (h.completedDates && h.completedDates[dateStr]) {
          completedCount++;
        }
      });

      const ratio = completedCount / activeHabitsList.length;
      let level = 0;
      if (ratio > 0.66) level = 3;
      else if (ratio > 0.33) level = 2;
      else if (ratio > 0) level = 1;

      data.push({
        date: d,
        count: completedCount,
        level: level
      });
    }
    return data;
  };

  const heatmap = getActivityHeatmapData();

  // Progress circle configuration
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // Calendar Wheel calculations
  const daysInMonth = new Date(yyyy, now.getMonth() + 1, 0).getDate();
  const currentMonthName = now.toLocaleString(activeLocale, { month: 'long' });

  // Habit color palette maps
  const getCategoryColor = (category, isLight = false) => {
    if (category === 'namoz') return isLight ? '#bae6fd' : '#0ea5e9';
    if (category === 'sleep') return isLight ? '#e9d5ff' : '#a78bfa';
    return isLight ? '#c7d2fe' : '#7c3aed';
  };

  return (
    <div className="animate-fade-in">
      {/* User Info / Streak */}
      <div className="app-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="user-badge">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 8px rgba(124,58,237,0.15)' }} 
                alt="Profile" 
              />
            ) : (
              <div className="avatar-fallback">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ marginBottom: 0, fontSize: '16px', fontWeight: '800' }}>{user.firstName}</h2>
                <span 
                  style={{ 
                    fontSize: '9px', 
                    fontWeight: '800', 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                    color: 'white', 
                    padding: '1px 6px', 
                    borderRadius: '6px',
                    boxShadow: '0 2px 6px rgba(217,119,6,0.2)' 
                  }}
                >
                  LVL {user.level || 1}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700' }}>
                {(() => {
                  const lvl = user.level || 1;
                  if (lvl >= 6) return t('level_title_4') || '👑 Odatlar Qiroli';
                  if (lvl >= 4) return t('level_title_3') || '⚡ Odatlar Ustasi';
                  if (lvl >= 2) return t('level_title_2') || '🛡️ Intizomli Kurashchi';
                  return t('level_title_1') || '🌱 Yangi O\'quvchi';
                })()}
              </span>
            </div>
          </div>
          <div className="streak-counter" style={{ alignSelf: 'center' }}>
            <Flame size={15} fill="#f59e0b" stroke="none" />
            <span>{streak} {t('streak')}</span>
          </div>
        </div>
      </div>

      {/* MONTHLY RADIAL HABIT CALENDAR WHEEL (As per the user mockup image) */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px 16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', textAlign: 'center' }}>
          {t('radial_wheel_title')}
        </h2>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px', fontWeight: '600' }}>
          {currentMonthName.toUpperCase()} — {yyyy}
        </p>

        {activeHabits.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            
            {/* SVG Radial Wheel */}
            <div style={{ position: 'relative', width: '270px', height: '270px' }}>
              <svg width="270" height="270" viewBox="0 0 270 270" style={{ transform: 'rotate(-90deg)' }}>
                {/* Center point is (135, 135) */}
                {(() => {
                  const cx = 135;
                  const cy = 135;
                  const totalHabits = activeHabits.length;
                  const maxRadii = 90;
                  const innerR = 36;
                  const ringWidth = Math.max(7, Math.min(13, (maxRadii - innerR) / totalHabits));

                  const segments = [];

                  // Draw segments for each habit
                  activeHabits.forEach((habit, habitIndex) => {
                    const r1 = innerR + habitIndex * ringWidth;
                    const r2 = r1 + ringWidth;
                    const habitColor = getCategoryColor(habit.category);

                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = `${yyyy}-${month}-${String(d).padStart(2, '0')}`;
                      const isCompleted = habit.completedDates && habit.completedDates[dateStr];

                      // Slices calculation
                      const anglePerSlice = 360 / daysInMonth;
                      const aStart = (d - 1) * anglePerSlice;
                      const aEnd = d * anglePerSlice;

                      const radStart = (aStart * Math.PI) / 180;
                      const radEnd = (aEnd * Math.PI) / 180;

                      // Outer Arc points
                      const xOutStart = cx + r2 * Math.cos(radStart);
                      const yOutStart = cy + r2 * Math.sin(radStart);
                      const xOutEnd = cx + r2 * Math.cos(radEnd);
                      const yOutEnd = cy + r2 * Math.sin(radEnd);

                      // Inner Arc points
                      const xInStart = cx + r1 * Math.cos(radStart);
                      const yInStart = cy + r1 * Math.sin(radStart);
                      const xInEnd = cx + r1 * Math.cos(radEnd);
                      const yInEnd = cy + r1 * Math.sin(radEnd);

                      // SVG Arc flags
                      const largeArc = anglePerSlice > 180 ? 1 : 0;

                      const pathData = `M ${xOutStart} ${yOutStart} A ${r2} ${r2} 0 ${largeArc} 1 ${xOutEnd} ${yOutEnd} L ${xInEnd} ${yInEnd} A ${r1} ${r1} 0 ${largeArc} 0 ${xInStart} ${yInStart} Z`;
                      const isToday = d === now.getDate();

                      segments.push(
                        <path
                          key={`habit-${habit.id}-day-${d}`}
                          d={pathData}
                          fill={isCompleted ? habitColor : 'rgba(243, 244, 246, 0.4)'}
                          stroke="#ffffff"
                          strokeWidth={isToday ? "1.5" : "0.5"}
                          style={{ 
                            cursor: isToday ? 'pointer' : 'default', 
                            transition: 'fill 0.2s',
                          }}
                          onClick={() => {
                            if (isToday) {
                              onToggleHabit(habit.id, !isCompleted);
                            }
                          }}
                        >
                          <title>
                            {habit.name} - {d}-{currentMonthName} {isCompleted ? '✓ Bajarildi' : '× Bajarilmadi'} {isToday ? '(Bugun, o\'zgartirish uchun bosing)' : ''}
                          </title>
                        </path>
                      );
                    }
                  });

                  // Draw Day Numbers on outer circle
                  const dayLabels = [];
                  const labelR = innerR + totalHabits * ringWidth + 12;
                  for (let d = 1; d <= daysInMonth; d++) {
                    const anglePerSlice = 360 / daysInMonth;
                    const aMid = (d - 0.5) * anglePerSlice;
                    const radMid = (aMid * Math.PI) / 180;
                    
                    const lx = cx + labelR * Math.cos(radMid);
                    const ly = cy + labelR * Math.sin(radMid);
                    
                    // Rotate day label numbers to read clearly upright
                    const rotAngle = aMid + 90;

                    dayLabels.push(
                      <text
                        key={`day-lbl-${d}`}
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="7px"
                        fontWeight="700"
                        fill="var(--text-secondary)"
                        transform={`rotate(${rotAngle}, ${lx}, ${ly})`}
                      >
                        {d}
                      </text>
                    );
                  }

                  return (
                    <>
                      {segments}
                      {dayLabels}
                    </>
                  );
                })()}

                {/* Concentric Guide Grid Borders */}
                {(() => {
                  const cx = 135;
                  const cy = 135;
                  const totalHabits = activeHabits.length;
                  const maxRadii = 90;
                  const innerR = 36;
                  const ringWidth = Math.max(7, Math.min(13, (maxRadii - innerR) / totalHabits));

                  const grids = [];
                  for (let i = 0; i <= totalHabits; i++) {
                    const r = innerR + i * ringWidth;
                    grids.push(
                      <circle
                        key={`grid-circle-${i}`}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="0.8"
                      />
                    );
                  }
                  return grids;
                })()}
              </svg>

              {/* Central White Glass Circle (Quote in center) */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '98px', 
                  left: '98px', 
                  width: '74px', 
                  height: '74px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 4px 10px rgba(109, 40, 217, 0.1)',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '4px',
                  border: '1px solid #ede9fe'
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {currentLang === 'uz' ? 'Bugun' : (currentLang === 'ru' ? 'Сегодня' : 'Today')}
                </span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: '1.1' }}>
                  {now.getDate()}
                </span>
                <span style={{ fontSize: '7px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3px' }}>
                  {currentLang === 'uz' ? "Olg'a intil!" : (currentLang === 'ru' ? 'Не сдавайся!' : 'Keep going!')}
                </span>
              </div>
            </div>

            {/* Habit Ring Color Legend */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', padding: '12px', borderRadius: '14px' }}>
              {activeHabits.map((habit, index) => (
                <div key={`legend-${habit.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getCategoryColor(habit.category) }}></div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                    {habit.name}
                  </span>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
            {currentLang === 'uz' 
              ? "Hozircha faol kundalik odatlar mavjud emas. Odatlar bo'limidan qo'shishingiz bilan g'ildirak shakllanadi!" 
              : (currentLang === 'ru' 
                ? "Активных привычек пока нет. Колесо сформируется при их добавлении в разделе Привычки!" 
                : "No active daily habits yet. The wheel will form once you add habits in the Habits section!")
            }
          </div>
        )}
      </div>

      {/* STREAK LEADERBOARD CARD */}
      {!loadingLeaderboard && leaderboard.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
            <span style={{ fontSize: '18px' }}>🔥</span> {t('leaderboard_title') || 'Streak Leaderboard'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leaderboard.map((player, idx) => {
              const isCurrentUser = player.userId === user.id;
              return (
                <div 
                  key={player.userId}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isCurrentUser ? 'rgba(124, 58, 237, 0.08)' : 'var(--surface-hover)',
                    border: isCurrentUser ? '1px solid rgba(124, 58, 237, 0.15)' : '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: idx === 0 ? '#fbbf24' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#b45309' : 'var(--text-secondary)')), width: '18px' }}>
                      #{idx + 1}
                    </span>
                    {player.avatar ? (
                      <img src={player.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                        {player.firstName ? player.firstName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {player.firstName} {isCurrentUser && `(${t('all') === 'Barchasi' ? 'Siz' : 'You'})`}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.15)', padding: '4px 10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#b45309' }}>🔥 {player.streak}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Group invite section */}
          <div style={{ borderTop: '1px solid rgba(124, 58, 237, 0.08)', marginTop: '14px', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500', lineHeight: '1.4' }}>
              {currentLang === 'uz' 
                ? "Do'stlaringizni taklif qilib, kunlik streak odat musobaqalarini boshlang!" 
                : (currentLang === 'ru' 
                  ? "Приглашайте друзей и соревнуйтесь по ежедневным сериям привычек!" 
                  : "Invite friends and compete in daily habit streaks!")}
            </p>
            <button 
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '9px', fontSize: '11.5px', borderRadius: '10px', fontWeight: '750', gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const botUsername = 'odat_tracker_bot';
                const inviteLink = `https://t.me/${botUsername}?start=challenge_${user.id}`;
                
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(inviteLink);
                  alert(t('invite_copied_msg') || "Taklif havolasi nusxalandi!");
                } else {
                  const input = document.createElement('input');
                  input.value = inviteLink;
                  document.body.appendChild(input);
                  input.select();
                  document.execCommand('copy');
                  document.body.removeChild(input);
                  alert(t('invite_copied_msg') || "Taklif havolasi nusxalandi!");
                }
                
                const shareText = (t('share_challenge_text') || "Men bilan odat shakllantirish musobaqasiga qo'shiling! Telegram Mini App: {link}").replace('{link}', inviteLink);
                const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
                window.open(tgShareUrl, '_blank');
              }}
            >
              🚀 {t('share_challenge_btn') || "Do'stlarni chellenjga taklif qilish"}
            </button>
          </div>
        </div>
      )}


      {/* Habits Checklist */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2>{t('today_habits')}</h2>
          <button className="btn" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '10px' }} onClick={() => setActiveTab('habits')}>
            {t('manage')}
          </button>
        </div>

        {activeHabits.length > 0 ? (
          activeHabits.map(habit => {
            const isCompleted = habit.completedDates && habit.completedDates[todayStr];
            
            // Emoji lookup for habits
            let emoji = '⭐️';
            if (habit.category === 'namoz') emoji = '🕌';
            else if (habit.id === 'sleep-morning') emoji = '🌅';
            else if (habit.id === 'sleep-evening') emoji = '🌙';
            else if (habit.name.toLowerCase().includes('book') || habit.name.toLowerCase().includes('kitob') || habit.name.toLowerCase().includes('книг')) emoji = '📚';
            else if (habit.name.toLowerCase().includes('water') || habit.name.toLowerCase().includes('suv') || habit.name.toLowerCase().includes('вод')) emoji = '💧';
            else if (habit.name.toLowerCase().includes('exercise') || habit.name.toLowerCase().includes('sport') || habit.name.toLowerCase().includes('mashq') || habit.name.toLowerCase().includes('физ')) emoji = '💪';
            else if (habit.name.toLowerCase().includes('diary') || habit.name.toLowerCase().includes('kun') || habit.name.toLowerCase().includes('днев')) emoji = '✍️';
            else if (habit.name.toLowerCase().includes('meditat') || habit.name.toLowerCase().includes('muloq')) emoji = '🧘‍♀️';

            return (
              <div key={habit.id} className={`habit-card ${isCompleted ? 'completed' : ''}`}>
                <div className="habit-info">
                  <div className={`habit-icon-wrapper habit-icon-${habit.category}`}>
                    {emoji}
                  </div>
                  <div className="habit-details">
                    <span className="habit-name">{habit.name}</span>
                    <span className="habit-time">{habit.time}</span>
                  </div>
                </div>
                  <button 
                    className={`btn-toggle-check ${isCompleted ? 'checked' : ''}`}
                    onClick={() => {
                      if (!togglingHabits[habit.id]) {
                        onToggleHabit(habit.id, !isCompleted);
                      }
                    }}
                    style={{
                      opacity: togglingHabits[habit.id] ? 0.55 : 1,
                      cursor: togglingHabits[habit.id] ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    disabled={togglingHabits[habit.id]}
                  >
                    <CheckCircle2 size={18} strokeWidth={3} />
                  </button>
              </div>
            );
          })
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>{t('no_habits')}</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('habits')}>
              {t('add_habit')}
            </button>
          </div>
        )}
      </div>

      {/* Floating AI Coach Portal Trigger Bubble */}
      <div 
        onClick={() => setShowChat(true)}
        style={{
          position: 'fixed',
          bottom: '82px',
          right: '18px',
          zIndex: 1000,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4), 0 0 15px rgba(124, 58, 237, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '2px solid rgba(255,255,255,0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="pulse"
      >
        <span style={{ fontSize: '26px' }}>🧠</span>
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: 'var(--success)',
          color: 'white',
          fontSize: '7.5px',
          fontWeight: '900',
          padding: '2px 5.5px',
          borderRadius: '10px',
          textTransform: 'uppercase',
          border: '1.5px solid var(--surface-color)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          Coach
        </span>
      </div>

      {/* AI Coach Full-Screen Chat Modal Drawer */}
      {showChat && (
        <div 
          className="modal-overlay active" 
          style={{ 
            zIndex: 2000, 
            display: 'flex', 
            alignItems: 'end', 
            justifyContent: 'center',
            padding: 0
          }}
          onClick={() => setShowChat(false)}
        >
          <div 
            className="glass-card animate-slide-in" 
            style={{ 
              width: '100%', 
              maxWidth: '480px', 
              height: '88vh', 
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              border: '1px solid var(--surface-border)',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--surface-border)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'var(--surface-hover)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 4px 10px rgba(124,58,237,0.2)'
                }}>
                  🧠
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>
                    AI Ustoz / Coach
                  </strong>
                  <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                    online
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                style={{ 
                  background: 'var(--surface-color)', 
                  border: '1px solid var(--surface-border)', 
                  color: 'var(--text-primary)', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages Body */}
            <div style={{ 
              flex: 1, 
              padding: '16px 20px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              background: 'rgba(124, 58, 237, 0.01)'
            }}>
              {chatMessages.map((msg, idx) => {
                const isCoach = msg.sender === 'coach';
                return (
                  <div 
                    key={idx}
                    style={{ 
                      alignSelf: isCoach ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: isCoach ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                      background: isCoach ? 'var(--surface-color)' : 'var(--primary-gradient)',
                      color: isCoach ? 'var(--text-primary)' : 'white',
                      border: isCoach ? '1px solid var(--surface-border)' : 'none',
                      fontSize: '13px',
                      lineHeight: '1.45',
                      fontWeight: '550',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.text}
                  </div>
                );
              })}

              {isTyping && (
                <div 
                  style={{ 
                    alignSelf: 'flex-start',
                    padding: '12px 18px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--surface-border)',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'soundwave 0.6s infinite alternate' }}></span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'soundwave 0.6s infinite alternate 0.2s' }}></span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'soundwave 0.6s infinite alternate 0.4s' }}></span>
                </div>
              )}
            </div>

            {/* Quick Chips Predefined Prompts */}
            <div style={{ 
              padding: '8px 12px', 
              borderTop: '1px solid var(--surface-border)', 
              display: 'flex', 
              gap: '6px', 
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              background: 'var(--surface-hover)'
            }}>
              {[
                { 
                  label: currentLang === 'ru' ? '📈 Мои финансы' : (currentLang === 'en' ? '📈 My Finances' : '📈 Moliyaviy tahlil'),
                  prompt: currentLang === 'ru' ? 'Сделай финансовый анализ' : (currentLang === 'en' ? 'Give me a financial analysis' : 'Moliyamni tahlil qilib ber')
                },
                { 
                  label: currentLang === 'ru' ? '⚡️ Привычки' : (currentLang === 'en' ? '⚡️ Habits' : '⚡️ Odatlarim'),
                  prompt: currentLang === 'ru' ? 'Как мои привычки?' : (currentLang === 'en' ? 'How are my habits?' : 'Odatlarimni tahlil qilib ber')
                },
                { 
                  label: currentLang === 'ru' ? '🏆 Мои цели' : (currentLang === 'en' ? '🏆 My Goals' : '🏆 Maqsadlarim'),
                  prompt: currentLang === 'ru' ? 'Расскажи о моих целях' : (currentLang === 'en' ? 'Tell me about my goals' : 'Maqsadlarim ketyapti?')
                },
                { 
                  label: currentLang === 'ru' ? '🔥 Мотивация' : (currentLang === 'en' ? '🔥 Motivation' : '🔥 Motivatsiya'),
                  prompt: currentLang === 'ru' ? 'Дай мотивацию дня' : (currentLang === 'en' ? 'Give me motivation' : 'Menga motivatsiya ber')
                }
              ].map((chip, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => handleSendMessage(chip.prompt)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid var(--surface-border)',
                display: 'flex',
                gap: '8px',
                background: 'var(--surface-color)'
              }}
            >
              <input 
                type="text" 
                className="form-control"
                style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', fontSize: '13px' }}
                placeholder={currentLang === 'ru' ? 'Спросите ИИ...' : (currentLang === 'en' ? 'Ask AI Coach...' : 'Savol yozing...')}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '800' }}
              >
                {currentLang === 'ru' ? 'Отправить' : (currentLang === 'en' ? 'Send' : 'Yuborish')}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
