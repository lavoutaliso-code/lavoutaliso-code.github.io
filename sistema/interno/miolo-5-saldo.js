/* ══════════════════════════════════════════════════════════════════════════
   CARD "SALDO DISPONÍVEL" — a opção 2 refeita.
   O que mudou, e por quê:
   · o título virou SALDO DISPONÍVEL (era "divisão do dinheiro")
   · o anel grande é INVESTIMENTO · 2ª UNIDADE, e ficou com o neon
   · saiu todo "já saiu"
   · cada anel é CLICÁVEL e abre o registro de saída daquela categoria
   · cores vibrantes e nunca repetidas — computadas, não escolhidas a olho:
     validate_palette --pairs all → normal ΔE 15,3 · daltonismo ΔE 11,0
   ⚠️ O nome da categoria vai em BRANCO, não na cor do anel. O validador
      acusou magenta (2,8:1) e violeta (2,48:1) abaixo de 3:1 como texto.
      Cor identifica o anel; o texto usa tinta de texto. Eu estava errando
      isso nos mockups anteriores.
   ══════════════════════════════════════════════════════════════════════════ */
const CORES = {
  invest:'#C7F636',  // neon — o anel grande
  lucro:'#4C8DFF',   // azul vivo
  equipe:'#FF2D9B',  // magenta
  produto:'#00E0D5', // turquesa
  oper:'#FFA51F',    // âmbar
  imposto:'#FF5A3C', // coral
  marketing:'#9B5DFF'// violeta — reservado; hoje sai CINZA (sem fonte)
};
/* ⚠️ SETE CORES DISTINTAS NÃO EXISTEM NESTA SUPERFÍCIE. Medido: todo conjunto
   de 7 reprova a checagem de visão normal (o melhor deu ΔE 13,8, e o piso é
   15). O verde-limão que eu ia dar ao lucro batia ΔE 0,6 contra o neon em
   daltonismo — seriam a MESMA cor.
   Só fecha em 6 porque o Marketing ainda não tem fonte e renderiza cinza.
   Quando ele ligar, o violeta entra e o conjunto passa a 7 — aí a cor sozinha
   não basta, e a régua salva porque todo anel já vem com nome e valor escritos
   do lado (identidade nunca fica só na cor). */
/* ⚠️ "Produto" saiu da lista: ele virou ESTOQUE + MARKETING + parte do
   INVESTIMENTO, que é a divisão do sinal. Somados dão os mesmos R$80. */

/* ══ AS MESMAS CORES, SOBRE BRANCO ════════════════════════════════════════
   ⚠️ A paleta dos anéis foi validada contra a superfície ESCURA. Em folha
      branca ela desaba: o neon #C7F636 dá 1,26:1 contra o branco e o turquesa
      #00E0D5 dá 1,66:1 — a bolinha simplesmente some. Estes são os MESMOS
      matizes, rebaixados em OKLCH até passarem o contraste (medido em
      _cor.mjs, nenhum escolhido a olho): 3:1 pra marca, 4,5:1 pra texto e
      pra fundo de botão com letra branca. */
const BR_MARCA = {'#C7F636':'#81A01D', '#4C8DFF':'#4C8DFF', '#FF2D9B':'#FF2D9B', '#00E0D5':'#14A69E', '#FFA51F':'#D18404', '#FF5A3C':'#FF5A3C', '#9B5DFF':'#9B5DFF', '#820AD1':'#820AD1', '#1E6DFF':'#1E6DFF', '#3FA110':'#3FA110', '#D9A21B':'#BD8D1E'};
const BR_TEXTO = {'#C7F636':'#668007', '#4C8DFF':'#3372E2', '#FF2D9B':'#E11886', '#00E0D5':'#16857E', '#FFA51F':'#A6690B', '#FF5A3C':'#DD3819', '#9B5DFF':'#9151F3', '#820AD1':'#820AD1', '#1E6DFF':'#1E6DFF', '#3FA110':'#34880C', '#D9A21B':'#987009'};
const brc = h => BR_MARCA[h] || h;
const brt = h => BR_TEXTO[h] || h;
/* ⚠️ AS CINCO BOLINHAS DO ESTOQUE PERDERAM A COR, DE PROPÓSITO. Cinco cores
   categóricas não sobrevivem em branco: o validador reprovou todo conjunto que
   tentei (o melhor deu ΔE 13,8 em visão normal, e o piso é 15 — azul e violeta
   viravam a mesma cor). Como cada linha já traz o nome escrito, a cor ali não
   informava nada: virou marcador, na cor do próprio pote. */
const EST_PT = '#16857E';

/* ⚠️ ERA UM ARRAY CONST, E POR ISSO A TELA FICOU COM SEIS ZEROS. O array
   fotografava M.lucro, M.equipe… no instante em que o arquivo carregava —
   antes de o banco responder. O anel grande lia M.invest na hora de
   desenhar e mostrava R$ 507,52, enquanto os seis do lado mostravam
   R$ 0,00 na MESMA tela. Agora é função: lê no momento do desenho. */
function cats(){ return [
  {k:'lucro',     n:'Lucro líquido', v:M.lucro,       c:CORES.lucro},
  {k:'equipe',    n:'Equipe',        v:M.equipe,      c:CORES.equipe},
  {k:'estoque',   n:'Estoque',       v:M.estoque,     c:CORES.produto},
  {k:'marketing', n:'Marketing',     v:M.marketing,   c:CORES.marketing},
  {k:'oper',      n:'Operacional',   v:M.operacional, c:CORES.oper},
  /* ⚠️ O IMPOSTO ESTÁ CONGELADO (ordem dela, 05/09): continua calculado a 6%
     e mostrado, mas NÃO é cobrado — o que iria pra ele segue dentro do lucro.
     Por isso ele aparece com o rótulo "congelado" em vez de virar um pote com
     dinheiro reservado que ninguém separou. */
  /* ⚠️ E ELE NÃO ENTRA NA SOMA (ela, 16/09/2026): "exceto imposto, imposto está
     só de enfeite, o valor do anel dele não deve ser contabilizado". O dinheiro
     do imposto já está dentro do lucro e dentro das contas — somar o anel
     contaria o mesmo real duas vezes. Ver `_encaixarExpansao()`. */
  {k:'imposto',   n:'Imposto',       v:M.imposto,     c:CORES.imposto, congelado:true, foraDaSoma:true},
];}

/* ⭐ A FATIA DE CADA POTE — quanto do dinheiro que entra a alocação manda pra
   cada categoria. É ESTA a porcentagem dos anéis (ordem dela, 17/09/2026), e
   não `saldo ÷ faturamento`: a régua não muda porque ela gastou.

   A base é a soma do que foi ALOCADO nos seis potes, que é o faturamento mais
   o sinal de quem já pagou e ainda não veio (`M.adiantado`) — por isso as seis
   fatias somam 100% exatos, e não 100,7%.

   ⚠️ O IMPOSTO É O ÚNICO FORA DA BASE, porque ele está fora da soma (ordem dela,
   16/09): ele é 6% do faturamento, calculado e nunca cobrado. Dividir pela mesma
   base diria 5,96% e ninguém entenderia de onde saiu o arredondamento. */
function fatiaDoPote(k){
  const A = M.aloc; if(!A) return 0;
  if(k === 'imposto') return pc(A.imposto, M.fat);
  const base = ['lucro','equipe','estoque','marketing','oper','invest']
                 .reduce((s,x)=>s+(Number(A[x])||0), 0);
  return base ? pc(A[k], base) : 0;
}
function miolo(){
  const f = fatiaDoPote('invest');
  return `<div style="display:flex;align-items:center;gap:34px;width:100%;height:100%">

    <!-- ── o anel grande: INVESTIMENTO · 2ª UNIDADE ── -->
    <button class="aroBt grande" onclick="abrirPote('invest')" style="--c:${CORES.invest}">
      <div style="position:relative;width:238px;height:238px">
        ${anel(f,238,22,CORES.invest,'rgba(255,255,255,.16)')}
        <span style="position:absolute;inset:0;display:flex;flex-direction:column;
          align-items:center;justify-content:center;text-align:center;padding:0 46px">
          <em style="font-style:normal;font-size:16px;letter-spacing:.14em;text-transform:uppercase;
            color:rgba(255,255,255,.62);line-height:1.5">Investimento<br>2ª unidade</em>
          <b class="fina" style="font-size:34px;margin-top:9px;white-space:nowrap">R$ ${brl(M.invest)}</b>
          <!-- ⛔ O ENCAIXE CAIU EM 17/09/2026. Este anel já foi "o que faz a
               soma das categorias bater com o saldo das contas" — e ela
               desmentiu a régua: aquilo foi uma faxina de um dia só, não lei.
               Enquanto foi lei, o anel afundava toda tarde com o cartão que a
               Sicredi só paga no dia seguinte (medido: −271,93 às 19h contra
               +1.556,11 de manhã). Agora ele mostra SÓ o que foi separado, e o
               que não fecha tem nome e linha própria (M.naoBate, logo abaixo).
               investAjuste fica em 0 — o ramo abaixo existe pra não quebrar
               se alguém reativar o encaixe sem ler isto aqui. -->
          ${M.investAjuste ? `<em class="num" style="font-style:normal;font-size:15px;
            color:rgba(255,255,255,.62);margin-top:7px;line-height:1.45;white-space:nowrap"
            >separado R$ ${brl(M.investAlocado)}<br>
            ${M.investAjuste<0?'−':'+'} R$ ${brl(Math.abs(M.investAjuste))} de acerto com as contas</em>`
          : `<em class="num" style="font-style:normal;font-size:17px;color:rgba(255,255,255,.6);
            margin-top:7px">${p1(f)}% de tudo que entra</em>`}
          <!-- ⛔ A BONIFICAÇÃO PERDIDA SAIU DA FACE (ela, 18/09/2026):
               *"conserte todos os avisos que estão poluindo a página, como
               bonificação perdida, acerto de contas e etc."* O número não se
               perdeu — ele é uma LINHA do extrato da verba, que abre num toque
               no anel. Card é pra ler de longe; explicação é na gaveta. -->
        </span>
        <span class="mais grandeMais">+</span>
      </div>
      <span class="dica">sai do lucro · ver o extrato</span>
    </button>

    <!-- ── as categorias ── -->
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px">
      <!-- ⚠️ O TÍTULO DOS ANÉIS EXISTE PRA NÃO CONFUNDIR COM O SALDO. Os anéis
           repartem o FATURAMENTO do período; o número grande do card é o que
           está em conta. Sem esta linha, os dois liam como o mesmo dinheiro. -->
      <!-- ⚠️ OS POTES PASSAM DO FATURAMENTO DE PROPÓSITO. Desde 05/09 o sinal
           é dividido quando a cliente paga, não quando ela vem — então existe
           verba de gente que já pagou e ainda não foi atendida. Esse dinheiro
           está na conta e não é faturamento; sem esta linha os dois números
           brigariam na tela sem explicação. -->
      <div class="aroTit">O que o salão faturou
        <b class="num">R$ ${brl(M.fat)}</b></div>
      <!-- ⭐ A PROVA NA TELA (ela, 16/09/2026): "a soma de todas as categorias
           deve bater com o saldo nas contas bancárias". Se um dia deixar de
           bater, isto vira vermelho em vez de ficar calado.

           ⚠️ AS DUAS INFORMAÇÕES DIVIDEM UMA LINHA SÓ — cada linha aqui custa
           ~24px do desenho, e foi o par "sinal adiantado" + "as seis somam"
           que empurrou os anéis Operacional e Imposto pra fora da borda.
           ⚠️ E O DIV É UM SÓ, SEM CONDICIONAL NA ESTRUTURA. Eu tinha feito a
           fusão abrindo o div num ramo e fechando noutro: com adiantado
           verdadeiro o fechamento caía no lugar errado e encerrava a COLUNA
           das categorias — a grade dos anéis virava irmã do título e o
           faturamento saía quebrado em três linhas por cima do Estoque.
           Condicional decide TEXTO, nunca abertura e fechamento de tag. -->
      <div class="aroSub">
        ${M.adiantado ? `+ R$ ${brl(M.adiantado)} de sinal já pago` : ''}
        <!-- ⚠️ O QUE NÃO FECHA TEM QUE DIZER QUANTO (17/09/2026). Antes esta
             linha só dizia "≠ R$ x das contas" e a diferença ficava pra ela
             calcular de cabeça — justamente o número que manda ir atrás do
             furo. Agora vem o valor, com sinal: sobrando nos potes ou faltando. -->
        <!-- ⛔ QUANDO BATE, FICA CALADO (ela, 18/09/2026). A linha "as seis somam
             R$ X = as cinco contas" ocupava a tela todo dia pra dizer que está
             tudo certo — e o que ela precisa saber é o contrário. Agora ela só
             aparece quando NÃO bate, e aí diz de quanto é a diferença. Aviso que
             fala sempre vira paisagem, e some junto com o resto. -->
        <!-- ⛔ E FICA CALADO ENQUANTO ALGUMA CONTA MEDE: com o Nubank em zero
             os potes "não batem" por construção, e o alarme acusava um furo de
             milhares de reais que desaparecia sozinho 5 segundos depois. -->
        ${(!SALDO_MEDINDO && M.somaCategorias !== undefined && Math.abs(M.naoBate) >= 0.02)
          ? `<span class="aroSoma erro">${M.naoBate > 0 ? 'faltam' : 'sobram'}
             <b class="num">R$ ${brl(Math.abs(M.naoBate))}</b>
             <em>os potes somam R$ ${brl(M.somaCategorias)} e as contas têm R$ ${brl(SALDO_TOTAL)}</em></span>`
          : ''}
      </div>
      <div style="flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:5px 14px">
      ${cats().map(c=>{
        /* ⭐⭐ A PORCENTAGEM É A RÉGUA DO FINANCEIRO, NÃO O QUE SOBROU
           (a dona, 17/09/2026): "as porcentagens dos anéis devem ser as
           porcentagens que o nosso financeiro utiliza em cada categoria, não a
           porcentagem disponível do momento. Se a progressiva custa R$100 e eu
           reservo 10 pro estoque, a porcentagem do estoque fica fixa em 10%,
           independente se tiver R$1,00 na categoria."

           Era `pc(c.v, M.fat)` — o SALDO sobre o faturamento. Com isso o anel
           encolhia toda vez que ela gastava, e um pote zerado virava 0%, como
           se a regra tivesse mudado. Agora o anel desenha `fatiaDoPote()`: o
           quanto daquele dinheiro a alocação MANDA pra categoria. O número
           dentro do anel é a fatia; quanto sobrou continua escrito ao lado,
           grande, que é onde ela lê. */
        const sem = c.v==null, g = sem?0:fatiaDoPote(c.k);
        return `<button class="aroBt" onclick="abrirPote('${c.k}')" style="--c:${c.c}">
          <div style="position:relative;width:78px;height:78px;flex:none">
            ${anel(g,78,10,sem?'transparent':c.c,'rgba(255,255,255,.16)')}
            <span style="position:absolute;inset:0;display:flex;align-items:center;
              justify-content:center;font-size:20px" class="num${c.v<0?' potNeg':''}"
              >${sem?'—':(c.v<0?'−':p1(g)+'%')}</span>
            <span class="mais">+</span>
          </div>
          <div style="min-width:0;text-align:left">
            <div style="font-size:22px;font-weight:700;color:#fff;white-space:nowrap;
              overflow:hidden;text-overflow:ellipsis">${c.n}</div>
            <!-- ⚠️ POTE NEGATIVO É INFORMAÇÃO, NÃO DEFEITO. Significa que
                 saiu mais desse pote do que o período separou pra ele — foi o
                 que aconteceu com o Estoque em 04/09, com R$883 lançados
                 contra R$731 separados. Fica em âmbar e com a linha dizendo
                 quanto passou, senão o número negativo lê como erro de conta. -->
            <div class="fina${!sem && c.v<0 ? ' potNeg' : ''}"
              style="font-size:28px;margin-top:5px;color:#fff;white-space:nowrap">
              ${sem?'<span style="font-size:21px;font-weight:400;color:rgba(255,255,255,.45)">não ligado</span>'
                   :'R$ '+brl(c.v)}</div>
            <!-- ⛔ "não entra na soma" saiu (18/09): é regra do sistema, não
                 notícia do dia. A explicação inteira está na gaveta do imposto. -->
            ${!sem && c.v<0
              ? `<div class="potAviso">passou ${'R$ '+brl(-c.v)}</div>` : ''}
          </div>
        </button>`;}).join('')}
      </div>
    </div>
  </div>

  <!-- ⚠️ O VÉU NÃO MORA MAIS AQUI. Ele era filho deste card, e o
       o backdrop-filter do card faz dele o bloco-contêiner do 'position:fixed'
       — a gaveta ficava presa em 700×470 e o 'overflow:hidden' do painel
       decepava o cabeçalho (a bolinha e o "Saldo do" sumiam). Agora ele é
       filho do .painel, em corpo.js, e tem os 1380×794 inteiros. -->`;
}

const NOMES = {invest:'Investimento · 2ª unidade', lucro:'Lucro líquido', equipe:'Equipe', estoque:'Estoque', marketing:'Marketing',
  oper:'Operacional', imposto:'Imposto', marketing:'Marketing'};
/* ⚠️ ISTO AQUI NÃO LANÇAVA NADA. O teclado desenhava, o botão "Lançar saída"
   não tinha função ligada, e a gaveta fechava como se tivesse dado certo.
   Agora quem faz é o sdAbrir(), em saidas.js. */
function abrirSaida(k){ sdAbrir(k); }

/* ══ O EXTRATO DE CADA CATEGORIA — mockup A, aprovado por ela em 16/09/2026 ══
   "coloque a função de clicar em cada categoria e ver o extrato dela, ao invés
    de só registrar saída. poder ver exemplo, estoque: 16/09 +45,00 cliente
    carol."

   Ela escolheu o A entre quatro: UMA lista só, entrada e saída misturadas em
   ordem de data — a mesma leitura do extrato das contas, que ela já usa.

   ⚠️ A ENTRADA DE CADA POTE TEM FONTE DIFERENTE, e é isso que este bloco
   resolve. Nenhum deles tem "extrato" no banco; o que existe é a REGRA que
   separa a verba, e ela é aplicada num evento com nome e data:
     · estoque    R$ 43 por sinal pago      · marketing  R$ 17 por sinal pago
     · invest     R$ 20 por sinal + R$ 19,04 por procedimento + bonificação perdida
     · equipe     a mão de obra de cada dia + o bônus reservado
     · oper       o custo fixo de cada dia ÚTIL (ver `_diaDeCusto`)
     · lucro      o que sobrou em cada dia
     · imposto    6% do faturamento de cada dia — e continua só de enfeite

   ⚠️ SE UM DIA A SOMA DO EXTRATO NÃO DER O ANEL, o extrato está mentindo. Por
   isso cada um devolve `confere`, e a tela escreve a diferença em vez de
   deixar passar — foi assim que a gente descobriu quase tudo esta semana. */
function poteExtrato(k){
  const ent = [], sai = [];
  const sinais = []
    .concat(((EXTRATO.nubank||{}).ent||[]).map(x=>({d:x.d, n:x.n, via:'WhatsApp'})))
    .concat(((EXTRATO.asaas ||{}).ent||[]).map(x=>({d:x.d, n:x.n, via:'Site'})));
  const porDia = (typeof M.equipePorDia==='object' && M.equipePorDia) || [];
  const dd = iso => `${iso.slice(8)}/${iso.slice(5,7)}`;

  if(k==='estoque' || k==='marketing' || k==='invest'){
    const un = k==='estoque' ? SIN_EST : k==='marketing' ? SIN_MKT : SIN_INV;
    for(const s of sinais) ent.push({d:s.d, n:s.n, f:'sinal · '+s.via, v:un});
  }
  if(k==='invest'){
    /* ⚠️ O INVESTIMENTO TEM QUATRO FONTES, não uma. A sonda pegou: faltando o
       ajuste, a lista somava R$ 2.794,38 contra R$ 1.020,05 no anel. */
    for(const x of porDia)
      if(x.eleg) ent.push({d:dd(x.d), n:`${x.eleg} procedimento${x.eleg>1?'s':''} do dia`,
                           f:'R$ '+brl(INVEST_UN)+' cada', v:c2b(x.eleg*INVEST_UN)});
    if(M.bonifPerdida>0)
      ent.push({d:'—', n:'Bonificação perdida', f:'veio da Equipe', v:M.bonifPerdida});
    /* o encaixe que faz a soma das categorias bater com o saldo das contas */
    if(M.investAjuste)
      ent.push({d:'—', n:'Acerto com o saldo das contas', f:'ordem dela, 16/09', v:M.investAjuste});
  }
  if(k==='equipe'){
    for(const x of porDia)
      if(x.mo) ent.push({d:dd(x.d), n:'Mão de obra do dia',
        f:x.np?`inclui R$ ${brl(x.np)} de não pagante`:'', v:x.mo});
    /* ⚠️ O BÔNUS É UMA LINHA SÓ, E NÃO A SOMA DOS DIAS. A reserva segue a SEMANA
       (terça a segunda), que começa antes da janela — somando dia a dia dava
       R$ 756 contra os R$ 826,24 reservados de verdade. A sonda pegou. */
    if(M.bonus)
      ent.push({d:'—', n:'Bônus reservado da semana', f:'8% do que a equipe fez', v:M.bonus});
    /* ⚠️ E A BONIFICAÇÃO PERDIDA SAI DAQUI. Não é dinheiro saindo da conta: é
       remanejamento pro Investimento. Sem esta linha o anel ficava 175,68
       abaixo da lista. */
    if(M.bonifPerdida>0)
      ent.push({d:'—', n:'Bonificação perdida', f:'foi pro Investimento', v:-M.bonifPerdida});
  }
  if(k==='oper' || k==='lucro' || k==='imposto'){
    const dias = (typeof diasComCaixa==='function' ? diasComCaixa() : [])
      .filter(d=>d>=INICIO).sort();
    for(const d of dias){
      const R = medirDia(d);
      if(k==='oper'   && R.oper)    ent.push({d:dd(d), n:'Custo de funcionamento', f:'dia útil', v:R.oper});
      if(k==='lucro'  && R.lucro)   ent.push({d:dd(d), n:'Lucro do dia',
        f:R.lucro<0?'o dia fechou negativo':'', v:R.lucro});
      if(k==='imposto'&& R.imposto) ent.push({d:dd(d), n:'6% do faturamento do dia', f:'', v:R.imposto});
    }
  }
  /* ⚠️ A RESERVA DO BÔNUS COBRA DO LUCRO o que passa dos 8% da janela — a
     semana começa antes dela. Isso é feito UMA vez, no fecho da janela, e não
     aparece em nenhum dia; sem esta linha a lista dava R$ 70,24 a mais. */
  if(k==='lucro' && typeof _EXTRA_BONUS==='number' && _EXTRA_BONUS)
    ent.push({d:'—', n:'Reserva extra do bônus da semana', f:'foi pra Equipe', v:-_EXTRA_BONUS});

  const cat = k==='oper' ? 'oper' : k;
  for(const x of (typeof sdDaJanela==='function' ? sdDaJanela() : []))
    if(x.cat===cat) sai.push({d:dd(x.dia), n:x.n, f:x.conta||'', v:Number(x.v)||0});

  /* mais novo primeiro; dentro do mesmo dia, entrada antes de saída */
  const chave = x => (x.d==='—' ? '00/00' : x.d.slice(3)+x.d.slice(0,2));
  const tudo = ent.map(x=>({...x,t:'e'})).concat(sai.map(x=>({...x,t:'s'})))
    .sort((a,b)=> chave(b).localeCompare(chave(a)) || (a.t<b.t?-1:1));
  const totEnt = c2b(ent.reduce((s,x)=>s+x.v,0));
  const totSai = c2b(sai.reduce((s,x)=>s+x.v,0));
  const pote = k==='oper' ? M.operacional : M[k];
  return {tudo, totEnt, totSai, sobra:c2b(totEnt-totSai), pote, dif:c2b(totEnt-totSai-pote)};
}
const c2b = v => Math.round((Number(v)||0)*100)/100;

const POTE_FONTE = {
  estoque:  'Cada sinal de R$ 80 que a cliente paga separa <b>R$ '+43+'</b> pro estoque.',
  marketing:'Cada sinal de R$ 80 separa <b>R$ 17</b> pro marketing.',
  invest:   'Vem de três lugares: <b>R$ 20</b> de cada sinal, <b>R$ 19,04</b> por procedimento e a bonificação que a equipe perdeu.',
  equipe:   'A mão de obra de cada dia mais o bônus de 8% — que fica reservado até o dia de pagar.',
  oper:     'O custo fixo do mês dividido pelos dias úteis, cobrado só de <b>terça a sábado</b>.',
  lucro:    'O que sobrou em cada dia, depois de equipe, produto e funcionamento.',
  imposto:  'Calculado a 6% do faturamento e <b>nunca cobrado</b> — fica de enfeite, fora da soma.',
};

function abrirPote(k){
  const E = poteExtrato(k);
  const cor = brc(CORES[k==='oper'?'oper':k==='estoque'?'produto':k] || CORES.lucro);
  const nome = (NOMES[k]||k).replace(' · 2ª unidade','');
  document.getElementById('gaveta').innerHTML = `
    <div class="cdCab"><i style="background:${cor}"></i><b>${nome}</b>
      <button class="gx" onclick="fecharSaida()">✕</button></div>

    <div class="cdOlho">Sobrou no pote</div>
    <div class="cdNum${E.pote<0?' neg':''}"><span>R$</span>${brl(E.pote)}</div>

    <div class="cdPills">
      <span class="cdPill ent">entrou <b>+ ${brl(E.totEnt)}</b></span>
      <span class="cdPill sai">saiu <b>− ${brl(E.totSai)}</b></span>
    </div>

    <div class="ptNota">${POTE_FONTE[k]||''}</div>
    <!-- ⚠️ SE O EXTRATO NÃO FECHAR COM O ANEL, ELE DIZ. Lista que soma diferente
         do número grande em cima dela é pior do que não ter lista. -->
    ${Math.abs(E.dif) >= 0.02 ? `<div class="ptErro">A lista soma
      <b>R$ ${brl(E.sobra)}</b> e o anel mostra <b>R$ ${brl(E.pote)}</b> —
      diferença de R$ ${brl(Math.abs(E.dif))}. Me avise, isso é defeito meu.</div>` : ''}

    <div class="ptLista">
      ${E.tudo.length ? E.tudo.map(x=>`<div class="exL">
          <span class="exD">${x.d}</span>
          <span class="exN">${String(x.n).replace(/</g,'&lt;')}</span>
          ${x.f?`<span class="exF">${x.f}</span>`:''}
          <!-- ⚠️ ENTRADA NEGATIVA NÃO É SAÍDA. Bonificação perdida e reserva de
               bônus são dinheiro trocando de pote, não saindo da conta — pintar
               de vermelho faria ela procurar um gasto que não existe. -->
          <span class="exV ${x.t==='s'?'sai':(x.v<0?'rem':'ent')}"
            >${(x.t==='s'||x.v<0)?'−':'+'} ${brl(Math.abs(x.v))}</span>
        </div>`).join('')
        : `<div class="cdVazio">Nada entrou nem saiu deste pote no período.</div>`}
    </div>

    <!-- ⭐ o botão virou BARRA GRUDADA no rodapé (ela, 23/10/2026). Era o
         último elemento depois da lista: numa gaveta de 1.043px dentro de
         718px, lançar um gasto exigia rolar o extrato inteiro antes. -->
    ${barraSaida(k)}`;
  document.getElementById('veu').classList.add('on');
}
function _abrirSaidaVelho(k){
  const cor = CORES[k];
  document.getElementById('gaveta').innerHTML = `
    <div class="gcab"><i style="background:${brc(cor)}"></i>
      <span>Registrar saída em<br><b>${NOMES[k]}</b></span>
      <button class="gx" onclick="fecharSaida()">✕</button></div>
    <div class="gcampo"><span>R$</span><input value="0,00" readonly></div>
    ${seletorConta()}
    <div class="gtecla">${['1','2','3','4','5','6','7','8','9',',','0','⌫']
      .map(t=>`<button>${t}</button>`).join('')}</div>
    <button class="gok" style="background:${brt(cor)};color:#fff">Lançar saída</button>`;
  document.getElementById('veu').classList.add('on');
}
function fecharSaida(e){
  /* a folha do estorno usa escala própria; ao fechar, devolve a padrão */
  const _g=document.getElementById('gaveta'); if(_g) _g.classList.remove('esG');
  /* ⚠️ quando existe valor digitado, quem manda é o guarda do saidas.js:
     fechar calado com um valor na tela foi o jeito de a saída de marketing
     de 04/09 desaparecer sem ninguém saber. */
  if(typeof sdFecharComGuarda === 'function' && typeof sdValor === 'function' && sdValor() > 0)
    return sdFecharComGuarda(e);
  if(e && e.target && e.target.id!=='veu' && !e.target.classList.contains('gx')) return;
  if(typeof _sdTxt !== 'undefined') _sdTxt='';
  document.getElementById('veu').classList.remove('on');
}


/* ══════════════════════════════════════════════════════════════════════════
   AS TRÊS CONTAS — SALDO DISPONÍVEL = tudo que entrou − tudo que saiu.
   Regra dela, 03/09. A janela começa em 02/09.

   ⚠️ A REGRA SÓ DÁ O SALDO CERTO SE A CONTA COMEÇOU DO ZERO EM 02/09 — e o
      Asaas é a prova de que nem sempre começou:
        pela regra:   560,00 − 847,42 = −287,42
        de verdade:                      154,04   (/finance/balance)
        diferença:                       441,46   ← já estava lá em 02/09
      Então no Asaas eu uso o saldo REAL do provedor, não a regra. Nas outras
      duas a regra vale, ASSUMINDO que começaram do zero — se tinham dinheiro
      antes de 02/09, o saldo verdadeiro é maior. Está dito na gaveta.

   ⚠️ A SAÍDA DE R$ 847,42 DO ASAAS É TRANSFERÊNCIA, não gasto. O dinheiro
      saiu do Asaas e entrou em alguma conta — provavelmente uma destas. Como
      o Asaas não diz qual, ela some do total. É o único furo do modelo hoje.
   ══════════════════════════════════════════════════════════════════════════ */
const ONDE = [
  {k:'nubank',  n:'Nubank',  c:'#820AD1', ent:800.00,  sai:0,
   saldo:800.00, real:false,
   d:'sinal dos agendamentos que a Lailla fez no WhatsApp',
   fonte:'10 sinais · assume saldo zero em 02/09'},
  {k:'asaas',   n:'Asaas',   c:'#1E6DFF', ent:560.00,  sai:847.42,
   saldo:154.04, real:true,
   d:'sinal de quem agendou pelo agendeaquilavoutaliso',
   fonte:'saldo lido do Asaas · tinha R$ 441,46 antes de 02/09'},
  {k:'sicredi', n:'Sicredi', c:'#3FA110', ent:3089.00, sai:0,
   saldo:3089.00, real:false,
   d:'crédito, débito e pix pagos no balcão',
   fonte:'14 clientes · assume saldo zero em 02/09'},
  /* ⚠️ A GAVETA É UMA CONTA. O dinheiro em espécie não cai em banco nenhum,
     mas continua sendo dinheiro do salão — deixar fora do total fazia o
     painel esconder R$ 604,80. Cor validada contra as outras três:
     ΔE 19,6 em visão normal. */
  {k:'dinheiro', n:'Dinheiro', c:'#D9A21B', ent:604.80, sai:0,
   saldo:604.80, real:false, icone:true,
   d:'espécie recebida no balcão, fica na gaveta',
   fonte:'3 clientes · não cai em banco'},
];
/* ⚠️⚠️ CONTA QUE AINDA ESTÁ MEDINDO ENVENENA O TOTAL (ela, 01/10/2026:
   *"os valores ficam piscando e alterando"*).
   Medido na carga: enquanto o Nubank diz "medindo…", o saldo dele é zero mas
   as saídas lançadas nele (R$ 6.074,72) já estão descontadas — o total da tela
   aparecia como **R$ −3.629,82** por 5 segundos e depois pulava pra
   R$ 3.900,18. Saldo negativo falso é a pior coisa que esta tela pode mostrar.
   🔒 Enquanto alguma conta mede, o total não é um número: é "medindo…". */
let SALDO_MEDINDO = false;
function somarContas(){
  SALDO_MEDINDO = ONDE.some(o => o && o.medindo);
  return Math.round(ONDE.reduce((s,o)=>s+(Number(o.saldo)||0),0)*100)/100;
}
let SALDO_TOTAL = somarContas();

function bolinhas(){
  return `<div class="ondes">
    ${ONDE.map(o=>`<button class="onde" onclick="abrirOnde('${o.k}')" style="--c:${o.c}">
      <span class="bola">${o.icone
        ? `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff"
             stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
             <rect x="2" y="6" width="20" height="12" rx="2"/>
             <circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>`
        : `<b class="ini">${o.n[0]}</b>`}</span>
      <!-- ⚠️ TUDO QUE É TEXTO VIVE NESTA COLUNA. Ela pode encolher (min-width:0)
           sem empurrar a bolinha pra fora do card — foi o que deixou o valor
           de 6 dígitos caber depois que a fila de 4 virou 2×2. -->
      <span class="onTx">
      <span class="onN">${o.n}</span>
      <!-- ⚠️ SALDO NEGATIVO APARECE, NÃO É ESCONDIDO. Ele significa que foi
           lançada mais saída do que a conta tem — em 04/09 o Asaas ficou em
           −R$154,04 porque uma saída desse valor foi registrada e depois o
           provedor zerou a conta numa transferência. Zerar na marra faria o
           painel mentir; o vermelho é o aviso de que tem lançamento a
           conferir. -->
      <span class="onV fina${o.saldo<0 && !o.medindo?' onNeg':''}">${o.medindo
        ? '<em class="onMed">medindo…</em>' : 'R$ '+brl(o.saldo)}</span>
      <!-- ⚠️ LEITURA VELHA TEM QUE APARECER. O Asaas foi lido por fora (o
           navegador não pode ter o token); se essa leitura envelhecer, o
           número fica parado com cara de novo — foi exatamente o que
           aconteceu em 04/09, quando entrou sinal e a tela não mexeu. -->
      <!-- ⚠️ O QUE ESTÁ PROCESSANDO APARECE NA BOLINHA (ela, 16/09/2026). Sem
           isto o saldo da Sicredi encolhe do nada entre um dia e outro, e ela
           não tem como saber que o dinheiro existe e está a caminho. -->
      ${o.processando ? `<em class="onProc">+ R$ ${brl(o.processando)} processando</em>` : ''}
      <!-- ⚠️ A DESTINAÇÃO APARECE NA BOLINHA. Sem isso, o saldo em espécie
           parece dinheiro livre — e ele tem dono: paga o funcionamento. -->
      <!-- ⛔ a destinação saiu da face (18/09) — ela continua na gaveta da conta -->
      <!-- ⚠️ ESTE FICA, e é o único que ficou: "nunca lido" / "lido há 2 dias"
           não é enfeite — é a tela avisando que o número do Asaas pode estar
           velho. Aviso que some quando está tudo certo não polui: ele só
           aparece quando há o que dizer. -->
      ${o.k==='asaas' && o.lidoEm !== undefined
        ? (!o.lidoEm
            ? '<em class="onVelho">nunca lido</em>'
            : ((Date.now()-o.lidoEm) > ASAAS_VELHO_H*3600e3
                ? `<em class="onVelho">lido ${idadeDe(o.lidoEm)}</em>` : ''))
        : ''}
      <!-- ⚠️ O ACERTO COM O EXTRATO REAL APARECE NO CARD (ela, 16/09/2026).
           Ele desloca o saldo sem ter lançamento nenhum por trás; se ficasse
           calado, o número da tela discordaria da conta de entrou-menos-saiu e
           ninguém saberia por quê. -->
      <!-- ⛔ O ACERTO COM O BANCO SAIU DA FACE (ela, 18/09/2026). Eram TRÊS
           linhas de aviso em três bolinhas, o tempo todo, dizendo uma coisa que
           não muda e que ela já sabe. Continua escrito na gaveta da conta, que
           é onde se vai quando o número não convence. -->
      <!-- ⚠️ O "+entrou −saiu" SAIU DO CARD. Era a linha de 9px do desenho —
           6px na tela dela, a mais ilegível de todas — e com o processando e o
           acerto disputando a mesma coluna ela virava a terceira linha, o que
           estourava a altura da faixa e cortava os anéis lá embaixo. Os dois
           números continuam inteiros na gaveta, que abre num toque no card. -->
      </span>
    </button>`).join('')}
  </div>`;
}
/* ══ OS EXTRATOS ═══════════════════════════════════════════════════════════
   ⚠️ CADA CONTA TEM UMA FONTE DIFERENTE, e o extrato mostra o que cada fonte
      consegue entregar:
   · ASAAS  — API do provedor: 7 entradas com NOME da cliente e 1 saída
              (transferência de R$ 847,42 em 02/09). Extrato de verdade.
   · SICREDI— PDV: 17 entradas, uma por comanda, com hora e forma.
              SAÍDAS não existem — o PDV não lança saída, e o extrato do
              banco não está ligado.
   · NUBANK — NÃO TEM EXTRATO. O valor é inferido por subtração (sinal das
              comandas menos o que o Asaas confirma), então não existe item
              nenhum pra listar. A gaveta diz isso em vez de mostrar lista
              vazia — lista vazia parece defeito, e aqui é ausência de fonte.
   ══════════════════════════════════════════════════════════════════════════ */
const EXTRATO = {
  asaas:{
    ent:[
      {d:'03/09', n:'Renata',       v:80, f:'Pix'},
      {d:'03/09', n:'Rayssa Alves', v:80, f:'Pix'},
      {d:'02/09', n:'Tassiane',     v:80, f:'Pix'},
      {d:'02/09', n:'Mercia',       v:80, f:'Pix'},
      {d:'02/09', n:'Danielle',     v:80, f:'Pix'},
      {d:'02/09', n:'Pollyanna',    v:80, f:'Pix'},
      {d:'02/09', n:'Ana Livia',    v:80, f:'Pix'},
    ],
    sai:[{d:'02/09', n:'Transferência para conta', v:847.42, f:'concluída'}],
  },
  sicredi:{
    ent:[
      {d:'03/09', h:'18:40', n:'Talitha Luiza Santos', v:269.90, f:'Dinheiro'},
      {d:'03/09', h:'17:14', n:'Já estou a caminho',   v:269.90, f:'Pix'},
      {d:'03/09', h:'16:43', n:'ELIANA',               v:65.00,  f:'Dinheiro'},
      {d:'03/09', h:'16:43', n:'HELENA',               v:65.00,  f:'Stone Créd.'},
      {d:'03/09', h:'14:44', n:'Yasmin Araújo',        v:269.90, f:'Pix'},
      {d:'03/09', h:'13:39', n:'Laleska Papini',       v:269.90, f:'Pix'},
      {d:'03/09', h:'13:31', n:'Tassiane',             v:269.90, f:'Dinheiro'},
      {d:'03/09', h:'13:29', n:'ANA BEATRIZ',          v:299.90, f:'Pix'},
      {d:'03/09', h:'13:29', n:'Tâmara Batista',       v:299.90, f:'Pix'},
      {d:'03/09', h:'11:16', n:'Evelly Campos',        v:299.90, f:'Stone Déb.'},
      {d:'03/09', h:'10:14', n:'Stephane Chagas',      v:269.90, f:'Pix'},
      {d:'03/09', h:'09:35', n:'Cristina',             v:105.00, f:'Pix'},
      {d:'02/09', h:'14:33', n:'Taina Rodrigues',      v:65.00,  f:'Pix'},
      {d:'02/09', h:'13:16', n:'Andrezza',             v:269.90, f:'Pix'},
      {d:'02/09', h:'13:15', n:'Aline Chevitarese',    v:269.90, f:'Pix'},
      {d:'02/09', h:'11:55', n:'Adaildes Félix',       v:65.00,  f:'Pix'},
      {d:'02/09', h:'09:49', n:'Raphaela Camile',      v:269.90, f:'Stone Déb.'},
    ],
    sai:[],
  },
  dinheiro:{
    ent:[
      {d:'03/09', h:'18:40', n:'Talitha Luiza Santos', v:269.90, f:'espécie'},
      {d:'03/09', h:'16:43', n:'ELIANA',               v:65.00,  f:'espécie'},
      {d:'03/09', h:'13:31', n:'Tassiane',             v:269.90, f:'espécie'},
    ],
    sai:[],
  },
  nubank:{
    ent:[
      {d:'03/09', n:'Crislayane Pereira',  v:80, f:'p/ 05/09'},
      {d:'03/09', n:'Pamela Cristina',     v:80, f:'p/ 05/09'},
      {d:'03/09', n:'Daniele Moreira',     v:80, f:'p/ 05/09'},
      {d:'03/09', n:'Cintia',              v:80, f:'p/ 03/09'},
      {d:'02/09', n:'Keith',               v:80, f:'p/ 09/09'},
      {d:'02/09', n:'Cristina',            v:80, f:'p/ 08/09'},
      {d:'02/09', n:'Luiza Mel de Almeida',v:80, f:'p/ 05/09'},
      {d:'02/09', n:'Laurianna Vasco',     v:80, f:'p/ 04/09'},
      {d:'02/09', n:'Yasmin Araújo',       v:80, f:'p/ 03/09'},
      {d:'02/09', n:'Tâmara Batista',      v:80, f:'p/ 03/09'},
    ],
    sai:[],
  },
};
/* ⭐ UM EXTRATO SÓ, EM ORDEM DE DATA — ela, 01/10/2026:
   *"no extrato da sicredi fica muito confuso, entradas de um lado, saídas de
   outro, e pior: não respeitando datas. tem saída de premiação dia 28 lá no
   início do mês. monte um extrato único com saídas e entradas tudo junto e
   organizado por data, pra eu poder bater o olho e entender se deixei de
   lançar algo. isso não só na sicredi, mas em todas as contas."*

   A causa da bagunça, medida em 01/10: as saídas chegavam na ordem das CHAVES
   do Firebase, não na ordem dos dias. A chave da bonificação é `bonif-<semana>`
   e "b" vem antes de "s" — por isso a premiação de 28/09 aparecia na primeira
   linha. Medido conta a conta: 26 das 46 saídas da Sicredi estavam fora de
   ordem, 16 de 55 no Nubank, 4 de 6 no Asaas, 2 de 3 no Dinheiro.

   ⚠️ NÃO ORDENE POR 'DD/MM' EM TEXTO. O `egOrdem()` existe pra isso: ele tira
   o ano da janela, senão 02/01 viria antes de 28/12 na virada do ano.
   ⚠️ A ORDENAÇÃO E O SINAL SÃO OS MESMOS DO EXTRATO GERAL (`egOrdem`/`egVal`,
   em extrato-geral.js). Reescrever aqui criaria duas listas do mesmo dinheiro
   que um dia discordariam — e a tela que existe pra tirar dúvida passaria a
   criar dúvida. Esta gaveta é a mesma tela, filtrada numa conta.
   ⚠️ A COLUNA DA CONTA NÃO ENTRA: aqui a conta é o título da gaveta. O que
   ocupa o lugar dela é o POTE da saída, que é a informação que falta quando se
   olha uma conta só.
   ⚠️ Processando, transferências e pendentes continuam em blocos à parte, de
   propósito: nenhum dos três está dentro do saldo, e misturá-los na linha do
   tempo faria a soma da lista não dar o número de cima. */
function abrirOnde(k){
  const o = ONDE.find(x=>x.k===k), E = EXTRATO[k];
  const soma = a => a.reduce((s,x)=>s+x.v,0);
  const esc = s => String(s==null?'':s).replace(/</g,'&lt;');
  /* o rótulo do pote só vale pra saída; na entrada o `f` é a forma de pagamento.
     ⚠️ E NÃO REPETE O QUE O NOME JÁ DIZ: a retirada de lucro se chama "Lucro
     líquido" e cai no pote "Lucro líquido" — a linha saía com a mesma palavra
     duas vezes, ocupando a coluna que deveria informar algo. */
  const rotPote = x => {
    if(!(x.tipo==='sai' && NOMES[x.f])) return esc(x.f);
    const r = NOMES[x.f].replace(' · 2ª unidade','');
    return String(x.n||'').toLowerCase().includes(r.toLowerCase()) ? '' : esc(r);
  };

  const linhas = []
    .concat((E.ent||[]).map(x => ({...x, tipo:'ent'})))
    .concat((E.sai||[]).map(x => ({...x, tipo:'sai'})))
    .map(x => ({...x, ord: egOrdem(x.d, x.h)}))
    .sort((a,b) => b.ord - a.ord);          /* mais novo em cima, como lá */

  const entTot = linhas.filter(x=>egVal(x)>0).reduce((s,x)=>s+egVal(x),0);
  const saiTot = Math.abs(linhas.filter(x=>egVal(x)<0).reduce((s,x)=>s+egVal(x),0));

  /* agrupa por dia, com o líquido do dia — é o que deixa "bater o olho" funcionar */
  const dias = [];
  linhas.forEach(x => {
    const ult = dias[dias.length-1];
    if(ult && ult.d === x.d) ult.itens.push(x);
    else dias.push({d:x.d, itens:[x]});
  });

  /* ⚠️ `egLc` = a linha do extrato DE UMA CONTA. Existe por causa do celular:
     a regra de ≤620px esconde o `.exF` porque, no extrato geral, a coluna da
     CONTA é mais importante que a forma de pagamento. Aqui não há coluna de
     conta (a conta é o título da gaveta) e o `.exF` carrega o POTE da saída —
     esconder deixava a linha do celular sem dizer de onde o dinheiro saiu.
     ⭐ A DATA SAIU DA LINHA (ela, 01/10/2026: *"não gostei de somar o total de
     lançamentos do dia, ficou confuso. eu gosto minimalista, clean"*). O
     cabeçalho do dia já diz o dia; repetir em toda linha era a mesma
     informação três vezes na mesma tela. Fica só a HORA, que é o que distingue
     uma linha da outra dentro do dia. */
  const linha = x => `<div class="exL egL egLc">
      <span class="exD">${x.h || ''}</span>
      <span class="exN">${esc(x.n)}</span>
      <span class="exF">${rotPote(x)}</span>
      <span class="exV ${egVal(x)<0?'sai':'ent'}">${egVal(x)<0?'−':'+'} ${brl(Math.abs(egVal(x)))}</span></div>`;

  /* ⛔ O SUBTOTAL DO DIA E O CONTADOR CAÍRAM AQUI (ela, 01/10/2026).
     Eram três números competindo no mesmo cabeçalho — o dia, quantos
     lançamentos e o líquido — e o líquido ainda somava verde com vermelho, que
     é a conta que ninguém faz de cabeça olhando uma lista. Quem quer o total do
     período tem a linha do rodapé; quem quer o do dia soma duas linhas. */
  const blocoDia = g => `<div class="egDia">
      <div class="egDiaCab"><b>${g.d}</b></div>
      ${g.itens.map(linha).join('')}</div>`;

  document.getElementById('gaveta').innerHTML = `
    <div class="gcab"><i style="background:${brc(o.c)}"></i>
      <!-- ⚠️ A REGRA DO CARTÃO EXPLICADA UMA VEZ, não 85. Toda linha de Stone
           traz uma segunda data (a da venda) e, sem esta frase, ela parecia um
           número solto. Só aparece onde existe cartão: na Sicredi. -->
      <span><b>${o.n}</b><br>movimento de 2 de setembro em diante${
        (E.ent||[]).some(x=>/^Stone /.test(x.f||''))
        ? ' · <i class="exReg">cartão entra no dia em que caiu; a data ao lado da bandeira é a da venda</i>'
        : ''}</span>
      <button class="gx" onclick="fecharSaida()">✕</button></div>
    <div class="exSaldo">
      <!-- ⚠️ O RÓTULO É SEMPRE "saldo da conta". Era "entrou na janela" nas
           contas sem abertura (Nubank, Asaas) — e isso passou a mentir no
           momento em que a conta de baixo mostrou "entrou + 7.210,00" logo
           abaixo de "ENTROU NA JANELA · R$ 1.055,52". O número sempre foi o
           saldo; a ressalva de que a conta começa do zero em 02/09 continua na
           linha de origem, logo abaixo. -->
      <em>saldo da conta</em>
      <b class="fina">${o.saldo==null?'—':'R$ '+brl(o.saldo)}</b>
      <span>${o.abertura
        ? `tinha R$ ${brl(o.abertura)} antes de ${INICIO.slice(8)}/${INICIO.slice(5,7)} · ${o.fonte}`
        : o.fonte}</span>
      ${o.destino ? `<div class="exDest">
        Este saldo é reservado para <b>${o.destino.rot}</b>.
        ${o.destino.pote==='oper' ? `O funcionamento do período custou
          <b>R$ ${brl(M.operacional)}</b> — é daqui que ele sai.` : ''}
        <em>A reserva não muda os potes: ela diz qual conta paga.</em>
      </div>` : ''}
      <!-- ⭐⭐ A CONTA INTEIRA, À VISTA — ela, 01/10/2026, sobre o texto que
           estava aqui: *"que confusão é essa? qual é o real saldo que deve ter
           na conta da nubank?"*
           O texto antigo ANUNCIAVA uma divergência ("a conta aqui embaixo não
           fecha com o número de cima") e nunca dizia o essencial: que o acerto
           JÁ ESTÁ dentro do número de cima. Quem lia ficava sem saber se o
           saldo da tela era o certo ou o errado.
           Agora não há o que interpretar: as quatro parcelas e o resultado, na
           mesma coluna. Se fecha na tela, fecha na cabeça.
           ⚠️ ISTO SUBSTITUI o "Entrou − saiu no período" que ficava no rodapé.
           Eram as mesmas parcelas em dois lugares, e só uma delas somava o
           acerto — era essa a origem da confusão. -->
      ${(o.abertura || o.ajuste || entTot || saiTot) ? `<div class="exConta">
        ${o.abertura ? `<div><span>já tinha em ${INICIO.slice(8)}/${INICIO.slice(5,7)}</span>
          <b>+ ${brl(o.abertura)}</b></div>` : ''}
        <div><span>entrou</span><b>+ ${brl(entTot)}</b></div>
        <!-- "saiu − 0,00" é linha que não informa nada: a conta Processando
             não tem saída nenhuma, por natureza. -->
        ${saiTot ? `<div><span>saiu</span><b>− ${brl(saiTot)}</b></div>` : ''}
        ${o.ajuste ? `<div><span>acerto com o banco${o.ajusteEm
          ? ` · ${new Date(Number(o.ajusteEm)-3*3600e3).toISOString().slice(8,10)}/${new Date(Number(o.ajusteEm)-3*3600e3).toISOString().slice(5,7)}`
          : ''}</span><b>${o.ajuste<0?'−':'+'} ${brl(Math.abs(o.ajuste))}</b></div>` : ''}
        <div class="exContaT"><span>saldo</span><b>R$ ${brl(o.saldo)}</b></div>
        ${o.ajuste ? `<p>O acerto <b>já está</b> no saldo acima — não é nada a descontar.
          É a diferença que você encontrou quando conferiu o aplicativo do banco:
          dinheiro que se moveu sem passar por um lançamento aqui.</p>` : ''}
        <!-- ⭐ A PORTA DA CONCILIAÇÃO FICA AQUI, não numa aba (ela, 01/10/2026).
             É neste ponto que a pergunta nasce — "esse número bate com o meu
             banco?" — e é aqui que a resposta tem que estar a um toque. Só
             aparece no Nubank porque é a única conta cujo extrato ela consegue
             exportar hoje; nas outras o link seria promessa sem fonte. -->
        ${o.k === 'nubank' ? `<a class="exConc" href="conciliacao.html">
          Conferir com o extrato do banco →</a>` : ''}
      </div>` : ''}
    </div>
    ${false ? '' : `
      <!-- ⛔ OS DOIS TOTAIS SAÍRAM DAQUI TAMBÉM. O rodapé já fecha o período
           ("Entrou − saiu"); repetir em cima, com outro recorte, era o mesmo
           ruído do subtotal do dia. Sobra o que esta linha existe pra dizer:
           quantas linhas vêm abaixo e em que ordem. -->
      <div class="egCab egCabLimpo">
        <span>${linhas.length} lançamento${linhas.length===1?'':'s'}<em class="egCabSub"> · do mais novo pro mais antigo</em></span>
      </div>
      ${linhas.length
        ? `<div class="egLista">${dias.map(blocoDia).join('')}</div>`
        : `<div class="exNada">Nenhum lançamento nesta conta no período.</div>`}
      ${(E.processando&&E.processando.length) ? `
        <!-- ⚠️ ENTROU, MAS NÃO CAIU (ela, 16/09/2026). A Stone paga débito e
             crédito em 1 dia útil, às 10h. Mostrar esse dinheiro como saldo
             disponível faria ela contar com dinheiro que o banco ainda não
             tem — e é dela que sai o pagamento da equipe. Fica aqui, fora do
             saldo, com o dia e a hora em que cada um vira dinheiro. -->
        <div class="exPend exProc">
          <div class="exPendT">Entrou, processando</div>
          ${E.processando.map(x=>`<div class="exPendL">
            <span>${x.n}</span><em>${x.d} · ${x.f} · ${x.quando}</em>
            <b class="num">R$ ${brl(x.v)}</b></div>`).join('')}
          <div class="exPendP">Somam <b>R$ ${brl(soma(E.processando))}</b> e
            <b>ainda não estão</b> no saldo. A Sicredi paga débito e crédito em
            <b>1 dia útil, às 10h da manhã</b> — até lá o dinheiro é da venda,
            não da conta.</div>
        </div>` : ''}
      <!-- ⛔ O "Entrou − saiu no período" SAIU DAQUI (ela, 01/10/2026). As
           mesmas parcelas já estão no alto, agora COM o acerto e fechando no
           saldo. Aqui embaixo elas fechavam num número diferente, e era isso
           que ela lia como "que confusão é essa".
           ⚠️ E SEM CRASE DENTRO DESTE COMENTÁRIO: ele mora dentro de um
           template literal, e a crase fecha a string. Custou uma tela em
           branco em 01/10, e o node --check do arquivo passou mesmo assim:
           a crase solta só encerra a string mais cedo, e o resto continua
           sendo JS válido. Quem pega isso é abrir a página. -->
      ${(E.transferencias&&E.transferencias.length) ? `
        <!-- ⚠️ TRANSFERÊNCIA NÃO É SAÍDA. É o mesmo dinheiro indo do Asaas
             pra conta dela — se eu descontasse aqui, e ela lançasse o gasto
             de novo lá na frente, o mesmo real sairia duas vezes. Fica à
             vista, fora da conta. -->
        <div class="exBloco exTransf">
          <div class="exCab">Transferências para a conta
            <b class="nada">não são saída</b>
            <em>${E.transferencias.length}</em></div>
          <div class="exLista">${E.transferencias.map(x=>`<div class="exL">
            <span class="exD">${x.d}</span><span class="exN">${x.n}</span>
            <span class="exF">${x.f}</span>
            <span class="exV">R$ ${brl(x.v)}</span></div>`).join('')}</div>
          <div class="exPendP">Somam <b>R$ ${brl(soma(E.transferencias))}</b> e
            <b>não abatem</b> o saldo: é o mesmo dinheiro mudando de lugar.
            ${E.saldoProvedor!==undefined
              ? `O Asaas em si tem <b>R$ ${brl(E.saldoProvedor)}</b> agora.` : ''}</div>
        </div>` : ''}
      ${(E.pendentes&&E.pendentes.length) ? `
        <!-- ⚠️ FORA DO SALDO, MAS À VISTA. A agenda diz que estes sinais
             foram pagos; não há entrada confirmada pra nenhum. Some do saldo
             e aparece aqui, com nome — quem conserta é ela, na origem. -->
        <div class="exPend">
          <div class="exPendT">Pagos, sem data de entrada</div>
          ${E.pendentes.map(x=>`<div class="exPendL">
            <span>${x.n}</span><em>${x.f} · ${x.via}</em>
            <b class="num">R$ ${brl(x.v)}</b></div>`).join('')}
          <!-- ⚠️ ESTE TEXTO JÁ ESTEVE ERRADO. Dizia que existia cobrança
               pendente pra cada uma — era o motivo que eu tinha DEDUZIDO, e
               estava errado. O motivo real é medido: a conversa marca o sinal
               como pago e não guarda a hora, então não dá pra saber em que
               dia o dinheiro entrou. -->
          <div class="exPendP">Somam <b>R$ ${brl(soma(E.pendentes))}</b> e
            <b>não entram</b> no saldo da janela. A conversa diz que o sinal
            foi pago mas não guardou a hora — sem a data, eu não sei em que
            dia ele caiu, e pôr no dia de hoje inflaria o dia.</div>
        </div>` : ''}`}
    <!-- ⭐ a barra de registrar saída (23/10/2026). O extrato da CONTA não
         sabe de qual pote sai o gasto — a conta é "de onde", o pote é "pra
         que" —, então aqui o botão pergunta antes, em vez de chutar. -->
    ${barraSaida(null)}`;
  document.getElementById('veu').classList.add('on');
}

/* ── informar o saldo inicial de uma conta sem API ── */
function informarSaldo(k){
  const o=ONDE.find(x=>x.k===k);
  const v=parseFloat(String(prompt(`Saldo atual do ${o.n}, em reais:`)||'')
    .replace(/\./g,'').replace(',','.'));
  if(!Number.isFinite(v)) return;
  o.saldo=v; fecharSaida(); ltSaldoRedesenhar();
}
function ltSaldoRedesenhar(){ if(typeof repintarSaldo==='function') repintarSaldo(); }

/* ── ESCOLHER A CONTA AO DAR SAÍDA ──
   ⚠️ Saída sem conta não abate nada: o saldo do painel ficaria eternamente
      certo e o do banco eternamente errado. Por isso a conta é obrigatória. */
let _contaEscolhida = 'sicredi';
function escolherConta(k){ _contaEscolhida=k;
  document.querySelectorAll('.gConta').forEach(b=>
    b.classList.toggle('on', b.dataset.k===k)); }
/* ⚠️ `naoPaga` FICA DE FORA DOS SELETORES (17/09/2026). O card Processando é
   dinheiro que a Sicredi ainda não depositou; deixar escolher ele pra lançar
   uma saída abateria de um saldo que o banco não tem. */
const contasQuePagam = () => ONDE.filter(o => !o.naoPaga);
function seletorConta(){
  return `<div class="gContas"><em>abater de qual conta?</em>
    <div class="gCl">${contasQuePagam().map(o=>`<button class="gConta${o.k===_contaEscolhida?' on':''}"
      data-k="${o.k}" onclick="escolherConta('${o.k}')" style="--c:${brc(o.c)}">
      <i></i>${o.n}<b>${o.saldo==null?'—':'R$ '+brl(o.saldo)}</b></button>`).join('')}</div></div>`;
}


/* ══ AS CATEGORIAS DO ESTOQUE ══════════════════════════════════════════════
   Regra dela, 03/09: cada sinal alimenta 1× cada categoria.
     progressiva R$14 · lanche R$7 · brinde R$15 · variáveis R$4 · toalhas R$3
   ⚠️ SOMA R$43 EXATO — o mesmo pedaço que o estoque leva do sinal de R$80
      (17 marketing + 20 investimento + 43 estoque). A conta fecha sozinha.
   ⚠️ MULTIPLICO POR 12, não por 17. São 12 procedimentos fechados na janela,
      e é esse o número que forma o pote de R$516 no card. Os 17 sinais
      recebidos incluem gente marcada pra 05/09, 08/09 e 19/09 — dinheiro que
      entrou, serviço que não aconteceu. Usar 17 aqui faria a gaveta somar
      R$731 e discordar do card de onde ela abriu.
   ⚠️ SALDO = entrou − saiu. Nenhuma saída de estoque foi lançada ainda, então
      hoje saldo = entrada. Quando a equipe consumir, a saída abate aqui. */
const EST_CAT = [
  {k:'progressiva', n:'Progressiva',  un:14, c:'#00E0D5'},
  {k:'brinde',      n:'Brinde',       un:15, c:'#9B5DFF'},
  {k:'lanche',      n:'Lanche',       un:7,  c:'#FFA51F'},
  {k:'variaveis',   n:'Variáveis',    un:4,  c:'#4C8DFF'},
  {k:'toalhas',     n:'Toalhas',      un:3,  c:'#FF2D9B'},
];
const EST_UN = EST_CAT.reduce((s,c)=>s+c.un,0);   /* = 43 */
/* ⚠️ ISTO AQUI ERA UMA VARIÁVEL DE TELA QUE NINGUÉM PREENCHIA. Quando a
   saída do estoque passou a ser lançada de verdade (com conta e gravação no
   banco), a gaveta continuou lendo esta variável — que nasce vazia e nunca
   recebe nada. Resultado medido em 04/09: ela deu R$883 de saída em Brinde,
   o anel do Estoque ficou negativo corretamente, e a linha do Brinde dentro
   da gaveta seguia mostrando o valor cheio, como se nada tivesse saído.
   Agora a gaveta lê as saídas de verdade. */
function estSaidaPor(){
  const m = {};
  for(const x of (typeof sdDaJanela==='function' ? sdDaJanela() : [])){
    if(x.cat !== 'estoque') continue;
    /* a subcategoria vem no campo `sub`; os lançamentos antigos só têm o nome
       ("Estoque · Brinde"), então caio no texto pra não perder os que já
       existem no banco */
    let k = x.sub;
    if(!k){
      const alvo = _semAcento(String(x.n||'').split('·').pop());
      k = (EST_CAT.find(c => _semAcento(c.n) === alvo) || {}).k;
    }
    if(!k) k = '_outros';
    m[k] = Math.round(((m[k]||0) + Number(x.v||0))*100)/100;
  }
  return m;
}
const _semAcento = s => String(s||'').trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function abrirEstoque(){
  const n = PROC_N;
  const SAI = estSaidaPor();
  const linhas = EST_CAT.map(c=>{
    const ent=c.un*n, sai=SAI[c.k]||0, sal=Math.round((ent-sai)*100)/100;
    return `<div class="esL">
      <span class="esPt" style="background:${EST_PT}"></span>
      <span class="esN">${c.n}<em>R$ ${brl(c.un)} por atendimento</em></span>
      <span class="esM"><b class="num${sal<0?' potNeg':''}">R$ ${brl(sal)}</b>
        <em class="num">+${brl0(ent)} −${brl0(sai)}</em></span>
      <button class="esBt" onclick="saidaEstoque('${c.k}')">dar saída</button>
    </div>`;}).join('');
  const tot = Math.round(EST_CAT.reduce((s,c)=>s+c.un*n-(SAI[c.k]||0),0)*100)/100;
  /* saída de estoque que não bateu com nenhuma das cinco não pode sumir */
  const orfas = SAI._outros || 0;
  document.getElementById('gaveta').innerHTML = `
    <div class="gcab"><i style="background:${brc(CORES.produto)}"></i>
      <span>Saldo do <b>Estoque</b><i class="gsub">de 2 de setembro em diante</i></span>
      <button class="gx" onclick="fecharSaida()">✕</button></div>
    <div class="esTopo"><em>saldo disponível</em>
      <b class="fina${tot<0?' potNeg':''}">R$ ${brl(tot)}</b>
      <span>R$ ${brl(EST_UN)} por atendimento × <b>${n}</b> procedimentos</span></div>
    <div class="esLista">${linhas}</div>
    <div class="esPe">Cada sinal de R$ 80,00 alimenta <b>1× cada categoria</b>.
      As cinco somam <b>R$ ${brl(EST_UN)}</b> — o pedaço do estoque no sinal.
      ${orfas ? `<br>⚠️ <b>R$ ${brl(orfas)}</b> de saída sem categoria reconhecida.` : ''}
      ${tot<0 ? `<br>⚠️ Saiu <b>R$ ${brl(-tot)}</b> a mais do que o período separou.` : ''}</div>`;
  document.getElementById('veu').classList.add('on');
}
/* ⚠️ ERA UM `prompt` QUE NÃO PERGUNTAVA A CONTA E NÃO ABATIA NADA — só mexia
   numa variável de tela. Agora cai no mesmo fluxo das outras: valor, conta e
   confirmação, e abate do saldo total. A categoria continua sendo `estoque`,
   porque é o anel do estoque que tem que encolher; o nome da subcategoria vai
   escrito no lançamento pra ela saber depois o que foi comprado. */
function saidaEstoque(k){
  const c = EST_CAT.find(x=>x.k===k);
  sdAbrir('estoque', `Estoque · ${c.n}`, k);
}
