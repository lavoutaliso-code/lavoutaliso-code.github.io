/* ══════════════════════════════════════════════════════════════════════════
   FECHAR CAIXA DE HOJE — o comprovante saindo da impressora.

   É a mesma animação do "registrar entrada" do Lei dos Potes, portada de
   www/index.html (#cupom-palco / mostrarCupom). As regras que eu trouxe
   junto, porque cada uma resolve um defeito que já aconteceu lá:

   ⚠️ O PAPEL SAI DE DENTRO PRA FORA, e é o PAR de scaleY(-1) que faz isso —
      um na saída (entrega o recorte crescendo pela borda de cima, junto da
      fenda) e outro no papel (devolve o texto na leitura certa). Tirar um
      dos dois faz o cupom descer como cortina: bonito, e não é impressora.
   ⚠️ A MÁQUINA NÃO ANDA. Só a folha se mexe. Por isso o palco é
      overflow:hidden e a centragem é escrita UMA vez, antes de imprimir —
      centrar durante faria a impressora descer a cada linha.
   ⚠️ O ALVO DA ALTURA É MEDIDO, NUNCA FIXO. Um dia com 8 profissionais dá um
      papel bem mais comprido que um dia com 3; altura fixa cortaria o fim do
      comprovante, que é justamente onde está o lucro.
   ⚠️ O BOTÃO DE SAIR NASCE SOZINHO, 1,2s depois, e não no fim da impressão.
      Tela cheia sem saída é a pior coisa: se a transição não terminar (aba
      em segundo plano, animação desligada no sistema) ela fica presa.
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ FECHAR O CAIXA AQUI NÃO GRAVA NADA NO BANCO, e é de propósito. Quem
   fecha comanda é o PDV; esta tela LÊ e conta. Um segundo lugar que escreve
   fechamento seria um segundo lugar pra divergir do PDV. */
/* o dia que o comprovante está mostrando — hoje, por padrão */
let CX_DIA = null;
function fecharCaixa(dia){
  CX_DIA = dia || _hoje();
  return _imprimirCaixa();
}
function cxTrocarDia(d){
  /* ⚠️ setTimeout e não requestAnimationFrame — é a segunda vez que o rAF me
     morde neste arquivo: ele não roda em aba de segundo plano nem no
     headless, e trocar a data simplesmente não reimprimia. */
  CX_DIA = d;
  fecharCupom();
  setTimeout(()=>{ _imprimirCaixa(); cxPeMontar(); }, 16);
}
function _imprimirCaixa(){
  const P = document.getElementById('cxPalco');
  const papel = document.getElementById('cxPapel');
  const saida = document.getElementById('cxSaida');
  const imp   = document.getElementById('cxImp');

  /* ⚠️ O CUPOM MEDE O DIA ESCOLHIDO, não "hoje". Antes ele lia o HJ direto e
     só sabia imprimir o dia corrente; ela pediu pra poder fechar o caixa de
     outra data (04/09). O D abaixo é a medição daquele dia, com a mesma
     régua — inclusive o custo de funcionamento que vem das contas a pagar. */
  const D = medirDia(CX_DIA);
  const prof = Object.entries(D.prof||{}).sort((a,b)=>b[1]-a[1]);
  /* ⭐ o que ficou para trás em dia já fechado sai neste fechamento */
  const ATRc = (typeof npAtrasado==='function') ? npAtrasado(CX_DIA) : {itens:[], total:0};
  const moTot = Math.round((prof.reduce((s,[,v])=>s+v,0) + ATRc.total)*100)/100;
  const bonus = (D.eleg||0)*BONUS_UN;
  const invBon= (D.eleg||0)*INVEST_UN;
  const [aa,mm,dd] = CX_DIA.split('-').map(Number);
  const dt = new Date(Date.UTC(aa,mm-1,dd));
  const sem = dt.toLocaleDateString('pt-BR',{weekday:'long', timeZone:'UTC'});
  const dia = dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});
  const ln = (l,v,cls='') => `<div class="cxLn ${cls}"><span class="lab">${l}</span>
      <span class="val">${v}</span></div>`;
  const rs = v => 'R$ ' + brl(v);
  const formas = Object.entries(D.formas||{}).sort((a,b)=>b[1]-a[1]);

  papel.innerHTML = `
    <div class="cxTit"><h4>LAVOU TÁ LISO</h4><p>fechamento de caixa</p></div>
    <div class="cxSub center">${sem} · ${dia}${CX_DIA===_hoje() ? ' · '+AGORA_H : ''}</div>
    <div class="cxTraco">· · · · · · · · · · · · · · ·</div>

    <div class="cxLn hero"><span class="lab">o salão fez hoje</span>
      <span class="val">${rs(D.fat)}</span></div>
    <div class="cxSub center">${D.n} comanda${D.n===1?'':'s'} fechada${D.n===1?'':'s'}
      · ${D.eleg||0} procedimento${(D.eleg||0)===1?'':'s'}</div>

    <div class="cxSec">A equipe de hoje</div>
    ${prof.length
      ? prof.map(([n,v])=>ln(n, rs(v))).join('')
        + `<div class="cxSub">Mão de obra do dia. O bônus de 8% é semanal e
             condicional — só entra pra quem não teve reclamação.</div>`
      : `<div class="cxSub">Nenhuma comanda com profissional marcada ainda.</div>`}
    <!-- ⭐ CLIENTE NÃO PAGANTE APARECE COM NOME (ela, 16/09/2026). Sem esta
         lista, um dia de R$0 de faturamento mostrava "mão de obra R$ 236" sem
         dizer de onde vinha — e ela não teria como conferir o que está pagando. -->
    ${(D.npItens && D.npItens.length) ? `
      <div class="cxSub">Cliente não pagante — o trabalho foi feito e é devido:</div>
      ${D.npItens.map(x=>ln(`${x.prof} <em>${x.servico}${x.tipo==='dona'?' · a proprietária':' · modelo'}</em>`, rs(x.v))).join('')}` : ''}
    <!-- ⭐ O ATRASADO VEM COM O DIA DE ORIGEM ESCRITO (ela, 16/09/2026). Pagar
         a Fran junto com a Dani não pode virar "R$ 278 da segunda": o
         atendimento dela foi em 08/09 e o cupom tem que dizer isso, senão daqui
         a um mês ninguém sabe por que aquele dia custou mais. -->
    ${ATRc.itens.length ? `
      <div class="cxSub">Ficou para trás — o dia já estava fechado quando foi lançado:</div>
      ${ATRc.itens.map(x=>ln(
        `${x.prof} <em>${x.servico} · de ${x.dia.slice(8)}/${x.dia.slice(5,7)}</em>`,
        rs(x.v))).join('')}` : ''}
    ${ln('<b>mão de obra</b>', '<b>'+rs(moTot)+'</b>', 'total')}

    <div class="cxSec">Para onde o dinheiro foi</div>
    ${ln('Mão de obra <em>sai no fechamento</em>', rs(moTot))}
    ${ln('Bônus da equipe <em>fica reservado</em>', rs(bonus))}
    ${ln('Investimento 2ª unidade', rs(invBon + (D.eleg||0)*SIN_INV))}
    ${ln('Estoque', rs((D.eleg||0)*SIN_EST))}
    ${ln('Marketing', rs((D.eleg||0)*SIN_MKT))}
    ${ln('Custo de funcionamento', rs(D.oper||0))}
    <!-- ⚠️ DOIS TEXTOS, PORQUE SÃO DOIS MOTIVOS DIFERENTES PRA UM NÚMERO. Zero
         num domingo ou numa segunda não é "ainda não entrou": é a regra dela de
         16/09 — as contas do mês são divididas por terça a sábado, então esses
         dois dias não carregam custo fixo. Um texto só mentiria num dos casos. -->
    <div class="cxSub">${(D.diasCusto||0) === 0
      ? `${sem.charAt(0).toUpperCase()+sem.slice(1)} não carrega custo fixo — as
         contas do mês são divididas de terça a sábado.`
      : `O funcionamento entra inteiro logo de manhã — por isso
         o dia começa negativo e a margem só faz sentido no fim.`}</div>

    <div class="cxSec">Como entrou</div>
    ${formas.length ? formas.map(([f,v])=>ln(f, rs(v))).join('')
                    : `<div class="cxSub">Nenhuma forma registrada.</div>`}
    <!-- ⚠️ O SINAL É MEDIDO, NÃO CALCULADO A R$80 POR PROCEDIMENTO. Era
         eleg vezes 80, e isso só funcionava enquanto todo mundo pagasse um sinal
         de 80. Em 15/09 a Fernanda tinha pago DOIS (R$ 160, Asaas 12 e 14/09) e
         a linha dizia R$ 400 quando entraram R$ 480. D.sinal é a soma do que
         cada comanda realmente traz.
         ⚠️ SEM CRASE NESTE COMENTÁRIO: ele vive dentro de um template literal, e
         uma crase aqui FECHA A STRING. Já quebrou o estorno.js e o
         miolo-5-saldo.js — é a terceira vez. -->
    ${ln('Sinal já pago antes', rs(D.sinal||0))}

    ${ln('<b>LUCRO DE HOJE</b>', '<b>'+rs(D.lucro)+'</b>',
         'total' + (D.lucro<0 ? ' neg' : ''))}
    <div class="cxSub">margem de ${p1(D.fat ? D.lucro/D.fat*100 : 0)}% · imposto de ${rs(D.imposto||0)}
      fica reservado, fora desta conta.</div>

    <div class="cxFinal">
      <span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="#fff"
        stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="m4 12 6 6L20 6"/></svg></span>
      <div class="frase">Caixa do dia<br>conferido</div>
    </div>
    <div class="cxBar">
      <svg width="150" height="34" viewBox="0 0 150 34">${
        Array.from({length:44},(_,i)=>{
          /* ⚠️ sem Math.random: o mesmo dia tem que imprimir o mesmo código */
          const w = 1 + ((i*7 + (D.n||0)*13) % 3);
          return `<rect x="${i*3.4}" y="0" width="${w}" height="34" fill="#1C1C1E"/>`;
        }).join('')}</svg>
      <span>${dia.replace(/\//g,'')} · ${String(Math.round(D.fat*100)).padStart(8,'0')}</span>
    </div>`;

  P.classList.add('on');
  /* ⚠️ A MEDIÇÃO É SÍNCRONA, e não dentro de requestAnimationFrame.
     Estava em rAF e a sonda pegou: em aba de segundo plano (e no headless)
     o rAF não roda, então --alvo nunca era escrito e o papel ficava com
     max-height 0 — a impressora acendia e não saía nada. Quem só pode
     esperar um quadro é o toggle da classe, porque ele é a transição. */
  /* ⚠️ O RODAPÉ RESERVA ESPAÇO. Ele deixou de ser um botão e virou seletor de
     data + confirmação + dois botões — perto de 300px. Com a reserva antiga
     de 120 o comprovante nascia por baixo dele e "COMO ENTROU" ficava
     escondido atrás dos dias. Quem confere isso é a sonda _cxpe. */
  /* ⚠️ dentro do gestor a barra dele come mais 92px do rodapé */
  /* ⚠️⚠️ A NOTA SAI INTEIRA, E QUEM ROLA É O PALCO (dona, 09/09/2026: "na aba
     fechar caixa, uma tela sobrepõe a animação da nota. isso não pode
     acontecer").
     MEDIDO: no iPhone a nota tinha 586px e o teto do `transborda` a cortava em
     228 — ela parava em "A EQUIPE DE HOJE" e o resto não existia. No
     computador cortava no meio de uma frase. Sobrava um vão morto e, embaixo,
     o rodapé. Encolher a nota pra caber (o `--k`) também não serve: uma nota de
     1800px espremida numa tela de telefone não se lê.
     Agora a nota imprime em tamanho de leitura e o palco rola. O rodapé
     continua fixo, e o espaço dele é RESERVADO com a altura MEDIDA — não com
     os 300px chutados de antes, que erravam por quase 100. */
  /* ⚠️ A RESERVA DO RODAPÉ É MEDIDA NO cxPeMontar(), NÃO AQUI. Aqui o rodapé
     ainda está vazio — ele só é montado 1,2s depois, quando a impressão
     termina. Medindo agora dava 92px pra um rodapé que no iPhone tem 564, e a
     nota continuava atrás dele. Quem sabe a altura do rodapé é ele mesmo. */
  P.style.setProperty('--k', '1');
  /* ⚠️ +24: o papel tem uma borda rasgada desenhada por `::after` que fica
     FORA do scrollHeight. Sem a folga, os últimos 6px da nota ficavam
     decepados — pouco, mas é o rodapé do cupom. */
  P.style.setProperty('--alvo', (Math.ceil(papel.scrollHeight) + 24) + 'px');
  /* papel comprido demora mais pra sair, como impressora de verdade */
  P.style.setProperty('--dur', Math.min(7, Math.max(2.4, papel.scrollHeight/260)).toFixed(1)+'s');
  /* ⚠️ O `--topo` CENTRAVA A NOTA NO ESPAÇO QUE SOBRAVA — e agora não sobra
     espaço: a nota sai inteira e o palco rola. Um respiro fixo no topo é o que
     resta fazer sentido; a conta antiga usava o `cabe`/`k` que deixaram de
     existir e quebrava a impressão inteira. */
  P.style.setProperty('--topo', '20px');
  /* ⚠️ O TETO DE ALTURA SAIU. Ele existia pra a nota não passar por baixo do
     rodapé — mas o preço era a nota CORTADA, que é pior: ela deixava de poder
     ler o próprio fechamento. Agora o palco rola e o rodapé tem espaço
     reservado, então nada fica escondido e nada é decepado. */
  saida.style.maxHeight = '';
  P.classList.remove('transborda');
  imp.classList.add('imprimindo');
  /* setTimeout e não rAF: precisa disparar mesmo com a aba escondida */
  setTimeout(()=>saida.classList.add('aberta'), 16);
  setTimeout(()=>{ P.classList.add('pronto'); cxPeMontar(); }, 1200);
}

/* ══ CONFIRMAR O FECHAMENTO ═══════════════════════════════════════════════
   Ordem dela, 04/09: "fechar caixa significa pagar equipe e retirar lucro".
   Então o botão não é decorativo — ele lança DUAS saídas de verdade:
     · EQUIPE — a mão de obra do dia mais o bônus
     · LUCRO  — o lucro do dia
   As duas saem de uma conta escolhida, abatem o saldo total e encolhem os
   anéis correspondentes, igual a qualquer outra saída.

   ⚠️ UM DIA SÓ FECHA UMA VEZ. Sem isto, dois cliques cobrariam a equipe duas
      vezes e o painel ficaria devendo dinheiro que não saiu. O dia fechado
      fica gravado em `financeiro/fechamentos/AAAA-MM-DD`.
   ⚠️ E NÃO FECHA DIA SEM MOVIMENTO: sem comanda não há mão de obra a pagar
      nem lucro a tirar, e o botão diria "confirmar" pra não fazer nada. */
/* ⚠️ O FECHAMENTO PASSOU A TER DUAS METADES (dona, 09/09/2026): "botões
   separados > pagar equipe e retirar lucro, pois pode ter dia que eu não queira
   fazer os dois". Então o registro do dia deixou de ser "fechado ou não" e virou
   duas marcas independentes.

   ⚠️ COMPATIBILIDADE COM O QUE JÁ ESTÁ GRAVADO: os dias fechados antes de hoje
   não têm o campo `feito`. Naquele fluxo o botão fazia SEMPRE as duas coisas —
   então registro velho, sem `feito`, significa as duas metades feitas. Ler o
   antigo como "nada feito" ofereceria pagar de novo o que já foi pago. */
function cxEstado(dia){
  const r = FECHAMENTOS[dia] || null;
  if(!r) return {fezEquipe:false, fezLucro:false, vEquipe:0, vLucro:0, bonus:0, conta:null};
  const velho = !r.feito;
  return {
    fezEquipe: velho ? true : !!r.feito.equipe,
    fezLucro:  velho ? true : !!r.feito.lucro,
    vEquipe: Number(r.equipe)||0, vLucro: Number(r.lucro)||0,
    bonus: Number(r.bonusReservado)||0, conta: r.conta||null
  };
}

function cxPeMontar(){
  const pe = document.getElementById('cxPe'); if(!pe) return;
  const dia = CX_DIA || _hoje();
  const D = medirDia(dia);
  /* ⚠️ O BÔNUS NÃO SAI NO FECHAMENTO (ordem dela, 04/09). Fechar o caixa paga
     a MÃO DE OBRA do dia e retira o lucro. O bônus — os R$8,96 por
     procedimento — é verba que fica guardada no pote da Equipe até o dia de
     pagar a bonificação. */
  /* ⭐ O ATRASADO ENTRA NO VALOR A PAGAR (ela, 16/09/2026): "coloque pra pagar
     a Fran agora junto com a Dani de segunda". Ver `npAtrasado()`. */
  const ATR = (typeof npAtrasado==='function') ? npAtrasado(dia) : {itens:[], total:0};
  const equipe = c2c((D.mo||0) + ATR.total);
  const bonus  = c2c((D.eleg||0)*BONUS_UN);
  const lucro  = c2c(D.lucro||0);
  const E = cxEstado(dia);
  const f = {equipe: E.fezEquipe ? E.vEquipe : 0, lucro: E.fezLucro ? E.vLucro : 0};

  const dias = diasComCaixa().slice(0,8);
  const rot = d => { const [a,m,x]=d.split('-'); return `${x}/${m}`; };
  /* ⚠️ OS ATALHOS NÃO BASTAM (dona, 09/09): "lá embaixo deve ter um campo pra
     escolher a data que você quer ver o caixa". Os oito botões são os dias com
     comanda — bons pro uso diário, inúteis pra ver um dia de duas semanas
     atrás. O campo de data abre QUALQUER dia; os atalhos ficam, porque são um
     toque em vez de três. */
  const seletor = `<div class="cxDias">
    <span>ver o caixa de</span>
    ${dias.map(d=>{const e=cxEstado(d);const meio=e.fezEquipe!==e.fezLucro;
      return `<button class="cxD${d===dia?' on':''}${(e.fezEquipe||e.fezLucro)?(meio?' meio':' fez'):''}"
      onclick="cxTrocarDia('${d}')">${rot(d)}${d===_hoje()?' <em>hoje</em>':''}
      ${e.fezEquipe&&e.fezLucro?'<i>✓</i>':(meio?'<i class="m">½</i>':'')}</button>`}).join('')}
    <label class="cxDataC">outra data
      <input type="date" class="cxData" value="${dia}" max="${_hoje()}"
        onchange="cxTrocarDia(this.value)"></label>
  </div>`;

  const antifurto = (typeof afBloco === 'function') ? afBloco(dia) : '';

  /* ⚠️ "NENHUMA COMANDA" NÃO É "NENHUM ATENDIMENTO" (ela, 16/09/2026). Um dia
     de cliente não pagante tem ZERO comanda e mão de obra a pagar — 14/09 tem
     R$ 236 da Dani. Com `!D.n` sozinho, o dia caía aqui e o botão de pagar nem
     aparecia. Agora o corte é o movimento de verdade: comanda OU não pagante. */
  const semMovimento = !D.n && !(D.npMo > 0);
  if(semMovimento && !E.fezEquipe && !E.fezLucro){
    pe.innerHTML = seletor + antifurto + `<div class="cxJa">Nenhum atendimento em ${rot(dia)} —
      não há mão de obra a pagar nem lucro a retirar.</div>
      <button class="cxBt2 largo" onclick="fecharCupom()">Fechar</button>`;
    return;
  }
  if(E.fezEquipe && E.fezLucro){
    pe.innerHTML = seletor + antifurto + `<div class="cxJa">O caixa de ${rot(dia)} já foi fechado —
      mão de obra <b>R$ ${brl(E.vEquipe)}</b> e lucro <b>R$ ${brl(E.vLucro)}</b>
      saíram do ${(ONDE.find(o=>o.k===E.conta)||{}).n||E.conta||'—'}.${E.bonus
        ? ` O bônus de <b>R$ ${brl(E.bonus)}</b> continua guardado na Equipe.` : ''}</div>
      <button class="cxBt2 largo" onclick="fecharCupom()">Fechar</button>`;
    return;
  }

  pe.innerHTML = seletor + antifurto + `
    <div class="cxConf">
      <div class="cxConfT">O fechamento de ${rot(dia)} tira do caixa</div>
      <div class="cxConfL${E.fezEquipe?' ok':''}"><span>Mão de obra</span>
        <b>${E.fezEquipe?`paga · R$ ${brl(E.vEquipe)}`:`R$ ${brl(equipe)}`}</b></div>
      ${(!E.fezEquipe && ATR.total) ? `<div class="cxConfL fica"><span>inclui
        <b>R$ ${brl(ATR.total)}</b> de ${ATR.itens.map(x=>x.prof).filter((v,i,a)=>a.indexOf(v)===i).join(', ')}
        <em>que ficou de ${ATR.itens.map(x=>x.dia.slice(8)+'/'+x.dia.slice(5,7))
          .filter((v,i,a)=>a.indexOf(v)===i).join(', ')}</em></span>
        <b>vai junto</b></div>` : ''}
      <div class="cxConfL${E.fezLucro?' ok':''}"><span>Lucro</span>
        <b>${E.fezLucro?`retirado · R$ ${brl(E.vLucro)}`:`R$ ${brl(lucro)}`}</b></div>
      ${bonus ? `<div class="cxConfL fica"><span>Bônus de R$ ${brl(bonus)} <em>fica na Equipe</em></span>
        <b>não sai agora</b></div>` : ''}
      <div class="cxConfC">de qual conta?
        ${(typeof contasQuePagam==='function'?contasQuePagam():ONDE).map(o=>`<button class="cxC${o.k===_contaEscolhida?' on':''}"
          data-k="${o.k}" onclick="cxConta('${o.k}')" style="--c:${o.c}">
          ${o.n}<em>R$ ${brl(o.saldo)}</em></button>`).join('')}</div>
    </div>
    <!-- ⚠️ DOIS BOTÕES, NÃO UM. Cada um lança SÓ a sua saída e é registrado à
         parte: fazer um não obriga a fazer o outro, nem impede de fazer o
         outro depois. O que já foi feito fica escrito no próprio botão. -->
    <div class="cxBts">
      <button class="cxBt eq" onclick="cxConfirmar('equipe')" ${E.fezEquipe||equipe<=0?'disabled':''}
        >${E.fezEquipe ? `Mão de obra paga`
          : equipe>0 ? `Pagar mão de obra · R$ ${brl(equipe)}`
          : `Sem mão de obra a pagar`}</button>
      <!-- ⚠️ LUCRO NEGATIVO NÃO SE RETIRA. O custo fixo entra inteiro de manhã,
           então o lucro do dia começa NEGATIVO e só vira quando as comandas
           fecham. Oferecer "Retirar lucro · R$ −63,07" é oferecer uma operação
           que não existe — e a função recusaria depois do clique, o que é pior
           do que o botão já dizer. -->
      <button class="cxBt lu" onclick="cxConfirmar('lucro')" ${E.fezLucro||lucro<=0?'disabled':''}
        >${E.fezLucro ? `Lucro retirado`
          : lucro>0 ? `Retirar lucro · R$ ${brl(lucro)}`
          : `Sem lucro a retirar${lucro<0?` · o dia está em R$ ${brl(lucro)}`:''}`}</button>
    </div>
    <button class="cxBt2 largo" onclick="fecharCupom()">Agora não</button>`;
  cxReservarPe();
}

/* ⚠️ O RODAPÉ DIZ QUANTO ESPAÇO ELE OCUPA. Ele muda de tamanho conforme o dia
   (o bloco anti-furto, os dois botões, o aviso de já fechado), então a reserva
   tem que ser refeita a cada montagem — número fixo erra sempre em um dos
   casos. Medido no iPhone: 564px de rodapé contra os 92 que a conta anterior
   reservava. */
function cxReservarPe(){
  const P = document.getElementById('cxPalco'), pe = document.getElementById('cxPe');
  if(!P || !pe) return;
  const embut = document.documentElement.classList.contains('embutido');
  const alt = Math.ceil(pe.getBoundingClientRect().height);
  P.style.setProperty('--pe', (Math.max(120, alt) + (embut ? 92 : 0) + 28) + 'px');
}
const c2c = v => Math.round((Number(v)||0)*100)/100;
function cxConta(k){ _contaEscolhida = k; cxPeMontar(); }
/* ⚠️ UMA METADE POR VEZ. Antes isto lançava as duas saídas juntas e carimbava o
   dia como fechado; agora recebe QUAL metade, lança só ela e regrava o registro
   preservando o que a outra já tinha feito. Um dia pode ficar com a mão de obra
   paga e o lucro ainda no caixa — que é exatamente o que ela pediu.

   ⚠️ A MESMA METADE NÃO PODE SAIR DUAS VEZES. É a trava que existia no
   "um dia só fecha uma vez", agora por parte: o botão nasce desabilitado e a
   função confere de novo antes de gravar (botão desabilitado é aparência; a
   parede é aqui). */
async function cxConfirmar(parte){
  const dia = CX_DIA || _hoje();
  const E = cxEstado(dia);
  if(parte==='equipe' && E.fezEquipe) return;
  if(parte==='lucro'  && E.fezLucro)  return;
  const D = medirDia(dia);
  const conta = ONDE.find(o=>o.k===_contaEscolhida);
  if(!conta){ alert('Escolha de qual conta o dinheiro sai.'); return; }
  /* ⚠️ O MESMO CÁLCULO DAS DUAS BANDAS. Se o botão somar o atrasado e a
     confirmação não somar, ela clica em "pagar R$ 278" e saem R$ 236 — o tipo
     de divergência que ninguém percebe na hora. */
  const ATR = (typeof npAtrasado==='function') ? npAtrasado(dia) : {itens:[], total:0};
  const equipe = c2c((D.mo||0) + ATR.total);
  const bonus  = c2c((D.eleg||0)*BONUS_UN);
  const lucro  = c2c(D.lucro||0);
  const v   = parte==='equipe' ? equipe : lucro;
  const rot = dia.slice(8)+'/'+dia.slice(5,7);
  const nome = parte==='equipe' ? 'mão de obra' : 'retirada de lucro';

  if(!(v>0)){ alert(`Não há ${nome} para lançar em ${rot}.`); return; }
  if(!confirm(`${parte==='equipe'?'Pagar a mão de obra':'Retirar o lucro'} de ${rot}?\n\n`
    +`Sai R$ ${brl(v)} do ${conta.n}.\n\n`
    +(parte==='equipe' && bonus
      ? `O bônus de R$ ${brl(bonus)} NÃO sai agora — fica guardado no pote\n`
       +`da Equipe até você lançar a saída no dia de pagar.\n\n` : '')
    +(conta.saldo < v ? `⚠️ O ${conta.n} tem só R$ ${brl(conta.saldo)}.\n\n` : '')
    +`A outra metade do fechamento continua disponível.`)) return;

  /* ⭐⭐ A SAÍDA É DATADA NO DIA DO CLIQUE, NÃO NO DIA FECHADO — ela, 01/10/2026:
     *"fechamento de caixa constando no dia do caixa, errado! deve constar no
     dia que eu cliquei em pagar mão de obra, esse foi o dia que o dinheiro saiu
     da conta."* Ela está certa: o extrato responde "quando o dinheiro saiu da
     conta", e fechar o caixa de 29/09 no dia 30/09 tira o dinheiro em 30/09.
     Medido em 01/10: dos 27 fechamentos, 24 estavam datados no dia fechado e
     não no dia do pagamento — até 3 dias de distância (o de 05/09 foi pago em
     07/09).
     ⚠️ QUAL DIA FOI FECHADO NÃO SE PERDE: ele está no NOME (`Fechamento 29/09`)
     e, de verdade, no nó `financeiro/fechamentos`, que é quem responde "este
     dia já foi fechado?" (`FECHAMENTOS[dia]`). O `dia` da saída nunca foi a
     fonte disso — por isso dá pra corrigir sem quebrar a trava de fechar duas
     vezes.
     ⚠️ `_hoje()` é o relógio de Brasília. Usar `new Date()` cru faria o
     fechamento das 21h30 nascer no dia seguinte. */
  const diaDoCaixa = _hoje();
  const reg = parte==='equipe'
    ? {em:Date.now(), dia:diaDoCaixa, diaFechado:dia, cat:'equipe',
       n:`Fechamento ${rot} · mão de obra`, sub:'mao-de-obra', v, conta:conta.k}
    : {em:Date.now(), dia:diaDoCaixa, diaFechado:dia, cat:'lucro',
       n:`Fechamento ${rot} · retirada de lucro`, v, conta:conta.k};
  const ok = await sdLancar(reg);
  if(!ok) return;

  /* ⚠️ GRAVA PRESERVANDO A OUTRA METADE. Sem o merge, pagar a mão de obra
     apagaria o registro de um lucro já retirado — e o painel voltaria a
     oferecer a retirada de um dinheiro que já saiu. */
  const antes = FECHAMENTOS[dia] || {};
  const feito = Object.assign({equipe:E.fezEquipe, lucro:E.fezLucro},
    {[parte]: true});
  const novo = Object.assign({}, antes, {
    dia, fat:D.fat, conta:conta.k, feito,
    equipe: parte==='equipe' ? v : (E.fezEquipe ? E.vEquipe : 0),
    lucro:  parte==='lucro'  ? v : (E.fezLucro  ? E.vLucro  : 0),
    bonusReservado: bonus,
    [parte==='equipe' ? 'emEquipe' : 'emLucro']: Date.now()
  });
  try{ await fetch(`${DBURL}/${FC_NO}/${dia}.json`, {method:'PUT', body:JSON.stringify(novo)}); }
  catch(e){ alert('A saída foi lançada, mas não consegui gravar a marca do dia. '
    +'Confira antes de repetir.'); }
  FECHAMENTOS[dia] = novo;

  /* ⭐⭐ O NÃO PAGANTE PAGO AQUI FICA CARIMBADO COMO PAGO (16/09/2026).
     Até hoje o fechamento pagava a mão de obra da modelo e o registro em
     `pdv/nao_pagantes` continuava com `pago:false` para sempre — quer dizer que
     o MESMO trabalho podia ser pago de novo pelo caminho do PDV ("pagar
     modelo"), sem nada na tela avisando. Dois caminhos pro mesmo dinheiro e
     nenhum sabendo do outro.
     Agora o fechamento carimba os do dia E os que ele arrastou, com o número da
     saída, e o arrasto passa a ignorá-los na próxima vez.
     ⚠️ DEPOIS DA SAÍDA TER SIDO GRAVADA. Carimbar antes deixaria o lançamento
     marcado como pago com o dinheiro não tendo saído. */
  if(parte === 'equipe'){
    const doDia = ((typeof _NP_DIA==='object' && _NP_DIA[dia]) || {}).itens || [];
    const alvos = doDia.filter(x=>x.pago !== true).concat(ATR.itens);
    for(const x of alvos){
      if(!x.id) continue;
      try{
        await fetch(`${DBURL}/pdv/nao_pagantes/${x.id}.json`, {method:'PATCH',
          body:JSON.stringify({pago:true, pagoEm:Date.now(),
            pagoPor:`fechamento de ${rot}`, pagamentoId:reg.em})});
        x.pago = true;
        /* ⚠️ E NO ÍNDICE EM MEMÓRIA TAMBÉM. `ATR.itens` são CÓPIAS — marcar só
           aqui deixava o `_NP_DIA` achando que o item continua a pagar, e o
           fechamento seguinte arrastava o mesmo dinheiro de novo. */
        if(typeof npMarcarPagoNaMemoria === 'function') npMarcarPagoNaMemoria(x.id);
      }catch(e){
        /* ⚠️ NÃO É SILENCIOSO. Se o carimbo falhar, o dinheiro já saiu e o
           lançamento continua "a pagar" — ela precisa saber pra não pagar de
           novo. Um alerta por falha, com o nome de quem ficou sem carimbo. */
        console.error('[fechamento] carimbar nao pagante', x.id, e);
        alert(`A mão de obra saiu, mas não consegui marcar o lançamento de `
          +`${x.prof} (${x.servico}) como pago. Confira antes de pagar de novo.`);
      }
    }
  }

  aplicarSaidas();
  cxPeMontar();
  repintarTudo();
  if(typeof sdAviso==='function') sdAviso(`${parte==='equipe'?'Mão de obra paga':'Lucro retirado'} · R$ ${brl(v)} do ${conta.n}`);
}
function fecharCupom(){
  const P = document.getElementById('cxPalco');
  P.classList.remove('on','pronto','transborda');
  document.getElementById('cxSaida').classList.remove('aberta');
  document.getElementById('cxImp').classList.remove('imprimindo');
}
function palcoCaixa(){
  return `
  <div id="cxPalco">
    <div class="cxCentro">
      <div class="impressora" id="cxImp">
        <div class="carcaca">
          <span class="logo-box">L</span><span class="nome">Lavou Tá Liso</span>
        </div>
        <div class="fenda"></div>
        <div class="dobrinha"></div>
        <div class="impSaida" id="cxSaida"><div class="impPapel" id="cxPapel"></div></div>
      </div>
    </div>
    <div class="cxPe" id="cxPe"></div>
  </div>`;
}
