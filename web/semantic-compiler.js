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
 let cursor=0;
 function compatible(entry,el){
  const expected=String(entry&&entry.tag||'').toLowerCase();
  const actual=String(el&&el.tagName||'').toLowerCase();
  if(expected===actual)return true;
  if(expected==='rect'&&actual==='path')return true;
  if(expected==='ellipse'&&(actual==='circle'||actual==='path'))return true;
  if(expected==='line'&&actual==='path')return true;
  if(expected==='g'&&actual==='g')return true;
  return false;
 }
 entries.forEach((entry,index)=>{
  let el=null;
  for(let i=cursor;i<graphics.length;i++){
   if(!used.has(i)&&compatible(entry,graphics[i])){el=graphics[i];used.add(i);cursor=i+1;break}
  }
  if(!el){
   for(let i=0;i<graphics.length;i++){
    if(!used.has(i)&&compatible(entry,graphics[i])){el=graphics[i];used.add(i);break}
   }
  }
  if(!el&&graphics[index]&&!used.has(index)){el=graphics[index];used.add(index)}
  if(el){el.setAttribute('data-motion-id',entry.stableNodeId);mapped.set(entry.stableNodeId,el)}
 });
 return{state,doc,svg,mapped};
}`;

    let patched = source.slice(0, parseStart) + parseReplacement + source.slice(parseEnd);

    const prefixStart = patched.indexOf('function prefixIds(');
    const prefixEnd = patched.indexOf('\n\nfunction layerMap', prefixStart);
    if (prefixStart < 0 || prefixEnd < 0) throw new Error('Không tìm thấy hàm prefixIds trong semantic-8.js');

    const prefixReplacement = `function prefixIds(node,prefix){
 const clone=node.cloneNode(true),idMap=new Map();
 const all=[clone,...clone.querySelectorAll('*')];
 all.filter(el=>el.hasAttribute&&el.hasAttribute('id')).forEach(el=>{const old=el.getAttribute('id'),next=prefix+old;idMap.set(old,next);el.setAttribute('id',next)});
 const attrs=['fill','stroke','filter','clip-path','mask','href','xlink:href','style'];
 all.forEach(el=>attrs.forEach(name=>{if(!el.hasAttribute||!el.hasAttribute(name))return;let value=el.getAttribute(name);idMap.forEach((next,old)=>{value=value.split('url(#'+old+')').join('url(#'+next+')').split('#'+old).join('#'+next)});el.setAttribute(name,value)}));
 return clone;
}`;

    patched = patched.slice(0, prefixStart) + prefixReplacement + patched.slice(prefixEnd);
    patched = patched.replace('parsed=states.map(parseSvg)', 'parsed=states.map(state=>parseSvg(state.svg,state))');
    patched = patched.replace(
      "const activeTracks=tracks.filter(t=>!ancestorFallback(t,fallbackIds,states));",
      "const activeTracks=tracks.filter(t=>{if(String(t.id).endsWith(':@root'))return false;return !ancestorFallback(t,new Set([...fallbackIds].filter(id=>!String(id).endsWith(':@root'))),states)});"
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
