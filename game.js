'use strict';
/* Kuchcik – gra w gotowanie dla najmłodszych. Prototyp: kanapki.
   Canvas + czysty JavaScript, bez bibliotek. Świat gry ma 1280×720 jednostek i skaluje się do ekranu.
   Klient (człowiek) przychodzi do lady i pokazuje w dymku obrazek kanapki. Dziecko robi ją
   według obrazkowego przepisu (lewy pasek), podaje klientowi i dostaje monety do skarbonki. */
(() => {
  const W = 1280, H = 720;
  const COUNTER_Y = 330;
  const FONT = 'Outfit, system-ui, sans-serif';
  const C = {
    wall: '#F7E9D3', tiles: '#F1DDBF', tileLine: '#E6CBA4', worktop: '#EFDCBF', grain: '#E6CDA8',
    coral: '#E8775A', mustard: '#E9B44C', mint: '#7BC8A4', ink: '#3B3550', white: '#FFFDF8',
    gold: '#F5C542', goldDark: '#C9952A', butter: '#FBE08A',
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
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
  function ellipse(x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
  /* polska odmiana: 1 moneta, 2 monety, 5 monet */
  function odmiana(n, jeden, kilka, wiele) {
    if (n === 1) return jeden;
    const d = n % 10, st = n % 100;
    return (d >= 2 && d <= 4 && (st < 10 || st > 20)) ? kilka : wiele;
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
    coin: () => { tone(1320, 0.07, 'square', 0.03); tone(1760, 0.3, 'triangle', 0.05, 0.06); },
    bell: () => { tone(1047, 0.6, 'sine', 0.07); tone(784, 0.8, 'sine', 0.07, 0.32); },
    crunch: () => { noise(0.08, 0.22, 900, 0, 1); noise(0.06, 0.18, 1400, 0.09, 1); },
    fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.24, 'triangle', 0.06, i * 0.13)),
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

  // ---------- składniki i przepisy ----------
  const BREAD_OUT = new Path2D('M-78 72 L-78 -10 C-110 -60 -70 -95 -30 -82 C-10 -100 10 -100 30 -82 C70 -95 110 -60 78 -10 L78 72 Q78 82 68 82 L-68 82 Q-78 82 -78 72 Z');
  const BREAD_IN = new Path2D();
  BREAD_IN.addPath(BREAD_OUT, new DOMMatrix().translate(0, 6).scale(0.84, 0.84));
  /* pola na chlebie do liczenia, ile już posmarowano */
  const CELLS = [];
  {
    const tc = document.createElement('canvas').getContext('2d');
    for (let y = -78; y <= 76; y += 13) for (let x = -72; x <= 72; x += 13) if (tc.isPointInPath(BREAD_IN, x, y)) CELLS.push({ x, y, i: CELLS.length });
  }

  const ING = {
    chleb: { draw: drawBread, bin: 0.44, drag: 1.0 },
    maslo: { draw: drawButter, bin: 0.95, drag: 1.0 },
    ser: { draw: drawCheese, bin: 0.5, drag: 1.0 },
    szynka: { draw: drawHam, bin: 0.5, drag: 1.0 },
    salata: { draw: drawLettuce, bin: 0.44, drag: 1.0 },
    pomidor: { draw: drawTomato, bin: 0.82, drag: 1.25, slice: drawTomatoSlice, nom: 'pomidor', acc: 'pomidora' },
    ogorek: { draw: drawCucumber, bin: 0.66, drag: 1.2, slice: drawCucumberSlice, nom: 'ogórek', acc: 'ogórka' },
  };
  const RECIPES = {
    ser: { order: 'kanapkę z serem', steps: ['chleb', 'maslo', 'ser'] },
    pomidor: { order: 'kanapkę z pomidorem', steps: ['chleb', 'maslo', { cut: 'pomidor', n: 3 }] },
    szynka: { order: 'kanapkę z sałatą i szynką', steps: ['chleb', 'maslo', 'salata', 'szynka'] },
    ogorek: { order: 'kanapkę z serem i ogórkiem', steps: ['chleb', 'maslo', 'ser', { cut: 'ogorek', n: 4 }] },
  };
  /* gdzie kładą się składniki na chlebie (względem środka kromki) */
  const PLACE = {
    ser: [{ dx: 0, dy: -2, rot: -0.07 }],
    szynka: [{ dx: 3, dy: 2, rot: 0.1 }],
    salata: [{ dx: 0, dy: -4, rot: 0 }],
    pomidor: [{ dx: -36, dy: -28 }, { dx: 36, dy: -24 }, { dx: 0, dy: 30 }],
    ogorek: [{ dx: -34, dy: -32 }, { dx: 34, dy: -34 }, { dx: -32, dy: 26 }, { dx: 34, dy: 24 }],
  };
  const NUM = ['', 'Jeden', 'Dwa', 'Trzy', 'Cztery', 'Pięć'];
  const PRAISE = ['Super!', 'Brawo!', 'Świetnie!', 'Pięknie!', 'Ekstra!'];
  const THANKS = ['Mniam, pyszne! Dziękuję!', 'Ale smaczne! Dziękuję bardzo!', 'Pycha! Proszę, oto pieniążki.'];

  function stepsOf(key) {
    const out = RECIPES[key].steps.map((s) => typeof s === 'object' ? { type: 'cut', ing: s.cut, n: s.n }
      : s === 'maslo' ? { type: 'spread', ing: 'maslo' } : { type: 'place', ing: s });
    out.push({ type: 'serve' });
    return out;
  }
  function stepSay(st) {
    if (!st) return '';
    if (st.type === 'place') return { chleb: 'Połóż chleb na desce.', ser: 'Połóż ser na chlebie.', szynka: 'Połóż szynkę.', salata: 'Połóż sałatę.' }[st.ing];
    if (st.type === 'spread') return 'Posmaruj chleb masłem. Jeździj nożem po chlebie.';
    if (st.type === 'cut') return S.cut && S.cut.phase !== 'drop'
      ? `Stukaj w ${ING[st.ing].acc}, żeby go pokroić.`
      : `Teraz ${ING[st.ing].nom}. Połóż go na desce do krojenia.`;
    if (st.type === 'serve') return 'Gotowe! Zanieś kanapkę klientowi.';
    return '';
  }
  function emptySandwich() { return { bread: false, butter: [], cells: new Set(), butterFull: false, layers: [], pop: 0 }; }
  function sandwichOf(key) {
    const sw = emptySandwich();
    sw.bread = true; sw.butterFull = true;
    for (const s of RECIPES[key].steps) {
      if (s === 'chleb' || s === 'maslo') continue;
      if (typeof s === 'object') PLACE[s.cut].slice(0, s.n).forEach((p) => sw.layers.push({ ing: s.cut, kind: 'slice', ...p }));
      else sw.layers.push({ ing: s, kind: 'whole', ...PLACE[s][0] });
    }
    return sw;
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

  // ---------- układ sceny ----------
  const BINS = ['chleb', 'maslo', 'ser', 'szynka', 'salata', 'pomidor', 'ogorek']
    .map((ing, i) => ({ ing, x: 190 + i * 112, y: 378, w: 100, h: 92, pop: 0 }));
  const CUTBOARD = { x: 196, y: 500, w: 280, h: 190 };
  const VEG_AT = { x: 300, y: 597 };
  const BOARD = { x: 520, y: 488, w: 350, h: 214 };
  const BREAD = { x: 695, y: 598, s: 1.0 };
  const PIGGY = { x: 1168, y: 428 };
  const CUST_X = 1070;
  const SERVE_ZONE = { x: 600, y: 0, w: 680, h: COUNTER_Y + 50 };
  const SOUND_BTN = { x: 1234, y: 44, r: 30 };
  const PLAY_BTN = { x: W / 2, y: 540, r: 74 };
  const NEXT_BTN = { x: W / 2, y: 590, r: 64 };
  const cardRect = () => ({ x: 14, y: 14, w: 142, h: S.steps.length * 118 + 22 });
  const binOf = (ing) => BINS.find((b) => b.ing === ing);

  // ---------- stan gry ----------
  const S = {
    scene: 'title', level: store.get('kuchcik-level', 1), money: store.get('kuchcik-money', 0),
    queue: [], served: 0, cust: null, nextCustT: 0, recipe: null, steps: [], stepIdx: 0,
    sw: emptySandwich(), swHidden: false, cut: { phase: 'drop', veg: null, slices: 0, n: 0, cool: 0, knifeT: 0 },
    plate: null, drag: null, idle: 0, hintSpoken: false, wiggle: null, wiggleT: 0,
    piggyT: 0, doneT: 0, time: 0, lastLook: -1, lastSwish: 0,
  };
  const fx = [];        // animacje: {t, dur, draw(k), end()}
  const parts = [];     // cząsteczki
  const timers = [];    // opóźnione akcje (liczone w czasie gry)
  const anim = (dur, draw, end) => fx.push({ t: 0, dur, draw, end });
  const later = (t, fn) => timers.push({ t, fn });
  const curStep = () => S.steps[S.stepIdx];
  const canAct = () => S.scene === 'play' && S.cust && (S.cust.phase === 'order' || S.cust.phase === 'wait') && S.stepIdx < S.steps.length;

  function levelOrders(n) {
    if (n === 1) return ['ser', 'pomidor', 'szynka'];
    if (n === 2) return ['szynka', 'ser', 'ogorek'];
    const keys = Object.keys(RECIPES), out = [];
    const count = n >= 4 ? 4 : 3;
    while (out.length < count) {
      const k = pick(keys);
      if (k !== out[out.length - 1]) out.push(k);
    }
    return out;
  }
  function resetBoard() {
    S.sw = emptySandwich(); S.swHidden = false;
    S.cut = { phase: 'drop', veg: null, slices: 0, n: 0, cool: 0, knifeT: 0 };
    S.stepIdx = 0; S.idle = 0; S.hintSpoken = false;
  }
  function startLevel(n) {
    S.level = n; S.scene = 'play';
    S.queue = levelOrders(n); S.served = 0; S.cust = null; S.plate = null; S.drag = null;
    S.steps = []; fx.length = 0; timers.length = 0;
    resetBoard();
    S.nextCustT = 0.8;
  }
  function start() {
    try {
      if (matchMedia('(pointer: coarse)').matches && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
      }
    } catch (e) {}
    startLevel(S.level);
    S.nextCustT = 2.2;
    mow('Witaj w kuchni! Zaraz przyjdzie pierwszy klient.');
  }
  function spawnCustomer() {
    S.recipe = S.queue[S.served];
    S.steps = stepsOf(S.recipe);
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
    sparkle(BREAD.x, BREAD.y - 20, 14);
    S.stepIdx++; S.idle = 0; S.hintSpoken = false;
    const st = curStep();
    if (st && st.type === 'cut') S.cut = { phase: 'drop', veg: null, slices: 0, n: st.n, cool: 0, knifeT: 0 };
    mowWiele([pick(PRAISE), stepSay(st)]);
  }
  function wrong(st) {
    sfx.hmm();
    S.wiggle = st.ing || null; S.wiggleT = 1.2;
    mow('Hmm, to nie to. ' + stepSay(st));
    S.idle = 5;  // od razu podświetl właściwy składnik
  }
  function paint(p) {
    const lx = (p.x - BREAD.x) / BREAD.s, ly = (p.y - BREAD.y) / BREAD.s;
    if (Math.abs(lx) > 115 || Math.abs(ly) > 115) return;
    const sw = S.sw;
    if (sw.butterFull) return;
    const last = sw.butter[sw.butter.length - 1];
    if (!last || Math.hypot(last.x - lx, last.y - ly) > 7) sw.butter.push({ x: lx, y: ly });
    for (const c of CELLS) if (!sw.cells.has(c.i) && Math.hypot(c.x - lx, c.y - ly) < 32) sw.cells.add(c.i);
    if (S.time - S.lastSwish > 0.13) { sfx.swish(); S.lastSwish = S.time; }
    if (sw.cells.size >= CELLS.length * 0.8) {
      sw.butterFull = true;
      const d = S.drag; S.drag = null;
      if (d) flyBack(d);
      completeStep();
    }
  }
  function chop() {
    const c = S.cut;
    if (c.cool > 0 || c.phase !== 'chop') return;
    c.slices++; c.cool = 0.3; c.knifeT = 0.2;
    sfx.chop();
    mow(NUM[c.slices] + '!');
    crumbs(VEG_AT.x + 40, VEG_AT.y, ING[c.veg] === ING.pomidor ? '#F47C6C' : '#CDEBA0', 6);
    if (c.slices >= c.n) {
      c.phase = 'done';
      later(0.7, () => {
        const place = PLACE[c.veg];
        for (let i = 0; i < c.n; i++) {
          const from = sliceSpot(i), to = { x: BREAD.x + place[i].dx, y: BREAD.y + place[i].dy };
          later(i * 0.15, () => {
            c.flown = i + 1;
            anim(0.5, (k) => {
              const x = lerp(from.x, to.x, easeOut(k)), y = lerp(from.y, to.y, easeOut(k)) - Math.sin(k * Math.PI) * 90;
              ctx.save(); ctx.translate(x, y); ING[c.veg].slice(); ctx.restore();
            }, () => {
              S.sw.layers.push({ ing: c.veg, kind: 'slice', ...place[i], pop: 1 });
              sfx.drop();
              if (S.sw.layers.filter((l) => l.kind === 'slice').length >= c.n && c.phase === 'done') {
                c.phase = 'placed'; c.veg = null;
                completeStep();
              }
            });
          });
        }
      });
    }
  }
  function sliceSpot(i) { return { x: CUTBOARD.x + 205 + (i % 2) * 44, y: CUTBOARD.y + 50 + Math.floor(i / 2) * 58 }; }
  function serve() {
    S.plate = { sw: S.sw, bites: 0 };
    S.sw = emptySandwich();
    S.stepIdx = S.steps.length;
    S.cust.phase = 'eat'; S.cust.t = 0;
    sfx.drop();
    sparkle(CUST_X, COUNTER_Y - 10, 10);
  }
  function payCoins(n) {
    const sx = S.cust.x, sy = COUNTER_Y - 110;
    for (let i = 0; i < n; i++) {
      later(0.3 + i * 0.35, () => {
        anim(0.7, (k) => {
          const x = lerp(sx, PIGGY.x, k), y = lerp(sy, PIGGY.y - 40, k) - Math.sin(k * Math.PI) * 110;
          drawCoin(x, y, 20, k * 6);
        }, () => {
          S.money++; store.set('kuchcik-money', S.money);
          S.piggyT = 1; sfx.coin(); sparkle(PIGGY.x, PIGGY.y - 40, 6);
        });
      });
    }
  }
  function levelDone() {
    S.scene = 'done'; S.doneT = 0;
    store.set('kuchcik-level', S.level + 1);
    sfx.fanfare();
    confetti();
    later(0.4, () => mow(`Brawo! Wszyscy klienci są najedzeni. Masz już ${S.money} ${odmiana(S.money, 'monetę', 'monety', 'monet')}!`));
  }
  function flyBack(d) {
    if (d.kind === 'sandwich') {
      S.swHidden = true;
      anim(0.3, (k) => drawHeld(d, lerp(d.x, BREAD.x, easeOut(k)), lerp(d.y, BREAD.y, easeOut(k)), 1 - 0.2 * k), () => { S.swHidden = false; });
      return;
    }
    const b = binOf(d.ing);
    anim(0.32, (k) => drawHeld(d, lerp(d.x, b.x + b.w / 2, easeOut(k)), lerp(d.y, b.y + b.h / 2, easeOut(k)), 1 - 0.5 * k));
  }
  function drop(p) {
    const d = S.drag; S.drag = null;
    if (!d) return;
    if (!canAct()) { flyBack(d); return; }
    const st = curStep();
    if (d.kind === 'sandwich') {
      if (inRect(p, SERVE_ZONE)) serve(); else flyBack(d);
      return;
    }
    if (d.kind === 'knife') { flyBack(d); return; }
    const onBoard = inRect(p, BOARD, 60), onCut = inRect(p, CUTBOARD, 60);
    const right = st.ing === d.ing && (st.type === 'place' || (st.type === 'cut' && S.cut.phase === 'drop'));
    if (right && st.type === 'place' && onBoard) {
      if (d.ing === 'chleb') { S.sw.bread = true; S.sw.pop = 1; }
      else S.sw.layers.push({ ing: d.ing, kind: 'whole', ...PLACE[d.ing][0], pop: 1 });
      sfx.drop();
      completeStep();
      return;
    }
    if (right && st.type === 'cut' && (onBoard || onCut)) {
      S.cut.phase = 'chop'; S.cut.veg = d.ing; S.cut.n = st.n; S.cut.slices = 0;
      sfx.drop(); S.idle = 0; S.hintSpoken = false;
      mow(stepSay(st));
      return;
    }
    flyBack(d);
    if (!right && (onBoard || onCut)) wrong(st);
  }

  // ---------- sterowanie (mysz, palec, rysik) ----------
  function toWorld(e) { return { x: (e.clientX - offX) / scale, y: (e.clientY - offY) / scale }; }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio();
    const p = toWorld(e);
    if (Math.hypot(p.x - SOUND_BTN.x, p.y - SOUND_BTN.y) < SOUND_BTN.r + 12) {
      soundOn = !soundOn; store.set('kuchcik-sound', soundOn);
      if (!soundOn && window.speechSynthesis) window.speechSynthesis.cancel();
      return;
    }
    if (S.scene === 'title') { start(); return; }
    if (S.scene === 'done') {
      if (S.doneT > 1 && Math.hypot(p.x - NEXT_BTN.x, p.y - NEXT_BTN.y) < NEXT_BTN.r + 20) startLevel(S.level + 1);
      return;
    }
    S.idle = 0; S.hintSpoken = false;
    if (S.drag || !canAct()) return;
    if (inRect(p, cardRect())) { mow(stepSay(curStep())); return; }
    const st = curStep();
    if (st.type === 'cut' && S.cut.phase === 'chop' && inRect(p, CUTBOARD, 30)) { chop(); return; }
    if (st.type === 'serve' && inRect(p, BOARD, 20)) {
      S.drag = { kind: 'sandwich', x: p.x, y: p.y, id: e.pointerId };
    } else {
      const b = BINS.find((b) => inRect(p, b, 6));
      if (!b) return;
      b.pop = 1;
      S.drag = { kind: b.ing === 'maslo' ? 'knife' : 'ing', ing: b.ing, x: p.x, y: p.y, id: e.pointerId };
    }
    sfx.pick();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    const d = S.drag;
    if (!d || d.id !== e.pointerId) return;
    const p = toWorld(e);
    d.x = p.x; d.y = p.y;
    if (d.kind === 'knife' && canAct() && curStep().type === 'spread' && S.sw.bread) paint(p);
  });
  const up = (e) => { if (S.drag && S.drag.id === e.pointerId) drop(toWorld(e)); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

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
    S.sw.pop = Math.max(0, S.sw.pop - dt * 4);
    for (const l of S.sw.layers) if (l.pop) l.pop = Math.max(0, l.pop - dt * 4);
    S.wiggleT = Math.max(0, S.wiggleT - dt);
    S.piggyT = Math.max(0, S.piggyT - dt * 3);
    S.cut.cool = Math.max(0, S.cut.cool - dt);
    S.cut.knifeT = Math.max(0, S.cut.knifeT - dt);
    if (S.scene === 'done') S.doneT += dt;
    if (S.scene !== 'play') return;
    updateCustomer(dt);
    // podpowiedzi: po chwili bezczynności świeci właściwy składnik, potem pokazuje rączka i lektor powtarza
    if (canAct() && !S.drag) {
      S.idle += dt;
      if (S.idle > 10 && !S.hintSpoken) { S.hintSpoken = true; mow(stepSay(curStep())); }
      if (S.idle > 20) { S.idle = 8; S.hintSpoken = false; }
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
          const say = `Dzień dobry! Poproszę ${RECIPES[S.recipe].order}.`;
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
          payCoins(RECIPES[S.recipe].steps.length);
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
          else { resetBoard(); S.steps = []; S.nextCustT = 0.5; }
        }
        break;
    }
    const showBubble = c.phase === 'order' || c.phase === 'wait' || c.phase === 'happy';
    c.bubbleK = clamp(c.bubbleK + (showBubble ? dt * 3 : -dt * 5), 0, 1);
  }

  // ---------- rysowanie składników (środek w 0,0) ----------
  function drawBread() {
    ctx.fillStyle = '#C98A4B'; ctx.fill(BREAD_OUT);
    ctx.fillStyle = '#F6DFAE'; ctx.fill(BREAD_IN);
    ctx.fillStyle = 'rgba(214,170,104,.45)';
    for (const [x, y, r] of [[-30, -30, 4], [20, -45, 3], [35, 10, 4], [-15, 25, 3], [10, 45, 4], [-45, 40, 3], [45, -20, 3]]) circle(x, y, r, 'rgba(214,170,104,.45)');
  }
  function drawButter() {
    ellipse(0, 20, 46, 14, '#9CC9E8');
    ellipse(0, 17, 40, 10, '#BFDDF2');
    ctx.fillStyle = C.butter; rr(-30, -20, 60, 36, 8); ctx.fill();
    ctx.fillStyle = '#FFF0B3'; rr(-30, -20, 60, 12, 6); ctx.fill();
  }
  function drawCheese() {
    ctx.fillStyle = '#F7C948'; rr(-70, -62, 140, 124, 14); ctx.fill();
    ctx.strokeStyle = '#E3AE2E'; ctx.lineWidth = 4; ctx.stroke();
    for (const [x, y, r] of [[-32, -22, 12], [26, -32, 9], [12, 16, 14], [-36, 32, 8], [42, 30, 10], [-6, -44, 6]]) circle(x, y, r, '#E3AA2C');
  }
  function drawHam() {
    ellipse(0, 0, 76, 64, '#E5838D');
    ellipse(0, 0, 68, 56, '#F4A9B0');
    ellipse(-22, -16, 20, 9, 'rgba(255,232,234,.75)', 0.4);
    ellipse(24, 14, 16, 7, 'rgba(255,232,234,.7)', -0.3);
    ellipse(10, -30, 10, 5, 'rgba(255,232,234,.6)', 0.2);
  }
  function drawLettuce() {
    ctx.fillStyle = '#6DB948';
    ctx.beginPath(); ctx.ellipse(0, 0, 80, 66, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      circle(Math.cos(a) * 80, Math.sin(a) * 66, 20, '#6DB948');
    }
    ellipse(0, 0, 70, 56, '#8FD16A');
    ctx.strokeStyle = '#C9EDB0'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, -60);
    for (const y of [-30, 0, 30]) { ctx.moveTo(0, y + 12); ctx.lineTo(-34, y - 10); ctx.moveTo(0, y + 12); ctx.lineTo(34, y - 10); }
    ctx.stroke();
  }
  function drawTomato() {
    ellipse(0, 4, 44, 40, '#E5483B');
    ellipse(-15, -8, 12, 8, 'rgba(255,255,255,.35)', -0.5);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ellipse(Math.cos(a) * 11, -34 + Math.sin(a) * 6, 13, 5, '#4F9D3A', a);
    }
    ctx.fillStyle = '#3E7F2D'; rr(-3, -46, 6, 12, 3); ctx.fill();
  }
  function drawTomatoSlice() {
    circle(0, 0, 27, '#E5483B');
    circle(0, 0, 22, '#F47C6C');
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.3;
      ellipse(Math.cos(a) * 12, Math.sin(a) * 12, 8, 6, '#E9574A', a);
      ellipse(Math.cos(a) * 12, Math.sin(a) * 12, 2.5, 1.6, '#FBE7A1', a);
    }
    circle(0, 0, 5, '#F9A090');
  }
  function drawCucumber() {
    ctx.fillStyle = '#4E9A3D'; rr(-62, -20, 124, 40, 20); ctx.fill();
    ctx.strokeStyle = '#6DB656'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (const y of [-8, 4]) { ctx.moveTo(-48, y); ctx.lineTo(44, y); }
    ctx.stroke();
    ellipse(58, 0, 6, 16, '#7FC566');
  }
  function drawCucumberSlice() {
    circle(0, 0, 21, '#3F8A35');
    circle(0, 0, 17, '#D7F0A8');
    circle(0, 0, 10, '#C4E58F');
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ellipse(Math.cos(a) * 6, Math.sin(a) * 6, 2, 1.3, '#F2FAD9', a); }
  }
  function drawKnife(butter) {
    ctx.save(); ctx.rotate(-0.55);
    ctx.fillStyle = '#D9DEE6'; rr(-13, -40, 26, 66, 13); ctx.fill();
    ctx.strokeStyle = '#AEB6C2'; ctx.lineWidth = 3; ctx.stroke();
    if (butter) ellipse(0, -18, 13, 16, C.butter);
    ctx.fillStyle = '#9A5B34'; rr(-10, 24, 20, 58, 10); ctx.fill();
    circle(0, 40, 3, '#E8D3B8'); circle(0, 64, 3, '#E8D3B8');
    ctx.restore();
  }
  function drawCleaver(x, y) {
    ctx.fillStyle = '#9A5B34'; rr(x - 10, y - 150, 20, 56, 9); ctx.fill();
    ctx.fillStyle = '#D9DEE6'; rr(x - 32, y - 100, 64, 100, 8); ctx.fill();
    ctx.strokeStyle = '#AEB6C2'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#F4F6F9'; ctx.fillRect(x - 32, y - 12, 64, 8);
    circle(x + 16, y - 82, 6, '#AEB6C2');
  }
  function drawCoin(x, y, r, spin = 0) {
    const sx = Math.abs(Math.cos(spin)) * 0.75 + 0.25;
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    circle(0, 0, r, C.goldDark);
    circle(0, -1.5, r - 2, C.gold);
    circle(0, -1.5, r - 6, '#FFD966');
    ctx.fillStyle = C.goldDark;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rad = i % 2 ? r * 0.22 : r * 0.5;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad - 1.5);
    }
    ctx.fill();
    ctx.restore();
  }
  function drawSandwich(sw, x, y, s, eaten = 0) {
    if (!sw.bread) return;
    const k = s * (1 + 0.08 * sw.pop) * (1 - eaten);
    if (k <= 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    drawBread();
    ctx.save(); ctx.clip(BREAD_IN);
    ctx.fillStyle = C.butter;
    if (sw.butterFull) ctx.fill(BREAD_IN);
    else for (const p of sw.butter) circle(p.x, p.y, 25, C.butter);
    ctx.restore();
    for (const l of sw.layers) {
      ctx.save(); ctx.translate(l.dx, l.dy); ctx.rotate(l.rot || 0);
      const ps = 1 + 0.12 * (l.pop || 0); ctx.scale(ps, ps);
      if (l.kind === 'slice') ING[l.ing].slice(); else ING[l.ing].draw();
      ctx.restore();
    }
    ctx.restore();
  }
  function drawPlate(x, y, s) {
    ellipse(x, y + 6 * s, 120 * s, 40 * s, 'rgba(0,0,0,.12)');
    ellipse(x, y, 120 * s, 40 * s, '#FFFFFF');
    ellipse(x, y, 92 * s, 28 * s, '#EEF2F5');
  }
  /* to, co dziecko trzyma pod palcem */
  function drawHeld(d, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y);
    if (d.kind === 'sandwich') {
      drawPlate(0, 60, 1.05 * s);
      drawSandwich(S.sw, 0, 0, 0.95 * s);
    } else if (d.kind === 'knife') {
      ctx.scale(1.3 * s, 1.3 * s); drawKnife(true);
    } else {
      const k = ING[d.ing].drag * s;
      ctx.scale(k, k);
      ellipse(8, 60, 60, 16, 'rgba(80,40,10,.15)');
      ING[d.ing].draw();
    }
    ctx.restore();
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
    // tułów i ręce
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
    // głowa
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
    // twarz
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
      drawPlate(bx + bw / 2, by + bh / 2 + 52, 0.82);
      drawSandwich(sandwichOf(S.recipe), bx + bw / 2, by + bh / 2 - 2, 0.66);
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
    // okno
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
    // przybory na relingu
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
    // lada
    ctx.fillStyle = '#C98A57'; ctx.fillRect(0, COUNTER_Y, W, 32);
    ctx.fillStyle = '#DDA570'; ctx.fillRect(0, COUNTER_Y, W, 12);
    ctx.fillStyle = C.worktop; ctx.fillRect(0, COUNTER_Y + 32, W, H - COUNTER_Y - 32);
    ctx.fillStyle = 'rgba(80,40,10,.10)'; ctx.fillRect(0, COUNTER_Y + 32, W, 10);
    ctx.strokeStyle = C.grain; ctx.lineWidth = 3; ctx.beginPath();
    for (let y = COUNTER_Y + 80; y < H; y += 70) { ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y - 12, W * 0.6, y + 14, W, y - 4); }
    ctx.stroke();
  }
  function drawBins() {
    const st = canAct() ? curStep() : null;
    const want = st && (st.type === 'place' || st.type === 'spread' || (st.type === 'cut' && S.cut.phase === 'drop')) ? st.ing : null;
    for (const b of BINS) {
      const hint = want === b.ing && S.idle > 5;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      ctx.fillStyle = 'rgba(80,40,10,.12)'; rr(b.x + 3, b.y + 6, b.w, b.h, 20); ctx.fill();
      ctx.fillStyle = '#FFF8EE'; rr(b.x, b.y, b.w, b.h, 20); ctx.fill();
      ctx.strokeStyle = hint ? C.coral : '#E2C9A6'; ctx.lineWidth = hint ? 6 + Math.sin(S.time * 8) * 2 : 3; ctx.stroke();
      let rot = 0;
      if (S.wiggle === b.ing && S.wiggleT > 0) rot = Math.sin(S.wiggleT * 30) * 0.18 * S.wiggleT;
      const s = ING[b.ing].bin * (1 + 0.15 * b.pop + (hint ? 0.06 * Math.sin(S.time * 8) : 0));
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s); ING[b.ing].draw(); ctx.restore();
    }
  }
  function drawCutStation() {
    const r = CUTBOARD;
    ctx.fillStyle = 'rgba(80,40,10,.15)'; rr(r.x + 4, r.y + 8, r.w, r.h, 26); ctx.fill();
    ctx.fillStyle = '#D79E66'; rr(r.x, r.y, r.w, r.h, 26); ctx.fill();
    ctx.fillStyle = '#E4B37E'; rr(r.x + 10, r.y + 10, r.w - 20, r.h - 20, 20); ctx.fill();
    circle(r.x + r.w - 26, r.y + 30, 10, '#B07A47');
    const c = S.cut;
    if (c.veg) {
      const k = ING[c.veg].drag, wv = (c.veg === 'pomidor' ? 90 : 128) * k;
      const left = VEG_AT.x - wv / 2, edge = left + wv * (1 - (c.slices / c.n) * 0.8);
      ctx.save(); ctx.beginPath(); ctx.rect(left - 10, VEG_AT.y - 80, edge - left + 10, 160); ctx.clip();
      ctx.translate(VEG_AT.x, VEG_AT.y); ctx.scale(k, k); ING[c.veg].draw();
      ctx.restore();
      if (c.slices > 0 && c.slices < c.n) ellipse(edge, VEG_AT.y, 5, c.veg === 'pomidor' ? 40 : 20, c.veg === 'pomidor' ? '#F47C6C' : '#D7F0A8');
      for (let i = c.flown || 0; i < c.slices; i++) { const p = sliceSpot(i); ctx.save(); ctx.translate(p.x, p.y); ING[c.veg].slice(); ctx.restore(); }
      if (c.phase === 'chop') {
        const down = c.knifeT > 0 ? Math.sin((c.knifeT / 0.2) * Math.PI) : 0;
        const hover = Math.sin(S.time * 5) * 4;
        drawCleaver(edge, VEG_AT.y - 52 + down * 48 + hover);
      }
    } else {
      ctx.save(); ctx.translate(r.x + r.w / 2 - 20, r.y + r.h - 34); ctx.rotate(-Math.PI / 2); ctx.scale(0.8, 0.8);
      ctx.fillStyle = '#9A5B34'; rr(-10, 40, 20, 60, 9); ctx.fill();
      ctx.fillStyle = '#D9DEE6'; ctx.beginPath(); ctx.moveTo(-14, 44); ctx.lineTo(-14, -80); ctx.quadraticCurveTo(10, -60, 14, 44); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  function drawBoard() {
    const r = BOARD;
    ctx.fillStyle = 'rgba(80,40,10,.15)'; rr(r.x + 4, r.y + 8, r.w, r.h, 40); ctx.fill();
    ctx.fillStyle = '#C99561'; rr(r.x, r.y, r.w, r.h, 40); ctx.fill();
    ctx.fillStyle = '#E7BC8A'; rr(r.x + 10, r.y + 10, r.w - 20, r.h - 20, 32); ctx.fill();
    const d = S.drag;
    const holdingSandwich = d && d.kind === 'sandwich';
    if (!holdingSandwich && !S.swHidden) drawSandwich(S.sw, BREAD.x, BREAD.y, BREAD.s);
    // gdzie upuścić – przerywana ramka podczas przeciągania
    if (d && d.kind !== 'sandwich' && canAct()) {
      const st = curStep();
      const zone = st.type === 'cut' && st.ing === d.ing && S.cut.phase === 'drop' ? CUTBOARD
        : st.type === 'place' && st.ing === d.ing ? BOARD : null;
      if (zone) {
        ctx.save(); ctx.setLineDash([16, 12]); ctx.lineDashOffset = -S.time * 40;
        ctx.strokeStyle = C.coral; ctx.lineWidth = 5; rr(zone.x - 8, zone.y - 8, zone.w + 16, zone.h + 16, 34); ctx.stroke();
        ctx.restore();
      }
    }
    if (canAct() && curStep().type === 'serve' && !holdingSandwich) {
      ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.time * 5);
      ctx.strokeStyle = C.mint; ctx.lineWidth = 6; rr(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 44); ctx.stroke();
      ctx.restore();
    }
  }
  function drawPiggy() {
    const b = S.piggyT, s = 1 + Math.sin(b * Math.PI) * 0.12;
    ctx.save(); ctx.translate(PIGGY.x, PIGGY.y); ctx.scale(s, 1 / s);
    ellipse(4, 46, 62, 12, 'rgba(80,40,10,.12)');
    ctx.fillStyle = '#E98FA5';
    for (const x of [-34, -12, 14, 36]) { rr(x - 9, 22, 18, 26, 7); ctx.fill(); }
    ellipse(0, 0, 66, 46, '#F4A3B5');
    ctx.beginPath(); ctx.moveTo(-34, -30); ctx.lineTo(-24, -58); ctx.lineTo(-8, -38); ctx.fillStyle = '#E98FA5'; ctx.fill();
    ellipse(-62, 4, 16, 20, '#EE8FA4');
    circle(-66, 0, 3.5, '#B5576D'); circle(-58, 8, 3.5, '#B5576D');
    circle(-34, -10, 5, '#3B3550');
    ctx.fillStyle = '#B5576D'; rr(-10, -44, 34, 7, 3.5); ctx.fill();
    ctx.strokeStyle = '#E98FA5'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(64, -6); ctx.bezierCurveTo(82, -16, 84, 6, 72, 4); ctx.stroke();
    ctx.restore();
    drawCoin(PIGGY.x - 30, PIGGY.y + 84, 20);
    ctx.fillStyle = C.ink; ctx.font = `700 36px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(String(S.money), PIGGY.x - 2, PIGGY.y + 86);
  }
  function drawCard() {
    if (!S.steps.length) return;
    const r = cardRect();
    ctx.fillStyle = 'rgba(59,53,80,.14)'; rr(r.x + 4, r.y + 8, r.w, r.h, 26); ctx.fill();
    ctx.fillStyle = C.white; rr(r.x, r.y, r.w, r.h, 26); ctx.fill();
    S.steps.forEach((st, i) => {
      const tx = r.x + 15, ty = r.y + 14 + i * 118, tw = r.w - 30, th = 104;
      const done = i < S.stepIdx, cur = i === S.stepIdx && canAct();
      ctx.save();
      if (!done && !cur) ctx.globalAlpha = 0.45;
      const pulse = cur ? 1 + Math.sin(S.time * 5) * 0.04 : 1;
      ctx.translate(tx + tw / 2, ty + th / 2); ctx.scale(pulse, pulse);
      ctx.fillStyle = done ? '#DDF3E8' : cur ? '#FFF1E8' : '#F4EEE6'; rr(-tw / 2, -th / 2, tw, th, 20); ctx.fill();
      if (cur) { ctx.strokeStyle = C.coral; ctx.lineWidth = 5; ctx.stroke(); }
      drawStepIcon(st, i, done);
      if (done) {
        circle(tw / 2 - 8, -th / 2 + 8, 16, C.mint);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(tw / 2 - 16, -th / 2 + 8); ctx.lineTo(tw / 2 - 10, -th / 2 + 14); ctx.lineTo(tw / 2, -th / 2 + 2); ctx.stroke();
      }
      ctx.restore();
    });
  }
  function drawStepIcon(st, i, done) {
    if (st.type === 'place') { ctx.save(); const s = ING[st.ing].bin * 0.95; ctx.scale(s, s); ING[st.ing].draw(); ctx.restore(); return; }
    if (st.type === 'spread') {
      ctx.save(); ctx.scale(0.38, 0.38); drawBread(); ctx.save(); ctx.clip(BREAD_IN); ctx.fillStyle = C.butter; ctx.fill(BREAD_IN); ctx.restore(); ctx.restore();
      ctx.save(); ctx.translate(26, -8); ctx.scale(0.6, 0.6); drawKnife(true); ctx.restore();
      return;
    }
    if (st.type === 'cut') {
      ctx.save(); ctx.translate(0, -12); const s = ING[st.ing].bin * 0.8; ctx.scale(s, s); ING[st.ing].draw(); ctx.restore();
      const filled = done ? st.n : i === S.stepIdx ? S.cut.slices : 0;
      for (let k = 0; k < st.n; k++) {
        const x = (k - (st.n - 1) / 2) * 22, y = 34;
        circle(x, y, 8, k < filled ? C.coral : '#FFFFFF');
        ctx.strokeStyle = C.coral; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
      }
      return;
    }
    // podaj: talerz z kanapką i strzałka do klienta
    drawPlate(-8, 22, 0.36);
    drawSandwich(sandwichOf(S.recipe), -8, 2, 0.26);
    ctx.strokeStyle = C.mint; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(14, -16); ctx.lineTo(38, -36); ctx.moveTo(24, -38); ctx.lineTo(38, -36); ctx.lineTo(37, -22); ctx.stroke();
  }
  function drawProgress() {
    if (!S.queue.length) return;
    const n = S.queue.length, x0 = 640 - ((n - 1) * 56) / 2 - 300;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 56, y = 36;
      if (i < S.served) drawCoin(x, y, 20);
      else {
        circle(x, y, 20, i === S.served ? '#FFFFFF' : 'rgba(255,255,255,.55)');
        ctx.strokeStyle = i === S.served ? C.coral : '#E2C9A6'; ctx.lineWidth = i === S.served ? 4 : 3;
        ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
        // główka klienta
        circle(x, y - 3, 7, i === S.served ? C.coral : '#E2C9A6');
        ctx.beginPath(); ctx.arc(x, y + 14, 11, Math.PI, Math.PI * 2); ctx.fill();
      }
    }
  }
  function drawSoundBtn() {
    const b = SOUND_BTN;
    circle(b.x, b.y, b.r, 'rgba(255,255,255,.8)');
    ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.moveTo(b.x - 14, b.y - 6); ctx.lineTo(b.x - 6, b.y - 6); ctx.lineTo(b.x + 4, b.y - 15); ctx.lineTo(b.x + 4, b.y + 15); ctx.lineTo(b.x - 6, b.y + 6); ctx.lineTo(b.x - 14, b.y + 6); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
    if (soundOn) { ctx.arc(b.x + 6, b.y, 8, -0.9, 0.9); ctx.moveTo(b.x + 6 + Math.cos(-0.9) * 14, b.y + Math.sin(-0.9) * 14); ctx.arc(b.x + 6, b.y, 14, -0.9, 0.9); }
    else { ctx.moveTo(b.x + 10, b.y - 8); ctx.lineTo(b.x + 22, b.y + 8); ctx.moveTo(b.x + 22, b.y - 8); ctx.lineTo(b.x + 10, b.y + 8); }
    ctx.stroke();
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
    const st = curStep();
    const bc = (ing) => { const b = binOf(ing); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
    if (st.type === 'place') return { mode: 'drag', from: bc(st.ing), to: { x: BREAD.x, y: BREAD.y }, ing: st.ing };
    if (st.type === 'spread') return { mode: 'rub', from: bc('maslo') };
    if (st.type === 'cut') return S.cut.phase === 'drop' ? { mode: 'drag', from: bc(st.ing), to: { x: VEG_AT.x, y: VEG_AT.y }, ing: st.ing } : S.cut.phase === 'chop' ? { mode: 'tap', from: { x: VEG_AT.x + 10, y: VEG_AT.y } } : null;
    if (st.type === 'serve') return { mode: 'drag', from: { x: BREAD.x, y: BREAD.y }, to: { x: CUST_X - 40, y: COUNTER_Y - 40 } };
    return null;
  }
  function drawHint() {
    if (!canAct() || S.drag || S.idle < 8) return;
    const h = hintPath(); if (!h) return;
    const k = (S.time % 2.2) / 2.2;
    let x, y, press = 0;
    if (h.mode === 'tap') { x = h.from.x; y = h.from.y; press = Math.abs(Math.sin(k * Math.PI * 4)); }
    else if (h.mode === 'rub') {
      if (k < 0.25) { const m = easeOut(k / 0.25); x = lerp(h.from.x, BREAD.x, m); y = lerp(h.from.y, BREAD.y, m); }
      else { const a = (k - 0.25) * Math.PI * 6; x = BREAD.x + Math.cos(a) * 50; y = BREAD.y + Math.sin(a * 1.5) * 40; }
      press = 1;
    } else {
      const m = easeOut(clamp((k - 0.15) / 0.6, 0, 1));
      x = lerp(h.from.x, h.to.x, m); y = lerp(h.from.y, h.to.y, m);
      press = k > 0.1 && k < 0.8 ? 1 : 0;
      if (press && h.ing) { ctx.save(); ctx.globalAlpha = 0.55; ctx.translate(x, y); const s = ING[h.ing].drag * 0.8; ctx.scale(s, s); ING[h.ing].draw(); ctx.restore(); }
    }
    drawHand(x, y, press);
  }
  function drawParts() {
    for (const p of parts) {
      ctx.save(); ctx.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1); ctx.fillStyle = p.color; ctx.translate(p.x, p.y);
      if (p.confetti) { ctx.rotate(p.rot); ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2); }
      else if (p.star) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? p.r * 0.4 : p.r; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.fill();
      } else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }
  function drawChefHat(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#E2C9A6'; ctx.lineWidth = 4;
    for (const [cx, cy, r] of [[-38, -10, 32], [0, -32, 40], [38, -10, 32]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    rr(-50, -4, 100, 54, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#F2EBE1'; ctx.fillRect(-48, 30, 96, 6);
    ctx.restore();
  }
  function drawTitle() {
    ctx.fillStyle = 'rgba(59,53,80,.35)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.white; rr(W / 2 - 300, 120, 600, 340, 40); ctx.fill();
    drawChefHat(W / 2, 205, 1.1);
    ctx.font = `700 104px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.coral; ctx.fillText('Kuchcik', W / 2, 345);
    ctx.save(); ctx.translate(W / 2 + 200, 420); ctx.scale(0.45, 0.45); drawSandwich(sandwichOf('szynka'), 0, 0, 1); ctx.restore();
    ctx.save(); ctx.translate(W / 2 - 200, 420); ctx.scale(0.8, 0.8); drawTomato(); ctx.restore();
    const s = 1 + Math.sin(S.time * 4) * 0.05;
    ctx.save(); ctx.translate(PLAY_BTN.x, PLAY_BTN.y); ctx.scale(s, s);
    circle(0, 6, PLAY_BTN.r, 'rgba(59,53,80,.2)'); circle(0, 0, PLAY_BTN.r, C.coral);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(-22, -34); ctx.lineTo(38, 0); ctx.lineTo(-22, 34); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawDone() {
    const k = clamp(S.doneT * 2, 0, 1);
    ctx.fillStyle = `rgba(59,53,80,${0.35 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 330); const s = easeBack(k); ctx.scale(s, s);
    ctx.fillStyle = C.white; rr(-280, -230, 560, 420, 40); ctx.fill();
    drawChefHat(0, -140, 0.8);
    for (let i = 0; i < 3; i++) {
      const a = clamp(S.doneT * 2 - 0.6 - i * 0.3, 0, 1);
      if (a <= 0) continue;
      ctx.save(); ctx.translate(-110 + i * 110, -20 - (i === 1 ? 24 : 0)); ctx.scale(easeBack(a), easeBack(a));
      ctx.fillStyle = C.gold; ctx.strokeStyle = C.goldDark; ctx.lineWidth = 5; ctx.beginPath();
      for (let j = 0; j < 10; j++) { const an = (j / 10) * Math.PI * 2 - Math.PI / 2, r = j % 2 ? 22 : 48; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    drawCoin(-40, 90, 26);
    ctx.fillStyle = C.ink; ctx.font = `700 52px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(String(S.money), -6, 92);
    ctx.restore();
    if (S.doneT > 1) {
      const p = 1 + Math.sin(S.time * 5) * 0.06;
      ctx.save(); ctx.translate(NEXT_BTN.x, NEXT_BTN.y); ctx.scale(p, p);
      circle(0, 6, NEXT_BTN.r, 'rgba(59,53,80,.2)'); circle(0, 0, NEXT_BTN.r, C.mint);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.moveTo(4, -22); ctx.lineTo(26, 0); ctx.lineTo(4, 22); ctx.stroke();
      ctx.restore();
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = C.worktop; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(DPR * scale, 0, 0, DPR * scale, DPR * offX, DPR * offY);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    drawBackground();
    if (S.cust) { drawPerson(S.cust); drawBubble(S.cust); }
    if (S.plate && S.cust) {
      drawPlate(S.cust.x - 20, COUNTER_Y + 8, 0.62);
      drawSandwich(S.plate.sw, S.cust.x - 20, COUNTER_Y - 8, 0.5, S.plate.bites / 3);
    }
    drawBins();
    drawCutStation();
    drawBoard();
    drawPiggy();
    drawCard();
    drawProgress();
    for (const f of fx) f.draw(clamp(f.t / f.dur, 0, 1));
    if (S.drag) drawHeld(S.drag, S.drag.x, S.drag.y);
    drawHint();
    drawParts();
    if (S.scene === 'title') drawTitle();
    if (S.scene === 'done') drawDone();
    drawSoundBtn();
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
    S,
    step(sec) { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); draw(); },
    startGame() { start(); },
    loadLevel(n) { startLevel(n); },
    /* wykonuje bieżący krok przepisu tak, jakby zrobiło to dziecko */
    auto() {
      if (!canAct()) return 'czekaj';
      const st = curStep();
      if (st.type === 'place') { S.drag = { kind: 'ing', ing: st.ing, x: BREAD.x, y: BREAD.y }; drop({ x: BREAD.x, y: BREAD.y }); }
      else if (st.type === 'spread') { S.drag = { kind: 'knife', ing: 'maslo', x: 0, y: 0 }; for (const c of CELLS) paint({ x: BREAD.x + c.x, y: BREAD.y + c.y }); }
      else if (st.type === 'cut') {
        if (S.cut.phase === 'drop') { S.drag = { kind: 'ing', ing: st.ing, x: VEG_AT.x, y: VEG_AT.y }; drop(VEG_AT); }
        else if (S.cut.phase === 'chop') { S.cut.cool = 0; chop(); }
      } else if (st.type === 'serve') { S.drag = { kind: 'sandwich', x: CUST_X, y: 200 }; drop({ x: CUST_X, y: 200 }); }
      return st.type;
    },
  };
})();
