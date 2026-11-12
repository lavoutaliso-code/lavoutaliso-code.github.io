/* ══════════════════════════════════════════════════════════════════════════
   DENTRO DA CASCA — o que cada sistema copiado faz quando roda num iframe
   do Laila Salon.

   ⚠️ A BARRA DE ABAS DO INTERNO É DO RODAPÉ E A DO PRODUTO É LATERAL. Rodando
      dentro da casca, as duas apareciam ao mesmo tempo: a lateral à esquerda e
      a do gestor boiando em cima do conteúdo. Esta é a única coisa que o
      sistema copiado precisa saber sobre estar dentro de outro.

   ⚠️ NÃO MEXE EM NADA NO ORIGINAL. Este arquivo só existe na cópia
      (`lailasalon-produto/`); o `interno-lavoutaliso-deploy` e o
      `pdv15-deploy` continuam byte por byte como estão no ar.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var dentro = false;
  try { dentro = window.self !== window.top; } catch (e) { dentro = true; }

  /* ⚠️ A LATERAL DO PDV FICA ESCONDIDA — e sem isto as abas dele ficavam
     INALCANÇÁVEIS. O PDV tem sete telas por dentro (painel, satisfação,
     retoques, chamados, clientes, ADM…) e quem navegava entre elas era a
     sidebar própria. Escondida pela casca, elas existiam e ninguém chegava.
     Agora a casca pede a aba pela URL: `pdv/index.html?aba=satisfacao`.
     ⚠️ `sbGo` funciona sem o botão (ele trata `el` ausente), e é ele que
     respeita os cadeados — chamar `goPage` direto pularia a senha. */
  function abrirAba() {
    var m = /[?&]aba=([a-z0-9_-]+)/i.exec(location.search);
    if (!m) return;
    var id = m[1], tentativas = 0;

    /* ⚠️⚠️ NÃO BASTA CHAMAR UMA VEZ — E A PROVA PEGOU ISSO. Chamado cedo, o
       `sbGo` roda e funciona; depois o próprio PDV termina de carregar e
       força `fluxo2` por cima. Resultado: só a aba padrão abria, as outras
       três voltavam sozinhas sem nenhum erro no console.
       Agora a casca INSISTE e CONFERE: só para quando a página pedida está
       de fato visível — ou quando aparece o cadeado dela, que é resposta
       legítima (aquela aba pede senha, e quem decide é o cadeado). */
    var alvo = 'pg-' + id;
    (function tentar() {
      var pg = document.getElementById(alvo);
      if (pg && getComputedStyle(pg).display !== 'none') return;     /* chegou */
      var lock = document.querySelector('.lock');
      if (lock && [].some.call(document.querySelectorAll('.lock'),
            function (l) { return getComputedStyle(l).display !== 'none'; })) return;
      if (typeof window.sbGo === 'function') { try { sbGo(id); } catch (e) {} }
      if (++tentativas < 80) setTimeout(tentar, 150);
    })();
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', abrirAba);
  else abrirAba();


  /* daqui pra baixo só vale DENTRO da casca: é o esconder da navegação
     própria de cada sistema, que fora dela continua sendo necessária */
  if (!dentro) return;

  document.documentElement.classList.add('na-casca');

  var css = document.createElement('style');
  css.textContent =
    /* a barra do rodapé do interno some: quem navega agora é a lateral */
    '.na-casca #lt-tabbar{display:none !important}' +
    /* o PDV traz a própria sidebar e a topbar do hambúrguer — idem */
    '.na-casca #sb-side,.na-casca #sb-topbar,.na-casca #sb-overlay{display:none !important}' +
    '.na-casca #sb-main{margin-left:0 !important}' +
    /* o espaço que a barra de baixo reservava vira respiro normal */
    '.na-casca body{padding-bottom:0 !important}';
  (document.head || document.documentElement).appendChild(css);
})();
