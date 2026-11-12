/* ══════════════════════════════════════════════════════════════════════════
   SAÍDAS — dinheiro que sai, e o que ele abate.

   Ordem dela, 04/09: "toda saída deve abater do saldo total" e "todo
   fechamento de caixa, após confirmação, deve abater do saldo da equipe e do
   lucro automático — pois fechar caixa significa pagar equipe e retirar
   lucro".

   ⚠️ ANTES DISTO NENHUMA SAÍDA SAÍA. O teclado abria, ela digitava, apertava
      "Lançar saída" e o botão não tinha função ligada — nada acontecia, sem
      aviso. A do estoque era pior: um prompt que mexia numa variável de tela,
      sem perguntar a conta e sem tocar em saldo nenhum. Tela que aceita
      lançamento e não lança é pior que tela sem o botão.

   O que uma saída faz, agora:
     1. grava em `financeiro/saidas/AAAA-MM`
     2. abate do SALDO DA CONTA escolhida (Nubank, Asaas, Sicredi ou Dinheiro)
     3. abate do ANEL da categoria — o anel passa a ser o que sobrou, não o
        que foi separado

   ⚠️ A CONTA É OBRIGATÓRIA. Saída sem conta não abate nada: o saldo do painel
      ficaria eternamente certo e o do banco eternamente errado.
   ══════════════════════════════════════════════════════════════════════════ */
const SD_NO = 'financeiro/saidas';
const FC_NO = 'financeiro/fechamentos';
/* ⚠️⚠️ A RETIRADA DA GAVETA NÃO É SAÍDA — ORDEM DELA, 16/09/2026.
   "essa retirada é tirar o dinheiro do salão e trazer pro escritório da
    empresa. NÃO é necessariamente gastar o dinheiro… só vai abater no
    dinheiro quando a forma de pagamento for dinheiro."

   Ela estava certa e o desenho de 09/09 estava errado: existem DOIS lugares
   com dinheiro vivo (a gaveta do salão e o escritório) e eu tinha modelado um
   só. Gravada como saída, a retirada apagava o dinheiro do saldo da empresa —
   medido em 14/09: R$ 3.789,20 sumiram do total.

   Agora ela mora num nó PRÓPRIO, `financeiro/retiradas_gaveta`, e não é lida
   por `aplicarSaidas()`: não abate conta, não abate pote, não abate nada. Ela
   só move a divisória entre "está na gaveta" e "está no escritório".
   Quem abate a conta Dinheiro continua sendo saída de verdade com
   `conta:'dinheiro'` — e só ela. */
const RG_NO = 'financeiro/retiradas_gaveta';
/* ⚠️⚠️ O ACERTO COM O SALDO REAL DO BANCO (a dona, 16/09/2026).
   Ela conferiu conta por conta e mandou os números: Sicredi 560, Nubank 685,04,
   Asaas 616, Dinheiro 2.295 no escritório. O painel só sabe o que foi lançado —
   quando sai dinheiro sem lançamento, ele fica otimista para sempre.

   Aqui mora a DIFERENÇA, não o saldo. Guardar o saldo congelaria a conta: a
   próxima venda ou saída não mexeria nela. Guardando o delta, o saldo continua
   andando sozinho e só fica deslocado do valor certo.

   ⚠️ NÃO É CATEGORIA E NÃO ABATE POTE. O destino dessa diferença é a verba de
   expansão, por ordem dela — e isso acontece sozinho, porque o Investimento
   passou a ser o encaixe que faz a soma das categorias bater com as contas.
   Ver `_encaixarExpansao()`. */
const AJ_NO = 'financeiro/ajustes_conta';
/* ⭐⭐ O SINAL DEVOLVIDO QUANDO A CLIENTE PAGA TUDO NO BALCÃO (a dona, 19/09/2026)
   *"a cliente paga o sinal e depois quer pagar tudo pessoalmente e ter a
   devolução do sinal… basicamente iria sair R$80 da nubank ou asaas e ir pra
   sicredi."*

   ⚠️ ISSO NÃO É ESTORNO, E A DIFERENÇA É O QUE IMPEDE O DINHEIRO DE SUMIR.
   No estorno o dinheiro SAI DO SALÃO: o pote que o sinal alimentou é desfeito
   (marketing/investimento/estoque) ou o lucro paga. Aqui o dinheiro **não sai** —
   ele muda de conta: o salão devolve os R$80 do sinal e recebe o valor CHEIO no
   balcão. Tratar como saída abateria um pote que continua com lastro, e o mesmo
   real sumiria duas vezes (ver [[caixa-em-dinheiro]], onde a retirada da gaveta
   virou saída e R$3.789,20 sumiram do total).

   🔒 A INVARIANTE: transferência tem DOIS lados e soma ZERO no total. Por isso
   ela mora em nó próprio, com `de` e `para`, e nunca em `financeiro/saidas`. */
const TR_NO = 'financeiro/transferencias';
let SAIDAS = [];        /* as de TODOS os meses que a janela alcança */
let FECHAMENTOS = {};   /* dias já fechados, pra não fechar duas vezes */
let RETIRADAS = [];     /* gaveta → escritório; NÃO são saídas */
let AJUSTES = {};       /* conta → {v, em, obs} — diferença pro extrato real */
let TRANSF = [];        /* {de, para, v, dia, n} — mesmo dinheiro, outra conta */

const sdMes = () => {
  const d = new Date(Date.now()-3*3600e3);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
};

/* ⚠️⚠️ A JANELA MANDA, NÃO O CALENDÁRIO — do mês do `INICIO` até o mês de hoje.
   Medido no ar em 01/10/2026: a leitura pedia só `sdMes()`. O mês virou, o nó
   `2026-10` ainda não existia, `SAIDAS` veio VAZIA — e a janela continuava
   começando em 02/09. Com zero saída na janela o `reservado` de TODA conta foi
   a zero: a Sicredi mostrou R$ 35.130,99 no lugar de R$ 1.550,16, o saldo
   somado deu R$ 49.672,67 no lugar de R$ 4.196,08, e todo anel exibiu o
   alocado sem abater nada (Equipe 17.887,52 em vez de 405,12).
   As 108 saídas de setembro estavam INTEIRAS no banco — o painel é que havia
   parado de olhar pra elas. Enquanto `INICIO` for de um mês anterior ao de
   hoje, ler um mês só é apagar dinheiro da tela na virada.
   ⚠️ VALE PRAS DUAS LISTAS: `saidas` E `transferencias`. A transferência não
   mexe no total das contas, mas mexe em QUAL conta tem o dinheiro — perder as
   de setembro deixaria cada saldo no lugar errado, com o total certo.
   ⚠️ A GRAVAÇÃO É NO MÊS DA DATA DA SAÍDA, não no mês de hoje — ver `sdMesDe`.
   Assim o nó `AAAA-MM` continua significando "as saídas desse mês" mesmo
   quando ela lança hoje um gasto de outro dia. */
const sdMeses = () => {
  const fim = sdMes();
  const ini = (typeof INICIO === 'string' && /^\d{4}-\d{2}$/.test(INICIO.slice(0, 7)))
    ? INICIO.slice(0, 7) : fim;
  const out = [];
  let [a, m] = ini.split('-').map(Number);
  /* trava de sanidade: 120 voltas. Se o `INICIO` vier torto, a leitura não
     vira laço infinito — ela para e o mês de hoje continua entrando. */
  for (let i = 0; i < 120; i++) {
    const mm = `${a}-${String(m).padStart(2, '0')}`;
    if (mm > fim) break;
    out.push(mm);
    if (++m > 12) { m = 1; a++; }
  }
  return out.length ? out : [fim];
};

const _sdJuntar = l => l.reduce((acc, mes) => acc.concat(Object.values(mes||{})), []).filter(Boolean);

async function sdCarregar(){
  try{
    /* ⚠️ SEM `.catch()` POR MÊS. Um mês que falha não pode virar lista vazia
       em silêncio — é o mesmo defeito, só mais difícil de ver. Se qualquer
       leitura cair, o `catch` de baixo assume e a tela não mente pela metade. */
    const meses = sdMeses();
    const [s,f,r,a,t] = await Promise.all([
      Promise.all(meses.map(mm => fetch(`${DBURL}/${SD_NO}/${mm}.json`).then(r=>r.json()))),
      fetch(`${DBURL}/${FC_NO}.json`).then(r=>r.json()),
      fetch(`${DBURL}/${RG_NO}.json`).then(r=>r.json()),
      fetch(`${DBURL}/${AJ_NO}.json`).then(r=>r.json()),
      Promise.all(meses.map(mm => fetch(`${DBURL}/${TR_NO}/${mm}.json`).then(r=>r.json()))),
    ]);
    SAIDAS = _sdJuntar(s);
    FECHAMENTOS = f || {};
    RETIRADAS = Object.values(r||{}).filter(Boolean);
    AJUSTES = a || {};
    TRANSF = _sdJuntar(t);
  }catch(e){ SAIDAS = []; FECHAMENTOS = {}; RETIRADAS = []; AJUSTES = {}; TRANSF = []; }
}
/* só as que caem dentro da janela do painel contam pro saldo dela */
/* ⚠️ `cat:'retirada'` FICA DE FORA, e a trava é aqui de propósito: este filtro
   é o único caminho por onde uma saída chega ao saldo da conta, ao anel da
   categoria e ao extrato. Os dois lançamentos antigos (10 e 14/09) foram
   migrados pro nó novo, mas se algum dia um voltar a cair aqui — versão velha
   de outra aba, importação, o que for — ele continua sem apagar dinheiro. */
const sdDaJanela = () => SAIDAS.filter(x => x.dia >= INICIO && x.cat !== 'retirada');
/* as retiradas da janela, mais novas primeiro */
const rgDaJanela = () => RETIRADAS.filter(x => x && x.dia >= INICIO)
                                  .sort((a,b)=>(b.em||0)-(a.em||0));
const rgTotal = () => Math.round(rgDaJanela().reduce((s,x)=>s+Number(x.v||0),0)*100)/100;
/* ⭐⭐ ACERTO DE VERBA: abate o POTE e NÃO a conta (17/09/2026).
   Ela, sobre o dia em que fez o caixa bater: *"você voltou pra verba segunda
   unidade um valor que eu tinha retirado."*

   Aquela retirada era um ENCAIXE — resultado de uma fórmula num instante, não um
   lançamento. Por isso ela nunca teve valor estável: medida no minuto em que ela
   deu a ordem dava R$ 1.874,33; medida no fim do mesmo dia, R$ 1.474,43. Número
   que muda conforme a hora que você olha não é dinheiro, é sintoma.

   Agora vira lançamento de verdade, com dia, nome e valor — e `semConta:true`,
   porque o dinheiro JÁ TINHA SAÍDO das contas (é isso que o acerto cobre). Abater
   conta de novo tiraria o mesmo real duas vezes.
   ⚠️ A trava é aqui, no único caminho por onde uma saída chega ao saldo da conta.
   Sem ela bastaria esquecer o campo `conta` pra um lançamento sumir do banco. */
function sdPor(campo){
  const m = {};
  for(const x of sdDaJanela()){
    if(campo === 'conta' && x.semConta) continue;
    m[x[campo]] = Math.round(((m[x[campo]]||0) + Number(x.v||0))*100)/100;
  }
  return m;
}

/* ── as transferências da janela, e o que cada conta ganha ou perde ──
   ⚠️ SOMA ZERO, SEMPRE. Cada lançamento tira de `de` e põe em `para`; se um dia
   a soma deste mapa não der 0, é porque alguém gravou meio lançamento. */
const trDaJanela = () => TRANSF.filter(x => x && x.dia >= INICIO && x.de && x.para && x.v);
function trPorConta(){
  const m = {};
  for(const x of trDaJanela()){
    const v = Number(x.v)||0;
    m[x.de]   = Math.round(((m[x.de]||0)   - v)*100)/100;
    m[x.para] = Math.round(((m[x.para]||0) + v)*100)/100;
  }
  return m;
}
/* a soma de todos os deltas — tem que ser 0,00. A tela usa isto pra avisar. */
const trSomaZero = () => Math.round(Object.values(trPorConta())
                          .reduce((s,v)=>s+v,0)*100)/100;

/* ⚠️ MESMA REGRA DA SAÍDA: grava primeiro, aplica depois. Meia transferência
   gravada seria pior que nenhuma — um lado do dinheiro existiria e o outro não. */
async function trLancar(reg){
  const chave = `t${Date.now()}${Math.floor(performance.now()*1000)%1000}`;
  try{
    const r = await fetch(`${DBURL}/${TR_NO}/${sdMes()}/${chave}.json`,
      {method:'PUT', body:JSON.stringify(reg)});
    if(!r.ok) throw new Error('HTTP '+r.status);
  }catch(e){
    alert('Não consegui gravar a transferência: '+(e.message||e)+'\nNada foi movido.');
    return false;
  }
  TRANSF.push(reg);
  return true;
}

/* ⚠️ GRAVA PRIMEIRO, APLICA DEPOIS. Se a gravação falhar, o painel não pode
   ficar mostrando um saldo abatido que o banco não tem — no próximo
   carregamento o dinheiro "voltaria" sozinho. */
/* ⚠️ O MÊS DO NÓ É O MÊS DA DATA DA SAÍDA, não o mês de hoje. Com a data
   escolhível, lançar em 01/10 um gasto de 28/09 gravava no nó `2026-10` um
   registro com `dia` de setembro — e o nó `AAAA-MM` deixava de significar "as
   saídas desse mês". A leitura varre todos os meses da janela, então as duas
   formas apareciam na tela; mas o dado ficava torto pra quem viesse depois.
   Os três que chamam esta função já mandam `dia` (o fechamento manda o dia que
   está fechando, que pode ser de ontem). Se vier torto, cai no mês de hoje. */
const sdMesDe = dia => (/^\d{4}-\d{2}/.test(String(dia||'')) ? String(dia).slice(0,7) : sdMes());
async function sdLancar(reg){
  const chave = `s${Date.now()}${Math.floor(performance.now()*1000)%1000}`;
  try{
    const r = await fetch(`${DBURL}/${SD_NO}/${sdMesDe(reg.dia)}/${chave}.json`,
      {method:'PUT', body:JSON.stringify(reg)});
    if(!r.ok) throw new Error('HTTP '+r.status);
  }catch(e){
    alert('Não consegui gravar a saída: '+(e.message||e)+'\nNada foi abatido.');
    return false;
  }
  SAIDAS.push(reg);
  return true;
}

/* ── gravar uma retirada da gaveta (gaveta → escritório) ──
   ⚠️ NÃO chama `aplicarSaidas()` e nem tem por quê: a retirada não abate conta
   nem pote. Quem lê isto é só o card do caixa em dinheiro, pra saber onde o
   dinheiro está. Se a gravação falhar, nada muda na tela. */
async function rgLancar(reg){
  const chave = `r${Date.now()}${Math.floor(performance.now()*1000)%1000}`;
  try{
    const r = await fetch(`${DBURL}/${RG_NO}/${chave}.json`,
      {method:'PUT', body:JSON.stringify(reg)});
    if(!r.ok) throw new Error('HTTP '+r.status);
  }catch(e){
    alert('Não consegui gravar a retirada: '+(e.message||e)+'\nNada foi movido.');
    return false;
  }
  RETIRADAS.push(reg);
  return true;
}

/* ── aplicar: os anéis e as bolinhas passam a ser SALDO, não repartição ── */
function aplicarSaidas(){
  if(!M.aloc) return;
  const porCat   = sdPor('cat');
  const porConta = sdPor('conta');
  const tr       = trPorConta();
  for(const k of Object.keys(M.aloc)){
    const v = M.aloc[k] - (porCat[k]||0);
    if(k==='oper') M.operacional = Math.round(v*100)/100;
    else M[k] = Math.round(v*100)/100;
  }
  /* ⚠️ NÃO RECALCULE O SALDO COMO `ent − sai`. O Asaas quebrou assim: o saldo
     dele é LIDO da API (R$ 154,04) porque a conta já tinha R$ 441,46 antes da
     janela; refazendo pela fórmula ele virava 560 − 847,42 = −287,42 e a tela
     mostrava saldo negativo numa conta com dinheiro. O saldo medido é a base;
     as saídas lançadas aqui abatem dela. */
  for(const o of ONDE){
    /* ⚠️ A ABERTURA ENTRA AQUI, uma vez só. Ela é dinheiro que a conta já
       tinha antes da janela — soma no saldo e NÃO no faturamento. */
    if(o.saldoBase === undefined) o.saldoBase = Math.round((o.saldo + (o.abertura||0))*100)/100;
    o.sai      = Math.round(((o.saiBase||0) + (porConta[o.k]||0))*100)/100;
    o.reservado= Math.round((porConta[o.k]||0)*100)/100;
    /* ⚠️ O ACERTO ENTRA DEPOIS DE TUDO, e é um DELTA — nunca um saldo fixo.
       Com saldo fixo a conta congelaria: venda nova e saída nova não a moveriam
       mais. Com delta o saldo continua andando e só fica no lugar certo. */
    const aj = Number((AJUSTES[o.k]||{}).v) || 0;
    o.ajuste   = Math.round(aj*100)/100;
    o.ajusteEm = (AJUSTES[o.k]||{}).em || null;
    /* ⭐ A TRANSFERÊNCIA ENTRA AQUI, no saldo, e em NENHUM pote. É o mesmo
       dinheiro noutra conta: o total das contas não muda, porque o que sai de
       uma entra na outra no mesmo lançamento. */
    o.transf   = Math.round((tr[o.k]||0)*100)/100;
    o.saldo    = Math.round((o.saldoBase - o.reservado + aj + o.transf)*100)/100;
  }
  SALDO_TOTAL = somarContas();
  /* o extrato de cada conta ganha as saídas lançadas aqui */
  for(const o of ONDE){
    const E = EXTRATO[o.k]; if(!E) continue;
    const dd = x => `${x.dia.slice(8)}/${x.dia.slice(5,7)}`;
    const nomeDe = k => (ONDE.find(y=>y.k===k)||{}).n || k;
    E.sai = (E.saiBase||[]).concat(sdDaJanela().filter(x=>x.conta===o.k).map(x=>({
      d:dd(x), n:x.n, v:Number(x.v), f:x.cat })));
    /* ⭐ OS DOIS LADOS DA TRANSFERÊNCIA APARECEM, cada um na sua conta. Sem as
       duas linhas o saldo anda e o extrato não explica por quê — e foi assim
       que a transferência do Asaas virou "o único furo do modelo" em setembro. */
    E.sai = E.sai.concat(trDaJanela().filter(x=>x.de===o.k).map(x=>({
      d:dd(x), n:x.n || 'Transferência', v:Number(x.v),
      f:`para ${nomeDe(x.para)}`, transf:true })));
    /* ⚠️⚠️ NÃO GUARDE UM `entBase` AQUI. O extrato do Nubank é preenchido DEPOIS,
       pelo `nuAplicar()`, que então chama esta função de novo: um `entBase`
       fotografado na primeira passada estaria VAZIO e apagaria os 59 sinais na
       segunda. Em vez de cache, o filtro — tira as linhas de transferência que
       eu mesmo pus e põe de novo. Idempotente, e nunca perde a lista de origem. */
    E.ent = (E.ent||[]).filter(x=>!x.transf).concat(
      trDaJanela().filter(x=>x.para===o.k).map(x=>({
        d:dd(x), n:x.n || 'Transferência', v:Number(x.v),
        f:`veio do ${nomeDe(x.de)}`, transf:true })));
  }
  _encaixarExpansao();
}

/* ══ O INVESTIMENTO VOLTOU A SER O QUE FOI SEPARADO ════════════════════════
   ⛔ CAIU EM 17/09/2026. Ela: *"isso foi só no dia específico que eu falei 'a
   soma de todas as categorias deve bater com o saldo nas contas bancárias, a
   diferença que der você abate da verba expansão' — que foi um dia que eu fiz
   pro caixa bater 100%. NÃO É UMA REGRA."*

   Eu tinha transformado uma faxina de UM DIA em lei do sistema. O preço:
   **o anel da 2ª unidade virou amortecedor de qualquer descompasso**, e o maior
   deles é diário — o cartão do dia, que a Sicredi só paga amanhã às 10h.
   Medido em 17/09: anel +1.556,11 antes das comandas do dia, +782,57 ao meio-dia,
   **−271,93** no fim, com R$1.879,40 parados na Stone. A cada venda no crédito a
   expansão parecia ter sido gasta, e voltava sozinha na manhã seguinte.

   ⭐ O QUE ELA MANDOU NO LUGAR: *"o que fica esperando a sicredi pagar, você pode
   colocar um card de processando, ao lado do dinheiro, pra tudo bater 100%."*
   O dinheiro a caminho virou a quinta conta (ver `ONDE` no vivo.js) e entra no
   total onde ele está.

   🔒 A REGRA DE AGORA:
     · o anel do Investimento mostra **o que foi separado** menos o que saiu dele
       — e mais nada;
     · o imposto continua FORA dos dois lados (6% calculado e nunca cobrado);
     · o que ainda não fecha vira **`M.naoBate`, com nome e à vista**. Diferença
       escondida dentro de um anel é diferença que ninguém conserta. */
const POTES_DA_SOMA = ['lucro','equipe','estoque','marketing','operacional'];
function _encaixarExpansao(){
  if(!M.aloc) return;
  /* ⚠️ RECALCULA SEMPRE. Guardar na primeira passada deixava o número velho
     assim que ela lançasse qualquer saída. */
  M.investAlocado = Math.round((M.aloc.invest - (sdPor('cat').invest||0))*100)/100;
  /* ⛔ NÃO É MAIS `SALDO_TOTAL − outros`. Era isso que comia a verba. */
  M.invest = M.investAlocado;
  M.investAjuste = 0;
  const outros = POTES_DA_SOMA.reduce((s,k)=>s+(Number(M[k])||0),0);
  M.somaCategorias = Math.round((outros + M.invest)*100)/100;
  /* o que sobra sem explicação — positivo = os potes prometem mais do que as
     contas têm. A tela já compara `somaCategorias` com `SALDO_TOTAL`; aqui o
     número ganha nome pra poder ser cobrado. */
  M.naoBate = Math.round((M.somaCategorias - SALDO_TOTAL)*100)/100;
}

/* ── a gaveta de lançar saída, com teclado que funciona ── */
let _sdCat='lucro', _sdTxt='', _sdNome='', _sdSub=null;
/* ⚠️ `sub` GRAVA A SUBCATEGORIA. Sem ela a saída de estoque só dizia
   "Estoque · Brinde" no texto do nome, e a gaveta do estoque tinha que
   adivinhar por string — o que ninguém garante quando um nome muda. */
/* ⭐ O DIA DA SAÍDA É ESCOLHIDO — ela, 01/10/2026: *"toda vez que eu for lançar
   uma saída, ter opção de colocar a data, pois eu posso estar lançando uma
   saída antiga, mas quando eu selecionar a data, o app organiza pro extrato
   ficar como deve ser."*
   Antes era `dia:_hoje()` cravado: gasto de ontem lançado hoje nascia com a
   data errada, e nenhuma tela tinha como saber disso depois.
   ⚠️ É O `dia` QUE MANDA NO EXTRATO, não a hora da digitação. O `em` continua
   sendo o instante do lançamento (serve de histórico); quem ordena a lista é o
   `dia`. Por isso escolher a data já põe a linha no lugar certo, sem mais nada.
   ⚠️ O PISO É O `INICIO` DA JANELA. Saída com data anterior é gravada e NUNCA
   contada (`sdDaJanela` corta em `dia >= INICIO`) — dinheiro que sai da conta
   dela e não sai da tela. O campo trava no piso e o confirmar recusa. */
let _sdDia = null;
const sdDiaAtual = () => _sdDia || _hoje();
const sdRot = d => `${String(d).slice(8)}/${String(d).slice(5,7)}`;
function sdEscolherDia(v){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))) return;
  _sdDia = v; sdPintar();
}
/* ⚠️ `sub` GRAVA A SUBCATEGORIA. Sem ela a saída de estoque só dizia
   "Estoque · Brinde" no texto do nome, e a gaveta do estoque tinha que
   adivinhar por string — o que ninguém garante quando um nome muda. */
/* ⚠️ fechar com valor digitado pergunta antes — era a forma mais fácil de
   perder um lançamento sem perceber */

/* ⚠️ fechar com valor digitado pergunta antes — era a forma mais fácil de
   perder um lançamento sem perceber */
function sdFecharComGuarda(e){
  if(e && e.target && e.target.id!=='veu' && !e.target.classList.contains('gx')) return;
  if(sdValor() > 0 && !confirm(`Descartar a saída de R$ ${brl(sdValor())} em ${_sdNome}?`)) return;
  _sdTxt='';
  document.getElementById('veu').classList.remove('on');
}
function sdAbrir(cat, nome, sub){
  _sdCat = cat; _sdTxt=''; _sdSub = sub || null;
  /* ⚠️ A DATA VOLTA PRA HOJE A CADA ABERTURA. Data escolhida que sobrevive à
     gaveta fechada é a forma silenciosa de lançar a próxima saída no dia
     errado — ela escolhe 28/09 uma vez e o resto do dia tudo nasce em 28/09. */
  _sdDia = _hoje();
  _sdNome = nome || NOMES[cat] || cat;
  sdPintar();
  document.getElementById('veu').classList.add('on');
}
const sdValor = () => Number(_sdTxt.replace(',','.')) || 0;
function sdTecla(t){
  if(t==='⌫') _sdTxt = _sdTxt.slice(0,-1);
  else if(t===','){ if(!_sdTxt.includes(',')) _sdTxt = (_sdTxt||'0')+','; }
  else { const [,dec] = _sdTxt.split(',');
         if(dec !== undefined && dec.length>=2) return;   /* dinheiro tem 2 casas */
         if(_sdTxt.replace(',','').length>=9) return;
         _sdTxt += t; }
  sdPintar();
}
/* ⚠️ `type="date"` DE PROPÓSITO: no iPhone ele abre o seletor nativo, que é
   onde ela está (o painel é usado no celular). Campo de texto com máscara
   obrigaria a digitar data no teclado numérico do app, que é de dinheiro.
   ⚠️ O `max` é HOJE. Saída no futuro entraria no saldo de hoje — a janela não
   tem teto (`dia >= INICIO`), então uma data de amanhã abateria dinheiro antes
   de ele sair. */
function sdSeletorDia(){
  const d = sdDiaAtual(), hoje = _hoje();
  const antiga = d !== hoje;
  return `<div class="gContas sdDia"><em>em que dia saiu?</em>
    <div class="sdDiaL">
      <input type="date" class="sdDiaIn" value="${d}" min="${INICIO}" max="${hoje}"
        onchange="sdEscolherDia(this.value)">
      <button class="sdDiaHoje${antiga?'':' on'}" onclick="sdEscolherDia('${hoje}')">hoje</button>
    </div>
    <span class="sdDiaP">${antiga
      ? `Vai entrar no extrato em <b>${sdRot(d)}</b>, no lugar certo da ordem — não em ${sdRot(hoje)}.`
      : `Lançando em <b>${sdRot(hoje)}</b>. Se o gasto é de outro dia, escolha a data: o extrato se reorganiza sozinho.`}</span>
  </div>`;
}
function sdPintar(){
  const cor = CORES[_sdCat] || CORES.lucro;
  const v = sdValor();
  const conta = ONDE.find(o=>o.k===_contaEscolhida);
  const cabe = conta ? conta.saldo >= v : true;
  const pote = _sdCat==='oper' ? M.operacional : M[_sdCat];
  document.getElementById('gaveta').innerHTML = `
    <div class="gcab"><i style="background:${brc(cor)}"></i>
      <span>Registrar saída em<b>${_sdNome}</b>
        <i class="gsub">sobram R$ ${brl(pote||0)} neste anel</i></span>
      <button class="gx" onclick="fecharSaida()">✕</button></div>
    <div class="gcampo"><span>R$</span>
      <input value="${_sdTxt ? _sdTxt : '0,00'}" readonly></div>
    ${sdSeletorDia()}
    ${_sdCat==='equipe' ? sdEquipeDetalhe() : ''}
    ${seletorConta()}
    ${v>0 && !cabe ? `<div class="sdAviso">A conta ${conta.n} tem
       <b>R$ ${brl(conta.saldo)}</b> — a saída é maior que o saldo dela.</div>` : ''}
    <div class="gtecla">${['1','2','3','4','5','6','7','8','9',',','0','⌫']
      .map(t=>`<button onclick="sdTecla('${t}')">${t}</button>`).join('')}</div>
    <button class="gok" style="background:${brt(cor)};color:#fff"
      onclick="sdConfirmar()" ${v>0?'':'disabled'}>Lançar saída</button>`;
}
/* ⚠️ LANÇAMENTO SEM RESPOSTA É LANÇAMENTO QUE SE PERDE EM SILÊNCIO. Em 04/09
   ela lançou uma saída de marketing, a gaveta fechou, e nada foi gravado — e
   como a tela não dizia nem sim nem não, ela só descobriu perguntando. As três
   formas de perder eram todas mudas: clicar fora da gaveta, fechar no ✕ com
   valor digitado, ou dispensar a confirmação.
   Agora: sucesso mostra um aviso verde por 4s, e fechar com valor digitado
   pergunta antes. */
function sdAviso(txt, ruim){
  let el = document.getElementById('sdAviso');
  if(!el){ el = document.createElement('div'); el.id='sdAviso'; document.body.appendChild(el); }
  el.className = 'sdToast' + (ruim ? ' ruim' : '');
  el.textContent = txt;
  requestAnimationFrame(()=>el.classList.add('on'));
  clearTimeout(sdAviso._t);
  sdAviso._t = setTimeout(()=>el.classList.remove('on'), 4000);
}
/* ⚠️ O POTE DA EQUIPE PRECISA SE EXPLICAR. Ele junta duas coisas que a pessoa
   não tem como separar de cabeça: a mão de obra dos dias que ainda não foram
   fechados, e o bônus acumulado de toda a janela (que só sai no dia de pagar
   a bonificação). Sem esta lista, "R$ 1.026,32" é um número que ela tem que
   perguntar de onde vem — e perguntou. */
function sdEquipeDetalhe(){
  const dias = M.equipePorDia || [];
  if(!dias.length) return '';
  const fechado = d => !!(typeof FECHAMENTOS==='object' && FECHAMENTOS && FECHAMENTOS[d]);
  const rot = d => `${d.slice(8)}/${d.slice(5,7)}`;
  const aPagar = dias.filter(x=>!fechado(x.d));
  const moAberta = aPagar.reduce((s,x)=>s+x.mo,0);
  const bonusTot = dias.reduce((s,x)=>s+x.bonus,0);
  return `<div class="sdDet">
    <div class="sdDetT">De onde vem este saldo</div>
    ${dias.map(x=>`<div class="sdDetL${fechado(x.d)?' pago':''}">
      <span>${rot(x.d)}${fechado(x.d)?' <em>fechado</em>':''}</span>
      <b>${fechado(x.d)?'—':'R$ '+brl(x.mo)}</b></div>`).join('')}
    <div class="sdDetL soma"><span>mão de obra a pagar</span><b>R$ ${brl(moAberta)}</b></div>
    <div class="sdDetL soma"><span>bônus reservado <em>8% da mão de obra</em></span>
      <b>R$ ${brl(bonusTot)}</b></div>
    ${(M.bonifPaga>0)?`<div class="sdDetL soma"><span>− bonificação paga</span>
      <b>− R$ ${brl(M.bonifPaga)}</b></div>`:''}
    ${(M.bonifPerdida>0)?`<div class="sdDetL soma"><span>− bonificação perdida <em>foi pro investimento</em></span>
      <b>− R$ ${brl(M.bonifPerdida)}</b></div>`:''}
    ${(M.bonifFalta>0)?`<div class="sdDetP" style="color:#B45309">⚠️ A bonificação
      já resolvida passou da reserva em <b>R$ ${brl(M.bonifFalta)}</b>. A reserva é
      8% da mão de obra <b>desta janela</b> (a partir de ${INICIO.slice(8)}/${INICIO.slice(5,7)}),
      e a semana da campanha começa na terça — o pedaço da semana que caiu antes
      da janela é pago aqui sem ter sido reservado aqui.</div>`:''}
    <div class="sdDetP">A bonificação sai daqui sozinha quando você paga a semana
      na campanha Cliente Feliz: a paga vira dinheiro fora, e a de quem perdeu vai
      pro Investimento 2ª unidade. Fechar o caixa paga só a mão de obra do dia.</div>
  </div>`;
}
async function sdConfirmar(){
  const v = sdValor();
  if(!(v>0)) return;
  const conta = ONDE.find(o=>o.k===_contaEscolhida);
  if(!conta){ alert('Escolha de qual conta o dinheiro sai.'); return; }
  const dia = sdDiaAtual();
  /* ⚠️ A TRAVA DA JANELA É AQUI TAMBÉM, não só no `min` do campo. O atributo
     `min` é do seletor; data colada ou teclada passa por ele em alguns
     navegadores, e uma saída antes do INICIO é gravada e nunca contada. */
  if(dia < INICIO){
    alert(`A janela do caixa começa em ${sdRot(INICIO)}.\n\nUma saída de ${sdRot(dia)} seria`
      + ` gravada e NÃO entraria em conta nenhuma — o dinheiro sairia do banco e não da tela.`);
    return;
  }
  if(dia > _hoje()){ alert('Não dá pra lançar saída com data no futuro.'); return; }
  if(!confirm(`Lançar R$ ${brl(v)} de saída em ${_sdNome}, saindo do ${conta.n}`
    + `${dia!==_hoje() ? `,\ncom data de ${sdRot(dia)}` : ''}?`)) return;
  const reg = {em:Date.now(), dia, cat:_sdCat, n:_sdNome,
               v:Math.round(v*100)/100, conta:conta.k};
  if(_sdSub) reg.sub = _sdSub;
  const ok = await sdLancar(reg);
  if(!ok) return;
  aplicarSaidas();
  _sdTxt='';                 /* já lançou: o campo não pode voltar com o valor */
  fecharSaida();
  repintarTudo();
  sdAviso(`Saída de R$ ${brl(v)} em ${_sdNome} — saiu do ${conta.n}`
    + `${dia!==_hoje() ? ` · lançada em ${sdRot(dia)}` : ''}`);
}

/* ══ O BOTÃO DE REGISTRAR SAÍDA QUE ACOMPANHA O ROLAR ════════════════════
   ⭐⭐ Ela, 23/10/2026: *"quero também um botão de registrar saída em cada
   extrato, um botão que acompanha o rolar da tela."*

   O botão existia em UM lugar só — o fim do extrato do pote — e numa gaveta
   de 1.043px de conteúdo dentro de 718px de janela ele ficava fora da tela:
   pra lançar um gasto era rolar a lista inteira primeiro. Agora ele é uma
   barra `position:sticky; bottom:0`, nos quatro extratos: o do pote, o da
   categoria, o geral e o de cada conta.

   ⚠️ `sticky` e NÃO `fixed`: a gaveta é que rola, não a página. Com `fixed` a
   barra se ancoraria na janela do navegador e, no celular, ficaria boiando
   por cima do teclado e do resto da tela.
   ⚠️ ÚLTIMO FILHO DA GAVETA, sempre. Sticky só gruda dentro do container que
   rola; pendurado dentro da lista ele some junto com ela.
   ⚠️ O PADDING DE BAIXO DA GAVETA tem que caber a barra — sem isso a última
   linha do extrato fica escondida atrás dela para sempre, que é a forma de um
   extrato esconder um lançamento. Está no `.gaveta:has(.gBarra)` do vp.css. */
const SD_POTES_SAIDA = [
  {k:'lucro',     r:'Lucro'},
  {k:'equipe',    r:'Equipe'},
  {k:'estoque',   r:'Estoque'},
  {k:'marketing', r:'Marketing'},
  {k:'oper',      r:'Operacional'},
  {k:'invest',    r:'Investimento'},
];
/* `k` = a categoria já conhecida (extrato de pote ou de categoria). Sem ela —
   extrato geral e extrato de conta — o botão pergunta o pote antes, porque
   saída sem categoria não entra em anel nenhum. */
function barraSaida(k){
  const cor = (typeof brt==='function' && typeof CORES==='object')
    ? brt(CORES[k==='estoque'?'produto':k] || CORES.lucro) : '#1E6DFF';
  const nome = (typeof NOMES==='object' && NOMES[k])
    ? String(NOMES[k]).replace(' · 2ª unidade','') : '';
  const acao = !k ? 'sdEscolherPote()'
             : k==='estoque' ? 'abrirEstoque()'
             : `abrirSaida('${k}')`;
  const rot = !k ? 'Registrar saída'
            : k==='estoque' ? 'Ver o estoque e dar saída'
            : 'Registrar saída em '+nome;
  return `<div class="gBarra"><button class="cdBt" style="background:${cor}"
    onclick="${acao}">${rot}</button></div>`;
}
/* a telinha de "em qual pote?" — só aparece quando o extrato não sabe */
function sdEscolherPote(){
  const g = document.getElementById('gaveta'); if(!g) return;
  g.innerHTML = `
    <div class="gcab"><i style="background:linear-gradient(140deg,#22E07A,#1E6DFF)"></i>
      <span><b>Registrar saída</b><br>de qual pote sai esse dinheiro?</span>
      <button class="gx" onclick="fecharSaida()">✕</button></div>
    <div class="sdPotes">
      ${SD_POTES_SAIDA.map(o=>{
        const c = (typeof brc==='function' && typeof CORES==='object')
          ? brc(CORES[o.k==='estoque'?'produto':o.k] || CORES.lucro) : '#888';
        const v = o.k==='oper' ? M.operacional : M[o.k];
        return `<button class="sdPote" style="--c:${c}"
          onclick="${o.k==='estoque' ? 'abrirEstoque()' : `abrirSaida('${o.k}')`}">
          <i></i><span>${o.r}</span>
          <b class="num">R$ ${brl(Number(v)||0)}</b></button>`;
      }).join('')}
    </div>
    <div class="sdPotesP">O valor ao lado é o que sobrou em cada pote. A conta
      de onde o dinheiro sai você escolhe no passo seguinte.</div>`;
  document.getElementById('veu').classList.add('on');
}
