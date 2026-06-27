(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
if(!compiler)return;
const originalCompile=compiler.compile;

function canonicalSegment(segment){
  return String(segment||'').replace(/_\d+(?=\[)/g,'');
}
function canonicalId(value){
  const text=String(value||'');
  const split=text.indexOf(':@root');
  if(split<0)return text;
  const prefix=text.slice(0,split);
  const path=text.slice(split+1).split('/').map(canonicalSegment).join('/');
  return prefix+':'+path;
}
function canonicalizeManifest(manifest){
  const states=(manifest.states||[]).map(state=>{
    const layers=(state.layers||[]).map(layer=>Object.assign({},layer,{
      stableNodeId:canonicalId(layer.stableNodeId),
      parentStableNodeId:layer.parentStableNodeId?canonicalId(layer.parentStableNodeId):null,
      semanticPath:String(layer.semanticPath||'').split('/').map(canonicalSegment).join('/'),
      structuralSlot:String(layer.structuralSlot||'').split('/').map(canonicalSegment).join('/')
    }));
    const seen=new Set();
    const svgNodeMap=(state.svgNodeMap||[]).filter(entry=>String(entry.tag||'').toLowerCase()!=='g').map(entry=>Object.assign({},entry,{
      stableNodeId:canonicalId(entry.stableNodeId),
      parentStableNodeId:entry.parentStableNodeId?canonicalId(entry.parentStableNodeId):null
    })).filter(entry=>{
      const key=entry.stableNodeId+'|'+entry.tag;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
    return Object.assign({},state,{layers,svgNodeMap});
  });
  return Object.assign({},manifest,{states});
}
function countCanonicalTracks(manifest){
  const counts=new Map();
  (manifest.states||[]).forEach(state=>(state.svgNodeMap||[]).forEach(entry=>counts.set(entry.stableNodeId,(counts.get(entry.stableNodeId)||0)+1)));
  return{canonicalTrackCandidates:counts.size,canonicalMultiStateTracks:[...counts.values()].filter(count=>count>1).length};
}
compiler.compile=function(manifest,options){
  const normalized=canonicalizeManifest(manifest);
  const diagnostics=countCanonicalTracks(normalized);
  const result=originalCompile(normalized,options);
  result.semanticReport=Object.assign({},result.semanticReport,diagnostics,{containerFallbacksDisabled:true,stableIdsCanonicalized:true});
  result.report.report=Object.assign({},result.report.report,diagnostics,{containerFallbacksDisabled:true,stableIdsCanonicalized:true});
  result.ir.smartAnimate=Object.assign({},result.ir.smartAnimate,diagnostics,{containerFallbacksDisabled:true,stableIdsCanonicalized:true});
  return result;
};
})(window);
