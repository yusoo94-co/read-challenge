import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase.js";
import { ref, onValue, set, get, update } from "firebase/database";

// ═══════════════════════════════════════════════════════════
//  FIREBASE DB HELPERS
// ═══════════════════════════════════════════════════════════
async function dbLoad() {
  try {
    const snap = await get(ref(db, "rooms"));
    return snap.exists() ? { rooms: snap.val() } : { rooms: {} };
  } catch {
    // fallback to localStorage if Firebase not configured yet
    try { const l = localStorage.getItem("rc_db"); if (l) return JSON.parse(l); } catch {}
    return { rooms: {} };
  }
}

async function dbSave(data) {
  try {
    await set(ref(db, "rooms"), data.rooms);
  } catch {
    try { localStorage.setItem("rc_db", JSON.stringify(data)); } catch {}
  }
}

function subscribeRoom(roomId, callback) {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    return onValue(roomRef, (snap) => {
      if (snap.exists()) callback(snap.val());
    });
  } catch {
    return () => {};
  }
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
const genId = () => Math.random().toString(36).slice(2, 10);
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDt = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
};

const CELL_OPTIONS = [
  ...Array.from({length:27}, (_,i) => `${i+1}셀`),
  "바나바셀", "교역자"
];

const BAR_COLORS = [
  "#C9A84C","#7C5CBF","#4CAF8A","#E07B54","#5B9BD5",
  "#D4607A","#6BBF8A","#C97B3F","#8B7CB5","#4AABB5",
  "#B5A24A","#7B5C9F","#5CAF7C","#B57B3F"
];

// ═══════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const C = {
  bg: "#080C14", card: "#111827", card2: "#1A2235",
  border: "rgba(201,168,76,0.15)",
  gold: "#C9A84C", goldLight: "#F0D47A", goldDark: "#8B6914",
  text: "#EDE8DF", muted: "#7A8299",
  green: "#4CAF8A", red: "#E05C5C",
};

const css = {
  app: { fontFamily:"'Noto Sans KR',sans-serif", background:C.bg, minHeight:"100vh", color:C.text, maxWidth:480, margin:"0 auto", paddingBottom:76, position:"relative", overflowX:"hidden" },
  card: { background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, marginBottom:12 },
  input: { width:"100%", background:"#060A12", border:`1px solid rgba(201,168,76,0.22)`, borderRadius:10, padding:"12px 14px", color:C.text, fontFamily:"'Noto Sans KR',sans-serif", fontSize:15, outline:"none", boxSizing:"border-box" },
  label: { display:"block", fontSize:11, color:C.muted, marginBottom:6, letterSpacing:1, textTransform:"uppercase" },
  btnGold: { width:"100%", padding:"14px", border:"none", borderRadius:12, background:`linear-gradient(135deg,${C.goldDark},${C.gold},${C.goldLight})`, color:"#060A12", fontFamily:"'Noto Serif KR',serif", fontSize:15, fontWeight:700, cursor:"pointer", letterSpacing:1 },
  btnGhost: { width:"100%", padding:"12px", border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, background:"rgba(255,255,255,0.04)", color:C.muted, fontFamily:"'Noto Sans KR',sans-serif", fontSize:14, cursor:"pointer" },
  btnGreen: { width:"100%", padding:"15px", border:"none", borderRadius:13, background:`linear-gradient(135deg,#1E5C3A,${C.green})`, color:"white", fontFamily:"'Noto Serif KR',serif", fontSize:17, fontWeight:700, cursor:"pointer", letterSpacing:1, boxShadow:"0 4px 20px rgba(76,175,138,0.25)" },
  secTitle: { fontFamily:"'Noto Serif KR',serif", fontSize:11, color:C.gold, letterSpacing:2, textTransform:"uppercase", marginBottom:11 },
  nav: { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"rgba(8,12,20,0.97)", backdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100 },
};

// ═══════════════════════════════════════════════════════════
//  SCROLL PICKER
// ═══════════════════════════════════════════════════════════
function ScrollPicker({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <div onClick={() => setOpen(!open)}
        style={{...css.input, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", userSelect:"none"}}>
        <span style={{color: value ? C.text : C.muted}}>{value || "소속 선택"}</span>
        <span style={{color:C.gold, fontSize:12}}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{position:"fixed",inset:0,zIndex:40}} />
          <div style={{position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#0E1520", border:`1px solid ${C.border}`, borderRadius:12, maxHeight:240, overflowY:"auto", zIndex:50, boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                style={{padding:"13px 16px", fontSize:15, cursor:"pointer", color: value===opt ? C.gold : C.text, background: value===opt ? "rgba(201,168,76,0.1)" : "transparent", borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [room, setRoom] = useState(null);
  const [screen, setScreen] = useState("splash");
  const [roomId, setRoomId] = useState(null);
  const [myId, setMyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState("home");

  const [fName, setFName] = useState("");
  const [fCell, setFCell] = useState("");
  const [fAvatar, setFAvatar] = useState(null);
  const [fChurch, setFChurch] = useState("");
  const [fChallenge, setFChallenge] = useState("");
  const [fGoal, setFGoal] = useState("500");
  const [fCode, setFCode] = useState("");
  const [editTarget, setEditTarget] = useState(null);

  const avatarRef = useRef(null);
  const unsubRef = useRef(null);

  // ── Init ──────────────────────────────────────────────
  useEffect(() => {
    const storedRoom = localStorage.getItem("rc_roomId");
    const storedMe = localStorage.getItem("rc_myId");
    const urlCode = new URLSearchParams(window.location.search).get("join");

    const init = async () => {
      const data = await dbLoad();

      if (urlCode) {
        const found = Object.values(data.rooms || {}).find(r => r.inviteCode === urlCode);
        if (found) {
          setRoomId(found.id);
          localStorage.setItem("rc_roomId", found.id);
          if (storedMe && found.members?.[storedMe]) {
            setMyId(storedMe);
            subscribeToRoom(found.id);
            setRoom(found);
            setScreen("home"); setActiveNav("home");
          } else {
            setRoom(found);
            setScreen("setup");
          }
          return;
        }
      }

      if (storedRoom && storedMe && data.rooms?.[storedRoom]?.members?.[storedMe]) {
        setRoomId(storedRoom);
        setMyId(storedMe);
        setRoom(data.rooms[storedRoom]);
        subscribeToRoom(storedRoom);
        setScreen("home"); setActiveNav("home");
      } else {
        setTimeout(() => setScreen("landing"), 1200);
      }
    };
    init();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const subscribeToRoom = useCallback((rid) => {
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribeRoom(rid, (roomData) => {
      setRoom(roomData);
    });
  }, []);

  // ── Helpers ───────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const showCelebrate = (n) => {
    const m = {
      1:{e:"🎉",t:"첫 완독!",s:"말씀의 여정이 시작됐어요"},
      10:{e:"🌟",t:"10독 달성!",s:"꾸준함이 빛납니다"},
      50:{e:"🔥",t:"50독 달성!",s:"정말 대단해요!"},
      100:{e:"👑",t:"100독 달성!",s:"말씀의 챔피언!"},
      200:{e:"✨",t:"200독 달성!",s:"믿음이 자라고 있어요"},
      300:{e:"💫",t:"300독 달성!",s:"하나님의 은혜가 넘칩니다"},
      400:{e:"🏆",t:"400독 달성!",s:"500독이 눈앞에!"},
      500:{e:"🎊",t:"500독 완주!",s:"할렐루야! 목표 달성!"},
    };
    setCelebrate(m[n] || {e:"🎉",t:`${n}독!`,s:"수고하셨습니다"});
  };

  // ── Create Room ───────────────────────────────────────
  const createRoom = async () => {
    if (!fChurch.trim()) { showToast("교회 이름을 입력해 주세요"); return; }
    if (!fChallenge.trim()) { showToast("챌린지 이름을 입력해 주세요"); return; }
    setLoading(true);
    const id = genId();
    const adminId = genId();
    const newRoom = {
      id, inviteCode: genCode(),
      church: fChurch.trim(),
      challenge: fChallenge.trim(),
      goal: parseInt(fGoal)||500,
      createdAt: new Date().toISOString(),
      members: {
        [adminId]: { id:adminId, name:"관리자", cell:"교역자", avatar:null, reads:[], isAdmin:true, createdAt:new Date().toISOString() }
      }
    };
    try {
      await set(ref(db, `rooms/${id}`), newRoom);
    } catch {
      const data = await dbLoad();
      data.rooms[id] = newRoom;
      localStorage.setItem("rc_db", JSON.stringify(data));
    }
    localStorage.setItem("rc_roomId", id);
    localStorage.setItem("rc_myId", adminId);
    setRoomId(id); setMyId(adminId); setRoom(newRoom);
    subscribeToRoom(id);
    setLoading(false);
    setScreen("home"); setActiveNav("home");
    showToast("🎉 챌린지 방이 만들어졌어요!");
  };

  // ── Join Room ─────────────────────────────────────────
  const joinRoom = async () => {
    const code = fCode.trim().toUpperCase();
    if (!code) { showToast("초대 코드를 입력해 주세요"); return; }
    setLoading(true);
    const data = await dbLoad();
    const found = Object.values(data.rooms||{}).find(r => r.inviteCode === code);
    if (!found) { showToast("❌ 코드를 다시 확인해 주세요"); setLoading(false); return; }
    setRoomId(found.id);
    setRoom(found);
    localStorage.setItem("rc_roomId", found.id);
    setLoading(false);
    setScreen("setup");
  };

  // ── Save Profile ──────────────────────────────────────
  const saveProfile = async () => {
    if (!fName.trim()) { showToast("이름을 입력해 주세요 😊"); return; }
    if (!fCell) { showToast("소속을 선택해 주세요"); return; }
    setLoading(true);
    const mid = myId || genId();
    const rid = roomId;
    const existing = room?.members?.[mid];
    const member = {
      id: mid, name: fName.trim(), cell: fCell,
      avatar: fAvatar || existing?.avatar || null,
      reads: existing?.reads || [],
      isAdmin: existing?.isAdmin || false,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    try {
      await set(ref(db, `rooms/${rid}/members/${mid}`), member);
    } catch {
      const data = await dbLoad();
      if (data.rooms[rid]) { data.rooms[rid].members = data.rooms[rid].members||{}; data.rooms[rid].members[mid] = member; }
      localStorage.setItem("rc_db", JSON.stringify(data));
      setRoom(r => r ? {...r, members:{...r.members, [mid]:member}} : r);
    }
    localStorage.setItem("rc_myId", mid);
    setMyId(mid);
    subscribeToRoom(rid);
    setLoading(false);
    showToast("프로필이 저장되었습니다 🙏");
    setScreen("home"); setActiveNav("home");
  };

  // ── Record Read ───────────────────────────────────────
  const recordRead = async () => {
    if (!myId || !roomId || !room) return;
    setLoading(true);
    const existing = room.members?.[myId]?.reads || [];
    const newReads = [...existing, new Date().toISOString()];
    try {
      await set(ref(db, `rooms/${roomId}/members/${myId}/reads`), newReads);
    } catch {
      const data = await dbLoad();
      if (data.rooms[roomId]?.members[myId]) data.rooms[roomId].members[myId].reads = newReads;
      localStorage.setItem("rc_db", JSON.stringify(data));
      setRoom(r => r ? {...r, members:{...r.members, [myId]:{...r.members[myId], reads:newReads}}} : r);
    }
    setLoading(false);
    const count = newReads.length;
    const milestones = [1,10,50,100,200,300,400,500];
    if (milestones.includes(count)) showCelebrate(count);
    else showToast(`📖 ${count}독 완료! 수고하셨습니다`);
  };

  // ── Admin ─────────────────────────────────────────────
  const adminSetReads = async (memberId, count) => {
    const n = parseInt(count); if (isNaN(n)||n<0) return;
    const member = room?.members?.[memberId]; if (!member) return;
    const cur = member.reads?.length || 0;
    let reads = [...(member.reads||[])];
    if (n > cur) for (let i=0;i<n-cur;i++) reads.push(new Date().toISOString());
    else reads = reads.slice(0,n);
    try {
      await set(ref(db, `rooms/${roomId}/members/${memberId}/reads`), reads);
    } catch {
      const data = await dbLoad();
      if (data.rooms[roomId]?.members[memberId]) data.rooms[roomId].members[memberId].reads = reads;
      localStorage.setItem("rc_db", JSON.stringify(data));
      setRoom(r => ({...r, members:{...r.members, [memberId]:{...r.members[memberId], reads}}}));
    }
    showToast(`✅ ${member.name}님 ${n}독으로 수정됨`);
    setEditTarget(null);
  };

  const adminRemoveMember = async (memberId) => {
    if (!confirm("정말 이 멤버를 삭제할까요?")) return;
    try {
      await set(ref(db, `rooms/${roomId}/members/${memberId}`), null);
    } catch {
      const data = await dbLoad();
      if (data.rooms[roomId]?.members) delete data.rooms[roomId].members[memberId];
      localStorage.setItem("rc_db", JSON.stringify(data));
      setRoom(r => { const m={...r.members}; delete m[memberId]; return {...r, members:m}; });
    }
    showToast("삭제되었습니다");
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0]; if (!file) return;
    // Compress image before storing
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 200;
        const ratio = Math.min(MAX/img.width, MAX/img.height);
        canvas.width = img.width*ratio; canvas.height = img.height*ratio;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        setFAvatar(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const goTo = (s) => { setActiveNav(s); setScreen(s); };

  // ── Derived ───────────────────────────────────────────
  const me = room?.members?.[myId];
  const isAdmin = me?.isAdmin;
  const members = room ? Object.values(room.members||{}).sort((a,b)=>(b.reads?.length||0)-(a.reads?.length||0)) : [];
  const totalReads = members.reduce((s,m)=>s+(m.reads?.length||0),0);
  const goal = room?.goal || 500;
  const myReads = me?.reads || [];
  const myRank = members.findIndex(m=>m.id===myId)+1;
  const todayCount = myReads.filter(r=>r.slice(0,10)===todayStr()).length;

  const heatmap = (() => {
    if (!me) return [];
    const now=new Date(), y=now.getFullYear(), mo=now.getMonth();
    const fd=new Date(y,mo,1).getDay(), days=new Date(y,mo+1,0).getDate();
    const map={};
    myReads.forEach(iso=>{const d=new Date(iso);if(d.getFullYear()===y&&d.getMonth()===mo){map[d.getDate()]=(map[d.getDate()]||0)+1;}});
    const cells=[];
    for(let i=0;i<fd;i++) cells.push(null);
    for(let d=1;d<=days;d++) cells.push({d,cnt:map[d]||0});
    return cells;
  })();

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={css.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes glow{0%,100%{text-shadow:0 0 8px rgba(201,168,76,.3)}50%{text-shadow:0 0 24px rgba(201,168,76,.9)}}
        @keyframes popIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes fadeUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes barIn{from{width:0}to{}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:#3A4255}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(201,168,76,.2);border-radius:2px}
      `}</style>

      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse 70% 45% at 10% 5%,rgba(139,106,20,0.1) 0%,transparent 55%),radial-gradient(ellipse 50% 35% at 90% 95%,rgba(76,175,138,0.07) 0%,transparent 50%)",pointerEvents:"none",zIndex:0}} />

      {/* ══ SPLASH ══ */}
      {screen==="splash" && (
        <div style={{position:"fixed",inset:0,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,zIndex:200}}>
          <div style={{fontSize:52,animation:"glow 2s ease-in-out infinite"}}>✝</div>
          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,fontWeight:900,color:C.gold,letterSpacing:3}}>말씀 챌린지</div>
          <div style={{width:32,height:32,border:"3px solid rgba(201,168,76,0.2)",borderTop:`3px solid ${C.gold}`,borderRadius:"50%",animation:"spin 1s linear infinite",marginTop:8}} />
        </div>
      )}

      {/* ══ LANDING ══ */}
      {screen==="landing" && (
        <div style={{position:"relative",zIndex:1,padding:"60px 20px 30px",display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh"}}>
          <div style={{fontSize:50,animation:"glow 3s ease-in-out infinite",marginBottom:16}}>✝</div>
          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:26,fontWeight:900,color:C.gold,letterSpacing:2,textAlign:"center",marginBottom:8}}>말씀 챌린지</div>
          <div style={{fontSize:14,color:C.muted,textAlign:"center",marginBottom:52,lineHeight:2}}>우리 교회 말씀 읽기를<br/>함께 기록하고 응원해요 🙏</div>
          <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:14}}>
            <button style={css.btnGold} onClick={()=>setScreen("createRoom")}>✨ 새 챌린지 방 만들기</button>
            <button style={{...css.btnGhost,border:"1px solid rgba(201,168,76,0.25)",color:C.gold}} onClick={()=>setScreen("joinRoom")}>🔗 초대 코드로 참여하기</button>
          </div>
          <div style={{position:"absolute",bottom:30,fontSize:11,color:"rgba(255,255,255,0.12)",textAlign:"center",letterSpacing:1}}>WORD CHALLENGE PLATFORM</div>
        </div>
      )}

      {/* ══ CREATE ROOM ══ */}
      {screen==="createRoom" && (
        <div style={{position:"relative",zIndex:1,padding:"24px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
            <button onClick={()=>setScreen("landing")} style={{background:"none",border:"none",color:C.muted,fontSize:24,cursor:"pointer"}}>←</button>
            <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:19,fontWeight:900,color:C.gold}}>새 챌린지 방 만들기</div>
          </div>
          <div style={css.card}>
            <div style={{marginBottom:14}}>
              <label style={css.label}>교회 이름 *</label>
              <input style={css.input} value={fChurch} onChange={e=>setFChurch(e.target.value)} placeholder="멜번 순복음교회" />
            </div>
            <div style={{marginBottom:14}}>
              <label style={css.label}>챌린지 이름 *</label>
              <input style={css.input} value={fChallenge} onChange={e=>setFChallenge(e.target.value)} placeholder="로마서 500독" />
            </div>
            <div style={{marginBottom:22}}>
              <label style={css.label}>목표 독수</label>
              <input style={css.input} type="number" value={fGoal} onChange={e=>setFGoal(e.target.value)} placeholder="500" min="1" />
            </div>
            <button style={{...css.btnGold,opacity:loading?.6:1}} onClick={createRoom} disabled={loading}>
              {loading?"생성 중...":"챌린지 방 만들기 →"}
            </button>
          </div>
        </div>
      )}

      {/* ══ JOIN ROOM ══ */}
      {screen==="joinRoom" && (
        <div style={{position:"relative",zIndex:1,padding:"24px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
            <button onClick={()=>setScreen("landing")} style={{background:"none",border:"none",color:C.muted,fontSize:24,cursor:"pointer"}}>←</button>
            <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:19,fontWeight:900,color:C.gold}}>초대 코드로 참여</div>
          </div>
          <div style={css.card}>
            <div style={{textAlign:"center",fontSize:36,marginBottom:16}}>🔗</div>
            <div style={{marginBottom:22}}>
              <label style={css.label}>초대 코드 6자리</label>
              <input style={{...css.input,textAlign:"center",fontSize:26,letterSpacing:8,fontWeight:700}}
                value={fCode} onChange={e=>setFCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} />
            </div>
            <button style={{...css.btnGold,opacity:loading?.6:1}} onClick={joinRoom} disabled={loading}>
              {loading?"확인 중...":"참여하기 →"}
            </button>
          </div>
          <div style={{textAlign:"center",fontSize:13,color:C.muted,marginTop:16,lineHeight:2}}>
            담당자에게 초대 코드를 받아<br/>입력하시면 됩니다 🙏
          </div>
        </div>
      )}

      {/* ══ SETUP ══ */}
      {screen==="setup" && room && (
        <div style={{position:"relative",zIndex:1,padding:"30px 16px"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:28,animation:"glow 3s ease-in-out infinite",marginBottom:10}}>✝</div>
            <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:20,fontWeight:900,color:C.gold,marginBottom:4}}>{room.church}</div>
            <div style={{fontSize:13,color:C.muted}}>{room.challenge} 참여 등록</div>
          </div>
          <div style={css.card}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginBottom:22}}>
              <div onClick={()=>avatarRef.current?.click()}
                style={{width:86,height:86,borderRadius:"50%",background:"#060A12",border:"2px dashed rgba(201,168,76,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,cursor:"pointer",overflow:"hidden"}}>
                {fAvatar?<img src={fAvatar} style={{width:"100%",height:"100%",objectFit:"cover"}} />:"📷"}
              </div>
              <span style={{fontSize:11,color:C.muted}}>사진 등록 (선택)</span>
              <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} style={{display:"none"}} />
            </div>
            <div style={{marginBottom:14}}>
              <label style={css.label}>이름 *</label>
              <input style={css.input} value={fName} onChange={e=>setFName(e.target.value)} placeholder="홍길동" maxLength={10} />
            </div>
            <div style={{marginBottom:22}}>
              <label style={css.label}>소속 *</label>
              <ScrollPicker options={CELL_OPTIONS} value={fCell} onChange={setFCell} />
            </div>
            <button style={{...css.btnGold,opacity:loading?.6:1}} onClick={saveProfile} disabled={loading}>
              {loading?"저장 중...":"챌린지 참여하기 →"}
            </button>
          </div>
        </div>
      )}

      {/* ══ MAIN (home/rank/history/admin) ══ */}
      {["home","rank","history","admin"].includes(screen) && room && me && (
        <>
          <div style={{textAlign:"center",padding:"26px 16px 14px",borderBottom:`1px solid ${C.border}`,position:"relative",zIndex:1}}>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:3,textTransform:"uppercase"}}>{room.church}</div>
            <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:18,fontWeight:900,color:C.gold}}>{room.challenge}</div>
          </div>

          {/* HOME */}
          {screen==="home" && (
            <div style={{padding:"15px",position:"relative",zIndex:1,animation:"fadeUp .35s ease"}}>
              {/* Banner */}
              <div style={{display:"flex",alignItems:"center",gap:13,background:`linear-gradient(135deg,${C.card},${C.card2})`,border:`1px solid ${C.border}`,borderRadius:16,padding:14,marginBottom:14}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"#060A12",border:`2px solid ${C.gold}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,overflow:"hidden",flexShrink:0}}>
                  {me.avatar?<img src={me.avatar} style={{width:"100%",height:"100%",objectFit:"cover"}} />:"🙏"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:16,fontWeight:700}}>{me.name} 성도님</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{me.cell} · <span style={{color:C.gold,fontWeight:700}}>{myReads.length}독</span> · {myRank}위</div>
                </div>
                {todayCount>0&&<div style={{background:"rgba(76,175,138,.15)",border:"1px solid rgba(76,175,138,.3)",borderRadius:20,padding:"4px 10px",fontSize:11,color:C.green}}>오늘 {todayCount}독</div>}
              </div>

              {/* Ring */}
              <div style={{...css.card,display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 16px"}}>
                <div style={{position:"relative",marginBottom:12}}>
                  <svg width={150} height={150} style={{transform:"rotate(-90deg)"}}>
                    <defs><linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={C.goldDark}/><stop offset="50%" stopColor={C.gold}/><stop offset="100%" stopColor={C.goldLight}/>
                    </linearGradient></defs>
                    <circle cx={75} cy={75} r={63} fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth={8}/>
                    <circle cx={75} cy={75} r={63} fill="none" stroke="url(#gg)" strokeWidth={8} strokeLinecap="round"
                      strokeDasharray={395.84} strokeDashoffset={395.84-Math.min(myReads.length/goal,1)*395.84}
                      style={{transition:"stroke-dashoffset 1s ease"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:36,fontWeight:900,color:C.gold,lineHeight:1}}>{myReads.length}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:3}}>독</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>목표 {goal}독 · {(myReads.length/goal*100).toFixed(1)}% 달성</div>
                <div style={{width:"100%",height:5,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${C.goldDark},${C.gold})`,width:`${Math.min(myReads.length/goal*100,100)}%`,transition:"width 1s ease"}}/>
                </div>
              </div>

              <button onClick={recordRead} disabled={loading} style={{...css.btnGreen,marginBottom:14,opacity:loading?.6:1}}>
                {loading?"기록 중...":"📖 완독 기록하기"}
              </button>

              {/* Recent */}
              <div style={css.card}>
                <div style={css.secTitle}>📅 최근 완독 기록</div>
                {myReads.length===0
                  ?<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"14px 0"}}>아직 기록이 없어요<br/>첫 완독을 기록해 보세요! 📖</div>
                  :[...myReads].reverse().slice(0,8).map((iso,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<7?"1px solid rgba(255,255,255,.04)":"none"}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.gold,fontWeight:700,flexShrink:0}}>
                        {myReads.length-i}
                      </div>
                      <div style={{fontSize:13}}>{fmtDt(iso)}</div>
                    </div>
                  ))}
              </div>

              {/* Heatmap */}
              <div style={css.card}>
                <div style={css.secTitle}>🗓 이번 달 활동</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
                  {["일","월","화","수","목","금","토"].map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:C.muted}}>{d}</div>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                  {heatmap.map((cell,i)=>(
                    <div key={i} style={{aspectRatio:"1",borderRadius:5,background:cell?.cnt?"rgba(201,168,76,.25)":"rgba(255,255,255,.04)",border:cell?.cnt?"1px solid rgba(201,168,76,.4)":"none",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontSize:9,color:cell?.cnt?C.gold:"#3A4255",fontWeight:cell?.cnt?700:400}}>
                      {cell?<><span>{cell.d}</span>{cell.cnt>0&&<span style={{fontSize:8}}>×{cell.cnt}</span>}</>:null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RANK */}
          {screen==="rank" && (
            <div style={{padding:"15px",position:"relative",zIndex:1,animation:"fadeUp .35s ease"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[{n:totalReads,l:"전체 총독수"},{n:members.length,l:"참여 인원"},{n:members.length?Math.round(totalReads/members.length):0,l:"1인 평균"},{n:Math.min(Math.round(totalReads/goal*100),100)+"%",l:"교회 달성률"}].map((s,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:13,textAlign:"center"}}>
                    <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:25,fontWeight:900,color:C.gold,lineHeight:1}}>{s.n}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:4}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={css.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:12,color:C.muted}}>교회 전체 목표</div>
                  <div style={{fontSize:12,color:C.gold,fontFamily:"'Noto Serif KR',serif"}}>{totalReads} / {goal}독</div>
                </div>
                <div style={{height:8,background:"rgba(255,255,255,.06)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:4,background:`linear-gradient(90deg,${C.goldDark},${C.gold},${C.goldLight})`,width:`${Math.min(totalReads/goal*100,100)}%`,transition:"width 1s ease"}}/>
                </div>
              </div>
              <div style={css.card}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={css.secTitle}>🏆 성도 랭킹</div>
                </div>
                {members.length===0
                  ?<div style={{textAlign:"center",color:C.muted,padding:"20px 0"}}>아직 참여자가 없어요 🙏</div>
                  :members.map((u,i)=>{
                    const pct=members[0].reads?.length>0?(u.reads?.length||0)/members[0].reads.length*100:0;
                    const medals=["🥇","🥈","🥉"];
                    const isMe2=u.id===myId;
                    const color=BAR_COLORS[i%BAR_COLORS.length];
                    return(
                      <div key={u.id} style={{marginBottom:15,background:isMe2?"rgba(201,168,76,.06)":"transparent",borderRadius:10,padding:isMe2?"8px 10px":"0",border:isMe2?"1px solid rgba(201,168,76,.2)":"none"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:13,fontWeight:700,width:22,textAlign:"center",color:i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:C.muted}}>
                            {i<3?medals[i]:i+1}
                          </div>
                          <div style={{width:32,height:32,borderRadius:"50%",background:"#060A12",border:`1.5px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,overflow:"hidden",flexShrink:0}}>
                            {u.avatar?<img src={u.avatar} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🙏"}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:isMe2?700:400,display:"flex",alignItems:"center",gap:5}}>
                              {u.name}{isMe2&&<span style={{fontSize:10,color:C.gold}}>나</span>}
                            </div>
                            <div style={{fontSize:11,color:C.muted}}>{u.cell}</div>
                          </div>
                          <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:15,fontWeight:700,color,flexShrink:0}}>{u.reads?.length||0}독</div>
                        </div>
                        <div style={{marginLeft:30,height:7,background:"rgba(255,255,255,.05)",borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:4,background:color,width:`${pct}%`,animation:"barIn .8s ease",opacity:.85}}/>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* HISTORY */}
          {screen==="history" && (
            <div style={{padding:"15px",position:"relative",zIndex:1,animation:"fadeUp .35s ease"}}>
              <div style={css.card}>
                <div style={css.secTitle}>📋 전체 완독 기록 ({myReads.length}독)</div>
                {myReads.length===0
                  ?<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"20px 0"}}>아직 기록이 없어요</div>
                  :[...myReads].reverse().map((iso,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.gold,fontWeight:700,flexShrink:0}}>
                        {myReads.length-i}
                      </div>
                      <div>
                        <div style={{fontSize:13}}>{new Date(iso).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"short"})}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{new Date(iso).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ADMIN */}
          {screen==="admin" && isAdmin && (
            <div style={{padding:"15px",position:"relative",zIndex:1,animation:"fadeUp .35s ease"}}>
              {/* Invite */}
              <div style={{...css.card,background:"linear-gradient(135deg,#141028,#1A1535)"}}>
                <div style={css.secTitle}>🔗 초대 코드</div>
                <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:38,fontWeight:900,color:C.gold,letterSpacing:10,textAlign:"center",padding:"10px 0"}}>{room.inviteCode}</div>
                <div style={{fontSize:12,color:C.muted,textAlign:"center",marginBottom:14}}>이 코드를 카카오톡으로 공유하세요</div>
                <button onClick={()=>{navigator.clipboard?.writeText(room.inviteCode).catch(()=>{});showToast("코드가 복사됐어요!");}}
                  style={{...css.btnGold,padding:"11px"}}>코드 복사하기 📋</button>
              </div>

              {/* Info */}
              <div style={css.card}>
                <div style={css.secTitle}>⚙️ 챌린지 정보</div>
                {[["교회",room.church],["챌린지",room.challenge],["목표",`${room.goal}독`],["참여자",`${members.length}명`]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:13}}>
                    <span style={{color:C.muted}}>{k}</span><span>{v}</span>
                  </div>
                ))}
              </div>

              {/* Members */}
              <div style={css.card}>
                <div style={css.secTitle}>👥 멤버 관리</div>
                {members.map(u=>(
                  <div key={u.id} style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"#060A12",border:"1px solid rgba(201,168,76,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,overflow:"hidden",flexShrink:0}}>
                        {u.avatar?<img src={u.avatar} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🙏"}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500}}>{u.name}{u.isAdmin&&<span style={{fontSize:10,color:C.gold,marginLeft:5}}>(관리자)</span>}</div>
                        <div style={{fontSize:11,color:C.muted}}>{u.cell} · {u.reads?.length||0}독</div>
                      </div>
                      <button onClick={()=>setEditTarget(editTarget===u.id?null:u.id)}
                        style={{background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",borderRadius:7,padding:"5px 10px",color:C.gold,fontSize:11,cursor:"pointer",marginRight:4}}>
                        수정
                      </button>
                      {!u.isAdmin&&<button onClick={()=>adminRemoveMember(u.id)}
                        style={{background:"rgba(224,92,92,.1)",border:"1px solid rgba(224,92,92,.2)",borderRadius:7,padding:"5px 10px",color:C.red,fontSize:11,cursor:"pointer"}}>
                        삭제
                      </button>}
                    </div>
                    {editTarget===u.id&&(
                      <div style={{display:"flex",gap:8,marginTop:10,paddingLeft:42}}>
                        <input id={`ed_${u.id}`} type="number" defaultValue={u.reads?.length||0} min="0"
                          style={{...css.input,flex:1,padding:"9px 12px",fontSize:14}}/>
                        <button onClick={()=>{const v=document.getElementById(`ed_${u.id}`)?.value;adminSetReads(u.id,v);}}
                          style={{background:C.green,border:"none",borderRadius:8,padding:"9px 16px",color:"white",fontFamily:"'Noto Sans KR',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                          저장
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={css.card}>
                <div style={css.secTitle}>👤 내 프로필</div>
                <button style={css.btnGhost} onClick={()=>{if(me){setFName(me.name);setFCell(me.cell);setFAvatar(me.avatar||null);}setScreen("setup");}}>
                  프로필 수정하기
                </button>
              </div>
              <div style={css.card}>
                <button style={{...css.btnGhost,color:C.red,border:"1px solid rgba(224,92,92,.2)"}}
                  onClick={()=>{if(confirm("방에서 나가시겠어요?")){localStorage.removeItem("rc_roomId");localStorage.removeItem("rc_myId");window.location.reload();}}}>
                  방에서 나가기
                </button>
              </div>
            </div>
          )}

          {/* NAV */}
          <nav style={css.nav}>
            {[
              {id:"home",icon:"🏠",label:"홈"},
              {id:"rank",icon:"🏆",label:"랭킹"},
              {id:"history",icon:"📋",label:"기록"},
              ...(isAdmin?[{id:"admin",icon:"⚙️",label:"관리"}]:[]),
            ].map(n=>(
              <button key={n.id} onClick={()=>goTo(n.id)}
                style={{flex:1,padding:"11px 4px",background:"none",border:"none",color:activeNav===n.id?C.gold:C.muted,fontFamily:"'Noto Sans KR',sans-serif",fontSize:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"color .2s"}}>
                <span style={{fontSize:20}}>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
        </>
      )}

      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",bottom:84,left:"50%",transform:"translateX(-50%)",background:"#1E2E24",border:"1px solid rgba(76,175,138,.4)",color:"white",padding:"11px 22px",borderRadius:30,fontSize:13,fontWeight:500,zIndex:200,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.5)",animation:"fadeUp .3s ease"}}>
          {toast}
        </div>
      )}

      {/* CELEBRATE */}
      {celebrate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.card,border:`2px solid ${C.gold}`,borderRadius:24,padding:"30px 38px",textAlign:"center",animation:"popIn .4s cubic-bezier(.34,1.56,.64,1)",maxWidth:280}}>
            <div style={{fontSize:56,marginBottom:12}}>{celebrate.e}</div>
            <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:22,fontWeight:900,color:C.gold,marginBottom:6}}>{celebrate.t}</div>
            <div style={{fontSize:14,color:C.muted,marginBottom:22}}>{celebrate.s}</div>
            <button onClick={()=>setCelebrate(null)} style={{background:"none",border:"1px solid rgba(201,168,76,.4)",borderRadius:10,padding:"10px 28px",color:C.gold,fontFamily:"'Noto Serif KR',serif",fontSize:14,cursor:"pointer"}}>
              아멘 🙏
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
