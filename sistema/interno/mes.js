/* ══════════════════════════════════════════════════════════════════════════
   MÊS A MÊS — a PLANILHA (opção A, aprovada por ela em 28/10/2026).
   Era um gráfico de 3 barras com leitura por mouse; virou tabela de todos os
   meses medidos, com clientes, faturamento, custo, o que sobrou e a margem.

   ⚠️ NENHUM NÚMERO MORA AQUI. A lista `MES_TAB` nasce vazia e quem a preenche é
      o `_montarMeses()` do vivo.js, lendo pdv/ordens. Antes havia três meses
      chumbados neste arquivo como "valor inicial" — e valor chumbado em tela
      de dinheiro é mentira esperando a hora de aparecer.

   ⚠️ CABE EM 178px (a altura do `.cb`): 5 linhas de 2,5px de respiro + o
      cabeçalho. Medido com 5 meses; no 6º a tabela ganha rolagem própria
      (`.tbMes` tem overflow:auto) em vez de empurrar o card.

   ⭐ CADA LINHA ABRE A GAVETA (ela, 28/10): "ao clicar abrir um card mostrando
      pra onde foi cada coisa". A gaveta usa o MESMO vocabulário dos potes
      (`#veu`/`#gaveta`, `.cdCab`, `.ptLista`) — tela nova com gramática velha.
   ══════════════════════════════════════════════════════════════════════════ */
/* ⚠️ O NOME NÃO PODE SER `MESES`: o dados.js já declara um `const MESES` com
   os três meses chumbados do protótipo, e `let MESES` aqui quebrava a página
   inteira com "Identifier 'MESES' has already been declared" — o caixa nem
   desenhava. Medido no rascunho da Netlify em 28/10/2026, antes de publicar. */
let MES_TAB = [];

function tabelaMes(){
  if(!MES_TAB.length)
    return `<div class="mzLer"><div><div class="mzMes">Mês a mês</div>
      <div class="mzMg vazio">lendo o pdv…</div></div></div>`;
  return `
  <div class="mzLer"><div><div class="mzMes">Mês a mês</div></div>
    <div class="mzMg" style="margin:0">faturamento · custo · o que sobrou</div></div>
  <div class="tbMes"><table class="tbA num">
    <thead><tr><th></th><th>clientes</th><th>faturou</th><th>custou</th><th>sobrou</th><th>margem</th></tr></thead>
    <tbody>${MES_TAB.map((m,i)=>`
      <tr onclick="abrirMes(${i})" title="ver pra onde foi o dinheiro de ${m.nome}"${m.parcial?' class="par"':''}>
        <td class="m">${m.ab}${m.parcial?'<i>*</i>':''}</td>
        <td>${m.n}</td>
        <td>${brl(m.fat)}</td>
        <td class="c">−${brl(m.custo)}</td>
        <td class="l">${brl(m.lucro)}</td>
        <td>${p1(m.marg)}%</td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

/* ⚠️ O NOME ANTIGO CONTINUA EXISTINDO. O corpo.js chama `graficoMes()` e o
   caixa.html chama `ligarMes()` — trocar os dois pontos de chamada só pra
   renomear seria mexer em arquivo que não precisa mudar. */
function graficoMes(){ return tabelaMes(); }
function ligarMes(){ /* o clique vai no onclick da linha; nada a ligar */ }

/* ══ a gaveta: pra onde foi o dinheiro do mês ══════════════════════════════
   A regra do financeiro vale aqui: as PARCELAS aparecem e a soma delas é
   conferida contra o faturamento na própria tela. Se não fechar, a tela diz —
   lista que soma diferente do número de cima é pior do que não ter lista. */
function abrirMes(i){
  const m = MES_TAB[i]; if(!m) return;
  const soma = _c2(m.equipe + m.produto + m.oper + m.lucro);
  const dif  = _c2(soma - m.fat);
  const pc   = v => m.fat ? (v/m.fat*100) : 0;
  const linha = (cor,nome,detalhe,valor,cls) => `
    <div class="exL mesL">
      <span class="mesPt" style="background:${cor}"></span>
      <span class="exN">${nome}<em>${detalhe}</em></span>
      <span class="exV ${cls||'sai'}">${cls==='ent'?'':'− '}${brl(Math.abs(valor))}
        <u>${p1(pc(valor))}%</u></span>
    </div>`;

  const profs = Object.entries(m.prof||{})
    .filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);

  document.getElementById('gaveta').innerHTML = `
    <div class="cdCab"><i style="background:#4C8DFF"></i><b>${m.nome}${m.parcial?' (até hoje)':''}</b>
      <button class="gx" onclick="fecharSaida()">✕</button></div>

    <div class="cdOlho">O que o salão faturou</div>
    <div class="cdNum"><span>R$</span>${brl(m.fat)}</div>

    <div class="cdPills">
      <span class="cdPill ent">${m.n} clientes</span>
      <span class="cdPill">${m.dias} dias abertos</span>
      <span class="cdPill">margem ${p1(m.marg)}%</span>
    </div>

    <div class="ptNota">Pra onde foi cada real deste mês — as quatro parcelas
      somam exatamente o faturamento de cima.</div>

    ${Math.abs(dif) >= 0.02 ? `<div class="ptErro">As parcelas somam
      <b>R$ ${brl(soma)}</b> e o faturamento é <b>R$ ${brl(m.fat)}</b> —
      diferença de R$ ${brl(Math.abs(dif))}. Me avise, isso é defeito meu.</div>` : ''}

    <div class="ptLista">
      ${linha('#FF2D9B','Equipe', `mão de obra ${brl(m.mo)} + bônus 8% ${brl(m.bonus)} + 2ª unidade ${brl(m.invest)}`, m.equipe)}
      ${linha('#FFB04C','Produto', `R$ 80 × ${m.eleg} procedimento${m.eleg===1?'':'s'}`, m.produto)}
      ${linha('rgba(255,255,255,.55)','Operacional', `${m.diasCusto} dias de contas fixas`, m.oper)}
      ${linha('#4C8DFF','Sobrou (lucro)', `${p1(m.marg)}% do que entrou`, m.lucro, 'ent')}
    </div>

    ${profs.length ? `
      <div class="ptNota" style="margin-top:12px">Dentro de <b>Equipe</b>, quem recebeu:</div>
      <div class="ptLista">
        ${profs.map(([quem,v]) => `<div class="exL">
            <span class="exN">${String(quem).replace(/</g,'&lt;')}</span>
            <span class="exV sai">− ${brl(v)}</span>
          </div>`).join('')}
      </div>` : ''}`;
  document.getElementById('veu').classList.add('on');
}

/* arredondamento de dinheiro próprio — o `c2` do vivo.js não está neste escopo
   em toda ordem de carregamento, e um centavo errado aqui vira "não fecha" */
function _c2(v){ return Math.round((Number(v)||0)*100)/100; }
