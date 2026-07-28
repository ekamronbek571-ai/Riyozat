import React, { useState } from 'react';
import { Plus, Trash2, Wallet, Check, Sparkles, Filter, PieChart, Info, Mic, X } from 'lucide-react';

export default function Finance({ user, onAddTransaction, onDeleteTransaction, onAddCard, onDeleteCard, onUpdateCard, t, isMockMode, triggerHaptic }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [txType, setTxType] = useState('expense'); // income, expense, lend, borrow
  const [category, setCategory] = useState('general');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Active filter tab state: all, expense, income, loan
  const [filterTab, setFilterTab] = useState('all');
  const [showHistory, setShowHistory] = useState(false);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  
  // Report sending states
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Card Modal state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardBalance, setCardBalance] = useState('');
  const [cardType, setCardType] = useState('uzcard');
  const [cardNumber, setCardNumber] = useState('');
  const [cardColor, setCardColor] = useState('purple');

  // Edit Card Modal state
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState('');
  const [editCardName, setEditCardName] = useState('');
  const [editCardBalance, setEditCardBalance] = useState('');
  const [editCardType, setEditCardType] = useState('uzcard');
  const [editCardNumber, setEditCardNumber] = useState('');
  const [editCardColor, setEditCardColor] = useState('purple');

  const handleEditCardClick = (card) => {
    setEditingCardId(card.id);
    setEditCardName(card.name);
    setEditCardBalance(card.balance.toString());
    setEditCardType(card.type);
    setEditCardNumber(card.cardNumber || '');
    setEditCardColor(card.color || 'purple');
    setShowEditCardModal(true);
  };

  const handleEditCardSubmit = (e) => {
    e.preventDefault();
    if (!editCardName.trim()) return;
    onUpdateCard(editingCardId, {
      name: editCardName.trim(),
      balance: parseFloat(editCardBalance) || 0,
      type: editCardType,
      cardNumber: editCardNumber.trim(),
      color: editCardColor
    });
    setShowEditCardModal(false);
  };

  const transactions = user.transactions || [];
  const cards = user.cards || [];

  // Default selected card logic
  React.useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      // Default to Naqd hamyon or first card
      const defaultCard = cards.find(c => c.id === 'card-1') || cards[0];
      setSelectedCardId(defaultCard.id);
    }
  }, [cards, selectedCardId]);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLent = transactions
    .filter(t => t.type === 'lend')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBorrowed = transactions
    .filter(t => t.type === 'borrow')
    .reduce((sum, t) => sum + t.amount, 0);

  // Total balance sum of all cards
  const totalCardsBalance = cards.reduce((sum, c) => sum + c.balance, 0);

  // Lending balance = Lent - Borrowed
  const netLending = totalLent - totalBorrowed;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(t('valid_amount_error'));
      return;
    }
    if (!description.trim()) {
      alert(t('valid_desc_error'));
      return;
    }

    onAddTransaction(parsedAmount, description.trim(), txType, category, selectedCardId, isRecurring);
    if (triggerHaptic) triggerHaptic('success');
    setAmount('');
    setDescription('');
    setVoiceText('');
    setIsRecurring(false);
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!cardName.trim()) return;

    onAddCard(cardName.trim(), parseFloat(cardBalance) || 0, cardType, cardNumber.trim(), cardColor);
    
    // Reset Form
    setCardName('');
    setCardBalance('');
    setCardType('uzcard');
    setCardNumber('');
    setCardColor('purple');
    setShowCardModal(false);
  };

  // Format currency helper
  const formatCurrency = (val) => {
    const formatted = val.toLocaleString('uz-UZ');
    return `${formatted} ${t('currency_unit')}`;
  };

  // Category metadata dictionary
  const categories = {
    general: { label: t('cat_general'), emoji: '💼', color: '#8b5cf6' },
    food: { label: t('cat_food'), emoji: '🍏', color: '#10b981' },
    transport: { label: t('cat_transport'), emoji: '🚗', color: '#0ea5e9' },
    salary: { label: t('cat_salary'), emoji: '💰', color: '#f59e0b' },
    home: { label: t('cat_home'), emoji: '🏠', color: '#a78bfa' },
    entertainment: { label: t('cat_entertainment'), emoji: '🎮', color: '#ec4899' },
    gift: { label: t('cat_gift'), emoji: '🎁', color: '#fb7185' },
    loan: { label: t('cat_loan'), emoji: '🤝', color: '#06b6d4' },
    savings: { label: t('savings_pot') || "Jamg'arma", emoji: '🎯', color: '#10b981' }
  };

  // Filter transactions based on selected filterTab
  const filteredTransactions = transactions.filter(tx => {
    if (filterTab === 'all') return true;
    if (filterTab === 'expense') return tx.type === 'expense';
    if (filterTab === 'income') return tx.type === 'income';
    if (filterTab === 'loan') return tx.type === 'lend' || tx.type === 'borrow';
    return true;
  });

  // Calculate expense breakdown by category for progress bar chart
  const getExpenseBreakdown = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return [];

    const group = {};
    expenses.forEach(e => {
      group[e.category] = (group[e.category] || 0) + e.amount;
    });

    return Object.keys(group).map(catKey => {
      const amt = group[catKey];
      const pct = Math.round((amt / totalExpense) * 100);
      return {
        key: catKey,
        amount: amt,
        percentage: pct,
        meta: categories[catKey] || categories['general']
      };
    }).sort((a, b) => b.amount - a.amount);
  };

  const breakdown = getExpenseBreakdown();

  // Natural Language Parser for voice recognition commands
  const parseVoiceCommand = (text) => {
    if (!text) return;
    const cleanText = text.toLowerCase();

    // 1. Extract amount
    const numberMatches = cleanText.match(/\d+[\d\s]*/g);
    let foundAmount = 0;
    if (numberMatches) {
      const cleanedNumbers = numberMatches.map(m => m.replace(/\s/g, ''));
      const parsedNumbers = cleanedNumbers.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      if (parsedNumbers.length > 0) {
        foundAmount = Math.max(...parsedNumbers);
      }
    }

    // 2. Clean description
    let desc = text;
    if (numberMatches) {
      numberMatches.forEach(match => {
        desc = desc.replace(match, '');
      });
    }

    const currencyRegex = /(so'm|som|сум|рублей|руб|долларов|доллар|usd|bucks|суммы|тысяч|ming)/gi;
    desc = desc.replace(currencyRegex, '');
    desc = desc.replace(/\s+/g, ' ').trim();

    if (desc) {
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    } else {
      desc = t('cat_general');
    }

    // 3. Category matching based on keywords
    let detectedCategory = 'general';
    const categoryKeywords = {
      food: /go'sht|gosht|non|ovqat|shashlik|bozor|milka|cola|suv|мясо|продукты|еда|хлеб|курица|food|lunch|dinner|restaurant|groceries|market|burger|pizza/i,
      transport: /taksi|benzin|metan|propan|gaz|avtobus|metro|yo'l|yol|такси|бензин|метро|автобус|проезд|transport|taxi|bus|gas|metro|ticket/i,
      salary: /maosh|oylik|daromad|zarplata|dohod|salary|income|pension|пенсия|зарплата|доход/i,
      home: /arenda|ijara|svet|kommunal|gaz|suv|kvartira|аренда|квартплата|свет|коммунальные|дом|rent|home|utility|electric/i,
      entertainment: /kino|teatr|pubg|oyin|game|kafe|restoran|кино|театр|игра|кафе|ресторан|entertainment|cafe|restaurant|game|movie/i,
      gift: /sovg'a|sovga|hadiya|ehson|sadaka|подарок|gift|charity|donation/i,
      loan: /qarz|dolg|credit|kredit|кредит|долг|loan|lend|borrow/i
    };

    for (const [cat, regex] of Object.entries(categoryKeywords)) {
      if (regex.test(cleanText)) {
        detectedCategory = cat;
        break;
      }
    }

    // 4. Type matching
    let detectedType = 'expense';
    if (/maosh|oylik|daromad|zarplata|dohod|salary|income|kirim/i.test(cleanText)) {
      detectedType = 'income';
    } else if (/berdim|qarz berdim|одолжил|отдал|lent|lend/i.test(cleanText)) {
      detectedType = 'lend';
    } else if (/oldim|qarz oldim|взял|занял|borrowed|borrow/i.test(cleanText)) {
      detectedType = 'borrow';
    }

    // 5. Card voice auto-matching
    if (cards.length > 0) {
      if (/uzcard|uzkard|uz kard|узкард/i.test(cleanText)) {
        const uzcard = cards.find(c => c.type === 'uzcard');
        if (uzcard) setSelectedCardId(uzcard.id);
      } else if (/humo|xumo|хумо/i.test(cleanText)) {
        const humo = cards.find(c => c.type === 'humo');
        if (humo) setSelectedCardId(humo.id);
      } else if (/naqd|cash|hamyon|наличные/i.test(cleanText)) {
        const cash = cards.find(c => c.type === 'cash');
        if (cash) setSelectedCardId(cash.id);
      } else if (/jamgarma|sandiqcha|savings|копилка/i.test(cleanText)) {
        const savings = cards.find(c => c.type === 'savings');
        if (savings) setSelectedCardId(savings.id);
      }
    }

    if (foundAmount > 0) {
      setAmount(foundAmount.toString());
    }
    setDescription(desc);
    setTxType(detectedType);
    setCategory(detectedCategory);
  };

  // Launch browser native SpeechRecognition engine
  const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('voice_not_supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    const lang = user.settings?.language || 'uz';
    recognition.lang = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceText('');
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert(t('voice_mic_blocked'));
      } else {
        alert(t('voice_parse_error'));
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      parseVoiceCommand(transcript);
    };

    recognition.start();
  };

  const handleSendTelegramReport = async () => {
    setReportSending(true);
    try {
      const res = await fetch(`/api/user/${user.id}/send-finance-report`, {
        method: 'POST'
      });
      if (res.ok) {
        setReportSent(true);
        setTimeout(() => setReportSent(false), 3000);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to send report.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Failed to send report.");
    } finally {
      setReportSending(false);
    }
  };

  // Preset Card Gradients
  const cardGradients = {
    purple: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    blue: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    orange: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    black: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)'
  };

  const cardEmojis = {
    uzcard: '💳',
    humo: '💳',
    visa: '💳',
    cash: '💵',
    savings: '🎯'
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '30px' }}>
      
      <style>{`
        @keyframes soundwave {
          0% { height: 6px; }
          100% { height: 22px; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .cards-carousel::-webkit-scrollbar {
          display: none;
        }
        .cards-carousel {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
          💳 {t('finance_title')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>
          <Wallet size={13} /> {t('finance_title')}
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: '500', lineHeight: '1.4' }}>
        {t('finance_subtitle')}
      </p>

      {/* BANK CARDS MANAGEMENT HORIZONTAL CAROUSEL */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            💳 {user.settings?.language === 'uz' ? 'Mening Kartalarim' : (user.settings?.language === 'ru' ? 'Мои Карты' : 'My Cards')}
          </h2>
          <button 
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '750' }}
            onClick={() => setShowCardModal(true)}
          >
            <Plus size={13} /> {user.settings?.language === 'uz' ? 'Karta qo\'shish' : (user.settings?.language === 'ru' ? 'Добавить' : 'Add Card')}
          </button>
        </div>

        {/* Swipeable Container - COMPACT CHIPS */}
        <div 
          className="cards-carousel"
          style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            padding: '4px 0 10px 0'
          }}
        >
          {cards.map(card => {
            const isSelected = selectedCardId === card.id;
            const grad = cardGradients[card.color] || cardGradients.purple;
            
            return (
              <div 
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                style={{ 
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: '12px',
                  background: isSelected ? grad : 'var(--surface-color)',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--surface-border)',
                  boxShadow: isSelected ? '0 4px 12px rgba(124, 58, 237, 0.15)' : 'none',
                  transition: 'all 0.2s',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                <span style={{ fontSize: '13px' }}>{cardEmojis[card.type] || '💳'}</span>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {card.name}
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCardClick(card);
                      }}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        opacity: 0.75,
                        fontSize: '11px',
                        padding: '1px'
                      }}
                      title="Tahrirlash"
                    >
                      ⚙️
                    </span>
                  </span>
                  <span style={{ fontSize: '10px', opacity: isSelected ? 0.9 : 0.6, fontWeight: '700', whiteSpace: 'nowrap' }}>
                    {card.balance.toLocaleString('uz-UZ')} {t('currency_unit')}
                  </span>
                </div>
                {card.id !== 'card-1' && card.id !== 'card-2' && card.id !== 'card-savings' && (
                  <button
                    style={{ border: 'none', background: 'none', padding: '2px', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', cursor: 'pointer', marginLeft: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(user.settings?.language === 'uz' ? "Ushbu kartani o'chirmoqchimisiz?" : "Удалить карту?")) {
                        onDeleteCard(card.id);
                        if (selectedCardId === card.id) setSelectedCardId('card-1');
                      }
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BALANCES MAIN CARD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        
        {/* Neon Wallet Balance Card - ENLARGED & STRETCHED */}
        <div 
          className="glass-card" 
          style={{ 
            background: 'var(--primary-gradient)', 
            color: 'white', 
            padding: '22px 18px', 
            borderRadius: '24px',
            boxShadow: '0 12px 30px rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.9, fontWeight: '850' }}>
            💰 {user.settings?.language === 'uz' ? 'Hozirgi Kassa Balansi' : (user.settings?.language === 'ru' ? 'Текущий Баланс Кассы' : 'Current Cash Balance')}
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: '950', margin: '6px 0 14px 0', textShadow: '0 1px 4px rgba(0,0,0,0.18), 0 0 15px rgba(255,255,255,0.3)', letterSpacing: '-0.5px', fontFamily: 'monospace' }}>
            {formatCurrency(totalCardsBalance)}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.22)', paddingTop: '18px', fontSize: '13px' }}>
            <div>
              <span style={{ opacity: 0.9, display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '800' }}>🟢 {t('total_income')}</span>
              <strong style={{ fontSize: '16px', fontWeight: '900' }}>+{formatCurrency(totalIncome)}</strong>
            </div>
            <div style={{ textBlock: 'right', textAlign: 'right' }}>
              <span style={{ opacity: 0.9, display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '800' }}>🔴 {t('total_expense')}</span>
              <strong style={{ fontSize: '16px', fontWeight: '900' }}>-{formatCurrency(totalExpense)}</strong>
            </div>
          </div>
        </div>

        {/* Lent vs Borrowed Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '14px 16px', borderLeft: '4px solid #06b6d4', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-color)' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>
              ↗️ {t('lent_lbl')}
            </span>
            <strong style={{ fontSize: '15px', color: '#0891b2', fontWeight: '800' }}>
              {formatCurrency(totalLent)}
            </strong>
          </div>

          <div className="glass-card" style={{ padding: '14px 16px', borderLeft: '4px solid #f97316', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-color)' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>
              ↙️ {t('borrowed_lbl')}
            </span>
            <strong style={{ fontSize: '15px', color: '#ea580c', fontWeight: '800' }}>
              {formatCurrency(totalBorrowed)}
            </strong>
          </div>
        </div>

        {netLending !== 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: netLending > 0 ? 'rgba(6,182,212,0.06)' : 'rgba(249,115,22,0.06)', border: `1px solid ${netLending > 0 ? 'rgba(6,182,212,0.15)' : 'rgba(249,115,22,0.15)'}`, padding: '10px 14px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700', color: netLending > 0 ? '#0891b2' : '#ea580c' }}>
            <Info size={13} />
            {netLending > 0 
              ? t('people_borrowed_from_you').replace('{amount}', formatCurrency(Math.abs(netLending)))
              : t('people_lent_you').replace('{amount}', formatCurrency(Math.abs(netLending)))
            }
          </div>
        )}
      </div>

      {/* Telegram Report Button */}
      {!isMockMode && (
        <div style={{ marginBottom: '20px' }}>
          <button 
            type="button"
            onClick={handleSendTelegramReport}
            disabled={reportSending}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              borderRadius: '20px', 
              fontSize: '13px', 
              padding: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              borderColor: 'rgba(255,255,255,0.2)',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)',
              fontWeight: 'bold'
            }}
          >
            <Sparkles size={14} className={reportSending ? 'animate-spin' : ''} />
            {reportSending ? t('report_sending') : reportSent ? t('report_sent') : t('send_report_telegram')}
          </button>
        </div>
      )}

      {/* INTERACTIVE EXPENSE BREAKDOWN */}
      {totalExpense > 0 && (
        <div className="glass-card" style={{ marginBottom: '24px', padding: '18px 16px' }}>
          <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={15} color="var(--primary)" /> 📊 {t('expense_breakdown')}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {breakdown.map(item => (
              <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  <span>{item.meta.emoji} {item.meta.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {item.percentage}% ({formatCurrency(item.amount)})
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', background: item.meta.color, borderRadius: '3px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD TRANSACTION FORM */}
      <div className="glass-card" style={{ padding: '20px 16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', margin: 0 }}>
            <Plus size={16} color="var(--primary)" /> {t('add_tx_title')}
          </h3>
          <button
            type="button"
            onClick={handleStartListening}
            className={`btn ${isListening ? 'btn-danger pulse' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '11.5px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              borderColor: isListening ? 'var(--danger)' : 'var(--primary)',
              color: isListening ? 'white' : 'var(--primary)',
              background: isListening ? 'var(--danger-gradient)' : 'transparent',
              transition: 'all 0.3s ease'
            }}
          >
            {isListening ? (
              <>
                <span className="mic-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'ping-slow 1s infinite' }}></span>
                {t('voice_listening')}
              </>
            ) : (
              <>
                <Mic size={12} /> {t('voice_input_start')}
              </>
            )}
          </button>
        </div>

        {/* Glowing Sound Wave Microphone Indicator */}
        {isListening && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.04)', border: '1px dashed rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '16px', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--danger)' }}>
              🎙️ {t('voice_listening')}
            </span>
            <div style={{ display: 'flex', gap: '3px', height: '22px', alignItems: 'center' }}>
              <div className="soundwave-bar" style={{ width: '3px', height: '10px', background: 'var(--danger)', borderRadius: '2px', animation: 'soundwave 1.2s ease-in-out infinite alternate' }}></div>
              <div className="soundwave-bar" style={{ width: '3px', height: '18px', background: 'var(--danger)', borderRadius: '2px', animation: 'soundwave 0.8s ease-in-out infinite alternate 0.2s' }}></div>
              <div className="soundwave-bar" style={{ width: '3px', height: '13px', background: 'var(--danger)', borderRadius: '2px', animation: 'soundwave 1.0s ease-in-out infinite alternate 0.4s' }}></div>
              <div className="soundwave-bar" style={{ width: '3px', height: '22px', background: 'var(--danger)', borderRadius: '2px', animation: 'soundwave 0.6s ease-in-out infinite alternate 0.1s' }}></div>
              <div className="soundwave-bar" style={{ width: '3px', height: '8px', background: 'var(--danger)', borderRadius: '2px', animation: 'soundwave 1.4s ease-in-out infinite alternate 0.3s' }}></div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
              {user.settings?.language === 'uz' ? "Masalan: 'Taksi 15000 so'm humo'" : (user.settings?.language === 'ru' ? "Например: скажите 'Продукты 5000 рублей укард'" : "e.g. Say 'Dinner 50 dollars cash'")}
            </p>
          </div>
        )}

        {/* Parsed Result Display */}
        {voiceText && !isListening && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '10px 14px', borderRadius: '12px', marginBottom: '14px', fontSize: '11.5px', color: 'var(--success)', fontWeight: '700' }}>
            <span>✅</span>
            <span style={{ flex: 1 }}>"{voiceText}"</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Row 1: Amount & Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px' }}>
            <input 
              type="number" 
              className="form-control"
              style={{ width: '100%', padding: '11px 12px', fontSize: '13.5px', borderRadius: '12px' }}
              placeholder={t('amount_placeholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <input 
              type="text" 
              className="form-control"
              style={{ width: '100%', padding: '11px 12px', fontSize: '13.5px', borderRadius: '12px' }}
              placeholder={t('desc_placeholder')}
              value={description}
              onChange={(e) => {
                const val = e.target.value;
                setDescription(val);
                
                const lower = val.toLowerCase();
                const rules = [
                  {
                    category: 'food',
                    type: 'expense',
                    keywords: ['shaurma', 'osh', 'ovqat', 'non', 'kafe', 'restoran', 'supermarket', 'korzinka', 'kfc', 'cola', 'choyxona', 'bozor', 'fastfud', 'fast-food', 'lavash', 'pitsa', 'somsa', 'burger', 'kabob', 'suv', 'choy', 'kofe', 'coffee', 'fanta', 'pepsi', 'shirinlik', 'muzqaymoq', 'makaron', 'go\'sht', 'meva', 'sabzavot', 'tuxum', 'yog\'']
                  },
                  {
                    category: 'transport',
                    type: 'expense',
                    keywords: ['taksi', 'taxi', 'yandex', 'benzin', 'metro', 'avtobus', 'yo\'lkira', 'zapravka', 'metan', 'propan', 'benzin', 'zapchast', 'moy', 'shina', 'balon', 'avtoservis', 'moyka']
                  },
                  {
                    category: 'salary',
                    type: 'income',
                    keywords: ['oylik', 'maosh', 'oyligim', 'ish haqi', 'zarplata', 'bonus', 'kashbek', 'cashback', 'stipendiya', 'daromad', 'gonorar', 'avans']
                  },
                  {
                    category: 'home',
                    type: 'expense',
                    keywords: ['ijara', 'arenda', 'svet', 'gaz', 'suv', 'komunal', 'ro\'zg\'or', 'remont', 'mebel', 'kvartira', 'kombayn', 'pilesos', 'kir yuvish', 'sovun', 'shampun']
                  },
                  {
                    category: 'entertainment',
                    type: 'expense',
                    keywords: ['kino', 'teatr', 'sayohat', 'game', 'o\'yin', 'konsert', 'park', 'attraksion', 'playstation', 'ps5', 'pubg', 'kvest', 'muzey', 'dam olish']
                  },
                  {
                    category: 'gift',
                    type: 'expense',
                    keywords: ['sovg\'a', 'hadya', 'ehson', 'sadaqa', 'gift', 'present', 'yordam', 'xayriya']
                  },
                  {
                    category: 'loan',
                    type: 'expense',
                    keywords: ['qarz', 'dolg', 'kredit', 'ipoteka', 'lizing', 'foiz']
                  }
                ];

                for (const rule of rules) {
                  if (rule.keywords.some(kw => lower.includes(kw))) {
                    setTxType(rule.type);
                    setCategory(rule.category);
                    break;
                  }
                }
              }}
              required
            />
          </div>

          {/* Row 2: Selectors & Submit button */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
            <select 
              className="form-control"
              style={{ padding: '10px 4px', fontSize: '12px', borderRadius: '12px', background: 'var(--surface-color)', width: '100%' }}
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
            >
              <option value="expense">{t('tx_expense')}</option>
              <option value="income">{t('tx_income')}</option>
              <option value="lend">{t('tx_lend')}</option>
              <option value="borrow">{t('tx_borrow')}</option>
            </select>

            <select 
              className="form-control"
              style={{ padding: '10px 4px', fontSize: '12px', borderRadius: '12px', background: 'var(--surface-color)', width: '100%' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">💼 {t('cat_general')}</option>
              <option value="food">🍏 {t('cat_food')}</option>
              <option value="transport">🚗 {t('cat_transport')}</option>
              <option value="salary">💰 {t('cat_salary')}</option>
              <option value="home">🏠 {t('cat_home')}</option>
              <option value="entertainment">🎮 {t('cat_entertainment')}</option>
              <option value="gift">🎁 {t('cat_gift')}</option>
              <option value="loan">🤝 {t('cat_loan')}</option>
              <option value="savings">🎯 {t('savings_pot') || "Jamg'arma"}</option>
            </select>

            {/* CARD SELECTOR */}
            <select 
              className="form-control"
              style={{ padding: '10px 4px', fontSize: '12px', borderRadius: '12px', background: 'var(--surface-color)', width: '100%', fontWeight: '700' }}
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              required
            >
              {cards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '750' }}>
              OK
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', paddingLeft: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isRecurring} 
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (triggerHaptic) triggerHaptic('light');
                }}
                style={{ width: '15px', height: '15px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              🔁 {user.settings?.language === 'uz' ? "Har oy takrorlanadigan chiqim (Obunalar, ijara)" : (user.settings?.language === 'ru' ? "Повторять ежемесячно (Подписки, аренда)" : "Repeat monthly (Subscriptions, rent)")}
            </label>
          </div>

        </form>
      </div>

      {/* CATEGORY BUDGET PROGRESS BARS */}
      {user.settings?.budgetLimits && Object.values(user.settings.budgetLimits).some(lim => lim > 0) && (
        <div className="glass-card animate-fade-in" style={{ padding: '16px', marginBottom: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '13.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginBottom: '14px', marginTop: 0 }}>
            📊 {t('budget_limit_lbl') || "Budjet Cheklovlari"}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries({
              food: { label: '🍏 ' + t('cat_food'), key: 'food' },
              transport: { label: '🚗 ' + t('cat_transport'), key: 'transport' },
              home: { label: '🏠 ' + t('cat_home'), key: 'home' },
              entertainment: { label: '🎮 ' + t('cat_entertainment'), key: 'entertainment' },
              gift: { label: '🎁 ' + t('cat_gift'), key: 'gift' },
              loan: { label: '🤝 ' + t('cat_loan'), key: 'loan' },
              general: { label: '⚙️ ' + t('cat_general'), key: 'general' }
            }).map(([catKey, catMeta]) => {
              const limitVal = user.settings.budgetLimits[catKey] || 0;
              if (limitVal <= 0) return null;

              const categoryExpense = transactions
                .filter(t => t.category === catKey && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

              const percent = Math.min(100, Math.round((categoryExpense / limitVal) * 100));

              let barColor = 'var(--success)';
              if (percent >= 100) {
                barColor = 'var(--danger)';
              } else if (percent >= 80) {
                barColor = 'var(--warning)';
              }

              return (
                <div key={catKey}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '750', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{catMeta.label}</span>
                    <span style={{ color: percent >= 100 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {categoryExpense.toLocaleString('uz-UZ')} / {limitVal.toLocaleString('uz-UZ')} ({percent}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', borderRadius: '4px', background: barColor, transition: 'width 0.4s ease' }} />
                  </div>
                  {percent >= 100 && (
                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--danger)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {t('limit_reached_warn') || "⚠️ Diqqat! Limit to'ldi!"}
                    </div>
                  )}
                  {percent >= 80 && percent < 100 && (
                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--warning)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {(t('limit_warning') || "⚠️ Budjetingiz {percent}% ga yetdi!").replace('{percent}', percent.toString())}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📊 XARAJATLAR DIAGRAMMASI (EXPENSE PIE CHART) */}
      {totalExpense > 0 && (
        <div className="glass-card animate-fade-in" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '13.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginBottom: '14px', marginTop: 0 }}>
            📊 {user.settings?.language === 'uz' ? 'Xarajatlar Tahlili (Diagramma)' : (user.settings?.language === 'ru' ? 'Анализ Расходов' : 'Expense Breakdown')}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                {/* Background base circle */}
                <circle cx="50" cy="50" r="35" fill="transparent" stroke="var(--surface-border)" strokeWidth="10" />
                {(() => {
                  let accumulatedPercent = 0;
                  const radius = 35;
                  const circumference = 2 * Math.PI * radius; // ~219.91
                  
                  return breakdown.map((c) => {
                    const strokeDash = `${(c.percentage / 100) * circumference} ${circumference}`;
                    const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
                    accumulatedPercent += c.percentage;
                    
                    return (
                      <circle
                        key={`donut-slice-${c.key}`}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={c.meta?.color || '#8b5cf6'}
                        strokeWidth="10"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                      />
                    );
                  });
                })()}
              </svg>
              {/* Central text displaying total expense */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '7px', fontWeight: '750', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                  {user.settings?.language === 'uz' ? 'Jami Chiqim' : 'Расход'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {totalExpense >= 1000000 ? `${(totalExpense / 1000000).toFixed(1)}M` : `${Math.round(totalExpense / 1000)}k`}
                </span>
              </div>
            </div>
            
            {/* Category breakdown progress bars */}
            <div style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {breakdown.slice(0, 4).map(c => (
                <div key={`chart-bar-${c.key}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: '800' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                      <span>{c.meta?.emoji || '💼'}</span> {c.meta?.label || c.key}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {c.percentage}% ({c.amount.toLocaleString('uz-UZ')} UZS)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'var(--surface-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${c.percentage}%`, height: '100%', background: c.meta?.color || '#8b5cf6', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE FILTERS BLOCK */}
      <div style={{ marginBottom: '14px' }}>
        <div 
          onClick={() => setShowHistory(!showHistory)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', cursor: 'pointer', userSelect: 'none' }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            📜 {t('history_title')}
            <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showHistory ? 'rotate(90deg)' : 'none', fontSize: '10px' }}>
              ▶
            </span>
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {showHistory ? 'Yashirish 🔼' : 'Ko\'rsatish 🔽'}
          </span>
        </div>

        {showHistory && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: t('filter_all') },
              { id: 'expense', label: t('filter_expense') },
              { id: 'income', label: t('filter_income') },
              { id: 'loan', label: t('filter_loan') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterTab(tab.id);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: filterTab === tab.id ? 'var(--primary)' : 'var(--surface-border)',
                  background: filterTab === tab.id ? 'var(--primary-gradient)' : 'var(--surface-color)',
                  color: filterTab === tab.id ? 'white' : 'var(--text-primary)',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: filterTab === tab.id ? '0 4px 10px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TRANSACTION ITEMS LIST */}
      {showHistory && (
        <div className="animate-fade-in">
          {filteredTransactions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTransactions.slice().reverse().map(tx => {
                let prefix = '-';
                let color = 'var(--danger)';
                let typeLabel = t('tx_expense');
                let badgeBg = 'rgba(239, 68, 68, 0.06)';
                let actionLabel = t('delete_action');

                if (tx.type === 'income') {
                  prefix = '+';
                  color = 'var(--success)';
                  typeLabel = t('tx_income');
                  badgeBg = 'rgba(16, 185, 129, 0.06)';
                } else if (tx.type === 'lend') {
                  prefix = '↗';
                  color = '#0891b2';
                  typeLabel = t('lent_lbl');
                  badgeBg = 'rgba(6, 182, 212, 0.06)';
                  actionLabel = t('settled_action');
                } else if (tx.type === 'borrow') {
                  prefix = '↙';
                  color = '#ea580c';
                  typeLabel = t('borrowed_lbl');
                  badgeBg = 'rgba(249, 115, 22, 0.06)';
                  actionLabel = t('settled_action');
                }

                const catInfo = categories[tx.category] || categories['general'];
                
                // Find linked card
                const linkedCard = cards.find(c => c.id === tx.cardId);

                return (
                  <div 
                    key={tx.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px 14px', 
                      borderRadius: '18px',
                      background: 'var(--surface-color)',
                      border: '1px solid var(--surface-border)',
                      boxShadow: '0 2px 8px rgba(109,40,217,0.01)',
                      transition: 'all 0.25s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div 
                        style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          background: badgeBg, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '18px',
                          border: `1.5px solid ${color}20` 
                        }}
                      >
                        {catInfo.emoji}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '9px', background: badgeBg, color: color, padding: '1px 5px', borderRadius: '5px', fontWeight: '800', textTransform: 'uppercase' }}>
                            {tx.type === 'lend' || tx.type === 'borrow' ? (tx.type === 'lend' ? 'Lent' : 'Borrowed') : typeLabel.replace('🔴 ', '').replace('🟢 ', '').replace(' (Xarajat)', '').replace(' (Daromad)', '').replace(' (Списание)', '').replace(' (Зачисление)', '')}
                          </span>
                          
                          {/* Linked Card Tag */}
                          {linkedCard && (
                            <span style={{ fontSize: '9px', background: 'rgba(124, 58, 237, 0.08)', color: 'var(--primary)', padding: '1px 6.5px', borderRadius: '5.5px', fontWeight: '800' }}>
                              💳 {linkedCard.name}
                            </span>
                          )}

                          <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            {catInfo.label} | {new Date(tx.date).toLocaleDateString(user.settings?.language === 'uz' ? 'uz-UZ' : (user.settings?.language === 'ru' ? 'ru-RU' : 'en-US'), { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '14.5px', color: color, fontWeight: '900' }}>
                        {prefix} {tx.amount.toLocaleString('uz-UZ')}
                      </strong>
                      
                      <button 
                        type="button"
                        className="btn"
                        style={{ 
                          padding: '6px', 
                          color: 'var(--text-secondary)', 
                          background: 'none', 
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (tx.type === 'lend' || tx.type === 'borrow') {
                            if (confirm(t('settle_loan_confirm'))) {
                              onDeleteTransaction(tx.id);
                            }
                          } else {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        title={actionLabel}
                      >
                        {tx.type === 'lend' || tx.type === 'borrow' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--success)', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: '8px' }}>
                            <Check size={11} strokeWidth={3} /> {actionLabel}
                          </span>
                        ) : (
                          <Trash2 size={13} className="hover-danger" style={{ transition: 'color 0.25s' }} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px', fontWeight: '500' }}>
              {t('no_tx_desc')}
            </div>
          )}
        </div>
      )}

      {/* ADD CARD MODAL */}
      {showCardModal && (
        <div className="modal-overlay active" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card animate-scale-in" style={{ padding: '24px 20px', maxWidth: '92%', width: '380px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>
                {user.settings?.language === 'uz' ? 'Yangi Karta Qo\'shish' : (user.settings?.language === 'ru' ? 'Добавить Карту' : 'Add New Card')}
              </h2>
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '4px', border: 'none', background: 'none' }}
                onClick={() => setShowCardModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                  {user.settings?.language === 'uz' ? 'Karta Nomi' : (user.settings?.language === 'ru' ? 'Название Карты' : 'Card Name')}
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Masalan: TBC Bank, Hamkorbank"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Boshlang\'ich Balans' : (user.settings?.language === 'ru' ? 'Начальный Баланс' : 'Initial Balance')}
                  </label>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Soni..."
                    value={cardBalance}
                    onChange={(e) => setCardBalance(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Karta Turi' : (user.settings?.language === 'ru' ? 'Тип Карты' : 'Card Type')}
                  </label>
                  <select 
                    className="form-control"
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    required
                  >
                    <option value="uzcard">Uzcard</option>
                    <option value="humo">Humo</option>
                    <option value="visa">Visa</option>
                    <option value="cash">Cash/Naqd</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Karta Raqami (Oxirgi 4 ta)' : (user.settings?.language === 'ru' ? 'Последние 4 цифры' : 'Last 4 Digits')}
                  </label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Masalan: 5678"
                    maxLength="4"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Karta Rangi' : (user.settings?.language === 'ru' ? 'Цвет Карты' : 'Card Color')}
                  </label>
                  <select 
                    className="form-control"
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    required
                  >
                    <option value="purple">🔮 Siyohrang</option>
                    <option value="blue">📘 Havorang</option>
                    <option value="green">🟢 Yashil</option>
                    <option value="orange">🟠 Olovrang</option>
                    <option value="black">⚫ Qora</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', marginTop: '10px' }}
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CARD MODAL */}
      {showEditCardModal && (
        <div className="modal-overlay active" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card animate-scale-in" style={{ padding: '24px 20px', maxWidth: '92%', width: '380px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>
                {user.settings?.language === 'uz' ? 'Kartani Tahrirlash' : (user.settings?.language === 'ru' ? 'Редактировать Карту' : 'Edit Card')}
              </h2>
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '4px', border: 'none', background: 'none' }}
                onClick={() => setShowEditCardModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                  {user.settings?.language === 'uz' ? 'Karta Nomi' : (user.settings?.language === 'ru' ? 'Название Карты' : 'Card Name')}
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="TBC Bank, Hamkorbank..."
                  value={editCardName}
                  onChange={(e) => setEditCardName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Joriy Balans' : (user.settings?.language === 'ru' ? 'Текущий Баланс' : 'Current Balance')}
                  </label>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Balansi..."
                    value={editCardBalance}
                    onChange={(e) => setEditCardBalance(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Karta Turi' : (user.settings?.language === 'ru' ? 'Тип Карты' : 'Card Type')}
                  </label>
                  <select 
                    className="form-control"
                    value={editCardType}
                    onChange={(e) => setEditCardType(e.target.value)}
                    required
                  >
                    <option value="uzcard">Uzcard</option>
                    <option value="humo">Humo</option>
                    <option value="visa">Visa</option>
                    <option value="cash">Cash/Naqd</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Karta Raqami' : (user.settings?.language === 'ru' ? 'Номер карты' : 'Card Number')}
                  </label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Masalan: 5678"
                    maxLength="4"
                    value={editCardNumber}
                    onChange={(e) => setEditCardNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>
                    {user.settings?.language === 'uz' ? 'Karta Rangi' : (user.settings?.language === 'ru' ? 'Цвет Карты' : 'Card Color')}
                  </label>
                  <select 
                    className="form-control"
                    value={editCardColor}
                    onChange={(e) => setEditCardColor(e.target.value)}
                    required
                  >
                    <option value="purple">🔮 Siyohrang</option>
                    <option value="blue">📘 Havorang</option>
                    <option value="green">🟢 Yashil</option>
                    <option value="orange">🟠 Olovrang</option>
                    <option value="black">⚫ Qora</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '800', marginTop: '10px' }}
              >
                {t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
