/* O CORPO — igual nas quatro. Só o miolo do card OVERVIEW muda (os anéis). */
const I=(d,s)=>`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${s||'currentColor'}"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const G={
 sino:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
 casa:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
 graf:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 6 10-6"/>',
 pizza:'<path d="M12 2v10l7 7A10 10 0 1 1 12 2z"/>',
 sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
 sair:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
 lupa:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 caixa:'<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M6 7V4h12v3M6 12h4M6 16h8"/>',
 clique:'<path d="M4 4l7 16 2-6 6-2z"/>',
 wpp:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.9-.9L3 20l1.3-3.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>',
 aviso:'<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
 pin:'<path d="M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
};
function montaCorpo(){
  const fatDia = HOJE.fat, agenda = HOJE.agenda;
  /* ⚠️ NÃO EMBRULHE A RAIZ AQUI. Eu tentei devolver tudo dentro de uma
     <div class="tela"> e não funcionou: existe fechamento de div sobrando no
     meio deste template, então o parser fechava a .tela cedo e as quatro
     gavetas (mtVeu, ctVeu, veu, cxPalco) nasciam como IRMÃS dela. O
     redesenho trocava a .tela e deixava as gavetas pra trás — quatro
     conjuntos delas depois de quatro recargas.
     Quem embrulha é o pinta(), com innerHTML num contêiner: ali sobra de
     </div> é descartada pelo parser e tudo fica dentro. */
  return `
<div class="foto"></div>
<div class="prancheta">
<div class="painel">

  <!-- a barra lateral saiu: nenhum dos 7 ícones fazia nada -->


  <div class="tit"><div class="a">Painel</div><div class="b">Financeiro</div></div>
  <!-- ⭐ a caixa que escolhe o período da pílula (23/10/2026). Vem ANTES dela
       no DOM: no celular tudo vira pilha e a ordem do DOM é o que decide
       quem aparece primeiro entre dois irmãos com o mesmo order.
       ⚠️ NADA DE CRASE NESTE COMENTÁRIO — ele vive dentro de uma template
       string, e uma crase aqui fecha a string e derruba o corpo inteiro. -->
  <div class="hjPer vid">${topoPeriodo()}</div>
  <div class="hoje vid">${topoHoje()}</div>

  <!-- ── o card SALDO DISPONÍVEL, aprovado, em escala .5 ── -->
  <div class="over vid">
    <div class="cardEsc">
      <div class="top"><span class="olho">Saldo disponível</span>
        <span class="per">2 set →
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></span></div>
      <div class="cabSaldo">
        <!-- ⚠️ O NÚMERO GRANDE VIROU BOTÃO (dona, 09/09/2026: "coloque uma
             função pra clicar no saldo e ver todas as entradas e saídas pois
             estou ficando perdida"). Cada bolinha já abria o extrato DELA; o
             total somava as quatro e não abria nada — pra entender de onde ele
             vinha, era abrir quatro gavetas e juntar de cabeça. -->
        <div class="saldo saldoClica" onclick="abrirExtratoGeral()"
             title="ver tudo que entrou e saiu">
          <!-- ⚠️ O SALDO AGORA É A SOMA DAS CONTAS, não o lucro. Enquanto
               duas contas não tiverem saldo informado, o total é PARCIAL e a
               tela diz isso — total com dois terços chutados seria pior. -->
          <!-- ⚠️ O TÍTULO MUDOU DE "SALDO DISPONÍVEL" PRA "ENTROU NAS CONTAS".
               As três bolinhas passaram a ser MOVIMENTO da janela, e chamar
               movimento de saldo seria mentir no maior número da tela. -->
          <div class="v">${SALDO_MEDINDO
            ? '<em class="medindo">medindo…</em>'
            : `<span class="cif">R$</span>${brl(SALDO_TOTAL)}`}</div>
          <!-- ⚠️ DUAS GRANDEZAS DIFERENTES NO MESMO CARD, e por muito pouco
               isso passou batido: o número grande é o que está NAS CONTAS
               (R$ 4.917,74) e os anéis dividem o que ENTROU (R$ 5.003,70).
               Eles ficaram a R$ 85 um do outro e liam como arredondamento.
               O saldo tem sinal de quem ainda não foi atendida e não tem o
               que já foi transferido — nunca vai ser igual ao faturamento.
               Agora a linha diz os dois números, com nome. -->
          <!-- ⚠️ ESTA LINHA JÁ CONFUNDIU. Ela dizia "nas quatro contas · os
               anéis dividem R$ 5.003,70" — dois assuntos numa frase só, e ela
               perguntou o que era aquilo. O problema de fundo é real: o número
               grande é DINHEIRO EM CONTA e os anéis dividem O QUE O SALÃO
               FATUROU. São coisas diferentes e nunca vão bater. Agora cada uma
               fica no seu lugar: aqui só o saldo, e o faturamento vai escrito
               em cima dos anéis, que é onde ele é usado. -->
          <div class="s">somando as cinco contas
            <!-- sem esta pista ninguem descobre que o numero e clicavel -->
            <em class="sVer">toque para ver tudo</em></div>
        </div>
        ${bolinhas()}
      </div>
      <div class="palcoA">${miolo()}</div>
    </div>
  </div>

  <!-- ── coluna do meio ── -->
  <div class="mtopo vid" onclick="fecharCaixa()" title="imprimir o fechamento do dia">
    <span class="cx">${I(G.caixa,'#fff')}</span>
    <span class="t">Fechar caixa<br>de hoje</span>
  </div>
  <div class="mazul contas vid" onclick="ctAbrir()" title="abrir contas a pagar">${cardContasMini()}</div>

  <!-- ⚠️ "Como entrou" SAIU DE NOVO — virou este card de meta, a pedido dela.
       É a terceira vez que as formas de pagamento perdem o lugar. O aviso de
       R$1.200 sem forma registrada continua sendo dado real e agora não está
       em tela nenhuma. Dito no relatório. -->
  <div class="entrou meta vid" onclick="mtAbrir()" title="ver se estamos no caminho">
    ${cardMeta()}</div>

  <!-- ── coluna direita: SEU SALÃO AGORA ── -->
  <div class="dir vid">${cardSalao()}</div>

  <!-- ⚠️ "Como entrou" e "Conferência" SAÍRAM daqui pra este card caber.
       Eles não podem sumir: são as formas de pagamento medidas e o buraco de
       R$1.200 sem forma registrada. Foram pro card que estava reservado, na
       faixa de baixo — que era SEU espaço. Se quiser ele livre de novo, esses
       dois precisam de outro canto. -->
  <!-- ── faixa de baixo: metade agendamentos, metade reservada ── -->
  <div class="baixo">
    <!-- ⚠️ ESTE CARD NÃO USA PRANCHETA. Os outros entram por scale() porque
         foram aprovados num tamanho e encaixados em outro. Aqui o desenho é
         NATIVO em 249×178: escalar de novo era o que fazia o nome cair pra
         6,6px. Tipografia dimensionada pra caber, não espremida. -->
    <div class="cb meia vid" id="cardAg">${cardAgenda()}</div>

    <!-- ⚠️ "Como entrou" (formas de pagamento) e a Conferência de R$1.200
         SAÍRAM daqui. Este espaço já tinha sido o refúgio delas quando o card
         "Seu salão agora" tomou a coluna direita. Agora não têm lugar nenhum
         — e são dado real que não pode sumir. Está dito no relatório. -->
    <div class="cb resto vid">${graficoMes()}</div>
  </div>
    </div>
  </div>
</div>

  <!-- a gaveta da meta -->
  <div class="mtVeu" id="mtVeu" onclick="mtFechar(event)">
    <div class="mtCheio"></div>
  </div>

  <!-- a gaveta com o card de contas inteiro -->
  <div class="ctVeu" id="ctVeu" onclick="ctFechar(event)">
    <div class="ctCheio card"></div>
  </div>

  <!-- a gaveta de saida / extrato / estoque.
       ATENCAO: mora AQUI, fora do card, de proposito. Dentro do card o
       backdrop-filter dele virava o bloco-conteiner do position:fixed, a
       gaveta ficava presa em 700x470 e o overflow:hidden do painel
       decepava o cabecalho (a bolinha e o "Saldo do" sumiam).
       Aqui ela tem os 1380x794 inteiros. -->
  <div class="veu" id="veu" onclick="fecharSaida(event)">
    <div class="gaveta" id="gaveta"></div>
  </div>
  ${palcoCaixa()}
</div>`;
}
