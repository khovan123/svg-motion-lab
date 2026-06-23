/* Build a semantic vector animation instead of swapping exported SVG frames. */
const fs=require('fs');
const path=require('path');

const DEFAULTS={stateDuration:1.5,states:8};

function render(template,values){
  return Object.keys(values).reduce((result,key)=>result.replaceAll(`{{${key}}}`,String(values[key])),template);
}

function build(options={}){
  const stateDuration=Number(options.stateDuration||process.env.STATE_DURATION)||DEFAULTS.stateDuration;
  const duration=stateDuration*DEFAULTS.states;
  const root=__dirname;
  const out=path.resolve(options.outDir||process.env.OUT_DIR||path.join(root,'dist'));
  const svgTemplate=fs.readFileSync(path.join(root,'src/animation.svg'),'utf8');
  const htmlTemplate=fs.readFileSync(path.join(root,'src/animation.html'),'utf8');
  const values={DURATION:duration,STATE_DURATION:stateDuration};
  const svg=render(svgTemplate,values);
  const html=render(htmlTemplate,{...values,SVG:svg.replace(/^<\?xml[^>]+>\s*/,'')});
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'animation.svg'),svg);
  fs.writeFileSync(path.join(out,'animation.html'),html);
  return {out,svg,html};
}

module.exports={DEFAULTS,render,build};
if(require.main===module){
  const result=build();
  console.log(`Created ${path.join(result.out,'animation.svg')}`);
  console.log(`Created ${path.join(result.out,'animation.html')}`);
}
