'use strict';
/* Forja — mapa muscular em ferro forjado. Cada músculo é uma placa; o calor (0 a 5) vai do ferro frio ao branco incandescente.
   As formas do lado esquerdo são desenhadas uma vez e espelhadas para o lado direito. */
const CORPO_SILHUETA = 'M100 6C84 6 80 20 82 34C83 44 88 50 91 52L90 60C80 64 66 64 58 70C48 76 46 92 48 104C46 120 46 132 48 144C46 152 42 160 42 168C40 184 40 198 44 206C42 216 44 228 50 230C56 230 58 220 56 210C58 196 62 180 62 166C64 152 66 136 68 122C70 112 72 106 74 108C74 130 72 150 76 172C70 184 68 196 70 210C66 240 68 270 74 296C74 306 72 312 72 320C68 340 70 366 76 384C76 392 74 398 70 404C66 410 70 414 84 414C90 414 92 410 90 404C88 394 88 386 88 380C92 360 92 336 90 318C92 306 94 300 94 292C96 268 98 240 99 214L100 212Z';
const CORPO_FRENTE = [
  ['pescoco', 'M90 46C92 54 96 60 99 64L97 66C92 60 88 54 88 48Z'],
  ['trapezio', 'M91 54C86 60 76 63 66 66C74 70 86 70 96 64C96 60 94 56 91 54Z'],
  ['peito', 'M79 72C88 70 96 72 99 74L99 106C94 112 84 114 76 110C70 106 66 100 64 96C66 88 72 78 79 72Z'],
  ['ombros', 'M66 68C56 70 50 80 49 94C49 102 50 108 52 112C56 104 62 96 66 90C70 82 74 76 78 72C74 69 70 68 66 68Z'],
  ['biceps', 'M53 114C50 124 50 136 52 146C55 152 60 152 63 146C66 136 67 124 66 114C64 106 60 102 58 104C55 106 54 110 53 114Z'],
  ['antebracos', 'M50 156C46 168 44 184 45 198C47 204 52 204 55 198C58 186 61 172 62 160C60 154 54 152 50 156Z'],
  ['abs', 'M75 112C80 116 84 118 85 122L86 164C84 172 82 178 80 182C76 176 74 162 74 148C74 134 74 122 75 112Z'],
  ['abs', 'M87 114H98V129H87Z'], ['abs', 'M87 131H98V146H87Z'], ['abs', 'M87 148H98V163H87Z'], ['abs', 'M88 165H98V190C94 186 90 178 88 165Z'],
  ['abdutores', 'M72 186C70 194 69 204 70 214C74 208 78 200 80 192C78 188 75 186 72 186Z'],
  ['quads', 'M74 206C70 224 70 248 72 268C74 284 78 294 84 298C88 288 92 270 93 250C94 232 92 216 86 202C82 198 77 200 74 206Z'],
  ['quads', 'M88 262C93 268 95 280 93 292C90 296 86 297 85 294C88 286 89 274 88 262Z'],
  ['adutores', 'M90 204C95 208 98 214 99 220L98 252C95 244 93 232 92 220C91 214 90 208 90 204Z'],
  ['gemeos', 'M75 322C72 338 72 356 75 372C77 380 80 384 82 382C84 366 85 346 84 330C82 322 78 318 75 322Z'],
  ['gemeos', 'M86 326C90 334 91 350 89 366C88 374 87 378 86 380C86 360 86 342 86 326Z']
];
const CORPO_COSTAS_CENTRO = [['trapezio', 'M100 46C96 56 88 60 80 63C72 66 66 68 62 70C74 72 84 78 90 90C94 100 97 112 100 124C103 112 106 100 110 90C116 78 126 72 138 70C134 68 128 66 120 63C112 60 104 56 100 46Z']];
const CORPO_COSTAS = [
  ['triceps', 'M52 92C48 104 48 118 50 132C53 142 58 146 63 142C66 130 67 116 66 104C64 96 60 90 56 88C54 88 53 90 52 92Z'],
  ['ombros', 'M66 68C56 70 50 80 49 94C49 100 50 104 51 106C56 98 62 90 68 84C72 78 74 74 74 72C72 69 70 68 66 68Z'],
  ['costas', 'M74 78C82 78 88 84 90 94C91 102 90 108 88 114C82 112 76 106 72 98C70 90 70 82 74 78Z'],
  ['dorsais', 'M72 102C70 116 72 132 78 146C84 158 90 166 95 170L97 150C96 138 94 126 90 116C84 112 78 106 72 102Z'],
  ['lombar', 'M93 146C95 156 96 168 95 182C95 186 97 188 99 188V138C96 140 94 142 93 146Z'],
  ['antebracos', 'M50 156C46 168 44 184 45 198C47 204 52 204 55 198C58 186 61 172 62 160C60 154 54 152 50 156Z'],
  ['gluteos', 'M72 186C70 198 72 212 78 222C84 230 92 232 99 228V196C94 188 84 184 72 186Z'],
  ['post', 'M74 230C71 250 71 272 75 290C78 298 82 300 86 298C90 284 93 266 93 248C93 240 92 236 90 234C84 236 78 234 74 230Z'],
  ['post', 'M92 238C96 246 98 258 97 272L94 288C94 272 94 254 92 238Z'],
  ['gemeos', 'M74 314C69 328 69 344 73 356C76 364 80 366 84 362C88 352 90 338 89 326C88 316 84 310 80 310C77 310 75 311 74 314Z'],
  ['gemeos', 'M86 330C90 340 91 352 89 364C88 370 87 374 86 376C86 362 87 346 86 330Z']
];
const CORPO_CORES = [
  ['#5c5550', '#2c2623'], ['#7a4636', '#2e1c16'], ['#b8461a', '#4e170a'], ['#f2701f', '#7e1e07'], ['#ffbe55', '#dc4c12'], ['#fff8e6', '#ffb347']
];
function corpoSVG(niveis){
  const n = m => niveis[m] || 0;
  const placa = (m, d) => {
    const k = n(m);
    return `<g class="musc" data-acao="musculo" data-v="${m}">
      <path d="${d}" fill="url(#cfN0)" stroke="#0a0705" stroke-width="1.3" stroke-linejoin="round"/>
      ${k ? `<path d="${d}" fill="url(#cfN${k})" class="aquece" style="animation-delay:${(Math.random() * .5).toFixed(2)}s"/>` : ''}
      <path d="${d}" fill="url(#cfBrilho)"/></g>`;
  };
  const brilhos = lista => lista.filter(([m]) => n(m) >= 3).map(([m, d]) => `<path d="${d}" fill="${n(m) >= 5 ? '#ffd27a' : '#ff7a1c'}" opacity="${.35 + .15 * (n(m) - 3)}" class="brasa-musc"/>`).join('');
  const vista = (lista, centro, dx, titulo) => `<g transform="translate(${dx} 0)">
    <g filter="url(#cfGlow)">${brilhos(lista)}<g transform="translate(200 0) scale(-1 1)">${brilhos(lista)}</g>${brilhos(centro)}</g>
    <g fill="none" stroke="#5a3a26" stroke-width="2.4"><path d="${CORPO_SILHUETA}"/><path d="${CORPO_SILHUETA}" transform="translate(200 0) scale(-1 1)"/></g>
    <g fill="url(#cfBase)"><path d="${CORPO_SILHUETA}"/><path d="${CORPO_SILHUETA}" transform="translate(200 0) scale(-1 1)"/></g>
    ${centro.map(([m, d]) => placa(m, d)).join('')}
    ${lista.map(([m, d]) => placa(m, d)).join('')}
    <g transform="translate(200 0) scale(-1 1)">${lista.map(([m, d]) => placa(m, d)).join('')}</g>
    <text x="100" y="434" text-anchor="middle" class="corpo-titulo">${titulo}</text></g>`;
  return `<svg class="corpo" viewBox="28 0 384 442" role="img" aria-label="Mapa muscular: frente e costas">
    <defs>
      ${CORPO_CORES.map(([a, b], i) => `<linearGradient id="cfN${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('')}
      <linearGradient id="cfBrilho" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="cfBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#211a16"/><stop offset="1" stop-color="#110d0b"/></linearGradient>
      <filter id="cfGlow" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    ${vista(CORPO_FRENTE, [], 0, 'FRENTE')}${vista(CORPO_COSTAS, CORPO_COSTAS_CENTRO, 220, 'COSTAS')}
  </svg>`;
}
