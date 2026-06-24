(function(root){
'use strict';
const S=root.__SMC=root.__SMC||{};
S.num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
S.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
S.round=v=>Math.round(S.num(v)*10000)/10000;
S.esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
S.normalize=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ').replace(/[^a-z0-9 _-]/g,'');
S.hex=color=>{if(!color)return '#000000';return '#'+[color.r,color.g,color.b].map(v=>Math.round(S.clamp(S.num(v),0,1)*255).toString(16).padStart(2,'0')).join('')};
S.paintOpacity=(color,paint)=>S.clamp(S.num(color&&color.a,1)*S.num(paint&&paint.opacity,1),0,1);
S.firstPaint=list=>Array.isArray(list)?list.find(p=>p&&p.visible!==false):null;
S.actionOf=reaction=>{const actions=Array.isArray(reaction.actions)?reaction.actions:reaction.action?[reaction.action]:[];return actions.find(a=>a&&(a.destinationStateId||a.destinationId))||null};
S.validate=manifest=>{
 if(!manifest||manifest.schema!=='svg-motion-lab/figma-manifest@3')throw new Error('Chỉ hỗ trợ schema svg-motion-lab/figma-manifest@3.');
 if(!Array.isArray(manifest.states)||!manifest.states.length)throw new Error('Manifest không có states.');
 if(!manifest.prototype||!Array.isArray(manifest.prototype.reactions))throw new Error('Manifest không có prototype graph.');
 const missing=manifest.states.filter(s=>typeof s.svg!=='string'||s.svg.indexOf('<svg')<0);if(missing.length)throw new Error('Thiếu SVG snapshot ở '+missing.length+' state.');
 return {states:manifest.states.length,reactions:manifest.prototype.reactions.length,snapshots:manifest.states.length};
};
S.buildBaseSchedule=manifest=>{
 const byId=new Map(manifest.states.map(s=>[s.id,s])),reactions=manifest.prototype.reactions||[],start=manifest.prototype.startStateId||manifest.startNodeId||manifest.states[0].id,stateIds=[],segments=[],seen=new Set();let current=start,lastDuration=.8,lastEasing={type:'EASE_IN_AND_OUT'};
 while(byId.has(current)&&!seen.has(current)){
  seen.add(current);stateIds.push(current);
  const reaction=reactions.find(r=>r.sourceStateId===current&&r.trigger&&r.trigger.type==='AFTER_TIMEOUT'&&S.actionOf(r));if(!reaction)break;
  const action=S.actionOf(reaction),next=action.destinationStateId||action.destinationId;if(!byId.has(next))break;
  const transition=action.transition||null;
  const duration=Math.max(.001,transition?S.num(transition.duration,lastDuration):lastDuration);
  const easing=transition&&transition.easing?transition.easing:lastEasing;
  segments.push({from:current,to:next,hold:Math.max(0,S.num(reaction.trigger.timeout,.7)),duration,easing,reactionId:reaction.id||null});
  lastDuration=duration;lastEasing=easing;current=next;
 }
 return {stateIds,segments,totalDuration:segments.reduce((sum,s)=>sum+s.hold+s.duration,0),looped:current===start&&segments.length>0};
};
S.customSchedule=(base,custom,infinite)=>{let cursor=0;const segments=base.segments.map((segment,index)=>{const c=custom&&custom[index]||{},hold=Math.max(0,S.num(c.hold,segment.hold)),duration=Math.max(.001,S.num(c.duration,segment.duration)),out=Object.assign({},segment,{hold,duration,transitionStart:cursor+hold,transitionEnd:cursor+hold+duration});cursor=out.transitionEnd;return out});return {stateIds:base.stateIds.slice(),segments,totalDuration:Math.max(cursor,.001),looped:base.looped,infinite:!!infinite}};
})(window);
