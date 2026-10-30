'use strict';
/* Kuchcik – gra w gotowanie dla najmłodszych.
   Canvas + czysty JavaScript, bez bibliotek. Świat gry ma 1280×720 jednostek i skaluje się do ekranu.
   Obrazki pochodzą z assets.js (SVG generowane przez tools/gen_assets.py) i są raz rasteryzowane do pamięci.
   Klient przychodzi do lady i pokazuje w dymku obrazek dania. Dziecko robi je według obrazkowego przepisu
   (lewy pasek), podaje klientowi i dostaje monety do skarbonki. 7 stanowisk po 5 poziomów;
   przejście poziomu odblokowuje kolejny. */
(() => {
  const W = 1280, H = 720;
  const COUNTER_Y = 330;
  const FONT = 'Outfit, system-ui, sans-serif';
  const C = {
    wall: '#F7E9D3', tiles: '#F1DDBF', tileLine: '#E6CBA4', worktop: '#EFDCBF',
    coral: '#E8775A', mustard: '#E9B44C', mint: '#7BC8A4', ink: '#3B3550', white: '#FFFDF8',
    gold: '#F5C542', goldDark: '#C9952A',
  };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let DPR = 1, scale = 1, offX = 0, offY = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth, ch = window.innerHeight;
    canvas.width = Math.round(cw * DPR); canvas.height = Math.round(ch * DPR);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    scale = Math.min(cw / W, ch / H);
    offX = (cw - W * scale) / 2; offY = (ch - H * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- zapis ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // ---------- pomocnicze ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeBack = (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const inRect = (p, r, pad = 0) => p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
  function ellipse(x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
  function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mixColor(a, b, k) {
    const A = hex(a), B = hex(b);
    return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`;
  }
  /* polska odmiana: 1 moneta, 2 monety, 5 monet */
  function odmiana(n, jeden, kilka, wiele) {
    if (n === 1) return jeden;
    const d = n % 10, st = n % 100;
    return (d >= 2 && d <= 4 && (st < 10 || st > 20)) ? kilka : wiele;
  }

  // ---------- obrazki z assets.js ----------
  const SPR = {};
  let artLeft = 0;
  for (const [name, [svg, x, y, w, h, r]] of Object.entries(window.KUCHCIK_ART || {})) {
    artLeft++;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(w * r); c.height = Math.round(h * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      SPR[name] = { c, x, y, w, h };
      artLeft--;
    };
    img.onerror = () => { artLeft--; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function spr(name, x = 0, y = 0, s = 1, rot = 0) {
    const S = SPR[name];
    if (!S) return;
    ctx.save(); ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (s !== 1) ctx.scale(s, s);
    ctx.drawImage(S.c, S.x, S.y, S.w, S.h);
    ctx.restore();
  }
  /* rysuje obrazek wpisany w prostokąt maxW×maxH, środkiem w (x, y) */
  function sprFit(name, x, y, maxW, maxH, rot = 0) {
    const S = SPR[name]; if (!S) return;
    const s = Math.min(maxW / S.w, maxH / S.h);
    spr(name, x - (S.x + S.w / 2) * s, y - (S.y + S.h / 2) * s, s, rot);
  }

  // ---------- dźwięk (Web Audio, bez plików) ----------
  let soundOn = store.get('kuchcik-sound', true);
  let AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, d, type = 'sine', v = 0.08, delay = 0, slideTo = 0) {
    if (!soundOn) return;
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.02);
  }
  let noiseBuf = null;
  function noise(d, v = 0.15, freq = 1500, delay = 0, q = 1) {
    if (!soundOn) return;
    const a = audio(); if (!a) return;
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const t0 = a.currentTime + delay;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(f); f.connect(g); g.connect(a.destination); s.start(t0); s.stop(t0 + d + 0.02);
  }
  const sfx = {
    pick: () => tone(520, 0.09, 'triangle', 0.06, 0, 800),
    drop: () => { tone(300, 0.12, 'sine', 0.1, 0, 170); tone(880, 0.12, 'triangle', 0.04, 0.05); },
    good: () => [660, 880, 1320].forEach((f, i) => tone(f, 0.16, 'triangle', 0.05, i * 0.07)),
    hmm: () => { tone(330, 0.2, 'sine', 0.08); tone(247, 0.28, 'sine', 0.08, 0.2); },
    chop: () => { noise(0.07, 0.3, 2600, 0, 1.2); tone(150, 0.07, 'square', 0.03); },
    swish: () => noise(0.14, 0.05, 1700, 0, 0.7),
    shake: () => noise(0.08, 0.06, 4200, 0, 2),
    pour: () => noise(0.18, 0.05, 700, 0, 0.6),
    sizzle: () => noise(0.25, 0.03, 5200, 0, 0.5),
    bubble: () => tone(rand(300, 520), 0.08, 'sine', 0.03, 0, rand(600, 900)),
    flip: () => { tone(400, 0.12, 'triangle', 0.06, 0, 900); noise(0.1, 0.1, 1200); },
    stir: () => tone(rand(180, 240), 0.06, 'triangle', 0.025),
    coin: () => { tone(1320, 0.07, 'square', 0.03); tone(1760, 0.3, 'triangle', 0.05, 0.06); },
    bell: () => { tone(1047, 0.6, 'sine', 0.07); tone(784, 0.8, 'sine', 0.07, 0.32); },
    ding: () => { tone(1568, 0.5, 'sine', 0.08); tone(2093, 0.6, 'sine', 0.05, 0.05); },
    crunch: () => { noise(0.08, 0.22, 900, 0, 1); noise(0.06, 0.18, 1400, 0.09, 1); },
    fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.24, 'triangle', 0.06, i * 0.13)),
    lock: () => { tone(220, 0.1, 'square', 0.03); tone(180, 0.12, 'square', 0.03, 0.1); },
  };

  // ---------- lektor (synteza mowy urządzenia) ----------
  let glos = null;
  function ocenGlos(g) {
    let p = 0;
    if (/^pl/i.test(g.lang) || /polish|polski/i.test(g.name)) p += 100; else p -= 200;
    if (/natural|neural|online/i.test(g.name)) p += 60;
    if (/desktop/i.test(g.name)) p -= 40;
    if (g.localService === false) p += 10;
    return p;
  }
  function szukajGlosu() {
    let v = [];
    try { v = (window.speechSynthesis.getVoices() || []).slice(); } catch (e) {}
    v.sort((a, b) => ocenGlos(b) - ocenGlos(a));
    glos = v[0] && ocenGlos(v[0]) > 0 ? v[0] : null;
  }
  if (window.speechSynthesis) { szukajGlosu(); window.speechSynthesis.onvoiceschanged = szukajGlosu; }
  function zdanie(t, pitch = 1.05) {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'pl-PL';
    u.rate = glos && /natural|neural|online/i.test(glos.name) ? 1.0 : 0.92;
    u.pitch = pitch;
    if (glos) u.voice = glos;
    return u;
  }
  /* przyjmuje teksty albo {t, pitch} – klient mówi swoim głosem, lektor zwykłym */
  function mowWiele(list) {
    if (!soundOn || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      list.filter(Boolean).forEach((x) => window.speechSynthesis.speak(typeof x === 'string' ? zdanie(x) : zdanie(x.t, x.pitch)));
    } catch (e) {}
  }
  const mow = (t) => mowWiele([t]);

  // ---------- składniki ----------
  /* box: co leży w skrzynce [obrazek, dx, dy, skala, obrót°]; held: obrazek pod palcem; tool: narzędzie (smarowanie,
     posypywanie, nalewanie); slice: plasterek po pokrojeniu; acc/few/fem: słowa dla lektora */
  const ING = {
    chleb: { box: [['chleb', -8, 4, .4, -8], ['chleb', 10, 0, .4, 8]], held: 'chleb', hs: 1, whole: true, acc: 'chleb' },
    maslo: { box: [['maslo_box', 0, 2, .78]], tool: 'noz_maslo', color: '#FBE08A', say: 'Posmaruj chleb masłem.' },
    ser: { box: [['ser_box', 0, 2, .62]], held: 'ser', hs: 1, whole: true, acc: 'ser' },
    szynka: { box: [['szynka', -6, 8, .42, -10], ['szynka', 6, 0, .42, 6], ['szynka', 0, -8, .42, 0]], held: 'szynka', hs: 1, whole: true, acc: 'szynkę' },
    salata: { box: [['salata_box', 0, 0, .72]], held: 'salata', hs: 1, whole: true, acc: 'sałatę' },
    pomidor: { box: [['pomidor', -16, 6, .58], ['pomidor', 18, 0, .58]], held: 'pomidor', hs: 1.25, slice: 'pomidor_s', nom: 'pomidor', acc: 'pomidora', wv: 92 },
    ogorek: { box: [['ogorek', 0, 8, .62, -12], ['ogorek', 4, -8, .62, 8]], held: 'ogorek', hs: 1.2, slice: 'ogorek_s', nom: 'ogórek', acc: 'ogórka', wv: 132 },
    banan: { box: [['banan', 0, 8, .55, -10], ['banan', 2, -6, .55, 6]], held: 'banan', hs: 1.1, slice: 'banan_s', nom: 'banan', acc: 'banana', wv: 150 },
    truskawka: { box: [['truskawka', -18, 8, .5], ['truskawka', 16, 6, .5], ['truskawka', 0, -8, .5]], held: 'truskawka', hs: 1.1, slice: 'truskawka_s', nom: 'truskawka', acc: 'truskawkę', few: 'truskawki', fem: true, wv: 76 },
    winogrona: { box: [['winogrona', 0, 0, .8]], held: 'winogrono', hs: 1.4, icon: 'winogrona', acc: 'winogrono', few: 'winogrona' },
    mleko: { box: [['mleko_box', 0, 0, .78]], tool: 'mleko_box', pour: '#FFFFFF', say: 'Nalej mleka do kreski. Trzymaj dzbanek nad szklanką.' },
    jogurt: { box: [['jogurt_box', 0, 0, .85]], tool: 'jogurt_box', pour: '#FFF6EE', say: 'Nalej jogurtu do miski. Trzymaj kubeczek nad miską.' },
    lody_t: { box: [['lody_t_box', 0, 0, .9]], held: 'lody_t', hs: .9, acc: 'gałkę truskawkową', scoop: true },
    lody_c: { box: [['lody_c_box', 0, 0, .9]], held: 'lody_c', hs: .9, acc: 'gałkę czekoladową', scoop: true },
    lody_v: { box: [['lody_v_box', 0, 0, .9]], held: 'lody_v', hs: .9, acc: 'gałkę waniliową', scoop: true },
    posypka: { box: [['posypka_box', 0, 0, .8]], tool: 'posypka_box', sprinkle: ['#E8775A', '#5B8BD9', '#F2C744', '#7BC8A4', '#F28DB2'], say: 'Posyp kolorową posypką. Potrząsaj nad deserem.' },
    czekolada: { box: [['czekolada_box', 0, 0, .9]], tool: 'lyzka_czekolada', color: '#6E3F26', say: 'Polej czekoladą. Jeździj łyżką.' },
    wafelek: { box: [['wafelek', -14, 2, .7, -10], ['wafelek', 0, 0, .7], ['wafelek', 14, 2, .7, 10]], held: 'wafelek', hs: 1, acc: 'wafelek' },
    wisienka: { box: [['wisienka', -18, 6, .7], ['wisienka', 16, 4, .7], ['wisienka', 0, -6, .7]], held: 'wisienka', hs: 1, acc: 'wisienkę' },
    ciasto_n: { box: [['ciasto_n_box', 0, 0, .78]], tool: 'ciasto_n_box', pour: '#F6E2A8', say: 'Wlej ciasto na patelnię. Trzymaj dzbanek nad patelnią.' },
    dzem: { box: [['dzem_box', 0, 0, .9]], tool: 'lyzka_dzem', color: '#D9334A', say: 'Posmaruj naleśnika dżemem.' },
    cukier: { box: [['cukier_box', 0, 0, .8]], tool: 'cukier_box', sprinkle: ['#FFFFFF', '#F6F2EC'], say: 'Posyp cukrem pudrem. Potrząsaj nad naleśnikiem.' },
    ciasto_p: { box: [['ciasto_p', 0, 4, .8]], held: 'ciasto_p', hs: 1.2, whole: true, acc: 'ciasto' },
    sos: { box: [['sos_box', 0, 0, .9]], tool: 'lyzka_sos', color: '#D2442E', say: 'Posmaruj ciasto sosem pomidorowym.' },
    sertarty: { box: [['sertarty_box', 0, 0, .9]], tool: 'sertarty_box', sprinkle: ['#FFD25A', '#F7C33E', '#FFE07A'], shreds: true, say: 'Posyp pizzę serem. Potrząsaj nad nią.' },
    salami: { box: [['salami', -16, 6, .8], ['salami', 16, 6, .8], ['salami', 0, -8, .8]], held: 'salami', hs: 1, acc: 'plasterek salami', few: 'plasterki salami' },
    pieczarki: { box: [['pieczarki', -16, 6, .8], ['pieczarki', 16, 6, .8], ['pieczarki', 0, -8, .8]], held: 'pieczarki', hs: 1, acc: 'pieczarkę', few: 'pieczarki', fem: true },
    oliwki: { box: [['oliwki', -14, 8, 1], ['oliwki', 12, 8, 1], ['oliwki', 0, -8, 1], ['oliwki', 24, -6, 1]], held: 'oliwki', hs: 1.2, acc: 'oliwkę', few: 'oliwki', fem: true },
    woda: { box: [['woda_box', 0, 0, .78]], tool: 'woda_box', pour: '#BFE4F7', say: 'Nalej wody do garnka. Patrz na kreskę obok.' },
    marchewka: { box: [['marchewka', 6, 8, .5, -8], ['marchewka', 4, -6, .5, 6]], held: 'marchewka', hs: 1, slice: 'marchewka_s', nom: 'marchewka', acc: 'marchewkę', wv: 154 },
    ziemniak: { box: [['ziemniak', -16, 6, .6], ['ziemniak', 18, 2, .6]], held: 'ziemniak', hs: 1.1, slice: 'ziemniak_s', nom: 'ziemniak', acc: 'ziemniaka', wv: 96 },
    groszek: { box: [['groszek_box', 0, 0, .9]], held: 'groszek', hs: 1, acc: 'łyżkę groszku', few: 'łyżki groszku', fem: true },
    makaron: { box: [['makaron_box', 0, 0, .9]], held: 'makaron', hs: 1, acc: 'garść makaronu', few: 'garści makaronu', fem: true },
    ciasto_m: { box: [['ciasto_m_box', 0, 0, .78]], tool: 'ciasto_m_box', pour: '#EFCB86', say: 'Wlej ciasto do foremki, do kreski.' },
    lukier: { box: [['lukier_box', 0, 0, .9]], tool: 'szpatulka', color: '#F7B6C8', say: 'Posmaruj muffinkę lukrem.' },
    swieczka: { box: [['swieczka', -16, 6, .7, -8], ['swieczka', 0, 0, .7], ['swieczka', 16, 6, .7, 8]], held: 'swieczka', hs: 1, acc: 'świeczkę', few: 'świeczki', fem: true },
  };

  // ---------- stanowiska i przepisy ----------
  /* kroki: ['place', ing, n] ['smear', ing] ['sprinkle', ing] ['cut', ing, n] ['pour', ing, poziom] ['stir', n] ['cook'] ['bake'] */
  const CHAPTERS = [
    {
      id: 'kanapki', name: 'Kanapki', icon: 'chleb', left: 'deska',
      crates: ['chleb', 'maslo', 'ser', 'szynka', 'salata', 'pomidor', 'ogorek'],
      recipes: {
        ser: { dish: 'kanapka', order: 'kanapkę z serem', steps: [['place', 'chleb'], ['smear', 'maslo'], ['place', 'ser']] },
        szynka: { dish: 'kanapka', order: 'kanapkę z sałatą i szynką', steps: [['place', 'chleb'], ['smear', 'maslo'], ['place', 'salata'], ['place', 'szynka']] },
        pomidor: { dish: 'kanapka', order: 'kanapkę z pomidorem', steps: [['place', 'chleb'], ['smear', 'maslo'], ['cut', 'pomidor', 3]] },
        ogorek: { dish: 'kanapka', order: 'kanapkę z serem i ogórkiem', steps: [['place', 'chleb'], ['smear', 'maslo'], ['place', 'ser'], ['cut', 'ogorek', 4]] },
        wielka: { dish: 'kanapka', order: 'wielką kanapkę ze wszystkim', steps: [['place', 'chleb'], ['smear', 'maslo'], ['place', 'salata'], ['place', 'szynka'], ['cut', 'pomidor', 3]] },
      },
      levels: [['ser', 'ser'], ['ser', 'szynka', 'ser'], ['pomidor', 'szynka', 'ser'], ['ogorek', 'pomidor', 'szynka'], ['wielka', 'ogorek', 'pomidor', 'szynka']],
    },
    {
      id: 'owoce', name: 'Owocowy bar', icon: 'truskawka', left: 'deska',
      crates: ['banan', 'truskawka', 'winogrona', 'mleko', 'jogurt'],
      recipes: {
        banany: { dish: 'miska', order: 'miseczkę bananów', steps: [['cut', 'banan', 3], ['stir', 1]] },
        salatka: { dish: 'miska', order: 'sałatkę owocową', steps: [['cut', 'banan', 3], ['place', 'winogrona', 3], ['stir', 2]] },
        tecza: { dish: 'miska', order: 'tęczową sałatkę owocową', steps: [['cut', 'banan', 3], ['cut', 'truskawka', 3], ['place', 'winogrona', 3], ['stir', 2]] },
        jogurt: { dish: 'miska', order: 'jogurt z owocami', steps: [['pour', 'jogurt', .6], ['cut', 'truskawka', 3], ['place', 'winogrona', 2]] },
        koktajl_t: { dish: 'szklanka', order: 'koktajl truskawkowy', mix: '#F7A8BC', steps: [['pour', 'mleko', .6], ['place', 'truskawka', 3], ['stir', 2]] },
        koktajl_b: { dish: 'szklanka', order: 'koktajl bananowy', mix: '#FFE9A0', steps: [['pour', 'mleko', .6], ['cut', 'banan', 3], ['stir', 2]] },
      },
      levels: [['banany', 'salatka'], ['salatka', 'koktajl_t', 'banany'], ['jogurt', 'koktajl_t', 'salatka'], ['tecza', 'koktajl_b', 'jogurt'], ['tecza', 'koktajl_t', 'koktajl_b', 'jogurt']],
    },
    {
      id: 'lody', name: 'Lodziarnia', icon: 'lody_t', left: 'deska',
      crates: ['lody_t', 'lody_c', 'lody_v', 'posypka', 'czekolada', 'wafelek', 'wisienka'],
      recipes: {
        jedna: { dish: 'rozek', order: 'loda truskawkowego', steps: [['place', 'lody_t']] },
        dwie: { dish: 'rozek', order: 'loda czekoladowo-waniliowego', steps: [['place', 'lody_c'], ['place', 'lody_v']] },
        posypka: { dish: 'rozek', order: 'loda z posypką', steps: [['place', 'lody_v'], ['place', 'lody_t'], ['sprinkle', 'posypka']] },
        wafel: { dish: 'rozek', order: 'loda z wafelkiem i wisienką', steps: [['place', 'lody_t'], ['place', 'lody_c'], ['place', 'wafelek'], ['place', 'wisienka']] },
        wielki: { dish: 'rozek', order: 'wielkiego loda ze wszystkim', steps: [['place', 'lody_c'], ['place', 'lody_v'], ['place', 'lody_t'], ['smear', 'czekolada'], ['sprinkle', 'posypka'], ['place', 'wisienka']] },
      },
      levels: [['jedna', 'dwie'], ['dwie', 'jedna', 'posypka'], ['posypka', 'wafel', 'dwie'], ['wafel', 'wielki', 'posypka'], ['wielki', 'wafel', 'posypka', 'dwie']],
    },
    {
      id: 'nalesniki', name: 'Naleśnikarnia', icon: 'ciasto_n_box', left: 'deska',
      crates: ['ciasto_n', 'dzem', 'czekolada', 'banan', 'truskawka', 'cukier'],
      recipes: {
        dzem: { dish: 'nalesnik', order: 'naleśnika z dżemem', steps: [['pour', 'ciasto_n', .8], ['cook'], ['smear', 'dzem']] },
        czekolada: { dish: 'nalesnik', order: 'naleśnika z czekoladą i bananem', steps: [['pour', 'ciasto_n', .8], ['cook'], ['smear', 'czekolada'], ['cut', 'banan', 3]] },
        truskawki: { dish: 'nalesnik', order: 'naleśnika z truskawkami', steps: [['pour', 'ciasto_n', .8], ['cook'], ['smear', 'dzem'], ['cut', 'truskawka', 3], ['sprinkle', 'cukier']] },
        wielki: { dish: 'nalesnik', order: 'wielkiego naleśnika ze wszystkim', steps: [['pour', 'ciasto_n', .8], ['cook'], ['smear', 'czekolada'], ['cut', 'banan', 3], ['cut', 'truskawka', 2], ['sprinkle', 'cukier']] },
      },
      levels: [['dzem', 'dzem'], ['dzem', 'czekolada', 'dzem'], ['truskawki', 'czekolada', 'dzem'], ['wielki', 'truskawki', 'czekolada'], ['wielki', 'truskawki', 'czekolada', 'dzem']],
    },
    {
      id: 'pizza', name: 'Pizzeria', icon: 'salami', left: 'piekarnik',
      crates: ['ciasto_p', 'sos', 'sertarty', 'salami', 'pieczarki', 'oliwki'],
      recipes: {
        margherita: { dish: 'pizza', order: 'pizzę z serem', steps: [['place', 'ciasto_p'], ['smear', 'sos'], ['sprinkle', 'sertarty'], ['bake']] },
        salami: { dish: 'pizza', order: 'pizzę z salami', steps: [['place', 'ciasto_p'], ['smear', 'sos'], ['sprinkle', 'sertarty'], ['place', 'salami', 4], ['bake']] },
        grzybowa: { dish: 'pizza', order: 'pizzę z pieczarkami i oliwkami', steps: [['place', 'ciasto_p'], ['smear', 'sos'], ['sprinkle', 'sertarty'], ['place', 'pieczarki', 3], ['place', 'oliwki', 3], ['bake']] },
        wszystko: { dish: 'pizza', order: 'pizzę ze wszystkim', steps: [['place', 'ciasto_p'], ['smear', 'sos'], ['sprinkle', 'sertarty'], ['place', 'salami', 3], ['place', 'pieczarki', 3], ['place', 'oliwki', 3], ['bake']] },
      },
      levels: [['margherita', 'margherita'], ['margherita', 'salami', 'margherita'], ['salami', 'grzybowa', 'margherita'], ['grzybowa', 'wszystko', 'salami'], ['wszystko', 'grzybowa', 'salami', 'margherita']],
    },
    {
      id: 'zupy', name: 'Zupy', icon: 'marchewka', left: 'deska',
      crates: ['woda', 'marchewka', 'ziemniak', 'groszek', 'makaron', 'pomidor'],
      recipes: {
        marchewkowa: { dish: 'zupa', order: 'zupę marchewkową', mix: '#F4A04A', steps: [['pour', 'woda', .6], ['cut', 'marchewka', 3], ['stir', 2], ['cook']] },
        rosol: { dish: 'zupa', order: 'rosół z makaronem', mix: '#F2D27A', steps: [['pour', 'woda', .6], ['cut', 'marchewka', 2], ['place', 'makaron', 2], ['stir', 2], ['cook']] },
        pomidorowa: { dish: 'zupa', order: 'zupę pomidorową', mix: '#E0533C', steps: [['pour', 'woda', .6], ['cut', 'pomidor', 3], ['place', 'makaron', 2], ['stir', 3], ['cook']] },
        jarzynowa: { dish: 'zupa', order: 'zupę jarzynową', mix: '#E8C26A', steps: [['pour', 'woda', .6], ['cut', 'marchewka', 3], ['cut', 'ziemniak', 3], ['place', 'groszek', 2], ['stir', 3], ['cook']] },
      },
      levels: [['marchewkowa', 'marchewkowa'], ['marchewkowa', 'rosol', 'marchewkowa'], ['rosol', 'pomidorowa', 'marchewkowa'], ['pomidorowa', 'jarzynowa', 'rosol'], ['jarzynowa', 'pomidorowa', 'rosol', 'marchewkowa']],
    },
    {
      id: 'cukiernia', name: 'Cukiernia', icon: 'muffin', left: 'piekarnik',
      crates: ['ciasto_m', 'lukier', 'posypka', 'wisienka', 'swieczka'],
      recipes: {
        zwykla: { dish: 'muffinka', order: 'muffinkę', steps: [['pour', 'ciasto_m', .7], ['bake']] },
        lukier: { dish: 'muffinka', order: 'muffinkę z lukrem', steps: [['pour', 'ciasto_m', .7], ['bake'], ['smear', 'lukier']] },
        kolorowa: { dish: 'muffinka', order: 'kolorową muffinkę z wisienką', steps: [['pour', 'ciasto_m', .7], ['bake'], ['smear', 'lukier'], ['sprinkle', 'posypka'], ['place', 'wisienka']] },
        urodzinowa: { dish: 'muffinka', order: 'urodzinową muffinkę ze świeczkami', steps: [['pour', 'ciasto_m', .7], ['bake'], ['smear', 'lukier'], ['sprinkle', 'posypka'], ['place', 'swieczka', 3]] },
      },
      levels: [['zwykla', 'zwykla'], ['zwykla', 'lukier', 'zwykla'], ['lukier', 'kolorowa', 'zwykla'], ['kolorowa', 'urodzinowa', 'lukier'], ['urodzinowa', 'kolorowa', 'lukier', 'zwykla']],
    },
  ];
  const LEVELS_PER = 5, TOTAL_LEVELS = CHAPTERS.length * LEVELS_PER;
  const DISH_ACC = { kanapka: 'kanapkę', miska: 'miseczkę', szklanka: 'koktajl', rozek: 'loda', nalesnik: 'naleśnika', pizza: 'pizzę', zupa: 'zupę', muffinka: 'muffinkę' };
  /* trudność rośnie z numerem poziomu w stanowisku (0–4) */
  const diff = (li) => ({
    autoPour: li < 2, band: li < 3 ? 0.13 : 0.08, hintAt: 4 + li, cook: 3.5 + li * 0.5,
    sprinkle: 26 + li * 6, coinsBonus: li >= 3 ? 1 : 0,
  });

  // ---------- naczynia: miejsce na blacie, obszary smarowania i kładzenia ----------
  const BREAD_OUT = new Path2D('M-78 72 L-78 -10 C-110 -60 -70 -95 -30 -82 C-10 -100 10 -100 30 -82 C70 -95 110 -60 78 -10 L78 72 Q78 82 68 82 L-68 82 Q-78 82 -78 72 Z');
  const BREAD_IN = new Path2D(); BREAD_IN.addPath(BREAD_OUT, new DOMMatrix().translate(0, 6).scale(0.84, 0.84));
  const GLASS_IN = new Path2D('M-53 -108 L53 -108 L43.5 82 Q43 89 35 89 L-35 89 Q-43 89 -43.5 82 Z');
  const MUFFIN_TOP = new Path2D('M-62 -10 C-66 -64 -20 -84 0 -84 C20 -84 66 -64 62 -10 C40 -2 -40 -2 -62 -10 Z');
  const ellPath = (cx, cy, rx, ry) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); return p; };
  const PAN_IN = ellPath(0, 0, 66, 66), PIZZA_IN = ellPath(0, 0, 84, 84);
  const MUFFIN_AREA = new Path2D(); MUFFIN_AREA.addPath(MUFFIN_TOP, new DOMMatrix().translate(0, -8));
  const cellsCache = new Map();
  function cellsOf(path, x0, y0, x1, y1) {
    if (cellsCache.has(path)) return cellsCache.get(path);
    const tc = document.createElement('canvas').getContext('2d'), out = [];
    for (let y = y0; y <= y1; y += 13) for (let x = x0; x <= x1; x += 13) if (tc.isPointInPath(path, x, y)) out.push({ x, y, i: out.length });
    cellsCache.set(path, out);
    return out;
  }
  const scoopsOf = (D) => D.layers.filter((l) => ING[l.ing].scoop).length;
  const scoopY = (i) => -56 - i * 36;
  const TYPES = {
    kanapka: { at: { x: 695, y: 598 }, view: 0.62, plate: true },
    miska: { at: { x: 695, y: 612 }, view: 0.95 },
    szklanka: { at: { x: 695, y: 600 }, view: 0.62 },
    rozek: { at: { x: 695, y: 628 }, s: 0.85, view: 0.55 },
    nalesnik: { at: { x: 682, y: 598 }, view: 0.6 },
    pizza: { at: { x: 682, y: 598 }, view: 0.56 },
    zupa: { at: { x: 695, y: 590 }, s: 0.88, view: 0.95 },
    muffinka: { at: { x: 695, y: 648 }, view: 0.7 },
  };
  /* obszar smarowania/posypywania w układzie naczynia */
  function areaOf(D) {
    switch (D.type) {
      case 'kanapka': return { path: BREAD_IN, cells: cellsOf(BREAD_IN, -80, -80, 80, 80), cx: 0, cy: 0 };
      case 'nalesnik': return { path: PAN_IN, cells: cellsOf(PAN_IN, -70, -70, 70, 70), cx: 0, cy: 0 };
      case 'pizza': return { path: PIZZA_IN, cells: cellsOf(PIZZA_IN, -88, -88, 88, 88), cx: 0, cy: 0 };
      case 'muffinka': return { path: MUFFIN_AREA, cells: cellsOf(MUFFIN_AREA, -70, -96, 70, -10), cx: 0, cy: -50 };
      case 'rozek': {
        const n = Math.max(1, scoopsOf(D)), y = scoopY(n - 1) - 20;
        const p = ellPath(0, y, 40, 30);
        return { path: p, cells: cellsOf(p, -44, y - 34, 44, y + 34), cx: 0, cy: y };
      }
      case 'miska': { const p = ellPath(0, -28, 86, 28); return { path: p, cells: cellsOf(p, -90, -60, 90, 2), cx: 0, cy: -28 }; }
      case 'szklanka': return { path: GLASS_IN, cells: [], cx: 0, cy: 89 - D.fill * 190 };
      case 'zupa': { const p = ellPath(0, -38, 84, 24); return { path: p, cells: [], cx: 0, cy: -38 }; }
    }
    return null;
  }
  /* gdzie kładą się kawałki: środek i promienie elipsy, skala kawałków */
  function regionOf(D) {
    switch (D.type) {
      case 'kanapka': return { cx: 0, cy: -2, rx: 40, ry: 40, s: 1 };
      case 'miska': return { cx: 0, cy: -28, rx: 58, ry: 15, s: 0.9 };
      case 'szklanka': { const lv = 89 - D.fill * 190; return { cx: 0, cy: (lv + 89) / 2, rx: 24, ry: Math.max(10, (89 - lv) / 2 - 18), s: 0.62 }; }
      case 'nalesnik': return { cx: 0, cy: 0, rx: 38, ry: 38, s: 0.9 };
      case 'pizza': return { cx: 0, cy: 0, rx: 54, ry: 54, s: 1 };
      case 'zupa': return { cx: 0, cy: -38, rx: 56, ry: 12, s: 0.85 };
      case 'muffinka': return { cx: 0, cy: -88, rx: 28, ry: 4, s: 0.8 };
      case 'rozek': return { cx: 0, cy: 0, rx: 0, ry: 0, s: 1 };
    }
    return { cx: 0, cy: 0, rx: 30, ry: 30, s: 1 };
  }
  function ringPts(n) {
    if (n === 1) return [[0, 0]];
    const out = [], k = n >= 5 ? n - 1 : n;
    for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + (i / k) * Math.PI * 2; out.push([Math.cos(a), Math.sin(a)]); }
    if (n >= 5) out.push([0, 0]);
    return out;
  }
  function newDish(type) {
    return { type, base: !(type === 'kanapka' || type === 'pizza'), layers: [], smears: [], sprinkles: [], fill: 0, mixK: 0,
      swirl: 0, cooked: 0, flipped: false, flipT: 0, onPlate: false, baked: false, groups: 0, pop: 0, mix: null, bubbles: 0 };
  }
  /* nowy kawałek na naczyniu (i-ty z n w tej grupie) */
  function addLayer(D, ing, kind, i, n, pop = 1) {
    const I = ING[ing];
    const L = { ing, kind, ux: 0, uy: 0, rot: rand(-0.3, 0.3), pop };
    if (I.whole) L.rot = ing === 'ser' ? -0.07 : ing === 'szynka' ? 0.1 : 0;
    else if (D.type === 'rozek' || D.type === 'muffinka') L.rot = 0;
    else {
      const p = ringPts(n)[i] || [0, 0], a = D.groups * 0.9 + 0.3;
      L.ux = p[0] * Math.cos(a) - p[1] * Math.sin(a); L.uy = p[0] * Math.sin(a) + p[1] * Math.cos(a);
    }
    if (D.type === 'muffinka') { L.ux = n === 1 ? 0 : (i - (n - 1) / 2) * 0.9; }
    D.layers.push(L);
    return L;
  }
  function layerPos(D, L) {
    const I = ING[L.ing];
    if (D.type === 'rozek') {
      const scoops = D.layers.filter((l) => ING[l.ing].scoop);
      const si = scoops.indexOf(L);
      if (si >= 0) return { x: 0, y: scoopY(si), s: 1 };
      const top = scoopY(Math.max(0, scoops.length - 1)) - 40;
      if (L.ing === 'wafelek') return { x: 22, y: top + 8, s: 0.9, rot: 0.35 };
      return { x: 0, y: top - 4, s: 0.9 };
    }
    const R = regionOf(D);
    if (I.whole) return { x: 0, y: D.type === 'kanapka' ? -2 : 0, s: 1 };
    let ux = L.ux, uy = L.uy;
    if (D.swirl) { const c = Math.cos(D.swirl), s = Math.sin(D.swirl); [ux, uy] = [ux * c - uy * s, ux * s + uy * c]; }
    return { x: R.cx + ux * R.rx, y: R.cy + uy * R.ry, s: R.s };
  }

  // ---------- rysowanie naczyń (układ naczynia: środek w 0,0) ----------
  function drawLayer(D, L) {
    const p = layerPos(D, L), I = ING[L.ing];
    const name = L.kind === 'slice' ? I.slice : (I.held || L.ing);
    const s = p.s * (1 + 0.12 * (L.pop || 0));
    spr(name, p.x, p.y, s, (L.rot || 0) + (p.rot || 0));
  }
  function drawSmears(D, path) {
    if (!D.smears.length) return;
    ctx.save(); ctx.clip(path);
    for (const sm of D.smears) {
      ctx.fillStyle = sm.color;
      if (sm.full) ctx.fill(path);
      else for (const p of sm.pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI * 2); ctx.fill(); }
      if (sm.full) {
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-36, -24); ctx.bezierCurveTo(-10, -32, 16, -30, 40, -22); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawSprinkles(D) {
    for (const p of D.sprinkles) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      if (p.shred) { rr(-7, -2, 14, 4, 2); ctx.fill(); }
      else { rr(-4, -1.6, 8, 3.2, 1.6); ctx.fill(); }
      ctx.restore();
    }
  }
  function liquidColor(D) {
    const base = D.liquid || '#FFFFFF';
    return D.mix ? mixColor(base, D.mix, D.mixK) : base;
  }
  function drawDish(D, served = false) {
    const t = S.time;
    switch (D.type) {
      case 'kanapka': {
        spr('talerz_maly');
        if (!D.base) return;
        ctx.save(); const k = 1 + 0.08 * D.pop; ctx.scale(k, k);
        spr('chleb');
        drawSmears(D, BREAD_IN);
        D.layers.forEach((L) => drawLayer(D, L));
        drawSprinkles(D);
        ctx.restore();
        return;
      }
      case 'miska': case 'zupa': {
        const bowlMode = D.type === 'miska' || served;
        if (bowlMode) spr('miska'); else spr('garnek');
        const cy = bowlMode ? -28 : -38, rx = bowlMode ? 90 : 86, ry = bowlMode ? 30 : 25;
        ctx.save(); ellipse(0, cy, rx, ry); ctx.clip();
        if (D.fill > 0) {
          ctx.globalAlpha = clamp(D.fill * 1.8, 0, 1);
          ellipse(0, cy, rx, ry, liquidColor(D));
          ctx.globalAlpha = 1;
          ellipse(-rx * 0.3, cy - ry * 0.3, rx * 0.35, ry * 0.25, 'rgba(255,255,255,.18)');
        }
        const R = regionOf(D);
        D.layers.forEach((L) => {
          const p = layerPos(D, L);
          const y = p.y - R.cy + cy;
          const I = ING[L.ing];
          spr(L.kind === 'slice' ? I.slice : (I.held || L.ing), p.x, y, p.s, L.rot || 0);
        });
        if (D.type === 'zupa' && (D.bubbles > 0 || D.cooked >= 1)) {
          for (let i = 0; i < 9; i++) {
            const ph = (t * 1.3 + i * 0.37) % 1;
            const bx = Math.sin(i * 12.9) * rx * 0.7, by = cy + Math.cos(i * 7.3) * ry * 0.6;
            ctx.globalAlpha = (1 - ph) * 0.8;
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(bx, by, 3 + ph * 6, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        if (D.type === 'zupa' && D.cooked >= 1) drawSteam(0, cy - 30, t);
        return;
      }
      case 'szklanka': {
        spr('szklanka_tyl');
        ctx.save(); ctx.clip(GLASS_IN);
        if (D.fill > 0) {
          const lv = 89 - D.fill * 190;
          ctx.fillStyle = liquidColor(D); ctx.fillRect(-60, lv, 120, 200);
          ellipse(0, lv, 52, 6, 'rgba(255,255,255,.35)');
        }
        D.layers.forEach((L) => drawLayer(D, L));
        ctx.restore();
        spr('szklanka_przod');
        return;
      }
      case 'rozek': {
        spr('rozek');
        const sc = D.layers.filter((l) => ING[l.ing].scoop);
        sc.forEach((L) => drawLayer(D, L));
        const a = areaOf(D);
        if (sc.length) drawSmears(D, a.path);
        drawSprinkles(D);
        D.layers.filter((l) => !ING[l.ing].scoop).forEach((L) => drawLayer(D, L));
        return;
      }
      case 'nalesnik': {
        if (!D.onPlate) spr('patelnia'); else spr('talerz_maly');
        if (D.fill > 0) {
          const r = D.onPlate ? 76 : 86 * Math.sqrt(D.fill);
          const sy = D.flipT > 0 ? Math.abs(Math.cos(D.flipT * Math.PI)) : 1;
          const k = D.cooked, col = k < 1 ? mixColor('#F6E2A8', '#E9AE4C', k) : '#E9AE4C';
          ctx.save(); ctx.scale(1, sy);
          if (D.flipT > 0) ctx.translate(0, -Math.sin(D.flipT * Math.PI) * 40 / Math.max(sy, 0.2));
          circle(0, 0, r, col);
          if (k > 0.5 || D.flipped) {
            ctx.globalAlpha = clamp((k - 0.5) * 2, 0, 1) * 0.7;
            for (let i = 0; i < 9; i++) circle(Math.sin(i * 5.1) * r * 0.6, Math.cos(i * 3.7) * r * 0.6, 4 + (i % 3) * 2, '#C98A3A');
            ctx.globalAlpha = 1;
          }
          ctx.strokeStyle = 'rgba(160,100,40,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
          if (D.onPlate) { drawSmears(D, PAN_IN); D.layers.forEach((L) => drawLayer(D, L)); drawSprinkles(D); }
          if (!D.onPlate && S.proc && S.proc.type === 'cook' && S.proc.phase !== 'flipping') {
            if (Math.random() < 0.3) parts.push({ x: rand(-60, 60), y: rand(-60, 60), vx: 0, vy: -30, g: 0, life: 0.5, max: 0.5, r: 2, color: 'rgba(255,255,255,.6)', local: true });
          }
        }
        return;
      }
      case 'pizza': {
        spr('lopata');
        if (!D.base) return;
        const k = 1 + 0.06 * D.pop;
        ctx.save(); ctx.scale(k, k);
        const g = ctx.createRadialGradient(-20, -20, 10, 0, 0, 100);
        g.addColorStop(0, D.baked ? '#F2C98A' : '#FFF1D6'); g.addColorStop(1, D.baked ? '#D9984F' : '#EBCB94');
        circle(0, 0, 98, g);
        circle(0, 0, 86, D.baked ? '#F3D7A6' : '#FBE9C8');
        drawSmears(D, PIZZA_IN);
        if (D.baked && D.sprinkles.length) {
          ctx.globalAlpha = 0.85;
          for (let i = 0; i < 16; i++) ellipse(Math.sin(i * 2.3) * 56, Math.cos(i * 3.1) * 56, 16, 12, '#FFE08A', i);
          ctx.globalAlpha = 1;
        }
        drawSprinkles(D);
        D.layers.filter((L) => L.ing !== 'ciasto_p').forEach((L) => drawLayer(D, L));
        if (D.baked) for (let i = 0; i < 10; i++) circle(Math.cos(i * 0.63) * 92, Math.sin(i * 0.63) * 92, 4, 'rgba(150,80,30,.45)');
        ctx.restore();
        return;
      }
      case 'muffinka': {
        spr('foremka');
        if (!D.baked) {
          if (D.fill > 0) {
            const h = D.fill * 34;
            ctx.fillStyle = mixColor('#EFCB86', '#E9BB6A', 0.5);
            ctx.beginPath(); ctx.ellipse(0, -14, 50, 10, 0, 0, Math.PI); ctx.lineTo(-50, -14);
            ctx.ellipse(0, -14, 50, 10 + h, 0, Math.PI, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.save(); const k = 1 + 0.06 * D.pop; ctx.translate(0, -8); ctx.scale(k, k); ctx.translate(0, 8);
          spr('muffin', 0, -8);
          drawSmears(D, MUFFIN_AREA);
          drawSprinkles(D);
          D.layers.forEach((L) => drawLayer(D, L));
          ctx.restore();
        }
        return;
      }
    }
  }
  function drawSteam(x, y, t) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const ph = (t * 0.6 + i * 0.3) % 1;
      ctx.globalAlpha = 1 - ph;
      ctx.beginPath();
      const bx = x + i * 26, by = y - ph * 40;
      ctx.moveTo(bx, by); ctx.bezierCurveTo(bx + 10, by - 10, bx - 10, by - 20, bx, by - 30);
      ctx.stroke();
    }
    ctx.restore();
  }
  /* gotowe danie z przepisu – do dymka klienta i ikony podawania */
  const finalCache = {};
  function finalDish(ch, key) {
    const id = ch.id + ':' + key;
    if (finalCache[id]) return finalCache[id];
    const R = ch.recipes[key], D = newDish(R.dish);
    D.mix = R.mix || null;
    for (const st of R.steps) applyInstant(D, st, R);
    D.pop = 0; D.layers.forEach((l) => (l.pop = 0));
    finalCache[id] = D;
    return D;
  }
  function applyInstant(D, st, R) {
    const [type, ing, n] = st;
    switch (type) {
      case 'place':
        if (ing === 'chleb' || ing === 'ciasto_p') { D.base = true; if (ing === 'ciasto_p') break; break; }
        for (let i = 0; i < (n || 1); i++) addLayer(D, ing, 'whole', i, n || 1, 0);
        D.groups++;
        break;
      case 'cut': for (let i = 0; i < n; i++) addLayer(D, ing, 'slice', i, n, 0); D.groups++; break;
      case 'smear': D.smears.push({ color: ING[ing].color, pts: [], cells: new Set(), full: true }); break;
      case 'sprinkle': {
        const a = areaOf(D), I = ING[ing];
        let seed = 7;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const tc = document.createElement('canvas').getContext('2d');
        let k = 0;
        while (k < 40) {
          const x = a.cx + (rnd() - 0.5) * 170, y = a.cy + (rnd() - 0.5) * 170;
          if (tc.isPointInPath(a.path, x, y)) { D.sprinkles.push({ x, y, rot: rnd() * 6, c: I.sprinkle[k % I.sprinkle.length], shred: !!I.shreds }); k++; }
        }
        break;
      }
      case 'pour': D.fill = n; D.liquid = ING[ing].pour; break;
      case 'stir': D.mixK = 1; break;
      case 'cook': D.cooked = 1; D.flipped = true; if (D.type === 'nalesnik') D.onPlate = true; break;
      case 'bake': D.baked = true; break;
    }
  }

  // ---------- klienci (ludzie) ----------
  const SKINS = ['#F6D3B3', '#E9B48C', '#C98B5E', '#8D5A3B', '#FADCC4'];
  const LOOKS = [
    { hair: 'long', hc: '#6B4226', shirt: '#E8775A', skin: 0, pitch: 1.2 },
    { hair: 'short', hc: '#2E2A2A', shirt: '#5B8BD9', skin: 1, beard: true, pitch: 0.85 },
    { hair: 'bun', hc: '#DCD8D2', shirt: '#A78BD0', skin: 4, glasses: true, pitch: 1.15 },
    { hair: 'bald', hc: '#E2E0DA', shirt: '#6FAF7A', skin: 0, glasses: true, mustache: true, pitch: 0.75 },
    { hair: 'cap', hc: '#7A4B2A', cap: '#E04848', shirt: '#F2C744', skin: 2, kid: true, pitch: 1.5 },
    { hair: 'pigtails', hc: '#D9772E', shirt: '#F28DB2', skin: 4, kid: true, pitch: 1.6 },
    { hair: 'curly', hc: '#1F1A1A', shirt: '#3FB0A8', skin: 3, pitch: 1.1 },
    { hair: 'short', hc: '#E3B85C', shirt: '#E9B44C', skin: 0, pitch: 0.95 },
  ];
  const PRAISE = ['Super!', 'Brawo!', 'Świetnie!', 'Pięknie!', 'Ekstra!'];
  const THANKS = ['Mniam, pyszne! Dziękuję!', 'Ale smaczne! Dziękuję bardzo!', 'Pycha! Proszę, oto pieniążki.'];
  const NUM = ['', 'Jeden', 'Dwa', 'Trzy', 'Cztery', 'Pięć', 'Sześć'];

  // ---------- układ sceny ----------
  const LEFT = { x: 196, y: 500, w: 280, h: 190 };
  const VEG_AT = { x: 300, y: 597 };
  const BOARD = { x: 520, y: 488, w: 350, h: 214 };
  const PIGGY = { x: 1168, y: 420 };
  const CUST_X = 1070;
  const SERVE_ZONE = { x: 600, y: 0, w: 680, h: COUNTER_Y + 50 };
  const SOUND_BTN = { x: 1234, y: 44, r: 30 };
  const MAP_BTN = { x: 1164, y: 44, r: 30 };
  const PLAY_BTN = { x: W / 2, y: 590, r: 74 };
  const GAUGE = { x: 892, y: 500, w: 26, h: 180 };
  let BINS = [];
  function layoutBins(ch) {
    const n = ch.crates.length, x0 = 190 + (7 - n) * 56;
    BINS = ch.crates.map((ing, i) => ({ ing, x: x0 + i * 112, y: 378, w: 100, h: 92, pop: 0 }));
  }
  const binOf = (ing) => BINS.find((b) => b.ing === ing);
  const dishAt = () => TYPES[S.D.type].at;
  const dishS = () => TYPES[S.D.type].s || 1;
  const toDish = (p) => ({ x: (p.x - dishAt().x) / dishS(), y: (p.y - dishAt().y) / dishS() });
  function cardLayout() {
    const n = S.steps.length, step = Math.min(118, (690 - 22) / Math.max(1, n));
    return { x: 14, y: 14, w: 142, h: n * step + 22, step, th: step - 14 };
  }

  // ---------- stan gry ----------
  const prog = store.get('kuchcik-prog', { unlocked: 0, done: {} });
  const S = {
    scene: 'title', money: store.get('kuchcik-money', 0), lv: 0, ch: CHAPTERS[0], li: 0, df: diff(0),
    queue: [], served: 0, cust: null, nextCustT: 0, recipe: null, R: null, steps: [], stepIdx: 0,
    D: newDish('kanapka'), dishHidden: false, cut: { phase: 'drop', veg: null, slices: 0, n: 0, cool: 0, knifeT: 0 },
    proc: null, pourT: 0, stir: null, sprinkleN: 0,
    plate: null, drag: null, idle: 0, hintSpoken: false, wiggle: null, wiggleT: 0,
    piggyT: 0, doneT: 0, time: 0, lastLook: -1, lastSwish: 0, mapT: 0, oven: null,
  };
  const fx = [], parts = [], timers = [];
  const anim = (dur, draw, end) => fx.push({ t: 0, dur, draw, end });
  const later = (t, fn) => timers.push({ t, fn });
  const curStep = () => S.steps[S.stepIdx];
  const canAct = () => S.scene === 'play' && S.cust && (S.cust.phase === 'order' || S.cust.phase === 'wait') && S.stepIdx < S.steps.length;

  function stepsOf(R) {
    const out = R.steps.map(([type, ing, n]) => ({ type, ing, n: n || (type === 'stir' ? 1 : type === 'pour' ? 0.6 : 1), cnt: 0 }));
    out.push({ type: 'serve' });
    return out;
  }
  function numWord(n, fem) { return n === 2 ? (fem ? 'dwie' : 'dwa') : (NUM[n] || String(n)).toLowerCase(); }
  function stepSay(st) {
    if (!st) return '';
    const I = ING[st.ing] || {}, D = S.D;
    switch (st.type) {
      case 'place': {
        if (st.ing === 'chleb') return 'Połóż chleb na talerzu.';
        if (st.ing === 'ciasto_p') return 'Połóż ciasto na łopacie.';
        const verb = I.scoop ? 'Nałóż' : (D.type === 'miska' || D.type === 'szklanka' || D.type === 'zupa') ? 'Wrzuć' : 'Połóż';
        if (st.n > 1) {
          const left = st.n - st.cnt;
          return st.cnt ? `Jeszcze ${left === 1 ? 'jedną' : numWord(left, I.fem)}!` : `${verb} ${numWord(st.n, I.fem)} ${I.few || I.acc}.`;
        }
        return `${verb} ${I.acc}.`;
      }
      case 'smear': return I.say + ' Jeździj po nim.';
      case 'sprinkle': return I.say;
      case 'pour': return I.say;
      case 'cut': return S.cut.phase === 'chop' ? `Stukaj w ${I.acc}, żeby go pokroić.` : `Teraz ${I.nom}. Połóż na desce do krojenia.`;
      case 'stir': return st.n > 1 ? `Zamieszaj łyżką. Kręć w kółko ${numWord(st.n)} razy.` : 'Zamieszaj łyżką. Zakręć w kółko.';
      case 'cook':
        if (D.type === 'zupa') return 'Zupa się gotuje. Poczekaj chwilkę.';
        return S.proc && S.proc.phase === 'flip' ? 'Teraz! Stuknij naleśnika, żeby go przewrócić.' : 'Naleśnik się smaży. Poczekaj, aż będzie złoty.';
      case 'bake': {
        const ph = S.oven ? S.oven.phase : 'drop';
        if (ph === 'baking') return 'Piecze się. Poczekaj na dzwonek.';
        if (ph === 'ready') return 'Gotowe! Stuknij piekarnik.';
        return `Włóż ${DISH_ACC[D.type]} do piekarnika.`;
      }
      case 'serve': return `Gotowe! Zanieś ${DISH_ACC[D.type]} klientowi.`;
    }
    return '';
  }

  function levelOf(lv) { return { ch: CHAPTERS[Math.floor(lv / LEVELS_PER)], li: lv % LEVELS_PER }; }
  function resetBoard() {
    S.D = newDish(S.R ? S.R.dish : 'kanapka');
    if (S.R) S.D.mix = S.R.mix || null;
    S.dishHidden = false;
    S.cut = { phase: 'drop', veg: null, slices: 0, n: 0, cool: 0, knifeT: 0 };
    S.proc = null; S.oven = null; S.stir = null; S.sprinkleN = 0;
    S.stepIdx = 0; S.idle = 0; S.hintSpoken = false;
  }
  function startLevel(lv) {
    const L = levelOf(lv);
    S.lv = lv; S.ch = L.ch; S.li = L.li; S.df = diff(L.li);
    layoutBins(S.ch);
    S.scene = 'play';
    S.queue = S.ch.levels[S.li].slice(); S.served = 0; S.cust = null; S.plate = null; S.drag = null;
    S.R = null; S.steps = []; fx.length = 0; timers.length = 0;
    resetBoard();
    S.nextCustT = 1.0;
    mow(`${S.ch.name}. Poziom ${S.li + 1}.`);
  }
  function goMap() {
    S.scene = 'map'; S.mapT = 0; S.cust = null; S.drag = null; fx.length = 0; timers.length = 0;
    mow('Wybierz poziom.');
  }
  function start() {
    try {
      if (matchMedia('(pointer: coarse)').matches && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
      }
    } catch (e) {}
    goMap();
  }
  function spawnCustomer() {
    S.recipe = S.queue[S.served];
    S.R = S.ch.recipes[S.recipe];
    S.steps = stepsOf(S.R);
    resetBoard();
    let li;
    do { li = Math.floor(Math.random() * LOOKS.length); } while (li === S.lastLook);
    S.lastLook = li;
    S.cust = { look: LOOKS[li], x: W + 140, phase: 'enter', t: 0, walk: 0, talk: 0, blinkT: 2, bubbleK: 0 };
    sfx.bell();
  }

  // ---------- akcje gracza ----------
  function completeStep() {
    sfx.good();
    const a = dishAt();
    sparkle(a.x, a.y - 20, 14);
    S.stepIdx++; S.idle = 0; S.hintSpoken = false;
    S.stir = null; S.proc = null; S.oven = null; S.sprinkleN = 0;
    const st = curStep();
    if (st && st.type === 'cut') S.cut = { phase: 'drop', veg: null, slices: 0, n: st.n, cool: 0, knifeT: 0 };
    if (st && st.type === 'cook') startCook();
    if (st && st.type === 'bake') S.oven = { phase: 'drop', t: 0 };
    mowWiele([pick(PRAISE), stepSay(st)]);
  }
  function wrong(st) {
    sfx.hmm();
    S.wiggle = st.ing || null; S.wiggleT = 1.2;
    mow('Hmm, to nie to. ' + stepSay(st));
    S.idle = S.df.hintAt + 0.5;
  }
  const hitCtx = document.createElement('canvas').getContext('2d');
  function inArea(path, q) { return hitCtx.isPointInPath(path, q.x, q.y); }
  function paint(p) {
    const D = S.D, a = areaOf(D), q = toDish(p);
    let sm = D.smears[D.smears.length - 1];
    if (!sm || sm.full || sm.ing !== curStep().ing) {
      sm = { ing: curStep().ing, color: ING[curStep().ing].color, pts: [], cells: new Set(), full: false };
      D.smears.push(sm);
    }
    if (!inArea(a.path, q) && !a.cells.some((c) => Math.hypot(c.x - q.x, c.y - q.y) < 30)) return;
    const last = sm.pts[sm.pts.length - 1];
    if (!last || Math.hypot(last.x - q.x, last.y - q.y) > 7) sm.pts.push({ x: q.x, y: q.y });
    for (const c of a.cells) if (!sm.cells.has(c.i) && Math.hypot(c.x - q.x, c.y - q.y) < 32) sm.cells.add(c.i);
    if (S.time - S.lastSwish > 0.13) { sfx.swish(); S.lastSwish = S.time; }
    if (sm.cells.size >= a.cells.length * 0.8) {
      sm.full = true;
      const d = S.drag; S.drag = null;
      if (d) flyBack(d);
      completeStep();
    }
  }
  function sprinkle(p, d) {
    const D = S.D, a = areaOf(D), I = ING[curStep().ing];
    const q = toDish(p);
    if (!inArea(a.path, q) && Math.hypot(q.x - a.cx, q.y - a.cy) > 110) return;
    d.travel = (d.travel || 0) + (d.lastP ? dist(d.lastP, p) : 0); d.lastP = { x: p.x, y: p.y };
    while (d.travel > 9) {
      d.travel -= 9;
      for (let k = 0; k < 2; k++) {
        const x = q.x + rand(-26, 26), y = q.y + rand(-20, 30);
        if (!inArea(a.path, { x, y })) continue;
        D.sprinkles.push({ x, y, rot: rand(0, 6), c: pick(I.sprinkle), shred: !!I.shreds });
        S.sprinkleN++;
      }
      if (S.time - S.lastSwish > 0.12) { sfx.shake(); S.lastSwish = S.time; }
    }
    if (S.sprinkleN >= S.df.sprinkle) {
      const dd = S.drag; S.drag = null;
      if (dd) flyBack(dd);
      completeStep();
    }
  }
  function stirMove(p) {
    const D = S.D, st = curStep(), a = dishAt(), R = regionOf(D);
    const c = { x: a.x + R.cx * dishS(), y: a.y + R.cy * dishS() };
    if (D.type === 'szklanka') { c.y = a.y + 20; }
    const ang = Math.atan2(p.y - c.y, p.x - c.x);
    if (!S.stir) S.stir = { last: ang, acc: 0 };
    if (dist(p, c) < 8 || dist(p, c) > 170) { S.stir.last = ang; return; }
    let da = ang - S.stir.last;
    if (da > Math.PI) da -= Math.PI * 2;
    if (da < -Math.PI) da += Math.PI * 2;
    S.stir.last = ang;
    S.stir.acc += Math.abs(da);
    D.swirl += da * 0.5;
    D.mixK = clamp(S.stir.acc / (Math.PI * 2 * st.n), 0, 1);
    if (Math.abs(da) > 0.05 && S.time - S.lastSwish > 0.15) { sfx.stir(); S.lastSwish = S.time; }
    const turns = Math.floor(S.stir.acc / (Math.PI * 2));
    if (turns > st.cnt) {
      st.cnt = turns;
      mow(NUM[Math.min(turns, NUM.length - 1)] + '!');
      if (st.cnt >= st.n) {
        D.mixK = 1;
        S.drag = null;
        later(0.4, completeStep);
      }
    }
  }
  function startCook() {
    S.proc = { type: 'cook', t: 0, dur: S.df.cook, phase: 'cook' };
    if (S.D.type === 'zupa') S.D.bubbles = 1;
  }
  function flip() {
    const P = S.proc;
    if (!P || P.phase !== 'flip') return;
    P.phase = 'flipping'; P.t = 0;
    sfx.flip();
  }
  function chop() {
    const c = S.cut;
    if (c.cool > 0 || c.phase !== 'chop') return;
    c.slices++; c.cool = 0.3; c.knifeT = 0.2;
    sfx.chop();
    mow(NUM[c.slices] + '!');
    crumbs(VEG_AT.x + 40, VEG_AT.y, '#FFE6C8', 6);
    if (c.slices >= c.n) {
      c.phase = 'done';
      later(0.7, () => {
        const D = S.D;
        for (let i = 0; i < c.n; i++) {
          const from = sliceSpot(i);
          later(i * 0.15, () => {
            c.flown = i + 1;
            const L = addLayer(D, c.veg, 'slice', i, c.n, 1);
            D.layers.pop();
            const lp = layerPos(D, L), a = dishAt(), sc = dishS();
            const dy = (D.type === 'miska' || D.type === 'zupa') ? 0 : 0;
            const to = { x: a.x + lp.x * sc, y: a.y + (lp.y + dy) * sc };
            anim(0.5, (k) => {
              const x = lerp(from.x, to.x, easeOut(k)), y = lerp(from.y, to.y, easeOut(k)) - Math.sin(k * Math.PI) * 90;
              spr(ING[c.veg].slice, x, y, lerp(1, lp.s * sc, k));
            }, () => {
              D.layers.push(L);
              sfx.drop();
              if (i === c.n - 1) { D.groups++; c.phase = 'placed'; c.veg = null; completeStep(); }
            });
          });
        }
      });
    }
  }
  function sliceSpot(i) { return { x: LEFT.x + 205 + (i % 2) * 44, y: LEFT.y + 46 + Math.floor(i / 2) * 50 }; }
  function serve() {
    S.plate = { D: S.D, bites: 0 };
    S.D = newDish(S.D.type);
    S.stepIdx = S.steps.length;
    S.cust.phase = 'eat'; S.cust.t = 0;
    sfx.drop();
    sparkle(CUST_X, COUNTER_Y - 10, 10);
  }
  function payCoins(n) {
    const sx = S.cust.x, sy = COUNTER_Y - 110;
    for (let i = 0; i < n; i++) {
      later(0.3 + i * 0.3, () => {
        anim(0.7, (k) => {
          const x = lerp(sx, PIGGY.x, k), y = lerp(sy, PIGGY.y - 50, k) - Math.sin(k * Math.PI) * 110;
          spr('moneta', x, y, 0.95, k * 6);
        }, () => {
          S.money++; store.set('kuchcik-money', S.money);
          S.piggyT = 1; sfx.coin(); sparkle(PIGGY.x, PIGGY.y - 50, 6);
        });
      });
    }
  }
  function levelDone() {
    S.scene = 'done'; S.doneT = 0;
    prog.done[S.lv] = true;
    prog.unlocked = Math.max(prog.unlocked, Math.min(TOTAL_LEVELS - 1, S.lv + 1));
    store.set('kuchcik-prog', prog);
    sfx.fanfare();
    confetti();
    const last = S.lv === TOTAL_LEVELS - 1;
    const next = levelOf(S.lv + 1);
    const extra = last ? ' To już wszystkie poziomy, jesteś mistrzem kuchni!' : next.li === 0 ? ` Odblokowane nowe stanowisko: ${next.ch.name}!` : '';
    later(0.4, () => mow(`Brawo! Wszyscy klienci są najedzeni.${extra} Masz już ${S.money} ${odmiana(S.money, 'monetę', 'monety', 'monet')}!`));
  }
  function flyBack(d) {
    if (d.kind === 'dish') {
      S.dishHidden = true;
      const a = dishAt();
      anim(0.3, (k) => drawHeld(d, lerp(d.x, a.x, easeOut(k)), lerp(d.y, a.y, easeOut(k)), 1 - 0.2 * k), () => { S.dishHidden = false; });
      return;
    }
    if (d.kind === 'stir') return;
    const b = binOf(d.ing);
    if (!b) return;
    anim(0.32, (k) => drawHeld(d, lerp(d.x, b.x + b.w / 2, easeOut(k)), lerp(d.y, b.y + b.h / 2, easeOut(k)), 1 - 0.5 * k));
  }
  function drop(p) {
    const d = S.drag; S.drag = null;
    if (!d) return;
    if (!canAct()) { flyBack(d); return; }
    const st = curStep(), D = S.D;
    const onBoard = inRect(p, BOARD, 60), onLeft = inRect(p, LEFT, 60);
    if (d.kind === 'dish') {
      if (st.type === 'serve' && inRect(p, SERVE_ZONE)) { serve(); return; }
      if (st.type === 'bake' && S.oven && S.oven.phase === 'drop' && onLeft) {
        S.oven.phase = 'baking'; S.oven.t = 0; S.dishHidden = true;
        sfx.drop(); S.idle = 0; S.hintSpoken = false;
        mow(stepSay(st));
        return;
      }
      flyBack(d); return;
    }
    if (d.kind === 'stir') return;
    if (d.kind === 'tool') {
      flyBack(d);
      if (st.type === 'pour' && d.ing === st.ing && D.fill > 0) {
        const lo = st.n - S.df.band;
        if (D.fill >= lo) {
          if (D.fill > st.n + S.df.band) mow('Ups, pełniutko! Ale może być.');
          completeStep();
        } else mow('Jeszcze trochę!');
        return;
      }
      if (onBoard && !(d.ing === st.ing && (st.type === 'smear' || st.type === 'sprinkle' || st.type === 'pour'))) wrong(st);
      return;
    }
    // zwykły składnik
    const right = st.ing === d.ing && (st.type === 'place' || (st.type === 'cut' && S.cut.phase === 'drop'));
    if (right && st.type === 'place' && onBoard) {
      if (d.ing === 'chleb' || d.ing === 'ciasto_p') { D.base = true; D.pop = 1; }
      else {
        addLayer(D, d.ing, 'whole', st.cnt, st.n, 1);
        st.cnt++;
      }
      sfx.drop();
      if (st.cnt >= st.n || d.ing === 'chleb' || d.ing === 'ciasto_p') { D.groups++; completeStep(); }
      else { mow(stepSay(st)); S.idle = 0; }
      return;
    }
    if (right && st.type === 'cut' && (onBoard || onLeft)) {
      S.cut.phase = 'chop'; S.cut.veg = d.ing; S.cut.n = st.n; S.cut.slices = 0; S.cut.flown = 0;
      sfx.drop(); S.idle = 0; S.hintSpoken = false;
      mow(stepSay(st));
      return;
    }
    flyBack(d);
    if (!right && (onBoard || onLeft)) wrong(st);
  }

  // ---------- sterowanie (mysz, palec, rysik) ----------
  function toWorld(e) { return { x: (e.clientX - offX) / scale, y: (e.clientY - offY) / scale }; }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio();
    const p = toWorld(e);
    if (Math.hypot(p.x - SOUND_BTN.x, p.y - SOUND_BTN.y) < SOUND_BTN.r + 10) {
      soundOn = !soundOn; store.set('kuchcik-sound', soundOn);
      if (!soundOn && window.speechSynthesis) window.speechSynthesis.cancel();
      return;
    }
    if (artLeft > 0) return;
    if (S.scene === 'title') { start(); return; }
    if (S.scene === 'map') { mapTap(p); return; }
    if ((S.scene === 'play' || S.scene === 'done') && Math.hypot(p.x - MAP_BTN.x, p.y - MAP_BTN.y) < MAP_BTN.r + 10) { goMap(); return; }
    if (S.scene === 'done') {
      if (S.doneT < 1) return;
      if (S.lv < TOTAL_LEVELS - 1 && Math.hypot(p.x - (W / 2 + 80), p.y - 590) < 70) { startLevel(S.lv + 1); return; }
      if (Math.hypot(p.x - (W / 2 - 80), p.y - 590) < 60 || S.lv === TOTAL_LEVELS - 1) goMap();
      return;
    }
    S.idle = 0; S.hintSpoken = false;
    if (S.drag || !canAct()) return;
    const cl = cardLayout();
    if (inRect(p, cl)) { mow(stepSay(curStep())); return; }
    const st = curStep(), D = S.D;
    const onDish = inRect(p, BOARD, 20);
    let d = null;
    if (st.type === 'cut' && S.cut.phase === 'chop' && inRect(p, LEFT, 30)) { chop(); return; }
    if (st.type === 'cook' && S.proc && S.proc.phase === 'flip' && onDish) { flip(); return; }
    if (st.type === 'bake' && S.oven && S.oven.phase === 'ready' && inRect(p, LEFT, 20)) { takeOut(); return; }
    if ((st.type === 'serve' || (st.type === 'bake' && S.oven && S.oven.phase === 'drop')) && onDish) d = { kind: 'dish' };
    else if (st.type === 'stir' && onDish) { d = { kind: 'stir' }; S.stir = null; }
    else {
      const b = BINS.find((b) => inRect(p, b, 6));
      if (!b) return;
      b.pop = 1;
      const I = ING[b.ing];
      d = { kind: I.tool ? 'tool' : 'ing', ing: b.ing };
    }
    d.x = p.x; d.y = p.y; d.id = e.pointerId;
    S.drag = d;
    sfx.pick();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    const d = S.drag;
    if (!d || d.id !== e.pointerId) return;
    const p = toWorld(e);
    d.x = p.x; d.y = p.y;
    if (!canAct()) return;
    const st = curStep();
    if (d.kind === 'stir' && st.type === 'stir') stirMove(p);
    if (d.kind === 'tool' && d.ing === st.ing) {
      if (st.type === 'smear' && (S.D.base || S.D.type === 'rozek' || S.D.onPlate || S.D.baked)) paint(p);
      else if (st.type === 'sprinkle') sprinkle(p, d);
    }
  });
  const up = (e) => { if (S.drag && S.drag.id === e.pointerId) drop(toWorld(e)); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  function takeOut() {
    const o = S.oven;
    if (!o || o.phase !== 'ready') return;
    S.D.baked = true; S.D.pop = 1; S.dishHidden = false;
    o.phase = 'out';
    const a = dishAt();
    sparkle(a.x, a.y - 30, 16);
    completeStep();
  }

  // ---------- mapa poziomów ----------
  const MAP = { x0: 66, y0: 150, cw: 158, gap: 6, btnR: 30, btnY0: 330, btnDy: 74 };
  function mapCol(ci) { return MAP.x0 + ci * (MAP.cw + MAP.gap); }
  function mapTap(p) {
    if (Math.hypot(p.x - 60, p.y - 50) < 36) { S.scene = 'title'; return; }
    for (let ci = 0; ci < CHAPTERS.length; ci++) {
      const cx = mapCol(ci) + MAP.cw / 2;
      for (let li = 0; li < LEVELS_PER; li++) {
        const cy = MAP.btnY0 + li * MAP.btnDy;
        if (Math.hypot(p.x - cx, p.y - cy) < MAP.btnR + 8) {
          const lv = ci * LEVELS_PER + li;
          if (lv > prog.unlocked) { sfx.lock(); mow('Ten poziom jest jeszcze zamknięty. Najpierw przejdź poprzedni.'); return; }
          sfx.pick(); startLevel(lv); return;
        }
      }
    }
  }

  // ---------- cząsteczki ----------
  function sparkle(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(80, 260);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 200, life: rand(0.5, 0.9), max: 0.9, r: rand(5, 9), color: pick([C.gold, '#FFFFFF', C.coral, C.mint]), star: true });
    }
  }
  function crumbs(x, y, color, n) {
    for (let i = 0; i < n; i++) parts.push({ x, y, vx: rand(-120, 120), vy: rand(-220, -60), g: 700, life: rand(0.4, 0.7), max: 0.7, r: rand(3, 6), color });
  }
  function confetti() {
    for (let i = 0; i < 120; i++) {
      parts.push({ x: rand(0, W), y: rand(-200, -10), vx: rand(-40, 40), vy: rand(80, 220), g: 60, life: rand(2.5, 4), max: 4, r: rand(6, 11), color: pick([C.coral, C.mustard, C.mint, '#5B8BD9', '#F28DB2']), rot: rand(0, 6), vr: rand(-6, 6), confetti: true });
    }
  }

  // ---------- aktualizacja ----------
  function update(dt) {
    S.time += dt;
    for (let i = timers.length - 1; i >= 0; i--) {
      timers[i].t -= dt;
      if (timers[i].t <= 0) { const t = timers.splice(i, 1)[0]; t.fn(); }
    }
    for (const f of fx.slice()) {
      f.t += dt;
      if (f.t >= f.dur) { fx.splice(fx.indexOf(f), 1); if (f.end) f.end(); }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.rot !== undefined) p.rot += p.vr * dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (const b of BINS) b.pop = Math.max(0, b.pop - dt * 4);
    S.D.pop = Math.max(0, S.D.pop - dt * 4);
    for (const l of S.D.layers) if (l.pop) l.pop = Math.max(0, l.pop - dt * 4);
    S.wiggleT = Math.max(0, S.wiggleT - dt);
    S.piggyT = Math.max(0, S.piggyT - dt * 3);
    S.cut.cool = Math.max(0, S.cut.cool - dt);
    S.cut.knifeT = Math.max(0, S.cut.knifeT - dt);
    S.mapT += dt;
    if (S.scene === 'done') S.doneT += dt;
    if (S.scene !== 'play') return;
    updateCustomer(dt);
    if (!canAct()) return;
    const st = curStep(), D = S.D, d = S.drag;
    // nalewanie
    if (st.type === 'pour' && d && d.kind === 'tool' && d.ing === st.ing && inRect(d, BOARD, 40)) {
      if (!D.liquid) D.liquid = ING[st.ing].pour;
      D.fill = Math.min(1, D.fill + dt * 0.28);
      S.idle = 0;
      if (S.time - S.lastSwish > 0.16) { sfx.pour(); S.lastSwish = S.time; }
      if (S.df.autoPour && D.fill >= st.n) {
        D.fill = st.n; S.drag = null; flyBack(d); completeStep();
      }
    }
    // smażenie i gotowanie
    const P = S.proc;
    if (st.type === 'cook' && P) {
      if (P.phase === 'cook') {
        P.t += dt;
        if (D.type === 'nalesnik') { D.cooked = clamp(P.t / P.dur, 0, 1); if (Math.random() < dt * 3) sfx.sizzle(); }
        else { if (Math.random() < dt * 6) sfx.bubble(); D.mixK = Math.max(D.mixK, 1); }
        if (P.t >= P.dur) {
          if (D.type === 'nalesnik') { P.phase = 'flip'; mow(stepSay(st)); S.idle = 0; }
          else { D.cooked = 1; completeStep(); }
        }
      } else if (P.phase === 'flipping') {
        P.t += dt; D.flipT = clamp(P.t / 0.6, 0, 1);
        if (D.flipT >= 0.5 && !D.flipped) { D.flipped = true; D.cooked = 0.55; }
        if (P.t >= 0.6) { D.flipT = 0; P.phase = 'cook2'; P.t = 0; }
      } else if (P.phase === 'cook2') {
        P.t += dt; D.cooked = lerp(0.55, 1, clamp(P.t / (P.dur * 0.5), 0, 1));
        if (Math.random() < dt * 3) sfx.sizzle();
        if (P.t >= P.dur * 0.5) { D.onPlate = true; D.pop = 1; completeStep(); }
      }
    }
    // pieczenie
    const O = S.oven;
    if (st.type === 'bake' && O && O.phase === 'baking') {
      O.t += dt;
      if (O.t >= S.df.cook + 0.5) { O.phase = 'ready'; sfx.ding(); mow(stepSay(st)); S.idle = 0; }
    }
    // podpowiedzi
    if (!S.drag && !(P && (P.phase === 'cook' || P.phase === 'cook2' || P.phase === 'flipping')) && !(O && O.phase === 'baking')) {
      S.idle += dt;
      if (S.idle > S.df.hintAt + 6 && !S.hintSpoken) { S.hintSpoken = true; mow(stepSay(st)); }
      if (S.idle > S.df.hintAt + 16) { S.idle = S.df.hintAt + 3; S.hintSpoken = false; }
    }
  }
  function updateCustomer(dt) {
    const c = S.cust;
    if (!c) {
      if (S.served < S.queue.length) { S.nextCustT -= dt; if (S.nextCustT <= 0) spawnCustomer(); }
      return;
    }
    c.t += dt; c.blinkT -= dt; c.talk = Math.max(0, c.talk - dt);
    if (c.blinkT < -0.14) c.blinkT = rand(2, 4.5);
    switch (c.phase) {
      case 'enter':
        c.walk += dt; c.x -= 420 * dt;
        if (c.x <= CUST_X) {
          c.x = CUST_X; c.phase = 'order'; c.t = 0;
          const say = `Dzień dobry! Poproszę ${S.R.order}.`;
          c.talk = say.length * 0.065;
          mowWiele([{ t: say, pitch: c.look.pitch }, stepSay(curStep())]);
        }
        break;
      case 'order':
        if (c.t > 2.2) c.phase = 'wait';
        break;
      case 'eat':
        if (S.plate.bites < 3 && c.t >= 0.6 * (S.plate.bites + 1)) {
          S.plate.bites++; sfx.crunch(); crumbs(c.x - 10, COUNTER_Y - 4, '#E9C08A', 6);
        }
        if (c.t > 2.4) {
          c.phase = 'happy'; c.t = 0;
          const say = pick(THANKS);
          c.talk = say.length * 0.06;
          mowWiele([{ t: say, pitch: c.look.pitch }]);
          payCoins(S.R.steps.length + S.df.coinsBonus);
        }
        break;
      case 'happy':
        if (c.t > 2.9) { c.phase = 'leave'; c.t = 0; S.plate = null; }
        break;
      case 'leave':
        c.walk += dt; c.x += 420 * dt;
        if (c.x > W + 160) {
          S.cust = null; S.served++;
          if (S.served >= S.queue.length) levelDone();
          else { S.steps = []; S.nextCustT = 0.5; }
        }
        break;
    }
    const showBubble = c.phase === 'order' || c.phase === 'wait' || c.phase === 'happy';
    c.bubbleK = clamp(c.bubbleK + (showBubble ? dt * 3 : -dt * 5), 0, 1);
  }

  // ---------- rysowanie człowieka za ladą ----------
  function hairTop(hx, hy, R) {
    ctx.beginPath();
    ctx.arc(hx, hy, R + 3, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(hx + R * 0.3, hy - R * 0.62, hx - R - 3, hy);
    ctx.closePath(); ctx.fill();
  }
  function drawPerson(c) {
    const L = c.look, kid = !!L.kid, R = kid ? 40 : 46, t = S.time;
    const walking = c.phase === 'enter' || c.phase === 'leave';
    const bob = walking ? -Math.abs(Math.sin(c.walk * 9)) * 9
      : c.phase === 'happy' ? -Math.abs(Math.sin(c.t * 7)) * 18 : Math.sin(t * 2) * 1.5;
    const hx = c.x, hy = COUNTER_Y - (kid ? 150 : 206) + bob;
    const skin = SKINS[L.skin], bw = kid ? 116 : 150;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, COUNTER_Y + 2); ctx.clip();
    if (L.hair === 'long') { ctx.fillStyle = L.hc; rr(hx - R - 9, hy - R + 2, 2 * R + 18, 2 * R + 34, 32); ctx.fill(); }
    ctx.fillStyle = L.shirt; rr(hx - bw / 2, hy + R - 8, bw, 320, 42); ctx.fill();
    ctx.fillStyle = skin; rr(hx - 13, hy + R - 18, 26, 22, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; rr(hx - 22, hy + R - 6, 44, 12, 6); ctx.fill();
    const waving = c.phase === 'order' && c.t < 1.8 || c.phase === 'happy';
    const shoulderY = hy + R + 26;
    ctx.lineCap = 'round'; ctx.lineWidth = kid ? 22 : 26; ctx.strokeStyle = L.shirt;
    const lh = { x: hx - bw / 2 + 4, y: COUNTER_Y - 6 };
    const rh = waving ? { x: hx + bw / 2 + 34, y: hy - 6 + Math.sin(t * 12) * 10 } : { x: hx + bw / 2 - 4, y: COUNTER_Y - 6 };
    ctx.beginPath();
    ctx.moveTo(hx - bw / 2 + 14, shoulderY); ctx.lineTo(lh.x, lh.y);
    ctx.moveTo(hx + bw / 2 - 14, shoulderY); ctx.lineTo(rh.x, rh.y);
    ctx.stroke();
    circle(lh.x, lh.y, 14, skin); circle(rh.x, rh.y, 14, skin);
    circle(hx - R, hy + 4, 10, skin); circle(hx + R, hy + 4, 10, skin);
    circle(hx, hy, R, skin);
    ctx.fillStyle = L.hc;
    switch (L.hair) {
      case 'short': hairTop(hx, hy, R); break;
      case 'long': hairTop(hx, hy, R); rr(hx - R - 6, hy - 8, 16, R + 24, 8); ctx.fill(); rr(hx + R - 10, hy - 8, 16, R + 24, 8); ctx.fill(); break;
      case 'bun': hairTop(hx, hy, R); circle(hx, hy - R - 8, 19, L.hc); break;
      case 'bald': ellipse(hx - R + 4, hy - 10, 10, 17, L.hc); ellipse(hx + R - 4, hy - 10, 10, 17, L.hc); break;
      case 'pigtails':
        circle(hx - R - 14, hy + 4, 18, L.hc); circle(hx + R + 14, hy + 4, 18, L.hc);
        ctx.fillStyle = L.hc; hairTop(hx, hy, R);
        circle(hx - R - 2, hy - 2, 6, C.mint); circle(hx + R + 2, hy - 2, 6, C.mint);
        break;
      case 'curly':
        for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; circle(hx + Math.cos(a) * R, hy - 4 + Math.sin(a) * R, 16, L.hc); }
        ctx.fillStyle = L.hc; hairTop(hx, hy, R);
        break;
      case 'cap':
        hairTop(hx, hy, R);
        ctx.fillStyle = L.cap;
        ctx.beginPath(); ctx.arc(hx, hy - 6, R + 3, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
        ellipse(hx + R * 0.55, hy - 8, R * 0.85, 9, L.cap);
        circle(hx, hy - R - 8, 6, L.cap);
        break;
    }
    const blink = c.blinkT < 0 ? 0.15 : 1;
    for (const sx of [-1, 1]) {
      ellipse(hx + sx * R * 0.36, hy + 2, 5.5, 7 * blink, '#2B2433');
      if (blink === 1) circle(hx + sx * R * 0.36 + 2, hy - 1, 2, '#FFFFFF');
      circle(hx + sx * R * 0.62, hy + R * 0.38, 9, 'rgba(240,120,120,.35)');
    }
    if (L.beard) { ctx.fillStyle = L.hc; ctx.beginPath(); ctx.arc(hx, hy, R + 1, 0.12 * Math.PI, 0.88 * Math.PI); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,70,50,.45)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy + 12, 5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    if (L.mustache) { ellipse(hx - 10, hy + R * 0.36, 12, 6, L.hc, 0.2); ellipse(hx + 10, hy + R * 0.36, 12, 6, L.hc, -0.2); }
    const my = hy + R * 0.52;
    if (c.talk > 0) ellipse(hx, my, 9, 3 + 6 * Math.abs(Math.sin(t * 14)), '#8E3B46');
    else if (c.phase === 'eat') ellipse(hx, my, 9, 2 + 5 * Math.abs(Math.sin(t * 10)), '#8E3B46');
    else if (c.phase === 'happy') { ctx.fillStyle = '#8E3B46'; ctx.beginPath(); ctx.arc(hx, my - 4, 13, 0, Math.PI); ctx.fill(); ellipse(hx, my + 4, 6, 3, '#E86F7E'); }
    else { ctx.strokeStyle = '#8E3B46'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(hx, my - 8, 11, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    if (L.glasses) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hx - R * 0.36, hy + 2, 12, 0, Math.PI * 2); ctx.moveTo(hx + R * 0.36 + 12, hy + 2); ctx.arc(hx + R * 0.36, hy + 2, 12, 0, Math.PI * 2);
      ctx.moveTo(hx - R * 0.36 + 12, hy); ctx.lineTo(hx + R * 0.36 - 12, hy); ctx.stroke();
    }
    ctx.restore();
  }
  function drawDishView(D, x, y, s, served) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    drawDish(D, served);
    ctx.restore();
  }
  /* środek obrazka dania (do kadrowania w dymku i na karcie) */
  const VIEW_DY = { kanapka: 0, miska: -4, szklanka: -15, rozek: -48, nalesnik: 0, pizza: 0, zupa: -4, muffinka: -30 };
  /* przybliżone wymiary gotowego dania (do wpasowania w dymek, kartę i ladę) */
  const DIM = { kanapka: [216, 216], miska: [210, 140], szklanka: [120, 226], rozek: [100, 250], nalesnik: [216, 216], pizza: [250, 250], zupa: [210, 140], muffinka: [130, 180] };
  function fitScale(type, maxW, maxH) { const d = DIM[type]; return Math.min(maxW / d[0], maxH / d[1]); }
  function drawDishFit(D, x, y, maxW, maxH) { const sc = fitScale(D.type, maxW, maxH); drawDishView(D, x - (D.type === 'pizza' ? 20 * sc : 0), y - (VIEW_DY[D.type] || 0) * sc, sc, true); }
  function drawBubble(c) {
    if (c.bubbleK <= 0) return;
    const k = easeBack(c.bubbleK);
    const happy = c.phase === 'happy';
    const bx = happy ? 830 : 620, by = 60, bw = happy ? 130 : 250, bh = happy ? 110 : 190;
    const hy = COUNTER_Y - (c.look.kid ? 150 : 206);
    ctx.save();
    ctx.translate(bx + bw, by + bh / 2); ctx.scale(k, k); ctx.translate(-(bx + bw), -(by + bh / 2));
    ctx.fillStyle = 'rgba(59,53,80,.12)'; rr(bx + 4, by + 8, bw, bh, 34); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; rr(bx, by, bw, bh, 34); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx + bw - 12, by + bh * 0.45); ctx.lineTo(c.x - 60, hy - 10); ctx.lineTo(bx + bw - 12, by + bh * 0.75); ctx.fill();
    if (happy) {
      const s = 1 + Math.sin(S.time * 8) * 0.08;
      ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(s, s);
      ctx.fillStyle = C.coral;
      ctx.beginPath(); ctx.moveTo(0, 30);
      ctx.bezierCurveTo(-50, -5, -28, -42, 0, -18); ctx.bezierCurveTo(28, -42, 50, -5, 0, 30); ctx.fill();
    } else {
      drawDishFit(finalDish(S.ch, S.recipe), bx + bw / 2, by + bh / 2 + 2, 210, 160);
    }
    ctx.restore();
  }

  // ---------- rysowanie kuchni ----------
  function drawBackground() {
    ctx.fillStyle = C.wall; ctx.fillRect(0, 0, W, COUNTER_Y);
    ctx.fillStyle = C.tiles; ctx.fillRect(0, COUNTER_Y - 108, W, 108);
    ctx.strokeStyle = C.tileLine; ctx.lineWidth = 2; ctx.beginPath();
    for (let r = 0; r < 3; r++) {
      const y = COUNTER_Y - 108 + r * 36;
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      for (let x = (r % 2) * 27; x < W; x += 54) { ctx.moveTo(x, y); ctx.lineTo(x, y + 36); }
    }
    ctx.stroke();
    const wx = 330, wy = 86, ww = 250, wh = 160;
    ctx.fillStyle = '#FFFFFF'; rr(wx - 12, wy - 12, ww + 24, wh + 24, 16); ctx.fill();
    const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
    g.addColorStop(0, '#9FD3E8'); g.addColorStop(1, '#DDF1F7');
    ctx.save(); rr(wx, wy, ww, wh, 8); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    circle(wx + 190, wy + 44, 34, 'rgba(255,214,107,.35)'); circle(wx + 190, wy + 44, 22, '#FFD66B');
    ellipse(wx + 60, wy + wh + 30, 150, 70, '#9ED08A'); ellipse(wx + 220, wy + wh + 40, 140, 70, '#86C474');
    ctx.fillStyle = '#8A5A3B'; ctx.fillRect(wx + 70, wy + 80, 10, 50);
    circle(wx + 75, wy + 70, 30, '#5FAE5A'); circle(wx + 58, wy + 86, 20, '#5FAE5A');
    ellipse(wx + 120, wy + 40, 30, 10, '#FFFFFF'); ellipse(wx + 140, wy + 34, 22, 10, '#FFFFFF');
    ctx.restore();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(wx + ww / 2 - 5, wy, 10, wh); ctx.fillRect(wx, wy + wh / 2 - 5, ww, 10);
    rr(wx - 22, wy + wh + 8, ww + 44, 14, 6); ctx.fill();
    ctx.fillStyle = C.coral; rr(wx - 26, wy - 30, ww + 52, 24, 10); ctx.fill();
    for (let i = 0; i < 9; i++) circle(wx - 12 + i * 34, wy - 6, 14, C.coral);
    circle(wx - 6, wy + wh + 2, 16, '#E7A0B4'); circle(wx + 10, wy + wh - 6, 13, '#F3C14E');
    ctx.fillStyle = '#C66A4A'; rr(wx - 24, wy + wh + 6, 46, 26, 8); ctx.fill();
    const ry = 78;
    ctx.fillStyle = '#B8BEC8'; rr(640, ry, 230, 8, 4); ctx.fill();
    ctx.strokeStyle = '#B8BEC8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(680, ry + 4); ctx.lineTo(680, ry + 120); ctx.stroke();
    ellipse(680, ry + 132, 20, 15, '#B8BEC8');
    ctx.strokeStyle = '#9A5B34'; ctx.beginPath(); ctx.moveTo(750, ry + 4); ctx.lineTo(750, ry + 100); ctx.stroke();
    ctx.fillStyle = '#3B3550'; rr(735, ry + 96, 30, 44, 6); ctx.fill();
    ctx.strokeStyle = '#B8BEC8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(820, ry + 4); ctx.lineTo(820, ry + 70);
    for (const w of [10, 16, 20]) ctx.ellipse(820, ry + 100, w, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#C98A57'; ctx.fillRect(0, COUNTER_Y, W, 32);
    ctx.fillStyle = '#DDA570'; ctx.fillRect(0, COUNTER_Y, W, 12);
    if (SPR.worktop) spr('worktop');
    else { ctx.fillStyle = C.worktop; ctx.fillRect(0, COUNTER_Y + 32, W, H - COUNTER_Y - 32); }
  }
  function wantedIng() {
    if (!canAct()) return null;
    const st = curStep();
    if (st.type === 'place' || st.type === 'smear' || st.type === 'sprinkle' || st.type === 'pour' || (st.type === 'cut' && S.cut.phase === 'drop')) return st.ing;
    return null;
  }
  function drawBins() {
    const want = wantedIng();
    for (const b of BINS) {
      const hint = want === b.ing && S.idle > S.df.hintAt;
      spr('crate_back', b.x, b.y);
      let rot = 0;
      if (S.wiggle === b.ing && S.wiggleT > 0) rot = Math.sin(S.wiggleT * 30) * 0.18 * S.wiggleT;
      const k = 1 + 0.15 * b.pop + (hint ? 0.08 * Math.sin(S.time * 8) : 0);
      ctx.save(); ctx.translate(b.x + b.w / 2, b.y + 44); ctx.rotate(rot); ctx.scale(k, k);
      for (const [name, dx, dy, s, r] of ING[b.ing].box) spr(name, dx, dy, s, (r || 0) * Math.PI / 180);
      ctx.restore();
      spr('crate_front', b.x, b.y);
      if (hint) {
        ctx.save(); ctx.strokeStyle = C.coral; ctx.lineWidth = 5 + Math.sin(S.time * 8) * 2;
        rr(b.x - 6, b.y - 6, b.w + 12, b.h + 12, 22); ctx.stroke(); ctx.restore();
      }
    }
  }
  function drawLeft() {
    if (S.ch.left === 'piekarnik') { drawOven(); return; }
    spr('deska', LEFT.x, LEFT.y);
    const c = S.cut;
    if (c.veg) {
      const I = ING[c.veg], k = I.hs, wv = I.wv * k;
      const left = VEG_AT.x - wv / 2, edge = left + wv * (1 - (c.slices / c.n) * 0.8);
      ctx.save(); ctx.beginPath(); ctx.rect(left - 40, VEG_AT.y - 90, edge - left + 40, 180); ctx.clip();
      spr(I.held, VEG_AT.x, VEG_AT.y, k);
      ctx.restore();
      if (c.slices > 0 && c.slices < c.n) { ctx.save(); ctx.translate(edge, VEG_AT.y); spr(I.slice, 0, 0, 0.5, 0); ctx.restore(); }
      for (let i = c.flown || 0; i < c.slices; i++) { const p = sliceSpot(i); spr(I.slice, p.x, p.y); }
      if (c.phase === 'chop') {
        const down = c.knifeT > 0 ? Math.sin((c.knifeT / 0.2) * Math.PI) : 0;
        spr('tasak', edge, VEG_AT.y - 46 + down * 44 + Math.sin(S.time * 5) * 4, 0.8);
      }
    } else spr('noz', LEFT.x + 150, LEFT.y + 158, 0.75);
  }
  function drawOven() {
    spr('piekarnik', LEFT.x, LEFT.y);
    const O = S.oven, gx = LEFT.x + 28, gy = LEFT.y + 74;
    if (O && (O.phase === 'baking' || O.phase === 'ready')) {
      ctx.save(); rr(gx + 2, gy + 2, 220, 96, 14); ctx.clip();
      const glow = ctx.createRadialGradient(gx + 112, gy + 60, 10, gx + 112, gy + 60, 140);
      glow.addColorStop(0, 'rgba(255,170,60,.9)'); glow.addColorStop(1, 'rgba(120,40,10,.6)');
      ctx.fillStyle = glow; ctx.fillRect(gx, gy, 224, 100);
      const D = S.D, T = TYPES[D.type];
      drawDishView(D, gx + 112, gy + 56 - (VIEW_DY[D.type] || 0) * 0.42, 0.42 * (T.s || 1), false);
      ctx.restore();
      if (O.phase === 'baking') drawRing(LEFT.x + 140, LEFT.y - 22, clamp(O.t / (S.df.cook + 0.5), 0, 1));
      else {
        const p = 1 + Math.sin(S.time * 8) * 0.06;
        ctx.save(); ctx.translate(LEFT.x + 140, LEFT.y - 22); ctx.scale(p, p);
        circle(0, 0, 26, C.mint); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-2, 8); ctx.lineTo(12, -8); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.time * 6); ctx.strokeStyle = C.mint; ctx.lineWidth = 6;
        rr(LEFT.x - 6, LEFT.y - 6, LEFT.w + 12, LEFT.h + 12, 26); ctx.stroke(); ctx.restore();
      }
    }
  }
  function drawRing(x, y, k) {
    circle(x, y, 28, 'rgba(255,255,255,.95)');
    ctx.strokeStyle = '#EADCC6'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = C.coral; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
    drawFlame(x, y + 2, 0.5);
  }
  function drawFlame(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#FF8A3A';
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.bezierCurveTo(16, -6, 14, 14, 0, 16); ctx.bezierCurveTo(-14, 14, -16, -6, 0, -24); ctx.fill();
    ctx.fillStyle = '#FFD25A';
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.bezierCurveTo(8, 2, 7, 12, 0, 13); ctx.bezierCurveTo(-7, 12, -8, 2, 0, -8); ctx.fill();
    ctx.restore();
  }
  function drawPlacemat() {
    const r = BOARD;
    ctx.fillStyle = 'rgba(90,50,15,.15)'; rr(r.x + 2, r.y + 8, r.w, r.h, 18); ctx.fill();
    ctx.fillStyle = '#F6EAD5'; rr(r.x, r.y, r.w, r.h, 18); ctx.fill();
    ctx.strokeStyle = '#EADBC0'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let x = r.x + 6; x < r.x + r.w; x += 10) { ctx.moveTo(x, r.y + 4); ctx.lineTo(x, r.y + r.h - 4); }
    for (let y = r.y + 6; y < r.y + r.h; y += 10) { ctx.moveTo(r.x + 4, y); ctx.lineTo(r.x + r.w - 4, y); }
    ctx.stroke();
    ctx.strokeStyle = '#E2CFAE'; ctx.lineWidth = 2; rr(r.x, r.y, r.w, r.h, 18); ctx.stroke();
    ctx.fillStyle = 'rgba(232,119,90,.75)';
    for (const yy of [16, 26, r.h - 31, r.h - 21]) ctx.fillRect(r.x + 12, r.y + yy, r.w - 24, 5);
  }
  function drawStation() {
    drawPlacemat();
    const d = S.drag, D = S.D, a = dishAt(), sc = dishS();
    const holdingDish = d && d.kind === 'dish';
    if (!holdingDish && !S.dishHidden) drawDishView(D, a.x, a.y, sc, false);
    if (!canAct()) return;
    const st = curStep();
    // przerywana ramka: gdzie upuścić
    if (d && d.kind === 'ing') {
      const zone = st.type === 'cut' && st.ing === d.ing && S.cut.phase === 'drop' ? LEFT : st.type === 'place' && st.ing === d.ing ? BOARD : null;
      if (zone) dashed(zone);
    }
    if (holdingDish && st.type === 'bake') dashed(LEFT);
    if (st.type === 'pour') drawPourTarget(st);
    if ((st.type === 'serve' || (st.type === 'bake' && S.oven && S.oven.phase === 'drop')) && !holdingDish) glow(BOARD, C.mint);
    if (st.type === 'stir' && !(d && d.kind === 'stir')) {
      const R = regionOf(D), cx = a.x + R.cx * sc, cy = D.type === 'szklanka' ? a.y + 20 : a.y + R.cy * sc;
      spr('lyzka_drewno', cx + 30, cy - 40, 0.8);
      drawStirDots(st);
    }
    if (st.type === 'stir' && d && d.kind === 'stir') drawStirDots(st);
    if (st.type === 'cook' && S.proc) {
      const P = S.proc;
      if (P.phase === 'cook' || P.phase === 'cook2') drawRing(a.x + 150, a.y - 92, clamp(P.t / (P.phase === 'cook' ? P.dur : P.dur * 0.5), 0, 1));
      if (P.phase === 'flip') {
        glow(BOARD, C.mint);
        const p = 1 + Math.sin(S.time * 8) * 0.1;
        ctx.save(); ctx.translate(a.x + 150, a.y - 92); ctx.scale(p, p);
        circle(0, 0, 28, C.mint);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, 13, -2.6, 1.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(-3, 13); ctx.lineTo(1, 6); ctx.stroke();
        ctx.restore();
      }
    }
  }
  function drawStirDots(st) {
    const a = dishAt();
    for (let k = 0; k < st.n; k++) {
      const x = a.x - (st.n - 1) * 13 + k * 26, y = BOARD.y + BOARD.h - 14;
      circle(x, y, 9, k < st.cnt ? C.coral : '#FFFFFF');
      ctx.strokeStyle = C.coral; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function dashed(z) {
    ctx.save(); ctx.setLineDash([16, 12]); ctx.lineDashOffset = -S.time * 40;
    ctx.strokeStyle = C.coral; ctx.lineWidth = 5; rr(z.x - 8, z.y - 8, z.w + 16, z.h + 16, 30); ctx.stroke();
    ctx.restore();
  }
  function glow(z, col) {
    ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.time * 5);
    ctx.strokeStyle = col; ctx.lineWidth = 6; rr(z.x - 6, z.y - 6, z.w + 12, z.h + 12, 26); ctx.stroke();
    ctx.restore();
  }
  /* cel nalewania: kreska na szklance/foremce, okrąg na patelni albo miarka obok garnka i miski */
  function drawPourTarget(st) {
    const D = S.D, a = dishAt(), lo = st.n - S.df.band, hi = st.n + S.df.band;
    ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = C.coral; ctx.lineWidth = 4;
    if (D.type === 'szklanka') {
      const y = a.y + 89 - st.n * 190;
      ctx.beginPath(); ctx.moveTo(a.x - 66, y); ctx.lineTo(a.x + 66, y); ctx.stroke();
    } else if (D.type === 'muffinka') {
      const y = a.y - 14 - 10 - st.n * 34;
      ctx.beginPath(); ctx.moveTo(a.x - 62, y); ctx.lineTo(a.x + 62, y); ctx.stroke();
    } else if (D.type === 'nalesnik') {
      ctx.beginPath(); ctx.arc(a.x, a.y, 86 * Math.sqrt(st.n), 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.setLineDash([]);
      const g = GAUGE;
      ctx.fillStyle = '#FFFFFF'; rr(g.x, g.y, g.w, g.h, 13); ctx.fill();
      ctx.strokeStyle = '#C9D4DD'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(123,200,164,.35)';
      ctx.fillRect(g.x + 3, g.y + g.h * (1 - hi), g.w - 6, g.h * (hi - lo));
      const h = g.h * D.fill;
      ctx.fillStyle = D.liquid || ING[st.ing].pour === '#FFFFFF' ? (D.liquid || '#DDE8F0') : ING[st.ing].pour;
      if (h > 0) { rr(g.x + 4, g.y + g.h - h, g.w - 8, h, 8); ctx.fillStyle = mixColor(ING[st.ing].pour, '#9BB8CC', 0.25); ctx.fill(); }
      ctx.strokeStyle = C.coral; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(g.x - 8, g.y + g.h * (1 - st.n)); ctx.lineTo(g.x + g.w + 8, g.y + g.h * (1 - st.n)); ctx.stroke();
    }
    ctx.restore();
  }
  function drawPiggy() {
    const b = S.piggyT, s = 1 + Math.sin(b * Math.PI) * 0.12;
    ctx.save(); ctx.translate(PIGGY.x, PIGGY.y); ctx.scale(s, 1 / s); spr('swinka'); ctx.restore();
    const txt = String(S.money), w = 54 + txt.length * 22, x = PIGGY.x - 52, y = PIGGY.y + 62;
    ctx.fillStyle = 'rgba(90,50,15,.15)'; rr(x, y + 3, w, 48, 24); ctx.fill();
    ctx.fillStyle = '#FFFBF3'; rr(x, y, w, 48, 24); ctx.fill();
    ctx.strokeStyle = '#EAD3A8'; ctx.lineWidth = 2; ctx.stroke();
    spr('moneta', x + 25, y + 23, 0.9);
    ctx.fillStyle = C.ink; ctx.font = `800 32px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + 50, y + 25);
  }
  function drawCard() {
    if (!S.steps.length) return;
    const r = cardLayout();
    ctx.fillStyle = 'rgba(59,53,80,.14)'; rr(r.x + 4, r.y + 8, r.w, r.h, 26); ctx.fill();
    ctx.fillStyle = '#FFFBF3'; rr(r.x, r.y, r.w, r.h, 26); ctx.fill();
    ctx.strokeStyle = '#EADCC6'; ctx.lineWidth = 2; ctx.stroke();
    S.steps.forEach((st, i) => {
      const tw = r.w - 30, th = r.th, tx = r.x + 15, ty = r.y + 14 + i * r.step;
      const done = i < S.stepIdx, cur = i === S.stepIdx && canAct();
      ctx.save();
      if (!done && !cur) ctx.globalAlpha = 0.5;
      const pulse = cur ? 1 + Math.sin(S.time * 5) * 0.04 : 1;
      ctx.translate(tx + tw / 2, ty + th / 2); ctx.scale(pulse, pulse);
      ctx.fillStyle = done ? '#E2F4EA' : cur ? '#FFFFFF' : '#F4EEE6'; rr(-tw / 2, -th / 2, tw, th, 20); ctx.fill();
      if (cur) { ctx.strokeStyle = C.coral; ctx.lineWidth = 5; ctx.stroke(); }
      drawStepIcon(st, i, done, tw, th);
      if (done) {
        circle(tw / 2 - 8, -th / 2 + 8, 15, '#5DB98A');
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(tw / 2 - 16, -th / 2 + 8); ctx.lineTo(tw / 2 - 10, -th / 2 + 14); ctx.lineTo(tw / 2, -th / 2 + 2); ctx.stroke();
      }
      ctx.restore();
    });
  }
  function dotsRow(n, filled, y) {
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * 20;
      circle(x, y, 7, k < filled ? C.coral : '#FFFFFF');
      ctx.strokeStyle = C.coral; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function drawStepIcon(st, i, done, tw, th) {
    const I = ING[st.ing] || {}, big = Math.min(tw - 16, th - 12), withDots = st.n > 1 && (st.type === 'place' || st.type === 'cut' || st.type === 'stir');
    const iy = withDots ? -8 : 0, ih = withDots ? big - 18 : big;
    const filled = done ? st.n : i === S.stepIdx ? (st.type === 'cut' ? S.cut.slices : st.cnt) : 0;
    switch (st.type) {
      case 'place': sprFit(I.icon || I.held || st.ing, 0, iy, big, ih); break;
      case 'cut': sprFit(I.held, -4, iy, big, ih); spr('tasak', 26, iy + 18, 0.24); break;
      case 'smear': sprFit(st.ing + '_box', -12, iy + 4, big * 0.7, ih * 0.7); sprFit(I.tool, 20, iy - 4, big * 0.55, ih * 0.75); break;
      case 'sprinkle': case 'pour': sprFit(st.ing + '_box', 0, iy, big, ih); break;
      case 'stir': sprFit('lyzka_drewno', 0, iy, big * 0.7, ih); {
        ctx.strokeStyle = C.coral; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, iy, ih * 0.36, 0.3, 5.2); ctx.stroke();
      } break;
      case 'cook': drawFlame(0, iy, Math.min(1.4, big / 40)); break;
      case 'bake': sprFit('piekarnik', 0, iy, big, ih); break;
      case 'serve': {
        drawDishFit(finalDish(S.ch, S.recipe), -6, iy, big, ih);
        ctx.strokeStyle = '#5DB98A'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(18, -th / 2 + 26); ctx.lineTo(38, -th / 2 + 8); ctx.moveTo(26, -th / 2 + 8); ctx.lineTo(38, -th / 2 + 8); ctx.lineTo(37, -th / 2 + 20); ctx.stroke();
        break;
      }
    }
    if (withDots) dotsRow(st.n, filled, th / 2 - 14);
  }
  function drawProgress() {
    if (!S.queue.length) return;
    const n = S.queue.length, x0 = 230;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 52, y = 36;
      if (i < S.served) spr('moneta', x, y);
      else {
        circle(x, y, 20, i === S.served ? '#FFFFFF' : 'rgba(255,255,255,.55)');
        ctx.strokeStyle = i === S.served ? C.coral : '#E2C9A6'; ctx.lineWidth = i === S.served ? 4 : 3;
        ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
        circle(x, y - 3, 7, i === S.served ? C.coral : '#E2C9A6');
        ctx.beginPath(); ctx.arc(x, y + 14, 11, Math.PI, Math.PI * 2); ctx.fill();
      }
    }
  }
  function drawRoundBtn(b, kind) {
    circle(b.x, b.y, b.r, 'rgba(255,255,255,.85)');
    ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
    if (kind === 'sound') {
      ctx.beginPath(); ctx.moveTo(b.x - 14, b.y - 6); ctx.lineTo(b.x - 6, b.y - 6); ctx.lineTo(b.x + 4, b.y - 15); ctx.lineTo(b.x + 4, b.y + 15); ctx.lineTo(b.x - 6, b.y + 6); ctx.lineTo(b.x - 14, b.y + 6); ctx.fill();
      ctx.beginPath();
      if (soundOn) { ctx.arc(b.x + 6, b.y, 8, -0.9, 0.9); ctx.moveTo(b.x + 6 + Math.cos(-0.9) * 14, b.y + Math.sin(-0.9) * 14); ctx.arc(b.x + 6, b.y, 14, -0.9, 0.9); }
      else { ctx.moveTo(b.x + 10, b.y - 8); ctx.lineTo(b.x + 22, b.y + 8); ctx.moveTo(b.x + 22, b.y - 8); ctx.lineTo(b.x + 10, b.y + 8); }
      ctx.stroke();
    } else if (kind === 'map') {
      for (let k = 0; k < 4; k++) { rr(b.x - 13 + (k % 2) * 14, b.y - 13 + Math.floor(k / 2) * 14, 12, 12, 3); ctx.fill(); }
    } else if (kind === 'back') {
      ctx.lineWidth = 6; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(b.x + 10, b.y); ctx.lineTo(b.x - 10, b.y); ctx.moveTo(b.x - 2, b.y - 10); ctx.lineTo(b.x - 12, b.y); ctx.lineTo(b.x - 2, b.y + 10); ctx.stroke();
    }
  }
  /* rączka-podpowiedź */
  function drawHand(x, y, press) {
    ctx.save(); ctx.translate(x, y); const s = 1 - press * 0.12; ctx.scale(s, s); ctx.rotate(-0.25);
    const shapes = [[-10, 0, 20, 52, 10], [-26, 36, 56, 54, 20], [-40, 44, 22, 32, 11]];
    ctx.fillStyle = C.ink; for (const [a, b, w, h, r] of shapes) { rr(a - 4, b - 4, w + 8, h + 8, r + 4); ctx.fill(); }
    ctx.fillStyle = '#FFFFFF'; for (const [a, b, w, h, r] of shapes) { rr(a, b, w, h, r); ctx.fill(); }
    ctx.restore();
  }
  function hintPath() {
    const st = curStep(), a = dishAt(), sc = dishS(), D = S.D;
    const bc = (ing) => { const b = binOf(ing); return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : a; };
    const ar = areaOf(D), ac = ar ? { x: a.x + ar.cx * sc, y: a.y + ar.cy * sc } : a;
    switch (st.type) {
      case 'place': return { mode: 'drag', from: bc(st.ing), to: a, ing: st.ing };
      case 'smear': case 'sprinkle': return { mode: 'rub', from: bc(st.ing), to: ac };
      case 'pour': return { mode: 'drag', from: bc(st.ing), to: { x: a.x, y: a.y - 60 } };
      case 'cut': return S.cut.phase === 'drop' ? { mode: 'drag', from: bc(st.ing), to: VEG_AT, ing: st.ing } : S.cut.phase === 'chop' ? { mode: 'tap', from: { x: VEG_AT.x + 10, y: VEG_AT.y } } : null;
      case 'stir': { const R = regionOf(D); return { mode: 'circle', to: { x: a.x + R.cx * sc, y: D.type === 'szklanka' ? a.y + 20 : a.y + R.cy * sc } }; }
      case 'cook': return S.proc && S.proc.phase === 'flip' ? { mode: 'tap', from: a } : null;
      case 'bake': return !S.oven ? null : S.oven.phase === 'drop' ? { mode: 'drag', from: a, to: { x: LEFT.x + 140, y: LEFT.y + 110 } } : S.oven.phase === 'ready' ? { mode: 'tap', from: { x: LEFT.x + 140, y: LEFT.y + 120 } } : null;
      case 'serve': return { mode: 'drag', from: a, to: { x: CUST_X - 40, y: COUNTER_Y - 40 } };
    }
    return null;
  }
  function drawHint() {
    if (!canAct() || S.drag || S.idle < S.df.hintAt + 4) return;
    const h = hintPath(); if (!h) return;
    const k = (S.time % 2.2) / 2.2;
    let x, y, press = 0;
    if (h.mode === 'tap') { x = h.from.x; y = h.from.y; press = Math.abs(Math.sin(k * Math.PI * 4)); }
    else if (h.mode === 'circle') { const an = k * Math.PI * 4; x = h.to.x + Math.cos(an) * 50; y = h.to.y + Math.sin(an) * 30; press = 1; }
    else if (h.mode === 'rub') {
      if (k < 0.25) { const m = easeOut(k / 0.25); x = lerp(h.from.x, h.to.x, m); y = lerp(h.from.y, h.to.y, m); }
      else { const an = (k - 0.25) * Math.PI * 6; x = h.to.x + Math.cos(an) * 45; y = h.to.y + Math.sin(an * 1.5) * 32; }
      press = 1;
    } else {
      const m = easeOut(clamp((k - 0.15) / 0.6, 0, 1));
      x = lerp(h.from.x, h.to.x, m); y = lerp(h.from.y, h.to.y, m);
      press = k > 0.1 && k < 0.8 ? 1 : 0;
      if (press && h.ing) { ctx.save(); ctx.globalAlpha = 0.55; const I = ING[h.ing]; spr(I.held || h.ing, x, y, (I.hs || 1) * 0.8); ctx.restore(); }
    }
    drawHand(x, y, press);
  }
  /* to, co dziecko trzyma pod palcem */
  function drawHeld(d, x, y, s = 1) {
    if (d.kind === 'dish') {
      const T = TYPES[S.D.type];
      ellipse(x + 4, y + 70, 90 * s, 18 * s, 'rgba(90,50,15,.15)');
      drawDishView(S.D, x, y, 0.9 * s * (T.s || 1), false);
      return;
    }
    if (d.kind === 'stir') { spr('lyzka_drewno', x + 18, y - 40, 1); return; }
    if (d.kind === 'tool') {
      const I = ING[d.ing];
      const pouring = I.pour && canAct() && curStep().type === 'pour' && curStep().ing === d.ing && inRect(d, BOARD, 40) && s === 1;
      if (pouring) {
        ctx.save(); ctx.strokeStyle = I.pour === '#FFFFFF' ? '#F2F6FA' : I.pour; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 44, y - 6); ctx.quadraticCurveTo(x - 56, y + 30, x - 54, y + 70 + Math.sin(S.time * 30) * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        spr(I.tool, x, y - 30, 1, -0.9);
      } else if (I.sprinkle) spr(I.tool, x, y - 30, s, Math.sin(S.time * 25) * 0.25 - 0.4);
      else spr(I.tool, x, y, 1.1 * s);
      return;
    }
    const I = ING[d.ing];
    ellipse(x + 8, y + 50, 50 * s, 13 * s, 'rgba(80,40,10,.15)');
    spr(I.held || d.ing, x, y, (I.hs || 1) * s);
  }
  function drawParts() {
    for (const p of parts) {
      ctx.save(); ctx.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1); ctx.fillStyle = p.color;
      if (p.local) { const a = dishAt(); ctx.translate(a.x + p.x, a.y + p.y); } else ctx.translate(p.x, p.y);
      if (p.confetti) { ctx.rotate(p.rot); ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2); }
      else if (p.star) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? p.r * 0.4 : p.r; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.fill();
      } else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }
  function wordmark(x, y, size) {
    ctx.save();
    ctx.font = `800 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.11;
    ctx.strokeStyle = '#9E3A26'; ctx.fillStyle = '#9E3A26';
    ctx.strokeText('Kuchcik', x, y + size * 0.06); ctx.fillText('Kuchcik', x, y + size * 0.06);
    ctx.strokeStyle = '#D2513A'; ctx.strokeText('Kuchcik', x, y);
    const g = ctx.createLinearGradient(0, y - size * 0.75, 0, y);
    g.addColorStop(0.45, '#FFF6E6'); g.addColorStop(1, '#FFE0B5');
    ctx.fillStyle = g; ctx.fillText('Kuchcik', x, y);
    ctx.restore();
  }
  function drawTitle() {
    ctx.fillStyle = 'rgba(59,53,80,.45)'; ctx.fillRect(0, 0, W, H);
    const bob = Math.sin(S.time * 2) * 4;
    spr('ikona', W / 2 - 100, 110 + bob, 200 / 512);
    wordmark(W / 2, 440, 124);
    const s = 1 + Math.sin(S.time * 4) * 0.05;
    ctx.save(); ctx.translate(PLAY_BTN.x, PLAY_BTN.y); ctx.scale(s, s);
    circle(0, 12, PLAY_BTN.r, '#B8492F'); circle(0, 0, PLAY_BTN.r + 6, '#FFF3DF'); circle(0, 0, PLAY_BTN.r, C.coral);
    ctx.fillStyle = '#FFFFFF'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(32, 0); ctx.lineTo(-20, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (artLeft > 0) { ctx.fillStyle = '#FFFFFF'; ctx.font = `600 22px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('…', W / 2, 690); }
  }
  function drawMap() {
    ctx.fillStyle = C.wall; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#F1DDBF';
    for (let y = 0; y < H; y += 40) for (let x = (y / 40) % 2 ? 20 : 0; x < W; x += 40) circle(x, y, 2, 'rgba(214,180,130,.35)');
    drawRoundBtn({ x: 60, y: 50, r: 32 }, 'back');
    wordmark(W / 2, 96, 64);
    for (let ci = 0; ci < CHAPTERS.length; ci++) {
      const ch = CHAPTERS[ci], x = mapCol(ci), y = MAP.y0, w = MAP.cw, h = 548;
      const first = ci * LEVELS_PER, locked = first > prog.unlocked;
      const nDone = [0, 1, 2, 3, 4].filter((k) => prog.done[first + k]).length;
      ctx.save();
      if (locked) ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'rgba(59,53,80,.12)'; rr(x + 3, y + 8, w, h, 26); ctx.fill();
      ctx.fillStyle = nDone === LEVELS_PER ? '#E8F6EE' : '#FFFBF3'; rr(x, y, w, h, 26); ctx.fill();
      ctx.strokeStyle = nDone === LEVELS_PER ? '#9FD9BC' : '#EADCC6'; ctx.lineWidth = 3; ctx.stroke();
      circle(x + w / 2, y + 62, 48, locked ? '#EEE6DA' : '#FBE9D8');
      sprFit(ch.icon, x + w / 2, y + 62, 74, 70);
      ctx.fillStyle = C.ink; ctx.font = `700 19px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch.name, x + w / 2, y + 132);
      ctx.restore();
      for (let li = 0; li < LEVELS_PER; li++) {
        const lv = first + li, cx = x + w / 2, cy = MAP.btnY0 + li * MAP.btnDy;
        const lk = lv > prog.unlocked, dn = !!prog.done[lv], next = !lk && !dn;
        if (li < LEVELS_PER - 1) { ctx.strokeStyle = prog.done[lv] ? '#9FD9BC' : '#EADCC6'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy + MAP.btnR); ctx.lineTo(cx, cy + MAP.btnDy - MAP.btnR); ctx.stroke(); }
        const p = next ? 1 + Math.sin(S.mapT * 5) * 0.07 : 1;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p);
        circle(0, 5, MAP.btnR, lk ? '#D9CFC2' : dn ? '#4FA77B' : '#B8492F');
        circle(0, 0, MAP.btnR, lk ? '#EEE6DA' : dn ? C.mint : C.coral);
        if (lk) spr('klodka', 0, 4, 0.55);
        else {
          ctx.fillStyle = '#FFFFFF'; ctx.font = `800 28px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(li + 1), 0, 1);
          if (dn) { ctx.save(); ctx.translate(MAP.btnR - 6, -MAP.btnR + 6); spr('moneta', 0, 0, 0.55); ctx.restore(); }
        }
        ctx.restore();
        // kropki trudności
        for (let k = 0; k < 5; k++) circle(cx + MAP.btnR + 10, cy - 16 + k * 8, 2.6, k < li + 1 ? (lk ? '#CFC3B3' : C.coral) : '#E8DCCB');
      }
    }
  }
  function drawDone() {
    const k = clamp(S.doneT * 2, 0, 1);
    ctx.fillStyle = `rgba(59,53,80,${0.4 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 320); const s = easeBack(k); ctx.scale(s, s);
    ctx.fillStyle = C.white; rr(-290, -240, 580, 430, 40); ctx.fill();
    spr('czapka', 0, -160, 0.75);
    for (let i = 0; i < 3; i++) {
      const a = clamp(S.doneT * 2 - 0.6 - i * 0.3, 0, 1);
      if (a <= 0) continue;
      ctx.save(); ctx.translate(-110 + i * 110, -30 - (i === 1 ? 24 : 0)); ctx.scale(easeBack(a), easeBack(a));
      ctx.fillStyle = C.gold; ctx.strokeStyle = C.goldDark; ctx.lineWidth = 5; ctx.beginPath();
      for (let j = 0; j < 10; j++) { const an = (j / 10) * Math.PI * 2 - Math.PI / 2, r = j % 2 ? 22 : 48; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    spr('swinka', -70, 96, 0.6);
    spr('moneta', 10, 96, 1.2);
    ctx.fillStyle = C.ink; ctx.font = `800 52px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(String(S.money), 40, 98);
    ctx.restore();
    if (S.doneT > 1) {
      const p = 1 + Math.sin(S.time * 5) * 0.06;
      const last = S.lv === TOTAL_LEVELS - 1;
      const mb = { x: last ? W / 2 : W / 2 - 80, y: 590, r: 50 };
      circle(mb.x, mb.y + 6, mb.r, 'rgba(59,53,80,.2)'); drawRoundBtn(mb, 'map');
      if (!last) {
        ctx.save(); ctx.translate(W / 2 + 80, 590); ctx.scale(p, p);
        circle(0, 6, 64, 'rgba(59,53,80,.2)'); circle(0, 0, 64, C.mint);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.moveTo(4, -22); ctx.lineTo(26, 0); ctx.lineTo(4, 22); ctx.stroke();
        ctx.restore();
      }
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = C.worktop; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(DPR * scale, 0, 0, DPR * scale, DPR * offX, DPR * offY);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    if (S.scene === 'map') { drawMap(); drawRoundBtn(SOUND_BTN, 'sound'); ctx.restore(); return; }
    drawBackground();
    if (S.scene === 'play' || S.scene === 'done') {
      if (S.cust) { drawPerson(S.cust); drawBubble(S.cust); }
      if (S.plate && S.cust) {
        const k = 1 - S.plate.bites / 3 * 0.85;
        drawDishFit(S.plate.D, S.cust.x - 20, COUNTER_Y - 40, 150 * k, 130 * k);
      }
      drawBins();
      drawLeft();
      drawStation();
      drawPiggy();
      drawCard();
      drawProgress();
      for (const f of fx) f.draw(clamp(f.t / f.dur, 0, 1));
      if (S.drag) drawHeld(S.drag, S.drag.x, S.drag.y);
      drawHint();
      drawParts();
      if (S.scene === 'done') drawDone();
      drawRoundBtn(MAP_BTN, 'map');
    } else {
      if (SPR.worktop) {
        layoutBins(CHAPTERS[0]);
        S.ch = CHAPTERS[0];
        drawBins(); spr('deska', LEFT.x, LEFT.y); drawPlacemat(); drawPiggy();
      }
      drawTitle();
    }
    drawRoundBtn(SOUND_BTN, 'sound');
    ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- do testów w konsoli ----------
  window.__kuchcik = {
    S, prog, CHAPTERS,
    ready: () => artLeft === 0,
    step(sec) { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); draw(); },
    startGame() { start(); },
    loadLevel(n) { startLevel(n); },
    unlockAll() { prog.unlocked = TOTAL_LEVELS - 1; store.set('kuchcik-prog', prog); },
    /* wykonuje bieżący krok przepisu tak, jakby zrobiło to dziecko */
    auto() {
      if (!canAct()) return 'czekaj';
      const st = curStep(), D = S.D, a = dishAt();
      switch (st.type) {
        case 'place': S.drag = { kind: 'ing', ing: st.ing, x: a.x, y: a.y }; drop(a); break;
        case 'smear': {
          S.drag = { kind: 'tool', ing: st.ing, x: 0, y: 0 };
          const ar = areaOf(D), sc = dishS();
          for (const c of ar.cells) { if (!S.drag) break; paint({ x: a.x + c.x * sc, y: a.y + c.y * sc }); }
          break;
        }
        case 'sprinkle': {
          const d = { kind: 'tool', ing: st.ing, x: 0, y: 0 }; S.drag = d;
          const ar = areaOf(D), sc = dishS();
          for (let i = 0; i < 400 && S.drag; i++) { const an = i * 0.7, r = 30 + (i % 5) * 8; sprinkle({ x: a.x + (ar.cx + Math.cos(an) * r) * sc, y: a.y + (ar.cy + Math.sin(an) * r * 0.6) * sc }, d); }
          break;
        }
        case 'pour': D.liquid = ING[st.ing].pour; D.fill = st.n; completeStep(); break;
        case 'cut':
          if (S.cut.phase === 'drop') { S.drag = { kind: 'ing', ing: st.ing, x: VEG_AT.x, y: VEG_AT.y }; drop(VEG_AT); }
          else if (S.cut.phase === 'chop') { S.cut.cool = 0; chop(); }
          break;
        case 'stir': {
          S.drag = { kind: 'stir', x: 0, y: 0 }; S.stir = null;
          const R = regionOf(D), c = { x: a.x + R.cx * dishS(), y: D.type === 'szklanka' ? a.y + 20 : a.y + R.cy * dishS() };
          for (let i = 0; i <= st.n * 16 + 2 && S.drag; i++) { const an = i * Math.PI / 8; stirMove({ x: c.x + Math.cos(an) * 60, y: c.y + Math.sin(an) * 40 }); }
          break;
        }
        case 'cook': if (S.proc && S.proc.phase === 'flip') flip(); break;
        case 'bake':
          if (S.oven.phase === 'drop') { S.drag = { kind: 'dish', x: 0, y: 0 }; drop({ x: LEFT.x + 140, y: LEFT.y + 100 }); }
          else if (S.oven.phase === 'ready') takeOut();
          break;
        case 'serve': S.drag = { kind: 'dish', x: CUST_X, y: 200 }; drop({ x: CUST_X, y: 200 }); break;
      }
      return st.type;
    },
  };
})();
