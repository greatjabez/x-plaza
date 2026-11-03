// Layered chibi character renderer: base body -> outfit -> hair -> hat, drawn as smooth vector at 3x then cached.
(function(G){const R=3,W=28,Hh=44,K='#4a3a46',CACHE=new Map();
const OUT={tunic:{main:'#a3dcc4',dk:'#7fc0a8',sl:'#a3dcc4',pants:'#a77a58',shoe:'#8a5b3e',boot:1,len:34,belt:'#8a5b3e'},
 dress:{main:'#cdb9ee',dk:'#ad98da',sl:'#cdb9ee',pants:null,shoe:'#6d4a5e',len:37,flare:3,collar:'#fffaf4'},
 rain:{main:'#f7d572',dk:'#e2b94e',sl:'#f7d572',pants:null,shoe:'#f2c95a',boot:1,len:37,flare:2,buttons:'#fff2c8'},
 overalls:{main:'#fff3dc',dk:'#e8d6b8',sl:'#fff3dc',pants:'#ec8f8f',shoe:'#8a5b3e',len:33,bib:'#ec8f8f'},
 knight:{main:'#84a6dc',dk:'#6587c2',sl:'#84a6dc',pants:'#5c5574',shoe:'#7a5038',boot:1,len:35,trim:'#f3d06e'}};
function sh(h,f){const n=parseInt(h.slice(1),16);const c=v=>Math.max(0,Math.min(255,v*f|0));return`rgb(${c(n>>16)},${c(n>>8&255)},${c(n&255)})`}
function blob(g,f,fill,lw=.8){g.beginPath();f(g);g.fillStyle=fill;g.fill();g.lineWidth=lw;g.strokeStyle=K;g.stroke()}
const ell=(x,y,rx,ry)=>g=>g.ellipse(x,y,rx,ry,0,0,7);
const rr=(x,y,w,h,r)=>g=>g.roundRect(x,y,w,h,r);
// view: F front, B back, S side (faces left)
function draw(g,look,view,P,blink){const I=XItems.ITEMS;const skin=I.skin[look[0]].c,hs=I.hair[look[1]].id,hc=I.hairColor[look[2]].c,o=OUT[I.outfit[look[3]].id],hat=I.hat[look[4]].id;
 const [ll,lr,bob,armS,str,lean,anim]=P;const side=view=='S',hy=bob,hx=lean,dk=sh(hc,.82),lt=sh(hc,1.1);
 // --- back hair layer
 const backHair=()=>{if(view=='B')return;if(hs=='wavy'){blob(g,g=>{g.moveTo(5+hx,15+hy);g.bezierCurveTo(3+hx,24+hy,6,30+hy,8,33+hy);g.lineTo(20,33+hy);g.bezierCurveTo(22,30+hy,25+hx,24+hy,23+hx,15+hy);g.closePath()},dk)}
  if(hs=='bob'&&!side)blob(g,rr(4.5+hx,12+hy,19,13,5),dk);if(hs=='bob'&&side)blob(g,rr(11+hx,11+hy,12,14,5),dk);
  if(hs=='pony'&&side)blob(g,g=>{g.moveTo(21+hx,11+hy);g.quadraticCurveTo(28,16+hy,24,27+hy);g.quadraticCurveTo(22,20+hy,19+hx,14+hy);g.closePath()},dk);
  if(hs=='buns'&&!side){blob(g,ell(5.5+hx,19+hy,2.2,4),dk);blob(g,ell(22.5+hx,19+hy,2.2,4),dk)}};
 // --- legs & shoes
 const legs=()=>{const pc=o.pants||skin,top=33+hy;const leg=(x,lift)=>{const bot=41-lift;blob(g,rr(x-2,top,4,bot-top+1,1.5),o.boot&&!o.pants?skin:pc,.7);if(o.boot)blob(g,rr(x-2.4,bot-3,4.8,4,1.5),o.shoe,.7);blob(g,ell(x+(side?-.8:0),bot+1,2.8,1.6),o.shoe,.7)};
  if(side){leg(14+str,str<0?ll:0);leg(14-str,str>0?ll:0)}else{leg(11,ll);leg(17,lr)}};
 // --- torso/outfit
 const torso=()=>{const t=24+hy,L=o.len+hy,fl=o.flare||0,x0=side?9.5:8,x1=side?18.5:20;
  blob(g,g=>{g.moveTo(x0+1+hx*.5,t);g.lineTo(x1-1+hx*.5,t);g.quadraticCurveTo(x1+.5,t+2,x1+fl,L);g.quadraticCurveTo(14,L+1.2,x0-fl,L);g.quadraticCurveTo(x0-.5,t+2,x0+1+hx*.5,t);g.closePath()},o.main);
  g.fillStyle=o.dk;g.fillRect(x0-fl+1,L-1.6,x1-x0+2*fl-2,1.2);
  if(o.belt){g.fillStyle=o.belt;g.fillRect(x0,31+hy,x1-x0,1.6);if(view=='F'){g.fillStyle='#f3d06e';g.fillRect(13,30.8+hy,2,2)}}
  if(o.collar&&view=='F'){blob(g,g=>{g.moveTo(10,24+hy);g.quadraticCurveTo(12,28+hy,14,25.5+hy);g.quadraticCurveTo(16,28+hy,18,24+hy);g.closePath()},o.collar,.6)}
  if(o.collar&&view=='B'){blob(g,rr(10,23.6+hy,8,2.2,1),o.collar,.6)}
  if(o.buttons&&view=='F'){g.fillStyle=o.buttons;[27,30,33].forEach(y=>{g.beginPath();g.arc(14,y+hy,.8,0,7);g.fill()})}
  if(o.bib){if(view!='B')blob(g,rr(side?11:10,27+hy,side?6:8,7,1.2),o.bib,.6);g.fillStyle=o.bib;if(!side){g.fillRect(10.3,24+hy,1.3,3.5);g.fillRect(16.4,24+hy,1.3,3.5)}else g.fillRect(14,24+hy,1.3,3.5);if(view=='F'){g.fillStyle='#fff3dc';g.fillRect(11,28+hy,1,1);g.fillRect(16,28+hy,1,1)}}
  if(o.trim){g.fillStyle=o.trim;if(view=='F'){g.fillRect(13.4,24+hy,1.2,L-t-1);[27,30].forEach(y=>{g.fillRect(11,y+hy,1.4,1.4);g.fillRect(15.8,y+hy,1.4,1.4)})}g.fillRect(x0,L-2.2,x1-x0,1)}};
 // --- arms
 const arm=(sx,sy,ex,ey)=>{g.lineCap='round';g.strokeStyle=K;g.lineWidth=4.4;g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke();g.strokeStyle=o.sl;g.lineWidth=2.9;g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.stroke();blob(g,ell(ex,ey,1.7,1.7),skin,.7)};
 const arms=(which)=>{const sy=25.5+hy,a=armS;const up=anim=='wave'||anim=='wave2'||anim=='wind',fw=anim=='fwd'||anim=='follow';
  if(side){if(which!='front')return;if(up)arm(14,sy,9,14+hy);else if(fw)arm(14,sy,6,28+hy);else arm(14,sy,14-a*1.5,32+hy);return}
  if(which=='L')arm(8.5,sy,7-(fw?1:0),31+hy+a*.6);
  if(which=='R'){if(up)arm(19.5,sy,23,(anim=='wave2'?13:15)+hy);else if(fw)arm(19.5,sy,24,27+hy);else arm(19.5,sy,21,31+hy-a*.6)}};
 // --- head & face
 const head=()=>{blob(g,ell(14+hx,15+hy,9.6,8.6),skin);if(view=='B')return;const ex=side?8.6+hx:0;
  if(side){g.fillStyle=K;if(blink)g.fillRect(ex-1,17+hy,2.4,.8);else{g.beginPath();g.ellipse(ex,17+hy,1.25,1.9,0,0,7);g.fill();g.fillStyle='#fff';g.fillRect(ex-.6,15.7+hy,.8,.8)}g.fillStyle='#d98c8c';g.fillRect(ex-1.6,21+hy,1.6,.7);blob(g,ell(16.5+hx,16+hy,1.4,1.9),skin,.6);return}
  [10.4,17.6].forEach(x=>{g.fillStyle=K;if(blink)g.fillRect(x-1.3,17+hy,2.6,.8);else{g.beginPath();g.ellipse(x+hx,17+hy,1.35,2,0,0,7);g.fill();g.fillStyle='#fff';g.fillRect(x-.8+hx,15.6+hy,.9,.9)}});
  g.strokeStyle='#b86a6a';g.lineWidth=.6;g.beginPath();g.arc(14+hx,20.3+hy,1,.3,2.8);g.stroke()};
 // --- front hair
 const hair=()=>{const cx=14+hx,cy=15+hy;
  if(view=='B'){blob(g,g=>{g.ellipse(cx,cy-.5,10,8.8,0,Math.PI,0);g.lineTo(cx+10,cy+3);g.quadraticCurveTo(cx,cy+(hs=='wavy'?18:hs=='bob'?10:hs=='spiky'?5:7),cx-10,cy+3);g.closePath()},hc);
   if(hs=='wavy')blob(g,g=>{g.moveTo(cx-9,cy+3);g.quadraticCurveTo(cx-10,cy+16,cx-5,cy+18);g.lineTo(cx+5,cy+18);g.quadraticCurveTo(cx+10,cy+16,cx+9,cy+3);g.closePath()},hc);
   if(hs=='pony')blob(g,g=>{g.moveTo(cx-2,cy+2);g.quadraticCurveTo(cx,cy+16,cx+2,cy+2);g.closePath()},dk);
   if(hs=='buns'){blob(g,ell(cx-7,cy-7,3.6,3.4),hc);blob(g,ell(cx+7,cy-7,3.6,3.4),hc)}
   if(hs=='spiky')for(let i=-2;i<=2;i++)blob(g,g=>{g.moveTo(cx+i*3.6-2.4,cy-6);g.lineTo(cx+i*3.6,cy-11.5+Math.abs(i));g.lineTo(cx+i*3.6+2.4,cy-6);g.closePath()},hc,.6);
   if(hs=='fluffy')[[-6,-6],[0,-8.5],[6,-6]].forEach(([a,b])=>blob(g,ell(cx+a,cy+b,4,3.2),hc,.6));
   return}
  if(side){blob(g,g=>{g.ellipse(cx+1,cy-.8,9.6,8.4,0,Math.PI*1.02,Math.PI*.12);g.quadraticCurveTo(cx+7,cy+8,cx+3,cy+5);g.quadraticCurveTo(cx-2,cy-2,cx-8,cy-1);g.closePath()},hc);
   if(hs=='fluffy')[[-6,-5],[0,-8],[6,-6],[8,1]].forEach(([a,b])=>blob(g,ell(cx+a,cy+b,3.8,3),hc,.6));
   if(hs=='spiky')[0,1,2,3].forEach(i=>blob(g,g=>{g.moveTo(cx-6+i*4,cy-6);g.lineTo(cx-4+i*4+1.5,cy-11.5+i*.6);g.lineTo(cx-2+i*4,cy-6);g.closePath()},hc,.6));
   if(hs=='buns')blob(g,ell(cx+3,cy-8,3.6,3.4),hc);
   if(hs=='wavy')blob(g,g=>{g.moveTo(cx+1,cy+2);g.quadraticCurveTo(cx+6,cy+12,cx+3,cy+17);g.quadraticCurveTo(cx+9,cy+15,cx+9,cy+2);g.closePath()},hc);
   if(hs=='pony')blob(g,ell(cx+7.5,cy-3,2,2),'#f4a9c6',.6);
   g.fillStyle=lt;g.fillRect(cx-2,cy-7,5,.9);return}
  // front
  blob(g,g=>{g.ellipse(cx,cy-.8,10,8.6,0,Math.PI*.95,Math.PI*.05);g.lineTo(cx+9.4,cy+(hs=='bob'||hs=='wavy'?9:hs=='buns'?6:3));g.quadraticCurveTo(cx+7.5,cy-1,cx+5,cy-2);
   if(hs=='spiky'){g.lineTo(cx+3,cy+.5);g.lineTo(cx+1.5,cy-2);g.lineTo(cx-.5,cy+1);g.lineTo(cx-2,cy-2);g.lineTo(cx-4,cy+.5);g.lineTo(cx-5,cy-2)}
   else if(hs=='fluffy'){g.quadraticCurveTo(cx+3.5,cy+2,cx+2,cy-1.5);g.quadraticCurveTo(cx,cy+2.2,cx-2,cy-1.5);g.quadraticCurveTo(cx-3.5,cy+2,cx-5,cy-2)}
   else if(hs=='bob'){g.lineTo(cx-5,cy-1.2)}
   else{g.quadraticCurveTo(cx,cy+1.5,cx-5,cy-2)}
   g.quadraticCurveTo(cx-7.5,cy-1,cx-9.4,cy+(hs=='bob'||hs=='wavy'?9:hs=='buns'?6:3));g.closePath()},hc);
  if(hs=='fluffy')[[-7,-5],[-1,-8.5],[5.5,-7],[8.5,-2],[-9,0]].forEach(([a,b])=>blob(g,ell(cx+a,cy+b,3.6,3),hc,.6));
  if(hs=='spiky')[-2,-1,0,1,2].forEach(i=>blob(g,g=>{g.moveTo(cx+i*3.8-2.6,cy-6.5);g.lineTo(cx+i*4.2,cy-12+Math.abs(i)*.8);g.lineTo(cx+i*3.8+2.6,cy-6.5);g.closePath()},hc,.6));
  if(hs=='buns'){blob(g,ell(cx-7.5,cy-7,3.6,3.4),hc);blob(g,ell(cx+7.5,cy-7,3.6,3.4),hc)}
  if(hs=='pony')blob(g,ell(cx+8,cy-4,2,2),'#f4a9c6',.6);
  if(hs=='wavy'){[-1,1].forEach(s=>blob(g,g=>{g.moveTo(cx+s*9.4,cy+2);g.quadraticCurveTo(cx+s*11.5,cy+10,cx+s*9,cy+15);g.quadraticCurveTo(cx+s*7.5,cy+9,cx+s*7.6,cy+2);g.closePath()},hc,.6))}
  g.fillStyle=lt;g.fillRect(cx-3,cy-7.2,6,.9)};
 const hatL=()=>{const cx=14+hx,cy=15+hy;if(hat=='straw'){blob(g,ell(cx,cy-5,13,3.6),'#f3dc9a');blob(g,g=>{g.ellipse(cx,cy-6,7,6,0,Math.PI,0);g.closePath()},'#f6e3a8');g.fillStyle='#e9a7a7';g.fillRect(cx-7,cy-7.5,14,1.6);if(view!='B'){blob(g,ell(cx+(side?-4:5),cy-7,2,2),'#f7b3cb',.5);g.fillStyle='#fff3a0';g.fillRect(cx+(side?-4.5:4.5),cy-7.5,1,1)}}
  if(hat=='beanie'){blob(g,g=>{g.ellipse(cx,cy-3.5,10.2,8.4,0,Math.PI,0);g.closePath()},'#a9c7a0');blob(g,rr(cx-10.4,cy-4.6,20.8,3.6,1.6),'#93b48a',.7);g.strokeStyle='rgba(70,90,60,.35)';g.lineWidth=.5;for(let x=-8;x<=8;x+=2.4){g.beginPath();g.moveTo(cx+x,cy-4.2);g.lineTo(cx+x,cy-1.4);g.stroke()}blob(g,ell(cx,cy-12.6,2.6,2.4),'#fff6ea',.6)}};
 backHair();
 if(view=='B'){legs();torso();arms('L');arms('R');head();hair();hatL();return}
 if(side){legs();torso();head();hair();hatL();arms('front');return}
 legs();torso();arms('L');arms('R');head();hair();hatL()}
function sprite(look,d,Pstr,blink){const key=look.join()+'|'+d+'|'+Pstr+(blink?'b':'');let c=CACHE.get(key);if(c)return c;if(CACHE.size>4000)CACHE.clear();
 c=document.createElement('canvas');c.width=W*R;c.height=Hh*R;const g=c.getContext('2d');const view=d==1?'B':(d==2||d==3)?'S':'F';
 const P=Pstr.split(',').map((v,i)=>i!=6?+v||0:v);if(d==3){g.translate(W*R,0);g.scale(-1,1)}g.scale(R,R);g.translate(0,1);g.lineJoin='round';
 draw(g,XItems.clean(look),view,P,blink);CACHE.set(key,c);return c}
G.XChar={sprite,W,H:Hh,R}})(this);
