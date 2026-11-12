/* ══════════════════════════════════════════════════════════════════════════
   ESTORNO — devolver dinheiro pra cliente, e o painel se reorganizar sozinho.

   Ordem dela, 05/09. A regra tem dois caminhos, e quem decide qual é ELA:

     PROCEDIMENTO NÃO REALIZADO  →  desfaz as verbas que o sinal criou
        marketing −R$17 · investimento −R$20 · estoque −R$43   (num sinal de 80)
        É o espelho exato da entrada: o dinheiro entrou e se dividiu em três,
        então volta desfazendo os três.

     PROCEDIMENTO JÁ REALIZADO   →  sai do LUCRO
        O serviço aconteceu: a equipe trabalhou, o produto foi gasto, o
        estoque foi consumido. Nada disso volta. Quem paga a devolução é o
        lucro do salão.

   Nos dois casos o dinheiro sai de uma CONTA, escolhida por ela — nunca
   assumida.

   ⚠️ POR QUE NÃO APAGAR O SINAL DO REGISTRO. Apagar esconde que o dinheiro
      entrou e saiu. Medido em 05/09: 9 conversas mencionam estorno e NENHUM
      tem registro financeiro — sumiram todos. Com lançamento, o extrato
      mostra a entrada e a devolução, e a soma continua fechando.

   ⚠️ VALOR DIFERENTE DE R$80 SAI PROPORCIONAL. A maioria dos sinais é 80 (66
      de 67 medidos), mas existe um de R$190 — a Lilide, procedimento não
      realizado. Em vez de inventar uma regra pra ele, as três verbas saem na
      mesma proporção do sinal padrão (17/80, 20/80, 43/80) e a tela MOSTRA os
      valores antes de confirmar. Pra R$80 dá exatamente 17/20/43.
   ══════════════════════════════════════════════════════════════════════════ */
/* ⭐⭐ O SEGUNDO CAMINHO, pedido por ela em 19/09/2026:
   *"a cliente paga o sinal e depois quer pagar tudo pessoalmente e ter a
   devolução do sinal… basicamente iria sair R$80 da nubank ou asaas e ir pra
   sicredi."*

   ⚠️ ISSO NÃO É ESTORNO. No estorno o dinheiro SAI DO SALÃO e algum pote paga a
   conta. Aqui ele NÃO SAI: o salão devolve o sinal e recebe o valor cheio no
   balcão, então o mesmo real só troca de conta. Abater pote aqui tiraria verba
   que continua com lastro — o erro que já custou R$3.789,20 na retirada da
   gaveta (ver [[caixa-em-dinheiro]]).

   Por isso os dois moram no mesmo botão mas em MODOS diferentes, e o modo é a
   primeira pergunta da gaveta — não um detalhe no fim. */
let _esTxt = '', _esNome = '', _esFeito = null, _esConta = null;
let _esModo = 'devolvi';          /* 'devolvi' | 'trocou'  */
let _esPara = null;               /* conta que RECEBE, no modo 'trocou' */

function estornoAbrir(){
  _esTxt = ''; _esNome = ''; _esFeito = null; _esModo = 'devolvi';
  _esConta = _esConta || (ONDE[0] && ONDE[0].k);
  /* o destino nasce na conta do balcão, que é para onde o dinheiro vai em
     praticamente todo caso — mas continua trocável */
  _esPara = _esPara || (ONDE.find(o=>o.k==='sicredi') ? 'sicredi'
                       : (ONDE.find(o=>!o.naoPaga && o.k!==_esConta)||{}).k);
  esPintar();
  document.getElementById('veu').classList.add('on');
}
function esModo(m){ _esModo = m; esPintar(); }
function esParaConta(k){ _esPara = k; esPintar(); }
const esValor = () => Number(String(_esTxt).replace(',','.')) || 0;
/* ⚠️ SÓ PARA MOSTRAR. O que ela digita (`_esTxt`) continua intocado — é dele
   que sai o `esValor()` e, daí, o lançamento. Formatar o texto digitado seria
   o jeito mais fácil de o número da tela deixar de ser o número lançado. */
function esFmt(t){
  const [i,d] = String(t).split(',');
  const inteiro = (i||'0').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return d===undefined ? inteiro : inteiro+','+d;
}
function esTecla(t){
  if(t==='⌫') _esTxt = _esTxt.slice(0,-1);
  else if(t===','){ if(!_esTxt.includes(',')) _esTxt = (_esTxt||'0')+','; }
  else { const [,dec] = _esTxt.split(',');
         if(dec !== undefined && dec.length>=2) return;
         if(_esTxt.replace(',','').length>=9) return;
         _esTxt += t; }
  esPintar();
}
function esFeito(v){ _esFeito = v; esPintar(); }
function esConta(k){ _esConta = k; esPintar(); }
function esNome(el){ _esNome = el.value; }

/* as três verbas, proporcionais ao valor devolvido */
function esVerbas(v){
  const p = k => Math.round(v * k / 80 * 100) / 100;
  const mkt = p(SIN_MKT), inv = p(SIN_INV);
  /* ⚠️ o estoque leva a sobra do arredondamento, pra as três somarem o valor
     devolvido no centavo — senão o extrato fecha com 1 centavo de diferença */
  const est = Math.round((v - mkt - inv) * 100) / 100;
  return {marketing:mkt, invest:inv, estoque:est};
}

/* ⚠️ A CLASSE DAS CONTAS SE CHAMA `esCt`, e NÃO `esConta`. Esse segundo nome já
   existia no CSS pra outra coisa — o bloco "o que vai ser lançado" — com fundo
   rosado e borda vermelha, e com especificidade maior que a minha. As contas
   nasciam pintadas de vermelho sem ninguém ter pedido. Nome colidido é bug
   silencioso: não dá erro, só fica errado.
   ⚠️ E cuidado com CRASE dentro deste arquivo: quase tudo aqui é template
   literal, e uma crase num comentário HTML fecha a string. Aconteceu. */
function esPintar(){
  /* a folha do estorno tem mais blocos que as outras e usa uma escala própria */
  const gav = document.getElementById('gaveta');
  if(gav) gav.classList.add('esG');
  const v = esValor();
  const conta = ONDE.find(o => o.k === _esConta);
  const para  = ONDE.find(o => o.k === _esPara);
  const vb = esVerbas(v);
  const trocou = _esModo === 'trocou';
  const podeIr = trocou
    ? (v > 0 && !!conta && !!para && conta.k !== para.k)
    : (v > 0 && _esFeito !== null && !!conta);
  /* ⚠️ DESENHO APROVADO POR ELA (mockup C · "Ficha", 09/09/2026): a tela mostra
     as verbas que vão ser DESFEITAS antes de confirmar. Nada acontece escondido.
     ⚠️ SÓ O DESENHO MUDOU. O valor, as verbas, a conta e o que é lançado saem
     das MESMAS funções de antes (`esValor`, `esVerbas`, `esConfirmar`) — se eu
     recalculasse aqui, um dia a tela e o lançamento diriam coisas diferentes. */
  document.getElementById('gaveta').innerHTML = `
    <div class="cdCab esFicha"><i></i><b>Devolver sinal</b>
      <button class="gx" onclick="fecharSaida()">✕</button></div>

    <!-- ⚠️ O MODO É A PRIMEIRA PERGUNTA. Os dois caminhos movem o mesmo R$80 e
         fazem coisas OPOSTAS com a verba: um desfaz pote, o outro não toca em
         nenhum. Perguntar isso no fim seria convidar o erro. -->
    <div class="esRot">O que aconteceu com o dinheiro?</div>
    <div class="esSeg esModo">
      <button class="${!trocou?'on':''}" onclick="esModo('devolvi')">Devolvi pra cliente</button>
      <button class="${trocou?'on':''}" onclick="esModo('trocou')">Ela pagou tudo no balcão</button>
    </div>
    <div class="esVn esModoNota">${trocou
      ? 'O dinheiro <b>não sai do salão</b>: você devolve o sinal e recebe o valor cheio no balcão. Ele só muda de conta, e nenhuma verba é tocada.'
      : 'O dinheiro <b>sai do salão</b> e vai para a cliente. Alguma verba paga por isso.'}</div>

    <div class="cdNum"><span>R$</span>${_esTxt ? esFmt(_esTxt) : '0,00'}</div>

    <!-- ⚠️ A PRÉVIA FICA EM CIMA, NÃO NO FIM. Medido em 19/09: no fim da gaveta
         ela nascia ATRÁS do botão "Mover", que é sticky no rodapé — e a prévia é
         exatamente o que precisa ser lido ANTES de confirmar. Aqui ela está
         sempre à vista, e as contas já vêm com padrão escolhido. -->
    ${(trocou && v>0 && conta && para) ? `<div class="esVerbas esPrevia">
      <div class="cdOlho">O que vai acontecer</div>
      <div class="esVl"><span>${conta.n}</span><b>− ${brl(v)}</b></div>
      <div class="esVl"><span>${para.n}</span><b>+ ${brl(v)}</b></div>
      <div class="esVn">Nenhuma verba é tocada: o total das contas continua
        <b>R$ ${brl(SALDO_TOTAL)}</b>, o mesmo de agora.</div>
    </div>` : ''}

    <input class="esCampo" placeholder="nome da cliente (aparece no extrato)"
      value="${_esNome.replace(/"/g,'&quot;')}" oninput="esNome(this)">

    ${trocou ? '' : `<div class="esRot">O procedimento chegou a ser feito?</div>
    <div class="esSeg">
      <button class="${_esFeito===false?'on':''}" onclick="esFeito(false)">Não</button>
      <button class="${_esFeito===true?'on':''}" onclick="esFeito(true)">Sim</button>
    </div>`}

    ${(!trocou && v>0 && _esFeito!==null) ? `<div class="esVerbas">
      <div class="cdOlho">${_esFeito?'Isto vai sair':'Isto vai ser desfeito'}</div>
      ${_esFeito
        ? `<div class="esVl"><span>Lucro líquido</span><b>− ${brl(v)}</b></div>
           <div class="esVn">O serviço aconteceu: equipe, produto e estoque já
             foram gastos e não voltam. A devolução sai do lucro.</div>`
        : `<div class="esVl"><span>Marketing</span><b>− ${brl(vb.marketing)}</b></div>
           <div class="esVl"><span>Investimento · 2ª unidade</span><b>− ${brl(vb.invest)}</b></div>
           <div class="esVl"><span>Estoque</span><b>− ${brl(vb.estoque)}</b></div>
           ${Math.abs(v-80)>0.01
             ? `<div class="esVn">O sinal padrão é R$ 80,00. Como este é de
                  R$ ${brl(v)}, as três saíram na mesma proporção — e somam
                  exatamente o que você devolve.</div>`
             : ''}`}
    </div>` : ''}

    <div class="esRot">${trocou ? 'De qual conta sai o sinal' : 'Sai de qual conta'}</div>
    <div class="esCts">${ONDE.filter(o=>!o.naoPaga).map(o=>`<button class="esCt${o.k===_esConta?' on':''}"
      onclick="esConta('${o.k}')"><i style="background:${brc(o.c)}"></i>
      <span><b>${o.n}</b><em>${brl(o.saldo)}</em></span></button>`).join('')}</div>

    <!-- ⚠️ O DESTINO SÓ EXISTE NO MODO 'trocou'. Transferência sem destino é
         saída disfarçada: o dinheiro sumiria de uma conta e não apareceria em
         nenhuma. A conta Processando fica fora dos dois lados — não se paga nem se
         recebe numa conta que o banco ainda não creditou. -->
    ${trocou ? `<div class="esRot">E entra em qual</div>
    <div class="esCts">${ONDE.filter(o=>!o.naoPaga && o.k!==_esConta).map(o=>`<button class="esCt${o.k===_esPara?' on':''}"
      onclick="esParaConta('${o.k}')"><i style="background:${brc(o.c)}"></i>
      <span><b>${o.n}</b><em>${brl(o.saldo)}</em></span></button>`).join('')}</div>` : ''}



    ${v>0 && conta && conta.saldo < v
      ? `<div class="esAviso">A conta ${conta.n} tem <b>R$ ${brl(conta.saldo)}</b>
         — o estorno é maior que o saldo dela.</div>` : ''}

    <div class="esTec">${['1','2','3','4','5','6','7','8','9',',','0','⌫']
      .map(t=>`<button onclick="esTecla('${t}')">${t}</button>`).join('')}</div>

    <button class="cdBt vm" onclick="esConfirmar()" ${podeIr?'':'disabled'}
      >${trocou ? 'Mover' : 'Estornar'}${v>0?` R$ ${brl(v)}`:''}</button>`;
}

async function esConfirmar(){
  const v = esValor();
  if(!(v>0)) return;
  const conta = ONDE.find(o => o.k === _esConta);
  if(!conta){ alert('Escolha de qual conta o dinheiro sai.'); return; }

  /* ── o caminho NOVO: o dinheiro só muda de conta ───────────────────────── */
  if(_esModo === 'trocou'){
    const para = ONDE.find(o => o.k === _esPara);
    if(!para){ alert('Escolha em qual conta o dinheiro entra.'); return; }
    if(para.k === conta.k){ alert('A conta de saída e a de entrada são a mesma.'); return; }
    const quem = (_esNome||'').trim() || 'cliente não identificada';
    if(!confirm(`Mover R$ ${brl(v)} do ${conta.n} para o ${para.n}?\n\n`
      +`A cliente ${quem} pagou tudo no balcão e o sinal foi devolvido.\n`
      +`NENHUMA verba é tocada — o dinheiro não saiu do salão, só mudou de conta.\n`
      +`O total das contas continua R$ ${brl(SALDO_TOTAL)}.`)) return;
    const ok = await trLancar({em:Date.now(), dia:_hoje(), de:conta.k, para:para.k,
      v:Math.round(v*100)/100,
      n:`Sinal devolvido · ${quem}`,
      motivo:'cliente pagou tudo no balcão'});
    if(!ok) return;
    aplicarSaidas();
    _esTxt=''; _esNome=''; _esModo='devolvi';
    document.getElementById('gaveta').classList.remove('esG');
    fecharSaida();
    repintarTudo();
    sdAviso(`R$ ${brl(v)} do ${conta.n} para o ${para.n} — sinal devolvido, ${quem} pagou no balcão`);
    return;
  }

  if(_esFeito===null) return;
  const quem = (_esNome||'').trim() || 'cliente não identificada';
  const vb = esVerbas(v);
  const linhas = _esFeito
    ? [{cat:'lucro', v}]
    : [{cat:'marketing', v:vb.marketing},
       {cat:'invest',    v:vb.invest},
       {cat:'estoque',   v:vb.estoque}];

  if(!confirm(`Estornar R$ ${brl(v)} para ${quem}?\n\n`
    +`Sai do ${conta.n}.\n`
    +(_esFeito
      ? `O procedimento FOI realizado — a devolução sai do lucro.\n`
      : `O procedimento NÃO foi realizado — desfaz as verbas do sinal:\n`
        +`  marketing      R$ ${brl(vb.marketing)}\n`
        +`  investimento   R$ ${brl(vb.invest)}\n`
        +`  estoque        R$ ${brl(vb.estoque)}\n`)
    +`\nIsso abate do saldo da conta e fica no extrato.`)) return;

  /* ⚠️ SE UMA LINHA FALHAR, AS OUTRAS JÁ FORAM. Aviso com o que gravou, em vez
     de fingir que nada aconteceu — meia devolução gravada e nenhum aviso seria
     a pior saída possível. */
  const feitas = [];
  for(const l of linhas){
    const ok = await sdLancar({em:Date.now(), dia:_hoje(), cat:l.cat,
      n:`Estorno · ${quem}`, v:l.v, conta:conta.k,
      estorno:true, procedimentoFeito:!!_esFeito});
    if(!ok){
      alert(`Gravei ${feitas.length} de ${linhas.length} linhas do estorno.\n`
        +`Confira o extrato do ${conta.n} antes de tentar de novo.`);
      break;
    }
    feitas.push(l);
  }
  if(!feitas.length) return;
  aplicarSaidas();
  _esTxt=''; _esNome=''; _esFeito=null;
  document.getElementById('gaveta').classList.remove('esG');
  fecharSaida();
  repintarTudo();
  sdAviso(`Estorno de R$ ${brl(v)} para ${quem} — saiu do ${conta.n}`);
}

/* o botão vermelho, no canto inferior */
function botaoEstorno(){
  return `<button id="btEstorno" onclick="estornoAbrir()" title="Registrar devolução de sinal">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>
    <span>Estorno</span></button>`;
}
