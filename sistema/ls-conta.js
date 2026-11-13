/* ══════════════════════════════════════════════════════════════════════
   A CONTA — cadastro, entrada e o prazo do teste

   ⚠️⚠️ LEIA ISTO ANTES DE CONFIAR NESTE ARQUIVO.

   O sistema é servido por GitHub Pages, que é **estático**: não existe
   servidor nosso do outro lado. Medido, não suposto — não há uma única
   chamada de rede para backend em todo o `/sistema`.

   Isso tem três consequências, e nenhuma delas é contornável aqui:

     1. A SENHA FICA NO APARELHO. O que este arquivo guarda é um hash
        dela no `localStorage` do navegador. Quem abrir o inspetor do
        próprio celular vê o registro. Serve para separar contas num
        teste; NÃO serve para proteger dinheiro de ninguém.
     2. O DADO NÃO VIAJA. Cadastrou no celular, está no celular. Trocou
        de aparelho ou limpou o navegador, acabou. Não há backup.
     3. O PRAZO É CORTESIA. A data de expiração é lida do relógio do
        aparelho; mudar o relógio contorna. Vale como aviso, não trava.

   O que isto É, então: uma porta de entrada honesta para a demonstração
   — com conta separada por e-mail, para que o teste de uma pessoa não
   apareça na tela da outra. Para virar login de verdade é preciso um
   servidor (Vercel + banco), e aí a senha nunca chega perto do
   navegador.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const CHAVE  = 'ls_conta_v1';
  const SESSAO = 'ls_sessao_v1';
  /* o teste grátis vai até o fim do dia 30/11/2026, horário de Brasília */
  const FIM_DO_TESTE = new Date('2026-11-30T23:59:59-03:00');

  /* ⚠️ Hash, não senha em texto puro. Não é bcrypt — num site estático
     não há onde rodar um —, mas também não deixa a senha legível para
     quem abrir o armazenamento por curiosidade. */
  async function embaralhar(txt){
    const b = new TextEncoder().encode('laila·salon·' + txt);
    const h = await crypto.subtle.digest('SHA-256', b);
    return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2,'0')).join('');
  }

  const lerTodas = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); }
                           catch(e){ return {}; } };
  const gravar   = o  => { try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch(e){} };

  const API = {
    /* ── quem está logado ───────────────────────────────────────────── */
    atual(){
      try {
        const e = localStorage.getItem(SESSAO);
        if (!e) return null;
        const c = lerTodas()[e];
        return c ? { email:e, salao:c.salao, criada:c.criada } : null;
      } catch(e){ return null; }
    },

    /* ── o prazo ─────────────────────────────────────────────────────
       ⚠️ Devolve sempre os dois: se expirou E quantos dias faltam. Tela
       que só diz «expirado» no último dia pega a pessoa de surpresa. */
    prazo(){
      const agora = new Date();
      const ms = FIM_DO_TESTE - agora;
      return { expirou: ms <= 0,
               dias: Math.max(0, Math.ceil(ms / 86400000)),
               ate: FIM_DO_TESTE.toLocaleDateString('pt-BR',
                      { day:'2-digit', month:'long' }) };
    },

    /* ── cadastrar ───────────────────────────────────────────────────── */
    async cadastrar({ email, senha, salao }){
      email = String(email||'').trim().toLowerCase();
      salao = String(salao||'').trim();
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) throw new Error('Esse e-mail não parece certo.');
      if (String(senha||'').length < 6) throw new Error('A senha precisa de pelo menos 6 caracteres.');
      if (!salao) throw new Error('Falta o nome do salão.');
      const todas = lerTodas();
      if (todas[email]) throw new Error('Já existe uma conta com esse e-mail. É só entrar.');
      todas[email] = { chave: await embaralhar(senha), salao,
                       criada: new Date().toISOString() };
      gravar(todas);
      localStorage.setItem(SESSAO, email);
      return API.atual();
    },

    /* ── entrar ──────────────────────────────────────────────────────── */
    async entrar({ email, senha }){
      email = String(email||'').trim().toLowerCase();
      const c = lerTodas()[email];
      /* ⚠️ A MESMA frase para e-mail inexistente e senha errada. Dizer
         «esse e-mail não existe» conta a quem tenta quais e-mails estão
         cadastrados. */
      const erro = new Error('E-mail ou senha não conferem.');
      if (!c) throw erro;
      if (c.chave !== await embaralhar(senha)) throw erro;
      localStorage.setItem(SESSAO, email);
      return API.atual();
    },

    sair(){ try { localStorage.removeItem(SESSAO); } catch(e){} },

    /* ── o espaço de dados de CADA conta ──────────────────────────────
       ⚠️ Isto é o que impede o teste de uma pessoa de aparecer na tela
       da outra: toda chave de dado é prefixada com o e-mail. Sem isso,
       duas contas no mesmo navegador dividiriam o mesmo armazenamento —
       que é exatamente o «herdar dados de outro salão». */
    espaco(){
      const c = API.atual();
      const pre = 'ls_dados_' + (c ? c.email : 'visitante') + '_';
      return {
        ler:   k => { try { return JSON.parse(localStorage.getItem(pre+k) || 'null'); } catch(e){ return null; } },
        salvar:(k,v) => { try { localStorage.setItem(pre+k, JSON.stringify(v)); return true; } catch(e){ return false; } },
        apagar: k => { try { localStorage.removeItem(pre+k); } catch(e){} },
        /* tudo que é desta conta, para conferência */
        chaves: () => Object.keys(localStorage).filter(k => k.startsWith(pre)).map(k => k.slice(pre.length)),
      };
    },

    /* ── a porta: chama no topo de toda tela protegida ───────────────── */
    exigirEntrada(){
      const c = API.atual();
      const destino = 'entrar.html' + (location.hash || '');
      if (!c){ location.replace(destino); return false; }
      if (API.prazo().expirou){ location.replace('entrar.html?expirou=1'); return false; }
      return true;
    },
  };

  window.LS_CONTA = API;
})();
