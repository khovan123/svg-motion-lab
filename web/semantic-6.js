(function(root){
'use strict';
const S=root.__SMC;
S.buildSemanticSvg=function(manifest,schedule){
  const byId=new Map(manifest.states.map(s=>[s.id,s]));
  const states=schedule.stateIds.map(id=>byId.get(id)).filter(Boolean);
  const first=states[0]||manifest.states[0];
  const allTracks=S.matchLayers(states);
  const tracks=allTracks.filter(S.trackSupported);
  const defs=[];
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
  if(report.semanticTracks<3||ratio<.45)return {svg:null,report};
  const svg='<?xml version="1.0" encoding="UTF-8"?><svg id="motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+S.round(first.width)+' '+S.round(first.height)+'" width="'+S.round(first.width)+'" height="'+S.round(first.height)+'" data-render-mode="semantic" data-duration="'+S.round(schedule.totalDuration)+'" data-infinite="'+schedule.infinite+'"><defs>'+defs.join('')+'</defs><g id="motion-scene">'+body+'</g></svg>';
  return {svg,report};
};
S.utf8Base64=function(text){const bytes=new TextEncoder().encode(text);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary)};
S.dataUri=svg=>'data:image/svg+xml;base64,'+S.utf8Base64(svg);
S.buildSnapshotSvg=function(manifest,schedule,report){
  const byId=new Map(manifest.states.map(s=>[s.id,s])),states=schedule.stateIds.map(id=>byId.get(id)).filter(Boolean),first=states[0]||manifest.states[0],groups=[];
  states.forEach(function(state,index){
    const values=states.map((_,i)=>i===index?1:0);if(schedule.looped)values.push(index===0?1:0);
    groups.push('<g opacity="'+(index===0?1:0)+'"><image x="0" y="0" width="'+S.round(state.width)+'" height="'+S.round(state.height)+'" href="'+S.dataUri(state.svg)+'"/>'+S.animate('opacity',S.timeline(values,schedule),schedule)+'</g>');
  });
  report.renderMode='snapshot';
  return '<?xml version="1.0" encoding="UTF-8"?><svg id="motion-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+S.round(first.width)+' '+S.round(first.height)+'" data-render-mode="snapshot"><g id="motion-scene">'+groups.join('')+'</g></svg>';
};
S.buildHtml=function(svg,schedule){
  const data=JSON.stringify({duration:schedule.totalDuration,infinite:schedule.infinite}).replace(/</g,'\\u003c');
  const runtime="(()=>{const D="+data+",svg=document.querySelector('#motion-svg'),status=document.querySelector('#status');let start=performance.now(),paused=false,pauseAt=0,raf=0;function tick(now){if(!paused){const elapsed=(now-start)/1000,t=D.infinite?elapsed%D.duration:Math.min(elapsed,D.duration);if(svg&&svg.setCurrentTime)svg.setCurrentTime(t);status.textContent=(D.infinite?'Infinite':'Play once')+' · '+t.toFixed(2)+' / '+D.duration.toFixed(2)+'s';if(D.infinite||elapsed<D.duration)raf=requestAnimationFrame(tick)}else raf=requestAnimationFrame(tick)}document.querySelector('#restart').onclick=()=>{cancelAnimationFrame(raf);start=performance.now();paused=false;raf=requestAnimationFrame(tick)};document.querySelector('#pause').onclick=()=>{paused=!paused;if(paused)pauseAt=performance.now();else start+=performance.now()-pauseAt};if(svg&&svg.pauseAnimations)svg.pauseAnimations();raf=requestAnimationFrame(tick)})()";
  return '<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:transparent;font:14px system-ui}.app{width:min(920px,calc(100vw - 24px));display:grid;gap:10px}.stage{overflow:hidden;border-radius:16px;background:#fff}.stage svg{display:block;width:100%;height:auto}.bar{display:flex;gap:8px;align-items:center;padding:10px;border-radius:10px;background:#fff;color:#172033}button{height:36px;border:1px solid #d9deec;border-radius:8px;background:#fff;padding:0 12px}.bar span{margin-left:auto;color:#697386}</style><body><main class="app"><div class="stage">'+svg+'</div><div class="bar"><button id="pause">Pause / Play</button><button id="restart">Restart</button><span id="status"></span></div></main><script>'+runtime+'</scr'+'ipt></body></html>';
};
})(window);
