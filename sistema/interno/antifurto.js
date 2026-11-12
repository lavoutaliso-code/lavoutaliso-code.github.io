/* ══════════════════════════════════════════════════════════════════════════
   TRAVA ANTI-FURTO — a cliente veio e a comanda não foi lançada?
   ══════════════════════════════════════════════════════════════════════════
   A DONA (09/09/2026): "hoje eu corro o risco de uma cliente agendada ir ao
   salão, e alguém de má fé, simplesmente não lançar. por isso, enviamos aquela
   mensagem automática quando uma cliente não comparece. então, essa trava
   anti-furto deve checar se todas as clientes agendadas foram, e se quem
   faltou, se apenas não respondeu a mensagem ok, mas se respondeu dizendo
   algo: eu fui sim.. eu tô aqui.. aí o sistema anti furto detecta algo de
   errado."

   A IDEIA, QUE É DELA E É BOA: a mensagem automática de falta já existe e já
   é disparada sozinha. Ela vira um SENSOR. Quem faltou de verdade não responde,
   ou responde remarcando. Quem responde "eu fui sim" está dizendo, sem saber,
   que a comanda dela não foi lançada — e é exatamente isso que um furto
   parece por fora.

   O QUE ISTO FAZ, para um dia:
     1. lê a AGENDA do dia          → quem era esperada
     2. lê as COMANDAS do dia       → quem foi lançada
     3. esperada sem comanda        → FALTOU
     4. pra cada uma que faltou, procura a mensagem automática de falta na
        conversa e o que ela respondeu DEPOIS dela:
          · não respondeu            → normal, é falta mesmo
          · respondeu remarcando/etc  → justificou
          · respondeu que VEIO        → 🚨 DIVERGÊNCIA

   ⚠️ ISTO NÃO ACUSA NINGUÉM E NÃO BLOQUEIA NADA. Ele levanta a bandeira pra
   ela olhar. Uma cliente pode escrever "fui sim" falando de outro dia, e uma
   comanda pode ter sido lançada com o nome escrito diferente. Por isso a tela
   mostra a FRASE que a cliente escreveu, com a hora — quem decide é ela.

   ⚠️ E NÃO CUSTA VARREDURA. Só lê a conversa de quem faltou naquele dia — 3, 5
   clientes. A varredura de conversa inteira do painel já custou 2000
   requisições e travou o navegador; aqui não pode acontecer de novo.
   ══════════════════════════════════════════════════════════════════════════ */

const AF_NO = 'conversas';
/* o texto que a Lailla manda quando a cliente não aparece (src/pesquisa.js) */
const AF_MSG_FALTA = /n[ãa]o compareceu no seu hor[áa]rio/i;

/* ⚠️ FRASES QUE DIZEM "EU VIM". Elas são o gatilho da bandeira, então erram pro
   lado seguro: melhor levantar uma bandeira a mais (ela olha e descarta) do que
   deixar passar uma comanda não lançada. "fui" sozinho não entra — "fui embora",
   "fui sim" e "não fui" são coisas diferentes, e o `naoVeio` abaixo desarma. */
const AF_VEIO = [
  /\b(eu\s+)?fui\s+sim\b/i, /\bfui\s+(hoje|a[ií]|no sal[ãa]o|sim)\b/i,
  /\b(t[oôõ]|estou|estava|est[aá]|to)\s+(a[íi]|aqui|no sal[ãa]o|a[íi] no sal[ãa]o)\b/i,
  /\bcheguei\b/i, /\bacabei de (sair|chegar|fazer)\b/i, /\bcompareci\b/i,
  /\b(estive|estivemos)\s+(a[íi]|l[áa]|no sal[ãa]o)\b/i,
  /\bfiz\s+(sim|o|a)\b.*\b(hoje|agora)\b/i, /\bfui\s+atendida\b/i,
  /\bj[áa]\s+(fui|estive|fiz)\b/i, /\bt[oô] no sal[ãa]o\b/i,
  /\bmas eu fui\b/i, /\bcomo assim\b.*\bfui\b/i,
];
/* e o desarme: a mesma frase com negação não é "eu vim" */
const AF_NAO_VEIO = [/\bn[ãa]o (fui|consegui ir|deu|pude)\b/i, /\bfui\s+embora\b/i,
  /\bn[ãa]o compareci\b/i, /\bn[ãa]o vou\b/i];

const _af11 = t => {
  /* mesma régua do backend (normalizarTelefone): tira o 55, e tira o 9 extra */
  let n = String(t || '').replace(/\D/g, '');
  if (!n) return '';
  if (n.startsWith('55') && n.length >= 12) n = n.slice(2);
  if (n.length === 11 && n[2] === '9') n = n.slice(0, 2) + n.slice(3);
  return n;
};
const _afSem = s => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

let AF = {};        /* dia -> resultado medido */
let AF_MEDINDO = null;

async function afMedir(dia) {
  const [ag, ord] = await Promise.all([
    _j(`agenda/${dia}`).catch(() => null),
    _j(`pdv/ordens/${dia}`).catch(() => null),
  ]);

  /* 1 · quem era esperada
     ⚠️⚠️ NO DIA DE HOJE, SÓ CONTA QUEM JÁ TINHA HORÁRIO. MEDIDO no ar às 00h50:
     a caixa dizia "0 de 15 agendadas foram lançadas · 15 faltaram" — e o dia
     nem tinha começado. Alarme que toca toda manhã por construção é alarme que
     ela aprende a ignorar, e aí o dia em que ele estiver certo passa batido.
     A folga de 1h existe porque comanda não é lançada no minuto da chegada. */
  const hojeAgora = dia === _hoje();
  const agoraMin = (() => { const d = new Date(Date.now() - 3 * 3600e3);
    return d.getUTCHours() * 60 + d.getUTCMinutes(); })();
  const emMin = h => { const m = String(h || '').match(/(\d{1,2})[h:](\d{2})/);
    return m ? (+m[1]) * 60 + (+m[2]) : null; };
  const esperadas = [];
  let aindaVem = 0;
  for (const [hora, v] of Object.entries(ag || {})) {
    for (const c of ((v && v.clientes) || [])) {
      const st = String(c.status || '').toLowerCase();
      /* ⚠️ CANCELADA NÃO É FALTA. Quem desmarcou antes não devia estar no
         salão — cobrar comanda dela seria alarme falso todo dia. */
      if (/cancel|desist|remarc/.test(st)) continue;
      const mm = emMin(hora);
      if (hojeAgora && mm !== null && mm + 60 > agoraMin) { aindaVem++; continue; }
      esperadas.push({ nome: c.nome || '—', tel: _af11(c.tel), hora,
        servico: c.servico || '', status: st });
    }
  }

  /* 2 · quem foi lançada */
  const comandas = Object.values(ord || {}).filter(Boolean).map(c => ({
    nome: c.nome || '', tel: _af11(c.tel || c.telefone), valor: Number(c.valor) || 0 }));

  /* 3 · esperada sem comanda = faltou.
     ⚠️ CASA POR TELEFONE PRIMEIRO. Nome bate mal: "Ana carolina" e "ANA
     CAROLINA SILVA" são a mesma pessoa e "Ana" e "Ana Paula" não são. O
     telefone é o único identificador que as duas pontas carregam. */
  const veio = e => comandas.some(c =>
    (e.tel && c.tel && c.tel === e.tel) ||
    (!e.tel && _afSem(c.nome) && _afSem(c.nome) === _afSem(e.nome)));
  const faltou = esperadas.filter(e => !veio(e));

  /* 4 · o que cada uma que faltou respondeu */
  const d0 = new Date(`${dia}T00:00:00-03:00`).getTime();
  const d1 = d0 + 24 * 3600e3;
  const casos = [];
  for (const e of faltou) {
    const caso = { ...e, avisada: false, respondeu: false, disseQueVeio: false,
      frase: '', quando: 0 };
    if (e.tel) {
      /* a chave da conversa é 55 + o telefone já sem o 9 extra */
      const h = await _j(`${AF_NO}/55${e.tel}/historico`).catch(() => null);
      const msgs = Array.isArray(h) ? h : Object.values(h || {}).filter(Boolean);
      /* a mensagem de falta DAQUELE dia */
      const aviso = msgs.filter(m => m && m.de === 'ia' && AF_MSG_FALTA.test(String(m.texto || ''))
        && m.ts >= d0 && m.ts < d1).pop();
      if (aviso) {
        caso.avisada = true; caso.avisadaEm = aviso.ts;
        /* ⚠️ SÓ O QUE VEIO DEPOIS DO AVISO. Antes dele a cliente estava
           falando de outra coisa — inclusive marcando o próprio horário. */
        const depois = msgs.filter(m => m && m.de === 'cliente' && m.ts > aviso.ts);
        if (depois.length) {
          caso.respondeu = true;
          const achou = depois.find(m => {
            const t = String(m.texto || '');
            return AF_VEIO.some(r => r.test(t)) && !AF_NAO_VEIO.some(r => r.test(t));
          });
          const usar = achou || depois[0];
          caso.disseQueVeio = !!achou;
          caso.frase = String(usar.texto || '').slice(0, 220);
          caso.quando = usar.ts;
        }
      }
    }
    casos.push(caso);
  }

  const res = {
    dia, esperadas: esperadas.length, comandas: comandas.length, aindaVem,
    faltou: casos,
    divergencias: casos.filter(c => c.disseQueVeio),
    semResposta: casos.filter(c => c.avisada && !c.respondeu),
    justificaram: casos.filter(c => c.respondeu && !c.disseQueVeio),
    semAviso: casos.filter(c => !c.avisada),
    em: Date.now()
  };
  AF[dia] = res;
  return res;
}

/* o bloco que entra no rodapé do fechamento */
function afBloco(dia) {
  const r = AF[dia];
  if (!r) {
    if (AF_MEDINDO !== dia) { AF_MEDINDO = dia;
      afMedir(dia).then(() => { AF_MEDINDO = null; if ((CX_DIA || _hoje()) === dia) cxPeMontar(); })
        .catch(() => { AF_MEDINDO = null; }); }
    return `<div class="afBox medindo"><span class="afAro"></span>
      Conferindo se todas as clientes agendadas foram lançadas…</div>`;
  }
  const n = r.divergencias.length;
  /* ⚠️ A ORDEM AQUI IMPORTA, e eu errei uma vez. O `if(!r.esperadas) return ''`
     estava ANTES do caso "o dia ainda está acontecendo" — e como de manhã
     ninguém passou da hora, `esperadas` é 0 e o aviso simplesmente não
     aparecia. Medido no ar: `af: null`. Nada na tela é pior que um aviso
     errado: ela não tem como saber se a trava rodou. */
  if (!r.esperadas && !r.aindaVem) return '';
  if (n) {
    return `<button class="afBox alerta" onclick="afAbrir('${dia}')">
      <span class="afSino">!</span>
      <span><b>${n} cliente${n > 1 ? 's' : ''} diz${n > 1 ? 'em' : ''} que veio e não tem comanda</b>
      <em>toque para ver quem</em></span></button>`;
  }
  const f = r.faltou.length;
  /* o dia ainda está acontecendo e ninguém passou da hora: não há o que conferir */
  if (!r.esperadas && r.aindaVem) {
    return `<button class="afBox ok" onclick="afAbrir('${dia}')">
      <span class="afCk">✓</span>
      <span><b>O dia ainda está acontecendo</b>
      <em>${r.aindaVem} cliente${r.aindaVem > 1 ? 's' : ''} com horário ainda por vir · toque para ver</em></span></button>`;
  }
  return `<button class="afBox ok" onclick="afAbrir('${dia}')">
    <span class="afCk">✓</span>
    <span><b>${r.comandas} de ${r.esperadas} agendadas foram lançadas</b>
    <em>${f ? `${f} ${f > 1 ? 'faltaram' : 'faltou'} · nenhuma disse que veio` : 'ninguém faltou'}${
      r.aindaVem ? ` · ${r.aindaVem} ainda ${r.aindaVem > 1 ? 'vêm' : 'vem'}` : ''} · toque para ver</em></span></button>`;
}

function afHora(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts) - 3 * 3600e3);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function afAbrir(dia) {
  const r = AF[dia]; if (!r) return;
  const linha = c => `<div class="afL${c.disseQueVeio ? ' bad' : ''}">
    <div class="afLt"><b>${String(c.nome).replace(/</g, '&lt;')}</b>
      <em>${c.hora ? c.hora.replace('h', ':') : ''}${c.servico ? ' · ' + String(c.servico).replace(/</g, '&lt;') : ''}</em></div>
    <div class="afLs">${c.disseQueVeio
      ? `<span class="afTag bad">disse que veio</span>`
      : c.respondeu ? `<span class="afTag">respondeu</span>`
        : c.avisada ? `<span class="afTag calm">não respondeu</span>`
          : `<span class="afTag calm">não foi avisada</span>`}
      ${c.avisada ? `<em>aviso ${afHora(c.avisadaEm)}</em>` : ''}</div>
    ${c.frase ? `<div class="afFrase">“${String(c.frase).replace(/</g, '&lt;')}”
      <em>${afHora(c.quando)}</em></div>` : ''}</div>`;

  const rot = `${dia.slice(8)}/${dia.slice(5, 7)}`;
  document.getElementById('gaveta').innerHTML = `
    <div class="cdCab afCab"><i></i><b>Conferência do dia ${rot}</b>
      <button class="gx" onclick="fecharSaida()">✕</button></div>

    <div class="afTopo">
      <div class="afNum"><b>${r.esperadas}</b><span>agendadas</span></div>
      <div class="afNum"><b>${r.comandas}</b><span>comandas lançadas</span></div>
      <div class="afNum${r.divergencias.length ? ' bad' : ''}"><b>${r.divergencias.length}</b>
        <span>${r.divergencias.length === 1 ? 'diz que veio' : 'dizem que vieram'}</span></div>
    </div>
    ${r.aindaVem ? `<div class="afAindaVem">${r.aindaVem}
      cliente${r.aindaVem > 1 ? 's' : ''} deste dia ainda ${r.aindaVem > 1 ? 'têm' : 'tem'} horário por vir —
      ${r.aindaVem > 1 ? 'elas ficam' : 'ela fica'} de fora da conferência até passar a hora.</div>` : ''}

    ${r.divergencias.length ? `<div class="afAlerta">
      <b>Estas clientes responderam ao aviso de falta dizendo que estiveram no salão</b>
      — e não existe comanda delas neste dia. Pode ser comanda não lançada, ou a
      cliente falando de outro dia. A frase está aqui embaixo, com a hora.
    </div>` : ''}

    ${r.faltou.length
      ? `<div class="afSec">Quem estava agendada e não tem comanda</div>
         <div class="afLista">${r.faltou.map(linha).join('')}</div>`
      : r.esperadas
        ? `<div class="afVazio">Todas as ${r.esperadas} clientes agendadas têm comanda
             lançada neste dia. Nada a conferir.</div>`
        : `<div class="afVazio">Nenhum horário deste dia já passou${r.aindaVem
             ? ` — ${r.aindaVem} ainda ${r.aindaVem > 1 ? 'estão' : 'está'} por vir` : ''}.
             A conferência aparece conforme o dia acontece.</div>`}

    <div class="afPe">A conferência compara a <b>agenda</b> com as <b>comandas</b> do dia e
      usa o aviso automático de falta como sensor: quem não veio costuma não
      responder, ou responder remarcando. Quem responde que veio está dizendo que
      a comanda dela não foi lançada. <b>Isto não acusa ninguém</b> — mostra a frase
      e a hora pra você decidir.</div>`;
  document.getElementById('veu').classList.add('on');
}
