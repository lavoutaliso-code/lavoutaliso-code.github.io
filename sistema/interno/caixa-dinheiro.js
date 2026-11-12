/* ══════════════════════════════════════════════════════════════════════════
   CAIXA REGISTRADORA — o controle do dinheiro em espécie
   ══════════════════════════════════════════════════════════════════════════
   A DONA (09/09/2026): "manter o controle do caixa de dinheiro… um botão verde,
   com um desenho de uma caixa registradora, e lá quando clicar acuse: saldo em
   dinheiro salão: xx, logo abaixo o extrato de retirada, e um botão escrito:
   fazer retirada."

   ⚠️⚠️ A CORREÇÃO DELA, 16/09/2026 — E É A DECISÃO QUE MANDA NESTE ARQUIVO:
   "essa retirada é fazer retirada do dinheiro do salão e trazer pro escritório
    da empresa. NÃO é necessariamente gastar o dinheiro. eu quero apenas que o
    dinheiro seja subtraído na aba caixa em dinheiro. quando eu pagar algo,
    lançar como forma de pagamento dinheiro, aí sim sai."

   EXISTEM DOIS LUGARES COM DINHEIRO VIVO — a gaveta do salão e o escritório —
   e o desenho de 09/09 só tinha um. Por isso a retirada era gravada como saída
   e apagava o dinheiro do saldo da empresa. Medido em 14/09: R$ 3.789,20
   sumiram do total, que caiu pra R$ 6.596,93 em vez de R$ 10.386,13. O dinheiro
   não tinha ido pra pote nenhum nem pra categoria inventada — ele simplesmente
   evaporava da conta, que é pior, porque é silencioso.

   AS TRÊS CONTAS, e cada uma responde uma pergunta diferente:

     dinheiro da EMPRESA = abertura + tudo que entrou em espécie − tudo que
                           SAIU em espécie          ← é o saldo da conta Dinheiro
     no ESCRITÓRIO       = tudo que foi retirado da gaveta − o que já foi gasto
     na GAVETA           = empresa − escritório

   🔒 A INVARIANTE: `gaveta + escritório = a conta Dinheiro`, sempre. A retirada
   move a divisória entre as duas primeiras e NUNCA mexe na terceira. Quem mexe
   na conta é saída de verdade com `conta:'dinheiro'` — e só ela.

   ⚠️ O GASTO EM ESPÉCIE SAI DO ESCRITÓRIO, e é escolha consciente: é de lá que
   ela paga as coisas. Quem paga direto da gaveta faz a retirada antes. Se um
   dia o escritório ficar negativo, é sinal de gasto pago com o dinheiro da
   gaveta — a tela avisa em vez de esconder.

   ⚠️ O NÚMERO É RELIDO NA HORA DE CONFIRMAR. Ela pediu "o dado exato do saldo
   acumulado até o minuto que eu cliquei". A tela relê sozinha só de 90 em 90s.
   ══════════════════════════════════════════════════════════════════════════ */

const CD_NOME = 'Retirada do caixa em dinheiro';
const _cd2 = v => Math.round((Number(v) || 0) * 100) / 100;

function cdConta() { return ONDE.find(o => o.k === 'dinheiro'); }

/* o dinheiro vivo da EMPRESA — gaveta + escritório. É o saldo da conta Dinheiro,
   e continua sendo `abertura + entrou − saiu`, sem régua paralela nenhuma. */
function cdEmpresa() { const o = cdConta(); return o ? _cd2(o.saldo) : 0; }

/* o que já foi gasto em espécie de verdade — saída com conta `dinheiro` */
function cdGastoEmEspecie() {
  return _cd2((typeof sdDaJanela === 'function' ? sdDaJanela() : [])
    .filter(x => x && x.conta === 'dinheiro')
    .reduce((s, x) => s + Number(x.v || 0), 0));
}
function cdEscritorio() {
  return _cd2((typeof rgTotal === 'function' ? rgTotal() : 0) - cdGastoEmEspecie());
}
function cdGaveta() { return _cd2(cdEmpresa() - cdEscritorio()); }

/* as retiradas da janela — o extrato do card */
function cdRetiradas() {
  return (typeof rgDaJanela === 'function' ? rgDaJanela() : []);
}

function cdHora(em) {
  if (!em) return '';
  const d = new Date(Number(em) - 3 * 3600e3);   /* horário de Brasília, sempre */
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}` +
    ` às ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/* o botão verde, no canto — irmão do Estorno */
function botaoCaixaDinheiro() {
  return `<button id="btCaixaD" onclick="abrirCaixaDinheiro()" title="Dinheiro do salão e do escritório">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 20h18v-8H3z"/><path d="M5 12V8h9v4"/><path d="M14 8l4-2v6"/>
      <path d="M7 10h2"/><path d="M6 16h5"/><path d="M15 16h3"/></svg>
    <span>Caixa em dinheiro</span></button>`;
}

function abrirCaixaDinheiro() { cdPintar(); document.getElementById('veu').classList.add('on'); }

function cdPintar(aviso) {
  const o = cdConta();
  const gaveta = cdGaveta();
  const escrit = cdEscritorio();
  const empresa = cdEmpresa();
  const gasto = cdGastoEmEspecie();
  const R = cdRetiradas();
  const somaR = _cd2(R.reduce((s, x) => s + Number(x.v || 0), 0));
  const ab = Number((o && o.abertura) || 0);
  const ent = Number((o && o.ent) || 0);

  /* ⚠️ DESENHO APROVADO POR ELA (mockup C, 09/09/2026) — "carteira, sem o card
     amarelo, deixar sem card por trás". O número grande fica direto na folha.
     ⚠️ O NÚMERO GRANDE É A GAVETA, não o total: é ele que o botão leva embora,
     e botão que move dinheiro tem que agir sobre o número que está em cima
     dele. Os outros dois lugares ficam logo abaixo, escritos por extenso —
     esconder o total da empresa foi exatamente o erro de 09/09. */
  document.getElementById('gaveta').innerHTML = `
    <div class="cdCab"><i></i><b>Caixa em dinheiro</b>
      <button class="gx" onclick="fecharSaida()">✕</button></div>

    <div class="cdOlho">Na gaveta do salão</div>
    <div class="cdNum${gaveta < 0 ? ' neg' : ''}"><span>R$</span>${brl(gaveta)}</div>

    <div class="cdPills">
      ${ab ? `<span class="cdPill">já tinha <b>${brl(ab)}</b></span>` : ''}
      <span class="cdPill ent">entrou <b>+ ${brl(ent)}</b></span>
      <span class="cdPill sai">foi pro escritório <b>− ${brl(somaR)}</b></span>
    </div>

    <div class="cdOnde">
      <div class="cdOndeL"><span>No escritório</span>
        <b class="${escrit < 0 ? 'neg' : ''}">R$ ${brl(escrit)}</b></div>
      <div class="cdOndeL"><span>Na gaveta do salão</span><b>R$ ${brl(gaveta)}</b></div>
      <div class="cdOndeL tot"><span>Dinheiro da empresa</span><b>R$ ${brl(empresa)}</b></div>
      ${gasto ? `<div class="cdOndeN">Já saiu <b>R$ ${brl(gasto)}</b> em espécie — essas
        sim foram lançadas como saída e abateram o saldo.</div>` : ''}
      ${escrit < 0 ? `<div class="cdOndeN alerta">O escritório está negativo: saiu mais
        dinheiro em espécie do que foi retirado da gaveta. Provavelmente algo foi
        pago direto do salão.</div>` : ''}
    </div>

    ${aviso ? `<div class="cdAviso">${aviso}</div>` : ''}

    <button class="cdBt" onclick="cdFazerRetirada()" ${gaveta > 0 ? '' : 'disabled'}>
      ${gaveta > 0 ? `Levar R$ ${brl(gaveta)} pro escritório` : 'Não há dinheiro na gaveta'}
    </button>

    <div class="cdSec">Retiradas${R.length ? `<b>${brl(somaR)}</b><em>${R.length}</em>` : ''}</div>
    ${R.length
      ? `<div class="cdLista">${R.map(x => `<div class="cdL">
            <span class="cdD">${cdHora(x.em) || x.dia}</span>
            <span class="cdN">${String(x.n || CD_NOME).replace(/</g, '&lt;')}</span>
            <span class="cdV">${brl(x.v)}</span></div>`).join('')}</div>`
      : `<div class="cdVazio">Nenhuma retirada desde ${INICIO.slice(8)}/${INICIO.slice(5, 7)}.
           A primeira aparece aqui com o dia e a hora.</div>`}

    <!-- ⚠️ DIZER O QUE A RETIRADA FAZ E O QUE ELA NÃO FAZ. Ela não é gasto e não
         é saída: o dinheiro só muda de lugar dentro da empresa. -->
    <div class="cdPe">Acumula sozinho: toda venda paga em espécie entra na gaveta.
      A retirada <b>leva o dinheiro pro escritório</b> — o saldo da empresa não
      muda, porque o dinheiro continua sendo dela. Ele só sai do caixa quando
      você lançar uma saída com forma de pagamento <b>Dinheiro</b>.</div>`;
}

async function cdFazerRetirada() {
  const antes = cdGaveta();
  if (!(antes > 0)) return;

  /* ⚠️ RELÊ ANTES DE GRAVAR — "o dado exato do minuto que eu cliquei". */
  const bt = document.querySelector('.cdBt');
  if (bt) { bt.disabled = true; bt.textContent = 'Conferindo a gaveta agora…'; }
  /* ⚠️⚠️ `carregar()` REFAZ AS QUATRO CONTAS — e o Nubank não vem do PDV.
     Ele é montado pela varredura das conversas do WhatsApp (`carregarNubank`),
     que roda DEPOIS da tela de pé e escreve o valor por fora, no `nuAplicar`.
     Recarregando sem devolver esse valor, o Nubank voltava ao número cru das
     comandas e o saldo total caía sozinho. Guardo o que a varredura já achou e
     devolvo pelo caminho oficial.
     ⚠️ E NÃO chamo `carregarNubank()` aqui de propósito: quando a varredura
     está velha ele dispara 2000 requisições, e ninguém que clicou em "levar pro
     escritório" pediu isso. */
  const nuAntes = (() => {
    const o = ONDE.find(x => x.k === 'nubank');
    if (!o || o.medindo) return null;
    const E = EXTRATO.nubank || {};
    return { v: o.ent, ent: E.ent || [], pend: E.pendentes };
  })();
  try { await carregar(); } catch (e) { /* sem rede: segue com o que tem na tela */ }
  if (nuAntes && typeof nuAplicar === 'function') nuAplicar(nuAntes.v, nuAntes.ent, nuAntes.pend);
  const agora = cdGaveta();

  if (Math.abs(agora - antes) >= 0.01) {
    /* mudou entre o clique e a conferência: NÃO retira o valor velho calado */
    cdPintar(`A gaveta mudou enquanto eu conferia: era R$ ${brl(antes)} e agora é
      <b>R$ ${brl(agora)}</b>${agora > antes ? ' (entrou venda em espécie)' : ''}.
      Confira e toque de novo.`);
    return;
  }
  if (!(agora > 0)) { cdPintar('A gaveta do salão está zerada.'); return; }

  const empresaAntes = cdEmpresa();
  if (!confirm(`Levar R$ ${brl(agora)} da gaveta do salão pro escritório?\n\n` +
    `O dinheiro CONTINUA no caixa da empresa — o saldo em dinheiro segue\n` +
    `em R$ ${brl(empresaAntes)}. Só muda de lugar.\n\n` +
    `Ele só sai quando você lançar uma saída com forma de pagamento Dinheiro.`)) {
    cdPintar(); return;
  }

  const reg = {
    em: Date.now(), dia: _hoje(), v: _cd2(agora),
    n: CD_NOME, de: 'gaveta', para: 'escritorio'
  };
  const ok = await rgLancar(reg);
  if (!ok) { cdPintar('Não consegui gravar. <b>Nada foi movido.</b>'); return; }

  /* ⚠️ NADA DE `aplicarSaidas()`: não há saída nenhuma pra aplicar. O saldo das
     contas não muda — e é exatamente isso que ela pediu. `repintarTudo()` fica
     porque o extrato do card e a gaveta mudaram de número. */
  repintarTudo();
  cdPintar(`R$ ${brl(reg.v)} levados pro escritório em ${cdHora(reg.em)}.
    A gaveta zerou e volta a acumular a partir de agora — e o dinheiro da
    empresa continua em <b>R$ ${brl(cdEmpresa())}</b>.`);
  if (typeof sdAviso === 'function') sdAviso(`R$ ${brl(reg.v)} da gaveta foram pro escritório`);
}
