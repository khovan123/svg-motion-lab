"use strict";
const{fmt,esc,valueAt,pathSig}=require("./utils");
const{animate}=require("./timeline");
function vector(first,id,states,s,cfg,common,fill,stroke,report){
 const p=states.map(l=>l&&l.vectorPaths&&l.vectorPaths[0]?l.vectorPaths[0].data:null),d=p.find(Boolean);if(!d)return"";
 const compat=p.filter(Boolean).every(v=>pathSig(v)===pathSig(d));
 if(compat&&new Set(p.filter(Boolean)).size>1)report.pathMorphs++;else if(!compat)report.warnings.push(`Layer ${first.name||id}: incompatible path topology`);
 const x=states.map(l=>valueAt(l,"bounds.x",first.bounds.x)),y=states.map(l=>valueAt(l,"bounds.y",first.bounds.y)),w=states.map(l=>valueAt(l,"bounds.width",first.bounds.width)),h=states.map(l=>valueAt(l,"bounds.height",first.bounds.height)),tr=states.map((_,i)=>`translate(${fmt(x[i])} ${fmt(y[i])}) scale(${fmt(w[i]/Math.max(first.bounds.width,.0001))} ${fmt(h[i]/Math.max(first.bounds.height,.0001))})`);
 return `<path d="${esc(d)}" transform="${tr[0]}" ${common}>${animate("transform",tr,s,cfg)}${compat?animate("d",p.map(v=>v||d),s,cfg):""}${fill.anim}${stroke.anim}</path>`
}
module.exports={vector};
