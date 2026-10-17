'use strict';
/* Forja — treinos para o ginásio de casa.
   Dados: no próprio dispositivo (localStorage). Sincronização opcional com um repositório GitHub privado do utilizador.
   IA: opcional, com a chave gratuita do Gemini de cada utilizador, guardada só no dispositivo.
   Exercícios e imagens: Free Exercise DB (domínio público). */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const LS = {
  get(k, d){ try { const v = localStorage.getItem('forja.' + k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem('forja.' + k, JSON.stringify(v)); } catch(e){ toast('Sem espaço para guardar no dispositivo.'); } }
};
const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const API = 'https://generativelanguage.googleapis.com/v1beta/';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const vibrar = p => { try { navigator.vibrate && navigator.vibrate(p); } catch(e){} };
const pad = n => String(n).padStart(2, '0');
const num = x => Number(x || 0).toLocaleString('pt-PT', {maximumFractionDigits: 1});
const DIA = 864e5;

/* ---------- Catálogos ---------- */
const ICONES = {
  corpo: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M7 10.5l5-2.5 5 2.5M9 21l3-7 3 7"/>',
  halteres: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  barra: '<path d="M2 12h20M5 7v10M7.5 8.5v7M19 7v10M16.5 8.5v7"/>',
  banco: '<rect x="3" y="9" width="18" height="3" rx="1"/><path d="M6 12v8M18 12v8M4 20h4M16 20h4"/>',
  rack: '<path d="M6 3v18M18 3v18M3 21h6M15 21h6M3 9h18M6 13h2M16 13h2"/>',
  elevacoes: '<path d="M3 4h18"/><circle cx="12" cy="10" r="1.8"/><path d="M8 4v4l4 4 4-4V4M12 12v5M10 21l2-4 2 4"/>',
  kettlebell: '<path d="M8.5 8.5a3.5 3.5 0 1 1 7 0"/><path d="M7 9.5h10l1.5 3.5A6 6 0 0 1 12 21a6 6 0 0 1-6.5-8z"/>',
  elasticos: '<path d="M3 17c3-10 5-10 6 0s3 10 6 0 4-10 6 0"/>',
  paralelas: '<path d="M3 8h8M13 8h8M5 8v13M9 8v13M15 8v13M19 8v13"/>',
  cabos: '<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V17M9 17h6M4 3v18M20 3v18"/>',
  maquinas: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M12 15v3"/>',
  barraEZ: '<path d="M2 12h4l2-2 2 4 2-4 2 4 2-2h6M4 8v8M20 8v8"/>',
  bolaMed: '<circle cx="12" cy="12" r="8"/><path d="M4.5 9.5c5 2 10 2 15 0M4.5 14.5c5-2 10-2 15 0"/>',
  bolaSuica: '<circle cx="12" cy="11" r="8"/><path d="M7 20h10M8 6.5a6 6 0 0 1 4-1.5"/>',
  rolo: '<ellipse cx="6" cy="12" rx="3" ry="6"/><path d="M6 6h12M6 18h12"/><ellipse cx="18" cy="12" rx="3" ry="6"/>',
  caixa: '<path d="M4 8l8-4 8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9"/>',
  trx: '<path d="M12 2v3M12 5l-5 13M12 5l5 13M5 18h4M15 18h4"/>',
  rodaAbs: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5"/><path d="M2 12h4M18 12h4"/>',
  corda: '<path d="M5 4v5M19 4v5M5 9c0 14 14 14 14 0"/>'
};
const svg = (d, w = 1.7) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  visto: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.4), x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  trocar: svg('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'), menu: svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', 2.4),
  video: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>'), voltar: svg('<path d="M15 5l-7 7 7 7"/>', 2),
  mais: svg('<path d="M12 5v14M5 12h14"/>', 2), estrela: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  cima: svg('<path d="M6 15l6-6 6 6"/>', 2), baixo: svg('<path d="M6 9l6 6 6-6"/>', 2), lixo: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>')
};
const EQUIP = [
  ['corpo', 'Peso corporal', 1], ['halteres', 'Halteres', 1], ['barra', 'Barra e discos', 1], ['banco', 'Banco ajustável', 1],
  ['rack', 'Rack / suporte', 1], ['elevacoes', 'Barra de elevações', 1], ['kettlebell', 'Kettlebell', 1], ['elasticos', 'Elásticos', 1],
  ['paralelas', 'Paralelas', 0], ['cabos', 'Polia / cabos', 0], ['maquinas', 'Máquinas', 0], ['barraEZ', 'Barra EZ', 0],
  ['bolaMed', 'Bola medicinal', 0], ['bolaSuica', 'Bola suíça', 0], ['rolo', 'Rolo de espuma', 0], ['caixa', 'Caixa pliométrica', 0],
  ['trx', 'TRX / fitas', 0], ['rodaAbs', 'Roda abdominal', 0], ['corda', 'Corda de saltar', 0]
].map(([id, nome, base]) => ({id, nome, base: !!base}));
const EQ = Object.fromEntries(EQUIP.map(e => [e.id, e]));
const MUSC = {abs: 'Abdominais', ombros: 'Ombros', quads: 'Quadríceps', peito: 'Peito', post: 'Posteriores da coxa', triceps: 'Tríceps',
  biceps: 'Bíceps', dorsais: 'Dorsais', costas: 'Meio das costas', gemeos: 'Gémeos', lombar: 'Lombar', antebracos: 'Antebraços',
  gluteos: 'Glúteos', trapezio: 'Trapézio', adutores: 'Adutores', pescoco: 'Pescoço', abdutores: 'Abdutores'};
const MUSC_ESCOLHA = ['peito', 'dorsais', 'costas', 'ombros', 'biceps', 'triceps', 'quads', 'post', 'gluteos', 'gemeos', 'abs', 'lombar', 'trapezio', 'antebracos'];
const CALOR = [['Peito', ['peito']], ['Costas', ['dorsais', 'costas']], ['Ombros', ['ombros']], ['Bíceps', ['biceps']], ['Tríceps', ['triceps']],
  ['Abdominais', ['abs']], ['Quadríceps', ['quads']], ['Posteriores', ['post']], ['Glúteos', ['gluteos']]];
const CATS = {forca: 'Força', alongamento: 'Alongamentos', pliometria: 'Pliometria', olimpico: 'Olímpico', cardio: 'Cardio'};
const OBJETIVOS = {
  hipertrofia: ['Ganhar músculo', 'Hipertrofia: 8 a 12 repetições, descansos moderados.'],
  forca: ['Ganhar força', 'Cargas pesadas, 4 a 6 repetições, descansos longos.'],
  gordura: ['Perder gordura', 'Ritmo alto, 12 a 15 repetições, descansos curtos.'],
  geral: ['Condição geral', 'Equilíbrio entre força, músculo e resistência.']
};
const NIVEIS = {1: ['Iniciante', 'Menos de 6 meses de treino regular.'], 2: ['Intermédio', 'Treinas com regularidade há 6 meses a 2 anos.'], 3: ['Avançado', 'Mais de 2 anos de treino consistente.']};
const TIPOS = {
  auto: {nome: 'Sugestão'},
  push: {nome: 'Empurrar', sub: 'peito, ombros e tríceps', plano: ['peito', 'ombros', 'peito', 'triceps', 'ombros', 'triceps', 'peito', 'ombros']},
  pull: {nome: 'Puxar', sub: 'costas e bíceps', plano: ['dorsais', 'costas', 'dorsais', 'biceps', 'ombros:pull', 'biceps', 'trapezio', 'antebracos']},
  pernas: {nome: 'Pernas', sub: 'quadríceps, posteriores e glúteos', plano: ['quads', 'post', 'gluteos', 'quads', 'post', 'gemeos', 'abs', 'adutores']},
  superior: {nome: 'Tronco superior', sub: 'peito, costas, ombros e braços', plano: ['peito', 'dorsais', 'ombros', 'costas', 'biceps', 'triceps', 'peito', 'dorsais']},
  inferior: {nome: 'Tronco inferior', sub: 'pernas, glúteos e core', plano: ['quads', 'post', 'gluteos', 'quads', 'gemeos', 'abs', 'lombar', 'post']},
  corpo: {nome: 'Corpo inteiro', sub: 'todos os grandes grupos', plano: ['quads', 'peito', 'dorsais', 'post', 'ombros', 'costas', 'abs', 'biceps', 'triceps', 'gemeos']},
  core: {nome: 'Core', sub: 'abdominais e lombar', plano: ['abs', 'abs', 'lombar', 'abs', 'gluteos', 'abs']},
  musculos: {nome: 'Escolher músculos'},
  livre: {nome: 'Livre', sub: 'começas vazio e acrescentas tu', plano: []}
};
const FRASES = ['Malha enquanto o ferro está quente.', 'Cada série é uma martelada.', 'O ferro não se molda sozinho.',
  'Hoje forjas o corpo de amanhã.', 'A disciplina é o fogo; o treino é o martelo.', 'Aço bom leva muitas marteladas.', 'Brasa que não se alimenta, apaga.'];

/* ---------- Estado ---------- */
const BASE = EQUIP.filter(e => e.base).map(e => e.id);
let cfg = Object.assign({nome: '', objetivo: 'hipertrofia', nivel: 1, dias: 3, duracao: 60, equip: BASE.slice(), favs: [], chave: '', modelo: 'gemini-flash-latest', pronto: false, ts: 0}, LS.get('cfg', {}));
let treinos = LS.get('treinos', []);
let apagados = LS.get('apagados', {});
let ativo = LS.get('ativo', null);
let descanso = LS.get('descanso', null);
let dicas = LS.get('dicas', {});
let EX = [], EXI = {};
const PARTILHADO = ['nome', 'objetivo', 'nivel', 'dias', 'duracao', 'equip', 'favs'];
function guardarCfg(partilhado){ if (partilhado){ cfg.ts = Date.now(); agendarSync(); } LS.set('cfg', cfg); }
let tGuardar;
function guardarAtivo(ja){ clearTimeout(tGuardar); if (ja) LS.set('ativo', ativo); else tGuardar = setTimeout(() => LS.set('ativo', ativo), 300); }
function guardarTreinos(){ LS.set('treinos', treinos); LS.set('apagados', apagados); }

/* ---------- Utilitários ---------- */
function toast(t, ms = 2600){
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d);
  setTimeout(() => d.remove(), ms);
}
const meuEquip = () => Array.from(new Set(['corpo', ...cfg.equip]));
const podeFazer = (ex, eq) => ex.req.every(r => eq.includes(r));
const img = (ex, k = 0) => ex.i[k] ? IMG + ex.i[k] : '';
const fmtSeg = s => s >= 60 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : `${s} s`;
function fmtDur(ms){ const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + pad(m) : m) + ':' + pad(s % 60); }
const fmtSerie = s => +s.kg ? `${num(s.kg)} kg × ${s.reps}` : `${s.reps} reps`;
function resumoSeries(series){
  if (!series.length) return '';
  const kgs = new Set(series.map(s => +s.kg || 0));
  if (kgs.size === 1){ const kg = [...kgs][0]; return (kg ? num(kg) + ' kg × ' : '') + series.map(s => s.reps).join(', ') + (kg ? '' : ' reps'); }
  return series.map(fmtSerie).join(' · ');
}
const dataCurta = ts => new Date(ts).toLocaleDateString('pt-PT', {weekday: 'short', day: 'numeric', month: 'short'});
const chaveMes = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
const musculosTxt = ex => ex.p.map(m => MUSC[m]).join(', ');
const nivelTxt = l => '<span class="nivel">' + '●'.repeat(l) + '<i>' + '●'.repeat(3 - l) + '</i></span>';
const e1rm = s => (+s.kg || 0) * (1 + (+s.reps || 0) / 30);
function volumeDe(t){ return t.itens.reduce((a, it) => a + it.series.reduce((b, s) => b + (+s.kg || 0) * (+s.reps || 0), 0), 0); }
const ordenados = () => treinos.slice().sort((a, b) => b.inicio - a.inicio);
function ultimaVez(id){
  for (const t of ordenados()){ const it = t.itens.find(x => x.id === id); if (it && it.series.length) return {data: t.inicio, series: it.series}; }
  return null;
}
function historicoEx(id){
  const r = [];
  for (const t of ordenados()){ const it = t.itens.find(x => x.id === id); if (it && it.series.length) r.push({data: t.inicio, series: it.series}); }
  return r;
}
function ultimoPorMusculo(){
  const m = {};
  for (const t of treinos) for (const it of t.itens){
    const ex = EXI[it.id]; if (!ex || !it.series.length) continue;
    for (const p of ex.p) if (!m[p] || m[p] < t.inicio) m[p] = t.inicio;
  }
  return m;
}
const diasDesde = ts => ts ? Math.floor((inicioDia(Date.now()) - inicioDia(ts)) / DIA) : null;
function inicioDia(ts){ const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

/* ---------- Faíscas ---------- */
const Faiscas = (() => {
  const c = $('#faiscas'), x = c.getContext('2d'), reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, ps = [], ult = 0, corre = false, acum = 0;
  function tam(){ const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
  const nova = (px, py, vx, vy, vida, t, g, extra) => ps.push(Object.assign({x: px, y: py, vx, vy, v: 0, vida, t, g}, extra));
  // riscos: faíscas de forja (traços rápidos que ressaltam na superfície "chao" = {y, x1, x2})
  function explosao(px, py, n = 26, riscos = false, chao = null){
    for (let i = 0; i < n; i++){
      if (riscos){
        const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * (Math.random() < .7 ? 1.75 : 1.1), s = 160 + Math.random() * 460;
        nova(px + (Math.random() - .5) * 12, py, Math.cos(a) * s, Math.sin(a) * s, .55 + Math.random() * 1.05, 1 + Math.random() * 1.6, 820, {r: 1, chao});
      } else {
        const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.5, s = 110 + Math.random() * 280;
        nova(px, py, Math.cos(a) * s, Math.sin(a) * s, .45 + Math.random() * .7, 1 + Math.random() * 1.7, 560);
      }
    }
    iniciar();
  }
  function passo(t){
    const dt = Math.min(.05, (t - ult) / 1000 || .016); ult = t;
    x.clearRect(0, 0, W, H);
    if (!reduz){ acum += dt; while (acum > .24){ acum -= .24; if (ps.length < 70) nova(Math.random() * W, H + 4, (Math.random() - .5) * 14, -(22 + Math.random() * 46), 3 + Math.random() * 4.5, .7 + Math.random() * 1.5, -3); } }
    x.globalCompositeOperation = 'lighter';
    for (let i = ps.length - 1; i >= 0; i--){
      const p = ps[i]; p.v += dt; const f = p.v / p.vida;
      if (f >= 1 || p.y < -20){ ps.splice(i, 1); continue; }
      p.vy += p.g * dt; p.vx += Math.sin(p.v * 3 + i) * 8 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.r){
        p.vx *= 1 - 1.2 * dt;
        const k = p.chao; if (k && p.vy > 0 && p.y > k.y && p.x > k.x1 && p.x < k.x2 && p.y - p.vy * dt <= k.y + 2){ p.y = k.y; p.vy *= -.32; p.vx *= .75; }
        x.strokeStyle = `hsla(${50 - 38 * f},100%,${92 - 40 * f}%,${1 - f * f})`; x.lineWidth = p.t * (1.25 - f * .6); x.lineCap = 'round';
        x.beginPath(); x.moveTo(p.x - p.vx * .04, p.y - p.vy * .04); x.lineTo(p.x, p.y); x.stroke();
        x.fillStyle = `hsla(30,100%,60%,${.18 * (1 - f)})`; x.beginPath(); x.arc(p.x, p.y, p.t * 3.2, 0, 7); x.fill();
        continue;
      }
      x.fillStyle = `hsla(${30 * (1 - f)},100%,${60 - 25 * f}%,${.13 * (1 - f)})`;
      x.beginPath(); x.arc(p.x, p.y, p.t * 4.2, 0, 7); x.fill();
      x.fillStyle = `hsla(${48 - 40 * f},100%,${90 - 45 * f}%,${1 - f * f})`;
      x.beginPath(); x.arc(p.x, p.y, p.t * (1 - f * .5), 0, 7); x.fill();
    }
    x.globalCompositeOperation = 'source-over';
    if (document.hidden || (reduz && !ps.length)){ corre = false; return; }
    requestAnimationFrame(passo);
  }
  function iniciar(){ if (corre) return; corre = true; ult = performance.now(); requestAnimationFrame(passo); }
  addEventListener('resize', tam);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) iniciar(); });
  tam(); iniciar();
  return {explosao, de(el, n){ if (!el) return; const r = el.getBoundingClientRect(); explosao(r.left + r.width / 2, r.top + r.height / 2, n); }};
})();

/* ---------- Gerador de treinos ---------- */
function prescricao(ex){
  if (ex.c === 'alongamento') return {series: 2, alvo: '30 s', desc: 30};
  if (ex.c === 'cardio') return {series: 1, alvo: '10 min', desc: 60};
  const comp = ex.m === 1, o = cfg.objetivo;
  let [s, r, d] = o === 'forca' ? (comp ? [5, '4–6', 180] : [3, '8–10', 90])
    : o === 'gordura' ? (comp ? [3, '12–15', 60] : [3, '12–15', 45])
    : o === 'geral' ? (comp ? [3, '8–12', 90] : [3, '10–12', 60])
    : (comp ? [4, '8–10', 120] : [3, '10–12', 75]);
  if (ex.c === 'pliometria'){ s = 3; r = '6–8'; d = 90; }
  if (ex.p[0] === 'abs' || ex.p[0] === 'lombar'){ s = 3; r = '12–15'; d = 45; }
  if (ex.f === 'stat') r = '30–45 s';
  if (cfg.nivel === 1) s = Math.max(2, s - 1);
  return {series: s, alvo: r, desc: d};
}
const segundosEx = ex => { const p = prescricao(ex); return p.series * (40 + p.desc) + 60; };
function recentes(){ return new Set(ordenados().slice(0, 2).flatMap(t => t.itens.map(i => i.id))); }
const TOPO = new Set(['Barbell_Bench_Press_-_Medium_Grip', 'Barbell_Squat', 'Barbell_Deadlift', 'Standing_Military_Press', 'Bent_Over_Barbell_Row', 'Pullups', 'Chin-Up',
  'Barbell_Hip_Thrust', 'Romanian_Deadlift', 'Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'One-Arm_Dumbbell_Row', 'Dumbbell_Shoulder_Press', 'Goblet_Squat',
  'Barbell_Curl', 'Lying_Triceps_Press', 'Side_Lateral_Raise', 'Face_Pull', 'Parallel_Bar_Dip', 'Hammer_Curls', 'Dumbbell_Lunges', 'Standing_Calf_Raises']);
const CARGA = ['barra', 'halteres', 'kettlebell', 'cabos', 'maquinas', 'barraEZ'];
function escolher(slot, disp, usados, pos, cats){
  const [m, f] = slot.split(':'), rec = recentes();
  cats = cats || (cfg.objetivo === 'gordura' ? ['forca', 'pliometria'] : ['forca']);
  let melhor = null, mp = -1e9;
  for (const e of disp){
    if (!e.p.includes(m) || (f && e.f !== f) || usados.has(e.id) || !cats.includes(e.c)) continue;
    if (cfg.nivel === 1 && e.l === 3) continue;
    if ((m === 'abs' || m === 'lombar') && e.req.includes('barra')) continue;
    let p = Math.random() * 16 + (e.e ? 40 : 0) + (cfg.favs.includes(e.id) ? 25 : 0);
    if (e.m) p += pos < 3 ? 14 : 4;
    if (TOPO.has(e.id)) p += 12;
    if (cfg.objetivo !== 'gordura' && e.req.some(r => CARGA.includes(r))) p += 6;
    if (cfg.nivel === 1 && e.l === 1) p += 8;
    if (cfg.nivel === 2 && e.l === 3) p -= 30;
    if (rec.has(e.id)) p -= 10;
    if (e.p[0] !== m) p -= 6;
    if (p > mp){ mp = p; melhor = e; }
  }
  return melhor;
}
function novoItem(ex, n){
  const p = prescricao(ex);
  return {u: uid(), id: ex.id, alvo: p.alvo, desc: p.desc, series: Array.from({length: n || p.series}, () => ({kg: '', reps: '', feito: false}))};
}
function gerarTreino(o){
  const eq = Array.from(new Set(['corpo', ...o.equip]));
  const disp = EX.filter(e => podeFazer(e, eq));
  let plano = o.tipo === 'musculos' ? Array.from({length: 10}, (_, i) => o.musculos[i % o.musculos.length]) : (TIPOS[o.tipo].plano || []);
  const alvo = o.duracao * 60, usados = new Set(), itens = [];
  let tempo = 5 * 60;
  for (const slot of plano){
    if (itens.length >= 10) break;
    const ex = escolher(slot, disp, usados, itens.length);
    if (!ex) continue;
    const t = segundosEx(ex);
    if (itens.length >= 3 && tempo + t > alvo + 120) continue;
    tempo += t; usados.add(ex.id); itens.push(ex);
  }
  const peso = e => (e.p[0] === 'abs' ? -10 : 0) + (e.m ? 4 : 0) + (TOPO.has(e.id) ? 2 : 0) + (e.req.includes('barra') ? 1 : 0);
  itens.sort((a, b) => peso(b) - peso(a));
  return itens.map(ex => novoItem(ex));
}
function minutosPlano(itens){ return Math.round((5 * 60 + itens.reduce((a, it) => a + (EXI[it.id] ? segundosEx(EXI[it.id]) : 0), 0)) / 60); }
function sugestao(){
  const cand = cfg.dias <= 2 ? ['corpo'] : cfg.dias === 4 ? ['superior', 'inferior'] : ['push', 'pull', 'pernas'];
  const um = ultimoPorMusculo();
  let melhor = null;
  for (const t of cand){
    const principais = Array.from(new Set(TIPOS[t].plano.slice(0, 4).map(s => s.split(':')[0])));
    const dias = principais.map(m => um[m] ? diasDesde(um[m]) : 99);
    const media = dias.reduce((a, b) => a + b, 0) / dias.length;
    if (!melhor || media > melhor.media) melhor = {tipo: t, media, dias: Math.min(...dias)};
  }
  if (!melhor) return null;
  const sub = TIPOS[melhor.tipo].sub;
  melhor.motivo = !treinos.length ? `bom para começar (${sub}).` : melhor.dias >= 99 ? `${sub} ainda sem treino.` : `${sub} sem treino há ${melhor.dias} ${melhor.dias === 1 ? 'dia' : 'dias'}.`;
  return melhor;
}

/* ---------- Navegação ---------- */
let vista = 'vInicio';
const RENDER = {vInicio: renderInicio, vTreino: renderTreino, vExercicios: renderExercicios, vHistorico: renderHistorico, vPerfil: renderPerfil};
function irPara(v){
  vista = v;
  document.querySelectorAll('section.vista').forEach(s => s.hidden = s.id !== v);
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.vista === v || (v === 'vTreino' && b.dataset.vista === 'vInicio')));
  RENDER[v]();
  scrollTo(0, 0);
  atualizarBarras();
}
let folhaAtual = '', voltarFolha = null;
function abrirFolha(html, nome = ''){ folhaAtual = nome; const c = $('#folhaCaixa'); c.innerHTML = '<div class="pega"></div>' + html; c.scrollTop = 0; $('#folha').hidden = false; document.body.style.overflow = 'hidden'; }
function fecharFolha(){ $('#folha').hidden = true; document.body.style.overflow = ''; clearInterval(tAnim); }
const cab = (titulo, extra = '') => `<div class="cab">${extra}<h2>${titulo}</h2><button class="btn fantasma" data-acao="fecharFolha">Fechar</button></div>`;
const chip = (on, acao, v, txt) => `<span class="chip${on ? ' on' : ''}" data-acao="${acao}" data-v="${esc(v)}">${txt}</span>`;
const tileEq = (e, on, acao, extra = '') => `<div class="ferramenta${on ? ' on' : ''}" data-acao="${acao}" data-v="${e.id}">${extra}${svg(ICONES[e.id], 1.6)}<span>${esc(e.nome)}</span></div>`;
const linhaEx = (ex, extra = '', acao = 'verEx') => `<div class="item" data-acao="${acao}" data-id="${ex.id}"><img class="mini-img" src="${img(ex)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div class="t"><b>${esc(ex.n)}</b><span>${esc(musculosTxt(ex))}${extra}</span></div>${cfg.favs.includes(ex.id) ? `<span style="color:var(--ouro)">${IC.estrela}</span>` : ''}</div>`;

/* ---------- Início ---------- */
function semana(){
  const hoje = new Date(); const seg = new Date(hoje); seg.setHours(0, 0, 0, 0); seg.setDate(seg.getDate() - ((seg.getDay() + 6) % 7));
  const dias = new Set(treinos.map(t => inicioDia(t.inicio)));
  return ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => { const d = seg.getTime() + i * DIA; return {l, acesa: dias.has(inicioDia(d + 3600e3)), hoje: d === inicioDia(Date.now())}; });
}
function renderInicio(){
  const h = new Date().getHours(), ola = h < 6 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
  const sem = semana(), feitos = sem.filter(d => d.acesa).length, sug = !ativo && sugestao(), um = ultimoPorMusculo();
  const ultimo = ordenados()[0];
  const calor = CALOR.map(([nome, ms]) => {
    const ts = Math.max(0, ...ms.map(m => um[m] || 0)), d = ts ? diasDesde(ts) : null;
    const [bg, bd, cor, txt] = d === null ? ['#171310', '#2a2420', 'var(--apagado)', 'frio']
      : d <= 1 ? ['linear-gradient(180deg,#7a2a0c,#3d1507)', '#b8571d', 'var(--incandescente)', d ? 'ontem' : 'hoje']
      : d <= 3 ? ['linear-gradient(180deg,#4a1f0d,#2a140a)', '#7a3a18', 'var(--ouro)', `há ${d} dias`]
      : d <= 6 ? ['#251812', '#4a2c1c', 'var(--chama)', `há ${d} dias`] : ['#171310', '#2a2420', 'var(--suave)', `há ${d} dias`];
    return `<div style="background:${bg};border-color:${bd};color:${cor}">${nome}<b>${txt}</b></div>`;
  }).join('');
  $('#vInicio').innerHTML = `
    <div><h3>${ola}${cfg.nome ? ', ' + esc(cfg.nome) : ''}</h3><p class="suave" style="margin:4px 0 0">${FRASES[Math.floor(Date.now() / DIA) % FRASES.length]}</p></div>
    ${ativo ? `<button class="btn quente grande" data-acao="irTreino">Voltar ao treino</button>` : `<button class="btn quente grande" data-acao="acender">Acender a forja</button>`}
    <div class="placa rebites"><div class="linha entre"><h2>Esta semana</h2><span class="suave peq">${feitos} de ${cfg.dias} treinos</span></div>
      <div class="brasas">${sem.map(d => `<div class="${d.hoje ? 'hoje' : ''}"><i class="${d.acesa ? 'acesa' : ''}"></i>${d.l}</div>`).join('')}</div></div>
    ${sug ? `<div class="placa brasa"><h2>Sugestão de hoje</h2><p style="margin:0 0 12px"><b>${TIPOS[sug.tipo].nome}</b>: ${esc(sug.motivo)}</p>
      <button class="btn quente" data-acao="usarSugestao" data-v="${sug.tipo}">Gerar este treino</button></div>` : ''}
    <div class="placa rebites"><h2>Calor muscular</h2><p class="suave mini" style="margin:-4px 0 10px">Quanto mais quente, mais recente o treino. O que está frio pede ferro.</p><div class="calor">${calor}</div></div>
    ${ultimo ? `<div class="placa rebites" data-acao="verTreino" data-id="${ultimo.id}" style="cursor:pointer"><h2>Último treino</h2>
      <div class="linha entre"><div><b>${esc(ultimo.nome)}</b><div class="suave peq">${dataCurta(ultimo.inicio)} · ${fmtDur(ultimo.fim - ultimo.inicio)} · ${ultimo.itens.length} exercícios</div></div>
      <div class="quente cinzel" style="font-size:18px">${num(volumeDe(ultimo))} kg</div></div></div>` : ''}`;
}

/* ---------- Início rápido e plano ---------- */
let rapido = null;
function novoRapido(tipo){ rapido = {tipo: tipo || 'auto', duracao: cfg.duracao, equip: cfg.equip.slice(), musculos: [], plano: null}; }
function folhaRapido(){
  const sug = sugestao();
  abrirFolha(cab('Início rápido') + `<div class="col">
    <div><h3>Tipo de treino</h3><div class="chips" style="margin-top:8px">${Object.entries(TIPOS).map(([k, t]) => chip(rapido.tipo === k, 'rTipo', k, t.nome)).join('')}</div>
      ${rapido.tipo === 'auto' && sug ? `<p class="suave peq" style="margin:8px 0 0">Hoje: <b>${TIPOS[sug.tipo].nome}</b>, ${esc(sug.motivo)}</p>` : ''}
      ${TIPOS[rapido.tipo].sub ? `<p class="suave peq" style="margin:8px 0 0">${esc(TIPOS[rapido.tipo].sub[0].toUpperCase() + TIPOS[rapido.tipo].sub.slice(1))}.</p>` : ''}
      ${rapido.tipo === 'musculos' ? `<div class="chips" style="margin-top:10px">${MUSC_ESCOLHA.map(m => chip(rapido.musculos.includes(m), 'rMus', m, MUSC[m])).join('')}</div>` : ''}</div>
    <div><h3>Tempo disponível</h3><div class="chips" style="margin-top:8px">${[20, 30, 45, 60, 75, 90].map(m => chip(rapido.duracao === m, 'rDur', m, m + ' min')).join('')}</div></div>
    <div><h3>Equipamento de hoje</h3><div class="chips" style="margin-top:8px">${cfg.equip.filter(x => x !== 'corpo').map(id => chip(rapido.equip.includes(id), 'rEq', id, EQ[id].nome)).join('')}</div></div>
    <button class="btn quente grande" data-acao="gerar">${rapido.tipo === 'livre' ? 'Continuar' : 'Gerar treino'}</button></div>`);
}
function nomeTreino(tipo){ return tipo === 'musculos' ? rapido.musculos.map(m => MUSC[m]).join(' + ') : TIPOS[tipo].nome; }
function gerar(){
  if (rapido.tipo === 'musculos' && !rapido.musculos.length) return toast('Escolhe pelo menos um músculo.');
  rapido.real = rapido.tipo === 'auto' ? (sugestao() || {tipo: 'corpo'}).tipo : rapido.tipo;
  rapido.nome = nomeTreino(rapido.real);
  rapido.plano = gerarTreino({tipo: rapido.real, duracao: rapido.duracao, equip: rapido.equip, musculos: rapido.musculos});
  if (!rapido.plano.length && rapido.tipo !== 'livre') toast('Com este equipamento não encontrei exercícios. Ativa mais equipamento.');
  folhaPlano();
}
function folhaPlano(){
  const p = rapido.plano;
  abrirFolha(`<div class="cab"><button class="btn icone fantasma" data-acao="acender" aria-label="Voltar">${IC.voltar}</button><h2>${esc(rapido.nome)}</h2><span class="suave peq">~${minutosPlano(p)} min</span></div>
    <p class="suave peq" style="margin:-4px 0 12px">Aquece 5 minutos antes de começar. Toca num exercício para ver como se faz.</p>
    <div class="lista">${p.map((it, i) => { const ex = EXI[it.id]; return `<div class="item">
      <img class="mini-img" src="${img(ex)}" alt="" data-acao="verEx" data-id="${ex.id}" onerror="this.style.visibility='hidden'">
      <div class="t" data-acao="verEx" data-id="${ex.id}"><b>${esc(ex.n)}</b><span>${it.series.length} × ${it.alvo} · ${esc(musculosTxt(ex))}</span></div>
      <button class="btn icone" data-acao="pTrocar" data-i="${i}" aria-label="Trocar">${IC.trocar}</button>
      <button class="btn icone" data-acao="pTirar" data-i="${i}" aria-label="Tirar">${IC.x}</button></div>`; }).join('') || '<div class="vazio">Ainda sem exercícios. Acrescenta os que quiseres.</div>'}</div>
    <div class="botoes" style="margin-top:12px"><button class="btn" data-acao="pAdicionar">${IC.mais} Exercício</button>${rapido.tipo !== 'livre' ? '<button class="btn" data-acao="gerar">Gerar outro</button>' : ''}</div>
    <button class="btn quente grande" style="margin-top:12px" data-acao="comecar" ${p.length ? '' : 'disabled'}>Começar treino</button>`, 'plano');
}
function trocarNoPlano(lista, i, eq){
  const atual = EXI[lista[i].id], usados = new Set(lista.map(x => x.id));
  const disp = EX.filter(e => podeFazer(e, Array.from(new Set(['corpo', ...eq]))));
  const novo = escolher(atual.p[0], disp, usados, i, [atual.c]);
  if (!novo){ toast('Não encontrei alternativa com o teu equipamento.'); return false; }
  lista[i] = novoItem(novo, lista[i].series.length);
  return true;
}

/* ---------- Seletor de exercícios ---------- */
let sel = null;
function folhaSeletor(destino, i){
  sel = {destino, i, q: '', mus: ''};
  abrirFolha(cab('Escolher exercício') + `<input type="search" placeholder="Procurar (ex.: supino, remada)…" data-campo="selQ" style="margin-bottom:10px">
    <div class="chips" style="margin-bottom:12px">${chip(true, 'selMus', '', 'Todos')}${MUSC_ESCOLHA.map(m => chip(false, 'selMus', m, MUSC[m])).join('')}</div><div id="selLista" class="lista"></div>`, 'seletor');
  listaSeletor();
}
function listaSeletor(){
  const eq = Array.from(new Set(['corpo', ...(sel.destino === 'plano' ? rapido.equip : cfg.equip)])), q = norm(sel.q);
  const r = EX.filter(e => podeFazer(e, eq) && (!sel.mus || e.p.includes(sel.mus)) && (!q || norm(e.n).includes(q) || norm(e.en).includes(q)))
    .sort((a, b) => (cfg.favs.includes(b.id) - cfg.favs.includes(a.id)) || (b.e - a.e) || (a.c === 'forca' ? -1 : 0) - (b.c === 'forca' ? -1 : 0) || a.n.localeCompare(b.n, 'pt'));
  $('#selLista').innerHTML = r.slice(0, 80).map(e => linhaEx(e, '', 'selEscolher')).join('') + (r.length > 80 ? `<p class="suave peq centro">Mais ${r.length - 80}: escreve para filtrar.</p>` : '') || '<div class="vazio">Nada encontrado.</div>';
}

/* ---------- Treino em curso ---------- */
function comecar(){
  ativo = {id: uid(), inicio: Date.now(), tipo: rapido.real || rapido.tipo, nome: rapido.nome, itens: rapido.plano};
  preencherSugestoes(ativo.itens);
  guardarAtivo(true); fecharFolha(); irPara('vTreino');
  Faiscas.explosao(innerWidth / 2, innerHeight * .35, 40); vibrar(30);
}
function preencherSugestoes(itens){
  for (const it of itens){ const u = ultimaVez(it.id); if (u) it.series.forEach((s, j) => { const a = u.series[Math.min(j, u.series.length - 1)]; if (s.kg === '' && +a.kg) s.kg = a.kg; }); }
}
function cardEx(it, i){
  const ex = EXI[it.id], u = ultimaVez(it.id), tempo = /s$|min$/.test(it.alvo);
  return `<div class="placa rebites exercicio" id="ex${i}">
    <div class="cab-ex"><img class="mini-img" src="${img(ex)}" alt="" data-acao="verEx" data-id="${ex.id}" onerror="this.style.visibility='hidden'">
      <div class="cresce"><b data-acao="verEx" data-id="${ex.id}" style="cursor:pointer;font-size:15.5px">${esc(ex.n)}</b>
        <div class="suave peq">${it.series.length} × ${it.alvo} · descanso ${fmtSeg(it.desc)}</div>
        ${u ? `<div class="apagado mini">Última vez (${dataCurta(u.data)}): ${resumoSeries(u.series)}</div>` : ''}</div>
      <button class="btn icone fantasma" data-acao="tMenu" data-i="${i}" aria-label="Opções">${IC.menu}</button></div>
    <table class="series"><tr><th>Série</th><th>Anterior</th><th>kg</th><th>${tempo ? 'Seg.' : 'Reps'}</th><th></th></tr>
    ${it.series.map((s, j) => { const a = u && u.series[j]; return `<tr class="${s.feito ? 'feita' : ''}"><td>${j + 1}</td><td class="ant">${a ? fmtSerie(a) : '—'}</td>
      <td><input type="number" inputmode="decimal" step="0.5" min="0" value="${esc(s.kg)}" placeholder="${a && +a.kg ? a.kg : '0'}" data-campo="kg" data-i="${i}" data-j="${j}"></td>
      <td><input type="number" inputmode="numeric" min="0" value="${esc(s.reps)}" placeholder="${a ? a.reps : (parseInt(it.alvo) || '')}" data-campo="reps" data-i="${i}" data-j="${j}"></td>
      <td><button class="visto" data-acao="feito" data-i="${i}" data-j="${j}" aria-label="Série feita">${IC.visto}</button></td></tr>`; }).join('')}
    </table>
    <div class="botoes"><button class="btn fantasma" data-acao="maisSerie" data-i="${i}">${IC.mais} Série</button><button class="btn fantasma" data-acao="menosSerie" data-i="${i}">Tirar série</button></div></div>`;
}
function renderTreino(){
  if (!ativo){ irPara('vInicio'); return; }
  const feitas = ativo.itens.reduce((a, it) => a + it.series.filter(s => s.feito).length, 0), total = ativo.itens.reduce((a, it) => a + it.series.length, 0);
  $('#vTreino').innerHTML = `
    <div class="linha entre"><div><h2>${esc(ativo.nome)}</h2><div class="linha" style="gap:12px"><span class="relogio quente" id="cronoTreino">${fmtDur(Date.now() - ativo.inicio)}</span><span class="suave peq" id="contaSeries">${feitas}/${total} séries</span></div></div>
      <button class="btn perigo" data-acao="cancelarTreino">Cancelar</button></div>
    ${ativo.itens.map(cardEx).join('') || '<div class="vazio">Sem exercícios. Acrescenta o primeiro.</div>'}
    <button class="btn" data-acao="tAdicionar">${IC.mais} Adicionar exercício</button>
    <button class="btn quente grande" data-acao="terminar">Terminar treino</button>`;
}
function atualizarCard(i){
  const el = $('#ex' + i); if (el) el.outerHTML = cardEx(ativo.itens[i], i);
  const feitas = ativo.itens.reduce((a, it) => a + it.series.filter(s => s.feito).length, 0), total = ativo.itens.reduce((a, it) => a + it.series.length, 0);
  const c = $('#contaSeries'); if (c) c.textContent = `${feitas}/${total} séries`;
}
function marcarFeito(btn){
  const i = +btn.dataset.i, j = +btn.dataset.j, it = ativo.itens[i], s = it.series[j];
  s.feito = !s.feito;
  if (s.feito){
    const linha = btn.closest('tr'), [ikg, ireps] = linha.querySelectorAll('input');
    if (s.kg === '') s.kg = ikg.placeholder && +ikg.placeholder ? ikg.placeholder : '0';
    if (s.reps === '') s.reps = ireps.placeholder || '0';
    s.ts = Date.now();
    Faiscas.de(btn, 22); vibrar(25);
    const ultima = i === ativo.itens.length - 1 && it.series.every(x => x.feito);
    if (!ultima) iniciarDescanso(it.desc);
  }
  guardarAtivo(true); atualizarCard(i);
}
function terminar(){
  const itens = ativo.itens.map(it => ({id: it.id, series: it.series.filter(s => s.feito).map(s => ({kg: +s.kg || 0, reps: +s.reps || 0}))})).filter(it => it.series.length);
  if (!itens.length){ if (confirm('Ainda não marcaste nenhuma série. Descartar este treino?')){ ativo = null; guardarAtivo(true); pararDescanso(); irPara('vInicio'); } return; }
  if (!confirm('Terminar e guardar o treino?')) return;
  const recordes = [];
  for (const it of itens){
    const ant = historicoEx(it.id).flatMap(h => h.series);
    if (!ant.length) continue;
    const melhor = it.series.reduce((a, s) => e1rm(s) > e1rm(a) ? s : a, it.series[0]);
    const antMax = Math.max(...ant.map(e1rm));
    if (e1rm(melhor) > antMax && +melhor.kg) recordes.push(`${EXI[it.id].n}: ${fmtSerie(melhor)}`);
    else if (!+melhor.kg && !ant.some(s => +s.kg) && Math.max(...it.series.map(s => s.reps)) > Math.max(...ant.map(s => s.reps))) recordes.push(`${EXI[it.id].n}: ${Math.max(...it.series.map(s => s.reps))} reps`);
  }
  const t = {id: ativo.id, inicio: ativo.inicio, fim: Date.now(), tipo: ativo.tipo, nome: ativo.nome, itens, atualizado: Date.now()};
  treinos.push(t); guardarTreinos(); marcarSujo(chaveMes(t.inicio));
  ativo = null; guardarAtivo(true); pararDescanso();
  irPara('vInicio');
  const series = itens.reduce((a, it) => a + it.series.length, 0);
  abrirFolha(`<div class="col centro" style="padding:8px 0 4px">
    <h3>Peça forjada</h3><h1 class="quente" style="font-size:26px">${esc(t.nome)}</h1>
    <div class="estat"><div><b>${fmtDur(t.fim - t.inicio)}</b><span>duração</span></div><div><b>${series}</b><span>séries</span></div><div><b>${num(volumeDe(t))}</b><span>kg levantados</span></div></div>
    ${recordes.length ? `<div class="placa brasa" style="text-align:left"><h2>Novos recordes</h2><ul class="dicas">${recordes.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
    <button class="btn quente grande" data-acao="fecharFolha">Arrefecer</button></div>`);
  setTimeout(() => { Faiscas.explosao(innerWidth / 2, innerHeight * .55, 70); vibrar([40, 60, 40]); }, 150);
}

/* ---------- Descanso: o lingote aquece ---------- */
function iniciarDescanso(seg){ descanso = {total: seg * 1000, fim: Date.now() + seg * 1000, avisado: false}; LS.set('descanso', descanso); desenharDescanso(); }
function pararDescanso(){ descanso = null; LS.set('descanso', null); $('#descanso').hidden = true; atualizarBarras(); }
function desenharDescanso(){
  const d = $('#descanso'); if (!descanso){ d.hidden = true; return; }
  const resta = descanso.fim - Date.now(), f = Math.min(1, 1 - resta / descanso.total);
  if (resta < -15000){ pararDescanso(); return; }
  const pronto = resta <= 0;
  if (pronto && !descanso.avisado){ descanso.avisado = true; LS.set('descanso', descanso); vibrar([90, 50, 90]); Faiscas.de(d, 30); }
  const h = 8 + 40 * f, l = 22 + 58 * f;
  if (d.hidden || !d.firstChild){
    d.innerHTML = `<div class="linha"><span class="tempo quente" id="dTempo"></span><span class="cresce suave peq" id="dTxt"></span>
      <button class="btn icone fantasma" data-acao="dMenos">−15</button><button class="btn icone fantasma" data-acao="dMais">+15</button><button class="btn fantasma" data-acao="dSaltar">Saltar</button></div>
      <div class="lingote"><i id="dBarra"></i></div>`;
    d.hidden = false;
  }
  d.classList.toggle('pronto', pronto);
  $('#dTempo').textContent = pronto ? 'Já!' : fmtSeg(Math.ceil(resta / 1000));
  $('#dTxt').textContent = pronto ? 'Ferro quente: próxima série!' : f < .6 ? 'A aquecer o ferro…' : 'Quase em brasa…';
  const b = $('#dBarra'); b.style.width = (f * 100) + '%';
  b.style.background = `linear-gradient(90deg, #4a1406, hsl(${h},100%,${l}%))`; b.style.boxShadow = `0 0 ${6 + 14 * f}px hsla(${h},100%,55%,${.3 + .5 * f})`;
  atualizarBarras();
}
function atualizarBarras(){
  const barra = $('#barraTreino'), mostrar = !!ativo && vista !== 'vTreino' && $('#descanso').hidden;
  barra.hidden = !mostrar;
  if (mostrar) barra.innerHTML = `<span class="relogio quente">${fmtDur(Date.now() - ativo.inicio)}</span><span class="cresce">Treino em curso: <b>${esc(ativo.nome)}</b></span><span style="color:var(--chama)">Voltar</span>`;
  $('#app').style.paddingBottom = (ativo || descanso) ? 'calc(170px + env(safe-area-inset-bottom))' : '';
}
function tique(){
  if (ativo){ const c = $('#cronoTreino'); if (c) c.textContent = fmtDur(Date.now() - ativo.inicio); const b = $('#barraTreino .relogio'); if (b) b.textContent = fmtDur(Date.now() - ativo.inicio); }
}
setInterval(() => { if (descanso) desenharDescanso(); }, 250);

/* ---------- Exercícios ---------- */
let exf = {eq: null, mus: '', cat: 'forca', q: '', outros: false};
function renderExercicios(){
  const meu = meuEquip(), q = exf.q;
  let corpo;
  if (!exf.eq && !q){
    const conta = id => EX.filter(e => e.req.includes(id) && podeFazer(e, meu)).length;
    const contaTodos = id => EX.filter(e => e.req.includes(id)).length;
    corpo = `<div class="placa rebites"><h2>O teu equipamento</h2><div class="grelha">${EQUIP.filter(e => meu.includes(e.id)).map(e => tileEq(e, true, 'exEq', `<span class="n">${conta(e.id)}</span>`)).join('')}</div></div>
      <div class="placa rebites"><h2>Favoritos</h2>${cfg.favs.length ? `<div class="lista">${cfg.favs.map(id => EXI[id]).filter(Boolean).map(e => linhaEx(e)).join('')}</div>` : '<p class="suave peq" style="margin:0">Marca exercícios com a estrela para os teres sempre à mão e para aparecerem mais nos treinos gerados.</p>'}</div>
      <details class="placa" ${exf.outros ? 'open' : ''} data-acao="exOutros"><summary><h2 style="display:inline">Outro equipamento</h2> <span class="suave peq">(ver exercícios que ainda não podes fazer)</span></summary>
        <div class="grelha" style="margin-top:12px">${EQUIP.filter(e => !meu.includes(e.id)).map(e => tileEq(e, false, 'exEq', `<span class="n">${contaTodos(e.id)}</span>`)).join('')}</div></details>`;
  } else {
    const e = exf.eq && EQ[exf.eq];
    corpo = `${e ? `<div class="linha"><button class="btn icone fantasma" data-acao="exVoltar" aria-label="Voltar">${IC.voltar}</button><h2 class="cresce">${esc(e.nome)}</h2></div>
      ${!meu.includes(e.id) ? '<p class="suave peq" style="margin:0">Não tens este equipamento. Podes ativá-lo no Perfil.</p>' : ''}` : ''}
      <div class="chips">${Object.entries(CATS).map(([k, v]) => chip(exf.cat === k, 'exCat', k, v)).join('')}</div>
      <div class="chips">${chip(!exf.mus, 'exMus', '', 'Todos os músculos')}${MUSC_ESCOLHA.map(m => chip(exf.mus === m, 'exMus', m, MUSC[m])).join('')}</div>
      <div id="exLista" class="lista"></div>`;
  }
  $('#vExercicios').innerHTML = `<input type="search" placeholder="Procurar exercício…" data-campo="exQ" value="${esc(q)}">${corpo}`;
  if (exf.eq || q) listaExercicios();
}
function listaExercicios(){
  const meu = meuEquip(), q = norm(exf.q), el = $('#exLista'); if (!el) return;
  const r = EX.filter(e => (!exf.eq || e.req.includes(exf.eq)) && (exf.eq && !meu.includes(exf.eq) ? true : podeFazer(e, meu) || !!q)
    && (q ? (norm(e.n).includes(q) || norm(e.en).includes(q)) : e.c === exf.cat) && (!exf.mus || e.p.includes(exf.mus)))
    .sort((a, b) => (b.e - a.e) || (a.l - b.l) || a.n.localeCompare(b.n, 'pt'));
  el.innerHTML = r.slice(0, 150).map(e => linhaEx(e, podeFazer(e, meu) ? '' : ` · <span style="color:var(--chama)">precisa de ${e.req.filter(x => !meu.includes(x)).map(x => EQ[x].nome).join(', ')}</span>`)).join('')
    + (r.length > 150 ? `<p class="suave peq centro">Mais ${r.length - 150}. Filtra por músculo ou procura pelo nome.</p>` : '') || '<div class="vazio">Nenhum exercício com estes filtros.</div>';
}
let tAnim;
function folhaEx(id){
  const ex = EXI[id]; if (!ex) return;
  const fav = cfg.favs.includes(id), d = dicas[id], hist = historicoEx(id).slice(0, 5), meu = meuEquip();
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.en + ' exercise proper form');
  abrirFolha(`<div class="cab">${voltarFolha ? `<button class="btn icone fantasma" data-acao="voltarFolha" aria-label="Voltar">${IC.voltar}</button>` : ''}<h2 style="text-transform:none;letter-spacing:.02em;font-size:17px;color:var(--texto)">${esc(ex.n)}</h2><button class="btn fantasma" data-acao="fecharFolha">Fechar</button></div>
    <div class="col">
      <div class="img-ex" id="animEx">${ex.i.map(p => `<img src="${IMG + p}" alt="" onerror="this.remove()">`).join('')}</div>
      <div class="linha entre"><span class="apagado mini">${esc(ex.en)}</span>${nivelTxt(ex.l)}</div>
      <div class="chips">${ex.p.map(m => `<span class="etiqueta q">${MUSC[m]}</span>`).join('')}${ex.s.map(m => `<span class="etiqueta">${MUSC[m]}</span>`).join('')}
        ${ex.req.filter(r => r !== 'corpo').map(r => `<span class="etiqueta"${meu.includes(r) ? '' : ' style="color:var(--chama)"'}>${EQ[r].nome}</span>`).join('')}</div>
      <div class="botoes"><a class="btn" href="${yt}" target="_blank" rel="noopener">${IC.video} Ver vídeos</a>
        <button class="btn" data-acao="fav" data-id="${id}" style="${fav ? 'color:var(--ouro);border-color:#7a3a18' : ''}">${IC.estrela} ${fav ? 'Favorito' : 'Marcar favorito'}</button></div>
      ${ativo && !ativo.itens.some(it => it.id === id) ? `<button class="btn quente" data-acao="addAoTreino" data-id="${id}">${IC.mais} Adicionar ao treino em curso</button>` : ''}
      <h3>Como fazer</h3><div id="iaBox">${blocoDicas(ex, d)}</div>
      ${hist.length ? `<h3>As tuas últimas vezes</h3><div class="lista">${hist.map(h => `<div class="linha entre peq"><span class="suave">${dataCurta(h.data)}</span><span>${resumoSeries(h.series)}</span></div>`).join('')}</div>` : ''}
    </div>`);
  clearInterval(tAnim);
  if (ex.i.length > 1) tAnim = setInterval(() => { const a = $('#animEx'); if (a) a.classList.toggle('b'); else clearInterval(tAnim); }, 1100);
  if (!d && cfg.chave) pedirDicas(id);
}
function blocoDicas(ex, d){
  if (d) return `<ol class="passos-ex">${d.passos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
    ${d.dicas.length ? `<div class="placa brasa" style="padding:12px"><h2 style="margin-bottom:6px">Conselhos do mestre</h2><ul class="dicas">${d.dicas.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
    ${d.erros.length ? `<div class="placa" style="padding:12px"><h2 style="margin-bottom:6px">Erros comuns</h2><ul class="dicas">${d.erros.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
    ${d.respiracao ? `<p class="suave peq" style="margin:0"><b>Respiração:</b> ${esc(d.respiracao)}</p>` : ''}`;
  return `<ol class="passos-ex" lang="en">${ex.ins.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
    <p class="suave peq" id="iaEstado" style="margin:10px 0 0">${cfg.chave ? 'A traduzir e a preparar conselhos…' : 'Instruções em inglês. Com a tua chave do Gemini (Perfil, Inteligência artificial), aparecem em português, com conselhos de técnica.'}</p>`;
}

/* ---------- IA (Gemini, chave do utilizador) ---------- */
async function geminiTexto(texto, json = true){
  if (!cfg.chave) throw new Error('Falta a chave do Gemini no Perfil.');
  const modelo = String(cfg.modelo || 'gemini-flash-latest').replace(/^models\//, '');
  let r;
  try {
    r = await fetch(`${API}models/${encodeURIComponent(modelo)}:generateContent`, {method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-goog-api-key': cfg.chave},
      body: JSON.stringify({contents: [{role: 'user', parts: [{text: texto}]}], generationConfig: json ? {temperature: .3, responseMimeType: 'application/json'} : {temperature: .6}})});
  } catch(e){ throw new Error('Sem ligação à internet.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok){
    const msg = (j.error && j.error.message) || '';
    if (r.status === 429) throw new Error('Limite gratuito do Gemini atingido. Tenta mais tarde.');
    if (r.status === 401 || r.status === 403 || /api key/i.test(msg)) throw new Error('Chave do Gemini inválida. Verifica no Perfil.');
    if (r.status === 404) throw new Error('Modelo não encontrado. No Perfil, toca em "Testar ligação".');
    throw new Error('Erro do Gemini: ' + (msg || r.status));
  }
  const txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');
  if (!txt) throw new Error('A IA não devolveu resposta.');
  return txt;
}
function lerJSON(txt){
  const s = String(txt).replace(/```(?:json)?/gi, ''), a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('Resposta da IA em formato inválido.');
  return JSON.parse(s.slice(a, b + 1));
}
const pedidosDicas = new Set();
async function pedirDicas(id){
  if (pedidosDicas.has(id)) return; pedidosDicas.add(id);
  const ex = EXI[id];
  const prompt = `És um treinador de força experiente. Exercício: "${ex.en}" (em português: "${ex.n}").
Equipamento: ${ex.req.map(r => EQ[r].nome).join(', ')}. Músculos principais: ${musculosTxt(ex)}.
Instruções originais (inglês):
${ex.ins.map((p, i) => (i + 1) + '. ' + p).join('\n')}
O utilizador é de nível ${NIVEIS[cfg.nivel][0].toLowerCase()} e o objetivo é ${OBJETIVOS[cfg.objetivo][0].toLowerCase()}.
Escreve em português de Portugal (PT-PT, nunca do Brasil): trata o utilizador por "tu" e usa termos como halteres, agachamento, afundo, glúteos, gémeos, elevações, flexões.
Responde só com JSON: {"passos":["3 a 6 passos curtos, traduzidos e simplificados"],"dicas":["3 dicas de técnica práticas"],"erros":["2 ou 3 erros comuns e como os evitar"],"respiracao":"uma frase"}`;
  try {
    const o = lerJSON(await geminiTexto(prompt));
    const lista = v => Array.isArray(v) ? v.map(x => String(x).slice(0, 300)).filter(Boolean).slice(0, 8) : [];
    const d = {passos: lista(o.passos), dicas: lista(o.dicas), erros: lista(o.erros), respiracao: String(o.respiracao || '').slice(0, 200)};
    if (!d.passos.length) throw new Error('A IA não devolveu os passos.');
    dicas[id] = d; LS.set('dicas', dicas);
    const box = $('#iaBox'); if (box && $('#animEx')) box.innerHTML = blocoDicas(ex, d);
  } catch(e){
    const st = $('#iaEstado'); if (st) st.innerHTML = `${esc(e.message)} <button class="btn fantasma" data-acao="iaDicas" data-id="${id}">Tentar de novo</button>`;
  } finally { pedidosDicas.delete(id); }
}
async function listarModelos(){
  let r;
  try { r = await fetch(API + 'models?pageSize=1000', {headers: {'x-goog-api-key': cfg.chave}}); } catch(e){ throw new Error('Sem ligação à internet.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error([400, 401, 403].includes(r.status) ? 'Chave inválida.' : 'Erro: ' + ((j.error && j.error.message) || r.status));
  const pts = n => (/latest/.test(n) ? 100 : 0) - (/lite/.test(n) ? 10 : 0) - (/preview/.test(n) ? 5 : 0) + (parseFloat((n.match(/\d+(\.\d+)?/) || [])[0]) || 0);
  const nomes = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, ''))
    .filter(n => /flash/i.test(n) && !/(image|tts|audio|live|embed|exp)/i.test(n)).sort((a, b) => pts(b) - pts(a));
  if (nomes.length && !nomes.includes(cfg.modelo)){ cfg.modelo = nomes[0]; guardarCfg(); }
  return nomes;
}

/* ---------- Histórico ---------- */
function renderHistorico(){
  const lista = ordenados();
  if (!lista.length){ $('#vHistorico').innerHTML = '<h2>Histórico</h2><div class="placa vazio">Ainda não há treinos forjados. O primeiro aparece aqui.</div>'; return; }
  const mesAtual = chaveMes(Date.now()), doMes = lista.filter(t => chaveMes(t.inicio) === mesAtual);
  const grupos = {};
  for (const t of lista){ const k = new Date(t.inicio).toLocaleDateString('pt-PT', {month: 'long', year: 'numeric'}); (grupos[k] = grupos[k] || []).push(t); }
  $('#vHistorico').innerHTML = `<h2>Histórico</h2>
    <div class="estat"><div><b>${lista.length}</b><span>treinos</span></div><div><b>${doMes.length}</b><span>este mês</span></div><div><b>${num(lista.reduce((a, t) => a + volumeDe(t), 0) / 1000)} t</b><span>levantadas</span></div></div>
    ${Object.entries(grupos).map(([m, ts]) => `<h3 style="margin-top:6px">${m}</h3><div class="lista">${ts.map(t => `<div class="item" data-acao="verTreino" data-id="${t.id}" style="padding:12px">
      <div class="t"><b>${esc(t.nome)}</b><span>${dataCurta(t.inicio)} · ${fmtDur(t.fim - t.inicio)} · ${t.itens.length} exercícios</span></div><span class="quente cinzel">${num(volumeDe(t))} kg</span></div>`).join('')}</div>`).join('')}`;
}
function folhaTreino(id){
  const t = treinos.find(x => x.id === id); if (!t) return;
  abrirFolha(cab(esc(t.nome)) + `<p class="suave peq" style="margin:-6px 0 12px">${new Date(t.inicio).toLocaleString('pt-PT', {weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'})} · ${fmtDur(t.fim - t.inicio)} · ${num(volumeDe(t))} kg</p>
    <div class="lista">${t.itens.map(it => { const ex = EXI[it.id]; return ex ? `<div class="item" data-acao="verEx" data-id="${ex.id}"><img class="mini-img" src="${img(ex)}" alt="" onerror="this.style.visibility='hidden'"><div class="t"><b>${esc(ex.n)}</b><span>${resumoSeries(it.series)}</span></div></div>` : ''; }).join('')}</div>
    <div class="botoes" style="margin-top:14px"><button class="btn quente" data-acao="repetir" data-id="${t.id}">Repetir este treino</button><button class="btn perigo" data-acao="apagarTreino" data-id="${t.id}">${IC.lixo} Apagar</button></div>`, 'treino:' + t.id);
}

/* ---------- Perfil ---------- */
const gh = Object.assign({dono: '', repo: '', token: ''}, LS.get('gh', {}));
const sync = Object.assign({shas: {}, sujos: {}, ultimo: 0, erro: ''}, LS.get('sync', {}));
function renderPerfil(){
  const meu = meuEquip(), nImg = EX.filter(e => podeFazer(e, meu)).reduce((a, e) => a + e.i.length, 0);
  $('#vPerfil').innerHTML = `<h2>Perfil</h2>
    <div class="placa rebites col"><label class="campo">Nome<input type="text" value="${esc(cfg.nome)}" data-campo="pNome" placeholder="O teu nome"></label>
      <div><h3>Objetivo</h3><div class="chips" style="margin-top:8px">${Object.entries(OBJETIVOS).map(([k, v]) => chip(cfg.objetivo === k, 'pObj', k, v[0])).join('')}</div></div>
      <div><h3>Nível</h3><div class="chips" style="margin-top:8px">${Object.entries(NIVEIS).map(([k, v]) => chip(cfg.nivel === +k, 'pNiv', k, v[0])).join('')}</div></div>
      <div><h3>Treinos por semana</h3><div class="chips" style="margin-top:8px">${[2, 3, 4, 5, 6].map(n => chip(cfg.dias === n, 'pDias', n, n)).join('')}</div></div>
      <div><h3>Duração habitual</h3><div class="chips" style="margin-top:8px">${[30, 45, 60, 75, 90].map(n => chip(cfg.duracao === n, 'pDur', n, n + ' min')).join('')}</div></div></div>
    <div class="placa rebites"><h2>O meu ginásio</h2><p class="suave peq" style="margin:-4px 0 12px">Toca para ligar ou desligar. Os treinos só usam o que está aceso.</p>
      <div class="grelha">${EQUIP.filter(e => e.id !== 'corpo').map(e => tileEq(e, cfg.equip.includes(e.id), 'pEq')).join('')}</div></div>
    <div class="placa rebites col"><h2>Imagens sem internet</h2><p class="suave peq" style="margin:0">As imagens vêm da internet e ficam guardadas quando as vês. Para treinar sem rede, guarda já as dos exercícios que podes fazer (${nImg} imagens, cerca de ${Math.round(nImg * 38 / 1024)} MB).</p>
      <button class="btn" data-acao="guardarImagens">Guardar imagens no dispositivo</button></div>
    <div class="placa rebites col"><h2>Inteligência artificial</h2>
      <p class="suave peq" style="margin:0">A Forja usa o Gemini da Google, com uma chave gratuita tua. Fica guardada só neste dispositivo. Para criar: abre <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com/app/apikey</a>, entra com a conta Google, toca em "Create API key" e cola a chave aqui.</p>
      <label class="campo">Chave do Gemini<div class="linha"><input type="password" id="pChave" value="${esc(cfg.chave)}" placeholder="Cola aqui a chave" autocomplete="off"><button class="btn icone" data-acao="verChave">Ver</button></div></label>
      <div class="linha"><button class="btn quente" data-acao="testarIA">Guardar e testar ligação</button><span class="suave mini cresce" id="iaTeste">${cfg.chave ? 'Modelo: ' + esc(cfg.modelo) : ''}</span></div></div>
    <details class="placa col"><summary><h2 style="display:inline">Sincronização entre dispositivos</h2> <span class="suave peq">(opcional)</span></summary>
      <div class="col" style="margin-top:12px"><p class="suave peq" style="margin:0">Guarda os treinos num repositório privado teu no GitHub, para teres os mesmos dados no telemóvel e no PC. Cria um repositório privado (por exemplo, forja-dados) e um token "fine-grained" com permissão Contents: Read and write só nesse repositório.</p>
      <label class="campo">Dono (utilizador GitHub)<input type="text" id="gDono" value="${esc(gh.dono)}" autocomplete="off"></label>
      <label class="campo">Repositório<input type="text" id="gRepo" value="${esc(gh.repo)}" placeholder="forja-dados" autocomplete="off"></label>
      <label class="campo">Token<input type="password" id="gToken" value="${esc(gh.token)}" autocomplete="off"></label>
      <div class="botoes"><button class="btn quente" data-acao="ligarGH">Ligar e sincronizar</button>${gh.token ? '<button class="btn perigo" data-acao="desligarGH">Desligar</button>' : ''}</div>
      <p class="suave peq" id="syncTxt" style="margin:0"></p></div></details>
    <div class="placa rebites col"><h2>Capa</h2><p class="suave peq" style="margin:0">Ao abrir a app, três marteladas na bigorna para entrar. Mostra a peça da semana, que ganha forma a cada treino.</p>
      <div class="chips">${chip(cfg.capa !== false, 'pCapa', '', 'Capa ao abrir')}${chip(cfg.som !== false, 'pSom', '', 'Som do martelo')}</div>
      <button class="btn" data-acao="verCapa">Ver a capa agora</button></div>
    <div class="placa rebites col"><h2>Cópia de segurança</h2><p class="suave peq" style="margin:0">Exporta tudo para um ficheiro. Útil antes de mudares de telemóvel.</p>
      <div class="botoes"><button class="btn" data-acao="exportar">Exportar</button><button class="btn" data-acao="importar">Importar</button></div></div>
    <p class="apagado mini centro">Exercícios e imagens: Free Exercise DB (domínio público). Os conselhos da IA não substituem um profissional se tiveres dor ou lesão.</p>`;
  estadoSync();
}
async function guardarImagens(btn){
  if (!('caches' in window)) return toast('Este navegador não permite guardar imagens.');
  const urls = EX.filter(e => podeFazer(e, meuEquip())).flatMap(e => e.i.map(p => IMG + p)), fila = urls.slice();
  const cache = await caches.open('forja-img'); let feitos = 0, falhas = 0; btn.disabled = true;
  const trab = async () => { while (fila.length){ const u = fila.shift(); try { if (!(await cache.match(u))){ const r = await fetch(u, {mode: 'cors'}); if (r.ok) await cache.put(u, r); else falhas++; } } catch(e){ falhas++; }
    if (++feitos % 8 === 0 || !fila.length) btn.textContent = `A guardar… ${Math.round(feitos / urls.length * 100)}%`; } };
  await Promise.all(Array.from({length: 6}, trab));
  btn.disabled = false; btn.textContent = 'Guardar imagens no dispositivo';
  toast(falhas ? `Guardadas ${urls.length - falhas} imagens; ${falhas} falharam. Tenta de novo com melhor rede.` : 'Imagens guardadas. Já podes treinar sem internet.', 4000);
}
function exportar(){
  const dados = {app: 'forja', versao: 1, exportado: new Date().toISOString(), cfg: Object.fromEntries(PARTILHADO.map(k => [k, cfg[k]])), treinos, apagados, dicas};
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(dados)], {type: 'application/json'}));
  a.download = 'forja-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importar(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const d = JSON.parse(await inp.files[0].text()); if (d.app !== 'forja') throw new Error();
      let novos = 0;
      for (const t of d.treinos || []){ const i = treinos.findIndex(x => x.id === t.id); if (i < 0){ treinos.push(t); novos++; marcarSujo(chaveMes(t.inicio)); } else if ((t.atualizado || 0) > (treinos[i].atualizado || 0)) treinos[i] = t; }
      Object.assign(apagados, d.apagados || {}); Object.assign(dicas, d.dicas || {}); LS.set('dicas', dicas);
      if (d.cfg && confirm('Substituir também o perfil e o equipamento pelos do ficheiro?')){ Object.assign(cfg, d.cfg); guardarCfg(true); }
      guardarTreinos(); toast(`Importado: ${novos} treinos novos.`); irPara(vista);
    } catch(e){ toast('Ficheiro inválido.'); }
  };
  inp.click();
}

/* ---------- Sincronização (GitHub, repositório privado do utilizador) ---------- */
const ghLigado = () => !!(gh.dono && gh.repo && gh.token);
const guardarSync = () => LS.set('sync', sync);
const b64enc = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));
function marcarSujo(mes){ sync.sujos[mes] = Date.now(); guardarSync(); estadoSync(); agendarSync(); }
let tSync;
function agendarSync(ms){ if (!ghLigado()) return; clearTimeout(tSync); tSync = setTimeout(sincronizar, ms || 1500); }
async function ghPedido(caminho, opt = {}){
  try {
    return await fetch(`https://api.github.com/repos/${encodeURIComponent(gh.dono)}/${encodeURIComponent(gh.repo)}${caminho}`, Object.assign({cache: 'no-store'}, opt, {
      headers: Object.assign({'Authorization': 'Bearer ' + gh.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}, opt.headers || {})}));
  } catch(e){ throw new Error('Sem ligação ao GitHub.'); }
}
function erroGH(r){
  if (r.status === 401) return new Error('Token do GitHub inválido ou expirado.');
  if (r.status === 403) return new Error('Sem permissão: o token precisa de "Contents: Read and write" neste repositório.');
  if (r.status === 404) return new Error('Repositório não encontrado, ou o token não tem acesso a ele.');
  return new Error('Erro do GitHub: ' + r.status);
}
async function lerRemoto(p){
  const r = await ghPedido('/contents/' + p);
  if (r.status === 404) return null;
  if (!r.ok) throw erroGH(r);
  const j = await r.json(); if (Array.isArray(j)) return null;
  let txt = j.content ? b64dec(j.content) : '';
  if (!txt){ const r2 = await ghPedido('/contents/' + p, {headers: {'Accept': 'application/vnd.github.raw+json'}}); if (!r2.ok) throw erroGH(r2); txt = await r2.text(); }
  return {sha: j.sha, dados: JSON.parse(txt)};
}
async function escreverRemoto(p, dados, sha){
  const corpo = {message: 'Forja: ' + p, content: b64enc(JSON.stringify(dados))}; if (sha) corpo.sha = sha;
  const r = await ghPedido('/contents/' + p, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(corpo)});
  if (r.status === 409 || r.status === 422) return {conflito: true};
  if (!r.ok) throw erroGH(r);
  return {sha: (await r.json()).content.sha};
}
function mesLocal(m){
  const ap = {}; for (const [id, v] of Object.entries(apagados)) if (v.mes === m) ap[id] = v.ts;
  return {mes: m, treinos: treinos.filter(t => chaveMes(t.inicio) === m).sort((a, b) => a.inicio - b.inicio), apagados: ap};
}
const assinatura = d => JSON.stringify([(d.treinos || []).map(t => t.id + ':' + (t.atualizado || 0)).sort(), Object.entries(d.apagados || {}).map(([i, ts]) => i + ':' + ts).sort()]);
function fundirMes(rem){
  const m = rem.mes;
  for (const [id, ts] of Object.entries(rem.apagados || {})) if (!apagados[id] || apagados[id].ts < ts) apagados[id] = {mes: m, ts};
  for (const t of rem.treinos || []){ const i = treinos.findIndex(x => x.id === t.id); if (i < 0) treinos.push(t); else if ((t.atualizado || 0) > (treinos[i].atualizado || 0)) treinos[i] = t; }
  treinos = treinos.filter(t => !(apagados[t.id] && apagados[t.id].ts >= (t.atualizado || 0)));
  guardarTreinos();
  if (assinatura(mesLocal(m)) !== assinatura(rem) && !sync.sujos[m]) sync.sujos[m] = Date.now();
}
async function empurrarMes(m){
  for (let i = 0; i < 3; i++){
    const marca = sync.sujos[m], dados = mesLocal(m);
    if (!dados.treinos.length && !Object.keys(dados.apagados).length && !sync.shas[m]){ if (sync.sujos[m] === marca) delete sync.sujos[m]; guardarSync(); return; }
    const r = await escreverRemoto(`treinos/${m}.json`, dados, sync.shas[m]);
    if (!r.conflito){ sync.shas[m] = r.sha; if (sync.sujos[m] === marca) delete sync.sujos[m]; guardarSync(); return; }
    const rem = await lerRemoto(`treinos/${m}.json`);
    if (rem){ fundirMes(rem.dados); sync.shas[m] = rem.sha; } else delete sync.shas[m];
  }
  throw new Error('Conflito ao sincronizar ' + m + '. Tenta outra vez.');
}
async function sincPerfil(){
  const rem = await lerRemoto('perfil.json'), remTs = rem ? (rem.dados.ts || 0) : 0;
  if (rem && remTs > (cfg.ts || 0)){
    for (const c of PARTILHADO) if (c in rem.dados.cfg) cfg[c] = rem.dados.cfg[c];
    cfg.ts = remTs; if (!cfg.pronto){ cfg.pronto = true; $('#intro').hidden = true; } guardarCfg();
  } else if ((cfg.ts || 0) > remTs){
    await escreverRemoto('perfil.json', {ts: cfg.ts, cfg: Object.fromEntries(PARTILHADO.map(c => [c, cfg[c]]))}, rem && rem.sha);
  }
}
let aSinc = false, outraVez = false;
async function sincronizar(){
  if (!ghLigado() || !navigator.onLine){ estadoSync(); return; }
  if (aSinc){ outraVez = true; return; }
  aSinc = true; estadoSync();
  try {
    const r = await ghPedido('/contents/treinos');
    if (r.status !== 404 && !r.ok) throw erroGH(r);
    const fs = r.ok ? await r.json() : [];
    for (const f of Array.isArray(fs) ? fs : []){
      if (f.type !== 'file' || !/^\d{4}-\d{2}\.json$/.test(f.name)) continue;
      const m = f.name.slice(0, 7);
      if (sync.shas[m] === f.sha) continue;
      const rem = await lerRemoto(f.path);
      if (rem){ fundirMes(rem.dados); sync.shas[m] = rem.sha; guardarSync(); }
    }
    for (const m of Object.keys(sync.sujos)) await empurrarMes(m);
    await sincPerfil();
    sync.ultimo = Date.now(); sync.erro = '';
  } catch(e){ sync.erro = e.message || 'Erro ao sincronizar.'; }
  finally {
    guardarSync(); aSinc = false; estadoSync();
    if (vista !== 'vTreino' && $('#folha').hidden) RENDER[vista]();
    if (outraVez){ outraVez = false; agendarSync(500); }
  }
}
function estadoSync(){
  const p = $('#syncPonto'), t = $('#syncTxt');
  if (!ghLigado()){ p.hidden = true; if (t) t.textContent = 'Desligada: os dados ficam só neste dispositivo.'; return; }
  const n = Object.keys(sync.sujos).length;
  let cls = 'ok', txt = sync.ultimo ? 'Sincronizado às ' + new Date(sync.ultimo).toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'}) + '.' : 'Ainda não sincronizado.';
  if (aSinc){ cls = 'pend'; txt = 'A sincronizar…'; } else if (sync.erro){ cls = 'erro'; txt = sync.erro; } else if (n){ cls = 'pend'; txt = `${n} ${n === 1 ? 'mês' : 'meses'} por enviar` + (navigator.onLine ? '.' : ' (sem internet).'); }
  p.hidden = false; p.className = 'ponto ' + cls; p.title = txt; if (t) t.textContent = txt;
}

/* ---------- Primeiro arranque ---------- */
let intro = {passo: 0, d: {nome: '', objetivo: 'hipertrofia', nivel: 1, dias: 3, duracao: 60, equip: BASE.slice()}};
const LOGO = `<svg viewBox="0 0 48 48" width="96" height="96" aria-hidden="true"><rect x="15" y="15" width="18" height="5" rx="2" fill="url(#lgQ)"/><path d="M9 21h29c2 0 3 1 3 3v2h-8c-2 0-3 1-3.5 3L28 34h5c1.2 0 2 .8 2 2v2H13v-2c0-1.2.8-2 2-2h5l-1.5-5c-.5-2-1.5-3-3.5-3H9c-3 0-5-2-6-5 2 .4 4 0 6-1z" fill="#5a4a40"/><circle cx="12" cy="10" r="1.2" fill="#ffc861"/><circle cx="36" cy="8" r="1" fill="#ff9a3c"/><circle cx="30" cy="5" r=".8" fill="#ffe39a"/></svg>`;
function renderIntro(){
  const d = intro.d, p = intro.passo, opc = (on, acao, v, t, s) => `<button class="opcao${on ? ' on' : ''}" data-acao="${acao}" data-v="${v}"><b>${t}</b><span>${s}</span></button>`;
  const corpo = [
    () => `<div class="col centro" style="align-items:center;margin-top:16px">${LOGO}<h1 class="quente" style="font-size:36px;letter-spacing:.22em">FORJA</h1>
      <p class="suave" style="margin:0">Escolhe o treino de hoje em segundos, com o equipamento que tens em casa.</p></div>
      <label class="campo">Como te chamas?<input type="text" data-campo="iNome" value="${esc(d.nome)}" placeholder="O teu nome" autocomplete="given-name"></label>`,
    () => `<h2>Qual é o teu objetivo?</h2><div class="col">${Object.entries(OBJETIVOS).map(([k, v]) => opc(d.objetivo === k, 'iObj', k, v[0], v[1])).join('')}</div>`,
    () => `<h2>Qual é o teu nível?</h2><div class="col">${Object.entries(NIVEIS).map(([k, v]) => opc(d.nivel === +k, 'iNiv', k, v[0], v[1])).join('')}</div>`,
    () => `<h2>Quanto treinas?</h2><div><h3>Treinos por semana</h3><div class="chips" style="margin-top:8px">${[2, 3, 4, 5, 6].map(n => chip(d.dias === n, 'iDias', n, n)).join('')}</div></div>
      <div><h3>Tempo por treino</h3><div class="chips" style="margin-top:8px">${[30, 45, 60, 75, 90].map(n => chip(d.duracao === n, 'iDur', n, n + ' min')).join('')}</div></div>
      <p class="suave peq">Podes mudar tudo isto no Perfil e escolher outra duração antes de cada treino.</p>`,
    () => `<h2>O teu ginásio</h2><p class="suave peq" style="margin:0">Já marquei o equipamento básico. Desliga o que não tens e liga o que tiveres a mais.</p>
      <div class="grelha">${EQUIP.filter(e => e.id !== 'corpo').map(e => tileEq(e, d.equip.includes(e.id), 'iEq')).join('')}</div>`
  ][p]();
  $('#intro').innerHTML = `<div class="dentro">${corpo}<div style="margin-top:auto" class="col">
    <div class="botoes">${p ? '<button class="btn" data-acao="iVoltar">Voltar</button>' : ''}<button class="btn quente" data-acao="iSeguinte">${p === 4 ? 'Acender a forja' : 'Seguinte'}</button></div>
    <div class="passos">${[0, 1, 2, 3, 4].map(i => `<i class="${i <= p ? 'on' : ''}"></i>`).join('')}</div></div></div>`;
}

/* ---------- Capa: três marteladas para entrar ---------- */
// O ferro da semana: cada treino molda a barra até virar lâmina (meta = treinos por semana).
// Pontos correspondentes da barra (f = 0) e da lâmina (f = 1); a forma intermédia é interpolada.
const BARRA = [[160, 184], [164, 184], [166, 184], [168, 184], [170, 184], [246, 184], [252, 189], [246, 194], [170, 194], [168, 194], [166, 194], [164, 194], [160, 194]];
const LAMINA = [[112, 186], [140, 186], [140, 177], [147, 177], [147, 184], [285, 184], [312, 189], [285, 194], [147, 194], [147, 201], [140, 201], [140, 192], [112, 192]];
const lerp = (a, b, f) => a + (b - a) * f;
const formaPeca = f => 'M' + BARRA.map((p, i) => lerp(p[0], LAMINA[i][0], f).toFixed(1) + ' ' + lerp(p[1], LAMINA[i][1], f).toFixed(1)).join(' L') + ' Z';
const BIGORNA = 'M58 208Q90 199 126 202L140 202L140 196L322 196Q330 196 330 202L330 206Q326 214 300 218Q268 222 262 236Q256 252 268 260L300 264Q308 266 308 272L116 272Q116 266 124 264L156 260Q168 252 162 236Q156 222 128 218Q96 214 58 208Z';
const PIVO = '380px 155px', IMPACTO = [215, 184];
function cenaForja(f){
  const jx = lerp(160, 112, f), cx = lerp(206, 212, f), meia = lerp(40, 92, f);
  const chamas = [[86, 46, 1], [104, 58, .9], [122, 50, 1.1], [140, 40, .8], [96, 34, .7]].map(([x, h, e], i) =>
    `<path class="cChama" style="transform-origin:${x}px 196px" d="M${x - 11 * e} 196Q${x - 13 * e} ${196 - h * .55} ${x} ${196 - h}Q${x + 13 * e} ${196 - h * .55} ${x + 11 * e} 196Z" fill="url(#gChama)" opacity="${.75 - i * .06}"/>`).join('');
  const brasas = [[62, 195, 7], [78, 198, 9], [96, 194, 8], [114, 198, 10], [132, 195, 8], [150, 198, 7], [88, 200, 6], [124, 201, 7]].map(([x, y, r]) =>
    `<circle class="cCarvao" cx="${x}" cy="${y + 3}" r="${r * .7}" fill="url(#gCarvao)" opacity=".8"/>`).join('');
  const pedras = [[2, 52, 46, 22], [50, 50, 52, 20], [106, 48, 50, 22], [160, 52, 46, 20], [0, 78, 30, 26], [170, 76, 34, 24], [0, 108, 28, 28], [174, 104, 32, 28],
    [0, 140, 30, 26], [172, 136, 34, 28], [0, 170, 28, 30], [176, 168, 30, 30]].map(([x, y, w, h]) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#211813" stroke="#0d0907" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 36 400 290" id="cCena" aria-label="Bigorna com ferro em brasa">
  <defs>
    <radialGradient id="gFogo" cx="50%" cy="100%" r="90%"><stop offset="0" stop-color="#fff1cf"/><stop offset=".18" stop-color="#ffc861"/><stop offset=".4" stop-color="#ff7a1c"/><stop offset=".7" stop-color="#8a1f08"/><stop offset="1" stop-color="#2a0c05"/></radialGradient>
    <linearGradient id="gChama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff1cf"/><stop offset=".25" stop-color="#ffc861"/><stop offset=".6" stop-color="#ff6a1a"/><stop offset="1" stop-color="#b3260e" stop-opacity="0"/></linearGradient>
    <radialGradient id="gCarvao" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#ffe39a"/><stop offset=".35" stop-color="#ff8a24"/><stop offset=".75" stop-color="#9a2a0a"/><stop offset="1" stop-color="#2a0d05"/></radialGradient>
    <radialGradient id="gLuzForja" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gChao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1511" stop-opacity="0"/><stop offset=".22" stop-color="#1d1511"/><stop offset="1" stop-color="#0b0806"/></linearGradient>
    <radialGradient id="gLuzChao" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".35"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gToco" x1="0" x2="1"><stop offset="0" stop-color="#1a0f08"/><stop offset=".25" stop-color="#4a2e1a"/><stop offset=".45" stop-color="#6a4428"/><stop offset=".75" stop-color="#3a2414"/><stop offset="1" stop-color="#140b06"/></linearGradient>
    <radialGradient id="gTocoTopo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#a87a50"/><stop offset=".6" stop-color="#7a5234"/><stop offset="1" stop-color="#4a2e1a"/></radialGradient>
    <linearGradient id="gBigorna" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#57504b"/><stop offset=".12" stop-color="#36302d"/><stop offset=".55" stop-color="#1c1816"/><stop offset="1" stop-color="#0c0a09"/></linearGradient>
    <linearGradient id="gBigornaLado" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
    <linearGradient id="gTopo" x1="0" x2="1"><stop offset="0" stop-color="#6d655f"/><stop offset=".45" stop-color="#b0a59d"/><stop offset=".6" stop-color="#d8cdc4"/><stop offset="1" stop-color="#6d655f"/></linearGradient>
    <radialGradient id="gReflexo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".4" stop-color="#ff8a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gAquecido" cx="30%" cy="0%" r="80%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e4"/><stop offset=".25" stop-color="#ffe08f"/><stop offset=".55" stop-color="#ffa13c"/><stop offset=".8" stop-color="#e2541b"/><stop offset="1" stop-color="#8a2208"/></linearGradient>
    <linearGradient id="gMetalPontas" x1="0" x2="1"><stop offset="0" stop-color="#6a1405" stop-opacity=".9"/><stop offset=".28" stop-color="#6a1405" stop-opacity="0"/><stop offset=".72" stop-color="#6a1405" stop-opacity="0"/><stop offset="1" stop-color="#6a1405" stop-opacity=".9"/></linearGradient>
    <linearGradient id="gCabeca" x1="0" x2="1"><stop offset="0" stop-color="#1a1614"/><stop offset=".22" stop-color="#4a423d"/><stop offset=".46" stop-color="#9b908a"/><stop offset=".54" stop-color="#d6ccc4"/><stop offset=".72" stop-color="#6d625b"/><stop offset="1" stop-color="#211c19"/></linearGradient>
    <linearGradient id="gCabecaBaixo" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#ff8a2a" stop-opacity="0"/><stop offset="1" stop-color="#ff8a2a" stop-opacity=".8"/></linearGradient>
    <linearGradient id="gCabo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c08a55"/><stop offset=".35" stop-color="#8f5e36"/><stop offset=".8" stop-color="#5a3720"/><stop offset="1" stop-color="#341e10"/></linearGradient>
    <linearGradient id="gTenaz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a605a"/><stop offset=".5" stop-color="#2c2623"/><stop offset="1" stop-color="#110e0c"/></linearGradient>
    <radialGradient id="gClarao" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".2" stop-color="#fff1cf"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".7"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gRasto" gradientUnits="userSpaceOnUse" x1="240" y1="68" x2="215" y2="160"><stop offset="0" stop-color="#ffd9b0" stop-opacity="0"/><stop offset="1" stop-color="#ffd9b0" stop-opacity=".5"/></linearGradient>
    <filter id="fB1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="fB3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="fB6" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="fB14" x="-80%" y="-200%" width="260%" height="500%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="fGrao" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="2" seed="7" result="r"/>
      <feColorMatrix in="r" type="matrix" values="0 0 0 0 .62  0 0 0 0 .56  0 0 0 0 .52  0 0 0 1.4 -.62" result="n"/><feComposite in="n" in2="SourceGraphic" operator="in"/></filter>
    <radialGradient id="gMascara" gradientUnits="userSpaceOnUse" cx="98" cy="150" r="175"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <mask id="mParede" maskUnits="userSpaceOnUse" x="-80" y="0" width="400" height="260"><rect x="-80" y="0" width="400" height="260" fill="url(#gMascara)"/></mask>
    <clipPath id="cpBigorna"><path d="${BIGORNA}"/></clipPath>
    <clipPath id="cpBoca"><path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202Z"/></clipPath>
  </defs>

  <g filter="url(#fB1)" opacity=".95" mask="url(#mParede)">
    <path d="M-40 202L-40 44L210 44L210 202Z" fill="#17110d"/>
    ${pedras}
    <ellipse cx="98" cy="150" rx="110" ry="90" fill="url(#gLuzForja)"/>
    <g clip-path="url(#cpBoca)"><rect x="30" y="80" width="140" height="130" fill="url(#gFogo)"/>${chamas}${brasas}</g>
    <path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202" fill="none" stroke="#ff9a3c" stroke-width="3" opacity=".55" filter="url(#fB3)"/>
    <path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202" fill="none" stroke="#0d0907" stroke-width="4"/>
  </g>

  <rect x="-60" y="232" width="520" height="110" fill="url(#gChao)"/>
  <ellipse cx="212" cy="272" rx="190" ry="26" fill="url(#gLuzChao)"/>

  <path d="M120 270L120 340L304 340L304 270Z" fill="url(#gToco)"/>
  <path d="M138 280Q134 305 140 335M168 276Q172 300 166 335M196 282Q192 310 198 335M234 280Q238 305 232 335M262 278Q258 304 264 335M288 282Q292 306 286 335" stroke="#140b06" stroke-width="2.2" fill="none" opacity=".7"/>
  <ellipse cx="212" cy="270" rx="92" ry="12" fill="url(#gTocoTopo)"/>
  <ellipse cx="212" cy="270" rx="66" ry="8.5" fill="none" stroke="#4a2e1a" stroke-width="1.2" opacity=".7"/>
  <ellipse cx="212" cy="270" rx="38" ry="5" fill="none" stroke="#4a2e1a" stroke-width="1.2" opacity=".7"/>

  <path d="${BIGORNA}" fill="url(#gBigorna)"/>
  <g clip-path="url(#cpBigorna)">
    <rect x="50" y="190" width="290" height="90" fill="url(#gBigornaLado)"/>
    <rect x="50" y="190" width="290" height="90" fill="url(#gAquecido)"/>
    <ellipse cx="${cx}" cy="204" rx="${meia + 30}" ry="16" fill="url(#gReflexo)" opacity=".55" filter="url(#fB6)"/>
  </g>
  <path d="${BIGORNA}" fill="#000" filter="url(#fGrao)" opacity=".14"/>
  <path d="M58 208Q90 199 126 202L140 202L140 197L130 197Q94 195 63 206Z" fill="url(#gTopo)" opacity=".55"/>
  <path d="M140 196L322 196L317 190L145 190Z" fill="url(#gTopo)"/>
  <path d="M140 196L322 196" stroke="#efe4da" stroke-width="1" opacity=".55"/>
  <rect x="298" y="191.2" width="9" height="3.6" rx=".6" fill="#0b0908"/><ellipse cx="286" cy="193" rx="2.6" ry="1.6" fill="#0b0908"/>
  <ellipse cx="${cx}" cy="193" rx="${meia + 26}" ry="5" fill="url(#gReflexo)" filter="url(#fB3)"/>

  <ellipse id="cBrilho" cx="${cx}" cy="186" rx="${meia + 40}" ry="22" fill="#ff7a1c" opacity=".45" filter="url(#fB14)"/>
  <path id="cPecaBrilho" d="${formaPeca(f)}" fill="#ff9a3c" filter="url(#fB3)" opacity=".9"/>
  <path id="cPeca" d="${formaPeca(f)}" fill="url(#gMetal)"/>
  <path d="${formaPeca(f)}" fill="url(#gMetalPontas)"/>
  <ellipse cx="${cx + 4}" cy="187" rx="${meia * .66}" ry="2.2" fill="#fffdf2" opacity=".95" filter="url(#fB1)"/>

  <g>
    <path d="M${jx + 9} 183.5Q${jx - 4} 179 ${jx - 20} 179L-40 126" fill="none" stroke="url(#gTenaz)" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M${jx + 9} 194.5Q${jx - 6} 199 ${jx - 22} 186L-40 140" fill="none" stroke="url(#gTenaz)" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="${jx - 21}" cy="182.5" r="3.6" fill="#5a504a" stroke="#0d0b0a" stroke-width="1"/>
    <ellipse cx="${jx + 6}" cy="189" rx="10" ry="8" fill="#ff8a2a" opacity=".35" filter="url(#fB3)"/>
  </g>

  <path id="cRasto" d="M246 72A165 165 0 0 0 215 155" fill="none" stroke="url(#gRasto)" stroke-width="34" stroke-linecap="round" opacity="0" filter="url(#fB3)"/>
  <g id="cMarteloIdle" style="transform-origin:${PIVO}">
    <g id="cMartelo" style="transform-origin:${PIVO};transform:rotate(32deg)">
      <path d="M190 151L420 146L420 162L190 160Z" fill="url(#gCabo)"/>
      <path d="M238 153.5Q320 151.5 418 150M240 157.5Q330 157 418 156.5" stroke="#3a2212" stroke-width=".8" fill="none" opacity=".55"/>
      <path d="M199 184L231 184L234 180L234 162Q234 158 232 156L228 140L222 128L208 128L202 140L198 156Q196 158 196 162L196 180Z" fill="url(#gCabeca)"/>
      <path d="M199 184L231 184L234 180L234 162Q234 158 232 156L228 140L222 128L208 128L202 140L198 156Q196 158 196 162L196 180Z" fill="url(#gCabecaBaixo)"/>
      <path d="M208 128L222 128" stroke="#e9e0d8" stroke-width="1.2" opacity=".7"/>
      <path d="M196 180L234 180" stroke="#cfc4bb" stroke-width=".8" opacity=".5"/>
    </g>
  </g>
  <ellipse id="cOnda" cx="${IMPACTO[0]}" cy="191" rx="50" ry="7" fill="none" stroke="#ffd27a" stroke-width="2.5" opacity="0" style="transform-origin:${IMPACTO[0]}px 191px"/>
  <circle id="cClarao" cx="${IMPACTO[0]}" cy="${IMPACTO[1]}" r="34" fill="url(#gClarao)" opacity="0" style="transform-origin:${IMPACTO[0]}px ${IMPACTO[1]}px"/>
</svg>`;
}
function animarCena(){
  const anima = (el, k, o) => el && el.animate(k, Object.assign({iterations: Infinity, direction: 'alternate', easing: 'ease-in-out'}, o));
  document.querySelectorAll('#capa .cChama').forEach((c, i) => anima(c, [{transform: 'scaleY(.82) scaleX(1.05)', opacity: .55}, {transform: 'scaleY(1.12) scaleX(.94)', opacity: .9}], {duration: 520 + i * 170, delay: -i * 230}));
  document.querySelectorAll('#capa .cCarvao').forEach((c, i) => anima(c, [{opacity: .7}, {opacity: 1}], {duration: 700 + (i % 3) * 400, delay: -i * 300}));
  anima($('#cBrilho'), [{opacity: .35}, {opacity: .55}], {duration: 1800});
  anima($('#cMarteloIdle'), [{transform: 'rotate(0deg)'}, {transform: 'rotate(-2.5deg)'}], {duration: 1400});
}
let golpes = 0, capaAberta = false, escondidoEm = 0, actx = null;
function mostrarCapa(forcar){
  if (!cfg.pronto || (!forcar && (cfg.capa === false || ativo))) return;
  golpes = 0; capaAberta = true;
  const c = $('#capa'); c.classList.remove('sair'); c.hidden = false; renderCapa();
  $('#faiscas').style.zIndex = 46;
}
function renderCapa(){
  const h = new Date().getHours(), ola = h < 6 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
  const feitos = semana().filter(d => d.acesa).length, f = Math.min(1, feitos / Math.max(1, cfg.dias)), pronta = f >= 1;
  const ult = ordenados()[0], dUlt = ult ? diasDesde(ult.inicio) : null, mes = treinos.filter(t => chaveMes(t.inicio) === chaveMes(Date.now())).length;
  const sug = sugestao();
  $('#capa').innerHTML = `
    <div><div class="cinzel quente" style="font-size:15px;letter-spacing:.3em">FORJA</div>
      <h1 style="font-size:22px;margin-top:14px;color:var(--texto);letter-spacing:.04em">${ola}${cfg.nome ? ', ' + esc(cfg.nome) : ''}</h1>
      ${sug ? `<p class="suave peq" style="margin:6px 0 0">Hoje: <b style="color:var(--ouro)">${TIPOS[sug.tipo].nome}</b>, ${esc(sug.motivo)}</p>` : ''}</div>
    <div class="cena">
      ${cenaForja(f)}
      <h2 style="margin-top:4px">${pronta ? 'Lâmina forjada esta semana' : 'A peça da semana'}</h2>
      <p class="suave peq" style="margin:4px 0 0">${feitos} de ${cfg.dias} treinos${pronta ? '. Bom trabalho, ferreiro.' : '. Cada treino molda o ferro até virar lâmina.'}</p>
    </div>
    <div style="width:min(420px,100%)">
      <div class="infos"><div>Esta semana<b>${feitos}/${cfg.dias}</b></div><div>Este mês<b>${mes} ${mes === 1 ? 'treino' : 'treinos'}</b></div>
        <div>Último treino<b>${dUlt === null ? '—' : dUlt === 0 ? 'hoje' : dUlt === 1 ? 'ontem' : 'há ' + dUlt + ' dias'}</b></div></div>
      <div class="golpes" id="cGolpes"><i></i><i></i><i></i></div>
      <p class="suave peq" id="cDica" style="margin:0">Dá três marteladas para entrar</p>
    </div>`;
  animarCena();
}
function golpe(){
  if (!capaAberta || golpes >= 3) return;
  const n = ++golpes, m = $('#cMartelo');
  m.getAnimations().forEach(a => a.cancel());
  m.animate([{transform: 'rotate(32deg)'}, {transform: 'rotate(48deg)', offset: .36}, {transform: 'rotate(-.5deg)', offset: .58}, {transform: 'rotate(7deg)', offset: .7}, {transform: 'rotate(32deg)'}],
    {duration: 520, easing: 'ease-in-out'});
  $('#cRasto').animate([{opacity: 0}, {opacity: 0, offset: .38}, {opacity: .7, offset: .5}, {opacity: 0, offset: .62}, {opacity: 0}], {duration: 520});
  clang(n === 3, .3);
  setTimeout(() => impacto(n), 300);
}
function impacto(n){
  const svgEl = $('#cCena'); if (!svgEl) return;
  const pt = svgEl.createSVGPoint(); pt.x = IMPACTO[0]; pt.y = IMPACTO[1];
  const p = pt.matrixTransform(svgEl.getScreenCTM());
  const ecra = (x, y) => { const q = svgEl.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(svgEl.getScreenCTM()); };
  const a = ecra(145, 190), b = ecra(317, 190);
  Faiscas.explosao(p.x, p.y, n === 3 ? 140 : 60, true, {y: a.y, x1: a.x, x2: b.x});
  vibrar(n === 3 ? [60, 40, 90] : 35);
  $('#capa').animate([{transform: 'translate(0,0)'}, {transform: 'translate(-5px,4px)'}, {transform: 'translate(4px,-3px)'}, {transform: 'translate(-2px,1px)'}, {transform: 'translate(0,0)'}], {duration: 200});
  $('#cClarao').animate([{opacity: 1, transform: 'scale(.3)'}, {opacity: 0, transform: `scale(${n === 3 ? 2.6 : 1.7})`}], {duration: n === 3 ? 420 : 260, easing: 'ease-out'});
  $('#cOnda').animate([{opacity: .9, transform: 'scale(.15,.4)'}, {opacity: 0, transform: `scale(${n === 3 ? 2.2 : 1.5},1.1)`}], {duration: 380, easing: 'ease-out'});
  ['#cPeca', '#cPecaBrilho'].forEach(s => $(s).animate([{filter: 'brightness(1.9)'}, {filter: 'brightness(1)'}], {duration: n === 3 ? 900 : 450, easing: 'ease-out'}));
  document.querySelectorAll('#cGolpes i').forEach((d, i) => d.classList.toggle('on', i < n));
  $('#cDica').textContent = n === 1 ? 'Mais duas…' : n === 2 ? 'Mais uma!' : 'O ferro está pronto.';
  if (n >= 3) setTimeout(fecharCapa, 750);
}
function fecharCapa(){
  capaAberta = false; const c = $('#capa'); c.classList.add('sair');
  setTimeout(() => { c.hidden = true; c.innerHTML = ''; $('#faiscas').style.zIndex = ''; }, 520);
}
// Som de martelo em metal, sintetizado (sem ficheiros de áudio).
function clang(forte, atraso){
  if (cfg.som === false) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + (atraso || 0), saida = actx.createGain();
    saida.gain.value = forte ? .55 : .38; saida.connect(actx.destination);
    [[440, .8, 1.4], [1093, .45, 1.0], [1847, .32, .8], [2563, .22, .6], [3470, .14, .45]].forEach(([fr, a, dur]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = fr * (.985 + Math.random() * .03);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .004); g.gain.exponentialRampToValueAtTime(.0005, t + dur * (forte ? 1.3 : 1));
      o.connect(g); g.connect(saida); o.start(t); o.stop(t + dur * 1.4);
    });
    const len = Math.floor(actx.sampleRate * .05), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = actx.createBufferSource(), hp = actx.createBiquadFilter(), gn = actx.createGain();
    s.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 1800; gn.gain.value = .7;
    s.connect(hp); hp.connect(gn); gn.connect(saida); s.start(t);
  } catch(e){}
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ escondidoEm = Date.now(); return; }
  if (escondidoEm && Date.now() - escondidoEm > 30 * 60e3 && $('#folha').hidden){ escondidoEm = 0; if (vista !== 'vTreino') RENDER[vista](); mostrarCapa(); }
});

/* ---------- Ações ---------- */
const alterna = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
const ACOES = {
  fecharFolha, irTreino: () => { fecharFolha(); irPara('vTreino'); },
  acender(){ if (!rapido) novoRapido(); folhaRapido(); },
  usarSugestao(a){ novoRapido(a.dataset.v); gerar(); },
  rTipo(a){ rapido.tipo = a.dataset.v; folhaRapido(); }, rDur(a){ rapido.duracao = +a.dataset.v; folhaRapido(); },
  rEq(a){ rapido.equip = alterna(rapido.equip, a.dataset.v); folhaRapido(); }, rMus(a){ rapido.musculos = alterna(rapido.musculos, a.dataset.v); folhaRapido(); },
  gerar(a){ gerar(); if (a) Faiscas.de(a, 14); },
  pTrocar(a){ if (trocarNoPlano(rapido.plano, +a.dataset.i, rapido.equip)) folhaPlano(); },
  pTirar(a){ rapido.plano.splice(+a.dataset.i, 1); folhaPlano(); },
  pAdicionar(){ folhaSeletor('plano'); },
  comecar,
  selMus(a){ sel.mus = a.dataset.v; a.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === a)); listaSeletor(); },
  selEscolher(a){
    const ex = EXI[a.dataset.id];
    if (sel.destino === 'plano'){ rapido.plano.push(novoItem(ex)); folhaPlano(); return; }
    if (sel.destino === 'trocar'){ const it = novoItem(ex, ativo.itens[sel.i].series.length); preencherSugestoes([it]); ativo.itens[sel.i] = it; }
    else { const it = novoItem(ex); preencherSugestoes([it]); ativo.itens.push(it); }
    guardarAtivo(true); fecharFolha(); renderTreino();
  },
  feito: marcarFeito,
  maisSerie(a){ const it = ativo.itens[+a.dataset.i], u = it.series[it.series.length - 1]; it.series.push({kg: u ? u.kg : '', reps: '', feito: false}); guardarAtivo(true); atualizarCard(+a.dataset.i); },
  menosSerie(a){ const it = ativo.itens[+a.dataset.i]; if (it.series.length > 1){ it.series.pop(); guardarAtivo(true); atualizarCard(+a.dataset.i); } },
  tAdicionar(){ folhaSeletor('treino'); },
  tMenu(a){
    const i = +a.dataset.i, ex = EXI[ativo.itens[i].id];
    abrirFolha(cab(esc(ex.n)) + `<div class="col">
      <button class="btn" data-acao="verEx" data-id="${ex.id}">Ver como se faz</button>
      <button class="btn" data-acao="tTrocar" data-i="${i}">${IC.trocar} Trocar por outro parecido</button>
      <button class="btn" data-acao="tEscolher" data-i="${i}">Escolher outro exercício</button>
      <div class="botoes"><button class="btn" data-acao="tMover" data-i="${i}" data-v="-1" ${i ? '' : 'disabled'}>${IC.cima} Subir</button><button class="btn" data-acao="tMover" data-i="${i}" data-v="1" ${i < ativo.itens.length - 1 ? '' : 'disabled'}>${IC.baixo} Descer</button></div>
      <button class="btn perigo" data-acao="tRemover" data-i="${i}">${IC.lixo} Remover do treino</button></div>`);
  },
  tTrocar(a){ const i = +a.dataset.i; if (ativo.itens[i].series.some(s => s.feito) && !confirm('Já tens séries feitas neste exercício. Trocar na mesma?')) return;
    if (trocarNoPlano(ativo.itens, i, cfg.equip)){ preencherSugestoes([ativo.itens[i]]); guardarAtivo(true); fecharFolha(); renderTreino(); } },
  tEscolher(a){ folhaSeletor('trocar', +a.dataset.i); },
  tMover(a){ const i = +a.dataset.i, j = i + +a.dataset.v; [ativo.itens[i], ativo.itens[j]] = [ativo.itens[j], ativo.itens[i]]; guardarAtivo(true); fecharFolha(); renderTreino(); },
  tRemover(a){ ativo.itens.splice(+a.dataset.i, 1); guardarAtivo(true); fecharFolha(); renderTreino(); },
  terminar, cancelarTreino(){ if (confirm('Cancelar este treino? O que registaste perde-se.')){ ativo = null; guardarAtivo(true); pararDescanso(); irPara('vInicio'); } },
  dMenos(){ descanso.fim -= 15000; descanso.total = Math.max(1000, descanso.total - 15000); LS.set('descanso', descanso); desenharDescanso(); },
  dMais(){ descanso.fim = Math.max(descanso.fim, Date.now()) + 15000; descanso.total += 15000; descanso.avisado = false; LS.set('descanso', descanso); desenharDescanso(); },
  dSaltar: pararDescanso,
  verEx(a){ const f = folhaAtual; voltarFolha = f === 'plano' ? folhaPlano : f.startsWith('treino:') ? () => folhaTreino(f.slice(7)) : null; folhaEx(a.dataset.id); },
  voltarFolha(){ const f = voltarFolha; voltarFolha = null; if (f) f(); },
  fav(a){ cfg.favs = alterna(cfg.favs, a.dataset.id); guardarCfg(true); folhaEx(a.dataset.id); if (vista === 'vExercicios') renderExercicios(); },
  addAoTreino(a){ const it = novoItem(EXI[a.dataset.id]); preencherSugestoes([it]); ativo.itens.push(it); guardarAtivo(true); fecharFolha(); irPara('vTreino'); toast('Adicionado ao treino.'); },
  iaDicas(a){ const st = $('#iaEstado'); if (st) st.textContent = 'A preparar…'; pedirDicas(a.dataset.id); },
  exEq(a){ exf.eq = a.dataset.v; exf.mus = ''; exf.cat = 'forca'; renderExercicios(); },
  exVoltar(){ exf.eq = null; exf.q = ''; renderExercicios(); },
  exCat(a){ exf.cat = a.dataset.v; renderExercicios(); }, exMus(a){ exf.mus = a.dataset.v; renderExercicios(); },
  exOutros(a, e){ if (e.target.closest('summary')) setTimeout(() => { exf.outros = a.open; }, 0); },
  verTreino(a){ folhaTreino(a.dataset.id); },
  repetir(a){
    const t = treinos.find(x => x.id === a.dataset.id); novoRapido(t.tipo); rapido.real = t.tipo; rapido.nome = t.nome;
    rapido.plano = t.itens.filter(it => EXI[it.id]).map(it => novoItem(EXI[it.id], it.series.length)); folhaPlano();
  },
  apagarTreino(a){
    if (!confirm('Apagar este treino do histórico?')) return;
    const t = treinos.find(x => x.id === a.dataset.id), m = chaveMes(t.inicio);
    treinos = treinos.filter(x => x.id !== t.id); apagados[t.id] = {mes: m, ts: Date.now()}; guardarTreinos(); marcarSujo(m);
    fecharFolha(); RENDER[vista]();
  },
  pObj(a){ cfg.objetivo = a.dataset.v; guardarCfg(true); renderPerfil(); }, pNiv(a){ cfg.nivel = +a.dataset.v; guardarCfg(true); renderPerfil(); },
  pDias(a){ cfg.dias = +a.dataset.v; guardarCfg(true); renderPerfil(); }, pDur(a){ cfg.duracao = +a.dataset.v; guardarCfg(true); renderPerfil(); },
  pEq(a){ cfg.equip = alterna(cfg.equip, a.dataset.v); guardarCfg(true); rapido = null; a.classList.toggle('on'); },
  guardarImagens(a){ guardarImagens(a); },
  verChave(){ const i = $('#pChave'); i.type = i.type === 'password' ? 'text' : 'password'; },
  async testarIA(a){
    cfg.chave = $('#pChave').value.trim(); guardarCfg(); const t = $('#iaTeste');
    if (!cfg.chave){ t.textContent = 'Chave removida.'; return; }
    a.disabled = true; t.textContent = 'A testar…';
    try { const n = await listarModelos(); t.textContent = n.length ? `Ligação certa. Modelo: ${cfg.modelo}.` : 'Ligação certa.'; Faiscas.de(a, 20); }
    catch(e){ t.textContent = e.message; } finally { a.disabled = false; }
  },
  async ligarGH(){
    gh.dono = $('#gDono').value.trim(); gh.repo = $('#gRepo').value.trim(); gh.token = $('#gToken').value.trim(); LS.set('gh', gh);
    if (!ghLigado()) return toast('Preenche os três campos.');
    sync.shas = {}; sync.erro = ''; for (const t of treinos) sync.sujos[chaveMes(t.inicio)] = Date.now();
    if (!treinos.length) cfg.ts = 0;  // dispositivo novo: o perfil guardado no repositório prevalece
    guardarSync(); await sincronizar(); renderPerfil(); toast(sync.erro ? sync.erro : 'Sincronização ligada.');
  },
  desligarGH(){ if (!confirm('Desligar a sincronização? Os dados ficam neste dispositivo.')) return; gh.token = ''; LS.set('gh', gh); sync.shas = {}; sync.sujos = {}; guardarSync(); renderPerfil(); },
  exportar, importar,
  pCapa(){ cfg.capa = cfg.capa === false; guardarCfg(); renderPerfil(); },
  pSom(){ cfg.som = cfg.som === false; guardarCfg(); renderPerfil(); if (cfg.som) clang(false); },
  verCapa(){ mostrarCapa(true); },
  iObj(a){ intro.d.objetivo = a.dataset.v; renderIntro(); }, iNiv(a){ intro.d.nivel = +a.dataset.v; renderIntro(); },
  iDias(a){ intro.d.dias = +a.dataset.v; renderIntro(); }, iDur(a){ intro.d.duracao = +a.dataset.v; renderIntro(); },
  iEq(a){ intro.d.equip = alterna(intro.d.equip, a.dataset.v); a.classList.toggle('on'); },
  iVoltar(){ intro.passo--; renderIntro(); },
  iSeguinte(a){
    if (intro.passo < 4){ intro.passo++; renderIntro(); return; }
    Object.assign(cfg, intro.d, {pronto: true}); guardarCfg(true);
    $('#intro').hidden = true; irPara('vInicio'); Faiscas.explosao(innerWidth / 2, innerHeight * .4, 60); vibrar(40);
  }
};
const CAMPOS = {
  kg(el){ ativo.itens[+el.dataset.i].series[+el.dataset.j].kg = el.value; guardarAtivo(); },
  reps(el){ ativo.itens[+el.dataset.i].series[+el.dataset.j].reps = el.value; guardarAtivo(); },
  selQ(el){ sel.q = el.value; listaSeletor(); },
  exQ(el){ exf.q = el.value; if (!!$('#exLista') !== !!(exf.eq || exf.q)){ renderExercicios(); const i = $('[data-campo="exQ"]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } else listaExercicios(); },
  pNome(el){ cfg.nome = el.value.trim(); guardarCfg(true); },
  iNome(el){ intro.d.nome = el.value.trim(); }
};
document.addEventListener('click', e => {
  const n = e.target.closest('#nav [data-vista]'); if (n){ fecharFolha(); irPara(n.dataset.vista); return; }
  const a = e.target.closest('[data-acao]'); if (!a) return;
  if (a.tagName === 'DETAILS' && !e.target.closest('summary')) return;
  const f = ACOES[a.dataset.acao]; if (f) f(a, e);
});
document.addEventListener('input', e => { const c = e.target.closest('[data-campo]'); if (c && CAMPOS[c.dataset.campo]) CAMPOS[c.dataset.campo](c, e); });
document.addEventListener('visibilitychange', () => { if (document.hidden && ativo) LS.set('ativo', ativo); if (!document.hidden) agendarSync(800); });
addEventListener('online', () => agendarSync(500));
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#folha').hidden) fecharFolha(); });

/* ---------- Arranque ---------- */
(async function iniciar(){
  $('#vInicio').innerHTML = '<div class="vazio">A acender a forja…</div>';
  try { EX = await (await fetch('exercicios.json')).json(); }
  catch(e){ $('#vInicio').innerHTML = '<div class="placa vazio">Não consegui carregar os exercícios. Verifica a ligação e abre a app de novo.</div>'; return; }
  EXI = Object.fromEntries(EX.map(e => [e.id, e]));
  if (ativo) ativo.itens = ativo.itens.filter(it => EXI[it.id]);
  if (!cfg.pronto){ intro.d.nome = cfg.nome || ''; $('#intro').hidden = false; renderIntro(); }
  irPara(ativo ? 'vTreino' : 'vInicio');
  if (descanso) desenharDescanso();
  setInterval(tique, 1000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  estadoSync(); agendarSync(800);
  const capa = $('#capa');
  capa.addEventListener('pointerdown', e => { e.preventDefault(); golpe(); });
  capa.addEventListener('pointerup', () => { if (cfg.som === false) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch(e){} });
  addEventListener('keydown', e => { if (capaAberta && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); golpe(); } });
  if (new URLSearchParams(location.search).get('acao') === 'treinar' && cfg.pronto && !ativo) ACOES.acender();
  else mostrarCapa();
})();
