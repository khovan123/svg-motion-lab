"use strict";
const{finite,fmt,safeId}=require("./utils");
const{animate}=require("./timeline");
const{createPaint}=require("./paint");
const basic=require("./shapes-basic"),{vector}=require("./shapes-path");
function tracks(states){const m=new Map();for(const st of states)for(const l of st.layers){const k=l.pluginKey||l.key||l.semanticPath||`${l.type}:${l.name}`;if(!m.has(k))m.set(k,{key:k,by:new Map(),samples:[]});const t=m.get(k);t.by.set(st.id,l);t.samples.push(l)}return[...m.values()].sort((a,b)=>avg(a)-avg(b))}
function avg(t){return t.samples.reduce((n,l)=>n+finite(l.siblingIndex),0)/Math.max(1,t.samples.length)}
function renderTrack(t,s,cfg,defs,report){
 const first=t.samples[0];if(!first||first.type==="DOCUMENT"||first.type==="PAGE")return"";
 const ok=["RECTANGLE","FRAME","COMPONENT","INSTANCE","ELLIPSE","VECTOR","BOOLEAN_OPERATION","POLYGON","STAR","LINE","TEXT"].includes(first.type);
 if(ok)report.matchedLayers++;else{report.fallbackLayers++;report.warnings.push(`Layer ${t.key}: unsupported ${first.type}`)}
 const id=safeId(t.key),states=s.stateIds.map(x=>t.by.get(x)||null),shape=renderShape(first,id,states,s,cfg,defs,report);if(!shape)return"";
 const op=states.map(l=>l&&l.visible!==false?finite(l.opacity,1):0),blend=first.blendMode&&first.blendMode!=="NORMAL"?` style="mix-blend-mode:${String(first.blendMode).toLowerCase().replace(/_/g,"-")}"`:"";
 return `<g id="layer-${id}"${blend}>${shape}${animate("opacity",op,s,cfg)}</g>`
}
function renderShape(first,id,states,s,cfg,defs,report){
 const bounds=states.map(l=>l&&l.bounds?l.bounds:first.bounds),fill=createPaint(first.fills&&first.fills[0],id,first.bounds,defs,states.map(l=>l&&l.fills?l.fills[0]:null),bounds,s,cfg,report),stroke=createPaint(first.strokes&&first.strokes[0],`${id}-stroke`,first.bounds,defs,states.map(l=>l&&l.strokes?l.strokes[0]:null),bounds,s,cfg,report,true),common=`${fill.attr} ${stroke.attr}${first.strokeWeight?` stroke-width="${fmt(first.strokeWeight)}"`:""}`;
 if(["RECTANGLE","FRAME","COMPONENT","INSTANCE"].includes(first.type))return basic.rect(first,states,s,cfg,common,fill,stroke);
 if(first.type==="ELLIPSE")return basic.ellipse(first,states,s,cfg,common,fill,stroke);
 if(first.type==="LINE")return basic.line(first,states,s,cfg,common,stroke);
 if(first.type==="TEXT"&&first.text)return basic.text(first,states,s,cfg,common,fill);
 return vector(first,id,states,s,cfg,common,fill,stroke,report)
}
module.exports={tracks,renderTrack};
