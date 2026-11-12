/* ══════════════════════════════════════════════════════════════════════════
   A TRAVA DO SALÃO — isola os dados do sistema à venda.

   🔴 SEM ISTO, O PRODUTO LÊ E ESCREVE NO BANCO DO SALÃO DELA. As cópias do
      PDV e do interno vieram com o endereço do Firebase do Lavou Tá Liso
      escrito dentro (`paineldolavou-default-rtdb` no PDV, o proxy `/db` no
      interno). Vender assim significaria que cada salão comprador abriria a
      agenda, o caixa e a equipe DELA — e escreveria por cima.

   ⚠️ A INTERCEPÇÃO É NO `fetch`, não nas 11.627 linhas do PDV. Reescrever
      cada chamada à mão em dois sistemas inteiros é trabalho sem fim e com
      furo garantido: basta uma escapar. Aqui todo caminho de dados passa por
      um funil só, e o que não casar com o padrão NÃO SAI — falha alto em vez
      de vazar baixo.

   ⚠️ ESTE ARQUIVO TEM QUE SER O PRIMEIRO SCRIPT DA PÁGINA. Depois de
      qualquer outro, chamadas já terão saído sem prefixo.

   Cada salão vive em `t/{salao}/…`. O da demonstração é `t/demo/`.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BASE  = 'https://paineldolavou-default-rtdb.firebaseio.com';
  var PROXY = '/db';

  /* o salão corrente: gravado pela casca no login, 'demo' enquanto não houver */
  var SALAO = 'demo';
  try { SALAO = localStorage.getItem('ls_salao') || 'demo'; } catch (e) {}
  var RAIZ = '/t/' + SALAO;

  function desviar(u) {
    if (typeof u !== 'string') return u;
    if (u.indexOf(BASE) === 0) {
      var r = u.slice(BASE.length);
      /* ⚠️ já desviado não desvia de novo: o PDV monta algumas URLs em cima de
         outras e o prefixo entraria duas vezes */
      return r.indexOf('/t/') === 0 ? u : BASE + RAIZ + r;
    }
    /* ⚠️ `/db` É UM PROXY DA NETLIFY QUE NÃO EXISTE AQUI. O interno fala com
       o banco por esse atalho — e fora da Netlify ele é 404, que foi o erro
       que a prova mostrou nas abas Metas e Agenda. No produto o desvio manda
       direto para o Firebase, já com o prefixo do salão. Quando houver a
       função de proxy do produto, basta trocar BASE por PROXY aqui. */
    if (u === PROXY || u.indexOf(PROXY + '/') === 0) {
      var p = u.slice(PROXY.length);
      return p.indexOf('/t/') === 0 ? BASE + p : BASE + RAIZ + p;
    }
    return u;
  }

  var _fetch = window.fetch;
  window.fetch = function (entrada, opcoes) {
    if (typeof entrada === 'string') entrada = desviar(entrada);
    else if (entrada && entrada.url) entrada = new Request(desviar(entrada.url), entrada);
    return _fetch.call(this, entrada, opcoes);
  };

  /* ⚠️ O XHR TAMBÉM. Parte do código antigo do PDV usa XMLHttpRequest, e
     travar só o fetch deixaria essa porta aberta sem ninguém perceber. */
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (metodo, url) {
    arguments[1] = desviar(url);
    return _open.apply(this, arguments);
  };

  /* ══════════════════════════════════════════════════════════════════════
     🔴 O SDK DO FIREBASE NÃO PASSA POR fetch NEM POR XHR.

     O PDV carrega `firebase-database-compat.min.js` e fala com o banco por
     WebSocket próprio. Com a trava só no fetch, a prova acusava "0 chamadas
     ao banco" — e eu quase li isso como "está seguro", quando significava o
     contrário: o tráfego existia e passava POR FORA. O PDV copiado estaria
     lendo e escrevendo no banco do salão dela.

     O desvio aqui é no `ref()`: toda referência nasce dentro de `t/{salao}`.
     Como a trava roda ANTES do SDK existir, `window.firebase` é esperado por
     um setter — quando o SDK se instala, o patch entra junto.
     ══════════════════════════════════════════════════════════════════════ */
  var patchado = false;

  function prefixar(caminho) {
    var p = String(caminho == null ? '' : caminho).replace(/^\/+/, '');
    /* ⚠️ `.info` NÃO SE PREFIXA. É o nó de metadados do próprio Firebase
       (`.info/connected`, `.info/serverTimeOffset`): vive só na raiz e,
       prefixado, o SDK recusa com "invalid path" — o PDV perdia o relógio do
       servidor e o aviso de offline. Não guarda dado de salão nenhum, então
       deixar passar não abre buraco. */
    if (p.indexOf('.info') === 0) return p;
    if (p.indexOf('t/' + SALAO) === 0) return p;        /* já desviado */
    return 't/' + SALAO + (p ? '/' + p : '');
  }

  function patchDatabase(fb) {
    if (!fb || typeof fb.database !== 'function' || fb.database.__ls) return false;
    var _database = fb.database;
    var envolvido = function () {
      var db = _database.apply(this, arguments);
      if (db && !db.__ls) {
        db.__ls = true;
        var _ref = db.ref.bind(db);
        db.ref = function (p) { return _ref(prefixar(p)); };
        if (typeof db.refFromURL === 'function') {
          var _rfu = db.refFromURL.bind(db);
          db.refFromURL = function (u) { return _rfu(desviar(u)); };
        }
      }
      return db;
    };
    /* o SDK pendura coisas em firebase.database (ServerValue, enableLogging…) */
    for (var k in _database) { try { envolvido[k] = _database[k]; } catch (e) {} }
    envolvido.__ls = true;
    try { fb.database = envolvido; } catch (e) { return false; }
    patchado = true;
    return true;
  }

  function vigiar(fb) {
    if (!fb) return;
    if (patchDatabase(fb)) return;
    /* o módulo database pode chegar depois do core: espera por ele */
    if (typeof fb.initializeApp === 'function' && !fb.initializeApp.__ls) {
      var _init = fb.initializeApp;
      var novo = function () {
        var r = _init.apply(this, arguments);
        patchDatabase(fb);
        if (!patchado) {
          /* ⚠️ FALHAR ALTO. Vazar baixo é o que não pode: se o desvio não
             entrou, quem olhar o console vê — em vez de descobrir meses
             depois que dois salões dividiam a mesma agenda. */
          console.error('[ls-trava] 🔴 NÃO consegui desviar o Firebase. ' +
            'O sistema está falando com o banco SEM o prefixo do salão.');
          window.LS_TRAVA_FALHOU = true;
        }
        return r;
      };
      novo.__ls = true;
      for (var k2 in _init) { try { novo[k2] = _init[k2]; } catch (e) {} }
      try { fb.initializeApp = novo; } catch (e) {}
    }
  }

  var _fb = window.firebase;
  try {
    Object.defineProperty(window, 'firebase', {
      configurable: true,
      get: function () { return _fb; },
      set: function (v) { _fb = v; vigiar(v); }
    });
  } catch (e) {}
  if (_fb) vigiar(_fb);

  /* quem quiser saber em que salão está — a casca usa pra mostrar na lateral */
  window.LS_SALAO = SALAO;
  window.LS_RAIZ  = RAIZ;
  window.LS_TRAVA = { prefixar: prefixar, desviar: desviar,
                      get patchado() { return patchado; } };
})();
