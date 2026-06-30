(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
const S=root.__SMC;
if(!compiler||!S)return;
const originalCompile=compiler.compile;
const SVG_NS='http://www.w3.org/2000/svg';

function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function normalizedStateSvg(state){
  const suffix=String(state.id||'').replace(/:/g,'_');
  if(!suffix)return String(state.svg||'');
  return String(state.svg||'').replace(new RegExp(escapeRegExp(suffix),'g'),'motion_shared');
}
function prefixTree(node,prefix){
  const clone=node.cloneNode(true);
  const all=[clone,...clone.querySelectorAll('*')];
  all.forEach(element=>{
    if(element.hasAttribute&&element.hasAttribute('id'))element.setAttribute('id',prefix+element.getAttribute('id'));
  });
  const attrs=['fill','stroke','filter','clip-path','mask','href','xlink:href','style'];
  all.forEach(element=>attrs.forEach(name=>{
    if(!element.hasAttribute||!element.hasAttribute(name))return;
    let value=element.getAttribute(name);
    value=value.replace(/url\(#([^\)]+)\)/g,(match,id)=>'url(#'+(id.startsWith(prefix)?id:prefix+id)+')');
    if((name==='href'||name==='xlink:href')&&value.startsWith('#')){
      const id=value.slice(1);
      value='#'+(id.startsWith(prefix)?id:prefix+id);
    }
    element.setAttribute(name,value);
  }));
  return clone;
}
function parseStateSvg(state){
  const documentNode=new DOMParser().parseFromString(normalizedStateSvg(state),'image/svg+xml');
  const error=documentNode.querySelector('parsererror');
  if(error)throw new Error('Không thể parse ring state '+(state.name||state.id)+': '+error.textContent.slice(0,160));
  return documentNode.documentElement;
}
function collectReferencedIds(element){
  const ids=new Set();
  const nodes=[element,...element.querySelectorAll('*')];
  nodes.forEach(node=>{
    if(!node.getAttribute)return;
    ['fill','stroke','filter','clip-path','mask','href','xlink:href','style'].forEach(name=>{
      if(!node.hasAttribute(name))return;
      const value=node.getAttribute(name)||'';
      value.replace(/url\(#([^)]+)\)/g,(match,id)=>{
        ids.add(id);
        return match;
      });
      if((name==='href'||name==='xlink:href')&&value.startsWith('#'))ids.add(value.slice(1));
    });
  });
  return ids;
}
function rewriteReferenceAttributes(node,mapper){
  if(!node||!node.getAttribute)return;
  ['fill','stroke','filter','clip-path','mask','href','xlink:href','style'].forEach(name=>{
    if(!node.hasAttribute(name))return;
    let value=node.getAttribute(name)||'';
    value=value.replace(/url\(#([^)]+)\)/g,(match,id)=>'url(#'+mapper(id)+')');
    if((name==='href'||name==='xlink:href')&&value.startsWith('#'))value='#'+mapper(value.slice(1));
    node.setAttribute(name,value);
  });
}
function cloneReferencedDefinitions(source,element,defs,stateSuffix){
  const sourceDefs=source.querySelector('defs');
  if(!sourceDefs)return;
  const sourceDefMap=new Map();
  [...sourceDefs.querySelectorAll('[id]')].forEach(def=>sourceDefMap.set(def.getAttribute('id'),def));
  const appended=new Set();
  function ensureDefinition(id){
    if(!id||appended.has(id)||!sourceDefMap.has(id))return;
    appended.add(id);
    const clone=sourceDefMap.get(id).cloneNode(true);
    const nodes=[clone,...clone.querySelectorAll('*')];
    const nestedIds=new Set();
    nodes.forEach(node=>{
      if(node.hasAttribute&&node.hasAttribute('id')){
        const currentId=node.getAttribute('id');
        node.setAttribute('id',currentId+stateSuffix);
      }
      rewriteReferenceAttributes(node,refId=>{
        nestedIds.add(refId);
        return refId+stateSuffix;
      });
    });
    defs.appendChild(defs.ownerDocument.importNode(clone,true));
    nestedIds.forEach(ensureDefinition);
  }
  collectReferencedIds(element).forEach(ensureDefinition);
}
function normalizeMarkup(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}
function normalizeRingCloneMarkup(value){
  return normalizeMarkup(value).replace(/_state\d+/g,'_state');
}
const RING_SAMPLE_ATTRIBUTES=['d','fill','fill-opacity','fill-rule','clip-rule','opacity','stroke','stroke-width','stroke-opacity','stroke-linecap','stroke-linejoin','stroke-miterlimit','transform'];
function rectIntersection(a,b){
  if(!a||!b)return null;
  const x1=Math.max(a.x,b.x);
  const y1=Math.max(a.y,b.y);
  const x2=Math.min(a.x+a.width,b.x+b.width);
  const y2=Math.min(a.y+a.height,b.y+b.height);
  if(x2<=x1||y2<=y1)return null;
  return{x:x1,y:y1,width:x2-x1,height:y2-y1};
}
function rectArea(bounds){
  return bounds&&bounds.width>0&&bounds.height>0?bounds.width*bounds.height:0;
}
function unionBounds(a,b){
  if(!a)return b;
  if(!b)return a;
  const x=Math.min(a.x,b.x);
  const y=Math.min(a.y,b.y);
  const x2=Math.max(a.x+a.width,b.x+b.width);
  const y2=Math.max(a.y+a.height,b.y+b.height);
  return{x,y,width:x2-x,height:y2-y};
}
function pathBounds(d){
  const tokens=String(d||'').match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,cx=0,cy=0;
  function update(x,y){
    minX=Math.min(minX,x);
    maxX=Math.max(maxX,x);
    minY=Math.min(minY,y);
    maxY=Math.max(maxY,y);
  }
  for(let index=0;index<tokens.length;){
    const token=tokens[index++];
    if(!/^[a-zA-Z]$/.test(token))continue;
    if(token==='M'||token==='L'||token==='T'){
      cx=Number(tokens[index++]);
      cy=Number(tokens[index++]);
      update(cx,cy);
    }else if(token==='H'){
      cx=Number(tokens[index++]);
      update(cx,cy);
    }else if(token==='V'){
      cy=Number(tokens[index++]);
      update(cx,cy);
    }else if(token==='C'){
      const x1=Number(tokens[index++]),y1=Number(tokens[index++]),x2=Number(tokens[index++]),y2=Number(tokens[index++]);
      cx=Number(tokens[index++]);
      cy=Number(tokens[index++]);
      update(x1,y1);update(x2,y2);update(cx,cy);
    }else if(token==='S'||token==='Q'){
      const x1=Number(tokens[index++]),y1=Number(tokens[index++]);
      cx=Number(tokens[index++]);
      cy=Number(tokens[index++]);
      update(x1,y1);update(cx,cy);
    }else if(token==='A'){
      index+=5;
      cx=Number(tokens[index++]);
      cy=Number(tokens[index++]);
      update(cx,cy);
    }
  }
  if(minX===Infinity)return null;
  return{x:minX,y:minY,width:maxX-minX,height:maxY-minY};
}
function elementBounds(element){
  if(!element||element.nodeType!==1)return null;
  const tag=String(element.tagName).toLowerCase();
  if(tag==='rect'){
    return{x:Number(element.getAttribute('x')||0),y:Number(element.getAttribute('y')||0),width:Number(element.getAttribute('width')||0),height:Number(element.getAttribute('height')||0)};
  }
  if(tag==='circle'){
    const cx=Number(element.getAttribute('cx')||0),cy=Number(element.getAttribute('cy')||0),r=Number(element.getAttribute('r')||0);
    return{x:cx-r,y:cy-r,width:r*2,height:r*2};
  }
  if(tag==='ellipse'){
    const cx=Number(element.getAttribute('cx')||0),cy=Number(element.getAttribute('cy')||0),rx=Number(element.getAttribute('rx')||0),ry=Number(element.getAttribute('ry')||0);
    return{x:cx-rx,y:cy-ry,width:rx*2,height:ry*2};
  }
  if(tag==='path')return pathBounds(element.getAttribute('d'));
  let merged=null;
  [...element.children||[]].forEach(child=>{
    merged=unionBounds(merged,elementBounds(child));
  });
  return merged;
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
function inferPieInfo(manifest,schedule){
  const state=firstStateForSchedule(manifest,schedule);
  const index=buildManifestIndex(state);
  const rootId=index.root&&index.root.stableNodeId;
  if(!rootId)return null;
  const rootChildren=index.byParent.get(rootId)||[];
  const pie=rootChildren.find(layer=>{
    if(layer.type!=='FRAME')return false;
    if((layer.fills||[]).length||(layer.strokes||[]).length||(layer.effects||[]).length)return false;
    const children=index.byParent.get(layer.stableNodeId)||[];
    const ellipseCount=children.filter(child=>child.type==='ELLIPSE').length;
    const groupCount=children.filter(child=>child.type==='GROUP').length;
    return ellipseCount>=1&&groupCount>=3;
  })||null;
  if(!pie)return null;
  const descendantIds=new Set([String(pie.stableNodeId||'')]);
  const stack=[String(pie.stableNodeId||'')];
  while(stack.length){
    const parentId=stack.pop();
    (index.byParent.get(parentId)||[]).forEach(child=>{
      const id=String(child.stableNodeId||'');
      descendantIds.add(id);
      stack.push(id);
    });
  }
  return{id:String(pie.stableNodeId||''),bounds:pie.bounds||null,descendantIds};
}
function isWithinPieBounds(bounds,pieBounds){
  if(!bounds||!pieBounds)return false;
  const tolerance=2;
  return bounds.x>=pieBounds.x-tolerance&&
    bounds.y>=pieBounds.y-tolerance&&
    bounds.x+bounds.width<=pieBounds.x+pieBounds.width+tolerance&&
    bounds.y+bounds.height<=pieBounds.y+pieBounds.height+tolerance;
}
function shouldKeepNonPieNode(node,pieInfo){
  if(!node||!pieInfo)return false;
  const bounds=elementBounds(node);
  if(!isWithinPieBounds(bounds,pieInfo.bounds))return false;
  const pieArea=Math.max(1,rectArea(pieInfo.bounds));
  const nodeArea=Math.max(1,rectArea(bounds));
  return nodeArea<=pieArea*1.05;
}
function hasRenderableGeometry(node){
  if(!node||!node.tagName)return false;
  const tag=String(node.tagName).toLowerCase();
  if(tag==='path'||tag==='rect'||tag==='circle'||tag==='ellipse'||tag==='polygon'||tag==='polyline'||tag==='line')return true;
  return [...node.children||[]].some(hasRenderableGeometry);
}
function isStaticRingShellCandidate(node,pieInfo){
  if(!node||!pieInfo)return false;
  const bounds=elementBounds(node);
  if(!isWithinPieBounds(bounds,pieInfo.bounds))return false;
  const pieArea=Math.max(1,rectArea(pieInfo.bounds));
  const nodeArea=Math.max(1,rectArea(bounds));
  if(nodeArea<pieArea*0.8||nodeArea>pieArea*1.05)return false;
  if(String(node.getAttribute('opacity')||'')!=='0.9')return false;
  if(node.hasAttribute('mask')||node.hasAttribute('clip-path'))return false;
  return node.querySelectorAll('path').length===1;
}
function pruneNonRingDescendants(element,pieInfo){
  if(!element||!element.querySelectorAll)return element;
  const rootMotionId=element.getAttribute&&element.getAttribute('data-motion-id')||'';
  const rootIsPie=rootMotionId&&pieInfo&&pieInfo.descendantIds.has(rootMotionId);
  const rootLooksLikePieGeometry=!rootIsPie&&shouldKeepNonPieNode(element,pieInfo)&&hasRenderableGeometry(element);
  [...element.querySelectorAll('[data-motion-id]')].forEach(node=>{
    const motionId=node.getAttribute('data-motion-id')||'';
    if(pieInfo&&pieInfo.descendantIds.has(motionId))return;
    if(shouldKeepNonPieNode(node,pieInfo)&&hasRenderableGeometry(node)){
      node.removeAttribute('data-motion-id');
      return;
    }
    node.remove();
  });
  if(rootMotionId&&!rootIsPie){
    if(!rootLooksLikePieGeometry)return null;
    element.removeAttribute('data-motion-id');
  }
  const remainingMotionIds=[...element.querySelectorAll('[data-motion-id]')];
  if(rootIsPie||rootLooksLikePieGeometry||remainingMotionIds.length)return element;
  if(!shouldKeepNonPieNode(element,pieInfo))return null;
  return element;
}
function cloneRingElementsForState(source,pieInfo,defs,stateSuffix,documentNode){
  return ringElements(source,pieInfo).map(element=>{
    const clone=pruneNonRingDescendants(element.cloneNode(true),pieInfo);
    if(!clone)return null;
    clone.removeAttribute('data-motion-id');
    clone.querySelectorAll('[data-motion-id]').forEach(el => el.removeAttribute('data-motion-id'));
    cloneReferencedDefinitions(source,clone,defs,stateSuffix);
    [clone,...clone.querySelectorAll('*')].forEach(el=>rewriteReferenceAttributes(el,id=>id+stateSuffix));
    const imported=documentNode.importNode(clone,true);
    return hasRenderableGeometry(imported)?imported:null;
  }).filter(Boolean);
}
function extractStaticRingShell(stateClones,pieInfo){
  if(!stateClones.length)return{staticClones:[],dynamicClonesByState:stateClones};
  const signatureCounts=new Map();
  stateClones.forEach(clones=>{
    const seen=new Set();
    clones.forEach(clone=>{
      const signature=normalizeRingCloneMarkup(clone.outerHTML);
      if(seen.has(signature))return;
      seen.add(signature);
      signatureCounts.set(signature,(signatureCounts.get(signature)||0)+1);
    });
  });
  const staticSignatures=new Set([...signatureCounts.entries()].filter(([,count])=>count===stateClones.length).map(([signature])=>signature));
  const staticClones=[];
  const usedStatic=new Set();
  if(staticSignatures.size){
    stateClones[0].forEach(clone=>{
      const signature=normalizeRingCloneMarkup(clone.outerHTML);
      if(!staticSignatures.has(signature)||usedStatic.has(signature))return;
      usedStatic.add(signature);
      staticClones.push(clone.cloneNode(true));
    });
  }
  const dynamicClonesByState=stateClones.map(clones=>{
    const consumed=new Set();
    return clones.filter(clone=>{
      const signature=normalizeRingCloneMarkup(clone.outerHTML);
      if(!staticSignatures.has(signature))return true;
      if(consumed.has(signature))return true;
      consumed.add(signature);
      return false;
    });
  });
  if(!staticClones.length){
    const fallbackIndex=stateClones.findIndex(clones=>clones.some(clone=>isStaticRingShellCandidate(clone,pieInfo)));
    const fallbackStateIndex=fallbackIndex>=0?fallbackIndex:0;
    const fallbackClones=dynamicClonesByState[fallbackStateIndex]||[];
    const shellIndex=fallbackClones.findIndex(clone=>isStaticRingShellCandidate(clone,pieInfo));
    if(shellIndex>=0){
      staticClones.push(fallbackClones[shellIndex].cloneNode(true));
      dynamicClonesByState.forEach((clones,index)=>{
        dynamicClonesByState[index]=clones.filter((clone,cloneIndex)=>{
          if(index===fallbackStateIndex&&cloneIndex===shellIndex)return false;
          return !isStaticRingShellCandidate(clone,pieInfo);
        });
      });
    }
  }
  return{staticClones,dynamicClonesByState};
}
function ringSignature(elements,pieInfo){
  return elements.map(element=>{
    const clone=pruneNonRingDescendants(element.cloneNode(true),pieInfo);
    if(!clone)return'';
    [clone,...clone.querySelectorAll('*')].forEach(node=>{
      if(!node.getAttribute)return;
      node.removeAttribute('data-motion-id');
      node.removeAttribute('id');
      ['fill','stroke','filter','clip-path','mask','href','xlink:href','style'].forEach(name=>{
        if(!node.hasAttribute(name))return;
        node.setAttribute(name,node.getAttribute(name).replace(/url\(#([^)]+)\)/g,'url(#ref)'));
      });
    });
    return normalizeMarkup(clone.outerHTML);
  }).join('');
}
function isConnector(element){
  return element&&String(element.tagName).toLowerCase()==='path'&&element.hasAttribute('stroke-dasharray');
}
function ringElements(source,pieInfo){
  return [...source.children].filter(element=>{
    if(!element||!element.tagName)return false;
    const tag=String(element.tagName).toLowerCase();
    if(tag==='mask'||tag==='defs')return false;
    return Boolean(pruneNonRingDescendants(element.cloneNode(true),pieInfo));
  });
}
function sliceSample(element){
  if(!element)return null;
  const path=String(element.tagName||'').toLowerCase()==='path'?element:element.querySelector&&element.querySelector('path');
  if(!path)return null;
  const sample={};
  RING_SAMPLE_ATTRIBUTES.forEach(name=>{
    if(path.hasAttribute&&path.hasAttribute(name))sample[name]=path.getAttribute(name);
  });
  return Object.keys(sample).length?sample:null;
}
function semanticRingStates(dynamicClonesByState){
  const states=dynamicClonesByState.map(clones=>clones.map(sliceSample).filter(Boolean));
  if(!states.length)return null;
  const slotCount=states[0].length;
  if(!slotCount)return null;
  if(states.some(slots=>slots.length!==slotCount))return null;
  return{slotCount,states};
}
function removeCompiledRing(scene,pieInfo){
  const children=[...scene.children];
  const connector=children.find(isConnector)||null;
  const removed=children.filter(element=>{
    const motionId=element.getAttribute&&element.getAttribute('data-motion-id')||'';
    if(motionId&&pieInfo&&pieInfo.descendantIds.has(motionId))return true;
    return Boolean(pruneNonRingDescendants(element.cloneNode(true),pieInfo));
  });
  if(!removed.length)return connector;
  removed.forEach(element=>element.remove());
  return [...scene.children].find(isConnector)||connector;
}
function runtime(data){
  const json=JSON.stringify(data).replace(/</g,'\\u003c');
  return "(()=>{const D="+json+",svg=(document.currentScript&&(document.currentScript.closest('svg')||document.currentScript.ownerDocument.querySelector('#motion-svg')||document.currentScript.ownerDocument.documentElement))||document.querySelector('#motion-svg')||document.documentElement,root=svg.querySelector('[data-exact-ring]');if(!root)return;const slots=[...root.querySelectorAll('[data-ring-slot]')];if(!slots.length)return;let start=performance.now(),manual=false,paused=false;const C=v=>Math.max(0,Math.min(1,v)),E=p=>p*p*(3-2*p);function state(t){let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=0;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}return{active,segment}}function apply(slot,sample){D.attrs.forEach(name=>{const value=sample&&sample[name];if(value===undefined||value===null||value==='')slot.removeAttribute(name);else slot.setAttribute(name,value)});slot.setAttribute('visibility',sample?'visible':'hidden');slot.setAttribute('opacity',sample&&sample.opacity!==undefined?sample.opacity:'1')}function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:C(t/total)*total;const q=state(t),p=q.segment?E(C((t-q.segment.start)/Math.max(.001,q.segment.end-q.segment.start))):0,from=q.segment?q.segment.from:q.active,to=q.segment?q.segment.to:q.active,chosen=q.segment?(p<.5?from:to):from,samples=D.states[chosen]||[];slots.forEach((slot,index)=>apply(slot,samples[index]||null))}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}const previous=svg.__motionController||{};svg.__motionController={seek(t){manual=true;previous.seek&&previous.seek(t);render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now();previous.play&&previous.play()},pause(){paused=true;previous.pause&&previous.pause()},restart(){manual=false;paused=false;start=performance.now();previous.restart&&previous.restart();render(0)}};render(0);requestAnimationFrame(tick)})()";
}
function repair(result,manifest){
  const manifestToUse = result.normalizedManifest || manifest;
  const scenePieInfo=inferPieInfo(manifestToUse,result.schedule);
  if (!scenePieInfo) return result;
  const sourcePieInfo=inferPieInfo(manifest,result.schedule)||scenePieInfo;

  const documentNode=new DOMParser().parseFromString(result.svg,'image/svg+xml');
  const error=documentNode.querySelector('parsererror');
  if(error)throw new Error('Không thể rebuild ring: '+error.textContent.slice(0,160));
  const svg=documentNode.documentElement;
  const scene=svg.querySelector('#motion-scene');
  if(!scene)return result;
  const anchor=removeCompiledRing(scene,scenePieInfo);
  if(!anchor)return result;
  const stateById=new Map((manifest.states||[]).map(state=>[state.id,state]));
  const fallbackStateById=new Map((manifestToUse.states||[]).map(state=>[state.id,state]));
  const exactRoot=documentNode.createElementNS(SVG_NS,'g');
  exactRoot.setAttribute('data-exact-ring','true');
  const defs = svg.querySelector('defs') || svg.insertBefore(documentNode.createElementNS(SVG_NS, 'defs'), svg.firstChild);
  const stateIndexMap = new Map();
  let emittedStateCount = 0;
  const stateClones = [];

  result.schedule.stateIds.forEach((stateId,index)=>{
    const state=stateById.get(stateId)||fallbackStateById.get(stateId);
    if(!state){
      stateClones.push([]);
      return;
    }
    const source=parseStateSvg(state);
    stateClones.push(cloneRingElementsForState(source,sourcePieInfo,defs,'_state'+index,documentNode));
    stateIndexMap.set(stateId,index);
  });
  const separated=extractStaticRingShell(stateClones,sourcePieInfo);
  const semanticStates=semanticRingStates(separated.dynamicClonesByState);
  if(!semanticStates)return result;
  separated.staticClones.forEach(clone=>exactRoot.appendChild(clone));
  semanticStates.states[0].forEach((sample,index)=>{
    const path=documentNode.createElementNS(SVG_NS,'path');
    path.setAttribute('data-ring-slot',String(index));
    RING_SAMPLE_ATTRIBUTES.forEach(name=>{
      if(sample[name]!==undefined&&sample[name]!==null&&sample[name]!=='')path.setAttribute(name,sample[name]);
    });
    exactRoot.appendChild(path);
  });
  emittedStateCount=semanticStates.states.length;
  scene.insertBefore(exactRoot,anchor);
  const script=documentNode.createElementNS(SVG_NS,'script');
  script.textContent=runtime({
    attrs:RING_SAMPLE_ATTRIBUTES,
    states:semanticStates.states,
    duration:result.schedule.totalDuration,
    infinite:result.schedule.infinite,
    segments:result.schedule.segments.map(segment=>({
      from:stateIndexMap.get(segment.from),
      to:stateIndexMap.get(segment.to),
      start:segment.transitionStart,
      end:segment.transitionEnd
    }))
  });
  svg.appendChild(script);
  result.svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
  result.html=S.buildHtml(result.svg,result.schedule);
  result.semanticReport=Object.assign({},result.semanticReport||{},{exactRingSemanticPaths:true,ringSlotCount:semanticStates.slotCount,ringStateCount:semanticStates.states.length,ringDefinitionReferencesNormalized:true,ringStateDedupedCount:emittedStateCount,ringStateSourceCount:result.schedule.stateIds.length});
  if(result.report&&result.report.report){
    result.report.report=Object.assign({},result.report.report,result.semanticReport);
  }
  if(result.ir&&result.ir.smartAnimate){
    result.ir.smartAnimate=Object.assign({},result.ir.smartAnimate,result.semanticReport);
  }
  return result;
}
compiler.compile=function(manifest,options){return repair(originalCompile(manifest,options),manifest)};
})(window);
