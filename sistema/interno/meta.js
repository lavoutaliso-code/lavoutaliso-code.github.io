/* ══════════════════════════════════════════════════════════════════════════
   META DO MÊS — base +10% sobre o último mês fechado.
   ⚠️ A "% saudável" NÃO é medição, é decisão. +10% é uma escolha, ancorada
      no último mês fechado (agosto, R$ 62.413,20). Está escrito no card de
      onde ela vem, pra ninguém achar que saiu de uma medição.
   ⚠️ NO SVG, SEMPRE toFixed — nunca toLocaleString. A vírgula do português
      transforma "10,1 89,9" em QUATRO números e o anel desenha quase cheio
      mostrando 10,1% do lado. Já aconteceu neste painel.
   ══════════════════════════════════════════════════════════════════════════ */
const MT={
  base:62413.20, baseRot:'agosto', pc:10,
  feito:6938.20, dias:3, diasMes:22,       // setembro, ter a sáb
  ritmoBase:62413.20/22,                    // 2.836,96/dia em agosto
};
MT.alvo   = MT.base*(1+MT.pc/100);          // 68.654,52
MT.faltam = MT.diasMes - MT.dias;           // 19
MT.ritmo  = MT.feito/MT.dias;               // 2.312,73
MT.proj   = MT.ritmo*MT.diasMes;            // 50.880,13
MT.precisa= (MT.alvo-MT.feito)/MT.faltam;   // 3.248,23
MT.andar  = MT.feito/MT.alvo*100;           // 10,1%
MT.noCaminho = MT.proj >= MT.alvo;

function cardMeta(){
  return `
  <div class="mtTop"><span class="mtTit">Meta de setembro</span>
    <span class="mtSeta">›</span></div>
  <div class="mtAro">
    <svg viewBox="0 0 100 100" style="transform:rotate(-90deg)">
      <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/>
      <circle cx="50" cy="50" r="43" fill="none" stroke="#C7F636" stroke-width="10"
        pathLength="100" stroke-dasharray="${MT.andar.toFixed(2)} ${(100-MT.andar).toFixed(2)}"
        stroke-linecap="round"/>
    </svg>
    <span><em>atingido</em><b class="fina">${p1(MT.andar)}%</b></span>
  </div>
  <div class="mtValor"><em>meta</em><small>R$</small>${brl0(MT.alvo)}</div>
  <div class="mtPe">
    <span class="mtPc">+${MT.pc}% <em>sobre ${MT.baseRot}</em></span>
    <span class="mtDias"><b class="num">${MT.faltam}</b> <em>dias</em></span>
  </div>`;
}
function cardMetaCheio(){
  const dif=(MT.proj/MT.alvo-1)*100;
  return `
   <div class="mcTop"><span class="mcTit">Meta de setembro</span>
     <button class="mcX" onclick="mtFechar()">✕</button></div>
   <div class="mcAlvo"><em>meta · +${MT.pc}% sobre ${MT.baseRot}</em>
     <b class="fina"><small>R$</small>${brl(MT.alvo)}</b></div>

   <div class="mcVer ${MT.noCaminho?'bom':'ruim'}">
     <b>${MT.noCaminho?'✓ No caminho':'✕ Fora do caminho'}</b>
     <span>No ritmo de agora o mês fecha em <b class="num">R$ ${brl0(MT.proj)}</b> —
       <b class="num">${p1(Math.abs(dif))}% ${dif<0?'abaixo':'acima'}</b> da meta.</span>
   </div>

   <div class="mcL"><em>feito até agora</em><b class="num">R$ ${brl(MT.feito)}</b>
     <span class="num">${p1(MT.andar)}% da meta</span></div>
   <div class="mcL"><em>falta fazer</em><b class="num">R$ ${brl(MT.alvo-MT.feito)}</b>
     <span class="num">em ${MT.faltam} dias</span></div>

   <div class="mcR">
     <div class="mcRi"><em>precisa por dia</em><b class="num">R$ ${brl0(MT.precisa)}</b></div>
     <div class="mcRi"><em>está fazendo</em><b class="num ruimT">R$ ${brl0(MT.ritmo)}</b></div>
     <div class="mcRi"><em>fazia em ${MT.baseRot}</em><b class="num">R$ ${brl0(MT.ritmoBase)}</b></div>
   </div>
   <div class="mcAv">⚠️ O ritmo de setembro está <b>${p1(Math.abs(MT.ritmo/MT.ritmoBase*100-100))}% abaixo</b>
     do de ${MT.baseRot} — antes mesmo de crescer os ${MT.pc}%.</div>`;
}
function mtAbrir(){ const v=document.getElementById('mtVeu');
  v.querySelector('.mtCheio').innerHTML=cardMetaCheio(); v.classList.add('on'); }
function mtFechar(e){ if(e&&e.target&&e.target.id!=='mtVeu'&&!e.target.classList.contains('mcX'))return;
  document.getElementById('mtVeu').classList.remove('on'); }
