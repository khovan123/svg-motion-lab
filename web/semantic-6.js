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

S.buildFidelitySvg=function(manifest,schedule,report){
  const byId=new Map(manifest.states.map(s=>[s.id,s]));
  const states=schedule.stateIds.map(id=>byId.get(id)).filter(Boolean);
  const first=states[0]||manifest.states[0];
  const groups=[];
  states.forEach(function(state,index){
    groups.push('<g id="fidelity-state-'+index+'" opacity="'+(index===0?1:0)+'" visibility="'+(index===0?'visible':'hidden')+'" style="isolation:isolate"><image x="0" y="0" width="'+S.round(first.width)+'" height="'+S.round(first.height)+'" preserveAspectRatio="xMidYMid meet" href="'+S.dataUri(state.svg)+'"/></g>');
  });
  const runtimeData={duration:schedule.totalDuration,infinite:schedule.infinite,segments:schedule.segments.map(segment=>({from:states.findIndex(s=>s.id===segment.from),to:states.findIndex(s=>s.id===segment.to),start:segment.transitionStart,end:segment.transitionEnd}))};
  const json=JSON.stringify(runtimeData).replace(/</g,'\\u003c');
  const runtime="(()=>{const D="+json+",svg=document.currentScript.ownerDocument.documentElement,scene=svg.querySelector('#motion-scene'),groups=[...svg.querySelectorAll('[id^=fidelity-state-]')];let started=performance.now(),paused=false,manual=false,lastMode='',lastFrom=-1,lastTo=-1;const clamp=v=>Math.max(0,Math.min(1,v));const smooth=p=>p*p*p*(p*(p*6-15)+10);function showOnly(index){if(lastMode==='hold'&&lastFrom===index)return;for(let i=0;i<groups.length;i++){const active=i===index;groups[i].style.opacity=active?'1':'0';groups[i].setAttribute('visibility',active?'visible':'hidden')}if(groups[index]&&scene.lastElementChild!==groups[index])scene.appendChild(groups[index]);lastMode='hold';lastFrom=index;lastTo=-1}function blend(from,to,progress){if(!groups[from]||!groups[to])return;const changed=lastMode!=='blend'||lastFrom!==from||lastTo!==to;if(changed){for(let i=0;i<groups.length;i++){const active=i===from||i===to;groups[i].setAttribute('visibility',active?'visible':'hidden');groups[i].style.opacity=i===from?'1':'0'}scene.appendChild(groups[from]);scene.appendChild(groups[to]);lastMode='blend';lastFrom=from;lastTo=to}groups[from].style.opacity='1';groups[to].style.opacity=String(smooth(clamp(progress)))}function render(t){if(!groups.length)return;const total=Math.max(.001,D.duration);t=D.infinite?((t%total)+total)%total:Math.max(0,Math.min(total,t));let active=0,segment=null;for(const s of D.segments){if(t<s.start){active=s.from;break}active=s.to;if(t>=s.start&&t<s.end){segment=s;break}}if(segment){blend(segment.from,segment.to,(t-segment.start)/Math.max(.001,segment.end-segment.start))}else showOnly(active)}function tick(now){if(!paused&&!manual)render((now-started)/1000);requestAnimationFrame(tick)}svg.__motionController={seek(t){manual=true;render(Number(t)||0)},play(){manual=false;paused=false;started=performance.now()},pause(){paused=true},restart(){manual=false;paused=false;started=performance.now();render(0)}};render(0);requestAnimationFrame(tick)})()";
  report.renderMode='fidelity-stable-crossfade';report.semanticTracks=0;report.pathMorphs=0;
  return '<?xml version="1.0" encoding="UTF-8"?><svg id="motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+S.round(first.width)+' '+S.round(first.height)+'" width="'+S.round(first.width)+'" height="'+S.round(first.height)+'" data-render-mode="fidelity-stable-crossfade" data-duration="'+S.round(schedule.totalDuration)+'" data-infinite="'+schedule.infinite+'"><g id="motion-scene" style="isolation:isolate">'+groups.join('')+'</g><script><![CDATA['+runtime+']]></script></svg>';
};
S.buildSnapshotSvg=S.buildFidelitySvg;
S.buildHtml=function(svg,schedule){
  const data=JSON.stringify({duration:schedule.totalDuration,infinite:schedule.infinite}).replace(/</g,'\\u003c');
  const runtime="(()=>{const D="+data+",svg=document.querySelector('#motion-svg'),status=document.querySelector('#status');let start=performance.now(),paused=false,pauseAt=0,raf=0;function tick(now){if(!paused){const elapsed=(now-start)/1000,t=D.infinite?elapsed%D.duration:Math.min(elapsed,D.duration);if(svg&&svg.__motionController)svg.__motionController.seek(t);else if(svg&&svg.setCurrentTime)svg.setCurrentTime(t);status.textContent=(D.infinite?'Infinite':'Play once')+' · '+t.toFixed(2)+' / '+D.duration.toFixed(2)+'s';if(D.infinite||elapsed<D.duration)raf=requestAnimationFrame(tick)}else raf=requestAnimationFrame(tick)}document.querySelector('#restart').onclick=()=>{cancelAnimationFrame(raf);start=performance.now();paused=false;if(svg&&svg.__motionController)svg.__motionController.restart();raf=requestAnimationFrame(tick)};document.querySelector('#pause').onclick=()=>{paused=!paused;if(paused)pauseAt=performance.now();else start+=performance.now()-pauseAt};if(svg&&svg.pauseAnimations)svg.pauseAnimations();raf=requestAnimationFrame(tick)})()";
  return '<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:transparent;font:14px system-ui}.app{width:min(920px,calc(100vw - 24px));display:grid;gap:10px}.stage{overflow:hidden;border-radius:16px;background:#fff}.stage svg{display:block;width:100%;height:auto}.bar{display:flex;gap:8px;align-items:center;padding:10px;border-radius:10px;background:#fff;color:#172033}button{height:36px;border:1px solid #d9deec;border-radius:8px;background:#fff;padding:0 12px}.bar span{margin-left:auto;color:#697386}</style><body><main class="app"><div class="stage">'+svg+'</div><div class="bar"><button id="pause">Pause / Play</button><button id="restart">Restart</button><span id="status"></span></div></main><script>'+runtime+'</scr'+'ipt></body></html>';
};
})(window);
