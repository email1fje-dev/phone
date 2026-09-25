const express=require("express");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const KEY=process.env.OPENROUTER_API_KEY;
const MODEL=process.env.OPENROUTER_MODEL||"openrouter/free";
app.use(express.json({limit:"64kb"}));
app.use(express.static(path.join(__dirname,"public")));
const fallback={title:"THE LAST TRAIN",subtitle:"A phone kept receiving messages after its owner vanished.",location:"Northbridge Station",time:"02:17",missing:"Mia Carter",summary:"Mia disappeared after sending one final message. Her phone stayed online for eleven minutes after she was last seen.",suspects:[{name:"Evan Cole",role:"Friend",clue:"Says he left at 02:05."},{name:"Nora Vale",role:"Classmate",clue:"Deleted a message at 02:14."},{name:"Unknown",role:"Last contact",clue:"A hidden number called twice."}],evidence:["A photo at 02:17 shows an empty platform.","Maps jumps to a road 3 km away.","A voice memo contains station ambience.","A note says: Don't trust the timestamp.","The battery drops from 42% to 7%.","The final message was never delivered."],timeline:["01:48 — Mia arrives.","02:05 — Evan says he leaves.","02:11 — Mia opens Notes.","02:14 — A message is deleted.","02:17 — Camera opens.","02:28 — Phone goes offline."],twist:"The 02:17 timestamp was generated after the phone reconnected, so it may not be the real capture time."};
function extract(t){const m=t.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/i);const s=m?m[1]:t;const a=s.indexOf("{"),b=s.lastIndexOf("}");if(a<0||b<=a)return null;try{return JSON.parse(s.slice(a,b+1))}catch{return null}}
function clean(v){if(!v||typeof v!=="object")return null;return{title:String(v.title||"UNTITLED CASE").slice(0,80),subtitle:String(v.subtitle||"").slice(0,180),location:String(v.location||"Unknown").slice(0,100),time:String(v.time||"00:00").slice(0,20),missing:String(v.missing||"Unknown").slice(0,80),summary:String(v.summary||"").slice(0,600),suspects:Array.isArray(v.suspects)?v.suspects.slice(0,4):[],evidence:Array.isArray(v.evidence)?v.evidence.slice(0,10):[],timeline:Array.isArray(v.timeline)?v.timeline.slice(0,10):[],twist:String(v.twist||"").slice(0,500)}}
app.post("/api/generate-case",async(req,res)=>{
 const p=req.body&&req.body.profile||{};
 if(!KEY)return res.json({ok:true,source:"fallback",case:fallback});
 const prompt="Create one fictional teen-friendly detective mystery. Never use real personal data, addresses, phone numbers, private accounts or wrongdoing instructions. Return ONLY valid JSON with title, subtitle, location, time, missing, summary, suspects (3), evidence (6-8), timeline (5-7), twist. Make it solvable. No gore or sexual content. Player alias: "+String(p.alias||"Detective").slice(0,40)+"; vibe: "+String(p.vibe||"cinematic mystery").slice(0,80)+"; setting: "+String(p.setting||"modern city").slice(0,100);
 try{
  const r=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+KEY,"Content-Type":"application/json","HTTP-Referer":process.env.APP_URL||"https://railway.app","X-Title":"OFFLINE AI Mystery"},body:JSON.stringify({model:MODEL,temperature:.9,max_tokens:1800,messages:[{role:"system",content:"You are a mystery-game writer. Output valid JSON only."},{role:"user",content:prompt}]})});
  if(!r.ok)throw new Error("OpenRouter "+r.status);
  const d=await r.json(),c=clean(extract(d&&d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||""));
  if(!c)throw new Error("Invalid JSON");
  res.json({ok:true,source:"openrouter",case:c});
 }catch(e){console.error(e.message);res.json({ok:true,source:"fallback",case:fallback})}
});
app.get("*splat",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("OFFLINE running on "+PORT));