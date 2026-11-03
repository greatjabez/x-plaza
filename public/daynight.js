// Day/night mood cycle on Korea time (KST = UTC+9, from UTC so it is right for every visitor).
// ?hour=21 (or 21.5) forces the time for testing.
(function(G){
const qp=new URLSearchParams(location.search),FORCE=qp.has('hour')?+qp.get('hour'):null;
function kstHour(){if(FORCE!=null&&isFinite(FORCE))return((FORCE%24)+24)%24;const d=new Date(),m=(d.getUTCHours()*60+d.getUTCMinutes()+540)%1440;return m/60}
// keyframes: h, multiply tint (top,bottom), screen warm lift, lights 0..1, character lift
// mul colours are applied with 'multiply'; scr with 'screen' (adds glow/haze); a = strength
const K=[
 {h:0,   top:[70,82,150],  bot:[92,104,170], sa:0,  sc:[0,0,0],     L:1,  lift:.22},
 {h:4.6, top:[78,90,158],  bot:[100,110,175],sa:0,  sc:[0,0,0],     L:1,  lift:.22},
 {h:5.6, top:[120,120,190],bot:[200,150,170],sa:.10,sc:[255,170,150],L:.7, lift:.15}, // dawn: blue -> pink
 {h:6.6, top:[235,195,205],bot:[255,200,170],sa:.12,sc:[255,190,150],L:.15,lift:.05},
 {h:7.6, top:[255,228,222],bot:[255,225,200],sa:.10,sc:[255,200,170],L:0,  lift:0},   // morning golden-pink
 {h:9.4, top:[255,240,232],bot:[255,236,220],sa:.06,sc:[255,210,180],L:0,  lift:0},
 {h:10.3,top:[255,255,255],bot:[255,255,255],sa:0,  sc:[0,0,0],     L:0,  lift:0},   // midday: none
 {h:15.4,top:[255,255,255],bot:[255,255,255],sa:0,  sc:[0,0,0],     L:0,  lift:0},
 {h:16.3,top:[255,226,200],bot:[255,214,170],sa:.08,sc:[255,170,90], L:0,  lift:0},
 {h:17.4,top:[190,130,200],bot:[255,160,100],sa:.22,sc:[255,120,50], L:.2, lift:.05}, // sunset
 {h:18.3,top:[140,95,175],bot:[250,135,90],sa:.2,sc:[255,105,60], L:.8,lift:.1},
 {h:19.2,top:[95,92,165],  bot:[130,110,175],sa:.04,sc:[200,110,140],L:1,  lift:.2},  // into night
 {h:24,  top:[70,82,150],  bot:[92,104,170], sa:0,  sc:[0,0,0],     L:1,  lift:.22}];
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),sm=t=>t*t*(3-2*t);
function state(h){let i=0;while(i<K.length-2&&K[i+1].h<=h)i++;const a=K[i],b=K[i+1],t=sm(Math.min(1,Math.max(0,(h-a.h)/(b.h-a.h))));
 return{top:mix(a.top,b.top,t),bot:mix(a.bot,b.bot,t),sa:a.sa+(b.sa-a.sa)*t,sc:mix(a.sc,b.sc,t),L:a.L+(b.L-a.L)*t,lift:a.lift+(b.lift-a.lift)*t}}
function phase(h){return h>=5&&h<7?['🌅','새벽']:h>=7&&h<10?['🌤️','아침']:h>=10&&h<16?['☀️','점심']:h>=16&&h<19?['🌇','저녁']:['🌙','밤']}
let S0=null,lastCalc=0,H=0;
function cur(){const n=Date.now();if(!S0||n-lastCalc>60000){lastCalc=n;H=kstHour();S0=state(H)}return S0}
// light sprites (pre-rendered, additive): crisp warm core + small soft halo
function spr(r,core,col){const c=document.createElement('canvas'),R=Math.ceil(r);c.width=c.height=R*2;const g=c.getContext('2d'),gr=g.createRadialGradient(R,R,0,R,R,R);
 gr.addColorStop(0,`rgba(255,250,225,1)`);gr.addColorStop(core,`rgba(${col},.95)`);gr.addColorStop(core*1.8,`rgba(${col},.35)`);gr.addColorStop(.6,`rgba(${col},.12)`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.fillRect(0,0,R*2,R*2);return c}
const SPR={};function sp(k){if(!SPR[k])SPR[k]={lamp:()=>spr(18,.14,'255,190,100'),bulb:()=>spr(8,.22,'255,205,120'),fire:()=>spr(46,.1,'255,150,60'),door:()=>{const c=document.createElement('canvas');c.width=120;c.height=90;const g=c.getContext('2d');g.translate(60,45);g.scale(1,.75);const gr=g.createRadialGradient(0,0,0,0,0,60);gr.addColorStop(0,'rgba(255,190,110,.55)');gr.addColorStop(.5,'rgba(255,170,90,.22)');gr.addColorStop(1,'rgba(255,160,80,0)');g.fillStyle=gr;g.fillRect(-60,-60,120,120);return c},fly:()=>spr(4,.25,'215,255,140'),char:()=>spr(26,.05,'255,235,200')}[k]();return SPR[k]}
let lights=null,flies=[];
function build(B){lights=[];const seen=new Set(),add=(k,x,y)=>{const key=k+(x|0)+','+(y|0);if(!seen.has(key)){seen.add(key);lights.push({k,x,y,p:(x*7+y*3)%6.28})}};
 const cfr=B.anims.find(a=>a.k=='cfire'),bulbs=[];
 for(const a of B.anims){if(a.k=='glow'){const isBulb=cfr&&Math.hypot(a.x-cfr.x,a.y-cfr.y)<150&&!B.objs.some(o=>o.k=='lamp'&&Math.abs(o.x+o.w/2-a.x)<o.w&&Math.abs(o.y+o.h*.38-a.y)<14);add(isBulb?'bulb':'lamp',a.x,a.y)}
  else if(a.k=='cfire'||a.k=='fire')add('fire',a.x,a.y)}
 for(const o of B.objs){if(o.k=='lantern'){add('lamp',o.x+o.w/2,o.y+o.h*.36)}
  if(o.k=='temple'){const s=o.scale||1;// glowing doorway/inner windows between columns
   add('door',o.x+o.w*.5,o.y+o.h*.55)}}
 // two lamp posts painted into the plaza artwork (plaza.png px 283/741, 372)
 const P=B.pzRef;if(P)[[283,372],[741,372]].forEach(([u,v])=>add('lamp',P.ox+u*P.s,P.oy+v*P.s));
 for(let i=0;i<70;i++){flies.push({x:Math.random()*B.W,y:Math.random()*B.H,p:Math.random()*99,s:.3+Math.random()*.5})}}
// world-space pass (ctx already scaled to world px, camera at cam)
function draw(ctx,B,cam,vw,vh,now,ps,elev,MM){const st=cur();if(!lights){B.pzRef=MM&&MM.pz;build(B)}
 const tint=st.top.some(v=>v<254.5)||st.bot.some(v=>v<254.5);
 if(tint){ctx.save();ctx.globalCompositeOperation='multiply';const g=ctx.createLinearGradient(0,0,0,vh);g.addColorStop(0,`rgb(${st.top.map(Math.round)})`);g.addColorStop(1,`rgb(${st.bot.map(Math.round)})`);ctx.fillStyle=g;ctx.fillRect(-2,-2,vw+4,vh+4);
  if(st.sa>.005){ctx.globalCompositeOperation='screen';const g2=ctx.createLinearGradient(0,vh,vw*.3,0);const c=st.sc.map(Math.round);g2.addColorStop(0,`rgba(${c},${st.sa})`);g2.addColorStop(1,`rgba(${c},${st.sa*.25})`);ctx.fillStyle=g2;ctx.fillRect(-2,-2,vw+4,vh+4);const rg=ctx.createRadialGradient(vw*.08,vh*1.05,0,vw*.08,vh*1.05,Math.max(vw,vh)*.9);rg.addColorStop(0,`rgba(${c},${Math.min(.5,st.sa*2.2)})`);rg.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=rg;ctx.fillRect(-2,-2,vw+4,vh+4)}
  // character lift: soft light around each player so they stay readable
  if(st.lift>.01&&ps){ctx.globalCompositeOperation='screen';ctx.globalAlpha=st.lift*1.6;const c=sp('char');for(const p of ps){const x=p.rx-cam.x,y=p.ry-elev(p)-cam.y-18;ctx.drawImage(c,x-c.width/2,y-c.height/2)}ctx.globalAlpha=1}
  ctx.restore()}
 if(st.L>.01){ctx.save();ctx.globalCompositeOperation='lighter';const m=60;
  for(const l of lights){const X=l.x-cam.x,Y=l.y-cam.y;if(X<-m||Y<-m||X>vw+m||Y>vh+m)continue;const c=sp(l.k);
   let a=st.L*(l.k=='door'?1:l.k=='fire'?.75+.25*Math.sin(now/90+l.p)*Math.sin(now/53):l.k=='bulb'?.85+.15*Math.sin(now/700+l.p):.92+.08*Math.sin(now/900+l.p));ctx.globalAlpha=Math.max(0,Math.min(1,a));
   ctx.drawImage(c,Math.round(X-c.width/2),Math.round(Y-c.height/2))}
  // fireflies (night only)
  const fa=Math.max(0,st.L-.5)*2;if(fa>0){const c=sp('fly');for(const f of flies){const X=f.x+Math.sin(now/1700*f.s+f.p)*14-cam.x,Y=f.y+Math.cos(now/2100*f.s+f.p*1.3)*9-cam.y;if(X<-10||Y<-10||X>vw+10||Y>vh+10)continue;ctx.globalAlpha=fa*(.35+.65*Math.max(0,Math.sin(now/600*f.s+f.p)));ctx.drawImage(c,X-4,Y-4)}}
  ctx.restore()}}
function label(){const h=cur()&&H,[e,n]=phase(h),hh=Math.floor(h),mm=Math.floor((h-hh)*60);return `${e} ${n} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} KST`}
G.DayNight={draw,label,kstHour,state,phase};
})(this);
