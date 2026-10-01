"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, Target, ReceiptText, RefreshCw, Plus, Search, LockKeyhole, LogIn, X, Sun, Moon, Settings2, ShieldCheck } from "lucide-react";

type Emp = { id:string; name:string; company:string; department:{id:string;code:string;name:string}; status:string };
type Report = { byEmployee:Array<{employeeId:string;name:string;company:string;department:string;target:number;actual:number;achievement:number}>; totalActual:number; invoiceCount:number; days:number; daily:Array<{date:number;rows:Array<{employeeId:string;actual:number}>}> }; type Special={warranty:any;agency:any};

const seed:Emp[] = [
["Black+Decker","ياسمين احمد عبدالوهاب","SDA"],["Smart","بسنت محمد سيد","SDA"],["Casil","هشام محمد قرني","SDA"],["Incia","ميرنا اشرف سعيد","SDA"],["Mienta","ندي سيد احمد عوض علي","SDA"],["HERVY","سمر صلاح عبدالحميد","SDA"],
["Kiriazi","ايهاب سلامه محمد","MDA"],["Midea","رضا محمد محمد مصطفي","MDA"],["Royal Gas","سيف ماجد محمد","MDA"],["Fresh","احمد حسين محمد","MDA"],["Bosch","احمد عادل صادق","MDA"],["El Araby","سعيد عبدالعظيم عبدالتواب","MDA"],["El Araby","مجدي ابراهيم محمد","MDA"],["Zanussi","زهراء محمد عبدالتواب صابر","MDA"],
["Vivo","محمد يونس","MOBILE"],["Realme","هشام ايمن","MOBILE"],["Joyroom","تسنيم اسماعيل علي","MOBILE"],["Oppo","حسام ابراهيم","MOBILE"],["Samsung","محمد مجدي","MOBILE"],["Samsung","علي شعبان","MOBILE"],["Vivo","عمر حسين","MOBILE"],["Xiaomi","عمرو عويس","MOBILE"],
["Hisense","محمود حسين مسعود","TV-AC"],["Haier","فاطمه مصطفي حسين","TV-AC"],["Samsung","يوسف سامي يوسف","TV-AC"]
].map(([company,name,code],i)=>({id:String(i+1),name,company,department:{id:code,code,name:code},status:"ACTIVE"}));

const departments=["ALL","TV-AC","MDA","MOBILE","SDA"];
const money=(n:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(n);

export default function Home(){
  const now=new Date();
  const [employees,setEmployees]=useState<Emp[]>(seed),[dept,setDept]=useState("ALL"),[q,setQ]=useState("");
  const [year,setYear]=useState(now.getFullYear()),[month,setMonth]=useState(now.getMonth()+1);
  const [report,setReport]=useState<Report>({byEmployee:[],totalActual:0,invoiceCount:0,days:31,daily:[]}); const [special,setSpecial]=useState<Special>({warranty:null,agency:null}); const [theme,setTheme]=useState<"light"|"dark">("light"); const [manager,setManager]=useState(false); const [targetOpen,setTargetOpen]=useState(false); const [specialOpen,setSpecialOpen]=useState<"WARRANTY"|"AGENCY"|null>(null); const [targetDept,setTargetDept]=useState("SDA"); const [targetAmount,setTargetAmount]=useState(""); const [manualTargets,setManualTargets]=useState<Record<string,string>>({}); const [specialTotal,setSpecialTotal]=useState(""); const [specialTargets,setSpecialTargets]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true),[locked,setLocked]=useState(false),[loginOpen,setLoginOpen]=useState(false),[password,setPassword]=useState("");
  const [message,setMessage]=useState(""),[addOpen,setAddOpen]=useState(false),[invoiceOpen,setInvoiceOpen]=useState(false);
  const [form,setForm]=useState({name:"",company:"",departmentCode:"SDA"});
  const [inv,setInv]=useState({invoiceNumber:"",date:now.toISOString().slice(0,10),employeeId:"",amount:"",warranty:"0",agency:"0",notes:""}); useEffect(()=>{const x=localStorage.getItem("sps-theme") as "light"|"dark"|null;if(x)setTheme(x)},[]); useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("sps-theme",theme)},[theme]);

  async function load(){
    setLoading(true);
    try{
      const [m,r,s]=await Promise.all([fetch(`/api/month?year=${year}&month=${month}`),fetch(`/api/reports?year=${year}&month=${month}`),fetch(`/api/special-targets?year=${year}&month=${month}`)]);
      const md=await m.json(), rd=await r.json(), sd=await s.json();
      if(md?.employees?.length)setEmployees(md.employees);
      setLocked(!!md?.locked); if(rd?.byEmployee)setReport(rd); if(sd)setSpecial(sd);
    }catch{setMessage("Unable to load this month.")}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[year,month]);

  const visible=useMemo(()=>report.byEmployee.length?report.byEmployee.filter(e=>(dept==="ALL"||e.department===dept)&&(e.name+" "+e.company).toLowerCase().includes(q.toLowerCase())):employees.filter(e=>(dept==="ALL"||e.department.code===dept)&&(e.name+" "+e.company).toLowerCase().includes(q.toLowerCase())).map(e=>({employeeId:e.id,name:e.name,company:e.company,department:e.department.code,target:0,actual:0,achievement:0})),[report,employees,dept,q]);
  const monthName=new Date(2000,month-1,1).toLocaleString("en",{month:"long"});
  const filteredActual=visible.reduce((s,e)=>s+e.actual,0),filteredTarget=visible.reduce((s,e)=>s+e.target,0); const targetEmployees=employees.filter(e=>e.department.code===targetDept);

  async function login(){
    const r=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password})});
    if(r.ok){setLoginOpen(false);setPassword("");setMessage("Manager access enabled.");}else setMessage("Invalid manager password.");
  }
  async function initMonth(){
    const r=await fetch("/api/month",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({year,month})});
    setMessage(r.ok?"Month initialized.":"Manager authentication required."); if(r.ok)load();
  }
  async function addEmployee(e:React.FormEvent){
    e.preventDefault(); const r=await fetch("/api/employees",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
    const d=await r.json(); setMessage(r.ok?"Promoter added.":d.error||"Unable to add promoter."); if(r.ok){setAddOpen(false);setForm({name:"",company:"",departmentCode:"SDA"});load()}
  }
  function requireManager(){if(!manager){setLoginOpen(true);return false}return true} function openTargets(){if(!requireManager())return;setTargetDept(dept==="ALL"?"TV-AC":dept);setTargetAmount("");setManualTargets({});setTargetOpen(true)} function openSpecial(type:"WARRANTY"|"AGENCY"){if(!requireManager())return;const obj=type==="WARRANTY"?special.warranty:special.agency;setSpecialTotal(obj?String(Number(obj.amount)):"");const map:Record<string,string>={};(obj?.employeeTargets||[]).forEach((x:any)=>map[x.employeeId]=String(Number(x.amount)));setSpecialTargets(map);setSpecialOpen(type)} async function saveTargets(e:React.FormEvent){e.preventDefault();const dep=employees.find(x=>x.department.code===targetDept)?.department.id;const r=await fetch("/api/targets",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({year,month,departmentId:dep,amount:Number(targetAmount),employeeTargets:Object.entries(manualTargets).filter(([,v])=>Number(v)>0).map(([employeeId,amount])=>({employeeId,amount:Number(amount)}))})});const d=await r.json();setMessage(r.ok?"Department target saved.":d.error||"Unable to save target.");if(r.ok){setTargetOpen(false);load()}} async function saveSpecial(e:React.FormEvent){e.preventDefault();const r=await fetch("/api/special-targets",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({year,month,type:specialOpen,total:Number(specialTotal),employeeTargets:Object.entries(specialTargets).filter(([,v])=>Number(v)>0).map(([employeeId,amount])=>({employeeId,amount:Number(amount)}))})});const d=await r.json();setMessage(r.ok?"Special target saved.":d.error||"Unable to save target.");if(r.ok){setSpecialOpen(null);load()}} async function addInvoice(e:React.FormEvent){
    e.preventDefault(); const r=await fetch("/api/invoices",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...inv,amount:Number(inv.amount),warranty:Number(inv.warranty),agency:Number(inv.agency)})});
    const d=await r.json(); setMessage(r.ok?"Invoice saved.":d.error||"Unable to save invoice."); if(r.ok){setInvoiceOpen(false);setInv({...inv,invoiceNumber:"",amount:"",warranty:"0",agency:"0",notes:""});load()}
  }

  return <main>
    <header><div><span className="eyebrow">SALES OPERATIONS</span><h1>Promoters Performance</h1><p>Target, sales and invoice performance dashboard</p></div><div className="actions"><button className="secondary" onClick={()=>setTheme(theme==="light"?"dark":"light")}>{theme==="light"?<Moon size={16}/>:<Sun size={16}/>} {theme==="light"?"Dark":"Light"} Mode</button><button className="secondary" onClick={()=>manager?setManager(false):setLoginOpen(true)}>{manager?<ShieldCheck size={16}/>:<LogIn size={16}/>} {manager?"Manager Active":"Manager"}</button><button className="primary" onClick={load}><RefreshCw size={17}/> Refresh</button></div></header>
    {message&&<div className="notice">{message}<button onClick={()=>setMessage("")}><X size={15}/></button></div>}
    <section className="toolbar"><select value={year} onChange={e=>setYear(+e.target.value)}>{[2026,2027,2028,2029].map(y=><option key={y}>{y}</option>)}</select><select value={month} onChange={e=>setMonth(+e.target.value)}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(2000,i,1).toLocaleString("en",{month:"long"})}</option>)}</select><div className="search"><Search size={17}/><input placeholder="Search promoter or company..." value={q} onChange={e=>setQ(e.target.value)}/></div></section>
    <nav className="tabs">{departments.map(d=><button key={d} className={dept===d?"active":""} onClick={()=>setDept(d)}>{d}</button>)}</nav>
    <section className="cards"><K icon={<Users/>} label="Promoters" value={visible.length}/><K icon={<Target/>} label="Target" value={money(filteredTarget)}/><K icon={<ReceiptText/>} label="Invoices" value={report.invoiceCount}/><K icon={<BarChart3/>} label="Actual Sales" value={money(filteredActual)}/></section>
    <section className="monthbar"><div><strong>{locked?<><LockKeyhole size={16}/> Month locked</>: "Monthly cycle ready"}</strong><span>{year} · {monthName} · Historical months remain unchanged.</span></div><div className="actions"><button className="secondary" onClick={openTargets}><Settings2 size={15}/> Sales Target</button><button className="secondary" onClick={()=>openSpecial("AGENCY")}>Agency Target</button><button className="secondary" onClick={()=>openSpecial("WARRANTY")}>Warranty Target</button>{manager&&!locked&&<><button className="secondary" onClick={()=>setInvoiceOpen(true)}><ReceiptText size={15}/> Add Invoice</button><button className="secondary" onClick={()=>setAddOpen(true)}><Plus size={15}/> Add Promoter</button></>}{!locked&&<button className="secondary" onClick={initMonth}>Initialize Month</button>}</div></section>
    <section className="panel"><div className="panelhead"><div><h2>Promoter Performance</h2><span>{year} · {monthName}</span></div></div><div className="employee-grid">{loading?<div className="empty">Loading...</div>:visible.map(e=><article className="employee-card" key={e.employeeId}><div className="employee-main"><div><b>{e.name}</b><small>{e.company} · {e.department}</small></div><div className={"circle "+(e.achievement>=85?"good":e.achievement>=70?"warn":"danger")}><span>{e.achievement.toFixed(0)}%</span></div></div><div className="metric-row"><span>Target <b>{money(e.target)}</b></span><span>Actual <b>{money(e.actual)}</b></span><span>Gap <b>{money(e.actual-e.target)}</b></span></div></article>)}</div></section><section className="panel daily-panel"><div className="panelhead"><div><h2>Daily Sales — Every Promoter</h2><span>Open a day to see each promoter's actual sales.</span></div></div><div className="daily-list">{report.daily.map(day=><details key={day.date}><summary>Day {day.date}</summary><div className="daily-grid">{visible.map(e=>{const x=day.rows.find(r=>r.employeeId===e.employeeId);return <div className="daily-row" key={e.employeeId}><span>{e.name}</span><b>{money(x?.actual||0)}</b></div>})}</div></details>)}</div></section>
    {loginOpen&&<Modal title="Manager Access" onClose={()=>setLoginOpen(false)}><form onSubmit={e=>{e.preventDefault();login()}}><p className="modal-note">Password is the Vercel <b>ADMIN_PASSWORD</b> value.</p><label>Manager Password<input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary full">Sign in</button></form></Modal>}{targetOpen&&<Modal title={"Sales Target — "+targetDept} onClose={()=>setTargetOpen(false)}><form onSubmit={saveTargets}><label>Department Monthly Target<input required type="number" min="0" value={targetAmount} onChange={e=>setTargetAmount(e.target.value)}/></label><p className="modal-note">Leave employee values empty for automatic equal distribution. Enter a value for manual allocation.</p><div className="target-list">{targetEmployees.map(e=><label key={e.id}>{e.name}<input type="number" min="0" placeholder="Auto" value={manualTargets[e.id]||""} onChange={x=>setManualTargets({...manualTargets,[e.id]:x.target.value})}/></label>)}</div><button className="primary full">Save & Distribute Target</button></form></Modal>}{specialOpen&&<Modal title={specialOpen==="AGENCY"?"Agency / Dealer Target":"Warranty Target"} onClose={()=>setSpecialOpen(null)}><form onSubmit={saveSpecial}><label>Total Target<input required type="number" min="0" value={specialTotal} onChange={e=>setSpecialTotal(e.target.value)}/></label><div className="target-list">{employees.map(e=><label key={e.id}>{e.name}<input type="number" min="0" value={specialTargets[e.id]||""} onChange={x=>setSpecialTargets({...specialTargets,[e.id]:x.target.value})}/></label>)}</div><button className="primary full">Save Target Allocation</button></form></Modal>}</main>
}
function K({icon,label,value}:{icon:React.ReactNode;label:string;value:React.ReactNode}){return <div className="card"><span className="icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="modalback"><div className="modal"><div className="modalhead"><h3>{title}</h3><button onClick={onClose}><X size={18}/></button></div>{children}</div></div>}
