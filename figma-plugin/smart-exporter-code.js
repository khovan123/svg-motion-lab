figma.showUI(__html__,{width:420,height:360,themeColors:true});
const NS='svg-motion-lab',KEY='motion-id';
figma.ui.onmessage=async m=>{if(!m||m.type!=='export')return;try{figma.ui.postMessage({type:'manifest',manifest:await build(m.options||{})})}catch(e){figma.ui.postMessage({type:'error',message:e&&e.message?e.message:String(e)})}};
figma.ui.postMessage({type:'ready'});
async function build(options){
 const selected=figma.currentPage.selection.filter(isState),roots=order(selected.length?selected:figma.currentPage.children.filter(isState));
 if(!roots.length)throw new Error('Hãy chọn ít nhất một state.');
 const states=[];
 for(let i=0;i<roots.length;i++){
  const root=roots[i],box=root.absoluteBoundingBox||{x:root.x||0,y:root.y||0},variant=variantOf(root),layers=[],svgNodeMap=[],ord={};
  figma.ui.postMessage({type:'progress',message:`Đang export ${i+1}/${roots.length}: ${root.name}`});
  walk(root,null,'@root',0,{x:box.x||0,y:box.y||0},variant,layers,svgNodeMap,ord,options);
  const raw=await svg(root),annotated=annotateSvg(raw,svgNodeMap,root.id);
  states.push({id:root.id,stableStateId:(variant.componentSetId||root.id)+':'+variant.variantKey,name:root.name,order:i,width:n(root.width),height:n(root.height),variant,layers,svgNodeMap,svg:annotated});
 }
 const stateMap=new Map();roots.forEach(r=>mapState(r,r.id,stateMap));const rootIds=new Set(roots.map(r=>r.id));const prototype=proto(roots,stateMap,rootIds);prototype.startStateId=states[0].id;
 return{schema:'svg-motion-lab/figma-manifest@4',fidelityMetadataVersion:4,exportedAt:new Date().toISOString(),source:{fileName:figma.root.name,pageId:figma.currentPage.id,pageName:figma.currentPage.name},capabilities:{stableNodeIdsAcrossVariants:true,embeddedMotionIds:true,stableDefinitionIds:true,svgNodeMap:true,svgAstMerge:true,subtreeFallback:true,maskGeometry:true,clipHierarchy:true,filterHierarchy:true,vectorTopologyCorrespondence:true,gradientTransform:true,transformInterpolation:true,opacityInterpolation:true,colorInterpolation:true,pathMorph:true,rotationInterpolation:true,scaleInterpolation:true,translationInterpolation:true,visibilityInterpolation:true},startNodeId:states[0].id,stateOrder:states.map(s=>s.id),states,prototype,transitions:legacy(prototype.reactions),calibration:{renderMode:'multi-track-smart-animate',layerMatchOrder:['embeddedMotionId','stableNodeId','pluginKey','semanticPath','structuralSlot']}};
}
function annotateSvg(source,map,stateId){
 let text=String(source||'');
 const suffix=String(stateId||'').replace(/:/g,'_');
 if(suffix)text=text.split(suffix).join('motion_shared');
 const defsStart=text.indexOf('<defs');
 const defsEnd=defsStart>=0?text.indexOf('</defs>',defsStart):-1;
 const before=defsStart>=0?text.slice(0,defsStart):text;
 const defs=defsStart>=0&&defsEnd>=0?text.slice(defsStart,defsEnd+7):'';
 const after=defsStart>=0&&defsEnd>=0?text.slice(defsEnd+7):'';
 const byTag={};
 (map||[]).forEach(entry=>{const tag=String(entry.tag||'').toLowerCase();if(!byTag[tag])byTag[tag]=[];byTag[tag][entry.ordinal]=entry.stableNodeId});
 function patch(segment){
  const seen={};
  return segment.replace(/<(g|rect|circle|ellipse|line|path|polygon|polyline|text|image)(\s|>)/g,(match,tag,tail)=>{
   const key=tag.toLowerCase(),index=seen[key]||0;seen[key]=index+1;const id=byTag[key]&&byTag[key][index];
   return id?'<'+tag+' data-motion-id="'+xml(id)+'"'+tail:match;
  });
 }
 return patch(before)+defs+patch(after);
}
function xml(value){return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function walk(node,parentKey,path,sibling,origin,variant,layers,map,ord,options){
 if(!options.includeHidden&&node.visible===false)return;
 const id=(variant.componentSetId||variant.variantRootId)+':'+path,box=node.absoluteBoundingBox||{x:node.x||0,y:node.y||0,width:node.width||0,height:node.height||0},bounds={x:n(box.x-origin.x),y:n(box.y-origin.y),width:n(box.width),height:n(box.height)},tag=tagOf(node),fills=paint(node,'fills',bounds),strokes=paint(node,'strokes',bounds),paths=pathData(node,id),effects=effectData(node),mask=('isMask'in node&&node.isMask)?{type:'mask',bounds,paths}:null,clip=('clipsContent'in node&&node.clipsContent)?{type:'clip',bounds,paths}:null,key=plugin(node)||path;
 const layer={id:node.id,sourceNodeId:node.id,stableNodeId:id,structuralSlot:path,semanticPath:path,parentKey,parentStableNodeId:parentKey?(variant.componentSetId||variant.variantRootId)+':'+parentKey:null,siblingIndex:sibling,key,pluginKey:plugin(node)||null,name:node.name||node.type,type:node.type,visible:node.visible!==false,opacity:n('opacity'in node?node.opacity:1),blendMode:'blendMode'in node?node.blendMode:'NORMAL',bounds,rotation:n('rotation'in node?node.rotation:0),relativeTransform:mat('relativeTransform'in node?node.relativeTransform:null),fills,strokes,strokeWeight:n('strokeWeight'in node&&typeof node.strokeWeight==='number'?node.strokeWeight:0),cornerRadius:corner(node),vectorPaths:paths,text:text(node),mask,clip,effects,reactions:clone(reactions(node))};
 layers.push(layer);
 if(tag){const o=ord[tag]||0;ord[tag]=o+1;map.push({stableNodeId:id,parentStableNodeId:layer.parentStableNodeId,tag,ordinal:o,type:node.type,name:node.name||node.type,bounds,pathSignatures:paths.map(p=>p.topology.compatibleKey),text:layer.text&&layer.text.characters||null,paintTypes:fills.map(p=>p.type),hasClip:!!clip,hasMask:!!mask,hasFilter:effects.length>0})}
 if(!('children'in node))return;const names={};for(const child of node.children){const base=slug(child.name||child.type),o=names[base]||0;names[base]=o+1;walk(child,key,path+'/'+base+'['+o+']',o,origin,variant,layers,map,ord,options)}
}
function tagOf(node){if(node.type==='RECTANGLE')return'rect';if(node.type==='ELLIPSE')return'ellipse';if(node.type==='LINE')return'line';if(node.type==='TEXT')return'text';if(['VECTOR','BOOLEAN_OPERATION','STAR','POLYGON'].includes(node.type))return'path';if('children'in node)return'g';return null}
function variantOf(root){const parent=root.parent&&root.parent.type==='COMPONENT_SET'?root.parent:null;let p=parseProps(root.name),err=null;try{if('variantProperties'in root&&root.variantProperties)p=clone(root.variantProperties)}catch(e){err=e.message||String(e)}const k=Object.keys(p).sort().map(x=>x+'='+p[x]).join('|')||slug(root.name||root.id);return{variantRootId:root.id,componentSetId:parent?parent.id:null,componentSetName:parent?parent.name:null,variantKey:k,properties:p,propertiesSource:err?'name-fallback':'figma-api',variantPropertiesError:err}}
function parseProps(name){const out={};String(name||'').split(',').forEach(x=>{const i=x.indexOf('=');if(i>0)out[x.slice(0,i).trim()]=x.slice(i+1).trim()});return out}
function pathData(node,id){if(!('vectorPaths'in node)||!Array.isArray(node.vectorPaths))return[];return node.vectorPaths.map((p,i)=>({id:id+':path:'+i,correspondenceId:id+':path:'+i,data:p.data,windingRule:p.windingRule,topology:topology(p.data)}))}
function topology(d){const t=String(d||'').match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)||[],c=t.filter(x=>/^[a-zA-Z]$/.test(x)),v=t.filter(x=>!/^[a-zA-Z]$/.test(x));return{signature:c.join(''),commandCount:c.length,parameterCount:v.length,closedSubpaths:c.filter(x=>x.toUpperCase()==='Z').length,compatibleKey:c.join('')+':'+v.length}}
function paint(node,key,b){if(!(key in node)||!Array.isArray(node[key]))return[];return node[key].filter(p=>p&&p.visible!==false).map(p=>{const o={type:p.type,opacity:n(p.opacity==null?1:p.opacity),blendMode:p.blendMode||'NORMAL'};if(p.color)o.color=color(p.color);if(p.gradientStops)o.gradientStops=p.gradientStops.map(s=>({position:n(s.position),color:color(s.color)}));if(p.gradientHandlePositions)o.gradientHandlePositions=p.gradientHandlePositions.map(pt);return o})}
function effectData(node){if(!('effects'in node)||!Array.isArray(node.effects))return[];return node.effects.filter(e=>e&&e.visible!==false).map(e=>({type:e.type,radius:n(e.radius||0),spread:n(e.spread||0),offset:e.offset?pt(e.offset):null,color:e.color?color(e.color):null,blendMode:e.blendMode||'NORMAL'}))}
function corner(node){if(!('cornerRadius'in node))return null;if(typeof node.cornerRadius==='number')return{all:n(node.cornerRadius)};return{topLeft:n(node.topLeftRadius||0),topRight:n(node.topRightRadius||0),bottomRight:n(node.bottomRightRadius||0),bottomLeft:n(node.bottomLeftRadius||0)}}
function text(node){if(node.type!=='TEXT')return null;return{characters:node.characters,fontSize:typeof node.fontSize==='number'?n(node.fontSize):null,fontName:node.fontName&&node.fontName!==figma.mixed?clone(node.fontName):null,fontWeight:typeof node.fontWeight==='number'?node.fontWeight:null}}
async function svg(node){const bytes=await node.exportAsync({format:'SVG'}),s=utf8(bytes);if(!s.includes('<svg'))throw new Error('SVG không hợp lệ: '+node.name);return s}
function proto(roots,stateMap,rootIds){const out=[];roots.forEach(root=>visit(root,node=>reactions(node).forEach(r=>out.push({id:node.id+':'+out.length,sourceStateId:root.id,sourceNodeId:node.id,sourceNodeName:node.name||node.type,sourceLayerKey:node.id===root.id?'@root':plugin(node)||slug(node.name||node.type),trigger:clone(r.trigger||{type:'ON_CLICK'}),actions:actions(r).map(a=>annotate(a,stateMap,rootIds))}))));return{version:3,startStateId:null,flowStartingPoints:[],reactions:out,variables:[],variableCollections:[]}}
function annotate(a,stateMap,rootIds){if(!a||typeof a!=='object')return a;const o={};Object.entries(a).forEach(([k,v])=>o[k]=Array.isArray(v)?v.map(x=>annotate(x,stateMap,rootIds)):v&&typeof v==='object'?annotate(v,stateMap,rootIds):v);if(a.destinationId)o.destinationStateId=rootIds.has(a.destinationId)?a.destinationId:stateMap.get(a.destinationId)||null;return o}
function legacy(rs){return rs.map(r=>{const a=findAction(r.actions);return a&&a.destinationStateId?{from:r.sourceStateId,to:a.destinationStateId,trigger:r.trigger,navigation:a.navigation||null,transition:a.transition||null}:null}).filter(Boolean)}
function findAction(as){for(const a of as||[]){if(a&&a.type==='NODE'&&a.destinationStateId)return a}return null}
function order(ns){return[...ns].sort((a,b)=>{const ay=a.absoluteBoundingBox?a.absoluteBoundingBox.y:a.y||0,by=b.absoluteBoundingBox?b.absoluteBoundingBox.y:b.y||0;if(Math.abs(ay-by)>8)return ay-by;const ax=a.absoluteBoundingBox?a.absoluteBoundingBox.x:a.x||0,bx=b.absoluteBoundingBox?b.absoluteBoundingBox.x:b.x||0;return ax-bx})}
function isState(n){return n&&['FRAME','COMPONENT','INSTANCE','COMPONENT_SET'].includes(n.type)}function mapState(n,id,m){m.set(n.id,id);if('children'in n)n.children.forEach(c=>mapState(c,id,m))}function visit(n,f){f(n);if('children'in n)n.children.forEach(c=>visit(c,f))}function reactions(n){return'reactions'in n&&Array.isArray(n.reactions)?n.reactions:[]}function actions(r){return Array.isArray(r.actions)?r.actions:r.action?[r.action]:[]}function plugin(n){try{return n.getSharedPluginData(NS,KEY)||n.getPluginData(KEY)||''}catch(e){return''}}function slug(v){return String(v||'layer').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9_-]+/g,'').replace(/-+/g,'-')||'layer'}function n(v){v=Number(v);return Number.isFinite(v)?Math.round(v*1e5)/1e5:0}function pt(v){return{x:n(v.x),y:n(v.y)}}function mat(v){return Array.isArray(v)?v.map(r=>r.map(n)):null}function color(v){return{r:n(v.r),g:n(v.g),b:n(v.b),a:n(v.a==null?1:v.a)}}function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}function utf8(bytes){let out='',i=0;while(i<bytes.length){const a=bytes[i++];if(a<128){out+=String.fromCharCode(a);continue}if((a&224)===192){const b=bytes[i++];out+=String.fromCharCode(((a&31)<<6)|(b&63));continue}if((a&240)===224){const b=bytes[i++],c=bytes[i++];out+=String.fromCharCode(((a&15)<<12)|((b&63)<<6)|(c&63));continue}if((a&248)===240){const b=bytes[i++],c=bytes[i++],d=bytes[i++];let cp=((a&7)<<18)|((b&63)<<12)|((c&63)<<6)|(d&63);cp-=65536;out+=String.fromCharCode(55296+(cp>>10),56320+(cp&1023));continue}out+='�'}return out}