/* ══════════════════════════════════════════════════════════════════════════
   SEU SALÃO AGORA — o card aprovado, desenhado NATIVO em 380×742.
   Medido em 03/09/2026 16:37 nos três nós: agenda, pdv/chegadas, pdv/ordens.
   ⚠️ O clique só existe em quem NÃO CHEGOU: abre o WhatsApp da cliente.
   ⚠️ `tel` vem em dois formatos na agenda — "553186011356" e "31982800941".
      Normalizo: só dígitos, e o 55 entra se faltar. Sem isso o wa.me abre
      conversa com número errado, que é pior que não abrir.
   ══════════════════════════════════════════════════════════════════════════ */
let AGORA_H='--:--';
/* qual dia o card está mostrando, e se é hoje — escritos pelo vivo.js */
let SALAO_DIA='', SALAO_HOJE=true;
/* ⚠️ REMEDIDO às 17:41 — o dia andou 3× durante o trabalho (1 → 6 → 11
   comandas). Painel de salão tem hora, e a hora está escrita na tela.
   ⚠️ A régua de "não chegou" é a do PDV: 45 min de atraso (ATRASO_MIN).
   ⚠️ "Já estou a caminho" NÃO é nome de cliente — é o texto de uma mensagem
      de WhatsApp que foi parar no campo do nome ao abrir a comanda na mão.
      Deixei aparecendo de propósito: esconder faria a tela mentir sobre o
      que está no banco, e é ela quem tem que corrigir na origem. */
let SALAO=[
 {h:'07:00',n:'Stephane Chagas da Silva',      e:'fim',   c:'07:53',s:'10:14',tel:'553184896192'},
 {h:'07:30',n:'Cristina',                      e:'fim',   c:'08:22',s:'09:35',tel:'553181069564'},
 {h:'07:45',n:'Evelly Campos Oliveira',        e:'fim',   c:'07:53',s:'11:16',tel:'553183433836'},
 {h:'08:30',n:'CIDA',                          e:'faltou',tel:'553186011356'},
 {h:'08:30',n:'ANA BEATRIZ',                   e:'fim',   c:null,   s:'13:29',tel:'31996151161'},
 {h:'09:15',n:'Tassiane',                      e:'fim',   c:'09:44',s:'13:31',tel:'31989761138'},
 {h:'10:00',n:'Tâmara Batista do Couto Silva', e:'fim',   c:'09:53',s:'13:29',tel:'553197785714'},
 {h:'10:45',n:'Laleska Papini',                e:'fim',   c:'10:39',s:'13:39',tel:'9983395775'},
 {h:'12:15',n:'Yasmin Araújo Ferreira',        e:'fim',   c:'12:14',s:'14:44',tel:'553182369503'},
 {h:'14:15',n:'Daniela Luiza',                 e:'faltou',tel:'31982800941'},
 {h:'15:15',n:'Cintia',                        e:'atend', c:'14:35',tel:'553193636736'},
 {h:'15:45',n:'Evellyn Vitória',               e:'faltou',tel:'31988497642'},
 {h:'16:45',n:'Talitha Luiza Santos',          e:'atend', c:'16:51',tel:'553184370194'},
 {h:'17:30',n:'Iza',                           e:'vem',   tel:'31996635021'},
 {h:'encaixe',n:'ELIANA',                      e:'fim',   c:null,   s:'16:43',tel:''},
 {h:'encaixe',n:'HELENA',                      e:'fim',   c:null,   s:'16:43',tel:''},
 {h:'encaixe',n:'Já estou a caminho',          e:'fim',   c:null,   s:'17:14',tel:''},
];
/* "sexta-feira, 5 de setembro" — sem depender do fuso do navegador */
function diaPorExtenso(iso){
  if(!iso) return '';
  const [a,m,d]=iso.split('-').map(Number);
  const dt=new Date(Date.UTC(a,m-1,d));
  return dt.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
}
const EST={vem:{r:'Agendada',c:'#9AA3B8'},faltou:{r:'Não chegou',c:'#FF5A3C'},
  atend:{r:'Em atendimento',c:'#FFA51F'},fim:{r:'Finalizada',c:'#22E07A'}};
let FEITO_HOJE = 0;   /* = o faturamento do dia, escrito pelo vivo.js */
const CK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 6 6L20 6"/></svg>';
/* ⚠️ o 55 só entra se faltar; e 13 dígitos com 55 já está completo */
function zap(tel){ let d=String(tel||'').replace(/\D/g,'');
  if(!d.startsWith('55')) d='55'+d; return d; }
function abrirZap(i){
  const c=SALAO[i]; if(c.e!=='faltou') return;
  const t=encodeURIComponent(`Oi ${c.n.split(' ')[0]}! Aqui é do Lavou Tá Liso. `
    +`Vi que seu horário era ${c.h} e você não conseguiu vir. Quer remarcar?`);
  window.open(`https://wa.me/${zap(c.tel)}?text=${t}`,'_blank');
}
function cardSalao(){
  return `
  <!-- ⚠️ O TÍTULO MUDA COM O DIA. Mostrar a agenda de amanhã sob o título
       "Seu salão agora" faria ela ler as clientes de amanhã como as de hoje. -->
  <div class="saTit">${SALAO_HOJE ? 'Seu salão agora' : 'As próximas clientes'}</div>
  <div class="saSub">${SALAO_HOJE
    ? `<b class="num">${AGORA_H}</b> · ${SALAO.length} clientes no dia`
    : `<b>${diaPorExtenso(SALAO_DIA)}</b> · ${SALAO.length} agendadas`}</div>
  <div class="saRolo"><div class="saLst">
  ${SALAO.map((c,i)=>{
    const et=EST[c.e], falt=c.e==='faltou';
    const m=[{r:'chegou',t:c.c,on:!!c.c},
             {r:'em atendimento',t:c.c,on:c.e==='fim'||c.e==='atend'},
             {r:'finalizada',t:c.s,on:c.e==='fim'}];
    return `<div class="saCli${falt?' falt':''}${c.e==='atend'?' viva':''}"
      style="--c:${et.c}" ${falt?`onclick="abrirZap(${i})" title="Chamar no WhatsApp"`:''}>
      <div class="saCab"><span class="saH num">${c.h==='encaixe'?'—':c.h}</span>
        <span class="saN">${c.n}</span>
        ${falt?`<span class="saTag">Não chegou</span>
          <span class="saZap">${I(G.wpp,'#fff')}</span>`:''}</div>
      <div class="saTr">
       ${m.map((k,j)=>`
         ${j?`<i class="saFio${k.on?' on':''}"></i>`:''}
         <span class="saMk">
           <b class="saPt${k.on?' on':''}${falt&&!j?' x':''}">${k.on?CK:(falt&&!j?'!':'')}</b>
           <em class="saR">${k.r}</em>
           <em class="saT num">${k.t||'—'}</em>
         </span>`).join('')}
      </div>
    </div>`;}).join('')}
  </div></div>
  <div class="saPe">${SALAO_HOJE
    ? `<span>Finalizado hoje</span>
       <b class="num">R$ ${FEITO_HOJE.toLocaleString('pt-BR',{minimumFractionDigits:2})}</b>`
    : `<span>Hoje o salão ainda não abriu</span>
       <b class="num">${SALAO.length} marcadas</b>`}</div>`;
}
