import { useState, useEffect } from "react";
import { CONTENT, getUnseen } from "./content/index";

/* ─── THEMES ──────────────────────────────────────── */
const THEMES = {
  default: { G:"#2D6A4F", LT:"#d8f3dc", DK:"#1b4332" },
  forest:  { G:"#1a3a2a", LT:"#c8e6c9", DK:"#0d1f17" },
  ocean:   { G:"#1565c0", LT:"#bbdefb", DK:"#0d47a1" },
};

/* ─── SUPABASE ────────────────────────────────────── */
const SB  = "https://qnxeyoxashvbljjmqkrp.supabase.co";
const KEY = "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";
const h = t => ({"Content-Type":"application/json","apikey":KEY,"Authorization":`Bearer ${t||KEY}`,"Prefer":"return=representation"});
const get    = (p,t)   => fetch(`${SB}/rest/v1/${p}`,{headers:h(t)}).then(r=>r.json()).catch(()=>[]);
const post   = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:h(t),body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const patch  = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"PATCH",headers:{...h(t),"Prefer":"return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const upsert = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:{...h(t),"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const signUp = (e,p) => fetch(`${SB}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const signIn = (e,p) => fetch(`${SB}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());

/* ─── HELPERS ─────────────────────────────────────── */
const dateStr = () => new Date().toISOString().slice(0,10);
const rnd     = a  => a[Math.floor(Math.random()*a.length)];
const wc      = s  => (s||"").trim().split(/\s+/).filter(Boolean).length;
const getLvl  = xp => {
  if(xp<500)  return {name:"Bronze",  color:"#cd7f32",min:0,   next:500};
  if(xp<1500) return {name:"Silver",  color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return {name:"Gold",    color:"#ffd700",min:1500,next:3000};
  return             {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};
const getAcadLevel = xp => xp>=1500?"Advanced":xp>=500?"Intermediate":"Beginner";

const XP_MAP = {grammar:5,vocabulary:5,reading:20,mistakes:10,quiz:10,peel:50};
const WMIN = {
  Beginner:     {point:10,explanation:20,evidence:10,link:10},
  Intermediate: {point:15,explanation:40,evidence:20,link:15},
  Advanced:     {point:25,explanation:60,evidence:25,link:20},
};
const UNLOCKS = [
  {xp:100, icon:"📝",label:"Advanced PEEL Topics",    desc:"More challenging writing topics"},
  {xp:200, icon:"🌲",label:"Dark Forest Theme",        desc:"Deep green visual theme"},
  {xp:500, icon:"🌿",label:"Intermediate Level",       desc:"Auto-promotion"},
  {xp:1000,icon:"🌊",label:"Ocean Blue Theme",         desc:"Blue ocean visual theme"},
  {xp:1300,icon:"🏆",label:"Certificate of Achievement",desc:"Download your official certificate"},
  {xp:1500,icon:"🌳",label:"Advanced Level",           desc:"Auto-promotion"},
];
const ENC = [
  {title:"🔥 Already done today!", body:"XP already earned for this module. Come back tomorrow!", sub:"Extra practice = extra mastery."},
  {title:"💪 Great dedication!",   body:"No XP today — you already earned it! Every session builds skills.", sub:"Consistency is the key."},
];

/* ─── BADGES ──────────────────────────────────────── */
const BADGES_DEF = {
  Beginner:[
    {icon:"✍️",name:"First Write",   desc:"Submit your first PEEL paragraph"},
    {icon:"📖",name:"First Reader",  desc:"Complete 1 reading passage"},
    {icon:"🔥",name:"Streak 3",      desc:"Log in 3 days in a row"},
    {icon:"✏️",name:"Grammar Start", desc:"Complete 5 grammar exercises"},
    {icon:"🔤",name:"Word Learner",  desc:"Learn 5 vocabulary words"},
    {icon:"🧪",name:"Quiz Taker",    desc:"Complete your first quiz"},
  ],
  Intermediate:[
    {icon:"📝",name:"PEEL Improver",   desc:"Submit 3 PEEL with score ≥10/20"},
    {icon:"🔥",name:"Streak 7",        desc:"Log in 7 days in a row"},
    {icon:"📚",name:"Avid Reader",     desc:"Complete 5 reading passages"},
    {icon:"✏️",name:"Grammar Pro",     desc:"Complete 15 grammar exercises"},
    {icon:"🎯",name:"Quiz Champion",   desc:"Score 5/5 on a quiz"},
    {icon:"🇫🇷",name:"Mistake Hunter", desc:"Complete 5 Common Mistakes"},
  ],
  Advanced:[
    {icon:"🏆",name:"PEEL Master",      desc:"Submit 5 PEEL with score ≥15/20"},
    {icon:"🔥",name:"Streak 14",        desc:"Log in 14 days in a row"},
    {icon:"🌍",name:"African Reader",   desc:"Complete 10 reading passages"},
    {icon:"💎",name:"Perfect Quiz",     desc:"Get 3 perfect quizzes"},
    {icon:"🎓",name:"Academic Writer",  desc:"Earn 500 XP through PEEL"},
    {icon:"👑",name:"UPGC Champion",    desc:"Reach 1500 XP"},
  ],
};

const MODS=[
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",   sub:"Adapted to your level",           color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",  sub:"Academic vocabulary by level",    color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Writing Lab",      sub:"PEEL paragraph + AI assessment",  color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",     sub:"Passages tailored to your level", color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes", sub:"Level-appropriate error analysis",color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",       sub:"5 questions at your level",       color:"#fff8e1"},
];

/* ─── UI COMPONENTS ───────────────────────────────── */
function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}>
      <div style={{width:36,height:36,border:"4px solid #e0e0e0",borderTop:"4px solid #2D6A4F",borderRadius:"50%",animation:"__spin 1s linear infinite"}}/>
      <style>{`@keyframes __spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function Card({children,style}){return <div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",...style}}>{children}</div>;}
function PBtn({onClick,children,disabled,style}){
  return <button onClick={onClick} disabled={disabled} style={{display:"block",width:"100%",padding:"13px",borderRadius:12,border:"none",background:disabled?"#ccc":"#2D6A4F",color:"#fff",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;
}
function SBtn({onClick,children,style}){
  return <button onClick={onClick} style={{display:"block",width:"100%",padding:"12px",borderRadius:12,border:"2px solid #2D6A4F",background:"transparent",color:"#2D6A4F",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;
}

/* ─── PLACEMENT TEST ──────────────────────────────── */
const PL_QUESTIONS = [
  {s:"Grammar",   q:"'She ___ to school every day.'",        opts:["go","goes","going","gone"],ans:1},
  {s:"Grammar",   q:"Error: 'The informations are here.'",    opts:["The","informations","are","here"],ans:1},
  {s:"Grammar",   q:"'If I ___ rich, I would travel.'",       opts:["am","was","were","be"],ans:2},
  {s:"Grammar",   q:"Correct sentence:",                      opts:["She don't like coffee.","She doesn't likes it.","She doesn't like coffee.","She not like coffee."],ans:2},
  {s:"Grammar",   q:"'Despite ___ tired, he finished.'",      opts:["be","being","been","to be"],ans:1},
  {s:"Vocabulary",q:"'Analyse' means:",                       opts:["To ignore","To study carefully","To write","To memorise"],ans:1},
  {s:"Vocabulary",q:"'Her essay was very ___.' (well-organised)",opts:["confusing","coherent","boring","long"],ans:1},
  {s:"Vocabulary",q:"'Evidence' means:",                      opts:["A feeling","A guess","Facts supporting an argument","A question"],ans:2},
  {s:"Vocabulary",q:"FALSE FRIEND for French speakers:",      opts:["Book","Actually","Table","School"],ans:1},
  {s:"Vocabulary",q:"'The study requires ___ data.'",         opts:["emotional","empirical","fictional","random"],ans:1},
  {s:"Reading",   q:"Why did Okonkwo work hard?",             opts:["To be rich","To travel","To overcome his father's failures","To win a prize"],ans:2},
  {s:"Reading",   q:"'Education was the light…' — device?",  opts:["Simile","Metaphor","Rhyme","Alliteration"],ans:1},
  {s:"Reading",   q:"'Jaja's face was expressionless.' Suggests:",opts:["Happy","Calm","Hiding emotions","Cold"],ans:2},
  {s:"Reading",   q:"A 'glossary' is:",                       opts:["Questions list","Word definitions","Summary","Bibliography"],ans:1},
  {s:"Reading",   q:"'Concluded' means:",                     opts:["Started","Wondered","Reached a final decision","Forgot"],ans:2},
];

function PlacementTest({onDone}) {
  const [i,sI]=useState(0);
  const [sel,sSel]=useState(null);
  const [conf,sConf]=useState(false);
  const [sc,sSc]=useState({Grammar:0,Vocabulary:0,Reading:0});
  const q=PL_QUESTIONS[i];
  const secs=["Grammar","Vocabulary","Reading"];
  const icons={Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};
  const si=secs.indexOf(q.s);

  const next=()=>{
    const newSc={...sc};
    if(sel===q.ans) newSc[q.s]=sc[q.s]+1;
    if(i<14){sSc(newSc);sI(x=>x+1);sSel(null);sConf(false);}
    else{
      const tot=newSc.Grammar+newSc.Vocabulary+newSc.Reading;
      onDone({level:tot>=11?"Advanced":tot>=6?"Intermediate":"Beginner",scores:newSc,total:tot});
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440,paddingTop:16}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36}}>🎯</div>
          <h2 style={{color:"#1b4332",margin:"6px 0 2px"}}>Placement Test</h2>
          <p style={{color:"#888",fontSize:13}}>15 questions — Find your level</p>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}>
            <span>Q {i+1}/15</span><span style={{color:"#2D6A4F",fontWeight:700}}>{Math.round((i/15)*100)}%</span>
          </div>
          <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
            <div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(i/15)*100}%`,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {secs.map((s,ix)=>(
              <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:ix<si?"#2D6A4F":ix===si?"#81c784":"#e0e0e0"}}/>
                <span style={{fontSize:11,color:ix<=si?"#2D6A4F":"#bbb",fontWeight:ix===si?700:400}}>{icons[s]} {s}</span>
              </div>
            ))}
          </div>
        </div>
        <Card style={{marginBottom:14}}>
          <div style={{background:{"Grammar":"#e3f2fd","Vocabulary":"#fff3e0","Reading":"#f3e5f5"}[q.s],borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:"#1b4332"}}>{icons[q.s]} {q.s}</span>
          </div>
          <p style={{fontWeight:600,color:"#1b4332",fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p>
        </Card>
        {q.opts.map((o,oi)=>{
          const isC=oi===q.ans,isP=oi===sel;
          let bg="#fff",br="#e0e0e0";
          if(conf){if(isP&&isC){bg="#e8f5e9";br="#2D6A4F";}else if(isP&&!isC){bg="#ffebee";br="#e53935";}}
          else if(isP){bg="#d8f3dc";br="#2D6A4F";}
          return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
            {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}
          </button>;
        })}
        {!conf
          ?<PBtn onClick={()=>{if(sel!==null)sConf(true);}} disabled={sel===null}>Confirm Answer</PBtn>
          :<PBtn onClick={next}>{i<14?"Next →":"See My Level 🎯"}</PBtn>
        }
      </div>
    </div>
  );
}

function LevelResult({result,onContinue}) {
  const icons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  const descs={Beginner:"Your content will focus on essential grammar, core vocabulary, and accessible reading.",Intermediate:"Your content will challenge you with more complex grammar and academic vocabulary.",Advanced:"Your content will develop your academic writing, critical reading, and theoretical analysis."};
  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <Card style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:64,marginBottom:8}}>{icons[result.level]}</div>
          <h2 style={{color:"#2D6A4F",fontSize:24,margin:"0 0 4px"}}>Your Level:</h2>
          <div style={{background:"#d8f3dc",borderRadius:12,padding:"10px 24px",display:"inline-block",margin:"8px 0 12px"}}>
            <span style={{fontSize:22,fontWeight:900,color:"#1b4332"}}>{result.level}</span>
          </div>
          <p style={{color:"#555",fontSize:14,lineHeight:1.7}}>{descs[result.level]}</p>
        </Card>
        <Card style={{marginBottom:16}}>
          <h4 style={{color:"#1b4332",margin:"0 0 12px"}}>📊 Your Scores</h4>
          {Object.entries(result.scores).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600,color:"#1b4332"}}>{k}</span>
                <span style={{color:"#2D6A4F",fontWeight:700}}>{v}/5</span>
              </div>
              <div style={{background:"#e8f5e9",borderRadius:99,height:8}}>
                <div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(v/5)*100}%`,transition:"width .6s"}}/>
              </div>
            </div>
          ))}
          <div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:700,color:"#1b4332"}}>Total</span>
            <span style={{color:"#2D6A4F",fontWeight:800}}>{result.total}/15</span>
          </div>
        </Card>
        <PBtn onClick={onContinue}>Start Learning →</PBtn>
      </div>
    </div>
  );
}

/* ─── AUTH ────────────────────────────────────────── */
function Landing({go}) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1b4332 0%,#2D6A4F 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px",color:"#fff",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:80,lineHeight:1,marginBottom:20}}>✍️</div>
      <h1 style={{fontSize:34,fontWeight:900,margin:"0 0 10px",color:"#ffffff",letterSpacing:0.5,lineHeight:1.2}}>WriteUP UPGC</h1>
      <p style={{opacity:.9,fontSize:16,marginBottom:8,color:"#fff"}}>Academic English for L2 Students</p>
      <p style={{opacity:.6,fontSize:13,marginBottom:48,color:"#fff"}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:320,marginBottom:48}}>
        <button onClick={()=>go("login")} style={{background:"#fff",color:"#2D6A4F",border:"none",borderRadius:14,padding:"16px",fontWeight:800,fontSize:16,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>Log In</button>
        <button onClick={()=>go("register")} style={{background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,0.7)",borderRadius:14,padding:"16px",fontWeight:800,fontSize:16,cursor:"pointer"}}>Sign Up</button>
      </div>
      <div style={{display:"flex",gap:18,opacity:.6,fontSize:12,flexWrap:"wrap",justifyContent:"center"}}>
        {["🌐 PWA","🆓 Free","🎯 Level Test","📚 Rich Content","💾 Cloud Save"].map(t=><span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

function AuthForm({mode,onDone,onSwitch}) {
  const [f,sF]=useState({name:"",email:"",pw:""});
  const [load,sL]=useState(false);
  const [err,sErr]=useState("");
  const upd=k=>e=>sF(p=>({...p,[k]:e.target.value}));

  const submit=async()=>{
    if(!f.email||!f.pw) return sErr("Please fill all fields.");
    if(mode==="register"&&!f.name) return sErr("Please enter your name.");
    sL(true);sErr("");
    try{
      if(mode==="register"){
        const res=await signUp(f.email,f.pw);
        if(res.error){sErr(res.error.message||"Registration failed.");sL(false);return;}
        const uid=res.user?.id;
        if(uid){
          await post("users",{id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",placement_done:false,last_login:dateStr()},res.access_token);
          onDone({id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",isNew:true,token:res.access_token});
        }
      }else{
        const res=await signIn(f.email,f.pw);
        if(res.error){sErr("Invalid email or password.");sL(false);return;}
        const uid=res.user?.id,tok=res.access_token;
        const rows=await get(`users?id=eq.${uid}`,tok);
        const p=rows?.[0];
        if(p){
          const diff=Math.floor((new Date()-new Date(p.last_login))/(86400000));
          const ns=diff===1?p.streak+1:diff>1?1:p.streak;
          await patch(`users?id=eq.${uid}`,{last_login:dateStr(),streak:ns},tok);
          onDone({...p,streak:ns,isNew:!p.placement_done,token:tok});
        }else sErr("Profile not found. Please sign up.");
      }
    }catch{sErr("Connection error. Please try again.");}
    sL(false);
  };

  const inp=(ph,k,type="text")=>(
    <input placeholder={ph} type={type} value={f[k]} onChange={upd(k)}
      style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <Card style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40}}>✍️</div>
          <h2 style={{color:"#2D6A4F",margin:"8px 0 4px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2>
          <p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p>
        </div>
        {mode==="register"&&inp("Full name","name")}
        {inp("Email","email","email")}
        {inp("Password (min. 6 chars)","pw","password")}
        {err&&<p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}
        {load?<Spinner/>:<PBtn onClick={submit}>{mode==="login"?"Log In":"Register & Take Placement Test"}</PBtn>}
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>
          {mode==="login"?"No account? ":"Already registered? "}
          <span onClick={onSwitch} style={{color:"#2D6A4F",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Log in"}</span>
        </p>
      </Card>
    </div>
  );
}

/* ─── MODULE HELPERS ──────────────────────────────── */
function DoneScreen({xp,onBack,earn,G}) {
  useEffect(()=>{earn&&earn();},[]);
  return (
    <div style={{textAlign:"center",padding:48}}>
      <div style={{fontSize:64,marginBottom:12}}>🎉</div>
      <h2 style={{color:G}}>Well done!</h2>
      <p style={{color:"#555"}}>You earned <strong style={{color:G,fontSize:20}}>+{xp} XP</strong></p>
      <p style={{color:"#aaa",fontSize:13}}>Progress saved ✅</p>
      <PBtn onClick={onBack} style={{background:G}}>← Back to Modules</PBtn>
    </div>
  );
}

/* ─── GRAMMAR MODULE ──────────────────────────────── */
function GrammarMod({addXp,onBack,G,LT,DK,userId,tok,level}) {
  const [c,sC]=useState(null);
  const [sel,sSel]=useState(null);
  const [done,sDone]=useState(false);

  useEffect(()=>{
    getUnseen(userId,tok,level,"grammar").then(item=>sC(item));
  },[]);

  if(!c) return <Spinner/>;
  const conf=sel!==null,correct=sel===c.ans;
  if(done) return <DoneScreen xp={XP_MAP.grammar} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.grammar,"grammar")}/>;
  return (
    <div>
      <Card style={{background:LT,marginBottom:14}}><div style={{fontSize:12,color:"#555"}}>📚 Topic: <strong>{c.title}</strong></div></Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.q}</p></Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{c.exp}</p>
        </Card>
        <Card style={{background:"#e3f2fd",marginBottom:14}}>
          <p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p>
        </Card>
        {correct?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Earn +{XP_MAP.grammar} XP →</PBtn>:<SBtn onClick={onBack}>← Try another exercise</SBtn>}
      </>}
    </div>
  );
}

/* ─── VOCABULARY MODULE ───────────────────────────── */
function VocabMod({addXp,onBack,G,LT,DK,userId,tok,level}) {
  const [c,sC]=useState(null);
  const [phase,sPhase]=useState("learn");
  const [sel,sSel]=useState(null);
  const [done,sDone]=useState(false);

  useEffect(()=>{
    getUnseen(userId,tok,level,"vocabulary").then(item=>sC(item));
  },[]);

  if(!c) return <Spinner/>;
  const conf=sel!==null,correct=sel===c.ans;
  if(done) return <DoneScreen xp={XP_MAP.vocabulary} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.vocabulary,"vocabulary")}/>;
  if(phase==="learn") return (
    <div>
      <Card style={{borderLeft:`4px solid ${G}`,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><h2 style={{color:G,margin:"0 0 2px",fontSize:26}}>{c.word}</h2><div style={{color:"#999",fontSize:12}}>{c.ph} · <em>{c.pos}</em></div></div>
          <span style={{background:"#fff3e0",color:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.fr}</span>
        </div>
        <div style={{background:"#f9fbe7",borderRadius:10,padding:12,marginBottom:10}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>📖 Definition</div>
          <p style={{color:"#333",fontSize:14,margin:0,lineHeight:1.7}}>{c.def}</p>
        </div>
        <div style={{background:"#e8f5e9",borderRadius:10,padding:12}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>🧠 Memory Tip</div>
          <p style={{color:DK,fontSize:13,margin:0,lineHeight:1.6}}>{c.tip}</p>
        </div>
      </Card>
      <PBtn onClick={()=>sPhase("practice")} style={{background:G}}>Practice this word →</PBtn>
    </div>
  );
  return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",marginBottom:6}}>💬 Complete the sentence:</div>
        <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.ex}</p>
      </Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?`✅ Correct! "${c.word}" fits perfectly.`:`⚠️ The correct word is "${c.opts[c.ans]}". Review the definition!`}
          </p>
        </Card>
        {correct?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Earn +{XP_MAP.vocabulary} XP →</PBtn>:<SBtn onClick={onBack}>← Try another word</SBtn>}
      </>}
    </div>
  );
}

/* ─── READING MODULE ──────────────────────────────── */
function ReadingMod({addXp,onBack,G,LT,DK,userId,tok,level}) {
  const [c,sC]=useState(null);
  const [phase,sP]=useState("read");
  const [ans,sA]=useState([null,null,null]);
  const [checked,sCheck]=useState(false);
  const [done,sD]=useState(false);

  useEffect(()=>{
    getUnseen(userId,tok,level,"reading").then(item=>sC(item));
  },[]);

  if(!c) return <Spinner/>;
  const score=ans.filter((a,i)=>a===c.qs[i]?.ans).length;
  if(done) return <DoneScreen xp={XP_MAP.reading} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.reading,"reading")}/>;
  if(phase==="read") return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:4}}>📖 {c.topic}</div>
        <h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>
        {c.passage.split("\n\n").map((p,i)=><p key={i} style={{lineHeight:1.9,fontSize:14,color:"#333",marginBottom:12}}>{p}</p>)}
      </Card>
      <Card style={{background:"#fff8e1",marginBottom:14}}>
        <div style={{fontWeight:700,color:"#e65100",marginBottom:10,fontSize:13}}>📖 Glossary</div>
        {c.gloss.map(g=><div key={g.w} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}><strong style={{color:DK,minWidth:110,flexShrink:0}}>{g.w}</strong><span style={{color:"#555",lineHeight:1.5}}>{g.d}</span></div>)}
      </Card>
      <PBtn onClick={()=>sP("quiz")} style={{background:G}}>Answer Questions →</PBtn>
    </div>
  );
  return (
    <div>
      <h4 style={{color:DK,marginBottom:14}}>📝 Comprehension Questions</h4>
      {c.qs.map((q,qi)=>(
        <Card key={qi} style={{marginBottom:14}}>
          <p style={{fontWeight:600,color:DK,fontSize:14,marginBottom:10,lineHeight:1.6}}>{qi+1}. {q.q}</p>
          {q.opts.map((o,oi)=>{
            const isC=oi===q.ans,isP=oi===ans[qi];
            let bg="#f9f9f9",br="#e0e0e0";
            if(checked){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC){bg="#fff9c4";br="#f9a825";}}
            else if(isP){bg=LT;br=G;}
            return <button key={oi} onClick={()=>{if(!checked)sA(a=>{const n=[...a];n[qi]=oi;return n;})}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${br}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&isP&&isC?"✅ ":checked&&isP&&!isC?"❌ ":checked&&!isP&&isC?"💡 ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked
        ?<PBtn onClick={()=>sCheck(true)} disabled={ans.includes(null)} style={{background:ans.includes(null)?"#ccc":G}}>Check Answers</PBtn>
        :<div>
          <Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}>
            <strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading!"}</strong>
          </Card>
          <PBtn onClick={()=>sD(true)} style={{background:G}}>Earn +{XP_MAP.reading} XP</PBtn>
        </div>}
    </div>
  );
}

/* ─── MISTAKES MODULE ─────────────────────────────── */
function MistakesMod({addXp,onBack,G,LT,DK,userId,tok,level}) {
  const [c,sC]=useState(null);
  const [done,sD]=useState(false);

  useEffect(()=>{
    getUnseen(userId,tok,level,"mistakes").then(item=>sC(item));
  },[]);

  if(!c) return <Spinner/>;
  if(done) return <DoneScreen xp={XP_MAP.mistakes} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.mistakes,"mistakes")}/>;
  return (
    <div>
      <Card style={{borderLeft:"4px solid #ff9800",marginBottom:14}}>
        <span style={{background:"#fff3e0",color:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.title}</span>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
          <span style={{fontSize:18}}>🇫🇷</span>
          <span style={{fontSize:13,color:"#666",fontStyle:"italic"}}>French pattern: <strong>{c.fr}</strong></span>
        </div>
      </Card>
      <Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:8}}>❌ Common Error</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.wrong}"</p></Card>
      <Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontSize:12,color:G,fontWeight:700,marginBottom:8}}>✅ Correct English</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.right}"</p></Card>
      <Card style={{background:"#e3f2fd",marginBottom:14}}><div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:8}}>📐 Rule</div><p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.8}}>{c.rule}</p></Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:12}}>📝 More Examples</div>
        {c.ex.map((e,i)=><div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<c.ex.length-1?"1px solid #f0f0f0":"none"}}>
          <div style={{fontSize:13,color:"#c62828",marginBottom:4}}>❌ {e.w}</div>
          <div style={{fontSize:13,color:G}}>✅ {e.r}</div>
        </div>)}
      </Card>
      <PBtn onClick={()=>sD(true)} style={{background:G}}>Got it! Earn +{XP_MAP.mistakes} XP</PBtn>
    </div>
  );
}

/* ─── QUIZ MODULE ─────────────────────────────────── */
function QuizMod({addXp,onBack,G,LT,DK,userId,tok,level}) {
  const [qs,sQs]=useState(null);
  const [i,sI]=useState(0);
  const [sel,sSel]=useState(null);
  const [score,sScore]=useState(0);
  const [review,sReview]=useState(false);
  const [done,sDone]=useState(false);

  useEffect(()=>{
    getUnseen(userId,tok,level,"quiz").then(item=>{
      if(item) sQs(item.questions);
    });
  },[]);

  if(!qs) return <Spinner/>;
  const q=qs[i],conf=sel!==null,correct=sel===q?.ans;
  if(done) return <DoneScreen xp={score*6} onBack={onBack} G={G} earn={()=>addXp(score*6,"quiz")}/>;
  if(review) return (
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#555",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
      </Card>
      {score>0?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Claim +{score*6} XP →</PBtn>:<SBtn onClick={onBack}>← No XP — Try again tomorrow</SBtn>}
    </div>
  );
  const next=()=>{if(i<qs.length-1){sI(x=>x+1);sSel(null);}else sReview(true);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:8}}>
        <span>Q {i+1}/{qs.length}</span><span style={{color:G,fontWeight:700}}>Score: {score}/{i+(conf?1:0)}</span>
      </div>
      <div style={{background:"#e8f5e9",borderRadius:8,height:6,marginBottom:14}}>
        <div style={{background:G,height:6,borderRadius:8,width:`${(i/qs.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>
      {q.opts.map((o,oi)=>{
        const isC=oi===q.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg:"#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>{if(!conf){sSel(oi);if(oi===q.ans)sScore(s=>s+1);}}} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}</p>
        </Card>
        <PBtn onClick={next} style={{background:G}}>{i<qs.length-1?"Next →":"See Results"}</PBtn>
      </>}
    </div>
  );
}

/* ─── PEEL MODULE ─────────────────────────────────── */
function PeelMod({addXp,onBack,level,G,LT,DK,userId,tok}) {
  const [phase,sPhase]=useState("write");
  const [c,sC]=useState(null);
  const [step,sStep]=useState(0);
  const [vals,sVals]=useState({point:"",explanation:"",evidence:"",link:""});
  const [fb,sFb]=useState(null);
  const [aiLoad,sAiLoad]=useState(false);
  const [attempts,sAtt]=useState(0);
  const keys=["point","explanation","evidence","link"];
  const labels=["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];
  const minW=WMIN[level]||WMIN.Beginner;

  useEffect(()=>{
    getUnseen(userId,tok,level,"peel").then(item=>sC(item));
  },[]);

  const PARTS=[
    {letter:"P",name:"Point",color:"#e3f2fd",icon:"📌",role:"State your main argument clearly.",dos:"Be specific and direct.",donts:"Avoid vague statements or questions."},
    {letter:"E",name:"Explanation",color:"#e8f5e9",icon:"💬",role:"Explain WHY your point is true.",dos:"Use: 'Furthermore', 'In addition', 'This means that'.",donts:"Do not repeat your Point."},
    {letter:"E",name:"Evidence",color:"#fff3e0",icon:"📚",role:"Provide concrete proof from a named source.",dos:"Introduce: 'According to...'. Include statistics.",donts:"Never use vague 'studies show' without naming the study."},
    {letter:"L",name:"Link",color:"#fce4ec",icon:"🔗",role:"Connect back to the essay question.",dos:"Use: 'Therefore...', 'This demonstrates that...'",donts:"Do not introduce new arguments."},
  ];

  const callAI=async(isRevision)=>{
    sAiLoad(true);sFb(null);
    const prompt=`You are a strict English writing examiner for a ${level} university student in Côte d'Ivoire. Attempt: ${attempts+1}.${isRevision?" Student revised based on previous feedback.":""}

TOPIC: "${c.prompt}"
POINT: ${vals.point}
EXPLANATION: ${vals.explanation}
EVIDENCE: ${vals.evidence}
LINK: ${vals.link}

WORD MINIMUMS (${level}): Point=${minW.point}w, Explanation=${minW.explanation}w, Evidence=${minW.evidence}w, Link=${minW.link}w

You MUST respond ONLY with a valid JSON object. Start with { and end with }. No text before or after.

{
  "point_score": 3,
  "explanation_score": 3,
  "evidence_score": 2,
  "link_score": 2,
  "grammar_score": 2,
  "length_score": 1,
  "point_feedback": "Detailed feedback on the Point section.",
  "explanation_feedback": "Detailed feedback on the Explanation section.",
  "evidence_feedback": "Detailed feedback on the Evidence section.",
  "link_feedback": "Detailed feedback on the Link section.",
  "grammar_note": "One grammar strength and one grammar weakness with correction.",
  "priority_action": "The single most important improvement needed."
}

Scoring: point_score 0-4, explanation_score 0-4, evidence_score 0-4, link_score 0-3, grammar_score 0-3, length_score 0-2. Total=/20. Pass=10/20.`;

    try{
      const response=await fetch("/api/generate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt,maxTokens:800})
      });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      const text=data.text||"";
      const match=text.match(/\{[\s\S]*\}/);
      if(!match) throw new Error("No JSON found");
      const p=JSON.parse(match[0]);
      const safe=(v,max)=>Math.min(max,Math.max(0,isNaN(Number(v))?0:Number(v)));
      const sc={
        point:   safe(p.point_score,4),
        expl:    safe(p.explanation_score,4),
        evidence:safe(p.evidence_score,4),
        link:    safe(p.link_score,3),
        grammar: safe(p.grammar_score,3),
        length:  safe(p.length_score,2),
      };
      sc.total=sc.point+sc.expl+sc.evidence+sc.link+sc.grammar+sc.length;
      sFb({sc,passed:sc.total>=10,feedbacks:{
        point:String(p.point_feedback||""),
        expl:String(p.explanation_feedback||""),
        evidence:String(p.evidence_feedback||""),
        link:String(p.link_feedback||""),
        grammar:String(p.grammar_note||""),
        action:String(p.priority_action||""),
      }});
      sAtt(a=>a+1);
      sPhase("feedback");
    }catch(e){
      sFb({sc:{point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0},passed:false,feedbacks:{
        point:"AI feedback unavailable.",expl:"",evidence:"",link:"",grammar:"",
        action:`Error: ${e.message}. Please check your connection and try again.`
      }});
      sPhase("feedback");
    }
    sAiLoad(false);
  };

  if(!c) return <Spinner/>;

  if(phase==="write") return (
    <div>
      {attempts>0&&<Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}><p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>🔄 Revision #{attempts} — Apply all feedback carefully.</p></Card>}
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontWeight:800,color:DK,fontSize:15}}>{c.title}</div>
        <div style={{color:"#555",fontSize:13,marginTop:4,lineHeight:1.6}}>{c.prompt}</div>
      </Card>
      {c.vocab&&<Card style={{background:"#f3e5f5",marginBottom:12}}>
        <div style={{fontSize:12,color:"#7b1fa2",fontWeight:700,marginBottom:6}}>💡 Useful vocabulary for this topic:</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {c.vocab.map(v=><span key={v} style={{background:"#e1bee7",color:"#4a148c",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{v}</span>)}
        </div>
      </Card>}
      {c.sources&&<Card style={{background:"#e8f5e9",marginBottom:12}}>
        <div style={{fontSize:12,color:G,fontWeight:700,marginBottom:6}}>📚 Sources to use in your Evidence:</div>
        {c.sources.map((s,i)=><div key={i} style={{fontSize:12,color:"#333",marginBottom:4,lineHeight:1.6}}><strong>{s.name}:</strong> {s.fact}</div>)}
      </Card>}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {keys.map((k,ix)=>(
          <div key={k} style={{flex:1,textAlign:"center"}}>
            <div style={{height:6,borderRadius:99,background:vals[k]&&wc(vals[k])>=minW[k]?G:vals[k]?"#f57c00":ix===step?"#81c784":"#e0e0e0",marginBottom:4,transition:"background .3s"}}/>
            <div style={{fontSize:10,color:ix<=step?G:"#bbb",fontWeight:ix===step?800:400}}>{k.charAt(0).toUpperCase()}</div>
          </div>
        ))}
      </div>
      {(()=>{const p=PARTS[step];return <div>
        <Card style={{background:p.color,marginBottom:10,borderLeft:`4px solid ${G}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontWeight:800,color:DK,fontSize:15}}>{p.icon} {labels[step]}</div><div style={{fontSize:12,color:"#555",marginTop:4}}>{p.role}</div></div>
            <div style={{background:G,color:"#fff",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,textAlign:"center",flexShrink:0}}>min {minW[keys[step]]}<br/>words</div>
          </div>
        </Card>
        {c.example&&<Card style={{background:"#f0f7f4",marginBottom:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:4}}>📋 Model {keys[step]}:</div>
          <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.8,fontStyle:"italic"}}>"{c.example[keys[step]]}"</p>
        </Card>}
        <textarea value={vals[keys[step]]} onChange={e=>sVals(p=>({...p,[keys[step]]:e.target.value}))}
          placeholder={`Write your ${keys[step]} here… (min ${minW[keys[step]]} words)`} rows={5}
          style={{width:"100%",boxSizing:"border-box",border:`2px solid ${vals[keys[step]]&&wc(vals[keys[step]])>=minW[keys[step]]?G:vals[keys[step]]?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border .2s"}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:4,marginBottom:10}}>
          <span style={{color:wc(vals[keys[step]])>=minW[keys[step]]?G:wc(vals[keys[step]])>0?"#f57c00":"#aaa",fontWeight:600}}>
            {wc(vals[keys[step]])} / {minW[keys[step]]} words {wc(vals[keys[step]])>=minW[keys[step]]?"✅":wc(vals[keys[step]])>0?"⚠️":""}
          </span>
        </div>
        <PBtn onClick={()=>{if(step<3)sStep(s=>s+1);else callAI(attempts>0);}}
          disabled={!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiLoad}
          style={{background:aiLoad?"#ccc":G}}>
          {aiLoad?"⏳ Analysing your paragraph…":step<3?`Next: ${labels[step+1]} →`:"🤖 Submit for AI Assessment"}
        </PBtn>
      </div>;})()} 
    </div>
  );

  if(phase==="feedback"&&fb){
    const CRIT=[{id:"point",label:"Point (Clarity)",max:4},{id:"expl",label:"Explanation (Logic)",max:4},{id:"evidence",label:"Evidence (Quality)",max:4},{id:"link",label:"Link (Cohesion)",max:3},{id:"grammar",label:"Grammar & Vocab",max:3},{id:"length",label:"Length",max:2}];
    const headerBg=fb.sc.total>=15?`linear-gradient(135deg,${DK},${G})`:fb.sc.total>=10?"linear-gradient(135deg,#e65100,#ff9800)":"linear-gradient(135deg,#c62828,#e53935)";
    return (
      <div>
        <Card style={{background:headerBg,color:"#fff",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:13,opacity:.85,marginBottom:4}}>Attempt #{attempts} · {fb.passed?"✅ PASSED":"❌ REVISION REQUIRED"}</div>
          <div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{fb.sc.total}<span style={{fontSize:24,fontWeight:400}}>/20</span></div>
          <div style={{fontSize:14,fontWeight:700,opacity:.9}}>
            {fb.sc.total>=17?"🏆 Excellent":fb.sc.total>=14?"👏 Good":fb.sc.total>=10?"📈 Passed":"💪 Below Average"}
          </div>
        </Card>
        <Card style={{marginBottom:14}}>
          <h4 style={{color:DK,margin:"0 0 12px"}}>📋 Score Breakdown</h4>
          {CRIT.map(cr=>{const s=fb.sc[cr.id]||0,pct=Math.round((s/cr.max)*100);return(
            <div key={cr.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{fontWeight:600,color:DK}}>{cr.label}</span>
                <span style={{color:pct>=75?G:pct>=50?"#f57c00":"#e53935",fontWeight:700}}>{s}/{cr.max}</span>
              </div>
              <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
                <div style={{background:pct>=75?G:pct>=50?"#f57c00":"#e53935",height:8,borderRadius:99,width:`${pct}%`,transition:"width .6s"}}/>
              </div>
              {fb.feedbacks[cr.id]&&<p style={{fontSize:12,color:"#555",margin:"6px 0 0",lineHeight:1.6}}>{fb.feedbacks[cr.id]}</p>}
            </div>
          );})}
        </Card>
        {fb.feedbacks.grammar&&<Card style={{background:"#e3f2fd",marginBottom:14}}>
          <div style={{fontWeight:700,color:"#1565c0",marginBottom:6,fontSize:13}}>✏️ Grammar & Vocabulary</div>
          <p style={{fontSize:13,color:"#333",margin:0,lineHeight:1.7}}>{fb.feedbacks.grammar}</p>
        </Card>}
        {fb.feedbacks.action&&<Card style={{background:"#fff8e1",marginBottom:14}}>
          <div style={{fontWeight:700,color:"#e65100",marginBottom:6,fontSize:13}}>🎯 Priority Action</div>
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{fb.feedbacks.action}</p>
        </Card>}
        {fb.passed
          ?<PBtn onClick={()=>addXp(XP_MAP.peel,"peel")} style={{background:G}}>Claim +{XP_MAP.peel} XP & Continue →</PBtn>
          :<div>
            <Card style={{background:"#fff3e0",marginBottom:14,borderLeft:"3px solid #f57c00"}}>
              <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.8}}>🔄 Read the feedback above carefully, apply all fixes, then resubmit. You need 10/20 to pass.</p>
            </Card>
            <PBtn onClick={()=>{sPhase("write");sStep(0);}} style={{background:G}}>🔄 Revise My Paragraph →</PBtn>
          </div>
        }
      </div>
    );
  }
  return <Spinner/>;
}

/* ─── CERTIFICATE ─────────────────────────────────── */
function CertificateScreen({user,xp,level,G,LT,DK,onBack}) {
  const [fullName,setFullName]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const [input,setInput]=useState(user?.name||"");

  const downloadCert=()=>{
    const canvas=document.createElement("canvas");
    canvas.width=1200;canvas.height=850;
    const ctx=canvas.getContext("2d");

    // Background
    const grad=ctx.createLinearGradient(0,0,1200,850);
    grad.addColorStop(0,"#f9fbe7");grad.addColorStop(1,"#e8f5e9");
    ctx.fillStyle=grad;ctx.fillRect(0,0,1200,850);

    // Outer border
    ctx.strokeStyle="#2D6A4F";ctx.lineWidth=12;ctx.strokeRect(24,24,1152,802);
    ctx.strokeStyle="#81c784";ctx.lineWidth=4;ctx.strokeRect(40,40,1120,770);

    // Corners
    [[60,60],[1140,60],[60,790],[1140,790]].forEach(([x,y])=>{
      ctx.fillStyle="#2D6A4F";ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();
    });

    // Header
    ctx.fillStyle="#2D6A4F";ctx.fillRect(40,40,1120,120);
    ctx.fillStyle="#ffffff";ctx.font="bold 28px Georgia,serif";ctx.textAlign="center";
    ctx.fillText("✍️  WriteUP UPGC",600,95);
    ctx.font="16px Georgia,serif";ctx.fillStyle="rgba(255,255,255,0.8)";
    ctx.fillText("Université Peleforo Gon Coulibaly  ·  Korhogo, Côte d'Ivoire",600,130);

    // Title
    ctx.fillStyle="#1b4332";ctx.font="bold 44px Georgia,serif";ctx.textAlign="center";
    ctx.fillText("Certificate of Academic Achievement",600,230);

    // Divider
    ctx.strokeStyle="#2D6A4F";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(200,255);ctx.lineTo(1000,255);ctx.stroke();

    // Presented to
    ctx.fillStyle="#555";ctx.font="italic 22px Georgia,serif";
    ctx.fillText("This certifies that",600,305);

    // Name
    ctx.fillStyle="#2D6A4F";ctx.font="bold 52px Georgia,serif";
    ctx.fillText(fullName,600,385);
    const nw=ctx.measureText(fullName).width;
    ctx.strokeStyle="#81c784";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(600-nw/2,398);ctx.lineTo(600+nw/2,398);ctx.stroke();

    // Description
    ctx.fillStyle="#333";ctx.font="18px Georgia,serif";
    ctx.fillText("has successfully completed the WriteUP UPGC Academic English Programme",600,448);
    ctx.fillText("demonstrating outstanding commitment to academic writing and language excellence.",600,476);

    // Stats band
    ctx.fillStyle="#e8f5e9";ctx.fillRect(150,510,900,115);
    ctx.strokeStyle="#a5d6a7";ctx.lineWidth=2;ctx.strokeRect(150,510,900,115);

    const stats=[
      {label:"Level Achieved",value:level},
      {label:"XP Earned",value:`${xp} XP`},
      {label:"Programme",value:"Academic English"},
      {label:"Date",value:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})},
    ];
    stats.forEach(({label,value},i)=>{
      const x=250+i*225;
      ctx.fillStyle="#2D6A4F";ctx.font="bold 17px Georgia,serif";ctx.textAlign="center";
      ctx.fillText(value,x,558);
      ctx.fillStyle="#888";ctx.font="13px Georgia,serif";
      ctx.fillText(label,x,580);
      if(i<3){ctx.strokeStyle="#a5d6a7";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+112,520);ctx.lineTo(x+112,615);ctx.stroke();}
    });

    // Signatures
    ctx.strokeStyle="#2D6A4F";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(200,710);ctx.lineTo(450,710);ctx.stroke();
    ctx.fillStyle="#333";ctx.font="14px Georgia,serif";ctx.textAlign="center";
    ctx.fillText("Programme Director",325,730);ctx.fillText("WriteUP UPGC",325,748);

    // Seal
    ctx.beginPath();ctx.arc(600,690,55,0,Math.PI*2);
    ctx.strokeStyle="#2D6A4F";ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle="rgba(45,106,79,0.08)";ctx.fill();
    ctx.fillStyle="#2D6A4F";ctx.font="bold 22px Georgia,serif";ctx.textAlign="center";
    ctx.fillText("✍️",600,685);
    ctx.font="10px Georgia,serif";ctx.fillText("UPGC · KORHOGO",600,705);
    ctx.font="9px Georgia,serif";ctx.fillText("CÔTE D'IVOIRE",600,720);

    ctx.beginPath();ctx.moveTo(750,710);ctx.lineTo(1000,710);ctx.stroke();
    ctx.fillStyle="#333";ctx.font="14px Georgia,serif";ctx.textAlign="center";
    ctx.fillText("Academic English Faculty",875,730);
    ctx.fillText("Université Peleforo Gon Coulibaly",875,748);

    // Footer
    ctx.fillStyle="#aaa";ctx.font="11px Georgia,serif";ctx.textAlign="center";
    ctx.fillText(`writeup-upgc.vercel.app  ·  Certificate ID: UPGC-${Date.now().toString(36).toUpperCase()}`,600,800);

    const a=document.createElement("a");
    a.href=canvas.toDataURL("image/png");
    a.download=`WriteUP_Certificate_${fullName.replace(/\s+/g,"_")}.png`;
    a.click();
  };

  return (
    <div style={{padding:18}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back</button>
      <h2 style={{color:DK,marginBottom:4,textAlign:"center"}}>🏆 Your Certificate</h2>
      <p style={{color:"#888",textAlign:"center",fontSize:13,marginBottom:20}}>Congratulations on reaching {xp} XP!</p>

      {!confirmed?(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:48,textAlign:"center",marginBottom:12}}>🎓</div>
          <h3 style={{color:G,textAlign:"center",margin:"0 0 8px"}}>Enter Your Full Name</h3>
          <p style={{color:"#555",textAlign:"center",fontSize:13,lineHeight:1.7,margin:"0 0 16px"}}>
            Your name will appear exactly as entered on the certificate.<br/>
            <strong>Please verify the spelling carefully.</strong>
          </p>
          <label style={{display:"block",fontWeight:700,color:DK,marginBottom:8}}>Full name *</label>
          <input value={input} onChange={e=>setInput(e.target.value)}
            placeholder="e.g. Kouassi Amos Brice"
            style={{display:"block",width:"100%",boxSizing:"border-box",border:`2px solid ${G}`,borderRadius:10,padding:"12px 14px",fontSize:16,outline:"none",fontFamily:"inherit",marginBottom:12}}/>
          <Card style={{background:"#fff3e0",marginBottom:12,padding:12}}>
            <p style={{margin:0,fontSize:12,color:"#e65100"}}>⚠️ This name cannot be changed after confirmation. Ensure it matches your official documents.</p>
          </Card>
          <PBtn onClick={()=>{if(input.trim().length>=3){setFullName(input.trim());setConfirmed(true);}}} disabled={input.trim().length<3} style={{background:G}}>
            Confirm my name →
          </PBtn>
        </Card>
      ):(
        <div>
          {/* Certificate Preview */}
          <div style={{background:"linear-gradient(135deg,#f9fbe7,#e8f5e9)",border:`4px solid ${G}`,borderRadius:12,padding:"0 0 24px",marginBottom:20,boxShadow:"0 4px 24px rgba(0,0,0,0.12)"}}>
            <div style={{background:G,padding:"20px 24px",borderRadius:"8px 8px 0 0",textAlign:"center"}}>
              <div style={{color:"#fff",fontWeight:900,fontSize:20}}>✍️ WriteUP UPGC</div>
              <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,marginTop:4}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</div>
            </div>
            <div style={{padding:"24px 28px",textAlign:"center"}}>
              <div style={{color:"#1b4332",fontWeight:900,fontSize:22,marginBottom:12,fontFamily:"Georgia,serif"}}>Certificate of Academic Achievement</div>
              <div style={{width:160,height:2,background:G,margin:"0 auto 16px"}}/>
              <div style={{color:"#666",fontSize:14,fontStyle:"italic",marginBottom:10}}>This certifies that</div>
              <div style={{color:G,fontWeight:900,fontSize:28,fontFamily:"Georgia,serif",marginBottom:6}}>{fullName}</div>
              <div style={{width:240,height:2,background:"#81c784",margin:"0 auto 16px"}}/>
              <div style={{color:"#444",fontSize:13,lineHeight:1.8,marginBottom:20}}>
                has successfully completed the WriteUP UPGC Academic English Programme<br/>
                demonstrating outstanding commitment to academic writing and language excellence.
              </div>
              <div style={{display:"flex",border:`2px solid #a5d6a7`,borderRadius:10,overflow:"hidden",marginBottom:20}}>
                {[{label:"Level",value:level},{label:"XP Earned",value:`${xp} XP`},{label:"Date",value:new Date().toLocaleDateString("fr-FR")}].map((s,i)=>(
                  <div key={i} style={{flex:1,padding:"12px 6px",background:"#f1f8e9",borderRight:i<2?"1px solid #a5d6a7":"none",textAlign:"center"}}>
                    <div style={{fontWeight:800,color:G,fontSize:13}}>{s.value}</div>
                    <div style={{color:"#888",fontSize:11,marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:"0 10px"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{width:130,borderTop:`2px solid ${G}`,paddingTop:6}}>
                    <div style={{fontSize:12,color:"#333",fontWeight:600}}>Programme Director</div>
                    <div style={{fontSize:11,color:"#888"}}>WriteUP UPGC</div>
                  </div>
                </div>
                <div style={{width:70,height:70,borderRadius:"50%",border:`3px solid ${G}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(45,106,79,0.06)"}}>
                  <div style={{fontSize:22}}>✍️</div>
                  <div style={{fontSize:8,color:G,fontWeight:700}}>UPGC</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{width:130,borderTop:`2px solid ${G}`,paddingTop:6}}>
                    <div style={{fontSize:12,color:"#333",fontWeight:600}}>English Faculty</div>
                    <div style={{fontSize:11,color:"#888"}}>UPGC Korhogo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <PBtn onClick={downloadCert} style={{background:G,marginBottom:8}}>⬇️ Download Certificate (PNG)</PBtn>
          <button onClick={()=>{setConfirmed(false);setInput(fullName);}} style={{width:"100%",padding:12,borderRadius:12,border:`2px solid ${G}`,background:"transparent",color:G,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
            ✏️ Change name
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── HOME SCREEN ─────────────────────────────────── */
function HomeScreen({setMod,xp,lvl,pct,level,done,G,LT,DK,onCertificate}) {
  const next=UNLOCKS.find(u=>u.xp>xp);
  const prev=[...UNLOCKS].reverse().find(u=>u.xp<=xp);
  const canCert=xp>=1300;
  return (
    <div style={{padding:18}}>
      <Card style={{marginBottom:14,background:`linear-gradient(135deg,${DK},${G})`,color:"#fff"}}>
        <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📅 {dateStr()}</div>
        <div style={{fontWeight:800,fontSize:16,marginBottom:2}}>{done.length>=MODS.length?"🎉 All done today!":"Today's Activities"}</div>
        <div style={{fontSize:12,opacity:.75}}>{done.length}/{MODS.length} completed · {level}</div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {MODS.map(m=><div key={m.id} style={{width:28,height:28,borderRadius:"50%",background:done.includes(m.id)?"#fff":"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{done.includes(m.id)?m.icon:"·"}</div>)}
        </div>
      </Card>

      <Card style={{marginBottom:10}}>
        
