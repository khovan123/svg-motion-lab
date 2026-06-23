"use strict";
function finite(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}
function round(v,p=5){const n=10**p;return Math.round(finite(v)*n)/n}
function fmt(v){return String(round(v,5))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function safeId(v){return String(v).replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)||"layer"}
function valueAt(o,p,f){if(!o)return f;let v=o;for(const k of p.split("."))v=v&&v[k];return finite(v,f)}
function radius(l){const r=l&&l.cornerRadius;if(!r)return 0;if(Number.isFinite(Number(r.all)))return Number(r.all);return finite(r.topLeft,0)}
function colorHex(c){c=c||{};const h=v=>Math.max(0,Math.min(255,Math.round(finite(v)*255))).toString(16).padStart(2,"0");return`#${h(c.r)}${h(c.g)}${h(c.b)}`}
function pathSig(v){return String(v||"").replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi,"#").replace(/\s+/g," ").trim()}
function allEqual(a){return a.every(v=>String(v)===String(a[0]))}
function numeric(a){return a.every(v=>typeof v==="number"&&Number.isFinite(v))}
module.exports={finite,round,fmt,clamp,lerp,esc,safeId,valueAt,radius,colorHex,pathSig,allEqual,numeric};
