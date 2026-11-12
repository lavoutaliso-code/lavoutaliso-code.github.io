/* ══════════════════════════════════════════════════════════════════════════
   CONTAS A PAGAR — e o custo diário que sai delas.

   ORDEM DELA, 03/09: "quando eu atualizar o contas a pagar, atualize o
   desconto do lucro do dia". Então este arquivo deixou de ser um card que
   mostra contas e virou a FONTE do custo de funcionamento:

       soma das contas do mês  ÷  dias em que o salão abre (ter a sáb)
                            =  custo diário
       custo diário × dias abertos =  o que sai do lucro

   Mexeu numa conta aqui, o lucro do dia e o do período mudam na mesma hora.
   Quem religa a conta é o aplicarCusto(), em vivo.js.

   ⚠️ ANTES ERA UMA CONSTANTE DE R$ 464 E O CARD MENTIA POR OMISSÃO. Com a
      lista vazia o card mostrava "—" no custo diário enquanto o lucro
      descontava 464 caladinho, todo dia. Agora, sem conta lançada, o card
      mostra os R$ 464 E DIZ que é herdado — o número que sai do lucro é o
      número que está escrito na tela.

   ⚠️ O DIVISOR É "terça a sábado", regra dela. O PDV divide por "dias com
      comanda", e em junho e agosto o salão abriu 1 dia a mais que a grade.
      Os dois números existem e são diferentes; aqui vale o dela.

   ⚠️ AS CONTAS FICAM NO BANCO, em `financeiro/contas_fixas/AAAA-MM`. Sem
      isso, "atualizar" duraria até ela fechar a aba. O banco é aberto — não
      pede credencial pra ler nem pra escrever — e isso vale pro salão
      inteiro, não só pra este nó. Está registrado como problema à parte.

   ⚠️ CADA MÊS TEM SUA LISTA. Setembro não herda agosto sozinho: o botão
      "repetir as do mês passado" existe pra ela decidir. Copiar automático
      faria uma conta que ela cancelou voltar do túmulo todo dia 1º.
   ══════════════════════════════════════════════════════════════════════════ */
const CUSTO_HERDADO_DIA = 464;   /* o que as contas fixas dela dão hoje */
const CT_NO = 'financeiro/contas_fixas';

function ctChave(d){ d = d || new Date(Date.now()-3*3600e3);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; }
function ctDiasUteis(chave){
  const [a,m] = chave.split('-').map(Number);
  let n=0; const u=new Date(Date.UTC(a,m,0)).getUTCDate();
  for(let d=1; d<=u; d++){ const w=new Date(Date.UTC(a,m-1,d)).getUTCDay();
    if(w>=2 && w<=6) n++; }                      /* terça(2) a sábado(6) */
  return n;
}
let CT_MESK = ctChave();
let CT_D    = ctDiasUteis(CT_MESK);              /* setembro/2026 = 22 */
let CT = [];
let CT_ANTERIOR = [];                            /* o mês passado, pra repetir */

/* ⚠️ O CUSTO DE CADA MÊS É O DAQUELE MÊS.
   `ctDiario()` lê `CT`, que é sempre o mês CORRENTE — e `_fechar` usava
   esse número para fechar junho, julho e agosto também. Medido em
   19/09/2026, contra o painel das empresas (que já lê o custo por mês):

     junho   caixa R$ 13.761,24 · painel R$ 14.535,80 · −R$   774,56
     julho   caixa R$ 12.815,74 · painel R$ 13.880,76 · −R$ 1.065,02
     agosto  caixa R$ 12.117,87 · painel R$ 13.134,48 · −R$ 1.016,61
     setembro                            iguais          R$     0,00

   São 59 dias errados por exatamente R$ 48,41 — a diferença entre os
   R$ 512,41 de setembro e o herdado. E a regra já estava escrita aqui:
   `CUSTO_HERDADO_DIA` vale "só enquanto não houver conta lançada no mês".
   Junho, julho e agosto não têm conta lançada; setembro tem. Aplicar
   setembro para trás afirma um custo que ninguém mediu.

   `CT_MESES` guarda a diária de cada mês que TEM conta. Quem não está
   no mapa usa o herdado — que é o que a regra manda. */
let CT_MESES = {};
const ctDiarioDe = mes => {
  if (!mes) return ctDiario();
  if (mes === CT_MESK) return ctDiario();     /* o corrente pode estar sendo editado */
  const t = CT_MESES[mes];
  return t ? Math.round(t / ctDiasUteis(mes) * 100) / 100 : CUSTO_HERDADO_DIA;
};

const ctTotal  = () => CT.reduce((s,c)=>s+(Number(c.v)||0), 0);
const ctPago   = () => CT.filter(c=>c.pago).reduce((s,c)=>s+(Number(c.v)||0), 0);
/* ⚠️ É ESTA FUNÇÃO QUE O LUCRO LÊ. Sem conta, devolve o herdado. */
const ctDiario = () => { const t=ctTotal();
  return t ? Math.round(t/CT_D*100)/100 : CUSTO_HERDADO_DIA; };
const ctHerdado = () => ctTotal() === 0;

const CT_EX=[
 {dia:5,n:'Aluguel',v:3800,pago:true},{dia:8,n:'Energia',v:1240,pago:true},
 {dia:10,n:'Água',v:310,pago:false},{dia:12,n:'Internet',v:390,pago:true},
 {dia:15,n:'Contador',v:680,pago:false},{dia:20,n:'Sistema e site',v:298,pago:false},
 {dia:25,n:'Limpeza',v:1600,pago:false},{dia:28,n:'Descartáveis',v:890,pago:false},
];

/* ── banco ────────────────────────────────────────────────────────────── */
function ctMesAntes(chave){ let [a,m]=chave.split('-').map(Number);
  m--; if(m===0){m=12;a--;} return `${a}-${String(m).padStart(2,'0')}`; }
async function ctCarregar(){
  CT_MESK = ctChave(); CT_D = ctDiasUteis(CT_MESK);
  /* ⚠️ o total de CADA mês que tem conta — uma leitura só, e o nó é
     pequeno (hoje: um mês). Sem isso, `ctDiarioDe` não teria como saber
     o custo de um mês que não é o corrente. */
  try{
    const todos = await fetch(`${DBURL}/${CT_NO}.json`).then(r=>r.json());
    CT_MESES = {};
    for(const [mes, itens] of Object.entries(todos||{})){
      const t = Object.values(itens||{}).filter(Boolean)
        .reduce((s,c)=>s+(Number(c.v)||0), 0);
      if(t) CT_MESES[mes] = t;
    }
  }catch(e){ CT_MESES = {}; }
  try{
    const [atual, antes] = await Promise.all([
      fetch(`${DBURL}/${CT_NO}/${CT_MESK}.json`).then(r=>r.json()),
      fetch(`${DBURL}/${CT_NO}/${ctMesAntes(CT_MESK)}.json`).then(r=>r.json()),
    ]);
    CT = Object.values(atual||{}).filter(Boolean)
      .map(c=>({dia:Number(c.dia)||1, n:String(c.n||''), v:Number(c.v)||0, pago:!!c.pago}));
    CT_ANTERIOR = Object.values(antes||{}).filter(Boolean)
      .map(c=>({dia:Number(c.dia)||1, n:String(c.n||''), v:Number(c.v)||0, pago:false}));
  }catch(e){ CT=[]; CT_ANTERIOR=[]; }
}
/* ⚠️ GRAVA E SÓ DEPOIS REDESENHA. Se a gravação falhar, a tela não pode
   ficar mostrando uma conta que o banco não tem — ela voltaria no próximo
   carregamento e a pessoa acharia que o app "esqueceu". */
async function ctSalvar(){
  const antes = CT.map(c=>({...c}));
  try{
    const r = await fetch(`${DBURL}/${CT_NO}/${CT_MESK}.json`,
      {method:'PUT', body:JSON.stringify(CT)});
    if(!r.ok) throw new Error('HTTP '+r.status);
  }catch(e){
    CT = antes;
    alert('Não consegui gravar a conta no banco: '+(e.message||e)+
          '\nNada foi mudado. Tenta de novo.');
    ctRefazer(); return false;
  }
  return true;
}

/* ── o elo com o lucro ────────────────────────────────────────────────── */
/* ⚠️ NÃO REDESENHA SÓ O CARD DAS CONTAS. Mudar uma conta muda o custo
   diário, que muda o operacional, o lucro do período, o lucro de hoje e a
   margem do topo — três cards diferentes. Redesenhar só este deixaria a
   tela discordando dela mesma até o próximo recarregamento. */
/* ⚠️ UM SÓ REDESENHO PRA TUDO. Contas a pagar e saídas mexem nos MESMOS
   números (anéis, bolinhas, topo), e ter dois caminhos de redesenho é ter
   duas chances de a tela discordar dela mesma. */
function repintarTudo(){ ctRefazer(); }
function ctRefazer(){
  if(typeof aplicarCusto === 'function') aplicarCusto();
  if(typeof aplicarSaidas === 'function') aplicarSaidas();
  const mini  = document.querySelector('.contas');  if(mini)  mini.innerHTML = cardContasMini();
  const cheio = document.querySelector('.ctCheio'); if(cheio) cheio.innerHTML = cardContas();
  const topo  = document.querySelector('.hoje');    if(topo)  topo.innerHTML  = topoHoje();
  const palco = document.querySelector('.palcoA');  if(palco) palco.innerHTML = miolo();
  const cab = document.querySelector('.cabSaldo');
  if(cab){
    const v = cab.querySelector('.saldo .v');
    if(v) v.innerHTML = SALDO_MEDINDO
      ? '<em class="medindo">medindo…</em>'
      : `<span class="cif">R$</span>${brl(SALDO_TOTAL)}`;
    const bol = cab.querySelector('.ondes');
    if(bol) bol.outerHTML = bolinhas();
  }
}

/* ── os cards ─────────────────────────────────────────────────────────── */
function cardContasMini(){
  const pend = CT.filter(c=>!c.pago).length;
  return `<span class="ctEl">${elContas(54)}</span>
    <span class="ctMid">
      <span class="ctTit">Contas<br>a pagar</span>
      <span class="ctVal">
        <b class="fina"><small>R$</small>${brl0(ctDiario())}</b>
        <em>custo diário${ctHerdado()?' · herdado':''}</em></span>
    </span>
    ${pend?`<span class="ctBadge num">${pend}</span>`:''}`;
}
function cardContas(){
  const tot=ctTotal(), pg=ctPago(), pc=tot?pg/tot*100:0;
  return `
  <div class="ctTop">
    <span class="ctEl">${elContas(46)}</span>
    <span class="ctTit">Contas<br>a pagar</span>
    <button class="ctAdd" onclick="ctNova()" title="lançar nova conta">+</button>
  </div>
  <div class="ctAro">
    <svg viewBox="0 0 100 100" style="transform:rotate(-90deg)">
      <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="9"/>
      <circle cx="50" cy="50" r="43" fill="none" stroke="#C7F636" stroke-width="9"
        pathLength="100" stroke-dasharray="${pc.toFixed(2)} ${(100-pc).toFixed(2)}"
        stroke-linecap="round"/>
    </svg>
    <span><em>custo diário</em>
      <b class="fina"><small>R$</small>${brl0(ctDiario())}</b></span>
  </div>
  <div class="ctSub">${tot
    ? `R$ ${brl0(tot)} ÷ <b>${CT_D} dias</b> · ter a sáb`
    : `<b>herdado</b> · sai do lucro todo dia`}</div>
  ${tot ? `<div class="ctPg"><b>${p1(pc)}%</b> pago · falta <b>R$ ${brl0(tot-pg)}</b></div>`
        : `<div class="ctPg">lance as contas e este número passa a ser o delas</div>`}
  <div class="ctRolo">${CT.length
    ? CT.map((c,i)=>({c,i})).sort((a,z)=>a.c.dia-z.c.dia).map(({c,i})=>`
      <div class="ctL${c.pago?' pago':''}">
        <span class="ctCk" onclick="ctPagar(${i})" title="marcar como paga">${c.pago
          ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 6 6L20 6"/></svg>':''}</span>
        <span class="ctD num">${String(c.dia).padStart(2,'0')}</span>
        <span class="ctN" onclick="ctEditar(${i})" title="mudar valor ou dia">${c.n}</span>
        <span class="ctV num" onclick="ctEditar(${i})">${brl0(c.v)}</span>
        <button class="ctDel" onclick="ctRemover(${i})" title="apagar esta conta">✕</button>
      </div>`).join('')
    : `<div class="ctVazio">Nenhuma conta lançada.<br>
         O lucro está descontando <b>R$ ${brl0(CUSTO_HERDADO_DIA)}</b> por dia.</div>`}
  </div>
  ${!CT.length && CT_ANTERIOR.length
    ? `<button class="ctNova" onclick="ctRepetir()">repetir as ${CT_ANTERIOR.length} do mês passado</button>` : ''}
  <button class="ctNova" onclick="ctNova()">+ nova conta</button>`;
}

/* ── ações ────────────────────────────────────────────────────────────── */
function ctAbrir(){ const v=document.getElementById('ctVeu');
  v.querySelector('.ctCheio').innerHTML=cardContas(); v.classList.add('on'); }
function ctFechar(e){ if(e&&e.target&&e.target.id!=='ctVeu'&&!e.target.classList.contains('ctX'))return;
  document.getElementById('ctVeu').classList.remove('on'); }

async function ctPagar(i){ if(!CT[i]) return;
  CT[i].pago = !CT[i].pago; if(await ctSalvar()) ctRefazer(); }
/* ⚠️ vírgula OU ponto: ela digita "1.240,50" e também "1240.5" */
const ctValor = s => parseFloat(String(s||'').trim()
  .replace(/\s|R\$/g,'').replace(/\.(?=\d{3}\b)/g,'').replace(',','.'));
async function ctNova(){
  const n = prompt('Nome da conta:'); if(!n) return;
  const d = parseInt(prompt('Dia do vencimento (1–31):'),10);
  const v = ctValor(prompt('Valor do mês:'));
  if(!(d>=1&&d<=31) || !Number.isFinite(v) || v<=0){
    alert('Precisa de um dia entre 1 e 31 e um valor maior que zero.'); return; }
  CT.push({dia:d, n:String(n).trim(), v:Math.round(v*100)/100, pago:false});
  if(await ctSalvar()) ctRefazer();
}
async function ctEditar(i){ const c=CT[i]; if(!c) return;
  const v = ctValor(prompt(`Valor de ${c.n}:`, brl(c.v)));
  if(!Number.isFinite(v) || v<=0) return;
  const d = parseInt(prompt('Dia do vencimento (1–31):', c.dia),10);
  c.v = Math.round(v*100)/100; if(d>=1&&d<=31) c.dia=d;
  if(await ctSalvar()) ctRefazer();
}
async function ctRemover(i){ const c=CT[i]; if(!c) return;
  if(!confirm(`Apagar "${c.n}" de R$ ${brl(c.v)}?\nO custo diário e o lucro mudam.`)) return;
  CT.splice(i,1); if(await ctSalvar()) ctRefazer();
}
async function ctRepetir(){
  if(!CT_ANTERIOR.length) return;
  if(!confirm(`Trazer as ${CT_ANTERIOR.length} contas do mês passado, todas como não pagas?`)) return;
  CT = CT_ANTERIOR.map(c=>({...c, pago:false}));
  if(await ctSalvar()) ctRefazer();
}
