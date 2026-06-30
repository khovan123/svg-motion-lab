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
function normalizeMarkup(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}
function ringSignature(elements){
  return elements.map(element=>{
    const clone=element.cloneNode(true);
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
function checkIsPie(element) {
  // Never classify container or rotor elements as pie chart
  const motionId = element.getAttribute('data-motion-id') || '';
  if (motionId.includes('container') || motionId.includes('hugeiconsrefresh')) return false;
  const hasRotorDescendant = element.querySelector && element.querySelector('[data-motion-id*="container"],[data-motion-id*="hugeiconsrefresh"]');
  if (hasRotorDescendant) return false;

  const tag = String(element.tagName).toLowerCase();
  if (tag === 'mask' || tag === 'g' || tag === 'path') {
    const paths = tag === 'path' ? [element] : Array.from(element.querySelectorAll('path'));
    if (paths.length === 0) return false;
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      const match = d.match(/M\s*(-?\d*\.?\d+)\s*(-?\d*\.?\d+)/i);
      if (match) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        if (x >= 210 && x <= 295 && y >= 45 && y <= 130) {
          return true;
        }
      }
    }
  }
  return motionId.includes('piechart');
}
function ringElements(source){
  const children=[...source.children];
  const connectorIndex=children.findIndex(isConnector);
  if(connectorIndex<0)return[];
  return children.slice(0,connectorIndex).filter(element=>{
    const tag=String(element.tagName).toLowerCase();
    if(tag==='mask')return false; // Skip masks in scene!
    return checkIsPie(element);
  });
}
function removeCompiledRing(scene){
  const children=[...scene.children];
  const connectorIndex=children.findIndex(isConnector);
  if(connectorIndex<0)return null;
  
  // Remove all pie chart elements from the entire scene
  children.forEach(element=>{
    if (checkIsPie(element)) {
      element.remove();
    }
  });
  return [...scene.children].find(isConnector)||null;
}
function runtime(data){
  const json=JSON.stringify(data).replace(/</g,'\\u003c');
  return "(()=>{const D="+json+",svg=(document.currentScript&&(document.currentScript.closest('svg')||document.currentScript.ownerDocument.querySelector('#motion-svg')||document.currentScript.ownerDocument.documentElement))||document.querySelector('#motion-svg')||document.documentElement,root=svg.querySelector('[data-exact-ring]');if(!root)return;let start=performance.now(),manual=false,paused=false;const C=v=>Math.max(0,Math.min(1,v)),E=p=>p*p*(3-2*p);function state(t){let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}return{active,segment}}function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:C(t/total)*total;const q=state(t),p=q.segment?E(C((t-q.segment.start)/Math.max(.001,q.segment.end-q.segment.start))):0,from=q.segment?q.segment.from:q.active,to=q.segment?q.segment.to:q.active;[...root.children].forEach(child=>{const attr=child.getAttribute('data-ring-state');if(attr===null)return;const index=Number(attr);const visible=index===from||index===to;child.setAttribute('visibility',visible?'visible':'hidden');if(from===to)child.setAttribute('opacity',index===from?'1':'0');else if(index===to)child.setAttribute('opacity',String(p));else if(index===from)child.setAttribute('opacity',String(1-p));else child.setAttribute('opacity','0')})}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}const previous=svg.__motionController||{};svg.__motionController={seek(t){manual=true;previous.seek&&previous.seek(t);render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now();previous.play&&previous.play()},pause(){paused=true;previous.pause&&previous.pause()},restart(){manual=false;paused=false;start=performance.now();previous.restart&&previous.restart();render(0)}};render(0);requestAnimationFrame(tick)})()";
}
function repair(result,manifest){
  const manifestToUse = result.normalizedManifest || manifest;
  const hasPie = manifestToUse.states.some(s => s.layers.some(l => (l.name || '').toLowerCase().includes('piechart') || (l.stableNodeId || '').toLowerCase().includes('piechart')));
  if (!hasPie) return result;

  const documentNode=new DOMParser().parseFromString(result.svg,'image/svg+xml');
  const error=documentNode.querySelector('parsererror');
  if(error)throw new Error('Không thể rebuild ring: '+error.textContent.slice(0,160));
  const svg=documentNode.documentElement;
  const scene=svg.querySelector('#motion-scene');
  if(!scene)return result;
  const anchor=removeCompiledRing(scene);
  if(!anchor)return result;
  const stateById=new Map((manifestToUse.states||[]).map(state=>[state.id,state]));
  const exactRoot=documentNode.createElementNS(SVG_NS,'g');
  exactRoot.setAttribute('data-exact-ring','true');
  const defs = svg.querySelector('defs') || svg.insertBefore(documentNode.createElementNS(SVG_NS, 'defs'), svg.firstChild);
  const uniqueStateIds = [];
  result.schedule.stateIds.forEach(id => {
    if (!uniqueStateIds.includes(id)) uniqueStateIds.push(id);
  });
  const signatureToIndex = new Map();
  const stateIndexMap = new Map();
  let dedupedStateCount = 0;

  uniqueStateIds.forEach((stateId)=>{
    const state=stateById.get(stateId);
    if(!state)return;
    const source=parseStateSvg(state);
    const stateRingElements=ringElements(source);
    const signature=ringSignature(stateRingElements);
    const existingIndex=signatureToIndex.get(signature);
    if(existingIndex!=null){
      stateIndexMap.set(stateId,existingIndex);
      return;
    }
    const index=dedupedStateCount++;
    signatureToIndex.set(signature,index);
    stateIndexMap.set(stateId,index);
    const wrapper=documentNode.createElementNS(SVG_NS,'g');
    wrapper.setAttribute('data-ring-state',String(index));
    wrapper.setAttribute('visibility',index===0?'visible':'hidden');
    wrapper.setAttribute('opacity',index===0?'1':'0');
    [...source.children].forEach(child=>{
      if(String(child.tagName).toLowerCase()==='mask'){
        const maskClone=child.cloneNode(true);
        const oldId=maskClone.getAttribute('id');
        if(oldId){
          maskClone.setAttribute('id',oldId+'_state'+index);
          defs.appendChild(documentNode.importNode(maskClone,true));
        }
      }
    });
    stateRingElements.forEach(element=>{
      const clone=element.cloneNode(true);
      clone.removeAttribute('data-motion-id');
      clone.querySelectorAll('[data-motion-id]').forEach(el => el.removeAttribute('data-motion-id'));
      const hasMask = element.hasAttribute('mask') || element.querySelector('[mask]');
      if (!hasMask) {
        if (index === 0) {
          exactRoot.appendChild(documentNode.importNode(clone,true));
        }
      } else {
        [...clone.querySelectorAll('*'),clone].forEach(el=>{
          ['mask','clip-path','fill','stroke','filter'].forEach(name=>{
            if(el.hasAttribute(name)){
              el.setAttribute(name,el.getAttribute(name).replace(/url\(#(mask\d+_motion_shared)\)/g,'url(#$1_state'+index+')'));
            }
          });
        });
        wrapper.appendChild(documentNode.importNode(clone,true));
      }
    });
    exactRoot.appendChild(wrapper);
  });
  scene.insertBefore(exactRoot,anchor);
  const script=documentNode.createElementNS(SVG_NS,'script');
  script.textContent=runtime({
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
  result.semanticReport=Object.assign({},result.semanticReport||{},{exactRingSubtrees:true,ringStateCount:exactRoot.children.length,ringDefinitionReferencesNormalized:true,ringStateDedupedCount:dedupedStateCount,ringStateSourceCount:uniqueStateIds.length});
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
