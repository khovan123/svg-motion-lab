(function(root){
'use strict';
const S=root.__SMC;
S.buildSemanticSvg=function(manifest,schedule){
  const byId=new Map(manifest.states.map(s=>[s.id,s]));
  const states=schedule.stateIds.map(id=>byId.get(id)).filter(Boolean);
  const first=states[0]||manifest.states[0];
  const allTracks=S.matchLayers(states),tracks=allTracks.filter(S.trackSupported),defs=[];
  const report={renderMode:'semantic',tracks:tracks.length,allTracks:allTracks.length,semanticTracks:0,pathMorphs:0,unsupportedTracks:0};
  let body='';
  for(const track of tracks){
    let markup=null;
    if(track.type==='VECTOR'||track.type==='BOOLEAN_OPERATION')markup=S.renderVectorTrack(track,schedule.stateIds,schedule,defs,report);
    else if(track.type==='TEXT')markup=S.renderTextTrack(track,schedule.stateIds,schedule,defs,report);
    else markup=S.renderTrack(track,schedule.stateIds,schedule,defs,report);
    if(markup)body+=markup;else report.unsupportedTracks+=1;
  }
  const ratio=tracks.length?report.semanticTracks/tracks.length:0;
  if(report.semanticTracks<3||ratio<.7)return {svg:null,report};
  return {svg:'<?xml version="1.0" encoding="UTF-8"?><svg id="motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+S.round(first.width)+' '+S.round(first.height)+'" width="'+S.round(first.width)+'" height="'+S.round(first.height)+'" data-render-mode="semantic" data-duration="'+S.round(schedule.totalDuration)+'" data-infinite="'+schedule.infinite+'"><defs>'+defs.join('')+'</defs><g id="motion-scene">'+body+'</g></svg>',report};
};
S.utf8Base64=function(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary)};
S.dataUri=svg=>'data:image/svg+xml;base64,'+S.utf8Base64(svg);
S.requiresFidelity=function(manifest){return manifest.states.some(state=>/<(?:mask|clipPath|filter|fe[A-Z])/i.test(state.svg||''))};

function identityOf(layer){return layer&&(layer.stableNodeId||layer.pluginKey||layer.structuralSlot||layer.semanticPath||layer.key)||null}
function motionHint(fromState,toState,width,height){
  const fromLayers=fromState&&fromState.layers||[],toLayers=toState&&toState.layers||[];
  const toMap=new Map();
  toLayers.forEach(layer=>{const id=identityOf(layer);if(id)toMap.set(id,layer)});
  const candidates=[];
  fromLayers.forEach(layer=>{
    const id=identityOf(layer),next=id&&toMap.get(id);if(!next||!layer.bounds||!next.bounds)return;
    const a=layer.bounds,b=next.bounds;
    const acx=S.num(a.x)+S.num(a.width)/2,acy=S.num(a.y)+S.num(a.height)/2;
    const bcx=S.num(b.x)+S.num(b.width)/2,bcy=S.num(b.y)+S.num(b.height)/2;
    const dx=bcx-acx,dy=bcy-acy;
    const sx=Math.max(.25,Math.min(4,S.num(b.width,1)/Math.max(.001,S.num(a.width,1))));
    const sy=Math.max(.25,Math.min(4,S.num(b.height,1)/Math.max(.001,S.num(a.height,1))));
    const distance=Math.hypot(dx,dy);
    const scaleDelta=Math.abs(Math.log(sx))+Math.abs(Math.log(sy));
    if(distance<.5&&scaleDelta<.02)return;
    const area=Math.max(1,S.num(a.width,1)*S.num(a.height,1));
    const weight=Math.sqrt(area)*(distance+scaleDelta*40);
    candidates.push({dx,dy,sx,sy,weight});
  });
  candidates.sort((a,b)=>b.weight-a.weight);
  const sample=candidates.slice(0,Math.max(1,Math.min(8,Math.ceil(candidates.length*.35))));
  if(!sample.length)return {dx:0,dy:0,sx:1,sy:1};
  let total=0,dx=0,dy=0,lsx=0,lsy=0;
  sample.forEach(item=>{const w=item.weight;total+=w;dx+=item.dx*w;dy+=item.dy*w;lsx+=Math.log(item.sx)*w;lsy+=Math.log(item.sy)*w});
  dx/=total;dy/=total;
  dx=Math.max(-width*.45,Math.min(width*.45,dx));
  dy=Math.max(-height*.45,Math.min(height*.45,dy));
  return {dx,dy,sx:Math.exp(lsx/total),sy:Math.exp(lsy/total)};
}

S.buildFidelitySvg=function(manifest,schedule,report){
  const byId=new Map(manifest.states.map(s=>[s.id,s]));
  const states=schedule.stateIds.map(id=>byId.get(id)).filter(Boolean);
  const first=states[0]||manifest.states[0];
  const groups=[];
  states.forEach(function(state,index){
    groups.push('<g id="fidelity-state-'+index+'" opacity="'+(index===0?1:0)+'" transform-origin="'+S.round(first.width/2)+'px '+S.round(first.height/2)+'px"><image x="0" y="0" width="'+S.round(first.width)+'" height="'+S.round(first.height)+'" preserveAspectRatio="none" href="'+S.dataUri(state.svg)+'"/></g>');
  });
  const hints=schedule.segments.map(segment=>motionHint(byId.get(segment.from),byId.get(segment.to),first.width,first.height));
  const runtimeData={duration:schedule.totalDuration,infinite:schedule.infinite,segments:schedule.segments.map((segment,index)=>({from:states.findIndex(s=>s.id===segment.from),to:states.findIndex(s=>s.id===segment.to),start:segment.transitionStart,end:segment.transitionEnd,hint:hints[index]}))};
  const json=JSON.stringify(runtimeData).replace(/</g,'\\u003c');
  const runtime="(()=>{const D="+json+",svg=document.currentScript.ownerDocument.documentElement,groups=[...svg.querySelectorAll('[id^=fidelity-state-]')];let started=performance.now(),paused=false,pauseAt=0,raf=0,manual=false;const clamp=v=>Math.max(0,Math.min(1,v));const ease=p=>p*p*(3-2*p);function reset(){for(const g of groups){g.style.opacity='0';g.setAttribute('transform','translate(0 0) scale(1 1)')}}function render(t){if(!groups.length)return;const total=Math.max(.001,D.duration);if(D.infinite)t=((t%total)+total)%total;else t=Math.max(0,Math.min(total,t));let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<=s.end){segment=s;break}}reset();if(!segment){groups[active].style.opacity='1';return}const raw=clamp((t-segment.start)/Math.max(.001,segment.end-segment.start)),p=ease(raw),alphaIn=Math.sin(p*Math.PI/2)**2,alphaOut=1-alphaIn,h=segment.hint||{dx:0,dy:0,sx:1,sy:1};const out=groups[segment.from],inc=groups[segment.to],strength=.18;out.style.opacity=String(alphaOut);inc.style.opacity=String(alphaIn);const outDx=h.dx*p*strength,outDy=h.dy*p*strength,inDx=-h.dx*(1-p)*strength,inDy=-h.dy*(1-p)*strength;const outSx=1+(h.sx-1)*p*.08,outSy=1+(h.sy-1)*p*.08,inSx=1-(h.sx-1)*(1-p)*.08,inSy=1-(h.sy-1)*(1-p)*.08;out.setAttribute('transform',`translate(${outDx} ${outDy}) scale(${outSx} ${outSy})`);inc.setAttribute('transform',`translate(${inDx} ${inDy}) scale(${inSx} ${inSy})`)}function tick(now){if(!paused&&!manual)render((now-started)/1000);raf=requestAnimationFrame(tick)}const controller={seek(t){manual=true;render(Number(t)||0)},play(){manual=false;paused=false;started=performance.now();},pause(){paused=true;pauseAt=performance.now()},restart(){manual=false;paused=false;started=performance.now();render(0)}};svg.__motionController=controller;render(0);raf=requestAnimationFrame(tick)})()";
  report.renderMode='fidelity-motion-compensated';report.semanticTracks=0;report.pathMorphs=0;
  return '<?xml version="1.0" encoding="UTF-8"?><svg id="motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+S.round(first.width)+' '+S.round(first.height)+'" width="'+S.round(first.width)+'" height="'+S.round(first.height)+'" data-render-mode="fidelity-motion-compensated" data-duration="'+S.round(schedule.totalDuration)+'" data-infinite="'+schedule.infinite+'"><g id="motion-scene">'+groups.join('')+'</g><script><![CDATA['+runtime+']]></script></svg>';
};
S.buildSnapshotSvg=S.buildFidelitySvg;
S.buildHtml=function(svg,schedule){
  const data=JSON.stringify({duration:schedule.totalDuration,infinite:schedule.infinite}).replace(/</g,'\\u003c');
  const runtime="(()=>{const D="+data+",svg=document.querySelector('#motion-svg'),status=document.querySelector('#status');let start=performance.now(),paused=false,pauseAt=0,raf=0;function tick(now){if(!paused){const elapsed=(now-start)/1000,t=D.infinite?elapsed%D.duration:Math.min(elapsed,D.duration);if(svg&&svg.__motionController)svg.__motionController.seek(t);else if(svg&&svg.setCurrentTime)svg.setCurrentTime(t);status.textContent=(D.infinite?'Infinite':'Play once')+' · '+t.toFixed(2)+' / '+D.duration.toFixed(2)+'s';if(D.infinite||elapsed<D.duration)raf=requestAnimationFrame(tick)}else raf=requestAnimationFrame(tick)}document.querySelector('#restart').onclick=()=>{cancelAnimationFrame(raf);start=performance.now();paused=false;if(svg&&svg.__motionController)svg.__motionController.restart();raf=requestAnimationFrame(tick)};document.querySelector('#pause').onclick=()=>{paused=!paused;if(paused)pauseAt=performance.now();else start+=performance.now()-pauseAt};if(svg&&svg.pauseAnimations)svg.pauseAnimations();raf=requestAnimationFrame(tick)})()";
  return '<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:transparent;font:14px system-ui}.app{width:min(920px,calc(100vw - 24px));display:grid;gap:10px}.stage{overflow:hidden;border-radius:16px;background:#fff}.stage svg{display:block;width:100%;height:auto}.bar{display:flex;gap:8px;align-items:center;padding:10px;border-radius:10px;background:#fff;color:#172033}button{height:36px;border:1px solid #d9deec;border-radius:8px;background:#fff;padding:0 12px}.bar span{margin-left:auto;color:#697386}</style><body><main class="app"><div class="stage">'+svg+'</div><div class="bar"><button id="pause">Pause / Play</button><button id="restart">Restart</button><span id="status"></span></div></main><script>'+runtime+'</scr'+'ipt></body></html>';
};
})(window);
