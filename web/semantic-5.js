(function(root){
'use strict';
const S=root.__SMC;
S.renderVectorTrack=function(track,stateIds,schedule,defs,report){
  const layers=S.layerSequence(track,stateIds),first=layers.find(Boolean);
  if(!first)return '';
  const paths=S.valueSequence(layers,function(layer){return layer.vectorPaths&&layer.vectorPaths[0]&&layer.vectorPaths[0].data||null},'');
  if(!paths[0])return null;
  const opacity=layers.map(function(layer){return layer&&layer.visible!==false?S.num(layer.opacity,1):0});
  const paint=S.paintMarkup(S.firstPaint(first.fills),'fill-'+track.id,S.bounds(first));
  if(paint.defs)defs.push(paint.defs);
  const stroke=S.stroke(first),opacityAnim=S.animate('opacity',S.timeline(opacity,schedule),schedule);
  if(paths.every(function(path){return S.compatiblePaths(paths[0],path)})){
    report.semanticTracks+=1;report.pathMorphs+=1;
    return '<path id="'+track.id+'" d="'+S.esc(paths[0])+'" fill="'+paint.fill+'" opacity="'+S.round(opacity[0])+'"'+stroke+'>'+S.animate('d',S.timeline(paths,schedule),schedule)+opacityAnim+'</path>';
  }
  const base=S.bounds(first);
  const xs=S.valueSequence(layers,l=>S.bounds(l).x,base.x),ys=S.valueSequence(layers,l=>S.bounds(l).y,base.y),ws=S.valueSequence(layers,l=>Math.max(.001,S.bounds(l).width),Math.max(.001,base.width)),hs=S.valueSequence(layers,l=>Math.max(.001,S.bounds(l).height),Math.max(.001,base.height));
  const transforms=xs.map(function(x,index){return 'translate('+S.round(x-base.x)+' '+S.round(ys[index]-base.y)+') scale('+S.round(ws[index]/Math.max(.001,base.width))+' '+S.round(hs[index]/Math.max(.001,base.height))+')'});
  report.semanticTracks+=1;report.unsupportedTracks+=1;
  return '<path id="'+track.id+'" d="'+S.esc(paths[0])+'" fill="'+paint.fill+'" opacity="'+S.round(opacity[0])+'"'+stroke+'>'+S.animate('transform',S.timeline(transforms,schedule),schedule)+opacityAnim+'</path>';
};
S.renderTextTrack=function(track,stateIds,schedule,defs,report){
  const layers=S.layerSequence(track,stateIds),first=layers.find(Boolean);if(!first)return '';
  const xs=S.valueSequence(layers,l=>S.bounds(l).x,0),ys=S.valueSequence(layers,l=>S.bounds(l).y+S.num(l.text&&l.text.fontSize,16),16),opacity=layers.map(function(layer){return layer&&layer.visible!==false?S.num(layer.opacity,1):0}),sizes=S.valueSequence(layers,l=>S.num(l.text&&l.text.fontSize,16),16),content=first.text&&first.text.characters||first.name||'',paint=S.paintMarkup(S.firstPaint(first.fills),'fill-'+track.id,S.bounds(first));
  if(paint.defs)defs.push(paint.defs);report.semanticTracks+=1;
  return '<text id="'+track.id+'" x="'+S.round(xs[0])+'" y="'+S.round(ys[0])+'" font-size="'+S.round(sizes[0])+'" fill="'+paint.fill+'" opacity="'+S.round(opacity[0])+'">'+S.esc(content)+S.animate('x',S.timeline(xs,schedule),schedule)+S.animate('y',S.timeline(ys,schedule),schedule)+S.animate('font-size',S.timeline(sizes,schedule),schedule)+S.animate('opacity',S.timeline(opacity,schedule),schedule)+'</text>';
};
})(window);
