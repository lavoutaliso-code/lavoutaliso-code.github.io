/* ══════════════════════════════════════════════════════════════════════════
   EXTRATO GERAL — clicar no saldo e ver TUDO que entrou e saiu
   ══════════════════════════════════════════════════════════════════════════
   A DONA (09/09/2026): "no caixa, coloque uma função pra clicar no saldo e ver
   todas as entradas e saídas pois estou ficando perdida."

   O que já existia: cada bolinha (Nubank, Asaas, Sicredi, Dinheiro) abria o
   extrato DAQUELA conta. O que faltava era o de cima: o número grande somava
   as contas e não abria nada — pra saber de onde ele veio, ela tinha que
   abrir quatro gavetas e juntar de cabeça.

   ⚠️ ESTA TELA NÃO CALCULA NADA NOVO. Ela lê exatamente as mesmas listas que
   as gavetas de conta já mostram (`EXTRATO[k].ent` e `.sai`, montadas em
   vivo.js e completadas em saidas.js). Se ela inventasse uma conta própria,
   um dia o total daqui divergiria do total de lá — e aí a tela que existe pra
   tirar a dúvida passaria a criar dúvida. Ver [[auditoria-do-caixa]].

   ⚠️ AS ABERTURAS NÃO ENTRAM NA LISTA, e isso é de propósito. Abertura é o
   dinheiro que a conta JÁ TINHA antes de 2 de setembro — não é movimento, não
   tem dia e não tem nome. Ela aparece no resumo de cima, com nome, porque
   sem ela a soma "entrou − saiu" não fecha com o saldo e a tela pareceria
   errada.

   ⚠️ TRANSFERÊNCIA NÃO É SAÍDA e continua fora daqui. É o mesmo dinheiro
   mudando de conta; contar como saída faria o mesmo real sumir duas vezes.
   Ela vive na gaveta do Asaas, à parte, como sempre viveu.
   ══════════════════════════════════════════════════════════════════════════ */

/* ⛔ O FILTRO "SÓ ENTRADAS / SÓ SAÍDAS" CAIU EM 18/09/2026. Ela: *"coloque
   também os extratos das categorias, ser um extrato único, sem entradas e
   saídas separados."* Dinheiro do dia é uma linha do tempo só — separar em duas
   listas obriga a juntar de cabeça, que é justamente o que esta tela existe pra
   evitar. Entrada e saída convivem na mesma lista, com sinal. */
let _egConta = 'todas';   /* todas · nubank · asaas · sicredi · dinheiro · processando */
/* ⭐ E AS CATEGORIAS ENTRARAM AQUI. `null` = a tela olha as CONTAS (onde o
   dinheiro está); com um pote escolhido, ela olha a CATEGORIA (pra que o
   dinheiro é). São duas perguntas diferentes sobre o mesmo dinheiro, e agora
   as duas se respondem sem trocar de gaveta.
   ⚠️ NADA É RECALCULADO: a lista da categoria é a MESMA do `poteExtrato()` que
   o anel já abre. Se esta tela fizesse conta própria, um dia divergiria da
   outra — e a tela que tira dúvida passaria a criar dúvida. */
let _egCat = null;
let _egBusca = '';

/* ⚠️ ORDENAR POR 'DD/MM' EM TEXTO DÁ ORDEM ERRADA na virada do ano: '02/01'
   viria antes de '28/12' porque 0 < 2. Aqui o dia vira número, e o ano sai da
   janela: mês menor que o mês de início é do ano seguinte. */
function egOrdem(d, h) {
  const s = String(d || ''), dd = +s.slice(0, 2) || 0, mm = +s.slice(3, 5) || 0;
  const anoI = +INICIO.slice(0, 4), mesI = +INICIO.slice(5, 7);
  const ano = mm >= mesI ? anoI : anoI + 1;
  const p = String(h || '').split(':');
  return ano * 1e8 + mm * 1e6 + dd * 1e4 + (+p[0] || 0) * 100 + (+p[1] || 0);
}

/* ⚠️ O VALOR COM SINAL, num lugar só. Saída é negativa; entrada é positiva —
   MENOS quando o próprio lançamento já vem negativo (remanejamento entre potes,
   como a bonificação perdida). Espalhar essa regra por três lugares foi o que
   produziu o "+ −175,68". */
const egVal = x => (x.tipo === 'sai' ? -Math.abs(Number(x.v) || 0) : (Number(x.v) || 0));

function egLinhas() {
  const out = [];
  ONDE.forEach(o => {
    const E = EXTRATO[o.k]; if (!E) return;
    (E.ent || []).forEach(x => out.push({ ...x, k: o.k, conta: o.n, cor: o.c, tipo: 'ent', ord: egOrdem(x.d, x.h) }));
    (E.sai || []).forEach(x => out.push({ ...x, k: o.k, conta: o.n, cor: o.c, tipo: 'sai', ord: egOrdem(x.d, x.h) }));
  });
  /* mais novo em cima: é o que ela quer ver primeiro quando abre */
  out.sort((a, b) => b.ord - a.ord);
  return out;
}

/* as linhas de UMA CATEGORIA, na mesma forma das linhas de conta */
const EG_POTES = [['lucro','Lucro'],['equipe','Equipe'],['estoque','Estoque'],
                  ['marketing','Marketing'],['oper','Operacional'],
                  ['invest','Investimento'],['imposto','Imposto']];
function egLinhasCat(k) {
  const E = poteExtrato(k);
  const cor = brc(CORES[k === 'oper' ? 'oper' : k === 'estoque' ? 'produto' : k] || CORES.lucro);
  const nome = (NOMES[k] || k).replace(' · 2ª unidade', '');
  return (E.tudo || []).map(x => ({ ...x, k, conta: nome, cor,
      tipo: x.t === 's' ? 'sai' : 'ent', ord: egOrdem(x.d, x.h) }))
    .sort((a, b) => b.ord - a.ord);
}

function egFiltradas(todas) {
  const b = _egBusca.trim().toLowerCase();
  return todas.filter(x =>
    (_egCat || _egConta === 'todas' || x.k === _egConta) &&
    (!b || String(x.n || '').toLowerCase().includes(b) || String(x.f || '').toLowerCase().includes(b)));
}

function egConta(k) { _egCat = null; _egConta = k; egPintar(); }
/* ⚠️ ESCOLHER CATEGORIA LIMPA A CONTA, e vice-versa. Os dois filtros ligados ao
   mesmo tempo dariam "Estoque no Nubank" — uma pergunta que a lista da categoria
   não sabe responder, porque a alocação não tem conta. Um de cada vez, sempre. */
function egCat(k) { _egCat = k; _egConta = 'todas'; egPintar(); }
function egBuscar(v) { _egBusca = v; egPintar(true); }

function abrirExtratoGeral() {
  _egConta = 'todas'; _egCat = null; _egBusca = '';
  egPintar();
  document.getElementById('veu').classList.add('on');
}

/* `manterFoco` = veio da busca: redesenhar tirando o cursor do campo faria a
   segunda letra nunca ser digitada. */
function egPintar(manterFoco) {
  const todas = _egCat ? egLinhasCat(_egCat) : egLinhas();
  const L = egFiltradas(todas);
  const soma = (a, t) => a.filter(x => (t === 'ent' ? egVal(x) > 0 : egVal(x) < 0))
                          .reduce((s, x) => s + Math.abs(egVal(x)), 0);
  const entTudo = soma(todas, 'ent'), saiTudo = soma(todas, 'sai');
  const aberturas = ONDE.reduce((s, o) => s + (Number(o.abertura) || 0), 0);

  /* ── agrupa por dia, com subtotal do dia ── */
  const dias = [];
  L.forEach(x => {
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.d === x.d) ultimo.itens.push(x);
    else dias.push({ d: x.d, ord: x.ord, itens: [x] });
  });

  const chip = (ativo, rot, acao, cor) =>
    `<button class="egChip${ativo ? ' on' : ''}" onclick="${acao}"${cor ? ` style="--c:${cor}"` : ''}>
       ${cor ? '<i></i>' : ''}${rot}</button>`;

  /* ⭐ SÓ A HORA NA LINHA — o cabeçalho do dia já diz o dia (ela, 01/10/2026:
     *"ficou confuso. eu gosto minimalista, clean"*). A data repetida em toda
     linha, logo abaixo de um cabeçalho com a mesma data, era a informação três
     vezes na mesma tela. */
  const linha = x => `<div class="exL egL">
      <span class="exD">${x.h || ''}</span>
      <span class="exN">${String(x.n || '').replace(/</g, '&lt;')}</span>
      <span class="egConta"><i style="background:${x.cor}"></i>${x.conta}</span>
      <span class="exF">${String(x.f || '').replace(/</g, '&lt;')}</span>
      <!-- ⚠️ O SINAL VEM DO VALOR, não só do tipo. No extrato de categoria
           existe ENTRADA NEGATIVA — a bonificação perdida sai da Equipe e vai
           pro Investimento sem passar por conta nenhuma. Lendo só o tipo, ela
           aparecia como "+ −175,68". -->
      <span class="exV ${egVal(x) < 0 ? 'sai' : 'ent'}">${egVal(x) < 0 ? '−' : '+'} ${brl(Math.abs(egVal(x)))}</span></div>`;

  /* ⛔ O SUBTOTAL DO DIA E O CONTADOR CAÍRAM (ela, 01/10/2026). Três números
     disputando o mesmo cabeçalho — dia, quantidade e líquido — e o líquido
     somando verde com vermelho, que é a conta que ninguém faz de cabeça
     olhando lista. O fecho do período continua no rodapé.
     ⚠️ A MESMA MUDANÇA VALE NA GAVETA DE CADA CONTA (`abrirOnde`, em
     miolo-5-saldo.js). São a mesma lista vista de dois lugares: tratar
     diferente é como a tela volta a parecer duas verdades. */
  const blocoDia = g => `<div class="egDia">
      <div class="egDiaCab"><b>${g.d}</b></div>
      ${g.itens.map(linha).join('')}</div>`;

  document.getElementById('gaveta').innerHTML = `
    <div class="gcab"><i style="background:linear-gradient(140deg,#22E07A,#1E6DFF)"></i>
      <span><b>${_egCat ? (NOMES[_egCat] || _egCat).replace(' · 2ª unidade', '') : 'Tudo que entrou e saiu'}</b><br>de ${INICIO.slice(8)}/${INICIO.slice(5, 7)} até hoje · ${_egCat ? 'o extrato da categoria' : 'as cinco contas juntas'}</span>
      <button class="gx" onclick="fecharSaida()">✕</button></div>

    <div class="exSaldo egResumo">
      <em>${_egCat ? 'sobrou nesta categoria' : 'saldo disponível'}</em>
      <b class="fina">R$ ${brl(_egCat ? (_egCat === 'oper' ? M.operacional : M[_egCat]) : SALDO_TOTAL)}</b>
      <div class="egConta3">
        <span><i class="ent"></i>${_egCat ? 'separou' : 'entrou'}<b>+ ${brl(entTudo)}</b></span>
        <span><i class="sai"></i>${_egCat ? 'gastou' : 'saiu'}<b>− ${brl(saiTudo)}</b></span>
        ${(!_egCat && aberturas) ? `<span><i class="ab"></i>já tinha antes<b>+ ${brl(aberturas)}</b></span>` : ''}
      </div>
      ${(!_egCat && aberturas) ? `<span class="egNota">O "já tinha antes" é o dinheiro que as contas
        tinham em ${INICIO.slice(8)}/${INICIO.slice(5, 7)}. Não é faturamento e não tem
        lançamento — por isso não aparece na lista, só na conta do saldo.</span>` : ''}
    </div>

    <div class="egFiltros">
      <!-- ⚠️ DUAS PERGUNTAS, DUAS FILAS. Em cima "onde o dinheiro está"
           (as contas), embaixo "pra que ele é" (as categorias). O rótulo em
           itálico existe porque sem ele as duas filas de pastilha liam como uma
           lista só de 13 filtros que se contradizem. -->
      <div class="egFila"><em class="egRot">onde está</em>
        ${chip(!_egCat && _egConta === 'todas', 'Tudo', "egConta('todas')")}
        ${ONDE.map(o => chip(!_egCat && _egConta === o.k, o.n, `egConta('${o.k}')`, o.c)).join('')}
      </div>
      <div class="egFila"><em class="egRot">pra que é</em>
        ${EG_POTES.map(([k, r]) => chip(_egCat === k, r, `egCat('${k}')`,
            brc(CORES[k === 'oper' ? 'oper' : k === 'estoque' ? 'produto' : k] || CORES.lucro))).join('')}
      </div>
      <input class="egBusca" type="search" placeholder="procurar por nome ou forma de pagamento"
        value="${_egBusca.replace(/"/g, '&quot;')}" oninput="egBuscar(this.value)">
    </div>

    <div class="egCab">
      <span>${L.length} lançamento${L.length === 1 ? '' : 's'}${L.length !== todas.length ? ` de ${todas.length}` : ''}</span>
      <b class="ent">+ ${brl(L.filter(x => egVal(x) > 0).reduce((s, x) => s + egVal(x), 0))}</b>
      <b class="sai">− ${brl(Math.abs(L.filter(x => egVal(x) < 0).reduce((s, x) => s + egVal(x), 0)))}</b>
    </div>

    ${L.length
      ? `<div class="egLista">${dias.map(blocoDia).join('')}</div>`
      : `<div class="exNada">Nada aqui com esse filtro.
           ${_egBusca ? 'Tente outro nome, ou limpe a busca.' : 'Toque em "Tudo" pra ver o período inteiro.'}</div>`}

    <div class="exTot"><span>${_egCat ? 'Separou − gastou' : 'Entrou − saiu'}${(_egConta !== 'todas' || _egBusca) ? ' (só o que está filtrado)' : ' no período'}</span>
      <b class="num">R$ ${brl(L.reduce((s, x) => s + egVal(x), 0))}</b></div>

    <!-- ⭐ a barra de registrar saída (ela, 23/10/2026). Com categoria
         escolhida ela já sabe o pote; em "Tudo" ela pergunta antes, porque
         saída sem categoria não entraria em anel nenhum. -->
    ${typeof barraSaida === 'function' ? barraSaida(_egCat || null) : ''}`;

  if (manterFoco) {
    const i = document.querySelector('.egBusca');
    if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }
}
