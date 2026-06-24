(function(root){
'use strict';
const S=root.__SMC;
const RENDERABLE=new Set(['rect','circle','ellipse','line','path','polygon','polyline','text','image']);
const NUMERIC=['x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','opacity','stroke-width'];

function parseSvg(text,state){
 const doc=new DOMParser().parseFromString(text,'image/svg+xml');
 if(doc.querySelector('parsererror'))throw new Error('SVG AST không hợp lệ ở state '+state.name);
 const svg=doc.documentElement;
 const entries=Array.isArray(state.svgNodeMap)?state.svgNodeMap:[];
 const byTag=new Map();
 svg.querySelectorAll('*').forEach(el=>{const tag=el.tagName.toLowerCase();if(!byTag.has(tag))byTag.set(tag,[]);byTag.get(tag).push(el)});
 const mapped=new Map();
 entries.forEach(entry=>{const list=byTag.get(String(entry.tag||'').toLowerCase())||[],el=list[entry.ordinal];if(el){el.setAttribute('data-motion-id',entry.stableNodeId);mapped.set(entry.stableNodeId,el)}});
 return{state,doc,svg,mapped};
}

function prefixIds(node,prefix){
 const clone=node.cloneNode(true),idMap=new Map();
 clone.querySelectorAll('[id]').forEach(el=>{const old=el.id,next=prefix+old;idMap.set(old,next);el.id=next});
 const attrs=['fill','stroke','filter','clip-path','mask','href','xlink:href','style'];
 clone.querySelectorAll('*').forEach(el=>attrs.forEach(name=>{if(!el.hasAttribute(name))return;let value=el.getAttribute(name);idMap.forEach((next,old)=>{value=value.replaceAll('url(#'+old+')','url(#'+next+')').replaceAll('#'+old,'#'+next)});el.setAttribute(name,value)}));
 return clone;
}

function layerMap(state){return new Map((state.layers||[]).map(layer=>[layer.stableNodeId,layer]))}
function parentId(state,id){const layer=layerMap(state).get(id);return layer&&layer.parentStableNodeId||null}
function trackKey(entry){return entry&&entry.stableNodeId}

function parseNumbers(text){return(String(text||'').match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[]).map(Number)}
function tokenizePath(d){return String(d||'').match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[]}
function cubicLine(x0,y0,x1,y1){return{x1:x0+(x1-x0)/3,y1:y0+(y1-y0)/3,x2:x0+2*(x1-x0)/3,y2:y0+2*(y1-y0)/3,x:x1,y:y1}}
function normalizePath(d){
 const t=tokenizePath(d),segments=[];let i=0,cmd='',x=0,y=0,sx=0,sy=0;
 const read=()=>Number(t[i++]);
 while(i<t.length){if(/^[a-zA-Z]$/.test(t[i]))cmd=t[i++];if(!cmd)break;const rel=cmd===cmd.toLowerCase(),u=cmd.toUpperCase();
  if(u==='M'){let nx=read(),ny=read();if(rel){nx+=x;ny+=y}x=nx;y=ny;sx=x;sy=y;segments.push({m:true,x,y});cmd=rel?'l':'L';continue}
  if(u==='L'){let nx=read(),ny=read();if(rel){nx+=x;ny+=y}segments.push(cubicLine(x,y,nx,ny));x=nx;y=ny;continue}
  if(u==='H'){let nx=read();if(rel)nx+=x;segments.push(cubicLine(x,y,nx,y));x=nx;continue}
  if(u==='V'){let ny=read();if(rel)ny+=y;segments.push(cubicLine(x,y,x,ny));y=ny;continue}
  if(u==='C'){let a=read(),b=read(),c=read(),e=read(),nx=read(),ny=read();if(rel){a+=x;b+=y;c+=x;e+=y;nx+=x;ny+=y}segments.push({x1:a,y1:b,x2:c,y2:e,x:nx,y:ny});x=nx;y=ny;continue}
  if(u==='Q'){let qx=read(),qy=read(),nx=read(),ny=read();if(rel){qx+=x;qy+=y;nx+=x;ny+=y}segments.push({x1:x+2*(qx-x)/3,y1:y+2*(qy-y)/3,x2:nx+2*(qx-nx)/3,y2:ny+2*(qy-ny)/3,x:nx,y:ny});x=nx;y=ny;continue}
  if(u==='Z'){segments.push(cubicLine(x,y,sx,sy));x=sx;y=sy;cmd='';continue}
  const count={S:4,T:2,A:7}[u];if(count){const vals=[];for(let k=0;k<count;k++)vals.push(read());let nx=vals[count-2],ny=vals[count-1];if(rel){nx+=x;ny+=y}segments.push(cubicLine(x,y,nx,ny));x=nx;y=ny;continue}
  break;
 }
 return segments;
}
function splitCubic(c){
 const p0={x:c.px,y:c.py},p1={x:c.x1,y:c.y1},p2={x:c.x2,y:c.y2},p3={x:c.x,y:c.y};
 const a={x:(p0.x+p1.x)/2,y:(p0.y+p1.y)/2},b={x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2},d={x:(p2.x+p3.x)/2,y:(p2.y+p3.y)/2},e={x:(a.x+b.x)/2,y:(a.y+b.y)/2},f={x:(b.x+d.x)/2,y:(b.y+d.y)/2},m={x:(e.x+f.x)/2,y:(e.y+f.y)/2};
 return[{px:p0.x,py:p0.y,x1:a.x,y1:a.y,x2:e.x,y2:e.y,x:m.x,y:m.y},{px:m.x,py:m.y,x1:f.x,y1:f.y,x2:d.x,y2:d.y,x:p3.x,y:p3.y}];
}
function withStarts(path){let x=0,y=0;return path.filter(s=>!s.m).map(s=>{const out=Object.assign({px:x,py:y},s);x=s.x;y=s.y;return out})}
function equalize(a,b){let aa=withStarts(a),bb=withStarts(b);if(!aa.length||!bb.length)return null;while(aa.length<bb.length){let k=aa.reduce((best,_,i)=>i<aa.length-1&&dist(aa[i])>dist(aa[best])?i:best,0);aa.splice(k,1,...splitCubic(aa[k]))}while(bb.length<aa.length){let k=bb.reduce((best,_,i)=>i<bb.length-1&&dist(bb[i])>dist(bb[best])?i:best,0);bb.splice(k,1,...splitCubic(bb[k]))}return[aa,bb]}
function dist(c){return Math.hypot(c.x-c.px,c.y-c.py)+Math.hypot(c.x1-c.px,c.y1-c.py)+Math.hypot(c.x-c.x2,c.y-c.y2)}
function pathString(cs){if(!cs.length)return'';let s='M '+cs[0].px+' '+cs[0].py;cs.forEach(c=>s+=' C '+c.x1+' '+c.y1+' '+c.x2+' '+c.y2+' '+c.x+' '+c.y);return s}

function collectTracks(parsedStates){
 const tracks=new Map();
 parsedStates.forEach(ps=>ps.mapped.forEach((el,id)=>{if(!tracks.has(id))tracks.set(id,{id,nodes:new Map(),layers:new Map()});tracks.get(id).nodes.set(ps.state.id,el);const layer=layerMap(ps.state).get(id);if(layer)tracks.get(id).layers.set(ps.state.id,layer)}));
 return[...tracks.values()];
}
function hasComplex(el){return!!(el&&((el.getAttribute('filter'))||(el.getAttribute('mask'))||(el.getAttribute('clip-path'))||el.querySelector('[filter],[mask],[clip-path]')))}
function commonTag(track){const tags=[...track.nodes.values()].map(n=>n.tagName.toLowerCase());return tags.length&&tags.every(t=>t===tags[0])?tags[0]:null}
function attrsFor(el){const out={};NUMERIC.forEach(a=>{if(el.hasAttribute(a))out[a]=Number(el.getAttribute(a))});out.transform=el.getAttribute('transform')||'';out.fill=el.getAttribute('fill')||'';out.stroke=el.getAttribute('stroke')||'';out.d=el.getAttribute('d')||'';return out}
function classify(track,stateIds){
 const tag=commonTag(track);if(!tag)return'fallback';if(hasComplex([...track.nodes.values()][0]))return'fallback';if(track.nodes.size<2)return'fade';
 if(tag==='path'){const paths=stateIds.map(id=>track.nodes.get(id)).filter(Boolean).map(n=>normalizePath(n.getAttribute('d')));for(let i=1;i<paths.length;i++)if(!equalize(paths[0],paths[i]))return'fallback';return'path'}
 if(RENDERABLE.has(tag))return'attrs';return'fallback';
}
function ancestorFallback(track,fallbackIds,states){for(const state of states){let p=parentId(state,track.id);while(p){if(fallbackIds.has(p))return true;p=parentId(state,p)}}return false}

function buildOutput(manifest,schedule){
 const byId=new Map(manifest.states.map(s=>[s.id,s])),states=schedule.stateIds.map(id=>byId.get(id)).filter(Boolean),parsed=states.map(parseSvg),tracks=collectTracks(parsed),classes=new Map(tracks.map(t=>[t.id,classify(t,schedule.stateIds)])),fallbackIds=new Set([...classes].filter(([,c])=>c==='fallback').map(([id])=>id));
 const activeTracks=tracks.filter(t=>!ancestorFallback(t,fallbackIds,states));
 const first=states[0],defs=[],body=[],runtimeTracks=[],fallbackCount={value:0},pathMorphs={value:0},semantic={value:0};
 parsed.forEach((ps,i)=>{const d=ps.svg.querySelector('defs');if(d){const p=prefixIds(d,'s'+i+'-');defs.push(p.innerHTML)}});
 activeTracks.forEach((track,index)=>{
  const cls=classes.get(track.id),nodes=schedule.stateIds.map(id=>track.nodes.get(id)||null),base=nodes.find(Boolean);if(!base)return;
  if(cls==='fallback'){
   const copies=[];nodes.forEach((node,i)=>{if(!node)return;const clone=prefixIds(node,'s'+i+'-');clone.removeAttribute('id');clone.setAttribute('data-fallback-state',String(i));clone.setAttribute('visibility',i===0?'visible':'hidden');clone.setAttribute('opacity',i===0?'1':'0');copies.push(new XMLSerializer().serializeToString(clone))});
   body.push('<g data-motion-id="'+S.esc(track.id)+'" data-mode="fallback">'+copies.join('')+'</g>');runtimeTracks.push({id:track.id,mode:'fallback',selector:'[data-motion-id="'+cssEscape(track.id)+'"]'});fallbackCount.value++;return;
  }
  const clone=prefixIds(base,'base-');clone.removeAttribute('id');clone.setAttribute('data-motion-id',track.id);clone.setAttribute('data-track-index',String(index));body.push(new XMLSerializer().serializeToString(clone));
  const values=nodes.map(node=>node?attrsFor(node):null);const rt={id:track.id,mode:cls,index,values};
  if(cls==='path'){
   const normalized=nodes.map(node=>node?normalizePath(node.getAttribute('d')):null),firstPath=normalized.find(Boolean);rt.paths=normalized.map(path=>{if(!path)return null;const pair=equalize(firstPath,path);return pair?pair[1]:null});pathMorphs.value++;
  }
  runtimeTracks.push(rt);semantic.value++;
 });
 const data={duration:schedule.totalDuration,infinite:schedule.infinite,stateIds:schedule.stateIds,segments:schedule.segments.map(s=>({from:schedule.stateIds.indexOf(s.from),to:schedule.stateIds.indexOf(s.to),start:s.transitionStart,end:s.transitionEnd,easing:s.easing})),tracks:runtimeTracks};
 const runtime=runtimeCode(data);
 const svg='<?xml version="1.0" encoding="UTF-8"?><svg id="motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+S.round(first.width)+' '+S.round(first.height)+'" width="'+S.round(first.width)+'" height="'+S.round(first.height)+'" data-render-mode="hybrid-smart-animate" data-duration="'+S.round(schedule.totalDuration)+'" data-infinite="'+schedule.infinite+'"><defs>'+defs.join('')+'</defs><g id="motion-scene">'+body.join('')+'</g><script><![CDATA['+runtime+']]></script></svg>';
 return{svg,report:{renderMode:'hybrid-smart-animate',totalTracks:activeTracks.length,semanticTracks:semantic.value,pathMorphs:pathMorphs.value,subtreeFallbacks:fallbackCount.value,fullStateSnapshots:0,astStates:parsed.length}};
}
function cssEscape(v){return String(v).replace(/["\\]/g,'\\$&')}
function runtimeCode(data){const json=JSON.stringify(data).replace(/</g,'\\u003c');return"(()=>{const D="+json+",svg=document.currentScript.ownerDocument.documentElement,scene=svg.querySelector('#motion-scene');let start=performance.now(),manual=false,paused=false;const clamp=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,p)=>a+(b-a)*p,ease=p=>p*p*(3-2*p);function stateAt(t){let active=0,seg=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){seg=s;break}}return{active,seg}}function val(values,i){return values[i]||values.slice(0,i).reverse().find(Boolean)||values.find(Boolean)}function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:clamp(t/total)*total;const q=stateAt(t),p=q.seg?ease(clamp((t-q.seg.start)/Math.max(.001,q.seg.end-q.seg.start))):0,from=q.seg?q.seg.from:q.active,to=q.seg?q.seg.to:q.active;for(const tr of D.tracks){const el=scene.querySelector('[data-track-index=\"'+tr.index+'\"]')||scene.querySelector(tr.selector||'[data-motion-id=\"'+tr.id.replace(/\"/g,'\\\"')+'\"]');if(!el)continue;if(tr.mode==='fallback'){const copies=[...el.children];copies.forEach((c,i)=>{const show=i===from||i===to;c.setAttribute('visibility',show?'visible':'hidden');c.setAttribute('opacity',i===to&&q.seg?String(p):i===from?'1':'0')});continue}const a=val(tr.values,from),b=val(tr.values,to);if(!a||!b)continue;for(const k of "+JSON.stringify(NUMERIC)+"){if(a[k]!=null||b[k]!=null)el.setAttribute(k,String(lerp(Number(a[k]||0),Number(b[k]||0),p)))}if(tr.mode==='path'&&tr.paths){const pa=val(tr.paths,from),pb=val(tr.paths,to);if(pa&&pb){const cs=pa.map((c,i)=>({px:lerp(c.px,pb[i].px,p),py:lerp(c.py,pb[i].py,p),x1:lerp(c.x1,pb[i].x1,p),y1:lerp(c.y1,pb[i].y1,p),x2:lerp(c.x2,pb[i].x2,p),y2:lerp(c.y2,pb[i].y2,p),x:lerp(c.x,pb[i].x,p),y:lerp(c.y,pb[i].y,p)}));let d='M '+cs[0].px+' '+cs[0].py;for(const c of cs)d+=' C '+c.x1+' '+c.y1+' '+c.x2+' '+c.y2+' '+c.x+' '+c.y;el.setAttribute('d',d)}}if(a.opacity!=null||b.opacity!=null)el.setAttribute('opacity',String(lerp(Number(a.opacity==null?1:a.opacity),Number(b.opacity==null?1:b.opacity),p)))}}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}svg.__motionController={seek(t){manual=true;render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now()},pause(){paused=true},restart(){manual=false;paused=false;start=performance.now();render(0)}};render(0);requestAnimationFrame(tick)})()"}

function compile(manifest,options){
 S.validate(Object.assign({},manifest,{schema:'svg-motion-lab/figma-manifest@3'}));options=options||{};const base=options.baseSchedule||S.buildBaseSchedule(manifest),schedule=S.customSchedule(base,options.customSegments,options.infinite),built=buildOutput(manifest,schedule),html=S.buildHtml(built.svg,schedule),ir={version:3,startStateId:schedule.stateIds[0],stateOrder:schedule.stateIds.slice(),playback:{infinite:schedule.infinite,totalDuration:schedule.totalDuration,segments:schedule.segments},smartAnimate:built.report};const report={report:{manifestSchema:manifest.schema,prototypeReady:true,snapshotsReady:true,renderMode:built.report.renderMode,semanticTracks:built.report.semanticTracks,totalTracks:built.report.totalTracks,pathMorphs:built.report.pathMorphs,subtreeFallbacks:built.report.subtreeFallbacks,fullStateSnapshots:0,astStates:built.report.astStates,infinite:schedule.infinite,customDuration:schedule.totalDuration},schedule};return{svg:built.svg,html,ir,report,schedule,semanticReport:built.report}}
root.SvgMotionCompiler={validate:S.validate,buildBaseSchedule:S.buildBaseSchedule,compile};
})(window);
