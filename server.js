const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000;
const MAP=require('./public/mapgen.js')(),T=MAP.T,MW=MAP.MW,MH=MAP.MH;
const seats=MAP.seats.map(s=>({...s,occ:0}));
const solid=(px,py)=>{const x=Math.floor(px/T),y=Math.floor(py/T);if(x<0||y<0||x>=MW||y>=MH)return true;return !!MAP.solid[y*MW+x]};
const players=new Map();let bullets=[],bid=1;function hitPlayer(o,by,dmg,kx,ky){o.hp=Math.max(0,o.hp-dmg);if(!solid(o.x+kx,o.y+ky)&&o.seat<0){o.x+=kx;o.y+=ky}bc({t:'hit',id:o.id,by:by.id,dmg,kx:o.seat<0?kx:0,ky:o.seat<0?ky:0});
 if(o.hp<=0){o.dead=true;o.deadAt=Date.now();if(o.seat>=0){seats[o.seat].occ=0;o.seat=-1}o.act='';bc({t:'die',id:o.id});bc({t:'sys',text:`${o.name} 님이 ${by.name} 님에게 쓰러졌어요 💀`});for(const c of wss.clients)if(c.pid==o.id){c.send(JSON.stringify({t:'dead',by:by.name}));setTimeout(()=>c.close(),2000)}}}
let nid=1;const weapons=new Map();let wid=1;
function spawnWeapon(){for(let i=0;i<200;i++){const x=(12+Math.random()*(MW-24))*T,y=(10+Math.random()*(MH-20))*T;if(!solid(x,y)){weapons.set(wid,{id:wid++,x,y,kind:Math.random()<.7?'sword':'axe'});return}}}
for(let i=0;i<14;i++)spawnWeapon();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EMO=['👋','😂','❤️','😮','😡','🎉'];
const srv=http.createServer((q,s)=>{
 const f=path.join(__dirname,'public',q.url=='/'?'index.html':path.normalize(q.url).replace(/^(\.\.[\/\\])+/,''));
 fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.png')?'image/png':f.endsWith('.json')?'application/json':'application/javascript','cache-control':'no-cache'});s.end(d)})});
const wss=new WebSocketServer({server:srv});
const bc=o=>{const m=JSON.stringify(o);wss.clients.forEach(c=>c.readyState==1&&c.send(m))};
function spawnPos(){for(let i=0;i<500;i++){const a=Math.random()*6.283,r=Math.random()*6*T,x=MAP.spawn.x+Math.cos(a)*r,y=MAP.spawn.y+Math.sin(a)*r*.6;if(!solid(x,y)&&!solid(x-6,y)&&!solid(x+6,y))return{x,y}}return{...MAP.spawn}}
wss.on('connection',ws=>{let me=null,last={chat:0,emo:0,atk:0,mv:0},msgs=0,win=Date.now();
 ws.on('message',raw=>{const now=Date.now();if(now-win>1000){win=now;msgs=0}if(++msgs>40)return;
  let m;try{m=JSON.parse(raw)}catch{return}
  if(m.t=='join'&&!me){const name=String(m.name||'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,12)||'여행자';const p=spawnPos();let h=String(m.handle||'').trim().replace(/^@/,'');if(!/^[A-Za-z0-9_]{1,15}$/.test(h))h='';
   me={id:nid++,name,handle:h,look:[0,1,2,3,4].map((i)=>Math.abs(Number((m.look||[])[i])|0)%[8,5,7,8,5][i]),x:p.x,y:p.y,dir:0,moving:false,hp:100,weapon:null,dead:false,act:'',seat:-1,run:false};
   players.set(me.id,me);ws.send(JSON.stringify({t:'welcome',id:me.id,weapons:[...weapons.values()]}));bc({t:'sys',text:`${name} 님이 광장에 들어왔어요`});return}
  if(!me||me.dead)return;
  if(m.t=='move'){const x=+m.x,y=+m.y;if(!isFinite(x)||!isFinite(y))return;const dt=Math.max(16,now-last.mv);last.mv=now;
   const unseat=()=>{if(me.seat>=0){seats[me.seat].occ=0;me.seat=-1}};if(me.act&&!m.moving&&Math.hypot(x-me.x,y-me.y)>0.5)return;if(m.moving&&me.act){me.act='';unseat()}
   if(Math.hypot(x-me.x,y-me.y)>Math.max(16,dt*0.3)+6)return; if(solid(x,y))return;
   me.x=x;me.y=y;me.dir=m.dir|0;me.moving=!!m.moving;if(isFinite(+m.aim))me.aim=Math.round(+m.aim*100)/100;me.run=!!m.run;
   for(const w of weapons.values())if(!me.weapon&&Math.hypot(w.x-me.x,w.y-me.y)<14){me.weapon=w.kind;weapons.delete(w.id);bc({t:'wpick',id:w.id,pid:me.id});setTimeout(()=>{spawnWeapon();bc({t:'weapons',weapons:[...weapons.values()]})},15000)}}
  else if(m.t=='chat'){if(now-last.chat<700)return;last.chat=now;const text=String(m.text||'').replace(/[\u0000-\u001f]/g,'').slice(0,80).trim();if(text)bc({t:'chat',id:me.id,name:me.name,text})}
  else if(m.t=='act'){if(now-last.emo<300)return;last.emo=now;const a=String(m.a);if(!['sit','sleep','lie','dance','cry','angry','jump'].includes(a))return;
   if(a=='jump'){bc({t:'act',id:me.id,a});return}
   if(me.seat>=0){seats[me.seat].occ=0;me.seat=-1}
   if(a=='sit'){let best=-1,bd=1e9;const qx=isFinite(+m.sx)?+m.sx:me.x,qy=isFinite(+m.sy)?+m.sy:me.y;
    seats.forEach((st,i)=>{if(st.occ)return;const d=Math.hypot(st.x-qx,st.y-qy),dm=Math.hypot(st.x-me.x,st.y-me.y);if(d<24&&dm<48&&d<bd){bd=d;best=i}});
    if(best>=0){const st=seats[best];st.occ=me.id;me.seat=best;me.x=st.x;me.y=st.y;me.dir=st.dir;me.act='seat';ws.send(JSON.stringify({t:'seated',x:st.x,y:st.y,dir:st.dir}));bc({t:'act',id:me.id,a:'seat'});return}}
   me.act=a;bc({t:'act',id:me.id,a})}
  else if(m.t=='wave'){if(now-last.emo<500)return;last.emo=now;bc({t:'wave',id:me.id})}
  else if(m.t=='emo'){if(now-last.emo<500)return;last.emo=now;const e=EMO[m.i|0];if(e)bc({t:'emo',id:me.id,e})}
  else if(m.t=='atk'){if(now-last.atk<350)return;last.atk=now;let an=+m.a;if(!isFinite(an))an=[Math.PI/2,-Math.PI/2,Math.PI,0][me.dir|0];me.aim=an;
   if(me.act){me.act='';if(me.seat>=0){seats[me.seat].occ=0;me.seat=-1}}
   const vx=Math.cos(an)*7,vy=Math.sin(an)*7,b={id:bid++,o:me.id,x:me.x+Math.cos(an)*10,y:me.y-16+Math.sin(an)*8,vx,vy,life:40,dmg:me.weapon=='axe'?20:me.weapon?15:10};bullets.push(b);bc({t:'shot',id:me.id,b:b.id,x:b.x,y:b.y,vx,vy,a:an})}
 });
 Object.defineProperty(ws,'pid',{get:()=>me&&me.id});
 ws.on('close',()=>{if(me){if(me.seat>=0)seats[me.seat].occ=0;players.delete(me.id);bc({t:'sys',text:`${me.name} 님이 떠났어요`})}});
});
setInterval(()=>bc({t:'state',online:players.size,players:[...players.values()].map(p=>({dead:p.dead,act:p.act,run:p.run,id:p.id,name:p.name,handle:p.handle,look:p.look,x:Math.round(p.x),y:Math.round(p.y),dir:p.dir,moving:p.moving,hp:p.hp,weapon:p.weapon,aim:p.aim}))}),66);
setInterval(()=>{if(!bullets.length)return;const keep=[];for(const b of bullets){let end=false;for(let s=0;s<2&&!end;s++){b.x+=b.vx/2;b.y+=b.vy/2;
  if(b.x<0||b.y<0||b.x>MW*T||b.y>MH*T||solid(b.x,b.y+14)){end=true;break}
  for(const o of players.values()){if(o.id==b.o||o.dead)continue;if(Math.abs(b.x-o.x)<7&&b.y>o.y-30&&b.y<o.y+2){const sh=players.get(b.o)||{id:b.o,name:'?'};const l=Math.hypot(b.vx,b.vy)||1;hitPlayer(o,sh,b.dmg,b.vx/l*5,b.vy/l*5);end=true;break}}}
  if(end||--b.life<=0)bc({t:'bend',b:b.id,x:Math.round(b.x),y:Math.round(b.y)});else keep.push(b)}bullets=keep},33);
setInterval(()=>{for(const p of players.values())if(!p.dead&&p.hp<100)p.hp=Math.min(100,p.hp+1)},2000);
srv.listen(PORT,()=>console.log('pixel plaza on',PORT));
