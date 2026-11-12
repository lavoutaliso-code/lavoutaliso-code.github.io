/* ══════════════════════════════════════════════════════════════════════════
   AGENDAMENTOS DO DIA — quantas pessoas procuraram o salão, e por onde.

   ⚠️ NÃO É A AGENDA DO DIA. Já foi, e ela corrigiu: este card conta quem
      FEZ um agendamento no período, não quem está marcada pra hoje. São
      perguntas diferentes — a segunda é a lista de atendimentos, esta é a
      procura, e é esta que explica o sinal caindo no Nubank e no Asaas.

   ⚠️ TRÊS PERÍODOS, UMA VARREDURA. Hoje, ontem e este mês saem da mesma
      passada pela agenda, feita no carregamento. Trocar de período não vai
      ao banco — é só redesenhar o card.

   ⚠️ "ESTE MÊS" COMEÇA EM 02/09, NÃO EM 01/09. A janela do painel é dela
      (começa em 2 de setembro) e a busca não enxerga antes disso. O rodapé
      diz a data em vez de somar um mês pela metade calado.
   ══════════════════════════════════════════════════════════════════════════ */
let AG_PER = 'hoje';
function agTrocar(k){
  AG_PER = k;
  const el = document.getElementById('cardAg');
  if(el) el.innerHTML = cardAgenda();
}
function cardAgenda(){
  const P = (HOJE.agendaPor && HOJE.agendaPor[AG_PER]) || {total:0, site:0, lailla:0, sem:0, rot:AG_PER};
  /* ⚠️ PORCENTAGEM SEM CASA DECIMAL. "WhatsApp 100,0%" não cabe na coluna de
     80px e quebrava numa segunda linha, deixando os dois lados desalinhados.
     Com duas categorias só, a casa decimal não decide nada. */
  const pc = q => P.total ? Math.round(q/P.total*100)+'%' : '—';
  const desde = P.desde ? `${P.desde.slice(8)}/${P.desde.slice(5,7)}` : null;
  const faltam = P.total - (P.pagos||0);
  return `
  <div class="agTit">Agendamentos</div>
  <div class="agPil">${[['hoje','hoje'],['ontem','ontem'],['mes','este mês']]
    .map(([k,r])=>`<button class="agP${k===AG_PER?' on':''}" onclick="agTrocar('${k}')">${r}</button>`)
    .join('')}</div>
  <div class="agDois">
    ${[[P.site,'Site',G.clique],[P.lailla,'WhatsApp',G.wpp]].map(([q,nome,ic],i)=>`
      <div class="agLado${i?' agDir':''}">
        <span class="agIc">${I(ic,'#1A1A1A')}</span>
        <b class="agN">${q}</b>
        <!-- ⚠️ NOME E PORCENTAGEM NA MESMA LINHA. Eram duas, e com as pílulas
             de período o card de 249px não tinha mais altura pra elas: o
             rodapé subia 3px por cima da porcentagem. Juntar as duas devolve
             uma linha inteira sem tirar nenhum dado da tela. -->
        <span class="agNome">${nome} <em class="agPc">${pc(q)}</em></span>
      </div>`).join('')}
  </div>
  <!-- ⚠️ PERÍODO SEM AGENDAMENTO MOSTRA ZERO E DIZ ISSO. Dois zeros e nada
       escrito parecem defeito de carregamento, não dia parado. -->
  <!-- ⚠️ "AGENDARAM" E "PAGARAM" SÃO NÚMEROS DIFERENTES, e o card mostra os
       dois. Sem isso, ela via 2 agendamentos aqui e 1 sinal no extrato do
       Nubank e parecia erro — não era: uma agendou e não pagou. -->
  <!-- ⚠️ TEXTO CURTO PORQUE O CARD É DE 249px. A frase longa quebrava em
       duas linhas e a segunda subia por cima das porcentagens — medido: 9px
       de sobreposição. A diferença entre agendaram e pagaram já se lê nos
       dois números; não precisa dizer "(1 sem)" também. -->
  <!-- ⚠️ O REAGENDAMENTO SAI DA CONTA MAS NÃO SOME DA TELA. Ele não é
       cliente nova procurando o salão, então não entra no total — mas some
       calado faria o número cair sem explicação. -->
  <!-- ⭐ O NÚMERO DE QUEM PAGOU VEM DO DINHEIRO, NÃO DA MARCA NA AGENDA
       (ela, 16/09/2026): "o que consta no extrato da Nubank foi o que realmente
       entrou, só que no painel mostra 10 agendamentos". Dizia "9 pagaram" com 6
       entradas no extrato — contava agendamento marcado como pago, e a Luana,
       com dois agendamentos e um sinal só, contava duas vezes.
       Agora é telefone distinto COM REGISTRO, e vem com o valor do lado: é o
       mesmo conjunto do extrato, então os dois números fecham.
       ⚠️ E QUEM SE DIZ PAGO SEM LASTRO APARECE. Sumir calado da contagem é o
       que fez ela desconfiar do painel — o número some, o aviso fica. -->
  <div class="agPe">${P.total
    ? `${P.total} agendaram · <b>${P.pagosReg||0}</b> pagaram R$ ${brl0(P.valor||0)}`
      + (P.semReg ? ` · <b class="agFalta">${P.semReg}</b> sem registro` : '')
    : `ninguém agendou ${P.rot}`}${P.remarc
    ? ` · ${P.remarc} reagendou` : ''}</div>`;
}
