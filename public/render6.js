// v6 storybook pastel renderer: prerenders ground + depth-sorted sprites from generated assets
(function(G){
const ASSETS=['tree_pink1','tree_pink2','tree_mint1','tree_mint2','topiary','fbush','fl_tulip','fl_daisy','fl_bluebell','fl_clover','toadstool','lilypad','rock','tuft','arch','well','lantern','bench_f','bench_s','sign','fence','campfire','log','fountain','tex_grass','tex_dirt','tex_water'];
function load(){return Promise.all(ASSETS.map(n=>new Promise(r=>{const i=new Image();i.onload=()=>r([n,i]);i.onerror=()=>r([n,null]);i.src='assets/'+n+'.png'}))).then(l=>Object.fromEntries(l))}
function C(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';return[c,g]}
function H(x,y,s){let h=(x*374761393+y*668265263+s*982451653)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function bake(M,I){const T=M.T,W=M.MW*T,Hh=M.MH*T;const cache={};
 // scaled sprite by height (or width), cached; returns {c,w,h}
 const spr=(n,size,byW,flip,rot)=>{const k=n+size+(byW?'w':'h')+(flip?'f':'')+(rot?'r':'');if(cache[k])return cache[k];const im=I[n];if(!im)return null;
  let w=byW?size:im.width*size/im.height,h=byW?im.height*size/im.width:size;const[c,g]=rot?C(h,w):C(w,h);
  if(rot){g.translate(h,0);g.rotate(Math.PI/2)}if(flip){g.translate(w,0);g.scale(-1,1)}
  // progressive downscale for quality
  let src=im,sw=im.width,sh=im.height;while(sw/2>w*1.2){const[t,tg]=C(sw/2,sh/2);tg.drawImage(src,0,0,sw/2,sh/2);src=t;sw/=2;sh/=2}
  g.drawImage(src,0,0,w,h);return cache[k]={c,w:c.width,h:c.height}};
 const pat=(g,n,size)=>{const im=I[n];const[c,cg]=C(size,size);cg.drawImage(im,0,0,size,size);return g.createPattern(c,'repeat')};
 const[gc,gg]=C(W,Hh);
 // grass base + soft tonal blobs
 gg.fillStyle=pat(gg,'tex_grass',128);gg.fillRect(0,0,W,Hh);
 for(let n=0;n<90;n++){const x=H(n,1,7)*W,y=H(n,2,7)*Hh,r=60+H(n,3,7)*140;const gr=gg.createRadialGradient(x,y,0,x,y,r);const c=H(n,4,7)<.5?'255,250,220':'120,160,110';gr.addColorStop(0,`rgba(${c},.13)`);gr.addColorStop(1,`rgba(${c},0)`);gg.fillStyle=gr;gg.fillRect(x-r,y-r,2*r,2*r)}
 // forest edges a touch deeper
 {const gr=[[0,0,W,0,0,90],[0,Hh,W,Hh,0,-90]];gg.fillStyle='rgba(90,140,100,.10)';gg.fillRect(0,0,W,90);gg.fillRect(0,Hh-90,W,90);gg.fillRect(0,0,90,Hh);gg.fillRect(W-90,0,90,Hh)}
 const strokeP=(g,pts,w)=>{g.lineWidth=w*T;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0]*T,p[1]*T):g.moveTo(p[0]*T,p[1]*T));g.stroke()};
 const masked=(drawMask,fill,blur)=>{const[c,g]=C(W,Hh);if(blur)g.filter=`blur(${blur}px)`;g.strokeStyle=g.fillStyle='#000';drawMask(g);g.filter='none';g.globalCompositeOperation='source-in';g.fillStyle=fill;g.fillRect(0,0,W,Hh);return c};
 const pathMask=g=>{M.paths.forEach(p=>strokeP(g,p.pts,p.w));g.beginPath();g.arc(M.plaza.cx*T,M.plaza.cy*T,M.plaza.r*T,0,7);g.fill()};
 // dirt: soft rim then textured fill
 gg.drawImage(masked(g=>{M.paths.forEach(p=>strokeP(g,p.pts,p.w+.35));g.beginPath();g.arc(M.plaza.cx*T,M.plaza.cy*T,(M.plaza.r+.2)*T,0,7);g.fill()},'rgba(214,160,120,.55)',2.5),0,0);
 gg.drawImage(masked(pathMask,pat(gg,'tex_dirt',160),1.2),0,0);
 // little grass islands inside plaza ring edge are skipped for calm look
 // river: bank, water
 gg.drawImage(masked(g=>strokeP(g,M.river.pts,M.river.w+1.1),'#c99a76',1),0,0);
 gg.drawImage(masked(g=>strokeP(g,M.river.pts,M.river.w+.55),'#e3bf98',1),0,0);
 gg.drawImage(masked(g=>strokeP(g,M.river.pts,M.river.w),pat(gg,'tex_water',96),1),0,0);
 gg.drawImage(masked(g=>strokeP(g,M.river.pts,M.river.w-1.4),'rgba(120,200,200,.25)',6),0,0);
 const W_=(x,y)=>M.ground[Math.floor(y/T)*M.MW+Math.floor(x/T)]==3;
 // lily pads
 for(let n=0,c=0;n<4000&&c<70;n++){const x=H(n,5,41)*W,y=H(n,6,41)*Hh;if(!W_(x,y)||!W_(x+14,y)||!W_(x-14,y)||!W_(x,y+12)||!W_(x,y-12))continue;const s=spr('lilypad',12+H(n,7,1)*8,true,H(n,8,1)<.5);gg.globalAlpha=.95;gg.drawImage(s.c,x-s.w/2,y-s.h/2);gg.globalAlpha=1;c++}
 // bridges: curved stone+wood footbridges
 M.bridges.forEach(b=>{gg.save();gg.translate(b.x*T,b.y*T);gg.rotate(b.ang);const L=b.len*T,Wd=b.wid*T;
  gg.fillStyle='rgba(60,90,90,.25)';gg.beginPath();gg.ellipse(2,Wd/2+3,L/2,4,0,0,7);gg.fill();
  gg.fillStyle='#b98a5e';gg.beginPath();gg.roundRect(-L/2,-Wd/2,L,Wd,6);gg.fill();
  for(let u=-L/2+3;u<L/2-2;u+=6){gg.fillStyle=((u/6|0)%2)?'#d7a874':'#cf9d69';gg.fillRect(u,-Wd/2+4,5,Wd-8);gg.fillStyle='rgba(255,240,210,.35)';gg.fillRect(u,-Wd/2+4,5,1.5)}
  [[-1],[1]].forEach(([s])=>{gg.fillStyle='#e9d6c4';gg.beginPath();gg.roundRect(-L/2,s*Wd/2-(s>0?5:0),L,5,3);gg.fill();gg.fillStyle='#f7ece0';gg.fillRect(-L/2+2,s*Wd/2-(s>0?5:0)+1,L-4,1.5);
   [-L/2,L/2-8].forEach(x=>{gg.fillStyle='#dcc6b2';gg.beginPath();gg.roundRect(x,s*Wd/2-(s>0?8:-1)-1,8,8,2);gg.fill();gg.fillStyle='#f4e6d8';gg.fillRect(x+1,s*Wd/2-(s>0?8:-1),6,2)})});
  gg.restore()});
 // occupied tiles (for decor scattering)
 const occ=new Set();M.objects.forEach(o=>{for(let j=-1;j<=Math.ceil(o.h||1);j++)for(let i=-1;i<=Math.ceil(o.w||1);i++)occ.add((Math.floor(o.x)+i)+','+(Math.floor(o.y)+j))});
 const freeGrass=(tx,ty)=>tx>0&&ty>0&&tx<M.MW-1&&ty<M.MH-1&&M.ground[ty*M.MW+tx]==0&&!M.solid[ty*M.MW+tx]&&!occ.has(tx+','+ty);
 const FL=['fl_tulip','fl_daisy','fl_bluebell','fl_clover'];
 // scattered tiny flowers & tufts (flat)
 for(let n=0;n<2600;n++){const tx=Math.floor(H(n,11,3)*M.MW),ty=Math.floor(H(n,12,3)*M.MH);if(!freeGrass(tx,ty))continue;const e=Math.min(tx,ty,M.MW-tx,M.MH-ty);if(e<7&&H(n,9,3)<.7)continue;
  const k=H(n,13,3),s=k<.55?spr('tuft',7+H(n,14,3)*3):spr(FL[Math.floor(H(n,15,3)*4)],9+H(n,16,3)*3);gg.drawImage(s.c,tx*T+H(n,17,3)*10,ty*T+H(n,18,3)*8)}
 // flowerbeds -> flower clumps
 M.objects.forEach(o=>{if(o.k!='flowerbed')return;for(let i=0;i<3;i++){const s=spr(FL[(((o.v+i)%4)+4)%4],13+H(o.x,o.y,i)*3);gg.drawImage(s.c,o.x*T+i*10-2,o.y*T+H(o.x,o.y,i+5)*4)}});
 // objects
 const objs=[];let statue=null;const anims=[];
 const put=(s,bx,by,o)=>{if(!s)return;objs.push(Object.assign({img:s.c,x:Math.round(bx-s.w/2),y:Math.round(by-s.h),w:s.w,h:s.h,base:by,k:'',low:false},o||{}))};
 M.objects.forEach(o=>{const X=o.x*T,Y=o.y*T;
  switch(o.k){
   case 'tree':{const tx=o.x,ty=o.y,e=Math.min(tx,ty,M.MW-tx,M.MH-ty),r=H(tx,ty,21);const pink=e<7?r<.22:r<.5;const big=H(tx,ty,22)<.6;
    const n=pink?(big?'tree_pink1':'tree_pink2'):(big?'tree_mint1':'tree_mint2');const s=spr(n,(big?74:60)+H(tx,ty,23)*14,false,H(tx,ty,24)<.5);put(s,X+8+(o.jx||0),Y+15+(o.jy||0),{k:'tree'});break}
   case 'bush':put(spr(o.v%2?'fbush':'topiary',20+(o.v%3)*3),X+8,Y+15,{k:'bush'});break;
   case 'fountain':put(spr('fountain',o.w*T+10,true),X+o.w*T/2,Y+o.h*T+4,{k:'fountain'});break;
   case 'pfountain':put(spr('fountain',o.w*T+6,true),X+o.w*T/2,Y+o.h*T+2,{k:'fountain'});break;
   case 'statue':statue={x:X+o.w*T/2,base:Y+o.h*T};break;
   case 'well':put(spr('well',o.w*T+8,true),X+o.w*T/2,Y+o.h*T+2,{k:'well'});break;
   case 'plamp':case 'lamp':{const s=spr('lantern',o.k=='plamp'?40:34,false,(o.x+o.y)%2==0);put(s,X+8,Y+14,{k:'lamp'});anims.push({k:'glow',x:X+8+((o.x+o.y)%2==0?-1:1)*s.w*.28,y:Y+14-s.h*.62});break}
   case 'bench':put(spr('bench_f',30,true),X,Y+(o.v==1?3:o.v==0?-1:1),{k:'bench',low:true});break;
   case 'benchv':put(spr('bench_s',17,true,o.v==3),X,Y+2,{k:'bench',low:true});break;
   case 'log':put(spr('log',28,true),X,Y+(o.v==1?2:0),{k:'log',low:true});break;
   case 'logv':put(spr('log',28,true,false,true),X,Y+8,{k:'log',low:true});break;
   case 'campfire':put(spr('campfire',26,true),X+8,Y+14,{k:'campfire',low:true});anims.push({k:'glow',x:X+8,y:Y+6});break;
   case 'rock':put(spr('rock',12+(o.v%2)*3,true),X+8,Y+14,{k:'rock',low:true});break;
   case 'pot':put(spr('toadstool',16),X+8,Y+15,{k:'pot',low:true});break;
   case 'barrel':put(spr('rock',13,true),X+8,Y+14,{k:'rock',low:true});break;
   case 'sign':put(spr('tuft',10),X+8,Y+15,{low:true});break;
  }});
 // park hedges -> round topiary bushes
 (M.parks||[]).forEach(p=>(p.hedge||[]).forEach(([x,y],i)=>put(spr(i%4==0?'fbush':'topiary',19+H(x,y,3)*4),x*T+8,y*T+15,{k:'bush'})));
 // rose arches on a few radiating paths, signposts at forest-edge forks
 [4,5,6,7].forEach(pi=>{const p=M.paths[pi];if(!p)return;const k=Math.floor(p.pts.length*.42),a=p.pts[k],b=p.pts[k+1]||a;put(spr('arch',p.w*T+14,true),a[0]*T,a[1]*T+8,{k:'arch'})});
 [[12,14,1],[108,14,-1],[25,86,1],[95,86,-1]].forEach(([x,y,s])=>{const s_=spr('sign',26,false,s<0);put(s_,(x+s*2.4)*T,(y+1.6)*T,{k:'sign'})});
 // toadstool clusters near forest edge
 for(let n=0,c=0;n<3000&&c<40;n++){const tx=Math.floor(H(n,31,5)*M.MW),ty=Math.floor(H(n,32,5)*M.MH);const e=Math.min(tx,ty,M.MW-tx,M.MH-ty);if(e<7||e>12||!freeGrass(tx,ty))continue;occ.add(tx+','+ty);put(spr('toadstool',13+H(n,33,5)*5),tx*T+8,ty*T+14,{low:true});c++}
 // bunting garlands between plaza lanterns
 const pl=M.objects.filter(o=>o.k=='plamp').map(o=>[o.x*T+8,o.y*T+14-36]);
 if(pl.length==4){const pairs=[[0,1],[2,3]];const COL=['#f7b9c8','#bfe3f0','#fbe3a6','#c9e8c4','#d9c6f0'];
  pairs.forEach(([i,j])=>{const a=pl[i],b=pl[j];const x0=Math.min(a[0],b[0])-4,y0=Math.min(a[1],b[1])-4,x1=Math.max(a[0],b[0])+4,y1=Math.max(a[1],b[1])+22;const[c,g]=C(x1-x0,y1-y0);
   const sag=14,N=Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/9);const P=t=>[a[0]+(b[0]-a[0])*t-x0,a[1]+(b[1]-a[1])*t-y0+Math.sin(Math.PI*t)*sag];
   g.strokeStyle='#a58a72';g.lineWidth=1;g.beginPath();for(let t=0;t<=1.0001;t+=.02){const p=P(t);t?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])}g.stroke();
   for(let k=1;k<N;k++){const p=P(k/N);g.fillStyle=COL[k%COL.length];g.beginPath();g.moveTo(p[0]-3,p[1]);g.lineTo(p[0]+3,p[1]);g.lineTo(p[0],p[1]+6);g.fill()}
   objs.push({img:c,x:x0,y:y0,w:c.width,h:c.height,base:Math.max(a[1],b[1])+36+(i==0&&j==1?-30:0),k:'bunting',low:false})})}
 objs.sort((a,b)=>a.base-b.base);
 // soft shadows
 gg.save();objs.forEach(o=>{if(o.k=='bunting')return;const r=o.k=='tree'?o.w*.36:o.w*.38;gg.fillStyle=o.k=='tree'?'rgba(70,100,60,.22)':'rgba(70,100,60,.16)';gg.beginPath();gg.ellipse(o.x+o.w/2+2,o.base-1,r,o.k=='tree'?6:3,0,0,7);gg.fill()});gg.restore();
 const[wc,wg]=C(W,Hh);wg.drawImage(gc,0,0);objs.forEach(o=>wg.drawImage(o.img,o.x,o.y));
 const GS=64,grid={};objs.forEach((o,i)=>{if(o.low)return;for(let gy=Math.floor(o.y/GS);gy<=Math.floor((o.y+o.h)/GS);gy++)for(let gx=Math.floor(o.x/GS);gx<=Math.floor((o.x+o.w)/GS);gx++)(grid[gx+','+gy]=grid[gx+','+gy]||[]).push(i)});
 const sp=[];for(let n=0;n<4000&&sp.length<500;n++){const x=H(n,1,31)*W|0,y=H(n,2,31)*Hh|0;if(W_(x,y)&&W_(x,y-6)&&W_(x,y+6))sp.push([x,y,H(n,3,31)*10])}
 const[mc,mg]=C(240,180);mg.drawImage(wc,0,0,240,180);
 return{statue,world:wc,ground:gc,objs,grid,GS,anims,sp,boats:[],mini:mc,W,H:Hh,river:M.river}}
G.Render6={load,bake}})(this);
