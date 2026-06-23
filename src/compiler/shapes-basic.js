"use strict";
const{finite,fmt,esc,valueAt,radius}=require("./utils");
const{animate}=require("./timeline");
function rect(first,states,s,cfg,common,fill,stroke){
 const x=states.map(l=>valueAt(l,"bounds.x",first.bounds.x)),y=states.map(l=>valueAt(l,"bounds.y",first.bounds.y)),w=states.map(l=>valueAt(l,"bounds.width",first.bounds.width)),h=states.map(l=>valueAt(l,"bounds.height",first.bounds.height)),r=states.map(l=>radius(l||first));
 return `<rect x="${fmt(x[0])}" y="${fmt(y[0])}" width="${fmt(w[0])}" height="${fmt(h[0])}" rx="${fmt(r[0])}" ${common}>${animate("x",x,s,cfg)}${animate("y",y,s,cfg)}${animate("width",w,s,cfg)}${animate("height",h,s,cfg)}${animate("rx",r,s,cfg)}${fill.anim}${stroke.anim}</rect>`
}
function ellipse(first,states,s,cfg,common,fill,stroke){
 const x=states.map(l=>valueAt(l,"bounds.x",first.bounds.x)),y=states.map(l=>valueAt(l,"bounds.y",first.bounds.y)),w=states.map(l=>valueAt(l,"bounds.width",first.bounds.width)),h=states.map(l=>valueAt(l,"bounds.height",first.bounds.height)),cx=x.map((v,i)=>v+w[i]/2),cy=y.map((v,i)=>v+h[i]/2),rx=w.map(v=>v/2),ry=h.map(v=>v/2);
 return `<ellipse cx="${fmt(cx[0])}" cy="${fmt(cy[0])}" rx="${fmt(rx[0])}" ry="${fmt(ry[0])}" ${common}>${animate("cx",cx,s,cfg)}${animate("cy",cy,s,cfg)}${animate("rx",rx,s,cfg)}${animate("ry",ry,s,cfg)}${fill.anim}${stroke.anim}</ellipse>`
}
function line(first,states,s,cfg,common,stroke){
 const x1=states.map(l=>valueAt(l,"bounds.x",first.bounds.x)),y1=states.map(l=>valueAt(l,"bounds.y",first.bounds.y)),x2=states.map((l,i)=>x1[i]+valueAt(l,"bounds.width",first.bounds.width)),y2=states.map((l,i)=>y1[i]+valueAt(l,"bounds.height",first.bounds.height));
 return `<line x1="${fmt(x1[0])}" y1="${fmt(y1[0])}" x2="${fmt(x2[0])}" y2="${fmt(y2[0])}" ${common}>${animate("x1",x1,s,cfg)}${animate("y1",y1,s,cfg)}${animate("x2",x2,s,cfg)}${animate("y2",y2,s,cfg)}${stroke.anim}</line>`
}
function text(first,states,s,cfg,common,fill){
 const x=states.map(l=>valueAt(l,"bounds.x",first.bounds.x)),size=states.map(l=>finite(l&&l.text?l.text.fontSize:first.text.fontSize,14)),y=states.map((l,i)=>valueAt(l,"bounds.y",first.bounds.y)+size[i]),family=first.text.fontName&&first.text.fontName.family?esc(first.text.fontName.family):"sans-serif";
 return `<text x="${fmt(x[0])}" y="${fmt(y[0])}" font-family="${family}" font-size="${fmt(size[0])}" ${common}>${esc(first.text.characters||"")}${animate("x",x,s,cfg)}${animate("y",y,s,cfg)}${animate("font-size",size,s,cfg)}${fill.anim}</text>`
}
module.exports={rect,ellipse,line,text};
