(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
const S=root.__SMC;
if(!compiler||!S)return;
const originalCompile=compiler.compile;

function unwrapAngles(values){
  const out=[];
  values.forEach((value,index)=>{
    let angle=Number(value)||0;
    if(index===0){out.push(angle);return;}
    const previous=out[index-1];
    while(angle<previous-180)angle+=360;
    while(angle>previous+180)angle-=360;
    if(angle<previous)angle+=360;
    out.push(angle);
  });
  return out;
}
function firstStateForSchedule(manifest,schedule){
  const stateMap=new Map((manifest.states||[]).map(state=>[state.id,state]));
  return stateMap.get(schedule.stateIds[0])||manifest.states&&manifest.states[0]||null;
}
function buildManifestIndex(state){
  const layers=state&&state.layers||[];
  const byParent=new Map();
  layers.forEach(layer=>{
    const parent=layer.parentStableNodeId||'';
    if(!byParent.has(parent))byParent.set(parent,[]);
    byParent.get(parent).push(layer);
  });
  const root=layers.find(layer=>String(layer.stableNodeId||'').endsWith(':@root'))||layers.find(layer=>!layer.parentStableNodeId)||null;
  return{layers,byParent,root};
}
function inferSpinnerInfo(manifest,schedule){
  const state=firstStateForSchedule(manifest,schedule);
  const index=buildManifestIndex(state);
  const rootId=index.root&&index.root.stableNodeId;
  if(!rootId)return null;
  const rootChildren=index.byParent.get(rootId)||[];
  const container=rootChildren.find(layer=>{
    if(layer.type!=='FRAME')return false;
    if((layer.fills||[]).length<2)return false;
    const children=index.byParent.get(layer.stableNodeId)||[];
    if(children.length!==1||children[0].type!=='FRAME')return false;
    const child=children[0];
    return child.bounds&&layer.bounds&&child.bounds.width<layer.bounds.width&&child.bounds.height<layer.bounds.height;
  });
  if(!container)return null;
  const rotor=(index.byParent.get(container.stableNodeId)||[]).find(layer=>layer.type==='FRAME')||null;
  return{
    containerId:String(container.stableNodeId||''),
    rotorId:rotor?String(rotor.stableNodeId||''):'',
    bounds:container.bounds||null
  };
}
function inferConnectorInfo(manifest,schedule){
  const state=firstStateForSchedule(manifest,schedule);
  const index=buildManifestIndex(state);
  const rootId=index.root&&index.root.stableNodeId;
  if(!rootId)return null;
  const rootChildren=index.byParent.get(rootId)||[];
  const connector=rootChildren.find(layer=>{
    return layer.type==='VECTOR'&&(layer.strokes||[]).length>0&&(layer.fills||[]).length===0;
  })||null;
  return connector?{id:String(connector.stableNodeId||''),bounds:connector.bounds||null}:null;
}
function refreshMotion(manifest,schedule){
  const stateMap=new Map((manifest.states||[]).map(state=>[state.id,state]));
  const spinnerInfo=inferSpinnerInfo(manifest,schedule);
  const rotations=schedule.stateIds.map(id=>{
    const state=stateMap.get(id);
    const layer=(state&&state.layers||[]).find(item=>item.type==='FRAME'&&spinnerInfo&&String(item.stableNodeId||'')===spinnerInfo.rotorId);
    return layer?Number(layer.rotation)||0:0;
  });
  const firstState=stateMap.get(schedule.stateIds[0]);
  const firstLayer=(firstState&&firstState.layers||[]).find(item=>item.type==='FRAME'&&spinnerInfo&&String(item.stableNodeId||'')===spinnerInfo.rotorId);
  const bounds=firstLayer&&firstLayer.bounds||spinnerInfo&&spinnerInfo.bounds&&{
    x:Number(spinnerInfo.bounds.x)+Number(spinnerInfo.bounds.width||0)/2-12,
    y:Number(spinnerInfo.bounds.y)+Number(spinnerInfo.bounds.height||0)/2-12,
    width:24,
    height:24
  }||{x:0,y:0,width:0,height:0};
  return{angles:unwrapAngles(rotations),cx:Number(bounds.x)+Number(bounds.width)/2,cy:Number(bounds.y)+Number(bounds.height)/2};
}
function runtime(data){
  const json=JSON.stringify(data).replace(/</g,'\\u003c');
  return "(()=>{const D="+json+",svg=(document.currentScript&&(document.currentScript.closest('svg')||document.currentScript.ownerDocument.querySelector('#motion-svg')||document.currentScript.ownerDocument.documentElement))||document.querySelector('#motion-svg')||document.documentElement,rotor=svg.querySelector('[data-refresh-rotor]');if(!rotor)return;let start=performance.now(),manual=false,paused=false;const C=v=>Math.max(0,Math.min(1,v)),L=(a,b,p)=>a+(b-a)*p,E=p=>p*p*(3-2*p);function state(t){let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}return{active,segment}}function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:C(t/total)*total;const q=state(t),p=q.segment?E(C((t-q.segment.start)/Math.max(.001,q.segment.end-q.segment.start))):0,from=q.segment?q.segment.from:q.active,to=q.segment?q.segment.to:q.active;let a=D.angles[from],b=D.angles[to];while(b-a>180)b-=360;while(a-b>180)b+=360;const angle=a+(b-a)*p;rotor.setAttribute('transform','rotate('+angle+' '+D.cx+' '+D.cy+')')}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}const previous=svg.__motionController||{};svg.__motionController={seek(t){manual=true;previous.seek&&previous.seek(t);render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now();previous.play&&previous.play()},pause(){paused=true;previous.pause&&previous.pause()},restart(){manual=false;paused=false;start=performance.now();previous.restart&&previous.restart();render(0)}};render(0);requestAnimationFrame(tick)})()";
}
function pathNumbers(path){return String(path&&path.getAttribute('d')||'').match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[]}
function elementBounds(el){
  if(!el||!el.tagName)return null;
  const tag=String(el.tagName).toLowerCase();
  if(tag==='rect'){
    return{
      x:Number(el.getAttribute('x')||0),
      y:Number(el.getAttribute('y')||0),
      width:Number(el.getAttribute('width')||0),
      height:Number(el.getAttribute('height')||0)
    };
  }
  if(tag==='path'){
    const values=pathNumbers(el).map(Number);
    if(!values.length)return null;
    const xs=[],ys=[];
    for(let i=0;i<values.length;i+=2){
      if(Number.isFinite(values[i]))xs.push(values[i]);
      if(Number.isFinite(values[i+1]))ys.push(values[i+1]);
    }
    if(!xs.length||!ys.length)return null;
    const minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);
    return{x:minX,y:minY,width:maxX-minX,height:maxY-minY};
  }
  if(tag==='g'){
    const children=[...el.children].map(elementBounds).filter(Boolean);
    if(!children.length)return null;
    const minX=Math.min.apply(null,children.map(item=>item.x));
    const minY=Math.min.apply(null,children.map(item=>item.y));
    const maxX=Math.max.apply(null,children.map(item=>item.x+item.width));
    const maxY=Math.max.apply(null,children.map(item=>item.y+item.height));
    return{x:minX,y:minY,width:maxX-minX,height:maxY-minY};
  }
  return null;
}
function boundsClose(a,b,tolerance){
  if(!a||!b)return false;
  const t=Number(tolerance)||0;
  return Math.abs(a.x-b.x)<=t&&Math.abs(a.y-b.y)<=t&&Math.abs(a.width-b.width)<=t&&Math.abs(a.height-b.height)<=t;
}
function isPieFallback(group){
  const path=group&&group.querySelector('path');
  const values=pathNumbers(path).map(Number);
  if(values.length<4)return false;
  const xs=values.filter((_,index)=>index%2===0);
  return xs.length&&Math.min.apply(null,xs)>190;
}
function patchFallbackScript(text){
  const source=String(text||'');
  const needle="const visible=i===resolvedFrom||i===resolvedTo;child.setAttribute('visibility',visible?'visible':'hidden');if(resolvedFrom===resolvedTo)child.setAttribute('opacity',i===resolvedFrom?'1':'0');else child.setAttribute('opacity',i===resolvedTo&&q.segment?String(p):i===resolvedFrom?'1':'0')";
  const replacement="const swap=group.getAttribute('data-fallback-mode')==='swap',chosen=swap&&q.segment?(p<.5?resolvedFrom:resolvedTo):resolvedFrom,visible=swap?i===chosen:(i===resolvedFrom||i===resolvedTo);child.setAttribute('visibility',visible?'visible':'hidden');if(swap)child.setAttribute('opacity',i===chosen?'1':'0');else if(resolvedFrom===resolvedTo)child.setAttribute('opacity',i===resolvedFrom?'1':'0');else child.setAttribute('opacity',i===resolvedTo&&q.segment?String(p):i===resolvedFrom&&q.segment?String(1-p):i===resolvedFrom?'1':'0')";
  return source.includes(needle)?source.replace(needle,replacement):source;
}
function repair(result,manifest){
  const manifestToUse=result.normalizedManifest||manifest;
  const doc=new DOMParser().parseFromString(result.svg,'image/svg+xml');
  const error=doc.querySelector('parsererror');
  if(error)throw new Error('Không thể sửa hiệu ứng SVG: '+error.textContent.slice(0,180));
  const svg=doc.documentElement;
  const connectorInfo=inferConnectorInfo(manifestToUse,result.schedule);
  // Find the real dashed connector line by its stroke attribute (stroke-only path with dasharray)
  // The geometry matcher ignores stroke-only paths so vector-1[0] may be matched to a wrong element.
  const realConnector = svg.querySelector('[stroke-dasharray][stroke]');
  if (realConnector&&connectorInfo&&connectorInfo.id) {
    realConnector.removeAttribute('data-track-index');
    realConnector.setAttribute('data-static-connector', 'true');
    realConnector.setAttribute('data-motion-id', connectorInfo.id);
    // Move the real connector to be a direct child of #motion-scene if needed
    const scene = svg.querySelector('#motion-scene');
    if (scene && realConnector.parentNode && realConnector.parentNode !== scene) {
      const wrapper = realConnector.parentNode;
      scene.insertBefore(realConnector, wrapper);
    }
  }
  // Also clear any wrong assignment of static-connector from the element that was incorrectly matched to vector-1[0]
  let wrongConnector=null;
  if(connectorInfo&&connectorInfo.id){
    wrongConnector=[...svg.querySelectorAll('[data-motion-id]')].find(el=>el.getAttribute('data-motion-id')===connectorInfo.id&&!el.hasAttribute('stroke-dasharray'))||null;
  }
  if (wrongConnector) {
    wrongConnector.removeAttribute('data-static-connector');
    wrongConnector.removeAttribute('data-track-index');
  }

  // Fix spinner hierarchy: rebuild the container from the actual 64x64 card layers plus the rotor.
  // The compiler can mis-assign @root/container[0] because the frame fill and its child spinner are emitted as siblings.
  const scene = svg.querySelector('#motion-scene');
  const spinnerInfo=inferSpinnerInfo(manifestToUse,result.schedule);
  let wrongContainerEl = null;
  let refreshPath = null;

  // Robust loop matching to bypass CSS escaping issues with brackets
  const allEls = svg.querySelectorAll('*');
  allEls.forEach(el => {
    const mid = el.getAttribute('data-motion-id') || '';
    if (spinnerInfo && mid === spinnerInfo.containerId) {
      wrongContainerEl = el;
    }
    if (spinnerInfo && spinnerInfo.rotorId && mid === spinnerInfo.rotorId) {
      refreshPath = el;
    }
  });

  if (scene && refreshPath && spinnerInfo && spinnerInfo.bounds) {
    // Find the top-level children of scene containing these elements
    let rotorGroup = refreshPath;
    while (rotorGroup && rotorGroup.parentNode !== scene) {
      rotorGroup = rotorGroup.parentNode;
    }
    let wrongTop = wrongContainerEl;
    while (wrongTop && wrongTop.parentNode !== scene) {
      wrongTop = wrongTop.parentNode;
    }

    const backgroundNodes=[...scene.children].filter(child=>{
      if(child===rotorGroup)return false;
      if(child.getAttribute&&child.getAttribute('data-exact-ring')==='true')return false;
      if(child.getAttribute&&child.getAttribute('data-static-connector')==='true')return false;
      const bounds=elementBounds(child);
      return boundsClose(bounds,spinnerInfo.bounds,1.5);
    });

    if (rotorGroup && backgroundNodes.length) {
      const g = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-motion-id', spinnerInfo.containerId);
      const insertBefore=backgroundNodes[0];
      const insertAnchor=insertBefore&&insertBefore.nextSibling;
      backgroundNodes.forEach(node=>g.appendChild(node));
      g.appendChild(rotorGroup);
      if(wrongContainerEl&&wrongContainerEl!==g)wrongContainerEl.removeAttribute('data-motion-id');
      if(insertBefore&&insertBefore.parentNode===scene)scene.insertBefore(g,insertBefore);
      else if(insertAnchor&&insertAnchor.parentNode===scene)scene.insertBefore(g,insertAnchor);
      else scene.appendChild(g);
    }
  }

  if(refreshPath){
    const filterGroup=refreshPath.closest('g');
    const rotor=filterGroup&&filterGroup.parentElement;
    const fallback=filterGroup&&filterGroup.querySelector('[data-fallback-index]');
    if(fallback)fallback.remove();
    refreshPath.setAttribute('visibility','visible');
    refreshPath.removeAttribute('data-track-index');
    if(rotor)rotor.setAttribute('data-refresh-rotor','true');
  }

  svg.querySelectorAll('[data-fallback-index]').forEach(group=>{if(isPieFallback(group))group.setAttribute('data-fallback-mode','swap')});
  svg.querySelectorAll('script').forEach(script=>{script.textContent=patchFallbackScript(script.textContent)});

  // Final filter stripping pass to ensure no filters remain inside masks or clip-paths
  svg.querySelectorAll('mask *, clipPath *').forEach(el => {
    if (el.hasAttribute('filter')) el.removeAttribute('filter');
  });
  svg.querySelectorAll('[filter]').forEach(el => {
    let parent = el.parentNode;
    while (parent && parent !== svg) {
      const tag = parent.tagName ? parent.tagName.toLowerCase() : '';
      if (parent.hasAttribute('mask') || parent.hasAttribute('clip-path') || tag === 'mask' || tag === 'clippath') {
        el.removeAttribute('filter');
        break;
      }
      parent = parent.parentNode;
    }
  });

  const motion=refreshMotion(manifestToUse,result.schedule);
  const script=document.createElementNS('http://www.w3.org/2000/svg','script');
  script.textContent=runtime({
    duration:result.schedule.totalDuration,
    infinite:result.schedule.infinite,
    angles:motion.angles,
    cx:motion.cx,
    cy:motion.cy,
    segments:result.schedule.segments.map(segment=>({from:result.schedule.stateIds.indexOf(segment.from),to:result.schedule.stateIds.indexOf(segment.to),start:segment.transitionStart,end:segment.transitionEnd}))
  });
  svg.appendChild(script);
  result.svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
  result.html=S.buildHtml(result.svg,result.schedule);
  result.semanticReport=Object.assign({},result.semanticReport,{connectorStatic:true,refreshRotationTrack:true,pieFallbackSwap:true});
  result.report.report.connectorStatic=true;
  result.report.report.refreshRotationTrack=true;
  result.report.report.pieFallbackSwap=true;
  result.ir.smartAnimate.connectorStatic=true;
  result.ir.smartAnimate.refreshRotationTrack=true;
  result.ir.smartAnimate.pieFallbackSwap=true;
  return result;
}
compiler.compile=function(manifest,options){return repair(originalCompile(manifest,options),manifest)};
})(window);
