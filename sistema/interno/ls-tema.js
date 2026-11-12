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
    return `<div class="lsConta" title="${nome}">
      ${marca ? cartao(chave, marca) : cartaoGenerico(chave)}
      <span class="lsN">${nome}</span>
      <span class="lsV"><i>R$</i>${fmt(o.v != null ? o.v : o.valor)}</span>
    </div>`;
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

/* ══ 4 · O LOCKUP no lugar da palavra «Painel» ════════════════════════ */
function lockup(raiz){
  const a = raiz.querySelector('.tit .a');
  if (a && !a.querySelector('.lsLock'))
    a.innerHTML = '<span class="lsLock"><b>laila</b><i>SALON</i></span>';
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
function esticar(){
  const barra = document.getElementById('lt-tabbar');
  const visivel = barra && getComputedStyle(barra).display !== 'none';
  const reserva = visivel ? Math.round(barra.getBoundingClientRect().height + 16) : 0;
  const M = 10;
  const k = Math.min((innerWidth - 2*M)/1380, (innerHeight - reserva - 2*M)/794);
  if (k > 0) {
    document.documentElement.style.setProperty('--barra', reserva + 'px');
    document.documentElement.style.setProperty('--k', k);
  }
}
addEventListener('resize', esticar);

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

function aplicar(){
  const raiz = document.querySelector('.painel') || document.body;
  lockup(raiz); limparTexto(raiz);
  repintar(document.body);     /* o body, não o painel: a barra de abas e os
                                  dois botões flutuantes moram fora dele */
  encaixarAgenda(); esticar(); extratoDemo();
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
