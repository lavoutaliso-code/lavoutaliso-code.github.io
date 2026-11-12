/* ══════════════════════════════════════════════════════════════════════
   LS-DEMO — enche a tela de um salão fictício, para a demonstração não
   abrir vazia. Ela, 12/11: *«coloca dados de um salão, fictício, todas
   as informações preenchidas, uma demo»*.

   ⚠️⚠️ POR QUE ISTO É TROCA DE TEXTO NO DOM, e não dado injetado:
   o `M`, o `ONDE`, o `MT` e o `MESES` são `const`/`let` de script
   clássico — eles **não moram em `window`**. `window.ONDE` dá `undefined`,
   e um script de fora não tem como escrever neles (já foi medido neste
   projeto). Então a demo entra depois da pintura, trocando o que está
   escrito na tela. Dois efeitos disso, e os dois são bons aqui:
     · nenhuma linha do sistema é tocada — o caixa de verdade continua
       lendo o banco de verdade;
     · a demo só acontece quando a tela está ZERADA. Se um dia houver
       dado real, ele aparece e a demo some sozinha.

   ⚠️ TODO NÚMERO É FICTÍCIO E COERENTE ENTRE SI. As parcelas somam, a
   margem é lucro ÷ faturamento, e os meses fecham faturou − custou =
   sobrou. Demo com número que não fecha ensina a cliente a desconfiar
   da tela.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const brlS = v => v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const p1   = v => v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';

/* ── o salão fictício ────────────────────────────────────────────── */
const D = {
  saldo: 31510.05,
  contas: [['Nubank',4820.61],['Asaas',8912.77],['Sicredi',13627.07],
           ['Dinheiro',3189.90],['Processando',959.70]],
  hoje:  { fat: 2847.60, lucro: 612.40 },
  potes: [['Lucro líquido',465.92,12.1],['Equipe',5703.40,36.0],['Estoque',9099.64,14.2],
          ['Marketing',207.87,5.6],['Operacional',3066.13,19.7],['Imposto',6913.05,6.0]],
  grande:{ v:10584.51, pct:12.4 },
  contasPagar: 464,
  meta:  { atingido:74.8, alvo:68655 },
  agenda:{ site:3, wpp:5 },
  meses: [['JUN',254,49715.40,35179.60],['JUL',253,64777.80,50897.04],
          ['AGO',228,62413.20,49278.72],['SET',184,51361.10,44029.09],
          ['OUT',160,49311.30,42521.77],['NOV',64,17179.40,16136.02]],
  clientes: [
    ['07:00','Angelica Fonseca de Paula','progressiva',true],
    ['08:30','Miriam Conceição de Almeida','manutenção',true],
    ['10:00','Estefânia Magna Andrade Lacerda','progressiva',false],
    ['11:30','Débora Fraga','manutenção',false],
    ['13:00','Fernanda Ferreira Andrade','progressiva',false],
    ['14:30','Roberta Adriana Macedo Teodoro','manutenção',false],
  ],
};
D.hoje.marg = D.hoje.lucro / D.hoje.fat * 100;
window.LS_DEMO = D;

/* ══ OS LANÇAMENTOS FICTÍCIOS DE CADA POTE ═══════════════════════════
   ⚠️ A ÚLTIMA LINHA FECHA A CONTA. Cada lista é montada com valores
   plausíveis e a ÚLTIMA entrada é o resto — assim a soma bate no
   centavo com o número grande da gaveta. O próprio sistema acusa quando
   não bate («A lista soma X e o anel mostra Y»): demo que dispara o
   alarme do sistema é pior do que demo vazia. */
const LANC = {
  'Equipe':      [['12/11','Mão de obra · 4 atendimentos', 448.00],
                  ['11/11','Mão de obra · 6 atendimentos', 672.00],
                  ['11/11','Bônus Cliente Feliz · 6',       53.76],
                  ['10/11','Pagamento semanal da equipe', -980.00]],
  'Estoque':     [['12/11','Sinal · parte do estoque (4×43)', 172.00],
                  ['11/11','Sinal · parte do estoque (6×43)', 258.00],
                  ['09/11','Compra de insumos · fornecedor', -640.00]],
  'Marketing':   [['12/11','Sinal · parte de marketing (4×17)', 68.00],
                  ['11/11','Sinal · parte de marketing (6×17)',102.00],
                  ['08/11','Impulsionamento de reel',          -180.00]],
  'Operacional': [['01/11','Custo fixo rateado · 22 dias úteis', 6160.00],
                  ['07/11','Conta de luz',                      -412.80],
                  ['05/11','Produtos de limpeza',               -168.40]],
  'Imposto':     [['12/11','6% sobre o faturamento do dia', 170.86],
                  ['11/11','6% sobre o faturamento do dia', 256.29]],
  'Lucro':       [['12/11','Sobra do dia',  612.40],
                  ['11/11','Sobra do dia',  438.90],
                  ['09/11','Retirada da dona', -1200.00]],
  'Investimento':[['12/11','Sinal · 2ª unidade (4×39,04)', 156.16],
                  ['11/11','Sinal · 2ª unidade (6×39,04)', 234.24],
                  ['01/11','Aporte do mês',                900.00]],
};
/* devolve as linhas com a ÚLTIMA ajustada pra somar exatamente `total` */
window.LS_LANC = function(nome, total){
  const chave = Object.keys(LANC).find(k => nome.toLowerCase().startsWith(k.toLowerCase().slice(0,5)));
  if (!chave) return null;
  const base = LANC[chave].map(l => l.slice());
  const soma = base.reduce((a,l) => a + l[2], 0);
  const resto = +(total - soma).toFixed(2);
  if (Math.abs(resto) >= 0.01)
    base.push([base[base.length-1][0], 'Acumulado dos dias anteriores', resto]);
  return base;
};

/* ⚠️ A DEMO SÓ ENTRA EM TELA ZERADA. É esta função que impede a demo de
   cobrir dinheiro de verdade: se o saldo não é 0,00, não mexo em nada. */
function telaZerada(){
  const v = document.querySelector('.saldo .v');
  if (!v) return false;
  const t = v.textContent.replace(/\s/g,'');
  return /^R?\$?0,00$/.test(t) || /medindo/i.test(t);
}

/* troca o texto de um nó-folha sem mexer nos filhos (o cifrão é irmão) */
function escrever(el, txt){
  if (!el) return;
  const alvo = [...el.childNodes].reverse().find(n => n.nodeType === 3 && n.textContent.trim());
  if (alvo) alvo.textContent = txt; else el.textContent = txt;
}
const acharPorRotulo = (raiz, re) =>
  [...raiz.querySelectorAll('*')].find(e => !e.children.length && re.test(e.textContent||''));

function encher(){
  if (!telaZerada()) return;
  const doc = document;

  /* 1 · o saldo grande */
  escrever(doc.querySelector('.saldo .v'), brlS(D.saldo));

  /* 2 · as contas — o `bolinhas()` do tema desenha os cartões a partir do
         ONDE; aqui só os valores escritos embaixo de cada cartão */
  doc.querySelectorAll('.lsConta').forEach((c,i) => {
    const d = D.contas[i]; if (!d) return;
    const n = c.querySelector('.lsN'), v = c.querySelector('.lsV');
    if (n) n.textContent = d[0];
    if (v) v.innerHTML = '<i>R$</i>' + brlS(d[1]);
  });

  /* 3 · a faixa de hoje: faturamento, lucro e a margem (que é a conta
         dos dois — margem inventada à parte seria demo que não fecha) */
  const hj = doc.querySelectorAll('.hjL b, .hjC b');
  if (hj[0]) escrever(hj[0], brlS(D.hoje.fat));
  if (hj[1]) escrever(hj[1], brlS(D.hoje.lucro));
  const mg = acharPorRotulo(doc, /^\s*0,0%\s*$/);
  if (mg) mg.textContent = p1(D.hoje.marg);

  /* 4 · os potes: acha cada anel pelo NOME escrito do lado */
  D.potes.forEach(([nome, val, pct]) => {
    const rot = [...doc.querySelectorAll('.aroBt *')]
      .find(e => !e.children.length && e.textContent.trim() === nome);
    if (!rot) return;
    const bt = rot.closest('.aroBt');
    const v = [...bt.querySelectorAll('*')].find(e => !e.children.length && /R\$|^\s*0,00/.test(e.textContent));
    if (v) escrever(v, 'R$ ' + brlS(val));
    const p = [...bt.querySelectorAll('*')].find(e => !e.children.length && /%$/.test(e.textContent.trim()));
    if (p) p.textContent = p1(pct);
    const arco = bt.querySelector('svg circle:last-child');
    if (arco) desenharArco(arco, pct);
  });

  /* 5 · o anel grande */
  const g = doc.querySelector('.aroBt.grande');
  if (g){
    const v = [...g.querySelectorAll('*')].find(e => !e.children.length && /R\$|0,00/.test(e.textContent));
    if (v) escrever(v, 'R$ ' + brlS(D.grande.v));
    const q = [...g.querySelectorAll('*')].find(e => !e.children.length && /de tudo que entra/i.test(e.textContent));
    if (q) q.textContent = p1(D.grande.pct) + ' de tudo que entra';
    const arco = g.querySelector('svg circle:last-child');
    if (arco) desenharArco(arco, D.grande.pct);
  }

  /* 5b · o total da verba, ao lado do rótulo — é a SOMA das parcelas que
          estão desenhadas, com o imposto fora (ele é calculado e nunca
          cobrado; somá-lo contaria o mesmo real duas vezes) */
  const soma = D.potes.filter(x => x[0] !== 'Imposto').reduce((a,x)=>a+x[1], D.grande.v);
  const tot = [...doc.querySelectorAll('.over *')]
    .find(e => !e.children.length && /^\s*R\$\s*0,00\s*$/.test(e.textContent));
  if (tot) escrever(tot, 'R$ ' + brlS(soma));

  /* 6 · contas a pagar e a meta */
  const cp = acharPorRotulo(doc.querySelector('.mazul') || doc, /^\s*\d+\s*$/);
  if (cp) cp.textContent = D.contasPagar;
  const mt = doc.querySelector('.entrou.meta, .meta');
  if (mt){
    const at = [...mt.querySelectorAll('*')].find(e => !e.children.length && /%$/.test(e.textContent.trim()));
    if (at) at.textContent = p1(D.meta.atingido);
    /* ⚠️ O ALVO NÃO É FOLHA. Ele é um nó de TEXTO irmão do <small>R$</small>
       — `querySelectorAll('*')` nunca o alcança. Quem acha é o pai do
       <small>, e aí troca o texto solto. */
    const sm = [...mt.querySelectorAll('small')].find(e => /R\$/.test(e.textContent));
    if (sm) escrever(sm.parentNode, D.meta.alvo.toLocaleString('pt-BR'));
    const arco = mt.querySelector('svg circle:last-child');
    if (arco) desenharArco(arco, D.meta.atingido);
  }

  /* 7 · agendamentos do dia */
  const nums = [...doc.querySelectorAll('.cb, .meia')].flatMap(c =>
    [...c.querySelectorAll('*')].filter(e => !e.children.length && /^\s*0\s*$/.test(e.textContent)));
  if (nums[0]) nums[0].textContent = D.agenda.site;
  if (nums[1]) nums[1].textContent = D.agenda.wpp;

  /* 8 · a agenda do dia: os cartões do Editor do Cartão */
  const lista = doc.querySelector('.lsAgLista');
  if (lista && !lista.querySelector('.lsAgSlot')){
    lista.innerHTML = D.clientes.map(([h,n,p,ch]) => `
      <div class="lsAgSlot"><div class="lsAgCard ${ch?'ok':'espera'}">
        <div class="lsAgFaixa"></div>
        <div class="lsAgCorpo">
          ${ch?'<div class="lsAgCarimbo">chegou</div>':''}
          <div class="lsAgTit">${n}, ${p}</div>
          <div class="lsAgHora">agendada para às ${h}</div>
        </div></div></div>`).join('');
    const cab = doc.querySelector('.lsAgCab em');
    if (cab) cab.innerHTML = `<b>${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</b>`
                           + ` · ${D.clientes.length} de 9 vagas`;
    const anel = doc.querySelector('.lsAgAnel svg circle:last-child');
    if (anel) desenharArco(anel, D.clientes.length/9*100);
    const pc = doc.querySelector('.lsAgAnel em');
    if (pc) pc.textContent = p1(D.clientes.length/9*100);
    doc.querySelectorAll('.lsAgSlot').forEach(s => {
      const c = s.querySelector('.lsAgCard');
      if (c) s.style.height = Math.ceil(c.offsetHeight * 324/425) + 'px';
    });
  }

  /* 9 · mês a mês
     ⚠️ Aqui não dá pra trocar texto: o card fica preso em «lendo o pdv…»
     porque sem PDV ele nunca termina de carregar — não existe linha
     nenhuma pra preencher. Em demo, a tabela é CONSTRUÍDA.
     Cada linha fecha sozinha: sobrou = faturou − custou, e a margem é
     sobrou ÷ faturou. Demo com número que não fecha ensina a cliente a
     desconfiar da tela. */
  const mz = [...doc.querySelectorAll('.cb')].find(c => /Mês a mês/i.test(c.textContent));
  if (mz && !mz.querySelector('.lsMz')){
    mz.innerHTML = `<div class="lsMz">
      <div class="lsMzCab"><b>Mês a mês</b><em>faturamento · custo · o que sobrou</em></div>
      <table>
        <thead><tr><th></th><th>clientes</th><th>faturou</th><th>custou</th>
          <th>sobrou</th><th>margem</th></tr></thead>
        <tbody>${D.meses.map(([m,cli,fat,cus]) => {
          const sob = fat - cus;
          return `<tr><td>${m}</td><td>${cli}</td><td>${brlS(fat)}</td>
            <td class="cus">−${brlS(cus)}</td><td class="sob">${brlS(sob)}</td>
            <td>${p1(sob/fat*100)}</td></tr>`;
        }).join('')}</tbody></table></div>`;
  }
}

/* o arco de um anel já desenhado: muda só o `stroke-dashoffset`.
   ⚠️ SEMPRE o ÚLTIMO circle. O primeiro é o trilho — mexer nele faz todo
   anel aparecer cheio, que é o defeito clássico desta tela. */
function desenharArco(c, pct){
  const r = parseFloat(c.getAttribute('r')); if (!r) return;
  const vol = 2*Math.PI*r;
  c.setAttribute('stroke-dasharray', vol.toFixed(1));
  c.setAttribute('stroke-dashoffset', (vol*(1-Math.max(0,Math.min(100,pct))/100)).toFixed(1));
}

let t = null;
new MutationObserver(() => { clearTimeout(t); t = setTimeout(encher, 60); })
  .observe(document.body, {childList:true, subtree:true});
addEventListener('DOMContentLoaded', () => setTimeout(encher, 400));
setTimeout(encher, 900); setTimeout(encher, 2600);
window.LS_DEMO_OK = true;
})();
