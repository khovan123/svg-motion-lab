(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
const S=root.__SMC;
if(!compiler||!S)return;
const originalCompile=compiler.compile;

function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function normalizeStateSvg(state){
  const suffix=String(state.id||'').replace(/:/g,'_');
  if(!suffix)return state.svg;
  return String(state.svg||'').replace(new RegExp(escapeRegExp(suffix),'g'),'motion_shared');
}
function normalizeManifest(manifest){
  return Object.assign({},manifest,{states:(manifest.states||[]).map(state=>Object.assign({},state,{svg:normalizeStateSvg(state)}))});
}
function fixFallbackRuntime(scriptText){
  const source=String(scriptText||'');
  return source.replace(
    /\[\.\.\.group\.children\]\.forEach\(child=>\{const i=Number\(child\.getAttribute\('data-state-index'\)\);const visible=i===from\|\|i===to;child\.setAttribute\('visibility',visible\?'visible':'hidden'\);child\.setAttribute\('opacity',i===to&&q\.segment\?String\(p\):i===from\?'1':'0'\)\}\)/g,
    "(()=>{const children=[...group.children],available=children.map(child=>Number(child.getAttribute('data-state-index'))).filter(Number.isFinite).sort((a,b)=>a-b),resolveIndex=target=>{if(!available.length)return -1;let resolved=available[0];for(const value of available){if(value<=target)resolved=value;else break}return resolved},resolvedFrom=resolveIndex(from),resolvedTo=resolveIndex(to);children.forEach(child=>{const i=Number(child.getAttribute('data-state-index')),visible=i===resolvedFrom||i===resolvedTo;child.setAttribute('visibility',visible?'visible':'hidden');if(resolvedFrom===resolvedTo)child.setAttribute('opacity',i===resolvedFrom?'1':'0');else child.setAttribute('opacity',i===resolvedTo&&q.segment?String(p):i===resolvedFrom?'1':'0')})})()"
  );
}
function wrapFallbackChildren(group,anchor){
  const baseOpacity=anchor&&anchor.hasAttribute('opacity')?anchor.getAttribute('opacity'):'1';
  [...group.children].forEach(child=>{
    const stateIndex=child.getAttribute('data-state-index');
    const wrapper=document.createElementNS('http://www.w3.org/2000/svg','g');
    wrapper.setAttribute('data-state-index',stateIndex==null?'0':stateIndex);
    wrapper.setAttribute('visibility',child.getAttribute('visibility')||'hidden');
    wrapper.setAttribute('opacity',child.getAttribute('opacity')||'0');
    child.removeAttribute('data-state-index');
    child.setAttribute('visibility','visible');
    child.setAttribute('opacity',baseOpacity);
    group.insertBefore(wrapper,child);
    wrapper.appendChild(child);
  });
}
function repairOutput(result){
  const doc=new DOMParser().parseFromString(result.svg,'image/svg+xml');
  const error=doc.querySelector('parsererror');
  if(error)throw new Error('Không thể hậu kiểm SVG: '+error.textContent.slice(0,160));
  const svg=doc.documentElement,scene=svg.querySelector('#motion-scene');
  if(!scene)return result;
  const fallbackGroups=[...scene.querySelectorAll(':scope > [data-fallback-index]')];
  const hiddenRoots=[...scene.querySelectorAll('[data-motion-id][visibility="hidden"]')].filter(node=>!node.parentElement.closest('[visibility="hidden"]'));
  fallbackGroups.forEach((group,index)=>{
    const anchor=hiddenRoots[index];
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(group,anchor.nextSibling);
    wrapFallbackChildren(group,anchor);
  });
  svg.querySelectorAll('script').forEach(script=>{script.textContent=fixFallbackRuntime(script.textContent)});
  result.svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
  result.html=S.buildHtml(result.svg,result.schedule);
  result.semanticReport=Object.assign({},result.semanticReport,{fallbackPlacementFixed:true,fallbackPersistenceFixed:true,fallbackOpacityPreserved:true,normalizedPaintReferences:true});
  result.report.report.fallbackPlacementFixed=true;
  result.report.report.fallbackPersistenceFixed=true;
  result.report.report.fallbackOpacityPreserved=true;
  result.report.report.normalizedPaintReferences=true;
  result.ir.smartAnimate.fallbackPlacementFixed=true;
  result.ir.smartAnimate.fallbackPersistenceFixed=true;
  result.ir.smartAnimate.fallbackOpacityPreserved=true;
  return result;
}
compiler.compile=function(manifest,options){return repairOutput(originalCompile(normalizeManifest(manifest),options))};
})(window);
