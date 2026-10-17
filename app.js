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
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'), seta: svg('<path d="M5 12h13M13 6l6 6-6 6"/>', 2),
  ia: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
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
  longevidade: {nome: 'Saúde e longevidade', sub: 'força funcional, equilíbrio, pega, postura e mobilidade', plano: ['quads', 'post', 'gluteos', 'peito', 'costas', 'lombar', 'abs', 'antebracos', 'ombros']},
  mobilidade: {nome: 'Mobilidade e alongamentos', sub: 'articulações soltas e alongamentos para o corpo todo', plano: []},
  musculos: {nome: 'Escolher músculos'},
  livre: {nome: 'Montar o meu treino', sub: 'escolhes da lista os exercícios que queres', plano: []},
  ia: {nome: 'Treino do ferreiro', sub: 'montado pela IA', plano: ['quads', 'peito', 'dorsais', 'post', 'ombros', 'costas', 'abs', 'biceps', 'triceps', 'gemeos'], oculto: true}
};
// Aquecimento: [id, alvo]. Alongamentos por músculo. Longevidade: [grupo, prioridade, opções [id, alvo], séries, descanso].
const AQUEC = {
  geral: [['Star_Jump', '45 s'], ['Fast_Skipping', '45 s'], ['Mountain_Climbers', '30 s']],
  superior: [['Arm_Circles', '20 s'], ['Shoulder_Circles', '20 s'], ['Dynamic_Chest_Stretch', '10 reps'], ['Band_Pull_Apart', '15 reps'], ['Wrist_Circles', '20 s']],
  inferior: [['Standing_Hip_Circles', '10 por lado'], ['Bodyweight_Squat', '10 reps'], ['Worlds_Greatest_Stretch', '4 por lado'], ['Groiners', '8 reps'], ['Ankle_Circles', '20 s']],
  tronco: [['Cat_Stretch', '8 reps'], ['Inchworm', '5 reps'], ['Dynamic_Back_Stretch', '10 reps']]
};
const ALONG = {peito: ['Chest_And_Front_Of_Shoulder_Stretch', 'Dynamic_Chest_Stretch'], ombros: ['Shoulder_Stretch', 'Upward_Stretch'], triceps: ['Triceps_Stretch'],
  biceps: ['Standing_Biceps_Stretch'], dorsais: ['Overhead_Lat', 'Childs_Pose'], costas: ['Middle_Back_Stretch', 'Upper_Back_Stretch'], lombar: ['Childs_Pose', 'Hug_Knees_To_Chest'],
  quads: ['Quad_Stretch', 'Kneeling_Hip_Flexor'], post: ['Standing_Hamstring_and_Calf_Stretch', 'Seated_Floor_Hamstring_Stretch'], gluteos: ['Knee_Across_The_Body', 'Seated_Glute'],
  gemeos: ['Calf_Stretch_Hands_Against_Wall'], adutores: ['Adductor_Groin'], abdutores: ['IT_Band_and_Glute_Stretch'], abs: ['Standing_Lateral_Stretch'],
  antebracos: ['Kneeling_Forearm_Stretch'], trapezio: ['Side_Neck_Stretch'], pescoco: ['Side_Neck_Stretch']};
const SUPERIORES = ['peito', 'ombros', 'triceps', 'biceps', 'dorsais', 'costas', 'trapezio', 'antebracos'];
const LONGEV = [
  ['pernas', 1, [['Goblet_Squat', '8–12'], ['forja_sentar_levantar', '10–15'], ['Dumbbell_Step_Ups', '8–10 por perna'], ['Bodyweight_Squat', '12–15']], 3, 75],
  ['anca', 4, [['Romanian_Deadlift', '8–12'], ['Stiff-Legged_Dumbbell_Deadlift', '8–12'], ['Barbell_Glute_Bridge', '10–12'], ['Butt_Lift_Bridge', '12–15']], 3, 75],
  ['empurrar', 5, [['Pushups', '8–12'], ['Incline_Push-Up', '10–12'], ['Dumbbell_Bench_Press', '8–12'], ['Standing_Dumbbell_Press', '8–12']], 3, 75],
  ['puxar', 2, [['One-Arm_Dumbbell_Row', '10–12'], ['Inverted_Row', '8–12'], ['Bent_Over_Two-Dumbbell_Row', '10–12'], ['Face_Pull', '12–15'], ['Band_Pull_Apart', '15–20']], 3, 60],
  ['pega', 6, [['Farmers_Walk', '30–40 s'], ['forja_suspensao', '20–30 s']], 3, 60],
  ['equilibrio', 3, [['forja_equilibrio', '30 s por perna'], ['Kettlebell_One-Legged_Deadlift', '8 por perna'], ['forja_marcha_linha', '20 passos']], 2, 30],
  ['core', 4, [['forja_bird_dog', '8 por lado'], ['Dead_Bug', '8 por lado'], ['Side_Bridge', '20–30 s'], ['Plank', '30–45 s'], ['Pallof_Press', '10 por lado']], 2, 45],
  ['postura', 7, [['forja_anjos_parede', '10–12'], ['Band_Pull_Apart', '15–20'], ['Face_Pull', '12–15']], 2, 45],
  ['mobilidade', 8, [['Worlds_Greatest_Stretch', '5 por lado'], ['Cat_Stretch', '10 reps'], ['Inchworm', '5 reps']], 1, 15]
];
const FRASES = ['Malha enquanto o ferro está quente.', 'Cada série é uma martelada.', 'O ferro não se molda sozinho.',
  'Hoje forjas o corpo de amanhã.', 'A disciplina é o fogo; o treino é o martelo.', 'Aço bom leva muitas marteladas.', 'Brasa que não se alimenta, apaga.'];

/* ---------- Estado ---------- */
const BASE = EQUIP.filter(e => e.base).map(e => e.id);
let cfg = Object.assign({nome: '', objetivo: 'hipertrofia', nivel: 1, dias: 3, duracao: 60, equip: BASE.slice(), favs: [], modelos: [], meta: 0, chave: '', modelo: 'gemini-flash-latest', pronto: false, ts: 0}, LS.get('cfg', {}));
let treinos = LS.get('treinos', []);
let apagados = LS.get('apagados', {});
let ativo = LS.get('ativo', null);
let descanso = LS.get('descanso', null);
let dicas = LS.get('dicas', {});
let EX = [], EXI = {};
const PARTILHADO = ['nome', 'objetivo', 'nivel', 'dias', 'duracao', 'equip', 'favs', 'modelos', 'meta', 'aquecer', 'alongar'];
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
const imgSrc = p => p.startsWith('local/') ? 'pictogramas/' + p.slice(6) : IMG + p;
const img = (ex, k = 0) => ex.i[k] ? imgSrc(ex.i[k]) : '';
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
// Calor de 0 (frio) a 5 (treinado hoje). Os músculos secundários aquecem dois níveis abaixo.
function calorMusculos(){
  const prim = {}, sec = {};
  for (const t of treinos) for (const it of t.itens){
    const ex = EXI[it.id]; if (!ex || it.fase || !it.series.length) continue;
    for (const m of ex.p) prim[m] = Math.max(prim[m] || 0, t.inicio);
    for (const m of ex.s) sec[m] = Math.max(sec[m] || 0, t.inicio);
  }
  const nivel = ts => { if (!ts) return 0; const d = diasDesde(ts); return d <= 0 ? 5 : d === 1 ? 4 : d === 2 ? 3 : d <= 4 ? 2 : d <= 7 ? 1 : 0; };
  const niveis = {}; for (const m of Object.keys(MUSC)) niveis[m] = Math.max(nivel(prim[m]), Math.max(0, nivel(sec[m]) - 2));
  return {niveis, prim};
}
function ultimoPorMusculo(){
  const m = {};
  for (const t of treinos) for (const it of t.itens){
    const ex = EXI[it.id]; if (!ex || !it.series.length || it.fase) continue;
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
  let emissor = null;
  const textura = cores => { const k = document.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    cores.forEach(([o, c]) => r.addColorStop(o, c)); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return k; };
  const BRILHO = textura([[0, 'rgba(255,214,150,1)'], [.25, 'rgba(255,140,50,.55)'], [.6, 'rgba(255,90,20,.15)'], [1, 'rgba(255,60,10,0)']]);
  const FUMO = textura([[0, 'rgba(120,110,104,.55)'], [.5, 'rgba(80,72,68,.22)'], [1, 'rgba(60,55,52,0)']]);
  const sprite = (img, px, py, raio, alfa) => { if (alfa <= .003) return; x.globalAlpha = Math.min(1, alfa); x.drawImage(img, px - raio, py - raio, raio * 2, raio * 2); x.globalAlpha = 1; };
  // riscos: faíscas de forja (traços rápidos que ressaltam na superfície "chao" = {y, x1, x2})
  function explosao(px, py, n = 26, riscos = false, chao = null, forca = 1){
    for (let i = 0; i < n; i++){
      if (riscos){
        const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * (Math.random() < .7 ? 1.75 : 1.1), s = (160 + Math.random() * 460) * forca;
        nova(px + (Math.random() - .5) * 12 * forca, py, Math.cos(a) * s, Math.sin(a) * s, (.55 + Math.random() * 1.05) * (forca < 1 ? .7 : 1), (1 + Math.random() * 1.6) * (forca < 1 ? .75 : 1), 820 * Math.max(.5, forca), {r: 1, chao});
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
    if (emissor && !reduz) emissor(dt, nova);
    if (!reduz){ acum += dt; while (acum > .24){ acum -= .24; if (ps.length < 70) nova(Math.random() * W, H + 4, (Math.random() - .5) * 14, -(22 + Math.random() * 46), 3 + Math.random() * 4.5, .7 + Math.random() * 1.5, -3); } }
    x.globalCompositeOperation = 'lighter';
    for (let i = ps.length - 1; i >= 0; i--){
      const p = ps[i]; p.v += dt; const f = p.v / p.vida;
      if (f >= 1 || p.y < -20){ ps.splice(i, 1); continue; }
      p.vy += p.g * dt; p.vx += Math.sin(p.v * 3 + i) * (p.fumo || p.bk ? 3 : 8) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.fumo){ x.globalCompositeOperation = 'source-over'; sprite(FUMO, p.x, p.y, p.t * (1 + f * 1.6), .3 * Math.sin(Math.PI * f)); x.globalCompositeOperation = 'lighter'; continue; }
      if (p.bk){ sprite(BRILHO, p.x, p.y, p.t, .12 * Math.sin(Math.PI * f)); continue; }
      if (p.a){
        const pisca = .6 + .4 * Math.sin(p.v * 26 + i), alfa = (1 - f * f) * pisca;
        x.strokeStyle = `hsla(${46 - 30 * f},100%,${88 - 35 * f}%,${alfa})`; x.lineWidth = p.t; x.lineCap = 'round';
        x.beginPath(); x.moveTo(p.x - p.vx * .04, p.y - p.vy * .04); x.lineTo(p.x, p.y); x.stroke();
        sprite(BRILHO, p.x, p.y, p.t * 6, .4 * alfa); continue;
      }
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
  return {explosao, emissor(f){ emissor = f; if (f) iniciar(); }, de(el, n){ if (!el) return; const r = el.getBoundingClientRect(); explosao(r.left + r.width / 2, r.top + r.height / 2, n); }};
})();

/* ---------- Fumo ao tocar ----------
   Camada própria, acima de tudo (barra, folhas, avisos). Toque normal: um fio de fumo pequeno.
   Toque em algo clicável: anel de fumo maior, um clarão de metal quente e umas brasas. */
const Fumo = (() => {
  const c = document.createElement('canvas'); c.id = 'fumoToque'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c);
  const x = c.getContext('2d'), reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, ps = [], corre = false, ult = 0;
  function tam(){ const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
  // Nuvens irregulares: vários tufos sobrepostos para não parecerem bolas perfeitas.
  const nuvem = () => { const k = document.createElement('canvas'); k.width = k.height = 96; const g = k.getContext('2d');
    for (let i = 0; i < 16; i++){ const a = Math.random() * 7, d = Math.random() * 22, px = 48 + Math.cos(a) * d, py = 48 + Math.sin(a) * d, r = 14 + Math.random() * 16;
      const gr = g.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, 'rgba(176,160,148,.16)'); gr.addColorStop(.6, 'rgba(120,108,100,.07)'); gr.addColorStop(1, 'rgba(90,80,74,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96); }
    return k; };
  const NUVENS = [nuvem(), nuvem(), nuvem()];
  const CALOR = (() => { const k = document.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,214,150,.9)'); r.addColorStop(.3, 'rgba(255,130,40,.45)'); r.addColorStop(1, 'rgba(255,70,10,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return k; })();
  const R = Math.random;
  const tufo = (px, py, vx, vy, r0, vida, op, cresce) => ps.push({k: 'f', x: px, y: py, vx, vy, r0, vida, op, cresce, v: 0, rot: R() * 7, vr: (R() - .5) * 1.6, img: NUVENS[(R() * 3) | 0]});
  function soprar(px, py, grande){
    if (reduz || ps.length > 160) return;
    if (!grande){
      for (let i = 0; i < 4; i++) tufo(px + (R() - .5) * 8, py + (R() - .5) * 6, (R() - .5) * 30, -(10 + R() * 20), 7 + R() * 4, .9 + R() * .6, .62, 2.5);
    } else {
      const n = 9, a0 = R() * 7;
      for (let i = 0; i < n; i++){ const a = a0 + i / n * Math.PI * 2 + (R() - .5) * .4, s = 70 + R() * 50; tufo(px, py, Math.cos(a) * s, Math.sin(a) * s * .8 - 10, 9 + R() * 5, 1.1 + R() * .6, .72, 2.8); }
      tufo(px, py, 0, -20, 14, 1.4, .5, 2.2);
      ps.push({k: 'c', x: px, y: py, v: 0, vida: .45});
      for (let i = 0; i < 6; i++){ const a = -Math.PI / 2 + (R() - .5) * 2.2, s = 60 + R() * 120; ps.push({k: 'b', x: px, y: py, vx: Math.cos(a) * s, vy: Math.sin(a) * s, v: 0, vida: .5 + R() * .5, t: .8 + R() * .9}); }
    }
    if (!corre){ corre = true; ult = performance.now(); requestAnimationFrame(passo); }
  }
  function passo(t){
    const dt = Math.min(.05, (t - ult) / 1000 || .016), d = Math.min(2, devicePixelRatio || 1); ult = t;
    x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H);
    for (let i = ps.length - 1; i >= 0; i--){
      const p = ps[i]; p.v += dt; const f = p.v / p.vida;
      if (f >= 1){ ps.splice(i, 1); continue; }
      if (p.k === 'c'){ x.globalCompositeOperation = 'lighter'; x.globalAlpha = .55 * (1 - f) * (1 - f); const r = 16 + 26 * f; x.drawImage(CALOR, p.x - r, p.y - r, r * 2, r * 2); continue; }
      if (p.k === 'b'){
        p.vx *= 1 - 2 * dt; p.vy += 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = 1;
        x.fillStyle = `hsla(${44 - 30 * f},100%,${86 - 36 * f}%,${1 - f * f})`; x.beginPath(); x.arc(p.x, p.y, p.t * (1 - f * .4), 0, 7); x.fill();
        continue;
      }
      const arr = Math.max(0, 1 - 3.2 * dt); p.vx *= arr; p.vy = p.vy * arr - 26 * dt; p.x += p.vx * dt + Math.sin(p.v * 2.4 + i) * 6 * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const r = p.r0 * (1 + f * p.cresce), alfa = p.op * Math.min(1, f * 9) * Math.pow(1 - f, 1.6);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = alfa;
      x.setTransform(d * Math.cos(p.rot), d * Math.sin(p.rot), -d * Math.sin(p.rot), d * Math.cos(p.rot), p.x * d, p.y * d);
      x.drawImage(p.img, -r * 1.5, -r * 1.5, r * 3, r * 3); x.setTransform(d, 0, 0, d, 0, 0);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    if (ps.length && !document.hidden) requestAnimationFrame(passo); else { corre = false; x.clearRect(0, 0, W, H); }
  }
  addEventListener('resize', tam); tam();
  // Só conta como toque se o dedo não arrastou (arrastar é deslizar a página, não toque).
  const CLICAVEL = 'button:not(:disabled), a[href], [data-acao], [data-vista], select, label, summary, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"]';
  let ini = null;
  document.addEventListener('pointerdown', e => { ini = e.isPrimary && !capaAberta ? {x: e.clientX, y: e.clientY, t: performance.now(), alvo: e.target} : null; }, {capture: true, passive: true});
  document.addEventListener('pointerup', e => {
    const s = ini; ini = null; if (!s || capaAberta) return;
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 12 || performance.now() - s.t > 700) return;
    soprar(e.clientX, e.clientY, !!(s.alvo.closest && s.alvo.closest(CLICAVEL)));
  }, {capture: true, passive: true});
  document.addEventListener('pointercancel', () => { ini = null; }, true);
  return {soprar};
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
function minutosPlano(itens){ return Math.round(((itens.some(it => it.fase) ? 0 : 300) + itens.reduce((a, it) => a + segundosItem(it), 0)) / 60); }
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
const RENDER = {vInicio: renderInicio, vTreino: renderTreino, vExercicios: renderExercicios, vPeso: () => renderPeso(), vHistorico: renderHistorico, vPerfil: renderPerfil};
// Ao entrar num ecrã, as cantoneiras das placas visíveis aquecem e soltam faíscas, como acabadas de forjar.
function forjarPlacas(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ps = Array.from(document.querySelectorAll('section.vista:not([hidden]) .placa')).filter(p => { const r = p.getBoundingClientRect(); return r.height && r.top < innerHeight - 40 && r.bottom > 0; }).slice(0, 4);
  ps.forEach((p, i) => setTimeout(() => {
    p.classList.remove('acende'); void p.offsetWidth; p.classList.add('acende');
    setTimeout(() => p.classList.remove('acende'), 1600);
    const r = p.getBoundingClientRect();
    Faiscas.explosao(r.left + 7, r.top + 7, 6, true, null, .3);
    Faiscas.explosao(r.right - 7, r.top + 7, 6, true, null, .3);
  }, 90 + i * 130));
}
function irPara(v){
  vista = v;
  document.querySelectorAll('section.vista').forEach(s => s.hidden = s.id !== v);
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.vista === v || (v === 'vTreino' && b.dataset.vista === 'vInicio')));
  RENDER[v]();
  scrollTo(0, 0);
  atualizarBarras();
  if ($('#capa').hidden && $('#intro').hidden) forjarPlacas();
}
let folhaAtual = '', voltarFolha = null, tLento = 0;
function abrirFolha(html, nome = ''){ folhaAtual = nome; const c = $('#folhaCaixa'); c.innerHTML = '<div class="pega"></div>' + html; c.scrollTop = 0; $('#folha').hidden = false; document.body.style.overflow = 'hidden'; }
function fecharFolha(){ if (folhaAtual === 'aforjar') cancelarIA(); clearTimeout(tLento); $('#folha').hidden = true; document.body.style.overflow = ''; clearInterval(tAnim); folhaAtual = ''; }
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
  const cm = calorMusculos();
  $('#vInicio').innerHTML = `
    <div><h3>${ola}${cfg.nome ? ', ' + esc(cfg.nome) : ''}</h3><p class="suave" style="margin:4px 0 0">${FRASES[Math.floor(Date.now() / DIA) % FRASES.length]}</p></div>
    ${ativo ? `<button class="btn quente grande" data-acao="irTreino">Voltar ao treino</button>` : `<button class="btn quente grande" data-acao="acender">Acender a forja</button>`}
    ${!ativo && (cfg.modelos || []).length ? `<div class="placa rebites"><h2>Os teus treinos</h2><div class="lista">${cfg.modelos.map(m => `<div class="item" data-acao="usarModelo" data-id="${m.id}" style="padding:12px"><div class="t"><b>${esc(m.nome)}</b><span>${m.itens.length} exercícios · ${m.itens.slice(0, 3).map(x => EXI[x.id] ? EXI[x.id].n : '').filter(Boolean).join(', ')}${m.itens.length > 3 ? '…' : ''}</span></div><span style="color:var(--chama)">${IC.seta}</span></div>`).join('')}</div></div>` : ''}
    ${ativo ? '' : `<div class="placa rebites"><h2>Pede ao ferreiro</h2>${cfg.chave ? `<div class="linha"><input type="text" id="pedidoFerreiro" placeholder="Ex.: 30 min, costas e bíceps" enterkeyhint="send" autocomplete="off">
        <button class="btn icone" data-acao="falar" data-alvo="pedidoFerreiro" data-depois="pedirFerreiro" aria-label="Falar">${IC.mic}</button><button class="btn icone quente" data-acao="pedirFerreiro" aria-label="Pedir">${IC.seta}</button></div>
        <div class="chips" style="margin-top:10px">${['Tenho 20 minutos', 'Quero suar', 'Só halteres hoje', 'Dói-me o ombro'].map(t => chip(false, 'sugFerreiro', t, t)).join('')}</div>`
      : `<p class="suave peq" style="margin:0 0 10px">Diz o que te apetece treinar, por escrito ou por voz, e a IA monta o treino. Precisa da tua chave gratuita do Gemini.</p><button class="btn" data-acao="irPerfil">${IC.ia} Ligar a IA no Perfil</button>`}</div>`}
    <div class="placa rebites"><div class="linha entre"><h2>Esta semana</h2><span class="suave peq">${feitos} de ${cfg.dias} treinos</span></div>
      <div class="brasas">${sem.map(d => `<div class="${d.hoje ? 'hoje' : ''}"><i class="${d.acesa ? 'acesa' : ''}"></i>${d.l}</div>`).join('')}</div></div>
    ${sug ? `<div class="placa brasa"><h2>Sugestão de hoje</h2><p style="margin:0 0 12px"><b>${TIPOS[sug.tipo].nome}</b>: ${esc(sug.motivo)}</p>
      <button class="btn quente" data-acao="usarSugestao" data-v="${sug.tipo}">Gerar este treino</button></div>` : ''}
    <div class="placa rebites"><h2>Calor muscular</h2>
      ${corpoSVG(cm.niveis)}
      <div class="legenda-calor"><span>frio</span><i></i><span>em brasa</span></div>
      <div id="calorInfo" class="calor-info suave peq">${(() => { const frios = MUSC_ESCOLHA.filter(m => !cm.niveis[m]).map(m => MUSC[m]); return frios.length ? `Mais frios: ${frios.slice(0, 4).join(', ')}.` : 'Corpo todo quente. Bom trabalho, ferreiro.'; })()}</div></div>
    ${ultimo ? `<div class="placa rebites" data-acao="verTreino" data-id="${ultimo.id}" style="cursor:pointer"><h2>Último treino</h2>
      <div class="linha entre"><div><b>${esc(ultimo.nome)}</b><div class="suave peq">${dataCurta(ultimo.inicio)} · ${fmtDur(ultimo.fim - ultimo.inicio)} · ${ultimo.itens.length} exercícios</div></div>
      <div class="quente cinzel" style="font-size:18px">${num(volumeDe(ultimo))} kg</div></div></div>` : ''}`;
}

/* ---------- Início rápido e plano ---------- */
let rapido = null;
function novoRapido(tipo){ rapido = {tipo: tipo || 'auto', duracao: cfg.duracao || 60, equip: [], musculos: [], escolhidos: [], especial: null, limite: 40, plano: null, pedido: '', nota: '', aquec: cfg.aquecer === true, along: cfg.alongar === true}; }
const equipHoje = () => rapido && rapido.equip && rapido.equip.length ? rapido.equip : cfg.equip;
const ATALHOS = [['sug', 'Sugestão'], ['push', 'Empurrar'], ['pull', 'Puxar'], ['pernas', 'Pernas'], ['superior', 'Superior'], ['inferior', 'Inferior'], ['corpo', 'Corpo inteiro'], ['core', 'Core']];
const musculosDe = t => Array.from(new Set((TIPOS[t].plano || []).map(x => x.split(':')[0])));
const mesmos = (a, b) => a.length === b.length && a.every(x => b.includes(x));
function contagemExercicios(){ const c = {}; for (const t of treinos) for (const it of t.itens) if (!it.fase) c[it.id] = (c[it.id] || 0) + 1; return c; }
// Lista do painel: só exercícios que usam o equipamento escolhido; favoritos, depois os mais feitos, depois o resto.
function exerciciosRapido(){
  const sel = rapido.equip; if (!sel.length) return {lista: [], cont: {}};
  const eq = Array.from(new Set(['corpo', ...sel])), cont = contagemExercicios(), ms = rapido.musculos;
  const lista = EX.filter(e => ['forca', 'pliometria'].includes(e.c) && podeFazer(e, eq) && (sel.includes('corpo') || e.req.some(r => sel.includes(r)))
    && (!ms.length || e.p.some(m => ms.includes(m))) && !(cfg.nivel === 1 && e.l === 3))
    .sort((a, b) => (cfg.favs.includes(b.id) - cfg.favs.includes(a.id)) || ((cont[b.id] || 0) - (cont[a.id] || 0)) || (b.e - a.e) || (a.l - b.l) || a.n.localeCompare(b.n, 'pt'));
  const fora = rapido.escolhidos.filter(id => EXI[id] && !lista.includes(EXI[id])).map(id => EXI[id]);
  return {lista: fora.concat(lista), cont};
}
const rotuloComecar = () => { const n = rapido.escolhidos.length; return n ? `Começar com ${n} ${n === 1 ? 'exercício' : 'exercícios'}` : 'Começar treino'; };
function linhaRapido(e, cont){
  const k = rapido.escolhidos.indexOf(e.id), n = cont[e.id] || 0;
  return `<div class="item${k >= 0 ? ' escolhido' : ''}" data-acao="rEscolher" data-id="${e.id}"><img class="mini-img" src="${img(e)}" alt="" loading="lazy" data-acao="verEx" data-id="${e.id}" onerror="this.style.visibility='hidden'">
    <div class="t"><b>${cfg.favs.includes(e.id) ? `<span class="fav-mini">${IC.estrela}</span>` : ''}${esc(e.n)}</b><span>${esc(musculosTxt(e))}${n ? ` · feito ${n}×` : ''}</span></div><span class="ordem">${k >= 0 ? k + 1 : ''}</span></div>`;
}
function folhaRapido(manter){
  const cx = $('#folhaCaixa'), st = manter && !$('#folha').hidden ? cx.scrollTop : 0;
  const sug = sugestao(), ms = rapido.musculos, niveis = Object.fromEntries(ms.map(m => [m, 5]));
  const meus = Array.from(new Set(['corpo', ...cfg.equip])).filter(id => EQ[id]);
  const ex = exerciciosRapido();
  const resumo = rapido.especial ? TIPOS[rapido.especial].sub[0].toUpperCase() + TIPOS[rapido.especial].sub.slice(1) + '.'
    : ms.length ? ms.map(m => MUSC[m]).join(', ') + '.' : 'Nenhum escolhido: o ferreiro trata do que está mais frio.';
  abrirFolha(cab('Acender a forja') + `<div class="col painel-rapido">
    <section><h3>Tempo de treino</h3><div class="chips">${[20, 30, 45, 60, 75, 90].map(m => chip(rapido.duracao === m, 'rDur', m, m === 60 ? '1 hora' : m + ' min')).join('')}</div></section>
    <section><h3>O que queres treinar</h3>
      <div class="chips">${ATALHOS.map(([k, t]) => { const tipo = k === 'sug' ? (sug || {tipo: 'corpo'}).tipo : k; return chip(!rapido.especial && ms.length && mesmos(ms, musculosDe(tipo)), 'rAtalho', k, k === 'sug' ? `Sugestão: ${TIPOS[tipo].nome}` : t); }).join('')}
        ${chip(rapido.especial === 'longevidade', 'rEspecial', 'longevidade', 'Longevidade')}${chip(rapido.especial === 'mobilidade', 'rEspecial', 'mobilidade', 'Mobilidade')}</div>
      ${corpoSVG(niveis, {acao: 'rMusculo', anim: false})}
      <p class="resumo-musc">${esc(resumo)}</p></section>
    <section><h3>Equipamento</h3><div class="grelha">${meus.map(id => tileEq(EQ[id], rapido.equip.includes(id), 'rEq')).join('')}</div>
      <p class="apagado mini" style="margin:8px 0 0">Equipamento novo? Acrescenta-o em Perfil, O meu ginásio.</p></section>
    ${rapido.equip.length ? `<section><div class="linha entre"><h3>Exercícios</h3><span class="suave peq">${ex.lista.length} disponíveis</span></div>
      <div class="lista" id="rLista">${ex.lista.slice(0, rapido.limite).map(e => linhaRapido(e, ex.cont)).join('') || '<div class="vazio">Nenhum exercício com esta escolha.</div>'}</div>
      ${ex.lista.length > rapido.limite ? '<button class="btn fantasma" data-acao="rMais" style="width:100%">Mostrar mais</button>' : ''}</section>` : ''}
    ${cfg.chave ? `<section><h3>Indicações para o ferreiro</h3><div class="linha"><textarea id="rPedido" data-campo="rPedido" rows="2" placeholder="Ex.: quero focar no peito, dói-me o pulso">${esc(rapido.pedido || '')}</textarea><button class="btn icone" data-acao="falar" data-alvo="rPedido" aria-label="Falar">${IC.mic}</button></div></section>` : ''}
    <div class="chips">${chip(rapido.aquec, 'rAquec', '', 'Aquecimento')}${chip(rapido.along, 'rAlong', '', 'Alongamentos no fim')}</div>
    <div class="col" style="gap:8px"><button class="btn quente grande" id="rComecar" data-acao="rComecar">${rotuloComecar()}</button>
      ${cfg.chave ? `<button class="btn" data-acao="gerarIA">${IC.ia} Pedir ao ferreiro</button>` : ''}</div></div>`, 'rapido');
  if (st) cx.scrollTop = st;
}
function atualizarEscolhidos(){
  document.querySelectorAll('#rLista [data-acao="rEscolher"]').forEach(el => { const n = rapido.escolhidos.indexOf(el.dataset.id); el.classList.toggle('escolhido', n >= 0); el.querySelector('.ordem').textContent = n >= 0 ? n + 1 : ''; });
  const b = $('#rComecar'); if (b) b.textContent = rotuloComecar();
}
const nomeMusculos = ms => ms.length > 3 ? ms.slice(0, 3).map(m => MUSC[m]).join(' + ') + '…' : ms.map(m => MUSC[m]).join(' + ');
// Monta o plano pelas regras, a partir do que está escolhido no painel.
function planoPorRegras(){
  const ind = lerIndicacoes(rapido.pedido), eq = equipComIndicacoes(equipHoje(), ind), d = rapido.duracao, mus = ind.musculos.length ? ind.musculos : rapido.musculos;
  if (rapido.escolhidos.length){ rapido.real = 'livre'; rapido.nome = rapido.musculos.length ? nomeMusculos(rapido.musculos) : 'Treino à medida'; rapido.plano = rapido.escolhidos.map(id => novoItem(EXI[id])); }
  else if (rapido.especial){ rapido.real = rapido.especial; rapido.nome = TIPOS[rapido.especial].nome; rapido.plano = rapido.especial === 'longevidade' ? gerarLongevidade(d, eq) : gerarMobilidade(d, eq); }
  else if (mus.length){ rapido.real = 'musculos'; rapido.nome = nomeMusculos(mus); rapido.plano = gerarTreino({tipo: 'musculos', musculos: mus, duracao: d, equip: eq}); }
  else { const t = (sugestao() || {tipo: 'corpo'}).tipo; rapido.real = t; rapido.nome = TIPOS[t].nome; rapido.plano = gerarTreino({tipo: t, duracao: d, equip: eq}); }
  if (ind.evitar.length) rapido.plano = rapido.plano.filter(it => rapido.escolhidos.includes(it.id) || !ind.evitar.includes(EXI[it.id].p[0]));
  rapido.nota = '';
  if (!rapido.plano.length){ toast('Não encontrei exercícios com esta escolha. Escolhe mais equipamento.'); return false; }
  return true;
}
function comecarDireto(){
  if (!planoPorRegras()) return;
  const mob = rapido.real === 'mobilidade', eq = equipHoje();
  rapido.fasesAq = rapido.aquec && !mob ? construirAquecimento(rapido.plano, eq) : [];
  rapido.fasesAl = rapido.along && !mob ? construirAlongamentos(rapido.plano, eq) : [];
  comecar();
}
function nomeTreino(tipo){ return tipo === 'musculos' ? rapido.musculos.map(m => MUSC[m]).join(' + ') : TIPOS[tipo].nome; }
function gerar(){
  if (rapido.tipo === 'livre') return folhaSeletor('multi');
  if (rapido.tipo === 'musculos' && !rapido.musculos.length) return toast('Escolhe pelo menos um músculo.');
  rapido.real = rapido.tipo === 'auto' ? (sugestao() || {tipo: 'corpo'}).tipo : rapido.tipo;
  rapido.nome = nomeTreino(rapido.real);
  rapido.nota = '';
  rapido.plano = rapido.real === 'longevidade' ? gerarLongevidade(rapido.duracao, equipHoje()) : rapido.real === 'mobilidade' ? gerarMobilidade(rapido.duracao, equipHoje())
    : gerarTreino({tipo: rapido.real, duracao: rapido.duracao, equip: equipHoje(), musculos: rapido.musculos});
  if (!rapido.plano.length && rapido.tipo !== 'livre') toast('Com este equipamento não encontrei exercícios. Ativa mais equipamento.');
  folhaPlano();
}
function folhaPlano(){
  const p = rapido.plano, mob = (rapido.real || rapido.tipo) === 'mobilidade';
  rapido.fasesAq = rapido.aquec && !mob && p.length ? construirAquecimento(p, equipHoje()) : [];
  rapido.fasesAl = rapido.along && !mob && p.length ? construirAlongamentos(p, equipHoje()) : [];
  const fase = (titulo, lista) => lista.length ? `<h3 class="sec-treino">${titulo}</h3><div class="lista">${lista.map(it => { const ex = EXI[it.id]; return `<div class="item compacto" data-acao="verEx" data-id="${ex.id}">
      <img class="mini-img" src="${img(ex)}" alt="" onerror="this.style.visibility='hidden'"><div class="t"><b>${esc(ex.n)}</b><span>${it.series.length > 1 ? it.series.length + ' × ' : ''}${esc(it.alvo)}</span></div></div>`; }).join('')}</div>` : '';
  const todos = [...rapido.fasesAq, ...p, ...rapido.fasesAl];
  abrirFolha(`<div class="cab"><button class="btn icone fantasma" data-acao="acender" aria-label="Voltar">${IC.voltar}</button><h2>${esc(rapido.nome)}</h2><span class="suave peq">~${minutosPlano(todos)} min</span></div>
    ${rapido.nota ? `<div class="placa brasa" style="padding:12px 14px;margin-bottom:12px"><h2 style="margin-bottom:6px">Palavra do ferreiro</h2><p style="margin:0" class="peq">${esc(rapido.nota)}</p></div>` : ''}
    ${mob ? '' : `<div class="chips" style="margin-bottom:12px">${chip(rapido.aquec, 'pAquec', '', 'Aquecimento')}${chip(rapido.along, 'pAlong', '', 'Alongamentos no fim')}</div>`}
    ${fase('Aquecimento', rapido.fasesAq)}
    ${rapido.fasesAq.length || rapido.fasesAl.length ? '<h3 class="sec-treino">Treino</h3>' : ''}
    <div class="lista">${p.map((it, i) => { const ex = EXI[it.id]; return `<div class="item">
      <img class="mini-img" src="${img(ex)}" alt="" data-acao="verEx" data-id="${ex.id}" onerror="this.style.visibility='hidden'">
      <div class="t" data-acao="verEx" data-id="${ex.id}"><b>${esc(ex.n)}</b><span>${it.series.length} × ${esc(it.alvo)}${it.fase ? '' : ' · ' + esc(musculosTxt(ex))}</span>${it.nota ? `<span class="nota-ferreiro">${esc(it.nota)}</span>` : ''}</div>
      ${it.fase ? '' : `<button class="btn icone" data-acao="pTrocar" data-i="${i}" aria-label="Trocar">${IC.trocar}</button>`}
      <button class="btn icone" data-acao="pTirar" data-i="${i}" aria-label="Tirar">${IC.x}</button></div>`; }).join('') || '<div class="vazio">Ainda sem exercícios. Acrescenta os que quiseres.</div>'}</div>
    ${fase('Alongamentos', rapido.fasesAl)}
    <div class="botoes" style="margin-top:12px"><button class="btn" data-acao="pAdicionar">${IC.mais} Exercício</button>${rapido.tipo !== 'livre' && !rapido.modelo ? `<button class="btn" data-acao="${rapido.nota && cfg.chave ? 'gerarIA' : 'pOutro'}">Gerar outro</button>` : ''}</div>
    <div class="botoes" style="margin-top:6px">${rapido.modelo ? '<button class="btn fantasma perigo" data-acao="apagarModelo">Apagar modelo</button>' : `<button class="btn fantasma" data-acao="guardarModelo" ${p.length ? '' : 'disabled'}>Guardar como modelo</button>`}</div>
    <button class="btn quente grande" style="margin-top:8px" data-acao="comecar" ${p.length ? '' : 'disabled'}>Começar treino</button>`, 'plano');
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
  const multi = destino === 'multi';
  sel = {destino, i, q: '', mus: '', cat: multi ? 'forca' : '', escolhidos: []};
  abrirFolha(cab(multi ? 'Montar o meu treino' : 'Escolher exercício') + `${multi ? '<p class="suave peq" style="margin:-4px 0 10px">Toca nos exercícios pela ordem em que os queres fazer.</p>' : ''}<input type="search" placeholder="Procurar (ex.: supino, remada)…" data-campo="selQ" style="margin-bottom:10px">
    ${multi ? `<div class="chips" style="margin-bottom:8px">${[['forca', 'Força'], ['alongamento', 'Alongamentos'], ['pliometria', 'Pliometria'], ['', 'Todos']].map(([k, t]) => chip(sel.cat === k, 'selCat', k, t)).join('')}</div>` : ''}
    <div class="chips" style="margin-bottom:12px">${chip(true, 'selMus', '', 'Todos os músculos')}${MUSC_ESCOLHA.map(m => chip(false, 'selMus', m, MUSC[m])).join('')}</div><div id="selLista" class="lista"></div>
    ${multi ? '<div class="barra-sel"><button class="btn quente grande" data-acao="selContinuar" id="selContinuar">Escolhe exercícios</button></div>' : ''}`, 'seletor');
  listaSeletor();
}
function listaSeletor(){
  const eq = Array.from(new Set(['corpo', ...(sel.destino === 'plano' ? equipHoje() : cfg.equip)])), q = norm(sel.q);
  const r = EX.filter(e => podeFazer(e, eq) && (!sel.mus || e.p.includes(sel.mus)) && (!sel.cat || q || e.c === sel.cat) && (!q || norm(e.n).includes(q) || norm(e.en).includes(q)))
    .sort((a, b) => (cfg.favs.includes(b.id) - cfg.favs.includes(a.id)) || (b.e - a.e) || (a.c === 'forca' ? -1 : 0) - (b.c === 'forca' ? -1 : 0) || a.n.localeCompare(b.n, 'pt'));
  $('#selLista').innerHTML = r.slice(0, 80).map(e => sel.destino === 'multi' ? linhaSel(e) : linhaEx(e, '', 'selEscolher')).join('') + (r.length > 80 ? `<p class="suave peq centro">Mais ${r.length - 80}: escreve para filtrar.</p>` : '') || '<div class="vazio">Nada encontrado.</div>';
}

/* ---------- Treino em curso ---------- */
function comecar(){
  ativo = {id: uid(), inicio: Date.now(), tipo: rapido.real || rapido.tipo, nome: rapido.nome, itens: [...(rapido.fasesAq || []), ...rapido.plano, ...(rapido.fasesAl || [])]};
  rapido = null;
  preencherSugestoes(ativo.itens.filter(it => !it.fase));
  guardarAtivo(true); fecharFolha(); irPara('vTreino');
  Faiscas.explosao(innerWidth / 2, innerHeight * .35, 40); vibrar(30);
}
function preencherSugestoes(itens){
  for (const it of itens){
    it.prog = progressao(it);
    const kg = it.prog && it.prog.kg !== undefined ? it.prog.kg : null, u = ultimaVez(it.id);
    it.series.forEach((s, j) => { if (s.kg !== '') return; if (kg) s.kg = kg; else if (u){ const a = u.series[Math.min(j, u.series.length - 1)]; if (+a.kg) s.kg = a.kg; } });
  }
}
function cardEx(it, i){
  const ex = EXI[it.id], u = ultimaVez(it.id), tempo = ehTempo(it.alvo);
  return `<div class="placa rebites exercicio" id="ex${i}">
    <div class="cab-ex"><img class="mini-img" src="${img(ex)}" alt="" data-acao="verEx" data-id="${ex.id}" onerror="this.style.visibility='hidden'">
      <div class="cresce"><b data-acao="verEx" data-id="${ex.id}" style="cursor:pointer;font-size:15.5px">${esc(ex.n)}</b>
        <div class="suave peq">${it.series.length} × ${it.alvo} · descanso ${fmtSeg(it.desc)}</div>
        ${u ? `<div class="apagado mini">Última vez (${dataCurta(u.data)}): ${resumoSeries(u.series)}</div>` : ''}
        ${blocoProg(it.prog)}${it.nota ? `<div class="nota-ferreiro">${esc(it.nota)}</div>` : ''}</div>
      <button class="btn icone fantasma" data-acao="tMenu" data-i="${i}" aria-label="Opções">${IC.menu}</button></div>
    <table class="series"><tr><th>Série</th><th>Anterior</th><th>kg</th><th>${tempo ? 'Seg.' : 'Reps'}</th><th></th></tr>
    ${it.series.map((s, j) => { const a = u && u.series[j]; return `<tr class="${s.feito ? 'feita' : ''}"><td>${j + 1}</td><td class="ant">${a ? fmtSerie(a) : '—'}</td>
      <td><input type="number" inputmode="decimal" step="0.5" min="0" value="${esc(s.kg)}" placeholder="${a && +a.kg ? a.kg : '0'}" data-campo="kg" data-i="${i}" data-j="${j}"></td>
      <td><input type="number" inputmode="numeric" min="0" value="${esc(s.reps)}" placeholder="${it.prog && it.prog.reps ? it.prog.reps : a ? a.reps : (parseInt(it.alvo) || '')}" data-campo="reps" data-i="${i}" data-j="${j}"></td>
      <td><button class="visto" data-acao="feito" data-i="${i}" data-j="${j}" aria-label="Série feita">${IC.visto}</button></td></tr>`; }).join('')}
    </table>
    <div class="botoes"><button class="btn fantasma" data-acao="maisSerie" data-i="${i}">${IC.mais} Série</button><button class="btn fantasma" data-acao="menosSerie" data-i="${i}">Tirar série</button></div></div>`;
}
function renderTreino(){
  if (!ativo){ irPara('vInicio'); return; }
  const feitas = ativo.itens.reduce((a, it) => a + it.series.filter(s => s.feito).length, 0), total = ativo.itens.reduce((a, it) => a + it.series.length, 0);
  $('#vTreino').innerHTML = `
    <div><h2>${esc(ativo.nome)}</h2><div class="linha entre" style="margin-top:6px"><div class="linha" style="gap:12px"><span class="relogio quente" id="cronoTreino">${fmtDur(Date.now() - ativo.inicio)}</span><span class="suave peq" id="contaSeries">${feitas}/${total} séries</span></div>
      <div class="linha" style="gap:6px">${cfg.chave ? `<button class="btn peq-btn" data-acao="adaptar">${IC.ia} Adaptar</button>` : ''}<button class="btn perigo peq-btn" data-acao="cancelarTreino">Cancelar</button></div></div></div>
    ${(() => { const temFases = ativo.itens.some(it => it.fase); let ant = null; return ativo.itens.map((it, i) => { const f = it.fase || 'treino', h = temFases && f !== ant ? `<h3 class="sec-treino">${nomeFase(it.fase)}</h3>` : ''; ant = f; return h + (it.fase ? cardFase(it, i) : cardEx(it, i)); }).join(''); })() || '<div class="vazio">Sem exercícios. Acrescenta o primeiro.</div>'}
    <button class="btn" data-acao="tAdicionar">${IC.mais} Adicionar exercício</button>
    <button class="btn quente grande" data-acao="terminar">Terminar treino</button>`;
}
function atualizarCard(i){
  const el = $('#ex' + i); if (el) el.outerHTML = (ativo.itens[i].fase ? cardFase : cardEx)(ativo.itens[i], i);
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
    const ultima = !ativo.itens.slice(i + 1).some(x => !x.fase) && it.series.every(x => x.feito);
    if (!ultima) iniciarDescanso(it.desc);
  }
  guardarAtivo(true); atualizarCard(i);
}
function terminar(){
  const itens = ativo.itens.map(it => ({id: it.id, ...(it.fase ? {fase: it.fase} : {}), series: it.series.filter(s => s.feito).map(s => ({kg: +s.kg || 0, reps: +s.reps || 0}))})).filter(it => it.series.length);
  if (!itens.length){ if (confirm('Ainda não marcaste nenhuma série. Descartar este treino?')){ ativo = null; guardarAtivo(true); pararDescanso(); irPara('vInicio'); } return; }
  if (!confirm('Terminar e guardar o treino?')) return;
  const recordes = [];
  for (const it of itens){
    if (it.fase) continue;
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
      <div class="img-ex" id="animEx">${ex.i.map(p => `<img src="${imgSrc(p)}" alt="" onerror="this.remove()">`).join('')}</div>
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
  if (!d && cfg.chave && !ex.pt) pedirDicas(id);
}
function blocoDicas(ex, d){
  if (ex.pt) return `<ol class="passos-ex">${ex.ins.map(p => `<li>${esc(p)}</li>`).join('')}</ol>${(ex.dc || []).length ? `<div class="placa brasa" style="padding:12px"><h2 style="margin-bottom:6px">Conselhos do ferreiro</h2><ul class="dicas">${ex.dc.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}`;
  if (d) return `<ol class="passos-ex">${d.passos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
    ${d.dicas.length ? `<div class="placa brasa" style="padding:12px"><h2 style="margin-bottom:6px">Conselhos do ferreiro</h2><ul class="dicas">${d.dicas.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
    ${d.erros.length ? `<div class="placa" style="padding:12px"><h2 style="margin-bottom:6px">Erros comuns</h2><ul class="dicas">${d.erros.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
    ${d.respiracao ? `<p class="suave peq" style="margin:0"><b>Respiração:</b> ${esc(d.respiracao)}</p>` : ''}`;
  return `<ol class="passos-ex" lang="en">${ex.ins.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
    <p class="suave peq" id="iaEstado" style="margin:10px 0 0">${cfg.chave ? 'A traduzir e a preparar conselhos…' : 'Instruções em inglês. Com a tua chave do Gemini (Perfil, Inteligência artificial), aparecem em português, com conselhos de técnica.'}</p>`;
}

/* ---------- IA (Gemini, chave do utilizador) ---------- */
// Pedido em curso à IA (para poder cancelar) e se o modelo aceita desligar o "pensamento".
let iaPedido = null, iaPensarSempre = false;
function cancelarIA(){ if (iaPedido){ iaPedido.cancelado = true; iaPedido.ctl.abort(); } }
async function geminiTexto(texto, json = true, espera = 40000){
  if (!cfg.chave) throw new Error('Falta a chave do Gemini no Perfil.');
  const modelo = String(cfg.modelo || 'gemini-flash-latest').replace(/^models\//, '');
  const gc = json ? {temperature: .3, responseMimeType: 'application/json'} : {temperature: .6};
  const pedir = async pensar => {
    const ped = iaPedido = {ctl: new AbortController(), cancelado: false}, t = setTimeout(() => ped.ctl.abort(), espera);
    try {
      return await fetch(`${API}models/${encodeURIComponent(modelo)}:generateContent`, {method: 'POST', signal: ped.ctl.signal,
        headers: {'Content-Type': 'application/json', 'x-goog-api-key': cfg.chave},
        body: JSON.stringify({contents: [{role: 'user', parts: [{text: texto}]}], generationConfig: pensar ? gc : Object.assign({thinkingConfig: {thinkingBudget: 0}}, gc)})});
    } catch(e){
      if (ped.cancelado) throw new Error('Cancelado.');
      if (ped.ctl.signal.aborted) throw new Error('O ferreiro demorou demasiado a responder.');
      throw new Error('Sem ligação à internet.');
    } finally { clearTimeout(t); if (iaPedido === ped) iaPedido = null; }
  };
  let r = await pedir(iaPensarSempre || !/flash/i.test(modelo)), j = await r.json().catch(() => ({}));
  if (!r.ok && r.status === 400 && /think/i.test((j.error && j.error.message) || '') && !iaPensarSempre){
    iaPensarSempre = true; r = await pedir(true); j = await r.json().catch(() => ({}));
  }
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
    <div class="placa rebites"><h2>O meu ginásio</h2><p class="suave peq" style="margin:-4px 0 12px">O equipamento que tens em casa. É este que aparece para escolheres ao acender a forja.</p>
      <div class="grelha">${EQUIP.filter(e => e.id !== 'corpo').map(e => tileEq(e, cfg.equip.includes(e.id), 'pEq')).join('')}</div></div>
    <div class="placa rebites col"><h2>Aquecimento e alongamentos</h2><p class="suave peq" style="margin:0">Marca para virem sempre ligados ao acender a forja. Podes mudar antes de começar.</p>
      <div class="chips">${chip(cfg.aquecer === true, 'pAquecer', '', 'Aquecimento')}${chip(cfg.alongar === true, 'pAlongar', '', 'Alongamentos no fim')}</div></div>
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
  const urls = EX.filter(e => podeFazer(e, meuEquip())).flatMap(e => e.i.filter(p => !p.startsWith('local/')).map(p => IMG + p)), fila = urls.slice();
  const cache = await caches.open('forja-img'); let feitos = 0, falhas = 0; btn.disabled = true;
  const trab = async () => { while (fila.length){ const u = fila.shift(); try { if (!(await cache.match(u))){ const r = await fetch(u, {mode: 'cors'}); if (r.ok) await cache.put(u, r); else falhas++; } } catch(e){ falhas++; }
    if (++feitos % 8 === 0 || !fila.length) btn.textContent = `A guardar… ${Math.round(feitos / urls.length * 100)}%`; } };
  await Promise.all(Array.from({length: 6}, trab));
  btn.disabled = false; btn.textContent = 'Guardar imagens no dispositivo';
  toast(falhas ? `Guardadas ${urls.length - falhas} imagens; ${falhas} falharam. Tenta de novo com melhor rede.` : 'Imagens guardadas. Já podes treinar sem internet.', 4000);
}
function exportar(){
  const dados = {app: 'forja', versao: 1, exportado: new Date().toISOString(), cfg: Object.fromEntries(PARTILHADO.map(k => [k, cfg[k]])), treinos, apagados, dicas, pesos, pesosApag};
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
      for (const p of d.pesos || []){ const k = pesos.findIndex(x => x.d === p.d); if (k < 0) pesos.push(p); else if ((p.ts || 0) > (pesos[k].ts || 0)) pesos[k] = p; }
      pesos.sort((a, b) => a.d < b.d ? -1 : 1); guardarPesos(); if ((d.pesos || []).length) pesoSujo();
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
    await sincPesos();
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

/* ---------- Progressão (regras locais: instantânea e sem internet) ---------- */
function faixa(alvo){ const m = String(alvo).match(/(\d+)\s*[–-]\s*(\d+)/); if (m) return [+m[1], +m[2]]; const n = parseInt(alvo); return n ? [n, n] : null; }
function incremento(ex){
  if (ex.req.includes('kettlebell')) return 4;
  if (ex.req.includes('halteres')) return 2;
  if (ex.req.includes('barra') && ex.m && ex.p.some(m => ['quads', 'post', 'gluteos', 'lombar'].includes(m))) return 5;
  return 2.5;
}
const arred = (x, passo) => Math.max(0, Math.round(x / passo) * passo);
function progressao(it){
  const ex = EXI[it.id], h = historicoEx(it.id), f = faixa(it.alvo);
  if (!ex || !f) return null;
  if (!h.length) return {tipo: 'novo', txt: 'Primeira vez: escolhe um peso em que as duas últimas repetições custem, sem perder a técnica.'};
  const [rmin, rmax] = f, u = h[0].series;
  if (ehTempo(it.alvo)){
    const melhor = Math.max(...u.map(s => +s.reps || 0));
    return melhor >= rmax ? {tipo: 'sobe', reps: melhor + 5, txt: `Aguentaste ${melhor} s: hoje tenta ${melhor + 5} s.`} : {tipo: 'mantem', reps: rmax, txt: `Tenta chegar aos ${rmax} s.`};
  }
  const kg = Math.max(...u.map(s => +s.kg || 0)), reps = u.filter(s => (+s.kg || 0) === kg).map(s => +s.reps || 0), minR = Math.min(...reps);
  if (!kg){
    if (minR >= rmax) return {tipo: 'sobe', kg: 0, reps: rmax + 2, txt: `Fizeste ${rmax} ou mais em todas: tenta ${rmax + 2} ou acrescenta carga.`};
    const r = Math.max(rmin, Math.min(rmax, minR + 1));
    return {tipo: 'mantem', kg: 0, reps: r, txt: `Tenta ${r} repetições em todas as séries.`};
  }
  const inc = incremento(ex);
  if (minR >= rmax) return {tipo: 'sobe', kg: kg + inc, reps: rmin, txt: `Sobe para ${num(kg + inc)} kg: da última vez fizeste ${rmax} ou mais em todas as séries.`};
  if (minR < rmin){
    const ant = h[1] && h[1].series, kgAnt = ant ? Math.max(...ant.map(s => +s.kg || 0)) : null;
    if (ant && kgAnt === kg && ant.filter(s => (+s.kg || 0) === kg).some(s => (+s.reps || 0) < rmin)){
      const novo = arred(kg * .9, inc === 5 ? 2.5 : inc);
      return {tipo: 'baixa', kg: novo, reps: rmax, txt: `Baixa para ${num(novo)} kg: ficaste abaixo de ${rmin} em duas sessões seguidas. Consolida a técnica e volta a subir.`};
    }
    return {tipo: 'mantem', kg, reps: rmin, txt: `Repete ${num(kg)} kg e tenta completar ${rmin} repetições em todas.`};
  }
  const r = Math.min(rmax, minR + 1);
  return {tipo: 'mantem', kg, reps: r, txt: `Mantém ${num(kg)} kg e tenta ${r} repetições em todas as séries.`};
}
function blocoProg(p){
  if (!p) return '';
  const seta = {sobe: '▲', baixa: '▼', mantem: '■', novo: '◆'}[p.tipo];
  return `<div class="prog ${p.tipo}"><span>${seta}</span><span>${esc(p.txt)}</span></div>`;
}

/* ---------- IA: forjar treinos, pedidos ao ferreiro e adaptar o treino ---------- */
// As indicações do utilizador mandam: o que se percebe nelas (músculos, zonas a evitar, equipamento)
// filtra a lista antes de chegar à IA, para que ela não consiga escolher fora disso.
const PERNAS = ['quads', 'post', 'gluteos', 'gemeos', 'adutores', 'abdutores'];
const IND_MUSC = [
  [/barriga da perna|panturrilh|gemeos/, ['gemeos']],
  [/pernas?\b|membros inferiores|tronco inferior|parte de baixo|\binferior/, PERNAS],
  [/quadricep/, ['quads']], [/posteriores?\b|isquio/, ['post']], [/glute|rabo/, ['gluteos']], [/\badutor/, ['adutores']], [/abdutor/, ['abdutores']],
  [/peito|peitora/, ['peito']], [/costas|dorsa/, ['dorsais', 'costas']], [/lombar/, ['lombar']], [/ombros?\b|deltoide/, ['ombros']],
  [/bracos?\b/, ['biceps', 'triceps']], [/bicep/, ['biceps']], [/tricep/, ['triceps']], [/antebraco/, ['antebracos']],
  [/\bcore\b|abdomina|\babs\b|barriga/, ['abs']], [/trapezio/, ['trapezio']],
  [/tronco superior|parte de cima|\bsuperior/, ['peito', 'dorsais', 'costas', 'ombros', 'biceps', 'triceps']]
];
const IND_EQUIP = [[/halter/, 'halteres'], [/kettlebell|kettle/, 'kettlebell'], [/elastic/, 'elasticos'], [/\bbanco/, 'banco'], [/\brack\b|suporte/, 'rack'],
  [/elevacoes|barra fixa/, 'elevacoes'], [/\bbarra\b(?! fixa| de elevacoes)/, 'barra'], [/paralelas/, 'paralelas'], [/polia|cabos?\b/, 'cabos']];
const NEGA = /\b(sem|nao|evita\w*|exceto|excepto|menos|tirando|poupa\w*|doi\w*|dor(es)?|lesa\w*|lesion\w*|magoa\w*)\b/;
function lerIndicacoes(texto){
  const r = {musculos: [], evitar: [], equip: [], semEquip: [], corpo: false};
  const t = String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!t.trim()) return r;
  for (const frase of t.split(/[,.;!?\n]|\bmas\b/)){
    const so = /\b(so|apenas|somente|unicamente|exclusivamente)\b/.test(frase);
    let resto = frase;
    for (const [re, ms] of IND_MUSC){
      const m = resto.match(re); if (!m) continue;
      const neg = NEGA.test(resto.slice(0, m.index));
      for (const x of ms) (neg ? r.evitar : r.musculos).push(x);
      resto = resto.replace(re, ' ');
    }
    if (/sem (equipamento|material|pesos)|peso corporal|so (o )?corpo/.test(frase)) r.corpo = true;
    for (const [re, id] of IND_EQUIP){
      const m = frase.match(re); if (!m) continue;
      if (NEGA.test(frase.slice(0, m.index)) || /nao tenho|ocupad/.test(frase)) r.semEquip.push(id); else if (so) r.equip.push(id);
    }
  }
  r.musculos = [...new Set(r.musculos)].filter(m => !r.evitar.includes(m)); r.evitar = [...new Set(r.evitar)];
  return r;
}
function equipComIndicacoes(eq, ind){
  let e = Array.from(new Set(['corpo', ...eq]));
  if (ind.corpo) e = ['corpo'];
  else if (ind.equip.length) e = e.filter(x => x === 'corpo' || ind.equip.includes(x));
  return e.filter(x => !ind.semEquip.includes(x));
}
function poolIA(eq, musculos, alongamentos){
  const pont = e => (e.e ? 40 : 0) + (cfg.favs.includes(e.id) ? 30 : 0) + (TOPO.has(e.id) ? 15 : 0) + (e.m ? 8 : 0) + (e.l === 1 ? 3 : 0);
  const porM = {};
  for (const e of EX){
    if (!podeFazer(e, eq) || (cfg.nivel === 1 && e.l === 3)) continue;
    if (!(['forca', 'pliometria'].includes(e.c) || (alongamentos && e.c === 'alongamento'))) continue;
    const m = e.p[0]; if (musculos && !musculos.includes(m)) continue;
    (porM[m] = porM[m] || []).push(e);
  }
  const pool = [];
  for (const l of Object.values(porM)){
    const forca = l.filter(e => e.c !== 'alongamento').sort((a, b) => pont(b) - pont(a)).slice(0, 9);
    const along = l.filter(e => e.c === 'alongamento').sort((a, b) => pont(b) - pont(a)).slice(0, 2);
    pool.push(...forca, ...along);
  }
  return pool;
}
const linhaPool = e => `${e.id}|${e.n}|${e.p.map(m => MUSC[m]).join('+')}|${e.c === 'alongamento' ? 'alongamento' : e.m ? 'composto' : 'isolamento'}|nível ${e.l}`;
function contextoUtilizador(){
  const um = ultimoPorMusculo();
  return `Utilizador: nível ${NIVEIS[cfg.nivel][0].toLowerCase()}; objetivo: ${OBJETIVOS[cfg.objetivo][0].toLowerCase()}; treina ${cfg.dias} vezes por semana.
Dias desde o último treino de cada músculo: ${MUSC_ESCOLHA.map(m => `${MUSC[m]} ${um[m] ? diasDesde(um[m]) : 'nunca'}`).join(', ')}.
Últimos treinos: ${ordenados().slice(0, 3).map(t => `${dataCurta(t.inicio)} ${t.nome} (${t.itens.map(i => EXI[i.id] ? EXI[i.id].n : '').filter(Boolean).join(', ')})`).join('; ') || 'nenhum ainda'}.
${cfg.favs.length ? 'Favoritos: ' + cfg.favs.map(id => EXI[id] && EXI[id].n).filter(Boolean).join(', ') + '.' : ''}`;
}
const REGRAS_JSON = `Regras: só podes usar ids da lista; começa pelos compostos; ajusta o número de exercícios ao tempo (cada série demora cerca de 40 s mais o descanso, e há 5 min de aquecimento); séries entre 2 e 6; "reps" é texto, por exemplo "8–10" ou "30–45 s"; "descanso" em segundos; adapta séries, repetições e descanso ao objetivo e ao nível. Se o utilizador falar de dor ou lesão, evita exercícios que carreguem essa zona e diz-lhe na nota para procurar um profissional se a dor persistir.
Escreve em português de Portugal (nunca do Brasil) e trata o utilizador por "tu".`;
function itensDaIA(lista, validos){
  const vistos = new Set(), itens = [];
  for (const x of Array.isArray(lista) ? lista : []){
    if (!x || !validos.has(x.id) || vistos.has(x.id) || itens.length >= 10) continue;
    vistos.add(x.id);
    const ex = EXI[x.id], p = prescricao(ex), it = novoItem(ex, Math.min(6, Math.max(1, parseInt(x.series) || p.series)));
    if (x.reps) it.alvo = String(x.reps).replace(/-/g, '–').slice(0, 12);
    it.desc = Math.min(300, Math.max(20, parseInt(x.descanso) || p.desc));
    if (x.nota) it.nota = String(x.nota).slice(0, 160);
    itens.push(it);
  }
  return itens;
}
async function forjarComIA(){
  const pedido = String(rapido.pedido || '').trim(), ind = lerIndicacoes(pedido);
  const eq = equipComIndicacoes(equipHoje(), ind);
  const mus = ind.musculos.length ? ind.musculos : rapido.musculos;
  const tipo = rapido.especial || (mus.length ? 'musculos' : (TIPOS[rapido.tipo] && rapido.tipo !== 'livre' ? rapido.tipo : 'auto')), alvo = tipo === 'musculos' ? mus : (TIPOS[tipo] && TIPOS[tipo].plano && TIPOS[tipo].plano.length ? Array.from(new Set(TIPOS[tipo].plano.map(s => s.split(':')[0]))) : null);
  let pool = poolIA(eq, pedido && !mus.length ? null : alvo, !!pedido);
  if (ind.evitar.length) pool = pool.filter(e => !ind.evitar.includes(e.p[0]));
  if (!pool.length) throw new Error('Não há exercícios que cumpram as indicações com o teu equipamento.');
  const escolhidos = (rapido.escolhidos || []).filter(id => EXI[id]);
  for (const id of escolhidos) if (!pool.some(e => e.id === id)) pool.push(EXI[id]);
  const pedidoTipo = tipo === 'longevidade' ? 'saúde e longevidade: força funcional, equilíbrio, pega, postura e mobilidade; usa os exercícios forja_* quando fizerem sentido' : tipo === 'auto' ? (pedido ? 'o que as indicações do utilizador pedirem' : 'decide tu, tendo em conta os músculos que estão há mais tempo sem treino') : tipo === 'musculos' ? 'só estes músculos: ' + mus.map(m => MUSC[m]).join(', ') : TIPOS[tipo].nome + ' (' + TIPOS[tipo].sub + ')';
  const prompt = `És o ferreiro da app Forja, um treinador de força experiente. Monta o treino de hoje.
${pedido ? `INDICAÇÕES DO UTILIZADOR (obrigatórias): "${pedido}"
Cumpre estas indicações à letra. Se entrarem em conflito com o tipo de treino, o tempo, o histórico ou qualquer outra regra, as indicações ganham sempre.
` : ''}${contextoUtilizador()}
Tempo disponível: ${rapido.duracao} minutos. Tipo de treino: ${pedidoTipo}.
${escolhidos.length ? `O utilizador já escolheu estes exercícios, que têm de ficar no treino por esta ordem: ${escolhidos.map(id => id + ' (' + EXI[id].n + ')').join('; ')}. Acrescenta outros só se couberem no tempo disponível.` : ''}
Exercícios disponíveis com o equipamento de hoje (id|nome|músculos|tipo|nível):
${pool.map(linhaPool).join('\n')}
${REGRAS_JSON}
${pedido ? 'Antes de responderes, confirma que cada exercício cumpre as indicações do utilizador e tira os que não cumprem. Na nota, diz em poucas palavras como as seguiste.\n' : ''}Responde só com JSON: {"nome":"nome curto do treino","nota":"1 ou 2 frases a explicar a escolha","exercicios":[{"id":"...","series":4,"reps":"8–10","descanso":120,"nota":"dica curta opcional"}]}`;
  const o = lerJSON(await geminiTexto(prompt));
  let itens = itensDaIA(o.exercicios, new Set(pool.map(e => e.id)));
  if (escolhidos.length){ const deles = escolhidos.map(id => itens.find(it => it.id === id) || novoItem(EXI[id])); itens = deles.concat(itens.filter(it => !escolhidos.includes(it.id))); }
  if (itens.length < 2 && !escolhidos.length) throw new Error('A IA não montou um treino válido.');
  return {nome: String(o.nome || 'Treino do ferreiro').slice(0, 40), nota: String(o.nota || '').slice(0, 320), itens};
}
function folhaAforjar(titulo, semIA){
  abrirFolha(`<div class="col centro" style="padding:30px 0 20px"><div class="aforjar"><i></i><i></i><i></i></div><h2>${titulo}</h2>
    <p class="suave peq" style="margin:0">O ferreiro está a escolher o ferro. Demora uns segundos.</p>
    <div id="aforjarLento" class="col centro" hidden><p class="peq" style="margin:6px 0 0;color:var(--ouro)">Está a demorar mais do que o costume.</p>
      <button class="btn" data-acao="${semIA ? 'semIA' : 'fecharFolha'}">${semIA ? 'Montar sem IA' : 'Cancelar'}</button></div></div>`, 'aforjar');
  clearTimeout(tLento); tLento = setTimeout(() => { const el = $('#aforjarLento'); if (el && folhaAtual === 'aforjar') el.hidden = false; }, 12000);
}
async function gerarIA(){
  const caixa = $('#rPedido'); if (caixa) rapido.pedido = caixa.value.trim();
  folhaAforjar('A forjar o teu treino', true);
  try {
    const r = await forjarComIA();
    if (folhaAtual !== 'aforjar') return;
    rapido.plano = r.itens; rapido.nome = r.nome; rapido.nota = r.nota;
    rapido.real = rapido.especial || (rapido.musculos.length ? 'musculos' : rapido.pedido ? 'ia' : TIPOS[rapido.tipo] && (TIPOS[rapido.tipo].plano || []).length ? rapido.tipo : (sugestao() || {tipo: 'corpo'}).tipo);
    folhaPlano();
  } catch(e){
    if (folhaAtual !== 'aforjar') return;
    toast(e.message + ' Montei o treino sem IA' + (rapido.pedido ? ', a seguir as tuas indicações.' : '.'), 4500);
    if (planoPorRegras()) folhaPlano();
  }
}
function pedirAoFerreiro(texto){
  texto = String(texto || '').trim(); if (!texto) return toast('Escreve ou diz o que queres treinar.');
  novoRapido('auto'); rapido.pedido = texto;
  const m = texto.match(/(\d{2,3})\s*(min|minutos|m\b)/i); if (m) rapido.duracao = Math.min(120, Math.max(10, +m[1]));
  gerarIA();
}
function folhaAdaptar(){
  abrirFolha(cab('Adaptar o treino') + `<div class="col"><p class="suave peq" style="margin:0">Diz ao ferreiro o que mudou. As séries já feitas ficam como estão.</p>
    <div class="chips">${['Dói-me o ombro', 'Só tenho mais 15 minutos', 'Está muito fácil', 'Estou cansado', 'Não tenho banco livre'].map(t => chip(false, 'sugAdaptar', t, t)).join('')}</div>
    <div class="linha"><textarea id="adaptarTxt" rows="2" placeholder="Ex.: dói-me o joelho, troca o que for de pernas"></textarea><button class="btn icone" data-acao="falar" data-alvo="adaptarTxt" data-depois="enviarAdaptar" aria-label="Falar">${IC.mic}</button></div>
    <button class="btn quente grande" data-acao="enviarAdaptar">Adaptar</button></div>`, 'adaptar');
}
async function adaptarTreino(pedido){
  const aq = ativo.itens.filter(it => it.fase === 'aquec'), al = ativo.itens.filter(it => it.fase === 'along'), pr = ativo.itens.filter(it => !it.fase);
  const feitos = pr.filter(it => it.series.some(s => s.feito)), resto = pr.filter(it => !it.series.some(s => s.feito));
  const pool = poolIA(meuEquip(), null, true);
  for (const it of resto) if (!pool.some(e => e.id === it.id) && EXI[it.id]) pool.push(EXI[it.id]);
  const prompt = `És o ferreiro da app Forja, um treinador de força experiente. O utilizador está a meio de um treino e pede uma adaptação.
${contextoUtilizador()}
Treino em curso: "${ativo.nome}", começou há ${Math.round((Date.now() - ativo.inicio) / 60000)} minutos.
Já feito (não mexer): ${feitos.map(it => `${EXI[it.id].n}: ${it.series.filter(s => s.feito).map(s => (+s.kg ? s.kg + ' kg × ' : '') + s.reps).join(', ')}`).join('; ') || 'nada ainda'}.
Por fazer: ${resto.map(it => `${it.id} (${EXI[it.id].n}, ${it.series.length} × ${it.alvo})`).join('; ') || 'nada'}.
Pedido do utilizador: "${pedido}"
Devolve a nova lista do que falta fazer (podes manter, trocar, tirar ou acrescentar exercícios e mudar séries, repetições e descanso).
Exercícios disponíveis (id|nome|músculos|tipo|nível):
${pool.map(linhaPool).join('\n')}
${REGRAS_JSON}
Responde só com JSON: {"nota":"1 ou 2 frases a explicar o que mudaste","exercicios":[{"id":"...","series":3,"reps":"10–12","descanso":90,"nota":"dica curta opcional"}]}`;
  const o = lerJSON(await geminiTexto(prompt));
  const novos = itensDaIA(o.exercicios, new Set(pool.map(e => e.id)));
  if (!novos.length && resto.length) throw new Error('A IA não devolveu exercícios válidos.');
  preencherSugestoes(novos);
  ativo.itens = aq.concat(feitos, novos, al); guardarAtivo(true);
  return String(o.nota || '').slice(0, 320);
}
let reconhecimento = null;
function ouvir(btn, alvo, depois){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('O reconhecimento de voz não está disponível neste navegador.');
  if (reconhecimento){ reconhecimento.stop(); return; }
  const r = reconhecimento = new SR(); r.lang = 'pt-PT'; r.interimResults = true;
  let ouviu = false; btn.classList.add('a-ouvir');
  r.onresult = e => { alvo.value = Array.from(e.results).map(x => x[0].transcript).join(''); ouviu = true; alvo.dispatchEvent(new Event('input', {bubbles: true})); };
  r.onerror = e => toast(e.error === 'not-allowed' ? 'Sem permissão para usar o microfone.' : e.error === 'no-speech' ? 'Não ouvi nada. Tenta outra vez.' : 'Não consegui ouvir. Tenta outra vez.');
  r.onend = () => { reconhecimento = null; btn.classList.remove('a-ouvir'); if (ouviu && alvo.value.trim() && depois) depois(); };
  try { r.start(); } catch(e){ reconhecimento = null; btn.classList.remove('a-ouvir'); }
}

/* ---------- Aquecimento, alongamentos, longevidade e mobilidade ---------- */
const ehTempo = alvo => /\d\s*(s|min)\b/.test(String(alvo));
function itemFase(ex, alvo, fase, series = 1, desc = 10){ return {u: uid(), id: ex.id, alvo, desc, fase, series: Array.from({length: series}, () => ({kg: '', reps: '', feito: false}))}; }
function musculosDoPlano(plano){
  const c = {};
  for (const it of plano){ const ex = EXI[it.id]; if (ex && !it.fase) for (const m of ex.p) c[m] = (c[m] || 0) + it.series.length; }
  return Object.keys(c).sort((a, b) => c[b] - c[a]);
}
function construirAquecimento(plano, equip){
  const eq = Array.from(new Set(['corpo', ...equip])), ms = musculosDoPlano(plano), usados = new Set();
  const sup = !ms.length || ms.some(m => SUPERIORES.includes(m)), inf = !ms.length || ms.some(m => !SUPERIORES.includes(m) && m !== 'abs');
  const tira = (lista, n) => { const r = []; for (const [id, alvo] of lista){ const ex = EXI[id]; if (r.length >= n) break; if (ex && podeFazer(ex, eq) && !usados.has(id)){ usados.add(id); r.push(itemFase(ex, alvo, 'aquec')); } } return r; };
  return [...tira(AQUEC.geral, 1), ...(sup ? tira(AQUEC.superior, inf ? 2 : 3) : []), ...(inf ? tira(AQUEC.inferior, sup ? 2 : 3) : []), ...tira(AQUEC.tronco, 1)];
}
function construirAlongamentos(plano, equip, max = 5){
  const eq = Array.from(new Set(['corpo', ...equip])), usados = new Set(), r = [];
  let ms = musculosDoPlano(plano); if (!ms.length) ms = ['post', 'quads', 'gluteos', 'peito', 'dorsais', 'lombar'];
  for (const m of ms){
    if (r.length >= max) break;
    const id = (ALONG[m] || []).find(x => EXI[x] && podeFazer(EXI[x], eq) && !usados.has(x));
    if (id){ usados.add(id); r.push(itemFase(EXI[id], '30 s', 'along', 2, 10)); }
  }
  return r;
}
function segundosItem(it){ return it.series.length * ((ehTempo(it.alvo) ? (parseInt(it.alvo) || 30) : 40) + (it.desc || 60)) + (it.fase ? 10 : 60); }
function gerarLongevidade(duracao, equip){
  const eq = Array.from(new Set(['corpo', ...equip])), rec = recentes(), usados = new Set(), escolhidos = [];
  let tempo = 5 * 60;
  for (const g of LONGEV.slice().sort((a, b) => a[1] - b[1])){
    const opcoes = g[2].filter(([id]) => EXI[id] && podeFazer(EXI[id], eq) && !usados.has(id));
    if (!opcoes.length) continue;
    const frescas = opcoes.filter(([id]) => !rec.has(id)), pool = (frescas.length ? frescas : opcoes).slice(0, 2);
    const [id, alvo] = pool[Math.floor(Math.random() * pool.length)];
    const it = novoItem(EXI[id], g[3]); it.alvo = alvo; it.desc = g[4]; it.grupo = g[0];
    const t = segundosItem(it);
    if (escolhidos.length >= 4 && tempo + t > duracao * 60 + 120) continue;
    tempo += t; usados.add(id); escolhidos.push(it);
  }
  const ordem = LONGEV.map(g => g[0]);
  return escolhidos.sort((a, b) => ordem.indexOf(a.grupo) - ordem.indexOf(b.grupo));
}
function gerarMobilidade(duracao, equip){
  duracao = Math.min(duracao, 20);
  const eq = Array.from(new Set(['corpo', ...equip])), usados = new Set(), r = [];
  const add = (id, alvo, series) => { const ex = EXI[id]; if (ex && podeFazer(ex, eq) && !usados.has(id)){ usados.add(id); r.push(itemFase(ex, alvo, 'along', series, 10)); return true; } return false; };
  add('Star_Jump', '45 s', 1); AQUEC.tronco.forEach(([id, a]) => add(id, a, 1));
  [AQUEC.inferior[0], AQUEC.inferior[2], AQUEC.superior[0], AQUEC.superior[1]].forEach(([id, a]) => add(id, a, 1));
  let tempo = r.reduce((s, it) => s + segundosItem(it), 0);
  for (const m of ['post', 'quads', 'gluteos', 'lombar', 'peito', 'dorsais', 'adutores', 'ombros', 'gemeos', 'costas', 'abdutores', 'triceps', 'antebracos', 'pescoco']){
    if (tempo > duracao * 60) break;
    for (const id of ALONG[m] || []) if (add(id, '30 s', 2)){ tempo += segundosItem(r[r.length - 1]); break; }
  }
  return r;
}
function cardFase(it, i){
  const ex = EXI[it.id], feito = it.series.every(s => s.feito);
  return `<div class="placa exercicio fase${feito ? ' feita' : ''}" id="ex${i}"><div class="cab-ex" style="align-items:center">
    <img class="mini-img" src="${img(ex)}" alt="" data-acao="verEx" data-id="${ex.id}" onerror="this.style.visibility='hidden'">
    <div class="cresce"><b data-acao="verEx" data-id="${ex.id}" style="cursor:pointer">${esc(ex.n)}</b><div class="suave peq">${it.series.length > 1 ? it.series.length + ' × ' : ''}${esc(it.alvo)}</div></div>
    <button class="btn icone fantasma" data-acao="tMenu" data-i="${i}" aria-label="Opções">${IC.menu}</button>
    <button class="visto" data-acao="feitoFase" data-i="${i}" aria-label="Feito">${IC.visto}</button></div></div>`;
}
function inserirNoTreino(it){ const k = ativo.itens.findIndex(x => x.fase === 'along'); if (k < 0) ativo.itens.push(it); else ativo.itens.splice(k, 0, it); }
const nomeFase = f => f === 'aquec' ? 'Aquecimento' : f === 'along' ? (ativo && ativo.tipo === 'mobilidade' ? 'Mobilidade e alongamentos' : 'Alongamentos') : 'Treino';

/* ---------- Peso ---------- */
let pesos = LS.get('pesos', []), pesosApag = LS.get('pesosApag', {}), pesoRange = 90;
const hojeChave = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const tsDia = d => new Date(d + 'T12:00').getTime();
function guardarPesos(){ LS.set('pesos', pesos); LS.set('pesosApag', pesosApag); }
function pesoSujo(){ sync.pesosSujo = Date.now(); guardarSync(); agendarSync(); }
function registarPeso(d, kg){
  const reg = {d, kg: Math.round(kg * 10) / 10, ts: Date.now()}, i = pesos.findIndex(p => p.d === d);
  if (i >= 0) pesos[i] = reg; else pesos.push(reg);
  pesos.sort((a, b) => a.d < b.d ? -1 : 1); delete pesosApag[d]; guardarPesos(); pesoSujo();
}
// Tendência: média móvel exponencial (10% por dia), que filtra as oscilações de água e comida.
function tendencia(){
  const r = []; let t = null, ult = null;
  for (const p of pesos){
    const ts = tsDia(p.d);
    if (t === null) t = p.kg; else t += (1 - Math.pow(.9, Math.max(1, Math.round((ts - ult) / DIA)))) * (p.kg - t);
    ult = ts; r.push({d: p.d, ts, kg: p.kg, t});
  }
  return r;
}
function tendEm(serie, ts){ let v = null; for (const p of serie) if (p.ts <= ts) v = p; return v; }
function graficoPeso(serie){
  const fim = serie[serie.length - 1].ts, ini = pesoRange ? fim - pesoRange * DIA : serie[0].ts;
  const pts = serie.filter(p => p.ts >= ini); if (!pts.length) return '';
  const W = 340, H = 170, L = 36, R = 10, T = 12, B = 22;
  const vals = pts.flatMap(p => [p.kg, p.t]); if (cfg.meta) vals.push(cfg.meta);
  let ymin = Math.min(...vals) - .6, ymax = Math.max(...vals) + .6;
  if (cfg.meta && (cfg.meta < ymin - 8 || cfg.meta > ymax + 8)){ const v2 = pts.flatMap(p => [p.kg, p.t]); ymin = Math.min(...v2) - .6; ymax = Math.max(...v2) + .6; }
  const x0 = pts.length > 1 ? pts[0].ts : pts[0].ts - DIA, x1 = pts.length > 1 ? fim : fim + DIA;
  const X = ts => L + (ts - x0) / (x1 - x0) * (W - L - R), Y = v => T + (ymax - v) / (ymax - ymin) * (H - T - B);
  const passo = ymax - ymin > 12 ? 5 : ymax - ymin > 5 ? 2 : 1, linhas = [];
  for (let v = Math.ceil(ymin / passo) * passo; v <= ymax; v += passo) linhas.push(v);
  const fmtD = ts => new Date(ts).toLocaleDateString('pt-PT', {day: 'numeric', month: 'short'});
  const meta = cfg.meta && cfg.meta >= ymin && cfg.meta <= ymax ? `<line x1="${L}" x2="${W - R}" y1="${Y(cfg.meta)}" y2="${Y(cfg.meta)}" stroke="#ffc861" stroke-width="1.2" stroke-dasharray="5 5" opacity=".8"/><text x="${W - R}" y="${Y(cfg.meta) - 4}" text-anchor="end" font-size="10" fill="#ffc861">meta ${num(cfg.meta)}</text>` : '';
  const linha = pts.map((p, k) => (k ? 'L' : 'M') + X(p.ts).toFixed(1) + ' ' + Y(p.t).toFixed(1)).join('');
  const u = pts[pts.length - 1];
  return `<svg class="grafico-peso" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico do peso">
    <defs><linearGradient id="gPeso" x1="0" x2="1"><stop offset="0" stop-color="#b3260e"/><stop offset=".6" stop-color="#ff8a2a"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
      <filter id="fPeso" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>
    ${linhas.map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#3d3028" stroke-width="1"/><text x="${L - 6}" y="${Y(v) + 3.5}" text-anchor="end" font-size="10" fill="#76675b">${num(v)}</text>`).join('')}
    ${meta}
    ${pts.map(p => `<circle cx="${X(p.ts).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="2.4" fill="#b3a191" opacity=".55"/>`).join('')}
    <path d="${linha}" fill="none" stroke="#ff7a1c" stroke-width="5" opacity=".45" filter="url(#fPeso)"/>
    <path d="${linha}" fill="none" stroke="url(#gPeso)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${X(u.ts)}" cy="${Y(u.t)}" r="4.5" fill="#fff1cf" stroke="#ff8a2a" stroke-width="2"/>
    <text x="${L}" y="${H - 5}" font-size="10" fill="#76675b">${fmtD(x0)}</text><text x="${W - R}" y="${H - 5}" text-anchor="end" font-size="10" fill="#76675b">${fmtD(x1)}</text>
  </svg>`;
}
function renderPeso(){
  const serie = tendencia(), u = serie[serie.length - 1], hoje = hojeChave(), regHoje = pesos.find(p => p.d === hoje);
  const valor = regHoje ? regHoje.kg : u ? u.kg : 75;
  const variacao = dias => { const a = u && tendEm(serie, u.ts - dias * DIA); if (!a || a === u) return ''; const d = u.t - a.t;
    if (Math.abs(d) < .05) return `<div class="peq suave">estável em ${dias} dias</div>`;
    return `<div class="peq" style="color:${d < 0 ? 'var(--ouro)' : 'var(--chama)'}">${d > 0 ? '+' : '−'}${num(Math.abs(d).toFixed(1))} kg em ${dias} dias</div>`; };
  let metaHtml = '';
  if (u && cfg.meta){
    const inicio = serie[0].kg, total = inicio - cfg.meta, feito = inicio - u.t, prog = total ? Math.max(0, Math.min(1, feito / total)) : 1;
    const a28 = tendEm(serie, u.ts - 28 * DIA), ritmo = a28 && a28 !== u ? (u.t - a28.t) / ((u.ts - a28.ts) / (7 * DIA)) : 0, falta = cfg.meta - u.t;
    let eta = 'Regista durante algumas semanas para estimar quando lá chegas.';
    if (Math.abs(falta) < .3) eta = 'Estás na meta. Agora é manter.';
    else if (a28 && a28 !== u && Math.sign(ritmo) === Math.sign(falta) && Math.abs(ritmo) > .02){
      const semanas = falta / ritmo, data = new Date(Date.now() + semanas * 7 * DIA);
      eta = `Ao ritmo atual (${ritmo > 0 ? '+' : '−'}${num(Math.abs(ritmo).toFixed(2))} kg por semana), chegas lá por volta de ${data.toLocaleDateString('pt-PT', {month: 'long', year: 'numeric'})}.`;
    } else if (a28 && a28 !== u) eta = 'Ao ritmo atual ainda não te aproximas da meta.';
    metaHtml = `<div class="linha entre peq"><span class="suave">Início ${num(inicio)} kg</span><span class="quente cinzel">${Math.round(prog * 100)}%</span><span class="suave">Meta ${num(cfg.meta)} kg</span></div>
      <div class="barra-meta"><i style="width:${prog * 100}%"></i></div><p class="suave peq" style="margin:0">${eta}</p>`;
  }
  $('#vPeso').innerHTML = `<h2>Peso</h2>
    <div class="placa rebites col"><h2>Registar</h2>
      <div class="peso-input"><button class="btn icone" data-acao="pesoPasso" data-v="-0.1" aria-label="Menos">−</button><input type="number" id="pesoValor" step="0.1" min="20" max="400" inputmode="decimal" value="${valor}"><span class="cinzel suave">kg</span><button class="btn icone" data-acao="pesoPasso" data-v="0.1" aria-label="Mais">+</button></div>
      <div class="linha"><input type="date" id="pesoData" value="${hoje}" max="${hoje}" style="width:165px;flex:none"><button class="btn quente cresce" data-acao="registarPeso">${regHoje ? 'Atualizar' : 'Registar'}</button></div>
      <p class="suave mini" style="margin:0">${regHoje ? `Já registaste hoje: ${num(regHoje.kg)} kg.` : 'Pesa-te de manhã, depois da casa de banho e antes de comer, para comparares sempre nas mesmas condições.'}</p></div>
    ${u ? `<div class="placa rebites"><h2>Peso real</h2>
      <div class="linha entre" style="align-items:flex-end"><div><div class="cinzel quente" style="font-size:34px;line-height:1">${num(u.t.toFixed(1))} kg</div><div class="suave mini" style="margin-top:4px">tendência, sem as oscilações de água e comida</div></div>
        <div style="text-align:right">${variacao(7)}${variacao(30)}</div></div>
      ${graficoPeso(serie)}
      <div class="chips">${[[30, '1 mês'], [90, '3 meses'], [365, '1 ano'], [0, 'Tudo']].map(([v, t]) => chip(pesoRange === v, 'pesoRange', v, t)).join('')}</div></div>
    <div class="placa rebites col"><h2>Meta</h2>${metaHtml}
      <div class="linha"><input type="number" id="pesoMeta" step="0.5" inputmode="decimal" placeholder="Peso que queres atingir" value="${cfg.meta || ''}"><button class="btn" data-acao="guardarMeta">Guardar meta</button></div></div>
    <div class="placa rebites"><h2>Registos</h2><div class="lista">${pesos.slice().reverse().slice(0, 14).map((p, k, l) => { const ant = l[k + 1], d = ant ? p.kg - ant.kg : 0;
      return `<div class="linha entre peq" style="padding:4px 0"><span class="suave" style="min-width:110px">${new Date(tsDia(p.d)).toLocaleDateString('pt-PT', {weekday: 'short', day: 'numeric', month: 'short'})}</span>
        <b>${num(p.kg)} kg</b><span class="apagado" style="min-width:54px;text-align:right">${ant ? (d > 0 ? '+' : d < 0 ? '−' : '') + num(Math.abs(d).toFixed(1)) : ''}</span>
        <button class="btn icone fantasma" data-acao="apagarPeso" data-v="${p.d}" aria-label="Apagar">${IC.lixo}</button></div>`; }).join('')}</div></div>`
    : '<div class="placa vazio">Regista o primeiro peso para começares a ver a tendência e o gráfico.</div>'}`;
}
async function sincPesos(){
  const rem = await lerRemoto('pesos.json');
  if (rem){
    const r = rem.dados;
    for (const [d, ts] of Object.entries(r.apagados || {})) if (!pesosApag[d] || pesosApag[d] < ts) pesosApag[d] = ts;
    for (const p of r.pesos || []){ const i = pesos.findIndex(x => x.d === p.d); if (i < 0) pesos.push(p); else if ((p.ts || 0) > (pesos[i].ts || 0)) pesos[i] = p; }
    pesos = pesos.filter(p => !(pesosApag[p.d] && pesosApag[p.d] >= (p.ts || 0))).sort((a, b) => a.d < b.d ? -1 : 1);
    guardarPesos();
    const ass = x => JSON.stringify([(x.pesos || []).map(p => p.d + ':' + p.ts).sort(), Object.entries(x.apagados || {}).map(e => e.join(':')).sort()]);
    if (ass({pesos, apagados: pesosApag}) !== ass(r)) sync.pesosSujo = Date.now();
  }
  if (sync.pesosSujo){
    const w = await escreverRemoto('pesos.json', {pesos, apagados: pesosApag}, rem && rem.sha);
    if (w.conflito) throw new Error('Conflito ao sincronizar o peso. Tenta outra vez.');
    sync.pesosSujo = 0;
  }
}

/* ---------- Montar o meu treino e modelos ---------- */
function linhaSel(e){
  const k = sel.escolhidos.indexOf(e.id);
  return `<div class="item${k >= 0 ? ' escolhido' : ''}" data-acao="selMarcar" data-id="${e.id}"><img class="mini-img" src="${img(e)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
    <div class="t"><b>${esc(e.n)}</b><span>${esc(musculosTxt(e))}${e.c !== 'forca' ? ' · ' + CATS[e.c] : ''}</span></div><span class="ordem">${k >= 0 ? k + 1 : ''}</span></div>`;
}
function planoDeModelo(m){
  novoRapido(TIPOS[m.tipo] && !TIPOS[m.tipo].oculto ? m.tipo : 'livre'); rapido.real = m.tipo; rapido.nome = m.nome; rapido.modelo = m.id;
  rapido.plano = m.itens.filter(x => EXI[x.id]).map(x => { const it = novoItem(EXI[x.id], x.n); it.alvo = x.alvo; it.desc = x.desc; return it; });
  folhaPlano();
}

/* ---------- Capa: três marteladas para entrar ---------- */
// O ferro da semana: cada treino molda a barra até virar lâmina (meta = treinos por semana).
// Pontos correspondentes da barra (f = 0) e da lâmina (f = 1); a forma intermédia é interpolada.
const BARRA = [[160, 184], [164, 184], [166, 184], [168, 184], [170, 184], [246, 184], [252, 189], [246, 194], [170, 194], [168, 194], [166, 194], [164, 194], [160, 194]];
const LAMINA = [[112, 186], [140, 186], [140, 177], [147, 177], [147, 184], [285, 184], [312, 189], [285, 194], [147, 194], [147, 201], [140, 201], [140, 192], [112, 192]];
const lerp = (a, b, f) => a + (b - a) * f;
const formaPeca = f => 'M' + BARRA.map((p, i) => lerp(p[0], LAMINA[i][0], f).toFixed(1) + ' ' + lerp(p[1], LAMINA[i][1], f).toFixed(1)).join(' L') + ' Z';
const BIGORNA = 'M44 204.5Q80 197 118 194.5L146 194.5L146 189.5L326 189.5Q333 190 329 196.5L330 205Q329 211 320 213Q290 217 276 224Q262 232 262 246Q263 254 272 258L300 262Q306 264 306 270L306 273L280 273Q270 266 248 265L176 265Q154 266 144 273L118 273L118 270Q118 264 124 262L152 258Q161 254 162 246Q162 232 150 224Q136 216 112 213Q78 211 46 206.5Q43 205.8 44 204.5Z';
// Bigorna de ferreiro em perspetiva ligeira (vista de frente, um pouco de cima e da esquerda, do lado da forja).
const DEFS_BIGORNA = `
    <linearGradient id="gbCorpo" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="273"><stop offset="0" stop-color="#3f3833"/><stop offset=".16" stop-color="#2d2825"/><stop offset=".45" stop-color="#1d1917"/><stop offset=".78" stop-color="#131110"/><stop offset="1" stop-color="#0b0a09"/></linearGradient>
    <linearGradient id="gbPlaca" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="206"><stop offset="0" stop-color="#5e5650"/><stop offset=".35" stop-color="#3d3632"/><stop offset="1" stop-color="#24201d"/></linearGradient>
    <linearGradient id="gbFace" gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="330" y2="0"><stop offset="0" stop-color="#7d736c"/><stop offset=".3" stop-color="#a99e96"/><stop offset=".5" stop-color="#ddd3ca"/><stop offset=".64" stop-color="#b3a8a0"/><stop offset="1" stop-color="#5a524c"/></linearGradient>
    <linearGradient id="gbFaceFundo" gradientUnits="userSpaceOnUse" x1="0" y1="189.5" x2="0" y2="196"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".55" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="gbMesa" gradientUnits="userSpaceOnUse" x1="112" y1="0" x2="146" y2="0"><stop offset="0" stop-color="#7e6656"/><stop offset="1" stop-color="#8f847c"/></linearGradient>
    <linearGradient id="gbCorno" gradientUnits="userSpaceOnUse" x1="44" y1="0" x2="120" y2="0"><stop offset="0" stop-color="#d98a4e"/><stop offset=".3" stop-color="#957865"/><stop offset="1" stop-color="#857a72"/></linearGradient>
    <linearGradient id="gbCornoSombra" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="213"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
    <linearGradient id="gbForja" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="250" y2="0"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".42"/><stop offset=".35" stop-color="#ff7a2a" stop-opacity=".14"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></linearGradient>
    <linearGradient id="gbAro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a615b"/><stop offset=".25" stop-color="#342e2a"/><stop offset="1" stop-color="#0b0908"/></linearGradient>
    <radialGradient id="gbTocoLuz" gradientUnits="userSpaceOnUse" cx="190" cy="278" r="90"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".28"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gbPrego" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#b3a79e"/><stop offset=".5" stop-color="#4f4741"/><stop offset="1" stop-color="#151210"/></radialGradient>`;
function bigornaSVG(){
  let sem = 11; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  // marcas de uso: picadas escuras e riscos claros no corpo
  const marcas = Array.from({length: 34}, () => { const x = 56 + rnd() * 268, y = 202 + rnd() * 66;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(.5 + rnd() * 1.5).toFixed(2)}" ry="${(.35 + rnd() * .7).toFixed(2)}" fill="${rnd() < .62 ? '#000' : '#9a8f87'}" opacity="${(.14 + rnd() * .22).toFixed(2)}"/>`; }).join('');
  const riscos = Array.from({length: 9}, () => { const x = 150 + rnd() * 140, y = 190.8 + rnd() * 4.4, l = 8 + rnd() * 24;
    return `<path d="M${x.toFixed(1)} ${y.toFixed(2)}L${(x + l).toFixed(1)} ${(y - .3 + rnd() * .6).toFixed(2)}" stroke="${rnd() < .5 ? '#fff' : '#3a3330'}" stroke-width=".35" opacity="${(.18 + rnd() * .2).toFixed(2)}"/>`; }).join('');
  const lascas = [[166, 2], [203, 1.3], [244, 1.7], [318, 1.5]].map(([x, w]) => `<path d="M${x} 196L${x + w} 196L${x + w * .55} 197.1Z" fill="#0d0b0a" opacity=".75"/>`).join('');
  // aro de ferro do cepo e rebites ao longo da curva
  const aroY = t => 292 + 2 * (1 - t) * t * 20;
  const rebites = [.1, .3, .5, .7, .9].map(t => `<circle cx="${(118 + 188 * t).toFixed(1)}" cy="${(aroY(t) + 3.6).toFixed(1)}" r="1.5" fill="url(#gbPrego)"/>`).join('');
  const prego = (x, y) => `<circle cx="${x}" cy="${y}" r="1.9" fill="url(#gbPrego)"/><circle cx="${x - .5}" cy="${y - .6}" r=".5" fill="#e8ddd4" opacity=".7"/>`;
  const fixa = (d, px, py) => `<path d="${d}" fill="url(#gbAro)" stroke="#060504" stroke-width=".6"/>${prego(px, py)}`;
  return `
  <path d="M117 270Q113 296 118 342L306 342Q311 296 307 270Z" fill="url(#gToco)"/>
  <path d="M117 270Q113 296 118 342" stroke="#080503" stroke-width="3" fill="none"/><path d="M307 270Q311 296 306 342" stroke="#080503" stroke-width="3" fill="none"/>
  <path d="M136 284Q132 308 138 340M160 286Q164 310 158 340M186 288Q182 314 188 340M240 288Q244 312 238 340M266 286Q262 310 268 340M290 284Q294 306 288 340" stroke="#120a05" stroke-width="2" fill="none" opacity=".75"/>
  <path d="M117.5 292Q212 312 306.5 292L306.8 299.5Q212 319.5 117.3 299.5Z" fill="url(#gbAro)" stroke="#060504" stroke-width=".6"/>
  <path d="M118 292.6Q212 312.6 306 292.6" stroke="#a89c93" stroke-width=".6" fill="none" opacity=".45"/>
  ${rebites}
  <ellipse cx="212" cy="270" rx="94" ry="12.6" fill="url(#gTocoTopo)"/>
  <ellipse cx="212" cy="270" rx="94" ry="12.6" fill="url(#gbTocoLuz)"/>
  <ellipse cx="212" cy="270" rx="72" ry="9.4" fill="none" stroke="#3a2414" stroke-width="1" opacity=".8"/>
  <ellipse cx="212" cy="270" rx="50" ry="6.6" fill="none" stroke="#3a2414" stroke-width="1" opacity=".75"/>
  <ellipse cx="212" cy="270" rx="28" ry="3.8" fill="none" stroke="#3a2414" stroke-width="1" opacity=".7"/>
  <path d="M188 275L172 281.4M232 275.5L246 281.6M212 276L211 282.4" stroke="#1a0f08" stroke-width=".9" opacity=".8"/>
  <ellipse cx="212" cy="270" rx="94" ry="12.6" fill="none" stroke="#120a05" stroke-width="2.4"/>
  <ellipse cx="212" cy="273.5" rx="99" ry="5.5" fill="#000" opacity=".75" filter="url(#fB3)"/>
  <path d="M144 273Q154 266 176 265L248 265Q270 266 280 273Z" fill="#030202" opacity=".92"/>

  <path d="${BIGORNA}" fill="url(#gbCorpo)"/>
  <g clip-path="url(#cpBigorna)">
    <rect x="40" y="185" width="300" height="92" fill="url(#gbForja)"/>
    <rect x="50" y="190" width="290" height="90" fill="url(#gBigornaLado)"/>
    <path d="M150 224Q162 232 162 246Q161 254 152 258M276 224Q262 232 262 246Q263 254 272 258" stroke="#000" stroke-width="12" opacity=".38" fill="none" filter="url(#fB3)"/>
    <ellipse cx="212" cy="238" rx="34" ry="24" fill="#ffd9b0" opacity=".06" filter="url(#fB6)"/>
    <rect class="luzFogo" x="50" y="190" width="290" height="90" fill="url(#gAquecido)"/>
    ${marcas}
  </g>
  <path d="M140 196L328 196L330 205L140 206Z" fill="url(#gbPlaca)"/>
  <path d="M140 206.1L330 204.9" stroke="#0a0807" stroke-width=".9"/><path d="M140 207L329.6 205.8" stroke="#7a6f67" stroke-width=".45" opacity=".35"/>
  <path d="M44 204.5Q80 197 118 194.5L112 201Q78 202.6 46 205.6Z" fill="url(#gbCorno)"/>
  <path d="M46 205.6Q78 202.6 112 201L112 213Q78 211 46 206.5Z" fill="url(#gbCornoSombra)"/>
  <path d="M118 194.5L146 194.5L140 201L112 201Z" fill="url(#gbMesa)"/>
  <path d="M146 189.5L140 196L140 201L146 194.5Z" fill="#7a5038"/>
  <path d="M146 189.5L326 189.5Q333 190 328 196L140 196Z" fill="url(#gbFace)"/>
  <path d="M146 189.5L326 189.5Q333 190 328 196L140 196Z" fill="url(#gbFaceFundo)"/>
  ${riscos}
  <path d="${BIGORNA}" fill="#000" filter="url(#fGrao)" opacity=".16"/>

  <path d="M146.3 189.6L325.6 189.6" stroke="#1d1917" stroke-width=".7"/>
  <path d="M141 196.1L327.6 196.1" stroke="#f7eee6" stroke-width=".9" opacity=".8"/>
  <path d="M112.4 201.1L140 201.1" stroke="#e6d9cf" stroke-width=".7" opacity=".6"/>
  <path d="M118.4 194.6L146 194.6" stroke="#2a2420" stroke-width=".6"/>
  <path d="M49 203.7Q82 198.4 116.5 196" stroke="#f6e4d2" stroke-width="1.1" fill="none" opacity=".6"/>
  <path d="M46 204.5Q60 201 74 199.6" stroke="#ffb06a" stroke-width="2.4" fill="none" opacity=".45" filter="url(#fB1)"/>
  <path d="M46.5 206.5Q78 211 112 213Q136 216 150 224Q162 232 162 246Q161 254 152 258L124 262Q118 264 118 270L118 273" stroke="#ff8a3a" stroke-width="1.2" fill="none" opacity=".42"/>
  <path d="M329 196.5L330 205Q329 211 320 213Q290 217 276 224Q262 232 262 246Q263 254 272 258L300 262Q306 264 306 270" stroke="#9aa3ad" stroke-width=".8" fill="none" opacity=".22"/>
  <path d="M152.5 258.2L124.5 262.2M271.5 258.2L299.5 262.2" stroke="#8a7f77" stroke-width=".8" opacity=".55"/>
  <path d="M144 273Q154 266 176 265L248 265Q270 266 280 273" stroke="#5a504a" stroke-width=".7" fill="none" opacity=".5"/>

  <g font-family="'Cinzel', Georgia, serif" font-size="8.4" font-weight="700" letter-spacing="2.2" text-anchor="middle">
    <text x="213.1" y="241.7" fill="#050404" opacity=".9">FORJA</text>
    <text x="212.6" y="240.4" fill="#6d645d" opacity=".55">FORJA</text>
    <text x="212.8" y="241" fill="#221d1a">FORJA</text>
  </g>
  <path d="M190 245.6L235.6 245.6" stroke="#050404" stroke-width=".7" opacity=".7"/><path d="M190 245L235.6 245" stroke="#6d645d" stroke-width=".4" opacity=".4"/>

  <path d="M295 194.8L304 194.8L307.9 190.6L298.9 190.6Z" fill="#070605"/>
  <path d="M298.9 190.6L307.9 190.6L307 191.7L298 191.7Z" fill="#4d4540"/>
  <ellipse cx="285" cy="192.9" rx="2.7" ry="1.5" fill="#070605"/><path d="M282.4 192.6Q285 191.2 287.6 192.6Q285 191.9 282.4 192.6Z" fill="#4d4540"/>
  ${lascas}

  ${fixa('M121 262.8L133.5 262L135.5 279.8L119 280.4Z', 127.4, 276.6)}
  ${fixa('M290.5 262L303 262.8L305 280.4L288.5 279.8Z', 296.8, 276.6)}`;
}
// Martelo de ferreiro (pena transversal): cabeça de aço chanfrada, cabo de freixo e pega de couro. Coordenadas no repouso da animação.
const CABECA = 'M199 184Q215 185.4 231 184L233.5 181.5L234 164Q235.4 159 235.2 154Q235 148.5 234 145L220.4 127.6Q215 124.6 209.6 127.6L196 145Q195 148.5 194.8 154Q194.6 159 196 164L196.5 181.5Z';
const CABO = 'M228 149.6C270 149.4 320 147 430 145.6L430 164C320 163.4 270 161 228 160.6Z';
const COURO = 'M338 146.8C360 146.3 400 145.8 430 145.3L430 164.3C400 164 360 163.8 338 163.4Z';
const DEFS_MARTELO = `
    <linearGradient id="gmFace" gradientUnits="userSpaceOnUse" x1="199" y1="0" x2="231" y2="0"><stop offset="0" stop-color="#5d544e"/><stop offset=".32" stop-color="#9c928b"/><stop offset=".55" stop-color="#ddd3cb"/><stop offset=".72" stop-color="#9d928b"/><stop offset="1" stop-color="#3f3833"/></linearGradient>
    <linearGradient id="gmChanfroE" gradientUnits="userSpaceOnUse" x1="0" y1="128" x2="0" y2="184"><stop offset="0" stop-color="#7a5640"/><stop offset=".5" stop-color="#6b4a36"/><stop offset="1" stop-color="#9a6440"/></linearGradient>
    <linearGradient id="gmChanfroD" gradientUnits="userSpaceOnUse" x1="0" y1="128" x2="0" y2="184"><stop offset="0" stop-color="#2e2825"/><stop offset="1" stop-color="#110e0c"/></linearGradient>
    <linearGradient id="gmAltura" gradientUnits="userSpaceOnUse" x1="0" y1="124" x2="0" y2="186"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="gmCabo" gradientUnits="userSpaceOnUse" x1="0" y1="145" x2="0" y2="164"><stop offset="0" stop-color="#d9a26a"/><stop offset=".22" stop-color="#a87242"/><stop offset=".68" stop-color="#6c4425"/><stop offset="1" stop-color="#3a2210"/></linearGradient>
    <linearGradient id="gmCouro" gradientUnits="userSpaceOnUse" x1="0" y1="145" x2="0" y2="165"><stop offset="0" stop-color="#6a4630"/><stop offset=".3" stop-color="#42291a"/><stop offset="1" stop-color="#170c06"/></linearGradient>
    <clipPath id="cpCabeca"><path d="${CABECA}"/></clipPath>
    <clipPath id="cpCabo"><path d="${CABO}"/></clipPath>
    <clipPath id="cpCouro"><path d="${COURO}"/></clipPath>`;
function marteloSVG(){
  let sem = 5; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  const voltas = Array.from({length: 14}, (_, i) => { const x = 336 + i * 7;
    return `<path d="M${x} 146L${x + 6} 164.6" stroke="#120804" stroke-width="1.4"/><path d="M${x - 1.3} 146L${x + 4.7} 164.6" stroke="#9a6a46" stroke-width=".5" opacity=".6"/>`; }).join('');
  const picadas = Array.from({length: 14}, () => `<ellipse cx="${(198 + rnd() * 34).toFixed(1)}" cy="${(132 + rnd() * 50).toFixed(1)}" rx="${(.4 + rnd() * 1.1).toFixed(2)}" ry="${(.3 + rnd() * .6).toFixed(2)}" fill="${rnd() < .7 ? '#000' : '#fff'}" opacity="${(.1 + rnd() * .14).toFixed(2)}"/>`).join('');
  return `
      <path d="${CABO}" fill="url(#gmCabo)"/>
      <g clip-path="url(#cpCabo)">
        <path d="M240 152.4C290 152 330 150 430 149.2M246 156.9C300 157.1 350 156.6 430 156.9M262 154.6Q300 154.1 332 153.2M282 159.3Q310 159.7 336 159.3M300 150.6Q318 150.2 334 149.6" stroke="#4a2a14" stroke-width=".7" fill="none" opacity=".55"/>
        <path d="M228 162.4C270 162.8 320 164.8 430 165.4" stroke="#000" stroke-width="5" opacity=".4" fill="none" filter="url(#fB1)"/>
        <ellipse cx="312" cy="150.2" rx="24" ry="1.5" fill="#ffe1b8" opacity=".25" filter="url(#fB1)"/>
      </g>
      <path d="M236 150.3C280 150 320 147.8 338 147.3" stroke="#f6cd98" stroke-width=".7" fill="none" opacity=".55"/>
      <path d="${COURO}" fill="url(#gmCouro)"/>
      <g clip-path="url(#cpCouro)">${voltas}</g>
      <path d="M338.6 146.8L338.6 163.4" stroke="#8a5e3e" stroke-width="1.3"/><path d="M336.6 147L336.6 163.2" stroke="#1a0e07" stroke-width="1.6"/>
      <ellipse cx="237" cy="155" rx="4.5" ry="7.5" fill="#000" opacity=".6" filter="url(#fB1)"/>
      <path d="${CABECA}" fill="url(#gmFace)"/>
      <g clip-path="url(#cpCabeca)">
        <path d="M196.5 181.5L196 164Q194.6 159 194.8 154Q195 148.5 196 145L209.6 127.6L211.6 129.4L199.6 145.6Q198.5 148.8 198.4 154Q198.3 159 199.7 164L200.2 181Z" fill="url(#gmChanfroE)"/>
        <path d="M233.5 181.5L234 164Q235.4 159 235.2 154Q235 148.5 234 145L220.4 127.6L218.4 129.4L230.4 145.6Q231.5 148.8 231.6 154Q231.7 159 230.3 164L229.8 181Z" fill="url(#gmChanfroD)"/>
        <path d="M190 145.4L209.6 127.6Q215 124.6 220.4 127.6L240 145.4Z" fill="#fff" opacity=".09"/>
        <rect x="188" y="120" width="54" height="70" fill="url(#gmAltura)"/>
        <ellipse cx="219.5" cy="163" rx="1.9" ry="15" fill="#fff" opacity=".34" filter="url(#fB1)"/>
        <ellipse cx="208" cy="137" rx="1.1" ry="6" fill="#fff" opacity=".2" filter="url(#fB1)" transform="rotate(38 208 137)"/>
        ${picadas}
        <path d="${CABECA}" fill="url(#gCabecaBaixo)"/>
      </g>
      <path d="${CABECA}" fill="#000" filter="url(#fGrao)" opacity=".18"/>
      <path d="M200.2 181L199.7 164Q198.3 159 198.4 154Q198.5 148.8 199.6 145.6L211.6 129.4" stroke="#e2c0a2" stroke-width=".5" fill="none" opacity=".5"/>
      <path d="M229.8 181L230.3 164Q231.7 159 231.6 154Q231.5 148.8 230.4 145.6L218.4 129.4" stroke="#0b0908" stroke-width=".6" fill="none" opacity=".7"/>
      <path d="M198 145.6L232 145.6" stroke="#e8ddd4" stroke-width=".5" opacity=".4"/><path d="M198 146.3L232 146.3" stroke="#000" stroke-width=".5" opacity=".3"/>
      <path d="M196.7 181.3L233.3 181.3" stroke="#d8cdc4" stroke-width=".6" opacity=".6"/>
      <path d="M199 184Q215 185.4 231 184" stroke="#ffcf8a" stroke-width="1.3" fill="none" opacity=".9"/>
      <path d="M210.4 127.4Q215 125 219.6 127.4" stroke="#f4eae1" stroke-width=".9" fill="none" opacity=".8"/>
      <path d="M196 145Q195 148.5 194.8 154Q194.6 159 196 164L196.5 181.5" stroke="#ff9a4a" stroke-width=".9" fill="none" opacity=".55"/>
      <path d="M234 145Q235 148.5 235.2 154Q235.4 159 234 164L233.5 181.5" stroke="#0a0807" stroke-width=".8" fill="none"/>`;
}
const PIVO = '380px 155px', IMPACTO = [215, 184];
function cenaForja(f){
  const jx = lerp(160, 112, f), cx = lerp(206, 212, f), meia = lerp(40, 92, f);
  const chamas = [[86, 46, 1], [104, 58, .9], [122, 50, 1.1], [140, 40, .8], [96, 34, .7]].map(([x, h, e], i) =>
    `<path class="cChama" style="transform-origin:${x}px 196px" d="M${x - 11 * e} 196Q${x - 13 * e} ${196 - h * .55} ${x} ${196 - h}Q${x + 13 * e} ${196 - h * .55} ${x + 11 * e} 196Z" fill="url(#gChama)" opacity="${.75 - i * .06}"/>`).join('');
  const brasas = [[62, 195, 7], [78, 198, 9], [96, 194, 8], [114, 198, 10], [132, 195, 8], [150, 198, 7], [88, 200, 6], [124, 201, 7]].map(([x, y, r]) =>
    `<circle class="cCarvao" cx="${x}" cy="${y + 3}" r="${r * .7}" fill="url(#gCarvao)" opacity=".8"/>`).join('');
  const pedras = [[2, 52, 46, 22], [50, 50, 52, 20], [106, 48, 50, 22], [160, 52, 46, 20], [0, 78, 30, 26], [170, 76, 34, 24], [0, 108, 28, 28], [174, 104, 32, 28],
    [0, 140, 30, 26], [172, 136, 34, 28], [0, 170, 28, 30], [176, 168, 30, 30]].map(([x, y, w, h]) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#130e0b" stroke="#060403" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 36 400 290" id="cCena" aria-label="Bigorna com ferro em brasa">
  <defs>
    <radialGradient id="gFogo" cx="50%" cy="100%" r="90%"><stop offset="0" stop-color="#fff1cf"/><stop offset=".18" stop-color="#ffc861"/><stop offset=".4" stop-color="#ff7a1c"/><stop offset=".7" stop-color="#8a1f08"/><stop offset="1" stop-color="#2a0c05"/></radialGradient>
    <linearGradient id="gChama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff1cf"/><stop offset=".25" stop-color="#ffc861"/><stop offset=".6" stop-color="#ff6a1a"/><stop offset="1" stop-color="#b3260e" stop-opacity="0"/></linearGradient>
    <radialGradient id="gCarvao" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#ffe39a"/><stop offset=".35" stop-color="#ff8a24"/><stop offset=".75" stop-color="#9a2a0a"/><stop offset="1" stop-color="#2a0d05"/></radialGradient>
    <radialGradient id="gLuzForja" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gChao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1511" stop-opacity="0"/><stop offset=".22" stop-color="#0e0a08"/><stop offset="1" stop-color="#040302"/></linearGradient>
    <radialGradient id="gLuzChao" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".35"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gToco" x1="0" x2="1"><stop offset="0" stop-color="#0c0704"/><stop offset=".25" stop-color="#2a1a0f"/><stop offset=".45" stop-color="#3e2817"/><stop offset=".75" stop-color="#21140b"/><stop offset="1" stop-color="#140b06"/></linearGradient>
    <radialGradient id="gTocoTopo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7a5636"/><stop offset=".6" stop-color="#4e3420"/><stop offset="1" stop-color="#2a1a0f"/></radialGradient>
    <linearGradient id="gBigornaLado" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
    <radialGradient id="gReflexo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".4" stop-color="#ff8a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gAquecido" cx="30%" cy="0%" r="80%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e4"/><stop offset=".25" stop-color="#ffe08f"/><stop offset=".55" stop-color="#ffa13c"/><stop offset=".8" stop-color="#e2541b"/><stop offset="1" stop-color="#8a2208"/></linearGradient>
    <linearGradient id="gMetalPontas" x1="0" x2="1"><stop offset="0" stop-color="#6a1405" stop-opacity=".9"/><stop offset=".28" stop-color="#6a1405" stop-opacity="0"/><stop offset=".72" stop-color="#6a1405" stop-opacity="0"/><stop offset="1" stop-color="#6a1405" stop-opacity=".9"/></linearGradient>
    <linearGradient id="gCabecaBaixo" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#ff8a2a" stop-opacity="0"/><stop offset="1" stop-color="#ff8a2a" stop-opacity=".8"/></linearGradient>
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
    <clipPath id="cpBigorna"><path d="${BIGORNA}"/></clipPath>${DEFS_BIGORNA}${DEFS_MARTELO}
    <clipPath id="cpBoca"><path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202Z"/></clipPath>
  </defs>

  <g filter="url(#fB1)" opacity=".95" mask="url(#mParede)">
    <path d="M-40 202L-40 44L210 44L210 202Z" fill="#0b0806"/>
    ${pedras}
    <ellipse class="luzFogo" cx="98" cy="150" rx="110" ry="90" fill="url(#gLuzForja)"/>
    <g clip-path="url(#cpBoca)"><rect x="30" y="80" width="140" height="130" fill="url(#gFogo)"/>${chamas}${brasas}</g>
    <path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202" fill="none" stroke="#ff9a3c" stroke-width="3" opacity=".55" filter="url(#fB3)"/>
    <path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202" fill="none" stroke="#0d0907" stroke-width="4"/>
  </g>

  <rect x="-60" y="232" width="520" height="110" fill="url(#gChao)"/>
  <ellipse class="luzFogo" cx="212" cy="272" rx="190" ry="26" fill="url(#gLuzChao)"/>

  ${bigornaSVG()}
  <g clip-path="url(#cpBigorna)"><ellipse cx="${cx}" cy="203" rx="${meia + 30}" ry="11" fill="url(#gReflexo)" opacity=".6" filter="url(#fB6)"/></g>
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
      ${marteloSVG()}
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
let golpes = 0, capaAberta = false, escondidoEm = 0, actx = null, capaF = 0, capaGeo = null;
const capaT = {fa: 0, fu: 0, cr: 0, prox: 1.5};
function geoCapa(){
  const svgEl = $('#cCena'); if (!svgEl) return (capaGeo = null);
  const m = svgEl.getScreenCTM(), p = (x, y) => { const q = svgEl.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(m); };
  const f1 = p(52, 188), f2 = p(146, 188), ft = p(98, 96), m1 = p(lerp(160, 112, capaF), 184), m2 = p(lerp(252, 312, capaF), 184);
  capaGeo = {fx1: f1.x, fx2: f2.x, fy: f1.y, ftop: ft.y, mx1: m1.x, mx2: m2.x, my: m1.y};
}
function emissorCapa(dt, nova){
  const g = capaGeo; if (!g || !capaAberta) return;
  const R = Math.random, fx = () => g.fx1 + R() * (g.fx2 - g.fx1);
  capaT.fa += dt; capaT.fu += dt; capaT.cr += dt;
  while (capaT.fa > .045){ capaT.fa -= .045;
    if (R() < .7) nova(fx(), g.fy, (R() - .5) * 40, -(70 + R() * 180), 1.1 + R() * 1.6, .5 + R() * .9, -25, {a: 1});
    else nova(fx(), g.fy, (R() - .5) * 18, -(25 + R() * 55), 2.5 + R() * 3, .8 + R() * 1.4, -4);
  }
  if (capaT.fu > .3){ capaT.fu = 0; nova(fx(), g.ftop + 10, (R() - .5) * 12, -(14 + R() * 18), 6 + R() * 4, 16 + R() * 16, -1, {fumo: 1}); if (R() < .4) nova(R() * innerWidth, innerHeight + 30, (R() - .5) * 8, -(10 + R() * 18), 10 + R() * 6, 10 + R() * 22, -.5, {bk: 1}); }
  if (capaT.cr > capaT.prox){ capaT.cr = 0; capaT.prox = .9 + R() * 2.2;
    const px = fx(), n = 8 + (R() * 10 | 0);
    for (let i = 0; i < n; i++){ const a = -Math.PI / 2 + (R() - .5) * 1.4, v = 200 + R() * 360; nova(px, g.fy, Math.cos(a) * v, Math.sin(a) * v, .8 + R() * .9, .7 + R() * 1.1, 300, {r: 1}); }
  }
  if (R() < dt * 1.4) nova(g.mx1 + R() * (g.mx2 - g.mx1), g.my, (R() - .5) * 40, -(40 + R() * 80), .7 + R() * .7, .45 + R() * .5, -10, {a: 1});
}
addEventListener('resize', () => { if (capaAberta) setTimeout(geoCapa, 50); });
function mostrarCapa(forcar){
  if (!cfg.pronto || (!forcar && (cfg.capa === false || ativo))) return;
  golpes = 0; capaAberta = true;
  const c = $('#capa'); c.classList.remove('sair'); c.hidden = false; renderCapa();
  requestAnimationFrame(() => { geoCapa(); Faiscas.emissor(emissorCapa); });
  $('#faiscas').style.zIndex = 46; $('#faiscas').classList.add('na-capa');
}
function renderCapa(){
  const h = new Date().getHours(), ola = h < 6 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
  const feitos = semana().filter(d => d.acesa).length, f = Math.min(1, feitos / Math.max(1, cfg.dias)), pronta = f >= 1;
  const ult = ordenados()[0], dUlt = ult ? diasDesde(ult.inicio) : null, mes = treinos.filter(t => chaveMes(t.inicio) === chaveMes(Date.now())).length;
  const sug = sugestao();
  capaF = f;
  $('#capa').innerHTML = `
    <div id="cSombra" class="capa-sombra" aria-hidden="true"></div>
    <div id="cLuz"></div>
    <div class="capa-topo"><div class="capa-marca quente">FORJA</div>
      <h1 class="capa-ola">${ola}${cfg.nome ? ', ' + esc(cfg.nome) : ''}</h1>
      ${sug ? `<p class="capa-sug">Hoje o ferro pede <b>${TIPOS[sug.tipo].nome}</b><br>${esc(sug.motivo)}</p>` : ''}</div>
    <div class="cena">
      ${cenaForja(f)}
      <h2 class="capa-peca">${pronta ? 'Lâmina forjada esta semana' : 'A peça da semana'}</h2>
      <p class="suave peq" style="margin:4px 0 0">${feitos} de ${cfg.dias} treinos${pronta ? '. Bom trabalho, ferreiro.' : '. Cada treino molda o ferro até virar lâmina.'}</p>
    </div>
    <div class="capa-base">
      <div class="infos"><div>Esta semana<b>${feitos}/${cfg.dias}</b></div><div>Este mês<b>${mes} ${mes === 1 ? 'treino' : 'treinos'}</b></div>
        <div>Último treino<b>${dUlt === null ? '—' : dUlt === 0 ? 'hoje' : dUlt === 1 ? 'ontem' : 'há ' + dUlt + ' dias'}</b></div></div>
      <div class="golpes" id="cGolpes"><i></i><i></i><i></i></div>
      <p class="capa-dica" id="cDica">Dá três marteladas para entrar</p>
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
  // O clarão do golpe empurra a escuridão para os cantos e ela volta devagar.
  $('#cSombra').animate([{opacity: 1}, {opacity: n === 3 ? .2 : .45, offset: .12}, {opacity: 1}], {duration: n === 3 ? 1100 : 650, easing: 'ease-out'});
  const calor = 1 + .14 * n;
  ['#cPeca', '#cPecaBrilho'].forEach(s => { const el = $(s); el.animate([{filter: 'brightness(2.2)'}, {filter: `brightness(${calor})`}], {duration: n === 3 ? 900 : 450, easing: 'ease-out'}); el.style.filter = `brightness(${calor})`; });
  const nf = Math.min(1, capaF + .07 * n), nd = formaPeca(nf);
  document.querySelectorAll('#capa path').forEach(el => { if (el.getAttribute('d') === formaPeca(Math.min(1, capaF + .07 * (n - 1)))) el.setAttribute('d', nd); });
  const luz = $('#cLuz'), r = $('#capa').getBoundingClientRect();
  luz.style.background = `radial-gradient(circle at ${(p.x - r.left) / r.width * 100}% ${(p.y - r.top) / r.height * 100}%, rgba(255,226,170,.85), rgba(255,140,50,.35) 18%, transparent 48%)`;
  luz.animate([{opacity: n === 3 ? 1 : .75}, {opacity: 0}], {duration: n === 3 ? 520 : 300, easing: 'ease-out'});
  document.querySelectorAll('#cGolpes i').forEach((d, i) => d.classList.toggle('on', i < n));
  $('#cDica').textContent = n === 1 ? 'Mais duas…' : n === 2 ? 'Mais uma!' : 'O ferro está pronto.';
  if (n >= 3) setTimeout(fecharCapa, 750);
}
function fecharCapa(){
  capaAberta = false; Faiscas.emissor(null); const c = $('#capa'); c.classList.add('sair');
  setTimeout(() => { c.hidden = true; c.innerHTML = ''; $('#faiscas').style.zIndex = ''; $('#faiscas').classList.remove('na-capa'); forjarPlacas(); }, 520);
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
  rDur(a){ rapido.duracao = +a.dataset.v; folhaRapido(true); },
  rEq(a){ rapido.equip = alterna(rapido.equip, a.dataset.v); rapido.limite = 40; folhaRapido(true); },
  rAtalho(a){ const t = a.dataset.v === 'sug' ? (sugestao() || {tipo: 'corpo'}).tipo : a.dataset.v, ms = musculosDe(t);
    rapido.especial = null; rapido.musculos = mesmos(rapido.musculos, ms) ? [] : ms; rapido.limite = 40; folhaRapido(true); },
  rEspecial(a){ rapido.especial = rapido.especial === a.dataset.v ? null : a.dataset.v; if (rapido.especial) rapido.musculos = []; folhaRapido(true); },
  rMusculo(a){ rapido.especial = null; rapido.musculos = alterna(rapido.musculos, a.dataset.v); rapido.limite = 40; folhaRapido(true); },
  rEscolher(a){ const id = a.dataset.id, k = rapido.escolhidos.indexOf(id); if (k >= 0) rapido.escolhidos.splice(k, 1); else rapido.escolhidos.push(id); vibrar(10); atualizarEscolhidos(); },
  rMais(){ rapido.limite += 40; folhaRapido(true); },
  rComecar(){ comecarDireto(); },
  gerar(a){ gerar(); if (a) Faiscas.de(a, 14); },
  pTrocar(a){ if (trocarNoPlano(rapido.plano, +a.dataset.i, equipHoje())) folhaPlano(); },
  pTirar(a){ rapido.plano.splice(+a.dataset.i, 1); folhaPlano(); },
  pAdicionar(){ folhaSeletor('plano'); },
  pOutro(){ if (planoPorRegras()) folhaPlano(); },
  comecar,
  selMus(a){ sel.mus = a.dataset.v; a.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === a)); listaSeletor(); },
  selEscolher(a){
    const ex = EXI[a.dataset.id];
    if (sel.destino === 'plano'){ rapido.plano.push(novoItem(ex)); folhaPlano(); return; }
    if (sel.destino === 'trocar'){ const it = novoItem(ex, ativo.itens[sel.i].series.length); preencherSugestoes([it]); ativo.itens[sel.i] = it; }
    else { const it = novoItem(ex); preencherSugestoes([it]); inserirNoTreino(it); }
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
  verEx(a){ const f = folhaAtual; voltarFolha = f === 'plano' ? folhaPlano : f === 'rapido' ? () => folhaRapido() : f.startsWith('treino:') ? () => folhaTreino(f.slice(7)) : null; folhaEx(a.dataset.id); },
  voltarFolha(){ const f = voltarFolha; voltarFolha = null; if (f) f(); },
  fav(a){ cfg.favs = alterna(cfg.favs, a.dataset.id); guardarCfg(true); folhaEx(a.dataset.id); if (vista === 'vExercicios') renderExercicios(); },
  addAoTreino(a){ const it = novoItem(EXI[a.dataset.id]); preencherSugestoes([it]); inserirNoTreino(it); guardarAtivo(true); fecharFolha(); irPara('vTreino'); toast('Adicionado ao treino.'); },
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
    sync.shas = {}; sync.erro = ''; for (const t of treinos) sync.sujos[chaveMes(t.inicio)] = Date.now(); if (pesos.length) sync.pesosSujo = Date.now();
    if (!treinos.length) cfg.ts = 0;  // dispositivo novo: o perfil guardado no repositório prevalece
    guardarSync(); await sincronizar(); renderPerfil(); toast(sync.erro ? sync.erro : 'Sincronização ligada.');
  },
  desligarGH(){ if (!confirm('Desligar a sincronização? Os dados ficam neste dispositivo.')) return; gh.token = ''; LS.set('gh', gh); sync.shas = {}; sync.sujos = {}; guardarSync(); renderPerfil(); },
  exportar, importar,
  musculo(a){
    const m = a.dataset.v, cm = calorMusculos(), ts = cm.prim[m], d = ts ? diasDesde(ts) : null;
    document.querySelectorAll('.corpo .musc').forEach(g => g.classList.toggle('sel', g.dataset.v === m));
    const quando = d === null ? 'ainda não treinado como músculo principal' : d === 0 ? 'treinado hoje' : d === 1 ? 'treinado ontem' : `treinado há ${d} dias`;
    $('#calorInfo').innerHTML = `<div class="linha entre"><span><b style="color:var(--texto)">${MUSC[m]}</b>: ${quando}.</span>${MUSC_ESCOLHA.includes(m) && !ativo ? `<button class="btn peq-btn" data-acao="treinarMusculo" data-v="${m}">Treinar</button>` : ''}</div>`;
    const r = a.getBoundingClientRect(); Faiscas.explosao(r.left + r.width / 2, r.top + r.height / 2, cm.niveis[m] >= 3 ? 10 : 4, true, null, .35);
  },
  treinarMusculo(a){ novoRapido('musculos'); rapido.musculos = [a.dataset.v]; folhaRapido(); },
  montar(){ novoRapido('livre'); folhaSeletor('multi'); },
  tipoDireto(a){ novoRapido(a.dataset.v); gerar(); },
  rAquec(){ rapido.aquec = !rapido.aquec; folhaRapido(true); }, rAlong(){ rapido.along = !rapido.along; folhaRapido(true); },
  pAquec(){ rapido.aquec = !rapido.aquec; folhaPlano(); }, pAlong(){ rapido.along = !rapido.along; folhaPlano(); },
  pAquecer(){ cfg.aquecer = cfg.aquecer !== true; guardarCfg(true); renderPerfil(); }, pAlongar(){ cfg.alongar = cfg.alongar !== true; guardarCfg(true); renderPerfil(); },
  feitoFase(a){
    const i = +a.dataset.i, it = ativo.itens[i], novo = !it.series.every(s => s.feito);
    it.series.forEach(s => { s.feito = novo; if (novo){ s.kg = 0; s.reps = parseInt(it.alvo) || 1; s.ts = Date.now(); } });
    if (novo){ Faiscas.de(a, 14); vibrar(20); }
    guardarAtivo(true); atualizarCard(i);
  },
  selCat(a){ sel.cat = a.dataset.v; a.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === a)); listaSeletor(); },
  selMarcar(a){
    const id = a.dataset.id, k = sel.escolhidos.indexOf(id);
    if (k >= 0) sel.escolhidos.splice(k, 1); else { sel.escolhidos.push(id); Faiscas.de(a.querySelector('.ordem'), 6); }
    document.querySelectorAll('#selLista [data-acao="selMarcar"]').forEach(el => { const n = sel.escolhidos.indexOf(el.dataset.id); el.classList.toggle('escolhido', n >= 0); el.querySelector('.ordem').textContent = n >= 0 ? n + 1 : ''; });
    const b = $('#selContinuar'), n = sel.escolhidos.length; b.textContent = n ? `Continuar com ${n} ${n === 1 ? 'exercício' : 'exercícios'}` : 'Escolhe exercícios';
  },
  selContinuar(){
    if (!sel.escolhidos.length) return toast('Escolhe pelo menos um exercício.');
    if (!rapido) novoRapido('livre');
    rapido.tipo = 'livre'; rapido.real = 'livre'; rapido.nome = 'Treino à medida'; rapido.nota = ''; rapido.modelo = null;
    rapido.plano = sel.escolhidos.map(id => EXI[id].c === 'alongamento' ? itemFase(EXI[id], '30 s', undefined, 2, 15) : novoItem(EXI[id]));
    folhaPlano();
  },
  guardarModelo(){
    const nome = (prompt('Nome do treino (ex.: Peito e costas):', rapido.nome) || '').trim(); if (!nome) return;
    const m = {id: uid(), nome: nome.slice(0, 40), tipo: rapido.real || rapido.tipo, itens: rapido.plano.map(it => ({id: it.id, n: it.series.length, alvo: it.alvo, desc: it.desc}))};
    cfg.modelos = [...(cfg.modelos || []), m]; guardarCfg(true); rapido.modelo = m.id; rapido.nome = m.nome; toast('Guardado em "Os teus treinos".'); folhaPlano();
  },
  apagarModelo(){ if (!confirm('Apagar este modelo de treino?')) return; cfg.modelos = cfg.modelos.filter(m => m.id !== rapido.modelo); guardarCfg(true); rapido.modelo = null; fecharFolha(); RENDER[vista](); },
  usarModelo(a){ const m = (cfg.modelos || []).find(x => x.id === a.dataset.id); if (m) planoDeModelo(m); },
  pesoPasso(a){ const i = $('#pesoValor'); i.value = (Math.round(((parseFloat(i.value) || 0) + +a.dataset.v) * 10) / 10).toFixed(1); },
  registarPeso(a){
    const kg = parseFloat(String($('#pesoValor').value).replace(',', '.')), d = $('#pesoData').value || hojeChave();
    if (!(kg > 20 && kg < 400)) return toast('Escreve um peso válido.');
    registarPeso(d, kg); renderPeso(); toast(`Registado: ${num(kg)} kg.`); Faiscas.de($('#vPeso .placa'), 16); vibrar(25);
  },
  guardarMeta(){ const v = parseFloat(String($('#pesoMeta').value).replace(',', '.')); cfg.meta = v > 20 && v < 400 ? v : 0; guardarCfg(true); renderPeso(); toast(cfg.meta ? 'Meta guardada.' : 'Meta removida.'); },
  pesoRange(a){ pesoRange = +a.dataset.v; renderPeso(); },
  apagarPeso(a){ if (!confirm('Apagar este registo?')) return; const d = a.dataset.v; pesos = pesos.filter(p => p.d !== d); pesosApag[d] = Date.now(); guardarPesos(); pesoSujo(); renderPeso(); },
  gerarIA(){ gerarIA(); },
  pedirFerreiro(){ const i = $('#pedidoFerreiro'); if (i) pedirAoFerreiro(i.value); },
  sugFerreiro(a){ const i = $('#pedidoFerreiro'); if (i) i.value = a.dataset.v; pedirAoFerreiro(a.dataset.v); },
  falar(a){ const alvo = $('#' + a.dataset.alvo); if (alvo) ouvir(a, alvo, a.dataset.depois ? () => ACOES[a.dataset.depois](a) : null); },
  irPerfil(){ irPara('vPerfil'); },
  adaptar(){ folhaAdaptar(); },
  semIA(){ cancelarIA(); if (planoPorRegras()) folhaPlano(); },
  sugAdaptar(a){ const t = $('#adaptarTxt'); t.value = (t.value.trim() ? t.value.trim() + '. ' : '') + a.dataset.v; a.classList.add('on'); },
  async enviarAdaptar(){
    const txt = ($('#adaptarTxt') || {}).value || ''; if (!txt.trim()) return toast('Diz ao ferreiro o que mudou.');
    folhaAforjar('A adaptar o treino');
    try { const nota = await adaptarTreino(txt.trim()); renderTreino();
      if (folhaAtual !== 'aforjar') return;
      abrirFolha(cab('Treino adaptado') + `<p style="margin:0 0 14px">${esc(nota || 'Feito.')}</p><button class="btn quente grande" data-acao="fecharFolha">Continuar</button>`, 'adaptado'); }
    catch(e){ if (folhaAtual === 'aforjar'){ fecharFolha(); toast(e.message, 4000); } }
  },
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
  rPedido(el){ rapido.pedido = el.value; },
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
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#folha').hidden) fecharFolha(); if (e.key === 'Enter' && e.target.id === 'pedidoFerreiro'){ e.preventDefault(); pedirAoFerreiro(e.target.value); } });

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
