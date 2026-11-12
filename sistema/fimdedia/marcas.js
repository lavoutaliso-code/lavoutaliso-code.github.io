/* ══════════════════════════════════════════════════════════════════════════
   AS MARCAS DO DINHEIRO — bandeiras de cartão, Pix e cédula, em SVG.

   Cada linha do ticket mostra com DESENHO por onde o dinheiro entrou, e as
   cores são as oficiais de cada marca — bandeira com cor errada não é
   bandeira, é borrão colorido:

     Mastercard ... #EB001B · #F79E1B, sobreposição #FF5F00
     Visa ......... #1A1F71
     Elo .......... #000000 com #FFCB05 · #EF4123 · #00A4E0
     Pix .......... #32BCAD
     Dinheiro ..... a cédula de real, #2E9E6B

   ⚠️ SEM PLAQUINHA ATRÁS (pedido dela: "sem esses cards atrás das
      ilustrações"). Antes cada símbolo vinha num cartãozinho branco com borda
      e o conjunto parecia um cinto de adesivos. Agora os símbolos ficam
      soltos no papel — o que os mantém juntos é a ALTURA IGUAL e o mesmo
      respiro entre eles, não uma moldura.
   ══════════════════════════════════════════════════════════════════════════ */

/* cada marca tem a sua proporção; o que é igual entre elas é a ALTURA */
const _mk = (w, h, altura, miolo) => `
  <svg class="bnd" viewBox="0 0 ${w} ${h}" height="${altura}"
    width="${(w / h * altura).toFixed(1)}" fill="none"
    xmlns="http://www.w3.org/2000/svg">${miolo}</svg>`;

const MARCA = {
  master: () => _mk(26, 16, 15, `
    <circle cx="9.4" cy="8" r="6.6" fill="#EB001B"/>
    <circle cx="16.6" cy="8" r="6.6" fill="#F79E1B"/>
    <path d="M13 2.9a6.6 6.6 0 0 0 0 10.2 6.6 6.6 0 0 0 0-10.2z" fill="#FF5F00"/>`),

  visa: () => _mk(40, 16, 12, `
    <path d="M17.3 13.6h-2.5l1.56-10.2h2.5l-1.56 10.2z" fill="#1A1F71"/>
    <path d="M26.7 3.65a6.2 6.2 0 0 0-2.24-.41c-2.47 0-4.2 1.3-4.22 3.17 0 1.38 1.24 2.14 2.19 2.6.97.47 1.3.77 1.3 1.19 0 .64-.78.93-1.49.93-1 0-1.53-.15-2.34-.51l-.32-.16-.35 2.15c.58.26 1.64.49 2.75.5 2.63 0 4.33-1.28 4.35-3.27 0-1.09-.65-1.92-2.09-2.6-.87-.45-1.4-.75-1.4-1.2 0-.4.46-.83 1.46-.83.83-.01 1.44.17 1.9.37l.23.11.35-2.04z" fill="#1A1F71"/>
    <path d="M33.3 3.4h-1.93c-.6 0-1.05.17-1.3.79l-3.7 9.41h2.62l.52-1.42h3.2l.3 1.42H35.3L33.3 3.4zm-3.07 6.58l1-2.67c-.1.03.2-.55.33-.9l.17.81.58 2.76h-2.08z" fill="#1A1F71"/>
    <path d="M12.9 3.4l-2.45 6.96-.27-1.35a7.84 7.84 0 0 0-3.65-4.25l2.24 8.83h2.65l3.94-10.2H12.9z" fill="#1A1F71"/>
    <path d="M8.06 3.4H4.03L4 3.6c3.13.78 5.2 2.67 6.05 4.94L9.18 4.2c-.15-.6-.58-.78-1.12-.8z" fill="#F7B600"/>`),

  elo: () => _mk(16, 16, 15, `
    <circle cx="8" cy="8" r="8" fill="#000"/>
    <path d="M8 1.6a6.4 6.4 0 0 1 5.94 4l-2.4 1A3.8 3.8 0 0 0 8 4.2V1.6z" fill="#FFCB05"/>
    <path d="M13.94 10.4A6.4 6.4 0 0 1 8 14.4v-2.6a3.8 3.8 0 0 0 3.54-2.4l2.4 1z" fill="#00A4E0"/>
    <path d="M1.6 8a6.4 6.4 0 0 1 3-5.4l1.38 2.2a3.8 3.8 0 0 0 0 6.4L4.6 13.4A6.4 6.4 0 0 1 1.6 8z" fill="#EF4123"/>`),

  /* ⚠️ O PIX NESSE TAMANHO. As quatro pontas com encaixe viram borrão; o que
     o olho reconhece é a SILHUETA — losango de pontas chanfradas com o miolo
     vazado. Detalhe que não sobrevive ao tamanho final é sujeira. */
  pix: () => _mk(18, 18, 16, `
    <path d="M9 .9l3.6 3.6a2.9 2.9 0 0 0 2.05.85h.72l2.3 2.3a1.9 1.9 0 0 1 0 2.7l-2.3 2.3h-.72
             a2.9 2.9 0 0 0-2.05.85L9 17.1l-3.6-3.6a2.9 2.9 0 0 0-2.05-.85h-.72l-2.3-2.3
             a1.9 1.9 0 0 1 0-2.7l2.3-2.3h.72A2.9 2.9 0 0 0 5.4 4.5L9 .9z" fill="#32BCAD"/>
    <path d="M9 5.2l3.3 3.3L9 11.8 5.7 8.5 9 5.2z" fill="#fff" opacity=".94"/>`),

  /* a cédula: retângulo, a janela do meio e o cifrão */
  dinheiro: () => _mk(26, 16, 15, `
    <rect x=".8" y="1.6" width="24.4" height="12.8" rx="2.4" fill="#2E9E6B"/>
    <rect x="3.1" y="3.8" width="19.8" height="8.4" rx="1.5" fill="none"
      stroke="#fff" stroke-width="1" opacity=".48"/>
    <circle cx="13" cy="8" r="3.5" fill="#fff" opacity=".95"/>
    <path d="M13 5.7v4.6M11.7 6.7h1.95a.95.95 0 0 1 0 1.9h-1.5a.95.95 0 0 0 0 1.9h1.95"
      stroke="#2E9E6B" stroke-width="1.1" stroke-linecap="round" fill="none"/>`)
};
