/* Controlled UI fixtures, never campaign pacing evidence. Only work on QA port 8792. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const E=require('../../house-engine'),D=require('../../data'),H=require('../../house-data');
function fixture(champions){
  const e=new E(structuredClone(D));
  e.command('create',{smithName:'Aveline',name:'House of the Silver Anvil',profession:'artificer',stats:{strength:5,precision:5,charisma:5,knowledge:5}});
  Object.assign(e.state.player,{gold:12000,level:25,points:7});
  e.state.player.stats={strength:50,precision:50,charisma:30,knowledge:50};
  Object.assign(e.state.house,{champions,contracts:30,wins:champions*16,losses:3,rung:0});
  e.state.world.totalMined=10000;
  e.state.stats.crafted=200;
  for(const p of Object.values(e.state.player.proficiency))p.level=65;
  for(const n of Object.values(H.upgrades))if((n.champions||0)<=champions)e.state.house.upgrades[n.id]=1;
  for(const id of ['iron','steel'])e.state.workshop.upgrades[id]=1;
  e.state.workshop.upgrades.stockkeeper=1;
  for(const id of Object.keys(e.state.materials))e.state.materials[id]=Math.min(30,e.binCapacity());
  for(let i=0;i<Math.min(15,champions*3);i++)e.state.house.qualification[i]={wins:5,styles:H.rivals.map(r=>r.id)};
  for(const u of e.state.adventurers)for(const slot of H.slots){
    const r=Object.values(e.data.recipes).find(r=>r.tier===Math.min(5,champions+1)&&r.variant===1&&r.slot===slot&&e.data.archetypes[u.archetypeId].preferences.includes(r.classId));
    if(!r)continue;
    const item={id:e._id('item'),recipeId:r.id,quality:100,createdAt:e.state.simTime,displayed:false,protected:true,reservedFor:null,makerGeneration:1,grade:'standard',treatment:'warding'};
    e.state.inventory.push(item);e.command('equip',{heroId:u.id,itemId:item.id});
  }
  e.command('hireStaff',{staffId:'assayer'});
  if(champions===5){e.state.player.legacy.generation=2;e.state.player.legacy.points=60;e.state.player.legacy.totalPoints=60;}
  e.command('challenge',{rival:'choir',league:Math.max(0,champions-1),rung:0,kind:'exhibition'});
  const m=e.activeMatch();if(m)e.tick(m.endsAt-e.state.simTime+50000);
  const v=E.validateSave(e.exportSave(),e.data);if(!v.ok)throw Error(v.message);
  return JSON.parse(e.exportSave());
}
const fixtures={mid:fixture(2),late:fixture(5)};
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>House UI review fixtures</title><style>body{font:17px system-ui;background:#122129;color:#eee;padding:32px;max-width:800px}button{padding:16px;margin:10px;background:#dfb67a;color:#152126;border:0;font-size:17px}</style><h1>Isolated House UI review</h1><p>These are controlled visual fixtures, not earned campaign saves. Available only on localhost port 8792. Loading replaces only that test origin's Arena slot.</p><button data-key="fresh">Fresh creation</button><button data-key="mid">Established house</button><button data-key="late">Champion / Legacy</button><script>const fixtures=${JSON.stringify(fixtures)};document.addEventListener('click',e=>{const key=e.target.dataset.key;if(!key)return;if(!['localhost','127.0.0.1'].includes(location.hostname)||location.port!=='8792')throw Error('Use isolated QA port8792');for(const suffix of ['', '-backup','-owner'])localStorage.removeItem('ember-iron-arena-v1'+suffix);if(fixtures[key]){fixtures[key].state.lastWallTime=Date.now();localStorage.setItem('ember-iron-arena-v1',JSON.stringify(fixtures[key]));}location.href='../../index.html';});</script>`;
fs.writeFileSync(path.join(__dirname,'../qa/house-review.html'),html);
console.log('Created isolated fixture page.');
