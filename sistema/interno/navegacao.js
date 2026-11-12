/* ══════════════════════════════════════════════════════════════════════════
   A BARRA DE ABAS — a mesma do gestor, copiada regra por regra.

   Ordem dela, 04/09: "não tem os botões de navegação como tem nas outras abas
   do mesmo site". Tinha razão: o Caixa era um beco. Ela entrava e só saía
   pelo botão de voltar do navegador.

   ⚠️ OS ÍCONES E OS RÓTULOS SÃO OS DO GESTOR, NÃO PARECIDOS. Copiei o objeto
      ICO e os rótulos de uma palavra (o comentário de lá explica: seis botões
      em 560px dão 89px cada, e "fechamento do dia" não cabe). Barra parecida
      em vez de igual faria a mesma pessoa achar que mudou de site.

   ⚠️ "CAIXA" JÁ EXISTE NO GESTOR E NÃO É ESTA TELA. Lá dentro a aba caixa
      abre o fechamento do PDV, num iframe. Não mexi nele — trocar por fora
      tiraria dela uma ferramenta que usa todo dia sem ela pedir. Aqui a aba
      caixa é a que está acesa; as outras sete levam pro gestor.

   ⚠️ O GESTOR NÃO SABIA ABRIR UMA ABA POR LINK. Não lia hash nem parâmetro:
      chegar em `gestor.html#estoque` caía no "equipe" de sempre. Ensinei ele
      (o trecho está no fim do gestor.html, comentado lá) — clica sozinho na
      aba pedida quando a barra termina de nascer.
   ══════════════════════════════════════════════════════════════════════════ */
const NAV_ICO = {
  equipe:'<circle cx="9" cy="7" r="4"/><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
  agenda:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  estoque:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/>',
  caixa:'<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  chamados:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  satisfacao:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  juridico:'<path d="M12 3v18"/><path d="M8 21h8"/><path d="M5 7h14"/><path d="M5 7l-3 6h6z"/><path d="M19 7l-3 6h6z"/>',
  auditoria:'<path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
};
const NAV_ABAS = [
  ['equipe','equipe'], ['agenda','agenda'], ['estoque','estoque'],
  ['caixa','caixa'],   ['chamados','chamados'], ['satisfacao','satisfação'],
  ['juridico','jurídico'],
];
/* ⚠️ AUDITORIA SAIU DA BARRA (04/09, pedido dela). Tirei aqui E no gestor —
   barra com sete botões de um lado e oito do outro faria a mesma pessoa achar
   que mudou de site. O ícone continua no NAV_ICO, e a tela da auditoria
   continua existindo dentro do gestor: o que saiu foi o atalho. */
function montarNav(){
  if(document.getElementById('lt-tabbar')) return;
  const bar = document.createElement('nav');
  bar.id = 'lt-tabbar';
  bar.innerHTML = NAV_ABAS.map(([k,rot])=>{
    const aqui = k==='caixa';
    return `<button type="button" class="lt-tab${aqui?' on':''}" data-aba="${k}"
      ${aqui?'aria-current="page"':`onclick="location.href='gestor.html#${k}'"`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">${NAV_ICO[k]}</svg>
      <span>${rot}</span></button>`;
  }).join('');
  document.body.appendChild(bar);
}
