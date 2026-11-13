/* ══════════════════════════════════════════════════════════════════════
   A COMANDA — da chegada da cliente ao pagamento

   Ela, 12/11: *«transforme o chegou em um botão clicável, depois que
   clica nele vai pra fechar comanda $ (verde). O chegou abre um card no
   centro da tela, "oba! +1 cliente" e some. Depois, na hora de fechar
   comanda, aparece um card com valor, pré-selecionado o procedimento que
   ela tava agendada, mas com opção de selecionar outros também, e as
   formas de pagamento: dinheiro, pix, cartão, o saldo a pagar. Bem rico
   igual o app da ref.»*

   O caminho tem três estados, e o botão da linha é o mesmo em todos:

     agendada ──[chegou]──► na cadeira ──[fechar comanda]──► paga
                    │                            │
              festa "+1 cliente"          folha de pagamento
              (1,4s e some)               (procedimentos + formas)

   ⚠️ LEI DO FINANCEIRO, e ela manda em tudo aqui:
   · o total é a SOMA dos procedimentos marcados, recalculada a cada
     clique — nunca um número digitado à parte;
   · o saldo a pagar é `total − o que já foi lançado`, e aparece na mesma
     coluna das parcelas, para a conta FECHAR na tela;
   · o botão de fechar só libera quando o saldo chega a zero. Comanda que
     fecha com diferença é dinheiro que some sem ninguém ver.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const brl = v => 'R$ ' + (+v || 0).toLocaleString('pt-BR',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const r2 = v => Math.round((+v || 0) * 100) / 100;

  /* ⚠️ A LISTA DE PREÇOS VEM DO QUE ELA CADASTROU — a demonstração é só
     o que aparece enquanto não há nada cadastrado. É isto que faz a
     gestão ser «automática»: ela responde a calculadora uma vez, e a
     comanda de toda cliente que pedir aquele procedimento já sabe o
     preço e a divisão, sem perguntar de novo. */
  function cadastrados(){
    try {
      const C = window.parent.LS_CONTA || window.LS_CONTA;
      return (C && C.espaco().ler('procedimentos')) || [];
    } catch(e){ return []; }
  }
  const precos = () => {
    const meus = cadastrados();
    const demo = (window.LS_DEMO && window.LS_DEMO.precos) || [];
    if (!meus.length) return demo;
    /* o cadastrado vence o de demonstração com o mesmo nome */
    const mapa = new Map(demo.map(([n,v]) => [n.toLowerCase(), [n,v]]));
    meus.forEach(r => mapa.set(r.nome.toLowerCase(), [r.nome, r.preco]));
    return [...mapa.values()];
  };
  /* a divisão guardada com o procedimento, para o recibo da comanda */
  const divisaoDe = nome => {
    const r = cadastrados().find(x => x.nome.toLowerCase() === String(nome).trim().toLowerCase());
    return r ? r.divisao : null;
  };
  const preco  = nome => {
    const p = precos().find(x => x[0].toLowerCase() === String(nome).trim().toLowerCase());
    return p ? p[1] : 0;
  };

  /* ── a festa da chegada ─────────────────────────────────────────────
     1,4s e some sozinha. ⚠️ Nada do que ela celebra depende de clique
     para sumir: comemoração que exige um «ok» vira obstáculo na terceira
     cliente do dia. */
  function festa(nome, tipo){
    const v = document.createElement('div');
    v.className = 'lsFesta' + (tipo === 'fechou' ? ' lsFestaOk' : '');
    const selo = tipo === 'fechou'
      ? `<div class="lsFestaCheck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
           <path d="M4.5 12.5 10 18 19.5 6.5"/></svg></div>`
      : '<div class="lsFestaEmoji">🎉</div>';
    v.innerHTML = `<div class="lsFestaCx">
      ${selo}
      <div class="lsFestaTt">${tipo === 'fechou' ? 'Comanda fechada' : 'Oba! +1 cliente'}</div>
      <div class="lsFestaSub">${tipo === 'fechou'
        ? 'Dinheiro organizado · ' + nome : nome + ' chegou no salão'}</div>
    </div>`;
    document.body.appendChild(v);
    requestAnimationFrame(() => v.classList.add('on'));
    setTimeout(() => { v.classList.remove('on');
      setTimeout(() => v.remove(), 260); }, 1400);
  }

  /* ── a folha de pagamento ───────────────────────────────────────────
     O procedimento que estava agendado já vem marcado; os outros entram
     com um toque. O total e o saldo se refazem a cada mudança. */
  function comanda(linha){
    const nome = linha.querySelector('.lsAgNome')?.textContent.trim() || 'cliente';
    const proc = linha.querySelector('.lsAgProc')?.textContent.trim() || '';
    const hora = linha.querySelector('.lsAgHoraBloco b')?.textContent.trim() || '';

    const marcados = new Set(proc ? [proc.toLowerCase()] : []);
    const pagos = [];                       /* [forma, valor] já lançados */

    const v = document.createElement('div');
    v.className = 'lsCmdVeu';
    v.innerHTML = `
      <div class="lsCmd" role="dialog" aria-label="Fechar comanda">
        <div class="lsCmdCab">
          <div>
            <div class="lsCmdNome">${nome}</div>
            <div class="lsCmdSub">chegou às ${hora} · fechar comanda</div>
          </div>
          <button class="lsCmdX" aria-label="fechar">×</button>
        </div>

        <div class="lsCmdSec">Procedimentos</div>
        <div class="lsCmdChips" role="group"></div>

        <div class="lsCmdDesc">
          <button class="lsCmdDescBt" type="button">− Dar desconto</button>
          <label class="lsCmdDescCx" hidden>
            <span>Desconto</span>
            <i>R$</i><input class="lsCmdDescIn" inputmode="decimal" placeholder="0,00">
            <button class="lsCmdDescX" type="button" aria-label="tirar o desconto">×</button>
          </label>
        </div>

        <div class="lsCmdTotal">
          <span>Total</span><b class="lsCmdTt">R$ 0,00</b>
        </div>

        <div class="lsCmdSec">Como ela vai pagar</div>
        <div class="lsCmdFormas">
          ${[['dinheiro','Dinheiro'],['pix','Pix'],['cartao','Cartão']].map(([k,r]) => `
            <button class="lsCmdForma" data-forma="${k}">
              <span class="lsCmdIco">${icone(k)}</span>
              <span>${r}</span>
            </button>`).join('')}
        </div>
        <div class="lsCmdPagos"></div>

        <div class="lsCmdSaldo">
          <span>Saldo a pagar</span><b class="lsCmdSd">R$ 0,00</b>
        </div>
        <button class="lsCmdOk" disabled>Fechar comanda</button>
      </div>`;
    document.body.appendChild(v);
    requestAnimationFrame(() => v.classList.add('on'));

    const chips  = v.querySelector('.lsCmdChips');
    const descBt = v.querySelector('.lsCmdDescBt');
    const descCx = v.querySelector('.lsCmdDescCx');
    const descIn = v.querySelector('.lsCmdDescIn');
    let desconto = 0;
    const elTt   = v.querySelector('.lsCmdTt');
    const elSd   = v.querySelector('.lsCmdSd');
    const elPagos= v.querySelector('.lsCmdPagos');
    const btOk   = v.querySelector('.lsCmdOk');

    function bruto(){ return r2([...marcados].reduce((a, p) => a + preco(p), 0)); }
    /* ⚠️ O desconto nunca deixa o total negativo, e nunca é maior que o
       que foi pedido: comanda com total negativo vira crédito fantasma. */
    function total(){ return r2(Math.max(0, bruto() - Math.min(desconto, bruto()))); }
    function pago(){  return r2(pagos.reduce((a, p) => a + p[1], 0)); }
    function saldo(){ return r2(total() - pago()); }

    function pintar(){
      /* ⚠️ Ela, 12/11: *«esse selecionar o procedimento assim, com essa
         fonte, ficou péssimo — caixa de seleção pra dar check»*. A pílula
         obrigava nome e preço a dividirem uma linha apertada e o preço
         virava um apêndice. Em lista, o nome fica à esquerda, o preço
         alinhado à direita em número tabular, e o check diz o estado sem
         depender de cor. */
      chips.innerHTML = precos().map(([p, val]) => `
        <button class="lsCmdChip${marcados.has(p) ? ' on' : ''}" data-proc="${p}"
          role="checkbox" aria-checked="${marcados.has(p)}">
          <span class="lsCmdCk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.5 10 17.5 19 7"/></svg></span>
          <span class="lsCmdPn">${p}</span>
          <em>${brl(val)}</em></button>`).join('');
      const d = Math.min(desconto, bruto());
      descCx.hidden = !(d > 0 || descCx.dataset.aberto === '1');
      descBt.hidden = !descCx.hidden;
      elTt.innerHTML = d > 0
        ? `<s>${brl(bruto())}</s>${brl(total())}`
        : brl(total());
      const s = saldo();
      elSd.textContent = brl(s);
      elSd.classList.toggle('quitado', Math.abs(s) < 0.005 && total() > 0);
      elPagos.innerHTML = pagos.map(([f, val], i) => `
        <div class="lsCmdPg"><span>${rotulo(f)}</span>
          <b>− ${brl(val)}</b>
          <button class="lsCmdTira" data-i="${i}" aria-label="tirar">×</button></div>`).join('');
      /* ⚠️ só fecha quando a conta FECHA: nem com saldo sobrando, nem
         com pagamento a mais, nem com comanda vazia. */
      btOk.disabled = !(total() > 0 && Math.abs(s) < 0.005);
      btOk.textContent = total() <= 0 ? 'Escolha um procedimento'
        : s > 0.005 ? `Falta ${brl(s)}`
        : s < -0.005 ? `Passou ${brl(-s)}`
        : `Fechar comanda · ${brl(total())}`;
    }
    pintar();

    descBt.onclick = () => { descCx.dataset.aberto = '1'; pintar(); descIn.focus(); };
    v.querySelector('.lsCmdDescX').onclick = () => {
      desconto = 0; descIn.value = ''; descCx.dataset.aberto = '0'; pintar();
    };
    /* leitor de dinheiro pt-BR: «50», «50,00» e «1.250,50» entram certo */
    descIn.oninput = () => {
      const t = descIn.value.replace(/[^\d.,]/g,'');
      const u = Math.max(t.lastIndexOf(','), t.lastIndexOf('.'));
      const n = u < 0 ? +t
        : (t.length - u - 1) <= 2 ? +(t.slice(0,u).replace(/[.,]/g,'') + '.' + t.slice(u+1))
        : +t.replace(/[.,]/g,'');
      desconto = isFinite(n) ? Math.max(0, n) : 0;
      pintar();
    };

    chips.onclick = e => {
      const c = e.target.closest('.lsCmdChip'); if (!c) return;
      const p = c.dataset.proc;
      marcados.has(p) ? marcados.delete(p) : marcados.add(p);
      pintar();
    };
    v.querySelectorAll('.lsCmdForma').forEach(bt => {
      bt.onclick = () => {
        const falta = saldo();
        if (total() <= 0) return;
        /* a forma escolhida quita o que falta — e o que falta pode ser
           dividido entre várias formas, uma a uma */
        if (falta <= 0.005) return;
        pagos.push([bt.dataset.forma, falta]);
        pintar();
      };
    });
    elPagos.onclick = e => {
      const t = e.target.closest('.lsCmdTira'); if (!t) return;
      pagos.splice(+t.dataset.i, 1); pintar();
    };

    const fecha = () => { v.classList.remove('on'); setTimeout(() => v.remove(), 220); };
    v.querySelector('.lsCmdX').onclick = fecha;
    v.onclick = e => { if (e.target === v) fecha(); };
    addEventListener('keydown', function esc(e){
      if (e.key === 'Escape'){ fecha(); removeEventListener('keydown', esc); } });

    btOk.onclick = () => {
      if (btOk.disabled) return;
      linha.dataset.lsEstado = 'paga';
      marcarBotao(linha);
      fecha();
      festa(nome, 'fechou');
    };
  }

  function rotulo(f){ return { dinheiro:'Dinheiro', pix:'Pix', cartao:'Cartão' }[f] || f; }

  function icone(k){
    const C = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
    if (k === 'dinheiro') return `<svg viewBox="0 0 24 24" ${C}>
      <rect x="2.5" y="6" width="19" height="12" rx="2.4"/><circle cx="12" cy="12" r="2.6"/>
      <path d="M6 10h.01M18 14h.01"/></svg>`;
    if (k === 'pix') return `<svg viewBox="0 0 24 24" ${C}>
      <path d="M12 3.2 20.8 12 12 20.8 3.2 12z"/><path d="M8.2 8.2 12 12l3.8-3.8M8.2 15.8 12 12l3.8 3.8"/></svg>`;
    return `<svg viewBox="0 0 24 24" ${C}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.4"/><path d="M2.5 9.5h19M6 15h3"/></svg>`;
  }

  /* ── o botão da linha, nos três estados ─────────────────────────────── */
  function marcarBotao(linha){
    const bt = linha.querySelector('.lsAgBt'); if (!bt) return;
    const e = linha.dataset.lsEstado || 'agendada';
    bt.className = 'lsAgBt ls-' + e;
    /* ⚠️ O rótulo é CURTO porque a largura é dela, não minha: medido,
       «$ fechar comanda» ocupava 112px da linha e empurrava o nome da
       cliente para 92px — «Angelica Fonseca…». O texto inteiro mora no
       `title`, e o botão fica com o verbo. */
    bt.textContent = e === 'agendada' ? 'chegou'
                   : e === 'cadeira'  ? 'fechar'
                   : 'paga';
    bt.title = e === 'agendada' ? 'marcar que a cliente chegou'
             : e === 'cadeira'  ? 'fechar a comanda e receber'
             : 'comanda paga';
    bt.disabled = (e === 'paga');
  }

  function ligar(){
    document.querySelectorAll('.lsAgLinha').forEach(l => {
      if (l.dataset.lsLigada) { marcarBotao(l); return; }
      l.dataset.lsLigada = '1';
      /* quem já chegou entra direto na cadeira: o selo do dado vira estado */
      if (!l.dataset.lsEstado)
        l.dataset.lsEstado = l.classList.contains('ok') ? 'cadeira' : 'agendada';
      const alvo = l.querySelector('.lsAgEst');
      if (!alvo) return;
      const bt = document.createElement('button');
      bt.className = 'lsAgBt';
      bt.onclick = ev => {
        ev.stopPropagation();
        const e = l.dataset.lsEstado;
        if (e === 'agendada'){
          l.dataset.lsEstado = 'cadeira';
          marcarBotao(l);
          festa(l.querySelector('.lsAgNome')?.textContent.trim() || 'A cliente', 'chegou');
        } else if (e === 'cadeira'){
          comanda(l);
        }
      };
      alvo.replaceWith(bt);
      marcarBotao(l);
    });
  }

  /* a agenda é repintada pelo tema; o observador reata os botões */
  const olho = new MutationObserver(() => { clearTimeout(olho._t);
    olho._t = setTimeout(ligar, 40); });
  function iniciar(){ ligar(); olho.observe(document.body, { childList:true, subtree:true }); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
