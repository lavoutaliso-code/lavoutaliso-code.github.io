/* ══════════════════════════════════════════════════════════════════
   A DIVISÃO NOS POTES — GERADO, NÃO ESCRITO À MÃO

   ⚠️ NÃO EDITE ESTE ARQUIVO. Ele é recortado de
   ~/Downloads/lei-dos-potes-app/www/index.html por `gerar-divisao.mjs`.
   Mexer aqui faz o gestor mostrar uma divisão diferente da do app — que
   é o defeito mais caro deste projeto.

   Para atualizar:  node gerar-divisao.mjs && node conferir-divisao.mjs

   Gerado em 2026-09-18 15:49 UTC
   ══════════════════════════════════════════════════════════════════ */
(function(){
const PLANO_ORIGINAL = {
  fixasDia:375, diarioDia:167, pctDizimo:10, pctReserva:50, pctA:25, pctB:25,
  rendaMes:6000, nomeA:'Desfrute dele', nomeB:'Desfrute dela', nomeDono:'',
};
let plano = Object.assign({}, PLANO_ORIGINAL);

/* ══════════════════════════════════════════════════════════════════
   OS POTES
   ══════════════════════════════════════════════════════════════════
   ⚠ As CHAVES (k) NUNCA mudam: é o que liga cada gasto ao histórico no
   banco. Trocar uma chave torna invisível todo lançamento antigo dela.

   Cada pote diz DE ONDE sai o dinheiro dele:
     quando:'antes'  sai do bruto, antes de qualquer divisão
     quando:'sobra'  divide o que restou depois dos de 'antes'
   e COMO se calcula:
     modo:'pct'  uma porcentagem
     modo:'dia'  um valor por dia útil desde a última entrada

   `protegido` só vale para os de 'sobra': quando a entrada não cobre os
   custos, o buraco é descontado dos NÃO protegidos. É a regra da dona de
   28/07: quem aperta o cinto é o desfrute, nunca o patrimônio.

   Esta lista é o PADRÃO. Cada casa guarda a sua em plano.potes, montada
   na primeira abertura — mas quem já tinha plano antes disso continua
   funcionando, porque potesDoPlano() reconstrói a partir dos campos
   antigos quando plano.potes não existe.                              */
/* ── AS CORES SÃO AS DOS MOCKUPS APROVADOS (decisão da dona, 10/08) ──
   Os seis potes do desenho da tela de Início passaram a valer com a cor
   exata que ele desenha. Duas mudam de verdade: o Desfrute dele era AZUL
   e virou ROXO, e o Patrimônio saiu do verde da marca (#1FB80A) pro
   #22C55E do desenho — este último reabre de propósito um dos seis verdes
   que a auditoria de paleta do LEIA.md tinha unificado. Foi escolhido
   sabendo disso: "idêntico ao mockup" ganhou da auditoria.
   Os sete potes que o desenho não mostra ficam com as cores de sempre. */

const POTES_PADRAO = [
  { k:'dizimo',    nome:'Dízimo',           cor:'#14B8A6', ic:'mao',    quando:'antes', modo:'pct', valor:10  },
  { k:'fixas',     nome:'Contas fixas',     cor:'#5B6CF9', ic:'casa',   quando:'antes', modo:'dia', valor:375 },
  { k:'diario',    nome:'Custos dia a dia', cor:'#F09A1E', ic:'sacola', quando:'antes', modo:'dia', valor:167 },
  { k:'reserva',   nome:'Patrimônio',       cor:'#22C55E', ic:'porco',  quando:'sobra', modo:'pct', valor:50, protegido:true },
  { k:'parceiroA', nome:'Desfrute dele',    cor:'#8040E8', ic:'user',   quando:'sobra', modo:'pct', valor:25 },
  { k:'parceiroB', nome:'Desfrute dela',    cor:'#E8559C', ic:'user',   quando:'sobra', modo:'pct', valor:25 },
];

/* O catálogo do que a pessoa pode escolher na montagem. Os seis de cima
   mais os que só existem se ela quiser. */
const POTES_EXTRAS = [
  /* dívida sai ANTES, como as contas fixas, e em reais por dia útil:
     a parcela não encolhe porque o mês foi fraco. O que muda é que ela
     tem prazo — quando acaba, o pote some do plano. */
  { k:'dividas',   nome:'Dívidas',          cor:'#F0483E', ic:'casa',     quando:'antes', modo:'dia', valor:0  },
  { k:'social',    nome:'Ação social',      cor:'#DB4A93', ic:'mao',      quando:'antes', modo:'pct', valor:5  },
  { k:'educacao',  nome:'Educação',         cor:'#8B5CF6', ic:'tela',     quando:'sobra', modo:'pct', valor:10 },
  { k:'saude',     nome:'Saúde',            cor:'#14B8A6', ic:'escudo',   quando:'antes', modo:'dia', valor:0  },
  { k:'viagem',    nome:'Viagem',           cor:'#0EA5E9', ic:'aviao',    quando:'sobra', modo:'pct', valor:10 },
  { k:'presentes', nome:'Presentes',        cor:'#F59E0B', ic:'presente', quando:'sobra', modo:'pct', valor:5  },
  { k:'investir',  nome:'Investimentos',    cor:'#16A006', ic:'porco',    quando:'sobra', modo:'pct', valor:20, protegido:true },
];

const CATALOGO = POTES_PADRAO.concat(POTES_EXTRAS);

/* A ILUSTRAÇÃO DE CADA POTE.
   Mora fora do catálogo de propósito: o catálogo é o modelo do dinheiro
   e não deve saber de arquivo de imagem. Quem não tem figura cai no
   ícone de traço que o app já usava — hoje é o caso do dízimo, da ação
   social e da educação, que ainda não têm arte. */
/* contas-fixas.png é a arte nova da paleta verde. As dezessete
   ilustrações passaram a ter o MESMO quadro de 512×512, com a figura
   centrada e uma margem igual — antes cada uma vinha colada no próprio
   desenho, de 216×285 a 378×306, e por isso a mesma altura no CSS dava
   tamanhos aparentes diferentes. Agora `height:70px` significa a mesma
   coisa em todas. */
const FIGURA = {
  fixas:'novas/contas-fixas.png', diario:'novas/supermercado.png',
  reserva:'novas/patrimonio.png', dividas:'novas/dividas.png',
  parceiroA:'novas/desfrute-dele.png', parceiroB:'novas/desfrute-dela.png',
  saude:'novas/saude.png', viagem:'novas/viagem.png',
  educacao:'novas/educacao.png', dizimo:'novas/dizimo.png',
  presentes:'novas/desfrute-dela.png', investir:'novas/patrimonio.png',
  filhos:'novas/filhos.png',
  /* pets tinha a figura de FILHOS — mamadeira e chupeta no pote de
     animais. A arte de pets existia desde sempre em www/pets.png, do
     conjunto antigo; foi enquadrada em 512×512 como as outras e entrou
     no conjunto novo. Ela é mais colorida que as 15 verdes — quando
     houver uma na paleta nova, é só trocar o arquivo. */
  pets:'novas/pets.png',
  delivery:'novas/delivery.png', transporte:'novas/transporte.png',
  higiene:'novas/higiene.png',
}

/* Os potes DESTA casa. Quem tem plano.potes usa o dele; quem é de antes
   da configuração livre cai no padrão, com os valores que já tinha. */
function potesDoPlano(p){
  if (p && Array.isArray(p.potes) && p.potes.length) return p.potes;
  const v = { dizimo:p?.pctDizimo, fixas:p?.fixasDia, diario:p?.diarioDia,
              reserva:p?.pctReserva, parceiroA:p?.pctA, parceiroB:p?.pctB };
  const lista = POTES_PADRAO.map(t => Object.assign({}, t, {
    valor: v[t.k] ?? t.valor,
    nome: t.k === 'parceiroA' ? (p?.nomeA || t.nome)
        : t.k === 'parceiroB' ? (p?.nomeB || t.nome) : t.nome,
  }));
  /* O pote de dívidas só existe pra quem tem dívida. Sem isso, todo
     mundo ganharia um pote de R$ 0 na tela — e a suíte de regressão dos
     306 lançamentos passaria a comparar sete potes com seis.
     Entra logo depois das contas fixas porque é da mesma natureza:
     compromisso que sai antes de qualquer divisão. */
  if ((p?.dividasDia || 0) > 0){
    const molde = CATALOGO.find(t => t.k === 'dividas');
    const i = lista.findIndex(t => t.k === 'fixas');
    lista.splice(i < 0 ? lista.length : i + 1, 0,
      Object.assign({}, molde, { valor: p.dividasDia }));
  }
  return lista;
}

/* POTES/CHAVES/POR_CHAVE continuam existindo porque uns 15 lugares os
   leem. Agora são recalculados quando o plano muda, em vez de fixos. */
let POTES = potesDoPlano(plano);
let CHAVES = POTES.map(p => p.k);
let POR_CHAVE = {};
function recalcularPotes(){
  POTES = potesDoPlano(plano);
  POTES.forEach(t => { if (!t.curto) t.curto = t.nome; });
  CHAVES = POTES.map(p => p.k);
  POR_CHAVE = {}; POTES.forEach(p => POR_CHAVE[p.k] = p);
}
recalcularPotes();

/* Os dois potes de desfrute são os únicos que cada casal batiza do seu jeito.
   Dez lugares no app leem p.nome/p.curto — em vez de mexer nos dez, o nome é
   aplicado aqui assim que o plano chega do banco, e todos passam a ler o
   valor novo sozinhos. */
function aplicarNomesDosPotes(p){
  /* ⚠️ ISTO DERRUBAVA O PRIMEIRO ACESSO INTEIRO.
     Os dois potes de desfrute eram tratados como se sempre existissem —
     é assim na casa da dona. Mas quem monta o plano arrastando pode
     escolher só um deles, ou nenhum: quem mora sozinha não põe
     "Desfrute marido". Aí POR_CHAVE.parceiroA vinha `undefined`, o
     `.curto` estourava, e salvarPotes() morria no meio com
     "Não deu pra salvar: Cannot set properties of undefined". A pessoa
     montava o plano inteiro, tocava em Continuar e o app não saía do
     lugar — sem caminho nenhum pra frente.
     Achado percorrendo o caminho do usuário de ponta a ponta em 11/08. */
  const batiza = (chave, nome) => {
    const t = POR_CHAVE[chave];
    if (t) t.nome = t.curto = nome;
  };
  batiza('parceiroA', (p && p.nomeA) || PLANO_ORIGINAL.nomeA);
  batiza('parceiroB', (p && p.nomeB) || PLANO_ORIGINAL.nomeB);
}

/* "Olá, Izabela" era texto fixo em 4 telas. Agora sai do plano — e some
   inteiro se ninguém preencheu o nome, em vez de saudar a pessoa errada. */
function aplicarSaudacao(p){
  const nome = (p && p.nomeDono || '').trim();
  document.querySelectorAll('.pg-ola').forEach(el => {
    el.textContent = nome ? 'Olá, ' + nome : '';
    el.style.display = nome ? '' : 'none';
  });
}


const hojeD = new Date();
/* dias úteis médios de um mês, sem domingo: 30,44 × 6/7.
   ⚠️ Vive AQUI, DEPOIS do `const hojeD`, e não lá embaixo perto da tela:
   é o diariasDa() que usa, e a suíte de testes extrai o bloco de cálculo
   começando exatamente nesta linha. Um centímetro acima e o teste roda
   com a constante indefinida, acusando um erro que não existe no app. */
const DIAS_UTEIS = 26;
const anoAtual = hojeD.getFullYear(), mesAtual = hojeD.getMonth();


function toDateKey(s){ const d = new Date(s); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function isMes(s, m, a){ const d = new Date(s); return d.getMonth()===m && d.getFullYear()===a; }
function isMesAtual(s){ return isMes(s, mesAtual, anoAtual); }

/* dias úteis (não conta domingo), do dia SEGUINTE ao início até o fim */
function diasUteisEntre(ini, fim){
  let n = 0;
  const cur = new Date(ini); cur.setDate(cur.getDate()+1);
  const end = new Date(fim); end.setHours(23,59,59,999);
  while (cur <= end){ if (cur.getDay() !== 0) n++; cur.setDate(cur.getDate()+1); }
  return n;
}

/* dias úteis do dia informado até o fim do mês dele, contando o próprio dia.
   No último dia útil do mês dá 1 — que é justamente o que valia antes desta
   regra existir, então a borda não muda de comportamento. */
function diasUteisAteOFimDoMes(quando){
  const cur = new Date(quando); cur.setHours(0,0,0,0);
  const fim = new Date(cur.getFullYear(), cur.getMonth()+1, 0); fim.setHours(23,59,59,999);
  let n = 0;
  while (cur <= fim){ if (cur.getDay() !== 0) n++; cur.setDate(cur.getDate()+1); }
  return n;
}

/* ══════════════════════════════════════════════════════════════════
   QUANTAS DIÁRIAS UMA ENTRADA ABATE
   ══════════════════════════════════════════════════════════════════
   O invariante, e é ele que faz a conta fechar:

     em qualquer período, Σ(diárias reservadas) = dias úteis do período

   Se isso vale, `diária × Σ(diárias)` dá exatamente o total do mês que a
   pessoa informou — pra QUALQUER ritmo de recebimento, sem perguntar o
   ritmo a ninguém. Cada dia útil é cobrado uma vez: nem duas, nem
   nenhuma.

   ── O QUE ESTAVA ERRADO: A CONTAGEM REINICIAVA A CADA MÊS ──
   Era "a primeira entrada do mês abate 1". Quem recebe salário nunca tem
   entrada anterior NO MÊS — então todo salário abatia 1 diária, e o
   dinheiro das contas fixas do mês inteiro escorria pro desfrute.
   Medido em teste/fecha.mjs, com seis meses simulados: quem recebe
   mensalmente reservava 29 diárias em vez de 155, e o pote de contas
   fixas ficava R$ 9.769 abaixo do que precisava ter.

   A contagem agora ATRAVESSA O MÊS: conta desde a entrada anterior, seja
   ela de quando for. Salário do dia 5 de setembro, sendo o anterior o do
   dia 5 de agosto? Vinte e seis diárias. Recebeu de novo três dias
   depois? Três. Duas vezes no mesmo dia? A segunda abate zero.

   ── A MARCA D'ÁGUA ──
   Uma entrada comum PAGA O QUE JÁ PASSOU: ela cobre até o próprio dia.
   O saldo de abertura faz o contrário — ele é o único que olha pra
   frente, e cobre até o fim do mês. Então ele deixa a marca lá na
   frente, e a entrada seguinte conta a partir dela, não a partir da data
   dele. Sem isso os dois se sobrepõem: no ritmo diário o mês de estreia
   era cobrado duas vezes e o pote reservava R$ 1.923 a mais.
   ══════════════════════════════════════════════════════════════════ */

/* ── O CICLO: QUANTOS DIAS ÚTEIS UMA ENTRADA TEM QUE SUSTENTAR ──
   É a resposta da pergunta "com que frequência entra dinheiro?", feita
   uma vez na montagem do plano. Sem ela a reserva só pode olhar pra
   trás — cobrir os dias que já passaram — e aí ela chega sempre um ciclo
   atrasada: o salário do dia 5 reserva o mês que passou, e o aluguel do
   dia 10 vence com o pote ainda vazio. Medido em teste/fecha.mjs.

   Com o ciclo, cada entrada reserva pra FRENTE o que precisa sustentar
   até o próximo dinheiro. O dinheiro do aluguel está no pote antes de o
   aluguel vencer, que é a única definição de "a conta fecha".

   `irregular` é quem não tem ritmo — freela, comissão. Pra ele não há o
   que prever, então ele continua olhando pra trás, que é o melhor que dá
   sem inventar uma previsão que não existe. É também o padrão de quem
   montou o plano antes desta pergunta existir: assim nenhum histórico
   muda de valor sozinho. */
const CICLO = { diario:1, semanal:6, quinzenal:13, mensal:26 };
const cicloDo = p => CICLO[(p && p.ritmo) || ''] || null;

/* anda n dias úteis pra frente a partir de d (d inclusive conta como 1) */
function avancaDiasUteis(d, n){
  const cur = new Date(d);
  let faltam = Math.max(1, n) - 1;
  while (faltam > 0){
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0) faltam--;
  }
  cur.setHours(23, 59, 59, 999);
  return cur;
}

/* ── QUANTAS DIÁRIAS A PRIMEIRA ENTRADA DA VIDA COMPRA ──
   ⚠️ ESTA REGRA MORAVA EM DOIS LUGARES, E SÓ UM FOI ATUALIZADO — foi o
   defeito mais caro que este arquivo já teve, e ele era invisível.

   Em 10/08 a `diariasDa()` passou a cobrar da primeira entrada só a
   PROPORÇÃO dela (26 × valor ÷ renda). Mas a `fimCobertoPor()` continuou
   dizendo que a primeira entrada cobria ATÉ O FIM DO MÊS. As duas
   discordavam: a marca d'água saltava pro dia 31 tendo sido paga uma
   fração de um dia, e TODAS as entradas seguintes daquele mês
   encontravam o mês "já coberto" e reservavam ZERO pras contas fixas,
   pro dia a dia e pras dívidas. O dinheiro não sumia — ia todo pros
   potes de sobra, sem erro nenhum na tela.

   O tamanho do estrago, medido em teste/fecha.mjs: R$ 2.000 de contas
   fixas nunca reservados no primeiro mês de um plano de R$ 5.000 — um
   mês inteiro de aluguel e luz — para TODA pessoa que começa a usar o
   app. Era a suíte vermelha desde o commit a00ba48 que dizia isso, e
   ela vinha sendo lida como "teste velho".

   Agora a conta existe UMA vez e as duas leem daqui. Se um dia a regra
   mudar de novo, ela muda nas duas ao mesmo tempo — que é a única
   proteção real contra esta classe de erro. */

/* ── DUAS RÉGUAS, E A CASA ESCOLHE A DELA ──
   A regra proporcional de 10/08 foi pensada pra quem ACABOU de assinar:
   a pessoa lança R$ 50 no primeiro dia e não quer ver as contas fixas
   comerem uma fatia que ela não reconhece. Pra uma casa que já roda há
   meses, com o saldo do banco lançado de verdade, ela é o contrário do
   que se quer: a diária das obrigações é fixa e o mês tem que ser
   coberto — foi essa a escolha da dona em 12/08 para a casa dela.

     'diaria'       o saldo de abertura cobre os dias úteis que faltam
                    até o fim do mês, à diária cheia (a régua de antes
                    de 10/08 — "diária fixa")
     'proporcional' o saldo de abertura é repartido pelas porcentagens
                    do plano (a régua de 10/08, o padrão de quem assina)

   ⚠️ A RÉGUA VIAJA NO PLANO, NÃO NUM `if` COM O uid DA DONA. É o que
   permite a suíte de regressão rodar a casa dela com a régua dela: o
   plano fica congelado dentro de cada lançamento, então uma entrada de
   ontem é recontada com a régua que valia ontem, e não com a de hoje.

   ⚠️ O PADRÃO É 'proporcional' E NÃO SE DEDUZ DE NADA. Cheguei a deixar
   o padrão sair do FORMATO do plano (plano sem `potes` = de antes do
   produto = a casa dela). Parecia elegante e estava errado: a diária
   cheia cobrada do primeiro lançamento da casa dela — R$ 1.069,90 de um
   dia de salão — reservaria 22 dias úteis de obrigação, R$ 11.924, e
   abriria um buraco de R$ 10.961 num dia só. Régua de dinheiro não se
   liga por adivinhação de formato; se liga escrita no plano, à mão. */
function regraDaAbertura(p){
  return (p && p.regraAbertura) || 'proporcional';
}

function diariasDaAbertura(entrada){
  const p = planoDe(entrada);
  const valor = Number(entrada.valor) || 0;
  const renda = Number(p.rendaMes) || 0;

  /* a régua da casa: diária cheia até o fim do mês */
  if (regraDaAbertura(p) === 'diaria') return diasUteisAteOFimDoMes(new Date(entrada.data));

  if (renda > 0) return DIAS_UTEIS * valor / renda;

  /* ⚠️ AQUI ESTAVA UM BURACO ANTERIOR, e ele aparecia justo no primeiro
     lançamento da vida da pessoa. Sem renda gravada, a regra caía de
     volta nos dias úteis até o fim do mês — 18, 22, o que fosse — e o
     resultado era absurdo: numa entrada de R$ 1.000 com 30% de contas
     fixas, o pote de contas fixas ficava com R$ 1.038 (mais do que
     entrou!) e o patrimônio ia pra R$ −731. A pessoa lançava o primeiro
     dinheiro dela e via o app inventar dívida.

     Não dá pra recuperar as porcentagens sem a renda: os potes de
     obrigação guardam R$ POR DIA, não fração. Mas dá pra garantir a
     única coisa que importa — que as obrigações NUNCA passem do que
     entrou. Com `dias = 26 × entrada ÷ obrigações do mês`, elas consomem
     exatamente a entrada e a sobra fica em zero: "tudo que você recebeu
     já está comprometido" é duro, e é verdade. */
  const obrigMes = potesDoPlano(p)
    .filter(t => t.quando === 'antes' && t.modo === 'dia')
    .reduce((s, t) => s + (Number(t.valor) || 0) * DIAS_UTEIS, 0);
  if (obrigMes > 0 && valor > 0) return Math.min(DIAS_UTEIS, DIAS_UTEIS * valor / obrigMes);
  /* plano sem obrigação nenhuma: não há o que reservar por dia, e tudo
     cai na sobra — que é o certo */
  return 0;
}

/* até que dia esta entrada deixa coberto */
function fimCobertoPor(e, todas){
  const d = new Date(e.data);
  /* ── A ABERTURA COBRE O QUE ELA PAGOU, NÃO O MÊS INTEIRO ──
     A marca d'água é uma data, e as diárias da abertura são fracionárias
     (R$ 49,68 numa renda de R$ 6.450 são 0,2 diárias). O arredondamento
     é o encontro dos dois: a abertura cobre, no mínimo, o próprio dia —
     nunca menos, senão a entrada seguinte cobraria esse dia de novo. O
     resto de meia diária, uma vez na vida, é o preço de a marca d'água
     morar num calendário. */
  if (!todas.some(x => new Date(x.data) < d))
    return avancaDiasUteis(d, Math.round(diariasDaAbertura(e)));
  const ciclo = cicloDo(planoDe(e));
  return ciclo ? avancaDiasUteis(d, ciclo) : d;
}

/* o dia mais longe já coberto por ALGUMA entrada anterior. Tem que ser o
   máximo, não o da última: o saldo de abertura cobre até o fim do mês, e
   as entradas seguintes daquele mês cobrem só o próprio dia — olhando só
   pra última, a terceira entrada de janeiro voltava a cobrar dias que o
   saldo já tinha pago. */
function marcaDagua(antes, todas){
  let fim = null;
  for (const e of antes){
    const f = fimCobertoPor(e, todas);
    if (!fim || f > fim) fim = f;
  }
  return fim;
}

function diariasDa(entrada, todas){
  const d0 = new Date(entrada.data);
  const antes = todas.filter(e => new Date(e.data) < d0)
                     .sort((a, b) => new Date(a.data) - new Date(b.data));

  /* ── A PRIMEIRA ENTRADA DIVIDE SÓ PELAS PORCENTAGENS ──
     Ela cobrava os dias úteis que faltavam até o fim do mês — 19, 22,
     o que fosse. A ideia era que o saldo do banco sustentasse o resto
     do mês, mas o efeito na tela era outro: a pessoa lançava o primeiro
     valor e via as contas fixas comerem uma fatia que ela não
     reconhecia, sem nada explicando de onde vinham aqueles dias.
     (decisão da dona, 10/08)

     Agora a primeira entrada é repartida exatamente pelas porcentagens
     que ela acabou de definir. Como os potes de reais-por-dia guardam
     R$/dia (renda × pct ÷ 26), o número de diárias que reproduz a
     porcentagem é 26 × (valor da entrada ÷ renda do mês):
        R$/dia × diárias = (renda × pct/100 ÷ 26) × 26 × (valor/renda)
                         = valor × pct/100                              ✓
     Entrada igual à renda do mês → 26 diárias, o mês inteiro. Metade da
     renda → metade de cada pote. É a mesma conta, dita pela proporção.

     ⚠️ A CONTA MORA EM diariasDaAbertura(), E fimCobertoPor() LÊ A MESMA.
     Ter a regra escrita duas vezes já custou um mês de contas fixas de
     todo mundo que começou a usar o app — está contado lá em cima. */
  if (!antes.length) return diariasDaAbertura(entrada);

  /* os dias que ESTA entrada acrescenta: da marca d'água até o fim que
     ela cobre. Chegou adiantada, acrescenta só o que passa da marca;
     chegou atrasada, cobre o buraco junto. */
  const d = diasUteisEntre(marcaDagua(antes, todas), fimCobertoPor(entrada, todas));
  return d < 0 ? 0 : d;
}

/* diárias que uma entrada NOVA (agora) abateria — a mesma regra, e é por
   isso que a prévia do cartão nunca discorda do que fica gravado.

   ⚠️ ELA DISCORDAVA, E JUSTO NO PRIMEIRO LANÇAMENTO DA VIDA DA PESSOA.
   Aqui estava `diasUteisAteOFimDoMes()` — a regra de antes de 10/08 —
   enquanto o que ficava gravado já era a proporção. A prévia prometia
   reservar 22 dias de contas fixas e o gravado reservava meio dia. Por
   isso o valor e o plano agora ENTRAM: sem eles não dá pra calcular a
   abertura, e foi a falta deles que deixou a regra velha aqui. */
function diariasAgora(valor, planoCongelado){
  const agora = new Date();
  const antes = entradas.filter(e => new Date(e.data) <= agora)
                        .sort((a, b) => new Date(a.data) - new Date(b.data));
  if (!antes.length)
    return diariasDaAbertura({ valor: Number(valor) || 0, plano: planoCongelado });
  const ciclo = cicloDo(plano);
  const ate = ciclo ? avancaDiasUteis(agora, ciclo) : agora;
  const d = diasUteisEntre(marcaDagua(antes, entradas), ate);
  return d < 0 ? 0 : d;
}

/* o plano que vale pra UMA entrada: o que ficou gravado nela, ou o original */
function planoDe(e){ return Object.assign({}, PLANO_ORIGINAL, e.plano || {}); }

/* divide UM valor segundo UM plano.

   Duas etapas, na ordem:
     1. os potes 'antes' saem do bruto — porcentagem do que entrou, ou
        valor por dia útil desde a última entrada
     2. o que restou (a sobra) é repartido entre os potes 'sobra', pela
        porcentagem de cada um

   REGRA DA DONA (28/07): não existe trava de entrada baixa. Se o que
   entrou não cobre os custos, o buraco NÃO some — ele é descontado dos
   potes de sobra NÃO protegidos, na proporção deles. Os protegidos
   (patrimônio) ficam zerados mas não negativos: quem aperta o cinto é o
   desfrute, não a poupança.

   Antes esta função conhecia os seis potes pelo nome. Agora lê a lista
   do plano — o que permite cada casa montar os seus sem que a regra
   mude. Com a lista padrão, o resultado é idêntico ao de antes: é o que
   a suíte de regressão comprova. */
function dividir(valor, dias, p){
  const lista = potesDoPlano(p);
  const r = {};
  let restante = valor;

  for (const t of lista){
    if (t.quando !== 'antes') continue;
    const v = t.modo === 'dia' ? (t.valor || 0) * dias : valor * ((t.valor || 0) / 100);
    r[t.k] = v;
    restante -= v;
  }

  const sobra = restante;
  const daSobra = lista.filter(t => t.quando === 'sobra');

  if (sobra >= 0){
    /* ── A SOBRA VAI INTEIRA, SEMPRE ──
       Era `valor/100`, o que só fecha se os potes de sobra somarem 100
       entre eles. Os seis antigos somam (50+25+25), mas a tela de
       arrastar coleta "% da RENDA" — patrimônio 25 e viagem 15 somam 40,
       e os outros 60% da sobra sumiam: não iam pra pote nenhum, e o
       saldo da Home, que é a soma dos potes, ficava menor que o banco.
       Repartir pelo PESO é o que o ramo do buraco, logo abaixo, sempre
       fez. Com os seis antigos o resultado é idêntico — é o que a suíte
       dos 306 lançamentos comprova. */
    const pesos = daSobra.reduce((n, t) => n + (t.valor || 0), 0);
    for (const t of daSobra){
      r[t.k] = pesos > 0 ? sobra * ((t.valor || 0) / pesos)
                         : sobra / (daSobra.length || 1);
    }
    r.sobra = sobra; r.buraco = 0;
    return r;
  }

  /* ── FALTOU DINHEIRO: O BURACO SAI DOS NÃO PROTEGIDOS ──
     A regra da dona (28/07): o patrimônio zera mas não fica negativo —
     quem aperta o cinto é o desfrute.

     MAS A PROTEÇÃO SÓ EXISTE PORQUE HÁ QUEM APERTAR. Num plano em que
     todo pote de sobra é protegido, `absorvem` ficava vazio, o laço não
     rodava, e o buraco simplesmente sumia: a soma dos potes passava a
     ser MAIOR que o valor lançado, e o app inventava dinheiro que não
     existe. Num plano só de patrimônio dava R$ 23.400 de invenção.
     Quando não há ninguém pra apertar, a realidade ganha da proteção e o
     buraco cai sobre os protegidos mesmo. É feio de ver — e é verdade,
     que é o que este aplicativo promete. Pego em teste/fecha.mjs. */
  let absorvem = daSobra.filter(t => !t.protegido);
  if (!absorvem.length) absorvem = daSobra;
  const soma = absorvem.reduce((n, t) => n + (t.valor || 0), 0);
  for (const t of daSobra) r[t.k] = 0;
  for (const t of absorvem){
    r[t.k] = soma > 0 ? sobra * ((t.valor || 0) / soma) : sobra / absorvem.length;
  }
  r.sobra = sobra; r.buraco = -sobra;
  return r;
}

/* soma o alocado de um conjunto de entradas */
/* ── A DIVISÃO DE UMA ENTRADA ──
   Normalmente é o plano que decide. Mas se a pessoa mexeu na divisão na
   hora de lançar, o que vale é o que ela escreveu — e fica gravado no
   próprio documento, em `divisao`. É o mesmo princípio do plano
   congelado: o passado não muda quando o plano muda.
   O `sobra`/`buraco` continuam vindo do cálculo do plano, porque eles
   descrevem o que ACONTECEU (a entrada cobriu os custos ou não), e isso
   não é escolha de ninguém. */
function divisaoDe(e, todas){
  const d = dividir(e.valor, diariasDa(e, todas), planoDe(e));
  if (!e.divisao) return d;
  const r = Object.assign({}, d);
  for (const k in e.divisao) r[k] = Number(e.divisao[k]) || 0;
  return r;
}

function alocadoDe(lista, todas){
  const t = {}; CHAVES.forEach(k => t[k] = 0);
  lista.forEach(e => {
    const d = divisaoDe(e, todas);
    /* `|| 0` NÃO É PARANOIA. CHAVES são os potes de HOJE; cada entrada é
       dividida pelo plano que estava congelado NELA. No dia em que alguém
       acrescenta um pote — dívidas, saúde, viagem — todas as entradas
       antigas passam a ser divididas sem ele, d[k] vem `undefined`, e um
       `+= undefined` transforma o total naquele pote em NaN. Como o saldo
       da Home é a soma de todos os potes, o saldo inteiro virava
       "R$ NaN". Pego em 10/08, montando a confirmação de entrada: o
       roteiro plantou um plano com dívidas e a Home apagou o saldo.
       Um pote que o plano da entrada não tinha recebeu zero dela — e é
       exatamente isso que `|| 0` diz. */
    CHAVES.forEach(k => t[k] += (d[k] || 0));
  });
  return t;
}
function gastoDe(lista){
  const t = {}; CHAVES.forEach(k => t[k] = 0);
  lista.forEach(s => { if (t[s.categoria] !== undefined) t[s.categoria] += s.valor; });
  return t;
}


  /* o que o gestor usa */
  /* ⚠️ const dentro deste bloco não vira propriedade do objeto sozinho —
     por isso a entrega é explícita, como o testa.mjs faz. */
  window.DIVISAO = { divisaoDe, dividir, potesDoPlano, planoDe, diariasDa,
                     diasUteisEntre, PLANO_ORIGINAL, POTES, CHAVES };
})();
