import React, { useState } from 'react';
import { Plus, Minus, Award, Trash2, Image as ImageIcon, X, BookOpen, Heart, Briefcase, HelpCircle } from 'lucide-react';

export default function Goals({ user, onAddGoal, onUpdateGoal, onDeleteGoal, onAddPlan, onUpdatePlan, onDeletePlan, t }) {
  const [activeSubTab, setActiveSubTab] = useState('goals'); // goals or plans
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('goal'); // goal or plan
  
  // Goal fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(10);
  const [goalUnit, setGoalUnit] = useState('marta');
  const [goalDeadline, setGoalDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [goalImage, setGoalImage] = useState('');

  // Plan fields
  const [planText, setPlanText] = useState('');
  const [planType, setPlanType] = useState('weekly');
  const [planCategory, setPlanCategory] = useState('growth'); // growth, health, work, other

  // Click locks
  const [clickLocked, setClickLocked] = useState({});
  const [showCalendarGoalId, setShowCalendarGoalId] = useState({});
  const [shareGoal, setShareGoal] = useState(null);

  const now = new Date();
  const yyyy = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const todayStr = `${yyyy}-${month}-${String(now.getDate()).padStart(2, '0')}`;

  const lang = user.settings?.language || 'uz';
  const activeLocale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
  const currentMonthName = now.toLocaleString(activeLocale, { month: 'long' });

  // Plan categories helper
  const planCategories = {
    growth: { label: t('plan_growth') || 'Shaxsiy Rivojlanish', color: '#8b5cf6', icon: <BookOpen size={13} /> },
    health: { label: t('plan_health') || 'Sog\'liq', color: '#10b981', icon: <Heart size={13} /> },
    work: { label: t('plan_work') || 'Karyera/Ish', color: '#f59e0b', icon: <Briefcase size={13} /> },
    other: { label: t('plan_other') || 'Boshqa', color: '#6b7280', icon: <HelpCircle size={13} /> }
  };

  const getPlanCategoryDetails = (cat) => {
    return planCategories[cat] || planCategories['other'];
  };

  const parsePlanText = (text) => {
    if (text.startsWith('__cat:')) {
      const parts = text.split('__');
      const category = parts[1].split(':')[1];
      const cleanText = parts.slice(2).join('__');
      return { category, text: cleanText };
    }
    return { category: 'other', text };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(t('avatar_size_error') || 'Fayl hajmi 2MB dan kam bo\'lishi kerak');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setGoalImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'goal') {
      if (!goalTitle.trim()) return;
      onAddGoal(goalTitle, goalTarget, goalUnit, goalDeadline, goalImage);
      setGoalTitle('');
      setGoalTarget(10);
      setGoalUnit('marta');
      setGoalImage('');
    } else {
      if (!planText.trim()) return;
      const formattedText = `__cat:${planCategory}__${planText.trim()}`;
      onAddPlan(formattedText, planType, null);
      setPlanText('');
    }
    setShowModal(false);
  };

  const triggerUpdateWithLock = (goalId, targetValue, updatedDates = null) => {
    if (clickLocked[goalId]) return;
    setClickLocked(prev => ({ ...prev, [goalId]: true }));
    const payload = { current: targetValue, ...(updatedDates && { completedDates: updatedDates }) };
    onUpdateGoal(goalId, payload);
    setTimeout(() => setClickLocked(prev => ({ ...prev, [goalId]: false })), 450);
  };

  const handleIncrement = (goal) => {
    if (goal.current >= goal.target) return;
    triggerUpdateWithLock(goal.id, goal.current + 1);
  };

  const handleDecrement = (goal) => {
    if (goal.current <= 0) return;
    triggerUpdateWithLock(goal.id, goal.current - 1);
  };

  const handleToggleToday = (goal, markDone) => {
    const currentCompleted = goal.completedDates || {};
    const updatedDates = { ...currentCompleted };
    let targetCurrent = goal.current;

    if (markDone) {
      if (!currentCompleted[todayStr]) {
        updatedDates[todayStr] = true;
        targetCurrent = Math.min(goal.target, goal.current + 1);
      }
    } else {
      if (currentCompleted[todayStr]) {
        delete updatedDates[todayStr];
        targetCurrent = Math.max(0, goal.current - 1);
      }
    }
    triggerUpdateWithLock(goal.id, targetCurrent, updatedDates);
  };

  const handleToggleDate = (goal, dateString) => {
    const currentCompleted = goal.completedDates || {};
    const updatedDates = { ...currentCompleted };
    let targetCurrent = goal.current;

    if (currentCompleted[dateString]) {
      delete updatedDates[dateString];
      targetCurrent = Math.max(0, goal.current - 1);
    } else {
      updatedDates[dateString] = true;
      targetCurrent = Math.min(goal.target, goal.current + 1);
    }
    triggerUpdateWithLock(goal.id, targetCurrent, updatedDates);
  };

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById('share-goal-svg');
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const blobURL = DOMURL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      canvas.getContext('2d').drawImage(image, 0, 0, 600, 400);
      const pngURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngURL;
      downloadLink.download = `${shareGoal ? shareGoal.title.replace(/\s+/g, '_') : 'goal'}_Completed.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      DOMURL.revokeObjectURL(pngURL);
    };
    image.src = blobURL;
  };

  const getMilestoneInfo = (percentage, currentLang) => {
    if (percentage >= 100) return { label: currentLang === 'ru' ? '🏆 Достигнуто' : (currentLang === 'en' ? '🏆 Achieved' : '🏆 Erishildi'), bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' };
    if (percentage >= 70) return { label: currentLang === 'ru' ? '🔥 Финишная прямая' : (currentLang === 'en' ? '🔥 Final Stretch' : '🔥 So\'nggi Qadam'), bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', color: '#ffffff' };
    if (percentage >= 40) return { label: currentLang === 'ru' ? '⚡ Хороший темп' : (currentLang === 'en' ? '⚡ Great Pace' : '⚡ Yaxshi Temp'), bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff' };
    return { label: currentLang === 'ru' ? '🌱 Начало пути' : (currentLang === 'en' ? '🌱 Starting out' : '🌱 Yangi Boshlanish'), bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: '#ffffff' };
  };

  // Group goals and plans
  const goals = user.goals || [];
  const plans = user.plans || [];
  const weeklyPlans = plans.filter(p => p.type === 'weekly');
  const monthlyPlans = plans.filter(p => p.type === 'monthly');

  return (
    <div style={{ paddingBottom: '30px' }}>
      <div className="animate-fade-in">
      
      {/* HEADER SECTION WITH COMBINED COUNTS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)' }}>
          {lang === 'uz' ? 'Maqsadlar & Rejalar' : (lang === 'ru' ? 'Цели и Планы' : 'Goals & Plans')}
        </h1>
        <button 
          type="button"
          className="btn btn-primary"
          style={{ padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 'bold' }}
          onClick={() => {
            setModalMode(activeSubTab === 'goals' ? 'goal' : 'plan');
            setShowModal(true);
          }}
        >
          <Plus size={16} /> {lang === 'uz' ? 'Yangi Qo\'shish' : 'Добавить'}
        </button>
      </div>

      {/* COLOURED CAPSULE SWITCHER WITH SMOOTH ANIMATION */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        background: 'var(--surface-color)', 
        border: '1px solid var(--surface-border)', 
        borderRadius: '16px', 
        padding: '4px', 
        gap: '4px',
        marginBottom: '22px'
      }}>
        <button 
          type="button"
          style={{ 
            padding: '11px', 
            borderRadius: '12px', 
            border: 'none', 
            background: activeSubTab === 'goals' ? 'var(--primary-gradient)' : 'transparent',
            color: activeSubTab === 'goals' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '800',
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeSubTab === 'goals' ? '0 4px 12px rgba(139, 92, 246, 0.25)' : 'none'
          }}
          onClick={() => setActiveSubTab('goals')}
        >
          🎯 {lang === 'uz' ? 'Katta Maqsadlar' : (lang === 'ru' ? 'Большие Цели' : 'Big Goals')} ({goals.length})
        </button>
        <button 
          type="button"
          style={{ 
            padding: '11px', 
            borderRadius: '12px', 
            border: 'none', 
            background: activeSubTab === 'plans' ? 'var(--primary-gradient)' : 'transparent',
            color: activeSubTab === 'plans' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '800',
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeSubTab === 'plans' ? '0 4px 12px rgba(139, 92, 246, 0.25)' : 'none'
          }}
          onClick={() => setActiveSubTab('plans')}
        >
          ⚡ {lang === 'uz' ? 'Kichik Rejalar' : (lang === 'ru' ? 'Планы Действий' : 'Action Plans')} ({plans.length})
        </button>
      </div>

      {/* SUBTAB 1: GOALS TAB */}
      {activeSubTab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {goals.length === 0 ? (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '14px', margin: '0 0 10px 0' }}>
                {lang === 'uz' ? 'Hozircha maqsadlar yo\'q. Yangi maqsad qo\'shing!' : 'Пока целей нет. Добавьте новую цель!'}
              </p>
            </div>
          ) : (
            goals.map((goal) => {
              const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
              const milestone = getMilestoneInfo(percentage, lang);
              const isDone = goal.completedDates && goal.completedDates[todayStr];

              return (
                <div key={goal.id} className="glass-card habit-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    {goal.image ? (
                      <img 
                        src={goal.image} 
                        style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--surface-border)' }} 
                        alt="" 
                      />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <Award size={26} />
                      </div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{goal.title}</h3>
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ padding: '4px', border: 'none', background: 'none', color: '#ef4444' }}
                          onClick={() => {
                            if (confirm(t('confirm_delete_goal') || "Ushbu maqsadni o‘chirishni tasdiqlaysizmi?")) {
                              onDeleteGoal(goal.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '750', padding: '2px 8px', borderRadius: '6px', background: milestone.bg, color: milestone.color }}>
                          {milestone.label}
                        </span>
                        {goal.deadline && (
                          <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                            📅 {goal.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '11px', fontWeight: '750', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>{percentage}% {lang === 'uz' ? 'bajarildi' : 'выполнено'}</span>
                      <span>{goal.current} / {goal.target} {goal.unit}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', borderRadius: '4px', background: 'var(--primary-gradient)', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  {/* Control Actions (No traditional checkbox for goals!) */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button 
                      type="button"
                      className="btn"
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justify: 'center', gap: '4px', background: 'var(--surface-hover)', border: '1px solid var(--surface-border)' }}
                      onClick={() => handleDecrement(goal)}
                    >
                      <Minus size={13} /> {lang === 'uz' ? 'Kamaytirish' : 'Уменьшить'}
                    </button>
                    <button 
                      type="button"
                      className="btn"
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justify: 'center', gap: '4px', background: 'var(--surface-hover)', border: '1px solid var(--surface-border)' }}
                      onClick={() => handleIncrement(goal)}
                    >
                      <Plus size={13} /> {lang === 'uz' ? 'Oshirish' : 'Увеличить'}
                    </button>

                    <button 
                      type="button" 
                      className="btn"
                      style={{ 
                        padding: '9px 14px', 
                        borderRadius: '10px', 
                        fontSize: '12px', 
                        fontWeight: '800',
                        background: isDone ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(16, 185, 129, 0.1)',
                        color: isDone ? 'white' : '#10b981',
                        border: 'none',
                        boxShadow: isDone ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none'
                      }}
                      onClick={() => handleToggleToday(goal, !isDone)}
                    >
                      {isDone ? '🎉 Bugun bajarildi' : '🎯 Bugun uchun belgilash'}
                    </button>

                    {percentage >= 100 && (
                      <button 
                        type="button"
                        className="btn"
                        style={{ padding: '8px 10px', borderRadius: '10px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'white', border: 'none' }}
                        onClick={() => setShareGoal(goal)}
                        title={lang === 'uz' ? 'Ulashing' : 'Поделиться'}
                      >
                        🎓
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 2: PLANS TAB (NO TRADITIONAL CHECKBOXES, UNIQUE TIMELINE GLOW STYLE) */}
      {activeSubTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Weekly Plans Group */}
          <div>
            <h3 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              ⚡ {lang === 'uz' ? 'Haftalik Rejalar' : 'Еженедельные Планы'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {weeklyPlans.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 10px 12px' }}>
                  {lang === 'uz' ? 'Bu haftaga rejalar yo\'q.' : 'Планов на эту неделю нет.'}
                </p>
              ) : (
                weeklyPlans.map(plan => {
                  const { category, text } = parsePlanText(plan.text);
                  const details = getPlanCategoryDetails(category);
                  
                  return (
                    <div 
                      key={plan.id}
                      className="glass-card habit-card"
                      style={{ 
                        padding: '12px 14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        transform: plan.completed ? 'scale(0.98)' : 'scale(1)',
                        opacity: plan.completed ? 0.75 : 1,
                        borderLeft: `4px solid ${details.color}`,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => onUpdatePlan(plan.id, { completed: !plan.completed })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        {/* GLOWING TIMELINE CAPSULE DOT (No checklist box!) */}
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: plan.completed ? '#10b981' : '#38bdf8',
                          boxShadow: plan.completed 
                            ? '0 0 10px rgba(16, 185, 129, 0.7)' 
                            : '0 0 10px rgba(56, 189, 248, 0.7)',
                          flexShrink: 0,
                          animation: !plan.completed ? 'pulse 2s infinite' : 'none'
                        }} />

                        <div>
                          <p style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            margin: 0, 
                            color: 'var(--text-primary)',
                            textDecoration: plan.completed ? 'line-through' : 'none' 
                          }}>
                            {text}
                          </p>
                          <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span style={{ color: details.color }}>{details.icon}</span> {details.label}
                          </span>
                        </div>
                      </div>

                      <button 
                        type="button"
                        className="btn"
                        style={{ padding: '6px', border: 'none', background: 'none', color: '#ef4444' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('confirm_delete_plan') || "Ushbu rejani o‘chirishni tasdiqlaysizmi?")) {
                            onDeletePlan(plan.id);
                          }
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Monthly Plans Group */}
          <div>
            <h3 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              🗓️ {lang === 'uz' ? 'Oylik Rejalar' : 'Ежемесячные Планы'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {monthlyPlans.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 10px 12px' }}>
                  {lang === 'uz' ? 'Bu oyga rejalar yo\'q.' : 'Планов на этот месяц нет.'}
                </p>
              ) : (
                monthlyPlans.map(plan => {
                  const { category, text } = parsePlanText(plan.text);
                  const details = getPlanCategoryDetails(category);
                  
                  return (
                    <div 
                      key={plan.id}
                      className="glass-card habit-card"
                      style={{ 
                        padding: '12px 14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        transform: plan.completed ? 'scale(0.98)' : 'scale(1)',
                        opacity: plan.completed ? 0.75 : 1,
                        borderLeft: `4px solid ${details.color}`,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => onUpdatePlan(plan.id, { completed: !plan.completed })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        {/* GLOWING TIMELINE CAPSULE DOT */}
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: plan.completed ? '#10b981' : '#a78bfa',
                          boxShadow: plan.completed 
                            ? '0 0 10px rgba(16, 185, 129, 0.7)' 
                            : '0 0 10px rgba(167, 139, 250, 0.7)',
                          flexShrink: 0
                        }} />

                        <div>
                          <p style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            margin: 0, 
                            color: 'var(--text-primary)',
                            textDecoration: plan.completed ? 'line-through' : 'none' 
                          }}>
                            {text}
                          </p>
                          <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span style={{ color: details.color }}>{details.icon}</span> {details.label}
                          </span>
                        </div>
                      </div>

                      <button 
                        type="button"
                        className="btn"
                        style={{ padding: '6px', border: 'none', background: 'none', color: '#ef4444' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('confirm_delete_plan') || "Ushbu rejani o‘chirishni tasdiqlaysizmi?")) {
                            onDeletePlan(plan.id);
                          }
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      </div> {/* close animate-fade-in containing block */}

      {/* UNIFIED ADD DIALOG MODAL (Saves goals or plans based on selection) */}
      {showModal && (
        <div className="modal-overlay active">
          <div className="modal-content glass-card animate-scale-in" style={{ padding: '20px', maxWidth: '92%', width: '380px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '15.5px', fontWeight: '850' }}>
                {lang === 'uz' ? 'Yangi Element Qo\'shish' : 'Добавить новый элемент'}
              </h2>
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '4px', border: 'none', background: 'none' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Inner modal mode switcher with proper theme background and responsive dark/light colors */}
            <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-hover)', border: '1px solid var(--surface-border)', padding: '3px', borderRadius: '10px', marginBottom: '16px' }}>
              <button 
                type="button" 
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  fontWeight: '750', 
                  cursor: 'pointer', 
                  background: modalMode === 'goal' ? 'var(--primary-gradient)' : 'transparent', 
                  color: modalMode === 'goal' ? '#ffffff' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setModalMode('goal')}
              >
                🎯 {lang === 'uz' ? 'Maqsad' : 'Цель'}
              </button>
              <button 
                type="button" 
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  fontWeight: '750', 
                  cursor: 'pointer', 
                  background: modalMode === 'plan' ? 'var(--primary-gradient)' : 'transparent', 
                  color: modalMode === 'plan' ? '#ffffff' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setModalMode('plan')}
              >
                ⚡ {lang === 'uz' ? 'Reja' : 'План'}
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* GOAL FIELDS */}
              {modalMode === 'goal' && (
                <>
                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      {t('goal_title_lbl') || 'Maqsad nomi'}
                    </label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        {t('goal_target_lbl') || 'Maqsad qiymati'}
                      </label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(Number(e.target.value) || 10)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        {t('goal_unit_lbl') || 'O\'lchov birligi'}
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={goalUnit}
                        onChange={(e) => setGoalUnit(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      {t('goal_deadline_lbl') || 'Tugash muddati'}
                    </label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      {lang === 'uz' ? 'Maqsad rasmi' : 'Изображение цели'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px dashed var(--surface-border)', background: 'var(--surface-hover)', cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                        <ImageIcon size={16} /> {lang === 'uz' ? 'Yuklash (2MB max)' : 'Загрузить (2МБ)'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                      </label>
                      {goalImage && (
                        <img 
                          src={goalImage} 
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                          alt="" 
                        />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* PLAN FIELDS */}
              {modalMode === 'plan' && (
                <>
                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      {lang === 'uz' ? 'Reja matni' : 'Текст плана'}
                    </label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder={lang === 'uz' ? 'Masalan: Dasturlashni o\'rganish' : 'Например: Учить JS'}
                      value={planText}
                      onChange={(e) => setPlanText(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        {lang === 'uz' ? 'Reja turi' : 'Тип плана'}
                      </label>
                      <select className="form-control" value={planType} onChange={(e) => setPlanType(e.target.value)}>
                        <option value="weekly">{lang === 'uz' ? 'Haftalik' : 'Еженедельный'}</option>
                        <option value="monthly">{lang === 'uz' ? 'Oylik' : 'Ежемесячный'}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        {lang === 'uz' ? 'Kategoriya' : 'Категория'}
                      </label>
                      <select className="form-control" value={planCategory} onChange={(e) => setPlanCategory(e.target.value)}>
                        <option value="growth">🧠 {lang === 'uz' ? 'Rivojlanish' : 'Рост'}</option>
                        <option value="health">🥗 {lang === 'uz' ? 'Salomatlik' : 'Здоровье'}</option>
                        <option value="work">💼 {lang === 'uz' ? 'Karyera/Ish' : 'Работа'}</option>
                        <option value="other">⚙️ {lang === 'uz' ? 'Boshqa' : 'Другое'}</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
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

      {/* SHARE GOAL OVERLAY CARD */}
      {shareGoal && (
        <div className="modal-overlay active" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-card animate-scale-in" style={{ padding: '24px 20px', maxWidth: '92%', width: '380px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800' }}>
                {t('share_goal_card') || 'Goal Share Card'}
              </h2>
              <button 
                type="button"
                className="btn" 
                style={{ padding: '4px', border: 'none', background: 'none' }}
                onClick={() => setShareGoal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ width: '100%', overflowX: 'auto', marginBottom: '18px', borderRadius: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
              <svg 
                id="share-goal-svg" 
                width="600" 
                height="400" 
                viewBox="0 0 600 400" 
                style={{ 
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  display: 'block'
                }}
              >
                <circle cx="100" cy="100" r="150" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="2" />
                <circle cx="500" cy="300" r="120" fill="none" stroke="rgba(236,72,153,0.12)" strokeWidth="1.5" />
                
                <g transform="translate(300, 90) scale(1.5)">
                  <circle cx="0" cy="0" r="32" fill="rgba(124,58,237,0.15)" />
                  <path d="M-10,-12 L10,-12 L10,-6 C10,5 -10,5 -10,-6 Z" fill="#fbbf24" />
                  <path d="M-4,5 L4,5 L6,14 L-6,14 Z" fill="#f59e0b" />
                  <rect x="-12" y="14" width="24" height="4" fill="#fbbf24" rx="1" />
                  <path d="M-10,-9 C-15,-9 -17,-5 -15,-2 C-13,1 -10,0 -10,0" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M10,-9 C15,-9 17,-5 15,-2 C13,1 10,0 10,0" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                <text x="300" y="200" textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="900" letterSpacing="0.5">
                  {t('goal_achieved_lbl') || 'MAQSAD ERISHILDI! 🎉'}
                </text>
                <text x="300" y="244" textAnchor="middle" fill="#a78bfa" fontSize="20" fontWeight="700">
                  {shareGoal.title}
                </text>
                
                <g>
                  <rect x="150" y="275" width="300" height="34" rx="17" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x="300" y="297" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="800">
                    Progress: {shareGoal.current} / {shareGoal.target} {shareGoal.unit}
                  </text>
                </g>
                
                <text x="300" y="340" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="600">
                  {user.firstName}
                </text>
                <text x="300" y="375" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="700" letterSpacing="1">
                  HABIT TRACKER BOT
                </text>
              </svg>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', gap: '8px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)', border: 'none', fontWeight: 'bold' }}
              onClick={handleDownloadSVG}
            >
              <Award size={16} /> {t('download_share_card') || 'Kartanik yuklab olish (PNG)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
