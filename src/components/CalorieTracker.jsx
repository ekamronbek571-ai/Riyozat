import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Trash2, Flame, Check, RefreshCw, X, AlertTriangle, Zap, CheckCircle, Play, Pause, Square } from 'lucide-react';

const scanOptionsDatabase = [
  { label: "Osh (Palov) 🍛", name: "Osh (Palov)", kcal: 650, protein: 25, carbs: 70, fats: 28, isEdible: true },
  { label: "Somsa 🥐", name: "Somsa", kcal: 280, protein: 12, carbs: 32, fats: 14, isEdible: true },
  { label: "Issiq Non 🍞", name: "Non", kcal: 250, protein: 8, carbs: 50, fats: 2, isEdible: true },
  { label: "Pomidor 🍅", name: "Pomidor", kcal: 22, protein: 1, carbs: 4, fats: 0.2, isEdible: true },
  { label: "Bodring 🥒", name: "Bodring", kcal: 15, protein: 0.8, carbs: 3, fats: 0.1, isEdible: true },
  { label: "Qaynatilgan Tuxum 🥚", name: "Tuxum (Qaynatilgan)", kcal: 75, protein: 6, carbs: 0.6, fats: 5, isEdible: true },
  { label: "Lula Kabob 🍢", name: "Lula Kabob", kcal: 450, protein: 32, carbs: 5, fats: 35, isEdible: true },
  { label: "Manti 🥟", name: "Manti (4 dona)", kcal: 480, protein: 24, carbs: 45, fats: 22, isEdible: true },
  { label: "Shurva 🍜", name: "Shurva", kcal: 320, protein: 18, carbs: 15, fats: 20, isEdible: true },
  { label: "Olma 🍎", name: "Olma", kcal: 52, protein: 0.3, carbs: 14, fats: 0.2, isEdible: true },
  { label: "Banan 🍌", name: "Banan", kcal: 89, protein: 1.1, carbs: 23, fats: 0.3, isEdible: true },
  { label: "Shashlik 🍢", name: "Shashlik", kcal: 380, protein: 28, carbs: 2, fats: 25, isEdible: true },
  { label: "Lag'mon 🍜", name: "Lag'mon", kcal: 420, protein: 18, carbs: 55, fats: 12, isEdible: true },
  { label: "Yeyilmaydigan Buyum (Telefon, Stul, etc.) 📱", name: "Yeyilmaydigan Buyum", kcal: 0, protein: 0, carbs: 0, fats: 0, isEdible: false }
];

export default function CalorieTracker({ user, onLogCalorie, onResetCalorie, onDeleteCalorie, onUpdateWaterIntake, onUpdateWeight, triggerHaptic, t }) {
  const [activeMode, setActiveMode] = useState('food'); // 'food', 'sport', or 'workouts'
  const [customWeight, setCustomWeight] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodKcal, setCustomFoodKcal] = useState('');
  const [scanSearchQuery, setScanSearchQuery] = useState('');

  // WebRTC Live Camera States
  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Fallback refs
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [uploadedImgUrl, setUploadedImgUrl] = useState(null);



  // Global Exercises Database (Loaded from server or fallbacks)
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Slimming Exercise Library States
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState(null); // active setup modal
  const [activeWorkoutSession, setActiveWorkoutSession] = useState(null); // active timer session
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [initialDuration, setInitialDuration] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  // Admin Add Custom Exercise Form States
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [editingExId, setEditingExId] = useState(null);
  const [newExName, setNewExName] = useState('');
  const [newExDesc, setNewExDesc] = useState('');
  const [newExBurnRate, setNewExBurnRate] = useState(10);
  const [newExDuration, setNewExDuration] = useState(60);
  const [newExIcon, setNewExIcon] = useState('🔥');
  const [newExColor, setNewExColor] = useState('#8b5cf6');
  
  // Custom video sources (Can be a link or base64 file string)
  const [newExVideoUrl, setNewExVideoUrl] = useState('');
  const [videoInputType, setVideoInputType] = useState('link'); // 'link' or 'upload'
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const videoFileInputRef = useRef(null);

  const now = new Date();
  const yyyy = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const todayStr = `${yyyy}-${month}-${String(now.getDate()).padStart(2, '0')}`;

  const lang = user.settings?.language || 'uz';
  const isAdmin = user.role === 'admin' || String(user.id) === '514578229';

  // Preset Foods Database
  const presetFoods = [
    { name: 'Osh (Palov)', kcal: 650, protein: 25, carbs: 70, fats: 28, image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=120&auto=format&fit=crop&q=60' },
    { name: 'Somsa', kcal: 280, protein: 12, carbs: 32, fats: 14, image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=120&auto=format&fit=crop&q=60' },
    { name: 'Lula Kabob', kcal: 450, protein: 32, carbs: 5, fats: 35, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=60' },
    { name: 'Shurva', kcal: 320, protein: 18, carbs: 15, fats: 20, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=120&auto=format&fit=crop&q=60' },
    { name: 'Manti (4 dona)', kcal: 480, protein: 24, carbs: 45, fats: 22, image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=120&auto=format&fit=crop&q=60' }
  ];

  // Default backup list of exercises
  const defaultBackupExercises = [
    { id: 'burpees', name: 'Burpi Mashqi 🔥', desc: 'Butun tana mushaklarini chiniqtiradigan jadal kardio mashqi.', burnRate: 14, defaultDuration: 60, icon: '🔥', color: '#ef4444', videoUrl: '' },
    { id: 'jumping_jacks', name: 'Sakrash (Jumping Jacks) 🏃', desc: 'Yurak urishini tezlashtiradigan va yog‘ eritishni boshlovchi kardio.', burnRate: 10, defaultDuration: 60, icon: '🏃', color: '#3b82f6', videoUrl: '' },
    { id: 'mountain_climbers', name: 'Alpinist (Climbers) 🧗', desc: 'Qorin pressi va oyoqlarni mustahkamlovchi jadal harakat.', burnRate: 12, defaultDuration: 60, icon: '🧗', color: '#10b981', videoUrl: '' },
    { id: 'plank', name: 'Planka (Core Hold) 🧘', desc: 'Butun tana tayanch mushaklarini chiniqtiruvchi statik mashq.', burnRate: 5, defaultDuration: 60, icon: '🧘', color: '#a78bfa', videoUrl: '' }
  ];

  // Fetch exercises from backend API
  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const res = await fetch('/api/exercises');
      if (res.ok) {
        const data = await res.json();
        setExerciseLibrary(data || []);
      } else {
        setExerciseLibrary(defaultBackupExercises);
      }
    } catch (e) {
      console.warn("Failed fetching global exercises, using fallback:", e);
      setExerciseLibrary(defaultBackupExercises);
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    fetchExercises();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Web Audio Synthesizer Beep for Timer End
  const playBeep = (freq = 850, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext beep failed:", e);
    }
  };

  // Get current logs
  const todayLog = user.calorieLogs?.[todayStr] || { consumed: 0, burned: 0, items: [] };

  // Trigger high speed offline laser scan
  const startOfflineLaserScan = (imageSource) => {
    setScanning(true);
    setScannedResult(null);
    setShowScanOptions(false);
    setUploadedImgUrl(imageSource);

    // Speed up scan time to 1.3 seconds flat for instant response!
    setTimeout(() => {
      setScanning(false);
      setShowScanOptions(true);
    }, 1300);
  };

  // WebRTC Camera Controls with flash support
  const startLiveCamera = async () => {
    setScannedResult(null);
    setShowScanOptions(false);
    setUploadedImgUrl(null);
    setHasFlashlight(false);
    setFlashlightOn(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      setShowCameraFeed(true);
      
      const track = stream.getVideoTracks()[0];
      setTimeout(() => {
        try {
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.torch) {
            setHasFlashlight(true);
          }
        } catch (e) {
          console.warn("Flashlight capabilities lookup failed:", e);
        }
      }, 300);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.error("Native camera feed failed, fallback to file capture input:", err);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const toggleFlashlight = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextState = !flashlightOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setFlashlightOn(nextState);
    } catch (err) {
      console.error("Flashlight/Torch toggle failed:", err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    stopLiveCamera();
    startOfflineLaserScan(dataUrl);
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraFeed(false);
    setHasFlashlight(false);
    setFlashlightOn(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      startOfflineLaserScan(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const selectScanOption = (option) => {
    const selectedResult = {
      name: option.name,
      kcal: option.kcal,
      protein: option.protein,
      carbs: option.carbs,
      fats: option.fats,
      image: uploadedImgUrl,
      isEdible: option.isEdible
    };
    setScannedResult(selectedResult);
    setShowScanOptions(false);
  };

  const handleLogFood = () => {
    if (!scannedResult) return;
    onLogCalorie(
      todayStr,
      'food',
      scannedResult.name,
      scannedResult.kcal,
      scannedResult.protein,
      scannedResult.carbs,
      scannedResult.fats
    );
    setScannedResult(null);
    setUploadedImgUrl(null);
  };

  const handleLogCustomFood = (e) => {
    e.preventDefault();
    if (!customFoodName.trim() || !customFoodKcal) return;
    
    const kcalVal = Number(customFoodKcal);
    const estProtein = Math.round(kcalVal * 0.05);
    const estCarbs = Math.round(kcalVal * 0.12);
    const estFats = Math.round(kcalVal * 0.04);

    onLogCalorie(todayStr, 'food', customFoodName.trim(), kcalVal, estProtein, estCarbs, estFats);
    setCustomFoodName('');
    setCustomFoodKcal('');
  };



  // Workout Session Timer Actions
  const handleStartWorkoutSetup = (exercise) => {
    setSelectedLibraryExercise(exercise);
    setTimerSeconds(exercise.defaultDuration);
    setInitialDuration(exercise.defaultDuration);
  };

  const startWorkoutSession = () => {
    if (!selectedLibraryExercise) return;
    setActiveWorkoutSession(selectedLibraryExercise);
    setTimerRunning(true);
    setWorkoutComplete(false);
    setElapsedSeconds(0);
    setSelectedLibraryExercise(null);

    // Setup interval
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          // Timer finished
          clearInterval(timerIntervalRef.current);
          setTimerRunning(false);
          setWorkoutComplete(true);
          playBeep(980, 0.4);
          return 0;
        }
        // Beep on last 3 seconds
        if (prev <= 4) {
          playBeep(600, 0.1);
        }
        return prev - 1;
      });
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const pauseWorkoutSession = () => {
    setTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const resumeWorkoutSession = () => {
    setTimerRunning(true);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setTimerRunning(false);
          setWorkoutComplete(true);
          playBeep(980, 0.4);
          return 0;
        }
        if (prev <= 4) {
          playBeep(600, 0.1);
        }
        return prev - 1;
      });
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopWorkoutSession = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setWorkoutComplete(true);
    playBeep(850, 0.25);
  };

  const logWorkoutSession = () => {
    if (!activeWorkoutSession) return;
    const finalBurnRate = activeWorkoutSession.burnRate;
    const minutesElapsed = elapsedSeconds / 60;
    const kcalBurned = Math.round(finalBurnRate * minutesElapsed);

    onLogCalorie(
      todayStr, 
      'workout', 
      `${activeWorkoutSession.icon} ${activeWorkoutSession.name} (${Math.round(minutesElapsed * 10) / 10} min)`, 
      kcalBurned, 
      0, 
      0, 
      0
    );

    // reset states
    setActiveWorkoutSession(null);
    setWorkoutComplete(false);
    setElapsedSeconds(0);
  };

  // YouTube / general video URL embed helper
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    if (url.includes('youtube.com/watch')) {
      try {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } catch (e) {}
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const isDirectVideoLink = (url) => {
    if (!url) return false;
    return url.startsWith('data:video/') || url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('/video/') || url.includes('.mov');
  };

  // Admin Direct Video File Reader Upload
  const handleVideoFileRead = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 8MB to avoid database bloat
    if (file.size > 8 * 1024 * 1024) {
      alert(lang === 'uz' ? "Video fayl o‘lchami juda katta! Maksimal 8MB hajmgacha ruxsat beriladi." : "Файл видео слишком большой! Лимит 8МБ.");
      return;
    }

    setUploadingVideo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewExVideoUrl(reader.result);
      setUploadingVideo(false);
    };
    reader.readAsDataURL(file);
  };

  // Admin CRUD logic for exercises
  const handleSaveGlobalExercise = async (e) => {
    e.preventDefault();
    if (!newExName.trim() || savingExercise) return;

    setSavingExercise(true);

    const payload = {
      id: editingExId || undefined,
      name: newExName.trim(),
      desc: newExDesc.trim(),
      burnRate: Number(newExBurnRate) || 10,
      defaultDuration: Number(newExDuration) || 60,
      icon: newExIcon || '🔥',
      color: newExColor || '#8b5cf6',
      videoUrl: newExVideoUrl.trim(),
      userId: user.id || user.telegramId
    };

    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setExerciseLibrary(data.exercises || []);
        setShowAddExModal(false);
        resetExForm();
      } else {
        alert(lang === 'uz' ? "Xatolik yuz berdi. Faqat adminlar mashqlarni qo‘sha oladi." : "Произошла ошибка. Добавлять могут только админы.");
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'uz' ? "Aloqa xatosi yuz berdi." : "Ошибка связи.");
    } finally {
      setSavingExercise(false);
    }
  };

  const handleDeleteGlobalExercise = async (id) => {
    if (!confirm(lang === 'uz' ? "Ushbu mashqni o‘chirishni xohlaysizmi?" : "Удалить это упражнение?")) return;

    try {
      const res = await fetch(`/api/exercises/${id}?userId=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setExerciseLibrary(data.exercises || []);
      } else {
        alert("Ruxsat yo‘q.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetExForm = () => {
    setEditingExId(null);
    setNewExName('');
    setNewExDesc('');
    setNewExBurnRate(10);
    setNewExDuration(60);
    setNewExIcon('🔥');
    setNewExColor('#8b5cf6');
    setNewExVideoUrl('');
    setVideoInputType('link');
  };

  const openEditExForm = (ex) => {
    setEditingExId(ex.id);
    setNewExName(ex.name);
    setNewExDesc(ex.desc || '');
    setNewExBurnRate(ex.burnRate);
    setNewExDuration(ex.defaultDuration);
    setNewExIcon(ex.icon || '🔥');
    setNewExColor(ex.color || '#8b5cf6');
    setNewExVideoUrl(ex.videoUrl || '');
    
    // Determine type based on prefix
    if (ex.videoUrl && ex.videoUrl.startsWith('data:video/')) {
      setVideoInputType('upload');
    } else {
      setVideoInputType('link');
    }
    
    setShowAddExModal(true);
  };

  const netCalories = Math.max(0, todayLog.consumed - todayLog.burned);
  const targetKcal = 2000;
  const progressPercent = Math.min(100, Math.round((netCalories / targetKcal) * 100));

  return (
    <div style={{ paddingBottom: '30px' }}>
      <div className="animate-fade-in">
      
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontStyle: 'normal', fontWeight: '850', color: 'var(--text-primary)' }}>
          {lang === 'uz' ? 'Sport & Kaloriya' : 'Спорт и Калории'}
        </h1>
        <button 
          type="button"
          className="btn"
          style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '10px', fontSize: '11.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => {
            if (confirm(lang === 'uz' ? 'Bugungi barcha qaydlarni o\'chirmoqchimisiz?' : 'Сбросить сегодняшние логи?')) {
              onResetCalorie(todayStr);
            }
          }}
        >
          <RefreshCw size={13} /> {lang === 'uz' ? 'Tozalash' : 'Сбросить'}
        </button>
      </div>

      {/* DYNAMIC NET CALORIE METER */}
      <div className="glass-card" style={{ padding: '18px', marginBottom: '22px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'uz' ? 'Kunlik Balans' : 'Дневной Баланс'}
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
              {netCalories} <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>kcal</span>
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>
              {lang === 'uz' ? 'Maqsad: 2000 kcal' : 'Цель: 2000 ккал'}
            </span>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #10b981 0%, var(--primary) 100%)', transition: 'width 0.4s ease' }} />
        </div>

        {/* Micro statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '14px' }}>🍏</div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700' }}>{lang === 'uz' ? 'Qabul qilindi' : 'Получено'}</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>+{todayLog.consumed} kcal</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '14px' }}>🔥</div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700' }}>{lang === 'uz' ? 'Sarflandi' : 'Сожжено'}</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>-{todayLog.burned} kcal</div>
            </div>
          </div>
        </div>
      </div>

      {/* CAPSULE TAB SWITCHER (2-Tab Flow - Enlarged and Beautified) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        background: 'var(--surface-color)', 
        border: '1.5px solid var(--surface-border)', 
        borderRadius: '20px', 
        padding: '5px', 
        gap: '6px',
        marginBottom: '22px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
      }}>
        <button 
          type="button"
          style={{ 
            padding: '12px 10px', 
            borderRadius: '16px', 
            border: 'none', 
            background: activeMode === 'food' ? 'var(--primary-gradient)' : 'transparent',
            color: activeMode === 'food' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '900',
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeMode === 'food' ? '0 4px 15px rgba(124, 58, 237, 0.25)' : 'none'
          }}
          onClick={() => {
            setActiveMode('food');
            if (triggerHaptic) triggerHaptic('selection');
          }}
        >
          <span style={{ fontSize: '16px' }}>📸</span> {lang === 'uz' ? 'Taom Skaneri' : 'Сканнер Еды'}
        </button>
        <button 
          type="button"
          style={{ 
            padding: '12px 10px', 
            borderRadius: '16px', 
            border: 'none', 
            background: activeMode === 'workouts' ? 'var(--primary-gradient)' : 'transparent',
            color: activeMode === 'workouts' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '900',
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeMode === 'workouts' ? '0 4px 15px rgba(124, 58, 237, 0.25)' : 'none'
          }}
          onClick={() => {
            setActiveMode('workouts');
            if (triggerHaptic) triggerHaptic('selection');
          }}
        >
          <span style={{ fontSize: '16px' }}>🔥</span> {lang === 'uz' ? 'Ozish & Mashq' : 'Жиросжигание'}
        </button>
        <button 
          type="button"
          style={{ 
            padding: '12px 10px', 
            borderRadius: '16px', 
            border: 'none', 
            background: activeMode === 'water' ? 'var(--primary-gradient)' : 'transparent',
            color: activeMode === 'water' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '900',
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeMode === 'water' ? '0 4px 15px rgba(124, 58, 237, 0.25)' : 'none'
          }}
          onClick={() => {
            setActiveMode('water');
            if (triggerHaptic) triggerHaptic('selection');
          }}
        >
          <span style={{ fontSize: '16px' }}>💧</span> {lang === 'uz' ? 'Suv Balansi' : 'Водный Баланс'}
        </button>
        <button 
          type="button"
          style={{ 
            padding: '12px 10px', 
            borderRadius: '16px', 
            border: 'none', 
            background: activeMode === 'weight' ? 'var(--primary-gradient)' : 'transparent',
            color: activeMode === 'weight' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '900',
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeMode === 'weight' ? '0 4px 15px rgba(124, 58, 237, 0.25)' : 'none'
          }}
          onClick={() => {
            setActiveMode('weight');
            if (triggerHaptic) triggerHaptic('selection');
          }}
        >
          <span style={{ fontSize: '16px' }}>📉</span> {lang === 'uz' ? 'Vazn Grafigi' : 'Вес и Тренд'}
        </button>
      </div>

      {/* MODE 1: TAOM SCANNER */}
      {activeMode === 'food' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SCANNING WORKSPACE WITH LASER ANIMATION */}
          <div className="glass-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', justify: 'center', gap: '6px' }}>
              <Camera size={15} color="var(--primary)" /> {lang === 'uz' ? 'AI Rasm Kaloriya Skaneri' : 'AI Foto Сканнер Калорий'}
            </h3>

            {/* Viewfinder block */}
            <div 
              style={{ 
                width: '100%', 
                height: '180px', 
                borderRadius: '14px', 
                border: '2px dashed var(--primary)', 
                background: '#090514', 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '14px',
                transition: 'border-color 0.2s'
              }}
            >
              {/* Fallback inputs */}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={cameraInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
              <input 
                type="file" 
                accept="image/*" 
                ref={galleryInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />

              {showCameraFeed ? (
                /* LIVE WEBRTC CAMERA ELEMENT OVERLAY */
                <div style={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, zIndex: 10 }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  
                  {/* Torch/Flashlight Toggle Control */}
                  {hasFlashlight && (
                    <button
                      type="button"
                      onClick={toggleFlashlight}
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        left: '10px', 
                        background: flashlightOn ? 'var(--primary)' : 'rgba(0,0,0,0.5)', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        cursor: 'pointer',
                        boxShadow: flashlightOn ? '0 0 10px var(--primary)' : 'none',
                        zIndex: 15
                      }}
                      title={lang === 'uz' ? 'Fonarni yoqish' : 'Включить фонарик'}
                    >
                      <Zap size={16} fill={flashlightOn ? "white" : "none"} />
                    </button>
                  )}

                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justify: 'center', color: 'white', cursor: 'pointer', zIndex: 15 }}
                  >
                    <X size={16} />
                  </button>

                  {/* Shutter capture button overlay */}
                  <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 15 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={capturePhoto}
                      style={{ padding: '8px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
                    >
                      📸 {lang === 'uz' ? 'Suratga olish' : 'Сделать фото'}
                    </button>
                  </div>
                </div>
              ) : scanning ? (
                <>
                  {/* Selected image background */}
                  {uploadedImgUrl && (
                    <img 
                      src={uploadedImgUrl} 
                      style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} 
                      alt="" 
                    />
                  )}

                  {/* Glowing Laser Scan Bar */}
                  <div style={{ 
                    position: 'absolute', 
                    width: '100%', 
                    height: '3px', 
                    background: '#10b981', 
                    boxShadow: '0 0 15px #10b981, 0 0 25px #10b981',
                    animation: 'scanLaser 1.5s infinite ease-in-out',
                    zIndex: 2
                  }} />
                  
                  <div style={{ fontSize: '40px', animation: 'pulse 1s infinite', zIndex: 1 }}>🍲</div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px', zIndex: 1 }}>
                    Scanning Food...
                  </span>
                </>
              ) : showScanOptions ? (
                /* SMART OFFLINE AI OPTION PICKER GRID */
                <div style={{ padding: '12px 10px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justify: 'center', zIndex: 10, background: 'rgba(9,5,20,0.96)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '850', color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                    🎯 {lang === 'uz' ? 'AI Aniqlagan Mosliklar:' : 'Совпадения AI:'}
                  </span>

                  {/* Interaktiv qidiruv paneli */}
                  <input
                    type="text"
                    placeholder={lang === 'uz' ? "Taomlarni qidirish..." : "Поиск блюд..."}
                    value={scanSearchQuery}
                    onChange={(e) => {
                      e.stopPropagation();
                      setScanSearchQuery(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'white',
                      fontSize: '11px',
                      marginBottom: '8px',
                      outline: 'none'
                    }}
                  />
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '6px', 
                    maxHeight: '100px', 
                    overflowY: 'auto',
                    paddingRight: '2px'
                  }}>
                    {scanOptionsDatabase
                      .filter(opt => opt.label.toLowerCase().includes(scanSearchQuery.toLowerCase()))
                      .map((option, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectScanOption(option);
                            setScanSearchQuery(''); // reset query
                          }}
                          style={{ 
                            padding: '6px 8px', 
                            borderRadius: '8px', 
                            fontSize: '10px', 
                            fontWeight: '800',
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: option.isEdible ? '#f5f3ff' : '#fbbf24',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                  </div>
                </div>
              ) : scannedResult ? (
                <div style={{ padding: '12px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justify: 'center', alignItems: 'center', position: 'relative' }}>
                  {scannedResult.image && (
                    <img 
                      src={scannedResult.image} 
                      style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, left: 0, top: 0 }} 
                      alt="" 
                    />
                  )}
                  
                  {scannedResult.isEdible === false ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                      <AlertTriangle size={32} color="#fbbf24" style={{ marginBottom: '6px' }} />
                      <h4 style={{ fontSize: '14px', fontWeight: '850', color: '#fbbf24', margin: '0 0 4px 0' }}>{scannedResult.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 10px 0', fontWeight: '600' }}>
                        {lang === 'uz' ? 'Bu ozuqa mahsuloti emas! 😅' : 'Этот предмет не съедобен! 😅'}
                      </p>
                      <button 
                        type="button" 
                        className="btn"
                        style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '750', background: 'rgba(255,255,255,0.06)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setScannedResult(null);
                        }}
                      >
                        {lang === 'uz' ? 'Yopish' : 'Закрыть'}
                      </button>
                    </div>
                  ) : (
                    /* Edible Food result panel */
                    <>
                      <div style={{ fontSize: '32px', zIndex: 1 }}>🍽️</div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', margin: '6px 0', zIndex: 1 }}>{scannedResult.name}</h4>
                      <div style={{ display: 'flex', justify: 'center', gap: '8px', flexWrap: 'wrap', margin: '8px 0', zIndex: 1 }}>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>🥗 {scannedResult.kcal} kcal</span>
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>🥩 P: {scannedResult.protein}g</span>
                        <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>🍞 C: {scannedResult.carbs}g</span>
                        <span style={{ fontSize: '10px', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>🧀 F: {scannedResult.fats}g</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', zIndex: 1 }}>
                        <button 
                          type="button" 
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogFood();
                          }}
                        >
                          <Check size={14} /> {lang === 'uz' ? 'Qayd etish' : 'Записать'}
                        </button>
                        <button 
                          type="button" 
                          className="btn"
                          style={{ padding: '8px 10px', borderRadius: '10px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setScannedResult(null);
                          }}
                        >
                          {lang === 'uz' ? 'O‘chirish' : 'Отмена'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontSize: '42px', color: 'var(--primary)', animation: 'float 3s infinite ease-in-out' }}>📸</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '0', padding: '0 20px', fontWeight: '850' }}>
                    {lang === 'uz' ? 'Taom rasmini yuklang' : 'Загрузите фото еды'}
                  </p>
                  
                  {/* Two separate interactive paths: Live Video capture vs Gallery choice */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px', zIndex: 5 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        startLiveCamera();
                      }}
                      style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                    >
                      📸 {lang === 'uz' ? 'Kamera' : 'Камера'}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        galleryInputRef.current.click();
                      }}
                      style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--surface-border)', fontWeight: 'bold' }}
                    >
                      🖼️ {lang === 'uz' ? 'Galereya' : 'Галерея'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom laser CSS animation */}
            <style>{`
              @keyframes scanLaser {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}</style>

            {/* Food Presets Grid */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
              {presetFoods.map((food, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    flexShrink: 0, 
                    width: '80px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--surface-border)', 
                    borderRadius: '12px', 
                    padding: '8px', 
                    cursor: 'pointer',
                    transition: 'transform 0.1s' 
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const translatedFood = {
                      name: food.name,
                      kcal: food.kcal,
                      protein: food.protein,
                      carbs: food.carbs,
                      fats: food.fats,
                      image: food.image,
                      isEdible: true
                    };
                    handleScan(translatedFood);
                  }}
                  className="habit-card"
                >
                  <img src={food.image} style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', objectFit: 'cover', marginBottom: '6px' }} alt="" />
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {food.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MANUAL INPUT FORM */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} color="var(--primary)" /> {lang === 'uz' ? 'Qo\'lda kiritish' : 'Ввести вручную'}
            </h3>
            
            <form onSubmit={handleLogCustomFood} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder={lang === 'uz' ? 'Taom nomi' : 'Название'}
                  value={customFoodName}
                  onChange={(e) => setCustomFoodName(e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px', padding: '10px' }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="number" 
                  className="form-control"
                  placeholder="kcal"
                  value={customFoodKcal}
                  onChange={(e) => setCustomFoodKcal(e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px', padding: '10px' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px', borderRadius: '12px' }}>
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>
      )}



      {/* MODE 3: OZDIRUVCHI MASHQLAR LIBRARY & LIVE TIMER COUNTER */}
      {activeMode === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔥 {lang === 'uz' ? 'Yog‘ Erituvchi / Ozdiruvchi Mashqlar' : 'Жиросжигающие Упражнения'}
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0', fontWeight: '600' }}>
                  {lang === 'uz' ? 'Uy sharoitida yog‘ eritish va mashq videolarini tomosha qilish.' : 'Сжигание жира дома и просмотр видео-инструкций.'}
                </p>
              </div>

              {/* Admin Button to Add Custom Exercises */}
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    resetExForm();
                    setShowAddExModal(true);
                  }}
                  style={{ padding: '6px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={13} /> {lang === 'uz' ? 'Mashq qo‘shish' : 'Добавить'}
                </button>
              )}
            </div>

            {loadingExercises ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {exerciseLibrary.map((exercise) => (
                  <div 
                    key={exercise.id}
                    className="glass-card"
                    style={{ 
                      padding: '14px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderLeft: `4px solid ${exercise.color || '#8b5cf6'}` 
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '18px' }}>{exercise.icon || '🔥'}</span>
                        <h4 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', margin: 0 }}>
                          {exercise.name}
                        </h4>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.3', fontWeight: '500' }}>
                        {exercise.desc}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9.5px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontWeight: '750' }}>
                          🔥 {exercise.burnRate} kcal / min
                        </span>
                        {exercise.videoUrl && (
                          <span style={{ fontSize: '9.5px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '6px', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            📹 Video yuklangan
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleStartWorkoutSetup(exercise)}
                        style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        ⚡ {lang === 'uz' ? 'Boshlash' : 'Начать'}
                      </button>

                      {/* Admin Edit/Delete Options */}
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => openEditExForm(exercise)}
                            style={{ padding: '4px 6px', fontSize: '9px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleDeleteGlobalExercise(exercise.id)}
                            style={{ padding: '4px 6px', fontSize: '9px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '6px' }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      </div> {/* close animate-fade-in containing block */}

      {/* ADMIN ADD/EDIT EXERCISE DIALOG MODAL */}
      {showAddExModal && (
        <div className="modal-overlay active" style={{ zIndex: 150 }}>
          <div className="modal-content glass-card" style={{ padding: '20px', maxWidth: '360px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '850', margin: 0 }}>
                {editingExId ? (lang === 'uz' ? 'Mashqni Tahrirlash' : 'Редактировать') : (lang === 'uz' ? 'Yangi Mashq qo‘shish' : 'Добавить упражнение')}
              </h3>
              <button
                type="button"
                className="btn"
                style={{ padding: '4px', background: 'none', border: 'none' }}
                onClick={() => {
                  setShowAddExModal(false);
                  resetExForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGlobalExercise} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: '750', color: 'var(--text-secondary)' }}>{lang === 'uz' ? 'Mashq nomi' : 'Название'}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Masalan: Sakrashlar, Burpi..."
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  required
                  style={{ padding: '8px', fontSize: '12.5px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: '750', color: 'var(--text-secondary)' }}>{lang === 'uz' ? 'Mashq tavsifi' : 'Описание'}</label>
                <textarea
                  className="form-control"
                  placeholder="Ushbu mashq qanday bajariladi..."
                  value={newExDesc}
                  onChange={(e) => setNewExDesc(e.target.value)}
                  style={{ padding: '8px', fontSize: '12.5px', height: '50px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: 'var(--text-secondary)' }}>{lang === 'uz' ? 'Kkal/min' : 'Ккал в мин'}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newExBurnRate}
                    onChange={(e) => setNewExBurnRate(Number(e.target.value))}
                    required
                    style={{ padding: '8px', fontSize: '12.5px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: '750', color: 'var(--text-secondary)' }}>{lang === 'uz' ? 'Vaqt (soniya)' : 'Время (сек)'}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newExDuration}
                    onChange={(e) => setNewExDuration(Number(e.target.value))}
                    required
                    style={{ padding: '8px', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '750', color: 'var(--text-secondary)' }}>Icon (Emoji)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newExIcon}
                    onChange={(e) => setNewExIcon(e.target.value)}
                    style={{ padding: '8px', fontSize: '12.5px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '750', color: 'var(--text-secondary)' }}>{lang === 'uz' ? 'Rang' : 'Цвет'}</label>
                  <select
                    className="form-control"
                    value={newExColor}
                    onChange={(e) => setNewExColor(e.target.value)}
                    style={{ padding: '8px', fontSize: '12.5px' }}
                  >
                    <option value="#ef4444">Red 🔴</option>
                    <option value="#3b82f6">Blue 🔵</option>
                    <option value="#10b981">Green 🟢</option>
                    <option value="#a78bfa">Purple 🟣</option>
                    <option value="#f59e0b">Yellow 🟡</option>
                  </select>
                </div>
              </div>

              {/* DUAL MODE VIDEO SELECTOR: LINK OR UPLOAD */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-hover)', padding: '3px', borderRadius: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setVideoInputType('link');
                    setNewExVideoUrl('');
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '6px', 
                    fontSize: '11px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    background: videoInputType === 'link' ? 'var(--primary)' : 'transparent',
                    color: '#ffffff',
                    fontWeight: '800'
                  }}
                >
                  🔗 Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideoInputType('upload');
                    setNewExVideoUrl('');
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '6px', 
                    fontSize: '11px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    background: videoInputType === 'upload' ? 'var(--primary)' : 'transparent',
                    color: '#ffffff',
                    fontWeight: '800'
                  }}
                >
                  📁 Video Yuklash
                </button>
              </div>

              {videoInputType === 'link' ? (
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '750', color: 'var(--text-secondary)' }}>
                    {lang === 'uz' ? 'Video havolasi (YouTube / MP4 / Web)' : 'Ссылка на видео'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newExVideoUrl}
                    onChange={(e) => setNewExVideoUrl(e.target.value)}
                    style={{ padding: '8px', fontSize: '11.5px' }}
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '750', color: 'var(--text-secondary)' }}>
                    {lang === 'uz' ? 'Video fayl tanlash (Maks 8MB)' : 'Выбрать видео файл (Макс 8МБ)'}
                  </label>
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/*"
                    onChange={handleVideoFileRead}
                    className="form-control"
                    style={{ padding: '6px', fontSize: '11px' }}
                  />
                  {uploadingVideo && (
                    <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '750', marginTop: '2px', display: 'block' }}>
                      Yuklanmoqda... ⏳
                    </span>
                  )}
                  {newExVideoUrl && !uploadingVideo && (
                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '750', marginTop: '2px', display: 'block' }}>
                      Video muvaffaqiyatli yuklandi! ✅
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={savingExercise || uploadingVideo}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12.5px', marginTop: '6px', opacity: (savingExercise || uploadingVideo) ? 0.6 : 1 }}
              >
                {savingExercise ? (lang === 'uz' ? 'Saqlanmoqda... ⏳' : 'Сохранение... ⏳') : (lang === 'uz' ? '💾 Mashqni Saqlash' : '💾 Сохранить')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WORKOUT SETUP DIALOG MODAL */}
      {selectedLibraryExercise && (
        <div className="modal-overlay active" style={{ zIndex: 100 }}>
          <div className="modal-content glass-card" style={{ padding: '22px', maxWidth: '350px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '36px' }}>{selectedLibraryExercise.icon}</span>
              <h3 style={{ fontSize: '16px', fontWeight: '850', margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>
                {selectedLibraryExercise.name}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
                {selectedLibraryExercise.desc}
              </p>
            </div>

            {/* Duration Quick selectors */}
            <div className="form-group">
              <label style={{ fontSize: '11.5px', fontWeight: '750', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textAlign: 'center' }}>
                {lang === 'uz' ? 'Mashq Davomiyligi' : 'Длительность упражнения'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[30, 60, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    className="btn"
                    onClick={() => {
                      setTimerSeconds(sec);
                      setInitialDuration(sec);
                    }}
                    style={{ 
                      padding: '8px 4px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontWeight: '800',
                      background: initialDuration === sec ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                      color: '#ffffff',
                      border: initialDuration === sec ? 'none' : '1px solid var(--surface-border)'
                    }}
                  >
                    {sec} {lang === 'uz' ? 'soniya' : 'сек'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={startWorkoutSession}
                style={{ flex: 2, padding: '10px', borderRadius: '12px', fontWeight: '800', fontSize: '12.5px', display: 'flex', alignItems: 'center', justify: 'center', gap: '4px' }}
              >
                <Play size={14} fill="white" /> {lang === 'uz' ? 'Taymerni Yoqish' : 'Запустить'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setSelectedLibraryExercise(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)', fontSize: '12.5px' }}
              >
                {lang === 'uz' ? 'Yopish' : 'Отмена'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE WORKOUT SESSION WITH STOPWATCH TIMER OVERLAY & VIDEO PLAYER */}
      {activeWorkoutSession && (
        <div className="modal-overlay active" style={{ zIndex: 110 }}>
          <div className="modal-content glass-card" style={{ padding: '20px', maxWidth: '360px', width: '92%', textAlign: 'center' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justify: 'center', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>{activeWorkoutSession.icon}</span>
              <h3 style={{ fontSize: '15px', fontWeight: '850', margin: 0, color: 'var(--text-primary)' }}>
                {activeWorkoutSession.name}
              </h3>
            </div>

            {/* INTERACTIVE VIDEO EMBED IN STOPWATCH SCREEN - ENHANCED DIMENSIONS WITHOUT CROPPING */}
            {activeWorkoutSession.videoUrl && (
              <div style={{ width: '100%', marginBottom: '12px' }}>
                {getYoutubeEmbedUrl(activeWorkoutSession.videoUrl) ? (
                  <iframe
                    width="100%"
                    style={{ aspectRatio: '16/9', borderRadius: '10px', border: 'none' }}
                    src={getYoutubeEmbedUrl(activeWorkoutSession.videoUrl)}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : isDirectVideoLink(activeWorkoutSession.videoUrl) ? (
                  <video 
                    src={activeWorkoutSession.videoUrl} 
                    controls 
                    playsInline 
                    style={{ width: '100%', height: 'auto', maxHeight: '200px', borderRadius: '10px', objectFit: 'contain', background: '#000000' }} 
                  />
                ) : (
                  <a 
                    href={activeWorkoutSession.videoUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      fontSize: '11.5px', 
                      color: 'var(--primary)', 
                      textDecoration: 'underline', 
                      display: 'block', 
                      padding: '8px', 
                      background: 'rgba(255,255,255,0.03)', 
                      borderRadius: '8px', 
                      fontWeight: '800' 
                    }}
                  >
                    📹 {lang === 'uz' ? 'Mashq videosini ochish (Havola)' : 'Открыть видео упражнения (Ссылка)'}
                  </a>
                )}
              </div>
            )}

            {/* Giant digital stopwatch countdown clock */}
            <div style={{ margin: '14px 0' }}>
              <div 
                style={{ 
                  width: '110px', 
                  height: '110px', 
                  borderRadius: '50%', 
                  border: '4px solid var(--primary)', 
                  boxShadow: '0 0 18px var(--primary-glow)',
                  margin: '0 auto', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#090514',
                  position: 'relative'
                }}
              >
                {/* Visual pulse for final countdown */}
                {timerSeconds <= 5 && timerSeconds > 0 && (
                  <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', animation: 'ping 1s infinite' }} />
                )}
                
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {workoutComplete ? (lang === 'uz' ? 'TUGADI!' : 'ГОТОВО!') : (lang === 'uz' ? 'KUTING' : 'ОСТАЛОСЬ')}
                </span>
                
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: timerSeconds <= 5 ? '#ef4444' : 'var(--text-primary)', margin: '2px 0 0 0', fontFamily: 'monospace' }}>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </h2>
              </div>
            </div>

            {/* Calories currently burned preview */}
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: '700' }}>
                {lang === 'uz' ? 'Eritilgan kaloriya (Hozirgi):' : 'Сожжено калорий (Текущее):'}
              </span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#f97316' }}>
                {Math.round((activeWorkoutSession.burnRate / 60) * elapsedSeconds)} <span style={{ fontSize: '12px', fontWeight: '700' }}>kcal</span>
              </span>
            </div>

            {/* Timer controls */}
            {!workoutComplete ? (
              <div style={{ display: 'flex', justify: 'center', gap: '12px' }}>
                {timerRunning ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={pauseWorkoutSession}
                    style={{ padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Pause size={14} /> {lang === 'uz' ? 'Tanaffus' : 'Пауза'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={resumeWorkoutSession}
                    style={{ padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Play size={14} fill="white" /> {lang === 'uz' ? 'Davom etish' : 'Продолжить'}
                  </button>
                )}

                <button
                  type="button"
                  className="btn"
                  onClick={stopWorkoutSession}
                  style={{ padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Square size={12} fill="#ef4444" /> {lang === 'uz' ? 'Tugatish' : 'Стоп'}
                </button>
              </div>
            ) : (
              /* Success Complete Save Panel */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.3s' }}>
                <div style={{ color: '#10b981', display: 'flex', justify: 'center', alignItems: 'center', gap: '6px', fontWeight: '850', fontSize: '13.5px' }}>
                  <CheckCircle size={18} /> {lang === 'uz' ? 'Mashq muvaffaqiyatli bajarildi!' : 'Упражнение успешно завершено!'}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={logWorkoutSession}
                    style={{ flex: 1, padding: '11px', borderRadius: '12px', fontWeight: '800', fontSize: '12px' }}
                  >
                    💾 {lang === 'uz' ? 'Kundalikka yozish' : 'Записать в дневник'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setActiveWorkoutSession(null);
                      setWorkoutComplete(false);
                      setElapsedSeconds(0);
                    }}
                    style={{ padding: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--surface-border)', fontSize: '12px' }}
                  >
                    {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODE 3: NEON WATER TRACKER */}
      {activeMode === 'water' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              💧 {lang === 'uz' ? 'Kunlik Suv Balansi' : 'Водный Баланс'}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {lang === 'uz' ? 'Sog\'lom hayot uchun kuniga kamida 2 litr suv iching.' : 'Для здоровья пейте не менее 2 литров воды в день.'}
            </p>

            {/* Glowing Neon Water Cup Animation */}
            {(() => {
              const currentWater = user.waterLogs?.[todayStr] || 0;
              const targetWater = 2000; // 2L
              const percent = Math.min(100, Math.round((currentWater / targetWater) * 100));
              
              return (
                <>
                  <div style={{
                    position: 'relative',
                    width: '120px',
                    height: '160px',
                    border: '4px solid rgba(14, 165, 233, 0.4)',
                    borderTop: 'none',
                    borderRadius: '0 0 20px 20px',
                    background: 'rgba(14, 165, 233, 0.03)',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(14, 165, 233, 0.05)',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'flex-end'
                  }}>
                    {/* Water Level Fill with wave micro-animation */}
                    <div style={{
                      width: '100%',
                      height: `${percent}%`,
                      background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                      borderRadius: '0 0 16px 16px',
                      transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                      position: 'relative'
                    }}>
                      {/* Water reflection bubble */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '10%',
                        width: '80%',
                        height: '6px',
                        background: 'rgba(255,255,255,0.25)',
                        borderRadius: '3px'
                      }} />
                    </div>

                    {/* Percentage/Total Label inside the glass */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ fontSize: '20px', fontWeight: '900', color: percent > 50 ? 'white' : 'var(--text-primary)', textShadow: percent > 50 ? '0 1px 3px rgba(0,0,0,0.15)' : 'none' }}>
                        {percent}%
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: percent > 50 ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '2px' }}>
                        {currentWater} / {targetWater} ml
                      </span>
                    </div>
                  </div>

                  {/* Quick Log Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '280px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onUpdateWaterIntake(250)}
                      style={{ padding: '11px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', boxShadow: '0 4px 10px rgba(56, 189, 248, 0.2)' }}
                    >
                      🥛 +250 ml ({lang === 'uz' ? 'Stakan' : 'Стакан'})
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onUpdateWaterIntake(500)}
                      style={{ padding: '11px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.25)' }}
                    >
                      🍼 +500 ml ({lang === 'uz' ? 'Shisha' : 'Бутылка'})
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (confirm(lang === 'uz' ? "Bugungi suv miqdorini tozalashni xohlaysizmi?" : "Сбросить сегодняшний прогресс воды?")) {
                        onUpdateWaterIntake(0);
                        if (triggerHaptic) triggerHaptic('warning');
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '6px'
                    }}
                  >
                    <RefreshCw size={11} /> {lang === 'uz' ? 'Qayta tiklash' : 'Сбросить'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODE 4: WEIGHT PROGRESS CHART */}
      {activeMode === 'weight' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Weight entry card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📉 {lang === 'uz' ? 'Vazningizni Qayd Eting' : 'Контроль Веса'}
            </h3>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const val = parseFloat(customWeight);
                if (val > 0) {
                  onUpdateWeight(val);
                  setCustomWeight('');
                }
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input 
                type="number" 
                step="0.1"
                className="form-control"
                style={{ flex: 1, padding: '11px 12px', borderRadius: '12px' }}
                placeholder={lang === 'uz' ? "Masalan: 72.5 (kg)" : "Пример: 72.5 (кг)"}
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '11px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '12px' }}
              >
                {lang === 'uz' ? 'Saqlash' : 'Сохранить'}
              </button>
            </form>
          </div>

          {/* SVG Weight Line Chart */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
              📊 {lang === 'uz' ? 'Vazn Trend Grafigi' : 'График Изменения Веса'}
            </h3>

            {(() => {
              const weightLogs = user.weightLogs || {};
              const sortedDates = Object.keys(weightLogs).sort();
              
              if (sortedDates.length === 0) {
                return (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', margin: '20px 0' }}>
                    {lang === 'uz' ? 'Vazn grafigi shakllanishi uchun kamida bitta vazn kiriting.' : 'Введите вес, чтобы построить график.'}
                  </p>
                );
              }

              const values = sortedDates.map(d => weightLogs[d]);
              const minWeight = Math.min(...values) - 2;
              const maxWeight = Math.max(...values) + 2;
              const weightRange = maxWeight - minWeight || 4;

              // Generate SVG path coordinates
              const chartWidth = 280;
              const chartHeight = 120;
              const padding = 15;
              
              const points = sortedDates.map((date, idx) => {
                const x = padding + (idx / Math.max(1, sortedDates.length - 1)) * (chartWidth - 2 * padding);
                const y = chartHeight - padding - ((weightLogs[date] - minWeight) / weightRange) * (chartHeight - 2 * padding);
                return { x, y, date, val: weightLogs[date] };
              });

              let pathD = '';
              if (points.length > 0) {
                pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* SVG Line Chart */}
                  <svg width="100%" height={chartHeight} style={{ overflow: 'visible', marginBottom: '12px' }} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* Horizontal helper lines */}
                    {[0, 0.5, 1].map((r, i) => {
                      const y = padding + r * (chartHeight - 2 * padding);
                      const wVal = Math.round(maxWeight - r * weightRange);
                      return (
                        <g key={`helper-${i}`}>
                          <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="var(--surface-border)" strokeWidth="0.5" strokeDasharray="3 3" />
                          <text x={chartWidth - padding + 4} y={y + 3} fill="var(--text-secondary)" fontSize="7.5" fontWeight="700">{wVal} kg</text>
                        </g>
                      );
                    })}

                    {/* Chart path line */}
                    {points.length > 1 && (
                      <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 6px rgba(124, 58, 237, 0.25))' }} />
                    )}

                    {/* Point dots */}
                    {points.map((p, i) => (
                      <g key={`dot-${i}`}>
                        <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="var(--primary)" strokeWidth="2" />
                        {/* Display weight value on top of the dot */}
                        <text x={p.x} y={p.y - 6} fill="var(--text-primary)" fontSize="7.5" fontWeight="900" textAnchor="middle">{p.val} kg</text>
                        
                        {/* Date label at the bottom */}
                        <text x={p.x} y={chartHeight - 2} fill="var(--text-secondary)" fontSize="6" fontWeight="750" textAnchor="middle">
                          {p.date.substring(5)}
                        </text>
                      </g>
                    ))}
                  </svg>
                  
                  {/* Summary */}
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', gap: '15px' }}>
                    <span>📉 Min: <b>{Math.min(...values)} kg</b></span>
                    <span>📈 Max: <b>{Math.max(...values)} kg</b></span>
                    <span>🔄 {lang === 'uz' ? 'So\'nggi' : 'Последний'}: <b>{values[values.length - 1]} kg</b></span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TODAY'S CALORIE HISTORY LOG ITEMS */}
      {(activeMode === 'food' || activeMode === 'workouts') && (
        <div style={{ marginTop: '22px' }}>
        <h3 style={{ fontSize: '13.5px', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📋 {lang === 'uz' ? 'Bugungi qaydlar ro\'yxati' : 'Сегодняшний Дневник'}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {todayLog.items.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 10px' }}>
              {lang === 'uz' ? 'Bugun hech narsa qayd etilmadi.' : 'Сегодня еще нет записей.'}
            </p>
          ) : (
            todayLog.items.map((item) => (
              <div 
                key={item.id}
                className="glass-card"
                style={{ 
                  padding: '10px 12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderLeft: `3px solid ${item.type === 'food' ? '#10b981' : '#f97316'}`
                }}
              >
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {item.name}
                  </h4>
                  {item.type === 'food' && (
                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                      P: {item.protein}g | C: {item.carbs}g | F: {item.fats}g
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: item.type === 'food' ? '#10b981' : '#f97316' }}>
                    {item.type === 'food' ? '+' : '-'}{item.calories} kcal
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(lang === 'uz' ? "Ushbu qaydni o‘chirishni xohlaysizmi?" : "Удалить эту запись?")) {
                        onDeleteCalorie(todayStr, item.id);
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      padding: '5px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

    </div>
  );
}
