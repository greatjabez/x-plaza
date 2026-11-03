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
 P(2.6,[[71,52],[82,59],[90,70],[95,86]]),P(2.6,[[49,52],[38,59],[30,70],[25,86]]),
 P(2.2,[[12,14],[9,28],[18,41]]),P(2.2,[[108,14],[111,28],[102,45]]),
 P(2.2,[[25,86],[42,81],[60,80],[78,81],[95,86]]),
 {w:2.4,ring:1,pts:Array.from({length:61},(_,i)=>{const a=(125+i/60*290)*Math.PI/180;return[60+Math.cos(a)*31,41+Math.sin(a)*19.5]})},
 P(2,[[30,45],[30,58],[22,62]]),P(2,[[90,41],[92,56],[100,62]]),P(2,[[40,23],[44,12],[52,8]]),P(2,[[80,23],[76,12],[68,8]])];
// bridges where paths cross the river
const rY=x=>{for(let i=0;i<river.pts.length-1;i++){const a=river.pts[i],b=river.pts[i+1];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return 66};
const bridges=[];paths.forEach(p=>{for(let i=0;i<p.pts.length-1;i++){const a=p.pts[i],b=p.pts[i+1],fa=a[1]-rY(a[0]),fb=b[1]-rY(b[0]);
 if(fa<0&&fb>=0){const t=fa/(fa-fb),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;bridges.push({x,y,ang:Math.atan2(b[1]-a[1],b[0]-a[0]),len:river.w+4,wid:p.w+0.8})}}});
const inBridge=(px,py)=>bridges.some(b=>{const dx=px-b.x,dy=py-b.y,u=dx*Math.cos(b.ang)+dy*Math.sin(b.ang),v=-dx*Math.sin(b.ang)+dy*Math.cos(b.ang);return Math.abs(u)<b.len/2&&Math.abs(v)<b.wid/2});
for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const cx=x+.5,cy=y+.5,i=I(x,y);
 const dw=dpoly(cx,cy,river.pts);if(dw<river.w/2){ground[i]=inBridge(cx,cy)?4:3;if(ground[i]==3)solid[i]=1;resv[i]=1;continue}
 if(Math.hypot(cx-plaza.cx,cy-plaza.cy)<plaza.r){ground[i]=2;resv[i]=1;continue}
 for(const p of paths)if(dpoly(cx,cy,p.pts)<p.w/2){ground[i]=1;resv[i]=1;break}
 if(dw<river.w/2+1.2)resv[i]=1}
const objects=[],seats=[];
const free=(x,y,w,h,m=0)=>{for(let j=y-m;j<y+h+m;j++)for(let i=x-m;i<x+w+m;i++){if(!inb(i,j)||resv[I(i,j)])return false}return true};
const mark=(x,y,w,h,s=1,m=0)=>{for(let j=y-m;j<y+h+m;j++)for(let i=x-m;i<x+w+m;i++)if(inb(i,j)){resv[I(i,j)]=1;if(s&&j>=y&&j<y+h&&i>=x&&i<x+w)solid[I(i,j)]=1}};
const add=(k,x,y,w,h,v=0,s=1,extra)=>{const o=Object.assign({k,x,y,w,h,v},extra||{});objects.push(o);if(s)mark(x,y,w,h,1);else mark(x,y,w,h,0);return o};
const seat=(x,y,dir,kind)=>{seats.push({x:Math.round(x*T),y:Math.round(y*T),dir,kind});};
// centerpiece fountain + bench ring + flower ring
add('fountain',56,39,8,6);
for(let i=0;i<8;i++){const an=i/8*Math.PI*2+Math.PI/8,x=60+Math.cos(an)*7.2,y=42+Math.sin(an)*5.6;const dir=Math.abs(Math.cos(an))>.7?(Math.cos(an)>0?2:3):(Math.sin(an)>0?1:0);seat(x,y,dir,dir>=2?'benchv':'bench')}
add('statue',58,33,5,2);add('well',70,33,2,2);[[53,36],[66,36],[53,48],[66,48]].forEach(([x,y])=>add('plamp',x,y,1,1));
for(let i=0;i<12;i++){const an=i/12*Math.PI*2,x=Math.floor(60+Math.cos(an)*10.5),y=Math.floor(42+Math.sin(an)*8);if(y<38&&x>56&&x<64)continue;if(i%3!=0)add('pot',x,y,1,1,i)}
// parks with hedges
const parks=[{cx:30,cy:29,r:6},{cx:90,cy:29,r:6},{cx:45,cy:74.5,r:4.6},{cx:79,cy:74.5,r:4.6}];
parks.forEach((p,pi)=>{const ga=Math.atan2(plaza.cy-p.cy,plaza.cx-p.cx);p.hedge=[];
 for(let y=Math.floor(p.cy-p.r-1);y<=p.cy+p.r+1;y++)for(let x=Math.floor(p.cx-p.r-1);x<=p.cx+p.r+1;x++){if(!inb(x,y))continue;const d=Math.hypot(x+.5-p.cx,y+.5-p.cy);if(d>p.r+.6)continue;
  const i=I(x,y);if(ground[i]==1||ground[i]==3)continue;resv[i]=1;
  if(d>p.r-.6){let da=Math.abs(Math.atan2(y+.5-p.cy,x+.5-p.cx)-ga);if(da>Math.PI)da=2*Math.PI-da;if(da*p.r>1.6){solid[i]=1;p.hedge.push([x,y])}else ground[i]=1}}
 const fx=Math.floor(p.cx)-1,fy=Math.floor(p.cy)-1;add('pfountain',fx,fy,3,3);
 seat(p.cx,p.cy-2.4,0,'bench');seat(p.cx,p.cy+3.2,1,'bench');if(p.r>5){seat(p.cx-3.1,p.cy+.4,3,'benchv');seat(p.cx+3.1,p.cy+.4,2,'benchv')}
 [[-3,-3],[2,-3],[-3,2],[2,2]].forEach(([a,b])=>{if(p.r>5)objects.push({k:'flowerbed',x:Math.floor(p.cx)+a,y:Math.floor(p.cy)+b,w:2,h:1,v:pi+a+b,flat:1})});});
// campfire clearing
const cf={x:103,y:34};for(let y=cf.y-4;y<=cf.y+4;y++)for(let x=cf.x-4;x<=cf.x+4;x++)resv[I(x,y)]=1;
add('campfire',cf.x,cf.y,1,1);seat(cf.x+.5,cf.y-1.6,0,'log');seat(cf.x+.5,cf.y+2.6,1,'log');seat(cf.x-1.6,cf.y+.8,3,'logv');seat(cf.x+2.6,cf.y+.8,2,'logv');
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
 if(e<5.5?R()<.62:(!near&&R()<.085)){const pine=e<5.5?R()<.55:R()<.2;add('tree',x,y,1,1,Math.floor(R()*8),1,{pine,jx:Math.floor(R()*7)-3,jy:Math.floor(R()*5)-2})}
 else if(e<5.5?R()<.25:(!near&&R()<.04))objects.push({k:'bush',x,y,w:1,h:1,v:Math.floor(R()*4)});else if(!near&&e>=5.5&&R()<.02)objects.push({k:'flowerbed',x,y,w:2,h:1,v:Math.floor(R()*50),flat:1,wild:1})}
// ensure trees don't sit on map edge holes: border solid
for(let x=0;x<MW;x++){solid[I(x,0)]=1;solid[I(x,MH-1)]=1}for(let y=0;y<MH;y++){solid[I(0,y)]=1;solid[I(MW-1,y)]=1}
return {T,MW,MH,ground:Array.from(ground),solid:Array.from(solid),paths,river,plaza,parks,bridges,objects,seats:seats.map(s=>({x:s.x,y:s.y,dir:s.dir,kind:s.kind})),spawn:{x:60*T,y:49*T}}}
if(typeof module!='undefined')module.exports=MapGen;else G.MapGen=MapGen})(this);
