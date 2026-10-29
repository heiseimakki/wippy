/* キャンバス演出エンジン（ウィピィ）
   ・場面（ステージ・子分・親分）を毎コマ描き、その上に演出（つぶ・光・文字…）を重ねる
   ・時間は ms。演出は「いつ はじまり、どれだけ つづくか」で描く */
const FX=(()=>{
const U='../ui/',IMG={};
function img(src){if(IMG[src])return IMG[src];const i=new Image();i.src=src;IMG[src]=i;return i}
/* fx: で はじまる 名前は 演出用の 画像（lab/fx/）*/
const ui=n=>n.startsWith('fx:')?img('fx/'+n.slice(3)+'.webp'):img(U+n+'.png');
const E={o:t=>1-Math.pow(1-t,3),io:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,b:t=>{const c=1.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)},el:t=>t===0||t===1?t:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2.094)+1};
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),seg=(t,a,d)=>cl((t-a)/d);
let cv,c,W,H,DPR,run=0,T0=0,fx=[],shakeP=0,shakeEnd=0,flashA=[],units=[],heroes={},dim=0,dimT=null,BW=null,bd=null,maxEnd=0,shX=0,shY=0;
const ext=e=>{if(e>maxEnd)maxEnd=e};
/* 読ませる 文字は 3びょう いじょう（長いと もっと） */
/* 文字の 長さに あわせる：みじかい ひとこと（見参の セリフくらい）は 2びょう台、文は 3びょう いじょう */
const readMs=(s,min)=>{if(!s||!/[ぁ-んァ-ン一-龥]/.test(s))return min;const n=s.replace(/\s/g,'').length;return Math.max(min,n<=22?1300+n*70:Math.max(3000,900+n*170))};
function fit(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;if(ucv){ucv.width=W*DPR;ucv.height=H*DPR}}
let uc=null,ucv=null;
function init(canvas,frameEl){cv=canvas;c=cv.getContext('2d');if(frameEl){BW=frameEl.contentWindow;ucv=BW.document.getElementById('under');uc=ucv&&ucv.getContext('2d')}fit();if(!init.on){init.on=1;addEventListener('resize',fit)}}
/* ---- 場面 ---- */
function unit(o){return Object.assign({x:.5,y:.7,r:34,art:'dog',atk:2,hp:3,alpha:1,sc:1,ox:0,oy:0,rot:0,tint:null,gray:0,glow:0,glowC:'255,211,74',hidden:false,status:[],marks:[]},o)}
/* 本番の バトル画面（board.html）に 子分を ならべて、その 位置を つかう */
function stage(spec){units=[];heroes={};bd=BW.BD.set(spec);const all=[...(spec.foes||[]).map(u=>Object.assign({side:'foe'},u)),...(spec.mine||[]).map(u=>Object.assign({side:'me'},u))];
  all.forEach((o,i)=>{const el=bd.units[i];const u=unit(o);u.el=el;units.push(u)});
  const hx=(el,o)=>Object.assign({el,ox:0,oy:0,sc:1,rot:0,alpha:1,gray:0,glow:0,glowC:'255,211,74',tint:null,marks:[]},o);
  heroes.foe=hx(bd.foeHero,{hp:+(bd.foeHero.querySelector('.hp')||{}).textContent||20});heroes.me=hx(bd.meHero,{hp:+(bd.meHero.querySelector('.hp')||{}).textContent||40});
  measure()}
function measure(){[...units,heroes.foe,heroes.me].forEach(u=>{if(!u||!u.el)return;const t=u.el.style.transform;u.el.style.transform='none';const r=u.el.getBoundingClientRect();u.el.style.transform=t;u.bx=r.left+r.width/2;u.by=r.top+r.height/2;u.x=u.bx/W;u.y=u.by/H;u.r=Math.min(r.width,r.height)/2;u.rw=r.width;u.rh=r.height})}
const P=u=>({x:u.x*W+u.ox,y:u.y*H+u.oy});
const place=(el)=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}};
function apply(u){const el=u.el;if(!el)return;const dx=u.x*W-u.bx+u.ox,dy=u.y*H-u.by+u.oy;
  el.style.transform=`translate(${dx+shX}px,${dy+shY}px) rotate(${u.rot}rad) scale(${u.sc})`;el.style.opacity=u.hidden?0:u.alpha;el.style.clipPath=u.clipB?`inset(-30% -30% ${(u.clipB*100).toFixed(1)}% -30%)`:'';
  const f=[];if(u.gray)f.push(`grayscale(${u.gray}) brightness(${1-u.gray*.4})`);if(u.glow>0)f.push(`drop-shadow(0 0 ${8+14*u.glow}px rgba(${u.glowC},${Math.min(1,u.glow)}))`);el.style.filter=f.join(' ')||'none';
  const t=el.querySelector('.fxt');if(t)t.style.background=u.tint||'transparent';
  const a=el.querySelector('.stat.a'),h=el.querySelector('.stat.h,.hp');if(a&&u.atk!=null&&a.textContent!=String(u.atk))a.textContent=u.atk;if(a)a.classList.toggle('up',!!u.up);if(h&&u.hp!=null&&h.textContent!=String(u.hp))h.textContent=u.hp;
  const m=el.querySelector('.fxm');if(m){const k=u.marks.join(',');if(m.dataset.k!==k){m.dataset.k=k;m.innerHTML=u.marks.map(n=>`<img src="../ui/${n}.png" alt="">`).join('')}}}
/* ---- 演出の 部品（すべて 時間で 描く） ---- */
const add=f=>{fx.push(f);return f};
function at(ms,fn){ext(ms);add({t0:ms,once:true,fn})}
function ring(x,y,o={}){const {t=0,d=650,col='255,211,74',r0=10,r1=120,w=8}=o;add({draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;c.strokeStyle=`rgba(${col},${1-k})`;c.lineWidth=w*(1-k*.6);c.beginPath();c.arc(x,y,r0+(r1-r0)*E.o(k),0,7);c.stroke()}})}
function rays(x,y,o={}){const {t=0,d=1400,col='255,242,176',n=16,len=420,spin=.4,a=.5,under=false}=o;ext(t+d);add({low:under,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;const al=Math.min(1,k*5,(1-k)*3)*a;c.save();c.translate(x,y);c.rotate(tt/1000*spin);c.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const a0=i/n*Math.PI*2;c.fillStyle=`rgba(${col},${al*(i%2?.9:.45)})`;c.beginPath();c.moveTo(0,0);c.arc(0,0,len,a0,a0+Math.PI/n/1.6);c.closePath();c.fill()}c.restore()}})}
function burst(x,y,o={}){const {t=0,n=18,im='x_spark',sp=7,g=.2,life=1100,sz=.25,add_=true,spread=Math.PI*2,dir=0,up=3,sway=null,filter=null,orient=false}=o;const ims=Array.isArray(im)?im:[im];const sw=sway!=null?sway:(ims.some(n=>/star|spark/.test(n))?null:.22);ext(t+life*1.2);const P_=[];for(let i=0;i<n;i++){const a=dir-spread/2+Math.random()*spread;P_.push({a,v:sp*(.5+Math.random()*.8),s:sz*(.6+Math.random()*.8),l:life*(.6+Math.random()*.6),sp:(Math.random()-.5)*.3,ph:Math.random()*6,im:Array.isArray(im)?im[i%im.length]:im})}
  add({draw(tt){const e=tt-t;if(e<0)return;for(const p of P_){if(e>p.l)continue;const f=e/16.7,dr=Math.pow(.95,f),dist=p.v*(1-dr)/.05;const px=x+Math.cos(p.a)*dist,py=y+Math.sin(p.a)*dist-up*(1-dr)/.05+g*f*f*.35;const I=ui(p.im);if(!I.complete)continue;const s=p.s*126*1.5;c.save();c.globalAlpha=Math.min(1,(1-e/p.l)*2.5);if(add_)c.globalCompositeOperation='lighter';if(filter)c.filter=filter;c.translate(px,py);c.rotate(orient?p.a+Math.PI/2:(sw!=null?Math.sin(f*.09+p.ph)*sw:f*p.sp));c.drawImage(I,-s/2,-s/2,s,s);c.restore()}}})}
function dots(x,y,o={}){const {t=0,n=16,col='255,224,138',sp=2,up=1.5,life=1200,r=3,area=60,add_=true}=o;const P_=[];for(let i=0;i<n;i++)P_.push({x:x+(Math.random()-.5)*area,y:y+(Math.random()-.5)*area*.4,vx:(Math.random()-.5)*sp,vy:-up*(.4+Math.random()),l:life*(.5+Math.random()*.8),d:Math.random()*life*.3,r:r*(.5+Math.random())});
  add({draw(tt){const e=tt-t;if(e<0)return;c.save();if(add_)c.globalCompositeOperation='lighter';for(const p of P_){const ee=e-p.d;if(ee<0||ee>p.l)continue;const f=ee/16.7;c.fillStyle=`rgba(${col},${1-ee/p.l})`;c.beginPath();c.arc(p.x+p.vx*f,p.y+p.vy*f,p.r,0,7);c.fill()}c.restore()}})}
function smoke(x,y,o={}){const {t=0,n=12,col='201,170,130',life=900,spread=90,r=16}=o;const P_=[];for(let i=0;i<n;i++){const a=Math.PI+Math.random()*Math.PI;P_.push({a,v:spread*(.5+Math.random()*.6),l:life*(.7+Math.random()*.5)})}
  add({draw(tt){const e=tt-t;if(e<0)return;for(const p of P_){if(e>p.l)continue;const k=e/p.l;c.fillStyle=`rgba(${col},${.55*(1-k)})`;c.beginPath();c.arc(x+Math.cos(p.a)*p.v*E.o(k),y+Math.sin(p.a)*p.v*.3*E.o(k),r+r*1.6*k,0,7);c.fill()}}})}
function flash(o={}){const {t=0,d=260,col='255,255,255',a=1}=o;add({top:1,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;c.fillStyle=`rgba(${col},${a*(1-k)})`;c.fillRect(-30,-30,W+60,H+60)}})}
function darken(o={}){const {t=0,d=2400,a=.5,inD=300,outD=400}=o;ext(t+d);add({under:1,draw(tt){const e=tt-t;if(e<0||e>d)return;dim=Math.max(dim,a*Math.min(1,e/inD,(d-e)/outD))}})}
/* 画面ぜんたいを うすく 色づけて もどす（炎なら 赤、水なら 青） */
function tint(o={}){const {t=0,d=1400,col='255,60,30',a=.22,inD=250,outD=600}=o;ext(t+d);add({draw(tt){const e=tt-t;if(e<0||e>d)return;c.fillStyle=`rgba(${col},${a*Math.min(1,e/inD,(d-e)/outD)})`;c.fillRect(-30,-30,W+60,H+60)}})}
function shake(o={}){const {t=0,d=380,p=8}=o;add({pre:1,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;const q=p*(1-k);shX=(Math.random()-.5)*2*q;shY=(Math.random()-.5)*2*q;c.translate(shX,shY)}})}
function slam(str,x,y,o={}){let {t=0,d=1500,size=56,grad=['#fffbe0','#ffe066','#ffb31a','#ff7a00'],stroke='#3e1a06',from=3,sub=null}=o;d=readMs((sub||'')+str,d);ext(t+d);add({top:1,draw(tt){const k=seg(tt,t,260),e=tt-t;if(e<0||e>d)return;const out=1-seg(tt,t+d-300,300);const s=from-(from-1)*E.b(k);c.save();c.globalAlpha=Math.min(1,k*2)*out;c.translate(x,y);c.scale(s,s);c.font=`${size}px "Dela Gothic One"`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=size*.2;c.strokeStyle=stroke;c.shadowColor='rgba(0,0,0,.6)';c.shadowOffsetY=5;c.shadowBlur=4;c.strokeText(str,0,0);c.shadowColor='transparent';const g=c.createLinearGradient(0,-size/2,0,size/2);grad.forEach((col,i)=>g.addColorStop(i/(grad.length-1),col));c.fillStyle=g;c.fillText(str,0,0);
  /* キラッ */const sh=seg(tt,t+300,500);if(sh>0&&sh<1){c.globalCompositeOperation='source-atop';const w=c.measureText(str).width;const sx=-w/2-40+(w+80)*sh;const gg=c.createLinearGradient(sx-30,0,sx+30,0);gg.addColorStop(0,'rgba(255,255,255,0)');gg.addColorStop(.5,'rgba(255,255,255,.95)');gg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gg;c.fillText(str,0,0)}
  c.restore();if(sub){const ks=seg(tt,t+250,300);c.save();c.globalAlpha=ks*out;c.font='800 16px "M PLUS Rounded 1c"';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=6;c.strokeStyle=stroke;c.strokeText(sub,x,y+size*.75-8*(1-ks));c.fillStyle='#fff';c.fillText(sub,x,y+size*.75-8*(1-ks));c.restore()}}})}
function floatTxt(str,x,y,o={}){let {t=0,d=1100,col='#fff',size=22,stroke='#3e1a06',rise=46}=o;if(/[ぁ-んァ-ン一-龥]/.test(str)&&str.length>=3)d=Math.max(d,readMs(str,0)*.8);ext(t+d);add({top:1,draw(tt){const k=seg(tt,t,d);if(k<=0||k>=1)return;const pop=E.b(seg(tt,t,220));c.save();c.globalAlpha=1-seg(tt,t+d*.6,d*.4);c.translate(x,y-rise*E.o(k));c.scale(.4+.6*pop,.4+.6*pop);c.font=`900 ${size*1.2}px "M PLUS Rounded 1c"`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=6;c.strokeStyle=stroke;c.strokeText(str,0,0);c.fillStyle=col;c.fillText(str,0,0);c.restore()}})}
function icon(name,x,y,o={}){const {t=0,d=1200,sz=64,spin=0,bob=0,a=1}=o;add({top:1,draw(tt){const k=seg(tt,t,d),e=tt-t;if(e<0||e>d)return;const I=ui(name);if(!I.complete)return;const s=sz*1.35*E.b(seg(tt,t,300));c.save();c.globalAlpha=a*(1-seg(tt,t+d-250,250));c.translate(x,y+Math.sin(e/200)*bob);c.rotate(spin*e/1000);c.drawImage(I,-s/2,-s/2,s,s);c.restore()}})}
/* 投げる物：大きめ・ゆっくり・まわしすぎない（左右に ゆらゆら） */
function shot(from,to,o={}){let {t=0,d=260,im='x_bullet',sz=26,arc=0,trail='255,230,150',spin=0,onHit}=o;const thrown=im!=='x_bullet';sz*=o.scale||(thrown?2.6:1.8);arc*=1.3;let hit=false;ext(t+d);add({draw(tt){const k=seg(tt,t,d);if(k<=0)return;if(k>=1){if(!hit){hit=true;onHit&&onHit(tt)}return}const x=from.x+(to.x-from.x)*k,y=from.y+(to.y-from.y)*k-Math.sin(k*Math.PI)*arc;
  c.save();c.globalCompositeOperation='lighter';for(let i=1;i<6;i++){const kk=Math.max(0,k-i*.04);const tx=from.x+(to.x-from.x)*kk,ty=from.y+(to.y-from.y)*kk-Math.sin(kk*Math.PI)*arc;c.fillStyle=`rgba(${trail},${.35-i*.06})`;c.beginPath();c.arc(tx,ty,sz*.22*(1-i*.12),0,7);c.fill()}c.restore();
  const I=ui(im);if(I.complete){const a=Math.atan2(to.y-from.y,to.x-from.x);c.save();c.translate(x,y);c.rotate(thrown?Math.sin(tt/180)*.17+(o.tilt||0):a);const ar=I.naturalHeight/I.naturalWidth||1;if(o.filter)c.filter=o.filter;c.drawImage(I,-sz/2,-sz*ar/2,sz,sz*ar);c.restore()}}})}
/* 竜巻（立体っぽく）：すけた 輪を かさねて ねじれながら 回す。枯葉は うしろ→まえを くるくる 回る */
function tornado(x,y,o={}){const {t=0,d=2000,h=200,r0=10,r1=70,n=24,leaves=16,col='235,225,205'}=o;ext(t+d);const L=[];for(let i=0;i<leaves;i++)L.push({a:Math.random()*7,v:3+Math.random()*3,hh:Math.random(),sp:.25+Math.random()*.35,s:10+Math.random()*9,spin:(Math.random()-.5)*14,c:['#b8732e','#d99a3a','#8a5a24','#e0b04a','#6d8a2e'][i%5]});
  const leaf=(lx,ly,s,rot,c0,al)=>{c.save();c.globalAlpha=al;c.translate(lx,ly);c.rotate(rot);c.scale(1,Math.abs(Math.cos(rot*1.7))*.8+.2);c.fillStyle=c0;c.beginPath();c.moveTo(-s,0);c.quadraticCurveTo(0,-s*.7,s,0);c.quadraticCurveTo(0,s*.7,-s,0);c.fill();c.strokeStyle='rgba(60,30,10,.6)';c.lineWidth=1;c.beginPath();c.moveTo(-s,0);c.lineTo(s,0);c.stroke();c.restore()};
  const R=k=>r0+(r1-r0)*Math.pow(k,1.3);
  add({draw(tt){const e=tt-t;if(e<0||e>d)return;const grow=E.o(Math.min(1,e/350)),fade=Math.min(1,(d-e)/400);const H_=h*grow,time=e/1000;
    const sway=k=>Math.sin(time*3+k*3)*12*k;
    const leafPass=front=>{for(const p of L){const k=(p.hh+time*p.sp)%1;const a=p.a+time*p.v+k*4;const z=Math.sin(a);if((z>0)!==front)continue;const rr=R(k)*1.15*grow;const lx=x+Math.cos(a)*rr+sway(k),ly=y-k*H_+z*rr*.18;const sc=.75+.35*(z+1)/2;leaf(lx,ly,p.s*sc,time*p.spin,p.c,fade*(front?1:.55)*Math.min(1,k*6))}};
    leafPass(false);
    c.save();c.globalAlpha=fade;
    /* 足もとの 砂けむり */const g=c.createRadialGradient(x,y,2,x,y,r1*.9);g.addColorStop(0,`rgba(${col},.45)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.ellipse(x,y,r1*.9*grow,r1*.25*grow,0,0,7);c.fill();
    for(let i=0;i<n;i++){const k=i/(n-1);const rr=R(k)*grow;const cy=y-k*H_;const cx=x+sway(k);const ph=time*9+i*.7;
      /* うしろ半分（うすく） */c.strokeStyle=`rgba(${col},${.2+.14*k})`;c.lineWidth=3+6*k;c.beginPath();c.ellipse(cx,cy,rr,rr*.22,0,Math.PI+ph%0.6,Math.PI*2);c.stroke();
      /* まえ半分（すこし こく・すじ） */c.strokeStyle=`rgba(255,250,240,${.3+.25*k})`;c.lineWidth=2+4*k;c.beginPath();const a0=(ph%(Math.PI*2));c.ellipse(cx,cy,rr,rr*.22,0,a0*.15,Math.PI*.55+a0*.15);c.stroke()}
    /* 中の うず（すける） */const gg=c.createLinearGradient(0,y,0,y-H_);gg.addColorStop(0,`rgba(${col},.18)`);gg.addColorStop(1,`rgba(${col},.06)`);c.fillStyle=gg;c.beginPath();c.moveTo(x-r0,y);for(let i=0;i<=12;i++){const k=i/12;c.lineTo(x+sway(k)-R(k)*grow*.9,y-k*H_)}for(let i=12;i>=0;i--){const k=i/12;c.lineTo(x+sway(k)+R(k)*grow*.9,y-k*H_)}c.closePath();c.fill();
    c.restore();leafPass(true)}})}
/* バリアが ひびわれて くだけちる：ひび → パリン → かけらが とびちる */
function shatter(x,y,R,o={}){const {t=0,crack=380,col='127,231,255',hx=x,hy=y-R*.3}=o;ext(t+crack+1100);
  const C_=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2+Math.random()*.4;const pts=[[hx,hy]];let px=hx,py=hy;for(let j=0;j<4;j++){px+=Math.cos(a+(Math.random()-.5)*.8)*R*.32;py+=Math.sin(a+(Math.random()-.5)*.8)*R*.32;pts.push([px,py])}C_.push(pts)}
  const S_=[];const N=14;for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2;const rin=R*(.35+Math.random()*.3);S_.push({pts:[[Math.cos(a0)*rin,Math.sin(a0)*rin],[Math.cos(a0)*R,Math.sin(a0)*R],[Math.cos((a0+a1)/2)*R*1.04,Math.sin((a0+a1)/2)*R*1.04],[Math.cos(a1)*R,Math.sin(a1)*R],[Math.cos(a1)*rin,Math.sin(a1)*rin]],a:(a0+a1)/2,v:2.5+Math.random()*3,spin:(Math.random()-.5)*.25})}
  add({top:1,draw(tt){const e=tt-t;if(e<0)return;c.save();
    if(e<crack){const k=e/crack;c.strokeStyle=`rgba(${col},.9)`;c.lineWidth=3;c.fillStyle=`rgba(${col},.18)`;c.beginPath();c.arc(x,y,R,0,7);c.fill();c.stroke();
      c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=2;c.shadowColor=`rgba(${col},1)`;c.shadowBlur=6;for(const p of C_){const m=Math.min(p.length-1,Math.ceil(k*1.4*(p.length-1)));c.beginPath();c.moveTo(p[0][0],p[0][1]);for(let j=1;j<=m;j++)c.lineTo(p[j][0],p[j][1]);c.stroke()}
      if(e>crack*.75){const q=(Math.random()-.5)*3;c.translate(q,q)}}
    else{const ee=e-crack;if(ee<1100){if(ee<120){c.fillStyle=`rgba(255,255,255,${.7*(1-ee/120)})`;c.beginPath();c.arc(x,y,R*1.2,0,7);c.fill()}
      for(const p of S_){const f=ee/16.7;const d=p.v*f*(1-Math.min(1,f/90)*.4)+R*.05;const px=x+Math.cos(p.a)*d,py=y+Math.sin(p.a)*d+.05*f*f;c.save();c.globalAlpha=Math.max(0,1-ee/1100);c.translate(px,py);c.rotate(p.spin*f);c.translate(-Math.cos(p.a)*R*.7,-Math.sin(p.a)*R*.7);
        c.beginPath();p.pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();const g=c.createLinearGradient(-R,-R,R,R);g.addColorStop(0,'rgba(230,250,255,.75)');g.addColorStop(1,`rgba(${col},.35)`);c.fillStyle=g;c.fill();c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=1.5;c.stroke();c.restore()}}}
    c.restore()}})}
/* ===== 画像で つくる 演出 ===== */
/* 画像を 切りわけて くだく（バリアが われる）：となりあう かけらが ぴったり あう 分けかた */
function breakImg(name,x,y,size,o={}){const {t=0,life=1100,pow=1}=o;ext(t+life);const I=ui(name);const R=size/2;
  const W_=8,rings=[0,.42,.75,1.05];const V=rings.map((rr,j)=>Array.from({length:W_},(_,i)=>{const a=(i+(j%2?.5:0))/W_*Math.PI*2+(Math.random()-.5)*.35;const r=rr*R*(j?(.9+Math.random()*.2):0);return [Math.cos(a)*r,Math.sin(a)*r]}));
  const P_=[];for(let j=0;j<rings.length-1;j++)for(let i=0;i<W_;i++){const i2=(i+1)%W_;const pts=j===0?[[0,0],V[1][i],V[1][i2]]:[V[j][i],V[j+1][i],V[j+1][i2],V[j][i2]];const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;const a=Math.atan2(cy,cx);P_.push({pts,cx,cy,a,v:(2+Math.random()*3.5)*pow*(j?1:.6),spin:(Math.random()-.5)*.18,up:1+Math.random()*2})}
  add({top:1,draw(tt){const e=tt-t;if(e<0||e>life||!I.complete)return;const f=e/16.7;
    if(e<140){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.8*(1-e/140);c.drawImage(I,x-R*1.15,y-R*1.15,R*2.3,R*2.3);c.restore()}
    for(const p of P_){const d=p.v*f;const px=p.cx+Math.cos(p.a)*d,py=p.cy+Math.sin(p.a)*d-p.up*f+.09*f*f;c.save();c.globalAlpha=Math.max(0,1-Math.pow(e/life,1.6));c.translate(x+px,y+py);c.rotate(p.spin*f);c.translate(-p.cx,-p.cy);
      c.beginPath();p.pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.clip();c.drawImage(I,-R,-R,R*2,R*2);c.restore()}}})}
/* たつまき（画像）：くねくね ゆれながら 左から右へ 通りすぎる。落ち葉と 小石が まわりを ぐるぐる */
const LEAF=[[1,28,25,35],[43,0,24,33],[104,5,25,18],[0,75,62,58],[54,30,54,33]],PEB=[[132,36,18,17],[3,42,16,16],[130,13,12,13],[1,96,15,12]];
function tornadoImg(o={}){const {t=0,d=2600,y=H*.5,x0=-80,x1=W+80,h=220,n=18,alpha=.85}=o;ext(t+d);const TI=ui('x_tornado'),LI=ui('x_leaves'),DI=ui('x_dust');
  const D_=Array.from({length:n},(_,i)=>{const leaf=i%3!==2;const r=leaf?LEAF[i%LEAF.length]:PEB[i%PEB.length];return {leaf,r,k:.08+Math.random()*.85,a:Math.random()*7,v:4+Math.random()*3,sz:leaf?(22+Math.random()*14):(10+Math.random()*7),spin:(Math.random()-.5)*12,ph:Math.random()*7}});
  const st={x:x0};const cx=e=>x0+(x1-x0)*(e/d)+Math.sin(e/150)*14;
  const drawD=(e,front)=>{const X=cx(e);for(const p of D_){const a=p.a+e/1000*p.v;const z=Math.sin(a);if((z>0)!==front)continue;const k=(p.k+Math.sin(e/700+p.ph)*.05);const R_=h*(.12+.36*k);const dx=X+Math.cos(a)*R_+Math.sin(e/150+k*3)*10*k,dy=y-k*h+z*R_*.22;const sc=.7+.4*(z+1)/2;
      const I=p.leaf?LI:DI;if(!I.complete)continue;const [sx,sy,sw,sh]=p.r;const w=p.sz*sc,hh=w*sh/sw;c.save();c.globalAlpha=(front?1:.6)*fadeA(e);c.translate(dx,dy);c.rotate(e/1000*p.spin);c.drawImage(I,sx,sy,sw,sh,-w/2,-hh/2,w,hh);c.restore()}};
  const fadeA=e=>Math.min(1,e/250,(d-e)/300);
  add({draw(tt){const e=tt-t;if(e<0||e>d)return;st.x=cx(e);drawD(e,false);if(TI.complete){const X=cx(e);c.save();c.globalAlpha=alpha*fadeA(e);c.translate(X,y);c.rotate(Math.sin(e/210)*.07);c.scale(1+Math.sin(e/90)*.05,1+Math.cos(e/120)*.03);const w=h*TI.naturalWidth/TI.naturalHeight;
      /* 上のほうを すこし ずらして くねくね */const sl=6;for(let i=0;i<sl;i++){const k0=i/sl,k1=(i+1)/sl;const off=Math.sin(e/160+k0*2.4)*12*k0;const sy0=TI.naturalHeight*(1-k1),sh0=TI.naturalHeight/sl;c.drawImage(TI,0,sy0,TI.naturalWidth,sh0+1,-w/2+off,-h*k1,w,h/sl+1)}c.restore()}
    drawD(e,true);
    /* 足もとの 砂ぼこり */if(DI.complete&&Math.floor(e/90)%2===0){}}});
  return st}
/* おわったら 1回だけ さいごの 値に して はなす（あとの 動きを じゃましない） */
function tween(u,o){const {t=0,d=400,e=E.o,...props}=o;const from={};let done=false;ext(t+d);add({pre:1,draw(tt){if(done)return;const k=seg(tt,t,d);if(k<=0)return;for(const p in props){if(!(p in from))from[p]=u[p];u[p]=from[p]+(props[p]-from[p])*e(k)}if(k>=1)done=true}})}
function keyf(u,o){const {t=0,d=400,fn}=o;let done=false;ext(t+d);add({pre:1,draw(tt){if(done)return;const k=seg(tt,t,d);if(k<=0)return;if(k>=1){done=true;fn(u,1,tt);return}fn(u,k,tt)}})}
function overlay(u,o){const {t=0,d=2000,draw:dr}=o;add({draw(tt){const e=tt-t;if(e<0||e>d)return;const {x,y}=P(u);dr(x,y,u.r*u.sc,e,e/d)}})}
function play(builder,total=2600){const my=++run;fx=[];maxEnd=0;stage(builder.stage||{});builder.build&&builder.build();T0=performance.now();
  const loop=()=>{if(my!==run)return;const t=performance.now()-T0;frame(t);if(t<Math.max(total,maxEnd)+300)requestAnimationFrame(loop);else{dim=0;BW.document.getElementById('dim').style.opacity=0}};requestAnimationFrame(loop)}
function frame(t){c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);dim=0;shX=0;shY=0;for(const f of fx)if(f.once&&!f.done&&t>=f.t0){f.done=1;f.fn(t)}
  c.save();for(const f of fx)if(f.pre)f.draw(t);for(const f of fx)if(f.under)f.draw(t);
  for(const u of units)apply(u);apply(heroes.foe);apply(heroes.me);if(uc){const mc=c;c=uc;c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);for(const f of fx)if(f.low&&f.draw)f.draw(t);c=mc}const dm=BW.document.getElementById('dim');if(dm)dm.style.opacity=dim;
  for(const f of fx)if(f.draw&&!f.pre&&!f.under&&!f.top&&!f.low)f.draw(t);for(const f of fx)if(f.top)f.draw(t);c.restore()}
return {tint,breakImg,tornadoImg,shatter,tornado,init,play,place,bd:()=>bd,ext,readMs,measure,ring,rays,burst,dots,smoke,flash,darken,shake,slam,floatTxt,icon,shot,tween,keyf,overlay,at,P,E,seg,units:()=>units,heroes:()=>heroes,ctx:()=>c,dims:()=>({W,H}),ui,img}})();
