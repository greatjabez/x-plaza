// Deterministic town generator shared by server (collision/seats) and client (rendering).
(function(G){
function MapGen(){
const T=16,MW=120,MH=90,N=MW*MH;
let seed=20261103;const R=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
const ground=new Uint8Array(N),solid=new Uint8Array(N),resv=new Uint8Array(N);// ground:0 grass 1 path 2 plaza 3 water 4 bridge 5 dirt
const I=(x,y)=>y*MW+x,inb=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH;
function cr(pts,n=8){if(pts.length<3)return pts;const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
 for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;out.push([0,1].map(j=>0.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}out.push(pts[pts.length-1]);return out}
function dseg(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((px-a[0])*dx+(py-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)}
function dpoly(px,py,pts){let m=1e9;for(let i=0;i<pts.length-1;i++){const d=dseg(px,py,pts[i],pts[i+1]);if(d<m)m=d}return m}
const plaza={cx:60,cy:42,r:15};
const rp=[];for(let x=-4;x<=124;x+=4)rp.push([x,66+5.5*Math.sin(x/13)+2.2*Math.sin(x/5.1+1)]);
const river={w:5,pts:cr(rp,4)};
const P=(w,pts)=>({w,pts:cr(pts)});
const paths=[P(3.2,[[60,30],[60,18],[60,10.5]]),P(3.4,[[60,55],[60,72],[60,91]]),
 P(3,[[74,43],[88,41],[102,45],[122,43]]),P(3,[[46,43],[32,45],[18,41],[-2,43]]),
 P(2.6,[[70,32],[80,23],[94,17],[108,14]]),P(2.6,[[50,32],[40,23],[26,17],[12,14]]),
 P(2.6,[[71,52],[82,59],[91,60.5],[97.5,63.2]]),P(2.6,[[49,52],[38,59],[30,70],[25,86]]),
 P(2.2,[[108,14],[111,28],[102,45]]),
 P(2.2,[[25,86],[42,81],[60,80],[78,81],[95,86]]),
 {w:2.4,ring:1,pts:Array.from({length:61},(_,i)=>{const a=(125+i/60*290)*Math.PI/180;return[60+Math.cos(a)*31,41+Math.sin(a)*19.5]})},
 P(2,[[30,45],[30,58],[22,62]]),P(2,[[90,41],[92,56],[100,62]]),P(2,[[40,23],[44,12],[52,8]]),P(2,[[80,23],[76,12],[68,8]])];
paths.push(P(2.6,[[50.3,53],[44,52.5],[35,49],[25,45.5],[15,43]]));
paths.push(P(2.6,[[81.8,72.6],[84,77],[90,81.5],[95,86]]));
// bridges where paths cross the river
const rY=x=>{for(let i=0;i<river.pts.length-1;i++){const a=river.pts[i],b=river.pts[i+1];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return 66};
const bridges=[];paths.forEach(p=>{for(let i=0;i<p.pts.length-1;i++){const a=p.pts[i],b=p.pts[i+1],fa=a[1]-rY(a[0]),fb=b[1]-rY(b[0]);
 if(fa<0&&fb>=0){const t=fa/(fa-fb),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),ra=Math.atan2(rY(x+.5)-rY(x-.5),1),sn=Math.max(.45,Math.abs(Math.sin(ang-ra)));bridges.push({x,y,ang,len:river.w/sn+4,wid:p.w+0.8})}}});
// pavilion island (assets/pav_island.png 737x642, island grass centre at img (370,470)) replaces the east diagonal bridge
const pv={cx:89,cy:68.1,s:.2,ic:[370,470],irx:4.1,iry:2.0,prx:8,pry:5,ang:1.054};
{const k=bridges.findIndex(b=>Math.abs(b.x-pv.cx)<3&&Math.abs(b.y-pv.cy)<3);if(k>=0)bridges.splice(k,1)}
pv.ox=pv.cx*T-pv.ic[0]*pv.s;pv.oy=pv.cy*T-pv.ic[1]*pv.s;
pv.br=[{x:94.5,y:65.2,ang:-0.565,len:6.6,wid:3,flip:1},{x:pv.cx-0.845*4.9,y:pv.cy+0.535*4.9,ang:-0.565,len:7.4,wid:3,flip:1}];
// river widened smoothly around the island (same river: union of circles along the centreline, gaussian bulge)
pv.wide=[];for(let x=pv.cx-14;x<=pv.cx+14;x+=.35){const y=rY(x);pv.wide.push([x,y,river.w/2+3.6*Math.exp(-(((x-pv.cx)/4.6)**2))])}
const inW=(x,y,d=0)=>pv.wide.some(c=>Math.hypot(x-c[0],y-c[1])<c[2]+d);
const inEl=(x,y,rx,ry)=>((x-pv.cx)/rx)**2+((y-pv.cy)/ry)**2<1;
const inIsl=(x,y)=>((x-pv.cx-.15)/4.5)**2+((y-pv.cy+.35)/2.35)**2<1;
const inPB=(px,py)=>pv.br.some(b=>{const dx=px-b.x,dy=py-b.y,u=dx*Math.cos(b.ang)+dy*Math.sin(b.ang),v=-dx*Math.sin(b.ang)+dy*Math.cos(b.ang);return Math.abs(u)<b.len/2&&Math.abs(v)<b.wid/2});
const inBridge=(px,py)=>bridges.some(b=>{const dx=px-b.x,dy=py-b.y,u=dx*Math.cos(b.ang)+dy*Math.sin(b.ang),v=-dx*Math.sin(b.ang)+dy*Math.cos(b.ang);return Math.abs(u)<b.len/2&&Math.abs(v)<b.wid/2});
for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const cx=x+.5,cy=y+.5,i=I(x,y);
 if(inIsl(cx,cy)){ground[i]=0;resv[i]=1;const u=(cx*T-pv.ox)/pv.s,v=(cy*T-pv.oy)/pv.s;if((u>300&&u<590&&v>300&&v<470)||(Math.abs(u-205)<40&&v>290&&v<360))solid[i]=1;continue}
 if(inPB(cx,cy)&&inW(cx,cy,1.5)){ground[i]=4;resv[i]=1;continue}
 if(inW(cx,cy)){ground[i]=3;solid[i]=1;resv[i]=1;continue}
 if(inW(cx,cy,1.3))resv[i]=1;
 const dw=dpoly(cx,cy,river.pts);if(dw<river.w/2){ground[i]=inBridge(cx,cy)?4:3;if(ground[i]==3)solid[i]=1;resv[i]=1;continue}
 if(Math.hypot(cx-plaza.cx,cy-plaza.cy)<plaza.r){ground[i]=2;resv[i]=1;continue}
 for(const p of paths)if(dpoly(cx,cy,p.pts)<p.w/2){ground[i]=1;resv[i]=1;break}
 if(dw<river.w/2+1.2)resv[i]=1}
const objects=[],seats=[];
const free=(x,y,w,h,m=0)=>{for(let j=y-m;j<y+h+m;j++)for(let i=x-m;i<x+w+m;i++){if(!inb(i,j)||resv[I(i,j)])return false}return true};
const mark=(x,y,w,h,s=1,m=0)=>{for(let j=y-m;j<y+h+m;j++)for(let i=x-m;i<x+w+m;i++)if(inb(i,j)){resv[I(i,j)]=1;if(s&&j>=y&&j<y+h&&i>=x&&i<x+w)solid[I(i,j)]=1}};
const add=(k,x,y,w,h,v=0,s=1,extra)=>{const o=Object.assign({k,x,y,w,h,v},extra||{});objects.push(o);if(s)mark(x,y,w,h,1);else mark(x,y,w,h,0);return o};
const seat=(x,y,dir,kind)=>{seats.push({x:Math.round(x*T),y:Math.round(y*T),dir,kind});};
const shrine=null;
// NE rocket launchpad: painted 3-tier hill (assets/hill.png, 1024x768 display px scaled by hill.s, origin ox,oy).
// Geometry traced from the painting: tier ellipses (cx,cy,rx,ry in image px) + front cliff height; stairs rects (lv,x0,y0,x1,y1).
// Logical (collision) position = display position + lv*TE. A tile is level L if its display point (y-L*TE) lies on tier L's top;
// it is solid if that display point lies inside a higher tier's silhouette (top + cliff). Stairs override with a ramp.
const TE=14,tiers=[];
const hill={ox:1262,oy:112,s:.55,iw:1024,ih:768,T:[[527,422,412,138,100],[522,308,300,117,78],[528,178,200,107,58]],
 S:[[1,205,485,300,605],[1,757,490,855,620],[2,285,360,380,485],[2,668,360,770,490],[3,355,240,445,350],[3,605,240,695,345]],pad:[523,163]};
const hgt=new Int16Array(N),ramps=[];
function mound(h,extra){const s=h.s,NT=h.T.length,inT=(L,x,y)=>{const t=h.T[L-1],u=((x-h.ox)/s-t[0])/t[2],v=((y-h.oy)/s-t[1])/t[3];return u*u+v*v<=1},
 sil=(L,x,y)=>{const c=h.T[L-1][4]*s;for(let d=0;d<=c;d+=3)if(inT(L,x,y-d))return true;return false};
 h.S.forEach(([l,x0,y0,x1,y1])=>{const w=(x1-x0)*s,X0=h.ox+x0*s+w*.12,X1=h.ox+x1*s-w*.12,xc=(X0+X1)/2;let Y0=h.oy+y0*s+l*TE,Y1=h.oy+y1*s+(l-1)*TE;
  while(!inT(l,xc,Y0-8-l*TE)&&Y0>0)Y0-=4;while(sil(l,xc,Y1+8-(l-1)*TE))Y1+=4;ramps.push({lv:l,x0:X0,x1:X1,y0:Y0,y1:Y1+6})});
 const bx0=Math.floor(h.ox/T),bx1=Math.ceil((h.ox+h.iw*s)/T),by0=Math.max(0,Math.floor(h.oy/T)),by1=Math.ceil((h.oy+h.ih*s)/T)+1;h.box=[bx0,by0,bx1,by1];
 for(let ty=by0;ty<by1;ty++)for(let tx=bx0;tx<bx1;tx++){if(!inb(tx,ty))continue;const i=I(tx,ty),x=tx*T+8,y=ty*T+8;
  if([...Array(NT).keys()].map(k=>k+1).some(k=>sil(k,x,y)||sil(k,x,y-24)||sil(k,x,y+28)||sil(k,x-20,y+8)||sil(k,x+20,y+8)||inT(k,x,y-k*TE)))resv[i]=1;
  let L=0;for(let k=NT;k>=1;k--)if(inT(k,x,y-k*TE)){L=k;break}hgt[i]=L*TE;solid[i]=L>0||ground[i]!=3?0:solid[i];if(L>0)ground[i]=ground[i]==3?0:ground[i];
  if(extra&&extra(x,y-L*TE,L))solid[i]=1;for(let k=L+1;k<=NT;k++)if([0,-6,6].some(dx=>sil(k,x+dx,y-L*TE))||sil(k,x,y-L*TE+7))solid[i]=1;
  const r=ramps.find(r=>x>=r.x0&&x<r.x1&&y>=r.y0-2&&y<r.y1+2);if(r){solid[i]=0;hgt[i]=-1}}
 const ev=i=>{if(hgt[i]>=0)return hgt[i];const x=(i%MW)*T+8,y=Math.floor(i/MW)*T+8,r=ramps.find(r=>x>=r.x0&&x<r.x1&&y>=r.y0-2&&y<r.y1+2);return TE*(r.lv-Math.min(1,Math.max(0,(y-r.y0)/(r.y1-r.y0))))};
 for(let ty=by0;ty<by1;ty++)for(let tx=bx0;tx<bx1;tx++){const i=I(tx,ty);if(solid[i])continue;for(const[a,b]of[[1,0],[0,1]]){const j=I(tx+a,ty+b);if(!inb(tx+a,ty+b)||solid[j])continue;const d=ev(i)-ev(j);if(Math.abs(d)>9){const lo=d<0?i:j,hi=d<0?j:i;solid[hgt[lo]>=0||hgt[hi]<0?lo:hi]=1}}}}
mound(hill);
const launch={hill,rocket:{x:hill.ox+hill.pad[0]*hill.s,y:hill.oy+hill.pad[1]*hill.s+3*TE}};
{const rx=Math.floor(launch.rocket.x/T),ry=Math.floor(launch.rocket.y/T);for(let j=ry-1;j<=ry;j++)for(let i=rx-1;i<=rx+1;i++)solid[I(i,j)]=1}
// raised temple plaza: painted platform (assets/plaza.png) one level up, temple at the back, fountain + 2 benches in front
const pz={ox:576,oy:320,s:.75,iw:1024,ih:768,T:[[512,470,332,170,55]],S:[[1,262,575,350,672],[1,690,572,775,668]]};
pz.fountain={x:pz.ox+512*pz.s,y:pz.oy+540*pz.s+TE};pz.statue={x:pz.ox+512*pz.s,base:pz.oy+345*pz.s+TE,lift:TE};
mound(pz,(x,y)=>{const u=(x-pz.ox)/pz.s,v=(y-pz.oy)/pz.s;if(u>345&&u<678&&v>235&&v<447)return true;if(((u-512)/40)**2+((v-536)/26)**2<1)return true;if((Math.abs(u-260)<16||Math.abs(u-752)<16)&&v>395&&v<425)return true;return false});
pz.benches=[].map(([dx,dy,dir])=>({x:pz.fountain.x+dx,y:pz.fountain.y+dy,dir}));pz.benches.forEach(b=>seats.push({x:Math.round(b.x),y:Math.round(b.y),dir:b.dir,kind:'pbench'}));
// west terraced hill (assets/terrain.png): 3 tiers, waterfall + pond, pale-white roadster on top, stream + bridge at the foot
const tr={ox:48,oy:282,s:.55,iw:1024,ih:768,T:[[520,540,380,125,45],[540,385,330,115,75],[500,185,235,78,100]],S:[[1,285,585,410,670],[2,325,450,400,545],[2,640,490,715,590],[3,365,200,450,360]],wm:'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000000000000000000000001111111111111000000000000000000000000000000000000000000000000000111111111111100000000000000000000000000000000000000000000000000001111111111100000000000000000000000000000000000000000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000001001000000000000000000000000000000000000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000000000000000000000000000000000000001111100000000000000000000000000000000000000000000000000000000000111111110000000000000000000000000000000000000000000000000000000000011110000001000000000000000000000000000000000000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000111111000000000000000000000000000000000000000000000000000000000011111110000000000000000011000000000000000000000000000000000000000011111111000000000001111111000000000000000000000000000000000000000011111111111111111100001000000000000000000000000000000000000000000011111111111111100000000000000000000000000000000000000000000000000001110000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'};
mound(tr,(x,y,L)=>{const u=(x-tr.ox)/tr.s,v=(y-tr.oy)/tr.s;if(u<0||v<0||u>=1024||v>=768)return false;if(L==3&&u>280&&v>125&&((u<470&&v<228)||(u<540&&v<205)))return true;return tr.wm[Math.floor(v/16)*64+Math.floor(u/16)]=='1'&&!(u>285&&u<410&&v>585&&v<670)});
add('statue',58,35,5,2,0,0);
// parks with hedges
const parks=[{cx:90,cy:38,r:5.6},{cx:45,cy:74.5,r:4.6},{cx:79,cy:74.5,r:4.6}];
parks.forEach((p,pi)=>{const ga=Math.atan2(plaza.cy-p.cy,plaza.cx-p.cx);p.hedge=[];
 for(let y=Math.floor(p.cy-p.r-1);y<=p.cy+p.r+1;y++)for(let x=Math.floor(p.cx-p.r-1);x<=p.cx+p.r+1;x++){if(!inb(x,y))continue;const d=Math.hypot(x+.5-p.cx,y+.5-p.cy);if(d>p.r+.6)continue;
  const i=I(x,y);if(ground[i]==1||ground[i]==3)continue;resv[i]=1;
  if(d>p.r-.6){let da=Math.abs(Math.atan2(y+.5-p.cy,x+.5-p.cx)-ga);if(da>Math.PI)da=2*Math.PI-da;if(da*p.r>1.6){solid[i]=1;p.hedge.push([x,y])}else ground[i]=1}}
 const fx=Math.floor(p.cx)-1,fy=Math.floor(p.cy)-1;objects.push({k:'flowerbed',x:fx,y:fy+1,w:3,h:1,v:pi+7,flat:1});
 seat(p.cx,p.cy-2.4,0,'bench');seat(p.cx,p.cy+3.2,1,'bench');if(p.r>5){seat(p.cx-3.1,p.cy+.4,3,'benchv');seat(p.cx+3.1,p.cy+.4,2,'benchv')}
 [[-3,-3],[2,-3],[-3,2],[2,2]].forEach(([a,b])=>{if(p.r>5)objects.push({k:'flowerbed',x:Math.floor(p.cx)+a,y:Math.floor(p.cy)+b,w:2,h:1,v:pi+a+b,flat:1})});});
// campfire clearing (painted decal assets/cf_ground.png 655x459 + light rig assets/cf_lights.png 808x312)
const cf={cx:1590,cy:620,s:.36,fire:[325,205],B:[[200,105,0],[452,105,0],[186,290,1],[465,290,1]],S:[[105,205,3],[543,148,2],[528,212,2]]};
cf.ox=cf.cx-cf.fire[0]*cf.s;cf.oy=cf.cy-cf.fire[1]*cf.s;const cP=(u,v)=>[cf.ox+u*cf.s,cf.oy+v*cf.s];
for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const dx=(tx*T+8-cf.cx)/(330*cf.s+20),dy=(ty*T+8-cf.cy)/(235*cf.s+44);if(dx*dx+dy*dy<1)resv[I(tx,ty)]=1}
{const fx=Math.floor(cf.cx/T),fy=Math.floor(cf.cy/T);for(let j=fy-1;j<=fy;j++)for(let i=fx-1;i<=fx+1;i++)solid[I(i,j)]=1}
cf.B.forEach(([u,v,d])=>{const[x,y]=cP(u,v);[-16,16].forEach(o=>solid[I(Math.floor((x+o)/T),Math.floor(y/T))]=1);seats.push({x:Math.round(x),y:Math.round(y+2),dir:d,kind:'cfseat'})});
cf.S.forEach(([u,v,d])=>{const[x,y]=cP(u,v);seats.push({x:Math.round(x),y:Math.round(y+2),dir:d,kind:'cfseat'})});
cf.ls=.29;cf.lx=cf.cx-404*cf.ls;cf.ly=cf.cy-60-170*cf.ls;cf.posts=[[12,300],[255,170],[552,170],[792,300]].map(([u,v])=>[cf.lx+u*cf.ls,cf.ly+v*cf.ls]);
parks.forEach(p=>{p.hedge=(p.hedge||[]).filter(([x,y])=>{const dx=(x*T+8-cf.cx)/(330*cf.s+16),dy=(y*T+8-cf.cy)/(235*cf.s+16),inn=dx*dx+dy*dy<1;if(inn)solid[I(x,y)]=0;return !inn})});
parks.forEach(p=>{p.hedge=p.hedge.filter(([x,y])=>{const b=pv.br[1],ex=b.x-Math.cos(b.ang)*b.len/2,ey=b.y-Math.sin(b.ang)*b.len/2,bad=Math.hypot(x+.5-ex,y+.5-ey)<3.2||Math.hypot(x+.5-b.x,y+.5-b.y)<3.6;if(bad)solid[I(x,y)]=0;return !bad})});
cf.lamps=[[cf.cx-112,cf.cy+34],[cf.cx+114,cf.cy+14]];cf.lamps.forEach(([x,y])=>solid[I(Math.floor(x/T),Math.floor((y-3)/T))]=1);
cf.posts.forEach(([x,y])=>solid[I(Math.floor(x/T),Math.floor((y-3)/T))]=1);
// cozy tree ring around the campfire clearing (keeps path entrances open)
for(let n=0;n<84;n++){const a=n/42*Math.PI*2+(n>=42?.07:0),rr=n>=42?1.55:1.2+(n%2)*.1,px=cf.cx+Math.cos(a)*(330*cf.s+20)*rr,py=cf.cy+Math.sin(a)*(235*cf.s+44)*rr,tx=Math.floor(px/T),ty=Math.floor(py/T);
 if(!inb(tx,ty)||solid[I(tx,ty)])continue;let ok=true;for(let j=-1;j<=1&&ok;j++)for(let i=-1;i<=1;i++){const k=I(tx+i,ty+j);if(inb(tx+i,ty+j)&&(ground[k]==1||ground[k]>=3||hgt[k]!==0||(solid[k]&&!objects.some(o=>o.k=='tree'&&o.x==tx+i&&o.y==ty+j)))){ok=false;break}}for(let j=-3;j<=0&&ok;j++)if(inb(tx,ty+j)&&hgt[I(tx,ty+j)]!==0)ok=false
 if(!ok)continue;if(objects.some(o=>o.k=='tree'&&Math.abs(o.x-tx)<2&&Math.abs(o.y-ty)<2))continue;
 objects.push({k:'tree',x:tx,y:ty,w:1,h:1,v:n,pink:n%3!=1,big:1,jx:Math.round((px-tx*T-8)),jy:0});solid[I(tx,ty)]=1;resv[I(tx,ty)]=1}
// seats become objects (non-solid sprites) + reserve their tiles
seats.forEach(s=>{const tx=Math.floor(s.x/T),ty=Math.floor(s.y/T);if(inb(tx,ty))resv[I(tx,ty)]=1;objects.push({k:s.kind,x:s.x/T,y:s.y/T,w:1,h:1,v:s.dir,seat:1})});
// houses
const houses=[];const cands=[];
paths.forEach(p=>{if(p.lane)return;for(let i=0;i<p.pts.length;i+=(p.ring?1:2)){const [px,py]=p.pts[i];for(const w of [4,5,6]){
 for(let k=0;k<3;k++)cands.push([Math.round(px-w/2),Math.round(py-p.w/2-4-k),w,0]);
 for(let k=0;k<2;k++)cands.push([Math.round(px-w/2),Math.round(py+p.w/2+1+k),w,1]);
 for(const sx of [-1,1])cands.push([Math.round(px+sx*(p.w/2+1+w/2)-w/2),Math.round(py-2),w,2])}}});
for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[cands[i],cands[j]]=[cands[j],cands[i]]}
function tryHouse(x,y,w,mode){const h=4;if(!free(x,y,w,h,0))return;for(let j=y-1;j<=y+h;j++)for(let i=x-1;i<=x+w;i++){if(!inb(i,j))return;const q=I(i,j);if(solid[q]||ground[q]==3)return;if(resv[q]&&ground[q]!=1&&ground[q]!=2)return}const dx=x+Math.floor(w/2);let k=-1;
 if(mode!=1){for(let j=0;j<4;j++){if(!inb(dx,y+h+j))break;const g=ground[I(dx,y+h+j)];if(g==1||g==2||g==4){k=j;break}if(resv[I(dx,y+h+j)]||solid[I(dx,y+h+j)]){break}}if(k<0)return}
 const o=add('house',x,y,w,h,Math.floor(R()*6),1,{wall:Math.floor(R()*3),shop:R()<.22,dormer:R()<.45,chim:R()<.75,back:mode==1,seed:Math.floor(R()*1e6)});houses.push(o);mark(x,y,w,h,1,1);for(let j=y-1;j<=y+h;j++)for(let i=x-1;i<=x+w;i++)if(inb(i,j)&&ground[I(i,j)]==0)resv[I(i,j)]=1;
 if(k>0){for(let j=0;j<k;j++){ground[I(dx,y+h+j)]=1;resv[I(dx,y+h+j)]=1}paths.push({w:1.4,pts:[[dx+.5,y+h-.2],[dx+.5,y+h+k+.5]],lane:1})}
 [[x-1,y+h-1],[x+w,y+h-1]].forEach(([px,py])=>{if(R()<.6&&free(px,py,1,1))add(['barrel','crate','pot','pot','barrel'][Math.floor(R()*5)],px,py,1,1,Math.floor(R()*4))});
 if(R()<.3){const gx=R()<.5?x-5:x+w+1;if(free(gx,y,4,3,0))add('garden',gx,y,4,3,Math.floor(R()*3))}}

// street lamps
paths.forEach(p=>{if(p.lane)return;for(let i=4;i<p.pts.length;i+=9){const [px,py]=p.pts[i],a=i+1<p.pts.length?p.pts[i+1]:p.pts[i-1];const ang=Math.atan2(a[1]-py,a[0]-px)+Math.PI/2;
 const x=Math.floor(px+Math.cos(ang)*(p.w/2+.7)),y=Math.floor(py+Math.sin(ang)*(p.w/2+.7));if(inb(x,y)&&free(x,y,1,1))add('lamp',x,y,1,1)}});
// scattered props
for(let n=0;n<60;n++){const x=5+Math.floor(R()*(MW-10)),y=5+Math.floor(R()*(MH-10));if(!free(x,y,1,1,0))continue;
 const near=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>ground[I(x+a,y+b)]==1);if(near&&R()<.5)add(R()<.3?'sign':'lamp',x,y,1,1,Math.floor(R()*4));else add(R()<.5?'rock':'bush',x,y,1,1,Math.floor(R()*4),R()<.5?1:0)}
// meadow decor: flower patches, pots by paths, extra park-like groves
for(let n=0;n<160;n++){const x=6+Math.floor(R()*(MW-12)),y=6+Math.floor(R()*(MH-12));if(free(x,y,2,1,0)){objects.push({k:'flowerbed',x,y,w:2,h:1,v:n,flat:1,wild:R()<.6?1:0});mark(x,y,2,1,0)}}
for(let n=0;n<40;n++){const x=6+Math.floor(R()*(MW-12)),y=6+Math.floor(R()*(MH-12));const near=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>ground[I(x+a,y+b)]==1);if(near&&free(x,y,1,1))add(R()<.7?'pot':'barrel',x,y,1,1,n)}
// a few extra benches along paths
for(let n=0,c=0;n<400&&c<10;n++){const p=paths[Math.floor(R()*paths.length)];if(p.ring===undefined&&p.w<2)continue;const i=Math.floor(R()*p.pts.length),[px,py]=p.pts[i];const x=px,y=py-p.w/2-.6;if(free(Math.floor(x),Math.floor(y),1,1)&&Math.hypot(x-60,y-42)>16){seat(x,y+.2,1,'bench');resv[I(Math.floor(x),Math.floor(y))]=1;objects.push({k:'bench',x,y:y+.2,w:1,h:1,v:1,seat:1});c++}}
// trees: forest border + scattered
for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=I(x,y);if(resv[i])continue;const e=Math.min(x,y,MW-1-x,MH-1-y)+Math.sin(x*.7)*1.2+Math.cos(y*.9)*1.2;
 const near=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>inb(x+a,y+b)&&ground[I(x+a,y+b)]==1);
 let cov=false;for(let b=-4;b<=0&&!cov;b++)for(let a=-2;a<=2;a++)if(inb(x+a,y+b)&&(ground[I(x+a,y+b)]==1||ground[I(x+a,y+b)]==4)){cov=true;break}
 if(!cov&&(e<5.5?R()<.62:(!near&&R()<.085))){const pine=e<5.5?R()<.55:R()<.2;add('tree',x,y,1,1,Math.floor(R()*8),1,{pine,jx:Math.floor(R()*7)-3,jy:Math.floor(R()*5)-2})}
 else if(e<5.5?R()<.25:(!near&&R()<.04))objects.push({k:'bush',x,y,w:1,h:1,v:Math.floor(R()*4)});else if(!near&&e>=5.5&&R()<.02)objects.push({k:'flowerbed',x,y,w:2,h:1,v:Math.floor(R()*50),flat:1,wild:1})}
// ensure trees don't sit on map edge holes: border solid
for(let x=0;x<MW;x++){solid[I(x,0)]=1;solid[I(x,MH-1)]=1}for(let y=0;y<MH;y++){solid[I(0,y)]=1;solid[I(MW-1,y)]=1}
return {T,MW,MH,cf,pv,shrine,tiers,TE,launch,pz,tr,hgt:Array.from(hgt),ramps,ground:Array.from(ground),solid:Array.from(solid),paths,river,plaza,parks,bridges,objects,seats:seats.map(s=>({x:s.x,y:s.y,dir:s.dir,kind:s.kind})),spawn:{x:60*T,y:49*T}}}
if(typeof module!='undefined')module.exports=MapGen;else G.MapGen=MapGen})(this);
