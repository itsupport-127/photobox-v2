// Dekorasi latar tema "Elegan": arang hangat + cahaya koral lembut + butiran halus + garis tipis. (Gantinya desain biru lama.)
export default `<defs>
<linearGradient id="bg_sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D2028" /><stop offset="1" stop-color="#101216" /></linearGradient>
<radialGradient id="gc_sf" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF5F45" stop-opacity="0.32" /><stop offset="1" stop-color="#FF5F45" stop-opacity="0" /></radialGradient>
<radialGradient id="gw_sf" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F6C9A8" stop-opacity="0.12" /><stop offset="1" stop-color="#F6C9A8" stop-opacity="0" /></radialGradient>
<filter id="gr_sf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 -0.35" /></filter>
</defs>
<rect width="1728" height="1117" fill="url(#bg_sf)" />
<ellipse cx="1500" cy="60" rx="760" ry="560" fill="url(#gc_sf)" />
<ellipse cx="120" cy="1080" rx="680" ry="480" fill="url(#gw_sf)" />
<g fill="none" stroke="#F6F1EA" stroke-opacity="0.07" stroke-width="1.5"><circle cx="1500" cy="60" r="420" /><circle cx="1500" cy="60" r="640" /><circle cx="120" cy="1080" r="300" /></g>
<rect width="1728" height="1117" filter="url(#gr_sf)" opacity="0.06" />
`;
