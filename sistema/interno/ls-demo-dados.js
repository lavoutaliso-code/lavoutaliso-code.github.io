/* ══════════════════════════════════════════════════════════════════════
   OS DADOS DO SALÃO DE DEMONSTRAÇÃO — UMA FONTE SÓ

   ⚠️ Este arquivo existe por uma razão específica: a tela de celular e a
   de desktop precisam ler EXATAMENTE os mesmos números. Antes, os dados
   moravam dentro do `ls-demo.js`, que também mexe no DOM do desktop —
   para usá-los no celular eu teria que carregar o manipulador junto, ou
   copiar os números. Copiar número de dinheiro é como nasce divergência
   de saldo: as duas telas mostram valores diferentes e ninguém sabe qual
   está certo.

   Aqui só vivem os DADOS. Quem desenha é outro arquivo.
   ══════════════════════════════════════════════════════════════════════ */
/* ── o salão fictício ────────────────────────────────────────────── */
/* ⚠️ `window.LS_DEMO` direto, sem `const D` no topo: o `ls-demo.js`
   declara o seu próprio `D` a partir desta fonte, e dois `const D` no
   mesmo escopo global derrubam o segundo script com
   «Identifier 'D' has already been declared» — que foi exatamente o que
   deixou a tela de celular em branco na primeira tentativa. */
window.LS_DEMO = {
  saldo: 31510.05,
  contas: [['Nubank',4820.61],['Asaas',8912.77],['Sicredi',13627.07],
           ['Dinheiro',3189.90],['Processando',959.70]],
  hoje:  { fat: 2847.60, lucro: 612.40 },
  potes: [['Lucro líquido',465.92,12.1],['Equipe',5703.40,36.0],['Estoque',9099.64,14.2],
          ['Marketing',207.87,5.6],['Operacional',3066.13,19.7],['Imposto',6913.05,6.0]],
  grande:{ v:10584.51, pct:12.4 },
  contasPagar: 464,
  meta:  { atingido:74.8, alvo:68655 },
  agenda:{ site:3, wpp:5 },
  meses: [['JUN',254,49715.40,35179.60],['JUL',253,64777.80,50897.04],
          ['AGO',228,62413.20,49278.72],['SET',184,51361.10,44029.09],
          ['OUT',160,49311.30,42521.77],['NOV',64,17179.40,16136.02]],
  clientes: [
    ['07:00','Angelica Fonseca de Paula','progressiva',true],
    ['08:30','Miriam Conceição de Almeida','manutenção',true],
    ['10:00','Estefânia Magna Andrade Lacerda','progressiva',false],
    ['11:30','Débora Fraga','manutenção',false],
    ['13:00','Fernanda Ferreira Andrade','progressiva',false],
    ['14:30','Roberta Adriana Macedo Teodoro','manutenção',false],
  ],
  /* ⚠️ A comanda precisa de PREÇO, e preço inventado numa tela de dinheiro
     é o erro mais caro que existe aqui. Estes são os mesmos da esteira de
     serviços (`m3`), que saíram da divisão medida do salão:
     279,90 − 220,00 = 59,90 de lucro · 249,90 − 220,00 = 29,90. */
  precos: [
    ['progressiva',   279.90],
    ['manutenção',    249.90],
    ['hidratação',     89.90],
    ['corte',          69.90],
    ['escova',         49.90],
  ],
};
window.LS_DEMO.hoje.marg = window.LS_DEMO.hoje.lucro / window.LS_DEMO.hoje.fat * 100;
window.LS_DEMO_DADOS_OK = true;
