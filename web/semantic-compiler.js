window.__compilerReady = (async function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được ' + src));
      document.head.appendChild(script);
    });
  }

  function patchSemantic8(source) {
    const parseStart = source.indexOf('function parseSvg(');
    const parseEnd = source.indexOf('\n\nfunction prefixIds', parseStart);
    if (parseStart < 0 || parseEnd < 0) throw new Error('Không tìm thấy hàm parseSvg trong semantic-8.js');

    const parseReplacement = `function parseSvg(text,state){
 const doc=new DOMParser().parseFromString(text,'image/svg+xml');
 const parserError=doc.querySelector('parsererror');
 if(parserError)throw new Error('SVG AST không hợp lệ ở state '+(state&&state.name||state&&state.id||'unknown')+': '+parserError.textContent.slice(0,180));
 const svg=doc.documentElement;
 const entries=Array.isArray(state&&state.svgNodeMap)?state.svgNodeMap:[];
 const mapped=new Map();
 const graphics=[...svg.querySelectorAll('g,rect,circle,ellipse,line,path,polygon,polyline,text,image')].filter(el=>!el.closest('defs'));
 const used=new Set();
 function nums(value){return(String(value||'').match(/-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/gi)||[]).map(Number)}
 function translateOf(el){const value=el&&el.getAttribute&&el.getAttribute('transform')||'';const m=value.match(/translate\\(\\s*(-?\\d*\\.?\\d+)(?:[ ,]+(-?\\d*\\.?\\d+))?/i);return m?{x:Number(m[1])||0,y:Number(m[2])||0}: {x:0,y:0}}
 function ownBox(el){
  if(!el)return null;const tag=String(el.tagName||'').toLowerCase(),tr=translateOf(el),n=v=>Number(v)||0;
  if(tag==='rect'||tag==='image')return{x:n(el.getAttribute('x'))+tr.x,y:n(el.getAttribute('y'))+tr.y,width:n(el.getAttribute('width')),height:n(el.getAttribute('height'))};
  if(tag==='circle'){const cx=n(el.getAttribute('cx'))+tr.x,cy=n(el.getAttribute('cy'))+tr.y,r=n(el.getAttribute('r'));return{x:cx-r,y:cy-r,width:r*2,height:r*2}}
  if(tag==='ellipse'){const cx=n(el.getAttribute('cx'))+tr.x,cy=n(el.getAttribute('cy'))+tr.y,rx=n(el.getAttribute('rx')),ry=n(el.getAttribute('ry'));return{x:cx-rx,y:cy-ry,width:rx*2,height:ry*2}}
  if(tag==='line'){const x1=n(el.getAttribute('x1'))+tr.x,y1=n(el.getAttribute('y1'))+tr.y,x2=n(el.getAttribute('x2'))+tr.x,y2=n(el.getAttribute('y2'))+tr.y;return{x:Math.min(x1,x2),y:Math.min(y1,y2),width:Math.abs(x2-x1),height:Math.abs(y2-y1)}}
  if(tag==='path'||tag==='polygon'||tag==='polyline'){const values=nums(el.getAttribute('d')||el.getAttribute('points'));if(values.length<2)return null;const xs=[],ys=[];for(let i=0;i+1<values.length;i+=2){xs.push(values[i]+tr.x);ys.push(values[i+1]+tr.y)}return{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)}}
  if(tag==='text')return{x:n(el.getAttribute('x'))+tr.x,y:n(el.getAttribute('y'))+tr.y,width:0,height:0};
  return null;
 }
 function boxOf(el){
  const own=ownBox(el);if(own)return own;if(String(el&&el.tagName||'').toLowerCase()!=='g')return null;
  const boxes=[...el.querySelectorAll('rect,circle,ellipse,line,path,polygon,polyline,text,image')].map(ownBox).filter(Boolean);if(!boxes.length)return null;
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y)),x2=Math.max(...boxes.map(b=>b.x+b.width)),y2=Math.max(...boxes.map(b=>b.y+b.height));return{x,y,width:x2-x,height:y2-y};
 }
 function compatible(entry,el){
  const expected=String(entry&&entry.tag||'').toLowerCase(),actual=String(el&&el.tagName||'').toLowerCase();
  if(expected===actual)return true;if(expected==='rect'&&actual==='path')return true;if(expected==='ellipse'&&(actual==='circle'||actual==='path'))return true;if(expected==='line'&&actual==='path')return true;return expected==='g'&&actual==='g';
 }
 function score(entry,el){const a=entry&&entry.bounds,b=boxOf(el);if(!a||!b)return Infinity;const scale=Math.max(1,Math.hypot(Number(a.width)||0,Number(a.height)||0));return(Math.abs(b.x-a.x)+Math.abs(b.y-a.y)+Math.abs(b.width-a.width)+Math.abs(b.height-a.height))/scale}
 entries.forEach(entry=>{
  if(String(entry.stableNodeId||'').endsWith(':@root'))return;
  const candidates=[];for(let i=0;i<graphics.length;i++){if(used.has(i)||!compatible(entry,graphics[i]))continue;const value=score(entry,graphics[i]);if(Number.isFinite(value))candidates.push({i,el:graphics[i],score:value})}
  candidates.sort((a,b)=>a.score-b.score);const best=candidates[0],limit=String(entry.tag).toLowerCase()==='g'?.65:.35;
  if(best&&best.score<=limit){used.add(best.i);best.el.setAttribute('data-motion-id',entry.stableNodeId);mapped.set(entry.stableNodeId,best.el)}
 });
 return{state,doc,svg,mapped};
}`;

    let patched = source.slice(0, parseStart) + parseReplacement + source.slice(parseEnd);

    const prefixStart = patched.indexOf('function prefixIds(');
    const prefixEnd = patched.indexOf('\n\nfunction layerMap', prefixStart);
    if (prefixStart < 0 || prefixEnd < 0) throw new Error('Không tìm thấy hàm prefixIds trong semantic-8.js');

    const prefixReplacement = `function prefixIds(node,prefix){
 const clone=node.cloneNode(true),all=[clone,...clone.querySelectorAll('*')];
 all.forEach(el=>{if(el.hasAttribute&&el.hasAttribute('id'))el.setAttribute('id',prefix+el.getAttribute('id'))});
 const attrs=['fill','stroke','filter','clip-path','mask','href','xlink:href','style'];
 all.forEach(el=>attrs.forEach(name=>{if(!el.hasAttribute||!el.hasAttribute(name))return;let value=el.getAttribute(name);value=value.replace(/url\\(#([^\\)]+)\\)/g,(m,id)=>'url(#'+(id.startsWith(prefix)?id:prefix+id)+')');if((name==='href'||name==='xlink:href')&&value.startsWith('#')){const id=value.slice(1);value='#'+(id.startsWith(prefix)?id:prefix+id)}el.setAttribute(name,value)}));
 return clone;
}`;

    patched = patched.slice(0, prefixStart) + prefixReplacement + patched.slice(prefixEnd);
    patched = patched.replace('parsed=states.map(parseSvg)', 'parsed=states.map(state=>parseSvg(state.svg,state))');
    patched = patched.replace(
      "const activeTracks=tracks.filter(t=>!ancestorFallback(t,fallbackIds,states));",
      "const activeTracks=tracks.filter(t=>!ancestorFallback(t,fallbackIds,states));"
    );
    patched = patched.replace(
      "parsed.forEach((ps,i)=>{const d=ps.svg.querySelector('defs');if(d){const p=prefixIds(d,'s'+i+'-');defs.push(p.innerHTML)}});",
      "parsed.forEach((ps,i)=>{const d=ps.svg.querySelector('defs');if(d){const p=prefixIds(d,'s'+i+'-');defs.push(p.innerHTML)}});"
    );
    patched = patched.replace(
      "const clone=prefixIds(base,'base-');",
      "const baseStateIndex=nodes.findIndex(Boolean);const clone=prefixIds(base,'s'+Math.max(0,baseStateIndex)+'-');"
    );
    return patched;
  }

  async function loadPatchedSemantic8() {
    const response = await fetch('semantic-8.js', { cache: 'no-store' });
    if (!response.ok) throw new Error('Không tải được semantic-8.js');
    const source = await response.text();
    const script = document.createElement('script');
    script.textContent = patchSemantic8(source);
    document.head.appendChild(script);
  }

  for (let index = 1; index <= 9; index += 1) {
    if (index === 8) await loadPatchedSemantic8();
    else await loadScript('semantic-' + index + '.js');
  }
})();
