/* ══════════════════════════════════════════════════════════════════════════
   CONCILIAÇÃO — o extrato do BANCO contra o que o painel acha que entrou
   ══════════════════════════════════════════════════════════════════════════
   A dona, 01/10/2026, depois de conferir 8 linhas na mão:
   *"mede a raiz, porque não foram lançadas? … me dê uma solução eficiente,
   provada, que isso não irá acontecer mais. estamos falando do financeiro de
   uma empresa, financeiro não aceita erros."*

   🔒 A RAIZ, EM UMA FRASE: **o "Nubank" do painel nunca foi o banco.** Ele é
   uma reconstrução do que *deveria* ter entrado, montada a partir do que a IA
   concluiu olhando uma imagem no WhatsApp (`sinalPagoPor:'lailla-viu-o-
   comprovante'` — e a imagem não é guardada). Nada no sistema lê o extrato
   bancário. Um modelo que nunca é confrontado com a realidade **não tem como
   saber que está errado**, e erra nos dois sentidos:

     · dinheiro que ENTROU e o painel não conhece  (ela achou 5 em 8)
     · dinheiro que o painel CONTA e não entrou    (ela achou 3 em 8)

   Esta tela fecha esse buraco pelo único caminho que funciona em finanças:
   **confrontar com a fonte externa**. Ela cola o extrato, e a máquina diz
   exatamente o que falta de cada lado.

   ⚠️⚠️ CRUZAR POR NOME É ERRADO, E ESTÁ MEDIDO. O banco mostra o nome de quem
   PAGOU; o painel, o nome de quem vai SER ATENDIDA. Em 29/09 o extrato dela
   dizia "Katia da Anunciação" e a agenda, "Katia Cristina Pimenta Santos".
   Mãe paga pela filha, marido pela esposa, e o nome nunca bate. O par é feito
   por **valor + dia**, com a hora só desempatando.

   ⚠️ ESTA TELA NÃO INVENTA LANÇAMENTO. Ela aponta. Quem decide é ela — porque
   só ela sabe se aquele R$ 80 de um nome desconhecido é sinal de cliente ou
   dinheiro de outra coisa.
   ══════════════════════════════════════════════════════════════════════════ */

const CC_DB = '/db';
const CC_SIN = 'financeiro/sinais_whatsapp';
const ccBrl = n => Number(n || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});

/* ── 1 · LER O EXTRATO COLADO ─────────────────────────────────────────────
   ⚠️ O FORMATO NÃO É UM SÓ. O app do Nubank compartilha em texto corrido, o
   export vem em CSV, e copiar da tela dá um terceiro arranjo. Em vez de exigir
   um formato (que ela vai errar e desistir), o leitor aceita os três e MOSTRA
   o que entendeu, linha por linha, antes de concluir qualquer coisa. Leitor
   que falha calado seria o mesmo defeito de novo, num lugar novo. */
const CC_MES = {jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};

function ccData(txt){
  const s = String(txt);
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);                       /* 2026-09-29 */
  if(m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);                     /* 29/09/2026 */
  if(m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  m = s.match(/(\d{1,2})\s+([A-Za-zçÇ]{3})[A-Za-zçÇ]*\.?\s+(\d{4})/); /* 29 SET 2026 */
  if(m){
    const mes = CC_MES[m[2].toLowerCase().slice(0,3)];
    if(mes) return `${m[3]}-${String(mes).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  }
  m = s.match(/(\d{1,2})\/(\d{1,2})(?!\d)/);                        /* 29/09 (sem ano) */
  if(m){
    const ano = (typeof INICIO === 'string' ? INICIO.slice(0,4) : String(new Date().getFullYear()));
    return `${ano}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  }
  return '';
}
function ccHora(txt){
  const m = String(txt).match(/(\d{1,2})[:h](\d{2})/);
  return m ? `${String(m[1]).padStart(2,'0')}:${m[2]}` : '';
}
/* ⚠️ `80.00` e `80,00` SÃO O MESMO VALOR, e `1.234,56` tem ponto de milhar.
   Tratar ponto sempre como decimal transformava R$ 1.234,56 em R$ 1,23.

   ⚠️⚠️ NÚMERO SOLTO NÃO É DINHEIRO — e isto me pegou na primeira prova. A
   versão anterior aceitava qualquer inteiro, então a linha "28 SET 2026 -
   17:03" virou uma transação de **R$ 28,00**: o dia do mês lido como valor. O
   resultado passou longe de parecer errado — devolveu dois lançamentos e uma
   lista de "faltando" — e foi a conferência contra as linhas reais dela que
   pegou. Leitor de extrato tem que ser DESCONFIADO, não esperto.
   A régua: só é dinheiro o que vem com `R$` na frente, ou o que tem centavos. */
function ccValor(txt){
  const s = String(txt);
  let m = s.match(/R\$\s*(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}|-?\d+\.\d{2}|-?\d{1,3}(?:\.\d{3})+|-?\d+)/);
  if(!m) m = s.match(/(?:^|[\s,;|\t])(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+\.\d{2})(?=$|[\s,;|\t])/);
  if(!m) return null;
  let v = m[1];
  if(v.includes(',')) v = v.replace(/\./g,'').replace(',','.');
  else if(/^\-?\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g,'');   /* 1.234 = mil */
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
/* o que parece nome de gente: letras e espaços, 2 palavras ou mais */
const ccPareceNome = l => /^[A-Za-zÀ-ÿ'´`. ]{6,}$/.test(l.trim()) && l.trim().split(/\s+/).length >= 2;

function ccLer(texto){
  const linhas = String(texto||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const out = [];
  /* modo 1 — uma transação por linha (CSV e a maioria dos exports) */
  for(const l of linhas){
    const d = ccData(l), v = ccValor(l.replace(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(\/\d{4})?/g,' '));
    if(d && v !== null){
      out.push({dia:d, hora:ccHora(l), v:Math.abs(v), neg:v<0,
                desc:l.replace(/\s+/g,' ').slice(0,120), linha:l});
    }
  }
  if(out.length) return out;
  /* modo 2 — bloco: valor numa linha, data noutra, nome noutra */
  let atual = null;
  const fecha = () => { if(atual && atual.dia && atual.v !== null){
      out.push({dia:atual.dia, hora:atual.hora, v:Math.abs(atual.v), neg:atual.v<0,
                desc:(atual.nome||atual.cab||'').slice(0,120), linha:atual.cru.join(' · ')}); }
    atual = null; };
  for(const l of linhas){
    const v = /R\$|\d,\d{2}/.test(l) ? ccValor(l) : null;
    const d = ccData(l);
    if(v !== null && (!atual || atual.v !== null)){ fecha(); atual = {v, dia:'', hora:'', nome:'', cab:'', cru:[]}; }
    if(!atual) { atual = {v:null, dia:'', hora:'', nome:'', cab:l, cru:[]}; }
    atual.cru.push(l);
    if(v !== null && atual.v === null) atual.v = v;
    if(d && !atual.dia){ atual.dia = d; atual.hora = ccHora(l) || atual.hora; }
    if(!atual.nome && ccPareceNome(l)) atual.nome = l;
  }
  fecha();
  return out;
}

/* ── 2 · O QUE O PAINEL ACHA QUE ENTROU ───────────────────────────────────
   Lê o MESMO registro que alimenta o extrato do Nubank — inclusive os que
   estão na tarja (`para` vazio). Um sinal na tarja É dinheiro que o banco pode
   ter recebido; deixá-lo de fora aqui esconderia justamente o caso dela. */
async function ccSinais(){
  const mes = (typeof nuMes === 'function') ? nuMes() : new Date().toISOString().slice(0,7);
  const o = await (await fetch(`${CC_DB}/${CC_SIN}/${mes}.json`)).json() || {};
  delete o._varredura;
  return Object.values(o).filter(x => x && x.em).map(x => ({
    tel:x.tel, n:x.n || '(sem nome)', v:Number(x.v||80),
    dia:new Date(Number(x.em)-3*3600e3).toISOString().slice(0,10),
    hora:new Date(Number(x.em)-3*3600e3).toISOString().slice(11,16),
    para:x.para || '', noSaldo: !!(x.para && typeof INICIO === 'string' && x.para >= INICIO),
  }));
}

/* ── 3 · O PAR ────────────────────────────────────────────────────────────
   ⚠️ MESMO DIA E MESMO VALOR. A hora só ordena os candidatos: o comprovante é
   reconhecido minutos depois do Pix cair, então exigir hora igual não acharia
   ninguém (medido: Kelly pagou 17h03 e a Lailla marcou 17h07).
   ⚠️ CADA LADO SÓ CASA UMA VEZ. Sem isso, duas clientes de R$80 no mesmo dia
   casariam com a mesma linha do banco e a outra apareceria como buraco. */
function ccCruzar(banco, sinais){
  const livres = sinais.map((s,i)=>({...s, i, usado:false}));
  const pares = [], soBanco = [];
  const dif = (a,b) => Math.abs((Number(a.slice(0,2))*60+Number(a.slice(3,5))) - (Number(b.slice(0,2))*60+Number(b.slice(3,5))));
  for(const b of banco){
    const cand = livres.filter(s => !s.usado && s.dia === b.dia && Math.abs(s.v - b.v) < 0.005);
    if(!cand.length){ soBanco.push(b); continue; }
    cand.sort((x,y) => (b.hora && x.hora && y.hora) ? dif(x.hora,b.hora) - dif(y.hora,b.hora) : 0);
    cand[0].usado = true;
    pares.push({banco:b, sinal:cand[0]});
  }
  return {pares, soBanco, soPainel: livres.filter(s=>!s.usado)};
}
