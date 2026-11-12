/* ══════════════════════════════════════════════════════════════════
   GESTÃO FINANCEIRA FEITA — o comprovante do que entrou sozinho

   Ela, 18/09/2026: "dentro do painel deve ter opção de ver gestão
   financeira feita, apertar o botão e aparecer aquela animação de
   quando dá entrada manualmente, e a mesma ideia dos botões: hoje,
   últimos 7 dias, esse mês, e personalizado".

   O papel sai da impressora igual ao do app, e usa O MESMO SELETOR DE
   PERÍODO que já está no alto da página — não há um segundo conjunto de
   botões para ficar fora de sincronia.

   ⚠️ O CUPOM NÃO REFAZ A DIVISÃO DOS POTES, DE PROPÓSITO.
   A regra de repartir (diárias, custo fixo por dia, primeira entrada)
   mora no app e já tem quatro cópias neste negócio; uma quinta aqui
   mostraria um número diferente do que o app mostra — que é o defeito
   mais caro deste projeto (R$ 23.408 sumiram assim uma vez). O papel
   diz o que ENTROU, por empresa e por dia, que é dado cru e não admite
   duas leituras. Quem quiser ver os potes toca no botão e vai ao app.

   ⚠️ SÓ APARECE PARA QUEM TEM ENTRADA AUTOMÁTICA. Se a conta não tiver
   nenhuma entrada com `auto: true`, o botão nem nasce — não faz sentido
   oferecer o comprovante de uma gestão que não foi feita.
   ══════════════════════════════════════════════════════════════════ */

(function(){
  const UID = 'mwJh21e1sIbheYFq4Tbj52ENhqf1';
  let entradasAuto = null;      /* cache: a lista não muda no meio da sessão */

  /* ── o estilo, colado no desenho do app ── */
  const CSS = `
  /* ⚠️ A PÁGINA NÃO ROLA. Ela: "consegue deixar de uma forma que não
     tenha que rolar a tela?". Medido: o conteúdo pedia 1067px numa tela
     de 844. A solução não é espremer tudo — é dar ao calendário e ao
     rodapé altura fixa e deixar só o PAPEL rolar por dentro, que é o
     único pedaço que cresce conforme o dia tem mais linhas. */
  #g-palco{position:fixed;inset:0;z-index:300;display:none;background:#F2F2F7;
    flex-direction:column;overflow:hidden}
  #g-palco.on{display:flex}
  /* ⚠️ min-height zero — sem ele o flex adota a altura do conteúdo e o
     papel estoura a tela em vez de rolar por dentro. Já aconteceu na
     barra de período; é a mesma armadilha. */
  #g-centro{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;
    display:flex;flex-direction:column;align-items:center;padding:2px 20px 10px}
  #g-palco > #g-cal{flex:none;margin:2px 20px 6px}
  #g-imp{width:380px;max-width:100%;position:relative}
  #g-carcaca{position:relative;z-index:2;border-radius:14px;padding:10px 20px;
    background:linear-gradient(180deg,#2C2C2E 0%,#1C1C1E 100%);
    box-shadow:0 4px 16px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.12);
    display:flex;align-items:center;gap:10px}
  #g-carcaca .lb{width:28px;height:28px;border-radius:8px;background:#C8FF00;display:flex;
    align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#1C1C1E}
  #g-carcaca .nm{font-size:14px;font-weight:700;color:#C8FF00;letter-spacing:.06em;
    text-transform:uppercase}
  #g-fenda{position:relative;z-index:3;width:calc(100% - 28px);margin:-3px auto 0;height:7px;
    background:linear-gradient(180deg,#050505 0%,#1a1a1a 100%);border-radius:0 0 4px 4px}
  /* ⚠️ o papel SAI da fenda: nasce com altura zero e cresce. Sem o
     overflow escondido no pai, ele apareceria inteiro de uma vez e a
     impressora viraria enfeite. */
  #g-saida{overflow:hidden;max-height:0;transition:max-height .9s cubic-bezier(.2,.7,.2,1)}
  /* ⚠️ A SERRILHA É UM PSEUDO-ELEMENTO NO PÉ, NÃO UMA MÁSCARA NO PAPEL.
     Com mask-size:11px a máscara se REPETE pelo papel inteiro e come o
     texto — medido em 18/09: o comprovante saiu ilegível, riscado de
     ponta a ponta. Aqui o papel fica inteiro e só o rodapé é recortado. */
  #g-papel{position:relative;background:#fff;margin:0 10px;padding:13px 16px 18px;
    box-shadow:0 8px 24px rgba(0,0,0,.10);color:#1C1C1E;
    font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12.5px;line-height:1.4}
  #g-papel:after{content:'';position:absolute;left:0;right:0;bottom:-9px;height:10px;
    background:radial-gradient(circle at 5.5px 0,#fff 5.4px,transparent 5.6px);
    background-size:11px 11px;background-repeat:repeat-x}
  #g-papel .sub b{color:#1C1C1E;font-weight:700}
  #g-papel .sub{text-align:center;color:#6B7280;font-size:11px;margin-bottom:2px}
  #g-papel .reg{border-top:1px dashed #C9CDD4;margin:8px 0;height:0}
  #g-papel .l{display:flex;justify-content:space-between;gap:12px;padding:1px 0}
  #g-papel .l span{color:#4B5563;min-width:0;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap}
  #g-papel .l b{font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
  #g-papel .tot{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
    margin-top:4px}
  #g-papel .tot span{font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:11.5px}
  #g-papel .tot b{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
  #g-papel .dia{color:#9AA1AC;font-size:11px;margin:9px 0 2px;letter-spacing:.04em}
  #g-papel .pe{text-align:center;color:#9AA1AC;font-size:10.5px;margin-top:9px;line-height:1.4}
  #g-papel .quem{font-size:10.5px;color:#9AA1AC;margin-top:2px}
  #g-papel .aviso{background:#FFF4E5;color:#8A5A00;border-radius:7px;padding:5px 8px;
    font-size:10px;margin-top:7px;text-align:center;line-height:1.3}
  #g-papel .cap2{font-size:9.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;
    color:#9AA1AC;margin-bottom:5px}
  #g-papel .l.pote{gap:7px}
  #g-papel .pt2{width:7px;height:7px;border-radius:2px;flex:none}
  #g-papel .nm2{flex:1;color:#4B5563;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #g-papel .vazio{text-align:center;color:#6B7280;padding:14px 0}
  /* ⚠️ OS BOTÕES DO PÉ SAÍRAM (ordem dela, 18/09) — mas a saída não pode
     sair junto. No app instalado não há barra de endereço nem botão de
     voltar: sem nada que feche, a tela prende e o jeito é matar o app.
     Ficou um "Pronto" no topo, que é como o iOS fecha uma folha.
     De quebra, o pé devolveu 68px ao papel. */
  #g-topo{flex:none;display:flex;align-items:center;justify-content:space-between;
    padding:calc(8px + env(safe-area-inset-top,0px)) 20px 4px}
  #g-topo b{font-size:17px;font-weight:590;letter-spacing:-.02em;color:#000}
  #g-topo button{font-family:inherit;font-size:17px;font-weight:590;color:#007AFF;
    background:none;border:0;cursor:pointer;padding:4px 0 4px 16px;letter-spacing:-.02em;
    -webkit-tap-highlight-color:transparent}
  #g-topo button:active{opacity:.4}
  /* o botão tem a mesma cara dos cartões do painel: papel, raio grande,
     sombra baixa — e 52px de altura, que o dedo acerta sem mirar */
  /* ══ O CALENDÁRIO — desenho B, aprovado em 18/09 ══
     O valor de cada dia vai embaixo do número: ela varre o mês e acha o
     dia bom sem tocar em nada. Régua Apple: grade de 52px, SF 400/590,
     azul #007AFF, hoje em vermelho, escolhido em pílula preta. */
  #g-cal{background:#fff;border-radius:12px;margin:0 9px 14px;padding:4px 8px 6px}
  #g-cal .mescab{display:flex;align-items:center;justify-content:space-between;padding:2px 8px 0}
  #g-cal .mescab .tit{display:inline-flex;align-items:center;gap:5px;padding:2px 0;
    cursor:pointer;-webkit-tap-highlight-color:transparent}
  #g-cal .mescab b{font-size:17px;font-weight:590;letter-spacing:-.02em;color:#000}
  #g-cal .mescab .tit i{font-style:normal;font-size:12px;color:#007AFF;line-height:1}
  #g-cal .mescab .tit:active{opacity:.45}
  #g-cal .mescab .setas{display:flex;gap:2px}
  #g-cal .mescab button{width:32px;height:32px;border:0;background:none;cursor:pointer;
    display:grid;place-items:center}
  #g-cal .mescab button svg{width:11px;height:19px;stroke:#007AFF;fill:none;stroke-width:2.6;
    stroke-linecap:round;stroke-linejoin:round}
  #g-cal .mescab button:disabled svg{stroke:#3C3C4348}
  #g-cal .dias{display:grid;grid-template-columns:repeat(7,1fr);padding:4px 0 1px}
  #g-cal .dias i{font-style:normal;text-align:center;font-size:13px;font-weight:590;
    color:#3C3C4399}
  #g-cal .mes{display:grid;grid-template-columns:repeat(7,1fr);gap:1px}
  #g-cal .mes span{position:relative;height:46px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:1px;cursor:pointer;border-radius:10px}
  #g-cal .mes span b{font-size:17px;font-weight:400;color:#000;letter-spacing:-.02em}
  #g-cal .mes span u{font-size:10px;font-weight:590;color:#34C759;text-decoration:none;
    font-variant-numeric:tabular-nums;letter-spacing:-.01em}
  /* dia ainda não fechado: o valor vem em cinza, não em verde */
  #g-cal .mes span.aberto u{color:#8E8E93}
  #g-cal .mes span.neg u{color:#FF3B30}
  #g-cal .mes span.fora b{color:#3C3C4348}
  #g-cal .mes span.fora{cursor:default}
  #g-cal .mes span.hoje b{color:#FF3B30;font-weight:590}
  #g-cal .mes span.on{background:#1C1C1E}
  #g-cal .mes span.on b{color:#fff;font-weight:590}
  #g-cal .mes span.on u{color:#fff;opacity:.72}
  #g-cal .mes .vago{visibility:hidden}
  #g-cal .pe2{font-size:10.5px;color:#3C3C4399;display:flex;gap:13px;justify-content:center;
    padding:5px 10px 0}
  #g-cal .pe2 .lg{display:inline-flex;align-items:center;gap:5px}
  #g-cal .pe2 i{width:7px;height:7px;border-radius:50%;display:block}
  #g-cal .pe2 i.ch{background:#34C759}
  #g-cal .pe2 i.ab{background:#8E8E93}

  .bt-gestao{font-family:inherit;font-size:15px;font-weight:600;border:0;cursor:pointer;
    width:100%;margin:10px 0 0;border-radius:18px;padding:16px 18px;
    background:var(--papel,#fff);color:var(--tinta,#1C1C1E);
    box-shadow:0 1px 2px rgba(16,24,40,.05), 0 8px 22px -14px rgba(16,24,40,.35);
    display:flex;align-items:center;gap:11px;letter-spacing:-.012em;
    -webkit-tap-highlight-color:transparent;
    transition:transform .12s ease, box-shadow .18s ease}
  .bt-gestao:active{transform:scale(.985);
    box-shadow:0 1px 2px rgba(16,24,40,.05), 0 4px 12px -8px rgba(16,24,40,.3)}
  .bt-gestao span{flex:1;text-align:left}
  .bt-gestao svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:1.9;
    stroke-linecap:round;stroke-linejoin:round;flex:none}
  .bt-gestao .seta{width:16px;height:16px;opacity:.38;stroke-width:2.4}
  @media (max-width:620px){ #g-imp{width:100%} #g-papel{font-size:12px} }
  `;

  const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ⚠️ o dia de Brasília, nunca o do UTC: entrada das 23h59 do dia 18
     tem `data` em UTC já no dia 19, e cairia no período errado */
  const diaBR = iso => {
    const d = new Date(iso);
    return isNaN(d) ? null : new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10);
  };

  /* ⚠️ O ESTILO ENTRA NA HORA DE LIGAR, NÃO DE ABRIR.
     Ele morava dentro do montarPalco(), que só roda quando ela toca no
     botão — então o BOTÃO nascia sem estilo: inline-block, 308px de
     altura no celular, e o toque caía fora dele. Medido em 18/09. */
  function garantirCSS(){
    if (document.getElementById('g-css')) return;
    const st = document.createElement('style');
    st.id = 'g-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function montarPalco(){
    garantirCSS();
    if (document.getElementById('g-palco')) return;
    const p = document.createElement('div');
    p.id = 'g-palco';
    p.innerHTML = `
      <div id="g-topo"><b>Minha gestão</b><button id="g-pronto">Pronto</button></div>
      <div id="g-cal"></div>
      <div id="g-centro">
        <div id="g-imp">
          <div id="g-carcaca"><div class="lb">P</div><span class="nm">Lei dos Potes</span></div>
          <div id="g-fenda"></div>
          <div id="g-saida"><div id="g-papel"></div></div>
        </div>
      </div>
      `;
    document.body.appendChild(p);
    document.getElementById('g-pronto').addEventListener('pointerdown', fechar);
  }

  function fechar(){
    const p = document.getElementById('g-palco');
    if (!p) return;
    document.getElementById('g-saida').style.maxHeight = '0px';
    p.classList.remove('on');
  }

  /* ── TODAS as entradas da conta dela ──
     ⚠️ ERA SÓ AS AUTOMÁTICAS, e o calendário ficava quase vazio: o robô
     começou ontem, mas ela lança à mão desde sempre. Ela: "gostaria de
     ver todos os outros dias que teve entrada". Agora vêm todas, e o
     comprovante diz quais foram do robô e quais foram dela. */
  async function buscarAuto(){
    if (entradasAuto) return entradasAuto;
    const snap = await db.collection('users').doc(UID).collection('fin_entradas').get();
    entradasAuto = snap.docs.map(d => d.data());
    return entradasAuto;
  }

  /* ══ O CALENDÁRIO E O DIA ESCOLHIDO ═══════════════════════════════
     Ela escolheu o desenho B em 18/09: o valor de cada dia embaixo do
     número. O calendário manda; a impressora imprime o dia escolhido. */
  let mesAberto = null;      /* 'AAAA-MM' */
  let diaEscolhido = null;   /* 'AAAA-MM-DD' */
  /* ⚠️ EM TELA CURTA O CALENDÁRIO VIRA SEMANA.
     Medido em 18/09: no iPhone 14 tudo cabe, mas num SE (667px) o papel
     ficava 144px escondido. O mês inteiro custa 5 linhas de 46px; a
     semana do dia escolhido custa uma. O cabeçalho do mês alterna os
     dois — é o que o Calendário e os Lembretes do iOS fazem. */
  let soSemana = null;       /* null = decide pelo espaço; true/false = ela escolheu */
  let ultimoPorDia = null;   /* guardado para repintar sem reler o banco */

  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho',
                 'agosto','setembro','outubro','novembro','dezembro'];
  const SEM1 = ['S','T','Q','Q','S','S','D'];
  const SETA_E = '<svg viewBox="0 0 12 20"><path d="M10 2L2.5 10 10 18"/></svg>';
  const SETA_D = '<svg viewBox="0 0 12 20"><path d="M2 2l7.5 8L2 18"/></svg>';
  const hojeBR = () => diaBR(new Date().toISOString());

  /* ⚠️ QUANTO ENTROU EM CADA DIA — E QUEM PÔS.
     Ela: "por que está mostrando dia que nem chegou ainda, dia 18 que fez
     5.755?". O 18 é HOJE, e aqueles R$ 5.754,70 são lançamento DELA, não
     fechamento — o fecho de hoje só acontece às 23h59. O calendário
     mostrava os dois iguais, e um lançamento do meio da tarde parecia um
     dia já fechado. Agora cada dia sabe quem o preencheu. */
  function porDiaDe(lista){
    const m = {};
    lista.forEach(e => {
      const d = diaBR(e.data);
      if (!d) return;
      const r = m[d] || (m[d] = { valor: 0, auto: false, mao: false });
      r.valor = Math.round((r.valor + Number(e.valor || 0)) * 100) / 100;
      if (e.auto) r.auto = true; else r.mao = true;
    });
    return m;
  }

  const semCent = v => Math.abs(v) >= 1000
    ? Math.round(Math.abs(v)).toLocaleString('pt-BR')
    : Math.round(Math.abs(v)).toString();

  /* ⚠️ MEDE O QUE ESTÁ NA TELA, não constantes.
     Eu estimava "topo 40 + impressora 55 + papel + folga 40" e o número
     saía conservador: o iPhone 14, onde o mês inteiro CABE, encolhia para
     semana sem precisar. Agora a pergunta é direta — o miolo está
     rolando? Se está, não cabe. */
  /* ⚠️ O CALENDÁRIO NÃO PODE MUDAR DE TAMANHO QUANDO ELA TROCA DE DIA.
     Era o defeito que ela viu: "quando clica no dia 18 o calendario
     diminui". Eu decidia mês-ou-semana pelo papel do dia ESCOLHIDO, e
     cada dia tem um papel de altura diferente — 281px num dia de 5
     linhas, 407px num de 12. Tocar num dia caro encolhia a grade, e no
     iPhone 14 isso levava os dias 17 e 18 para FORA da tela: ela perdia
     o acesso a eles com o próprio toque.

     Agora a pergunta é outra: cabe o PIOR dia deste mês? A resposta não
     depende de onde ela tocou, então a grade fica parada. */

  let linhasNaGrade = 5;                  /* quantas linhas o mês inteiro ocupa */

  /* o passo de uma linha da grade — altura da célula + o gap do grid */
  function passoDaGrade(){
    const mes = document.querySelector('#g-cal .mes');
    const c = mes && mes.querySelector('span[data-d]');
    if (!c) return 46;
    const gap = parseFloat(getComputedStyle(mes).rowGap) || 0;
    return c.getBoundingClientRect().height + gap;
  }

  let encolhidoAgora = false;
  function ajustarCalendario(){
    const meio  = document.getElementById('g-centro');
    const carc  = document.getElementById('g-carcaca');
    const fenda = document.getElementById('g-fenda');
    if (!meio || !ultimoPorDia) return;

    /* ⚠️ MEDE O PIOR DIA, não o escolhido, e mede de verdade.
       Duas coisas erradas moravam aqui. A primeira: eu decidia pelo papel
       do dia ESCOLHIDO — então tocar num dia caro encolhia a grade, e no
       iPhone 14 isso levava os dias 17 e 18 para fora da tela. Ela viu:
       "quando clica no dia 18 o calendario diminui". A segunda: tentei
       prever a altura por base + linhas × altura-da-linha, e a previsão
       deu 450px onde o papel real tinha 407 — a base muda de dia para dia
       porque o aviso de "hoje ainda não fechou" só existe hoje. */
    let pior = 0;
    Object.keys(ultimoPorDia).forEach(d => {
      if (d.slice(0, 7) !== mesAberto) return;
      const h = alturaDoPapel(d);
      if (h > pior) pior = h;
    });
    if (!pior) return;

    /* a conta é sempre "e se fosse o mês inteiro?": se já está em semana,
       o miolo está (linhas−1) mais alto do que estaria com o mês aberto —
       desconto a diferença, senão a resposta oscila entre as duas pinturas */
    const espacoSeMes = meio.clientHeight
      - (encolhidoAgora ? (linhasNaGrade - 1) * passoDaGrade() : 0);
    /* o que a impressora gasta é MEDIDO; o único número escrito é o mesmo
       +30 que `imprimir()` põe no max-height da saída */
    const precisa = pior + (carc ? carc.offsetHeight : 48)
                         + (fenda ? fenda.offsetHeight : 7) + 30;

    const queroSemana = precisa > espacoSeMes;
    if (queroSemana !== encolhidoAgora){
      encolhidoAgora = queroSemana;
      pintarCalendario(ultimoPorDia);
    }
  }

  function pintarCalendario(porDia){
    ultimoPorDia = porDia;
    const alvo = document.getElementById('g-cal');
    if (!alvo) return;
    const [A, M] = mesAberto.split('-').map(Number);
    const primeiro = new Date(Date.UTC(A, M - 1, 1));
    const ultimo = new Date(Date.UTC(A, M, 0)).getUTCDate();
    /* segunda = 0, como no calendário do iPhone em pt-BR */
    const branco = (primeiro.getUTCDay() + 6) % 7;
    const hoje = hojeBR();

    /* que linhas mostrar: todas, ou só a do dia escolhido */
    const linhaDo = d => Math.floor((branco + d - 1) / 7);
    const [,, dEsc] = diaEscolhido.split('-').map(Number);
    const linhaEscolhida = diaEscolhido.slice(0, 7) === mesAberto ? linhaDo(dEsc) : 0;
    linhasNaGrade = Math.ceil((branco + ultimo) / 7);
    const encolhido = soSemana === null ? encolhidoAgora : soSemana;

    let cels = '';
    for (let i = 0; i < branco; i++)
      if (!encolhido || linhaDo(1 - branco + i) === linhaEscolhida)
        cels += '<span class="vago"></span>';
    for (let d = 1; d <= ultimo; d++){
      if (encolhido && linhaDo(d) !== linhaEscolhida) continue;
      const iso = `${A}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const r = porDia[iso];
      const v = r && r.valor;
      const cl = [];
      if (iso === diaEscolhido) cl.push('on');
      if (iso === hoje) cl.push('hoje');
      if (!r) cl.push('fora');
      else {
        if (v < 0) cl.push('neg');
        /* ⚠️ o que ainda NÃO fechou fica em contorno, não em cheio: é
           lançamento dela, e o dia pode crescer até as 23h59 */
        if (!r.auto) cl.push('aberto');
      }
      const val = !r ? '&nbsp;' : (v < 0 ? '−' : '') + semCent(v);
      cels += `<span class="${cl.join(' ')}" data-d="${iso}"><b>${d}</b><u>${val}</u></span>`;
    }

    /* ⚠️ o mês seguinte só abre até o mês de hoje: não há fechamento no futuro */
    const noFuturo = mesAberto >= hoje.slice(0, 7);
    alvo.innerHTML =
      `<div class="mescab"><span id="g-mes" class="tit"><b>${MESES[M-1]} ${A}</b><i>${encolhido ? '⌄' : '⌃'}</i></span>
         <div class="setas">
         <button data-m="-1">${SETA_E}</button>
         <button data-m="1"${noFuturo ? ' disabled' : ''}>${SETA_D}</button></div></div>
       <div class="dias">${SEM1.map(x => `<i>${x}</i>`).join('')}</div>
       <div class="mes">${cels}</div>
       <div class="pe2"><span class="lg"><i class="ch"></i>fechado às 23h59</span>
          <span class="lg"><i class="ab"></i>lançado por você</span></div>`;

    /* o mês alterna entre semana e mês inteiro */
    const tit = alvo.querySelector('#g-mes');
    if (tit) tit.addEventListener('pointerdown', () => {
      soSemana = !encolhido;
      pintarCalendario(porDia);
    });
    alvo.querySelectorAll('button[data-m]').forEach(b => {
      b.addEventListener('pointerdown', () => {
        const passo = Number(b.dataset.m);
        const [a2, m2] = mesAberto.split('-').map(Number);
        const nd = new Date(Date.UTC(a2, m2 - 1 + passo, 1));
        mesAberto = nd.toISOString().slice(0, 7);
        pintarCalendario(porDia);
      });
    });
    alvo.querySelectorAll('.mes span[data-d]').forEach(c => {
      if (c.classList.contains('fora')) return;
      c.addEventListener('pointerdown', () => {
        diaEscolhido = c.dataset.d;
        pintarCalendario(porDia);
        imprimir();
      });
    });
  }

  /* ── imprime o dia escolhido: é aqui que a impressora existente roda ── */
  /* ⚠️ O PAPEL DE UM DIA, EM HTML — SEPARADO DE QUEM O PINTA.
     Precisa existir sozinho porque o calendário tem que saber a altura
     do PIOR dia do mês antes de pintar a grade, e prever essa altura por
     "base + nº de linhas × altura da linha" erra: medido em 18/09, a
     previsão dava 450px onde o papel real tem 407. A base muda de dia
     para dia (o aviso de "hoje ainda não fechou" só existe hoje). Então
     não se prevê — imprime-se num fantasma e mede-se. */
  function htmlDoDia(dia){
    const doDia = (entradasAuto || []).filter(e => diaBR(e.data) === dia);
    const total = doDia.reduce((acc, e) => acc + Number(e.valor || 0), 0);
    const [A, M, D] = dia.split('-');
    const extenso = new Date(Date.UTC(+A, +M - 1, +D))
      .toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', timeZone:'UTC' });

    /* ⚠️ sem o título "Gestão feita": ele repetia o que o topo da tela já
       diz, e cada linha a menos é linha que o papel ganha de vida */
    let html = `<div class="sub"><b>${D}/${M}/${A}</b> · ${extenso}</div>`;

    if (!doDia.length){
      return html + '<div class="vazio">nada foi lançado neste dia</div>'
                  + '<div class="pe">o fecho acontece todo dia às <b>23h59</b></div>';
    }

    html += '<div class="reg"></div>';
    /* ⚠️ o fecho automático lança UMA entrada por dia e guarda o
       detalhe por empresa dentro dela — lançar uma por empresa fazia
       cada uma reservar a diária de novo. Aqui o detalhe é aberto. */
    doDia.slice().sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0)).forEach(e => {
      const linhas = Array.isArray(e.detalhe) && e.detalhe.length
        ? e.detalhe : [{ empresa: e.empresa || '—', valor: e.valor }];
      linhas.forEach(x => {
        html += `<div class="l"><span>${x.empresa || '—'}</span>`
              + `<b>${brl(x.valor)}</b></div>`;
      });
    });
    const naMao = doDia.filter(e => !e.auto).length;
    const doRobo = doDia.filter(e => e.auto).length;
    html += '<div class="reg"></div>'
      + `<div class="tot"><span>entrou</span><b>${brl(total)}</b></div>`
      + `<div class="quem">${doRobo && !naMao ? 'fechado pelo sistema às 23h59'
           : naMao && !doRobo ? (naMao > 1 ? naMao + ' lançamentos seus' : 'lançado por você')
           : 'sistema + ' + naMao + ' seu' + (naMao > 1 ? 's' : '')}</div>`
      /* ⚠️ o dia de hoje ainda não fechou: dizer só o valor faria parecer
         que é o total do dia, e ele ainda pode crescer até as 23h59 */
      + (dia === hojeBR() && !doRobo
          ? '<div class="aviso">hoje ainda não fechou · o sistema soma as empresas às 23h59</div>'
          : '');

    /* ── PARA ONDE FOI ──
       ⚠️ A conta NÃO é escrita aqui. Vem de `divisao.js`, RECORTADO do
       próprio app por `gerar-divisao.mjs` — e `conferir-divisao.mjs`
       prova que as duas dão o mesmo centavo (7/7 casos). Reescrever a
       divisão seria a quinta cópia neste negócio, e é assim que
       R$ 23.408 sumiram uma vez. */
    const potes = divisaoDoDia(doDia);
    if (potes && potes.length){
      html += '<div class="reg"></div><div class="cap2">para onde foi</div>';
      potes.forEach(pt => {
        html += `<div class="l pote"><span class="pt2" style="background:${pt.cor}"></span>`
              + `<span class="nm2">${pt.nome}</span><b>${brl(pt.valor)}</b></div>`;
      });
      html += '<div class="pe">dividido pelo seu plano, no mesmo dia</div>';
    } else {
      html += '<div class="pe">dividido nos potes automaticamente</div>';
    }
    return html;
  }

  /* mede a altura que o papel de um dia TERIA, sem mostrá-lo */
  function alturaDoPapel(dia){
    const papel = document.getElementById('g-papel');
    if (!papel) return 0;
    const f = papel.cloneNode(false);      /* mesmas classes, mesmo CSS */
    f.id = '';
    f.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;'
                    + 'width:' + papel.offsetWidth + 'px';
    f.innerHTML = htmlDoDia(dia);
    papel.parentElement.appendChild(f);
    const h = f.scrollHeight;
    f.remove();
    return h;
  }

  function imprimir(){
    const papel = document.getElementById('g-papel');
    const saida = document.getElementById('g-saida');
    if (!papel || !saida) return;
    saida.style.maxHeight = '0px';            /* recolhe antes de sair de novo */

    papel.innerHTML = htmlDoDia(diaEscolhido);
    requestAnimationFrame(() => {
      saida.style.maxHeight = (papel.scrollHeight + 30) + 'px';
      /* ⚠️ a decisão é sobre o PIOR dia do mês, não sobre este dia — por
         isso chamar a cada impressão é seguro: a resposta não muda quando
         ela troca de dia, só quando troca de mês. */
      if (soSemana === null && ultimoPorDia) ajustarCalendario();
    });
  }

  /* soma a divisão das entradas do dia, usando a conta do app */
  function divisaoDoDia(doDia){
    if (!window.DIVISAO || !window.DIVISAO.divisaoDe) return null;
    try {
      const todas = entradasAuto.slice().sort((a, b) =>
        String(a.data).localeCompare(String(b.data)));
      const soma = {};
      doDia.forEach(e => {
        const d = window.DIVISAO.divisaoDe(e, todas);
        Object.keys(d).forEach(k => {
          if (k === 'sobra' || k === 'buraco') return;
          soma[k] = (soma[k] || 0) + (Number(d[k]) || 0);
        });
      });
      const lista = window.DIVISAO.potesDoPlano(window.DIVISAO.planoDe(doDia[0] || {}));
      return lista
        .map(t => ({ nome: t.curto || t.nome, cor: t.cor,
                     valor: Math.round((soma[t.k] || 0) * 100) / 100 }))
        .filter(t => Math.abs(t.valor) >= 0.005)
        .sort((a, b) => b.valor - a.valor);
    } catch (e){
      /* ⚠️ sem divisão é melhor que divisão errada: o papel sai sem a
         seção, em vez de mostrar número inventado */
      console.warn('[gestão] não consegui dividir:', e.message);
      return null;
    }
  }

  async function abrir(){
    try { await _abrir(); }
    catch (e){
      const papel = document.getElementById('g-papel');
      if (papel){
        papel.innerHTML = '<h3>Gestão feita</h3><div class="vazio">'
          + String(e.message || e).slice(0, 90) + '</div>';
        const s2 = document.getElementById('g-saida');
        if (s2) s2.style.maxHeight = (papel.scrollHeight + 30) + 'px';
      }
    }
  }

  async function _abrir(){
    montarPalco();
    const palco = document.getElementById('g-palco');
    const papel = document.getElementById('g-papel');
    const saida = document.getElementById('g-saida');
    palco.classList.add('on');
    saida.style.maxHeight = '0px';
    papel.innerHTML = '<div class="vazio">lendo…</div>';

    let lista = [];
    try { lista = await buscarAuto(); }
    catch (e){
      /* ⚠️ SEMPRE COM PAPEL NA MÃO: um erro aqui saía como promessa não
         tratada e a impressora ficava vazia, sem dizer nada a ela. */
      const semLogin = /permission|insufficient|unauthenticated/i.test(String(e.message || e));
      papel.innerHTML = '<h3>Gestão feita</h3>'
        + '<div class="vazio">' + (semLogin
            ? 'entre no painel para ver<br>o comprovante'
            : 'não consegui ler as entradas<br>' + String(e.message || e).slice(0, 70))
        + '</div>';
      requestAnimationFrame(() => {
        saida.style.maxHeight = (papel.scrollHeight + 30) + 'px'; });
      return;
    }

    const porDia = porDiaDe(lista);
    const dias = Object.keys(porDia).sort();
    /* abre no dia mais recente que teve fechamento; sem nenhum, em hoje */
    if (!diaEscolhido || !porDia[diaEscolhido])
      diaEscolhido = dias.length ? dias[dias.length - 1] : hojeBR();
    mesAberto = diaEscolhido.slice(0, 7);

    pintarCalendario(porDia);
    imprimir();
  }

  /* ── o botão, embaixo do total, onde o olho passa ──
     ⚠️ ELE NASCE SEMPRE. Antes eu só o criava se já existisse entrada
     automática — e no primeiro dia não existe nenhuma, então ela abriu o
     painel e não achou o botão: "não estou achando o botão minha gestão
     financeira". Um botão que só aparece depois não se descobre.
     Sem lançamento ainda, o papel diz isso com todas as letras.

     ⚠️ E NÃO FICA MAIS AO LADO DO SELETOR: aquela barra agora ROLA no
     celular, e um botão pendurado nela sumiria da vista junto. */
  function ligar(){
    garantirCSS();
    if (document.querySelector('.bt-gestao')) return;
    const total = document.getElementById('total-card');
    if (!total || !total.parentElement) return;
    const bt = document.createElement('button');
    bt.className = 'bt-gestao';
    bt.innerHTML = '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/>'
      + '<path d="M8 8h8M8 12h8M8 16h5"/></svg>'
      + '<span>Minha gestão financeira</span>'
      + '<svg class="seta" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
    total.parentElement.insertBefore(bt, total.nextSibling);
    bt.addEventListener('pointerdown', abrir);
  }

  window.ligarGestaoFeita = ligar;
  window.abrirGestaoFeita = abrir;
})();
