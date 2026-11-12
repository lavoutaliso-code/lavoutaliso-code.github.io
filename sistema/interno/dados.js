/* MEDIDO do banco em 03/09/2026 — pdv/ordens, agenda, funil_site.
   ⚠️ O dia ANDOU no meio do trabalho: de manhã era 1 comanda / R$105,00 e
   depois 6 / R$1.944,50, e às 17:41 já eram 11 / R$3.124,20.
   ⚠️ FONTE ÚNICA: o faturamento de hoje mora SÓ no hoje.js (HJ.fat). Aqui
      ficava uma segunda cópia, e as duas divergiram na tela — o topo dizia
      3.124,20 e o card azul 1.944,50, na mesma tela. Número duplicado é
      número que vai divergir. */
/* ⚠️ A JANELA COMEÇA EM 02/09/2026 (ordem dela). Tudo que é "o período" no
   painel é daqui pra frente — agosto virou histórico e só sobrevive no
   gráfico mês a mês e como base da meta.
   Medido em 03/09: 2 dias abertos, 17 comandas. */
/* ⚠️ O BÔNUS DE R$28 FOI DIVIDIDO (ordem dela, 03/09):
     R$  8,96 → bônus da equipe   (8% da mão de obra, que é a regra real)
     R$ 19,04 → investimento 2ª unidade
   O PDV descontava os R$28 inteiros como "bônus" — 25% da mão de obra, não
   8%. O dinheiro já saía do lucro; agora ele tem NOME e destino.
   ⚠️ O LUCRO NÃO MUDA com isso: 8,96 + 19,04 = 28,00. O que muda é que
      R$ 19,04 por procedimento deixa de sumir dentro de "bônus" e passa a
      ser um pote com dono.
   ⚠️ E o bônus de 8% é CONDICIONAL: só recebe quem não teve reclamação na
      semana (Cliente Feliz). O custo real é ≤ 8,96.
   Janela 02/09 → hoje: 12 procedimentos elegíveis. */
const BONUS_UN=8.96, INVEST_UN=19.04;
/* ⚠️ ERA `const PROCED=12`. O número de procedimentos muda toda vez que
   fecha uma comanda — durante a própria auditoria de 03/09 ele andou. Quem
   escreve é o vivo.js, lendo o pdv/ordens. */
let PROC_N = 12;
/* ⚠️ O SINAL DE R$80 SE DIVIDE (ordem dela, 03/09):
     R$ 17 marketing · R$ 20 investimento 2ª unidade · R$ 43 estoque
   ⚠️ ESCOLHI A LEITURA QUE NÃO CONTA O DINHEIRO DUAS VEZES. O sinal já está
      dentro do preço (é parte dos R$349,90), então ele não é dinheiro a mais:
      é o pote PRODUTO se dividindo em três. A prova é aritmética —
      17+20+43 = 80, exatamente o custo de produto por procedimento.
      Tratar como dinheiro à parte faria os potes somarem R$ 6.013,80 contra
      um faturamento de R$ 4.653,80.
   ⚠️ O LUCRO NÃO MUDA: R$ 903,80. O produto já saía do lucro; agora sai com
      três nomes em vez de um. */
const SIN_MKT=17, SIN_INV=20, SIN_EST=43;
const M={rot:'desde 2 de setembro', curto:'2 set →',
  fat:0, mo:0, bonus:0, equipe:0, estoque:0, marketing:0, invest:0,
  produto:0, operacional:0, imposto:0, lucro:0, dias:0, comandas:0, eleg:0};
/* ⚠️ TODOS OS CAMPOS NASCEM EM ZERO. Antes eles nasciam com a medição de
   03/09 escrita à mão, e se o vivo.js falhasse a tela mostrava números
   velhos com cara de novos — que é pior do que não mostrar nada. Zerado,
   uma falha de carga aparece na hora. */
const MESES=[{r:'Jun',fat:49715.40,lucro:11917.40},{r:'Jul',fat:64777.80,lucro:13627.80},
  {r:'Ago',fat:62413.20,lucro:12841.20,on:true},{r:'Set',fat:3124.20+3919.00,lucro:139.00,parc:true}];
const HOJE={rot:'quinta-feira, 3 de setembro',comandas:11,   /* fat vem do HJ */
  agenda:{total:12,site:4,lailla:7,sem:1},funil:{visitas:25,abriuAgenda:8,escolheuHorario:3}};
/* formas de pagamento — `pgto` é string, e "Dinheiro R$49,90" traz o valor colado */
const FORMAS=[{n:'Pix',v:3114.10,c:'#3057C9'},{n:'Stone Déb.',v:729.80,c:'#5170E5'},
  {n:'Dinheiro',v:664.90,c:'#99B0FE'},{n:'Stone Créd.',v:65.00,c:'#C9DBFF'}];
/* ⚠️ na janela nova as formas somam 4.573,80 e o faturamento é 4.653,80 —
   sobram R$ 80,00 sem forma registrada (era R$1.200 em agosto). */
/* na janela nova as formas somam 4.573,80 contra 4.653,80 de faturamento:
   sobram R$ 80,00 sem forma registrada (em agosto eram R$ 1.200,00). */
const SEM_FORMA=4653.80-4573.80;
const FORMAS_HOJE=[{n:'Pix',v:1214.70},{n:'Stone Déb.',v:379.90},{n:'Dinheiro',v:349.90}];
const POTES=[
 {k:'lucro', n:'Lucro líquido', c:'#C7F636', v:M.lucro},
 {k:'equipe',n:'Equipe',        c:'#3057C9', v:M.equipe},
 {k:'prod',  n:'Produto',       c:'#5170E5', v:M.produto},
 {k:'oper',  n:'Operacional',   c:'#99B0FE', v:M.operacional},
 {k:'imp',   n:'Imposto',       c:'#FF6B5A', v:M.imposto},
 {k:'mkt',   n:'Marketing',     c:'#8FA6F5', v:null},
 {k:'inv',   n:'Investimento',  c:'#C084FC', v:null},
];
const brl=v=>v==null?null:v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const brl0=v=>v==null?null:v.toLocaleString('pt-BR',{maximumFractionDigits:0});
const pc=(v,t)=>v/t*100, p1=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
function anel(p,tam,esp,cor,trilho){
  p=Math.max(0,Math.min(100,p||0));
  const r=(tam-esp)/2,c=2*Math.PI*r,off=c*(1-p/100),h=tam/2;
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
   <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${trilho||'rgba(255,255,255,.22)'}" stroke-width="${esp}"/>
   <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${cor}" stroke-width="${esp}"
    stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
    transform="rotate(-90 ${h} ${h})"/></svg>`;
}

/* ── o que o card aprovado precisa e morava no base.js dele ──
   SALDO DISPONÍVEL = faturamento − o que já saiu (equipe + produto + operacional).
   ⚠️ O imposto NÃO entra: ele está reservado a pagar, não gasto. Se um dia
      entrar, o saldo cai de R$ 12.841,20 para R$ 9.096,41. */
let SAIU, SALDO;
function recalcDerivados(){
  SAIU  = M.equipe + M.produto + M.operacional;
  SALDO = M.fat - SAIU;
  if(typeof HJ==='object' && HJ) HJ.marg = HJ.fat ? HJ.lucro/HJ.fat*100 : 0;
}
recalcDerivados();
