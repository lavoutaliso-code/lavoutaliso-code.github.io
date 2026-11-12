/* ══════════════════════════════════════════════════════════════════════════
   OS ELEMENTOS — desenhos, não frases. Ela pediu "+elementos −textos", então
   tudo que dava pra dizer com um desenho virou desenho.

   Todos saem daqui pra ficarem IDÊNTICOS nas quatro telas: se a caixa
   registradora for diferente em cada mockup, a comparação deixa de ser entre
   arquiteturas e vira comparação entre ilustrações.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── caixa registradora, versão cheia (a ilustração) ──────────────────────
   `c` é a cor do corpo; `p` é a cor do papel que sai por cima.
   O papel nasce ATRÁS do visor (ordem de desenho) — é o que dá a impressão
   de que ele está saindo de dentro da máquina, e não colado em cima. */
function caixaRegistradora(largura, t){
  /* `t` é o tema: {corpo, escuro, tecla, papel, tela}. Virou objeto na segunda
     volta — com dois parâmetros soltos, o azulejo rosa de B saía com corpo
     branco, teclas brancas (invisíveis) e a cabeça vinho flutuando: não lia
     como caixa registradora, lia como três retângulos. Cada peça precisa de
     cor própria pra sobreviver a qualquer fundo. */
  t = t || {};
  const corpo  = t.corpo  || '#EC4899';
  const escuro = t.escuro || '#13202B';
  const tecla  = t.tecla  || 'rgba(255,255,255,.55)';
  const papel  = t.papel  || '#fff';
  const tela   = t.tela   || '#19E3A5';
  const risco  = t.risco  || 'rgba(0,0,0,.14)';
  const W = 240, H = 214;
  return `
  <svg class="cxreg" viewBox="0 0 ${W} ${H}" width="${largura}" height="${Math.round(largura*H/W)}"
       fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- o papel sai POR TRÁS da cabeça: é a ordem de desenho que dá o "de dentro" -->
    <!-- ⚠️ o papel leva CONTORNO. Sem ele, caixa de corpo claro sobre fundo
         branco deixava o papel invisível — sobravam os riscos soltos no ar. -->
    <g>
      <path d="M98 10h46v42H98z" fill="${papel}"/>
      <path d="M98 10v42M144 10v42" stroke="${t.contorno || 'rgba(15,30,40,.13)'}" stroke-width="2"/>
      <path d="M98 12l5.8 5 5.7-5 5.8 5 5.7-5 5.8 5 5.7-5 5.8 5 5.7-5"
            stroke="${t.contorno || 'rgba(15,30,40,.13)'}" stroke-width="2"
            stroke-linejoin="round" fill="none"/>
      <rect x="105" y="22" width="32" height="3.6" rx="1.8" fill="${risco}"/>
      <rect x="105" y="30" width="22" height="3.6" rx="1.8" fill="${risco}" opacity=".6"/>
      <rect x="105" y="38" width="27" height="3.6" rx="1.8" fill="${risco}" opacity=".6"/>
      <path d="M98 10l5.8 5 5.7-5 5.8 5 5.7-5 5.8 5 5.7-5 5.8 5 5.7-5"
            stroke="${papel}" stroke-width="5" stroke-linejoin="round" fill="none"/>
    </g>

    <!-- cabeça: o visor -->
    <rect x="68" y="44" width="104" height="56" rx="15" fill="${escuro}"/>
    <rect x="81" y="56" width="78" height="32" rx="8" fill="${tela}" opacity=".18"/>
    <rect x="81" y="56" width="78" height="32" rx="8" stroke="${tela}" stroke-width="2.4"/>
    ${t.visorVazio ? '' : `
    <circle cx="96" cy="72" r="4.2" fill="${tela}"/>
    <rect x="108" y="68" width="40" height="8" rx="4" fill="${tela}"/>`}

    <!-- pescoço, estreito e arredondado pra não virar um bloco solto -->
    <rect x="102" y="96" width="36" height="16" rx="5" fill="${escuro}"/>

    <!-- corpo com o teclado -->
    <rect x="18" y="108" width="204" height="62" rx="17" fill="${corpo}"/>
    ${[0,1,2,3,4].map(i => [0,1].map(j =>
      `<rect x="${36+i*35}" y="${122+j*22}" width="24" height="14" rx="6" fill="${
        (j===1&&i===4) ? tela : tecla}"/>`).join('')).join('')}

    <!-- gaveta -->
    <rect x="30" y="166" width="180" height="36" rx="13" fill="${escuro}"/>
    <rect x="100" y="179" width="40" height="8" rx="4" fill="${tecla}"/>
  </svg>`;
}

/* ── caixa registradora, versão ícone (dentro do botão pink) ───────────── */
function iconeCaixa(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
    stroke-linecap="round" stroke-linejoin="round">
    <rect x="2.5" y="11" width="19" height="9" rx="2.2"/>
    <rect x="7" y="4" width="10" height="5.5" rx="1.6"/>
    <path d="M12 9.5v1.5"/><path d="M9 20v1.5"/><path d="M15 20v1.5"/>
    <path d="M6 14.5h2M11 14.5h2M16 14.5h2"/>
  </svg>`;
}

/* ── check: o mesmo traço do fechamento, desenhado na hora ─────────────── */
function checkSVG(tamanho, cor, grossura){
  return `<svg viewBox="0 0 100 100" width="${tamanho}" height="${tamanho}" fill="none">
    <circle class="ck-c" cx="50" cy="50" r="45" stroke="${cor}" stroke-width="${grossura||5}"/>
    <path class="ck-p" d="M30 51l14 14 27-29" stroke="${cor}" stroke-width="${(grossura||5)+2}"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ── os ícones dos azulejos: tesoura, comanda, equipe, dinheiro ────────── */
const ICO = {
  tesoura:`<path d="M6 3l12 13M18 3L6 16"/><circle cx="6.5" cy="19" r="2.6"/><circle cx="17.5" cy="19" r="2.6"/>`,
  comanda:`<rect x="4" y="2.5" width="16" height="19" rx="2.4"/><path d="M8 8h8M8 12h8M8 16h5"/>`,
  equipe:`<path d="M16 20v-1.6a3.4 3.4 0 0 0-3.4-3.4H6.4A3.4 3.4 0 0 0 3 18.4V20"/><circle cx="9.5" cy="7.5" r="3.4"/><path d="M21 20v-1.6a3.4 3.4 0 0 0-2.6-3.3"/><path d="M15.5 4.3a3.4 3.4 0 0 1 0 6.5"/>`,
  dinheiro:`<rect x="2" y="5.5" width="20" height="13" rx="2.4"/><circle cx="12" cy="12" r="3"/><path d="M6 9.5v5M18 9.5v5"/>`,
  relogio:`<circle cx="12" cy="12" r="9"/><path d="M12 7.2V12l3.2 2.2"/>`,
  estrela:`<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>`
};
function ico(nome, tamanho, grossura){
  return `<svg viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" fill="none"
    stroke="currentColor" stroke-width="${grossura||1.9}" stroke-linecap="round"
    stroke-linejoin="round">${ICO[nome]}</svg>`;
}

/* ── a fita de avatares da equipe do dia ───────────────────────────────── */
const EQUIPE = [
  {n:'Dani',    i:'D', c:'#00BFFF', q:5},
  {n:'Suelem',  i:'S', c:'#F59E0B', q:4},
  {n:'Fran',    i:'F', c:'#8B5CF6', q:3},
  {n:'Luemara', i:'L', c:'#D1016B', q:2}
];
