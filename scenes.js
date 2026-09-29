/* Original, code-drawn 16-bit storybook scenes for Ember & Iron.
 * Presentation only. Draws game snapshots; never advances or mutates the game.
 */
(function (root) {
  'use strict';
  const W = 640, H = 240;
  const C = {
    ink:'#35465d', outline:'#654936', wood:'#bd7a43', woodLight:'#f3ba74', woodDark:'#795038',
    cream:'#fff0c2', paper:'#fff8df', brick:'#de9766', mortar:'#f5c994', roof:'#d6654c', roofLight:'#ffab6b',
    grass:'#78c647', grassLight:'#a9df58', grassDark:'#3d9750', path:'#e5c798', pathLight:'#f4dba6',
    sky:'#83cdf1', cloud:'#fffbe9', hill:'#7dc57c', hillDark:'#389b71', leaf:'#51a966', leafLight:'#9bd95b',
    metal:'#98b9c8', metalLight:'#e0f2ef', metalDark:'#4d6c86', gold:'#f7cc62', orange:'#f29445',
    peach:'#efb083', skin:'#ffd0a0', hair:'#84533b', shadow:'#385a6a30', teal:'#48a89a', pink:'#ed9a99'
  };
  const METALS = {bronze:'#d99b58',iron:'#a8bbc4',steel:'#a5cbd9',mithril:'#97c7f6',starforged:'#d5aaf3',gem:'#64d3bf',fuel:'#526879',wood:'#bb7843',leather:'#cb865b'};
  const COSTUMES = {
    smith:{coat:'#c48c55',light:'#edb873',shade:'#956341',hat:'#bc4850',hair:'#78503c',skin:'#f8c99e'},
    vanguard:{coat:'#48a99c',light:'#87dfc4',shade:'#2c777f',hat:'#469faa',hair:'#6e4c43',skin:'#f5c399'},
    breaker:{coat:'#c67548',light:'#f5b36a',shade:'#8e4f41',hat:'#bb4e4b',hair:'#a85b36',skin:'#e8ac80'},
    duelist:{coat:'#9968b3',light:'#d3a2dd',shade:'#654e87',hat:'#885da7',hair:'#53516d',skin:'#efb391'},
    ranger:{coat:'#50935d',light:'#9cca70',shade:'#376d59',hat:'#559661',hair:'#754d48',skin:'#f2c79c'},
    guardian:{coat:'#5387bc',light:'#99c8e7',shade:'#3d588c',hat:'#a9c5cd',hair:'#59536a',skin:'#dca481'},
    mage:{coat:'#8a6fc4',light:'#c5a4ee',shade:'#5d5099',hat:'#8568bb',hair:'#ebd9c8',skin:'#efbd98'},
    miner:{coat:'#63a5a3',light:'#a9d9bb',shade:'#447779',hat:'#f1be4f',hair:'#865e42',skin:'#eac095'}
  };
  const clamp = (n,a,b) => Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
  const hash = value => {let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
  const mod = (n,m) => ((n%m)+m)%m;
  function rect(g,x,y,w,h,c){if(w<=0||h<=0)return;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function box(g,x,y,w,h,c,o=C.outline,b=1){rect(g,x,y,w,h,o);rect(g,x+b,y+b,w-2*b,h-2*b,c);}
  function oval(g,x,y,w,h,c){
    const rx=w/2,ry=h/2;
    for(let row=0;row<h;row++){const q=(row+.5-ry)/ry,half=Math.sqrt(Math.max(0,1-q*q))*rx;rect(g,x+rx-half,y+row,half*2,1,c);}
  }
  function round(g,x,y,w,h,r,c){r=Math.min(r,w/2,h/2);rect(g,x+r,y,w-2*r,h,c);rect(g,x,y+r,w,h-2*r,c);oval(g,x,y,2*r,2*r,c);oval(g,x+w-2*r,y,2*r,2*r,c);oval(g,x,y+h-2*r,2*r,2*r,c);oval(g,x+w-2*r,y+h-2*r,2*r,2*r,c);}
  function roundBox(g,x,y,w,h,r,c,o=C.outline,b=2){round(g,x,y,w,h,r,o);round(g,x+b,y+b,w-2*b,h-2*b,Math.max(1,r-b),c);}
  function stairLine(g,x1,y1,x2,y2,c,b=1){const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));for(let i=0;i<=n;i++)rect(g,x1+(x2-x1)*i/Math.max(1,n),y1+(y2-y1)*i/Math.max(1,n),b,b,c);}
  function poly(g,points,c){
    const ys=points.map(p=>p[1]),lo=Math.floor(Math.min.apply(null,ys)),hi=Math.ceil(Math.max.apply(null,ys));
    for(let y=lo;y<hi;y++){const xs=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)rect(g,xs[i],y,xs[i+1]-xs[i],1,c);}
  }
  function label(g,text,x,y,c=C.ink,size=9,align='left'){g.fillStyle=c;g.font='bold '+size+'px monospace';g.textAlign=align;g.textBaseline='top';g.fillText(String(text),Math.round(x),Math.round(y));}
  function cloud(g,x,y,s=1){
    const lobes=[[0,12,47,23],[18,0,42,40],[48,6,36,32],[70,16,35,20]];
    lobes.forEach(a=>oval(g,x+a[0]*s,y+a[1]*s,a[2]*s,a[3]*s,'#b0dbe6'));
    lobes.forEach(a=>oval(g,x+(a[0]+2)*s,y+(a[1]+1)*s,(a[2]-4)*s,(a[3]-5)*s,C.cloud));
    rect(g,x+18*s,y+29*s,65*s,7*s,'#e0eef0');rect(g,x+25*s,y+6*s,15*s,3*s,'#ffffff');
  }
  function sky(g,t,reduced,region='town'){
    const night=region==='starfall',snow=region==='frost',hot=region==='ember';
    rect(g,0,0,W,H,night?'#8c91d5':hot?'#ffc99b':snow?'#a6d9ee':C.sky);
    rect(g,0,75,W,87,night?'#b4b0e3':hot?'#ffdeb0':'#a8e2ed');
    rect(g,0,144,W,70,night?'#d9c7e6':hot?'#f9e5bd':'#cbedd6');
    oval(g,516,18,41,41,night?'#ece3fe':'#ffe897');oval(g,520,20,30,28,night?'#fff7ff':'#fff3b0');
    const drift=reduced?0:mod(t/2500,40);
    cloud(g,47+drift*.45,24,.85);cloud(g,282-drift*.2,17,.61);cloud(g,409+drift*.3,57,.6);
    const far=night?'#9898ca':hot?'#dba879':snow?'#b6d9dc':'#87cfa0';
    const near=night?'#7b84b7':hot?'#c7916b':snow?'#90c5c4':'#55b387';
    for(let i=-1;i<6;i++){oval(g,i*143+12,105+(i%2)*15,209,145,far);oval(g,i*134+70,143+(i%3)*6,182,112,near);}
    if(night)for(let i=0;i<24;i++){const x=(i*97+17)%640,y=(i*37)%101;rect(g,x,y,2,2,'#fff7ec');if(i%5===0){rect(g,x-2,y+1,6,1,'#fff7ec');rect(g,x,y-1,2,5,'#fff7ec');}}
  }
  function tree(g,x,y,s=1,leaf=C.leaf,light=C.leafLight){
    roundBox(g,x-5*s,y-36*s,12*s,40*s,4*s,C.wood,C.outline,2*s);rect(g,x-1*s,y-32*s,3*s,31*s,C.woodLight);
    const lobes=[[-30,-64,42,37],[-14,-87,46,49],[9,-64,33,36],[-14,-58,40,30]];
    lobes.forEach(a=>oval(g,x+a[0]*s,y+a[1]*s,a[2]*s,a[3]*s,'#327752'));
    lobes.forEach(a=>oval(g,x+(a[0]+2)*s,y+(a[1]+1)*s,(a[2]-4)*s,(a[3]-6)*s,leaf));
    oval(g,x-12*s,y-83*s,28*s,19*s,light);oval(g,x-27*s,y-63*s,23*s,13*s,light);
    oval(g,x+8*s,y-57*s,19*s,11*s,'#75c266');rect(g,x-6*s,y-76*s,5*s,3*s,'#c0ea7b');
  }
  function fir(g,x,y,s=1,snow=false){
    rect(g,x-3*s,y-15*s,7*s,19*s,C.woodDark);
    for(let i=2;i>=0;i--){const w=(20+i*10)*s,yy=y-(69-i*17)*s;poly(g,[[x,yy],[x-w/2,yy+33*s],[x+w/2,yy+33*s]],'#397c70');poly(g,[[x,yy+3*s],[x-w/2+4*s,yy+27*s],[x+w/2-4*s,yy+27*s]],snow?'#eaf9ec':'#78bc93');}
  }
  function flower(g,x,y,color='#ffcf68',s=1){rect(g,x,y,1*s,5*s,'#43864a');oval(g,x-3*s,y-4*s,4*s,4*s,color);oval(g,x+1*s,y-4*s,4*s,4*s,color);oval(g,x-1*s,y-6*s,4*s,4*s,color);oval(g,x-1*s,y-2*s,4*s,4*s,color);rect(g,x,y-3*s,2*s,2*s,'#fff6b5');}
  function grass(g,top=190,seed=1,region='town'){
    const snow=region==='frost',hot=region==='ember',night=region==='starfall';
    rect(g,0,top,W,H-top,hot?'#ad8768':night?'#84937a':snow?'#c6e0d4':'#86be51');
    rect(g,0,top,W,9,snow?'#f5ffe8':hot?'#b7b85d':night?'#a5c483':C.grassLight);rect(g,0,top+9,W,6,snow?'#d5efdb':C.grass);
    for(let i=0;i<70;i++){const x=mod(i*37+seed*11,W),y=top+19+mod(i*31,Math.max(2,H-top-20));if(i%4===0){rect(g,x,y,3,2,'#d0d774');rect(g,x+1,y-2,1,2,'#c3d765');}else{rect(g,x,y,1,3,'#689e4a');rect(g,x+2,y-1,1,3,'#75a94e');}}
    rect(g,0,234,W,6,'#548d47');
    for(let i=0;i<40;i++)rect(g,i*17,233+(i%3),8,2,'#a2ce65');
  }
  function fence(g,x,y,n=5,s=1){rect(g,x,y+5*s,(n*17-6)*s,4*s,'#926244');rect(g,x,y+14*s,(n*17-6)*s,4*s,C.woodLight);for(let i=0;i<n;i++){box(g,x+i*17*s,y,6*s,25*s,'#e7b87a',C.woodDark,s);rect(g,x+(i*17+2)*s,y+2*s,2*s,18*s,'#ffdb9c');}}
  function roof(g,x,y,w,h,color=C.roof,light=C.roofLight){
    poly(g,[[x+17,y],[x+w-17,y],[x+w,y+h],[x,y+h]],C.outline);
    poly(g,[[x+19,y+3],[x+w-19,y+3],[x+w-5,y+h-4],[x+5,y+h-4]],color);
    for(let row=0;row<Math.floor(h/9);row++){const yy=y+6+row*9,inset=18-row*3;rect(g,x+inset,yy,w-inset*2,2,light);for(let xx=x+inset+(row%2)*10;xx<x+w-inset-2;xx+=23)rect(g,xx,yy+2,2,6,'#a45847');}
    box(g,x-1,y+h-1,w+2,8,C.woodDark,C.outline,2);rect(g,x+3,y+h+1,w-6,2,C.woodLight);
  }
  function beam(g,x,y,w,h){box(g,x,y,w,h,C.wood,C.outline,2);rect(g,x+3,y+2,Math.max(1,w-6),3,C.woodLight);if(h>w)rect(g,x+3,y+5,2,h-10,C.woodLight);else rect(g,x+8,y+5,w-16,1,'#d59456');}
  function wall(g,x,y,w,h,bricks=false){
    rect(g,x,y,w,h,bricks?C.mortar:'#edc692');
    if(bricks){for(let row=0;row<h/13;row++)for(let col=0;col<w/33;col++){const xx=x+col*33-(row%2)*15;rect(g,Math.max(x,xx),y+row*13+2,Math.min(30,x+w-Math.max(x,xx)),10,row%3===0?'#df9c6c':'#e8ad7a');}}
    else for(let xx=x;xx<x+w;xx+=23){rect(g,xx,y,2,h,'#d4a66d');rect(g,xx+4,y+2,1,h-3,'#ffdfa6');}
  }
  function floor(g,x,y,w,h){rect(g,x,y,w,h,'#d29960');for(let yy=y;yy<y+h;yy+=9){rect(g,x,yy,w,1,C.woodDark);for(let xx=x+(Math.round(yy/9)%2)*24;xx<x+w;xx+=61){rect(g,xx,yy,1,9,'#b67b49');rect(g,xx+8,yy+3,22,1,'#e2b273');}}}
  function windowPane(g,x,y,w=52,h=47){
    roundBox(g,x,y,w,h,8,C.woodDark,C.outline,2);roundBox(g,x+4,y+4,w-8,h-9,4,'#75c3da','#f5d095',2);
    poly(g,[[x+8,y+8],[x+25,y+8],[x+8,y+25]],'#c0edf0');poly(g,[[x+w-10,y+11],[x+w-10,y+27],[x+18,y+h-13],[x+18,y+h-21]],'#b6e2e6');
    rect(g,x+w/2-2,y+4,4,h-10,C.woodDark);rect(g,x+5,y+h/2,w-10,4,C.woodDark);beam(g,x-4,y+h-4,w+8,7);
  }
  function crate(g,x,y,w=30,h=27){box(g,x,y,w,h,'#ce985c',C.outline,2);for(let i=7;i<w;i+=8)rect(g,x+i,y+3,1,h-6,C.woodDark);box(g,x+2,y+3,w-4,5,'#edb975',C.woodDark,1);box(g,x+2,y+h-8,w-4,5,'#edb975',C.woodDark,1);rect(g,x+4,y+5,2,2,C.metalDark);rect(g,x+w-6,y+h-6,2,2,C.metalDark);}
  function barrel(g,x,y,s=1){
    roundBox(g,x,y,27*s,36*s,8*s,'#c58b52',C.outline,2*s);rect(g,x+8*s,y+3*s,3*s,30*s,'#e9b778');rect(g,x+18*s,y+3*s,2*s,30*s,'#946341');
    rect(g,x+2*s,y+9*s,23*s,5*s,C.metalDark);rect(g,x+3*s,y+10*s,21*s,2*s,C.metal);rect(g,x+2*s,y+25*s,23*s,5*s,C.metalDark);rect(g,x+3*s,y+26*s,21*s,2*s,C.metal);
    oval(g,x+3*s,y,21*s,6*s,'#7e583e');oval(g,x+5*s,y+1*s,17*s,3*s,'#b77c45');
  }
  function pot(g,x,y,s=1){
    poly(g,[[x-8*s,y],[x+8*s,y],[x+5*s,y+13*s],[x-5*s,y+13*s]],'#a85943');poly(g,[[x-6*s,y+2*s],[x+6*s,y+2*s],[x+3*s,y+11*s],[x-3*s,y+11*s]],'#e48d62');rect(g,x-8*s,y,16*s,4*s,'#f3a677');
    rect(g,x-s,y-19*s,2*s,20*s,'#438c52');oval(g,x-10*s,y-13*s,10*s,6*s,'#6caf60');oval(g,x,y-18*s,10*s,6*s,'#9ace67');flower(g,x,y-20*s,'#f58c94',s*1.3);
  }
  function lamp(g,x,y){rect(g,x+5,y-8,2,8,C.outline);roundBox(g,x,y,13,20,4,'#ffc960',C.outline,2);rect(g,x+4,y+3,5,12,'#fff5b4');rect(g,x-1,y+18,15,3,C.woodDark);}
  function sign(g,x,y,w,text){roundBox(g,x,y,w,24,5,C.cream,C.outline,2);rect(g,x+7,y+3,w-14,2,'#fff9db');label(g,text,x+w/2,y+8,C.woodDark,9,'center');}
  function paintIcon(g, id, x, y, size = 16, material) {
    const s = size / 16, metal = METALS[material] || (/^#[0-9a-f]{6}$/i.test(material || '') ? material : C.metal), hi = C.metalLight, dark = C.metalDark;
    const p = (a, b, w, h, c) => rect(g, x + a * s, y + b * s, w * s, h * s, c);
    const blade = () => { p(7, 1, 2, 10, dark); p(7, 1, 1, 9, hi); p(8, 2, 1, 8, metal); p(4, 10, 8, 2, C.gold); p(7, 12, 2, 3, C.woodDark); p(6, 14, 4, 1, C.gold); };
    if (id === 'swords' || id === 'sword') blade();
    else if (id === 'daggers') { p(7, 3, 3, 8, metal); p(7, 3, 1, 7, hi); p(6, 5, 1, 5, dark); p(4, 10, 8, 2, C.gold); p(7, 12, 2, 3, C.woodDark); }
    else if (id === 'axes') { p(8, 2, 2, 13, C.woodDark); p(8, 3, 1, 10, C.woodLight); p(3, 2, 6, 6, dark); p(2, 3, 6, 4, metal); p(2, 3, 1, 4, hi); p(9, 3, 3, 3, metal); }
    else if (id === 'maces') { p(7, 6, 2, 9, C.woodDark); p(4, 2, 8, 5, dark); p(3, 3, 10, 3, metal); p(5, 1, 2, 7, hi); p(9, 1, 2, 7, metal); p(6, 13, 4, 2, C.gold); }
    else if (id === 'polearms') { p(7, 3, 2, 13, C.wood); p(6, 2, 4, 4, metal); p(7, 0, 2, 5, hi); p(9, 4, 3, 3, dark); p(10, 3, 2, 3, metal); p(6, 8, 4, 1, C.gold); }
    else if (id === 'bows') { p(5, 1, 3, 2, C.woodDark); p(8, 3, 2, 2, C.wood); p(10, 5, 2, 6, C.wood); p(8, 11, 2, 2, C.wood); p(5, 13, 3, 2, C.woodDark); p(5, 2, 1, 12, '#eee6d1'); p(2, 7, 12, 1, C.woodDark); p(12, 6, 2, 3, metal); }
    else if (id === 'foci') { p(7, 6, 2, 9, C.woodDark); p(6, 11, 4, 1, C.gold); p(5, 2, 6, 5, dark); p(6, 1, 4, 7, '#9b94cb'); p(5, 3, 6, 3, '#bcb9e9'); p(6, 2, 2, 3, '#ece7ff'); p(4, 6, 8, 2, C.gold); }
    else if (id === 'armor') { p(4, 2, 3, 2, dark); p(9, 2, 3, 2, dark); p(2, 4, 12, 5, dark); p(4, 5, 8, 9, metal); p(3, 4, 3, 4, hi); p(10, 4, 3, 4, metal); p(7, 4, 2, 8, hi); p(4, 12, 8, 2, C.woodDark); p(7, 12, 2, 2, C.gold); }
    else if (id === 'shields') { p(3, 2, 10, 8, dark); p(4, 10, 8, 2, dark); p(5, 12, 6, 2, dark); p(7, 14, 2, 1, dark); p(4, 3, 8, 7, metal); p(5, 10, 6, 2, metal); p(7, 4, 2, 9, hi); p(5, 6, 6, 2, C.gold); }
    else if (id === 'rings') { p(5, 5, 6, 2, C.gold); p(3, 7, 2, 5, C.gold); p(11, 7, 2, 5, '#bd8c47'); p(5, 12, 6, 2, '#cfaa60'); p(4, 7, 1, 4, '#fff0ad'); p(6, 2, 4, 4, '#9cbbd4'); p(7, 1, 2, 5, '#dbe8e7'); }
    else if (id === 'charms') { p(4, 1, 1, 6, C.woodDark); p(11, 1, 1, 6, C.woodDark); p(5, 6, 6, 1, C.woodDark); p(6, 7, 4, 2, C.gold); p(4, 9, 8, 3, '#95bca6'); p(5, 12, 6, 2, '#749d8b'); p(7, 8, 2, 7, '#d2e7b6'); }
    else if (id === 'tools' || id === 'mine' || id === 'quarry') { p(7, 6, 2, 9, C.woodDark); p(8, 7, 1, 6, C.woodLight); p(2, 3, 11, 3, dark); p(4, 2, 7, 2, metal); p(1, 5, 3, 2, hi); p(12, 5, 2, 3, metal); }
    else if (id === 'wood') { p(2, 5, 12, 7, '#936847'); p(3, 5, 10, 2, '#cf9a61'); p(3, 8, 9, 1, '#b88051'); p(1, 6, 3, 5, '#e0b37a'); p(2, 7, 1, 3, '#966844'); p(12, 6, 2, 5, '#b48258'); }
    else if (id === 'leather') { p(4, 3, 8, 11, '#ad7152'); p(2, 5, 12, 6, '#c99067'); p(4, 2, 2, 3, '#dbb185'); p(10, 2, 2, 3, '#bf855e'); p(6, 5, 4, 1, '#e4b584'); p(3, 10, 2, 3, '#bb805e'); }
    else if (id === 'fuel') { p(2, 8, 11, 5, '#465c63'); p(4, 5, 5, 7, '#687b80'); p(8, 4, 5, 6, '#7b8b8e'); p(3, 7, 3, 2, '#9daaa7'); p(9, 6, 2, 2, '#b0b8ab'); }
    else if (id === 'gem' || /shard|crystal|fragment/.test(id)) { p(5, 2, 6, 2, '#d9eee0'); p(3, 4, 10, 5, '#a2d0c8'); p(5, 9, 6, 3, '#72aaae'); p(7, 12, 2, 2, '#7294a8'); p(6, 4, 3, 5, '#d5ebdd'); }
    else if (id === 'forge' || id === 'anvil') { p(2, 5, 12, 3, dark); p(1, 4, 11, 2, hi); p(6, 8, 4, 4, metal); p(4, 12, 8, 2, dark); p(2, 14, 12, 1, C.woodDark); }
    else if (id === 'gold' || id === 'coins') { p(3, 4, 10, 8, '#c38d42'); p(4, 3, 8, 10, C.gold); p(5, 4, 2, 6, '#ffe4a4'); p(8, 5, 3, 2, '#b88543'); p(9, 7, 2, 3, '#b88543'); }
    else { const col = METALS[id] || metal; p(2, 8, 12, 5, dark); p(4, 4, 8, 5, col); p(2, 8, 12, 2, col); p(5, 4, 6, 2, hi); p(12, 8, 2, 4, '#71878d'); }
  }

  function person(g,x,y,kind='vanguard',pose={},s=1){
    const p=COSTUMES[kind]||COSTUMES.vanguard,f=pose.facing===-1?-1:1,walk=pose.walk?Math.sin((pose.frame||0)*Math.PI/2):0;
    const R=(a,b,w,h,c)=>rect(g,x+(a*f-(f<0?w:0))*s,y+b*s,w*s,h*s,c);
    const O=(a,b,w,h,c)=>oval(g,x+(a*f-(f<0?w:0))*s,y+b*s,w*s,h*s,c);
    const B=(a,b,w,h,r,c,o=C.ink,border=1)=>roundBox(g,x+(a*f-(f<0?w:0))*s,y+b*s,w*s,h*s,r*s,c,o,border*s);
    oval(g,x-17*s,y-3*s,34*s,7*s,C.shadow);
    if(kind==='mage'||kind==='duelist')poly(g,[[x-10*s,y-32*s],[x-17*s,y-4*s],[x+16*s,y-4*s],[x+10*s,y-31*s]],p.shade);
    B(-10,-13+walk,9,12,3,'#48566b');B(2,-13-walk,9,12,3,'#48566b');
    B(-12,-5+walk,12,7,3,'#624839');R(-9,-4+walk,7,2,'#af865e');B(1,-5-walk,12,7,3,'#624839');R(4,-4-walk,7,2,'#af865e');
    B(-12,-31,25,23,6,p.shade);B(-11,-31,22,18,5,p.coat,p.shade,1);R(-6,-28,10,3,p.light);R(-9,-26,3,9,p.light);
    B(-17,-27+walk,8,17,3,p.coat);B(10,-27-walk,8,17,3,p.coat);
    B(-16,-15+walk,7,7,3,p.skin,'#986c54');B(11,-15-walk,7,7,3,p.skin,'#986c54');
    R(-11,-12,22,4,'#70503d');B(-2,-13,6,6,1,C.gold,'#8e693c');R(0,-11,2,2,C.cream);
    if(kind==='smith'){B(-8,-27,16,17,2,'#956140');R(-5,-25,3,12,'#b67d4e');R(-5,-21,10,1,'#6e4b3a');}
    O(-17,-42,7,10,'#ae765b');O(12,-42,7,10,'#ae765b');
    O(-16,-53,33,28,C.ink);O(-14,-52,29,25,'#d69a78');O(-14,-52,27,22,p.skin);O(-10,-49,18,10,'#ffdbb2');
    R(-13,-48,4,6,p.hair);R(11,-48,3,6,p.hair);R(-11,-51,24,6,p.hair);
    if(pose.rest){R(-8,-39,5,2,C.ink);R(4,-39,5,2,C.ink);}
    else{R(-9,-42,6,7,'#fff9e9');R(3,-42,6,7,'#fff9e9');R(-7,-41,3,6,C.ink);R(5,-41,3,6,C.ink);R(-6,-41,1,2,'#ffffff');R(6,-41,1,2,'#ffffff');}
    R(-12,-35,5,2,'#ed9a87');R(8,-35,5,2,'#ed9a87');R(-1,-37,3,3,'#dc9876');
    if(pose.happy){B(-4,-32,9,5,2,'#9a5f53','#9a5f53');R(-2,-32,5,2,'#fff4d8');}else R(-2,-31,5,1,'#9d6554');
    if(kind==='smith'){
      O(-15,-55,31,12,p.hat);R(-15,-49,31,4,'#e7756f');R(-10,-54,13,2,'#f49882');R(14,-49,8,4,p.hat);R(18,-45,4,8,p.hat);
      R(-10,-33,5,6,p.hair);R(7,-33,5,6,p.hair);R(-8,-28,17,4,p.hair);R(-4,-26,9,2,'#a36e44');
    }else if(kind==='mage'){
      poly(g,[[x-19*s,y-51*s],[x-13*s,y-61*s],[x-6*s,y-71*s],[x+1*s,y-66*s],[x+8*s,y-54*s],[x+19*s,y-49*s]],C.ink);
      poly(g,[[x-15*s,y-53*s],[x-11*s,y-60*s],[x-6*s,y-67*s],[x+1*s,y-61*s],[x+8*s,y-52*s]],p.hat);
      R(-11,-59,4,7,p.light);B(-20,-52,40,7,3,p.hat);R(-14,-50,25,2,p.light);R(2,-54,5,5,C.gold);
      poly(g,[[x-9*s,y-31*s],[x,y-20*s],[x+10*s,y-31*s]],p.hair);
    }else if(kind==='guardian'){
      O(-17,-58,35,19,C.ink);O(-15,-57,31,16,p.hat);O(-11,-55,20,9,'#deedf0');R(-17,-47,35,5,'#6d91aa');R(-2,-59,5,15,C.gold);R(-15,-42,4,9,'#84aabd');R(12,-42,4,9,'#84aabd');
    }else if(kind==='miner'){
      O(-17,-59,35,17,C.ink);O(-15,-57,31,13,p.hat);R(-17,-47,35,5,'#bc843e');R(-12,-55,14,3,'#ffe899');B(-4,-56,10,9,3,C.ink);R(-1,-54,4,5,'#fff9d8');
    }else if(kind==='ranger'){
      O(-17,-58,35,17,C.ink);O(-15,-56,31,14,p.hat);O(-11,-55,18,7,p.light);R(-17,-47,33,5,p.shade);R(10,-61,3,13,'#ffcb73');R(12,-62,4,7,'#ed785f');R(-9,-27,19,4,'#e3a360');
    }else if(kind==='duelist'){
      O(-16,-57,34,17,C.ink);O(-14,-55,30,14,p.hat);O(-10,-54,15,7,p.light);R(-14,-47,28,4,p.shade);R(12,-47,5,15,p.shade);R(-14,-46,3,7,p.hair);
    }else if(kind==='breaker'){
      O(-16,-57,34,15,p.hair);R(-15,-49,31,4,p.hat);R(-11,-48,16,1,'#f48e72');R(-11,-34,4,7,p.hair);R(8,-34,4,7,p.hair);R(-8,-28,17,3,p.hair);
    }else{
      O(-16,-57,34,16,C.ink);O(-14,-55,30,12,p.hat);O(-10,-54,17,5,p.light);R(-16,-47,32,4,p.shade);R(6,-52,6,4,C.gold);
    }
    if(pose.bag){B(11,-17,12,13,3,'#c59350');R(14,-19,7,3,'#795c3b');R(14,-14,3,5,'#f4c974');}
    if(pose.tool)paintIcon(g,pose.tool,x+(f>0?16:-36)*s,y-35*s,22*s,pose.material);
  }
  function bubble(g,x,y,text,iconId=null,material=null){
    const w=iconId?31:Math.max(31,String(text).length*6+14);
    roundBox(g,x-w/2,y,w,27,7,C.paper,C.outline,2);poly(g,[[x-5,y+25],[x+4,y+25],[x-1,y+32]],C.outline);poly(g,[[x-3,y+24],[x+2,y+24],[x-1,y+29]],C.paper);
    if(iconId)paintIcon(g,iconId,x-10,y+3,20,material);else label(g,text,x,y+9,C.ink,10,'center');
  }
  function hammer(g,x,y,t,active,reduced,s=1){
    const lift=active&&!reduced?(Math.floor(t/180)%3===0?14:Math.floor(t/180)%3===1?4:0):7;
    stairLine(g,x,y,x+15*s,y-(19+lift)*s,C.outline,5*s);stairLine(g,x+s,y,x+16*s,y-(18+lift)*s,C.woodLight,2*s);
    roundBox(g,x+8*s,y-(29+lift)*s,24*s,13*s,3*s,C.metal,C.ink,2*s);rect(g,x+12*s,y-(27+lift)*s,17*s,3*s,C.metalLight);
  }
  function fire(g,x,y,w,h,t,active,reduced){
    const flicker=active&&!reduced?Math.sin(t/125)*3:0;
    poly(g,[[x,y+h],[x+2,y+h*.48],[x+w*.22,y+h*.65],[x+w*.39,y+flicker],[x+w*.53,y+h*.44],[x+w*.75,y+h*.15-flicker],[x+w*.9,y+h*.57],[x+w,y+h]],'#ed7040');
    poly(g,[[x+4,y+h],[x+w*.24,y+h*.45],[x+w*.38,y+h*.72],[x+w*.49,y+h*.19],[x+w*.64,y+h*.63],[x+w*.82,y+h*.37],[x+w-4,y+h]],'#ffa546');
    poly(g,[[x+w*.25,y+h],[x+w*.42,y+h*.52],[x+w*.6,y+h*.78],[x+w*.71,y+h*.55],[x+w*.79,y+h]],'#ffe883');
  }
  function anvil(g,x,y,s=1){
    oval(g,x-38*s,y+22*s,78*s,13*s,C.shadow);
    roundBox(g,x-17*s,y+4*s,38*s,26*s,4*s,C.wood,C.outline,2*s);rect(g,x-10*s,y+8*s,3*s,16*s,C.woodLight);rect(g,x+10*s,y+8*s,2*s,17*s,C.woodDark);
    const P=(a,c)=>poly(g,a.map(p=>[x+p[0]*s,y+p[1]*s]),c);
    P([[-40,-13],[26,-13],[33,-9],[49,-8],[34,2],[16,2],[11,11],[24,15],[24,20],[-21,20],[-21,15],[-10,10],[-15,2],[-29,2]],C.ink);
    P([[-36,-11],[24,-11],[29,-6],[42,-6],[30,0],[13,0],[8,11],[-8,11],[-12,0],[-27,0]],C.metal);
    rect(g,x-30*s,y-10*s,50*s,4*s,C.metalLight);rect(g,x-8*s,y+4*s,16*s,6*s,C.metalDark);rect(g,x-18*s,y+15*s,38*s,3*s,C.metal);
  }
  function hasJobs(state){return (state.jobs||[]).some(j=>j.status==='active');}
  function roomShell(g,t,reduced,room){
    sky(g,t,reduced);tree(g,21,188,1.7);tree(g,620,197,1.55);grass(g,199,8);
    rect(g,34,220,573,12,C.pathLight);rect(g,40,231,563,3,'#b9956a');
    wall(g,44,75,553,139,room==='forge');floor(g,44,193,553,30);
    beam(g,34,70,14,156);beam(g,593,70,14,156);beam(g,40,188,560,8);
    roof(g,26,29,588,44,room==='shop'?'#469d94':C.roof,room==='shop'?'#8ad5b0':C.roofLight);
    for(let i=0;i<5;i++)flower(g,13+i*8,223+(i%2)*4,i%2?'#ef8e94':'#ffe492');
    flower(g,625,225,'#fba8bc');flower(g,609,226,'#ffe398');
  }
  function forgeScene(g,snap,t,reduced){
    const state=snap.state||{},data=snap.data||{},active=hasJobs(state);
    roomShell(g,t,reduced,'forge');sign(g,256,52,132,'EMBER & IRON');
    wall(g,104,5,55,122,true);beam(g,98,5,67,10);
    if(active){const a=reduced?0:mod(t/90,31);oval(g,110-a/3,3-a,28,16,'#e7dfcfb0');oval(g,126+a/4,-17-a*.3,23,17,'#e7dfcf90');}
    roundBox(g,69,110,110,111,13,'#9d7460',C.outline,3);wall(g,74,116,100,98,true);
    roundBox(g,90,143,69,66,27,'#6f4c45',C.outline,3);roundBox(g,96,149,57,55,22,'#493e46',C.outline,2);
    fire(g,103,active?166:181,43,active?38:23,t,active,reduced);
    for(let i=0;i<5;i++){rect(g,99+i*10,201,9,6,'#d27443');rect(g,102+i*10,201,4,2,'#ffd073');}
    beam(g,64,213,120,10);barrel(g,184,183,.99);
    windowPane(g,222,97,60,49);windowPane(g,508,98,59,46);
    box(g,309,99,34,47,C.paper,'#b78a59',2);rect(g,315,106,23,2,'#d1ac76');paintIcon(g,'swords',317,114,19);rect(g,315,137,20,2,'#d1ac76');
    beam(g,376,112,96,10);['tools','axes','maces'].forEach((id,i)=>{rect(g,389+i*28,120,2,5,C.ink);paintIcon(g,id,380+i*28,127,27);});
    box(g,478,183,108,32,C.wood,C.outline,2);beam(g,469,177,125,10);beam(g,479,207,8,17);beam(g,575,207,8,17);
    const mats=Object.keys(state.materials||{}).filter(id=>state.materials[id]>0).slice(0,4);
    mats.forEach((id,i)=>paintIcon(g,id,481+i*25,155,25,id));crate(g,530,194,33,27);pot(g,570,177,.72);
    anvil(g,371,181,1.08);person(g,314,221,'smith',{happy:active},1.52);hammer(g,338,200,t,active,reduced,1.02);
    if(active){box(g,359,167,26,6,'#ffc069','#b85635',1);rect(g,364,168,13,2,'#fff2aa');if(!reduced&&Math.floor(t/180)%3===2)for(let i=0;i<5;i++){const yy=163-((t/7+i*6)%22);rect(g,354+i*8,yy,2,3,i%2?C.gold:'#ffedac');}}
    if((state.staff||{}).apprentice)person(g,520,219,'smith',{tool:'tools'},1.03);
    if((state.upgrades||{}).parallel_stations)anvil(g,440,201,.47);
    lamp(g,53,126);lamp(g,579,126);crate(g,54,190,33,31);pot(g,597,213,.8);
  }
  function latestEvent(events,type,heroId){for(let i=(events||[]).length-1;i>=0;i--){const e=events[i];if(e.type===type&&(e.heroId===heroId||(e.heroIds||[]).includes(heroId)))return e;}return null;}
  function pathPosition(points,p){p=clamp(p,0,1);const n=points.length-1,k=Math.min(n-1,Math.floor(p*n)),q=p*n-k;return [points[k][0]+(points[k+1][0]-points[k][0])*q,points[k][1]+(points[k+1][1]-points[k][1])*q];}
  function stockItems(state){return (state.inventory||[]).filter(i=>i.displayed&&!i.protected);}
  function shoppers(g,snap,t,reduced,focused){
    const state=snap.state||{},data=snap.data||{},events=state.shopEvents||[],stock=stockItems(state),draw=[];
    const spots=focused?[[151,222],[256,220],[350,222]]:[[286,219],[330,220],[375,221]];
    const door=focused?[565,223]:[631,224],counter=focused?[436,225]:[408,223];
    (state.adventurers||[]).forEach((h,index)=>{
      const spot=spots[index%spots.length],arrive=latestEvent(events,'arrive',h.id),sale=latestEvent(events,'purchase',h.id),commission=latestEvent(events,'commission',h.id),purchase=commission&&(!sale||commission.time>sale.time)?commission:sale,depart=latestEvent(events,'depart',h.id);
      let xy=spot,walk=false,paid=false,rest=false,visible=false;
      if(h.status==='browsing'||h.status==='ready'){
        visible=true;
        const age=t-Math.max(arrive?arrive.time:0,h.arrivedAt||0),payAge=t-(purchase?purchase.time:-100000);
        if(age<5200&&!reduced){xy=pathPosition([door,[door[0]-33,228],spot],age/5200);walk=true;}
        else if(h.status==='ready'&&payAge<4400){paid=true;if(!reduced){if(payAge<1100){xy=pathPosition([spot,counter],payAge/1100);walk=true;}else if(payAge<2700)xy=counter;else{xy=pathPosition([counter,spot],(payAge-2700)/1700);walk=true;}}}
      }else if(h.status==='travelling'&&depart&&t-depart.time<4600&&!reduced){visible=true;walk=true;paid=true;xy=pathPosition([counter,door,[W+34,228]],(t-depart.time)/4600);}
      else if(h.status==='recovering'&&index<2){visible=true;rest=true;xy=focused?[78+index*45,226]:[222+index*27,225];}
      if(!visible)return;
      const archetype=data.archetypes&&data.archetypes[h.archetypeId],prefs=archetype&&archetype.preferences||[];
      const wanted=stock.find(item=>{const r=data.recipes&&data.recipes[item.recipeId];return r&&prefs.includes(r.classId);});
      const recipe=wanted&&data.recipes[wanted.recipeId];
      draw.push({h,xy,walk,paid,rest,recipe,purchase});
    });
    draw.sort((a,b)=>a.xy[1]-b.xy[1]).slice(0,focused?6:5).forEach((o,index)=>{
      const s=focused?1.16:.81,top=o.xy[1]-(focused?91:67);
      person(g,o.xy[0]+(index>2?12:0),o.xy[1],o.h.archetypeId,{walk:o.walk,frame:reduced?0:Math.floor(t/170),happy:o.paid,rest:o.rest,bag:o.paid,facing:o.walk?-1:1},s);
      if(!o.walk&&!o.rest){if(o.paid)bubble(g,o.xy[0],top,'Thanks!');else bubble(g,o.xy[0],top,'?',o.recipe&&o.recipe.classId,o.recipe&&o.recipe.materialId);}
      if(o.rest)bubble(g,o.xy[0],top,'Zz');
      if(o.purchase&&Number.isFinite(o.purchase.price)&&t-o.purchase.time<1600&&t>=o.purchase.time&&!reduced)label(g,'+'+o.purchase.price+'g',o.xy[0],top-9-(t-o.purchase.time)/120,'#fff5b2',10,'center');
    });
  }
  function shopScene(g,snap,t,reduced){
    const state=snap.state||{},data=snap.data||{};
    roomShell(g,t,reduced,'shop');sign(g,216,52,208,String(state.shopName||'THE LITTLE ARMORY').slice(0,23));
    roundBox(g,66,99,251,105,6,'#916243',C.outline,3);rect(g,74,106,235,86,'#b77d51');
    for(let row=0;row<2;row++){for(let col=0;col<6;col++){roundBox(g,76+col*39,108+row*42,35,38,4,'#c99764','#936640',1);rect(g,78+col*39,110+row*42,31,2,'#e9bc86');}beam(g,71,146+row*43,241,8);}
    stockItems(state).slice(0,12).forEach((item,i)=>{const r=data.recipes&&data.recipes[item.recipeId];if(r)paintIcon(g,r.classId,78+(i%6)*39,110+Math.floor(i/6)*42,31,r.materialId);});
    windowPane(g,349,99,62,47);pot(g,354,151,.72);
    oval(g,366,141,31,12,'#94543b');oval(g,368,139,27,12,'#e79d54');oval(g,388,137,13,12,'#eeae6c');poly(g,[[389,140],[390,134],[394,139]],C.outline);poly(g,[[397,140],[399,134],[401,141]],C.outline);rect(g,391,142,2,1,C.ink);rect(g,397,142,2,1,C.ink);
    if((state.staff||{}).envoy)person(g,463,192,'duelist',{},1.08);
    box(g,381,181,137,42,'#c98e54',C.outline,3);beam(g,375,174,149,12);box(g,391,189,117,26,'#e7b775','#9a6c43',2);
    rect(g,424,183,48,29,'#64ad9d');rect(g,428,184,40,3,'#a7d7b4');paintIcon(g,'shields',437,186,22,'bronze');
    roundBox(g,482,154,30,21,4,C.woodDark,C.outline,2);rect(g,487,158,20,7,'#eec577');rect(g,487,168,20,3,'#bfb79a');oval(g,464,169,13,4,C.gold);oval(g,451,169,11,4,C.gold);
    roundBox(g,532,96,59,126,23,'#679e91',C.outline,4);round(g,539,103,45,116,18,'#aae0e0');rect(g,539,159,45,60,'#a5ce72');poly(g,[[554,162],[563,162],[580,219],[541,219]],C.pathLight);
    beam(g,528,116,10,108);beam(g,585,116,10,108);beam(g,535,213,52,8);rect(g,542,223,42,4,'#b99463');lamp(g,514,121);
    box(g,329,186,32,35,C.wood,C.outline,2);beam(g,325,181,40,8);
    const showcase=stockItems(state)[0],r=showcase&&data.recipes&&data.recipes[showcase.recipeId];if(r)paintIcon(g,r.classId,328,150,32,r.materialId);
    barrel(g,56,190,.87);crate(g,603,202,27,27);
    shoppers(g,snap,t,reduced,true);
  }

  function cliff(g,x,y,w,h,ore='iron'){
    const edge=[[x,y+h],[x+2,y+h*.48],[x+w*.12,y+h*.43],[x+w*.18,y+h*.14],[x+w*.38,y],[x+w*.61,y+5],[x+w*.78,y+h*.14],[x+w*.88,y+h*.39],[x+w-2,y+h*.54],[x+w,y+h]];
    poly(g,edge,'#526775');
    poly(g,[[x+5,y+h-3],[x+8,y+h*.51],[x+w*.19,y+h*.47],[x+w*.21,y+h*.19],[x+w*.39,y+5],[x+w*.6,y+9],[x+w*.75,y+h*.19],[x+w*.84,y+h*.44],[x+w-9,y+h*.55],[x+w-5,y+h-3]],'#89a0a4');
    poly(g,[[x+w*.19,y+h*.49],[x+w*.21,y+h*.2],[x+w*.39,y+7],[x+w*.35,y+h*.42],[x+w*.45,y+h*.61]],'#bac7bb');
    poly(g,[[x+w*.61,y+10],[x+w*.75,y+h*.2],[x+w*.72,y+h*.47],[x+w*.84,y+h*.65],[x+w*.7,y+h]],'#6b8590');
    poly(g,[[x+7,y+h*.64],[x+w*.22,y+h*.54],[x+w*.31,y+h*.79],[x+w*.17,y+h]],'#9eada8');
    stairLine(g,x+w*.22,y+h*.47,x+w*.39,y+h*.56,'#657f89',3);stairLine(g,x+w*.77,y+h*.68,x+w*.93,y+h*.56,'#bfd0bf',2);
    const color=METALS[ore]||METALS.iron;
    for(let i=0;i<10;i++){const n=hash(String(i)+ore),xx=x+12+(n%Math.max(1,w-34)),yy=y+h*.45+((n>>>10)%Math.max(1,Math.floor(h*.5)));poly(g,[[xx,yy+3],[xx+5,yy],[xx+11,yy+3],[xx+8,yy+8],[xx+2,yy+7]],'#597c81');poly(g,[[xx+2,yy+3],[xx+5,yy+1],[xx+9,yy+3],[xx+7,yy+6]],color);rect(g,xx+4,yy+2,3,2,'#e4ecd1');}
    for(let i=0;i<7;i++){const xx=x+w*.2+i*w*.088;oval(g,xx,y+13+Math.abs(3-i)*4,w*.13,11,'#6faa69');oval(g,xx+2,y+12+Math.abs(3-i)*4,w*.09,5,'#a1d179');}
  }
  function cart(g,x,y,ore='bronze',amount=3,s=1){
    oval(g,x-28*s,y+16*s,60*s,10*s,C.shadow);
    for(let i=0;i<amount;i++){const xx=x-20*s+(i%4)*11*s,yy=y-8*s-Math.floor(i/4)*7*s;poly(g,[[xx,yy+9*s],[xx+2*s,yy],[xx+9*s,yy-3*s],[xx+13*s,yy+7*s]],C.metalDark);poly(g,[[xx+3*s,yy+6*s],[xx+4*s,yy],[xx+9*s,yy-s],[xx+10*s,yy+6*s]],METALS[ore]||METALS.iron);}
    poly(g,[[x-29*s,y],[x+29*s,y],[x+24*s,y+21*s],[x-23*s,y+21*s]],C.ink);
    poly(g,[[x-25*s,y+3*s],[x+25*s,y+3*s],[x+21*s,y+17*s],[x-20*s,y+17*s]],'#819aa4');rect(g,x-23*s,y+4*s,45*s,3*s,'#bdd1d0');rect(g,x-17*s,y+8*s,3*s,5*s,'#d1ddd2');rect(g,x+14*s,y+8*s,3*s,5*s,'#d1ddd2');
    oval(g,x-20*s,y+16*s,12*s,12*s,C.ink);oval(g,x+8*s,y+16*s,12*s,12*s,C.ink);oval(g,x-17*s,y+19*s,6*s,6*s,C.metal);oval(g,x+11*s,y+19*s,6*s,6*s,C.metal);
  }
  function quarryScene(g,snap,t,reduced){
    const state=snap.state||{},q=state.quarry||{},up=q.upgrades||{},workers=q.workers||{};
    const ore=q.activeDeposit||'bronze';
    const count=Object.values(workers).reduce((a,b)=>a+(Number(b)||0),0),active=count>0&&!q.pausedReason,frame=reduced?0:Math.floor(t/200);
    sky(g,t,reduced);tree(g,31,193,1.65);tree(g,589,202,1.8);grass(g,188,4);
    poly(g,[[284,154],[353,154],[423,240],[235,240]],C.path);poly(g,[[297,156],[342,156],[385,240],[276,240]],C.pathLight);
    cliff(g,144,51,349,164,ore);
    roundBox(g,246,90,150,128,67,'#344a59','#526b75',4);round(g,253,98,136,117,60,'#3f5967');round(g,273,124,95,86,39,'#324654');
    beam(g,237,110,14,111);beam(g,394,110,14,111);beam(g,232,96,181,17);stairLine(g,247,115,268,133,C.woodDark,7);stairLine(g,381,132,398,113,C.woodDark,7);lamp(g,257,119);lamp(g,375,119);
    for(let i=0;i<7;i++){const yy=165+i*11,ww=52+i*6;box(g,320-ww/2,yy,ww,5,C.wood,C.outline,1);}
    stairLine(g,297,155,262,240,C.metalDark,4);stairLine(g,346,155,388,240,C.metalDark,4);stairLine(g,298,155,264,240,C.metalLight,1);stairLine(g,347,155,390,240,C.metalLight,1);
    cart(g,324+(active&&!reduced?Math.sin(t/900)*3:0),190,ore,Math.max(2,Math.min(7,count+3)),1.06);
    sign(g,449,123,114,'DEPTH '+(Number(up.depth)||q.depth||0));beam(g,504,147,6,35);
    const positions=[[189,224],[445,224],[117,218],[515,221]];
    if(count){positions.slice(0,Math.min(4,count)).forEach((xy,i)=>{person(g,xy[0],xy[1],'miner',{tool:i%2?'tools':null,frame,walk:!reduced&&i===3},1.17);if(i%2===0)hammer(g,xy[0]+19,xy[1]-18,t+i*370,active,reduced,.65);});}
    else{person(g,184,225,'smith',{tool:'tools'},1.21);hammer(g,205,208,t,Number(q.nextManualAt)>t,reduced,.67);}
    for(let i=0;i<5;i++)paintIcon(g,ore,75+i%3*17,207-Math.floor(i/3)*14,22,ore);
    crate(g,69,208,34,27);barrel(g,548,196,1.02);pot(g,598,217,.74);
    if(up.smelter){roundBox(g,464,181,39,46,9,'#bb8067',C.outline,2);roundBox(g,471,190,25,24,9,'#5d4749',C.outline,2);fire(g,476,199,16,14,t,active,reduced);rect(g,475,169,18,15,'#8c7b70');}
    else crate(g,472,206,35,29);
    flower(g,28,225,'#f2a2b0');flower(g,45,219,'#ffec92');flower(g,609,230,'#f2a2b0');fence(g,5,193,4,.72);fence(g,576,191,4,.72);
  }
  function village(g,snap,t,reduced){
    const state=snap.state||{},data=snap.data||{},active=hasJobs(state);
    sky(g,t,reduced);tree(g,17,192,1.4);tree(g,617,190,1.5);grass(g,179,5);
    rect(g,0,216,W,18,C.path);rect(g,0,218,W,7,C.pathLight);fence(g,435,176,4,.82);
    wall(g,29,111,184,91,true);floor(g,29,194,184,18);beam(g,24,107,10,107);beam(g,208,107,10,107);roof(g,15,73,207,38);
    wall(g,60,41,35,92,true);beam(g,54,41,47,8);
    roundBox(g,43,144,50,58,15,'#74524a',C.outline,3);round(g,49,150,38,45,12,'#493d44');fire(g,56,active?165:178,25,active?31:17,t,active,reduced);beam(g,39,198,59,8);
    windowPane(g,164,123,32,33);anvil(g,160,192,.58);person(g,124,212,'smith',{happy:active},.98);hammer(g,139,201,t,active,reduced,.65);
    barrel(g,184,185,.68);crate(g,29,191,23,23);lamp(g,102,135);
    wall(g,244,116,183,85,false);floor(g,244,199,183,13);beam(g,238,113,10,101);beam(g,423,113,10,101);roof(g,228,75,213,40,'#499e93','#9adcb3');
    sign(g,282,97,111,'ARMORY');windowPane(g,379,131,30,29);
    box(g,257,139,108,46,'#ab774e',C.outline,2);beam(g,254,177,113,7);
    stockItems(state).slice(0,5).forEach((item,i)=>{const r=data.recipes&&data.recipes[item.recipeId];if(r)paintIcon(g,r.classId,258+i*21,146,22,r.materialId);});
    box(g,381,184,34,24,C.wood,C.outline,2);beam(g,376,181,43,6);paintIcon(g,'shields',390,187,17,'bronze');pot(g,421,198,.6);
    cliff(g,459,110,169,95,(state.quarry||{}).activeDeposit||'bronze');
    roundBox(g,513,143,57,65,24,'#314959',C.outline,3);beam(g,506,157,8,53);beam(g,570,157,8,53);beam(g,503,149,79,10);lamp(g,516,165);
    stairLine(g,529,186,517,218,C.metalDark,2);stairLine(g,553,186,564,218,C.metalDark,2);cart(g,544,193,'bronze',3,.52);
    const count=Object.values((state.quarry||{}).workers||{}).reduce((a,b)=>a+(Number(b)||0),0);if(count)person(g,588,219,'miner',{tool:'tools'},.79);
    crate(g,477,196,25,24);shoppers(g,snap,t,reduced,false);
    for(let i=0;i<9;i++)flower(g,9+i*73,235,i%2?'#ffda82':'#f7a1b5',.7);
  }
  function battleBackground(g,region,t,reduced){
    sky(g,t,reduced,region);grass(g,190,31,region);
    if(region==='frost'){for(let i=0;i<7;i++)fir(g,10+i*104,199+(i%2)*8,1.35,true);rect(g,0,227,W,8,'#eaf7da');}
    else if(region==='ember'){cliff(g,-51,80,198,143,'bronze');cliff(g,531,87,179,128,'bronze');rect(g,0,223,W,11,'#c78651');for(let i=0;i<16;i++)rect(g,i*43,226+(i%2)*4,22,2,'#ffbd63');}
    else if(region==='starfall'){for(let i=0;i<5;i++){const x=i*151+15;box(g,x,117,23,94,'#9296b6','#686e97',3);box(g,x-6,111,35,12,'#b7b4d0','#747898',2);paintIcon(g,'starforged',x-10,190,35,'starforged');}}
    else if(region==='quarry'){cliff(g,-26,93,184,118,'iron');cliff(g,533,102,158,111,'iron');crate(g,595,189,31,30);}
    else{tree(g,26,207,region==='wildwood'?2.35:1.6);tree(g,607,214,region==='wildwood'?2.6:1.7);if(region==='wildwood'){tree(g,100,185,1.18);tree(g,527,185,1.35);}else{fence(g,42,170,9,.72);fence(g,467,170,9,.72);}}
    poly(g,[[0,218],[119,212],[281,221],[400,212],[640,216],[640,232],[0,232]],region==='frost'?'#d4e7d4':region==='starfall'?'#c4b7a1':C.path);
    rect(g,16,221,52,2,'#f5dfaa');rect(g,539,222,52,2,'#f5dfaa');
    if(!['frost','ember','starfall'].includes(region)){flower(g,218,233,'#ffe492');flower(g,399,232,'#f6a6ac');flower(g,80,230,'#f8e38c');}
  }
  function enemySprite(g,x,y,definition={},region,pose={}){
    const name=(definition.name||definition.id||'foe').toLowerCase(),hit=pose.hit,dead=pose.dead;
    if(dead){oval(g,x-22,y-2,44,6,C.shadow);roundBox(g,x-11,y-10,22,11,4,'#819292',C.ink,1);rect(g,x-5,y-9,9,2,'#b8c7b4');return;}
    const rat=/rat|wolf|hound|beast/.test(name),boss=/sovereign|golem|sentinel|warden|guardian|coloss/.test(name);
    oval(g,x-29,y-1,58,8,C.shadow);
    if(rat){
      const body=region==='frost'?'#adbdc4':'#ad8d9e',light=region==='frost'?'#dbe4df':'#d4afb5';
      stairLine(g,x+20,y-9,x+41,y-18,'#705b70',4);stairLine(g,x+24,y-8,x+42,y-19,'#ca97a0',2);
      roundBox(g,x-29,y-25,59,26,12,C.ink,C.ink,2);oval(g,x-27,y-26,54,24,body);oval(g,x-19,y-25,36,14,light);
      oval(g,x-42,y-34,31,30,C.ink);oval(g,x-40,y-32,27,26,body);oval(g,x-39,y-44,15,20,C.ink);oval(g,x-37,y-42,11,17,'#dc9eaa');
      oval(g,x-44,y-16,19,11,light);oval(g,x-45,y-15,6,6,'#584763');rect(g,x-34,y-28,7,8,'#fff4d7');rect(g,x-34,y-27,3,6,C.ink);rect(g,x-35,y-30,10,2,C.ink);rect(g,x-40,y-7,3,4,'#fff4d7');
      roundBox(g,x-17,y-4,14,7,3,'#6d596c',C.ink,1);roundBox(g,x+14,y-3,13,7,3,'#6d596c',C.ink,1);
    }else if(boss){
      const s=/sovereign|coloss/.test(name)?1.3:1,metal=region==='ember'?'#b77468':region==='frost'?'#90b9c9':region==='starfall'?'#9689c2':'#8ca6a0';
      const B=(a,b,w,h,r,c)=>roundBox(g,x+a*s,y+b*s,w*s,h*s,r*s,c,C.ink,2*s);
      B(-27,-52,55,46,10,metal);B(-28,-82,57,41,10,metal);B(-40,-50,15,33,6,metal);B(25,-50,15,33,6,metal);B(-25,-10,20,14,5,metal);B(7,-10,20,14,5,metal);
      rect(g,x-20*s,y-76*s,38*s,5*s,'#d2d6d5');rect(g,x-21*s,y-60*s,16*s,10*s,'#526376');rect(g,x+6*s,y-60*s,16*s,10*s,'#526376');rect(g,x-17*s,y-58*s,9*s,5*s,C.gold);rect(g,x+8*s,y-58*s,9*s,5*s,C.gold);
      poly(g,[[x,y-43*s],[x+11*s,y-32*s],[x,y-19*s],[x-11*s,y-32*s]],C.ink);poly(g,[[x,y-39*s],[x+7*s,y-32*s],[x,y-23*s],[x-7*s,y-32*s]],region==='ember'?'#ffb45c':'#80e2d3');
      if(/sovereign/.test(name)){poly(g,[[x-21*s,y-81*s],[x-25*s,y-97*s],[x-10*s,y-87*s],[x,y-103*s],[x+10*s,y-87*s],[x+25*s,y-97*s],[x+21*s,y-81*s]],C.ink);poly(g,[[x-18*s,y-83*s],[x-20*s,y-92*s],[x-8*s,y-84*s],[x,y-97*s],[x+8*s,y-84*s],[x+20*s,y-92*s],[x+18*s,y-83*s]],C.gold);}
    }else{
      const kind=/priest|echo|shade|witch|wisp/.test(name)?'mage':/archer|scout/.test(name)?'ranger':'breaker';
      person(g,x,y,kind,{facing:-1,tool:kind==='mage'?'foci':'axes',happy:false},1.4);
      if(/bandit|smug/.test(name)){rect(g,x-19,y-58,37,7,'#5a5366');rect(g,x-12,y-57,5,4,'#fff0ca');rect(g,x+7,y-57,5,4,'#fff0ca');}
    }
    if(hit){rect(g,x-8,y-51,3,10,'#fff7d9');rect(g,x-13,y-46,13,3,'#fff7d9');}
  }
  function healthBar(g,x,y,unit,hero){
    const hp=clamp(Number(unit.hp),0,Number(unit.maxHp)||1),max=Number(unit.maxHp)||1;
    roundBox(g,x-34,y,68,9,4,'#554f62',C.ink,1);const w=Math.round(64*hp/max);if(w){round(g,x-32,y+2,w,5,2,hero?'#74c97b':'#ef9684');rect(g,x-30,y+2,Math.max(0,w-5),1,hero?'#baeca0':'#ffc6aa');}
    label(g,Math.ceil(hp)+' / '+Math.ceil(max),x,y+12,'#fff8d8',8,'center');
  }
  function battle(g,snap,t,reduced,runtime){
    const state=snap.state||{},data=snap.data||{},view=snap.battle,quest=view&&data.quests&&data.quests[view.questId],region=quest&&quest.regionId||'town';
    battleBackground(g,region,t,reduced);
    if(!view){const heroes=(state.adventurers||[]).slice(0,2);heroes.forEach((h,i)=>person(g,260+i*100,215,h.archetypeId,{},1.4));return;}
    if(runtime.runId!==view.id){runtime.runId=view.id;runtime.events=(view.events||[]).length;runtime.hit=null;}
    const events=view.events||[];
    if(events.length>runtime.events){const fresh=events.slice(runtime.events).filter(e=>e.type==='attack');if(fresh.length)runtime.hit={event:fresh[fresh.length-1],time:t};runtime.events=events.length;}
    else if(events.length<runtime.events){runtime.events=events.length;runtime.hit=null;}
    const hit=!reduced&&runtime.hit&&t-runtime.hit.time>=0&&t-runtime.hit.time<650?runtime.hit:null;
    const run=(state.runs||[]).find(r=>r.id===view.id),frozen=run&&run.heroSnapshots||[];
    const heroes=view.heroes||[],enemies=view.enemies||[];
    const positions={};
    heroes.forEach((unit,i)=>{
      const h=frozen.find(a=>a.id===unit.id)||(state.adventurers||[]).find(a=>a.id===unit.id)||{},xx=heroes.length===1?170:83+i*81,yy=216+(i%2)*2;
      const lunge=hit&&hit.event.actorId===unit.id?Math.sin((t-hit.time)/650*Math.PI)*13:0;
      positions[unit.id]=[xx+lunge,yy-51];
      const gear=(frozen.find(a=>a.id===unit.id)||{}).equipment||h.equipment||{},weapon=gear.weapon,recipe=weapon&&data.recipes&&data.recipes[weapon.recipeId];
      if(unit.hp>0)person(g,xx+lunge,yy,h.archetypeId||'vanguard',{tool:recipe&&recipe.classId,material:recipe&&recipe.materialId,happy:view.victory===true},1.35);
      else enemySprite(g,xx,yy,{},region,{dead:true});
      label(g,unit.name||h.name||'Adventurer',xx,101,'#294d58',10,'center');healthBar(g,xx,115,unit,true);
    });
    enemies.forEach((unit,i)=>{
      const xx=enemies.length===1?473:435+i*93,yy=216-(i%2)*2,def=(quest&&quest.enemies||[]).find(e=>e.id===unit.id)||(quest&&quest.enemies||[])[i]||unit;
      const lunge=hit&&hit.event.actorId===unit.id?-Math.sin((t-hit.time)/650*Math.PI)*11:0;
      positions[unit.id]=[xx+lunge,yy-49];enemySprite(g,xx+lunge,yy,def,region,{dead:unit.hp<=0,hit:!!(hit&&hit.event.targetId===unit.id)});
      label(g,unit.name||def.name||'Foe',xx,69,'#294d58',10,'center');healthBar(g,xx,82,unit,false);
    });
    if(hit){const target=positions[hit.event.targetId];if(target){const f=(t-hit.time)/650;if(!hit.event.dodged){stairLine(g,target[0]-15,target[1]+12,target[0]+15,target[1]-13,'#fff5ce',3);stairLine(g,target[0]-10,target[1]+12,target[0]+20,target[1]-13,'#fbb977',2);}const text=hit.event.dodged?'MISS':hit.event.blocked?'BLOCK':String(Math.round(hit.event.damage||0));label(g,text,target[0],target[1]-28-f*12,'#ffedac',13,'center');}}
  }
  function svgRect(x,y,w,h,c){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';}
  function recorder(){const parts=[];return {parts,fillStyle:'#000',fillRect(x,y,w,h){if(w>0&&h>0)parts.push(svgRect(x,y,w,h,this.fillStyle));}};}
  function icon(id,size=32){
    size=clamp(Number(size)||32,12,256);const g=recorder();paintIcon(g,String(id),0,0,32,Object.prototype.hasOwnProperty.call(METALS,id)?id:null);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">'+g.parts.join('')+'</svg>';
  }
  function portrait(archetypeId){
    const g=recorder();roundBox(g,1,1,62,62,13,'#e5efd3','#b5cda4',2);person(g,32,68,Object.prototype.hasOwnProperty.call(COSTUMES,archetypeId)?archetypeId:'vanguard',{happy:true},.89);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" shape-rendering="crispEdges" aria-hidden="true">'+g.parts.join('')+'</svg>';
  }
  function mount(canvas,options={}){
    if(!canvas||typeof canvas.getContext!=='function')throw new TypeError('EIScenes.mount requires a canvas');
    const doc=canvas.ownerDocument||(typeof document!=='undefined'?document:null);
    const surface=doc.createElement('canvas');surface.width=W;surface.height=H;
    const g=surface.getContext('2d'),out=canvas.getContext('2d');let destroyed=false,snapshot=null;
    const kind=['village','forge','shop','quarry','battle'].includes(options.kind)?options.kind:'village';
    const runtime={runId:null,events:0,hit:null};
    if(!canvas.width||canvas.width===300)canvas.width=1280;if(!canvas.height||canvas.height===150)canvas.height=480;
    function click(event){if(destroyed||!options.onAction)return;const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width*W;const room=kind==='village'?(x<227?'forge':x<443?'shop':'quarry'):kind;options.onAction({type:'room',room,runId:snapshot&&snapshot.battle&&snapshot.battle.id});}
    if(options.onAction)canvas.addEventListener('click',click);
    return {
      draw(snap,timeMs,reducedMotion=false){
        if(destroyed)return;snapshot=snap||{};const state=snapshot.state||{},t=Number.isFinite(timeMs)?timeMs:Number(state.simTime)||0;
        g.clearRect(0,0,W,H);g.imageSmoothingEnabled=false;
        if(kind==='forge')forgeScene(g,snapshot,t,reducedMotion);
        else if(kind==='shop')shopScene(g,snapshot,t,reducedMotion);
        else if(kind==='quarry')quarryScene(g,snapshot,t,reducedMotion);
        else if(kind==='battle')battle(g,snapshot,t,reducedMotion,runtime);
        else village(g,snapshot,t,reducedMotion);
        out.imageSmoothingEnabled=false;out.clearRect(0,0,canvas.width,canvas.height);out.drawImage(surface,0,0,canvas.width,canvas.height);
      },
      destroy(){if(destroyed)return;destroyed=true;if(options.onAction)canvas.removeEventListener('click',click);snapshot=null;surface.width=1;surface.height=1;}
    };
  }
  root.EIScenes=Object.freeze({mount,icon,portrait,nativeWidth:W,nativeHeight:H});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.EIScenes;
})(typeof window!=='undefined'?window:globalThis);
