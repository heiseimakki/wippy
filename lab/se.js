/* 演出ずかん用の SE（本番の c_core.js と f77_cfx.js から 自動で コピー） */
(function(){var HUMAN=true;var SPEED=1;
let AC=null,MUTED=false;
function ac(){if(!AC){try{if(navigator.audioSession)navigator.audioSession.type='playback';AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
/* 効果音はぜんぶここを通す：コンプレッサーで音量をそろえて、全体を大きめに */
let SFXOUT=null;function sfxOut(){const a=ac();if(!a)return null;if(!SFXOUT){const c=a.createDynamicsCompressor();c.threshold.value=-18;c.ratio.value=4;const g=a.createGain();g.gain.value=2.2;g.connect(c);c.connect(a.destination);SFXOUT=g}return SFXOUT}
/* iPhoneは「タップ（指をはなした時）」でないと音が出ないので、そこで音をアンロック */
function tone(f,d,{type='triangle',vol=.12,at=0,slide=0,dest=null}={}){if(!HUMAN||MUTED)return;const a=ac();if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g).connect(dest||sfxOut()||a.destination);o.start(t);o.stop(t+d+.02)}
let NOISEBUF=null;
function noise(d,{vol=.3,at=0,freq=1200,type='lowpass',t0=null,dest=null,ctx=null}={}){if(!ctx&&(!HUMAN||MUTED))return;const a=ctx||ac();if(!a)return;const t=t0??(a.currentTime+at);
  if(!NOISEBUF){NOISEBUF=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=NOISEBUF.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1}
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=NOISEBUF;f.type=type;f.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);
  s.connect(f).connect(g).connect(dest||sfxOut()||a.destination);s.start(t,Math.random()*.5);s.stop(t+d+.02)}
const SFX={coin(){tone(1568,.12);tone(2093,.25,{at:.07})},place(){noise(.14,{vol:.4,freq:500});tone(220,.12,{type:'sine',vol:.15,slide:120})},tap(){tone(880,.06,{vol:.08})},
  shot(){noise(.12,{vol:.5,freq:2600});tone(900,.06,{type:'square',vol:.04,slide:200})},
  hit(){noise(.2,{vol:.5,freq:1400});tone(140,.2,{type:'sine',vol:.25,slide:60})},crit(){noise(.3,{vol:.6,freq:3000});tone(90,.35,{type:'sine',vol:.35,slide:40})},
  win(){[784,988,1175,1568].forEach((f,i)=>tone(f,.25,{at:i*.09}))},lose(){[392,349,311,262].forEach((f,i)=>tone(f,.35,{at:i*.17}))},bad(){tone(300,.25,{type:'square',vol:.05,slide:150})},
  legend(){[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,.6,{vol:.1,at:i*.1}))},whoosh(){noise(.5,{vol:.25,freq:700})},
  sparkle(){[2093,2637,3136,2637,3520].forEach((f,i)=>tone(f,.15,{vol:.05,at:i*.05,type:'sine'}))},guard(){tone(330,.15,{type:'square',vol:.05});tone(660,.2,{type:'square',vol:.04,at:.05})},
  poison(){tone(200,.25,{type:'sawtooth',vol:.04,slide:120})},boing(){tone(180,.4,{type:'sine',vol:.2,slide:700})},squish(){noise(.25,{vol:.3,freq:300});tone(120,.25,{type:'sine',vol:.15,slide:60})},
  heal(){[660,880,1320].forEach((f,i)=>tone(f,.2,{vol:.06,at:i*.06,type:'sine'}))},drum(){tone(110,.18,{type:'sine',vol:.35,slide:50});noise(.08,{vol:.15,freq:4000})},
  die(){tone(400,.3,{type:'square',vol:.04,slide:80})},enemyIn(){tone(150,.18,{type:'sawtooth',vol:.05,slide:250})},
  click(){tone(1300,.035,{type:'square',vol:.025});tone(1900,.05,{type:'sine',vol:.04,at:.015})},
  pop(){tone(480,.09,{type:'sine',vol:.12,slide:1150})},swish(){noise(.2,{vol:.16,freq:2600,type:'bandpass'})},
  draw(){noise(.13,{vol:.13,freq:3600,type:'highpass'});tone(1400,.06,{type:'sine',vol:.045,at:.07})},
  tink(){tone(2300+Math.random()*500,.09,{type:'sine',vol:.06})},
  summon(){noise(.32,{vol:.14,freq:900});tone(280,.3,{type:'sine',vol:.08,slide:950});[1047,1319,1568].forEach((f,i)=>tone(f,.2,{vol:.05,type:'sine',at:.2+i*.06}))},
  shieldUp(){[1568,2093,2637].forEach((f,i)=>tone(f,.45,{type:'sine',vol:.05,at:i*.07}))},
  tauntUp(){tone(90,.35,{type:'sine',vol:.32,slide:45});noise(.22,{vol:.25,freq:420})},
  reviveUp(){[523,659,784,1047].forEach((f,i)=>tone(f,.55,{vol:.05,type:'sine',at:i*.08}))},
  zap(){tone(1900,.16,{type:'sawtooth',vol:.04,slide:220});noise(.1,{vol:.1,freq:5000,type:'highpass'})},
  twiceUp(){tone(880,.07,{vol:.08});tone(1175,.08,{vol:.08,at:.1})},sneaky(){noise(.35,{vol:.1,freq:650,type:'bandpass'});tone(600,.3,{type:'sine',vol:.03,slide:300})},
  fanfare(){[523,659,784].forEach((f,i)=>tone(f,.14,{type:'square',vol:.035,at:i*.09}));tone(1047,.38,{type:'square',vol:.045,at:.27})},
  swing(){noise(.22,{vol:.24,freq:1600,type:'bandpass'})},
  heroHit(){tone(70,.42,{type:'sine',vol:.42,slide:34});noise(.3,{vol:.35,freq:800})},
  poof(){noise(.38,{vol:.24,freq:900});tone(520,.26,{type:'sine',vol:.05,slide:150})},
  turnMe(){[659,880,1175].forEach((f,i)=>tone(f,.22,{vol:.07,at:i*.06}))},turnFoe(){[220,196,165].forEach((f,i)=>tone(f,.28,{type:'sawtooth',vol:.04,at:i*.09}))},
  step(){[0,.16,.32].forEach(t=>{tone(170,.06,{type:'sine',vol:.15,slide:90,at:t});noise(.05,{vol:.08,freq:1500,at:t})})},
  blip(p=700){tone(p,.035,{type:'square',vol:.022})},
  wind(){noise(2.6,{vol:.1,freq:450})},thunder(){noise(1.3,{vol:.5,freq:280});tone(55,1.1,{type:'sine',vol:.3,slide:30})},
  chime(){[1319,1568,1976,2637,3136].forEach((f,i)=>tone(f,.9,{type:'sine',vol:.035,at:i*.12}))},
  swell(){[262,330,392,523,659].forEach((f,i)=>tone(f,1.6,{type:'sine',vol:.045,at:i*.16}))},
  flip(){noise(.08,{vol:.15,freq:3000,type:'highpass'});tone(900,.05,{type:'sine',vol:.05,at:.04})},ding(){tone(1760,.22,{type:'sine',vol:.06});tone(2637,.3,{type:'sine',vol:.03,at:.05})}};
const S={
  safe(f){try{if(typeof HUMAN!=='undefined'&&!HUMAN)return;f()}catch(e){}},
  kenzan(){S.safe(()=>{SFX.fanfare&&SFX.fanfare()})},
  glass(){S.safe(()=>{noise(.25,{vol:.18,freq:4000,type:'highpass'});tone(2400,.12,{vol:.07});tone(3200,.16,{vol:.06,at:.05});tone(4100,.12,{vol:.04,at:.1})})},
  ice(){S.safe(()=>{tone(2600,.18,{vol:.07});tone(3400,.25,{vol:.05,at:.06});noise(.15,{vol:.1,freq:5000,type:'highpass'})})},
  hiccup(){S.safe(()=>{tone(520,.08,{vol:.08,slide:780,type:'sine'});tone(400,.12,{vol:.06,at:.35,slide:640,type:'sine'})})},
  bubble(){S.safe(()=>{for(let i=0;i<4;i++)tone(300+Math.random()*400,.08,{vol:.05,at:i*.09,slide:900,type:'sine'})})},
  wind(){S.safe(()=>{SFX.wind?SFX.wind():noise(1.2,{vol:.2,freq:600})})},
  poof(){S.safe(()=>{SFX.poof?SFX.poof():noise(.3,{vol:.2,freq:800})})},
  heal(){S.safe(()=>{SFX.heal&&SFX.heal()})},
  buff(){S.safe(()=>{SFX.sparkle&&SFX.sparkle()})},
  down(){S.safe(()=>{tone(500,.25,{vol:.07,slide:220,type:'sine'})})},
  ko(){S.safe(()=>{tone(700,.4,{vol:.07,slide:180,type:'sine'})})},
  revive(){S.safe(()=>{SFX.reviveUp&&SFX.reviveUp()})},
  deadly(){S.safe(()=>{SFX.crit&&SFX.crit();tone(90,.5,{type:'sawtooth',vol:.08,slide:50})})},
  thud(){S.safe(()=>{SFX.drum?SFX.drum():noise(.2,{vol:.3,freq:300})})},
  boom(){S.safe(()=>{SFX.boom?SFX.boom():(SFX.thunder&&SFX.thunder())})},
  squish(){S.safe(()=>{SFX.squish&&SFX.squish()})},
  clack(){S.safe(()=>{tone(900,.05,{vol:.1,type:'square'});tone(1300,.06,{vol:.07,at:.05,type:'square'})})},
  creak(){S.safe(()=>{for(let i=0;i<3;i++)tone(180+i*30,.18,{vol:.06,at:i*.3,type:'sawtooth',slide:120})})},
  ghost(){S.safe(()=>{tone(300,.8,{vol:.05,slide:180,type:'sine'});tone(450,.8,{vol:.03,slide:260,type:'sine',at:.1})})},
  gnaw(){S.safe(()=>{for(let i=0;i<4;i++)tone(2200+Math.random()*600,.03,{vol:.07,at:i*.11,type:'square'})})},
  boing(){S.safe(()=>{SFX.boing&&SFX.boing()})},
  whoosh(){S.safe(()=>{SFX.whoosh&&SFX.whoosh()})},
  swing(){S.safe(()=>{SFX.swing?SFX.swing():(SFX.whoosh&&SFX.whoosh())})},
};

const TXT={claw:'ザシュッ！',fang:'ガブッ！',zombie:'ガブッ！',punch:'ガシャーン！',meat:'ボヨン！',bone:'カコーン！',spike:'チクッ',ghost:'ヒヤッ…',note:'ジャーン♪',fireball:'ボウッ！',bomb:'ドッカーン！',bottle:'パリーン！',card:'シュパッ！',magic:'キラリーン！',ice:'つめた〜い！',water:'バシャッ！',ink:'ブシュッ！',tongue:'ペチッ',rush:'ドーン！',dive:'ツンツン！',slash:'ズバッ！',wind:'ビュオォ！',lasso:'グイッ！'};
const SND={claw:()=>SFX.swish&&SFX.swish(),fang:S.squish,zombie:S.squish,punch:S.thud,meat:S.squish,bone:S.clack,spike:S.swing,ghost:S.ghost,note:()=>{tone(784,.1,{vol:.08});tone(988,.1,{vol:.08,at:.08});tone(1175,.14,{vol:.08,at:.16})},fireball:()=>noise(.35,{vol:.25,freq:900}),bomb:S.boom,bottle:S.glass,card:()=>SFX.flip&&SFX.flip(),magic:()=>SFX.sparkle&&SFX.sparkle(),ice:S.ice,water:()=>noise(.2,{vol:.2,freq:2500}),ink:S.squish,tongue:S.boing,rush:S.thud,dive:()=>SFX.swish&&SFX.swish(),slash:()=>SFX.swish&&SFX.swish(),wind:S.wind,lasso:()=>SFX.whoosh&&SFX.whoosh(),shoot:()=>SFX.shot&&SFX.shot(),gnaw:S.gnaw,squeeze:S.creak,leaf:S.wind};
window.SE={S,SFX,SND,TXT,tone,noise,ac,set muted(v){MUTED=v},get muted(){return MUTED}};})();
/* 本物の SE（本番と 同じ ファイル） */
(function(){const SE=window.SE;if(!SE)return;const B={},F=['coin','hit','crit','boom','swish','sparkle','heal','revive','poof','fanfare','tap','win','lose','chime','glass','ice','bubble','water','anvil','curse','chest'];let ld=false;
 const load=()=>{if(ld)return;const a=SE.ac();if(!a)return;ld=true;F.forEach(k=>fetch('../audio/se/'+k+'.mp3').then(r=>r.arrayBuffer()).then(x=>a.decodeAudioData(x)).then(b=>B[k]=b).catch(()=>{}))};
 const play=(k)=>{const b=B[k];if(!b){load();return false}const a=SE.ac();const s=a.createBufferSource(),g=a.createGain();g.gain.value=.55;s.buffer=b;s.connect(g).connect(a.destination);s.start();return true};
 ['click','touchend'].forEach(ev=>document.addEventListener(ev,load,{passive:true}));
 const M={coin:'coin',hit:'hit',crit:'crit',swish:'swish',whoosh:'swish',sparkle:'sparkle',heal:'heal',reviveUp:'revive',poof:'poof',fanfare:'fanfare',tap:'tap',win:'win',lose:'lose',chime:'chime',poison:'bubble'};
 for(const k in M){const f=SE.SFX[k];SE.SFX[k]=function(){if(play(M[k]))return;return f&&f.apply(this,arguments)}}
 ['glass','ice','bubble','water'].forEach(k=>{const f=SE.S[k];SE.S[k]=function(){if(play(k))return;return f&&f.apply(this,arguments)}});
 SE.S.boom=function(){if(!play('boom'))SE.SFX.thunder&&SE.SFX.thunder()};
 if(SE.SND){SE.SND.water=()=>{if(!play('water'))SE.noise(.2,{vol:.2,freq:2500})}}
})();
