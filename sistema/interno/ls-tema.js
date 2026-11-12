/* ══════════════════════════════════════════════════════════════════════
   LS-TEMA · a parte que o CSS não alcança.

   ⚠️⚠️ NENHUM DOS 20 SCRIPTS FOI EDITADO. Este arquivo entra depois de
   todos e troca três funções GLOBAIS — `bolinhas`, `cardSalao` e `miolo` —
   por versões novas. Como o `montaCorpo()` resolve esses nomes na hora da
   chamada, trocar aqui basta. É por isso que «Fechar caixa de hoje»,
   «Contas a pagar» e o extrato dos potes continuam funcionando: o
   comportamento é o mesmo de antes.

   E faz o que CSS não faz: **remapear cor inline**. A tela foi desenhada
   sobre vidro escuro e tem `style="color:rgba(255,255,255,.62)"` espalhado
   no HTML gerado. Regra de folha de estilo não vence atributo `style`.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const TINTA='#0D0D10', FRACA='#6E6E76', FRACA2='#9A9AA2', BORDA='#E9E9EE';
const PINK='#FF2D87', SUP='#F4F4F6';

/* ══ 1 · O REMAPEADOR DE COR INLINE ═══════════════════════════════════
   Para cada elemento fora do bloco rosa, se a cor é branca/quase-branca,
   ela vira tinta na MESMA força: o que era branco opaco vira tinta cheia,
   o que era branco a 62% vira tinta fraca. Assim a hierarquia que a tela
   já tinha sobrevive — não é "pintar tudo de preto".
   ⚠️ Mede a cor COMPUTADA, não o atributo: só assim pega o que veio de
   folha de estilo e o que veio de `style=` com o mesmo critério. */
function forcaDoBranco(cor){
  const m = String(cor).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  const [r,g,b] = [+m[1],+m[2],+m[3]], a = m[4] === undefined ? 1 : +m[4];
  if (r < 215 || g < 215 || b < 215) return null;     // não é branco
  return a;
}
function repintar(raiz){
  const rosa = raiz.querySelector('.over');
  raiz.querySelectorAll('*').forEach(e => {
    if (rosa && rosa.contains(e)) return;             // dentro do bloco, branco é certo
    if (e.closest('.lsAg')) return;                   // a agenda tem tema próprio
    const cs = getComputedStyle(e);
    const a = forcaDoBranco(cs.color);
    if (a !== null) e.style.color = a >= .9 ? TINTA : (a >= .55 ? FRACA : FRACA2);
    /* bordas e fios de vidro viram a borda de papel */
    ['borderTopColor','borderBottomColor','borderLeftColor','borderRightColor'].forEach(k=>{
      if (parseFloat(cs[k.replace('Color','Width')]) > 0 && forcaDoBranco(cs[k]) !== null)
        e.style[k] = BORDA;
    });
    /* o trilho dos anéis: branco transparente vira o trilho de papel.
       ⚠️ SÓ O PRIMEIRO `circle` DE CADA SVG. Pintar os dois deixa todo anel
       100% cheio — foi o defeito de uma cópia em 18/09. */
    if (e.tagName === 'circle' && e.getAttribute('stroke') &&
        forcaDoBranco(e.getAttribute('stroke')) !== null &&
        e === e.parentNode.querySelector('circle'))
      e.setAttribute('stroke', '#EDEDF1');
  });
}

/* ══ 2 · OS CARTÕES, no lugar das bolinhas ════════════════════════════
   O desenho é o mesmo dos mockups: traçado do print do app do Nubank
   (proporção 1,590 · roxo #830AD1 · logo a 6,3%/9,5% · bandeira a
   78,1%/75,2%), com as logos oficiais do Asaas e do Sicredi.
   ⚠️ As contas que NÃO são cartão não fingem ser: dinheiro é cédula e
   «processando» é contorno tracejado com relógio. */
/* ⚠️ 118 E NÃO 92: o painel inteiro é reduzido pelo `--k` da prancheta
   (≈0,65 numa janela de 1440), então um cartão de 92 chega na tela com
   ~60px e vira selo. Em 118 ele aterrissa em ~77. */
const KW = 118, KH = Math.round(KW/1.590), KR = KW*.0303;
const MARCA = {
  nubank:  {cor:'#830AD1', rim:'#6A06BE'},
  asaas:   {cor:'#0137E2', rim:'#0129B4'},
  sicredi: {cor:'#146E37', rim:'#0E5429'},
};
/* o contorno de cada marca, em caixa 0..100 — gerado por `tracar.py`
   (cobertura medida: nu 97,5% · ASAAS 94,5% · Sicredi 97,3%) */
const ARTE = window.LS_LOGOS || {};
function cartao(chave, marca){
  const m = MARCA[marca]; if (!m) return cartaoGenerico(chave);
  const lw = KH*.152*(ARTE[marca] ? ARTE[marca].razao : 1.8), lh = KH*.152;
  return `<svg class="lsKt" width="${KW}" height="${KH}" viewBox="0 0 ${KW} ${KH}">
    <rect width="${KW}" height="${KH}" rx="${KR.toFixed(2)}" fill="${m.cor}"/>
    <rect x=".5" y=".5" width="${KW-1}" height="${KH-1}" rx="${(KR-.5).toFixed(2)}"
      fill="none" stroke="${m.rim}" stroke-width="1"/>
    ${ARTE[marca] ? `<svg x="${KW*.063}" y="${KH*.095}" width="${lw.toFixed(1)}"
       height="${lh.toFixed(1)}" viewBox="0 0 100 100" preserveAspectRatio="none"
       fill="#fff" fill-rule="evenodd">${ARTE[marca].d}</svg>` : ''}
    ${bolinhasDoNumero(KW*.06, KH*.892)}
    <circle cx="${KW*.781+KH*.081}" cy="${KH*.752+KH*.081}" r="${KH*.081}" fill="rgba(255,255,255,.34)"/>
    <circle cx="${KW*.781+KW*.164-KH*.081}" cy="${KH*.752+KH*.081}" r="${KH*.081}" fill="rgba(255,255,255,.2)"/>
  </svg>`;
}
const bolinhasDoNumero = (x,y) => {
  let s=''; const d=KW*.0093, p=KW*.0227;
  for (let i=0;i<4;i++) s+=`<circle cx="${x+d+i*p}" cy="${y}" r="${d}" fill="#fff"/>`;
  for (let i=0;i<4;i++) s+=`<circle cx="${x+KW*.115+d+i*p}" cy="${y}" r="${d}" fill="rgba(255,255,255,.6)"/>`;
  return s;
};
function cartaoGenerico(chave){
  if (chave === 'dinheiro') return `<svg class="lsKt" width="${KW}" height="${KH}" viewBox="0 0 ${KW} ${KH}">
    <rect x="6" y="3" width="${KW-12}" height="${KH-12}" rx="3" fill="#B08E2E"/>
    <rect y="8" width="${KW}" height="${KH-8}" rx="${KR.toFixed(2)}" fill="#D9A21B"/>
    <rect x="4.5" y="12.5" width="${KW-9}" height="${KH-17}" rx="2.5" fill="none"
      stroke="rgba(255,255,255,.42)" stroke-width="1"/>
    <circle cx="${KW/2}" cy="${KH/2+4}" r="8.5" fill="rgba(255,255,255,.25)"/>
    <text x="${KW/2}" y="${KH/2+7}" text-anchor="middle" fill="#fff"
      style="font:800 9px -apple-system,sans-serif">R$</text></svg>`;
  return `<svg class="lsKt" width="${KW}" height="${KH}" viewBox="0 0 ${KW} ${KH}">
    <rect x=".9" y=".9" width="${KW-1.8}" height="${KH-1.8}" rx="${KR.toFixed(2)}"
      fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.6)" stroke-width="1.3"
      stroke-dasharray="5 4"/>
    <circle cx="${KW/2}" cy="${KH/2}" r="9.5" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="1.5"/>
    <path d="M${KW/2} ${KH/2-5.2} v5.2 l3.8 2.6" stroke="rgba(255,255,255,.72)" stroke-width="1.5"
      fill="none" stroke-linecap="round"/></svg>`;
}
const CHAVE = {nubank:'nubank', asaas:'asaas', sicredi:'sicredi'};

/* ⚠️ A FONTE DAS CONTAS CONTINUA SENDO A DO SISTEMA. Eu NÃO redesenho a
   lista: leio o `ONDE` que o `vivo.js` montou, do mesmo jeito que o
   `bolinhas()` original lia. Se amanhã entrar uma conta nova, ela aparece
   sozinha — e se eu tivesse chumbado as cinco, não apareceria. */
window.bolinhas = function(){
  const lista = (typeof ONDE !== 'undefined' && ONDE) ? ONDE : [];
  const fmt = v => (typeof brl === 'function' && v != null) ? brl(v) : '0,00';
  return `<div class="lsCartoes">${lista.map(o => {
    const nome = o.n || o.nome || '';
    const chave = CHAVE[nome.toLowerCase()] ||
                  (/dinheiro/i.test(nome) ? 'dinheiro' : 'processando');
    const marca = MARCA[chave] ? chave : null;
    /* ⚠️ ELE ERA UM `div`. Ao trocar a bolinha pelo desenho do cartão eu
       perdi o `<button onclick="abrirOnde(k)">` do original — o cartão
       ficou bonito e mudo, e ela avisou: *«clicar nos cartões não
       funciona»*. O clique é do sistema, não meu: chama a mesma função
       que a bolinha chamava. */
    return `<button type="button" class="lsConta" title="${nome}"
      onclick="abrirOnde('${o.k}')">
      ${marca ? cartao(chave, marca) : cartaoGenerico(chave)}
      <span class="lsN">${nome}</span>
      <span class="lsV"><i>R$</i>${fmt(o.v != null ? o.v : o.valor)}</span>
    </button>`;
  }).join('')}</div>`;
};

/* ══ 3 · A AGENDA DO DIA, com os cartões do Editor do Cartão ══════════
   Medidas copiadas de `~/Desktop/card-ao-vivo-mentoradas/cartao.css`, não
   redesenhadas: faixa 8px #FCB5D5 · título 21/400 lh 1,22 ls −.012em com
   risco de 1,5px · hora 17/400 #717171 · carimbo 10/600 ls .22em na
   pílula #FCB5D5 com tinta #7A2846.
   ⚠️ `transform:scale()` não encolhe o espaço do layout — a altura de cada
   slot é MEDIDA depois de desenhar. */
const ESC = 324/425;
window.cardSalao = function(){
  const ag = (typeof SALAO !== 'undefined' && Array.isArray(SALAO)) ? SALAO
           : (typeof AGENDA_HOJE !== 'undefined' && Array.isArray(AGENDA_HOJE)) ? AGENDA_HOJE : [];
  const hora = (typeof HJ === 'object' && HJ && HJ.hora) ? HJ.hora
             : new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const vagas = (typeof LS_VAGAS === 'number') ? LS_VAGAS : (ag.length || 1);
  const pct = ag.length / vagas * 100;
  const p1 = v => v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
  return `<div class="lsAg">
    <div class="lsAgCab">
      <div><b>Agenda do dia</b>
        <em><b>${hora}</b> · ${ag.length} de ${vagas} vagas</em></div>
      <div class="lsAgAnel">${anelLS(pct)}<em>${p1(pct)}</em></div>
    </div>
    <div class="lsAgLista">
      ${ag.length ? ag.map(c => cartaoCliente(c)).join('')
                  : '<div class="lsAgVazio">ninguém agendado para hoje</div>'}
    </div>
    <div class="lsAgPe"><span>Finalizado hoje</span>
      <b>R$ ${typeof brl === 'function' ? brl((typeof HJ==='object'&&HJ?HJ.fin:0)||0) : '0,00'}</b></div>
  </div>`;
};
function cartaoCliente(c){
  const nome = c.nome || c.n || c.cliente || '';
  const proc = c.proc || c.procedimento || c.servico || '';
  const h    = c.h || c.hora || c.horario || '';
  const chegou = !!(c.chegou || c.chegada);
  return `<div class="lsAgSlot"><div class="lsAgCard ${chegou?'ok':'espera'}">
    <div class="lsAgFaixa"></div>
    <div class="lsAgCorpo">
      ${chegou ? '<div class="lsAgCarimbo">chegou</div>' : ''}
      <div class="lsAgTit">${nome}${proc ? ', '+proc : ''}</div>
      <div class="lsAgHora">agendada para às ${h}</div>
    </div></div></div>`;
}
function anelLS(p){
  p = Math.max(0, Math.min(100, p||0));
  const tam=62, esp=6, r=(tam-esp)/2, c=2*Math.PI*r, off=c*(1-p/100), h=tam/2;
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="#E6E6EB" stroke-width="${esp}"/>
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${PINK}" stroke-width="${esp}"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 ${h} ${h})"/></svg>`;
}
function encaixarAgenda(){
  document.querySelectorAll('.lsAgSlot').forEach(s=>{
    const c = s.querySelector('.lsAgCard');
    if (c) s.style.height = Math.ceil(c.offsetHeight*ESC)+'px';
  });
}

/* ══ 3b · O ANEL MAIS FINO ═══════════════════════════════════════════
   Ela, 12/11: *«deixa o anel mais fino também»*. ⚠️ Um valor fixo em CSS
   não serve: o anel grande do investimento e os seis pequenos vivem em
   viewBox de escalas diferentes (22 contra 10), então «stroke-width:6»
   deixaria um elegante e o outro sumido. O que vale para os dois é um
   FATOR — e o original fica guardado no próprio elemento, senão cada
   passada do observador afinaria de novo até o anel desaparecer. */
const FINO = 0.56;
function afinarAneis(raiz){
  raiz.querySelectorAll('.over svg circle').forEach(c => {
    if (!c.dataset.lsW) {
      const w = parseFloat(getComputedStyle(c).strokeWidth);
      if (!w) return;
      c.dataset.lsW = w;
      c.style.strokeWidth = (w * FINO).toFixed(2) + 'px';
    }
  });
}

/* ══ 4 · A LOGO no lugar da palavra «Painel» ══════════════════════════
   ⚠️ Ela, 12/11: *«a logo não é essa. Esse laila de um jeito e SALON de
   outro. É aquela logo que é tudo a mesma fonte, que muda só a cor — o
   laila de uma cor e o salon de outra. Tem essa logo salva já.»*

   E tinha: `vsl-anamnese/assets/logo-lailasalon.png`, 393×79. Amostrado
   com Pillow: «laila» #000002, «salon» #C2005E. Eu estava MONTANDO um
   lockup com a fonte do sistema (peso 700 + versalete espaçado) em vez
   de usar o arquivo — o mesmo erro de «refazer em vez de copiar».
   A logo agora é o PNG, e ela aparece em TODA tela do sistema. */
/* ⭐ Ela, 12/11: *«deixa só o lailasalon do topo, e coloca financeiro ali
   perto dele, e exclui esses dois lailasalon financeiro»*. A marca e o
   setor passaram a viver na BARRA DA CASCA, que toda tela tem. Repetir
   aqui dentro era a mesma informação duas vezes na mesma tela — e o
   cabeçalho interno era o item mais alto da faixa de cima, então tirá-lo
   é também o que libera espaço para o resto crescer. */
function lockup(raiz){
  const t = raiz.querySelector('.tit');
  if (t) t.style.display = 'none';
}

/* ══ 5 · O GANCHO ════════════════════════════════════════════════════
   ⚠️ O `pinta()` roda de novo a cada 90s. Se o tema só rodasse uma vez,
   a tela voltaria a ser de vidro na primeira releitura — e ninguém ia
   ligar uma coisa na outra. Por isso ele é embrulhado, não chamado. */
/* ══ A LIMPEZA DE TEXTO ═══════════════════════════════════════════════
   Ela, 12/11: *«remover isso aí escrito, o que o salão faturou… tudo que
   está embolando, tudo que é desnecessário, a gente vai remover»* e
   *«não tem isso de sobra do dia, é lucro líquido do dia. Você vai usar
   termos técnicos financeiros»*.

   ⚠️ CADA TERMO É TROCADO PELO NOME CONTÁBIL, não por um sinônimo bonito.
   «sobra» não é conceito de contabilidade; «lucro líquido» é. Quem vende
   um sistema financeiro é cobrada pelo vocabulário dele. */
const TERMOS = [
  [/\bo que sobrou\b/gi,        'lucro líquido'],
  [/\bsobra do dia\b/gi,        'lucro líquido do dia'],
  [/\bsobrou no pote\b/gi,      'saldo da categoria'],
  [/\bsobrou\b/gi,              'lucro líquido'],
  [/\bo que o salão faturou\b/gi, 'receita bruta'],
  [/\bcustou\b/gi,              'custos'],
  [/\bfaturou\b/gi,             'receita'],
  [/\bcusto diário · herdado\b/gi, 'custo fixo diário'],
];
function limparTexto(raiz){
  /* o rótulo da verba sai inteiro: a divisão já está desenhada embaixo
     dele, e o número que ele carregava se acompanha no Mês a mês */
  raiz.querySelectorAll('.aroTit, .cdOlho').forEach(e => {
    if (/o que o sal[aã]o faturou/i.test(e.textContent)) e.remove();
  });
  raiz.querySelectorAll('*').forEach(e => {
    if (e.children.length || !e.textContent.trim()) return;
    let t = e.textContent, novo = t;
    TERMOS.forEach(([re, por]) => { novo = novo.replace(re, por); });
    if (novo !== t) e.textContent = novo;
  });
}
/* ⚠️ RECALCULAR O `--k` DEPOIS DO `ajusta()`. Ele reserva 61px de barra
   mesmo quando a barra está escondida dentro da casca — e cada pixel
   reservado à toa encolhe o painel inteiro. Aqui a reserva vira a altura
   REAL da barra (0 quando ela não está na tela) e a margem cai de 16
   para 10. Medido em 1280×720: k 0,790 → 0,886, +12% em tudo. */
/* ══ APROVEITAR O ESPAÇO: a altura é o gargalo, não a largura ═══════════
   Ela, 12/11: *«expande mais os itens da tela pra aproveitar melhor o
   espaço»*. Medido antes de mexer: k = 0,8237, e ele vinha da ALTURA
   ((674−20)/794 = 0,8237) — a largura daria 0,913. Esticar pela largura
   não daria um pixel.

   Então o que rende é encolher a altura LÓGICA da prancheta. E ela só
   encolhe de verdade se o conteúdo subir junto: o número 794 era fixo no
   código, enquanto o conteúdo real acabava bem antes. Agora os dois são
   medidos — sobe-se o bloco inteiro de uma vez (nada desalinha, porque
   todos se movem o mesmo tanto) e a altura lógica passa a ser a que o
   conteúdo de fato usa.
   ⚠️ `.tit` já saiu (a marca agora é a do topo da casca), e ele era o
   mais alto do cabeçalho — por isso a compressão rende mais do que
   renderia antes. */
const ALTURA_BASE = 794, LARGURA_BASE = 1380, RESPIRO = 6, VAO = 14;
let alturaUtil = ALTURA_BASE, larguraUtil = LARGURA_BASE;

/* ══ ESPREMER A ALTURA PARA O DESENHO CRESCER ═══════════════════════════
   Ela, 12/11: *«tá tudo muito pequeno, aproveite melhor os espaços»*.

   Medido antes de mexer, e é isto que explica o problema: o desenho tem
   1308×758 (razão 1,73) e a janela 1280×674 (razão 1,90). A janela é
   proporcionalmente MAIS LARGA — então a altura estoura primeiro e sobram
   167px de largura sem uso. Com escala uniforme, quem manda é o lado
   apertado: cada pixel de altura que eu devolver vira aumento em TUDO.

   Então a conta é: fechar o ar vertical e encostar o fundo das duas
   colunas no mesmo lugar.
     · a coluna da esquerda tinha 34px de vão morto (22 + 12);
     · a agenda, à direita, é o elemento mais alto (26→768) — encolher só
       a esquerda não daria nada, porque a altura é a do MAIS alto.
   ⚠️ Tudo é `position:absolute` com coordenada fixa, então mover um bloco
   não empurra o de baixo: cada um é deslocado pela medida do vão que
   ficou acima dele. */
function medirAltura(){
  const painel = document.querySelector('.painel'); if (!painel) return;
  const vivos = () => [...painel.children].filter(e =>
    e.offsetHeight > 0 && getComputedStyle(e).display !== 'none');
  let filhos = vivos(); if (!filhos.length) return;

  if (!painel.dataset.lsEspremido) {
    const base = new Map(filhos.map(e => [e, { t:e.offsetTop, h:e.offsetHeight }]));
    const esq = filhos.filter(e => e.offsetLeft + e.offsetWidth <= 950)
                      .sort((a,b) => base.get(a).t - base.get(b).t);
    /* fecha os vãos da esquerda, de cima para baixo */
    let deslocado = 0, fim = esq.length ? base.get(esq[0]).t : 0;
    for (const e of esq) {
      const t = base.get(e).t;
      if (t > fim) { const vao = t - fim; if (vao > VAO) deslocado += vao - VAO; }
      if (deslocado) e.style.top = (t - deslocado) + 'px';
      fim = Math.max(fim, t + base.get(e).h);
    }
    /* a agenda acompanha: o fundo das duas colunas encosta no mesmo lugar */
    filhos = vivos();
    const fundoEsq = Math.max(...filhos
      .filter(e => e.offsetLeft + e.offsetWidth <= 950)
      .map(e => e.offsetTop + e.offsetHeight));
    const dir = painel.querySelector('.dir');
    if (dir && dir.offsetTop + dir.offsetHeight > fundoEsq)
      dir.style.height = Math.max(200, fundoEsq - dir.offsetTop) + 'px';
    /* ⚠️ TENTEI alargar os blocos para ocupar os 130px que sobravam à
       direita — e MEDI o resultado: o k caiu de 0,8793 para 0,8164.
       Preencher a largura faz a largura virar o gargalo, e aí TUDO
       encolhe 7%. Ela pediu o contrário («tá tudo muito pequeno»), então
       a margem lateral fica: ela é o preço de o conteúdo ser maior.
       O registro vale mais que o código: medido, 99,7% de largura custa
       7% de tamanho em tudo. */
    painel.dataset.lsEspremido = '1';
  }

  filhos = vivos();
  const topo  = Math.min(...filhos.map(e => e.offsetTop));
  const fundo = Math.max(...filhos.map(e => e.offsetTop + e.offsetHeight));
  const sobe = Math.max(0, topo - RESPIRO);
  painel.style.transform = sobe ? `translateY(${-sobe}px)` : '';
  alturaUtil = Math.max(400, fundo - sobe + RESPIRO);
  /* ⚠️ Encolher só a CONTA não encolhe a caixa: a `.prancheta` continuava
     com os 794px do CSS e o scale desenhava 676px numa janela de 674 —
     transbordava 2px. A altura da caixa tem que ser a mesma da conta. */
  /* ⚠️ O MESMO erro aconteceu nos dois eixos, e o segundo eu só peguei
     porque a prova mediu: depois de esticar os blocos, a agenda ficou
     FORA da `.prancheta` — a caixa continuava com os 1380px do CSS.
     Caixa e conteúdo andam juntos, na altura e na largura. */
  const esq   = Math.min(...filhos.map(e => e.offsetLeft));
  const dirx  = Math.max(...filhos.map(e => e.offsetLeft + e.offsetWidth));
  larguraUtil = Math.max(600, dirx + esq);
  const pr = document.querySelector('.prancheta');
  if (pr) { pr.style.height = alturaUtil + 'px'; pr.style.width = larguraUtil + 'px'; }
  painel.style.height = alturaUtil + sobe + 'px';
  painel.style.width  = larguraUtil + 'px';
}

function esticar(){
  const barra = document.getElementById('lt-tabbar');
  const visivel = barra && getComputedStyle(barra).display !== 'none';
  const reserva = visivel ? Math.round(barra.getBoundingClientRect().height + 16) : 0;
  const M = 2;
  const k = Math.min((innerWidth - 2*M)/larguraUtil, (innerHeight - reserva - 2*M)/alturaUtil);
  if (k > 0) {
    document.documentElement.style.setProperty('--barra', reserva + 'px');
    document.documentElement.style.setProperty('--k', k);
  }
}
addEventListener('resize', () => { medirAltura(); esticar(); });

/* ══ 6 · O EXTRATO DE CADA CATEGORIA, na demo ════════════════════════
   Ela, 12/11: *«quando clico em cada despesa, não mostra o extrato de
   cada categoria no card»*. Medido: a gaveta ABRE — o que ela vê é
   «R$ 0,00 · Nada entrou nem saiu deste pote», porque não há lançamento
   nenhum no banco de demonstração. Então a demo preenche a gaveta também.
   ⚠️ Cada lista FECHA com o número grande em cima dela: a soma dos
   lançamentos é exatamente o que o anel mostra. O próprio sistema já
   acusa quando não fecha («A lista soma X e o anel mostra Y») — demo que
   dispara o próprio alarme do sistema é pior do que demo vazia. */
function extratoDemo(){
  const g = document.getElementById('gaveta');
  if (!g || !g.querySelector('.cdCab')) return;
  const jaFeito = g.dataset.lsDemo || '';
  if (!/Nada entrou nem saiu|R\$\s*0,00/.test(g.innerText)) return;   /* tem dado real: não toco */
  const nome = (g.querySelector('.cdCab b')||{}).textContent || '';
  if (jaFeito === nome) return;
  const D = window.LS_DEMO; if (!D) return;
  const pote = D.potes.find(p => p[0].toLowerCase().startsWith(nome.toLowerCase().slice(0,6)))
            || (/investimento/i.test(nome) ? ['Investimento', D.grande.v] : null);
  if (!pote) return;
  const total = pote[1];
  const linhas = window.LS_LANC && window.LS_LANC(nome, total);
  if (!linhas) return;
  const brlS = v => v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  g.querySelectorAll('.cdNum').forEach(e => e.innerHTML = '<span>R$</span>'+brlS(total));
  const ent = linhas.filter(l=>l[2]>0).reduce((a,l)=>a+l[2],0);
  const sai = linhas.filter(l=>l[2]<0).reduce((a,l)=>a-l[2],0);
  const pe = g.querySelectorAll('.cdPill b');
  if (pe[0]) pe[0].textContent = '+ '+brlS(ent);
  if (pe[1]) pe[1].textContent = '− '+brlS(sai);
  const vazio = [...g.querySelectorAll('*')].find(e => !e.children.length &&
    /Nada entrou nem saiu/i.test(e.textContent));
  const lista = `<div class="lsExt">${linhas.map(([d,t,v]) => `
    <div class="lsExtL"><span class="lsExtD">${d}</span><span class="lsExtT">${t}</span>
      <b class="${v<0?'neg':'pos'}">${v<0?'−':'+'} ${brlS(Math.abs(v))}</b></div>`).join('')}
    <div class="lsExtS"><span>soma dos lançamentos</span><b>R$ ${brlS(total)}</b></div></div>`;
  if (vazio) vazio.outerHTML = lista; else g.insertAdjacentHTML('beforeend', lista);
  g.dataset.lsDemo = nome;
}

/* ══ 6b · O EXTRATO DE CADA CONTA, na demo ═══════════════════════════
   Ela, 12/11: *«clicar nos cartões não funciona»*. O clique voltou (o
   cartão virou `<button>` de novo), e aí apareceu o defeito de baixo:
   a gaveta abria com **R$ 0,00** enquanto o cartão mostrava R$ 4.820,61.

   ⚠️ Isso é o que a lei do financeiro proíbe: dois números de dinheiro
   na mesma tela contando histórias diferentes. Então a conta FECHA — os
   lançamentos somam exatamente o saldo do cartão, e a soma aparece
   escrita embaixo da lista, para dar para conferir sem calculadora.
   ⚠️ Só preenche o que está vazio: se houver movimento de verdade na
   conta, a demo não encosta. */
function extratoContaDemo(){
  const g = document.getElementById('gaveta');
  if (!g || !g.querySelector('.gcab') || !g.querySelector('.exSaldo')) return;
  const nome = (g.querySelector('.gcab b')||{}).textContent || '';
  if (!nome || g.dataset.lsConta === nome) return;
  if (!g.querySelector('.exNada')) return;              /* tem dado real: não toco */
  const D = window.LS_DEMO; if (!D || !D.contas) return;
  const conta = D.contas.find(c => c[0].toLowerCase() === nome.trim().toLowerCase());
  if (!conta) return;
  const total = conta[1];
  const linhas = window.LS_LANC_CONTA && window.LS_LANC_CONTA(nome, total);
  if (!linhas || !linhas.length) return;
  const brlS = v => v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const saldo = g.querySelector('.exSaldo b');
  if (saldo) saldo.textContent = 'R$ ' + brlS(total);
  const nota = g.querySelector('.exSaldo span');
  if (nota) nota.textContent = linhas.length + ' lançamentos · salão de demonstração';
  const cab = g.querySelector('.egCab span');
  if (cab) cab.innerHTML = linhas.length + ' lançamentos'
    + '<em class="egCabSub"> · do mais novo pro mais antigo</em>';
  g.querySelector('.exNada').outerHTML =
    `<div class="lsExt">${linhas.map(([d,t,v]) => `
      <div class="lsExtL"><span class="lsExtD">${d}</span><span class="lsExtT">${t}</span>
        <b class="${v<0?'neg':'pos'}">${v<0?'−':'+'} ${brlS(Math.abs(v))}</b></div>`).join('')}
      <div class="lsExtS"><span>soma dos lançamentos</span><b>R$ ${brlS(total)}</b></div></div>`;
  g.dataset.lsConta = nome;
}

function aplicar(){
  const raiz = document.querySelector('.painel') || document.body;
  /* ⚠️ `limparTexto` rodava só no PAINEL — e a gaveta do extrato mora
     FORA dele. Por isso ela abria uma categoria e lia «sobrou no pote»,
     o termo que a gente já tinha trocado na tela de trás: *«botões de
     categoria abrem extrato velho»*. Os termos valem no documento todo;
     o lockup e os anéis é que são só do painel. */
  lockup(raiz); afinarAneis(raiz); medirAltura();
  limparTexto(document.body);
  repintar(document.body);     /* o body, não o painel: a barra de abas e os
                                  dois botões flutuantes moram fora dele */
  encaixarAgenda(); esticar(); extratoDemo(); extratoContaDemo();
}
/* ⚠️⚠️ EMBRULHAR O `pinta` NÃO FUNCIONA, e o print mostrou: o lockup
   aparecia e sumia. O `function pinta(){}` mora num <script> que roda
   DEPOIS deste, e declaração de função **sobrescreve** a global que eu
   tinha acabado de trocar. Quem resolve é olhar o DOM: o `pinta()` troca
   o conteúdo da `.tela`, então um observador reaplica o tema sempre que
   isso acontece — não importa a ordem dos scripts nem o relógio de 90s. */
let agendado = null;
const vigia = new MutationObserver(() => {
  clearTimeout(agendado);
  agendado = setTimeout(aplicar, 30);     /* junta as mutações da mesma pintura */
});
function ligarVigia(){
  vigia.observe(document.body, {childList:true, subtree:true});
}
if (document.readyState === 'loading')
  addEventListener('DOMContentLoaded', () => { ligarVigia(); aplicar(); });
else { ligarVigia(); aplicar(); }
window.LS_TEMA_OK = true;
})();
