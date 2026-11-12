/* ══════════════════════════════════════════════════════════════════════════
   ELEMENTO 3D — contas a pagar. Mesma técnica da caixa registradora:
   uma fuga só, face de topo clara, frente média, lateral escura, luz de
   borda de 1px, brilho especular macio e sombra de contato com gradiente
   radial (nunca blur uniforme — blur uniforme faz o objeto parecer adesivo).
   ⚠️ id único por instância: dois SVG com o mesmo id de gradiente na mesma
      página fazem o segundo herdar o primeiro, e a cor sai errada em silêncio.
   ══════════════════════════════════════════════════════════════════════════ */
let _e=0;
function elContas(tam){
  const u='ct'+(++_e);
  return `<svg width="${tam}" height="${tam*0.9}" viewBox="0 0 200 180" fill="none">
  <defs>
    <linearGradient id="${u}p1" x1="30" y1="60" x2="150" y2="150">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DDD8CA"/></linearGradient>
    <linearGradient id="${u}p2" x1="40" y1="46" x2="150" y2="130">
      <stop offset="0" stop-color="#F4F1E7"/><stop offset="1" stop-color="#CFC9B8"/></linearGradient>
    <linearGradient id="${u}p3" x1="50" y1="32" x2="150" y2="112">
      <stop offset="0" stop-color="#E7E3D6"/><stop offset="1" stop-color="#BEB8A6"/></linearGradient>
    <linearGradient id="${u}sel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E4FC9B"/><stop offset=".5" stop-color="#C7F636"/>
      <stop offset="1" stop-color="#93BE18"/></linearGradient>
    <radialGradient id="${u}so" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#241F17" stop-opacity=".55"/>
      <stop offset=".5" stop-color="#241F17" stop-opacity=".22"/>
      <stop offset="1" stop-color="#241F17" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}bri" x1="34" y1="66" x2="72" y2="140">
      <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>

  <ellipse cx="100" cy="163" rx="74" ry="13" fill="url(#${u}so)"/>

  <!-- as três folhas, empilhadas com a MESMA fuga: +10x / −14y -->
  <rect x="54" y="26" width="106" height="118" rx="9" fill="url(#${u}p3)"/>
  <rect x="54" y="26" width="106" height="118" rx="9" fill="#fff" opacity=".18"/>
  <rect x="42" y="40" width="106" height="118" rx="9" fill="url(#${u}p2)"/>
  <rect x="42" y="40" width="106" height="118" rx="9" fill="#fff" opacity=".10"/>
  <rect x="30" y="54" width="106" height="118" rx="9" fill="url(#${u}p1)"/>
  <!-- a luz de borda do topo, que dá a espessura -->
  <path d="M39 54h88a9 9 0 0 1 9 9H30a9 9 0 0 1 9-9z" fill="#fff" opacity=".9"/>

  <!-- o conteúdo da folha da frente -->
  <rect x="44" y="70" width="46" height="7" rx="3.5" fill="#B9B2A0"/>
  <rect x="44" y="86" width="70" height="5" rx="2.5" fill="#CFC9B8"/>
  <rect x="44" y="98" width="58" height="5" rx="2.5" fill="#CFC9B8"/>
  <!-- código de barras -->
  <g fill="#8C8677">
    ${[0,6,10,17,21,27,33,37,44,50,54,61,65].map(x=>
      `<rect x="${44+x}" y="118" width="${x%3?2:3.5}" height="24" rx="1"/>`).join('')}
  </g>
  <!-- o selo de pago, no verde da marca -->
  <circle cx="128" cy="132" r="22" fill="#8FB818"/>
  <circle cx="128" cy="129" r="22" fill="url(#${u}sel)"/>
  <path d="m118 129 7 7 13-14" stroke="#3F5806" stroke-width="5.5" stroke-linecap="round"
    stroke-linejoin="round" fill="none"/>
  <ellipse cx="121" cy="120" rx="10" ry="6" fill="#fff" opacity=".35"/>

  <!-- brilho especular na folha da frente -->
  <path d="M34 60h26l-16 108H34z" fill="url(#${u}bri)"/>
</svg>`;
}
