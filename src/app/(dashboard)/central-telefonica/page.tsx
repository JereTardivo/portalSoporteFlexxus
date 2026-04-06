"use client";

const R=52, G="#94a3b8", OR="#f97316";
// Y offsets: L1 top=130, L2 top=104, L3 top=0  → canvas H=338
const L1Y=130, L2Y=104, L3Y=0, CH=338;
// X: [central 148][line 40][trunk 14=202] rows [gap 36][trunk 14] rows [gap 36][trunk 14] rows
const CW=148, L1TX=188, L1X=202, NW=32, P1W=192, P2W=152, P3W=156;
const L2TX=L1X+NW+8+P1W+36; // 470
const L2X=L2TX+14;           // 484
const L3TX=L2X+NW+8+P2W+36; // 712
const L3X=L3TX+14;           // 726
const CW2=L3X+NW+8+P3W+20;  // canvas width ~954
const cy=(y:number,i:number)=>y+i*R+R/2;
const L1MID=234; // (cy(L1Y,0)+cy(L1Y,3))/2

function Num({n,orange=false}:{n:number;orange?:boolean}){
  return <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm" style={{width:NW,height:NW,background:orange?OR:"#fff",color:orange?"#fff":"#374151",border:`2px solid ${orange?OR:G}`}}>{n}</div>;
}
function Pill({children,blue=false,w}:{children:React.ReactNode;blue?:boolean;w:number}){
  return <div className="flex-shrink-0 flex items-center justify-center rounded-full border-2 font-semibold text-xs text-center px-3 py-1" style={{width:w,borderColor:blue?"#3b82f6":G,background:"#fff",color:blue?"#1d4ed8":"#1e293b",whiteSpace:"pre-line"}}>{children}</div>;
}

export default function CentralTelefonicaPage() {
  // ── Data ─────────────────────────────────────────────────────────────────
  const l1 = [
    { n: 1, label: "COMERCIAL",        orange: false },
    { n: 2, label: "ATENCIÓN AL\nCLIENTE", orange: true },
    { n: 3, label: "SOPORTE\nPARTNER", orange: false },
    { n: 4, label: "ADMINISTRACIÓN",   orange: false },
  ];
  const l2 = [
    { n: 1, label: "ERP",                    orange: true,  blue: false },
    { n: 2, label: "DATACENTER\n0351-5691101", orange: false, blue: true  },
    { n: 3, label: "ECOMMERCE",              orange: false, blue: false },
    { n: 4, label: "BI",                     orange: false, blue: false },
  ];
  const l3 = [
    { n: 1, label: "SOPORTE",        orange: true  },
    { n: 2, label: "IMPLEMENTACIÓN", orange: false },
    { n: 3, label: "DESARROLLO",     orange: false },
    { n: 4, label: "MANTENIMIENTO",  orange: false },
    { n: 5, label: "INTEGRACIONES",  orange: false },
  ];

  // ── Geometry (all px) ────────────────────────────────────────────────────
  // Row heights & Y offsets (computed so L3 top >= 0):
  //   L1[1] connects to L2 → L2 centred on L1[1]  → L2Y = 104
  //   L2[0] connects to L3 → L3 centred on L2[0]  → L3Y = 0
  //   L1 top padded to 130 so L2 vertical trunk stays positive
  const R = 52;
  const L1Y = 130, L2Y = 104, L3Y = 0, CANVAS_H = 338;

  // X layout: [central 148][h-line 40][trunk 14][rows…] [gap 36][trunk 14][rows…] [gap 36][trunk 14][rows…]
  const CW = 148;   // central box width
  const L1TX = 188; // L1 trunk x
  const L1X  = 202; // L1 rows start
  const NW = 32;    // circle diameter
  const P1W = 192, P2W = 152, P3W = 156; // pill widths
  const L2TX = L1X + NW + 8 + P1W + 36;  // 470
  const L2X  = L2TX + 14;                 // 484
  const L3TX = L2X + NW + 8 + P2W + 36;  // 712
  const L3X  = L3TX + 14;                 // 726
  const CANVAS_W = L3X + NW + 8 + P3W + 20; // ~942

  // Centre y of a row
  const cy = (yOff: number, row: number) => yOff + row * R + R / 2;

  // SVG line data for all connectors
  const lines = [
    // central → L1 trunk midpoint  (y=234 = midpoint of rows 0–3)
    { x1: CW, y1: 234, x2: L1TX, y2: 234, arrow: true },
    // L1 vertical trunk
    { x1: L1TX, y1: cy(L1Y,0), x2: L1TX, y2: cy(L1Y,3), arrow: false },
    // L1 stubs
    ...([0,1,2,3] as const).map(i => ({ x1: L1TX, y1: cy(L1Y,i), x2: L1X, y2: cy(L1Y,i), arrow: true })),
    // L1[1] → L2 trunk
    { x1: L1X+NW+8+P1W, y1: cy(L1Y,1), x2: L2TX, y2: cy(L1Y,1), arrow: true },
    // L2 vertical trunk
    { x1: L2TX, y1: cy(L2Y,0), x2: L2TX, y2: cy(L2Y,3), arrow: false },
    // L2 stubs
    ...([0,1,2,3] as const).map(i => ({ x1: L2TX, y1: cy(L2Y,i), x2: L2X, y2: cy(L2Y,i), arrow: true })),
    // L2[0] → L3 trunk
    { x1: L2X+NW+8+P2W, y1: cy(L2Y,0), x2: L3TX, y2: cy(L2Y,0), arrow: true },
    // L3 vertical trunk
    { x1: L3TX, y1: cy(L3Y,0), x2: L3TX, y2: cy(L3Y,4), arrow: false },
    // L3 stubs
    ...([0,1,2,3,4] as const).map(i => ({ x1: L3TX, y1: cy(L3Y,i), x2: L3X, y2: cy(L3Y,i), arrow: true })),
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Central Telefónica</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Árbol de opciones del sistema de atención telefónica</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 overflow-x-auto">
        <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>

          {/* ── SVG connector lines ── */}
          <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H}>
            <defs>
              <marker id="ah" viewBox="0 0 8 8" refX="7" refY="4"
                markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill={G} />
              </marker>
            </defs>
            {lines.map((l, i) => (
              <line
                key={i}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={G} strokeWidth={1.5}
                markerEnd={l.arrow ? "url(#ah)" : undefined}
              />
            ))}
          </svg>

          {/* ── Central box ── */}
          <div
            className="absolute border-2 border-orange-400 bg-orange-50 rounded-lg px-3 py-2 text-center"
            style={{ left: 0, top: 234 - 56, width: CW }}
          >
            <p className="font-bold text-orange-900 text-xs leading-snug">CENTRAL TELEFÓNICA</p>
            <div className="mt-1 space-y-px">
              <p className="text-xs text-orange-800 font-mono font-bold">0810-122-9987</p>
              <p className="text-[10px] text-orange-600">o</p>
              <p className="text-xs text-orange-800 font-mono font-bold">0351-5685000</p>
            </div>
            <div className="mt-1 border-t border-orange-200 pt-1">
              <p className="text-[10px] text-orange-700">(Interno 3CX: <strong>7777</strong>)</p>
            </div>
          </div>

          {/* ── L1 rows ── */}
          {l1.map((item, i) => (
            <div key={i} className="absolute flex items-center gap-2"
              style={{ left: L1X, top: L1Y + i * R, height: R }}>
              <Num n={item.n} orange={item.orange} />
              <Pill w={P1W}>{item.label}</Pill>
            </div>
          ))}

          {/* ── L2 rows ── */}
          {l2.map((item, i) => (
            <div key={i} className="absolute flex items-center gap-2"
              style={{ left: L2X, top: L2Y + i * R, height: R }}>
              <Num n={item.n} orange={item.orange} />
              <Pill w={P2W} blue={item.blue}>{item.label}</Pill>
            </div>
          ))}

          {/* ── L3 rows ── */}
          {l3.map((item, i) => (
            <div key={i} className="absolute flex items-center gap-2"
              style={{ left: L3X, top: L3Y + i * R, height: R }}>
              <Num n={item.n} orange={item.orange} />
              <Pill w={P3W}>{item.label}</Pill>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: OR }}>N</div>
            <span>Opción destacada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border-2 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300"
              style={{ borderColor: G }}>N</div>
            <span>Opción estándar</span>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-6 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-xl p-5">
        <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-3">Referencia rápida — Soporte ERP</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {[
            { path: "2 → 1 → 1", label: "Soporte" },
            { path: "2 → 1 → 2", label: "Implementación" },
            { path: "2 → 1 → 3", label: "Desarrollo" },
            { path: "2 → 1 → 4", label: "Mantenimiento" },
            { path: "2 → 1 → 5", label: "Integraciones" },
            { path: "2 → 2",     label: "Datacenter" },
            { path: "2 → 3",     label: "Ecommerce" },
            { path: "2 → 4",     label: "BI" },
          ].map((r) => (
            <div key={r.label} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-orange-200 dark:border-orange-800/50">
              <p className="font-semibold text-slate-700 dark:text-slate-200">{r.label}</p>
              <p className="text-orange-700 dark:text-orange-400 font-mono text-xs mt-1">{r.path}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-orange-700 dark:text-orange-400">
          Llamar al <strong>0810-122-9987</strong> ó <strong>0351-5685000</strong> · Interno 3CX: <strong>7777</strong>
        </p>
      </div>

      {/* Cola de llamada por equipo */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <h3 className="font-bold text-blue-800 dark:text-blue-300">Cola de llamada por equipo</h3>
          <span className="text-xs text-blue-500 dark:text-blue-400 font-normal ml-1">— para traspasos internos 3CX</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { equipo: "Equipo 1",       cola: "1014" },
            { equipo: "Equipo 2",       cola: "1015" },
            { equipo: "Equipo 3",       cola: "1016" },
            { equipo: "Equipo 4",       cola: "1008" },
            { equipo: "Equipo 5",       cola: "1040" },
            { equipo: "Equipo Corralón", cola: "1024" },
          ].map((item) => (
            <div key={item.equipo} className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800/50 p-3 text-center hover:border-blue-400 transition-colors">
              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide leading-tight">{item.equipo}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">{item.cola}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Cola 3CX</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
          Para transferir una llamada: en 3CX marcá el número de cola del equipo destino.
        </p>
      </div>
    </div>
  );
}
