// Dekorasi latar tema "Krem": krem hangat + gumpalan organik pasir & koral muda + butiran halus + garis tipis.
export default `<defs>
<linearGradient id="bg_sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6EEDF" /><stop offset="1" stop-color="#FBF8F2" /></linearGradient>
<filter id="gr_sf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.18  0 0 0 0.9 -0.4" /></filter>
</defs>
<rect width="1728" height="1117" fill="url(#bg_sf)" />
<path d="M-60 60 C 160 -40, 520 -30, 640 120 C 760 270, 560 420, 330 400 C 100 380, -170 190, -60 60 Z" fill="#EADBC0" opacity="0.55" />
<path d="M1180 1180 C 1220 900, 1480 760, 1700 820 C 1900 880, 1880 1160, 1700 1230 C 1520 1300, 1150 1320, 1180 1180 Z" fill="#FFC9B8" opacity="0.5" />
<circle cx="1560" cy="170" r="150" fill="#FFFFFF" opacity="0.45" />
<g fill="none" stroke="#17171A" stroke-opacity="0.06" stroke-width="1.5"><circle cx="1560" cy="170" r="250" /><circle cx="140" cy="960" r="210" /></g>
<rect width="1728" height="1117" filter="url(#gr_sf)" opacity="0.07" />
`;
