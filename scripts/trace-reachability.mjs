#!/usr/bin/env node
// Static reachability tracer for the Astro app.
// Roots = every file under src/pages/ (Astro file-based routing).
// Follows static + dynamic imports across .astro/.ts/.tsx/.js/.jsx, which
// off-the-shelf tools (madge, dependency-cruiser) cannot do for .astro.
//
//   node scripts/trace-reachability.mjs                    # this repo (defaults below)
//   node scripts/trace-reachability.mjs --graph            # also writes graph.dot
//
// PORTABLE — copy this file into any JS/TS project and point it at that project:
//   node trace-reachability.mjs --src app --roots app/server.ts,app/cli.ts
//   node trace-reachability.mjs --src . --ext .ts,.tsx --roots src/index.ts
//
// Options:
//   --src <dir>     folder to scan          (default: "src")
//   --roots <list>  comma-separated entry files/dirs to start from
//                   (default: auto-detect — src/pages, else src/index.* / main.*)
//   --ext <list>    comma-separated file extensions to follow
//   --report        print "what consumes what" for every file (direction in words)
//   --graph         also write graph.dot   (render: dot -Tsvg graph.dot -o graph.svg)
//   --html          write graph.html — an interactive explorer (open in a browser)
//
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : dflt;
};

const SRC = path.resolve(opt("--src", "src"));
const EXTS = opt("--ext", ".astro,.ts,.tsx,.js,.jsx,.mjs,.cjs,.vue,.svelte").split(",");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// Resolve an import specifier to a real file on disk (relative imports only).
function resolve(fromFile, spec) {
  if (!spec.startsWith(".")) return null; // bare module / alias / URL — skip
  const base = path.resolve(path.dirname(fromFile), spec);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of EXTS) if (existsSync(base + ext)) return base + ext;
  for (const ext of EXTS) {
    const idx = path.join(base, "index" + ext);
    if (existsSync(idx)) return idx;
  }
  return null;
}

const IMPORT_RE =
  /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function importsOf(file) {
  const code = readFileSync(file, "utf8");
  const out = [];
  for (const m of code.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2];
    const target = resolve(file, spec);
    if (target) out.push(target);
  }
  return out;
}

const allFiles = walk(SRC).filter((f) => EXTS.includes(path.extname(f)));

// Entry points = where execution begins. Override with --roots; otherwise guess
// using common conventions (Astro/Next file routing, then an index/main file).
function detectRoots() {
  const explicit = opt("--roots", null);
  if (explicit) {
    return explicit.split(",").flatMap((r) => {
      const abs = path.resolve(r);
      if (!existsSync(abs)) return [];
      return statSync(abs).isDirectory()
        ? allFiles.filter((f) => f.startsWith(abs + path.sep))
        : [abs];
    });
  }
  const pagesDir = path.join(SRC, "pages"); // Astro / Next.js pages router
  if (existsSync(pagesDir)) return allFiles.filter((f) => f.startsWith(pagesDir + path.sep));
  const indexish = ["index", "main", "app", "server", "cli"].flatMap((n) =>
    EXTS.map((e) => path.join(SRC, n + e)),
  );
  return indexish.filter(existsSync);
}

const roots = detectRoots();
if (roots.length === 0) {
  console.error(`No entry points found under ${SRC}. Pass --roots <file-or-dir,...>`);
  process.exit(1);
}

const reachable = new Set();
const edges = []; // [fromRel, toRel] among reachable files, for the graph
const queue = [...roots];
while (queue.length) {
  const f = queue.shift();
  if (reachable.has(f)) continue;
  reachable.add(f);
  for (const dep of importsOf(f)) if (!reachable.has(dep)) queue.push(dep);
}
// Collect edges only after the reachable set is known.
for (const f of reachable)
  for (const dep of importsOf(f))
    if (reachable.has(dep)) edges.push([path.relative(SRC, f), path.relative(SRC, dep)]);

const rel = (f) => path.relative(SRC, f);
const dead = allFiles.filter((f) => !reachable.has(f)).map(rel).sort();

// Adjacency in both directions. This — not the picture — is the precise answer
// to "what consumes what": for any file, who imports it and what it imports.
const push = (map, k, v) => map.set(k, [...(map.get(k) || []), v]);
const consumes = new Map();    // file  ->  files IT imports
const consumedBy = new Map();  // file  ->  files that import IT
for (const [from, to] of edges) {
  push(consumes, from, to);
  push(consumedBy, to, from);
}
const inDeg = (f) => (consumedBy.get(rel(f)) || []).length;

console.log(`Entry points (roots): ${roots.length}`);
console.log(`Reachable from roots: ${reachable.size}/${allFiles.length}\n`);
console.log(`DEAD (never imported by any route): ${dead.length}`);
for (const f of dead) console.log("  " + f);

// Hubs = files the most other files depend on. Start reading a codebase here.
const hubs = [...consumedBy.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8);
console.log(`\nTOP HUBS (count = how many files consume it):`);
for (const [f, by] of hubs) console.log(`  ${String(by.length).padStart(2)} ← ${f}`);

if (process.argv.includes("--report")) {
  console.log(`\n=== WHAT CONSUMES WHAT (reference report) ===`);
  for (const f of [...reachable].map(rel).sort()) {
    const ins = (consumedBy.get(f) || []).sort();
    const outs = (consumes.get(f) || []).sort();
    console.log(`\n${f}`);
    console.log(`   consumed by (${ins.length}): ${ins.join(", ") || "— entry point / nothing local"}`);
    console.log(`   consumes    (${outs.length}): ${outs.join(", ") || "— leaf / nothing local"}`);
  }
}

if (process.argv.includes("--graph")) {
  // Group nodes into graphviz clusters by their top-level src/ folder
  // (pages, layouts, components, lib) so the diagram reads as layers.
  const groupOf = (f) => f.split("/")[0];
  const byGroup = new Map();
  for (const f of reachable) {
    const g = groupOf(rel(f));
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(rel(f));
  }
  // Darker fill = more files consume it (a hub). Makes direction-of-dependence visible.
  const fillFor = (f) => (inDeg(f) >= 6 ? "#f4a259" : inDeg(f) >= 2 ? "#ffe2bd" : "#f5f5f5");
  const lines = [
    "digraph deps {",
    "  rankdir=LR; labelloc=t; fontname=Helvetica;",
    '  label="Arrow  A -> B  means: A imports (consumes) B.\\lDarker box = consumed by more files = a hub; start reading there.\\l";',
    '  node [shape=box, style="rounded,filled", fillcolor="#f5f5f5", fontname="Helvetica", fontsize=10];',
    '  edge [color="#bbbbbb", arrowsize=0.8];',
  ];
  for (const [g, files] of byGroup) {
    lines.push(`  subgraph "cluster_${g}" {`, `    label="${g}"; color="#cccccc";`);
    for (const f of files.sort()) lines.push(`    "${f}" [fillcolor="${fillFor(path.join(SRC, f))}"];`);
    lines.push("  }");
  }
  for (const [from, to] of edges) lines.push(`  "${from}" -> "${to}";`);
  lines.push("}");
  writeFileSync("graph.dot", lines.join("\n") + "\n");
  console.log("\nWrote graph.dot — render with: dot -Tsvg graph.dot -o graph.svg");
}

if (process.argv.includes("--html")) {
  // Build the FULL graph (alive + dead) so the explorer can show both.
  const allSet = new Set(allFiles);
  const htmlNodes = allFiles.map((f) => ({ id: rel(f), group: rel(f).split("/")[0], dead: !reachable.has(f) }));
  const htmlEdges = [];
  for (const f of allFiles)
    for (const dep of importsOf(f))
      if (allSet.has(dep)) htmlEdges.push([rel(f), rel(dep)]);
  const dataJson = JSON.stringify({ nodes: htmlNodes, edges: htmlEdges });

  const html = `<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>
try{
  var _t=localStorage.getItem("artlu-theme");
  document.documentElement.dataset.theme = (_t === "dark" || _t === "light")
    ? _t
    : (window.matchMedia("(max-width: 720px)").matches ? "light" : "dark");
}catch(e){
  document.documentElement.dataset.theme = "dark";
}
</script>
<title>Dependency Explorer</title>
<style>
  html[data-theme="dark"] {
    color-scheme:dark;
    --bg:#21211d; --surface:#0f0f0e; --surface-2:#181816;
    --border:#42403a; --border-strong:#514e47; --border-hover:#5c5b52;
    --text:#fff7d4; --text-bright:#fffff1; --text-sub:#eddbba;
    --dim:#d6c3a4; --dimmer:#ddcaab;
    --green:#6ad39e; --green-bg:#1a291f; --green-border:#45654c;
    --blue:#7da9d1; --amber:#ffffae; --amber-bg:#2a210d; --amber-border:#876e3d;
    --pink:#e58ab0;
    --port:#2f2e2a; --wire:#3b3934; --wire-on:#6ad39e; --grid-line:transparent; --timeline:#3b3934;
    --node-shadow:0 8px 26px rgba(0,0,0,0.6);
    --font:'Inter',system-ui,sans-serif;
    --mono:'IBM Plex Mono','SF Mono',Consolas,monospace;
    --graph-bg:#141412; --node:#2f2e2a; --node-dead:#1c1c1a; --node-selected:#1a291f;
    --node-hub:#5b421d; --edge:#6f6b61; --edge-faded:#514e47; --up:#e58ab0; --down:#7da9d1;
  }
  html[data-theme="light"] {
    color-scheme:light;
    --bg:#e9eaec; --surface:#ffffff; --surface-2:#f2f3f5;
    --border:#dcdfe2; --border-strong:#b7bcc3; --border-hover:#9ba0a8;
    --text:#34373c; --text-bright:#15171a; --text-sub:#50545a;
    --dim:#676c74; --dimmer:#9298a0;
    --green:#0a7d5e; --green-bg:#e6f4ee; --green-border:#a9ddc9;
    --blue:#2563eb; --amber:#8a6300; --amber-bg:#f3e9d2; --amber-border:#d3b16d;
    --pink:#be185d;
    --port:#d7dce1; --wire:#c8cdd3; --wire-on:#0a7d5e; --grid-line:transparent; --timeline:#c8cdd3;
    --node-shadow:0 1px 2px rgba(22,24,27,0.07), 0 4px 14px rgba(22,24,27,0.06);
    --font:'Inter',system-ui,sans-serif;
    --mono:'IBM Plex Mono','SF Mono',Consolas,monospace;
    --graph-bg:#f2f3f5; --node:#ffffff; --node-dead:#f3f4f6; --node-selected:#e6f4ee;
    --node-hub:#f3e9d2; --edge:#9298a0; --edge-faded:#c8cdd3; --up:#be185d; --down:#2563eb;
  }
  *{box-sizing:border-box;} html{background:var(--bg);} body{margin:0;display:flex;height:100vh;font-family:var(--font);font-size:14px;color:var(--text);background:var(--bg);-webkit-font-smoothing:antialiased;}
  button,input{font:inherit;} input[type=checkbox]{accent-color:var(--green);}
  #side{width:330px;flex:0 0 330px;border-right:1px solid var(--border);background:var(--surface);padding:16px;overflow:auto;box-shadow:var(--node-shadow);z-index:2;}
  #main{flex:1;overflow:auto;background:var(--graph-bg);}
  .toprow{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
  h1{font-size:16px;margin:0;color:var(--text-bright);font-weight:600;}
  .theme-tog{margin-left:auto;width:30px;height:28px;border:1px solid var(--border);background:transparent;color:var(--text-sub);border-radius:5px;cursor:pointer;font-size:13px;line-height:1;}
  .theme-tog:hover{border-color:var(--border-hover);color:var(--text-bright);}
  p.hint{font-size:12px;color:var(--text-sub);line-height:1.5;margin:6px 0 12px;}
  .down{color:var(--down);} .up{color:var(--up);}
  input[type=search]{width:100%;padding:6px 8px;border:1px solid var(--border-strong);border-radius:6px;font-size:13px;margin-bottom:8px;background:var(--surface-2);color:var(--text-bright);}
  input[type=search]::placeholder{color:var(--dimmer);}
  label.ctl{display:flex;align-items:center;gap:6px;font-size:13px;margin:6px 0;cursor:pointer;color:var(--text);}
  .legend div{font-size:12px;color:var(--text-sub);margin:2px 0;} .legend span{display:inline-block;width:11px;height:11px;border-radius:2px;vertical-align:middle;margin-right:5px;}
  #info{margin-top:14px;font-size:12.5px;line-height:1.5;border-top:1px solid var(--border);padding-top:10px;}
  #info h2{font-size:13px;margin:6px 0 4px;font-family:var(--mono);word-break:break-all;color:var(--text-bright);}
  #info .lab{font-weight:600;margin:8px 0 2px;}
  #info ul{margin:2px 0 4px;padding-left:16px;} #info li{font-family:var(--mono);font-size:11.5px;word-break:break-all;color:var(--text);}
  .node{cursor:pointer;}
  .node rect{fill:var(--node);stroke:var(--border-strong);} .node.hub rect{fill:var(--node-hub);stroke:var(--amber-border);}
  .node.dead rect{fill:var(--node-dead);stroke:var(--border);stroke-dasharray:3 2;} .node text{font:11px var(--mono);fill:var(--text-bright);} .node.dead text{fill:var(--dimmer);}
  .node.sel rect{stroke:var(--green);stroke-width:2.5;fill:var(--node-selected);} .node.down rect{stroke:var(--down);stroke-width:1.8;} .node.up rect{stroke:var(--up);stroke-width:1.8;}
  .node.match rect{stroke:var(--green);stroke-width:2.4;} .node.faded{opacity:.1;}
  .colhead{font:600 12px var(--font);fill:var(--dim);text-transform:uppercase;letter-spacing:.04em;}
  .marker-edge{fill:var(--edge);} .marker-down{fill:var(--down);} .marker-up{fill:var(--up);} .marker-faded{fill:var(--edge-faded);}
  /* Edges are HIDDEN by default — the canvas stays clean until you focus a file.
     Selecting/hovering a node reveals only that file's links (down/up). */
  .edge{stroke:var(--edge);stroke-width:1;fill:none;display:none;marker-end:url(#arrow-edge);}
  svg.show-all .edge{display:inline;opacity:.10;}
  .edge.down{display:inline;stroke:var(--down);opacity:.95;stroke-width:1.7;marker-end:url(#arrow-down);}
  .edge.up{display:inline;stroke:var(--up);opacity:.95;stroke-width:1.7;marker-end:url(#arrow-up);}
  .edge.faded{display:none;}
  svg.hide-dead .node.dead,svg.hide-dead .edge.deadedge{display:none;}
</style></head>
<body>
<div id="side">
  <div class="toprow"><h1>Dependency Explorer</h1><button type="button" class="theme-tog" id="theme" title="toggle theme" aria-label="toggle theme">◐</button></div>
  <p class="hint"><b>Click a file</b> to reveal its links — they stay hidden until you do, so the canvas stays clean. Arrows point importer&rarr;imported: <b class="down">blue</b> = what it consumes, <b class="up">pink</b> = who consumes it. Click empty space to reset.</p>
  <input id="search" type="search" placeholder="filter files...">
  <label class="ctl"><input type="checkbox" id="trans" checked> trace the whole chain (transitive)</label>
  <label class="ctl"><input type="checkbox" id="alllinks"> show all links faintly (overview)</label>
  <label class="ctl"><input type="checkbox" id="dead"> show dead code</label>
  <div class="legend">
    <div><span style="background:var(--node-hub);border:1px solid var(--amber-border)"></span>hub (consumed by many)</div>
    <div><span style="background:var(--node);border:1px solid var(--border-strong)"></span>live file</div>
    <div><span style="background:var(--node-dead);border:1px dashed var(--border)"></span>dead file</div>
  </div>
  <div id="info"><p class="hint">Nothing selected.</p></div>
</div>
<div id="main"><svg id="svg" class="hide-dead" xmlns="http://www.w3.org/2000/svg"><defs><marker id="arrow-edge" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path class="marker-edge" d="M0,0 L8,4 L0,8 z"></path></marker><marker id="arrow-down" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path class="marker-down" d="M0,0 L8,4 L0,8 z"></path></marker><marker id="arrow-up" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path class="marker-up" d="M0,0 L8,4 L0,8 z"></path></marker><marker id="arrow-faded" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path class="marker-faded" d="M0,0 L8,4 L0,8 z"></path></marker></defs><g id="edges"></g><g id="nodes"></g></svg></div>
<script>
const DATA = ${dataJson};
(function(){
  var NS="http://www.w3.org/2000/svg", SEP="|", COLW=255, ROWH=30, NW=216, NH=22, PADX=20, PADY=64;
  var order=["pages","layouts","components","scripts","styles","lib"];
  var svg=document.getElementById("svg"), gE=document.getElementById("edges"), gN=document.getElementById("nodes"), info=document.getElementById("info");
  document.getElementById("theme").addEventListener("click",function(){
    var root=document.documentElement;
    var next=root.dataset.theme==="light"?"dark":"light";
    root.dataset.theme=next;
    try{localStorage.setItem("artlu-theme",next);}catch(e){}
  });
  var out={}, inn={}, deadMap={};
  DATA.nodes.forEach(function(n){ deadMap[n.id]=n.dead; });
  DATA.edges.forEach(function(e){ (out[e[0]]=out[e[0]]||[]).push(e[1]); (inn[e[1]]=inn[e[1]]||[]).push(e[0]); });
  function ci(g){ var i=order.indexOf(g); return i<0?order.length:i; }
  var cols={};
  DATA.nodes.forEach(function(n){ var c=ci(n.group); (cols[c]=cols[c]||[]).push(n); });
  var pos={}, maxRows=0, colKeys=Object.keys(cols).map(Number).sort(function(a,b){return a-b;});
  colKeys.forEach(function(c){ cols[c].sort(function(a,b){return a.id<b.id?-1:1;}); maxRows=Math.max(maxRows,cols[c].length);
    cols[c].forEach(function(n,i){ pos[n.id]={x:PADX+colKeys.indexOf(c)*COLW, y:PADY+i*ROWH}; }); });
  svg.setAttribute("width", PADX*2+colKeys.length*COLW); svg.setAttribute("height", PADY+maxRows*ROWH+24);
  function mk(t){return document.createElementNS(NS,t);}
  colKeys.forEach(function(c,idx){ var t=mk("text"); t.setAttribute("x",PADX+idx*COLW); t.setAttribute("y",44); t.setAttribute("class","colhead"); t.textContent=(order[c]||"other"); gN.appendChild(t); });
  var edgeEls={};
  DATA.edges.forEach(function(e){ var s=pos[e[0]],t=pos[e[1]]; if(!s||!t)return;
    var forward=t.x>=s.x, x1=forward?s.x+NW:s.x, y1=s.y+NH/2, x2=(forward?t.x:t.x+NW)+(forward?-8:8), y2=t.y+NH/2, mx=(x1+x2)/2;
    var p=mk("path"); p.setAttribute("d","M"+x1+" "+y1+" C "+mx+" "+y1+" "+mx+" "+y2+" "+x2+" "+y2);
    var cls="edge"; if(deadMap[e[0]]||deadMap[e[1]])cls+=" deadedge"; p.setAttribute("class",cls);
    gE.appendChild(p); edgeEls[e[0]+SEP+e[1]]=p; });
  var nodeEls={};
  DATA.nodes.forEach(function(n){ var p=pos[n.id]; if(!p)return;
    var g=mk("g"), cls="node"; if(n.dead)cls+=" dead"; if((inn[n.id]||[]).length>=6)cls+=" hub";
    g.setAttribute("class",cls); g.setAttribute("transform","translate("+p.x+","+p.y+")");
    var r=mk("rect"); r.setAttribute("width",NW); r.setAttribute("height",NH); r.setAttribute("rx",5);
    var tx=mk("text"); tx.setAttribute("x",8); tx.setAttribute("y",15); tx.textContent=n.id;
    g.appendChild(r); g.appendChild(tx);
    g.addEventListener("click",function(ev){ev.stopPropagation();paint(n.id,true);});
    g.addEventListener("mouseenter",function(){ if(!selected)paint(n.id,false); });
    g.addEventListener("mouseleave",function(){ if(!selected)reset(); });
    gN.appendChild(g); nodeEls[n.id]=g; });
  function walk(start,adj,lim){ var ns={},ek={},q=[[start,0]];
    while(q.length){ var it=q.shift(),n=it[0],d=it[1]; if(lim&&d>=lim)continue;
      (adj[n]||[]).forEach(function(m){ var k=(adj===out)?(n+SEP+m):(m+SEP+n); ek[k]=true; if(!ns[m]){ns[m]=true;q.push([m,d+1]);} }); }
    return {ns:ns,ek:ek}; }
  var selected=null;
  function reset(){ selected=null;
    Object.keys(nodeEls).forEach(function(id){ nodeEls[id].classList.remove("faded","sel","up","down","match"); });
    Object.keys(edgeEls).forEach(function(k){ edgeEls[k].classList.remove("up","down","faded"); });
    info.innerHTML='<p class="hint">Nothing selected.</p>'; }
  function paint(id,sticky){ if(sticky)selected=id;
    var lim = sticky ? (document.getElementById("trans").checked?0:1) : 1;
    var dn=walk(id,out,lim), up=walk(id,inn,lim);
    Object.keys(nodeEls).forEach(function(nid){ var c=nodeEls[nid].classList; c.remove("faded","sel","up","down","match");
      if(nid===id)c.add("sel"); else if(dn.ns[nid])c.add("down"); else if(up.ns[nid])c.add("up"); else c.add("faded"); });
    Object.keys(edgeEls).forEach(function(k){ var c=edgeEls[k].classList; c.remove("up","down","faded");
      if(dn.ek[k])c.add("down"); else if(up.ek[k])c.add("up"); else c.add("faded"); });
    renderInfo(id,dn,up); }
  function lst(arr){ return (arr&&arr.length)? "<ul>"+arr.slice().sort().map(function(x){return "<li>"+x+"</li>";}).join("")+"</ul>" : '<p class="hint" style="margin:0">none</p>'; }
  function renderInfo(id,dn,up){ var dc=Object.keys(dn.ns).length, uc=Object.keys(up.ns).length;
    info.innerHTML = "<h2>"+id+"</h2>"
      + (deadMap[id]?'<p class="hint" style="color:#b45309;margin:0">dead code &mdash; not reached by any route</p>':"")
      + '<p class="lab down">Consumes (direct '+((out[id]||[]).length)+')</p>'+lst(out[id])
      + '<p class="lab up">Consumed by (direct '+((inn[id]||[]).length)+')</p>'+lst(inn[id])
      + '<p class="hint" style="margin-top:8px">Reaches '+dc+' downstream &middot; '+uc+' upstream'+(document.getElementById("trans").checked?"":" (direct only)")+'</p>'; }
  svg.addEventListener("click",function(){reset();});
  document.getElementById("trans").addEventListener("change",function(){ if(selected)paint(selected,true); });
  document.getElementById("dead").addEventListener("change",function(e){ svg.classList.toggle("hide-dead",!e.target.checked); });
  document.getElementById("alllinks").addEventListener("change",function(e){ svg.classList.toggle("show-all",e.target.checked); });
  document.getElementById("search").addEventListener("input",function(e){ var v=e.target.value.trim().toLowerCase(); reset();
    if(v) Object.keys(nodeEls).forEach(function(id){ var c=nodeEls[id].classList; if(id.toLowerCase().indexOf(v)>=0)c.add("match"); else c.add("faded"); }); });
})();
</script>
</body></html>
`;
  writeFileSync("graph.html", html);
  console.log("\nWrote graph.html — open it in a browser (self-contained, no server needed).");
}
