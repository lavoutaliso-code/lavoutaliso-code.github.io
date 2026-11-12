/* ══════════════════════════════════════════════════════════════════════════
   A IMPRESSORA — mesma mecânica do interno-lavoutaliso-deploy/caixa.js.
   O que mudou foi o PAPEL: virou um ticket no estilo da referência dela
   (IMG_6948), menor, e cada forma de pagamento aparece com a MARCA desenhada
   — bandeiras de cartão, o símbolo do Pix e a cédula.

   ⚠️ setTimeout e nunca requestAnimationFrame: rAF não roda em aba de segundo
      plano nem no headless, e a nota simplesmente não saía.
   ⚠️ A MEDIÇÃO DO --alvo É SÍNCRONA. Dentro de rAF ela ficava com max-height 0
      e a impressora acendia sem imprimir nada.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── o dia de exemplo. Os números FECHAM: as formas somam o faturamento, e
      fat − (as saídas) = lucro. ─────────────────────────────────────────── */
/* ⚠️ TROCAR SÓ O NÚMERO DE CLIENTES QUEBRARIA A NOTA. Com 30 clientes e os
   números antigos, a notinha dizia 14 procedimentos (menos que clientes) e
   16 transações (menos gente pagando do que gente atendida) — duas
   contradições à vista numa peça de dinheiro. Então o dia inteiro foi
   recalculado em volta dos 30, e tudo continua FECHANDO:
     · as 4 formas somam exatamente o faturamento ..... 9.740,00
     · as transações das 4 formas somam os clientes ... 30
     · faturamento − as três saídas = o lucro ......... 1.730,00
   As reservas saem das constantes reais do painel: bônus 8,96 + investimento
   39,04 + estoque 43,00 + marketing 17,00 = 108,00 por procedimento × 38. */
const DIA = {
  data: '07/11/26', hora: '20:12',
  clientes: 30, procedimentos: 38,
  fat: 9740.00,
  /* ⭐ cada forma traz as marcas que entraram nela */
  formas: [
    {k:'Crédito',  sub:'12 transações',  v:3980.00, marcas:['visa','master','elo']},
    {k:'Débito',   sub:'6 transações',   v:1620.00, marcas:['master','visa']},
    {k:'Pix',      sub:'9 recebimentos', v:3240.00, marcas:['pix']},
    {k:'Dinheiro', sub:'3 pagamentos',   v: 900.00, marcas:['dinheiro']}
  ],
  mo: 3420.00,
  reservas: 4104.00,   /* 108,00 por procedimento × 38 */
  oper: 486.00
};
DIA.lucro = Math.round((DIA.fat - (DIA.mo + DIA.reservas + DIA.oper)) * 100) / 100;

const brl = v => (Number(v) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

/* ⭐ VALORES MASCARADOS (pedido dela, por segurança): todo número de DINHEIRO
   sai como R$ ****. As contagens — clientes, procedimentos, transações —
   continuam à vista: elas não são valor e são o que dá sentido à nota.
   ⚠️ O asterisco nasce colado no topo da linha nas fontes da Apple; o
   `vertical-align` do .mk desce ele pro meio, senão fica flutuando acima dos
   algarismos do resto do ticket.
   ⚠️ O CÓDIGO DE BARRAS VAZAVA O VALOR: o número embaixo dele era o
   faturamento em centavos (00974000 = R$ 9.740,00). Mascarar a linha e
   esquecer o rodapé seria mascarar pela metade.
   Para ver os números de novo, troque para false. */
const MASCARAR = true;
const rs  = v => MASCARAR ? 'R$ <span class="mk">****</span>' : 'R$ ' + brl(v);

function palcoCaixa(){
  return `
  <div id="cxPalco">
    <div class="cxCentro">
      <div class="impressora" id="cxImp">
        <div class="carcaca"><img src="logo.png" alt="lailasalon"></div>
        <div class="fenda"></div>
        <div class="dobrinha"></div>
        <div class="impSaida" id="cxSaida"><div class="impPapel" id="cxPapel"></div></div>
      </div>
    </div>
    <div class="cxPe" id="cxPe">
      <button class="cxBt" onclick="fecharCupom()">Pronto</button>
    </div>
  </div>`;
}

function fecharCaixa(){
  const P = document.getElementById('cxPalco');
  const papel = document.getElementById('cxPapel');
  const saida = document.getElementById('cxSaida');
  const imp   = document.getElementById('cxImp');
  const D = DIA;

  const linha = (l, v) => `<div class="tkLin"><span class="l">${l}</span>
      <span class="n">${v}</span></div>`;

  papel.innerHTML = `
    <div class="tkTopo">
      <span class="tkSelo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff"
        stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m4 12 6 6L20 6"/></svg></span>
      <h4>Caixa fechado</h4>
      <p>O fechamento do dia foi emitido</p>
    </div>

    <div class="tkCorte"><span></span></div>

    <div class="tkGrade">
      <span class="r">Clientes</span><span class="r d">Faturamento</span>
      <span class="v">${D.clientes}</span><span class="v d">${rs(D.fat)}</span>
    </div>
    <div class="tkGrade">
      <span class="r">Data e hora</span><span class="r d">Procedimentos</span>
      <span class="v">${D.data} · ${D.hora}</span><span class="v d">${D.procedimentos}</span>
    </div>

    <div class="tkSec">Como entrou</div>
    ${D.formas.map(f => `
      <div class="tkPg">
        <span class="bnds">${f.marcas.map(m => MARCA[m]()).join('')}</span>
        <b>${f.k}</b>
        <span class="vl">${rs(f.v)}</span>
        <s>${f.sub}</s>
      </div>`).join('')}

    <div class="tkCorte"><span></span></div>

    ${linha('Mão de obra', rs(D.mo))}
    ${linha('Reservas e estoque', rs(D.reservas))}
    ${linha('Custo de funcionamento', rs(D.oper))}
    <div class="tkLin total"><span class="l">Lucro do dia</span>
      <span class="n">${rs(D.lucro)}</span></div>

    <div class="tkBar">
      <svg width="150" height="30" viewBox="0 0 150 30">${
        Array.from({length: 48}, (_, i) => {
          /* ⚠️ sem Math.random: o mesmo dia tem que imprimir o mesmo código */
          const w = 1 + ((i * 7 + D.clientes * 13) % 3);
          return `<rect x="${i * 3.1}" y="0" width="${w}" height="30" fill="#2A2A2E"/>`;
        }).join('')}</svg>
      <span>${'0711' + '2026'} · ${MASCARAR ? '********'
        : String(Math.round(D.fat * 100)).padStart(8, '0')}</span>
    </div>`;

  P.classList.add('on');
  /* ⚠️ A FOLGA NÃO É ENFEITE. Com 30 a nota terminava a 57px do rodapé e a tela
     ficava espremida — "caber" não é o pedido, o pedido é caber E SOBRAR
     ESPAÇO. */
  const TOPO = 22, FOLGA = 72;
  P.style.setProperty('--topo', TOPO + 'px');
  P.style.setProperty('--k', '1');
  /* ⚠️ +20: a serrilha do ::after fica FORA do scrollHeight. Sem a folga, os
     últimos pixels da nota saíam decepados. */
  const alvo = Math.ceil(papel.scrollHeight) + 20;
  P.style.setProperty('--alvo', alvo + 'px');

  /* ⚠️⚠️ A ESCALA É MEDIDA, NUNCA CHUTADA — e foi a prova que cobrou isto.
     Numa volta a nota terminava em 1126px numa tela de 1180 e o rodapé
     começava em 1047: o fim da nota ficava ATRÁS do botão. Agora o k nasce da
     conta:
        espaço livre = tela − topo − rodapé(medido) − folga
        altura cheia = máquina(carcaça + fenda + dobrinha) + nota
     O rodapé é medido mesmo invisível (ele é opacity:0, não display:none).
     A dobrinha vem da var --dobra porque ela tem transition e mediria 0.
     Piso de .72: abaixo disso a nota deixa de se ler. */
  const dobra  = parseFloat(getComputedStyle(P).getPropertyValue('--dobra')) || 0;
  const maquina = document.querySelector('#cxPalco .carcaca').getBoundingClientRect().height
                + document.querySelector('#cxPalco .fenda').getBoundingClientRect().height
                + dobra;
  const rodape = document.getElementById('cxPe').getBoundingClientRect().height;
  const livre  = window.innerHeight - TOPO - rodape - FOLGA;
  const cheio  = maquina + alvo;
  const k = Math.min(1, Math.max(.72, livre / cheio));
  P.style.setProperty('--k', k.toFixed(3));

  /* papel comprido demora mais pra sair, como impressora de verdade */
  P.style.setProperty('--dur', Math.min(7, Math.max(2.4, papel.scrollHeight / 260)).toFixed(1) + 's');
  saida.style.maxHeight = '';
  imp.classList.add('imprimindo');
  setTimeout(() => saida.classList.add('aberta'), 16);
  setTimeout(() => P.classList.add('pronto'), 1200);
}

function fecharCupom(){
  const P = document.getElementById('cxPalco');
  P.classList.remove('on', 'pronto');
  document.getElementById('cxSaida').classList.remove('aberta');
  document.getElementById('cxImp').classList.remove('imprimindo');
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('beforeend', palcoCaixa());
});
