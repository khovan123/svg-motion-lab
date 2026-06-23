"use strict";
const { esc, fmt } = require("./utils");
const { dataUri, hasSnapshots } = require("./snapshot");

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function legacy(svg, duration) {
  const inline = String(svg || "").replace(/^<\?xml[^>]+>\s*/, "");
  return `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Figma animation</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef1f8}.stage{width:min(920px,calc(100vw - 32px));overflow:hidden;border-radius:22px;background:#fff;box-shadow:0 24px 70px #35416229}.stage svg{display:block;width:100%}</style><body><div class="stage">${inline}</div><script>(()=>{const s=document.querySelector('svg');if(!s||!s.pauseAnimations)return;s.pauseAnimations();let last=performance.now();function tick(now){s.setCurrentTime((s.getCurrentTime()+(now-last)/1000)%${fmt(duration || 0.001)});last=now;requestAnimationFrame(tick)}requestAnimationFrame(tick)})()</script></body></html>`;
}

function renderFrames(states) {
  return states.map((state, index) => {
    const src = dataUri(state.svg);
    return `<img class="prototype-state${index === 0 ? " active" : ""}" data-state-id="${esc(state.id)}" alt="${esc(state.name || state.id)}" src="${esc(src)}">`;
  }).join("");
}

function renderOptions(states) {
  return states.map(state => `<option value="${esc(state.id)}">${esc(state.name || state.id)}</option>`).join("");
}

function html(input) {
  if (typeof input === "string") return legacy(input, arguments[1]);
  const { states, prototype, width, height, svg, duration } = input;
  if (!hasSnapshots(states)) return legacy(svg, duration);

  const payload = safeJson({ ...prototype, states: states.map(state => ({ id: state.id, name: state.name })) });
  return `<!doctype html>
<html lang="vi">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Figma prototype runtime</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef1f8;font:14px system-ui;color:#182033}.app{width:min(920px,calc(100vw - 32px));display:grid;gap:14px}.stage{position:relative;width:100%;aspect-ratio:${fmt(width)}/${fmt(height)};overflow:hidden;border-radius:22px;background:#fff;box-shadow:0 24px 70px #35416229;touch-action:manipulation}.prototype-state{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;opacity:0;pointer-events:none}.prototype-state.active{opacity:1}.controls{display:grid;grid-template-columns:auto auto minmax(160px,1fr) auto;gap:10px;align-items:center;padding:12px;border-radius:14px;background:#fff}button,select{height:40px;padding:0 14px;border:1px solid #d9deec;border-radius:10px;background:#fff;font:inherit}button:disabled{opacity:.45}.status{min-width:130px;text-align:right;color:#5d677c}@media(max-width:620px){.controls{grid-template-columns:1fr 1fr}.status{text-align:left}}
</style>
<body><main class="app">
<div id="stage" class="stage" tabindex="0">${renderFrames(states)}</div>
<div class="controls"><button id="restart">Restart</button><button id="back">Back</button><select id="state">${renderOptions(states)}</select><output id="status" class="status"></output></div>
</main>
<script>
(()=>{
const ir=${payload};
const stage=document.querySelector('#stage');
const select=document.querySelector('#state');
const status=document.querySelector('#status');
const backButton=document.querySelector('#back');
const frames=new Map([...document.querySelectorAll('[data-state-id]')].map(node=>[node.dataset.stateId,node]));
const reactionsByState=new Map();
for(const reaction of ir.reactions||[]){if(!reactionsByState.has(reaction.sourceStateId))reactionsByState.set(reaction.sourceStateId,[]);reactionsByState.get(reaction.sourceStateId).push(reaction)}
const names=new Map((ir.states||[]).map(state=>[state.id,state.name||state.id]));
const variables=Object.create(null);const variableModes=Object.create(null);const history=[];
let current=ir.startStateId||ir.stateOrder[0];let timer=null;let dragStart=null;

function easing(value){const type=value&&value.type||'EASE_OUT';if(type==='CUSTOM_CUBIC_BEZIER'&&value.easingFunctionCubicBezier){const p=value.easingFunctionCubicBezier;return 'cubic-bezier('+p.x1+','+p.y1+','+p.x2+','+p.y2+')'}return({LINEAR:'linear',EASE_IN:'cubic-bezier(.42,0,1,1)',EASE_OUT:'cubic-bezier(0,0,.58,1)',EASE_IN_AND_OUT:'cubic-bezier(.42,0,.58,1)',EASE_IN_BACK:'cubic-bezier(.36,0,.66,-.56)',EASE_OUT_BACK:'cubic-bezier(.34,1.56,.64,1)',EASE_IN_AND_OUT_BACK:'cubic-bezier(.68,-.6,.32,1.6)',GENTLE:'cubic-bezier(.4,0,.2,1)',QUICK:'cubic-bezier(.2,0,0,1)',BOUNCY:'cubic-bezier(.34,1.56,.64,1)',SLOW:'cubic-bezier(.4,0,.6,1)'})[type]||'cubic-bezier(0,0,.58,1)'}
function valueOf(value){if(value&&typeof value==='object'){if(value.variableId)return variables[value.variableId];if(value.type==='VARIABLE_ALIAS'&&value.id)return variables[value.id];if('value'in value)return value.value}return value}
function compare(condition){if(condition==null)return true;if(typeof condition==='boolean')return condition;const left=valueOf(condition.leftOperand??condition.left);const right=valueOf(condition.rightOperand??condition.right);switch(condition.operator||condition.type){case'EQUALS':return left===right;case'NOT_EQUALS':return left!==right;case'GREATER_THAN':return left>right;case'GREATER_THAN_OR_EQUAL':return left>=right;case'LESS_THAN':return left<right;case'LESS_THAN_OR_EQUAL':return left<=right;case'AND':return (condition.conditions||[]).every(compare);case'OR':return (condition.conditions||[]).some(compare);case'NOT':return !compare(condition.condition);default:return Boolean(valueOf(condition))}}
function actionArray(value){if(!value)return[];return Array.isArray(value.actions)?value.actions:value.action?[value.action]:[]}
function destination(action){return action&&(action.destinationStateId||action.destinationId)}
function transition(action){return action&&action.transition||{type:'SMART_ANIMATE',duration:.3,easing:{type:'EASE_OUT'}}}
function setStatus(extra){status.value=(names.get(current)||current)+(extra?' · '+extra:'');select.value=current;backButton.disabled=!history.length}
function clearTimer(){if(timer){clearTimeout(timer);timer=null}}
function show(next,config,pushHistory=true){if(!frames.has(next)||next===current){schedule();return}clearTimer();const previous=current;const from=frames.get(previous);const to=frames.get(next);const info=config||{};const instant=info.type==='INSTANT'||info.type==='DISSOLVE'&&Number(info.duration)===0;const seconds=instant?0:Math.max(0,Number(info.duration??.3));const css=seconds+'s '+easing(info.easing);if(pushHistory)history.push(previous);to.style.transition='none';to.style.opacity='0';to.classList.add('active');to.offsetWidth;from.style.transition='opacity '+css;to.style.transition='opacity '+css;from.style.opacity='0';to.style.opacity='1';current=next;setStatus(info.type||'NAVIGATE');setTimeout(()=>{from.classList.remove('active');from.style.transition='';to.style.transition='';schedule()},seconds*1000+20)}
function executeConditional(action){const blocks=action.conditionalBlocks||action.branches||[];for(const block of blocks){if(compare(block.condition)){executeActions(actionArray(block));return true}}if(action.elseActions){executeActions(action.elseActions);return true}return false}
function executeAction(action){if(!action)return false;switch(action.type){case'NODE':{const next=destination(action);if(next){show(next,transition(action));return true}return false}case'BACK':goBack();return true;case'CLOSE':goBack();return true;case'SET_VARIABLE':variables[action.variableId]=valueOf(action.variableValue??action.value);return false;case'SET_VARIABLE_MODE':variableModes[action.variableCollectionId]=action.variableModeId||action.modeId;return false;case'CONDITIONAL':return executeConditional(action);default:return false}}
function executeActions(actions){for(const action of actions||[]){if(executeAction(action))return true}schedule();return false}
function runReaction(reaction){if(!reaction)return;clearTimer();executeActions(actionArray(reaction))}
function reactions(){return reactionsByState.get(current)||[]}
function fire(types,event){const wanted=Array.isArray(types)?types:[types];const reaction=reactions().find(item=>item.trigger&&wanted.includes(item.trigger.type));if(!reaction)return false;if(reaction.trigger.type==='KEY_DOWN'&&reaction.trigger.keyCodes&&event&&!reaction.trigger.keyCodes.includes(event.keyCode))return false;runReaction(reaction);return true}
function schedule(){clearTimer();setStatus();const reaction=reactions().find(item=>item.trigger&&item.trigger.type==='AFTER_TIMEOUT');if(!reaction)return;const delay=Math.max(0,Number(reaction.trigger.timeout||0))*1000;timer=setTimeout(()=>runReaction(reaction),delay)}
function goBack(){if(!history.length)return;const next=history.pop();show(next,{type:'INSTANT',duration:0},false)}
function reset(){clearTimer();history.length=0;for(const [id,node] of frames){node.classList.toggle('active',id===ir.startStateId);node.style.opacity=id===ir.startStateId?'1':'0';node.style.transition=''}current=ir.startStateId;setStatus('START');schedule()}

stage.addEventListener('click',event=>fire(['ON_CLICK','ON_TAP'],event));
stage.addEventListener('pointerdown',event=>{dragStart={x:event.clientX,y:event.clientY};fire('ON_PRESS',event)});
stage.addEventListener('pointerup',event=>{if(dragStart&&Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y)>8)fire('ON_DRAG',event);dragStart=null});
stage.addEventListener('mouseenter',event=>fire(['MOUSE_ENTER','ON_HOVER'],event));
stage.addEventListener('mouseleave',event=>fire('MOUSE_LEAVE',event));
window.addEventListener('keydown',event=>fire('KEY_DOWN',event));
document.querySelector('#restart').onclick=reset;backButton.onclick=goBack;select.onchange=()=>show(select.value,{type:'INSTANT',duration:0});
reset();stage.focus();
})()
</script></body></html>`;
}

module.exports = html;
