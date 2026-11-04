// Layered sprite characters from generated art atlas (body+outfit / hair / hat), composited per pose and cached.
(function(G){const R=3,CACHE=new Map();let M=null,A=null,ready=false;
const img=new Image();img.onload=()=>{A=img;ready=!!M};img.src='assets/chars_atlas_norm.png';
fetch('assets/chars_meta_norm.json').then(r=>r.json()).then(j=>{M=j;ready=!!A});
const SKIRT={dress:1,rain:1,hanbokF:1.4};
// per-outfit [legY,waist] for views front/side/back (outfit_norm2.json); hanbokF legs split at the skirt hem so the skirt stays whole
const LEGW={tunic:[[115,94],[114,90],[115,94]],dress:[[115,94],[114,90],[115,94]],rain:[[116,95],[114,91],[116,95]],overalls:[[116,96],[115,93],[116,96]],knight:[[116,96],[115,93],[116,96]],hanbokM:[[117,98],[116,95],[117,98]],hanbokF:[[124,96],[124,94],[124,96]]};
function cell(i,g,dx,dy){const C=M.cols,[W,H]=M.cell;g.drawImage(A,(i%C)*W,(i/C|0)*H,W,H,dx,dy,W,H)}
function strip(i,g,sy,h,dx,dy){const C=M.cols,[W,H]=M.cell;if(h<=0)return;g.drawImage(A,(i%C)*W,(i/C|0)*H+sy,W,h,dx,sy+dy,W,h)}
function draw(g,look,d,P,blink){const I=XItems.ITEMS,v=d==1?2:(d==2||d==3)?1:0,[W,H]=M.cell;
 const oid=I.outfit[look[3]].id,hid=I.hair[look[1]].id,hat=I.hat[look[4]].id;
 const cn=M.concept&&look[0]==0?(look[1]==0&&look[2]==0&&look[3]==0?'boy':look[1]==1&&look[2]==1&&look[3]==1?'girl':null):null;
 const b=cn?M.concept[cn][v]:M.body[oid][v],bi=cn?b.i:(b.i[look[0]]??b.i[0]);
 const [ll,lr,bob,arm,str,lean,anim]=P;const by=bob*R,lx=lean*R,run=Math.abs(str)>=2||Math.abs(ll)>=2||Math.abs(lr)>=2;
 const lw=cn?[112,86]:(LEGW[oid]||[])[v]||[112,86],legY=lw[0],waist=lw[1],cx=M.cell[0]/2;
 // upper body
 strip(bi,g,0,waist,lx,by);
 // skirt / lower torso with sway
 const sw=(SKIRT[oid]||0)*(-arm)*(v==1?.7:1.6);for(let y=waist;y<legY;y+=2){const k=(y-waist)/(legY-waist);strip(bi,g,y,2,Math.round(lx*.6+sw*k),by)}
 // legs: split halves, lift alternately (front/back) or stride (side)
 const C=M.cols;const sx=(bi%C)*W,sy0=(bi/C|0)*H;
 const half=(x0,w,ox,lift)=>g.drawImage(A,sx+x0,sy0+legY,w,H-legY,x0+ox,legY-lift,w,H-legY);
 if(v==1){if(str){g.globalAlpha=1;half(0,W,-Math.abs(str)*R*.7,0);half(0,W,Math.abs(str)*R*.7,ll*R)}else half(0,W,0,ll*R)}else{half(0,cx,0,ll*R);half(cx,W-cx,0,lr*R)}
 if(blink&&b.eyes)for(const [x,y,w,h] of b.eyes){g.fillStyle=M.skins[look[0]]||M.skins[0];g.beginPath();g.ellipse(x+w/2+lx,y+h/2+by,w/2+1,h/2+1,0,0,7);g.fill();g.fillStyle='#5a4044';g.fillRect(x+lx,y+h*.62+by,w,2)}
 // hair with follow-through: strips lag behind the head
 const hc=cn?b.h:(M.hair[hid][v].i[look[2]]??M.hair[hid][v].i[0]),dx=cn?lx:b.a[0]-M.ax+lx,dy=cn?by:b.a[1]-M.ay+by,hay=cn?b.a[1]:M.ay;
 const mv=ll||lr||str||arm||lean;const swingy=hid=='buns'||hid=='pony'?1:0;let lagX=!mv?0:v==1?(run?5:2.5)+(-arm)*1.6:(-arm)*2.4,lagY=-bob*2.4-(run&&mv?1.5:0);
 for(let y=0;y<H;y+=3){const wl=Math.min(1,Math.max(0,(y-hay)/42))**1.2,wt=Math.min(1,Math.max(0,(hay-26-y)/22));const ox=lagX*wl+lagX*.6*wt*swingy,oy=lagY*wl+(swingy?lagY*.7*wt:0);strip(hc,g,y,3,Math.round(dx+ox),Math.round(dy+oy))}
 if(hat!='none'){const hi=M.hat[hat][v].i,hx=cn?b.a[0]-M.ax+lx:dx,hy=cn?b.a[1]-M.ay+by:dy;cell(hi,g,Math.round(hx+lagX*.15),Math.round(hy+lagY*.3))}}
function sprite(look,d,Pstr,blink){const key=look.join()+'|'+d+'|'+Pstr+(blink?'b':'');let c=CACHE.get(key);if(c)return c;
 const W=M?M.cell[0]:112,H=M?M.cell[1]:132;c=document.createElement('canvas');c.width=W;c.height=H;if(!ready)return c;if(CACHE.size>5000)CACHE.clear();
 const g=c.getContext('2d');g.imageSmoothingEnabled=true;if(d==3){g.translate(W,0);g.scale(-1,1)}
 const P=Pstr.split(',').map((v,i)=>i!=6?+v||0:v);draw(g,XItems.clean(look),d,P,blink);CACHE.set(key,c);return c}
G.XChar={sprite,get ready(){return ready},W:112/R,H:132/R,R}})(this);
