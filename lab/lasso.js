/* ===== 11/01 なげなわ（キャンバス演出・作りなおし）=====
   かしまさん「ロープの動き・画像が変 → キャンバスで リアルに わくわく。背景も ふやす。つかまる…！？ つかまらない…！？ の どきどき。
   つかまえたら『つかまえた！』を すっごく わくわくに」
   ・ゲーム（CFX=1 の ビルド）と ずかん（lab/lasso.js ＝ この ファイルの コピー）で おなじ 絵を 描く
   ・LassoFX.draw(ctx,e,g,ok)：e ミリ秒めの 1コマを 描く（ロープ・輪・暗く・つぶ・集中線・文字）。ok＝つかまえた／にげられた（ゲームの 本当の 結果）
   ・LassoFX.foe(e,ok)／LassoFX.me(e)：親分の 顔・ウィピィの うごき（ずらし・かたむき・大きさ）
   ・LassoFX.cues(ok)：音の 予定（仮の 音。本物が 来たら さしかえ）
   じゅんばん（同時に 出さない）：暗く → 頭の上で 輪を ヒュンヒュン 3回 → 投げる → 輪が 親分の 上で ゆらゆら（つかまる…！？・心臓の 音）
     → つかまえた：輪が 落ちて ギュッ → グイッ → 「つかまえた！」（光・保安官の 星・紙ふぶき）
     → にげられた：輪が 頭に 当たって ひょいっと よけられ → スルッ… → ストン（土ぼこり）→「にげられた…」→ ふきだし */
(function(){
const LassoFX=window.LassoFX={};
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),seg=(e,a,d)=>cl((e-a)/d);
const Eo=t=>1-Math.pow(1-t,3),Ei=t=>t*t*t,Eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,Eb=t=>{const c=1.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const lerp=(a,b,k)=>a+(b-a)*k,rnd=(i,s=1)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)};
const FD='"Dela Gothic One","Hiragino Sans","Yu Gothic",sans-serif',FR='"M PLUS Rounded 1c","Hiragino Sans","Yu Gothic",sans-serif';
const PI=Math.PI;
/* ---- 時間（ミリ秒）---- */
const T={swing:300,throw_:1800,land:2450,hover:2650,drop:3950,
  okCinch:4200,okYank:4800,okYank2:5050,okWin:5450,okEnd:7700,
  ngDodge:4100,ngSlip:4250,ngFall:4650,ngLand:4900,ngText:5550,ngFade:5200,ngBub:6800,ngEnd:8100};
LassoFX.T=T;LassoFX.total=ok=>ok?T.okEnd:T.ngEnd;
const TAUNT=['へへーん、つかまらないよ〜！','あぶな〜い！ セーフ！','そんな なわ、きかないよ！'];
/* ---- 絵 ---- */
let IMGS={};
LassoFX.img=n=>{if(IMGS[n])return IMGS[n];const i=new Image();const p='ui/'+n+'.png';i.src=(window.FXD&&FXD[p])||p;IMGS[n]=i;return i};
const okImg=i=>i&&i.complete&&i.naturalWidth>0;

/* ---- 形の 計算 ---- */
function geo(g){const me=g.me,f=g.foe;
  const H={x:me.x+me.r*.55,y:me.y-me.r*.7};
  const C0={x:cl(me.x+me.r*.6+18,58,g.W-58),y:me.y-me.r-64};
  const C1={x:f.x,y:f.y-f.r*.62};
  return {H,C0,C1,R0:38,R1:f.r*1.38}}
/* 輪の 状態（中心・半径・かたむき・回転・ゆらぎ・結び目の 角度・親分の 体の まわり？）*/
function loopState(e,g,ok){const G=geo(g),f=g.foe;let C,R,tilt=.3,ang=0,wob=.02,hk=0,around=false,al=1,ground=false;
  if(e<T.throw_){/* 頭の上で ヒュンヒュン（だんだん はやく 3回）*/const u=seg(e,T.swing,T.throw_-T.swing),grow=Eo(seg(e,T.swing,260));
    C={x:G.C0.x,y:G.C0.y+(1-grow)*30};R=lerp(8,G.R0,grow)*(1+.05*Math.sin(e/70));const ph=2*PI*3*Math.pow(u,1.5);hk=ph+PI/2;wob=.035;tilt=.3+.04*Math.sin(ph)}
  else if(e<T.land){/* 投げる：弧を えがいて 親分の 上へ。輪は ひらきながら ±10度 ゆらゆら */const u=seg(e,T.throw_,T.land-T.throw_),k=Eo(u);
    C={x:lerp(G.C0.x,G.C1.x,k)+Math.sin(PI*k)*42*(G.C1.x<G.C0.x?-1:1),y:lerp(G.C0.y,G.C1.y,k)-Math.sin(PI*k)*70};R=lerp(G.R0,G.R1*.9,Eo(u));tilt=lerp(.3,.34,k);ang=Math.sin(u*PI*2)*.17;wob=.05*(1-u)+.02;hk=null}
  else if(e<T.drop){/* ゆらゆら（どきどき）*/const u=seg(e,T.land,T.drop-T.land),op=Eb(seg(e,T.land,260));
    C={x:G.C1.x+Math.sin(e/170)*7,y:G.C1.y+Math.sin(e/230)*4+u*8};R=lerp(G.R1*.9,G.R1,op)*(1+.035*Math.sin(e/95));tilt=.34+.03*Math.sin(e/260);ang=Math.sin(e/300)*.12;wob=.03;hk=null}
  else if(ok){const Cd={x:f.x,y:f.y+f.r*.22};
    if(e<T.okCinch){const k=Ei(seg(e,T.drop,T.okCinch-T.drop));C={x:lerp(G.C1.x,Cd.x,k),y:lerp(G.C1.y,Cd.y,k)};R=lerp(G.R1,f.r*1.28,k);tilt=.34;ang=Math.sin(e/300)*.12*(1-k);around=k>.35}
    else{const k=seg(e,T.okCinch,220);C=Cd;R=lerp(f.r*1.28,f.r*1.02,Eb(k));tilt=lerp(.34,.3,k);around=true;wob=.012*(1-k)}
    hk=null;if(e>T.okEnd-420)al=1-seg(e,T.okEnd-420,400)}
  else{/* にげられた（輪と ロープは 文字の 前に 消す）：頭に ななめに 当たる → かたむいて スルッ → 地面に ストン */const Ch={x:f.x+f.r*.5,y:f.y-f.r*.5},Cs={x:f.x+f.r*1.35,y:f.y+f.r*.35},Cg={x:Math.min(g.W-50,f.x+f.r*1.5),y:f.y+f.r+70};
    if(e<T.ngSlip){const k=Ei(seg(e,T.drop,T.ngSlip-T.drop));C={x:lerp(G.C1.x,Ch.x,k),y:lerp(G.C1.y,Ch.y,k)};R=G.R1;tilt=.34;ang=.12*k}
    else if(e<T.ngFall){const k=Eio(seg(e,T.ngSlip,T.ngFall-T.ngSlip));C={x:lerp(Ch.x,Cs.x,k),y:lerp(Ch.y,Cs.y,k)};R=lerp(G.R1,G.R1*.9,k);tilt=lerp(.34,.85,k);ang=lerp(.12,1.05,k)}
    else{const k=seg(e,T.ngFall,T.ngLand-T.ngFall),b=e>T.ngLand?Math.abs(Math.sin(seg(e,T.ngLand,260)*PI))*10*(1-seg(e,T.ngLand,260)):0;
      C={x:lerp(Cs.x,Cg.x,k),y:lerp(Cs.y,Cg.y,k*k)-b};R=G.R1*.9;tilt=lerp(.85,.2,Eo(k));ang=lerp(1.05,0,Eo(k));ground=e>=T.ngLand}
    hk=null;if(e>T.ngFade)al=1-seg(e,T.ngFade,300)}
  return {C,R,tilt,ang,wob,hk,around,al,ground}}
function loopPts(s,e,n=60){const P=[],ca=Math.cos(s.ang),sa=Math.sin(s.ang);for(let i=0;i<=n;i++){const th=i/n*2*PI,rr=s.R*(1+s.wob*Math.sin(3*th+e/110)+s.wob*.6*Math.sin(5*th-e/80));const x=rr*Math.cos(th),y=rr*Math.sin(th)*s.tilt;P.push({x:s.C.x+x*ca-y*sa,y:s.C.y+x*sa+y*ca,back:Math.sin(th)<-.02,th})}return P}
/* 結び目の 場所（輪の うち 手に いちばん 近い ところ。ヒュンヒュンの ときは まわる）*/
function knot(s,H,e){let th;if(s.hk!=null)th=s.hk;else{const ca=Math.cos(-s.ang),sa=Math.sin(-s.ang),dx=H.x-s.C.x,dy=H.y-s.C.y;th=Math.atan2((dx*sa+dy*ca)/Math.max(.15,s.tilt),dx*ca-dy*sa)}
  const rr=s.R,x=rr*Math.cos(th),y=rr*Math.sin(th)*s.tilt,ca=Math.cos(s.ang),sa=Math.sin(s.ang);return {x:s.C.x+x*ca-y*sa,y:s.C.y+x*sa+y*ca,th}}

/* ---- ロープを 描く（かげ・ふち・ねじれ・つや）---- */
function rope(c,P,w,al=1,shadow=true){if(P.length<2||al<=0)return;c.save();c.globalAlpha*=al;c.lineCap='round';c.lineJoin='round';
  const path=(dx=0,dy=0)=>{c.beginPath();c.moveTo(P[0].x+dx,P[0].y+dy);for(let i=1;i<P.length;i++)c.lineTo(P[i].x+dx,P[i].y+dy)};
  if(shadow){path(3,6);c.strokeStyle='rgba(0,0,0,.28)';c.lineWidth=w+1;c.stroke()}
  path();c.strokeStyle='#3a1f0a';c.lineWidth=w+3;c.stroke();
  path();c.strokeStyle='#c4904f';c.lineWidth=w;c.stroke();
  c.setLineDash([w*.6,w*.8]);path();c.strokeStyle='#7c4a20';c.lineWidth=w*.78;c.stroke();c.setLineDash([]);
  path(-.5,-.9);c.strokeStyle='rgba(255,236,190,.6)';c.lineWidth=Math.max(1,w*.24);c.stroke();c.restore()}
/* 手から 結び目までの ロープ（まがり・たるみ・波）*/
function spoke(A,B,bend,sag,wave,e,n=30){const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,P=[];
  for(let i=0;i<=n;i++){const s=i/n,b=4*s*(1-s);let x=A.x+dx*s+nx*bend*b,y=A.y+dy*s+ny*bend*b+sag*b;if(wave&&wave.a){const w=wave.a*Math.sin(s*PI*wave.k-e*wave.f)*Math.sin(PI*s);x+=nx*w;y+=ny*w}P.push({x,y})}return P}
function runs(P,keep){const out=[];let cur=[];for(const p of P){if(keep(p))cur.push(p);else{if(cur.length>1)out.push(cur);cur=[]}}if(cur.length>1)out.push(cur);return out}

/* ---- 文字 ---- */
function txt(c,s,x,y,o){const {size=40,cols=['#fff'],stroke='#2a1404',sw=size*.2,sc=1,rot=0,a=1,font=FD,glow=null}=o;if(a<=0||sc<=0)return;c.save();c.globalAlpha=cl(a);c.translate(x,y);c.rotate(rot);c.scale(sc,sc);
  c.font=`${size}px ${font}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';if(glow){c.shadowColor=glow;c.shadowBlur=size*.6}c.lineWidth=sw;c.strokeStyle=stroke;c.strokeText(s,0,0);c.shadowBlur=0;
  const gr=c.createLinearGradient(0,-size*.5,0,size*.5);cols.forEach((q,i)=>gr.addColorStop(cols.length>1?i/(cols.length-1):0,q));c.fillStyle=gr;c.fillText(s,0,0);c.restore()}
function bubble(c,s,x,y,tx,ty,a,sc){if(a<=0)return;c.save();c.globalAlpha=a;c.font=`800 16px ${FR}`;const w=Math.min(300,c.measureText(s).width+28),h=40;c.translate(x,y);c.scale(sc,sc);
  c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.roundRect?c.roundRect(-w/2+3,-h/2+4,w,h,18):c.rect(-w/2+3,-h/2+4,w,h);c.fill();
  c.fillStyle='#fff';c.strokeStyle='#3a2410';c.lineWidth=3;c.beginPath();c.roundRect?c.roundRect(-w/2,-h/2,w,h,18):c.rect(-w/2,-h/2,w,h);c.fill();c.stroke();
  const ax=cl((tx-x)/sc,-w/2+22,w/2-22);c.beginPath();c.moveTo(ax-9,-h/2+1);c.lineTo((tx-x)/sc*.5+ax*.5,(ty-y)/sc*.6);c.lineTo(ax+9,-h/2+1);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';c.fillRect(ax-8,-h/2+1,16,4);
  c.fillStyle='#3a2410';c.textAlign='center';c.textBaseline='middle';c.fillText(s,0,1);c.restore()}

/* ---- 1コマ ---- */
LassoFX.draw=function(c,e,g,ok){const W=g.W,H_=g.H,f=g.foe,me=g.me,G=geo(g),END=LassoFX.total(ok);if(e<0||e>END)return;const img=g.img||LassoFX.img;
  c.save();
  /* 1) 暗く（親分と ウィピィの まわりは スポットライト）*/
  let dim=.5*Eo(seg(e,0,300));if(e>T.land)dim+=.12*seg(e,T.land,400);if(ok&&e>T.okWin)dim-=.2*seg(e,T.okWin,300);if(!ok&&e>T.ngText)dim-=.1*seg(e,T.ngText,400);dim*=1-seg(e,END-400,400);
  if(dim>0){c.fillStyle=`rgba(18,8,2,${dim})`;c.fillRect(0,0,W,H_);c.save();c.globalCompositeOperation='destination-out';
    const hole=(x,y,r,a)=>{const gr=c.createRadialGradient(x,y,r*.35,x,y,r);gr.addColorStop(0,`rgba(0,0,0,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.beginPath();c.arc(x,y,r,0,7);c.fill()};
    hole(f.x,f.y,f.r*(e>T.land?2.1:2.6),.95);hole(me.x+14,me.y-40,me.r*4.2*(1-.5*seg(e,T.land,500)),.9);c.restore()}
  /* 2) 背景：ただよう 砂ぼこり（ずっと）*/
  c.save();c.globalCompositeOperation='lighter';const ma=Math.min(1,e/300)*(1-seg(e,END-400,400));
  for(let i=0;i<34;i++){const sp=.012+rnd(i,2)*.02,x=((rnd(i,1)*W+e*sp*W/300)%(W+20))-10,y=((rnd(i,3)*H_-e*(.006+rnd(i,4)*.01))%H_+H_)%H_,r=1.1+rnd(i,5)*2.4,tw=.5+.5*Math.sin(e/300+i);
    c.fillStyle=`rgba(255,214,150,${(.18+.3*tw)*ma})`;c.beginPath();c.arc(x,y,r,0,7);c.fill()}c.restore();
  /* 風の すじ（ヒュンヒュンと 投げる あいだ）*/
  const wa=seg(e,T.swing+200,400)*(1-seg(e,T.land-100,300));if(wa>0){c.save();c.lineCap='round';for(let i=0;i<9;i++){const y=H_*(.12+rnd(i,7)*.62),L=60+rnd(i,8)*120,sp=.5+rnd(i,9)*.6,x=((e*sp+rnd(i,6)*W*3)%(W+L*2))-L;
    const gr=c.createLinearGradient(x,y,x+L,y);gr.addColorStop(0,'rgba(255,240,210,0)');gr.addColorStop(1,`rgba(255,240,210,${.22*wa})`);c.strokeStyle=gr;c.lineWidth=1.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+L,y-L*.08);c.stroke()}c.restore()}
  /* 集中線（どきどきの あいだ。ちらちら）*/
  const za=seg(e,T.land,250)*(1-seg(e,T.drop+120,200));if(za>0){const fr=Math.floor(e/70),Rf=Math.hypot(W,H_);c.save();c.fillStyle=`rgba(255,250,235,${.3*za})`;
    for(let i=0;i<44;i++){const a=(i+rnd(i,fr)*.8)/44*2*PI,r0=f.r*1.75+rnd(i,fr+9)*60,wd=.006+rnd(i,fr+3)*.012;c.beginPath();c.moveTo(f.x+Math.cos(a)*r0,f.y+Math.sin(a)*r0);c.lineTo(f.x+Math.cos(a-wd)*Rf,f.y+Math.sin(a-wd)*Rf);c.lineTo(f.x+Math.cos(a+wd)*Rf,f.y+Math.sin(a+wd)*Rf);c.closePath();c.fill()}c.restore()}
  /* つかまえた：光の 放射（文字の うしろ）*/
  const ty=Math.min(H_*.5,f.y+f.r+86);
  if(ok&&e>T.okWin){const k=seg(e,T.okWin,300)*(1-seg(e,END-500,450));c.save();c.translate(W/2,ty);c.rotate(e/2400);c.globalCompositeOperation='lighter';const L=Math.max(W,H_)*.75;
    for(let i=0;i<16;i++){const a0=i/16*2*PI,gr=c.createRadialGradient(0,0,0,0,0,L);gr.addColorStop(0,`rgba(255,226,120,${.42*k*(i%2?.9:.5)})`);gr.addColorStop(1,'rgba(255,200,60,0)');c.fillStyle=gr;c.beginPath();c.moveTo(0,0);c.arc(0,0,L,a0,a0+PI/22);c.closePath();c.fill()}c.restore()}

  /* 3) ロープと 輪 */
  const s=loopState(e,g,ok),Hn={x:G.H.x+LassoFX.me(e).ox,y:G.H.y};const P=loopPts(s,e),K=knot(s,Hn,e);
  const inFoe=p=>Math.hypot(p.x-f.x,p.y-f.y)<f.r*.97;
  if(e>=T.swing){
    /* 手から 結び目まで */let sp;
    if(e<T.throw_){sp=spoke(Hn,K,12*Math.sin(s.hk||0),6,{a:4,k:2,f:.02},e,16)}
    else if(e<T.land){const u=seg(e,T.throw_,T.land-T.throw_);sp=spoke(Hn,K,-46*(1-u)*(G.C1.x<G.C0.x?-1:1),40*u,{a:22*(1-u)+5,k:3,f:.03},e)}
    else if(e<T.drop){sp=spoke(Hn,K,10*Math.sin(e/400),48+6*Math.sin(e/230),{a:4,k:2,f:.006},e)}
    else if(ok){const tw=e>T.okCinch?Math.sin((e-T.okCinch)/18)*12*Math.max(0,1-(e-T.okCinch)/450):0,tw2=e>T.okYank?Math.sin((e-T.okYank)/16)*7*Math.max(0,1-(e-T.okYank)/380):0;
      sp=spoke(Hn,K,tw+tw2,e<T.okCinch?lerp(48,12,seg(e,T.drop,T.okCinch-T.drop)):0,null,e)}
    else{const sag=e<T.ngSlip?40:e<T.ngLand?lerp(40,110,seg(e,T.ngSlip,T.ngLand-T.ngSlip)):110;sp=spoke(Hn,K,e<T.ngLand?18*Math.sin(e/90)*(1-seg(e,T.ngSlip,600)):0,sag,null,e)}
    const backFirst=(s.hk!=null&&Math.sin(s.hk)<0);
    const drawLoop=back=>{const keep=back?(p=>p.back&&!(s.around&&inFoe(p))):(p=>!p.back);runs(P,keep).forEach(r=>rope(c,r,back?4.2:5.2,s.al*(back?.82:1),!back&&!s.ground))};
    /* ヒュンヒュン：輪が まわる あとを うすく */
    if(e<T.throw_&&s.hk!=null){const u=seg(e,T.swing,T.throw_-T.swing);c.save();c.globalCompositeOperation='lighter';for(let j=1;j<10;j++){const th=s.hk-j*.12;const ca=Math.cos(s.ang),sa=Math.sin(s.ang),x=s.R*Math.cos(th),y=s.R*Math.sin(th)*s.tilt;c.fillStyle=`rgba(255,235,200,${.2*(1-j/10)*u})`;c.beginPath();c.arc(s.C.x+x*ca-y*sa,s.C.y+x*sa+y*ca,4,0,7);c.fill()}c.restore()}
    /* つかまえた！の ときは 手の ロープを 消して 文字を じゃましない */const spa=s.al*(ok&&e>T.okWin-150?1-seg(e,T.okWin-150,250):1);
    drawLoop(true);if(backFirst)rope(c,sp,5,spa);drawLoop(false);if(!backFirst)rope(c,sp,5,spa);
    /* 結び目 */c.save();c.globalAlpha=s.al;c.fillStyle='#3a1f0a';c.beginPath();c.ellipse(K.x,K.y,6,4.5,s.ang,0,7);c.fill();c.fillStyle='#b07a40';c.beginPath();c.ellipse(K.x-.5,K.y-.8,4.2,3,s.ang,0,7);c.fill();c.restore();
    /* 投げる あいだの スピード線 */
    if(e>T.throw_&&e<T.land+80){c.save();c.lineCap='round';for(let j=-1;j<=1;j++){c.beginPath();for(let q=0;q<=8;q++){const ee=e-q*16;if(ee<T.throw_)break;const st=loopState(ee,g,ok);const x=st.C.x+j*st.R*.55,y=st.C.y+j*4;q?c.lineTo(x,y):c.moveTo(x,y)}c.strokeStyle=`rgba(255,248,230,${.5*(1-seg(e,T.land-60,140))})`;c.lineWidth=2.2-Math.abs(j)*.6;c.stroke()}c.restore()}
  }
  /* 4) とびちる もの */
  const star=img('x_star'),spark=img('x_spark'),dust=img('x_dust');
  if(!ok&&e>T.ngLand&&e<T.ngLand+620){const k=seg(e,T.ngLand,620),Cg=s.C;for(let i=0;i<7;i++){const a=PI+(i/6)*PI*1.0+(rnd(i,11)-.5)*.3,d=(18+rnd(i,12)*30)*Eo(k),sz=(26+rnd(i,13)*18)*(.7+.5*k);
    if(okImg(dust)){c.save();c.globalAlpha=(1-k)*.85;c.drawImage(dust,Cg.x+Math.cos(a)*d*1.6-sz/2,Cg.y+Math.sin(a)*d*.5-sz*.7-k*8,sz,sz);c.restore()}}}
  if(ok&&e>T.okCinch&&e<T.okCinch+520){const k=seg(e,T.okCinch,520);c.save();c.globalCompositeOperation='lighter';for(let i=0;i<8;i++){const a=i/8*2*PI,d=f.r*(1.05+.5*Eo(k));c.strokeStyle=`rgba(255,240,200,${.7*(1-k)})`;c.lineWidth=3;c.beginPath();c.moveTo(f.x+Math.cos(a)*d,f.y+f.r*.22+Math.sin(a)*d*.4);c.lineTo(f.x+Math.cos(a)*(d+14),f.y+f.r*.22+Math.sin(a)*(d+14)*.4);c.stroke()}c.restore()}
  if(ok&&e>T.okWin){const e2=e-T.okWin,fa=1-seg(e,END-450,420);
    /* 保安官の 星（ゆらゆら ±10度）*/if(okImg(star))for(let i=0;i<12;i++){const a=-PI/2+(i/12-.5)*PI*1.9+(rnd(i,21)-.5)*.3,v=4.5+rnd(i,22)*3.5,ff=e2/16.7,dr=Math.pow(.955,ff),dist=v*(1-dr)/.045,x=W/2+Math.cos(a)*dist*1.15,y=ty+Math.sin(a)*dist*.8+.05*ff*ff*.35,sz=24+rnd(i,23)*20,l=1500+rnd(i,24)*700;if(e2>l)continue;
      c.save();c.globalAlpha=Math.min(1,(1-e2/l)*2.5)*fa;c.translate(x,y);c.rotate(Math.sin(e2/180+i)*.17);c.drawImage(star,-sz/2,-sz/2,sz,sz);c.restore()}
    /* 紙ふぶき（上から ひらひら）*/const CC=['#ff5a5a','#ffd23a','#4ad06a','#4aa8ff','#ff8ad8','#ffffff'];for(let i=0;i<44;i++){const st=rnd(i,31)*500;if(e2<st)continue;const tt=e2-st,x=rnd(i,32)*W+Math.sin(tt/260+i)*22,y=-20+tt*(.12+rnd(i,33)*.1),w=6+rnd(i,34)*5;if(y>H_*.8)continue;
      c.save();c.globalAlpha=fa*(1-cl((y-H_*.6)/(H_*.2)));c.translate(x,y);c.rotate(tt/200*(rnd(i,35)>.5?1:-1));c.scale(1,Math.abs(Math.cos(tt/150+i)));c.fillStyle=CC[i%CC.length];c.fillRect(-w/2,-w*.3,w,w*.6);c.restore()}
    /* キラッ（親分の まわり）*/if(okImg(spark)){c.save();c.globalCompositeOperation='lighter';for(let i=0;i<6;i++){const ph=((e2+i*230)%900)/900,a=i/6*2*PI+.4,x=f.x+Math.cos(a)*f.r*1.25,y=f.y+Math.sin(a)*f.r*1.05,sz=26*Math.sin(ph*PI);if(sz<=1)continue;c.globalAlpha=fa;c.drawImage(spark,x-sz/2,y-sz/2,sz,sz)}c.restore()}}
  /* 5) ピカッ */
  if(ok&&e>T.okWin&&e<T.okWin+300){c.fillStyle=`rgba(255,250,225,${.6*(1-seg(e,T.okWin,300))})`;c.fillRect(0,0,W,H_)}
  /* 6) 文字（いちばん 上）*/
  const topY=v=>Math.max(28,v);
  if(e>T.land+50&&e<T.drop){const a=seg(e,T.land+50,200)*(1-seg(e,T.drop-200,200)),beat=[2750,3250,3700].reduce((m,b)=>Math.max(m,Math.max(0,1-Math.abs(e-b)/120)),0);
    txt(c,'つかまる…！？',W/2,ty,{size:Math.min(36,W*.82/7),cols:['#ffffff','#ffe9a0'],sw:7,a,sc:(.9+.1*Eb(seg(e,T.land+50,260)))*(1+.08*beat),rot:Math.sin(e/90)*.02})}
  if(ok){
    if(e>T.okCinch&&e<T.okCinch+620){const k=seg(e,T.okCinch,620);txt(c,'ギュッ！',Math.min(W-40,f.x+f.r*1.15),topY(f.y-f.r*.3),{size:22,cols:['#fff','#ffd27a'],sw:5,a:Math.min(1,k*6)*(1-seg(k,.7,.3)),sc:.8+.2*Eb(Math.min(1,k*3)),rot:.18})}
    if(e>T.okYank&&e<T.okYank+600){const k=seg(e,T.okYank,600);txt(c,'グイッ！',Math.max(40,f.x-f.r*1.15),topY(f.y-f.r*.3),{size:22,cols:['#fff','#ffb070'],sw:5,a:Math.min(1,k*6)*(1-seg(k,.7,.3)),sc:.8+.2*Eb(Math.min(1,k*3)),rot:-.18})}
    if(e>T.okWin){const k=seg(e,T.okWin,380),fa=1-seg(e,END-450,420),sz=Math.min(60,W*.86/6);const pulse=1+.035*Math.sin((e-T.okWin)/140);
      txt(c,'つかまえた！',W/2,ty,{size:sz,cols:['#fffbe0','#ffe066','#ffb21e','#e86a00'],stroke:'#4a1e00',sw:sz*.24,a:Math.min(1,k*4)*fa,sc:lerp(2.3,1,Eb(k))*pulse,rot:-.04*(1-k),glow:'rgba(255,210,80,.9)'})}
  }else{
    if(e>T.ngSlip+30&&e<T.ngSlip+650){const k=seg(e,T.ngSlip+30,620);txt(c,'スルッ…',Math.max(44,f.x-f.r*1.1),topY(f.y-f.r*.35),{size:20,cols:['#ffffff','#a8d4ff'],stroke:'#14304f',sw:5,a:Math.min(1,k*6)*(1-seg(k,.7,.3)),rot:-.18})}
    if(e>T.ngLand&&e<T.ngLand+560){const k=seg(e,T.ngLand,560),Cg=s.C;txt(c,'ストン',Math.min(W-36,Cg.x+30),Cg.y-36,{size:17,cols:['#fff','#e0c8a8'],stroke:'#3a2410',sw:4,a:Math.min(1,k*6)*(1-seg(k,.7,.3)),rot:.18})}
    if(e>T.ngText&&e<T.ngText+1150){const k=seg(e,T.ngText,420),a=Math.min(1,k*4)*(1-seg(e,T.ngText+850,300)),sz=Math.min(42,W*.84/6);
      txt(c,'にげられた…',W/2,ty+6*seg(e,T.ngText+400,900),{size:sz,cols:['#ffffff','#b8dcff','#6f9fd6'],stroke:'#10233f',sw:sz*.22,a,sc:lerp(1.35,1,Eo(k)),rot:-.05*seg(e,T.ngText+400,900)})}
    if(e>T.ngBub){const k=seg(e,T.ngBub,240),a=Math.min(1,k*3)*(1-seg(e,END-420,400));const by=f.y+f.r+48,bx=cl(f.x,120,W-120);bubble(c,TAUNT[g.tauntI||0],bx,by,f.x-f.r*.2,f.y+f.r*.95,a,.7+.3*Eb(k))}
  }
  c.restore()};
/* 親分の うごき */
LassoFX.foe=function(e,ok){const o={ox:0,oy:0,rot:0,sx:1,sy:1};
  if(e>T.land&&e<T.drop){const env=seg(e,T.land,500)*(1-seg(e,T.drop-80,80));o.ox=Math.sin(e/42)*3.2*env;o.rot=Math.sin(e/120)*.03*env}
  if(ok){if(e>T.okCinch){const k=seg(e,T.okCinch,300);o.sx=1-.09*Math.sin(k*PI);o.sy=1+.05*Math.sin(k*PI)}
    if(e>T.okYank){const y1=seg(e,T.okYank,420),y2=seg(e,T.okYank2,420);o.oy=16*Math.sin(Math.min(1,y1*2)*PI/2)*(1-.6*y1)+(e>T.okYank2?12*Math.sin(Math.min(1,y2*2)*PI/2)*(1-.5*y2):0);o.rot=-.06*Math.sin(y1*PI)}
    if(e>T.okWin){o.rot=Math.sin((e-T.okWin)/110)*.05*(1-seg(e,T.okWin,1200));const back=seg(e,T.okEnd-420,400);o.oy*=1-back}}
  else{if(e>T.ngDodge){const k=Eo(seg(e,T.ngDodge,180)),r=1-Eo(seg(e,T.ngLand,400));o.ox=-26*k*r;o.rot=-.15*k*r}
    if(e>T.ngLand+300&&e<T.ngText){const k=seg(e,T.ngLand+300,500);o.oy=-Math.abs(Math.sin(k*PI*2))*8*(1-k)}
    if(e>T.ngBub){const k=seg(e,T.ngBub,1200)*(1-seg(e,T.ngEnd-300,300));o.rot=Math.sin((e-T.ngBub)/95)*.08*k;o.oy=-Math.abs(Math.sin((e-T.ngBub)/190))*5*k}}
  return o};
/* ウィピィの うごき（輪を まわす・投げる）*/
LassoFX.me=function(e){const o={ox:0,oy:0,rot:0,sx:1,sy:1};
  if(e>T.swing&&e<T.throw_){const u=seg(e,T.swing,T.throw_-T.swing);o.rot=Math.sin(2*PI*3*Math.pow(u,1.5))*.07*Math.min(1,u*4)}
  if(e>=T.throw_-120&&e<T.throw_+400){const k=seg(e,T.throw_-120,520);o.rot=-.1*Math.sin(k*PI);o.oy=-6*Math.sin(k*PI);o.ox=4*Math.sin(k*PI)}
  return o};
/* 音の 予定（仮の 音：se2 に ある ファイル＋合成。fb＝se2 が ない ときの 前の 音）*/
LassoFX.cues=function(ok){const A=[
  {t:520,syn:'whoosh',dur:.3,v:.45},{t:1020,syn:'whoosh',dur:.26,v:.65},{t:1420,syn:'whoosh',dur:.22,v:.85},{t:1680,syn:'whoosh',dur:.18,v:1},
  {t:T.throw_,f:'game2/epic whoosh soft.wav',v:.9,maxd:.9,fb:'whoosh'},
  {t:2750,syn:'thump',v:1},{t:2900,syn:'thump',v:.7},{t:3250,syn:'thump',v:1},{t:3400,syn:'thump',v:.7},{t:3700,syn:'thump',v:1.1},{t:3820,syn:'thump',v:.8}];
  if(ok)A.push({t:T.drop,syn:'whoosh',dur:.25,v:.5},{t:T.okCinch,f:'game2/slingshot.wav',v:1,fb:'squish'},{t:T.okCinch+60,f:'game2/wooden door squeak open 2.wav',v:.5,maxd:.45},
    {t:T.okYank,f:'game2/badminton  racket whoosh 2.wav',v:.8,maxd:.5,fb:'whoosh'},{t:T.okYank2,f:'game2/badminton  racket whoosh 2.wav',v:.6,maxd:.5},
    {t:T.okWin,f:'match3/Rank Up.wav',v:1,fb:'win'},{t:T.okWin+150,f:'game2/star get 3.wav',v:.8,maxd:1.6},{t:T.okWin+250,syn:'cheer',v:1});
  else A.push({t:T.drop,syn:'whoosh',dur:.25,v:.5},{t:T.ngDodge,f:'fantasy/Avoid.wav',v:.9,fb:'whoosh'},{t:T.ngSlip+30,f:'cartoon/Cartoon Swoosh Jump 01.mp3',v:.7,maxd:.6},
    {t:T.ngLand,f:'fantasy/box_sound.wav',v:1,fb:'thud'},{t:T.ngText,f:'orchestral/Cartoon Orchestral Pack 1 2 Disappointment.mp3',v:.8,maxd:2.2,fb:'bad'},{t:T.ngBub,syn:'tease',v:1});
  return A};
/* 音を 鳴らす（さいごは フェードアウト）*/
LassoFX.buf=function(a,out,b,v=1,maxd){const s=a.createBufferSource(),g=a.createGain();s.buffer=b;const t=a.currentTime,L=Math.min(b.duration,maxd||99),fd=Math.min(.15,L*.3);g.gain.setValueAtTime(.9*v,t);g.gain.setValueAtTime(.9*v,t+Math.max(0,L-fd));g.gain.linearRampToValueAtTime(0,t+L);s.connect(g).connect(out);s.start(t);s.stop(t+L+.02)};
LassoFX.syn=function(n,a,out,o={}){const t=a.currentTime,v=o.v||1;
  const osc=(type,f0,f1,d,vol,at=0)=>{const q=a.createOscillator(),g=a.createGain();q.type=type;q.frequency.setValueAtTime(f0,t+at);if(f1)q.frequency.exponentialRampToValueAtTime(f1,t+at+d);g.gain.setValueAtTime(0,t+at);g.gain.linearRampToValueAtTime(vol,t+at+.012);g.gain.exponentialRampToValueAtTime(.0008,t+at+d);q.connect(g).connect(out);q.start(t+at);q.stop(t+at+d+.03)};
  if(n==='whoosh'){const d=o.dur||.3,N=Math.floor(a.sampleRate*d),bf=a.createBuffer(1,N,a.sampleRate),ch=bf.getChannelData(0);for(let i=0;i<N;i++)ch[i]=Math.random()*2-1;const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=bf;f.type='bandpass';f.Q.value=1.6;
    f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(2400,t+d*.55);f.frequency.exponentialRampToValueAtTime(800,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.45*v,t+d*.45);g.gain.linearRampToValueAtTime(0,t+d);s.connect(f).connect(g).connect(out);s.start(t);s.stop(t+d+.02)}
  else if(n==='thump'){/* 心臓の ドクン */osc('sine',78,42,.22,.5*v);osc('triangle',140,60,.08,.12*v)}
  else if(n==='cheer'){/* キラキラ（上がる 音）*/[1047,1319,1568,2093].forEach((f,i)=>osc('sine',f,0,.35,.06*v,i*.07))}
  else if(n==='tease'){/* べ〜っ（からかう）*/osc('triangle',520,360,.22,.07*v);osc('triangle',600,420,.3,.07*v,.24)}};

/* ===== ゲームへ つなぐ（ずかんでは なにもしない）===== */
if(typeof tryLasso!=='function'||typeof lassoFx!=='function')return;
lassoFx=async function(ok){const meE=$('meHero'),fh=$('foeHero');if(!meE||!fh)return;try{clearCoach&&clearCoach()}catch(e){}
  try{window.SE2&&SE2.decodeAll&&SE2.decodeAll()}catch(e){}
  const rc=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,r:Math.min(r.width,r.height)/2}};
  const g={W:innerWidth,H:innerHeight,me:rc(meE),foe:rc(fh),tauntI:Math.floor(Math.random()*TAUNT.length)};
  const cv=document.createElement('canvas');cv.id='lassocv';cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:86';document.body.appendChild(cv);
  const DPR=Math.min(2,devicePixelRatio||1);cv.width=g.W*DPR;cv.height=g.H*DPR;const c=cv.getContext('2d');
  const SP=()=>(typeof SPEED==='number'&&SPEED>0?SPEED:1);
  const cues=LassoFX.cues(ok).sort((a,b)=>a.t-b.t);let ci=0;
  const play=q=>{try{if(typeof MUTED!=='undefined'&&MUTED)return;const a=typeof ac==='function'&&ac();if(!a)return;const out=(typeof sfxOut==='function'&&sfxOut())||a.destination;
    if(q.syn)return LassoFX.syn(q.syn,a,out,q);const b=window.SE2&&SE2.buf&&SE2.buf[q.f];if(b)return LassoFX.buf(a,out,b,q.v,q.maxd);if(q.fb&&typeof SFX!=='undefined'&&SFX[q.fb])SFX[q.fb]()}catch(e){}};
  const setT=(el,o)=>{el.style.translate=(o.ox||o.oy)?`${o.ox.toFixed(1)}px ${o.oy.toFixed(1)}px`:'';el.style.rotate=o.rot?`${o.rot.toFixed(4)}rad`:'';el.style.scale=(o.sx!==1||o.sy!==1)?`${o.sx.toFixed(3)} ${o.sy.toFixed(3)}`:''};
  const END=LassoFX.total(ok),t0=performance.now();
  await new Promise(res=>{const step=()=>{const e=(performance.now()-t0)/SP();
      while(ci<cues.length&&cues[ci].t<=e){const q=cues[ci++];if(e-q.t<400)play(q)}
      c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,g.W,g.H);
      if(e>=END||!cv.isConnected){res();return}
      try{LassoFX.draw(c,e,g,ok);setT(fh,LassoFX.foe(e,ok));setT(meE,LassoFX.me(e))}catch(err){console.error(err);res();return}
      requestAnimationFrame(step)};requestAnimationFrame(step)});
  cv.remove();[fh,meE].forEach(el=>{el.style.translate='';el.style.rotate='';el.style.scale=''})};
})();
