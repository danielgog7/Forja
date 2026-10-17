'use strict';
/* Forja — mapa muscular em ferro forjado. Cada músculo é uma placa; o calor (0 a 5) vai do ferro frio ao branco incandescente.
   As formas do lado esquerdo são desenhadas uma vez e espelhadas para o lado direito. */
const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const CORPO_SILHUETA = 'M100 8C86 8 83 20 84 32C85 42 89 47 92 49L90 54C82 58 70 60 60 64C48 68 41 78 40 92C38 104 34 114 34 126C34 138 37 146 38 152C34 162 32 176 35 190C37 198 39 204 40 208C38 218 40 228 46 230C52 231 55 224 53 214L52 206C55 194 58 178 58 164C59 156 60 152 61 148C64 136 65 122 66 112C67 110 68 109 69 110C67 124 68 140 74 156C77 164 78 172 76 180C70 188 64 204 64 222C64 248 68 276 74 298C74 306 72 312 71 320C68 334 68 350 72 364C75 378 78 388 78 394C74 402 70 410 76 414C82 416 90 416 92 410L90 394C92 380 94 360 92 340C91 326 92 314 93 306C95 296 96 284 96 272C98 248 99 226 99 214L100 212Z';
const CORPO_FRENTE = [
  ['pescoco', 'M91 46C93 54 96 60 99 66L97 67C92 61 89 54 89 48Z'],
  ['trapezio', 'M90 52C84 58 72 61 62 65C70 70 84 70 95 64C94 59 92 55 90 52Z'],
  ['ombros', 'M60 66C50 68 42 78 41 92C41 100 43 106 46 110L51 108C48 104 46 98 46 90C48 78 54 70 62 67Z'],
  ['ombros', 'M62 67C54 70 48 78 46 90C46 98 48 104 51 108C55 98 60 90 65 84C69 78 72 74 74 71C70 68 66 67 62 67Z'],
  ['peito', 'M75 72C84 70 94 71 99 73V88C92 88 82 88 70 90C70 84 72 76 75 72Z'],
  ['peito', 'M70 92C82 90 92 90 99 90V108C94 115 84 117 76 113C69 109 64 102 62 96C64 94 67 93 70 92Z'],
  ['abs', 'M69 113L77 117L71 121Z'], ['abs', 'M70 123L77 127L71 131Z'], ['abs', 'M71 133L77 137L72 141Z'],
  ['abs', 'M78 118C81 122 84 126 85 130L86 166C84 172 82 177 80 181C78 172 77 160 77 148C77 136 77 126 78 118Z'],
  ['abs', rr(87, 115, 11, 13, 3.5)], ['abs', rr(87, 130, 11, 13, 3.5)], ['abs', rr(87, 145, 11, 13, 3.5)],
  ['abs', 'M88 160H98V188C94 184 90 176 88 160Z'],
  ['biceps', 'M45 112C40 122 39 134 41 144C43 150 47 151 50 148C51 136 51 124 50 112C48 108 46 109 45 112Z'],
  ['biceps', 'M52 110C52 122 52 136 51 148C55 152 59 150 61 144C63 134 63 120 61 112C58 106 54 106 52 110Z'],
  ['antebracos', 'M38 156C34 168 34 182 37 196C39 202 42 203 44 198C45 184 46 170 46 158C44 152 40 152 38 156Z'],
  ['antebracos', 'M48 156C49 170 48 186 46 200C49 204 52 203 54 198C56 186 58 172 58 162C56 154 51 152 48 156Z'],
  ['abdutores', 'M70 184C66 194 65 206 66 216C70 210 74 202 77 194C76 189 73 185 70 184Z'],
  ['quads', 'M67 218C64 238 66 262 70 280C72 290 76 296 79 298C80 280 80 258 78 236C76 224 72 214 67 218Z'],
  ['quads', 'M79 200C76 212 78 236 81 258C82 272 84 284 86 292C90 280 92 262 92 244C92 226 89 210 85 200C83 196 81 196 79 200Z'],
  ['quads', 'M91 258C95 266 97 278 95 290C92 297 88 298 87 295C90 286 92 272 91 258Z'],
  ['adutores', 'M89 202C95 208 98 216 99 224L97 254C94 244 92 230 91 220C90 212 89 206 89 202Z'],
  ['gemeos', 'M73 322C70 338 70 356 74 372C76 382 79 388 81 386C82 368 83 350 82 334C80 324 76 318 73 322Z'],
  ['gemeos', 'M85 324C90 334 92 350 90 366C89 374 88 380 86 384C86 362 86 342 85 324Z']
];
const CORPO_COSTAS_CENTRO = [['trapezio', 'M100 46C96 56 88 59 80 62C70 65 62 67 58 70C72 72 84 80 90 92C94 102 97 114 100 128C103 114 106 102 110 92C116 80 128 72 142 70C138 67 130 65 120 62C112 59 104 56 100 46Z']];
const CORPO_COSTAS = [
  ['triceps', 'M44 100C39 110 37 124 39 136C41 142 44 144 46 142C45 128 46 114 48 104C47 100 45 99 44 100Z'],
  ['triceps', 'M48 106C44 118 44 132 46 144C49 150 54 150 56 146C57 132 56 118 54 108C52 104 50 104 48 106Z'],
  ['triceps', 'M57 110C59 122 60 134 59 144C61 142 63 132 63 122C63 116 61 112 57 110Z'],
  ['ombros', 'M58 70C48 74 42 84 41 96C41 102 43 106 45 108C50 98 56 90 62 84C66 80 68 76 68 74C65 71 62 70 58 70Z'],
  ['costas', 'M70 78C80 78 87 84 89 94C90 102 89 108 87 113C80 112 73 106 69 98C67 90 66 82 70 78Z'],
  ['costas', 'M66 100C70 106 77 112 85 116L80 122C74 118 69 112 66 106Z'],
  ['dorsais', 'M68 110C66 124 68 140 74 152C80 162 88 170 95 174L97 152C96 140 94 128 90 120C84 118 76 114 68 110Z'],
  ['lombar', 'M92 140C95 152 96 166 95 180C95 186 97 189 99 190V134C96 135 93 137 92 140Z'],
  ['antebracos', 'M38 156C34 168 34 182 37 196C39 202 42 203 44 198C45 184 46 170 46 158C44 152 40 152 38 156Z'],
  ['antebracos', 'M48 156C49 170 48 186 46 200C49 204 52 203 54 198C56 186 58 172 58 162C56 154 51 152 48 156Z'],
  ['gluteos', 'M72 182C68 188 67 196 69 204C74 198 80 194 88 192C84 186 78 182 72 182Z'],
  ['gluteos', 'M69 206C70 220 76 230 86 234C92 236 97 234 99 232V196C94 192 86 192 80 196C74 198 70 202 69 206Z'],
  ['post', 'M68 238C65 258 67 278 72 294C75 300 79 302 82 300C82 282 82 262 80 244C77 241 72 239 68 238Z'],
  ['post', 'M82 241C86 239 92 239 95 241C97 256 96 274 93 290C90 298 86 300 84 298C85 280 85 260 82 241Z'],
  ['gemeos', 'M72 314C67 328 67 344 70 356C73 364 77 366 80 362C81 348 81 332 79 318C77 312 74 311 72 314Z'],
  ['gemeos', 'M81 316C86 312 91 316 92 326C93 340 91 354 87 364C85 368 82 366 82 362C83 348 83 332 81 316Z']
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
    <g fill="none" stroke="#5a3a26" stroke-width="3"><path d="${CORPO_SILHUETA}"/><path d="${CORPO_SILHUETA}" transform="translate(200 0) scale(-1 1)"/></g>
    <g fill="url(#cfBase)" stroke="#1a1411" stroke-width=".9"><path d="${CORPO_SILHUETA}"/><path d="${CORPO_SILHUETA}" transform="translate(200 0) scale(-1 1)"/></g>
    ${centro.map(([m, d]) => placa(m, d)).join('')}
    ${lista.map(([m, d]) => placa(m, d)).join('')}
    <g transform="translate(200 0) scale(-1 1)">${lista.map(([m, d]) => placa(m, d)).join('')}</g>
    <text x="100" y="434" text-anchor="middle" class="corpo-titulo">${titulo}</text></g>`;
  return `<svg class="corpo" viewBox="26 0 388 442" role="img" aria-label="Mapa muscular: frente e costas">
    <defs>
      ${CORPO_CORES.map(([a, b], i) => `<linearGradient id="cfN${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('')}
      <linearGradient id="cfBrilho" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="cfBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#211a16"/><stop offset="1" stop-color="#110d0b"/></linearGradient>
      <filter id="cfGlow" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    ${vista(CORPO_FRENTE, [], 0, 'FRENTE')}${vista(CORPO_COSTAS, CORPO_COSTAS_CENTRO, 220, 'COSTAS')}
  </svg>`;
}
