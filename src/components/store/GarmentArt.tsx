import { cn } from '@/lib/utils';

/**
 * Coloured garment illustrations, shown wherever a product has no photo yet.
 * The shape is picked from the product title / category (suit, tuxedo, shirt, tie…)
 * and filled with the product's colour, so a store with no photos still looks complete.
 * Upload real photos in Admin → Products and they replace these automatically.
 */

type Kind =
  | 'suit'
  | 'double'
  | 'tuxedo'
  | 'shawl'
  | 'blazer'
  | 'coat'
  | 'shirt'
  | 'tuxshirt'
  | 'pants'
  | 'sweater'
  | 'tie'
  | 'bowtie'
  | 'belt'
  | 'pocketsquare'
  | 'cufflinks'
  | 'oxford'
  | 'patent'
  | 'loafer'
  | 'driver'
  | 'sneaker'
  | 'boot'
  | 'generic';

export function garmentKind(category = '', title = ''): Kind {
  const t = title.toLowerCase();
  const c = category.toLowerCase();
  // Footwear first ("Tuxedo Shoes" is a shoe, not a tuxedo).
  if (t.includes('sneaker') || t.includes('trainer')) return 'sneaker';
  if (t.includes('boot')) return 'boot';
  if (t.includes('driving') || t.includes('driver')) return 'driver';
  if (t.includes('loafer') || t.includes('moccasin')) return 'loafer';
  if (t.includes('patent')) return 'patent';
  if (t.includes('oxford') || t.includes('derby') || t.includes('brogue') || t.includes('shoe')) return 'oxford';
  if (c.includes('casual') && c.includes('shoe')) return 'sneaker';
  if (c.includes('shoe') || c.includes('footwear')) return 'oxford';
  if (t.includes('pocket square')) return 'pocketsquare';
  if (t.includes('cufflink')) return 'cufflinks';
  if (t.includes('bow tie') || t.includes('bowtie')) return 'bowtie';
  if (/\btie\b/.test(t)) return 'tie';
  if (t.includes('belt')) return 'belt';
  if (t.includes('tuxedo shirt') || (t.includes('shirt') && t.includes('pleat'))) return 'tuxshirt';
  if (t.includes('velvet') || t.includes('dinner jacket') || (t.includes('shawl') && (t.includes('tux') || c.includes('tux')))) return 'shawl';
  if (t.includes('tuxedo') || c.includes('tux')) return 'tuxedo';
  if (t.includes('overcoat') || t.includes('topcoat') || t.includes('trench') || c.includes('outer') || /\bcoat\b/.test(c)) return 'coat';
  if (t.includes('blazer') || t.includes('sport coat') || c.includes('blazer')) return 'blazer';
  if (t.includes('double-breasted') || t.includes('double breasted')) return 'double';
  if (t.includes('suit') || c.includes('suit')) return 'suit';
  if (t.includes('pant') || t.includes('trouser') || t.includes('chino') || c.includes('pant') || c.includes('trouser')) return 'pants';
  if (t.includes('shirt') || c.includes('shirt')) return 'shirt';
  if (t.includes('sweater') || t.includes('knit') || t.includes('zip') || c.includes('sweater') || c.includes('knit')) return 'sweater';
  if (c.includes('accessor')) return 'tie';
  if (c.includes('jacket')) return 'blazer';
  return 'generic';
}

/* ----------------------------- colour helpers ----------------------------- */

const NAMED: Record<string, string> = {
  'dark brown': '#3E2A1E', pink: '#E8C4C8', 'gun metal': '#5E636B', gold: '#C9A34E', 'charcoal grey': '#3A3B3E',
  navy: '#1E2A3F', charcoal: '#3A3B3E', black: '#16171A', 'light grey': '#A7A9AC', grey: '#7D8085', gray: '#7D8085',
  'brown check': '#6B4F3A', 'blue check': '#3E5A80', 'midnight navy': '#141C2E', burgundy: '#5B1F28', emerald: '#1F4D3A',
  stone: '#B9B2A5', tan: '#A8835A', white: '#F2F2EF', 'light blue': '#BCD3EA', camel: '#B48A5E', silver: '#B9BCC2',
  brown: '#5A3B26', ivory: '#EFEAE0', olive: '#545A3A', green: '#2F4434', red: '#7A1F2A', blue: '#2C4A7A', beige: '#D8CDB8',
};

function toHex(color?: string): string {
  if (!color) return '#2A3550';
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) return '#' + color.slice(1).split('').map((ch) => ch + ch).join('');
  return NAMED[color.toLowerCase()] ?? '#2A3550';
}

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** amt > 0 lightens towards white, < 0 darkens towards black. */
function shade(hex: string, amt: number) {
  const out = rgb(hex).map((v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)));
  return '#' + out.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

interface Pal {
  base: string;
  dark: string;
  darker: string;
  light: string;
  line: string;
  shirt: string;
  accent: string;
}

function palette(color?: string): Pal {
  const base = toHex(color);
  const lum = luminance(base);
  const isDark = lum < 0.35;
  return {
    base,
    dark: isDark ? shade(base, 0.12) : shade(base, -0.18),
    darker: isDark ? shade(base, -0.45) : shade(base, -0.32),
    light: shade(base, isDark ? 0.22 : 0.18),
    line: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)',
    shirt: '#F4F3EF',
    accent: lum > 0.55 ? '#1E2A3F' : '#7A1F2A',
  };
}

/* -------------------------------- pieces -------------------------------- */

const JACKET = 'M118 66 150 60 182 66 222 84Q232 90 234 102L248 270 226 276 214 168V336H86V168L74 276 52 270 66 102Q68 90 78 84Z';
const COAT = 'M116 64 150 58 184 64 226 84Q236 90 238 102L252 290 230 296 216 170V372H84V170L70 296 48 290 62 102Q64 90 74 84Z';
const SHIRT = 'M112 70 150 62 188 70 226 92Q234 98 236 108L246 262 224 268 210 158V346H90V158L76 268 54 262 64 108Q66 98 74 92Z';

function Hanger() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-fg/35">
      <path d="M150 58V44Q150 34 158 32Q166 30 166 22Q166 12 156 12Q148 12 146 19" />
    </g>
  );
}

function Jacket({ p, kind }: { p: Pal; kind: 'suit' | 'double' | 'tuxedo' | 'shawl' | 'blazer' }) {
  const db = kind === 'double';
  const satin = kind === 'tuxedo' || kind === 'shawl';
  const lapel = satin ? '#0E0F12' : p.dark;
  const lapelLine = satin ? 'rgba(255,255,255,0.28)' : p.line;
  return (
    <g>
      <Hanger />
      <path d={JACKET} fill={p.base} />
      {/* sleeve seams */}
      <path d="M86 168 78 104M214 168 222 104" stroke={p.line} strokeWidth="1.5" fill="none" />
      {/* shirt V */}
      <path d="M124 66 150 60 176 66 150 182Z" fill={p.shirt} />
      {kind === 'tuxedo' || kind === 'shawl' ? (
        <>
          <path d="M150 92V182" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          {[110, 130, 150].map((y) => (
            <circle key={y} cx="150" cy={y} r="2" fill="#16171A" />
          ))}
          <path d="M134 76 148 82V90L134 96ZM166 76 152 82V90L166 96Z" fill="#0E0F12" />
          <rect x="146" y="80" width="8" height="12" rx="2" fill="#0E0F12" />
        </>
      ) : kind === 'suit' || kind === 'double' ? (
        <path d="M144 70H156L153 82 160 154 150 168 140 154 147 82Z" fill={p.accent} />
      ) : (
        <path d="M138 66 150 90 162 66" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
      )}
      {/* lapels */}
      {kind === 'shawl' ? (
        <>
          <path d="M124 66Q104 120 150 206L150 186Q122 132 136 68Z" fill={lapel} stroke={lapelLine} strokeWidth="1" />
          <path d="M176 66Q196 120 150 206L150 186Q178 132 164 68Z" fill={lapel} stroke={lapelLine} strokeWidth="1" />
        </>
      ) : (
        <>
          <path d="M124 66 108 76 122 112 110 120 150 200 150 186 130 68Z" fill={lapel} stroke={lapelLine} strokeWidth="1" />
          <path d="M176 66 192 76 178 112 190 120 150 200 150 186 170 68Z" fill={lapel} stroke={lapelLine} strokeWidth="1" />
        </>
      )}
      {db ? (
        <>
          {/* overlapping front + two columns of buttons */}
          <path d="M150 200 186 214 176 336H150Z" fill={p.dark} opacity=".35" />
          <path d="M150 200 186 214 176 336" stroke={p.line} strokeWidth="1.5" fill="none" />
          {[218, 248, 278].map((y) => (
            <g key={y}>
              <circle cx="132" cy={y} r="3.5" fill={p.darker} />
              <circle cx="168" cy={y} r="3.5" fill={p.darker} />
            </g>
          ))}
        </>
      ) : (
        <>
          {/* front opening below the button */}
          <path d="M150 206 140 336M150 206 160 336" stroke={p.line} strokeWidth="1.5" fill="none" />
          <path d="M150 206 140 336 160 336Z" fill={p.dark} opacity=".35" />
          <circle cx="150" cy="212" r="3.5" fill={satin ? '#0E0F12' : p.darker} />
          {kind !== 'tuxedo' && kind !== 'shawl' && <circle cx="150" cy="246" r="3.5" fill={p.darker} />}
        </>
      )}
      {/* pockets */}
      {kind === 'blazer' ? (
        <>
          <path d="M96 252H134V290H96ZM166 252H204V290H166Z" fill={p.dark} opacity=".55" stroke={p.line} strokeWidth="1" />
          <path d="M168 128H192" stroke={p.line} strokeWidth="2" />
        </>
      ) : (
        <>
          <path d="M96 258H134M166 258H204" stroke={satin ? '#0E0F12' : p.darker} strokeWidth="3" strokeLinecap="round" />
          <path d="M168 128H192" stroke={satin ? '#0E0F12' : p.darker} strokeWidth="2.5" strokeLinecap="round" />
          {!satin && <path d="M172 124 178 118 184 124" fill={p.shirt} />}
        </>
      )}
      {/* cuffs */}
      <path d="M52 270 74 276M248 270 226 276" stroke={p.darker} strokeWidth="3" />
    </g>
  );
}

function Coat({ p }: { p: Pal }) {
  return (
    <g>
      <Hanger />
      <path d={COAT} fill={p.base} />
      <path d="M84 170 74 104M216 170 226 104" stroke={p.line} strokeWidth="1.5" fill="none" />
      {/* knit underneath */}
      <path d="M126 64 150 58 174 64 150 160Z" fill="#2A2C31" />
      <path d="M126 64Q150 96 174 64" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      {/* wide lapels */}
      <path d="M126 64 104 76 120 122 106 132 150 214 150 196 132 66Z" fill={p.dark} stroke={p.line} strokeWidth="1" />
      <path d="M174 64 196 76 180 122 194 132 150 214 150 196 168 66Z" fill={p.dark} stroke={p.line} strokeWidth="1" />
      <path d="M150 214V372" stroke={p.line} strokeWidth="1.5" />
      {[226, 264, 302].map((y) => (
        <circle key={y} cx="158" cy={y} r="4" fill={p.darker} />
      ))}
      <path d="M94 272 128 266M172 266 206 272" stroke={p.darker} strokeWidth="3" strokeLinecap="round" />
      <path d="M48 290 70 296M252 290 230 296" stroke={p.darker} strokeWidth="3" />
    </g>
  );
}

function Shirt({ p, tux }: { p: Pal; tux?: boolean }) {
  return (
    <g>
      <Hanger />
      <path d={SHIRT} fill={p.base} />
      <path d="M90 158 82 110M210 158 218 110" stroke={p.line} strokeWidth="1.5" fill="none" />
      {/* collar */}
      <path d="M126 68 150 64 174 68 168 80 150 72 132 80Z" fill={p.dark} />
      <path d="M128 70 150 100 140 108 118 78ZM172 70 150 100 160 108 182 78Z" fill={p.light} stroke={p.line} strokeWidth="1" />
      {/* placket */}
      <path d="M144 100H156V346H144Z" fill={p.dark} opacity=".35" />
      {[124, 162, 200, 238, 276, 314].map((y) => (
        <circle key={y} cx="150" cy={y} r="2.6" fill={p.darker} />
      ))}
      {tux ? (
        <>
          {[118, 126, 134, 166, 174, 182].map((x) => (
            <path key={x} d={`M${x} 118V250`} stroke={p.line} strokeWidth="1.2" />
          ))}
          <path d="M134 84 148 90V98L134 104ZM166 84 152 90V98L166 104Z" fill="#0E0F12" />
          <rect x="146" y="88" width="8" height="12" rx="2" fill="#0E0F12" />
        </>
      ) : (
        <path d="M168 130H196V160H168Z" fill="none" stroke={p.line} strokeWidth="1.5" />
      )}
      {/* cuffs */}
      <path d="M54 262 76 268 74 282 52 276ZM246 262 224 268 226 282 248 276Z" fill={p.dark} />
    </g>
  );
}

function Pants({ p }: { p: Pal }) {
  return (
    <g>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-fg/35">
        <path d="M150 50V36Q150 26 158 24Q166 22 166 14Q166 4 156 4Q148 4 146 11M90 56H210" />
      </g>
      <path d="M96 62H204L214 368H162L150 160 138 368H86Z" fill={p.base} />
      <path d="M96 62H204V82H96Z" fill={p.dark} />
      {[110, 134, 166, 190].map((x) => (
        <path key={x} d={`M${x} 60V86`} stroke={p.darker} strokeWidth="3" />
      ))}
      <path d="M150 82V160" stroke={p.line} strokeWidth="1.5" />
      <path d="M118 90 112 360M182 90 188 360" stroke={p.line} strokeWidth="1.2" />
      <path d="M100 86Q118 96 124 120M200 86Q182 96 176 120" stroke={p.darker} strokeWidth="2" fill="none" />
      <circle cx="150" cy="72" r="3" fill={p.darker} />
    </g>
  );
}

function Sweater({ p }: { p: Pal }) {
  return (
    <g>
      <Hanger />
      <path d={SHIRT} fill={p.base} />
      <path d="M90 158 82 110M210 158 218 110" stroke={p.line} strokeWidth="1.5" fill="none" />
      {/* knit texture */}
      {[120, 136, 152, 168, 184].map((x) => (
        <path key={x} d={`M${x} 120V320`} stroke={p.line} strokeWidth="1" strokeDasharray="2 4" />
      ))}
      {/* stand collar + zip */}
      <path d="M124 64 150 60 176 64 178 84 150 90 122 84Z" fill={p.dark} />
      <path d="M150 60V150" stroke="#C9CCD2" strokeWidth="3" />
      <rect x="146" y="146" width="8" height="12" rx="2" fill="#C9CCD2" />
      {/* ribbed hem + cuffs */}
      <path d="M90 322H210V346H90Z" fill={p.dark} />
      {[100, 112, 124, 136, 148, 160, 172, 184, 196].map((x) => (
        <path key={x} d={`M${x} 324V344`} stroke={p.line} strokeWidth="1" />
      ))}
      <path d="M56 248 78 254 76 268 54 262ZM244 248 222 254 224 268 246 262Z" fill={p.dark} />
    </g>
  );
}

function Tie({ p }: { p: Pal }) {
  return (
    <g>
      <path d="M134 60H166L160 92H140Z" fill={p.dark} />
      <path d="M140 92H160L184 300 150 346 116 300Z" fill={p.base} />
      <clipPath id="tie-blade">
        <path d="M140 92H160L184 300 150 346 116 300Z" />
      </clipPath>
      <g clipPath="url(#tie-blade)" stroke={p.light} strokeWidth="6" opacity=".55">
        {[100, 150, 200, 250, 300, 350].map((y) => (
          <path key={y} d={`M100 ${y}L200 ${y - 60}`} />
        ))}
      </g>
      <path d="M150 92V340" stroke={p.line} strokeWidth="1" />
    </g>
  );
}

function BowTie({ p }: { p: Pal }) {
  return (
    <g>
      <path d="M150 200 74 150Q62 146 62 160V240Q62 254 74 250Z" fill={p.base} />
      <path d="M150 200 226 150Q238 146 238 160V240Q238 254 226 250Z" fill={p.base} />
      <path d="M150 200 86 168V232ZM150 200 214 168V232Z" fill={p.dark} opacity=".6" />
      <rect x="134" y="176" width="32" height="48" rx="8" fill={p.dark} stroke={p.line} strokeWidth="1" />
      <path d="M140 188Q150 200 160 188M140 212Q150 200 160 212" stroke={p.line} strokeWidth="1.2" fill="none" />
    </g>
  );
}

function Belt({ p }: { p: Pal }) {
  return (
    <g>
      <ellipse cx="150" cy="214" rx="98" ry="62" fill="none" stroke={p.base} strokeWidth="24" />
      <ellipse cx="150" cy="214" rx="98" ry="62" fill="none" stroke={p.line} strokeWidth="1" strokeDasharray="4 6" />
      <path d="M232 180Q262 214 236 252" stroke={p.base} strokeWidth="24" fill="none" />
      <rect x="226" y="186" width="34" height="50" rx="6" fill="none" stroke="#C9CCD2" strokeWidth="6" />
      <path d="M243 192V230" stroke="#C9CCD2" strokeWidth="4" />
      {[118, 140, 162].map((x) => (
        <circle key={x} cx={x} cy="152" r="3" fill={p.darker} />
      ))}
    </g>
  );
}

/* -------------------------------- footwear -------------------------------- */

type ShoeStyle = 'oxford' | 'patent' | 'loafer' | 'driver' | 'sneaker' | 'boot';

function ShoeShape({ p, style }: { p: Pal; style: ShoeStyle }) {
  const sole = style === 'sneaker' ? '#F1F0EC' : style === 'driver' ? shade(p.base, -0.35) : '#141518';
  const shine = style === 'patent' || style === 'oxford';
  if (style === 'boot') {
    return (
      <g>
        <path d="M74 256V122Q74 110 86 110H142Q150 110 150 122L152 196Q178 212 228 222Q258 228 260 246V256Z" fill={p.base} stroke={p.line} strokeWidth="2" />
        <path d="M106 114H134L142 200H100Z" fill={p.darker} />
        {[110, 118, 126, 134].map((x) => (
          <path key={x} d={`M${x} 118 ${x + 2} 196`} stroke={p.line} strokeWidth="1" />
        ))}
        <rect x="76" y="94" width="12" height="22" rx="3" fill={p.dark} />
        <path d="M74 256V272H112V256Z" fill="#141518" />
        <path d="M112 262H260Q262 272 250 274H112Z" fill="#141518" />
        <path d="M196 214Q226 222 246 236" stroke={p.light} strokeWidth="3" opacity=".35" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (style === 'sneaker') {
    return (
      <g>
        <path d="M62 250Q58 206 84 196L120 186Q148 182 170 204Q198 218 236 224Q262 230 262 248V252H62Z" fill={p.base} stroke={p.line} strokeWidth="2" />
        <path d="M56 252H266Q268 272 254 276H66Q52 274 56 252Z" fill={sole} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
        <path d="M60 264H264" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
        <path d="M128 190Q150 206 178 212" stroke={p.line} strokeWidth="1.5" fill="none" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${136 + i * 11} ${194 + i * 4}l8 -8`} stroke={p.darker} strokeWidth="3" strokeLinecap="round" />
        ))}
        <path d="M214 222Q206 236 214 252" stroke={p.line} strokeWidth="1.5" fill="none" />
        <path d="M62 226Q84 226 96 252" stroke={p.line} strokeWidth="1.5" fill="none" />
        <path d="M64 196 76 192 80 214 66 216Z" fill={p.accent} opacity=".8" />
      </g>
    );
  }
  const loaferish = style === 'loafer' || style === 'driver';
  return (
    <g>
      {loaferish ? (
        <path d="M60 252Q60 214 84 206L130 204Q160 204 184 214Q214 222 244 228Q262 234 262 248V256H60Z" fill={p.base} stroke={p.line} strokeWidth="2" />
      ) : (
        <path d="M60 252Q58 200 82 190L122 180Q150 176 170 196Q200 214 240 222Q262 228 262 246V256H60Z" fill={p.base} stroke={p.line} strokeWidth="2" />
      )}
      {/* heel + sole */}
      {style === 'driver' ? (
        <>
          <path d="M60 256H262Q264 266 252 268H70Q58 266 60 256Z" fill={sole} />
          {[84, 112, 140, 168, 196, 224].map((x) => (
            <circle key={x} cx={x} cy="266" r="5" fill={sole} />
          ))}
        </>
      ) : (
        <>
          <path d="M60 256V270H98L100 256Z" fill={sole} />
          <path d="M98 262H262Q264 270 254 272H98Z" fill={sole} />
        </>
      )}
      {loaferish ? (
        <>
          {style === 'loafer' && <path d="M150 210Q170 220 198 222L196 234Q168 232 148 222Z" fill={p.darker} />}
          {style === 'driver' && <path d="M168 214Q176 206 184 214M176 214V224" stroke={p.darker} strokeWidth="3" fill="none" strokeLinecap="round" />}
          <path d="M140 206Q196 210 226 228" stroke={p.line} strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
        </>
      ) : (
        <>
          <path d="M126 184Q150 202 180 208" stroke={p.line} strokeWidth="1.5" fill="none" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${138 + i * 12} ${190 + i * 5}l6 -6`} stroke={p.line} strokeWidth="2" strokeLinecap="round" />
          ))}
          <path d="M222 220Q214 238 222 256" stroke={p.line} strokeWidth="1.5" fill="none" />
        </>
      )}
      <path d="M60 222Q86 224 96 256" stroke={p.line} strokeWidth="1.5" fill="none" />
      {shine && (
        <path
          d="M196 222Q226 226 248 236"
          stroke="white"
          strokeWidth={style === 'patent' ? 5 : 3}
          opacity={style === 'patent' ? 0.45 : 0.2}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/** A pair: the back shoe is offset and slightly darker. */
function Shoes({ p, style }: { p: Pal; style: ShoeStyle }) {
  const back: Pal = { ...p, base: p.dark, dark: p.darker };
  return (
    <g transform="translate(150 214) scale(1.3) translate(-150 -232)">
      <g transform="translate(-22 -46)" opacity=".9">
        <ShoeShape p={back} style={style} />
      </g>
      <ShoeShape p={p} style={style} />
      <ellipse cx="160" cy="292" rx="118" ry="8" fill="black" opacity=".25" />
    </g>
  );
}

function PocketSquare({ p }: { p: Pal }) {
  return (
    <g transform="translate(150 220) scale(1.3) translate(-150 -230)">
      <path d="M90 236 124 140 152 210 180 128 212 236Z" fill={p.base} stroke={p.line} strokeWidth="1.5" />
      <path d="M124 140 138 236M180 128 164 236" stroke={p.line} strokeWidth="1" />
      <path d="M70 226H230V320H70Z" fill="#3A3F4A" />
      <path d="M70 226H230" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <path d="M70 238H230" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 4" />
    </g>
  );
}

function Cufflinks({ p }: { p: Pal }) {
  const metal = p.base;
  return (
    <g transform="translate(150 220) scale(1.35) translate(-150 -222)">
      {[
        [112, 190],
        [190, 222],
      ].map(([x, y]) => (
        <g key={x}>
          <rect x={x - 5} y={y + 26} width="10" height="34" rx="4" fill={p.dark} />
          <rect x={x - 16} y={y + 56} width="32" height="10" rx="5" fill={p.dark} />
          <circle cx={x} cy={y} r="34" fill={metal} stroke={p.darker} strokeWidth="3" />
          <circle cx={x} cy={y} r="22" fill="none" stroke={p.line} strokeWidth="2" />
          <path d={`M${x - 20} ${y - 14}Q${x - 6} ${y - 30} ${x + 14} ${y - 24}`} stroke="white" strokeWidth="4" opacity=".45" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Generic({ p }: { p: Pal }) {
  return (
    <g>
      <Hanger />
      <path d={SHIRT} fill={p.base} />
      <path d="M128 70Q150 90 172 70" fill="none" stroke={p.line} strokeWidth="2" />
    </g>
  );
}

/** Product illustration shown wherever a product has no photo yet. */
export function GarmentArt({
  category,
  title,
  color,
  label,
  className,
}: {
  category?: string;
  /** Product title: picks the exact shape (e.g. "Silk Tie" vs "Leather Belt" in Accessories). */
  title?: string;
  /** Hex (#1E2A3F) or colour name ("Navy"). */
  color?: string;
  label?: string;
  className?: string;
}) {
  const kind = garmentKind(category, title);
  const p = palette(color);
  return (
    <div className={cn('relative flex h-full w-full items-center justify-center overflow-hidden bg-surface-2', className)}>
      <svg aria-hidden className="absolute inset-0 h-full w-full text-line" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="epic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0v20" fill="none" stroke="currentColor" strokeWidth=".5" />
          </pattern>
          <radialGradient id="epic-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity=".09" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="300" height="400" fill="url(#epic-grid)" opacity=".45" />
        <rect width="300" height="400" fill="url(#epic-glow)" />
      </svg>
      <svg aria-hidden viewBox="0 0 300 400" className="relative h-[82%] w-[82%] drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)]">
        {(kind === 'suit' || kind === 'double' || kind === 'tuxedo' || kind === 'shawl' || kind === 'blazer') && <Jacket p={p} kind={kind} />}
        {kind === 'coat' && <Coat p={p} />}
        {kind === 'shirt' && <Shirt p={p} />}
        {kind === 'tuxshirt' && <Shirt p={p} tux />}
        {kind === 'pants' && <Pants p={p} />}
        {kind === 'sweater' && <Sweater p={p} />}
        {kind === 'tie' && <Tie p={p} />}
        {kind === 'bowtie' && <BowTie p={p} />}
        {kind === 'belt' && <Belt p={p} />}
        {kind === 'pocketsquare' && <PocketSquare p={p} />}
        {kind === 'cufflinks' && <Cufflinks p={p} />}
        {(kind === 'oxford' || kind === 'patent' || kind === 'loafer' || kind === 'driver' || kind === 'sneaker' || kind === 'boot') && (
          <Shoes p={p} style={kind} />
        )}
        {kind === 'generic' && <Generic p={p} />}
      </svg>
      {label && (
        <span className="absolute bottom-4 left-4 right-4 truncate font-display text-[10px] uppercase tracking-label text-subtle">
          {label}
        </span>
      )}
    </div>
  );
}
