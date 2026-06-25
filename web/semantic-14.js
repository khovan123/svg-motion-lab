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
function isConnector(element){
  return element&&String(element.tagName).toLowerCase()==='path'&&element.hasAttribute('stroke-dasharray');
}
function ringElements(source){
  const children=[...source.children];
  const connectorIndex=children.findIndex(isConnector);
  if(connectorIndex<0)return[];
  let start=-1;
  for(let index=connectorIndex-1;index>=0;index-=1){
    const element=children[index];
    if(String(element.tagName).toLowerCase()==='path'&&element.getAttribute('d')&&element.getAttribute('d').startsWith('M196 ')){start=index+1;break;}
  }
  if(start<0)return[];
  return children.slice(start,connectorIndex).filter(element=>{
    const tag=String(element.tagName).toLowerCase();
    return tag==='g'||tag==='mask';
  });
}
function removeCompiledRing(scene){
  const children=[...scene.children];
  const connectorIndex=children.findIndex(isConnector);
  if(connectorIndex<0)return null;
  let cardIndex=-1;
  for(let index=connectorIndex-1;index>=0;index-=1){
    const element=children[index];
    if(String(element.tagName).toLowerCase()==='path'&&element.getAttribute('d')&&element.getAttribute('d').startsWith('M196 ')){cardIndex=index;break;}
  }
  if(cardIndex<0)return children[connectorIndex];
  children.slice(cardIndex+1,connectorIndex).forEach(element=>element.remove());
  return [...scene.children].find(isConnector)||null;
}
function runtime(data){
  const json=JSON.stringify(data).replace(/</g,'\\u003c');
  return "(()=>{const D="+json+",svg=document.currentScript.ownerDocument.documentElement,root=svg.querySelector('[data-exact-ring]');if(!root)return;let start=performance.now(),manual=false,paused=false;const C=v=>Math.max(0,Math.min(1,v)),E=p=>p*p*(3-2*p);function state(t){let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}return{active,segment}}function render(t){const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:C(t/total)*total;const q=state(t),p=q.segment?E(C((t-q.segment.start)/Math.max(.001,q.segment.end-q.segment.start))):0,from=q.segment?q.segment.from:q.active,to=q.segment?q.segment.to:q.active;[...root.children].forEach(child=>{const index=Number(child.getAttribute('data-ring-state'));const visible=index===from||index===to;child.setAttribute('visibility',visible?'visible':'hidden');if(from===to)child.setAttribute('opacity',index===from?'1':'0');else child.setAttribute('opacity',index===to?String(p):index===from?'1':'0')})}function tick(now){if(!manual&&!paused)render((now-start)/1000);requestAnimationFrame(tick)}const previous=svg.__motionController||{};svg.__motionController={seek(t){manual=true;previous.seek&&previous.seek(t);render(Number(t)||0)},play(){manual=false;paused=false;start=performance.now();previous.play&&previous.play()},pause(){paused=true;previous.pause&&previous.pause()},restart(){manual=false;paused=false;start=performance.now();previous.restart&&previous.restart();render(0)}};render(0);requestAnimationFrame(tick)})()";
}
function repair(result,manifest){
  const documentNode=new DOMParser().parseFromString(result.svg,'image/svg+xml');
  const error=documentNode.querySelector('parsererror');
  if(error)throw new Error('Không thể rebuild ring: '+error.textContent.slice(0,160));
  const svg=documentNode.documentElement;
  const scene=svg.querySelector('#motion-scene');
  if(!scene)return result;
  const anchor=removeCompiledRing(scene);
  if(!anchor)return result;
  const stateById=new Map((manifest.states||[]).map(state=>[state.id,state]));
  const exactRoot=documentNode.createElementNS(SVG_NS,'g');
  exactRoot.setAttribute('data-exact-ring','true');
  result.schedule.stateIds.forEach((stateId,index)=>{
    const state=stateById.get(stateId);
    if(!state)return;
    const source=parseStateSvg(state);
    const wrapper=documentNode.createElementNS(SVG_NS,'g');
    wrapper.setAttribute('data-ring-state',String(index));
    wrapper.setAttribute('visibility',index===0?'visible':'hidden');
    wrapper.setAttribute('opacity',index===0?'1':'0');
    ringElements(source).forEach(element=>{
      const clone=index===0?element.cloneNode(true):prefixTree(element,'s'+index+'-');
      wrapper.appendChild(documentNode.importNode(clone,true));
    });
    exactRoot.appendChild(wrapper);
  });
  scene.insertBefore(exactRoot,anchor);
  const script=documentNode.createElementNS(SVG_NS,'script');
  script.textContent=runtime({
    duration:result.schedule.totalDuration,
    infinite:result.schedule.infinite,
    segments:result.schedule.segments.map(segment=>({from:result.schedule.stateIds.indexOf(segment.from),to:result.schedule.stateIds.indexOf(segment.to),start:segment.transitionStart,end:segment.transitionEnd}))
  });
  svg.appendChild(script);
  result.svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
  result.html=S.buildHtml(result.svg,result.schedule);
  result.semanticReport=Object.assign({},result.semanticReport,{exactRingSubtrees:true,ringStateCount:exactRoot.children.length,ringDefinitionReferencesNormalized:true});
  result.report.report.exactRingSubtrees=true;
  result.report.report.ringStateCount=exactRoot.children.length;
  result.report.report.ringDefinitionReferencesNormalized=true;
  result.ir.smartAnimate.exactRingSubtrees=true;
  result.ir.smartAnimate.ringStateCount=exactRoot.children.length;
  result.ir.smartAnimate.ringDefinitionReferencesNormalized=true;
  return result;
}
compiler.compile=function(manifest,options){return repair(originalCompile(manifest,options),manifest)};
})(window);
