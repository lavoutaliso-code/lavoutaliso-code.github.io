/* ══════════════════════════════════════════════════════════════════════════
   O FIM DO DIA — a tela que ela aprovou, agora dentro do PDV do produto.

   Quando a última cliente é finalizada e não sobra nenhuma em aberto, o PDV
   deixa de ser um quadro de trabalho e vira o recibo do dia: a registradora
   em line-art, o check, e o botão que imprime o fechamento.

   ⚠️ QUEM MANDA É O NÚMERO, NÃO O RELÓGIO. A tela não aparece "às 20h": ela
      aparece quando `abertas === 0` e `finalizadas > 0`. Dia que acabou às
      15h é dia que acabou; dia sem ninguém atendido não tem o que fechar.

   ⚠️ APARECE UMA VEZ POR DIA. Sem isto, fechar uma comanda atrasada às 22h
      traria a tela de volta por cima do trabalho. O carimbo fica no
      localStorage com a data — e é por dia, não por sessão, senão recarregar
      a página ressuscitaria a tela.

   ⚠️ O NÚMERO DE CLIENTES É O DO PDV, não um exemplo. Os VALORES saem
      mascarados (R$ ****), que é como ela pediu a nota.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MARCA_DIA = 'ls_fimdedia_visto';
  var montado = false;

  function hoje() {
    /* ⚠️ horário de Brasília, não o do aparelho: um tablet com o fuso errado
       viraria o dia antes da hora e a tela sumiria no meio do expediente */
    return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  }

  function montar() {
    if (montado) return;
    montado = true;

    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = '../fimdedia/impressora.css';
    document.head.appendChild(css);

    var palco = document.createElement('div');
    palco.id = 'fd-palco';
    palco.innerHTML =
      '<div class="fd-cab">' +
        '<img src="../fimdedia/logo.png" alt="lailasalon">' +
        '<span class="fd-selo"><span class="fd-dp"></span>dia encerrado</span>' +
      '</div>' +
      '<div class="fd-corpo">' +
        '<div class="fd-ck"><svg viewBox="0 0 100 100">' +
          '<path d="M33 51l13 13 26-28"/></svg></div>' +
        '<div class="fd-maq" id="fd-maq"><div class="fd-visor"><b>0</b></div></div>' +
        '<button class="fd-bt" id="fd-bt">Fechar caixa do dia</button>' +
      '</div>';
    document.body.appendChild(palco);

    var est = document.createElement('style');
    est.textContent = ESTILO;
    document.head.appendChild(est);

    /* o desenho é a Clássica, a que ela escolheu */
    var d = regClassica(338, true, true);
    var maq = document.getElementById('fd-maq');
    maq.insertAdjacentHTML('afterbegin', d.svg);
    var v = maq.querySelector('.fd-visor');
    v.style.left = (d.visor.x / d.vb[0] * 100).toFixed(2) + '%';
    v.style.top  = (d.visor.y / d.vb[1] * 100).toFixed(2) + '%';

    document.getElementById('fd-bt').insertAdjacentHTML('afterbegin', iconeCaixa());
    document.getElementById('fd-bt').onclick = function () { fecharCaixa(); };
  }

  /* ── o gatilho ───────────────────────────────────────────────────────── */
  function avaliar(abertas, finalizadas, extra) {
    if (!(abertas === 0 && finalizadas > 0)) return;
    try { if (localStorage.getItem(MARCA_DIA) === hoje()) return; } catch (e) {}

    montar();
    document.querySelector('#fd-palco .fd-visor b').textContent = finalizadas;

    /* a nota recebe o que o PDV sabe de verdade; o resto já sai mascarado */
    if (window.DIA) {
      DIA.clientes = finalizadas;
      DIA.procedimentos = (extra && extra.procedimentos) || finalizadas;
      var d = new Date(Date.now() - 3 * 3600e3);
      DIA.data = ('0' + d.getUTCDate()).slice(-2) + '/' +
                 ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' +
                 String(d.getUTCFullYear()).slice(-2);
      DIA.hora = ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
    }

    document.getElementById('fd-palco').classList.add('on');
    try { localStorage.setItem(MARCA_DIA, hoje()); } catch (e) {}
  }

  function esconder() {
    var p = document.getElementById('fd-palco');
    if (p) p.classList.remove('on');
  }

  window.LS_FimDeDia = { avaliar: avaliar, esconder: esconder, montar: montar };

  var ESTILO =
  '#fd-palco{position:fixed;inset:0;z-index:120;background:#F0F4F8;display:none;' +
    'flex-direction:column;padding:18px 0 16px;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif}' +
  '#fd-palco.on{display:flex}' +
  '.fd-cab{padding:0 16px;display:flex;align-items:flex-start;justify-content:space-between;' +
    'gap:12px;margin-bottom:14px;flex:none}' +
  '.fd-cab img{height:30px;width:auto;display:block}' +
  '.fd-selo{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;' +
    'color:#0B7A4B;background:#E7FBF1;border:1px solid #BFEFD8;padding:7px 14px;' +
    'border-radius:100px;white-space:nowrap}' +
  '.fd-dp{width:8px;height:8px;border-radius:50%;background:#10B981;' +
    'box-shadow:0 0 0 3px rgba(16,185,129,.22)}' +
  '.fd-corpo{flex:1;padding:0 16px;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:center;gap:26px;min-height:0}' +
  /* ⭐ o check em evidência e a máquina translúcida: a máquina é o lugar onde
     o check acontece, não o assunto */
  '.fd-ck{pointer-events:none;width:124px;height:124px;border-radius:50%;background:#10B981;' +
    'display:flex;align-items:center;justify-content:center;margin-bottom:-4px;' +
    'box-shadow:0 16px 34px -14px rgba(16,185,129,.85),0 0 0 10px rgba(16,185,129,.1);' +
    'animation:fdSelo .55s .15s cubic-bezier(.34,1.5,.5,1) both}' +
  '.fd-ck svg{width:124px;height:124px;display:block}' +
  '.fd-ck path{stroke:#fff;stroke-width:8.4;fill:none;stroke-linecap:round;' +
    'stroke-linejoin:round;stroke-dasharray:56;stroke-dashoffset:56;' +
    'animation:fdTracar .5s .45s cubic-bezier(.22,1,.36,1) forwards}' +
  '@keyframes fdTracar{to{stroke-dashoffset:0}}' +
  '@keyframes fdSelo{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}' +
  '.fd-maq{position:relative;opacity:.55;animation:fdAp .55s both}' +
  '@keyframes fdAp{from{opacity:0}to{opacity:.55}}' +
  '.fd-maq svg.cxreg{filter:drop-shadow(0 16px 24px rgba(190,10,100,.13))}' +
  /* ⚠️ o visor é filho do DESENHO: ancorado no palco, o número sairia da
     máquina no instante em que o check mudasse a altura do conjunto */
  '.fd-visor{position:absolute;z-index:3;transform:translate(-50%,-50%);text-align:center;' +
    'color:#373739;font-variant-numeric:tabular-nums;pointer-events:none;line-height:1}' +
  '.fd-visor b{display:block;font-size:24px;font-weight:600;letter-spacing:-.03em}' +
  /* ⚠️ pink CHAPADO, sem gradiente — nem na sombra */
  '.fd-bt{width:auto;padding:15px 30px;border:0;border-radius:15px;cursor:pointer;' +
    'font-family:inherit;background:#D1016B;color:#fff;font-size:16px;font-weight:700;' +
    'letter-spacing:-.015em;display:flex;align-items:center;justify-content:center;gap:10px;' +
    'box-shadow:0 2px 4px rgba(15,30,40,.1),0 10px 22px -12px rgba(15,30,40,.5);' +
    'transition:transform .13s;animation:fdSobe .55s .2s both}' +
  '.fd-bt:active{transform:scale(.983)}' +
  '.fd-bt svg{width:22px;height:22px;flex:none}' +
  '@keyframes fdSobe{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}';
})();
