'use strict';
const assert=require('node:assert/strict');const {handle,db,leaderboard}=require('./server');
const created=handle('create',{});const code=created.code;const pin=created.pin;
const players=[];
for(let i=0;i<20;i++){players.push(handle('join',{code,name:`참가자${i+1}`}));}
assert.equal(db.rooms[code].players.length,20);
let oldTargets={};
for(let round=1;round<=3;round++){
 handle('startRound',{code,pin});let state=handle('state',{code,token:players[0].token});assert.equal(state.roundNumber,round);assert.equal(state.phase,'briefing');
 const targets=db.rooms[code].rounds.at(-1).assignments;
 assert.equal(new Set(Object.values(targets).map(x=>x.targetId)).size,20);
 for(let p of Object.values(targets)){assert.notEqual(p.playerId,p.targetId);assert.equal(oldTargets[p.playerId]?.includes(p.targetId)||false,false);oldTargets[p.playerId]=[...(oldTargets[p.playerId]||[]),p.targetId];}
 for(const p of players)handle('ready',{code,token:p.token});handle('activate',{code,pin});
 const a=db.rooms[code].players[0],b=db.rooms[code].players[1];
 assert.equal(handle('claim',{code,token:a.token,otherId:b.id,kind:'gift',actorId:a.id}).waiting,true);
 assert.equal(handle('claim',{code,token:b.token,otherId:a.id,kind:'gift',actorId:a.id}).matched,true);
 assert.throws(()=>handle('claim',{code,token:a.token,otherId:b.id,kind:'exchange',actorId:a.id}));
 let s=handle('state',{code,token:a.token});assert.equal(s.events.length,1);
 assert.equal(handle('state',{code,token:players[2].token}).events.length,0);
 for(const p of players)handle('finish',{code,token:p.token});
 assert.equal(handle('state',{code,token:a.token}).phase,'results');assert.equal(leaderboard(db.rooms[code]).length,20);
}
console.log('PASS: 20 players, secret missions, verified pair action, single interaction rule, no repeated targets, 3 rounds, rankings.');
delete db.rooms[code];
