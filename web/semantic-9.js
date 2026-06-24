(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
if(!compiler)return;
const originalValidate=compiler.validate;
compiler.validate=function(manifest){
  if(!manifest||!['svg-motion-lab/figma-manifest@3','svg-motion-lab/figma-manifest@4'].includes(manifest.schema)){
    throw new Error('Chỉ hỗ trợ schema svg-motion-lab/figma-manifest@3 hoặc @4.');
  }
  if(!Array.isArray(manifest.states)||!manifest.states.length)throw new Error('Manifest không có states.');
  if(!manifest.prototype||!Array.isArray(manifest.prototype.reactions))throw new Error('Manifest không có prototype graph.');
  const missing=manifest.states.filter(state=>typeof state.svg!=='string'||!state.svg.includes('<svg'));
  if(missing.length)throw new Error('Thiếu SVG snapshot ở '+missing.length+' state.');
  if(manifest.schema.endsWith('@4')){
    const withoutMap=manifest.states.filter(state=>!Array.isArray(state.svgNodeMap)||!state.svgNodeMap.length);
    if(withoutMap.length)throw new Error('Manifest @4 thiếu svgNodeMap ở '+withoutMap.length+' state.');
  }
  return{states:manifest.states.length,reactions:manifest.prototype.reactions.length,snapshots:manifest.states.length,svgNodeMaps:manifest.states.filter(state=>state.svgNodeMap&&state.svgNodeMap.length).length};
};
})(window);
