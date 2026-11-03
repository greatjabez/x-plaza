// Item catalog shared by server (validation) and client (rendering/UI).
// To add shop items later: append entries (never reorder; look stores indices). price>0 / owned-check can gate them.
(function(G){const ITEMS={
 skin:[{id:'light',name:'밝은',c:'#ffe4cf',price:0},{id:'warm',name:'따뜻한',c:'#f6cba6',price:0},{id:'tan',name:'구릿빛',c:'#d9a47c',price:0}],
 hair:[{id:'fluffy',name:'몽글',price:0},{id:'buns',name:'양쪽 번',price:0},{id:'spiky',name:'삐죽',price:0},{id:'wavy',name:'긴 웨이브',price:0},{id:'bob',name:'단발',price:0},{id:'pony',name:'포니테일',price:0}],
 hairColor:[{id:'blue',name:'파랑',c:'#86b6ec',price:0},{id:'pink',name:'분홍',c:'#f4a9c6',price:0},{id:'brown',name:'갈색',c:'#9a6a4a',price:0},{id:'black',name:'흑발',c:'#45404f',price:0},{id:'blonde',name:'금발',c:'#f1d27f',price:0},{id:'lav',name:'라벤더',c:'#bca6ec',price:0},{id:'mint',name:'민트',c:'#9fdcc6',price:0}],
 outfit:[{id:'tunic',name:'민트 튜닉',price:0},{id:'dress',name:'라벤더 원피스',price:0},{id:'rain',name:'노랑 우비',price:0},{id:'overalls',name:'빨강 멜빵',price:0},{id:'knight',name:'파랑 기사 재킷',price:0}],
 hat:[{id:'none',name:'없음',price:0},{id:'straw',name:'꽃 밀짚모자',price:0},{id:'beanie',name:'니트 비니',price:0}]};
const SLOTS=['skin','hair','hairColor','outfit','hat'];
const PRESETS={boy:[0,0,0,0,0],girl:[0,1,1,1,0]};
function clean(l){if(!Array.isArray(l)||l.length!=5)return PRESETS.boy.slice();return SLOTS.map((s,i)=>{const v=Math.abs(Number(l[i])|0);return v<ITEMS[s].length?v:0})}
const X={ITEMS,SLOTS,PRESETS,clean};if(typeof module!='undefined')module.exports=X;else G.XItems=X})(this);
