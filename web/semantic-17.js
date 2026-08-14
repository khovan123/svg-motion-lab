(function(root){
'use strict';
const compiler=root.SvgMotionCompiler;
const S=root.__SMC;
if(!compiler||!S)return;
const previousCompile=compiler.compile;
const SVG_NS='http://www.w3.org/2000/svg';
const EPS=1e-9;

function round(value){
  const n=Number(value)||0;
  return Math.round(n*1000000)/1000000;
}

function sanitizeSnapshot(state){
  const doc=new DOMParser().parseFromString(String(state&&state.svg||''),'image/svg+xml');
  const error=doc.querySelector('parsererror');
  if(error)throw new Error('Không thể tạo standalone SVG từ state '+String(state&&state.name||state&&state.id||'unknown')+': '+error.textContent.slice(0,160));
  const svg=doc.documentElement;
  svg.querySelectorAll('script').forEach(node=>node.remove());
  [svg,...svg.querySelectorAll('*')].forEach(node=>{
    if(!node.attributes)return;
    [...node.attributes].forEach(attr=>{
      const name=String(attr.name||'');
      const value=String(attr.value||'');
      if(/^on/i.test(name))node.removeAttribute(name);
      if((name==='href'||name==='xlink:href')&&/^\s*javascript:/i.test(value))node.removeAttribute(name);
    });
  });
  return svg;
}

function dataUri(svg){
  const text=new XMLSerializer().serializeToString(svg);
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(text);
}

function scheduleTimes(schedule){
  const total=Math.max(.001,Number(schedule&&schedule.totalDuration)||.001);
  const raw=[0,total];
  (schedule&&schedule.segments||[]).forEach(segment=>{
    raw.push(Math.max(0,Math.min(total,Number(segment.transitionStart)||0)));
    raw.push(Math.max(0,Math.min(total,Number(segment.transitionEnd)||0)));
  });
  raw.sort((a,b)=>a-b);
  const out=[];
  raw.forEach(value=>{
    if(!out.length||Math.abs(value-out[out.length-1])>EPS)out.push(value);
  });
  if(out[0]!==0)out.unshift(0);
  if(Math.abs(out[out.length-1]-total)>EPS)out.push(total);
  return out;
}

function opacityAt(schedule,stateId,time){
  const segments=schedule&&schedule.segments||[];
  let active=schedule&&schedule.stateIds&&schedule.stateIds[0]||stateId;
  for(const segment of segments){
    const start=Number(segment.transitionStart)||0;
    const end=Math.max(start+EPS,Number(segment.transitionEnd)||start+EPS);
    if(time<start-EPS)return active===stateId?1:0;
    if(time<=end+EPS){
      const p=Math.max(0,Math.min(1,(time-start)/(end-start)));
      if(segment.from===stateId&&segment.to===stateId)return 1;
      if(segment.from===stateId)return 1-p;
      if(segment.to===stateId)return p;
      return 0;
    }
    active=segment.to;
  }
  return active===stateId?1:0;
}

function readCanvas(firstState,firstSvg){
  const viewBox=String(firstSvg.getAttribute('viewBox')||'').trim();
  const parts=viewBox.split(/[\s,]+/).map(Number);
  if(parts.length===4&&parts.every(Number.isFinite)){
    return {viewBox:viewBox,x:parts[0],y:parts[1],width:parts[2],height:parts[3]};
  }
  const width=Number(firstSvg.getAttribute('width'))||Number(firstState&&firstState.width)||355;
  const height=Number(firstSvg.getAttribute('height'))||Number(firstState&&firstState.height)||240;
  return {viewBox:'0 0 '+round(width)+' '+round(height),x:0,y:0,width:width,height:height};
}

function buildStandaloneSvg(manifest,schedule){
  const stateById=new Map((manifest.states||[]).map(state=>[state.id,state]));
  const stateIds=(schedule.stateIds||[]).filter(id=>stateById.has(id));
  if(!stateIds.length)throw new Error('Standalone SVG không có state hợp lệ để render.');
  const firstState=stateById.get(stateIds[0]);
  const firstSvg=sanitizeSnapshot(firstState);
  const canvas=readCanvas(firstState,firstSvg);
  const doc=document.implementation.createDocument(SVG_NS,'svg',null);
  const svg=doc.documentElement;
  svg.setAttribute('id','motion-svg');
  svg.setAttribute('viewBox',canvas.viewBox);
  svg.setAttribute('width',String(round(canvas.width)));
  svg.setAttribute('height',String(round(canvas.height)));
  svg.setAttribute('fill','none');
  svg.setAttribute('data-render-mode','standalone-smil-crossfade');
  svg.setAttribute('data-duration',String(round(schedule.totalDuration)));
  svg.setAttribute('data-infinite',String(Boolean(schedule.infinite)));
  svg.setAttribute('data-script-free','true');

  const scene=doc.createElementNS(SVG_NS,'g');
  scene.setAttribute('id','motion-scene');
  scene.setAttribute('style','isolation:isolate');
  svg.appendChild(scene);

  const total=Math.max(.001,Number(schedule.totalDuration)||.001);
  const times=scheduleTimes(schedule);
  const keyTimes=times.map(time=>round(time/total)).join(';');
  const repeatCount=schedule.infinite?'indefinite':'1';

  stateIds.forEach((stateId,index)=>{
    const state=stateById.get(stateId);
    const stateSvg=index===0?firstSvg:sanitizeSnapshot(state);
    const group=doc.createElementNS(SVG_NS,'g');
    group.setAttribute('data-smil-state',String(index));
    group.setAttribute('data-state-id',String(stateId));
    group.setAttribute('opacity',index===0?'1':'0');

    const image=doc.createElementNS(SVG_NS,'image');
    image.setAttribute('x',String(round(canvas.x)));
    image.setAttribute('y',String(round(canvas.y)));
    image.setAttribute('width',String(round(canvas.width)));
    image.setAttribute('height',String(round(canvas.height)));
    image.setAttribute('preserveAspectRatio','xMidYMid meet');
    image.setAttribute('href',dataUri(stateSvg));
    group.appendChild(image);

    const animate=doc.createElementNS(SVG_NS,'animate');
    animate.setAttribute('attributeName','opacity');
    animate.setAttribute('dur',String(round(total))+'s');
    animate.setAttribute('repeatCount',repeatCount);
    animate.setAttribute('fill','freeze');
    animate.setAttribute('calcMode','linear');
    animate.setAttribute('keyTimes',keyTimes);
    animate.setAttribute('values',times.map(time=>round(opacityAt(schedule,stateId,time))).join(';'));
    group.appendChild(animate);
    scene.appendChild(group);
  });

  return '<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(svg);
}

compiler.compile=function(manifest,options){
  const result=previousCompile(manifest,options);
  const runtimeSvg=result.svg;
  const standaloneSvg=buildStandaloneSvg(manifest,result.schedule);
  result.runtimeSvg=runtimeSvg;
  result.svg=standaloneSvg;
  result.html=S.buildHtml(standaloneSvg,result.schedule);

  const compatibility={
    standaloneSvg:true,
    standaloneRenderMode:'standalone-smil-crossfade',
    standaloneHasScripts:false,
    htmlRuntime:true
  };
  result.semanticReport=Object.assign({},result.semanticReport||{},compatibility);
  if(result.report&&result.report.report)result.report.report=Object.assign({},result.report.report,compatibility);
  if(result.ir&&result.ir.smartAnimate)result.ir.smartAnimate=Object.assign({},result.ir.smartAnimate,compatibility);
  return result;
};
})(window);
