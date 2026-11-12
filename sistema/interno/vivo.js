/* ══════════════════════════════════════════════════════════════════════════
   VIVO — o painel lendo do banco, em vez de constante escrita à mão.

   POR QUE ISTO EXISTE. Na auditoria de 03/09 o painel errou em seis lugares,
   e nenhum erro era de conta: era o dia ter andado. Faturamento de hoje,
   comandas de hoje, agendamentos de hoje, o total do mês e a meta estavam
   todos congelados no instante em que eu escrevi o número. Entre o começo e
   o fim da própria auditoria entrou mais uma comanda (Iza, R$ 349,90) e todos
   eles ficaram errados de novo. Numa página de produção chamada "Caixa" isso
   erra todo dia de manhã.

   ⚠️ O QUE AINDA NÃO É VIVO, E POR QUÊ:
   · ASAAS — a API exige token, e token no navegador é token vazado. Hoje o
     saldo e o extrato vêm de `financeiro/asaas` no Firebase, escrito por
     medicoes/asaas-para-o-banco.mjs com `railway run`. O painel só lê. Fica
     100% vivo quando o backend (que já tem o token) gravar esse nó sozinho.
   · CUSTO FIXO DIÁRIO (R$ 464) — não existe em lugar nenhum do banco. É uma
     constante sem lastro, herdada. Está marcada na tela.
   · CONTAS A PAGAR — os nós contas/despesas/pagar/fornecedores voltam null.
     O card nasce vazio de propósito.
   ══════════════════════════════════════════════════════════════════════════ */
/* ⭐⭐ O BANCO PASSOU A SER DA MESMA CASA (07/09/2026)
   Ela: "o caixa do internolavoutalisoficial só fica carregando e nao abre".

   MEDIDO, e o desenho do teste é o que importa: os MESMOS BYTES abrem no
   Safari por `localhost` (2s) e pelo endereço de pré-visualização da Netlify,
   e TRAVAM pelo endereço de sempre. Chrome abre nos três. Furar o cache com
   `?furabolo=` não mudou nada. Ou seja: não é o código, não é a rede, não é o
   cache — é o Safari tratando `firebaseio.com` como domínio de TERCEIRO quando
   a página é `internolavoutalisoficial.netlify.app`, e segurando as leituras.
   Faz sentido que sobre nesse site: o mesmo firebaseio é chamado de dentro de
   meia dúzia de `.netlify.app` diferentes dela (pdv15, agenda, anamnese,
   painel…), que é exatamente o retrato de um rastreador pro Safari.

   O conserto tira o problema da categoria em vez de contorná-lo: o `_redirects`
   da Netlify passa `/db/*` pro Firebase, então pro navegador o banco é do
   MESMO endereço da página. Terceiro nenhum, nada pra prevenir. De quebra some
   a viagem de CORS antes de cada leitura.

   ⚠️ PRA VOLTAR ATRÁS é uma linha: troque por
      const DBURL = 'https://paineldolavou-default-rtdb.firebaseio.com';
      e apague o `_redirects`. O resto do código não sabe a diferença.
   ⚠️ O `_redirects` PRECISA ir junto no deploy. Sem ele, `/db` é 404 e o caixa
      não abre em navegador nenhum. */
const DBURL = '/db';
const INICIO = '2026-09-02';          /* ordem dela: a janela começa aqui */
/* ⚠️ O CUSTO DIÁRIO NÃO É MAIS CONSTANTE. Ele sai das contas a pagar do mês,
   divididas pelos dias em que o salão funciona (terça a sábado) — ordem dela,
   03/09. Enquanto não houver conta lançada, vale o herdado de R$ 464/dia, que
   é o que as contas fixas dela dão hoje. O card diz de onde veio o número.
   Quem calcula é o ctDiario(), em contas.js. */
const CUSTO_HERDADO = 464;
const CUSTO_PROD = 80;                /* R$ 80 por procedimento */
const BONUS_PROC = 28;                /* o que o PDV desconta por procedimento */

/* mão de obra por serviço — a mesma tabela do gestor */
const SERV = [
  {n:'Progressiva Lavou Tá Liso', t:'trio', moA:22, moD:45, moE:45},
  {n:'Manutenção Lavou Tá Liso',  t:'trio', moA:22, moD:45, moE:45},
  {n:'Kit Cronograma Grande',     t:'kit',  moSolo:50},
  {n:'Retoque',                   t:'retoque', moA:0, moD:0, moE:0},
  {n:'Hidratação Express',  t:'ex', p:65}, {n:'Cronograma Express', t:'ex', p:70},
  {n:'Tintura Express',     t:'ex', p:40}, {n:'Sobrancelha Express',t:'ex', p:35},
  {n:'Corte Simples Express',t:'ex',p:30}, {n:'Corte Premium Express',t:'ex',p:50},
  {n:'Coloração',           t:'ex', p:40},
];
const BASE_PROC = ['Progressiva Lavou Tá Liso','Manutenção Lavou Tá Liso'];

/* ══ O ASAAS VEM DO BANCO, NÃO DO CÓDIGO ══════════════════════════════════
   O saldo e o extrato do Asaas só existem na API dele, que exige token —
   e token no navegador é token vazado. A saída antiga era uma medição escrita
   à mão aqui dentro, e ela envelheceu exatamente como tinha que envelhecer:
   em 04/09 a tela mostrava saldo R$154,04 e R$560 de entradas (a leitura de
   03/09 19:52) enquanto o Asaas tinha R$0,00 — havia saído uma transferência
   de R$231,06 — e já tinha recebido o sinal da Suellen naquele dia.

   Agora o número mora em `financeiro/asaas` no Firebase, escrito pelo script
   medicoes/asaas-para-o-banco.mjs (`railway run`, que tem o token). O painel
   só lê. Uma requisição.

   ⚠️ E A TELA DIZ QUANDO A LEITURA É VELHA. Enquanto isso for rodado na mão,
      o dado envelhece — então o card mostra a idade da leitura em vez de
      exibir número parado com cara de novo. Passou de 12h, avisa em âmbar.
   ⚠️ O SALDO É O REAL DO PROVEDOR, não `entrou − saiu`. A conta tinha
      R$441,46 antes da janela; pela fórmula ela apareceria negativa. */
/* ══ SALDO DE ABERTURA ════════════════════════════════════════════════════
   O painel assumia que toda conta começou do ZERO em 02/09 — e isso nunca foi
   verdade. O Asaas já tinha R$441,46 antes (por isso eu usava o saldo do
   provedor pra ele), e em 05/09 a Sicredi mostrou o mesmo: ela disse "esses
   388 foi de dinheiro que tinha na sicredi antes", e a conta fechou no
   centavo — a mão de obra do 02/09 saiu de dinheiro anterior à janela.

   Agora cada conta pode ter um saldo de abertura, gravado em
   `financeiro/aberturas`. Quem não tem, continua valendo zero.

   ⚠️ ABERTURA NÃO É ENTRADA. Ela não entra em "entrou na janela" nem nos
      potes: é dinheiro que já estava lá, não faturamento novo. Só soma no
      saldo da conta. Misturar as duas coisas inflaria o faturamento. */
const ABERTURA_NO = 'financeiro/aberturas';
/* ⚠️ DESTINAÇÃO NÃO É ALOCAÇÃO. Ordem dela, 05/09: "esse saldo todo pertence
   ao custo operacional". Isso diz de onde o dinheiro VAI SAIR — é a conta
   reservada pra pagar o funcionamento — e não mexe no pote.
   Se eu somasse o saldo em espécie no pote Operacional, o mesmo dinheiro
   seria contado duas vezes: uma como provisão (custo diário × dias) e outra
   como saldo em conta. O pote continua sendo o que o período consumiu; a
   destinação diz qual conta paga. */
const DESTINO_NO = 'financeiro/destinacoes';
const ASAAS_NO = 'financeiro/asaas';
const ASAAS_VAZIO = {lidoEm:0, saldo:0, ent:0, sai:0, entradas:[], saidas:[]};

/* ── utilidades ── */
const _j = async p => (await fetch(`${DBURL}/${p}.json`)).json();
const _sem = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function _serv(nome){
  const b = String(nome).split('#')[0];
  let e = SERV.find(s=>s.n===b); if(e) return e;
  const q = _sem(b); e = SERV.find(s=>_sem(s.n)===q); if(e) return e;
  return SERV.find(s=>q.startsWith(_sem(s.n).split('(')[0].trim())) || null;
}
/* ⚠️ AQUI MORAVA UM ERRO DE R$ 19,90. O `pgto` pode vir com o valor colado
   ("Dinheiro R$250,00") e existir um `pgto2` ("Pix R$19,90"). A medição
   antiga jogava o saldoPago INTEIRO na primeira forma — a comanda da Talitha
   ia 269,90 pro Dinheiro quando só 250,00 foram em espécie. O Sicredi ficava
   R$ 19,90 a menos e o Dinheiro R$ 19,90 a mais, todo dia que tem pagamento
   dividido. */
function _formas(c){
  const ler = s => {
    const t = String(s||'').trim(); if(!t) return null;
    const m = t.match(/^(.*?)\s*R\$\s*([\d.]+,\d{2}|\d+)$/);
    return m ? {f:m[1].trim(), v:parseFloat(m[2].replace(/\./g,'').replace(',','.'))}
             : {f:t, v:null};
  };
  const sp = Number(c.saldoPago)||0;
  const a = ler(c.pgto), b = ler(c.pgto2);
  if(!a) return [];
  if(!b) return [{f:a.f, v:Number.isFinite(a.v)?a.v:sp}];
  const va = Number.isFinite(a.v) ? a.v : null;
  const vb = Number.isFinite(b.v) ? b.v : null;
  if(va!=null && vb!=null) return [{f:a.f,v:va},{f:b.f,v:vb}];
  if(va!=null) return [{f:a.f,v:va},{f:b.f,v:sp-va}];
  if(vb!=null) return [{f:a.f,v:sp-vb},{f:b.f,v:vb}];
  return [{f:a.f,v:sp/2},{f:b.f,v:sp/2}];
}
/* ⚠️ dinheiro fecha em centavo. Somar float solto devolvia 3824.0000000000005
   e 7637.999999999997 — some no brl(), mas volta a aparecer em qualquer
   comparação, e conferência que erra por 5e-13 é conferência que dá alarme
   falso. Toda saída de conta passa por aqui. */
const c2 = v => Math.round((Number(v)||0)*100)/100;
const _hhmm = ms => {
  if(!ms) return null;
  const d = new Date(Number(ms) - 3*3600e3);   /* Brasília = UTC−3 */
  return d.toISOString().slice(11,16);
};
const _hoje = () => new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
/* carimbo de ms → dia em Brasília. Morava dentro do bloco do Nubank e sumiu
   quando eu reescrevi a regra; agora é utilidade do arquivo. */
const dataBR = t => new Date(Number(t)-3*3600e3).toISOString().slice(0,10);
/* ══ A SICREDI NÃO RECEBE CARTÃO NA HORA (a dona, 16/09/2026) ══════════════
   "a sicredi paga as vendas de débito e crédito com 1 dia útil, cai sempre no
    dia seguinte útil, às 10h da manhã. tem que ter esse delay pra não mostrar
    um saldo disponível na sicredi que ainda não caiu. no extrato deve constar
    que entrou, mas processando — e só às 10h do dia seguinte constar no saldo."

   ⚠️ PIX NÃO ESPERA. Só `Stone Déb.` e `Stone Créd.` passam pela liquidação;
   o Pix cai na hora e continua entrando no saldo no mesmo dia.

   ⚠️ DIA ÚTIL AQUI É SEGUNDA A SEXTA — e FERIADO NÃO É TRATADO. Não existe
   calendário de feriado bancário em lugar nenhum deste painel, e inventar um
   por conta própria erraria em silêncio num dia que ela não tem como prever.
   Na véspera de feriado o dinheiro vai aparecer como disponível um dia antes
   de cair de verdade; é a única imprecisão, e está escrita aqui de propósito.

   ⚠️ A HORA É DE BRASÍLIA, sempre. `_hoje()` e `dataBR()` já descontam as 3h;
   a comparação abaixo usa o mesmo relógio, senão entre 21h e 00h o painel
   liberaria o dinheiro do dia seguinte. */
const CARTAO = ['Stone Déb.', 'Stone Créd.'];
const LIQ_HORA = 10;                     /* cai às 10h da manhã */
/* o próximo dia útil DEPOIS de `iso` (sábado e domingo não contam) */
function proxDiaUtil(iso){
  const d = new Date(iso + 'T12:00:00Z');
  do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0,10);
}
/* quando aquela venda de cartão vira saldo: dia útil seguinte, às 10h */
function liquidaEm(iso){ return { dia: proxDiaUtil(iso), hora: LIQ_HORA }; }
/* já caiu? compara com o agora de Brasília */
function jaLiquidou(iso){
  const L = liquidaEm(iso);
  const agora = new Date(Date.now() - 3*3600e3);        /* Brasília */
  const hojeBR = agora.toISOString().slice(0,10);
  if(hojeBR > L.dia) return true;
  if(hojeBR < L.dia) return false;
  return agora.getUTCHours() >= L.hora;
}
const _ddmm = iso => `${iso.slice(8)}/${iso.slice(5,7)}`;
/* "há 20 minutos", "há 3 horas", "ontem" — pra dizer a idade de uma leitura */
function idadeDe(ms){
  const s = (Date.now()-Number(ms))/1000;
  if(s < 90) return 'agora';
  if(s < 5400) return `há ${Math.round(s/60)} min`;
  if(s < 172800) return `há ${Math.round(s/3600)}h`;
  return `há ${Math.round(s/86400)} dias`;
}
const ASAAS_VELHO_H = 12;

/* ══ O NUBANK — UM REGISTRO NO BANCO, NÃO UMA VARREDURA ═══════════════════
   ⚠️ ISTO AQUI ERA O QUE DEIXAVA TUDO LENTO, e era código meu. A hora em que
      o sinal caiu mora em `conversas/<tel>/estado.sinalPagoEm`, que não tem
      índice declarado — então eu varria as 2015 conversas, uma requisição
      cada. Medido: 2024 requisições, 8,7 SEGUNDOS numa conexão boa. E repetia
      a cada 90 segundos, no recarregamento automático. Numa conexão de casa
      isso satura a linha e faz TODAS as abas do gestor demorarem, não só o
      caixa.

   O conserto: o que a varredura descobre fica GRAVADO em
   `financeiro/sinais_whatsapp/AAAA-MM`. Daí em diante:
     · abrir o painel  = 1 requisição (lê o registro)
     · reconciliar     = ~40 requisições (só quem tem sinal marcado na agenda)
     · varredura cheia = só se fizer mais de 30 min da última, e nunca no
                         recarregamento automático

   ⚠️ A VARREDURA CHEIA NÃO PODE MORRER DE VEZ. Existe quem pague e não tenha
      agendamento na agenda — a Karla e a Rosilena são os casos medidos. Só a
      varredura acha essas. Por isso ela continua, rara, e o registro guarda
      o resultado pra ninguém mais esperar por ela.

   ⚠️ O REGISTRO NÃO É A VERDADE, É A MEMÓRIA DA MEDIÇÃO. Ele só recebe o que
      foi lido da conversa; nada é inventado nele. Se for apagado, a próxima
      varredura cheia remonta tudo. */
const NU_NO = 'financeiro/sinais_whatsapp';
let _NU_PENDENTE = false;
/* ⚠️⚠️ SIN_PAGOS PRECISA SER GLOBAL, e o motivo é um defeito medido em 18/09/2026.
   Ele era `let` dentro do `carregar()`: contava os sinais lendo o REGISTRO, uma
   vez, no carregamento. O extrato do Nubank é remontado DEPOIS, pelo
   `carregarNubank()`, que lê as conversas frescas e às vezes acha sinal que o
   registro ainda não tem — foi o que aconteceu quando a régua nova trouxe 4
   sinais de volta. Resultado: o extrato do Investimento somava 94 sinais e a
   alocação do anel, 91. R$ 60,00 de diferença, e a gaveta acusando "isso é
   defeito meu" — com razão.
   Agora o `nuAplicar()` reconta e realoca (`_realocarSinais`), e as duas pontas
   olham o MESMO número. */
let SIN_PAGOS = 0;
const nuMes = () => _hoje().slice(0,7);

async function nuLerRegistro(){
  try{
    const o = await _j(`${NU_NO}/${nuMes()}`) || {};
    const varr = Number(o._varredura || 0);
    delete o._varredura;
    return {itens:Object.values(o).filter(x=>x && x.em), varredura:varr};
  }catch(e){ return {itens:[], varredura:0}; }
}
/* ⚠️ O REGISTRO TEM QUE SE CORRIGIR, NÃO SÓ CRESCER. A Alice Corrêa pagou às
   11:50 e o nome dela só foi confirmado na conversa às 11:55 — o registro
   guardou "?" e nunca mais olhou pra trás, então ela aparecia como "?" no
   extrato do Nubank para sempre. Agora toda reconciliação regrava a linha
   com o que a conversa sabe HOJE. */
async function nuGravar(novos){
  if(!novos.length) return;
  const corpo = {};
  for(const x of novos) corpo[x.tel] = {tel:x.tel, n:x.n, v:x.v, em:x.em, para:x.para||''};
  try{ await fetch(`${DBURL}/${NU_NO}/${nuMes()}.json`, {method:'PATCH', body:JSON.stringify(corpo)}); }
  catch(e){}
}
async function nuMarcarVarredura(){
  try{ await fetch(`${DBURL}/${NU_NO}/${nuMes()}/_varredura.json`,
    {method:'PUT', body:JSON.stringify(Date.now())}); }catch(e){}
}
/* lê a hora do sinal de uma lista de telefones — o caminho barato */
/* ⭐⭐ A DATA DO ATENDIMENTO VEM DO AGENDAMENTO, NÃO DE `dataAgendada`
   (medido em 17/09/2026, com a Nathália Santana da Silva).

   Ela: *"Tassiane, Nathália e Yasmin pagaram sinal e não constam no extrato nem
   no valor da Nubank."* A Nathália era dinheiro de verdade fora do saldo:

     conversa · sinalPagoEm ....... 17/09 10:51
     conversa · dataAgendada ...... 2026-07-18   ← de JULHO, nunca atualizada
     conversa · agendamentos[1] ... 2026-09-19 12:15, criado 17/09 10:51
     agenda ....................... 19/09 12h15, ela está lá

   Eu lia `dataAgendada`, que guarda o agendamento de julho. Como a régua exige
   atendimento a partir de 02/09, o sinal dela caía na tarja e ficava FORA do
   Nubank. Cliente que já veio uma vez tem `dataAgendada` velha para sempre —
   então isso ia acontecer de novo com toda cliente recorrente.

   ⭐ A REGRA: entre os agendamentos da conversa, vale o que foi MARCADO MAIS
   PERTO DO INSTANTE EM QUE O SINAL FOI PAGO. O sinal paga o agendamento que
   nasceu junto com ele — na Nathália os dois carimbos batem no mesmo minuto.

   ⚠️ E ISSO TAMBÉM CONSERTA O NOME. O telefone 553175786743 tem DUAS clientes
   (Yasmin de Freitas Reis, marcada 15/09 17:06, e Renata Freitas da Silva,
   marcada 17/09 01:03) e UM sinal, pago 15/09 13:58. `nomeAgendamento` guarda
   só a ÚLTIMA, então o sinal da Yasmin aparecia no extrato como Renata — dinheiro
   certo, nome errado, e ela procurando a Yasmin que não estava lá. Agora o nome
   sai do MESMO agendamento que deu a data. */
/* ⭐⭐ A AGENDA É A TERCEIRA FONTE, E ERA A QUE FALTAVA (ela, 01/10/2026:
   *"dia 28, consta 160 às 17h03 da kelly na minha conta bancária, mas não
   consta no extrato do site"*).

   Medido: tel …3649799, R$ 160 pagos em 28/09 17:07, `sinalPago:true` — e
   `agendamentos: []` na conversa. Mas a AGENDA tinha DUAS cadeiras dela em
   03/10 (Kelly Tatiane 07h00 e Marilene 07h45, R$80 cada, que é o que dá os
   R$160). Sem `para`, o sinal caía na tarja e saía do saldo: dinheiro no banco,
   invisível no painel.

   ⚠️ A CONVERSA E A AGENDA PODEM DISCORDAR, e a agenda é quem tem a cadeira.
   `reservar.js` grava a cadeira na agenda; a lista `estado.agendamentos` da
   conversa é cópia, e cópia se perde. Olhar só a conversa é confiar na cópia.
   ⚠️ CRUZA PELOS 8 ÚLTIMOS DÍGITOS. O sinal guarda o telefone com DDI
   (`553173649799`) e a agenda às vezes sem, às vezes formatado
   (`(31) 99702-0455`) — comparar como texto não acha ninguém.
   ⚠️ É RECURSO DE ÚLTIMA HORA, não segunda opinião: só entra quando a conversa
   não tem agendamento nenhum. Se ela tem, manda ela — é a régua de 18/09, que
   conserta o caso de duas clientes no mesmo telefone. */
let _AGENDA_IDX = null;
function _indexarAgenda(agenda){
  _AGENDA_IDX = {};
  for(const [dia, horas] of Object.entries(agenda || {})){
    if(!horas || typeof horas !== 'object') continue;
    for(const [hora, bloco] of Object.entries(horas)){
      let cl = (bloco || {}).clientes || [];
      if(!Array.isArray(cl)) cl = Object.values(cl || {});
      for(const c of cl){
        if(!c || typeof c !== 'object') continue;
        const t = String(c.tel || '').replace(/\D/g,'');
        if(t.length < 8) continue;
        (_AGENDA_IDX[t.slice(-8)] = _AGENDA_IDX[t.slice(-8)] || [])
          .push({data:dia, hora, nome:c.nome || '', em:`${dia}T${String(hora).replace('h',':')}:00Z`});
      }
    }
  }
}
function _agendaDoTelefone(tel){
  const t = String(tel || '').replace(/\D/g,'');
  if(!_AGENDA_IDX || t.length < 8) return [];
  return (_AGENDA_IDX[t.slice(-8)] || []).filter(a => a.data >= INICIO);
}
function _agendamentoDoSinal(e, tel){
  let lista = Array.isArray(e.agendamentos)
    ? e.agendamentos.filter(x => x && x.data) : [];
  const nomeSolto = e.nomeAgendamento || e.nome || '?';
  /* a conversa não tem cadeira nenhuma: pergunta pra agenda antes de desistir */
  if(!lista.length && tel){
    const daAgenda = _agendaDoTelefone(tel);
    if(daAgenda.length) lista = daAgenda;
  }
  if(!lista.length) return {para:e.dataAgendada || '', n:nomeSolto};
  const t = Number(e.sinalPagoEm) || 0;
  /* ⚠️ `Date.parse` de `em` ausente dá NaN e embaralharia a ordem — vira 0, que
     é o pior candidato possível e fica no fim da fila. */
  const dist = x => Math.abs((Date.parse(x.em) || 0) - t);
  const perto = lista.slice().sort((a,b) => dist(a) - dist(b))[0];
  return {para:perto.data || e.dataAgendada || '', n:perto.nome || nomeSolto};
}
/* ⚠️ A AGENDA É CARREGADA UMA VEZ E SÓ DA JANELA PRA FRENTE. Sem o recorte por
   chave, isto puxaria a agenda inteira (meses de histórico) a cada leitura do
   Nubank. Se a leitura falhar, o índice fica vazio e a regra antiga vale — a
   agenda é rede de baixo, nunca pode derrubar o resto. */
async function _carregarIndiceAgenda(){
  if(_AGENDA_IDX) return;
  try{
    const q = `orderBy=${encodeURIComponent('"$key"')}`
            + `&startAt=${encodeURIComponent('"'+INICIO+'"')}`
            + `&endAt=${encodeURIComponent('"2026-12-31"')}`;
    _indexarAgenda(await (await fetch(`${DBURL}/agenda.json?${q}`)).json() || {});
  }catch(e){ _AGENDA_IDX = {}; }
}
async function nuLerConversas(tels){
  const out = [];
  await _carregarIndiceAgenda();
  await Promise.all([...new Set(tels)].filter(Boolean).map(async t => {
    try{
      const e = await _j(`conversas/${t}/estado`);
      if(!e || !e.sinalPagoEm) return;
      const ag = _agendamentoDoSinal(e, t);
      out.push({tel:t, n:ag.n,
                v:Number(e.sinalValorPago || e.sinalValor || 80),
                em:Number(e.sinalPagoEm), para:ag.para});
    }catch(err){}
  }));
  return out;
}
/* a varredura cheia — cara, rara, e é ela que acha quem pagou sem agendar */
async function nuVarrerTudo(){
  const tels = Object.keys(await (await fetch(`${DBURL}/conversas.json?shallow=true`)).json()||{});
  const comSinal = [];
  const LOTE = 60;
  for(let i=0; i<tels.length; i+=LOTE){
    await Promise.all(tels.slice(i,i+LOTE).map(async t => {
      try{ const q = await _j(`conversas/${t}/estado/sinalPagoEm`); if(q) comSinal.push(t); }
      catch(e){}
    }));
  }
  return nuLerConversas(comSinal);
}
/* ⚠️ SINAL SEM AGENDAMENTO NÃO É DINHEIRO QUE ENTROU.
   Medido em 04/09: o registro tinha 7 sinais no dia e só 6 caíram. O sétimo
   (20:49, tel …3005875) foi marcado como pago porque a cliente mandou uma
   imagem — mas ela não tem nome de agendamento, não tem agendamento nenhum
   na lista, o único registro dela na agenda é de 27/06, e a mensagem
   seguinte dela foi "DEVOLUÇÃO". Nada disso é dinheiro na conta.
   A régua: o sinal só conta quando existe um atendimento marcado de
   ${INICIO} em diante. Sinal cujo atendimento é antigo, ou que não tem
   atendimento nenhum, sai do saldo e aparece na tarja com o motivo — some
   calado seria pior, porque é ela quem sabe se aquilo caiu ou não. */
function nuMontar(itens){
  const HOJE_D = _hoje();
  let v=0; const ent=[], fora=[];
  const porTel = {};
  for(const x of itens){ const a=porTel[x.tel]; if(!a || x.em>a.em) porTel[x.tel]=x; }
  for(const x of Object.values(porTel)){
    const quando = dataBR(x.em);
    if(quando < INICIO || quando > HOJE_D) continue;
    /* '?' é o que o registro grava quando a conversa ainda não tinha nome —
       tratar como nome de verdade colocava um "?" no extrato dela */
    const nome = (!x.n || x.n === '?') ? '(sem nome)' : x.n;
    const linha = {d:`${quando.slice(8)}/${quando.slice(5,7)}`, n:nome,
                   v:Number(x.v||80),
                   f:x.para ? `p/ ${x.para.slice(8)}/${x.para.slice(5,7)}` : 'sem atendimento marcado',
                   h:new Date(Number(x.em)-3*3600e3).toISOString().slice(11,16)};
    const temAgenda = x.para && x.para >= INICIO;
    if(!temAgenda){
      fora.push({...linha, d:'—',
                 via: x.para ? `atendimento de ${x.para.slice(8)}/${x.para.slice(5,7)}, antes da janela`
                             : 'sem atendimento marcado',
                 obs:''});
      continue;
    }
    v = Math.round((v + linha.v)*100)/100;
    ent.push(linha);
  }
  ent.sort((a,b)=>(b.d+(b.h||'')).localeCompare(a.d+(a.h||'')));
  return {v, ent, fora};
}
/* ⚠️ A TARJA ESTAVA VIRANDO LISTA TELEFÔNICA. Ela junta duas coisas: sinal
   marcado na agenda sem hora de pagamento, e sinal cujo atendimento está fora
   da janela. Sem filtro, quem JÁ está no extrato aparecia de novo embaixo —
   29 nomes repetidos escondendo o único que importava. Só entra quem não
   está no saldo. */
function nuTarja(m, itens){
  /* ⚠️ "SEM DATA DE PAGAMENTO" SÓ VALE PRA QUEM EU REALMENTE NÃO SEI. Nove
     nomes apareciam assim e eu sabia a data de todos — ela era só ANTERIOR à
     janela (a Crislayane pagou 31/08, a Pamela 08/08). Dizer "sem data" pra
     quem tem data é pior que não dizer nada: manda ela conferir o que já está
     conferido. Agora quem está no registro, em qualquer data, sai da tarja. */
  const conhecidos = new Set([
    ...m.ent.map(x=>_sem(x.n)),
    ...(itens||[]).map(x=>_sem(x.n)),
  ]);
  const vistos = new Set();
  return (_NU_PEND||[]).concat(m.fora).filter(x=>{
    const k=_sem(x.n);
    if(x.via && /antes da janela|sem atendimento/.test(x.via)){
      if(vistos.has(k)) return false; vistos.add(k); return true;   /* estes sempre entram */
    }
    if(conhecidos.has(k) || vistos.has(k)) return false;
    vistos.add(k); return true;
  });
}
/* ⭐ RECONTA O SINAL E REPARTE DE NOVO — chamado sempre que o extrato do Nubank
   muda. A repartição do sinal de R$80 é fixa (17 marketing + 20 investimento +
   43 estoque), então recontar é só multiplicar; nada é inventado.
   🔒 A SOMA CONTINUA FECHANDO: cada sinal a mais soma R$80 na alocação e R$80 no
   `adiantado`, que é o outro lado da conta (`Σaloc = faturamento + adiantado`). */
function _realocarSinais(){
  if(!M.aloc) return;
  M.sinaisPagos    = SIN_PAGOS;
  M.aloc.estoque   = c2(SIN_PAGOS*SIN_EST);
  M.aloc.marketing = c2(SIN_PAGOS*SIN_MKT);
  /* ⚠️ A BONIFICAÇÃO PERDIDA VAI JUNTO, e esquecê-la custou R$ 175,68: o
     Investimento tem QUATRO fontes (o sinal, os R$19,04 por procedimento, a
     bonificação que a equipe perdeu e o que já saiu), e recontar só as duas
     primeiras fazia a lista da gaveta discordar do anel — a própria gaveta
     acusou, escrito "isso é defeito meu". */
  M.aloc.invest    = c2(SIN_PAGOS*SIN_INV + (M.eleg||0)*INVEST_UN + (M.bonifPerdida||0));
  M.adiantado      = c2(Math.max(0, SIN_PAGOS - (M.eleg||0)) * 80);
}
/* ⚠️ `semPintar` EXISTE POR CAUSA DO PISCA-PISCA DE 90 EM 90 SEGUNDOS (ela,
   01/10/2026: *"os valores ficam piscando e alterando"*).

   Medido no ar, 3 ciclos em 200s: a recarga automática fazia
   `carregar() → pinta() → carregarNubank()`. O `carregar()` remonta o `ONDE`, e
   o Nubank volta pra `medindo:true`; o `pinta()` do meio punha ISSO na tela —
   o saldo do Nubank virava "medindo…" e o total sumia junto (16 valores na
   tela caíam pra 14) — e só então o Nubank repintava com o número de volta.
   Aqui no laboratório a ida e volta durou 240ms; no celular dela, com a leitura
   de rede no meio, é o tempo todo da leitura, de olho nu.

   🔒 A REGRA: **dinheiro na tela não se pinta pela metade.** Calcula tudo,
   pinta uma vez. Quem repinta agora é só quem chamou, quando tem tudo. */
function nuAplicar(v, ent, pend, semPintar){
  const o = ONDE.find(x=>x.k==='nubank');
  if(o){ o.ent=v; o.saldo=v; o.saldoBase=v; o.medindo=false;
         o.fonte=`${ent.length} sinais pagos no WhatsApp · assume saldo zero em ${INICIO.slice(8)}/${INICIO.slice(5,7)}`; }
  if(EXTRATO.nubank){ EXTRATO.nubank.ent=ent; if(pend) EXTRATO.nubank.pendentes=pend; }
  /* ⚠️ O EXTRATO MANDA NA CONTAGEM. Quem paga pelo site entra pelo Asaas, quem
     paga no WhatsApp entra por aqui — a soma dos dois extratos É o número de
     sinais, e é ela que reparte. */
  /* ⚠️ `AS` É LOCAL AO `carregar()` e aqui não existe — usar `AS.entradas`
     estouraria ReferenceError e o Nubank nunca mais pintaria. O extrato global
     tem a MESMA lista. */
  SIN_PAGOS = (((EXTRATO.asaas||{}).ent)||[]).length + ent.length;
  _realocarSinais();
  aplicarSaidas();
  if(!semPintar && typeof repintarTudo==='function') repintarTudo();
}

/* chamado DEPOIS da primeira pintura. Barato por padrão. */
let _NU_PINTOU = false;
async function carregarNubank(opc){
  const forcar = !!(opc && opc.forcar);
  /* quem passa `semPintar` assume o compromisso de pintar depois, uma vez só */
  const quieto = !!(opc && opc.semPintar);
  _NU_PINTOU = false;
  /* ⚠️ SE A RECONCILIAÇÃO CAIR, A TELA NÃO PODE FICAR EM "medindo…" PRA SEMPRE.
     O passo 1 já pôs no estado o que estava gravado; aqui garantimos que isso
     chega à tela mesmo quando o passo 2 ou 3 explode. */
  try{ return await _carregarNubank(forcar, quieto); }
  finally{
    if(!quieto && !_NU_PINTOU && typeof repintarTudo === 'function') repintarTudo();
  }
}
async function _carregarNubank(forcar, quieto){
  const reg = await nuLerRegistro();
  let itens = reg.itens;
  /* 1 · o que já está gravado entra no ESTADO na hora — mas não na tela.
     ⚠️⚠️ ANTES ISTO PINTAVA, E ERA A SEGUNDA METADE DO PISCA-PISCA (ela,
     01/10/2026). Medido na carga: o Nubank aparecia "medindo…", virava
     **R$ 163,52** (só o registro gravado) e, 4 segundos depois, **R$ 323,52**
     (depois de reconciliar). Dois valores diferentes pra mesma conta, na mesma
     tela, com 4s de intervalo — é exatamente o que faz ela não confiar no
     número.
     🔒 A REGRA: **um valor nunca é substituído por outro valor.** Ou ele ainda
     não está lá ("medindo…"), ou é o final. O estado é atualizado aqui para o
     caso de a reconciliação falhar — aí o `finally` pinta o que já se sabe. */
  if(itens.length){ const m = nuMontar(itens); nuAplicar(m.v, m.ent, nuTarja(m, itens), true); }
  /* 2 · reconcilia com quem tem sinal marcado na agenda (poucas dezenas) */
  const novos = await nuLerConversas(_NU_TELS);
  /* ⚠️ regrava também o que MUDOU (nome ou data que antes vieram vazios) */
  const antes = new Map(itens.map(x=>[x.tel, x]));
  const mudou = novos.filter(x=>{
    const a = antes.get(x.tel);
    return !a || a.em !== x.em || a.n !== x.n || (a.para||'') !== (x.para||'');
  });
  if(mudou.length){
    await nuGravar(mudou);
    for(const x of mudou) antes.set(x.tel, x);
    itens = [...antes.values()];
  }
  /* 3 · varredura cheia só se está velha — é ela que acha quem pagou e não
         agendou, mas custa 2000 requisições */
  const velha = (Date.now() - reg.varredura) > 30*60e3;
  if(forcar || velha){
    _NU_PENDENTE = true;
    const todos = await nuVarrerTudo();
    const conh2 = new Set(itens.map(x=>x.tel+'|'+x.em));
    const novos2 = todos.filter(x=>!conh2.has(x.tel+'|'+x.em));
    if(novos2.length){ await nuGravar(novos2); itens = itens.concat(novos2); }
    await nuMarcarVarredura();
    _NU_PENDENTE = false;
  }
  const m = nuMontar(itens);
  nuAplicar(m.v, m.ent, nuTarja(m, itens), quieto);
  _NU_PINTOU = true;
  return {v:m.v, ent:m.ent.length, fora:m.fora.length, varreu:(forcar||velha)};
}

/* ── mede um conjunto de dias do pdv/ordens ── */
/* ⚠️ O CUSTO FIXO NÃO CORRE AOS DOMINGOS E SEGUNDAS (a dona, 16/09/2026):
   "não precisa abater custo de funcionamento às segundas e domingos. somente
    de terça a sábado."

   A metade de cima disso JÁ ESTAVA CERTA: `ctDiasUteis()` divide as contas do
   mês por terça-a-sábado (22 dias em setembro). O que estava errado era a
   metade de baixo — `R.dias` contava QUALQUER dia com atendimento, então uma
   segunda cobrava mais um dia inteiro de custo que o divisor nunca previu.
   Medido em 14/09 (segunda): R$ 512,41 de custo num dia que não devia ter. */
const _diaDeCusto = iso => {
  const w = new Date(iso + 'T12:00:00Z').getUTCDay();   /* 0=dom … 6=sáb */
  return w >= 2 && w <= 6;
};
function _medir(mapa){
  const R = {fat:0, mo:0, eleg:0, n:0, sinal:0, balcao:0, dias:0, diasCusto:0, npMo:0,
             formas:{}, prof:{}, profNP:{}, npItens:[], porDia:{}, itens:[],
             /* ⚠️ os dias de custo SEPARADOS POR MÊS. Uma janela pode cruzar
                meses, e cada mês tem a sua diária — ver `ctDiarioDe`. Somar
                tudo com um número só fechava junho, julho e agosto com o
                custo de setembro: 59 dias errados por R$ 48,41 cada. */
             diasCustoMes:{}};
  for(const [dia,o] of Object.entries(mapa)){
    if(!o) continue; let teve = 0;
    /* ⭐⭐ DIA COM CLIENTE NÃO PAGANTE TAMBÉM É DIA (a dona, 16/09/2026)
       "dani fez um procedimento não pagante na data de 14/09 e não consta caixa
        pra fechar desse dia. deve constar todos os dias que teve cliente,
        pagante ou não pagante. se teve atendimento, deve ter caixa pra fechar."

       O PDV já contava assim desde 27/08 — é o caixa do gestor que estava
       fora. Medido em 16/09: 14/09 tem duas modelos da Dani (R$ 236 de mão de
       obra) e ZERO comanda, então o dia não existia nem na lista nem na conta.
       ⚠️ CONTA PELO `refDia` (o dia do atendimento), não pelo dia do
       lançamento — mesma regra do fechamento do PDV.
       ⚠️ E NÃO GANHA OS 8% por cima: a base da campanha Cliente Feliz sai das
       comandas, então dar bônus aqui reservaria dinheiro que ela nunca paga.
       Por isso o bônus usa `R.moComandas`, fechado lá embaixo. */
    const NP = (_NP_DIA || {})[dia];
    if(NP && NP.total){
      teve = 1;
      R.npMo += NP.total;
      for(const [quem,q] of Object.entries(NP.porProf||{})){
        R.prof[quem] = (R.prof[quem]||0) + q;
        R.profNP[quem] = (R.profNP[quem]||0) + q;
      }
      for(const x of (NP.itens||[])) R.npItens.push(x);
    }
    for(const k in o){
      const c = o[k]; if(!c?.servicos) continue;
      teve = 1; R.n++;
      const v = Number(c.valor)||0;
      R.fat += v; R.sinal += Number(c.sinal)||0; R.balcao += Number(c.saldoPago)||0;
      R.porDia[dia] = R.porDia[dia] || {fat:0,n:0};
      R.porDia[dia].fat += v; R.porDia[dia].n++;
      const el = (c.servicos||[]).filter(s=>BASE_PROC.includes(String(s.nome).split('#')[0])).length;
      R.eleg += el;
      const dá = (quem,q) => { if(!quem||!q) return; R.prof[quem]=(R.prof[quem]||0)+q; R.mo+=q; };
      /* ⚠️ DUAS PROFISSIONAIS NO MESMO SERVIÇO DIVIDEM A COMISSÃO. O PDV grava
         `solo2` quando outra pessoa fez junto, e eu lia só o `solo` — a
         comissão inteira ia pra primeira. Medido em 05/09: três Hidratações
         Express feitas por Erika e Dani, e o painel dava os R$26 só pra quem
         estava em `solo`.
         O total da mão de obra NÃO muda: o serviço custa o mesmo, só é
         repartido entre quem fez. Ordem dela: "ao invés de dividir já que
         dois fizeram". */
      const rateia = (nomes, total) => {
        const q = nomes.filter(Boolean);
        if(!q.length || !total) return;
        /* a última leva a sobra do arredondamento, pra a soma bater no centavo */
        const parte = Math.floor(total/q.length*100)/100;
        q.forEach((n,idx)=> dá(n, idx===q.length-1
          ? Math.round((total - parte*(q.length-1))*100)/100
          : parte));
      };
      for(const [sv,i] of Object.entries(c.profs||{})){
        const g = _serv(sv); if(!g) continue;
        if(g.t==='trio'||g.t==='retoque'){
          /* ⚠️ na aplicação o PDV grava UM nome só — conferido em 580
             registros, nenhum com dois. Se um dia gravar, o rateia() já
             cobre: é só passar o segundo campo aqui. */
          rateia([i.aplicou, i.aplicou2], g.moA||0);
          if(i.prD && i.prD===i.prE) dá(i.prD, (g.moD||0)+(g.moE||0));
          else { dá(i.prD, g.moD||0); dá(i.prE, g.moE||0); }
        } else if(g.t==='kit') rateia([i.solo, i.solo2], g.moSolo||0);
        else if(g.t==='ex')    rateia([i.solo, i.solo2], Math.round(g.p*0.4));
      }
      for(const p of _formas(c)) R.formas[p.f] = (R.formas[p.f]||0) + (Number(p.v)||0);
      R.itens.push({dia, hora:c.saidaHora||c.hora||null, n:c.nome||'?', v,
                    sinal:Number(c.sinal)||0, balcao:Number(c.saldoPago)||0,
                    formas:_formas(c)});
    }
    R.dias += teve;
    if(teve && _diaDeCusto(dia)){
      R.diasCusto++;
      const m = String(dia).slice(0,7);
      R.diasCustoMes[m] = (R.diasCustoMes[m]||0) + 1;
    }
  }
  R.fat = c2(R.fat); R.sinal = c2(R.sinal); R.balcao = c2(R.balcao);
  /* ⚠️ DOIS NÚMEROS DE MÃO DE OBRA, E ELES NÃO SÃO INTERCAMBIÁVEIS:
       `moComandas` — só o que veio de comanda paga. É a BASE DOS 8%.
       `mo`         — o que se PAGA no dia: comandas + cliente não pagante.
     Trocar um pelo outro dá bônus a trabalho que a campanha nunca vai premiar,
     ou paga a profissional a menos. Quem paga (fechamento do caixa) lê `mo`. */
  R.moComandas = c2(R.mo);
  R.npMo = c2(R.npMo);
  R.mo   = c2(R.moComandas + R.npMo);
  for(const k in R.formas) R.formas[k] = c2(R.formas[k]);
  for(const k in R.prof)   R.prof[k]   = c2(R.prof[k]);
  for(const k in R.profNP) R.profNP[k] = c2(R.profNP[k]);
  R.produto = c2(R.eleg*CUSTO_PROD);
  /* ⭐⭐ A RESERVA DO BÔNUS É 8% DO QUE A PROFISSIONAL FEZ (ela, 07/09/2026)
     "a gente reserva 8% do que a profissional faz, e nao 8% do procedimento."

     ERA `R.eleg * 28`, e dentro desses 28 o bônus valia R$ 8,96 — que é 8% de
     R$ 112, a mão de obra de UM TRIO (22 + 45 + 45). Conferido: 8% da mão de
     obra dos trios da janela dá exatamente `eleg × 8,96`. Bate porque é a mesma
     conta — só que ela ignora tudo que não é trio.
     Medido na janela de 02/09: mão de obra R$ 3.710,00, sendo R$ 574,00 de
     express, corte e hidratação. A reserva antiga cobria R$ 250,88; os 8% de
     verdade são R$ 296,80. **Faltavam R$ 45,92, e é exatamente 8% do que não
     é trio** — trabalho que existe, é pago, e não tinha reserva nenhuma.

     🔒 A CONTA CONTINUA FECHANDO: o custo da equipe passa a ser
     `mão de obra + 8% dela + R$ 19,04 por procedimento` (a parte do R$28 que é
     investimento). O lucro sai de `fat − equipe − produto − operacional`, então
     o que a reserva ganha o lucro perde — nada aparece do nada. O pote
     Investimento não muda.
     ⚠️ ISSO MEXE NO LUCRO DOS MESES PASSADOS no gráfico "mês a mês", e está
     certo: eles estavam otimistas em 8% do trabalho que não era trio. */
  R.equipe  = c2(R.mo + R.moComandas*0.08 + R.eleg*INVEST_UN);
  R.imposto = c2(R.fat*0.06);
  return R;
}
/* ⚠️ O LUCRO SE APLICA DEPOIS DA MEDIÇÃO, NÃO DENTRO DELA. Assim, quando ela
   mexe numa conta a pagar, o painel refaz o lucro do dia sem reler o banco
   inteiro — a medição bruta fica em cache e só o custo diário muda. */
function _fechar(R, custoDia){
  R.custoDia = custoDia;
  /* ⚠️ `diasCusto`, NÃO `dias`. `dias` é quantos dias o salão atendeu — é o que
     a tela mostra. `diasCusto` é quantos deles carregam custo fixo: só terça a
     sábado, porque é por esse número que as contas do mês são divididas. Trocar
     um pelo outro cobra o mês mais vezes do que ele custa. */
  /* ⚠️ CADA MÊS COM A SUA DIÁRIA. `custoDia` continua chegando (é o do mês
     corrente, e é ele que a tela de contas mostra), mas quem fecha um dia
     de agosto é a diária de agosto. Sem `ctDiarioDe` disponível — por
     exemplo num teste isolado — cai no comportamento antigo, que é o
     mesmo resultado quando a janela não cruza mês. */
  const porMes = R.diasCustoMes && Object.keys(R.diasCustoMes).length;
  R.oper = porMes && typeof ctDiarioDe === 'function'
    ? c2(Object.entries(R.diasCustoMes)
          .reduce((t,[m,n]) => t + n * ctDiarioDe(m), 0))
    : c2(R.diasCusto*custoDia);
  R.lucro = c2(R.fat - R.equipe - R.produto - R.oper);
  return R;
}

/* ══ MÊS A MÊS — a linha da tabela nasce AQUI, não no mes.js ═══════════════
   O mes.js só desenha. Todos os números desta tabela saem da mesma medição
   que fecha o caixa (`_medir` + `_fechar`), então a linha do mês e a gaveta
   que ela abre não podem divergir: são o mesmo objeto.
   ⚠️ `custo` é o que NÃO sobrou — equipe + produto + operacional. É essa a
      conta que a coluna "custou" mostra, e é ela que, somada ao lucro, tem
      que devolver o faturamento. A gaveta confere isso na tela. */
const _MES_AB   = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const _MES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho',
                   'Agosto','Setembro','Outubro','Novembro','Dezembro'];
function _montarMeses(){
  if(typeof MES_TAB === 'undefined') return;      /* mes.js pode não ter carregado */
  const atual = _hoje().slice(0,7);
  MES_TAB.length = 0;
  for(const {k, R} of (_BRUTO && _BRUTO.MR) || []){
    if(!R || (!R.fat && !R.n)) continue;           /* mês sem movimento não vira linha */
    const idx = Number(k.slice(5,7)) - 1;
    MES_TAB.push({
      k, ab:_MES_AB[idx], nome:_MES_NOME[idx], parcial:(k === atual),
      fat:R.fat, n:R.n, eleg:R.eleg, dias:R.dias, diasCusto:R.diasCusto,
      mo:R.mo, bonus:c2(R.moComandas*0.08), invest:c2(R.eleg*INVEST_UN),
      equipe:R.equipe, produto:R.produto, oper:R.oper, lucro:R.lucro,
      custo:c2(R.equipe + R.produto + R.oper),
      marg: R.fat ? R.lucro/R.fat*100 : 0,
      prof:R.prof || {}
    });
  }
}

/* ══ o carregamento ══════════════════════════════════════════════════════ */
let _BRUTO = null;   /* a medição crua, pra reaplicar sem reler o banco */
let ABERTURAS = {};  /* saldo que cada conta já tinha antes da janela */
let DESTINOS = {};   /* conta reservada pra pagar determinado pote */
let _NU_TELS = [];   /* telefones com sinal marcado na agenda (lista curta) */
let _NU_PEND = [];   /* sinais marcados como pagos e sem hora registrada */
/* quanto do bônus foi reservado ALÉM dos 8% da janela — o `aplicarCusto()`
   precisa tirar isso do lucro toda vez que refizer a conta */
let _EXTRA_BONUS = 0;
/* mão de obra de cliente não pagante dentro da janela — o `aplicarCusto()`
   precisa tirar isso do lucro toda vez que refizer a conta */
let _NP_JANELA = 0;
let _ORD = {};       /* as comandas de junho pra cá, por dia */
/* cliente não pagante por DIA DE ATENDIMENTO (`refDia`) — { iso: {total, porProf, itens} } */
let _NP_DIA = {};

/* monta o índice por dia e devolve os dias que SÓ têm não pagante */
function _montarNPporDia(np){
  _NP_DIA = {};
  for(const k of Object.keys(np||{})){
    const r = np[k]; if(!r) continue;
    const dia = String(r.refDia || r.dia || '').slice(0,10);
    const v = Number(r.valor) || 0;
    if(!dia || !v || !r.prof) continue;
    const D = _NP_DIA[dia] = _NP_DIA[dia] || {total:0, porProf:{}, itens:[]};
    D.total = c2(D.total + v);
    D.porProf[r.prof] = c2((D.porProf[r.prof]||0) + v);
    /* ⚠️ A CHAVE VAI JUNTO. Sem ela o fechamento não tem como carimbar o
       lançamento como pago, e o mesmo trabalho poderia ser pago de novo pelo
       caminho do PDV. Ver `cxConfirmar`. */
    D.itens.push({id:r.id || k, prof:r.prof, v, servico:r.servico||'', tipo:r.tipo||'',
                  cliente:r.cliente||'', pago:!!r.pago});
  }
  return Object.keys(_NP_DIA);
}

/* ⭐⭐ O QUE FICOU PARA TRÁS VAI JUNTO NO PRÓXIMO FECHAMENTO (a dona, 16/09/2026)
   "coloque pra pagar a Fran agora junto com a Dani de segunda."

   O caixa de 08/09 fechou com R$ 950 quando a mão de obra do dia era R$ 992: os
   R$ 42 da Fran (hidratação e tintura na proprietária) não existiam pro caixa
   naquela data, e dia fechado não reabre. Em vez de mexer no `refDia` — que é o
   dia em que o atendimento ACONTECEU e não pode virar mentira — o lançamento é
   arrastado pro fechamento seguinte, escrito com o dia de origem do lado.

   As três condições, e todas são necessárias:
     · ainda não foi pago  (`pago !== true`)
     · é de um dia ANTERIOR ao que está sendo fechado
     · e aquele dia JÁ FOI FECHADO — se ainda está aberto, ele vai ser pago no
       fechamento dele, e arrastar aqui pagaria duas vezes

   ⚠️ SÓ DENTRO DA JANELA DO PAINEL. Os três lançamentos de 24/08 (R$ 270)
   ficam de fora de propósito: são de antes de 02/09, nunca entraram em pote
   nenhum, e aparecer de surpresa num fechamento de setembro seria dinheiro
   saindo por um motivo que a tela não explica. */
/* ⭐⭐ CARIMBAR O ORIGINAL, NÃO A CÓPIA (18/09/2026 — a Fran do 08/09).
   `npAtrasado()` devolve `{...x, dia:d}` — uma CÓPIA. O fechamento marcava
   `x.pago = true` nessa cópia e no banco, mas o índice em memória (`_NP_DIA`)
   continuava com `pago:false`. Na MESMA sessão da página, o fechamento seguinte
   lia o índice, via o item ainda "a pagar" e **arrastava de novo**.

   Medido: ela fechou 14/09 às 23:55 e 15/09 às 23:58, três minutos depois. Os
   R$42 da Fran entraram nos DOIS — pagou R$892 quando devia R$850. O carimbo no
   banco só guardou o último ("fechamento de 15/09"), então nem dava pra ver o
   duplo olhando o item.
   ⚠️ Marcar pelo `id`, que é o mesmo no banco e no índice. */
function npMarcarPagoNaMemoria(id){
  if(!id) return;
  for(const D of Object.values(_NP_DIA || {}))
    for(const it of (D.itens || [])) if(it.id === id) it.pago = true;
}
function npAtrasado(dia){
  const fechado = d => {
    const r = (typeof FECHAMENTOS==='object' && FECHAMENTOS) ? FECHAMENTOS[d] : null;
    if(!r) return false;
    return r.feito ? !!r.feito.equipe : true;   /* registro velho = as duas metades */
  };
  const fora = [];
  for(const [d, D] of Object.entries(_NP_DIA||{})){
    if(d >= dia || d < INICIO || !fechado(d)) continue;
    for(const x of (D.itens||[])){
      if(x.pago === true) continue;
      fora.push({...x, dia:d});
    }
  }
  fora.sort((a,b)=>a.dia.localeCompare(b.dia));
  const total = Math.round(fora.reduce((s,x)=>s+Number(x.v||0),0)*100)/100;
  return {itens:fora, total};
}

/* mede um dia qualquer com a mesma régua do painel — usado pelo fechamento */
/* ⚠️ `_ORD[d] || {}` E NÃO `|| null`: com `null` o `_medir` dava `continue` e o
   dia de cliente não pagante sem comanda nenhuma — 14/09 — voltava zerado, que
   é exatamente o defeito que ela pegou. */
function medirDia(d){
  const R = _medir({[d]: _ORD[d] || {}});
  return _fechar(R, typeof ctDiario==='function' ? ctDiario() : 464);
}

/* ⭐⭐ MEDIR UM PERÍODO QUALQUER — a caixa de seleção do topo (ela, 23/10/2026)
   *"adiciona um botão de medir faturamento no topo da tela, de hoje, ontem,
    últimos 7 dias, personalizado (…) só deve modificar o que tem dentro do
    Faturamento hoje / Lucro hoje / margem do dia."*

   🔒 A MESMA RÉGUA DO "HOJE", e é por isso que ela não inventa conta nenhuma:
   `_medir` + `_fechar` são exatamente o par que produz o `HJ` do topo. Somar
   dia a dia com `medirDia` daria outro número — o custo fixo entraria inteiro
   em cada dia e o lucro de 7 dias ficaria R$ 2.784 menor.
   ⚠️ DIA DE CLIENTE NÃO PAGANTE SEM COMANDA TAMBÉM É DIA (a mesma regra de
   16/09 que vale no fechamento): ele entra no mapa com `{}`, senão a mão de
   obra dele some do período.
   ⚠️ NÃO MEXE EM `HJ`. O HJ é lido pelo resto da tela inteira (o fechamento do
   dia, o pote, o relatório); se o período virasse HJ, escolher "últimos 7
   dias" mudaria calado números que ela não pediu pra mudar. */
function medirPeriodo(ini, fim){
  const a = String(ini||''), b = String(fim||'');
  const mapa = {};
  for(const d of Object.keys(_ORD || {})) if(d >= a && d <= b) mapa[d] = _ORD[d] || {};
  for(const d of Object.keys(_NP_DIA || {})) if(d >= a && d <= b && !(d in mapa)) mapa[d] = {};
  const R = _medir(mapa);
  return _fechar(R, typeof ctDiario==='function' ? ctDiario() : 464);
}
/* soma dias a uma data ISO, em Brasília e sem passar por fuso */
function _diaMais(iso, n){
  const [y,m,d] = String(iso).split('-').map(Number);
  const t = new Date(Date.UTC(y, m-1, d));
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0,10);
}
/* os dias que tiveram ATENDIMENTO — comanda paga ou cliente não pagante.
   ⭐ "se teve atendimento, deve ter caixa pra fechar" (a dona, 16/09/2026). */
function diasComCaixa(){
  const dias = new Set();
  for(const d of Object.keys(_ORD)){
    const o = _ORD[d];
    if(o && Object.values(o).some(c => c && c.servicos)) dias.add(d);
  }
  for(const d of Object.keys(_NP_DIA||{})) if((_NP_DIA[d]||{}).total) dias.add(d);
  return [...dias].sort().reverse();
}

/* ⚠️ CHAMADO TODA VEZ QUE UMA CONTA MUDA. É o elo que ela pediu: mexeu na
   conta a pagar → muda o custo diário → muda o operacional, o lucro do
   período, o lucro de hoje e a margem do topo. Antes o R$ 464 era constante
   e nada disso se mexia. */
function aplicarCusto(){
  if(!_BRUTO) return;
  const cd = ctDiario();
  const {J,H,MJ,ML,MA,MS} = _BRUTO;
  [J,H,MJ,ML,MA,MS].forEach(R=>_fechar(R,cd));
  /* ⚠️ `_fechar` REFAZ O LUCRO DO ZERO, e com isso apagava o desconto do bônus
     que a reserva-por-semana cobra do lucro. Sem esta linha, mexer numa conta a
     pagar devolvia R$ 70,24 de lucro que não existe. Ver o bloco A RESERVA
     SEGUE A SEMANA. */
  if(typeof _EXTRA_BONUS === 'number') J.lucro = c2(J.lucro - _EXTRA_BONUS);
  /* ⚠️ O NÃO PAGANTE SAIU DAQUI EM 16/09/2026. Ele agora entra em `R.equipe`
     dentro do `_medir`, e o `_fechar` já o desconta do lucro — descontar de
     novo aqui derrubava o lucro em dobro toda vez que ela mexesse numa conta a
     pagar. `_NP_JANELA` continua existindo porque a tela mostra o número. */
  if(M.aloc){ M.aloc.oper = J.oper; M.aloc.lucro = J.lucro; }
  Object.assign(M, {operacional:J.oper, lucro:J.lucro});
  Object.assign(HJ, {oper:H.oper, lucro:H.lucro, custoDia:cd});
  HJ.marg = HJ.fat ? HJ.lucro/HJ.fat*100 : 0;
  /* ⚠️ A TABELA DO MÊS A MÊS SE REFAZ INTEIRA. Antes só o lucro dos três meses
     era corrigido aqui; agora a linha mostra também custo e margem, e os dois
     mudam quando a conta a pagar muda. Refazer tudo é mais barato que escolher
     o que atualizar — e não deixa número velho na tela. */
  (_BRUTO.MR || []).forEach(x => _fechar(x.R, cd));
  _montarMeses();
  aplicarSaidas();
  recalcDerivados();
}

async function carregar(){
  const HOJE_D = _hoje();
  /* ⚠️ `.catch(()=>null)` em TODAS as leituras opcionais. Sem isso uma leitura
     que falha rejeita o Promise.all inteiro, `carregar()` nunca resolve e a
     tela fica no "Lendo o caixa" pra sempre — sem erro nenhum na cara. */
  const [,, _as, _ab, _nu, _de, _prem, _np] = await Promise.all([ctCarregar(), sdCarregar(),
    _j(ASAAS_NO).catch(()=>null), _j(ABERTURA_NO).catch(()=>null),
    _j(`${NU_NO}/${nuMes()}`).catch(()=>null), _j(DESTINO_NO).catch(()=>null),
    _j('pdv/premiacoes_cliente_feliz').catch(()=>null),
    _j('pdv/nao_pagantes').catch(()=>null)]);
  const PREMIACOES = _prem || {};
  const AS = Object.assign({}, ASAAS_VAZIO, _as||{});
  ABERTURAS = _ab || {};
  DESTINOS = _de || {};

  /* ⚠️ QUANTOS SINAIS DE R$80 JÁ CAÍRAM NA JANELA — precisa estar pronto ANTES
     dos potes, porque é ele que alimenta marketing, estoque e a parte do sinal
     no investimento. A mesma leitura serve pra detectar reagendamento lá
     embaixo; são os dois usos do mesmo registro, numa requisição só. */
  const pagoEmDe = {};
  /* ⚠️ E O VALOR JUNTO. O card de agendamentos precisa somar o que entrou pra
     poder ser conferido contra o extrato — ver o bloco de `vazio()`. */
  const sinalDe = {};
  SIN_PAGOS = (AS.entradas||[]).length;
  for(const [tel,x] of Object.entries(_nu||{})){
    if(tel === '_varredura' || !x || !x.em) continue;
    const dq = dataBR(x.em);
    if(dq >= INICIO && dq <= HOJE_D && x.para && x.para >= INICIO) SIN_PAGOS++;
    const fone = String(tel).replace(/\D/g,'');
    pagoEmDe[fone] = dq;
    sinalDe[fone] = {dia:dq, v:Number(x.v)||80};
  }
  /* ⚠️ UMA REQUISIÇÃO, NÃO SETENTA. Eu buscava dia por dia (`pdv/ordens/<d>`)
     e eram ~70 idas ao banco só pra montar o gráfico de meses. O Firebase
     aceita faixa por chave sem precisar de índice declarado — `orderBy="$key"`
     é interno — e devolve junho a setembro inteiro em 380KB, uma vez só.
     Medido: 0,9s contra 70 requisições. */
  const faixa = async (no, de, ate) => {
    const q = `orderBy=${encodeURIComponent('"$key"')}`
            + `&startAt=${encodeURIComponent('"'+de+'"')}`
            + `&endAt=${encodeURIComponent('"'+ate+'"')}`;
    return (await (await fetch(`${DBURL}/${no}.json?${q}`)).json()) || {};
  };
  const ORD = await faixa('pdv/ordens', '2026-06-01', HOJE_D);
  /* ⚠️ guardo as comandas cruas: o fechamento de caixa precisa poder medir
     QUALQUER dia, não só hoje (ordem dela, 04/09), e reler o banco a cada
     troca de data seria uma ida ao servidor por clique. */
  _ORD = ORD;
  /* ⭐ O DIA DE CLIENTE NÃO PAGANTE PRECISA EXISTIR COMO CHAVE (ela, 16/09).
     `so()` filtra as chaves de `ORD`; um dia que teve só modelo não está lá, e
     sem a chave o `_medir` nunca chega nele. Aqui o dia nasce vazio — nenhuma
     comanda é inventada, só a gaveta do dia passa a existir. */
  _montarNPporDia(_np).forEach(d => { if(d <= HOJE_D && !ORD[d]) ORD[d] = {}; });
  const so = f => Object.fromEntries(Object.entries(ORD).filter(([d])=>f(d)));

  const J = _medir(so(d => d >= INICIO));            /* a janela */
  const H = _medir(so(d => d === HOJE_D));           /* hoje */
  const mes = m => _medir(so(d => d.startsWith(m)));
  const MJ = mes('2026-06'), ML = mes('2026-07'), MA = mes('2026-08'), MS = mes('2026-09');
  /* ⭐ TODOS OS MESES, e não quatro chumbados (28/10/2026). A tabela "mês a
     mês" mostra o que existe — e o que existe cresce sozinho: em 01/11 o
     novembro entra sem ninguém mexer em código. A lista vai de junho/2026
     (o primeiro dia do PDV) até o mês de hoje. */
  const MR = (function(){
    const out = [], fim = HOJE_D.slice(0,7);
    const d = new Date('2026-06-01T12:00:00');
    for(let i = 0; i < 120; i++){
      const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      out.push({k, R: mes(k)});
      if(k === fim) break;
      d.setMonth(d.getMonth()+1);
    }
    return out;
  })();
  _BRUTO = {J,H,MJ,ML,MA,MS,MR};
  const _cd = ctDiario();
  [J,H,MJ,ML,MA,MS].forEach(R=>_fechar(R,_cd));
  MR.forEach(x => _fechar(x.R, _cd));

  /* ⭐⭐ A RESERVA DO BÔNUS SEGUE A SEMANA DA CAMPANHA (07/09/2026)
     Ela: *"pq a equipe ficou negativo? nao faz sentido. tem que bater 100% a
     matematica."* — e não fazia mesmo.

     A CAUSA, medida: a bonificação é paga por SEMANA DA CAMPANHA, que começa na
     TERÇA. A janela do caixa começa em `INICIO` = 02/09, uma quarta. A janela
     corta a semana no meio: a mão de obra de 01/09 (R$ 878,00) está na semana
     que ela paga, mas não estava na janela que reserva. 8% disso = R$ 70,24 —
     exatamente o buraco que deixava o pote negativo.

     O CONSERTO: a reserva do bônus conta desde o começo da SEMANA DA CAMPANHA
     que contém o `INICIO`, não desde o `INICIO`. Assim o que é reservado cobre
     exatamente o que vai ser pago, e depois de pagar a semana o pote fica em
     zero — não em vermelho.

     ⚠️ SÓ A RESERVA DO BÔNUS ANDA. Faturamento, produto, operacional e a mão de
     obra continuam na janela dela (02/09), como ela mandou. Mover a janela
     inteira parecia mais simples e NÃO É: as contas bancárias estão ancoradas
     nela por `financeiro/aberturas` (o que a conta tinha antes de 02/09), e
     medido em 07/09 o dia 01/09 sozinho entrou com R$ 1.904,30 na Sicredi
     contra uma abertura de R$ 1.770,56 — a abertura viraria NEGATIVA. Mover a
     janela exige o saldo real do banco em 31/08, que só ela tem.

     🔒 A CONTA CONTINUA FECHANDO: o que a reserva ganha a mais que 8% da
     janela, o lucro perde (`extraBonus`). Nenhum real é criado. */
  const INICIO_BONUS = (function(){
    const d = new Date(INICIO + 'T12:00:00');
    const dw = d.getDay() === 0 ? 7 : d.getDay();      /* 1=seg … 7=dom */
    d.setDate(d.getDate() - (((dw - 2) + 7) % 7));     /* volta pra terça */
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0')
         + '-' + String(d.getDate()).padStart(2,'0');
  })();
  /* ⭐⭐ CLIENTE NÃO PAGANTE SAI DO LUCRO TAMBÉM AQUI (a dona, 08/09/2026)
     Ela: "a comissao dele é $24, e sai do lucro esse gasto."

     O PDV já fazia isso desde 27/08 — o lançamento de não pagante entra na mão
     de obra do dia e derruba o lucro do fechamento. **O CAIXA NÃO SABIA DISSO.**
     `_medir` lê `pdv/ordens`, e o não pagante não é comanda: não tem cliente
     pagando, não tem faturamento, e por isso nunca esteve lá. Resultado medido
     em 08/09: R$ 312,00 de mão de obra devida a profissionais, e o lucro do
     caixa mostrando como se ela não existisse.

     O trabalho foi feito e é devido: entra no pote Equipe e sai do lucro.
     ⚠️ Conta pelo `refDia` (o dia do ATENDIMENTO), não pelo dia do lançamento —
     mesma regra do fechamento do PDV.
     ⚠️ NÃO ganha os 8% de bônus por cima: a base da campanha Cliente Feliz sai
     das comandas, então dar bônus aqui reservaria um dinheiro que a campanha
     nunca vai pagar. */
  /* ⚠️⚠️ ISTO DEIXOU DE SER SOMA À PARTE EM 16/09/2026. Desde que o `_medir`
     passou a enxergar o não pagante por dia (`_NP_DIA`), ele JÁ ESTÁ dentro de
     `J.mo`, de `J.equipe` e, por tabela, já saiu de `J.lucro` no `_fechar`.
     Somar de novo aqui pagaria a mesma modelo duas vezes no pote e derrubaria o
     lucro em dobro. `npJanela` agora só se LÊ do que foi medido. */
  const npJanela = c2(J.npMo);
  _NP_JANELA = npJanela;
  M.naoPagante = npJanela;

  const SEM = _medir(so(d => d >= INICIO_BONUS));
  /* ⚠️ `moComandas`, NÃO `mo`: o bônus de 8% é da campanha Cliente Feliz, cuja
     base sai das comandas. Com `mo` (que já traz o não pagante), a reserva
     cresceria por um trabalho que a campanha nunca vai premiar. */
  const bonusSemana = c2(SEM.moComandas * 0.08);
  const extraBonus  = c2(bonusSemana - J.moComandas*0.08);
  _EXTRA_BONUS = extraBonus;      /* o `aplicarCusto()` precisa dele depois */
  J.lucro = c2(J.lucro - extraBonus);

  /* ── os potes ─────────────────────────────────────────────────────────
     ⚠️ A SOMA TEM QUE DAR O FATURAMENTO, e dá: o R$28 se parte em 8,96 de
        bônus + 19,04 de investimento, e o R$80 de produto se parte em
        17 marketing + 20 investimento + 43 estoque. Nenhum real é criado
        nem contado duas vezes — só ganha nome. */
  /* ⚠️ A ALOCAÇÃO FICA GUARDADA À PARTE. Os anéis passaram a mostrar SALDO
     (o que foi separado menos o que já saiu), então preciso dos dois números:
     `M.aloc` é o que o faturamento separou, e `M.<pote>` é o que sobrou. Sem
     guardar a alocação, cada saída abateria de um número já abatido. */
  /* ══ A DIVISÃO EM DOIS MOMENTOS (ordem dela, 05/09) ═══════════════════
     ⚠️ ANTES TUDO NASCIA NO ATENDIMENTO, e ela pegou o defeito: entrava sinal
        e o marketing não mexia. O dinheiro do sinal JÁ ESTÁ NA CONTA quando a
        cliente agenda — segurar a verba até ela vir era esconder dinheiro que
        existe.

     MOMENTO 1 · a cliente agenda e paga os R$80  →  divide na hora:
        R$17 marketing · R$20 investimento · R$43 estoque   (fecha os 80)
     MOMENTO 2 · a cliente vem e paga os R$269,90  →  divide o resto:
        R$112 mão de obra · R$8,96 bônus · R$19,04 investimento · lucro

     ⚠️ POR ISSO OS POTES PASSAM DO FATURAMENTO, e está certo: existe sinal de
        quem pagou e ainda não veio. Esse dinheiro está na conta e não é
        faturamento — a diferença é medida em `M.adiantado` e aparece na tela.

     ⚠️ O IMPOSTO FICA CONGELADO (ordem dela): continua sendo calculado e
        mostrado como 6%, mas não é cobrado de ninguém — o que iria pra ele
        segue no lucro. */
  Object.assign(M, {
    /* ver o bloco da RESERVA DO BÔNUS lá em cima: 8% do que a equipe fez, não
       R$ 8,96 por progressiva. E `bonusSemana` em vez de `8% da janela` — ver o
       bloco A RESERVA SEGUE A SEMANA logo abaixo. */
    /* `J.mo` já inclui o cliente não pagante desde 16/09 — não somar de novo */
    fat:J.fat, mo:J.mo, moComandas:J.moComandas, bonus:bonusSemana,
    equipe:c2(J.mo + bonusSemana),
    estoque:c2(SIN_PAGOS*SIN_EST), marketing:c2(SIN_PAGOS*SIN_MKT),
    invest:c2(SIN_PAGOS*SIN_INV + J.eleg*INVEST_UN),
    produto:J.produto, operacional:J.oper, imposto:J.imposto, lucro:J.lucro,
    dias:J.dias, comandas:J.n, eleg:J.eleg,
    sinaisPagos:SIN_PAGOS,
    /* sinal de quem pagou e ainda não foi atendida: dinheiro em conta que
       ainda não virou faturamento */
    adiantado:c2(Math.max(0, SIN_PAGOS - J.eleg) * 80),
  });
  PROC_N = J.eleg;
  /* ⚠️ O QUE COMPÕE O POTE DA EQUIPE, dia a dia. Ela perguntou por que a
     Equipe tinha mais de mil reais depois de fechar só o 03/09 — a resposta é
     que 02/09 e 04/09 continuam sem fechar, e o bônus de TODA a janela está
     guardado ali. Isso tem que estar na tela, não numa pergunta. */
  /* ⚠️ A LISTA VEM DE `diasComCaixa()`, NÃO de `J.porDia`: `porDia` só conhece
     dia com comanda, e dia de cliente não pagante ficava de fora justamente da
     lista que diz quanta mão de obra ainda está aberta. */
  M.equipePorDia = diasComCaixa().filter(d => d >= INICIO).sort().map(d => {
    const R = _medir({[d]: ORD[d] || {}});
    return {d, mo:R.mo, bonus:c2(R.moComandas*0.08), eleg:R.eleg, np:R.npMo};
  });
  /* ⭐⭐ A BONIFICAÇÃO SAI DO POTE DA EQUIPE, E A PERDIDA VIRA INVESTIMENTO
     (ordem dela, 07/09/2026)
     "toda vez que pagar bonificação, abater do saldo da equipe da tela caixa ao
      lado, e a bonificação de quem perdeu, vai pra investimento segunda unidade."

     O QUE JÁ EXISTIA: o pote Equipe carrega `mão de obra + R$ 8,96 por
     procedimento`, e esses R$ 8,96 são o bônus CONDICIONAL — reserva, não
     pagamento. Ele ficava lá para sempre, tivesse sido pago ou perdido.

     O QUE PASSA A ACONTECER, e são dois destinos com naturezas DIFERENTES:

       · PAGA    → é DINHEIRO SAINDO. Vira uma SAÍDA de verdade
                   (`cat:'equipe'`, `conta:'sicredi'`), gravada pelo gestor no
                   momento do pagamento. O `aplicarSaidas()` então abate as
                   DUAS coisas de uma vez: o pote Equipe **e o saldo da
                   Sicredi**. Ordem dela, 07/09: *"nao abateu da sicredi o
                   total que paguei pra elas, deve sempre abater do saldo da
                   sicredi"*.
                   ⚠️ POR ISSO O PAGO **NÃO** É ABATIDO AQUI. Se fosse, o pote
                   levaria o golpe duas vezes — uma pela saída e outra por esta
                   conta. Aqui ele é só somado pra tela poder mostrar.

       · PERDIDA → NÃO é dinheiro saindo: ninguém recebeu. É remanejamento
                   entre potes — **sai da Equipe e entra no Investimento 2ª
                   unidade**. Nenhuma conta bancária é tocada, e tem que ser
                   assim: lançar isso como saída faria sumir da Sicredi um
                   dinheiro que continua lá.

     Em aberto continua reservado na Equipe, que é o que ele é.

     🔒 A CONTA FECHA: a perdida sai da Equipe e entra no Investimento no mesmo
     valor — a soma dos potes não muda com ela. Quem faz a soma cair é a saída
     do pagamento, que é dinheiro que saiu de verdade da conta.

     ⚠️ SÓ CONTA O QUE ESTÁ REGISTRADO em `pdv/premiacoes_cliente_feliz`, e é de
     propósito: a régua de quem perdeu mora na campanha (gestor), e refazer essa
     conta aqui criaria duas verdades que divergem no primeiro ajuste. O caixa
     reflete fato gravado, não opinião própria.
     ⚠️ Semana só entra se ela CAI DENTRO DA JANELA do painel (`INICIO` → hoje).
     Bonificação de julho não pode mexer no pote de setembro.
     ⚠️ O VALOR PAGO é `valorPremiado`; o PERDIDO é `valorPremiadoCalculado` (o
     8% que ela teria recebido). São campos diferentes e não dá pra trocar um
     pelo outro: em registros velhos `valorPremiado` chegou a ser R$ 100 fixo. */
  const BONIF = {paga:0, perdida:0, itens:[]};
  for(const [profCru, semanas] of Object.entries(PREMIACOES||{})){
    let prof = profCru; try{ prof = decodeURIComponent(profCru); }catch(e){}
    for(const [ini, r] of Object.entries(semanas||{})){
      if(!r || !ini) continue;
      const fim = r.fim || ini;
      /* a semana precisa encostar na janela: começa antes do fim dela e
         termina depois do começo */
      if(fim < INICIO || ini > HOJE_D) continue;
      if(r.pagoManualmente){
        const v = Number(r.valorPremiado)||0;
        if(v>0){ BONIF.paga += v; BONIF.itens.push({prof, ini, v, tipo:'paga'}); }
      } else if(r.elegivel === false){
        const v = Number(r.valorPremiadoCalculado)||0;
        if(v>0){ BONIF.perdida += v; BONIF.itens.push({prof, ini, v, tipo:'perdida'}); }
      }
    }
  }
  BONIF.paga = c2(BONIF.paga); BONIF.perdida = c2(BONIF.perdida);
  M.bonifPaga = BONIF.paga;
  M.bonifPerdida = BONIF.perdida;
  M.bonifItens = BONIF.itens;
  /* em aberto = o que ainda está reservado na Equipe e não virou nem uma coisa
     nem outra. Nunca negativo: reserva menor que o pago é informação, não erro
     de conta — está anotado em M.bonifFalta. */
  M.bonifAberto = c2(Math.max(0, M.bonus - BONIF.paga - BONIF.perdida));
  M.bonifFalta  = c2(Math.max(0, BONIF.paga + BONIF.perdida - M.bonus));

  /* só a PERDIDA mexe em pote aqui. A paga chega pelo caminho das saídas, que
     abate o pote e a Sicredi juntos — ver o bloco acima. */
  M.equipe = c2(M.equipe - BONIF.perdida);
  M.invest = c2(M.invest + BONIF.perdida);

  M.aloc = {lucro:M.lucro, equipe:M.equipe, estoque:M.estoque,
            marketing:M.marketing, oper:M.operacional, invest:M.invest,
            imposto:M.imposto};

  /* ── hoje, no topo ── */
  Object.assign(HJ, {fat:H.fat, lucro:H.lucro, comandas:H.n, prof:H.prof, eleg:H.eleg,
                     mo:H.mo, produto:H.produto, oper:H.oper, equipe:H.equipe,
                     imposto:H.imposto, balcao:H.balcao, formas:H.formas});
  HJ.marg = H.fat ? H.lucro/H.fat*100 : 0;

  /* ── mês a mês ── */
  _montarMeses();

  /* ── meta ──
     ⚠️ `feito` é SETEMBRO INTEIRO, não a janela. A janela começa em 02/09
        por ordem dela, mas a meta é do mês — e 01/09 faturou R$ 2.634,30.
        Misturar os dois foi o que fez a tela mostrar três setembros. */
  Object.assign(MT, {base:MA.fat, feito:MS.fat, dias:MS.dias});
  MT.alvo    = MT.base*(1+MT.pc/100);
  MT.faltam  = Math.max(0, MT.diasMes - MT.dias);
  MT.ritmo   = MT.dias ? MT.feito/MT.dias : 0;
  MT.proj    = MT.ritmo*MT.diasMes;
  MT.precisa = MT.faltam ? (MT.alvo-MT.feito)/MT.faltam : 0;
  MT.andar   = MT.alvo ? MT.feito/MT.alvo*100 : 0;
  MT.noCaminho = MT.proj >= MT.alvo;

  /* ── onde o dinheiro está ─────────────────────────────────────────────
     SICREDI = crédito, débito e pix pagos no balcão. DINHEIRO = espécie.
     Os dois saem do MESMO campo (saldoPago), separados pela forma — por
     isso nenhuma comanda pode entrar nos dois. */
  const BANCO = ['Pix','Stone Déb.','Stone Créd.'];
  /* ⚠️ O CARTÃO ENTRA NO EXTRATO E **NÃO** NO SALDO ATÉ LIQUIDAR (ela, 16/09).
     `siV` é o que dá pra gastar hoje; `siProc` é o que a Stone ainda deve. Os
     dois somados continuam sendo tudo que o balcão recebeu na janela — nenhum
     real some, ele só espera a hora de virar saldo. Ver `jaLiquidou()`. */
  let siV=0, siProc=0, diV=0; const siL=[], siProcL=[], diL=[];
  for(const it of J.itens){
    for(const p of it.formas){
      const linha = {d:_ddmm(it.dia), h:it.hora||null, n:it.n, v:p.v, f:p.f};
      if(BANCO.includes(p.f)){
        /* ⭐⭐ O CARTÃO É DATADO NO DIA EM QUE CAIU, NÃO NO DIA DA VENDA — ela,
           01/10/2026: *"débito consta no extrato no dia que a cliente pagou,
           mas na verdade deve constar no próximo dia útil; débito e crédito só
           caem com 1 dia útil."*
           O saldo já respeitava a espera desde 16/09 (o que não caiu fica em
           `processando`, fora do saldo). O que ainda mentia era a LINHA DO
           EXTRATO: quando liquidava, ela voltava pra lista com a data da
           comanda. Medido em 01/10: 85 linhas, R$ 20.163,20, até 3 dias fora do
           lugar (venda de sexta 19/09 caindo na segunda 21/09).
           ⚠️ A HORA TAMBÉM MUDA: cai às 10h, não na hora da venda. Sem isso a
           linha entrava no dia certo mas no lugar errado da ordem do dia.
           ⚠️ A DATA DA VENDA NÃO SE PERDE — vai no rótulo da forma. Sem ela a
           cliente aparece num dia em que não esteve no salão, e a conferência
           contra a comanda fica impossível.
           🔒 Nada muda de valor: `siV` continua somando o mesmo. Isto é só
           ONDE a linha aparece na linha do tempo. */
        if(CARTAO.includes(p.f)){
          const L = liquidaEm(it.dia);
          if(!jaLiquidou(it.dia)){
            siProc=c2(siProc+p.v);
            siProcL.push({...linha, cai:L.dia, quando:`cai ${_ddmm(L.dia)} às ${L.hora}h`});
          } else {
            siV=c2(siV+p.v);
            /* ⚠️ RÓTULO CURTO DE PROPÓSITO. "Stone Déb. · venda 30/09" não cabe
               na coluna do iPhone: medido, 71 das 205 linhas saíam cortadas
               justo na parte nova. Fica `Stone Déb. · 30/09`, e quem explica o
               que é esse segundo número é a linha do cabeçalho da gaveta —
               uma vez, em vez de 85 vezes. */
            siL.push({...linha, d:_ddmm(L.dia), h:`${String(L.hora).padStart(2,'0')}:00`,
                      f:`${p.f} · ${_ddmm(it.dia)}`, vendaEm:it.dia});
          }
        } else { siV=c2(siV+p.v); siL.push(linha); }
      }
      else if(p.f==='Dinheiro'){ diV=c2(diV+p.v); diL.push({...linha, f:'espécie'}); }
    }
  }
  const ord = (a,b) => (b.d+(b.h||'')).localeCompare(a.d+(a.h||''));
  siL.sort(ord); diL.sort(ord);
  /* o que cai primeiro aparece primeiro — ela lê isso como uma fila */
  siProcL.sort((a,b)=> (a.cai+(a.h||'')).localeCompare(b.cai+(b.h||'')));

  /* ══ NUBANK — quem pagou o sinal no WhatsApp ═════════════════════════
     Regra dela: Nubank é todo mundo que pagou pela Lailla, no WhatsApp, e o
     extrato conta pela DATA EM QUE O SINAL CAIU — não pela data em que a
     cliente agendou.

     ⚠️ A AGENDA NÃO SERVE DE FONTE, e foi ela que produziu os dois erros:
       1. DATA ERRADA. Eu contava pelo campo `em` — a hora em que a Lailla
          criou o agendamento. A Crislayane pagou em 31/08 e a Daniele em
          28/08; as duas só entraram na agenda em 03/09, e o painel disse que
          o dinheiro delas caiu naquele dia. Dinheiro velho virando entrada
          do dia.
       2. GENTE FALTANDO. A Karla Magalhães pagou 03/09 às 19:45 e a Rosilena
          pagou 02/09 às 13:11 — nenhuma das duas tem agendamento na agenda.
          Pagaram e não estão marcadas. Pela régua velha sumiam do extrato.

     A fonte agora é a conversa: `conversas/<tel>/estado.sinalPagoEm` é a hora
     em que a Lailla deu o sinal por pago (`sinalPagoPor` diz
     "lailla-viu-o-comprovante"). Varro as 2015 conversas pela folha
     `sinalPagoEm` — medido em 0,4s, uma rajada de 60 por vez — e só nas que
     têm sinal é que busco o resto.

     ⚠️ EU JÁ ERREI AQUI POR DEDUZIR, e a correção fica escrita. Cheguei a
        tirar a Isabelle do Nubank porque existia uma cobrança PENDING no
        Asaas no nome dela, e concluí que não tinha pago. Ela pagou — no
        WhatsApp, por fora da cobrança. Cobrança gerada não diz nada sobre o
        caminho do dinheiro. Pagou no WhatsApp, é Nubank.

     ⚠️ SINAL SEM CARIMBO DE HORA NÃO SOME E NÃO ENTRA. Tem conversa com
        `sinalPago` true e sem `sinalPagoEm` — a Pamela é uma, e a observação
        diz "sinal pago em 08/08". Sem a hora eu não sei o dia; chutar hoje
        inflaria o dia. Fica fora do saldo e aparece na tarja, com nome. */
  /* ⚠️ VARRO PELO CARIMBO `sinalPagoEm`, NÃO PELO BOOLEANO `sinalPago`.
     Descobri medindo: quando a cliente é atendida, o sistema põe
     `sinalPago: false` — o sinal foi consumido — mas DEIXA o `sinalPagoEm`.
     Varrendo pelo booleano, a Yasmin e a Tâmara sumiam do extrato de 02/09
     no instante em que foram atendidas em 03/09. O extrato encolhia sozinho
     conforme o dia passava, e ninguém veria isso acontecer. */
  /* ⚠️ O NUBANK NASCE VAZIO E É PREENCHIDO DEPOIS, pelo carregarNubank(),
     que lê o registro gravado em `financeiro/sinais_whatsapp`. Aqui no
     caminho crítico ele não custa requisição nenhuma. */
  let nuV = 0, nuL = [], nuPend = [];
  _NU_PENDENTE = true;
  ONDE.length = 0;
  ONDE.push(
    /* ⚠️ `medindo:true` ATÉ O REGISTRO CHEGAR. O Nubank nasce em zero e é
       preenchido logo depois pelo carregarNubank(). Nesse intervalo, se
       existir saída lançada, o saldo aparecia NEGATIVO (0 − 728,96) por uma
       fração de segundo — número errado na tela é número errado, mesmo que
       breve. Enquanto `medindo` for true a bolinha diz "medindo…". */
    {k:'nubank', abertura:c2(Number((_ab||{})['nubank'])||0), destino:(_de||{})['nubank']||null, n:'Nubank', c:'#820AD1', ent:nuV, sai:0, saldo:nuV, real:false, medindo:true,
     d:'sinal dos agendamentos que a Lailla fez no WhatsApp',
     saiBase:0,
     fonte:`${nuL.length} sinais pagos no WhatsApp · assume saldo zero em ${INICIO.slice(8)}/${INICIO.slice(5,7)}`,
     pendentes:nuPend},
    /* ⚠️ SÓ ENTRADA ENTRA SOZINHA (ordem dela, 04/09: "é pra você lançar
       automaticamente somente entradas; saídas são lançadas manualmente por
       nós"). Duas coisas mudaram por causa disso:
       1. A TRANSFERÊNCIA DO ASAAS DEIXOU DE SER SAÍDA. Eu importava as
          transferências da API como saída — e não são gasto, é o mesmo
          dinheiro mudando de conta. Era isso que fazia o R$154,04 lançado por
          ela ser descontado DUAS vezes e o Asaas aparecer em −R$154,04.
       2. O SALDO DO ASAAS DEIXOU DE SER O DO PROVEDOR. Agora ele segue a
          mesma régua das outras três — entrou menos o que ela lançou — senão
          uma conta somaria por uma régua e as outras por outra. O saldo real
          do provedor continua visível na gaveta, com a hora da leitura. */
    {k:'asaas', abertura:c2(Number((_ab||{})['asaas'])||0), destino:(_de||{})['asaas']||null, n:'Asaas', c:'#1E6DFF', ent:AS.ent, sai:0, saiBase:0,
     saldo:AS.ent, real:true, lidoEm:AS.lidoEm, saldoProvedor:AS.saldo,
     d:'sinal de quem agendou pelo agendeaquilavoutaliso',
     fonte:AS.lidoEm
       ? `saldo lido do Asaas ${idadeDe(AS.lidoEm)}`
       : 'leitura do Asaas nunca foi feita'},
    /* ⚠️ O QUE A STONE AINDA NÃO PAGOU SAIU DAQUI e virou CONTA PRÓPRIA —
       ver a bolinha `processando` logo abaixo. Antes ele aparecia como uma
       linhinha "+ R$ x processando" pendurada na Sicredi e ficava FORA do
       total; agora tem card, e o dinheiro é contado onde ele está. */
    {k:'sicredi', abertura:c2(Number((_ab||{})['sicredi'])||0), destino:(_de||{})['sicredi']||null, n:'Sicredi', c:'#3FA110', ent:siV, sai:0, saiBase:0, saldo:siV, real:false,
     d:'crédito, débito e pix pagos no balcão',
     fonte:`${siL.length} pagamento${siL.length===1?'':'s'} liquidado${siL.length===1?'':'s'}`
       + ` · assume saldo zero em ${INICIO.slice(8)}/${INICIO.slice(5,7)}`},
    {k:'dinheiro', abertura:c2(Number((_ab||{})['dinheiro'])||0), destino:(_de||{})['dinheiro']||null, n:'Dinheiro', c:'#D9A21B', ent:diV, sai:0, saiBase:0, saldo:diV, real:false, icone:true,
     d:'espécie recebida no balcão, fica na gaveta',
     fonte:`${diL.length} pagamentos · não cai em banco`},
    /* ⭐⭐ O CARD DE PROCESSANDO, AO LADO DO DINHEIRO (a dona, 17/09/2026)
       "o que fica esperando a sicredi pagar, você pode colocar um card de
        processando, ao lado do dinheiro, pra tudo bater 100%."

       É a quinta casa onde o dinheiro do salão está: já foi vendido, a cliente
       já pagou, e a Sicredi deposita no dia útil seguinte às 10h. Não estava em
       lugar nenhum do total, e era ELE que empurrava a verba de investimento
       pra baixo toda tarde — medido em 17/09: anel +1.556,11 antes das
       comandas do dia, −271,93 depois, com R$1.879,40 parados aqui.

       ⚠️ NÃO SE PAGA COM ESTE DINHEIRO. `naoPaga` tira a bolinha dos seletores
       de conta: escolher "Processando" pra lançar uma saída seria abater de um
       saldo que o banco ainda não tem.
       ⚠️ A COR FOI MEDIDA, não escolhida a olho: ΔE2000 mínimo de 26,6 contra
       as outras quatro (o Dinheiro entrou com 19,6). Cinza de propósito — as
       quatro coloridas são dinheiro que dá pra gastar hoje, esta não. */
    {k:'processando', n:'Processando', c:'#6E6E76', abertura:0, destino:null,
     ent:siProc, sai:0, saiBase:0, saldo:siProc, real:false, naoPaga:true,
     d:'crédito e débito que a Sicredi ainda não depositou',
     fonte:`${siProcL.length} venda${siProcL.length===1?'':'s'} · cai no dia útil seguinte às 10h`},
  );
  SALDO_TOTAL = somarContas();

  Object.assign(EXTRATO, {
    nubank:{ent:nuL, sai:[], saiBase:[], pendentes:nuPend},
    /* as transferências ficam num bloco à parte da gaveta: são informação,
       não saída — por isso não entram em `sai` nem abatem o saldo */
    asaas:{ent:AS.entradas||[], sai:[], saiBase:[], lidoEm:AS.lidoEm,
           transferencias:AS.saidas||[], saldoProvedor:AS.saldo},
    sicredi:{ent:siL, sai:[], saiBase:[]},
    dinheiro:{ent:diL, sai:[], saiBase:[]},
    /* a lista do que está a caminho mora na gaveta do próprio card, com o dia
       e a hora em que cada venda vira saldo — o `quando` já vem montado */
    processando:{ent:siProcL.map(x=>({...x, f:`${x.f} · ${x.quando}`})), sai:[], saiBase:[]},
  });

  /* ── seu salão agora ── */
  /* ⚠️ a agenda deixou de ser fonte do Nubank, mas o card "seu salão agora"
     continua precisando dela — e só de um dia, não da agenda inteira.
     ⚠️ ESTA LINHA JÁ ESTEVE QUEBRADA e ninguém viu: uma edição minha passou
        pelo shell com aspas duplas e o `${HOJE_D}` foi COMIDO antes de chegar
        no arquivo — virou `_j()`, sem caminho. A busca voltava vazia e o card
        do salão ficava mudo, sem erro nenhum na tela. Edição de template
        literal daqui em diante só por heredoc. */
  let agDia = HOJE_D;
  let agHoje = await _j(`agenda/${HOJE_D}`) || {};
  const temGente = o => Object.values(o||{}).some(S=>{
    let cs = S?.clientes; if(!cs && S?.nome) cs=[S];
    return (Array.isArray(cs)?cs:Object.values(cs||{})).some(c=>c && c.nome);
  });
  /* ⚠️ ESTE CARD NUNCA FICA VAZIO (ordem dela, 04/09). Virou o dia e o salão
     ainda não abriu, ou é dia fechado: em vez de um card em branco, ele mostra
     as próximas clientes marcadas — o primeiro dia à frente com gente na
     agenda. O cabeçalho diz que dia é; sem isso ela leria as de amanhã como se
     fossem as de hoje, que é pior do que o card vazio. */
  if(!temGente(agHoje)){
    const futuros = Object.keys(await (await fetch(`${DBURL}/agenda.json?shallow=true`)).json()||{})
      .filter(d => d > HOJE_D).sort();
    for(const d of futuros){
      const a = await _j(`agenda/${d}`);
      if(temGente(a)){ agDia = d; agHoje = a; break; }
    }
  }
  SALAO_DIA = agDia;
  const chHoje  = agDia === HOJE_D ? (await _j(`pdv/chegadas/${HOJE_D}`) || {}) : {};
  const ordHoje = agDia === HOJE_D ? (ORD[HOJE_D] || {}) : {};
  const chegouDe = {}; for(const k in chHoje){ const c=chHoje[k];
    if(c?.nome) chegouDe[_sem(c.nome)] = _hhmm(c.t); }
  const comandaDe = {}; for(const k in ordHoje){ const c=ordHoje[k];
    if(c?.nome) comandaDe[_sem(c.nome)] = c; }
  const lista = [];
  for(const s of Object.keys(agHoje).sort()){
    const S = agHoje[s]; let cs = S?.clientes; if(!cs && S?.nome) cs=[S];
    for(const c of (Array.isArray(cs)?cs:Object.values(cs||{}))){
      if(!c?.nome) continue;
      const ch = chegouDe[_sem(c.nome)] || null;
      const cm = comandaDe[_sem(c.nome)] || null;
      const fim = cm?.saidaHora || (cm?.saida ? _hhmm(cm.saida) : null);
      const h = /^\d{2}h\d{2}$/.test(s) ? s.replace('h',':') : s;
      /* ⚠️ "não chegou" é a régua do PDV: 45 min de atraso e nada registrado */
      const atrasada = !ch && !cm && h.includes(':') &&
        (Date.now()-3*3600e3) > Date.parse(`${SALAO_DIA}T${h}:00Z`) + 45*60e3;
      lista.push({h, n:c.nome, tel:c.tel||'',
        e: fim ? 'fim' : (ch||cm) ? 'atend' : atrasada ? 'faltou' : 'vem',
        c: ch || (cm?.hora||null), s: fim});
    }
  }
  /* comandas de encaixe: quem foi atendida e não estava na agenda */
  const naAgenda = new Set(lista.map(x=>_sem(x.n)));
  for(const k in ordHoje){ const c=ordHoje[k];
    if(!c?.nome || naAgenda.has(_sem(c.nome))) continue;
    lista.push({h:'encaixe', n:c.nome, tel:c.tel||'', e:'fim',
                c:chegouDe[_sem(c.nome)]||null, s:c.saidaHora||_hhmm(c.saida)});
  }
  SALAO.length = 0; SALAO.push(...lista);
  AGORA_H = _hhmm(Date.now());
  FEITO_HOJE = H.fat;
  SALAO_HOJE = (agDia === HOJE_D);

  /* ══ AGENDAMENTOS FEITOS HOJE ══════════════════════════════════════════
     Ordem dela, 04/09: "devem constar os AGENDAMENTOS DO DIA, quantas
     fizeram agendamentos hoje. Não marcadas para hoje."

     ⚠️ EU CONTAVA A COISA ERRADA. O card mostrava quem está MARCADA para
        hoje — 11 clientes, quase todas agendadas dias atrás. Ela leu como
        "onze agendaram hoje" e estranhou, com razão, que o Nubank e o Asaas
        não tivessem subido. São perguntas diferentes: uma é a agenda do dia,
        a outra é quanta gente procurou o salão hoje — e é a segunda que
        explica o dinheiro entrando.

     A data agora é o `em` do agendamento (quando foi marcado), e a busca
     varre da janela até o fim do ano, porque quem agenda hoje quase sempre é
     pra um dia à frente.

     ⚠️ AGENDAMENTO SEM `em` NÃO VIRA ZERO NEM VIRA HOJE. Tem entrada sem a
        data de marcação (medi duas só no dia de hoje). Sem ela não dá pra
        saber o dia, então fica fora da conta — e o rodapé diz quantas. */
  /* ⚠️ A BUSCA COMEÇA NO DIA 1º DO MÊS, não na janela do painel. A janela
     dela começa em 02/09 (regra dela pro dinheiro), e eu usava a mesma data
     aqui — então "este mês" não enxergava 01/09 e o card precisava de um
     "desde 02/09" no rodapé, que não cabia numa linha. Contar agendamento é
     outra pergunta que a janela do dinheiro: o mês aqui é o mês inteiro. */
  const MES_INI = HOJE_D.slice(0,7) + '-01';
  const agRange = await (async()=>{
    const q = `orderBy=${encodeURIComponent('"$key"')}`
            + `&startAt=${encodeURIComponent('"'+MES_INI+'"')}`
            + `&endAt=${encodeURIComponent('"2026-12-31"')}`;
    return (await (await fetch(`${DBURL}/agenda.json?${q}`)).json()) || {};
  })();

  /* ⚠️ PRECISA VIR DEPOIS DO agRange. Estava antes e a página morria com
     "Cannot access 'agRange' before initialization" — a lista curta do
     Nubank sai da mesma faixa de agenda que os agendamentos usam. */
  /* os telefones que a agenda diz ter sinal pago — é a lista curta que o
     carregarNubank consulta pra reconciliar, em vez das 2000 conversas */
  _NU_TELS = [];
  for(const slots of Object.values(agRange)){
    for(const s in (slots||{})){
      const S = slots[s]; let cs = S?.clientes; if(!cs && S?.nome) cs=[S];
      for(const c of (Array.isArray(cs)?cs:Object.values(cs||{}))){
        if(c?.tel && c.sinalPago===true) _NU_TELS.push(String(c.tel).replace(/\D/g,''));
      }
    }
  }
  /* a tarja dos sinais sem hora sai da agenda, não de outra varredura */
  _NU_PEND = [];
  {
    const vistos = new Set();
    for(const [d,slots] of Object.entries(agRange)){
      for(const s in (slots||{})){
        const S = slots[s]; let cs = S?.clientes; if(!cs && S?.nome) cs=[S];
        for(const c of (Array.isArray(cs)?cs:Object.values(cs||{}))){
          if(!c?.nome || String(c.origem||'')!=='whatsapp' || c.sinalPago!==true) continue;
          /* ⚠️ SÓ ATENDIMENTO QUE AINDA VAI ACONTECER. Sem este corte a tarja
             listava as 17 clientes já atendidas na janela — virava lista
             telefônica e escondia a única linha que importava. Quem já foi
             atendida teve o sinal abatido na comanda; não há o que conferir. */
          if(d < HOJE_D) continue;
          if(vistos.has(c.nome)) continue; vistos.add(c.nome);
          _NU_PEND.push({d:'—', n:c.nome, v:Number(c.sinalValor)||80,
                         f:`p/ ${d.slice(8)}/${d.slice(5,7)}`,
                         via:'sem data de pagamento', obs:''});
        }
      }
    }
  }
  /* ⚠️ TRÊS PERÍODOS, MEDIDOS DE UMA VEZ (ordem dela, 04/09: botão pra ver
     ontem e o mês). A mesma varredura serve os três — trocar de período no
     card não vai ao banco de novo. */
  const ONTEM_D = new Date(Date.parse(HOJE_D+'T12:00:00Z') - 864e5).toISOString().slice(0,10);
  const MES_D   = HOJE_D.slice(0,7);
  /* ⚠️ AGENDAR NÃO É PAGAR, e a tela tem que dizer os dois. Em 04/09 duas
     pessoas agendaram pelo WhatsApp e só uma pagou o sinal (a Mariane marcou
     09:19 pra hoje e não pagou). O card dizia 2, o extrato do Nubank dizia 1,
     e os dois estavam certos — mas lado a lado pareciam contradição. Agora o
     card conta quantas já pagaram, e a diferença fica visível em vez de virar
     pergunta. */
  /* ⚠️ AGENDAR NÃO É PAGAR, e a tela tem que dizer os dois. Em 04/09 duas
     pessoas agendaram pelo WhatsApp e só uma pagou o sinal (a Mariane marcou
     09:19 pra hoje e não pagou). O card dizia 2, o extrato do Nubank dizia 1,
     e os dois estavam certos — mas lado a lado pareciam contradição. */
  /* ⭐⭐ "PAGARAM O SINAL" TEM QUE VIR DO DINHEIRO (a dona, 16/09/2026)
     Ela: "pelas entradas tá certo, o que consta no extrato da Nubank foi o que
      realmente entrou. só que se vc olhar o extrato, não tem 10 agendamentos e
      no painel mostra que no dia de ontem teve 10 agendamentos."

     O card dizia "10 agendaram · 9 pagaram o sinal" e o extrato do Nubank tinha
     6 entradas. Os dois estavam certos e mediam coisas diferentes: `pagos`
     contava AGENDAMENTO COM A MARCA `sinalPago`, não PAGAMENTO. Medido em
     15/09, os 3 de diferença:
       · a Luana aparece em DOIS agendamentos no mesmo horário (Progressiva +
         Corte) e pagou UM sinal de R$ 160 — contava 2
       · a Nay e a Nathália estão marcadas como pagas na agenda e na conversa e
         NÃO TÊM registro de pagamento nenhum — as duas estão na tarja
         "Pagos, sem data de entrada" do extrato

     Agora `pagosReg` conta TELEFONE DISTINTO COM REGISTRO DE PAGAMENTO e soma
     o valor — é o mesmo conjunto que o extrato mostra, então os dois números
     passam a fechar. `semReg` é quem se diz pago e não tem lastro: some da
     contagem do dinheiro e aparece escrito, porque sumir calado é o que fez
     ela desconfiar do painel.
     ⚠️ `pagos` (a marcação) continua sendo contado — é ele que responde
     "quantas agendaram já pagas", pergunta diferente de "quanto entrou". */
  const vazio = () => ({site:0, wpp:0, sem:0, total:0, pagos:0, remarc:0,
                        pagosReg:0, valor:0, semReg:0, _fones:new Set(), _semF:new Set()});

  /* ⚠️ REAGENDAMENTO NÃO É AGENDAMENTO NOVO (ordem dela, 04/09).
     Quando a Lailla remarca alguém, nasce um registro novo na agenda com data
     de marcação de hoje — e o painel contava como se fosse uma cliente nova
     procurando o salão. Medido: em 04/09 a "Carol" (Ana Carolina Silva
     Onesio, tel …3444332) foi remarcada de 06/09 pra 05/09 às 09:45, e virou
     o terceiro agendamento do dia. O registro antigo some, então não dá pra
     achar por duplicata.

     A RÉGUA É O DINHEIRO: se o sinal dela foi pago ANTES do dia em que a
     marcação foi feita, o dinheiro já tinha entrado — logo não é cliente
     nova, é a mesma sendo remarcada. Conferido nos três de hoje:
       Silvia  marcou 09:11 · sinal pago 04/09 → nova
       Mariane marcou 09:19 · sem sinal        → nova
       Carol   marcou 09:45 · sinal pago 01/09 → REAGENDAMENTO
     `remarcacao-manual` na origem também entra, quando existe.

     ⚠️ E NÃO SOME: o card conta os reagendamentos à parte e escreve quantos
        foram, senão ela veria o total cair sem explicação. */
  /* ⚠️ A DATA DO SINAL VEM DO REGISTRO, NÃO DE UMA CONSULTA POR CLIENTE.
     Eu buscava `conversas/<tel>/estado/sinalPagoEm` de cada agendado — 64
     requisições em toda abertura, só pra saber quem era reagendamento. O
     mesmo dado já está gravado em `financeiro/sinais_whatsapp`, que custa UMA.
     ⚠️ Quem pagou agora e ainda não entrou no registro conta como agendamento
        novo — que é o que ele é. O registro se atualiza logo em seguida. */
  /* nomes que pagaram pelo Asaas — é a prova de que vieram do site */
  const _AS_NOMES = new Set((AS.entradas||[]).map(x=>_sem(x.n)));
  /* ⚠️ E QUANTO cada um pagou, não só que pagou. Sem o valor, "6 pagaram" não
     dá pra conferir contra o extrato — e conferir contra o extrato é o pedido. */
  const _AS_VAL = new Map((AS.entradas||[]).map(x=>[_sem(x.n), Number(x.v)||80]));
  /* (o pagoEmDe e o SIN_PAGOS já foram montados no topo, numa leitura só) */

  const per = {hoje:vazio(), ontem:vazio(), mes:vazio()};
  let semData = 0;
  for(const slots of Object.values(agRange)){
    for(const s in (slots||{})){
      const S = slots[s]; let cs = S?.clientes; if(!cs && S?.nome) cs=[S];
      for(const c of (Array.isArray(cs)?cs:Object.values(cs||{}))){
        if(!c?.nome) continue;
        if(!c.em){ semData++; continue; }
        const d = dataBR(c.em);
        const onde = [];
        if(d === HOJE_D)  onde.push('hoje');
        if(d === ONTEM_D) onde.push('ontem');
        if(d.startsWith(MES_D)) onde.push('mes');
        if(!onde.length) continue;
        const o = String(c.origem||'').toLowerCase();
        const fone = String(c.tel||'').replace(/\D/g,'');
        const pagoEm = pagoEmDe[fone];
        const remarcado = o === 'remarcacao-manual' || (pagoEm && pagoEm < d);
        if(remarcado){ for(const k of onde) per[k].remarc++; continue; }
        /* ⚠️ cinco carimbos, não dois: `instagram#t2` e `anuncio` também são
           o site — em agosto isso escondeu 19 agendamentos.
           ⚠️ E QUANDO NÃO TEM CARIMBO, O DESTINO DO DINHEIRO DIZ O CAMINHO.
              Medido em 04/09: a Suellen agendou 13:23 e pagou R$80 no Asaas,
              mas o campo `origem` dela veio VAZIO — ela não aparecia nem em
              Site nem em WhatsApp, sumia dentro de "sem carimbo" enquanto o
              extrato do Asaas mostrava o sinal dela. Em agosto 256 de 333
              agendamentos estão sem carimbo; sem esta regra o card é um piso,
              não um número.
              A régua: sinal que caiu no ASAAS veio do site; sinal que caiu no
              NUBANK a Lailla pediu no WhatsApp. */
        let campo = (o.startsWith('instagram') || o==='site' || o==='anuncio') ? 'site'
                  : (o==='whatsapp') ? 'wpp' : null;
        if(!campo){
          if(_AS_NOMES.has(_sem(c.nome))) campo = 'site';
          else if(pagoEmDe[fone] !== undefined) campo = 'wpp';
          else campo = 'sem';
        }
        const pago = c.sinalPago === true;
        /* o registro de pagamento: pelo telefone (Nubank) ou pelo nome (Asaas) */
        const reg = sinalDe[fone]
                 || (_AS_VAL.has(_sem(c.nome)) ? {v:_AS_VAL.get(_sem(c.nome))} : null);
        for(const k of onde){
          per[k][campo]++; per[k].total++;
          if(!pago) continue;
          per[k].pagos++;
          /* ⚠️ POR TELEFONE, UMA VEZ SÓ. A Luana tem dois agendamentos no mesmo
             horário e um pagamento de R$ 160: contar os dois inflava tanto a
             quantidade quanto o valor, e o card deixava de bater com o extrato. */
          const chave = fone || _sem(c.nome);
          if(reg){
            if(!per[k]._fones.has(chave)){
              per[k]._fones.add(chave);
              per[k].pagosReg++;
              per[k].valor = Math.round((per[k].valor + Number(reg.v||0))*100)/100;
            }
          } else if(!per[k]._semF.has(chave)){
            per[k]._semF.add(chave);
            per[k].semReg++;
          }
        }
      }
    }
  }
  Object.assign(HOJE, {
    rot:new Date(Date.now()-3*3600e3).toLocaleDateString('pt-BR',
        {weekday:'long', day:'numeric', month:'long', timeZone:'UTC'}),
    comandas:H.n,
    /* ⚠️ A JANELA DE BUSCA COMEÇA EM 02/09, então "este mês" ainda não
       enxerga 01/09. Está dito no rodapé do card em vez de somar errado. */
    agendaPor:{
      hoje: {...per.hoje,  lailla:per.hoje.wpp,  rot:'hoje'},
      ontem:{...per.ontem, lailla:per.ontem.wpp, rot:'ontem'},
      mes:  {...per.mes,   lailla:per.mes.wpp,   rot:'este mês'},
    },
    semData,
  });

  /* ── as formas do período (não são renderizadas hoje, mas a conta fecha) ── */
  FORMAS.length = 0;
  Object.entries(J.formas).sort((a,b)=>b[1]-a[1])
    .forEach(([n,v])=>FORMAS.push({n, v}));

  aplicarSaidas();
  recalcDerivados();
  return {J, H, MJ, ML, MA, MS};
}
