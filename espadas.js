'use strict';
/* Forja — a espada da semana.
   Cada semana (de segunda a domingo) forja-se uma espada. É sempre a mesma para essa semana em qualquer aparelho:
   o tipo, o material, a gema e o nome saem da data da segunda-feira. Tem 3 a 6 partes, montadas por ordem; os treinos
   da semana, face à meta de treinos por semana, decidem quantas já estão forjadas (com 7 treinos e 3 partes, cada parte
   pede mais de um treino; com 2 treinos e 5 partes, cada treino forja mais de uma).
   Desenho vertical (ponta para cima) numa caixa 60 × 250; na horizontal roda 90°. */
const ESP_YG = 168; // centro da guarda

// Meia-largura de cada lado da lâmina ao longo do comprimento (t = 0 na base, 1 na ponta).
const PERFIS = {
  reta: (t, w) => { const v = t < .86 ? w * (1 - .3 * t) : w * (1 - .3 * .86) * (1 - (t - .86) / .14); return [v, v]; },
  folha: (t, w) => { const f = x => w * (1 - .12 * x + .2 * Math.sin(Math.PI * x / .8)); const v = t < .8 ? f(t) : f(.8) * (1 - (t - .8) / .2); return [v, v]; },
  katana: (t, w) => { const g = w * (1 - .18 * t); return [t < .9 ? g * 1.1 : g * 1.1 * (1 - (t - .9) / .1), t < .96 ? g * .9 : g * .9 * (1 - (t - .96) / .04)]; },
  cimitarra: (t, w) => { const g = w * (1 + .75 * t * t); return [t < .86 ? g : g * (1 - (t - .86) / .14), t < .93 ? w * .55 : w * .55 * (1 - (t - .93) / .07)]; },
  fina: (t, w) => { const v = t < .95 ? w * (1 - .55 * t) : w * .45 * (1 - (t - .95) / .05); return [v, v]; },
  falcata: (t, w) => [t < .78 ? w * (.85 + .7 * t) : w * (.85 + .7 * .78) * (1 - (t - .78) / .22), t < .9 ? w * .5 : w * .5 * (1 - (t - .9) / .1)],
  jian: (t, w) => { const v = t < .9 ? w * (1 - .22 * t) : w * (1 - .22 * .9) * (1 - (t - .9) / .1); return [v, v]; },
  sabre: (t, w) => { const g = w * (1 - .12 * t); return [t < .9 ? g * 1.15 : g * 1.15 * (1 - (t - .9) / .1), t < .8 ? g * .85 : g * .85 * (1 - (t - .8) / .2)]; },
  larga: (t, w) => { const v = t < .88 ? w * (1 - .18 * t) : w * (1 - .18 * .88) * (1 - (t - .88) / .12); return [v, v]; }
};
// Tipos: forma da lâmina, guarda, punho e pomo, e as partes pela ordem em que se forjam.
const ESP_TIPOS = [
  {id: 'longa', nome: 'Espada longa', L: 140, w: 5.2, curva: 0, perfil: 'reta', gume: 2, canal: true, guarda: 'cruz', gw: 15, gl: 34, punho: 'couro', pomo: 'disco',
    partes: [['lamina', 'Lâmina'], ['guarda', 'Guarda'], ['punho', 'Punho'], ['pomo', 'Pomo']]},
  {id: 'gladio', nome: 'Gládio', L: 98, w: 6.4, curva: 0, perfil: 'folha', gume: 2, guarda: 'meiaLua', gw: 11, gl: 26, punho: 'aneis', pomo: 'bola',
    partes: [['lamina', 'Lâmina'], ['guarda', 'Guarda'], ['punho+pomo', 'Punho e pomo']]},
  {id: 'katana', nome: 'Katana', L: 146, w: 4.4, curva: 9, perfil: 'katana', gume: 1, hamon: true, guarda: 'disco', gw: 11, gl: 40, punho: 'tsuka', pomo: 'tampa',
    partes: [['lamina', 'Lâmina'], ['extra', 'Têmpera (hamon)'], ['guarda', 'Tsuba'], ['punho', 'Punho'], ['pomo', 'Kashira']]},
  {id: 'cimitarra', nome: 'Cimitarra', L: 128, w: 4.2, curva: 20, perfil: 'cimitarra', gume: 1, guarda: 'bolas', gw: 10, gl: 30, punho: 'fio', pomo: 'bico',
    partes: [['lamina', 'Lâmina'], ['guarda', 'Guarda'], ['punho+pomo', 'Punho e pomo']]},
  {id: 'montante', nome: 'Montante', L: 156, w: 6, curva: 0, perfil: 'reta', gume: 2, canal: true, ricasso: true, guarda: 'cruz', gw: 20, gl: 44, punho: 'couro', pomo: 'pera', gema: true,
    partes: [['lamina', 'Lâmina'], ['extra', 'Ricasso'], ['guarda', 'Guarda'], ['punho', 'Punho'], ['pomo', 'Pomo'], ['gema', 'Gema']]},
  {id: 'rapieira', nome: 'Rapieira', L: 152, w: 2.6, curva: 0, perfil: 'fina', gume: 2, guarda: 'cruzFina', gw: 13, gl: 30, punho: 'fio', pomo: 'pera', arco: true,
    partes: [['lamina', 'Lâmina'], ['guarda', 'Guarda'], ['extra', 'Arco da mão'], ['punho', 'Punho'], ['pomo', 'Pomo']]},
  {id: 'falcata', nome: 'Falcata', L: 112, w: 4.6, curva: -9, perfil: 'falcata', gume: 1, guarda: 'cruzCurta', gw: 8, gl: 28, punho: 'aneis', pomo: 'gancho',
    partes: [['lamina', 'Lâmina'], ['guarda', 'Guarda'], ['punho+pomo', 'Punho e pomo']]},
  {id: 'jian', nome: 'Jian', L: 142, w: 3.6, curva: 0, perfil: 'jian', gume: 2, canal: true, guarda: 'asas', gw: 12, gl: 32, punho: 'fio', pomo: 'anel', borla: true,
    partes: [['lamina', 'Lâmina'], ['guarda', 'Guarda'], ['punho', 'Punho'], ['pomo', 'Pomo'], ['extra', 'Borla']]},
  {id: 'sabre', nome: 'Sabre', L: 138, w: 3.8, curva: 13, perfil: 'sabre', gume: 1, guarda: 'cruzCurta', gw: 9, gl: 30, punho: 'tsuka', pomo: 'tampa', arco: true,
    partes: [['lamina', 'Lâmina'], ['guarda+extra', 'Guarda e arco'], ['punho', 'Punho'], ['pomo', 'Pomo']]},
  {id: 'viking', nome: 'Espada viking', L: 122, w: 6.2, curva: 0, perfil: 'larga', gume: 2, canal: true, canalParte: true, guarda: 'curva', gw: 12, gl: 26, punho: 'couro', pomo: 'lobos',
    partes: [['lamina', 'Lâmina'], ['extra', 'Canal'], ['guarda', 'Guarda'], ['punho', 'Punho'], ['pomo', 'Pomo']]},
  {id: 'claymore', nome: 'Claymore', L: 150, w: 5.4, curva: 0, perfil: 'reta', gume: 2, canal: true, guarda: 'claymore', gw: 18, gl: 40, punho: 'couro', pomo: 'disco',
    partes: [['lamina', 'Lâmina'], ['guarda', 'Guarda'], ['punho', 'Punho'], ['pomo', 'Pomo']]}
];
// Materiais (lâmina, metal da guarda e do pomo, punho) e raridade (0 comum a 3 lendária).
const ESP_MATERIAIS = [
  {id: 'ferro', nome: 'Ferro', r: 0, lam: ['#3e3a37', '#8e8781', '#cfc8c1'], met: ['#2e2926', '#6f655e', '#a59a91'], pun: ['#2a160c', '#5a3520', '#7a4a2c']},
  {id: 'aco', nome: 'Aço', r: 0, lam: ['#4b5660', '#a6b4bf', '#eef3f6'], met: ['#30363c', '#76828c', '#c4cdd4'], pun: ['#141012', '#2e2628', '#4a3e40']},
  {id: 'damasco', nome: 'Aço de Damasco', r: 1, lam: ['#3a3634', '#8a817a', '#d9d2ca'], met: ['#3a2a18', '#8a6a3a', '#c9a46a'], pun: ['#1a0e08', '#3a2214', '#5a3a24'], ondas: true},
  {id: 'bronze', nome: 'Bronze', r: 1, lam: ['#5a3412', '#b47a3a', '#f0c48a'], met: ['#4a2a0e', '#9a6a2a', '#d8a868'], pun: ['#3a0e0e', '#6a1c1a', '#8a2c26']},
  {id: 'prata', nome: 'Prata', r: 1, lam: ['#59626b', '#bcc5cd', '#f8fafb'], met: ['#4a525a', '#a8b2bb', '#eef2f5'], pun: ['#0e1a2e', '#1e3a5f', '#2e5a8a']},
  {id: 'ouro', nome: 'Ouro cerimonial', r: 2, lam: ['#4b5660', '#a6b4bf', '#eef3f6'], met: ['#6a4206', '#c8961e', '#ffe08a'], pun: ['#3a0610', '#7a1622', '#a82a36']},
  {id: 'obsidiana', nome: 'Obsidiana', r: 2, lam: ['#0e0c14', '#2e2a3a', '#7a6e96'], met: ['#3a3e46', '#8a929c', '#d0d6dc'], pun: ['#1a0e2a', '#3a1e5a', '#5a3a8a'], brilhoLam: '#9a7aff'},
  {id: 'jade', nome: 'Jade', r: 2, lam: ['#4b5660', '#a6b4bf', '#eef3f6'], met: ['#0e3a24', '#2e8a5a', '#8ad8a8'], pun: ['#0e1a14', '#1e3a2a', '#2e5a40']},
  {id: 'meteorito', nome: 'Ferro de meteorito', r: 3, lam: ['#1e1e24', '#5a5a66', '#a8a8b8'], met: ['#1a1a20', '#4a4a56', '#8a8a9a'], pun: ['#0a0a0e', '#1e1e26', '#34343e'], estrelas: true},
  {id: 'brasa', nome: 'Aço de brasa', r: 3, lam: ['#3a0e04', '#c2410f', '#ffc861'], met: ['#120c0a', '#3a2c26', '#6a5a50'], pun: ['#120806', '#2a1410', '#4a241a'], brasa: true}
];
const ESP_GEMAS = [['Rubi', '#e8203a'], ['Safira', '#2a6aff'], ['Esmeralda', '#1ec870'], ['Ametista', '#a04aff'], ['Âmbar', '#ffae1e'], ['Diamante', '#e8f6ff']];
const ESP_EPITETOS = ['Juramento', 'Aurora', 'Sentinela', 'Tempestade', 'Silêncio', 'Ventania', 'Fénix', 'Lobo', 'Corvo', 'Trovão', 'Maré', 'Vigília', 'Raiz', 'Cometa', 'Penhasco',
  'Brasa Eterna', 'Lua Velha', 'Primeira Luz', 'Ferro Fiel', 'Vento Norte', 'Cinza', 'Relâmpago', 'Promessa', 'Muralha', 'Coração de Pedra', 'Último Inverno', 'Estrela Caída', 'Chama Quieta'];
const RARIDADES = [['Comum', '#a89a8e'], ['Rara', '#6aa8ff'], ['Épica', '#c27aff'], ['Lendária', '#ffc861']];

function hashTxt(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngDe(seed){ let x = seed || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
// A espada de uma semana (chave = data da segunda-feira, "2026-10-12").
// Os tipos rodam em ciclos: em cada bloco de 11 semanas saem os 11, por uma ordem baralhada diferente, sem repetir duas semanas seguidas.
function ordemBloco(bloco){
  const R = rngDe(hashTxt('forja-bloco:' + bloco)), o = ESP_TIPOS.map((_, i) => i);
  for (let i = o.length - 1; i > 0; i--){ const j = Math.floor(R() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  return o;
}
function tipoDaSemana(chave){
  const n = ESP_TIPOS.length, W = Math.round(Date.parse(chave + 'T00:00:00Z') / (7 * 864e5)), bloco = Math.floor(W / n), pos = ((W % n) + n) % n;
  const o = ordemBloco(bloco);
  if (o[0] === ordemBloco(bloco - 1)[n - 1]) [o[0], o[1]] = [o[1], o[0]];
  return ESP_TIPOS[o[pos]];
}
function espadaDaSemana(chave){
  const R = rngDe(hashTxt('forja:' + chave)), tipo = tipoDaSemana(chave); R();
  const sorte = R(), r = sorte < .5 ? 0 : sorte < .8 ? 1 : sorte < .95 ? 2 : 3, mats = ESP_MATERIAIS.filter(m => m.r === r), mat = mats[Math.floor(R() * mats.length)];
  const gema = ESP_GEMAS[Math.floor(R() * ESP_GEMAS.length)], epiteto = ESP_EPITETOS[Math.floor(R() * ESP_EPITETOS.length)];
  const comGema = tipo.gema || R() < .35;
  return {chave, tipo, mat, gema, comGema, epiteto, raridade: r, nome: `${tipo.nome} de ${mat.nome}`};
}
// Quantas partes estão forjadas com estes treinos e esta meta, e quanto falta para a seguinte (0 a 1).
function progressoEspada(esp, treinos, meta){
  const n = esp.tipo.partes.length, p = Math.min(1, treinos / Math.max(1, meta)) * n, feitas = Math.floor(p + 1e-9);
  return {feitas: Math.min(n, feitas), frac: feitas >= n ? 0 : p - feitas, total: n, completa: feitas >= n};
}

/* ---------- Desenho ---------- */
const f1 = v => (Math.round(v * 10) / 10).toString();
function formasEspada(T){
  const gh = {cruz: 5, cruzFina: 3.4, cruzCurta: 4.4, meiaLua: 6, disco: 4, bolas: 4, asas: 5, curva: 5, claymore: 4}[T.guarda] || 5;
  const base = ESP_YG - gh / 2, N = 30, esq = [], dir = [], centro = [];
  const ini = T.ricasso ? .13 : 0;
  for (let k = 0; k <= N; k++){
    const t = k / N, cx = 30 + T.curva * t * t, cy = base - T.L * t, [a, b] = PERFIS[T.perfil](t, T.w);
    const dx = 2 * T.curva * t, dy = -T.L, nl = Math.hypot(dx, dy), nx = -dy / nl, ny = dx / nl; // normal (para a direita)
    centro.push([cx, cy]);
    if (t >= ini){ esq.push([cx - nx * a, cy - ny * a]); dir.push([cx + nx * b, cy + ny * b]); }
  }
  const pol = (A, B) => 'M' + A.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'L' + B.slice().reverse().map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
  const lamina = pol(esq, dir), linhaCentro = (t0, t1) => 'M' + centro.filter((p, k) => k / N >= t0 && k / N <= t1).map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
  const gume = T.gume === 1 ? 'M' + esq.map(p => f1(p[0] + .9) + ' ' + f1(p[1])).join('L') : 'M' + esq.map(p => f1(p[0] + .8) + ' ' + f1(p[1])).join('L') + 'M' + dir.map(p => f1(p[0] - .8) + ' ' + f1(p[1])).join('L');
  const hamon = 'M' + esq.slice(1, -3).map((p, k) => { const c = centro[k + 1 + Math.round(ini * N)] || p; return f1(p[0] + (c[0] - p[0]) * (.42 + .12 * Math.sin(k * 1.7))) + ' ' + f1(p[1]); }).join('L');
  // guarda
  const yg = ESP_YG, gw = T.gw; let guarda;
  switch (T.guarda){
    case 'cruz': guarda = [['path', `M${30 - gw} ${yg - 2.5}H${30 + gw}Q${30 + gw + 3} ${yg} ${30 + gw} ${yg + 2.5}H${30 - gw}Q${30 - gw - 3} ${yg} ${30 - gw} ${yg - 2.5}Z`]]; break;
    case 'cruzFina': guarda = [['path', `M${30 - gw} ${yg - 1.7}H${30 + gw}V${yg + 1.7}H${30 - gw}Z`], ['circle', 30 - gw, yg, 2.4], ['circle', 30 + gw, yg, 2.4]]; break;
    case 'cruzCurta': guarda = [['path', `M${30 - gw} ${yg - 2.2}H${30 + gw}Q${30 + gw + 2} ${yg + 1} ${30 + gw - 1} ${yg + 3}H${30 - gw + 1}Q${30 - gw - 2} ${yg + 1} ${30 - gw} ${yg - 2.2}Z`]]; break;
    case 'meiaLua': guarda = [['path', `M${30 - gw} ${yg - 2}Q${30} ${yg - 5} ${30 + gw} ${yg - 2}Q${30 + gw + 1} ${yg + 3} ${30} ${yg + 4}Q${30 - gw - 1} ${yg + 3} ${30 - gw} ${yg - 2}Z`]]; break;
    case 'disco': guarda = [['ellipse', 30, yg, gw, 4.2]]; break;
    case 'bolas': guarda = [['path', `M${30 - gw} ${yg + 1}Q${30} ${yg - 4} ${30 + gw} ${yg + 1}L${30 + gw} ${yg + 3}Q${30} ${yg - 1.5} ${30 - gw} ${yg + 3}Z`], ['circle', 30 - gw, yg + 2.4, 2.6], ['circle', 30 + gw, yg + 2.4, 2.6]]; break;
    case 'asas': guarda = [['path', `M${30 - gw} ${yg - 3}Q${30 - 5} ${yg - 1} ${30} ${yg - 4}Q${30 + 5} ${yg - 1} ${30 + gw} ${yg - 3}Q${30 + gw - 2} ${yg + 3} ${30} ${yg + 4.5}Q${30 - gw + 2} ${yg + 3} ${30 - gw} ${yg - 3}Z`]]; break;
    case 'curva': guarda = [['path', `M${30 - gw} ${yg - 4.5}Q${30} ${yg + 2} ${30 + gw} ${yg - 4.5}L${30 + gw} ${yg - 1.5}Q${30} ${yg + 5.5} ${30 - gw} ${yg - 1.5}Z`]]; break;
    case 'claymore': guarda = [['path', `M${30 - 3} ${yg + 2}L${30 - gw} ${yg - gw * .55}L${30 - gw + 2.6} ${yg - gw * .55 - 1.6}L${30} ${yg - 1.5}L${30 + gw - 2.6} ${yg - gw * .55 - 1.6}L${30 + gw} ${yg - gw * .55}L${30 + 3} ${yg + 2}Z`],
      ...[[-1, 0], [0, -1], [1, 0]].flatMap(([dx, dy]) => [['circle', 30 - gw + 1 + dx * 2.2, yg - gw * .55 - 1 + dy * 2.2, 1.7], ['circle', 30 + gw - 1 - dx * 2.2, yg - gw * .55 - 1 + dy * 2.2, 1.7]])]; break;
    default: guarda = [['path', `M${30 - gw} ${yg - 2}H${30 + gw}V${yg + 2}H${30 - gw}Z`]];
  }
  // punho e pomo
  const y1 = yg + gh / 2, y2 = y1 + T.gl, pw = T.punho === 'tsuka' ? 3.4 : 3;
  const punho = [['path', `M${30 - pw} ${y1}Q${30 - pw - .8} ${(y1 + y2) / 2} ${30 - pw} ${y2}H${30 + pw}Q${30 + pw + .8} ${(y1 + y2) / 2} ${30 + pw} ${y1}Z`]];
  let padrao = '';
  if (T.punho === 'couro') for (let y = y1 + 2; y < y2 - 1; y += 3.6) padrao += `M${30 - pw} ${f1(y + 1.6)}L${30 + pw} ${f1(y - 1)}`;
  if (T.punho === 'fio') for (let y = y1 + 1; y < y2; y += 1.6) padrao += `M${30 - pw} ${f1(y + .8)}L${30 + pw} ${f1(y - .4)}`;
  if (T.punho === 'tsuka') for (let y = y1 + 3; y < y2 - 2; y += 6) padrao += `M${30 - pw} ${y - 3}L${30 + pw} ${y}L${30 - pw} ${y + 3}M${30 + pw} ${y - 3}L${30 - pw} ${y}L${30 + pw} ${y + 3}`;
  if (T.punho === 'aneis') for (let y = y1 + 4; y < y2 - 2; y += 5) padrao += `M${30 - pw - .6} ${y}H${30 + pw + .6}`;
  let pomo, py;
  switch (T.pomo){
    case 'disco': py = y2 + 6; pomo = [['circle', 30, py, 6.2]]; break;
    case 'bola': py = y2 + 4.6; pomo = [['circle', 30, py, 4.8]]; break;
    case 'pera': py = y2 + 6.2; pomo = [['ellipse', 30, py, 4.6, 6.4]]; break;
    case 'tampa': py = y2 + 2.4; pomo = [['path', `M${30 - pw - .6} ${y2}H${30 + pw + .6}V${y2 + 3.2}Q${30} ${y2 + 6.4} ${30 - pw - .6} ${y2 + 3.2}Z`]]; break;
    case 'anel': py = y2 + 5.6; pomo = [['path', `M30 ${y2}A5.6 5.6 0 1 1 29.9 ${y2}ZM30 ${y2 + 2.6}A3 3 0 1 0 30.1 ${y2 + 2.6}Z`]]; break;
    case 'lobos': py = y2 + 3.6; pomo = [['path', `M${30 - 8} ${y2 + 1}Q${30 - 9} ${y2 + 6} ${30 - 5} ${y2 + 6}Q${30 - 3} ${y2 + 8.5} ${30} ${y2 + 7}Q${30 + 3} ${y2 + 8.5} ${30 + 5} ${y2 + 6}Q${30 + 9} ${y2 + 6} ${30 + 8} ${y2 + 1}Z`]]; break;
    case 'bico': py = y2 + 3; pomo = [['path', `M${30 - pw} ${y2}Q${30 - pw} ${y2 + 5} ${30 + pw + 5} ${y2 + 7}Q${30 + pw + 1} ${y2 + 3} ${30 + pw} ${y2}Z`]]; break;
    case 'gancho': py = y2 + 3; pomo = [['path', `M${30 - pw} ${y2}Q${30 - pw - 6} ${y2 + 2} ${30 - pw - 5} ${y2 + 7}Q${30 - pw - 2} ${y2 + 4} ${30 + pw} ${y2 + 3}V${y2}Z`]]; break;
    default: py = y2 + 4; pomo = [['circle', 30, py, 4.6]];
  }
  // partes extra
  const extra = [];
  if (T.ricasso) extra.push(['path', `M${30 - T.w * .78} ${base}L${30 - T.w * .78} ${f1(base - T.L * .13)}L${30 + T.w * .78} ${f1(base - T.L * .13)}L${30 + T.w * .78} ${base}Z`], ['path', `M${30 - T.w * .78} ${f1(base - T.L * .12)}l-3.4 -1.6l.4 3.2Z`], ['path', `M${30 + T.w * .78} ${f1(base - T.L * .12)}l3.4 -1.6l-.4 3.2Z`]);
  if (T.arco) extra.push(['path', `M${30 + gw - 1} ${yg}Q${30 + gw + 6} ${(yg + py) / 2} ${30 + pw + .6} ${py - 3}L${30 + pw + .6} ${py - 1.2}Q${30 + gw + 8.4} ${(yg + py) / 2} ${30 + gw + 1.2} ${yg}Z`]);
  if (T.borla) extra.push(['path', `M${30 + 1.5} ${py + 5}Q${30 + 7} ${py + 12} ${30 + 9} ${py + 20}L${30 + 7.4} ${py + 20.4}Q${30 + 5.4} ${py + 13} ${30 + .4} ${py + 6.4}Z`], ['path', `M${30 + 6} ${py + 19}L${30 + 13} ${py + 19}L${30 + 14} ${py + 34}Q${30 + 9.5} ${py + 37} ${30 + 5} ${py + 34}Z`]);
  return {lamina, gume, hamon, canal: T.canal ? linhaCentro(T.ricasso ? .16 : .04, .62) : '', guarda, punho, padrao, pomo, py, extra, base, yg, gw, y2};
}
const forma = ([tag, ...a], attrs) => tag === 'path' ? `<path d="${a[0]}" ${attrs}/>` : tag === 'circle' ? `<circle cx="${f1(a[0])}" cy="${f1(a[1])}" r="${a[2]}" ${attrs}/>` : `<ellipse cx="${f1(a[0])}" cy="${f1(a[1])}" rx="${a[2]}" ry="${a[3]}" ${attrs}/>`;
// Desenha a espada com as partes já forjadas; a parte seguinte aparece em brasa conforme o progresso e as restantes em sombra.
function desenharEspada(esp, prog, op = {}){
  const T = esp.tipo, M = esp.mat, F = formasEspada(T), id = 'e' + hashTxt(esp.chave + (op.sufixo || '')).toString(36);
  const ordem = T.partes.map(p => p[0]), estado = k => ordem.findIndex(x => x.split('+').includes(k)), feita = k => { const i = estado(k); return i >= 0 && i < prog.feitas; }, emCurso = k => !op.passada && estado(k) === prog.feitas && !prog.completa;
  const sombra = `fill="none" stroke="#5c4a3e" stroke-width=".9" stroke-dasharray="2.2 1.8" opacity=".75"`;
  const brasa = `fill="url(#${id}q)" fill-opacity="${f1(.15 + .55 * prog.frac)}" stroke="hsl(${20 + 22 * prog.frac},100%,${50 + 14 * prog.frac}%)" stroke-width="1.1" filter="url(#${id}g)"`;
  const parte = (k, formas, cheio) => formas.map(f => forma(f, feita(k) ? cheio : emCurso(k) ? brasa : sombra)).join('');
  const lam = feita('lamina'), gemaTam = 2.3;
  let s = `<defs>
    <linearGradient id="${id}l" x1="0" x2="1"><stop offset="0" stop-color="${M.lam[0]}"/><stop offset=".38" stop-color="${M.lam[2]}"/><stop offset=".55" stop-color="${M.lam[1]}"/><stop offset=".72" stop-color="${M.lam[2]}"/><stop offset="1" stop-color="${M.lam[0]}"/></linearGradient>
    <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M.met[2]}"/><stop offset=".5" stop-color="${M.met[1]}"/><stop offset="1" stop-color="${M.met[0]}"/></linearGradient>
    <linearGradient id="${id}p" x1="0" x2="1"><stop offset="0" stop-color="${M.pun[0]}"/><stop offset=".5" stop-color="${M.pun[2]}"/><stop offset="1" stop-color="${M.pun[0]}"/></linearGradient>
    <linearGradient id="${id}q" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset=".5" stop-color="#ff7a1c"/><stop offset="1" stop-color="#8a2208"/></linearGradient>
    <filter id="${id}g" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="${id}a" x="-150%" y="-20%" width="400%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
    <clipPath id="${id}c"><path d="${F.lamina}"/></clipPath></defs>`;
  if (prog.completa) s += `<path d="${F.lamina}" fill="${RARIDADES[esp.raridade][1]}" opacity=".35" filter="url(#${id}a)"/>`;
  // lâmina
  if (lam){
    s += `<path d="${F.lamina}" fill="url(#${id}l)" stroke="${M.lam[0]}" stroke-width=".5"/>`;
    s += `<g clip-path="url(#${id}c)">`;
    if (M.ondas) for (let y = 10; y < F.base; y += 4.5) s += `<path d="M10 ${y}q5 -2 10 0t10 0t10 0t10 0t10 0" fill="none" stroke="${M.lam[0]}" stroke-width=".6" opacity=".45"/>`;
    if (M.estrelas){ const R = rngDe(hashTxt(esp.chave + 's')); for (let k = 0; k < 26; k++) s += `<circle cx="${f1(24 + R() * 12 + T.curva * .4)}" cy="${f1(F.base - R() * T.L)}" r="${f1(.25 + R() * .5)}" fill="#e8e8ff" opacity="${f1(.4 + R() * .6)}"/>`; }
    if (M.brasa){ s += `<path d="${F.lamina}" fill="#ff7a1c" opacity=".25"/>`; const R = rngDe(hashTxt(esp.chave + 'b')); for (let k = 0; k < 7; k++){ const y = F.base - 8 - R() * (T.L - 20); s += `<path d="M${f1(27 + R() * 6)} ${f1(y)}l${f1(R() * 3 - 1.5)} -4l${f1(R() * 3 - 1.5)} -3" fill="none" stroke="#ffd27a" stroke-width=".5" opacity=".9"/>`; } }
    if (M.brilhoLam) s += `<path d="${F.gume}" fill="none" stroke="${M.brilhoLam}" stroke-width=".7" opacity=".7"/>`;
    s += `</g><path d="${F.gume}" fill="none" stroke="#fff" stroke-width=".5" opacity=".55"/>`;
    if (F.canal && !T.canalParte) s += `<path d="${F.canal}" fill="none" stroke="${M.lam[0]}" stroke-width="${f1(T.w * .55)}" stroke-linecap="round" opacity=".55"/><path d="${F.canal}" fill="none" stroke="${M.lam[2]}" stroke-width=".4" opacity=".6"/>`;
  } else s += `<path d="${F.lamina}" ${emCurso('lamina') ? brasa : sombra}/>`;
  // partes extra (têmpera, ricasso, canal, arco, borla)
  if (T.hamon) s += feita('extra') ? `<path d="${F.hamon}" fill="none" stroke="#f4f8ff" stroke-width=".9" opacity=".8"/>` : lam ? `<path d="${F.hamon}" fill="none" ${emCurso('extra') ? `stroke="#ffb347" stroke-width="1" filter="url(#${id}g)" opacity="${f1(.3 + .7 * prog.frac)}"` : 'stroke="#5c4a3e" stroke-width=".7" stroke-dasharray="2 2"'}/>` : '';
  if (T.canalParte && F.canal) s += feita('extra') ? `<path d="${F.canal}" fill="none" stroke="${M.lam[0]}" stroke-width="${f1(T.w * .6)}" stroke-linecap="round" opacity=".6"/><path d="${F.canal}" fill="none" stroke="${M.lam[2]}" stroke-width=".4" opacity=".6"/>`
    : lam ? `<path d="${F.canal}" fill="none" ${emCurso('extra') ? `stroke="#ffb347" stroke-width="1.4" filter="url(#${id}g)" opacity="${f1(.3 + .7 * prog.frac)}"` : 'stroke="#5c4a3e" stroke-width=".8" stroke-dasharray="2 2"'}/>` : '';
  if (F.extra.length && !T.hamon && !T.canalParte) s += parte(T.partes.some(p => p[0] === 'guarda+extra') ? 'guarda' : 'extra', F.extra, `fill="url(#${id}m)" stroke="${M.met[0]}" stroke-width=".4"`);
  // guarda, punho e pomo
  s += parte('guarda', F.guarda, `fill="url(#${id}m)" stroke="${M.met[0]}" stroke-width=".5"`);
  s += parte('punho', F.punho, `fill="url(#${id}p)" stroke="${M.pun[0]}" stroke-width=".5"`);
  if (feita('punho') && F.padrao) s += `<path d="${F.padrao}" fill="none" stroke="${T.punho === 'tsuka' ? M.met[2] : M.pun[0]}" stroke-width="${T.punho === 'tsuka' ? .7 : .55}" opacity="${T.punho === 'tsuka' ? .7 : .8}"/>`;
  s += parte('pomo', F.pomo, `fill="url(#${id}m)" stroke="${M.met[0]}" stroke-width=".5"`);
  // gema (no pomo ou no centro da guarda)
  if (T.gema){ // o montante tem a gema como parte própria, no pomo
    s += feita('gema') ? `<circle cx="30" cy="${f1(F.py)}" r="${gemaTam}" fill="${esp.gema[1]}" stroke="#1a1010" stroke-width=".4"/><circle cx="29.3" cy="${f1(F.py - .7)}" r=".7" fill="#fff" opacity=".85"/>`
      : `<circle cx="30" cy="${f1(F.py)}" r="${gemaTam}" ${emCurso('gema') ? brasa : sombra}/>`;
  } else if (esp.comGema && feita('guarda') && !['disco', 'asas', 'cruzFina'].includes(T.guarda))
    s += `<circle cx="30" cy="${F.yg}" r="1.9" fill="${esp.gema[1]}" stroke="#1a1010" stroke-width=".4"/><circle cx="29.4" cy="${F.yg - .6}" r=".55" fill="#fff" opacity=".85"/>`;
  // Caixa à medida desta espada (da ponta ao fim do pomo, e da largura da guarda), para que todas ocupem o espaço por igual.
  const topo = F.base - T.L - 3, fundo = F.py + (T.borla ? 38 : 9), meio = Math.max(T.gw + 5, T.w * 2 + Math.abs(T.curva) + 4, T.arco ? T.gw + 11 : 0), x0 = 30 - meio + Math.min(0, T.curva), x1 = 30 + meio + Math.max(0, T.curva);
  const vb = op.horizontal ? `${f1(250 - fundo)} ${f1(x0)} ${f1(fundo - topo)} ${f1(x1 - x0)}` : `${f1(x0)} ${f1(topo)} ${f1(x1 - x0)} ${f1(fundo - topo)}`;
  const corpo = op.horizontal ? `<g transform="translate(250 0) rotate(90)">${s}</g>` : s;
  return `<svg class="espada${prog.completa ? ' completa' : ''}" viewBox="${vb}" role="img" aria-label="${esp.nome}: ${prog.feitas} de ${prog.total} partes forjadas">${corpo}</svg>`;
}
