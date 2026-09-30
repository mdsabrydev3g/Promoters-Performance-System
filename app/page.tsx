"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, Target, ReceiptText, RefreshCw, Plus, Search, LockKeyhole, LogIn, X } from "lucide-react";

type Emp = { id:string; name:string; company:string; department:{id:string;code:string;name:string}; status:string };
type Report = { byEmployee:Array<{employeeId:string;name:string;company:string;department:string;target:number;actual:number;achievement:number}>; totalActual:number; invoiceCount:number };

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
  const [report,setReport]=useState<Report>({byEmployee:[],totalActual:0,invoiceCount:0});
  const [loading,setLoading]=useState(true),[locked,setLocked]=useState(false),[loginOpen,setLoginOpen]=useState(false),[password,setPassword]=useState("");
  const [message,setMessage]=useState(""),[addOpen,setAddOpen]=useState(false),[invoiceOpen,setInvoiceOpen]=useState(false);
  const [form,setForm]=useState({name:"",company:"",departmentCode:"SDA"});
  const [inv,setInv]=useState({invoiceNumber:"",date:now.toISOString().slice(0,10),employeeId:"",amount:"",warranty:"0",agency:"0",notes:""});

  async function load(){
    setLoading(true);
    try{
      const [m,r]=await Promise.all([fetch(`/api/month?year=${year}&month=${month}`),fetch(`/api/reports?year=${year}&month=${month}`)]);
      const md=await m.json(), rd=await r.json();
      if(md?.employees?.length)setEmployees(md.employees);
      setLocked(!!md?.locked); if(rd?.byEmployee)setReport(rd);
    }catch{setMessage("Unable to load this month.")}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[year,month]);

  const visible=useMemo(()=>report.byEmployee.length?report.byEmployee.filter(e=>(dept==="ALL"||e.department===dept)&&(e.name+" "+e.company).toLowerCase().includes(q.toLowerCase())):employees.filter(e=>(dept==="ALL"||e.department.code===dept)&&(e.name+" "+e.company).toLowerCase().includes(q.toLowerCase())).map(e=>({employeeId:e.id,name:e.name,company:e.company,department:e.department.code,target:0,actual:0,achievement:0})),[report,employees,dept,q]);
  const monthName=new Date(2000,month-1,1).toLocaleString("en",{month:"long"});
  const filteredActual=visible.reduce((s,e)=>s+e.actual,0),filteredTarget=visible.reduce((s,e)=>s+e.target,0);

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
  async function addInvoice(e:React.FormEvent){
    e.preventDefault(); const r=await fetch("/api/invoices",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...inv,amount:Number(inv.amount),warranty:Number(inv.warranty),agency:Number(inv.agency)})});
    const d=await r.json(); setMessage(r.ok?"Invoice saved.":d.error||"Unable to save invoice."); if(r.ok){setInvoiceOpen(false);setInv({...inv,invoiceNumber:"",amount:"",warranty:"0",agency:"0",notes:""});load()}
  }

  return <main>
    <header><div><span className="eyebrow">SALES OPERATIONS</span><h1>Promoters Performance</h1><p>Target, sales and invoice performance dashboard</p></div><div className="actions"><button className="secondary" onClick={()=>setLoginOpen(true)}><LogIn size={16}/> Manager</button><button className="primary" onClick={load}><RefreshCw size={17}/> Refresh</button></div></header>
    {message&&<div className="notice">{message}<button onClick={()=>setMessage("")}><X size={15}/></button></div>}
    <section className="toolbar"><select value={year} onChange={e=>setYear(+e.target.value)}>{[2026,2027,2028,2029].map(y=><option key={y}>{y}</option>)}</select><select value={month} onChange={e=>setMonth(+e.target.value)}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(2000,i,1).toLocaleString("en",{month:"long"})}</option>)}</select><div className="search"><Search size={17}/><input placeholder="Search promoter or company..." value={q} onChange={e=>setQ(e.target.value)}/></div></section>
    <nav className="tabs">{departments.map(d=><button key={d} className={dept===d?"active":""} onClick={()=>setDept(d)}>{d}</button>)}</nav>
    <section className="cards"><K icon={<Users/>} label="Promoters" value={visible.length}/><K icon={<Target/>} label="Target" value={money(filteredTarget)}/><K icon={<ReceiptText/>} label="Invoices" value={report.invoiceCount}/><K icon={<BarChart3/>} label="Actual Sales" value={money(filteredActual)}/></section>
    <section className="monthbar"><div><strong>{locked?<><LockKeyhole size={16}/> Month locked</>: "Monthly cycle ready"}</strong><span>{year} · {monthName} · Historical months remain unchanged.</span></div><div className="actions">{!locked&&<><button className="secondary" onClick={()=>setInvoiceOpen(true)}><ReceiptText size={15}/> Add Invoice</button><button className="secondary" onClick={()=>setAddOpen(true)}><Plus size={15}/> Add Promoter</button></>}{!locked&&<button className="secondary" onClick={initMonth}>Initialize Month</button>}</div></section>
    <section className="panel"><div className="panelhead"><div><h2>Promoter Performance</h2><span>{year} · {monthName}</span></div></div><div className="tablewrap"><table><thead><tr><th>Promoter</th><th>Company</th><th>Department</th><th>Target</th><th>Actual</th><th>Achievement</th></tr></thead><tbody>{loading?<tr><td colSpan={6}>Loading...</td></tr>:visible.map(e=><tr key={e.employeeId}><td className="name">{e.name}</td><td>{e.company}</td><td><span className="badge">{e.department}</span></td><td>{money(e.target)}</td><td>{money(e.actual)}</td><td><span className={`percent ${e.achievement>=85?"good":e.achievement>=70?"warn":"danger"}`}>{e.achievement.toFixed(0)}%</span></td></tr>)}</tbody></table></div></section>
    {loginOpen&&<Modal title="Manager Access" onClose={()=>setLoginOpen(false)}><form onSubmit={e=>{e.preventDefault();login()}}><label>Manager Password<input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label><button className="primary full"><LogIn size={16}/> Sign in</button></form></Modal>}
    {addOpen&&<Modal title="Add Promoter" onClose={()=>setAddOpen(false)}><form onSubmit={addEmployee}><label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Company<input required value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></label><label>Department<select value={form.departmentCode} onChange={e=>setForm({...form,departmentCode:e.target.value})}>{departments.slice(1).map(d=><option key={d}>{d}</option>)}</select></label><button className="primary full"><Plus size={16}/> Save Promoter</button></form></Modal>}
    {invoiceOpen&&<Modal title="Add Invoice" onClose={()=>setInvoiceOpen(false)}><form onSubmit={addInvoice}><label>Invoice Number<input required value={inv.invoiceNumber} onChange={e=>setInv({...inv,invoiceNumber:e.target.value})}/></label><label>Date<input type="date" required value={inv.date} onChange={e=>setInv({...inv,date:e.target.value})}/></label><label>Promoter<select required value={inv.employeeId} onChange={e=>setInv({...inv,employeeId:e.target.value})}><option value="">Select promoter</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name} · {e.company}</option>)}</select></label><label>Amount<input required type="number" min="0" value={inv.amount} onChange={e=>setInv({...inv,amount:e.target.value})}/></label><div className="grid2"><label>Warranty<input type="number" min="0" value={inv.warranty} onChange={e=>setInv({...inv,warranty:e.target.value})}/></label><label>Agency<input type="number" min="0" value={inv.agency} onChange={e=>setInv({...inv,agency:e.target.value})}/></label></div><label>Notes<textarea value={inv.notes} onChange={e=>setInv({...inv,notes:e.target.value})}/></label><button className="primary full"><ReceiptText size={16}/> Save Invoice</button></form></Modal>}
  </main>
}
function K({icon,label,value}:{icon:React.ReactNode;label:string;value:React.ReactNode}){return <div className="card"><span className="icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="modalback"><div className="modal"><div className="modalhead"><h3>{title}</h3><button onClick={onClose}><X size={18}/></button></div>{children}</div></div>}
