/* キャンバス演出エンジン（ウィピィ）
   ・場面（ステージ・子分・親分）を毎コマ描き、その上に演出（つぶ・光・文字…）を重ねる
   ・時間は ms。演出は「いつ はじまり、どれだけ つづくか」で描く */
const FX=(()=>{
const U='../ui/',IMG={};
function img(src){if(IMG[src])return IMG[src];const i=new Image();i.src=src;IMG[src]=i;return i}
const ui=n=>img(U+n+'.png');
const E={o:t=>1-Math.pow(1-t,3),io:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,b:t=>{const c=1.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)},el:t=>t===0||t===1?t:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2.094)+1};
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),seg=(t,a,d)=>cl((t-a)/d);
let cv,c,W,H,DPR,run=0,T0=0,fx=[],shakeP=0,shakeEnd=0,flashA=[],units=[],heroes={},dim=0,dimT=null;
function fit(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR}
function init(canvas){cv=canvas;c=cv.getContext('2d');fit();addEventListener('resize',fit)}
/* ---- 場面 ---- */
function unit(o){return Object.assign({x:.5,y:.7,r:34,art:'dog',atk:2,hp:3,alpha:1,sc:1,ox:0,oy:0,rot:0,tint:null,gray:0,glow:0,glowC:'255,211,74',hidden:false,status:[]},o)}
function stage(spec){units=[];heroes={};(spec.foes||[]).forEach((u,i,a)=>units.push(unit(Object.assign({side:'foe',x:(i+1)/(a.length+1),y:.36},u))));(spec.mine||[]).forEach((u,i,a)=>units.push(unit(Object.assign({side:'me',x:(i+1)/(a.length+1),y:.66},u))));
  heroes.foe={x:.5,y:.12,r:30,art:spec.foeHero||'wolf',hp:20,ox:0,oy:0,sc:1};heroes.me={x:.5,y:.9,r:26,art:'icon',hp:30,ox:0,oy:0,sc:1}}
const P=u=>({x:u.x*W+u.ox,y:u.y*H+u.oy});
function artImg(a){return a==='icon'?img('../art/w/icon.jpg'):img('img/'+a+'.webp')}
function drawUnit(u){if(u.hidden||u.alpha<=0)return;const {x,y}=P(u);const r=u.r*u.sc;c.save();c.globalAlpha=u.alpha;c.translate(x,y);c.rotate(u.rot);
  if(u.glow>0){c.shadowColor=`rgba(${u.glowC},${u.glow})`;c.shadowBlur=26}
  c.fillStyle='#fff';c.beginPath();c.arc(0,0,r+4,0,7);c.fill();c.shadowBlur=0;
  c.save();c.beginPath();c.arc(0,0,r,0,7);c.clip();const im=artImg(u.art);if(im.complete&&im.naturalWidth){c.filter=u.gray?`grayscale(${u.gray}) brightness(${1-u.gray*.4})`:'none';c.drawImage(im,-r,-r,r*2,r*2);c.filter='none'}
  if(u.tint){c.fillStyle=u.tint;c.fillRect(-r,-r,r*2,r*2)}c.restore();
  /* 数字 */const bd=(v,col,bx)=>{c.fillStyle=col;c.beginPath();c.arc(bx,r*.78,11,0,7);c.fill();c.lineWidth=2;c.strokeStyle='#fff';c.stroke();c.fillStyle='#fff';c.font='900 12px "M PLUS Rounded 1c"';c.textAlign='center';c.textBaseline='middle';c.fillText(v,bx,r*.78+1)};
  bd(u.atk,'#d23a2a',-r*.7);bd(u.hp,'#2a6ad2',r*.7);c.restore()}
function drawHero(h){const {x,y}=P(h);const r=h.r*h.sc;c.save();c.translate(x,y);c.fillStyle='#ffd27a';c.beginPath();c.arc(0,0,r+4,0,7);c.fill();c.save();c.beginPath();c.arc(0,0,r,0,7);c.clip();const im=artImg(h.art);if(im.complete&&im.naturalWidth)c.drawImage(im,-r,-r,r*2,r*2);c.restore();
  c.fillStyle='#d2324a';c.beginPath();c.arc(r*.85,r*.6,12,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();c.fillStyle='#fff';c.font='900 12px "M PLUS Rounded 1c"';c.textAlign='center';c.textBaseline='middle';c.fillText(h.hp,r*.85,r*.6+1);c.restore()}
/* ---- 演出の 部品（すべて 時間で 描く） ---- */
const add=f=>{fx.push(f);return f};
function at(ms,fn){add({t0:ms,once:true,fn})}
function ring(x,y,o={}){const {t=0,d=650,col='255,211,74',r0=10,r1=120,w=8}=o;add({draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;c.strokeStyle=`rgba(${col},${1-k})`;c.lineWidth=w*(1-k*.6);c.beginPath();c.arc(x,y,r0+(r1-r0)*E.o(k),0,7);c.stroke()}})}
function rays(x,y,o={}){const {t=0,d=1400,col='255,242,176',n=16,len=420,spin=.4,a=.5}=o;add({draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;const al=Math.min(1,k*5,(1-k)*3)*a;c.save();c.translate(x,y);c.rotate(tt/1000*spin);c.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const a0=i/n*Math.PI*2;c.fillStyle=`rgba(${col},${al*(i%2?.9:.45)})`;c.beginPath();c.moveTo(0,0);c.arc(0,0,len,a0,a0+Math.PI/n/1.6);c.closePath();c.fill()}c.restore()}})}
function burst(x,y,o={}){const {t=0,n=18,im='x_spark',sp=7,g=.2,life=1100,sz=.25,add_=true,spread=Math.PI*2,dir=0,up=3}=o;const P_=[];for(let i=0;i<n;i++){const a=dir-spread/2+Math.random()*spread;P_.push({a,v:sp*(.5+Math.random()*.8),s:sz*(.6+Math.random()*.8),l:life*(.6+Math.random()*.6),sp:(Math.random()-.5)*.3,im:Array.isArray(im)?im[i%im.length]:im})}
  add({draw(tt){const e=tt-t;if(e<0)return;for(const p of P_){if(e>p.l)continue;const f=e/16.7,dr=Math.pow(.95,f),dist=p.v*(1-dr)/.05;const px=x+Math.cos(p.a)*dist,py=y+Math.sin(p.a)*dist-up*(1-dr)/.05+g*f*f*.35;const I=ui(p.im);if(!I.complete)continue;const s=p.s*126;c.save();c.globalAlpha=Math.min(1,(1-e/p.l)*2.5);if(add_)c.globalCompositeOperation='lighter';c.translate(px,py);c.rotate(f*p.sp);c.drawImage(I,-s/2,-s/2,s,s);c.restore()}}})}
function dots(x,y,o={}){const {t=0,n=16,col='255,224,138',sp=2,up=1.5,life=1200,r=3,area=60,add_=true}=o;const P_=[];for(let i=0;i<n;i++)P_.push({x:x+(Math.random()-.5)*area,y:y+(Math.random()-.5)*area*.4,vx:(Math.random()-.5)*sp,vy:-up*(.4+Math.random()),l:life*(.5+Math.random()*.8),d:Math.random()*life*.3,r:r*(.5+Math.random())});
  add({draw(tt){const e=tt-t;if(e<0)return;c.save();if(add_)c.globalCompositeOperation='lighter';for(const p of P_){const ee=e-p.d;if(ee<0||ee>p.l)continue;const f=ee/16.7;c.fillStyle=`rgba(${col},${1-ee/p.l})`;c.beginPath();c.arc(p.x+p.vx*f,p.y+p.vy*f,p.r,0,7);c.fill()}c.restore()}})}
function smoke(x,y,o={}){const {t=0,n=12,col='201,170,130',life=900,spread=90,r=16}=o;const P_=[];for(let i=0;i<n;i++){const a=Math.PI+Math.random()*Math.PI;P_.push({a,v:spread*(.5+Math.random()*.6),l:life*(.7+Math.random()*.5)})}
  add({draw(tt){const e=tt-t;if(e<0)return;for(const p of P_){if(e>p.l)continue;const k=e/p.l;c.fillStyle=`rgba(${col},${.55*(1-k)})`;c.beginPath();c.arc(x+Math.cos(p.a)*p.v*E.o(k),y+Math.sin(p.a)*p.v*.3*E.o(k),r+r*1.6*k,0,7);c.fill()}}})}
function flash(o={}){const {t=0,d=260,col='255,255,255',a=1}=o;add({top:1,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;c.fillStyle=`rgba(${col},${a*(1-k)})`;c.fillRect(-30,-30,W+60,H+60)}})}
function darken(o={}){const {t=0,d=2400,a=.5,inD=300,outD=400}=o;add({under:1,draw(tt){const e=tt-t;if(e<0||e>d)return;const al=a*Math.min(1,e/inD,(d-e)/outD);c.fillStyle=`rgba(20,8,0,${al})`;c.fillRect(-30,-30,W+60,H+60)}})}
function shake(o={}){const {t=0,d=380,p=8}=o;add({pre:1,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;const q=p*(1-k);c.translate((Math.random()-.5)*2*q,(Math.random()-.5)*2*q)}})}
function slam(str,x,y,o={}){const {t=0,d=1500,size=56,grad=['#fffbe0','#ffe066','#ffb31a','#ff7a00'],stroke='#3e1a06',from=3,sub=null}=o;add({top:1,draw(tt){const k=seg(tt,t,260),e=tt-t;if(e<0||e>d)return;const out=1-seg(tt,t+d-300,300);const s=from-(from-1)*E.b(k);c.save();c.globalAlpha=Math.min(1,k*2)*out;c.translate(x,y);c.scale(s,s);c.font=`${size}px "Dela Gothic One"`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=size*.2;c.strokeStyle=stroke;c.shadowColor='rgba(0,0,0,.6)';c.shadowOffsetY=5;c.shadowBlur=4;c.strokeText(str,0,0);c.shadowColor='transparent';const g=c.createLinearGradient(0,-size/2,0,size/2);grad.forEach((col,i)=>g.addColorStop(i/(grad.length-1),col));c.fillStyle=g;c.fillText(str,0,0);
  /* キラッ */const sh=seg(tt,t+300,500);if(sh>0&&sh<1){c.globalCompositeOperation='source-atop';const w=c.measureText(str).width;const sx=-w/2-40+(w+80)*sh;const gg=c.createLinearGradient(sx-30,0,sx+30,0);gg.addColorStop(0,'rgba(255,255,255,0)');gg.addColorStop(.5,'rgba(255,255,255,.95)');gg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gg;c.fillText(str,0,0)}
  c.restore();if(sub){const ks=seg(tt,t+250,300);c.save();c.globalAlpha=ks*out;c.font='800 16px "M PLUS Rounded 1c"';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=6;c.strokeStyle=stroke;c.strokeText(sub,x,y+size*.75-8*(1-ks));c.fillStyle='#fff';c.fillText(sub,x,y+size*.75-8*(1-ks));c.restore()}}})}
function floatTxt(str,x,y,o={}){const {t=0,d=1100,col='#fff',size=22,stroke='#3e1a06',rise=46}=o;add({top:1,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;const pop=E.b(seg(tt,t,220));c.save();c.globalAlpha=1-seg(tt,t+d*.6,d*.4);c.translate(x,y-rise*E.o(k));c.scale(.4+.6*pop,.4+.6*pop);c.font=`900 ${size}px "M PLUS Rounded 1c"`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=6;c.strokeStyle=stroke;c.strokeText(str,0,0);c.fillStyle=col;c.fillText(str,0,0);c.restore()}})}
function icon(name,x,y,o={}){const {t=0,d=1200,sz=64,spin=0,bob=0,a=1}=o;add({top:1,draw(tt){const k=seg(tt,t,d),e=tt-t;if(e<0||e>d)return;const I=ui(name);if(!I.complete)return;const s=sz*E.b(seg(tt,t,300));c.save();c.globalAlpha=a*(1-seg(tt,t+d-250,250));c.translate(x,y+Math.sin(e/200)*bob);c.rotate(spin*e/1000);c.drawImage(I,-s/2,-s/2,s,s);c.restore()}})}
function shot(from,to,o={}){const {t=0,d=260,im='x_bullet',sz=26,arc=0,trail='255,230,150',spin=0,onHit}=o;let hit=false;add({draw(tt){const k=seg(tt,t,d);if(k<=0)return;if(k>=1){if(!hit){hit=true;onHit&&onHit(tt)}return}const x=from.x+(to.x-from.x)*k,y=from.y+(to.y-from.y)*k-Math.sin(k*Math.PI)*arc;
  c.save();c.globalCompositeOperation='lighter';for(let i=1;i<6;i++){const kk=Math.max(0,k-i*.04);const tx=from.x+(to.x-from.x)*kk,ty=from.y+(to.y-from.y)*kk-Math.sin(kk*Math.PI)*arc;c.fillStyle=`rgba(${trail},${.35-i*.06})`;c.beginPath();c.arc(tx,ty,sz*.35*(1-i*.12),0,7);c.fill()}c.restore();
  const I=ui(im);if(I.complete){const a=Math.atan2(to.y-from.y,to.x-from.x);c.save();c.translate(x,y);c.rotate(spin?tt/100:a);c.drawImage(I,-sz/2,-sz/2,sz,sz);c.restore()}}})}
function tween(u,o){const {t=0,d=400,e=E.o,...props}=o;const from={};add({pre:1,draw(tt){const k=seg(tt,t,d);if(k<=0)return;for(const p in props){if(!(p in from))from[p]=u[p];u[p]=from[p]+(props[p]-from[p])*e(k)}}})}
function keyf(u,o){const {t=0,d=400,fn}=o;add({pre:1,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;fn(u,k,tt)}})}
function overlay(u,o){const {t=0,d=2000,draw:dr}=o;add({draw(tt){const e=tt-t;if(e<0||e>d)return;const {x,y}=P(u);dr(x,y,u.r*u.sc,e,e/d)}})}
function play(builder,total=2600){const my=++run;fx=[];stage(builder.stage||{});builder.build&&builder.build();T0=performance.now();
  const loop=()=>{if(my!==run)return;const t=performance.now()-T0;frame(t);if(t<total+200)requestAnimationFrame(loop)};requestAnimationFrame(loop)}
function frame(t){c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);for(const f of fx)if(f.once&&!f.done&&t>=f.t0){f.done=1;f.fn(t)}
  c.save();for(const f of fx)if(f.pre)f.draw(t);for(const f of fx)if(f.under)f.draw(t);
  drawHero(heroes.foe);drawHero(heroes.me);for(const u of units)drawUnit(u);
  for(const f of fx)if(f.draw&&!f.pre&&!f.under&&!f.top)f.draw(t);for(const f of fx)if(f.top)f.draw(t);c.restore()}
return {init,play,ring,rays,burst,dots,smoke,flash,darken,shake,slam,floatTxt,icon,shot,tween,keyf,overlay,at,P,E,seg,units:()=>units,heroes:()=>heroes,ctx:()=>c,dims:()=>({W,H}),ui,img}})();
