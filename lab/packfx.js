/* ===== 11/01 パック開封（PackFX）：ゆびで なぞって やぶる → カードが すべり出る → 1まいずつ めくる =====
   ・パック／光／紙／つぶ は キャンバス、カードは 本物の カード（DOM）を 3Dで めくる
   ・ずかん（lab/packfx.js）と ゲーム（f93_packfx.js）は おなじ ファイル。ゲームでは packCut を つつむ（エラーなら 前の 演出）
   ・音：やぶる音は ゆびの 速さで 大きさが かわる。ほかは SFX／SE2 の 音。終わりは みじかく フェード
   ・11/01 Drive の 新しい SE（mp3）：ゲームは packse.js（パックの 画面で 読む）、ずかんは fx/pack/se/*.mp3（Claudeの中は ZKIMG を atob）。読めないときは 前の 音 */
(function(){
if(window.PackFX)return;
const E={o:k=>1-Math.pow(1-k,3),io:k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,back:k=>{const c=1.6;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)},cl:k=>k<0?0:k>1?1:k};
const lerp=(a,b,k)=>a+(b-a)*k;
const TELL={N:[255,250,235],R:[160,205,255],L:[255,205,80]};
function tcol(r,a,t){if(r==='A'){const h=((t||0)/8)%360;return `hsla(${h},100%,72%,${a})`}const c=TELL[r]||TELL.N;return `rgba(${c[0]},${c[1]},${c[2]},${a})`}
function loadImg(src){return new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src})}

/* ---------- 音 ---------- */
/* 11/01 新しい SE：slice1-5＝シュパッ（ランダム・つづけて おなじ 音は なし）、tear＝やぶる（つぶを ちらして 速さで 音量・高さ）、shake＝ふる、
   draw＝すべり出る、deal＝とぶ／めくる、open1-2＝パックが ひらく、rare／legend＝レア・レジェンド、pre／preawk＝レジェンド・かくせいの ためる音 */
const PSE_K=['slice1','slice2','slice3','slice4','slice5','tear','shake','draw','deal','open1','open2','rare','legend','pre','preawk'];
const PSE={ctx:null,buf:{},p:null,err:0},SELOG=[];
function b64ab(u){const bin=atob(u.slice(u.indexOf(',')+1)),n=bin.length,ar=new Uint8Array(n);for(let i=0;i<n;i++)ar[i]=bin.charCodeAt(i);return ar.buffer}
function pseLoad(o,a){if(!a)return null;if(PSE.ctx===a&&PSE.p)return PSE.p;PSE.ctx=a;PSE.buf={};PSE.err=0;
  const dec=ab=>new Promise((ok,ng)=>{try{const r=a.decodeAudioData(ab,ok,ng);if(r&&r.then)r.then(ok,ng)}catch(e){ng(e)}});
  const src=async k=>{const P=window.PACKSE;if(P&&P[k])return b64ab(P[k]);const Z=window.ZKIMG&&window.ZKIMG['fx/pack/se/'+k+'.mp3'];if(Z)return b64ab(Z);
    const r=await fetch((o.seBase||'fx/pack/se/')+k+'.mp3');if(!r.ok)throw new Error(k);return r.arrayBuffer()};
  const js=()=>o.seJs&&!window.PACKSE?new Promise(ok=>{const s=document.createElement('script');s.src=o.seJs;s.onload=ok;s.onerror=ok;document.head.appendChild(s)}):Promise.resolve();
  PSE.p=js().then(()=>{if(o.seJs&&!window.PACKSE)return;return Promise.all(PSE_K.map(k=>src(k).then(dec).then(b=>{if(PSE.ctx===a)PSE.buf[k]=b},()=>{PSE.err++})))}).catch(()=>{});return PSE.p}
function Snd(o){const S={};const A=()=>{try{const a=o.ac&&o.ac();if(a&&a.state==='suspended')a.resume();return a}catch(e){return null}};
  const off=()=>{try{return o.muted&&o.muted()}catch(e){return false}};
  let out=null;const dst=a=>{if(!out||out.context!==a){let go=null;try{go=o.out&&o.out()}catch(e){}if(go&&go.context===a){const g=a.createGain();g.gain.value=.64;g.connect(go);out=g;return out}const c=a.createDynamicsCompressor();c.threshold.value=-16;c.ratio.value=4;const g=a.createGain();g.gain.value=1.4;g.connect(c);c.connect(a.destination);out=g}return out};
  let nb=null;const noiseBuf=a=>{if(!nb||nb.sampleRate!==a.sampleRate){const n=a.sampleRate*2;nb=a.createBuffer(1,n,a.sampleRate);const d=nb.getChannelData(0);let l=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;l=l*.6+w*.4;d[i]=Math.random()<.5?w:l}}return nb};
  /* ノイズ（フィルタ）：かならず フェードイン・フェードアウト */
  S.nz=(dur,{f=2000,q=1,type='bandpass',vol=.2,at=0,f2}={})=>{if(off())return;const a=A();if(!a)return;const t=a.currentTime+at;const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf(a);fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.008,dur*.2));g.gain.exponentialRampToValueAtTime(Math.max(.0005,vol*.05),t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.03);s.connect(fl).connect(g).connect(dst(a));s.start(t,Math.random()*1.5);s.stop(t+dur+.05)};
  S.tn=(fr,dur,{type='sine',vol=.08,at=0,slide}={})=>{if(off())return;const a=A();if(!a)return;const t=a.currentTime+at;const os=a.createOscillator(),g=a.createGain();os.type=type;os.frequency.setValueAtTime(fr,t);if(slide)os.frequency.exponentialRampToValueAtTime(slide,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.setValueAtTime(vol,t+Math.max(.013,dur*.35));g.gain.exponentialRampToValueAtTime(Math.max(.0004,vol*.03),t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.03);os.connect(g).connect(dst(a));os.start(t);os.stop(t+dur+.05)};
  /* ライブラリの 音（あれば）。おわりは みじかく フェード */
  S.smp=(name,vol=1,at=0,maxd=99)=>{if(off())return false;const a=A();if(!a)return false;let b=null;try{b=o.buf&&o.buf(name)}catch(e){}if(!b)return false;const t=a.currentTime+at,L=Math.min(b.duration,maxd),fd=Math.min(.12,L*.25);const s=a.createBufferSource(),g=a.createGain();s.buffer=b;
    g.gain.setValueAtTime(vol,t);g.gain.setValueAtTime(vol,t+L-fd);g.gain.linearRampToValueAtTime(0,t+L);s.connect(g).connect(dst(a));s.start(t);s.stop(t+L+.02);return true};
  /* 11/01 新しい SE を 鳴らす（なければ false → 前の 音） */
  const pb=k=>{const a=A();return (a&&PSE.ctx===a&&PSE.buf[k])||null};S.ac=A;S.has=k=>!!pb(k);
  S.se=(k,{v=.5,at=0,rate=1,maxd=99,ofs=0}={})=>{if(off())return false;const a=A();if(!a)return false;const b=pb(k);if(!b)return false;const t=a.currentTime+at,L=Math.min((b.duration-ofs)/rate,maxd),fd=Math.min(.12,L*.25);
    const s=a.createBufferSource(),g=a.createGain();s.buffer=b;s.playbackRate.value=rate;g.gain.setValueAtTime(v,t);g.gain.setValueAtTime(v,t+L-fd);g.gain.linearRampToValueAtTime(0,t+L);s.connect(g).connect(dst(a));s.start(t,ofs);s.stop(t+L+.02);SELOG.push(k);if(SELOG.length>80)SELOG.shift();return true};
  const pick=ks=>ks.filter(k=>pb(k));
  const sfx=k=>{if(off())return false;try{const X=o.sfx;if(X&&X[k]){X[k]();return true}}catch(e){}return false};
  /* やぶる音（ずっと 鳴らして、ゆびの 速さで 音量を かえる） */
  let tear=null;
  /* 11/01：tear の 音を こまかい つぶ（60〜110ms）で ちらして 鳴らす。ゆびの 速さ → 音量・高さ */
  const grain=()=>{if(!tear||!tear.gr)return;const a=tear.a,b=pb('tear');if(!b)return;tear.k+=(tear.kt-tear.k)*.5;const now=a.currentTime;if(tear.nx<now)tear.nx=now;
    while(tear.nx<now+.08){const k=tear.k;if(k>.02){const d=.06+Math.random()*.05,r=.8+k*.45+Math.random()*.12,ofs=Math.random()*Math.max(0,b.duration-d*r-.02);const s=a.createBufferSource(),g=a.createGain(),t=tear.nx,v=.6*k;
      s.buffer=b;s.playbackRate.value=r;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+d*.4);g.gain.linearRampToValueAtTime(0,t+d);s.connect(g).connect(dst(a));s.start(t,ofs);s.stop(t+d+.02)}tear.nx+=.035+Math.random()*.015}};
  S.tearOn=()=>{if(off()||tear)return;const a=A();if(!a)return;if(pb('tear')){tear={a,gr:1,k:0,kt:0,nx:0};tear.tm=setInterval(grain,25);SELOG.push('tear');return}const s=a.createBufferSource(),hp=a.createBiquadFilter(),bp=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf(a);s.loop=true;hp.type='highpass';hp.frequency.value=900;bp.type='peaking';bp.frequency.value=3200;bp.gain.value=8;g.gain.value=0;s.connect(hp).connect(bp).connect(g).connect(dst(a));s.start();tear={s,g,a,bp}};
  S.tearSpeed=v=>{if(!tear)return;const a=tear.a,t=a.currentTime,k=Math.min(1,v);if(tear.gr)tear.kt=k;else tear.g.gain.setTargetAtTime(k*.34,t,.03);if(!tear.gr)tear.bp.frequency.setTargetAtTime(2400+k*2600,t,.05);
    /* パリパリ（小さな クラック） */const n=Math.random()<k*1.6?1+(Math.random()<k?1:0):0;for(let i=0;i<n;i++)S.nz(.012+Math.random()*.02,{f:1800+Math.random()*4200,q:3,vol:.12+.25*k,at:Math.random()*.03})};
  S.tearOff=()=>{if(!tear)return;if(tear.gr){clearInterval(tear.tm);tear=null;return}const {a,g,s}=tear;const t=a.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+.12);try{s.stop(t+.15)}catch(e){}tear=null};
  S.shake=i=>{if(S.se('shake',{v:.3+i*.08,rate:[1.12,1,.9][i]||1,maxd:.36,ofs:.04}))return;S.nz(.07,{f:5200,q:.8,type:'highpass',vol:.09});S.nz(.05,{f:2600,q:2,vol:.06,at:.03});if(i===2)S.tn(180,.12,{type:'triangle',vol:.05})};
  let lastSl='';S.snap=()=>{/* 11/01：5つの 切る音から ランダム（つづけて おなじ 音は なし） */const ks=pick(['slice1','slice2','slice3','slice4','slice5']),c=ks.length>1?ks.filter(k=>k!==lastSl):ks;if(c.length){const k=c[Math.floor(Math.random()*c.length)%c.length];lastSl=k;if(S.se(k,{v:.6}))return}/* シュパッ：高い ノイズが すっと 下がる＋みじかい 切れ音 */S.nz(.14,{f:9000,f2:2200,q:2.2,vol:.4});S.nz(.035,{f:7000,type:'highpass',vol:.3});S.nz(.09,{f:4200,f2:1500,q:4,vol:.22,at:.03});S.tn(2400,.08,{type:'sine',vol:.04,slide:5200})};
  S.burst=r=>{const ob=pick(['open1','open2']);if(ob.length&&S.se(ob[Math.floor(Math.random()*ob.length)%ob.length],{v:r==='N'?.42:.5}))return;S.nz(.5,{f:700,q:.7,vol:.12,f2:3200});if(!S.smp('casual/Holy Magic 1.wav',r==='N'?.35:.6,0,1.2))S.tn(r==='N'?1046:1318,.5,{type:'triangle',vol:.06})};
  S.whoosh=(at=0,v=1)=>{if(at===0&&S.smp('casual/GUI Swish 1.wav',.55*v))return;S.nz(.32,{f:400,f2:2400,q:1.4,vol:.22*v,at})};
  S.rise=n=>{let ok=false;for(let i=0;i<n;i++)ok=S.se('draw',{v:.5,at:i*.13,rate:1+(i-(n-1)/2)*.05})||ok;if(!ok)S.whoosh()};
  S.fan=n=>{let ok=false;for(let i=0;i<n;i++)ok=S.se('deal',{v:.45,at:i*.07,rate:1+(i%2?.06:-.03)})||ok;if(!ok)S.whoosh(0,.8)};
  S.flip=()=>{if(S.se('deal',{v:.42,rate:1.3,maxd:.13}))return;if(!sfx('flip'))S.nz(.05,{f:3500,q:1.2,vol:.16});S.tn(1500,.04,{type:'triangle',vol:.03})};
  S.sparkle=()=>{if(S.smp('match3/Crystal Take.wav',.5))return;if(!sfx('sparkle'))[2637,3136,3951].forEach((f,i)=>S.tn(f,.25,{vol:.035,at:i*.06}))};
  S.rare=()=>{if(S.se('rare',{v:.55}))return;if(!S.smp('game2/ice magic appear.wav',.6,0,1.4))[1047,1319,1568,2093].forEach((f,i)=>S.tn(f,.5,{type:'triangle',vol:.06,at:i*.07}));S.tn(2637,.6,{vol:.03,at:.3})};
  S.pre=awk=>(awk&&S.se('preawk',{v:.5}))||S.se('pre',{v:.5});
  S.legend=awk=>{if(S.se('legend',{v:.6})){if(awk)for(let i=0;i<8;i++)S.tn(1800+i*220,.18,{vol:.03,at:.5+i*.05});return}if(!sfx('fanfare'))[[523,0],[659,.12],[784,.24],[1047,.4]].forEach(([f,at])=>{S.tn(f,.55,{type:'sawtooth',vol:.04,at});S.tn(f*2,.4,{type:'triangle',vol:.03,at})});S.smp('casual/Bless Sound.wav',.55,.15,2.2);if(awk)for(let i=0;i<8;i++)S.tn(1800+i*220,.18,{vol:.03,at:.5+i*.05})};
  S.tell=r=>{if(r==='N')return;for(let i=0;i<(r==='R'?3:6);i++)S.tn(600+i*140,.14,{type:'triangle',vol:.035,at:i*.08})};
  S.stop=()=>S.tearOff();
  return S}

/* ---------- 本体 ---------- */
function run(host,o){return new Promise(async resolve=>{
  const R=document.createElement('div');R.className='pfx-root';R.style.cssText=`position:${o.fixed?'fixed':'absolute'};inset:0;z-index:${o.z||50};touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden;opacity:0;transition:opacity .25s`;
  host.appendChild(R);
  const [P,BK,COIN,STAR,SPK]=await Promise.all([loadImg(o.pack),loadImg(o.img&&o.img.back),loadImg(o.img&&o.img.coin),loadImg(o.img&&o.img.star),loadImg(o.img&&o.img.spark)]);
  if(!P){R.remove();throw new Error('pack image')}
  const rc=R.getBoundingClientRect(),W=rc.width||Math.min(innerWidth,430),H=rc.height||innerHeight,padB=o.padB||0,HH=H-padB,dpr=Math.min(2.5,window.devicePixelRatio||1);
  const mkC=z=>{const c=document.createElement('canvas');c.width=W*dpr;c.height=H*dpr;c.style.cssText=`position:absolute;inset:0;width:${W}px;height:${H}px;z-index:${z};pointer-events:none`;R.appendChild(c);const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return x};
  const bg=mkC(1);const lay=document.createElement('div');lay.style.cssText='position:absolute;inset:0;z-index:2;pointer-events:none';R.appendChild(lay);const fg=mkC(3);
  requestAnimationFrame(()=>R.style.opacity=1);
  const S=Snd(o);try{pseLoad(o,S.ac())}catch(e){}
  const cards=o.cards||[];const n=cards.length;
  const best=cards.some(c=>c.awk)?'A':cards.some(c=>c.r==='L')?'L':cards.some(c=>c.r==='R')?'R':'N';
  /* パックの 大きさ・位置 */
  const PW=Math.min(W*.6,262),PH=PW*P.naturalHeight/P.naturalWidth,PX=W/2,PY=HH*.47,TY=PH*.112;
  const pTop=()=>PY-PH/2;
  /* 光った パック（つや）の オフスクリーン */
  const off=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*dpr);c.height=Math.ceil(h*dpr);const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return [c,x]};
  const [Lc,Lx]=off(PW,PH),[Dc,Dx]=off(PW,PH);
  Dx.drawImage(P,0,0,PW,PH);Dx.globalCompositeOperation='source-in';Dx.fillStyle='#2a1405';Dx.fillRect(0,0,PW,PH);
  function lit(t,tilt){Lx.globalCompositeOperation='source-over';Lx.clearRect(0,0,PW,PH);Lx.drawImage(P,0,0,PW,PH);Lx.globalCompositeOperation='source-atop';
    const s=.5+tilt*.9+Math.sin(t/1400)*.35,c=PW*s;let g=Lx.createLinearGradient(c-PW*.45,-PH*.1,c+PW*.45,PH*.7);
    g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.42,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,240,.55)');g.addColorStop(.56,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,0)');Lx.fillStyle=g;Lx.fillRect(0,0,PW,PH);
    const c2=PW*(1.1-s*.8);g=Lx.createLinearGradient(c2-PW*.6,0,c2+PW*.6,PH);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,240,200,.18)');g.addColorStop(1,'rgba(255,255,255,0)');Lx.fillStyle=g;Lx.fillRect(0,0,PW,PH);
    /* ふちの 陰（あつみ） */g=Lx.createLinearGradient(0,0,PW,0);g.addColorStop(0,'rgba(60,30,0,.28)');g.addColorStop(.08,'rgba(0,0,0,0)');g.addColorStop(.92,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(60,30,0,.32)');Lx.fillStyle=g;Lx.fillRect(0,0,PW,PH)}
  /* やぶれ線（たて列ごと） */
  const NC=Math.ceil(PW/2),cw=PW/NC,ty=[],jag=[],fib=[],fixd=[];for(let i=0;i<NC;i++){jag[i]=(Math.random()-.5)*.7+Math.sin(i*.09)*.5;ty[i]=TY+jag[i];fib[i]=[(Math.random()-.5)*2.4,1.2+Math.random()*2.6,Math.random()]}
  let fo=0;            // ゆびの たての ずれ（線に すこし のる）
  const st={ph:'in',t0:performance.now(),p:0,dir:0,relax:1,drag:null,tilt:0,shk:0,strip:null,packY:0,packA:1,dim:0,hint:0};
  const ps=[];          // つぶ
  const bursts=[];      // 光の ばくはつ
  const pillars=[];     // 光の 柱（カードの うしろ）
  const sweeps=[];      // カードの つや
  const labels=[];      // 文字
  let tapHint=0;
  /* ---- カード（DOM） ---- */
  const two=n>3,CB=two?Math.min(W*.29,118):Math.min(W*.29,128),CH=CB*1.394,gap=Math.min(W*.035,14);
  const slots=[];{const rows=two?[3,n-3]:[n];const tot=rows.length*CH+(rows.length-1)*gap*1.4;let y=HH*.45-tot/2+CH/2;rows.forEach(k=>{for(let j=0;j<k;j++)slots.push({x:W/2+(j-(k-1)/2)*(CB+gap),y,row:slots.length<3?0:1});y+=CH+gap*1.4})}
  const C=cards.map((cd,i)=>{const w=document.createElement('div');w.style.cssText=`position:absolute;left:0;top:0;width:${CB}px;height:${CH}px;transform-style:preserve-3d;will-change:transform;opacity:0`;
    const b=document.createElement('div');b.style.cssText=`position:absolute;inset:0;border-radius:${CB*.07}px;background:#3a2210 url("${o.img&&o.img.back||''}") center/100% 100% no-repeat;box-shadow:0 6px 14px rgba(0,0,0,.5)`;
    const f=document.createElement('div');f.style.cssText=`position:absolute;inset:0;transform:rotateY(180deg)`;
    let face=cd.face;if(typeof face==='string'){const im=document.createElement('img');im.alt='';im.style.cssText='width:100%;height:100%;display:block;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))';
      im._ld=new Promise(ok=>{im.onload=()=>ok();im.onerror=()=>{const d=document.createElement('div');d.style.cssText=`position:absolute;inset:0;border-radius:${CB*.07}px;background:linear-gradient(#fff3d6,#e9c98a);border:3px solid ${({N:'#a0703a',R:'#9fb4c8',L:'#e8b32a'})[cd.r]||'#a0703a'};display:flex;align-items:center;justify-content:center;font:900 ${CB*.28}px sans-serif;color:#7a4a1a`;d.textContent=cd.r||'?';im.replaceWith(d);ok()};setTimeout(ok,4000)});im.src=face;face=im}else if(face){face.style.setProperty('--cw',CB+'px');face.style.position='absolute';face.style.left='0';face.style.top='0';face.style.margin='0'}
    if(face)f.appendChild(face);w.appendChild(b);w.appendChild(f);lay.appendChild(w);
    return {bk:b,fc:f,ld:face&&face._ld,el:w,cd,i,x:PX,y:0,s:1,ry:0,rz:0,z:i,vis:0,state:'pack',done:false,f0:0,dimmed:0,glow:0,lift:0}});
  const rr=c=>c.cd.awk?'A':c.cd.r;
  const s0=PW*.66/CB;
  function setCard(c){/* 光（filter）で 3Dが たいらに なっても うら・おもてが 正しく 見えるよう 自分で 切りかえ */const fr=c.ry>90;if(c._fr!==fr){c._fr=fr;c.bk.style.visibility=fr?'hidden':'visible';c.fc.style.visibility=fr?'visible':'hidden'}c.el.style.opacity=c.vis;c.el.style.zIndex=c.z;c.el.style.transform=`translate(${c.x-CB/2}px,${c.y-CH/2}px) rotate(${c.rz}rad) scale(${c.s}) perspective(${CB*7}px) rotateY(${c.ry}deg)`;
    c.el.style.filter=(c.dimmed>0.01?`brightness(${1-c.dimmed*.5})`:'')+(c.glow>0.01?` drop-shadow(0 0 ${8+c.glow*14}px ${tcol(rr(c),.95,performance.now())})`:'')||'none'}
  /* ---- つぶ ---- */
  function addP(p){p.t0=p.t0||performance.now();ps.push(p)}
  function paperBits(x,y,dir){for(let i=0;i<16;i++){const a=-Math.PI/2+(Math.random()-.5)*2.2+dir*.4;const v=180+Math.random()*320;addP({x:x+(Math.random()-.5)*PW*.8,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:900,life:900+Math.random()*500,sz:3+Math.random()*5,rot:Math.random()*6,vr:(Math.random()-.5)*14,kind:'paper',col:Math.random()<.5?'#fff6e0':'#f2c75a'})}}
  function sparkAt(x,y,k,col,im){for(let i=0;i<k;i++){const a=Math.random()*Math.PI*2,v=60+Math.random()*170;addP({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,g:120,life:650+Math.random()*400,sz:(im?16:3)+Math.random()*(im?10:3),kind:im?'img':'dot',im,col,rot:(Math.random()-.5)*.35,wob:Math.random()*6})}}
  function confetti(x,y){for(let i=0;i<26;i++){const a=-Math.PI/2+(Math.random()-.5)*2.4,v=320+Math.random()*420;const coin=i%3!==0;addP({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:700,drag:.985,life:1500+Math.random()*700,sz:coin?22+Math.random()*8:20+Math.random()*10,kind:'img',im:coin?COIN:STAR,rot:(Math.random()-.5)*.35,wob:Math.random()*6})}}
  function drawP(ctx,now,dt){for(let i=ps.length-1;i>=0;i--){const p=ps[i];const e=now-p.t0;if(e>p.life){ps.splice(i,1);continue}
    p.vy+=(p.g||0)*dt;if(p.drag){p.vx*=p.drag;p.vy*=p.drag}p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.vr)p.rot+=p.vr*dt;const k=e/p.life,a=k<.7?1:1-(k-.7)/.3;
    ctx.save();ctx.globalAlpha=a;ctx.translate(p.x,p.y);
    if(p.kind==='paper'){ctx.rotate(p.rot);ctx.scale(1,Math.abs(Math.cos(p.rot*1.7))+.2);ctx.fillStyle=p.col;ctx.fillRect(-p.sz/2,-p.sz/3,p.sz,p.sz*.66)}
    else if(p.kind==='img'&&p.im){ctx.rotate(p.rot+Math.sin(e/160+p.wob)*.17);ctx.drawImage(p.im,-p.sz/2,-p.sz/2,p.sz,p.sz)}
    else{ctx.globalCompositeOperation='lighter';const r=p.sz*(1-k*.5);const g=ctx.createRadialGradient(0,0,0,0,0,r*2.4);g.addColorStop(0,p.col||'#fff');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*2.4,0,7);ctx.fill()}
    ctx.restore()}}
  /* ---- パックを かく ---- */
  function torn(i){if(!st.dir)return false;const f=NC*st.p;return st.dir<0?i>=NC-f:i<f}
  function distFront(i){const f=NC*st.p;return (st.dir<0?i-(NC-f):f-i)*cw}
  function drawPack(ctx,now){const t=now-st.t0;let sc=1,rot=0,dy=st.packY,al=st.packA;
    if(st.ph==='in'){const k=E.cl(t/650);sc=.35+.65*E.back(k);al=E.cl(t/250);dy+=(1-E.o(k))*60}
    rot=st.tilt*.05+Math.sin(now/900)*.012+st.shk;if(st.ph==='tell'||st.shk)sc*=1+Math.abs(st.shk)*.6;
    if(al<=0)return;lit(now,st.tilt+(st.drag?((st.drag.x-PX)/W)*.6:0));
    ctx.save();ctx.globalAlpha=al;
    /* 影 */ctx.save();ctx.translate(PX,PY+dy+PH*.53);ctx.scale(1,.18);const sg=ctx.createRadialGradient(0,0,0,0,0,PW*.6);sg.addColorStop(0,'rgba(0,0,0,.55)');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.arc(0,0,PW*.6,0,7);ctx.fill();ctx.restore();
    ctx.translate(PX,PY+dy);ctx.rotate(rot);ctx.scale(sc,sc);ctx.translate(-PW/2,-PH/2);
    const body=()=>{ctx.beginPath();ctx.moveTo(0,ty[0]);for(let i=0;i<NC;i++)ctx.lineTo((i+.5)*cw,ty[i]);ctx.lineTo(PW,ty[NC-1]);ctx.lineTo(PW+4,PH+6);ctx.lineTo(-4,PH+6);ctx.closePath()};
    const flat=()=>{ctx.beginPath();if(st.strip)return;for(let i=0;i<NC;i++)if(!torn(i))ctx.rect(i*cw-.3,-4,cw+.6,ty[i]+4)};
    /* あつみ（こい色の ずらし） */ctx.save();body();ctx.clip();ctx.drawImage(Dc,2.2,3,PW,PH);ctx.restore();
    if(!st.strip){ctx.save();flat();ctx.clip();ctx.drawImage(Dc,2.2,3,PW,PH);ctx.restore()}
    ctx.save();body();ctx.clip();ctx.drawImage(Lc,0,0,PW,PH);ctx.restore();
    /* やぶれた ところ：かげ → 光 → せんい */
    if(st.p>0){let a=-1,b=-1;for(let i=0;i<NC;i++)if(torn(i)){if(a<0)a=i;b=i}
      if(a>=0){ctx.save();body();ctx.clip();for(let i=a;i<=b;i++){const L=st.strip?1:E.o(E.cl(distFront(i)/(PW*.13)))*st.relax;ctx.fillStyle=`rgba(30,10,0,${.38*L})`;ctx.fillRect(i*cw,ty[i],cw+.5,4+9*L)}ctx.restore();
        const xa=a*cw,xb=(b+1)*cw,mx=(xa+xb)/2,wx=(xb-xa)/2+12,inten=st.strip?Math.max(0,1-(now-st.strip.t0)/900):Math.min(1,st.p*1.4);
        if(inten>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(mx,TY);ctx.scale(1,(10+26*st.p)/wx);const g=ctx.createRadialGradient(0,0,0,0,0,wx);g.addColorStop(0,tcol(best,.95*inten,now));g.addColorStop(.5,tcol(best,.4*inten,now));g.addColorStop(1,tcol(best,0,now));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,wx,0,7);ctx.fill();ctx.restore()}
        ctx.save();ctx.globalCompositeOperation='lighter';const sl=()=>{ctx.beginPath();for(let i=a;i<=b;i++)ctx[i===a?'moveTo':'lineTo']((i+.5)*cw,ty[i]-.5)};ctx.shadowColor=tcol(best,1,now);ctx.shadowBlur=10;ctx.strokeStyle=tcol(best,.9*Math.max(.4,inten),now);ctx.lineWidth=3;sl();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle=`rgba(255,255,255,${Math.max(.5,inten)})`;ctx.lineWidth=1.2;sl();ctx.stroke();ctx.restore();
        /* 中の 銀色の 層が すこし 見える */ctx.save();const sg2=ctx.createLinearGradient(0,0,PW,0);sg2.addColorStop(0,'#9aa3ad');sg2.addColorStop(Math.max(.05,Math.min(.95,.35+st.tilt*.3)),'#ffffff');sg2.addColorStop(1,'#cfd7e0');ctx.strokeStyle=sg2;ctx.lineWidth=1.5;ctx.beginPath();for(let i=a;i<=b;i++)ctx[i===a?'moveTo':'lineTo']((i+.5)*cw,ty[i]+1.4);ctx.stroke();ctx.restore()}}
    /* まだの ところ（たいら） */
    if(!st.strip){ctx.save();flat();ctx.clip();ctx.drawImage(Lc,0,0,PW,PH);ctx.restore();
      /* めくれた 帯（列ごとに 曲げる） */
      const fl=[];for(let i=0;i<NC;i++){if(!torn(i))continue;const L=E.o(E.cl(distFront(i)/(PW*.13)))*st.relax,th=L*1.25,h=ty[i],ch=Math.max(.1,Math.cos(th))*h,lift=L*PH*.07+L*4,x=i*cw+(-st.dir)*L*L*5;const y1=ty[i]-lift;
        ctx.drawImage(Lc,i*cw*dpr,0,cw*dpr,h*dpr,x,y1-ch,cw+.7,ch);
        if(th>.05){ctx.globalAlpha=al*Math.min(.6,Math.sin(th)*.6);ctx.drawImage(Dc,i*cw*dpr,0,cw*dpr,h*dpr,x,y1-ch,cw+.7,ch);ctx.globalAlpha=al}
        fl.push([x+cw/2,y1-.4])}
      /* 帯の 下の せんい（線で なめらかに） */if(fl.length>1){ctx.strokeStyle='#dfe6ee';ctx.lineWidth=1.5;ctx.lineJoin='round';ctx.beginPath();fl.forEach((q,j)=>ctx[j?'lineTo':'moveTo'](q[0],q[1]));ctx.stroke()}}
    ctx.restore()}
  function drawStrip(ctx,now,dt){const s=st.strip;if(!s)return;const e=now-s.t0;if(e>1300)return;s.vy+=1500*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=s.vr*dt;
    ctx.save();ctx.globalAlpha=e<900?1:1-(e-900)/400;ctx.translate(s.x,s.y);ctx.rotate(s.r);const k=Math.min(1,e/300);ctx.scale(1,1-.35*k+.15*Math.sin(e/90));ctx.drawImage(s.c,-PW/2,-s.h/2,PW,s.h);ctx.restore()}
  function makeStrip(){const h=TY+8;const [c,x]=off(PW,h);x.beginPath();x.moveTo(0,-4);x.lineTo(PW,-4);x.lineTo(PW,ty[NC-1]);for(let i=NC-1;i>=0;i--)x.lineTo((i+.5)*cw,ty[i]);x.lineTo(0,ty[0]);x.closePath();x.clip();x.drawImage(Lc,0,0,PW,PH);
    x.globalCompositeOperation='source-over';x.strokeStyle='#dfe6ee';x.lineWidth=1.6;x.beginPath();for(let i=0;i<NC;i++)x[i?'lineTo':'moveTo']((i+.5)*cw,ty[i]-.5);x.stroke();
    const fd=st.dir<0?-1:1;st.strip={c,h,x:PX,y:pTop()+st.packY+h/2,vx:fd*280,vy:-600,r:0,vr:fd*1.3,t0:performance.now()}}
  /* ---- 光（ばくはつ・柱・つや） ---- */
  function drawBursts(ctx,now){for(let i=bursts.length-1;i>=0;i--){const b=bursts[i],e=now-b.t0;if(e>b.d){bursts.splice(i,1);continue}const k=e/b.d,a=(k<.15?k/.15:1-(k-.15)/.85);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(b.x,b.y);const r=b.r*(.6+.5*E.o(k));const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,tcol(b.col,.9*a,now));g.addColorStop(.35,tcol(b.col,.35*a,now));g.addColorStop(1,tcol(b.col,0,now));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
    if(b.rays){ctx.rotate(now/2600);for(let j=0;j<b.rays;j++){ctx.rotate(Math.PI*2/b.rays);const L=b.r*1.1*(.7+.3*E.o(k));const g2=ctx.createLinearGradient(0,0,0,-L);g2.addColorStop(0,tcol(b.col,.5*a,now));g2.addColorStop(1,tcol(b.col,0,now));ctx.fillStyle=g2;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-b.r*.09,-L);ctx.lineTo(b.r*.09,-L);ctx.lineTo(3,0);ctx.fill()}}ctx.restore()}}
  function drawPillars(ctx,now){for(let i=pillars.length-1;i>=0;i--){const p=pillars[i];const e=now-p.t0;const a=p.end?Math.max(0,1-(now-p.end)/500):Math.min(1,e/450);if(p.end&&a<=0){pillars.splice(i,1);continue}
    const c=p.card,x=c.x,w=CB*c.s*1.35;ctx.save();ctx.globalCompositeOperation='lighter';const top=Math.max(0,1-e/500)*HH*.5;
    let g=ctx.createLinearGradient(x-w,0,x+w,0);g.addColorStop(0,tcol(p.col,0,now));g.addColorStop(.3,tcol(p.col,.22*a,now));g.addColorStop(.5,`rgba(255,255,240,${.55*a})`);g.addColorStop(.7,tcol(p.col,.22*a,now));g.addColorStop(1,tcol(p.col,0,now));ctx.fillStyle=g;ctx.fillRect(x-w,top,w*2,H-top);
    g=ctx.createRadialGradient(x,c.y,0,x,c.y,CB*c.s*1.3);g.addColorStop(0,tcol(p.col,.55*a,now));g.addColorStop(1,tcol(p.col,0,now));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,c.y,CB*c.s*1.3,0,7);ctx.fill();
    /* のぼる 光のつぶ */for(let j=0;j<14;j++){const sd=(j*97.3)%1,yy=H-((e*.12+j*71)%H),xx=x+(Math.sin(j*12.9)*.8)*w*.6;ctx.globalAlpha=a*(.4+.6*Math.abs(Math.sin(e/300+j)));ctx.fillStyle=tcol(p.col,.9,now+j*40);ctx.beginPath();ctx.arc(xx,yy,1.4+sd*2,0,7);ctx.fill()}
    ctx.restore()}}
  function drawSweeps(ctx,now){for(let i=sweeps.length-1;i>=0;i--){const s=sweeps[i],c=s.card,e=now-s.t0;if(e>s.d){if(s.loop&&c.state==='zoom'){s.t0=now}else{sweeps.splice(i,1);continue}}const k=e/s.d;
    const w=CB*c.s,h=CH*c.s;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rz);ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,w*.07);ctx.clip();ctx.globalCompositeOperation=s.rainbow?'overlay':'lighter';
    const cx=-w+k*w*2.2;const g=ctx.createLinearGradient(cx-w*.35,-h/2,cx+w*.35,h/2);
    if(s.rainbow){['#ff4fd8','#ffd84f','#4fffb0','#4fb8ff','#b84dff'].forEach((col,j)=>g.addColorStop(.15+j*.175,col));g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.globalAlpha=.75}
    else{g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.45,'rgba(220,235,255,.0)');g.addColorStop(.5,'rgba(255,255,255,.75)');g.addColorStop(.55,'rgba(220,235,255,0)');g.addColorStop(1,'rgba(255,255,255,0)')}
    ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);ctx.restore()}}
  function txt(ctx,s,x,y,{size=24,col='#ffe066',a=1,sc=1}={}){ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.scale(sc,sc);ctx.font=`900 ${size}px "Dela Gothic One","M PLUS Rounded 1c",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=size*.26;ctx.strokeStyle='#2a1405';ctx.strokeText(s,0,0);ctx.fillStyle=col;ctx.fillText(s,0,0);ctx.restore()}
  function drawLabels(ctx,now){for(let i=labels.length-1;i>=0;i--){const L=labels[i],e=now-L.t0;if(e>L.d){labels.splice(i,1);continue}const k=e/L.d;const a=k<.1?k/.1:k>.8?1-(k-.8)/.2:1;const sc=e<220?.6+.4*E.back(e/220):1;
    const x=L.card?L.card.x:L.x,y=L.card?(L.below?L.card.y+CH*L.card.s/2+18:L.card.y-CH*L.card.s/2-18):L.y;txt(ctx,L.s,x,y,{size:L.size||22,col:L.col,a,sc})}}
  /* ---- 背景 ---- */
  const motes=Array.from({length:22},()=>({x:Math.random()*W,y:Math.random()*H,r:.6+Math.random()*1.6,v:6+Math.random()*12,p:Math.random()*6}));
  function drawBg(ctx,now){ctx.clearRect(0,0,W,H);const g=ctx.createRadialGradient(W/2,HH*.42,20,W/2,HH*.45,Math.max(W,H)*.75);g.addColorStop(0,'rgba(70,40,18,.80)');g.addColorStop(1,'rgba(8,4,2,.93)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.globalCompositeOperation='lighter';for(const m of motes){m.y-=m.v/60;if(m.y<-4){m.y=H+4;m.x=Math.random()*W}ctx.globalAlpha=.25+.25*Math.sin(now/700+m.p);ctx.fillStyle='#ffd9a0';ctx.beginPath();ctx.arc(m.x+Math.sin(now/1500+m.p)*6,m.y,m.r,0,7);ctx.fill()}ctx.restore();
    /* パックの うしろの ほのかな 光（いちばん いい カードの 色＝お知らせ） */
    if(st.packA>0&&!st.strip){const t=now-st.t0;const base={N:.18,R:.32,L:.48,A:.5}[best];let I=st.ph==='in'?0:st.ph==='tell'?Math.min(1,t/900):1;I*=base*(1+.25*Math.sin(now/380))*(1+st.p*.8);
      ctx.save();ctx.globalCompositeOperation='lighter';const r=PW*.95;const g2=ctx.createRadialGradient(PX,PY+st.packY,PW*.2,PX,PY+st.packY,r);g2.addColorStop(0,tcol(best,I*st.packA,now));g2.addColorStop(1,tcol(best,0,now));ctx.fillStyle=g2;ctx.beginPath();ctx.arc(PX,PY+st.packY,r,0,7);ctx.fill();ctx.restore()}
    if(st.dim>0){ctx.fillStyle=`rgba(0,0,0,${st.dim*.45})`;ctx.fillRect(0,0,W,H)}
    drawPillars(ctx,now)}
  /* ---- なぞる ガイド ---- */
  function drawGuide(ctx,now){if(st.ph!=='idle'&&!(st.ph==='tear'&&st.p<.04))return;const e=(now-st.hint0)%1900,k=E.io(E.cl(e/1300)),a=e<150?e/150:e>1300?Math.max(0,1-(e-1300)/400):1;
    const y=pTop()+TY+st.packY,x0=PX-PW*.42,x1=PX+PW*.42,x=lerp(x0,x1,k);ctx.save();
    ctx.globalAlpha=.55*a;ctx.setLineDash([5,7]);ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=a;const pr=1+.15*Math.sin(now/120);ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(x,y,9*pr,0,7);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,16+4*Math.sin(now/200),0,7);ctx.stroke();
    /* ゆび（シルエット） */ctx.translate(x+6,y+12);ctx.rotate(-.35);ctx.fillStyle='#fff3e0';ctx.strokeStyle='#5a3416';ctx.lineWidth=2.2;ctx.beginPath();ctx.roundRect(-6,0,12,30,6);ctx.fill();ctx.stroke();ctx.beginPath();ctx.roundRect(-11,20,26,26,10);ctx.fill();ctx.stroke();ctx.restore()}
  /* ---- 入力 ---- */
  let lastMove=0,lastX=0,lastT=0,idleSince=0;
  const loc=e=>{const r=R.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
  R.addEventListener('pointerdown',e=>{e.preventDefault();const p=loc(e);try{R.setPointerCapture(e.pointerId)}catch(_){}S.tn(1,.01,{vol:0});
    if(st.ph==='idle'||st.ph==='tear'){st.drag={x0:p.x,y0:p.y,x:p.x,y:p.y,base:st.p};lastX=p.x;lastT=performance.now();st.relax=1}
    else if(st.ph==='flip')tapFlip(p);else if(st.ph==='end')finish()});
  R.addEventListener('pointermove',e=>{if(!st.drag)return;const p=loc(e),now=performance.now();const d=st.drag;d.x=p.x;d.y=p.y;const dx=p.x-d.x0;
    if(!st.dir){if(Math.abs(dx)>7){st.dir=dx<0?-1:1;st.ph='tear';S.tearOn()}else return}
    if(st.ph!=='tear')return;
    const tv=st.dir<0?(d.x0-p.x):(p.x-d.x0);const np=Math.min(1,Math.max(st.p,d.base+Math.max(0,tv)/(PW*.82)));
    fo+=((Math.max(-9,Math.min(9,(p.y-d.y0)*.18)))-fo)*.12;const was=st.p;st.p=np;
    for(let i=0;i<NC;i++){if(torn(i)&&!fixd[i]){ty[i]=TY+jag[i]+fo;fixd[i]=1}}
    const dt=Math.max(8,now-lastT),sp=Math.abs(p.x-lastX)/dt;lastX=p.x;lastT=now;S.tearSpeed(np>was?Math.min(1,sp*.9):0);st.tilt=(st.dir<0?-1:1)*st.p*.4;
    if(st.p>=1){S.tearSpeed(0);snap()}});
  const up=e=>{if(!st.drag)return;st.drag=null;S.tearSpeed(0);if(st.ph!=='tear')return;if(st.p>=.6)autoTear();else{st.relaxT=performance.now();S.tearOff()}};
  R.addEventListener('pointerup',up);R.addEventListener('pointercancel',up);
  /* 0.6 いじょう：のこりを 自動で ビリッ */
  function autoTear(){st.ph='auto';const p0=st.p,t0=performance.now(),D=Math.max(120,(1-p0)*380);S.tearOn();const step=()=>{const k=E.cl((performance.now()-t0)/D);st.p=lerp(p0,1,k);for(let i=0;i<NC;i++){if(torn(i)&&!fixd[i]){ty[i]=TY+jag[i]+fo;fixd[i]=1}}S.tearSpeed(.9);if(k<1)requestAnimationFrame(step);else snap()};step()}
  function snap(){if(st.strip)return;st.ph='snap';st.drag=null;S.tearOff();S.snap();makeStrip();const y=pTop()+TY+st.packY;
    paperBits(PX,y,st.dir<0?-1:1);bursts.push({x:PX,y:y+6,r:PW*.95,col:best,t0:performance.now(),d:900,rays:best==='N'?0:9});setTimeout(()=>S.burst(best),60);
    later(380+(best==='N'?0:180),rise)}
  /* ---- 流れ ---- */
  const timers=[];const later=(ms,f)=>timers.push(setTimeout(f,ms));
  async function rise(){try{await Promise.race([Promise.all(C.map(c=>c.ld).filter(Boolean)),new Promise(r=>setTimeout(r,2500))])}catch(e){}st.ph='rise';S.rise(n);const now=performance.now();const top=pTop()+st.packY;
    C.forEach((c,i)=>{c.s=s0;c.x=PX+(i-(n-1)/2)*3;c.y=top+TY+6+CH*s0/2;c.vis=1;c.z=10+i;c.state='rise';c.f0=now+i*130;c.ya=c.y;c.yb=top-CH*s0/2+TY-14-(n-1-i)*2;c.rz=(i-(n-1)/2)*.012})
    later(130*(n-1)+700,()=>{st.ph='drop';st.dropT=performance.now();later(480,fan)})}
  function fan(){st.ph='fan';const now=performance.now();S.fan(n);C.forEach((c,i)=>{c.state='fan';c.f0=now+i*70;c.xa=c.x;c.ya=c.y;c.sa=c.s;c.rza=c.rz});later(70*(n-1)+620,()=>{st.ph='flip';st.nextAuto=performance.now()+1300})}
  let busy=false;
  function tapFlip(p){if(busy){C.forEach(c=>{if(c.state==='zoom'&&c.hold)c.hurry=1});return}
    let tgt=C.find(c=>!c.done&&c.state==='slot'&&Math.abs(p.x-c.x)<CB/2&&Math.abs(p.y-c.y)<CH/2);if(!tgt)tgt=C.find(c=>!c.done&&c.state==='slot');if(tgt)reveal(tgt)}
  function reveal(c){busy=true;c.done=true;const r=rr(c),now=performance.now();c.f0=now;
    if(r==='N'){c.state='flipN';S.flip()}
    else if(r==='R'){c.state='flipR';S.tell('R');S.rare()/* 11/1：おした しゅんかんに */}
    else{c.state='zoom';c.hold=0;c.hurry=0;c.xa=c.x;c.ya=c.y;S.tell('L');S.legend(c.cd.awk)/* 11/1：おした しゅんかんに */;C.forEach(d=>{if(d!==c)d.dimT=1});pillars.push({card:c,col:r,t0:now+250})}}
  function revealDone(c){c.state='slot';busy=false;st.nextAuto=performance.now()+1400;if(C.every(d=>d.done&&d.state==='slot'))later(450,()=>{st.ph='end';st.endT=performance.now()})}
  let fin=false;function finish(){if(fin)return;fin=true;S.stop();R.style.opacity=0;timers.forEach(clearTimeout);setTimeout(()=>{cancelAnimationFrame(raf);resolve();if(!o.keep)R.remove()},260)}
  PFX._cur={finish,st,C};
  /* ---- ループ ---- */
  let raf=0,prev=performance.now();
  function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-prev)/1000);prev=now;const t=now-st.t0;
    /* 段階 */
    if(st.ph==='in'&&t>700){st.ph='tell';st.t0=now;later(0,()=>{})}
    if(st.ph==='tell'){const e=now-st.t0;const ks=[[150,0],[520,1],[890,2]];st.shk=0;ks.forEach(([s,i])=>{const k=(e-s)/260;if(k>0&&k<1){st.shk=Math.sin(k*Math.PI*5)*(1-k)*.05*(1+i*.3);if(!st['sh'+i]){st['sh'+i]=1;S.shake(i)}}});if(e>1350){st.ph='idle';st.shk=0;st.hint0=now}}
    if(st.relaxT){const k=E.cl((now-st.relaxT)/260);st.relax=1-.22*E.o(k);if(k>=1)st.relaxT=0}
    if(st.ph==='drop'||st.ph==='fan'||st.ph==='flip'||st.ph==='end'){const k=E.cl((now-(st.dropT||now))/420);st.packY=E.io(k)*PH*.7;st.packA=1-k}
    /* カード */
    C.forEach(c=>{const e=now-c.f0;
      if(c.state==='rise'){const k=E.cl(e/650);c.y=lerp(c.ya,c.yb,E.io(k))}
      else if(c.state==='fan'){const k=E.cl(e/560),q=E.back(k),sl=slots[c.i];c.x=lerp(c.xa,sl.x,E.io(k));c.y=lerp(c.ya,sl.y,E.io(k))-Math.sin(k*Math.PI)*30;c.s=lerp(c.sa,1,q);c.rz=lerp(c.rza,0,E.io(k));if(k>=1){c.state='slot';c.x=sl.x;c.y=sl.y;c.s=1;c.z=10+c.i}}
      else if(c.state==='flipN'){const k=E.cl(e/400);c.ry=180*E.io(k);c.s=1+.1*Math.sin(k*Math.PI);if(k>=1&&!c.fx){c.fx=1;sparkAt(c.x,c.y-CH*.2,6,'#fff6d8',SPK);S.sparkle();later(320,()=>revealDone(c))}}
      else if(c.state==='flipR'){c.glow=Math.min(1,e/250)*.8;if(e<320){c.rz=Math.sin(e/22)*.03}else{c.rz=0;const k=E.cl((e-320)/420);c.ry=180*E.io(k);c.s=1+.12*Math.sin(k*Math.PI);if(k>=1&&!c.fx){c.fx=1;S.flip();sweeps.push({card:c,t0:now,d:650});sparkAt(c.x,c.y,9,'#dff0ff',STAR);bursts.push({x:c.x,y:c.y,r:CB*1.1,col:'R',t0:now,d:700});labels.push({s:'レア！',card:c,below:slots[c.i].row===1,t0:now,d:1300,col:'#cfe6ff',size:20});later(700,()=>{c.glow=.0;revealDone(c)})}}}
      else if(c.state==='zoom'){/* レジェンド：まんなかへ 大きく → めくる → ファンファーレ → もどる */
        const big=Math.min(1.75,(W*.52)/CB,(HH*.5)/CH),cx=W/2,cy=HH*.43;st.dim=Math.min(1,e/400);
        if(e<520){const k=E.io(E.cl(e/520));c.x=lerp(c.xa,cx,k);c.y=lerp(c.ya,cy,k);c.s=lerp(1,big,k);c.z=40;c.glow=k}
        else if(e<1000){c.rz=Math.sin(e/20)*.025*(1-(e-520)/480);c.glow=1}
        else if(!c.fx){c.rz=0;const k=E.cl((e-1000)/450);c.ry=180*E.io(k);c.s=big*(1+.08*Math.sin(k*Math.PI));
          if(k>=1&&!c.fx){c.fx=1;const A=c.cd.awk;S.flip();confetti(c.x,c.y-CH*big*.3);bursts.push({x:c.x,y:c.y,r:CB*big*1.1,col:A?'A':'L',t0:now,d:900,rays:12});sweeps.push({card:c,t0:now,d:A?1100:800,rainbow:!!A,loop:!!A});if(!A)sweeps.push({card:c,t0:now+300,d:800});
            labels.push({s:A?'かくせい！':'レジェンド！',x:cx,y:Math.max(28,cy-CH*big/2-26),t0:now,d:2100,col:A?'#ffb0f0':'#ffe066',size:28});c.hold=now}}
        else if(c.hold&&(now-c.hold>2000||(c.hurry&&now-c.hold>500))){c.state='settle';c.f0=now;c.xb=c.x;c.yb=c.y;c.sb=c.s}}
      else if(c.state==='settle'){const k=E.io(E.cl(e/480)),sl=slots[c.i];c.x=lerp(c.xb,sl.x,k);c.y=lerp(c.yb,sl.y,k);c.s=lerp(c.sb,1,k);st.dim=1-k;c.glow=1-k*.6;if(k>=1){c.z=10+c.i;pillars.forEach(p=>{if(p.card===c)p.end=now});C.forEach(d=>d.dimT=0);c.glow=.4;revealDone(c)}}
      if(c.state==='slot'&&c.done&&c.glow>0&&rr(c)!=='N')c.glow=Math.max(rr(c)==='R'?0:.35,c.glow-dt);
      const dT=c.dimT?1:0;c.dimmed+=(dT-c.dimmed)*Math.min(1,dt*8);setCard(c)});
    /* 自動で めくる（一拍 おいて） */
    if(st.ph==='flip'&&!busy&&now>st.nextAuto){const c=C.find(d=>!d.done&&d.state==='slot');if(c)reveal(c)}
    /* かく */
    drawBg(bg,now);
    fg.clearRect(0,0,W,H);
    if(st.packA>0)drawPack(fg,now);
    drawStrip(fg,now,dt);drawBursts(fg,now);drawSweeps(fg,now);drawP(fg,now,dt);drawGuide(fg,now);
    /* 文字（いちばん 上） */
    if(st.ph==='idle'||(st.ph==='tear'&&st.p<.25)){const y=Math.min(HH-24,PY+PH/2+44);txt(fg,'ゆびで なぞって やぶろう！',W/2,y,{size:19,col:'#fff3d0',a:.75+.25*Math.sin(now/300)})}
    if(st.ph==='end'){const e=now-st.endT;const lastY=slots[slots.length-1].y+CH/2,y=Math.min(HH-30,lastY+46),a=Math.min(1,e/300);
      if(o.endBtn){const bw=190,bh=48,sc=1+.03*Math.sin(now/260);fg.save();fg.globalAlpha=a;fg.translate(W/2,y);fg.scale(sc,sc);const g=fg.createLinearGradient(0,-bh/2,0,bh/2);g.addColorStop(0,'#ffe27a');g.addColorStop(1,'#e8962a');fg.fillStyle='#7a4310';fg.beginPath();fg.roundRect(-bw/2,-bh/2+4,bw,bh,bh/2);fg.fill();fg.fillStyle=g;fg.beginPath();fg.roundRect(-bw/2,-bh/2,bw,bh,bh/2);fg.fill();fg.strokeStyle='#fff3c0';fg.lineWidth=2;fg.stroke();fg.restore();txt(fg,o.endBtn,W/2,y,{size:20,col:'#fffbe8',a})}
      else txt(fg,'タップで つぎへ',W/2,y,{size:18,col:'#fff3d0',a:a*(.7+.3*Math.sin(now/300))})}
    drawLabels(fg,now)}
  raf=requestAnimationFrame(frame)})}
const PFX=window.PackFX={run,seLog:SELOG,se:PSE};
})();

/* ===== ゲームに つなぐ：パックを 買ったときの packCut を つつむ（エラーなら 前の 演出） =====
   おわったら 前の 画面の OK（#pkd）を おして、いつもどおり 雑貨屋へ（覚醒の おしらせも そのまま） */
(function(){
if(typeof packCut!=='function'||typeof openStagePack!=='function'||window.__pfxWired)return;window.__pfxWired=1;
const _pc=packCut;
packCut=async function(sid,got,stage){if(typeof HUMAN!=='undefined'&&!HUMAN)return;
  try{const boss=STAGES[sid]&&STAGES[sid].boss;
    const cards=got.map(id=>{const awk=id===boss&&typeof AWK!=='undefined'&&AWK[id]&&typeof AWIMG!=='undefined'&&AWIMG[id]&&G.awk&&G.awk[id];let el;
      const lv=(G.col&&G.col[id]&&G.col[id].lv)||1;
      if(awk){const P=(AWK[id]&&AWK[id].plus)||2;el=cardEl(id,lv,{plus:P,showTx:false});try{awArt(el,id);el.classList.add('awkf')}catch(e){}}else el=cardEl(id,lv,{showTx:false});
      return {face:el,r:C[id].r,awk:!!awk}});
    const U=n=>'ui/'+n;
    await PackFX.run(document.body,{fixed:true,z:9000,keep:true,pack:(window.ARTD&&ARTD['pack/'+sid])||('art/pack/'+sid+'.webp'),cards,
      img:{back:'ui/w_cardback.png',coin:U('x_coin.png'),star:U('x_star.png'),spark:U('x_spark.png')},
      ac:()=>typeof ac==='function'?ac():null,seJs:'packse.js',out:()=>typeof sfxOut==='function'?sfxOut():null,muted:()=>typeof MUTED!=='undefined'&&MUTED,sfx:typeof SFX!=='undefined'?{flip:SFX.flip,fanfare:SFX.fanfare||SFX.legend,sparkle:SFX.sparkle}:null,
      buf:f=>window.SE2&&SE2.buf&&SE2.buf[f]});
    const roots=[...document.querySelectorAll('.pfx-root')];
    setTimeout(()=>{const d=document.getElementById('pkd');if(d)d.click();setTimeout(()=>roots.forEach(r=>r.remove()),60)},0);
    return}
  catch(e){try{console.warn('PackFX',e);document.querySelectorAll('.pfx-root').forEach(r=>r.remove())}catch(_){}return _pc.apply(this,arguments)}};
})();
