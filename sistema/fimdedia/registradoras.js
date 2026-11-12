/* ══════════════════════════════════════════════════════════════════════════
   QUATRO REGISTRADORAS EM LINE-ART — o estilo da referência que ela mandou
   (IMG_6947), com um CHECK no lugar do carrinho.

   O estilo não foi estimado, foi MEDIDO na imagem dela:
     traço ............ #373739   (grafite, espessura uniforme)
     preenchimento .... #F8F6F9   (quase branco, não branco puro)
     sombra do chão ... #EDEBEC
     pontilhado ....... #A6A6A8
     espessura ........ 6px numa imagem de 1190 de largura → ~1% do objeto,
                        que nos viewBox daqui (300) dá 3,2
     cantos ........... bem arredondados, linejoin e linecap redondos
     assinatura ....... contorno duplo (carcaça + tela), pés, elipse no chão
                        e o pontilhado solto do lado

   ⚠️ QUATRO CONSTRUÇÕES, não quatro pinturas — foi o que ela cortou da última
      vez. Mesmo estilo de traço, máquinas diferentes:
        1 · CLÁSSICA  monitor grande, bobina à esquerda, gaveta larga
        2 · TERMINAL  sem monitor, painel inclinado e cupom comprido na frente
        3 · TORRE     vertical, display em pé, teclado em duas colunas
        4 · ABERTA    a gaveta aberta, com as divisórias do dinheiro à mostra

   ⚠️ O CHECK FICA NA TELA GRANDE e o número de clientes numa tela menor —
      como registradora de verdade, que tem o visor do cliente e o do
      operador. Cada arte diz onde fica o seu (`visor:{x,y}`).
   ══════════════════════════════════════════════════════════════════════════ */

const LA_T = '#373739', LA_FI = '#F8F6F9', LA_SO = '#EDEBEC', LA_PO = '#A6A6A8';
const LA_W = 3.2;

/* o pontilhado solto: a assinatura do estilo, sempre do lado esquerdo */
function _pontos(n, cx, cy, r){
  /* ⚠️ o ponto tem que CABER no viewBox: com o arco começando em -0.72π e
     raio grande, o primeiro caía em x negativo e aparecia cortado na borda */
  return Array.from({length:n}, (_,i) => {
    const a = (-0.62 + i*0.135) * Math.PI;
    return `<circle cx="${(cx + Math.cos(a)*r).toFixed(1)}"
      cy="${(cy + Math.sin(a)*r).toFixed(1)}" r="${(2.6 + (i%3)*1.1).toFixed(1)}"
      fill="${LA_PO}" stroke="none"/>`;
  }).join('');
}
const _check = (x, y, s) =>
  `<path d="M${x} ${y} l${s*0.3} ${s*0.3} l${s*0.62} -${s*0.66}" stroke="${LA_T}"
    stroke-width="${LA_W*1.5}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const _svg = (largura, vb, id, miolo) => `
  <svg class="cxreg" viewBox="0 0 ${vb[0]} ${vb[1]}" width="${largura}"
       height="${Math.round(largura*vb[1]/vb[0])}" fill="none" data-reg="${id}"
       xmlns="http://www.w3.org/2000/svg">
    <g stroke="${LA_T}" stroke-width="${LA_W}" stroke-linejoin="round" stroke-linecap="round">
      ${miolo}
    </g>
  </svg>`;

/* ── 1 · CLÁSSICA ─────────────────────────────────────────────────────────
   A da referência: monitor grande de frente, display do cliente ao lado,
   bobina saindo à esquerda e gaveta larga com puxador redondo. */
function regClassica(largura, vazio, semCheck){
  const vb = [300, 236];
  const teclas = [0,1].map(j => [0,1,2,3].map(i =>
    `<rect x="${152+i*26}" y="${120+j*19}" width="19" height="10" rx="5" fill="${LA_FI}"/>`
  ).join('')).join('');
  return {vb, visor: {x:250, y:77}, svg: _svg(largura, vb, 'classica', `
    <ellipse cx="152" cy="216" rx="96" ry="8" fill="${LA_SO}" stroke="none"/>
    ${_pontos(9, 84, 118, 72)}

    <!-- monitor -->
    <rect x="104" y="16" width="116" height="88" rx="13" fill="${LA_FI}"/>
    <rect x="114" y="26" width="96" height="68" rx="8" fill="#fff"/>
    ${semCheck ? "" : _check(142, 58, 32)}
    <path d="M150 104h24v12h-24z" fill="${LA_FI}"/>

    <!-- display do cliente, apoiado no braço -->
    <rect x="216" y="58" width="68" height="36" rx="9" fill="${LA_FI}"/>
    <rect x="225" y="67" width="50" height="19" rx="4" fill="#fff"/>
    <path d="M245 94v14h10V94" fill="${LA_FI}"/>

    <!-- corpo: topo em trapézio -->
    <path d="M62 110h176a14 14 0 0 1 13 9l13 33a9 9 0 0 1-8 12H46a9 9 0 0 1-8-12l13-33a14 14 0 0 1 13-9z"
          fill="${LA_FI}"/>
    <path d="M118 110l-10 54"/>
    ${teclas}

    <!-- a bobina e o cupom -->
    <rect x="62" y="122" width="44" height="12" rx="4" fill="#fff"/>
    <path d="M64 70h40v52H64z" fill="#fff"/>
    <path d="M64 70l5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5"/>
    <path d="M72 88h24M72 98h18M72 108h22" stroke-width="2.4" opacity=".75"/>

    <!-- gaveta -->
    <rect x="34" y="162" width="236" height="46" rx="12" fill="${LA_FI}"/>
    <rect x="48" y="172" width="208" height="26" rx="8" fill="#fff"/>
    <circle cx="152" cy="185" r="8" fill="${LA_FI}"/>
    <path d="M152 181v8" stroke-width="2.6"/>
    <rect x="56" y="208" width="26" height="9" rx="3" fill="${LA_FI}"/>
    <rect x="222" y="208" width="26" height="9" rx="3" fill="${LA_FI}"/>`)};
}

/* ── 2 · TERMINAL ─────────────────────────────────────────────────────────
   Sem monitor: um bloco baixo com o painel inclinado, como as maquininhas de
   balcão. O cupom é o elemento longo — sai pela frente e dobra. */
function regTerminal(largura, vazio, semCheck){
  const vb = [300, 222];
  const teclas = [0,1,2].map(j => [0,1,2].map(i =>
    `<rect x="${176+i*28}" y="${114+j*19}" width="21" height="11" rx="5.5" fill="${LA_FI}"/>`
  ).join('')).join('');
  return {vb, visor: {x:236, y:57}, svg: _svg(largura, vb, 'terminal', `
    <ellipse cx="150" cy="206" rx="104" ry="7" fill="${LA_SO}" stroke="none"/>
    ${_pontos(9, 76, 106, 68)}

    <!-- painel inclinado -->
    <path d="M78 26h150a16 16 0 0 1 15 11l14 43H49l14-43a16 16 0 0 1 15-11z" fill="${LA_FI}"/>
    <!-- tela grande do operador, com o check -->
    <rect x="76" y="38" width="108" height="34" rx="7" fill="#fff"/>
    ${semCheck ? "" : _check(114, 52, 26)}
    <!-- tela pequena do cliente, ao lado -->
    <rect x="200" y="40" width="72" height="34" rx="8" fill="${LA_FI}"/>
    <rect x="208" y="48" width="56" height="18" rx="4" fill="#fff"/>

    <!-- corpo baixo -->
    <path d="M44 80h212a16 16 0 0 1 16 16v54a16 16 0 0 1-16 16H44a16 16 0 0 1-16-16V96a16 16 0 0 1 16-16z"
          fill="${LA_FI}"/>
    <path d="M152 80v86"/>
    ${teclas}

    <!-- ⚠️ O CUPOM É DESENHADO POR CIMA DO CORPO, não por baixo. Atrás dele o
         corpo comia 38 dos 80px de papel e sobrava um pezinho no chão. Agora
         ele desce pela frente da máquina e sai embaixo, inteiro. -->
    <rect x="58" y="112" width="80" height="12" rx="5" fill="#fff"/>
    <path d="M62 120h72v76a10 10 0 0 1-10 10H72a10 10 0 0 1-10-10z" fill="#fff"/>
    <path d="M62 206l6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6"/>
    <path d="M74 140h48M74 156h34M74 172h44" stroke-width="2.4" opacity=".75"/>
    <!-- pés -->
    <rect x="48" y="166" width="28" height="10" rx="3.5" fill="${LA_FI}"/>
    <rect x="224" y="166" width="28" height="10" rx="3.5" fill="${LA_FI}"/>`)};
}

/* ── 3 · TORRE ────────────────────────────────────────────────────────────
   A única vertical: corpo estreito e alto, display em pé no topo, teclado em
   duas colunas e a gaveta saindo embaixo. */
function regTorre(largura, vazio, semCheck){
  const vb = [240, 290];
  const teclas = [0,1,2].map(j => [0,1].map(i =>
    `<rect x="${78+i*44}" y="${150+j*24}" width="34" height="14" rx="7" fill="${LA_FI}"/>`
  ).join('')).join('');
  return {vb, visor: {x:120, y:234}, svg: _svg(largura, vb, 'torre', `
    <ellipse cx="120" cy="280" rx="82" ry="7" fill="${LA_SO}" stroke="none"/>
    ${_pontos(8, 66, 148, 56)}

    <!-- a bobina sai por cima -->
    <path d="M100 12h40v34h-40z" fill="#fff"/>
    <path d="M100 12l5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5"/>
    <path d="M108 28h24M108 38h17" stroke-width="2.4" opacity=".75"/>
    <!-- cabeça com a tela do check -->
    <rect x="56" y="40" width="128" height="86" rx="14" fill="${LA_FI}"/>
    <rect x="68" y="52" width="104" height="62" rx="8" fill="#fff"/>
    ${semCheck ? "" : _check(100, 80, 30)}
    <!-- pescoço -->
    <path d="M100 126h40v14h-40z" fill="${LA_FI}"/>
    <!-- corpo estreito com o teclado em duas colunas -->
    <rect x="58" y="138" width="124" height="88" rx="14" fill="${LA_FI}"/>
    ${teclas}
    <!-- o visor do operador, na base do corpo -->
    <rect x="74" y="222" width="92" height="26" rx="6" fill="#fff"/>
    <!-- gaveta saindo na base -->
    <rect x="44" y="246" width="152" height="30" rx="10" fill="${LA_FI}"/>
    <circle cx="120" cy="261" r="7.5" fill="#fff"/>
    <path d="M120 257v8" stroke-width="2.6"/>`)};
}

/* ── 4 · ABERTA ───────────────────────────────────────────────────────────
   A gaveta aberta, com as divisórias do dinheiro à mostra — a única que
   mostra o dentro da máquina, que é o que "fechar o caixa" significa. */
function regAberta(largura, vazio, semCheck){
  const vb = [320, 254];
  const teclas = [0,1].map(j => [0,1,2,3].map(i =>
    `<rect x="${166+i*25}" y="${112+j*18}" width="18" height="10" rx="5" fill="${LA_FI}"/>`
  ).join('')).join('');
  /* ⚠️ AS DIVISÓRIAS MORAM DENTRO DO TRAPÉZIO. Na primeira volta as casas de
     moeda caíram fora do fundo da gaveta e ficaram penduradas embaixo dela. */
  const notas  = [0,1,2,3].map(i =>
    `<rect x="${80+i*44}" y="159" width="36" height="22" rx="3" fill="${LA_FI}"/>`).join('');
  const moedas = [0,1,2].map(i =>
    `<circle cx="${110+i*50}" cy="196" r="10" fill="${LA_FI}"/>`).join('');
  return {vb, visor: {x:262, y:69}, svg: _svg(largura, vb, 'aberta', `
    <ellipse cx="160" cy="246" rx="120" ry="7" fill="${LA_SO}" stroke="none"/>
    ${_pontos(9, 72, 98, 62)}

    <!-- monitor com o check -->
    <rect x="112" y="12" width="110" height="82" rx="13" fill="${LA_FI}"/>
    <rect x="122" y="22" width="90" height="62" rx="8" fill="#fff"/>
    ${semCheck ? "" : _check(148, 50, 30)}
    <path d="M156 94h22v10h-22z" fill="${LA_FI}"/>

    <!-- display do cliente -->
    <rect x="230" y="50" width="64" height="36" rx="8" fill="${LA_FI}"/>
    <rect x="238" y="58" width="48" height="20" rx="4" fill="#fff"/>
    <path d="M256 86v12h12V86" fill="${LA_FI}"/>

    <!-- corpo -->
    <path d="M74 102h172a13 13 0 0 1 12 9l11 28a9 9 0 0 1-8 12H59a9 9 0 0 1-8-12l11-28a13 13 0 0 1 12-9z"
          fill="${LA_FI}"/>
    <path d="M130 102l-9 49"/>
    ${teclas}
    <rect x="74" y="112" width="40" height="11" rx="4" fill="#fff"/>
    <path d="M76 66h36v46H76z" fill="#fff"/>
    <path d="M76 66l4.5 4.5 4.5-4.5 4.5 4.5 4.5-4.5 4.5 4.5 4.5-4.5 4.5 4.5 4.5-4.5"/>
    <path d="M84 82h20M84 92h14" stroke-width="2.4" opacity=".75"/>

    <!-- ⭐ a gaveta ABERTA: o fundo em trapézio, as divisórias dentro dele e
         a frente da gaveta fechando por baixo -->
    <path d="M60 151h200l30 58H30z" fill="#fff"/>
    ${notas}
    ${moedas}
    <rect x="28" y="209" width="264" height="26" rx="7" fill="${LA_FI}"/>
    <circle cx="160" cy="222" r="7.5" fill="#fff"/>
    <path d="M160 218v8" stroke-width="2.6"/>`)};
}

const REGISTRADORAS = [
  {n:1, f:regClassica, nome:'Clássica', resumo:'monitor grande, bobina à esquerda, gaveta larga'},
  {n:2, f:regTerminal, nome:'Terminal', resumo:'painel inclinado, sem monitor, cupom comprido'},
  {n:3, f:regTorre,    nome:'Torre',    resumo:'vertical, display em pé, teclado em duas colunas'},
  {n:4, f:regAberta,   nome:'Aberta',   resumo:'a gaveta aberta, com as divisórias do dinheiro'}
];
