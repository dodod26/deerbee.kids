/* =============================================
   DEERBEE KIDS CLUB — shared.js
   Sound engine + Badge system
   ============================================= */

/* =====================
   SOUND ENGINE
   ===================== */
const Sound = (function(){
  let ctx = null;

  function getCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function clap(when){
    try{
      const c = getCtx();
      const buf = c.createBuffer(1, c.sampleRate*0.12, c.sampleRate);
      const data = buf.getChannelData(0);
      for(let i=0;i<data.length;i++)
        data[i] = (Math.random()*2-1) * Math.exp(-i/(c.sampleRate*0.04));
      const src = c.createBufferSource();
      src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 1200;
      filt.Q.value = 0.8;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.65, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when+0.12);
      src.connect(filt); filt.connect(gain); gain.connect(c.destination);
      src.start(when);
    }catch(e){}
  }

  function wow(){
    try{
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(720, c.currentTime+0.35);
      osc.frequency.exponentialRampToValueAtTime(480, c.currentTime+0.65);
      gain.gain.setValueAtTime(0.35, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime+0.75);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime+0.75);
    }catch(e){}
  }

  function ding(){
    try{
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, c.currentTime+0.15);
      gain.gain.setValueAtTime(0.28, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime+0.28);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime+0.28);
    }catch(e){}
  }

  // Suara pendek buat jawaban benar (tebak warna, memory)
  function correct(){
    clap(getCtx().currentTime);
    ding();
  }

  // Suara selesai penuh: "waaau" + tepuk tangan
  function finish(){
    wow();
    const c = getCtx();
    [0.1,0.25,0.4,0.55,0.7,0.85,1.0,1.15,1.3].forEach(t=>
      clap(c.currentTime + t)
    );
  }

  return { correct, finish };
})();


/* =====================
   BADGE SYSTEM
   ===================== */
const Badge = (function(){
  const KEY = 'deerbee_badges';
  const PROGRESS_KEY = 'deerbee_progress';

  const ALL_BADGES = [
    { id:'mewarnai1',  emoji:'🎨', name:'Seniman Muda',    desc:'Selesai mewarnai 1 gambar' },
    { id:'mewarnai4',  emoji:'🌈', name:'Raja Pelangi',    desc:'Selesai mewarnai 4 gambar' },
    { id:'puzzle1',    emoji:'🧩', name:'Jagoan Puzzle',   desc:'Selesai puzzle sekali' },
    { id:'tebak5',     emoji:'⭐', name:'Bintang Warna',   desc:'Jawab benar 5x Tebak Warna' },
    { id:'memory1',    emoji:'🧠', name:'Master Memory',   desc:'Selesai Cocokkan Warna' },
    { id:'cerita1',    emoji:'📖', name:'Kutu Buku',       desc:'Baca 1 cerita sampai selesai' },
    { id:'all',        emoji:'🏆', name:'Juara DeerBee',   desc:'Dapat semua stiker di atas' },
  ];

  function getEarned(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e){ return []; }
  }

  function getProgress(){
    try{ return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch(e){ return {}; }
  }

  function saveProgress(p){
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }

  function earn(id){
    const earned = getEarned();
    if(earned.includes(id)) return false;
    earned.push(id);
    localStorage.setItem(KEY, JSON.stringify(earned));

    // Cek apakah semua badge non-"all" sudah didapat
    const nonAll = ALL_BADGES.filter(b=>b.id!=='all').map(b=>b.id);
    if(nonAll.every(id=> earned.includes(id))){
      earn('all');
    }
    return true;
  }

  // Increment progress counter, return {value, earned: badge_id|null}
  function increment(key, threshold, badgeId){
    const p = getProgress();
    p[key] = (p[key]||0) + 1;
    saveProgress(p);
    if(p[key] >= threshold){
      const isNew = earn(badgeId);
      return { value: p[key], earned: isNew ? badgeId : null };
    }
    return { value: p[key], earned: null };
  }

  // Shortcut fungsi per aktivitas
  function onMewarnaiDone(){
    const r1 = increment('mewarnai', 1, 'mewarnai1');
    const r4 = increment('mewarnai_total', 4, 'mewarnai4');
    return r1.earned || r4.earned;
  }

  function onPuzzleDone(){
    const r = increment('puzzle', 1, 'puzzle1');
    return r.earned;
  }

  function onTebakBenar(){
    const r = increment('tebak', 5, 'tebak5');
    return r.earned;
  }

  function onMemoryDone(){
    const r = increment('memory', 1, 'memory1');
    return r.earned;
  }

  function onCeritaDone(){
    const r = increment('cerita', 1, 'cerita1');
    return r.earned;
  }

  function getAll(){ return ALL_BADGES; }
  function hasEarned(id){ return getEarned().includes(id); }
  function getProgressData(){ return getProgress(); }

  return { onMewarnaiDone, onPuzzleDone, onTebakBenar, onMemoryDone,
           onCeritaDone, earn, getAll, hasEarned, getProgressData };
})();


/* =====================
   BADGE TOAST NOTIF
   ===================== */
function showBadgeToast(badgeId){
  const badge = Badge.getAll().find(b=>b.id===badgeId);
  if(!badge) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%) translateY(30px);
    background:white; border-radius:20px; padding:14px 22px;
    box-shadow:0 8px 24px rgba(0,0,0,.18);
    display:flex; align-items:center; gap:12px;
    font-family:'Baloo 2',sans-serif; z-index:9999;
    opacity:0; transition:all .4s ease;
    border:2px solid #ffe066;
    white-space:nowrap;
  `;
  toast.innerHTML = `
    <span style="font-size:32px">${badge.emoji}</span>
    <div>
      <div style="font-size:11px;color:#aaa;font-weight:600;">STIKER BARU! 🎊</div>
      <div style="font-size:16px;font-weight:700;color:#444;">${badge.name}</div>
    </div>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(()=>{
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(()=>{
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(()=> toast.remove(), 400);
  }, 3000);
}
