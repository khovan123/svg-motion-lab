(function(root){
'use strict';
const S=root.__SMC;
S.baseName=function(value){return S.normalize(String(value||'').replace(/_\d+$/,''))};
S.buildLayerSlots=function(state){
  const layers=state.layers||[],byKey=new Map(),slotByKey=new Map(),children=new Map();
  layers.forEach(layer=>{if(layer&&layer.key)byKey.set(layer.key,layer)});
  function parentSlot(layer){
    if(!layer.parentKey)return '@root';
    if(slotByKey.has(layer.parentKey))return slotByKey.get(layer.parentKey);
    const parent=byKey.get(layer.parentKey);
    return parent?slotFor(parent):'@root';
  }
  function slotFor(layer){
    if(slotByKey.has(layer.key))return slotByKey.get(layer.key);
    if(!layer.parentKey){slotByKey.set(layer.key,'@root');return '@root'}
    const parent=parentSlot(layer),base=S.baseName(layer.name),groupKey=parent+'|'+base+'|'+String(layer.type||'');
    if(!children.has(groupKey))children.set(groupKey,[]);
    const list=children.get(groupKey);
    let ordinal=list.indexOf(layer);
    if(ordinal<0){list.push(layer);ordinal=list.length-1}
    const slot=parent+'/'+base+':'+String(layer.type||'')+'['+ordinal+']';
    slotByKey.set(layer.key,slot);return slot;
  }
  layers.forEach(slotFor);
  return new Map(layers.filter(Boolean).map(layer=>[layer,slotFor(layer)]));
};
S.matchLayers=function(states){
  const tracks=[],bySlot=new Map();
  states.forEach(function(state){
    const slots=S.buildLayerSlots(state);
    (state.layers||[]).filter(layer=>layer&&layer.parentKey!=null).forEach(function(layer){
      const slot=slots.get(layer);
      let track=bySlot.get(slot);
      if(!track){track={id:'track-'+tracks.length,slot:slot,type:layer.type,name:layer.name,states:new Map(),order:tracks.length};tracks.push(track);bySlot.set(slot,track)}
      track.states.set(state.id,layer);
    });
  });
  return tracks;
};
S.pathSignature=function(path){const source=String(path||'');let commands='';for(let i=0;i<source.length;i++){const code=source.charCodeAt(i);if((code>=65&&code<=90)||(code>=97&&code<=122))commands+=source[i]}return commands};
S.compatiblePaths=function(a,b){return S.pathSignature(a)===S.pathSignature(b)&&String(a||'').length===String(b||'').length};
S.trackSupported=function(track){return ['RECTANGLE','ELLIPSE','VECTOR','BOOLEAN_OPERATION','LINE','TEXT'].includes(track.type)};
})(window);
