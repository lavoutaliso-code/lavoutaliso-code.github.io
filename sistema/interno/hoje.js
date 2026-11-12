/* ══════════════════════════════════════════════════════════════════════════
   O TOPO — faturamento e lucro do dia, no lugar do Buscar e do LT.
   Medido 03/09/2026 · lucro = fat − MO − bônus − produto − custo fixo (464).
   ⚠️ NATIVO em 520×64, não escalado: a 2× o rótulo virava 6,5px.
   ⚠️ NO SVG, NUNCA toLocaleString. `p1()` devolve "24,7" com vírgula, e o
      dasharray passa a ser lido como QUATRO números (24, 7, 75, 3) em vez de
      dois — o anel desenhava quase cheio mostrando 24,7% do lado. Só se pega
      comparando a figura com o número escrito.
   ⚠️ A margem do DIA oscila muito — os R$464 do fixo entram inteiros logo de
      manhã, então o dia começa negativo. Por isso ela vem sempre rotulada
      "do dia": solta, enganaria.

   ⭐⭐ A CAIXA DE SELEÇÃO DE PERÍODO (ela, 23/10/2026)
   *"adiciona um botão de medir faturamento no topo da tela, de hoje, ontem,
    últimos 7 dias, personalizado. não quero botão, quero caixa de seleção, e
    só deve modificar o que tem dentro do Faturamento hoje / Lucro hoje /
    margem do dia."*

   🔒 O ESCOPO É A PÍLULA, e só ela. O resto da tela — saldo, potes, contas a
   pagar, meta, extratos — continua na janela de sempre. Trocar o período aqui
   repinta `.hoje` e mais nada: é `pintaTopo()` quem faz isso, com `innerHTML`
   num elemento só.

   ⚠️ O RÓTULO ACOMPANHA O PERÍODO. "Faturamento hoje" mostrando a soma de 7
   dias seria a tela mentindo em letra pequena — o número grande muda e o
   rótulo é a única coisa que diz do que ele é.
   ⚠️ A MARGEM TROCA DE LEGENDA JUNTO: "do dia" só vale quando é um dia.
   ══════════════════════════════════════════════════════════════════════════ */
const HJ={fat:3124.20, lucro:770.20, comandas:11};
HJ.marg = HJ.lucro/HJ.fat*100;

/* o período escolhido na caixa de seleção. `hoje` é o estado de nascença —
   é assim que a tela sempre abriu e é assim que ela continua abrindo. */
const HJP = {modo:'hoje', ini:null, fim:null};

const HJ_PERIODOS = [
  {k:'hoje',   r:'Hoje'},
  {k:'ontem',  r:'Ontem'},
  {k:'7d',     r:'Últimos 7 dias'},
  {k:'custom', r:'Personalizado'},
];

/* dd/mm, pro rótulo do período personalizado */
const _hjDM = iso => String(iso||'').slice(8,10)+'/'+String(iso||'').slice(5,7);

/* as duas pontas do período escolhido, em ISO */
function hjFaixa(){
  const hoje = (typeof _hoje==='function') ? _hoje()
             : new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
  const menos = (d,n) => (typeof _diaMais==='function') ? _diaMais(d,n) : d;
  if(HJP.modo==='ontem') { const o = menos(hoje,-1); return [o,o]; }
  /* 7 dias CONTANDO HOJE: hoje e os seis anteriores. É o que "últimos 7 dias"
     quer dizer pra quem olha o painel no meio do expediente — tirar hoje
     deixaria a venda da manhã fora da conta. */
  if(HJP.modo==='7d')    return [menos(hoje,-6), hoje];
  if(HJP.modo==='custom' && HJP.ini && HJP.fim){
    return HJP.ini <= HJP.fim ? [HJP.ini, HJP.fim] : [HJP.fim, HJP.ini];
  }
  return [hoje, hoje];
}

/* os números da pílula. `hoje` devolve o `HJ` que o resto da tela já usa —
   assim o topo nunca discorda do fechamento do dia por arredondamento. */
function hjDados(){
  if(HJP.modo==='hoje' || typeof medirPeriodo!=='function') return HJ;
  const [a,b] = hjFaixa();
  const R = medirPeriodo(a,b);
  return {fat:R.fat, lucro:R.lucro, comandas:R.n,
          marg: R.fat ? R.lucro/R.fat*100 : 0};
}

function hjRotulos(){
  const [a,b] = hjFaixa();
  if(HJP.modo==='ontem') return {fat:'Faturamento ontem', lucro:'Lucro ontem',
                                 marg:'margem<br>do dia', titulo:_hjDM(a)};
  if(HJP.modo==='7d')    return {fat:'Faturamento · 7 dias', lucro:'Lucro · 7 dias',
                                 marg:'margem<br>do período',
                                 titulo:_hjDM(a)+' a '+_hjDM(b)};
  if(HJP.modo==='custom' && HJP.ini && HJP.fim){
    /* ⚠️ UM DIA SÓ NÃO VIRA FAIXA: "23/10–23/10" é a mesma data escrita duas
       vezes ocupando 10 caracteres do rótulo mais apertado da tela. */
    const f = (a===b) ? _hjDM(a) : (_hjDM(a)+'–'+_hjDM(b));
    return {fat:'Faturamento · '+f, lucro:'Lucro · '+f,
            marg: a===b ? 'margem<br>do dia' : 'margem<br>do período', titulo:f};
  }
  return {fat:'Faturamento hoje', lucro:'Lucro hoje',
          marg:'margem<br>do dia', titulo:_hjDM(a)};
}

function topoHoje(){
  const D = hjDados(), L = hjRotulos();
  /* ⚠️ a margem entra no SVG como número cru e PRESA entre 0 e 100: período
     de prejuízo dá margem negativa, e `stroke-dasharray="-12 112"` faz o
     Chrome ignorar o traço inteiro — o anel sumia em vez de ficar vazio. */
  const marg = Number(D.marg)||0;
  const anel = Math.max(0, Math.min(100, marg));
  return `<div class="hjL"><em title="${L.titulo}">${L.fat}</em>
      <b class="fina"><span class="hjC">R$</span>${brl(D.fat)}</b></div>
    <span class="hjFio"></span>
    <div class="hjL"><em title="${L.titulo}">${L.lucro}</em>
      <b class="fina"><span class="hjC">R$</span>${brl(D.lucro)}</b></div>
    <div class="hjRot">${L.marg}</div>
    <div class="hjAro">
      <svg viewBox="0 0 100 100" style="transform:rotate(-90deg)">
        <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/>
        <circle cx="50" cy="50" r="43" fill="none" stroke="#C7F636" stroke-width="10"
          pathLength="100" stroke-dasharray="${anel.toFixed(2)} ${(100-anel).toFixed(2)}"
          stroke-linecap="round"/>
      </svg>
      <span class="num">${p1(marg)}%</span>
    </div>`;
}

/* ── a caixa de seleção, ao lado da pílula ────────────────────────────────
   ⚠️ ELA MORA FORA DA PÍLULA, e isso foi medido antes de escrever: a 1440 os
   cinco filhos de `.hoje` já ocupam 461px dos 582 disponíveis, e com os gaps
   e o padding sobram 5px. Qualquer coisa a mais ali dentro espremia o valor
   de R$ 1.144,70. O vão entre o título (acaba em 211 no palco) e a pílula
   (começa em 380) tem 169px livres — é lá que ela cabe inteira. */
function topoPeriodo(){
  const [a,b] = hjFaixa();
  const hoje = (typeof _hoje==='function') ? _hoje() : a;
  const ini  = HJP.ini || a, fim = HJP.fim || b;
  /* ⚠️ O RÓTULO "medir" SAIU DA TELA (medido, 23/10/2026). Ele comia 38px dos
     142 e "Personalizado" saía cortado como "Personaliza". O vão entre o
     título e a pílula tem 169px no total — não cabe rótulo E a palavra mais
     longa. Fica o ícone de relógio, que diz "período" sem ocupar texto; o
     nome continua inteiro no `title` e no aria-label, pra leitor de tela. */
  return `<svg class="hjPerIco" width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/></svg>
    <select id="hj-per" class="hjPerSel" onchange="hjEscolher(this.value)"
      title="período medido no faturamento e no lucro" aria-label="período medido">
      ${HJ_PERIODOS.map(o=>`<option value="${o.k}"${o.k===HJP.modo?' selected':''}
        >${o.r}</option>`).join('')}
    </select>
    <!-- ⚠️ as duas datas só existem no modo personalizado; fora dele nem
         ficam no DOM, pra não virarem alvo de toque invisível no celular. -->
    ${HJP.modo==='custom' ? `<div class="hjPerDatas">
      <input type="date" class="hjPerData" value="${ini}" max="${hoje}"
        onchange="hjDatas(this.value, null)">
      <span class="hjPerAte">a</span>
      <input type="date" class="hjPerData" value="${fim}" max="${hoje}"
        onchange="hjDatas(null, this.value)">
    </div>` : ''}`;
}

/* repinta A PÍLULA E A CAIXA, e nada mais da tela */
function pintaTopo(){
  const t = document.querySelector('.hoje');   if(t) t.innerHTML = topoHoje();
  const p = document.querySelector('.hjPer');  if(p) p.innerHTML = topoPeriodo();
}
function hjEscolher(k){
  if(!HJ_PERIODOS.some(o=>o.k===k)) return;
  HJP.modo = k;
  /* personalizado nasce em HOJE→HOJE: período vazio mostraria R$ 0,00 como se
     fosse um dia sem venda, que é o tipo de zero que assusta à toa. */
  if(k==='custom' && !(HJP.ini && HJP.fim)){
    const h = (typeof _hoje==='function') ? _hoje() : null;
    HJP.ini = HJP.ini || h; HJP.fim = HJP.fim || h;
  }
  pintaTopo();
}
function hjDatas(ini, fim){
  if(ini) HJP.ini = ini;
  if(fim) HJP.fim = fim;
  HJP.modo = 'custom';
  pintaTopo();
}
