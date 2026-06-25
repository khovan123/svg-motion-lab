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
  return String(scriptText||'').replace(
    /\[\.\.\.group\.children\]\.forEach\(\(child,i\)=>\{const visible=i===from\|\|i===to;child\.setAttribute\('visibility',visible\?'visible':'hidden'\);child\.setAttribute\('opacity',i===to&&q\.segment\?String\(p\):i===from\?'1':'0'\)\}\)/g,
    "[...group.children].forEach(child=>{const i=Number(child.getAttribute('data-state-index'));const visible=i===from||i===to;child.setAttribute('visibility',visible?'visible':'hidden');child.setAttribute('opacity',i===to&&q.segment?String(p):i===from?'1':'0')})"
  );
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
    if(anchor&&anchor.parentNode){anchor.parentNode.insertBefore(group,anchor.nextSibling)}
  });
  svg.querySelectorAll('script').forEach(script=>{script.textContent=fixFallbackRuntime(script.textContent)});
  result.svg='<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
  result.html=S.buildHtml(result.svg,result.schedule);
  result.semanticReport=Object.assign({},result.semanticReport,{fallbackPlacementFixed:true,normalizedPaintReferences:true});
  result.report.report.fallbackPlacementFixed=true;
  result.report.report.normalizedPaintReferences=true;
  result.ir.smartAnimate.fallbackPlacementFixed=true;
  return result;
}
compiler.compile=function(manifest,options){return repairOutput(originalCompile(normalizeManifest(manifest),options))};
})(window);
