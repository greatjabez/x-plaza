// Procedural pixel-art renderer: bakes ground + static objects into one world canvas, keeps an occluder index.
(function(G){
const H=(x,y,s=0)=>{let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
function vn(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=H(xi,yi,s),b=H(xi+1,yi,s),c=H(xi,yi+1,s),d=H(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const fbm=(x,y,s)=>vn(x,y,s)*.55+vn(x*2.03,y*2.03,s+7)*.3+vn(x*4.1,y*4.1,s+13)*.15;
const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const RAMP=a=>a.map(hx);
const GR=RAMP(['#4f8a45','#5f9c4e','#71ae59','#84bf64','#9bcf74','#b3dd89']);
const FO=RAMP(['#3f7440','#4b8447','#58944f','#67a457']);
const ST=RAMP(['#b9a68a','#cfbf9f','#dfd2b6','#eae0ca','#f3ecdc','#faf6ec']);
const PZ=RAMP(['#9a8670','#b39f86','#c9b79c','#dccbb0','#ebdfc8','#f6eedd']);
const RS=RAMP(['#a07868','#b98c7b','#cfa291','#e2b8a6']);
const WA=RAMP(['#86c8d2','#98d4dc','#a8dde3','#b9e6ea','#cdeef0','#e6f8f8']);
const FOAM=hx('#eef9fc'),BANK=RAMP(['#5e4330','#77573c','#8f6b49','#a7825a']),SAND=RAMP(['#d8c697','#e6d7ab','#f0e5c2']);
const WD=RAMP(['#8a6a4f','#a8835f','#c29c74','#d4b08a','#e2c4a0','#eed6b8']);
const DIRT=RAMP(['#6e4d33','#86603f','#9c734d']);
const FLW=['#f6b8c8','#f8e6a0','#ffffff','#d4c4f0','#f8cfa8','#f2a8b0','#b8dcf4'];
const C=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return[c,g]};
const rgb=a=>`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`;
function sh(hex,f){const a=hx(hex);return rgb(a.map(v=>Math.max(0,Math.min(255,v*f))))}
// ---------- sprites ----------
function px(g,c,x,y,w=1,h=1){g.fillStyle=c;g.fillRect(x,y,w,h)}
function shade3D(g,w,h,oc){oc=oc||[86,104,62];const id=g.getImageData(0,0,w,h),d=id.data,o=new Uint8ClampedArray(d);const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:d[(y*w+x)*4+3]>40;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!A(x,y)){if(A(x+1,y)||A(x-1,y)||A(x,y+1)||A(x,y-1)){o[i]=oc[0];o[i+1]=oc[1];o[i+2]=oc[2];o[i+3]=255}continue}}
 id.data.set(o);g.putImageData(id,0,0)}
const LEAF={g:['#4f8a48','#5e9a50','#6eaa58','#7fb862','#93c672','#acd68a'],l:['#5f9a4c','#6eaa54','#7eb85e','#8fc66a','#a3d27c','#bde092'],p:['#d79aae','#e2aabd','#ecbaca','#f3c9d6','#f8d8e2','#fce7ee'],o:['#d8a070','#e2b07e','#eabf8e','#f0cd9f','#f5dab2','#f9e6c8']};
function treeSprite(v,pine){const r=1+((v%4)-1.5)*.06;
 if(pine){const [c,g]=C(34,56);const P=['#4f8a48','#62a052','#7cb862'];
  px(g,'#b08a63',15,44,4,9);px(g,'#c29c74',15,44,2,9);
  for(let L=0;L<4;L++){const top=4+L*10,bh=16,hw=6+L*3.4;for(let y=0;y<bh;y++){const ww=Math.round(hw*(y/bh)+2);for(let x=-ww;x<=ww;x++){const k=y>bh-4?0:(x<-ww/3&&y<bh-6?2:1);px(g,P[k],17+x,top+y,1,1)}}}
  shade3D(g,34,56);return{c,ox:17,oy:52}}
 const tint=H(v,7,3);const pal=LEAF[v==7&&tint<.35?'p':v==6&&tint<.25?'o':v%3==0?'l':'g'];const [c,g]=C(44,50);
 px(g,'#b08a63',19,32,7,14);px(g,'#c29c74',19,32,3,14);px(g,'#9a7656',24,32,2,14);px(g,'#b08a63',17,44,11,3);
 const S=v*31;const bl=[];for(let i=0;i<11;i++){const a=i/11*6.283,R0=11*r;bl.push([22+Math.cos(a)*R0,19+Math.sin(a)*R0*.85,6.2*r+H(i,S,1)*1.2])}bl.push([22,19,11*r]);
 const inside=(x,y)=>{for(const b of bl)if(Math.hypot(x-b[0],y-b[1])<b[2])return true;return false};
 for(let y=0;y<44;y++)for(let x=0;x<44;x++){if(!inside(x,y))continue;let k=3;const ny=(y-19)/12,nx=(x-22)/12;
  if(ny>.42||(nx>.55&&ny>0))k=1;else if(ny<-.3&&nx<.1&&Math.hypot(nx+.25,ny+.55)<.38)k=5;
  // inner scallop lines for leaf clusters
  for(const b of bl.slice(0,11)){const d=Math.hypot(x-b[0],y-b[1]);if(Math.abs(d-b[2]+.5)<.55&&y>b[1]+1&&inside(x,y+2))k=Math.min(k,1)}
  px(g,pal[k],x,y,1,1)}
 if(v==5||v==2){for(let i=0;i<6;i++){const a=H(i,v,9)*6.28,rr=H(i,v,8)*8;const X=22+Math.cos(a)*rr|0,Y=17+Math.sin(a)*rr|0;px(g,v==5?'#ee9a94':'#f4d68a',X,Y,2,2)}}
 shade3D(g,44,50);return{c,ox:22,oy:47}}
function bushSprite(v){const [c,g]=C(22,17);const pal=LEAF[v%2?'l':'g'];for(let y=0;y<17;y++)for(let x=0;x<22;x++){const d=Math.min(Math.hypot((x-7)/6.5,(y-9)/6.5),Math.hypot((x-14)/6.5,(y-9)/6.5),Math.hypot((x-11)/7,(y-6)/5.5));if(d>1)continue;const k=y>12?1:((x<10&&y<6)?5:3);px(g,pal[k],x,y)}
 const fr=[null,'#e8606a','#7f8fe0','#f4a050'][v%4];if(fr)for(let i=0;i<6;i++){const X=3+H(i,v,4)*15|0,Y=4+H(i,v,5)*8|0;px(g,fr,X,Y,2,2);px(g,'#fff8',X,Y,1,1)}
 shade3D(g,22,17);return{c,ox:11,oy:16}}
const ROOFS=[['#7a3a32','#9a4b40','#b85e50','#d27b68','#e79a84','#f4b9a4'],['#33496a','#43608a','#5779a6','#7194bf','#91b0d6','#b5cde8'],['#3f5a40','#507352','#678e66','#82aa7e','#a1c69a','#c3dfba'],
 ['#4d3656','#654770','#80608c','#9c7ca8','#b89ac2','#d4bcdc'],['#3e3f49','#50525e','#666877','#7f8292','#9c9fae','#bfc2cf'],['#7a5a24','#97732f','#b38e40','#cba95a','#dfc27e','#eedaa6']];
const SHUT=['#7fa8c9','#d98c8c','#8fbf8a','#c9a0d8','#e6c27a','#9aa3b5'];
function roofTex(g,x0,y0,w,h,P,seed){// shingles with top-left light
 for(let y=0;y<h;y++){const row=Math.floor(y/5),ry=y%5,off=(row%2)*4;const grad=4-Math.floor(y/h*3.2);
  for(let x=0;x<w;x++){const col=Math.floor((x+off)/8),rx=(x+off)%8;let k=grad+(H(col,row,seed)<.25?-1:H(col,row,seed)>.85?1:0);
   if(ry==4)k-=2;else if(ry==0)k+=1;if(rx==0)k-=1;if(rx==1&&ry<3)k+=1;if(x<3)k+=1;if(x>w-4)k-=1;
   px(g,P[Math.max(0,Math.min(5,k))],x0+x,y0+y)}
  if(H(row,seed,2)<.15){const mx=H(row,seed,3)*w|0;px(g,'#7f9a5a',x0+mx,y0+row*5+3,2,1)}}}
function windowAt(g,x,y,w,h,shut,box){px(g,'#4a3a30',x-1,y-1,w+2,h+2);px(g,'#fbf5e8',x,y,w,h);px(g,'#4f7da3',x+1,y+1,w-2,h-2);
 for(let j=0;j<h-2;j++)for(let i=0;i<w-2;i++)if((i+j)%7<2&&i+j<w)px(g,'#9fd0ec',x+1+i,y+1+j);px(g,'#cfe9f6',x+1,y+1,2,1);
 px(g,'#fbf5e8',x+(w>>1),y,1,h);px(g,'#fbf5e8',x,y+(h>>1),w,1);px(g,'#00000030',x+1,y+h-1,w-1,1);
 if(shut){px(g,shut,x-4,y-1,3,h+2);px(g,sh(shut,.75),x-2,y-1,1,h+2);px(g,shut,x+w+1,y-1,3,h+2);px(g,sh(shut,.75),x+w+3,y-1,1,h+2);for(let j=1;j<h;j+=2){px(g,sh(shut,.85),x-4,y+j,3,1);px(g,sh(shut,.85),x+w+1,y+j,3,1)}}
 if(box){px(g,'#7a5234',x-1,y+h+1,w+2,3);px(g,'#946545',x-1,y+h+1,w+2,1);for(let i=0;i<w;i+=2){px(g,'#4f8a4a',x+i,y+h,2,1);px(g,FLW[(i+box)%7],x+i,y+h-1,1,1)}}}
function houseSprite(o){const W=o.w*16,Hh=o.h*16+30,[c,g]=C(W+8,Hh);const X0=4;const P=ROOFS[o.v],s=o.seed;
 const wallTop=Hh-40,wallH=36;// wall
 const WALLS=[['#d9c6a3','#eadbbd','#f6ecd6'],['#a8784e','#c18e62','#d6a97f'],['#c88878','#dba191','#ecbcae']][o.wall];
 for(let y=0;y<wallH;y++)for(let x=0;x<W-2;x++){let k=1;if(o.wall==1){k=y%5==0?0:(y%5==1?2:1);if(H(x>>3,y/5|0,s)<.2&&y%5)k=Math.max(0,k-1)}else if(o.wall==2){const off=((y/4|0)%2)*5;k=(y%4==0||(x+off)%10==0)?0:(H((x+off)/10|0,y/4|0,s)<.3?2:1)}else{k=H(x,y,s)<.05?0:1;if(y<2)k=2}
  if(x<2)k=Math.min(2,k+1);if(x>W-5)k=Math.max(0,k-1);px(g,WALLS[k],X0+1+x,wallTop+y)}
 if(o.wall==0){const tb='#7a5234';px(g,tb,X0+1,wallTop,2,wallH);px(g,tb,X0+W-3,wallTop,2,wallH);px(g,tb,X0+1,wallTop+wallH-6,W-2,2);px(g,tb,X0+1,wallTop+1,W-2,2);for(let x=14;x<W-6;x+=W>85?24:18)px(g,tb,X0+x,wallTop,2,wallH)}
 // foundation
 for(let x=0;x<W;x++)for(let y=0;y<4;y++){const k=(y==0)?3:((x+(y>1?3:0))%6==0?0:(H(x/6|0,y,s+5)<.4?1:2));px(g,rgb(ST[k]),X0+x,Hh-4+y)}
 // door + windows
 const dx=X0+(o.w>>1)*16+2;const back=o.back;
 if(!back){px(g,'#3d2a1e',dx-1,wallTop+11,14,25);px(g,'#6b4426',dx,wallTop+12,12,24);for(let i=0;i<12;i+=3)px(g,'#835530',dx+i,wallTop+12,2,24);px(g,'#9c6a3e',dx,wallTop+12,12,1);px(g,'#e8c860',dx+9,wallTop+24,2,2);px(g,'#fbf5e8',dx+3,wallTop+15,6,4);px(g,'#86b4d4',dx+4,wallTop+16,4,2);
  px(g,rgb(ST[4]),dx-2,Hh-3,16,3);px(g,rgb(ST[2]),dx-2,Hh-1,16,1);
  px(g,'#f6d56a',dx-5,wallTop+15,3,4);px(g,'#8a6a4f',dx-5,wallTop+14,3,1);px(g,'#8a6a4f',dx-4,wallTop+19,1,2)}
 const wins=[];for(let x=X0+8;x<X0+W-14;x+=16){if(!back&&Math.abs(x+5-(dx+6))<14)continue;wins.push(x)}
 wins.forEach((x,i)=>windowAt(g,x+1,wallTop+11,10,11,o.wall!=1?SHUT[(o.v+i)%6]:null,(i+s)%3?1+i:0));
 // awning for shops
 if(o.shop&&!back){const aw=['#e87878','#f4f0e4'],ax=dx-10,ay=wallTop+2;for(let x=0;x<32;x++){const col=(x>>2)%2?aw[1]:aw[0];px(g,col,ax+x,ay,1,6);if(x%4<2)px(g,col,ax+x,ay+6,1,1)}px(g,'#0003',ax,ay+7,32,2);
  px(g,'#7a5234',X0+W-20,wallTop-8,1,8);px(g,'#946545',X0+W-26,wallTop-2,14,9);px(g,'#f4e4c0',X0+W-25,wallTop-1,12,7);px(g,['#e85a5a','#5a9ad8','#7ab85a','#d89a3a'][s%4],X0+W-22,wallTop+1,6,3)}
 // roof
 const rT=4,rH=wallTop-rT+3;roofTex(g,X0-3,rT,W+6,rH,P,s);
 for(let y=0;y<rH;y++){const t=Math.floor((1-y/rH)*5);px(g,P[0],X0-3,rT+y,1,1);px(g,P[0],X0+W+2,rT+y,1,1);for(let i=0;i<t;i++){px(g,'rgba(255,255,255,.07)',X0-2+i,rT+y,1,1);px(g,'rgba(0,0,0,.08)',X0+W+1-i,rT+y,1,1)}}
 px(g,P[0],X0-3,rT+rH-2,W+6,2);px(g,P[1],X0-3,rT+rH-3,W+6,1);px(g,'#0005',X0,rT+rH,W,2);px(g,'#0002',X0,rT+rH+2,W,2);// eave + shadow on wall
 px(g,P[1],X0-3,rT,W+6,3);px(g,P[4],X0-3,rT,W+6,1);// ridge
 if(o.dormer){const dw=16,dxr=X0+(W>>1)-8+(o.shop?-12:0),dy=rT+6;px(g,'#fbf5e8',dxr,dy+4,dw,12);windowAt(g,dxr+4,dy+6,8,8,null,0);
  for(let y=0;y<8;y++){px(g,P[3],dxr-2+y,dy+4-y/2|0,dw+4-2*y,1)}px(g,P[1],dxr-2,dy+4,dw+4,1)}
 if(o.chim){const cx=X0+W-18+(s%3)*-6;for(let y=0;y<14;y++)for(let x=0;x<8;x++){const k=(y%3==0||(x+(y/3|0)%2*3)%5==0)?'#8a4a3a':(x<2?'#c9786a':'#b0604f');px(g,k,cx+x,rT-6+y)}px(g,'#5a5a64',cx-1,rT-7,10,2);px(g,'#7a7a86',cx-1,rT-7,10,1)}
 return{c,ox:X0,oy:Hh,chim:o.chim?{x:X0+W-18+(s%3)*-6+4,y:-6+4}:null}}
function churchSprite(){const W=160,Hh=96+80,[c,g]=C(W+10,Hh);const X0=5,wallTop=Hh-48,P=ROOFS[1];
 for(let y=0;y<44;y++)for(let x=0;x<W;x++){const off=((y/5|0)%2)*6;const k=(y%5==0||(x+off)%12==0)?0:(H((x+off)/12|0,y/5|0,77)<.3?2:1);px(g,['#a9a397','#cfc8b8','#e3ddcf'][x<3?2:k],X0+x,wallTop+y)}
 roofTex(g,X0-4,40,W+8,wallTop-37,P,77);px(g,'#0004',X0,wallTop,W,3);
 [16,40,112,136].forEach(x=>{px(g,'#5a5560',X0+x-1,wallTop+11,12,24);px(g,'#7fa8d8',X0+x,wallTop+14,10,20);px(g,'#7fa8d8',X0+x+2,wallTop+12,6,2);for(let j=0;j<20;j+=4)for(let i=0;i<10;i+=3)px(g,['#e87878','#f4d060','#78b878','#b090e0'][(i+j)%4],X0+x+i,wallTop+14+j,2,2);px(g,'#5a5560',X0+x+4,wallTop+12,1,22)});
 // tower
 const tx=X0+62,tw=36;for(let y=24;y<Hh-4;y++)for(let x=0;x<tw;x++){const off=((y/5|0)%2)*6;const k=(y%5==0||(x+off)%12==0)?0:1;px(g,['#b8b1a3','#ddd6c6','#efe9dc'][x<3?2:x>tw-4?0:k],tx+x,y)}
 for(let y=0;y<34;y++){const hw=Math.round(y*0.62)+1;for(let x=-hw;x<=hw;x++){const k=Math.max(0,Math.min(5,Math.floor((-x/hw)*1.8+3.2-(y%4==3?1:0))));px(g,P[k],tx+tw/2+x,-8+y+8)}}
 px(g,'#e8c060',tx+tw/2-1,0,3,5);px(g,'#fff0a0',tx+tw/2-1,0,1,2);
 g.fillStyle='#fbf5e8';g.beginPath();g.arc(tx+tw/2,52,9,0,7);g.fill();g.fillStyle='#e8a8c8';g.beginPath();g.arc(tx+tw/2,52,7,0,7);g.fill();for(let a=0;a<8;a++){px(g,['#7fa8d8','#f4d060'][a%2],tx+tw/2+Math.cos(a*.785)*4|0,52+Math.sin(a*.785)*4|0,2,2)}px(g,'#fbf5e8',tx+tw/2-1,51,2,2);
 px(g,'#3d2a1e',tx+8,Hh-34,20,30);px(g,'#6b4426',tx+9,Hh-32,18,28);px(g,'#6b4426',tx+11,Hh-34,14,2);px(g,'#3d2a1e',tx+17,Hh-32,1,28);px(g,'#e8c860',tx+15,Hh-18,1,2);px(g,'#e8c860',tx+19,Hh-18,1,2);
 for(let x=0;x<W;x++)for(let y=0;y<4;y++)px(g,rgb(ST[y==0?4:(x%7==0?1:2)]),X0+x,Hh-4+y);
 return{c,ox:X0,oy:Hh}}
function clockSprite(){const W=48,Hh=48+92,[c,g]=C(W+6,Hh);const X0=3,P=ROOFS[2];
 for(let y=30;y<Hh-2;y++)for(let x=0;x<W-8;x++){const off=((y/5|0)%2)*5;const k=(y%5==0||(x+off)%10==0)?0:(H((x+off)/10|0,y/5|0,5)<.25?2:1);px(g,['#a88a78','#cfae98','#e4c8b2'][x<3?2:x>W-12?0:k],X0+4+x,y)}
 for(let y=0;y<32;y++){const hw=Math.round(y*.72)+1;for(let x=-hw;x<=hw;x++){const k=Math.max(0,Math.min(5,Math.floor((-x/hw)*1.8+3.4-(y%4==3?1:0))));px(g,P[k],X0+W/2+x,y+2)}}
 px(g,P[0],X0+2,32,W-4,3);px(g,'#e8c060',X0+W/2-1,0,2,4);
 g.fillStyle='#4a3a30';g.beginPath();g.arc(X0+W/2,52,12,0,7);g.fill();g.fillStyle='#fdf8ea';g.beginPath();g.arc(X0+W/2,52,10.5,0,7);g.fill();
 for(let i=0;i<12;i++)px(g,'#5a4a40',X0+W/2+Math.cos(i*.5236)*8.5-.5|0,52+Math.sin(i*.5236)*8.5-.5|0,1,1);
 g.strokeStyle='#3a2a20';g.lineWidth=1.5;g.beginPath();g.moveTo(X0+W/2,52);g.lineTo(X0+W/2,45);g.moveTo(X0+W/2,52);g.lineTo(X0+W/2+5,54);g.stroke();
 px(g,'#3d2a1e',X0+W/2-6,Hh-22,12,20);px(g,'#6b4426',X0+W/2-5,Hh-21,10,19);px(g,'#7a5234',X0+2,78,W-4,3);for(let x=4;x<W-4;x+=4)px(g,'#7a5234',X0+x,72,1,6);px(g,'#7a5234',X0+2,72,W-4,1);
 windowAt(g,X0+W/2-4,88,8,12,null,0);return{c,ox:X0,oy:Hh}}
function gazeboSprite(){const W=112,Hh=96+34,[c,g]=C(W+8,Hh);const X0=4,P=ROOFS[2];
 // platform
 g.fillStyle=rgb(ST[1]);g.beginPath();g.ellipse(X0+56,Hh-22,56,20,0,0,7);g.fill();g.fillStyle=rgb(ST[4]);g.beginPath();g.ellipse(X0+56,Hh-25,54,18,0,0,7);g.fill();
 for(let i=0;i<14;i++){const a=i/14*6.283;px(g,rgb(ST[2]),X0+56+Math.cos(a)*50|0,Hh-25+Math.sin(a)*16|0,4,1)}
 px(g,rgb(ST[3]),X0+44,Hh-8,24,4);px(g,rgb(ST[2]),X0+44,Hh-4,24,4);px(g,rgb(ST[1]),X0+44,Hh-5,24,1);
 // pillars
 const pil=[[-46,-6],[-30,6],[0,10],[30,6],[46,-6]];pil.forEach(([x,y])=>{const X=X0+56+x,Y=Hh-28+y;px(g,'#c9c2b4',X-2,Y-42,5,42);px(g,'#fbf8f0',X-2,Y-42,2,42);px(g,'#9a9488',X+2,Y-42,1,42);px(g,'#e8e2d4',X-3,Y-2,7,3)});
 px(g,'#c8a070',X0+14,Hh-40,84,2);for(let x=X0+14;x<X0+98;x+=4)px(g,'#b08050',x,Hh-46,1,6);px(g,'#c8a070',X0+14,Hh-46,84,1);
 // roof dome
 for(let y=0;y<44;y++){const hw=Math.round(Math.sqrt(y/44)*60);for(let x=-hw;x<=hw;x++){const a=Math.atan2(y,x);const rib=Math.abs(Math.sin(a*6))<.12;let k=Math.floor((-x/hw)*1.5+3-(y/44)+(y%5==4?-1:0)+(rib?-1:0));px(g,P[Math.max(0,Math.min(5,k))],X0+56+x,8+y)}}
 px(g,P[0],X0-4,50,W+8,3);for(let x=0;x<W+8;x+=6){px(g,P[2],X0-4+x,53,4,2);px(g,'#ffb3c8',X0-2+x,55,2,2)}
 px(g,'#e8c060',X0+54,0,4,9);px(g,'#fff0a0',X0+54,0,2,3);return{c,ox:X0,oy:Hh}}
function fountainSprite(big){if(!big){const W=48,Hh=58,[c,g]=C(W+4,Hh);const X0=2,cx=X0+W/2,cy=Hh-17,rx=W/2-2,ry=14;
  g.fillStyle=rgb(ST[1]);g.beginPath();g.ellipse(cx,cy+3,rx,ry,0,0,7);g.fill();g.fillStyle=rgb(ST[4]);g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,7);g.fill();g.fillStyle=rgb(WA[2]);g.beginPath();g.ellipse(cx,cy,rx-6,ry-5,0,0,7);g.fill();
  px(g,'#e9e0d0',cx-4,cy-16,8,16);return{c,ox:X0,oy:Hh,jet:{x:cx-X0,y:cy-18-Hh,rx:rx-8,ry:ry-6,cy:cy-Hh}}}
 const W=128,Hh=124,[c,g]=C(W+4,Hh);const X0=2,cx=X0+W/2,cy=Hh-34,rx=58,ry=28;
 const PK=['#b98488','#d39a9e','#e4b0b2','#efc4c3','#f8dbd8','#fdecea'];const E=(col,x,y,a,b)=>{g.fillStyle=col;g.beginPath();g.ellipse(x,y,a,b,0,0,7);g.fill()};
 // outer basin wall (front face) + rim
 E(PK[1],cx,cy+12,rx,ry);g.fillStyle=PK[1];g.fillRect(cx-rx,cy,rx*2,12);E(PK[2],cx,cy+10,rx-1,ry-1);g.fillStyle=PK[2];g.fillRect(cx-rx+1,cy,rx*2-2,10);
 for(let i=0;i<14;i++){const a=Math.PI*(i+.5)/14;const x=cx-Math.cos(a)*(rx-2);px(g,PK[0],x|0,cy+2+Math.sin(a)*(ry-2)|0,1,9)}
 E(PK[4],cx,cy,rx,ry);E(PK[3],cx,cy+1,rx-4,ry-3);
 // deep blue water
 E('#2b5fa8',cx,cy+1,rx-8,ry-7);E('#3a78c0',cx-4,cy-1,rx-16,ry-12);E('#2b5fa8',cx+6,cy+3,rx-30,ry-18);
 for(let i=0;i<6;i++)px(g,'#8cc4ec',cx-30+i*11,cy-6+(i%2)*9,5,1);
 // pedestal + upper bowl
 px(g,PK[2],cx-7,cy-28,14,30);px(g,PK[4],cx-7,cy-28,4,30);px(g,PK[0],cx+6,cy-28,1,30);
 E(PK[1],cx,cy-26,24,9);E(PK[4],cx,cy-30,24,8);E('#2b5fa8',cx,cy-30,19,5);E('#3a78c0',cx-3,cy-31,12,3);
 px(g,PK[3],cx-4,cy-46,8,16);px(g,PK[5],cx-4,cy-46,3,16);E(PK[4],cx,cy-46,7,3);E(PK[5],cx,cy-50,4,4);px(g,'#fff6f4',cx-2,cy-52,2,2);
 shade3D(g,W+4,Hh,[150,100,105]);
 return{c,ox:X0,oy:Hh,jet:{x:cx-X0,y:cy-52-Hh,rx:rx-8,ry:ry-7,cy:cy-Hh,top2:cy-30-Hh,blue:1}}}
function stallSprite(v){const [c,g]=C(52,62);const aw=[['#e87878','#fbf3e4'],['#78a8e0','#fbf3e4'],['#8cc878','#fbf3e4'],['#e8b860','#fbf3e4']][v%4];
 px(g,'#5f3f28',4,14,2,46);px(g,'#5f3f28',46,14,2,46);px(g,'#946545',3,36,46,22);for(let x=3;x<49;x+=5)px(g,'#7a5234',x,36,1,22);px(g,'#ad7b52',3,36,46,2);px(g,'#5f3f28',3,57,46,1);
 const goods=v<2?['#e8524a','#f49a3a','#f4d060','#7ab85a']:['#c89050','#e8c890','#d89ab8','#a8d8ff'];for(let i=0;i<9;i++)for(let j=0;j<2;j++){px(g,goods[(i+j)%4],6+i*4+j*2,30+j*3,3,3);px(g,'#fff7',6+i*4+j*2,30+j*3,1,1)}
 px(g,'#c4926a',4,34,44,2);
 for(let y=0;y<14;y++)for(let x=0;x<52;x++){if(y>11&&(x%6)>3)continue;const col=((x/6|0)%2)?aw[1]:aw[0];px(g,y<2?sh(col,1.05):y>9?sh(col,.85):col,x,4+y)}
 px(g,'#0003',4,18,44,2);return{c,ox:2,oy:60}}
function cartSprite(v){const [c,g]=C(52,56);const s=stallSprite(v);g.drawImage(s.c,0,-4);g.clearRect(0,44,52,12);
 px(g,'#7a5234',3,40,46,6);[12,40].forEach(x=>{g.fillStyle='#3d2a1e';g.beginPath();g.arc(x,48,7,0,7);g.fill();g.fillStyle='#946545';g.beginPath();g.arc(x,48,5,0,7);g.fill();px(g,'#3d2a1e',x-1,43,2,10);px(g,'#3d2a1e',x-5,47,10,2)});return{c,ox:2,oy:54}}
function plampSprite(){const [c,g]=C(20,58);const PK=['#b98488','#d39a9e','#e4b0b2','#efc4c3','#f8dbd8'];
 px(g,PK[1],2,48,16,8);px(g,PK[3],2,48,16,2);px(g,PK[2],4,50,12,6);px(g,PK[0],4,55,12,1);// base block
 px(g,PK[2],8,16,4,32);px(g,PK[4],8,16,1,32);px(g,PK[0],11,16,1,32);px(g,PK[3],6,30,8,3);px(g,PK[3],6,44,8,4);
 px(g,PK[1],4,12,12,4);px(g,PK[3],4,12,12,1);px(g,PK[2],5,3,10,9);px(g,'#fff2c8',7,5,6,6);px(g,'#ffe9a8',8,6,2,4);px(g,PK[1],9,3,2,9);
 px(g,PK[3],3,1,14,2);px(g,PK[2],8,-1,4,2);px(g,PK[4],9,0,2,1);shade3D(g,20,58,[150,100,105]);return{c,ox:10,oy:56}}
function statueSprite(){const W=60,Hh=88,[c,g]=C(W,Hh);
 const CR=['#cdbdaf','#e3d4c4','#f2e8dc','#fbf6ee'],PKs=['#d9b0a8','#e8c4bc','#f3d8d0'],MN=['#a9cbbd','#c2ddd0','#d8ece2'],SKs=['#e2c4b0','#f0d8c6','#f8e8da'];
 const p=(col,x,y,w=1,h=1)=>px(g,col,x,y,w,h);
 // rocky pedestal
 for(let y=62;y<86;y++)for(let x=2;x<58;x++){const ex=Math.abs(x-30)/28,ey=(y-62)/24;if(ex>1-ey*.12)continue;const blk=Math.floor((x+(Math.floor((y-62)/8)%2)*6)/12);const edge=(x+(Math.floor((y-62)/8)%2)*6)%12==0||(y-62)%8==0;
  p(edge?PKs[0]:(y<66?CR[3]:H(blk,y>>3,3)<.4?PKs[2]:CR[2]),x,y)}
 p('#d8b878',22,72,16,7);p('#f2dca0',23,73,14,5);p('#b89858',24,75,12,1);p('#b89858',24,77,8,1);// plaque
 // torso: blazer (cream->mint gradient), lapels, shirt
 for(let y=38;y<63;y++){const half=Math.min(22,14+(y-38)*1.2);for(let x=30-half;x<30+half;x++){const t=(x-(30-half))/(2*half);p(t<.35?PKs[2]:t<.55?CR[2]:t<.8?MN[2]:MN[1],x|0,y)}}
 for(let y=38;y<56;y++){const w=Math.max(0,7-(y-38)*.4);p(MN[2],30-w|0,y,w*2|0||1,1)}// shirt V
 for(let y=38;y<54;y++){p(CR[1],(30-8+(y-38)*.45)|0,y,2,1);p(MN[0],(30+6-(y-38)*.45)|0,y,2,1)}// lapels
 p(CR[3],25,37,4,3);p(MN[1],31,37,4,3);for(let y=44;y<60;y+=5)p(CR[0],30,y,1,1);p(MN[0],40,48,6,1);// collar, buttons, pocket
 // neck + head
 p(SKs[1],26,32,8,6);p(SKs[0],32,32,2,6);
 for(let y=10;y<34;y++){const t=(y-21)/12;const hw=Math.round(10*Math.sqrt(Math.max(0,1-t*t*.9)));p(y>27?SKs[1]:SKs[2],30-hw,y,hw*2,1);p(SKs[0],30+hw-2,y,2,1)}
 p(SKs[1],19,19,2,5);p(SKs[1],39,19,2,5);// ears
 // tousled hair
 for(let y=4;y<16;y++)for(let x=19;x<42;x++){const top=6+Math.abs(Math.sin(x*1.3))*3+(x<24||x>37?4:0);if(y>=top&&y<16-(x>26&&x<36?3:0))p(H(x,y,7)<.3?CR[1]:CR[2],x,y)}
 for(let i=0;i<7;i++)p(CR[3],21+i*3,6+(i%2),2,2);
 // face: eyes, brows, nose, smile
 p('#7a6458',25,20,2,2);p('#7a6458',33,20,2,2);p(CR[0],24,18,4,1);p(CR[0],32,18,4,1);p(SKs[0],29,22,2,3);
 p('#9a7464',25,26,10,1);p('#ffffff',26,27,8,1);p('#9a7464',26,28,8,1);p('#ecc4b4',23,24,2,1);p('#ecc4b4',35,24,2,1);
 // thumbs-up arm (viewer's left)
 p(PKs[1],6,40,10,16);p(PKs[2],7,40,4,16);p(CR[2],6,52,10,4);// sleeve
 p(SKs[1],5,30,11,10);p(SKs[2],6,31,4,8);for(let i=0;i<4;i++)p(SKs[0],10,32+i*2,6,1);// fist
 p(SKs[1],7,20,4,11);p(SKs[2],7,20,2,10);p(SKs[0],7,20,4,1);// thumb
 shade3D(g,W,Hh,[138,116,104]);return{c,ox:30,oy:84}}
function lampSprite(){const [c,g]=C(14,44);px(g,'#7a6250',6,10,3,32);px(g,'#9a8068',6,10,1,32);px(g,'#7a6250',3,40,9,4);px(g,'#9a8068',3,40,9,1);
 px(g,'#7a6250',2,2,11,2);px(g,'#7a6250',3,4,9,8);px(g,'#ffe68a',4,5,7,6);px(g,'#fff6c8',5,6,2,3);px(g,'#7a6250',7,4,1,8);px(g,'#7a6250',4,0,7,2);px(g,'#7a6250',6,12,3,2);return{c,ox:7,oy:42,glow:{x:0,y:-34}}}
function benchSprite(dir){if(dir>=2){const [c,g]=C(14,28);px(g,'#8a6a4f',2,22,2,4);px(g,'#8a6a4f',10,22,2,4);px(g,'#8a6a4f',2,4,2,4);px(g,'#8a6a4f',10,4,2,4);
  for(let x=1;x<13;x+=3){px(g,'#ad7b52',x,4,2,20);px(g,'#c4926a',x,4,1,20)}const bx=dir==3?0:12;px(g,'#7a5234',bx,0,2,22);px(g,'#946545',bx,0,1,22);return{c,ox:7,oy:24}}
 const [c,g]=C(24,22);px(g,'#8a6a4f',2,14,2,6);px(g,'#8a6a4f',20,14,2,6);for(let y=10;y<16;y+=2){px(g,'#ad7b52',1,y,22,2);px(g,'#c4926a',1,y,22,1)}
 if(dir==0){px(g,'#8a6a4f',2,2,2,8);px(g,'#8a6a4f',20,2,2,8);px(g,'#946545',1,2,22,3);px(g,'#c4926a',1,2,22,1);px(g,'#946545',1,6,22,2)}else{px(g,'#946545',1,16,22,3);px(g,'#c4926a',1,16,22,1)}
 return{c,ox:12,oy:dir==0?16:18}}
function cbenchSprite(dir){if(dir>=2){const [c,g]=C(14,28);px(g,'#d8c8b0',2,22,2,4);px(g,'#d8c8b0',10,22,2,4);px(g,'#d8c8b0',2,4,2,4);px(g,'#d8c8b0',10,4,2,4);
  for(let x=1;x<13;x+=3){px(g,'#fbf6ec',x,4,2,20);px(g,'#ffffff',x,4,1,20)}const bx=dir==3?0:12;px(g,'#e0d4c0',bx,0,2,22);px(g,'#efe6d6',bx,0,1,22);return{c,ox:7,oy:24}}
 const [c,g]=C(24,22);px(g,'#d8c8b0',2,14,2,6);px(g,'#d8c8b0',20,14,2,6);for(let y=10;y<16;y+=2){px(g,'#fbf6ec',1,y,22,2);px(g,'#ffffff',1,y,22,1)}
 if(dir==0){px(g,'#d8c8b0',2,2,2,8);px(g,'#d8c8b0',20,2,2,8);px(g,'#efe6d6',1,2,22,3);px(g,'#ffffff',1,2,22,1);px(g,'#efe6d6',1,6,22,2)}else{px(g,'#efe6d6',1,16,22,3);px(g,'#ffffff',1,16,22,1)}
 return{c,ox:12,oy:dir==0?16:18}}
function logSprite(vert){const [c,g]=vert?C(12,24):C(24,12);if(vert){px(g,'#6e4a30',1,0,10,22);px(g,'#946545',1,0,4,22);for(let y=3;y<22;y+=5)px(g,'#5a3a24',3,y,6,1);px(g,'#e8c890',2,0,8,3);px(g,'#b08860',4,1,4,1);return{c,ox:6,oy:16}}
 px(g,'#6e4a30',0,2,22,9);px(g,'#946545',0,2,22,3);for(let x=4;x<20;x+=5)px(g,'#5a3a24',x,5,1,5);px(g,'#e8c890',19,2,3,9);px(g,'#b08860',20,5,1,3);return{c,ox:12,oy:10}}
function chairSprite(dir){const [c,g]=C(12,20);px(g,'#5f3f28',2,12,2,6);px(g,'#5f3f28',8,12,2,6);px(g,'#ad7b52',1,10,10,3);px(g,'#c4926a',1,10,10,1);const bx=dir==3?1:9;px(g,'#946545',bx,1,2,11);px(g,'#946545',dir==3?1:3,1,8,2);return{c,ox:6,oy:17}}
function tableSprite(){const [c,g]=C(22,30);px(g,'#5f3f28',10,14,3,13);g.fillStyle='#f4ecd8';g.beginPath();g.ellipse(11,14,10,5,0,0,7);g.fill();for(let x=2;x<20;x+=4)px(g,'#e87878',x,13,2,2);
 px(g,'#7a5234',10,0,2,14);for(let y=0;y<6;y++)px(g,y%2?'#fbf3e4':'#e87878',11-y*2,y,y*4+2,1);return{c,ox:11,oy:28}}
function propSprite(k,v){if(k=='barrel'){const [c,g]=C(14,18);for(let y=0;y<16;y++){const w=y<2||y>13?10:12;px(g,y%5==2?'#4a4a55':(y<3?'#ad7b52':'#946545'),7-w/2,y,w,1)}for(let x=2;x<12;x+=3)px(g,'#7a5234',x,2,1,13);px(g,'#c4926a',3,0,8,2);return{c,ox:7,oy:16}}
 if(k=='crate'){const [c,g]=C(16,16);px(g,'#946545',1,2,14,13);px(g,'#c4926a',1,2,14,2);px(g,'#7a5234',1,14,14,1);for(let i=0;i<12;i++){px(g,'#7a5234',2+i,3+i,1,1);px(g,'#7a5234',13-i,3+i,1,1)}px(g,'#5f3f28',1,2,1,13);px(g,'#5f3f28',14,2,1,13);return{c,ox:8,oy:15}}
 if(k=='pot'){const [c,g]=C(14,18);px(g,'#b5604a',3,10,8,7);px(g,'#d27b68',2,9,10,2);px(g,'#e79a84',3,10,2,6);for(let i=0;i<6;i++){px(g,'#4f8a4a',2+i*2,5+(i%2)*2,2,4);px(g,FLW[(v+i)%7],2+i*2,3+(i%3),2,2)}return{c,ox:7,oy:17}}
 if(k=='sign'){const [c,g]=C(18,24);px(g,'#7a5234',8,6,2,17);px(g,'#946545',1,4,16,8);px(g,'#c4926a',1,4,16,1);px(g,'#5f3f28',3,7,12,1);px(g,'#5f3f28',3,9,9,1);return{c,ox:9,oy:22}}
 if(k=='rock'){const [c,g]=C(16,12);for(let y=0;y<10;y++)for(let x=0;x<14;x++){const d=Math.hypot((x-7)/7,(y-6)/5);if(d<1)px(g,rgb(ST[Math.max(0,Math.min(5,Math.floor(3.5-(x-7)/7-(y-6)/5+H(x,y,v)*.8)))]),x+1,y+1)}shade3D(g,16,12);return{c,ox:8,oy:10}}
 if(k=='well'){const [c,g]=C(34,44);g.fillStyle=rgb(ST[2]);g.beginPath();g.ellipse(17,32,14,8,0,0,7);g.fill();g.fillStyle=rgb(ST[4]);g.beginPath();g.ellipse(17,29,14,7,0,0,7);g.fill();g.fillStyle=rgb(WA[1]);g.beginPath();g.ellipse(17,29,9,4,0,0,7);g.fill();
  px(g,'#5f3f28',4,6,2,24);px(g,'#5f3f28',28,6,2,24);px(g,'#7a5234',6,14,22,1);for(let y=0;y<8;y++)px(g,ROOFS[0][y<2?4:3],1+y,y+0,32-2*y+0,1);px(g,'#6e4a30',16,15,2,8);px(g,'#946545',14,22,6,4);return{c,ox:17,oy:40}}
 if(k=='wall'){const [c,g]=C(16,26);for(let y=0;y<24;y++)for(let x=0;x<16;x++){const off=((y/6|0)%2)*8;const kk=(y%6==0||(x+off)%16==0)?0:(y<3?3:H((x+off)/16|0,y/6|0,v)<.4?2:1);px(g,rgb(ST[kk]),x,y+2)}px(g,'#6aa456',0,0,16,2);return{c,ox:0,oy:26}}
 if(k=='gate'){const [c,g]=C(112,64);for(let y=8;y<62;y++)for(let x=0;x<112;x++){const ax=x-56,ay=y-40;if(Math.abs(ax)<38&&(ay>0||Math.hypot(ax/38,ay/30)<1)&&!(Math.abs(ax)<30&&(ay>-0||Math.hypot(ax/30,(ay)/24)<1)))continue;
  if(Math.abs(ax)>48&&y<20)continue;const off=((y/6|0)%2)*8;const kk=(y%6==0||(x+off)%16==0)?0:(H((x+off)/16|0,y/6|0,9)<.4?2:3);px(g,rgb(ST[x<3?4:kk]),x,y)}
  px(g,'#e8c060',52,4,8,6);px(g,'#7a5234',30,10,52,2);return{c,ox:0,oy:62}}
 if(k=='campfire'){const [c,g]=C(24,16);for(let i=0;i<8;i++){const a=i/8*6.283;px(g,rgb(ST[2+i%2]),12+Math.cos(a)*9-2|0,9+Math.sin(a)*5-2|0,4,3)}px(g,'#5f3f28',5,8,14,3);px(g,'#7a5234',8,6,8,3);return{c,ox:12,oy:14}}}
function cobble(x,y,P,cell,s){const cx=Math.floor(x/cell),cy=Math.floor(y/cell);let d1=1e9,d2=1e9,fx=0,fy=0,id=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const X=cx+i,Y=cy+j,qx=X*cell+1+H(X,Y,2+s)*(cell-2),qy=Y*cell+1+H(X,Y,3+s)*(cell-2),d=Math.hypot(x-qx,y-qy);if(d<d1){d2=d1;d1=d;fx=qx;fy=qy;id=X*999+Y}else if(d<d2)d2=d}
 let k=3+(H(id,s,4)<.3?-1:H(id,s,4)>.82?1:0);const e=d2-d1;if(e<1.3)k=0;else{const l=(x-fx)+(y-fy);if(l<-2.4)k++;if(l>2.6)k--;if(e<2.4&&l>0)k--}if(H(x,y,s+8)<.03)k--;return P[Math.max(0,Math.min(P.length-1,k))]}
// ---------- world bake ----------
function bake(M){const T=M.T,W=M.MW*T,Hh=M.MH*T;const masks={};
 const mk=(f)=>{const [c,g]=C(W,Hh);g.imageSmoothingEnabled=true;g.lineCap='round';g.lineJoin='round';f(g);return g.getImageData(0,0,W,Hh).data};
 const strokeP=(g,pts,w)=>{g.lineWidth=w*T;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0]*T,p[1]*T):g.moveTo(p[0]*T,p[1]*T));g.stroke()};
 const path=mk(g=>{g.strokeStyle='#fff';M.paths.forEach(p=>strokeP(g,p.pts,p.w));});
 const plaza=mk(g=>{g.fillStyle='#fff';g.beginPath();g.arc(M.plaza.cx*T,M.plaza.cy*T,M.plaza.r*T,0,7);g.fill()});
 const water=mk(g=>{g.strokeStyle='#fff';strokeP(g,M.river.pts,M.river.w)});
 const bridge=mk(g=>{M.bridges.forEach((b,i)=>{g.save();g.translate(b.x*T,b.y*T);g.rotate(b.ang);g.fillStyle=`rgb(${i+1},0,0)`;g.fillRect(-b.len/2*T,-b.wid/2*T,b.len*T,b.wid*T);g.restore()})});
 const A=(m,x,y)=>x<0||y<0||x>=W||y>=Hh?0:m[(y*W+x)*4+3]>127;
 const [gc,gg]=C(W,Hh);const img=gg.createImageData(W,Hh),D=img.data;const pcx=M.plaza.cx*T,pcy=M.plaza.cy*T,pr=M.plaza.r*T;
 const cell=7;

 const PINK=RAMP(['#f6e2dd','#d9a3a6','#e6b5b6','#efc3c2','#f8d8d4']);const GRs=RAMP(['#93bf4e','#a6cf5c','#b2d768','#c2e07c']),DT=RAMP(['#c9a873','#dcbf8c','#e5cc9c','#eedab0','#f6e8c8']),PCB=RAMP(['#d8c29a','#ebdcbc','#f2e7cf','#f9f3e4']),ROSE=RAMP(['#dcb6a4','#ecccbc','#f3dacd']);
 const OLc=hx('#7a8a56'),LIP=RAMP(['#9a8456','#c9a873','#dcc08c']),GEDGE=hx('#93bf4e'),WAb=RAMP(['#9dd6cf','#a9ddd6','#bfe8e1','#e9f8f3']),TUFT=hx('#86b444'),TUFTL=hx('#cfe78e');
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const o=(y*W+x)*4;let col;
  const br=bridge[o+3]>127?bridge[o]:0;const isW=A(water,x,y),isPZ=A(plaza,x,y),isP=A(path,x,y)||isPZ;
  const P_=(x,y)=>A(path,x,y)||A(plaza,x,y);
  if(br){const b=M.bridges[Math.round(br)-1]||M.bridges[0];const dx=x-b.x*T,dy=y-b.y*T,u=dx*Math.cos(b.ang)+dy*Math.sin(b.ang),v=-dx*Math.sin(b.ang)+dy*Math.cos(b.ang),hw=b.wid/2*T;
   const av=Math.abs(v);if(av>hw-1)col=hx('#7a5c40');else if(av>hw-3)col=((u+400)%14<3)?hx('#8a6a48'):hx('#b88d5e');else{const pl=(u+400)%5;col=pl<1?hx('#a07a52'):(H((u+400)/5|0,0,5)<.3?hx('#d6ac76'):hx('#e2bb85'));if(pl==1)col=hx('#ecc995')}}
  else if(isW){let land=0;for(const d of [1,2,3,5])if(!A(water,x,y-d)||!A(water,x,y+d)||!A(water,x-d,y)||!A(water,x+d,y)){land=d;break}
   col=land==1?hx('#86c4bc'):land==2?WAb[2]:(fbm(x/50,y/26,3)>.6?WAb[1]:WAb[0]);
   const wv=(x+Math.floor(H(Math.floor(y/7),3,6)*40))%40;if(land!=1&&land!=2&&y%7==0&&wv<5)col=WAb[3];}
  else if(isP){const edge=!P_(x-1,y)||!P_(x+1,y)||!P_(x,y-1)||!P_(x,y+1);
   const rr=Math.hypot(x-pcx,y-pcy),fr=Math.hypot(x-60*T,(y-42*T)*1.25);
   if(isPZ&&fr>5.6*T&&fr<5.6*T+3)col=fr<5.6*T+1?hx('#d8c8a8'):hx('#f2e8d4');
   else if(isPZ&&!A(path,x,y)&&rr>pr*.55&&fbm(x/34,y/34,4)>.7)col=(H(x,y,3)<.04)?GRs[3]:GRs[1];
   else if(edge&&!isPZ)col=DT[0];
   else if(edge)col=DT[0];
   else{// tan dirt path with soft blotches + pebbles
    const f=fbm(x/14,y/14,8);col=f>.62?DT[1]:f<.36?DT[3]:DT[2];const ex=!P_(x-3,y)||!P_(x+3,y)||!P_(x,y-3)||!P_(x,y+3);if(ex)col=DT[1];
    const h=H(x>>2,y>>2,17);if(h<.06&&(x&3)<2&&(y&3)<1)col=DT[4];else if(h<.06&&(x&3)<2&&(y&3)==1)col=DT[0]}}
  else{let bank=0;for(let d=1;d<=5;d++)if(A(water,x,y+d)){bank=d;break}let lipS=0;for(let d=1;d<=2;d++)if(A(water,x,y-d)||A(water,x-d,y)||A(water,x+d,y)){lipS=d;break}
   if(bank&&bank<=4)col=bank==1?LIP[0]:bank<=3?LIP[bank==2?1:2]:OLc;
   else if(lipS)col=lipS==1?LIP[1]:OLc;
   else{const tx=x/T,ty=y/T,e=Math.min(tx,ty,M.MW-tx,M.MH-ty);const forest=e<6.5+Math.sin(tx*.7)*1.2;
    const nearP=P_(x,y-1)||P_(x,y+1)||P_(x-1,y)||P_(x+1,y);
    if(nearP)col=GEDGE;else{const f=fbm(x/70,y/70,1);col=forest?GRs[1]:(f>.62?GRs[2]:f<.32?GRs[1]:GRs[2]);
     // tufts: little "w" marks with highlight
     for(let s=0;s<2;s++){const cx=Math.floor(x/9),cy=Math.floor(y/9),h=H(cx,cy,13+s);if(h<.42){const qx=cx*9+1+Math.floor(H(cx,cy,14+s)*5),qy=cy*9+1+Math.floor(H(cx,cy,15+s)*5);
      if((y==qy+1&&(x==qx||x==qx+2||x==qx+4))||(y==qy+2&&(x==qx+1||x==qx+3)))col=TUFT;else if(y==qy&&(x==qx||x==qx+4))col=TUFTL}}
     const ftx=Math.floor(tx),fty=Math.floor(ty);if(!forest&&H(ftx,fty,9)<.12){const qx=ftx*T+3+Math.floor(H(ftx,fty,10)*10),qy=fty*T+3+Math.floor(H(ftx,fty,11)*10),dd=Math.abs(x-qx)+Math.abs(y-qy);
      if(dd==0)col=hx('#fff4a8');else if(dd==1)col=hx(['#ffffff','#f8c8d4','#fff0a0','#e8d0f4'][Math.floor(H(ftx,fty,12)*4)])}}}}
  D[o]=col[0];D[o+1]=col[1];D[o+2]=col[2];D[o+3]=255}
 gg.putImageData(img,0,0);
 // water decor: lily pads, rocks, reeds
 {const LP=[];for(let n=0;n<6000&&LP.length<140;n++){const x=H(n,5,41)*W|0,y=H(n,6,41)*Hh|0;if(!A(water,x,y)||bridge[(y*W+x)*4+3]>127)continue;let ok=true;for(const d of [8,10])if(!A(water,x-d,y)||!A(water,x+d,y)||!A(water,x,y-d)||!A(water,x,y+d))ok=false;
   const nearShore=!A(water,x,y+14)||!A(water,x,y-14);if(!ok)continue;LP.push([x,y,H(n,7,41),nearShore])}
  const [dc,dg]=C(W,Hh);LP.forEach(([x,y,h,ns])=>{if(h<.55){dg.fillStyle='#6fae58';dg.beginPath();dg.ellipse(x,y,5,3.2,0,0,7);dg.fill();dg.fillStyle='#8cc46a';dg.beginPath();dg.ellipse(x-1,y-1,3,1.8,0,0,7);dg.fill();dg.fillStyle='#a9dbd2';dg.fillRect(x+2,y-1,3,1);if(h<.15){dg.fillStyle='#f8c0d0';dg.fillRect(x-1,y-3,3,2);dg.fillStyle='#fff';dg.fillRect(x,y-3,1,1)}}
   else if(h<.8){dg.fillStyle='#a9a89a';dg.beginPath();dg.ellipse(x,y,4,2.6,0,0,7);dg.fill();dg.fillStyle='#cfcabb';dg.fillRect(x-2,y-2,3,1);dg.fillStyle='#e9f8f3';dg.fillRect(x-5,y+2,10,1)}
   else if(ns){dg.fillStyle='#6f9e48';for(let i=0;i<4;i++)dg.fillRect(x-3+i*2,y-5+(i%2)*2,1,6-(i%2)*2);dg.fillStyle='#a07a52';dg.fillRect(x-1,y-6,1,2)}});
  shade3D(dg,W,Hh,[96,120,90]);gg.drawImage(dc,0,0)}

 // flat details: hedges, gardens, flowerbeds, shadows
 const g=gg;
 M.parks.forEach(p=>{const L=LEAF.g,R0=p.r*T,cx=p.cx*T,cy=p.cy*T,ga=Math.atan2(M.plaza.cy-p.cy,M.plaza.cx-p.cx),gapA=1.6/p.r;
  const x0=Math.floor(cx-R0-12),y0=Math.floor(cy-R0-14),w=Math.ceil(R0*2+24),h=Math.ceil(R0*2+28);const [sc,sg]=C(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const X=x+x0,Y=y+y0,dx=X-cx,dy=(Y+4)-cy,d=Math.hypot(dx,dy);let da=Math.abs(Math.atan2(dy,dx)-ga);if(da>Math.PI)da=2*Math.PI-da;if(da<gapA)continue;
   const sc_=Math.sin(Math.atan2(dy,dx)*p.r*5)*1.2;if(Math.abs(d-R0+8)<6.5+sc_*.5){const inner=d-R0+8;const HG=['#4f8a40','#5f9c48','#74b056','#8cc466'];let k=1;if(dy<0?inner<-2:inner<-3.5)k=2;if(dy<0&&inner<-4.5)k=3;if(dy>0&&inner>3)k=0;sg.fillStyle=HG[k];sg.fillRect(x,y,1,1)}}
  shade3D(sg,w,h);g.drawImage(sc,x0,y0)});
 M.objects.forEach(o=>{const X=o.x*T,Y=o.y*T;
  if(o.k=='garden'){g.fillStyle='#5f3f28';g.fillRect(X-1,Y-1,o.w*T+2,o.h*T+2);for(let j=0;j<o.h*T;j++)for(let i=0;i<o.w*T;i++){const k=(j%8<2)?0:(j%8<4?2:1);g.fillStyle=rgb(DIRT[k]);g.fillRect(X+i,Y+j,1,1)}
   for(let j=0;j<o.h*2;j++)for(let i=0;i<o.w*2;i++){const cx=X+4+i*8,cy=Y+4+j*8;if(o.v==0){g.fillStyle='#4f8a4a';g.fillRect(cx-2,cy-2,5,4);g.fillStyle='#8fcf6a';g.fillRect(cx-1,cy-2,2,2)}else if(o.v==1){g.fillStyle='#5f9c4e';g.fillRect(cx,cy-4,1,4);g.fillRect(cx-2,cy-3,1,3);g.fillRect(cx+2,cy-3,1,3);g.fillStyle='#f08a3a';g.fillRect(cx-1,cy,3,2)}else{g.fillStyle='#4f8a4a';g.fillRect(cx-1,cy-3,3,4);g.fillStyle='#e8524a';g.fillRect(cx-1,cy-1,2,2)}}
   for(let i=0;i<=o.w*T;i+=4){g.fillStyle='#d8ac84';g.fillRect(X-2+i,Y-6,2,7);g.fillRect(X-2+i,Y+o.h*T-6,2,7);g.fillStyle='#946545';g.fillRect(X-1+i,Y-6,1,7)}
   g.fillStyle='#c4926a';g.fillRect(X-2,Y-4,o.w*T+4,1);g.fillRect(X-2,Y+o.h*T-4,o.w*T+4,1);for(let j=0;j<=o.h*T;j+=4){g.fillStyle='#d8ac84';g.fillRect(X-2,Y-6+j,2,6);g.fillRect(X+o.w*T,Y-6+j,2,6)}}
  if(o.k=='flowerbed'){if(!o.wild)for(let j=0;j<12;j++)for(let i=0;i<30;i++){const d=Math.hypot((i-15)/15,(j-6)/6);if(d>1)continue;g.fillStyle=d>.88?'#8a6a4f':'#c9a57e';g.fillRect(X+i+1,Y+j+2,1,1)}
   for(let n=0;n<14;n++){const i=3+H(n,o.v,1)*24|0,j=4+H(n,o.v,2)*6|0;g.fillStyle='#4f8a4a';g.fillRect(X+i,Y+j+1,2,2);g.fillStyle=FLW[(n+o.v)%7];g.fillRect(X+i,Y+j,2,2)}}});
 // wooden fence around the campfire clearing
 {const cf=M.objects.find(o=>o.k=='campfire');if(cf){const x0=(cf.x-4)*T,y0=(cf.y-4)*T,x1=(cf.x+5)*T,y1=(cf.y+5)*T,[fc,fg]=C(W,Hh);
  const seg=(ax,ay,bx,by)=>{const n=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let i=0;i<=n;i++){const x=ax+(bx-ax)*i/n|0,y=ay+(by-ay)*i/n|0;fg.fillStyle='#c79a68';fg.fillRect(x,y-6,1,2);fg.fillRect(x,y-2,1,2);if(i%8==0){fg.fillStyle='#b0855a';fg.fillRect(x-1,y-9,3,10);fg.fillStyle='#dcb282';fg.fillRect(x-1,y-9,1,10)}}};
  const mx=(x0+x1)/2;seg(x0,y0,x1,y0);seg(x0,y0,x0,y1);seg(x1,y0,x1,y1);seg(x0,y1,mx-24,y1);seg(mx+24,y1,x1,y1);shade3D(fg,W,Hh,[110,80,50]);g.drawImage(fc,0,0)}}
 // static object sprites (sorted) + occluder index
 const objs=[];let statue=null;const cache={};const get=(key,f)=>cache[key]||(cache[key]=f());const anims=[];
 M.objects.forEach(o=>{let s,bx,by;if(o.flat||o.k=='garden')return;const X=o.x*T,Y=o.y*T;
  switch(o.k){case 'tree':s=get('t'+o.v+o.pine,()=>treeSprite(o.v,o.pine));bx=X+8+o.jx;by=Y+14+o.jy;break;
   case 'bush':s=get('b'+o.v,()=>bushSprite(o.v));bx=X+8;by=Y+14;break;
   case 'house':s=houseSprite(o);bx=X;by=Y+o.h*T;break;
   case 'church':s=get('ch',churchSprite);bx=X;by=Y+o.h*T;break;
   case 'clock':s=get('cl',clockSprite);bx=X;by=Y+o.h*T;break;
   case 'gazebo':s=get('gz',gazeboSprite);bx=X;by=Y+o.h*T;break;
   case 'fountain':s=get('fb',()=>fountainSprite(1));bx=X;by=Y+o.h*T;anims.push({k:'jet',x:bx-s.ox+s.jet.x+s.ox,y:by,j:s.jet,big:1});break;
   case 'pfountain':s=get('fs',()=>fountainSprite(0));bx=X;by=Y+o.h*T;anims.push({k:'jet',x:bx+s.jet.x,y:by,j:s.jet,big:0});break;
   case 'stall':s=get('st'+o.v,()=>stallSprite(o.v));bx=X;by=Y+o.h*T;break;
   case 'cart':s=get('ca'+o.v,()=>cartSprite(o.v));bx=X;by=Y+o.h*T;break;
   case 'plamp':s=get('plp',plampSprite);bx=X+8;by=Y+14;anims.push({k:'glow',x:bx,y:by-50});break;
   case 'statue':statue={x:X+o.w*T/2,base:Y+o.h*T};return;
   case 'lamp':s=get('lp',lampSprite);bx=X+8;by=Y+14;anims.push({k:'glow',x:bx,y:by-34});break;
   case 'bench':case 'benchv':{const inP=Math.hypot(o.x-M.plaza.cx,o.y-M.plaza.cy)<M.plaza.r;s=get((inP?'cb':'bn')+o.v,()=>inP?cbenchSprite(o.v):benchSprite(o.v))};bx=X;by=Y+(o.v==1?3:o.v==0?-1:1);break;
   case 'log':case 'logv':s=get('lg'+(o.k=='logv'),()=>logSprite(o.k=='logv'));bx=X;by=Y+(o.k=='logv'?1:(o.v==1?1:-1));break;
   case 'chair':s=get('cr'+o.v,()=>chairSprite(o.v));bx=X;by=Y-1;break;
   case 'table':s=get('tb',tableSprite);bx=X+8;by=Y+14;break;
   case 'campfire':s=get('cf',()=>propSprite('campfire'));bx=X+8;by=Y+12;anims.push({k:'fire',x:bx,y:by-6});break;
   case 'gate':s=get('gt',()=>propSprite('gate'));bx=X;by=Y+o.h*T;break;
   default:s=get(o.k+o.v,()=>propSprite(o.k,o.v));bx=X+(o.k=='well'?16:8);by=Y+(o.k=='well'?30:14);}
  if(!s)return;if(!s.ol&&o.k!='tree'&&o.k!='bush'){shade3D(s.c.getContext('2d'),s.c.width,s.c.height);s.ol=1}if(s.chim)anims.push({k:'smoke',x:bx-s.ox+s.chim.x,y:by-s.c.height+s.chim.y+4,p:o.seed||0});
  objs.push({fh:/house|church|clock|stall|cart|well|gazebo/.test(o.k)?o.h*T:0,img:s.c,x:Math.round(bx-s.ox),y:Math.round(by-s.oy),w:s.c.width,h:s.c.height,base:by,k:o.k,low:/bench|log|chair|rock|crate|barrel|pot|campfire/.test(o.k)})});
 objs.sort((a,b)=>a.base-b.base);
 // soft drop shadows (light from top-left -> shadow bottom-right)
 g.save();g.fillStyle='rgba(70,110,30,.2)';objs.forEach(o=>{if(o.k=='tree'){g.beginPath();g.ellipse(o.x+o.w/2,o.base+1,o.w*.34,4,0,0,7);g.fill()}else if(/house|church|clock|stall|cart|well|gazebo/.test(o.k)){g.fillRect(o.x+8,o.base-2,o.w-8,5);g.fillRect(o.x+o.w-4,o.base-o.fh+6,5,o.fh-3)}else if(o.k!='gate'&&o.k!='wall'){g.beginPath();g.ellipse(o.x+o.w/2+2,o.base,o.w*.4,2.5,0,0,7);g.fill()}});g.restore();
 const [wc,wg]=C(W,Hh);wg.drawImage(gc,0,0);objs.forEach(o=>wg.drawImage(o.img,o.x,o.y));
 // occluder grid
 const GS=64,grid={};objs.forEach((o,i)=>{if(o.low)return;for(let gy=Math.floor(o.y/GS);gy<=Math.floor((o.y+o.h)/GS);gy++)for(let gx=Math.floor(o.x/GS);gx<=Math.floor((o.x+o.w)/GS);gx++)(grid[gx+','+gy]=grid[gx+','+gy]||[]).push(i)});
 // water sparkles + boats
 const sp=[];for(let n=0;n<4000&&sp.length<900;n++){const x=H(n,1,31)*W|0,y=H(n,2,31)*Hh|0;if(A(water,x,y)&&A(water,x,y-6)&&A(water,x,y+6)&&!(bridge[(y*W+x)*4+3]>127))sp.push([x,y,H(n,3,31)*10])}
 const boats=[{t:0,s:.00002,c:'#e87878'},{t:.5,s:-.000016,c:'#78a8e0'}];
 // minimap
 const [mc,mg]=C(240,180);mg.imageSmoothingEnabled=true;mg.drawImage(wc,0,0,240,180);
 return{statue,world:wc,ground:gc,objs,grid,GS,anims,sp,boats,mini:mc,W,H:Hh,river:M.river}}
function drawAnims(ctx,B,cam,vw,vh,now){const vis=(x,y,m=40)=>x>cam.x-m&&y>cam.y-m&&x<cam.x+vw+m&&y<cam.y+vh+m;
 ctx.fillStyle='#ffffff';for(const s of B.sp){if(!vis(s[0],s[1]))continue;const ph=(now/900+s[2])%4;if(ph<2.6)ctx.fillRect(s[0]-cam.x,s[1]-cam.y,1,1);else if(ph<3){ctx.fillRect(s[0]-cam.x-1,s[1]-cam.y,3,1);ctx.fillRect(s[0]-cam.x,s[1]-cam.y-1,1,3)}}
 // boats along river
 const pts=B.river.pts,T=16;B.boats.forEach(b=>{let t=((b.t+now*b.s)%1+1)%1;const f=t*(pts.length-1),i=Math.floor(f),a=pts[i],c=pts[Math.min(pts.length-1,i+1)],x=(a[0]+(c[0]-a[0])*(f-i))*T,y=(a[1]+(c[1]-a[1])*(f-i))*T+((i%3)-1)*8;if(!vis(x,y))return;
  const X=Math.round(x-cam.x),Y=Math.round(y-cam.y+Math.sin(now/500)*1);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(X-14,Y+4,28,1);ctx.fillStyle='#5f3f28';ctx.fillRect(X-12,Y-2,24,6);ctx.fillStyle='#946545';ctx.fillRect(X-10,Y-3,20,3);ctx.fillStyle='#c4926a';ctx.fillRect(X-10,Y-3,20,1);
  ctx.fillStyle=b.c;ctx.fillRect(X-12,Y+1,24,2);ctx.fillStyle='#7a5234';ctx.fillRect(X-1,Y-14,1,12);ctx.fillStyle='#fbf3e4';ctx.beginPath();ctx.moveTo(X,Y-14);ctx.lineTo(X+9,Y-4);ctx.lineTo(X,Y-4);ctx.fill()});
 for(const a of B.anims){if(!vis(a.x,a.y,80))continue;const X=a.x-cam.x,Y=a.y-cam.y;
  if(a.k=='jet'){const j=a.j,top=Y+j.y;if(j.blue){const t2=Y+j.top2;ctx.lineWidth=2;
    for(let i=0;i<4;i++){const sx=i<2?-1:1,far=i%2?30:18;ctx.strokeStyle=i%2?'#5aa0e0':'#7cc0f4';ctx.beginPath();ctx.moveTo(X,top+2);ctx.quadraticCurveTo(X+sx*far*.5,top-14-(i%2)*4,X+sx*far,t2+(i%2?16:4));ctx.stroke()}
    ctx.strokeStyle='#a8dcff';ctx.beginPath();ctx.moveTo(X,top+2);ctx.lineTo(X,top-10-((now/150|0)%3));ctx.stroke();ctx.fillStyle='#d8f0ff';
    for(let i=0;i<14;i++){const ph=((now/700)+i/14)%1,sx=i%2?-1:1,far=i%4<2?18:30;const xx=X+sx*far*ph,yy=top-14*Math.sin(ph*Math.PI)+(t2+10-top)*ph*ph;ctx.fillRect(xx|0,yy|0,2,2)}
    const rp=(now/1100)%1;ctx.strokeStyle=`rgba(200,235,255,${.7*(1-rp)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(X,Y+j.cy+2,8+rp*36,4+rp*14,0,0,7);ctx.stroke()}
   else{ctx.fillStyle='rgba(220,245,255,.9)';for(let i=0;i<7;i++){const ph=((now/900)+i/7)%1,ang=i*2.4;const r=ph*9,x=X+Math.cos(ang)*r,y=top+(-Math.sin(ph*Math.PI)*4)+ph*8;ctx.fillRect(x|0,y|0,1,2)}}}
  if(a.k=='cfire'){const f=.75+.15*Math.sin(now/90)+.1*Math.sin(now/37+1.3),gr=ctx.createRadialGradient(X,Y,2,X,Y,46*f);gr.addColorStop(0,`rgba(255,170,70,${.32*f})`);gr.addColorStop(1,'rgba(255,140,60,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(X,Y,46*f,0,7);ctx.fill();
   for(let e=0;e<4;e++){const t=((now/1400)+e/4)%1,ex=X+Math.sin(now/300+e*2)*5*t+(e-1.5)*2,ey=Y-6-t*30;ctx.fillStyle=`rgba(255,${180+e*15},90,${.9*(1-t)})`;ctx.fillRect(Math.round(ex),Math.round(ey),2,2)}}
  if(a.k=='glow'){ctx.fillStyle=`rgba(255,230,140,${.12+.05*Math.sin(now/300+a.x)})`;ctx.beginPath();ctx.arc(X,Y,9,0,7);ctx.fill()}
  if(a.k=='fire'){ctx.fillStyle=`rgba(255,180,80,${.14+.04*Math.sin(now/120)})`;ctx.beginPath();ctx.arc(X,Y,26,0,7);ctx.fill();const f=now/90|0;
   for(let i=0;i<7;i++){const h=5+((i*7+f*3)%7);ctx.fillStyle=['#ff7a1a','#ffb02a','#ffe060'][i%3];ctx.fillRect(X-7+i*2,Y+2-h,2,h)}ctx.fillStyle='#fff6c0';ctx.fillRect(X-1,Y-3,2,3);
   for(let i=0;i<3;i++){const ph=((now/700)+i/3)%1;ctx.fillStyle=`rgba(255,200,80,${1-ph})`;ctx.fillRect(X-2+Math.sin(ph*9+i)*4|0,Y-6-ph*18|0,1,1)}}
  if(a.k=='smoke'){for(let i=0;i<3;i++){const ph=((now/2200)+i/3+a.p%7/7)%1;ctx.fillStyle=`rgba(240,240,240,${.55*(1-ph)})`;const r=2+ph*4;ctx.fillRect(X+Math.sin(ph*5+i)*3-r/2|0,Y-ph*22-r/2|0,r|0,r|0)}}}}
function occluders(B,x0,y0,x1,y1,base){const out=new Set();for(let gy=Math.floor(y0/B.GS);gy<=Math.floor(y1/B.GS);gy++)for(let gx=Math.floor(x0/B.GS);gx<=Math.floor(x1/B.GS);gx++){const l=B.grid[gx+','+gy];if(l)for(const i of l){const o=B.objs[i];if(o.base>base&&o.x<x1&&o.x+o.w>x0&&o.y<y1&&o.y+o.h>y0)out.add(i)}}return[...out].sort((a,b)=>a-b).map(i=>B.objs[i])}
G.Render={bake,drawAnims,occluders,shade3D}})(this);
