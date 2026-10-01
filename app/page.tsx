"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, Target, ReceiptText, RefreshCw, Plus, Search, LogIn, X, Sun, Moon, Settings2, ShieldCheck } from "lucide-react";

type Emp = { id:string; name:string; company:string; department:{id:string;code:string;name:string}; status:string };
type Report = { byEmployee:Array<{employeeId:string;name:string;company:string;department:string;target:number;actual:number;achievement:number;agencyTarget:number;agencyActual:number;agencyAchievement:number;warrantyTarget:number;warrantyActual:number;warrantyAchievement:number}>; totalActual:number; invoiceCount:number; days:number; daily:Array<{date:number;rows:Array<{employeeId:string;actual:number}>}> }; type Special={warranty:any;agency:any}; type Invoice={id:string;invoiceNumber:string;date:string;employeeId:string;amount:number;warranty:number;agency:number;notes?:string|null;employee:{name:string;company:{name:string}}};

const seed:Emp[] = [
["Black & W","ياسمين احمد عبدالوهاب","SDA"],["Smart","بسنت محمد سيد","SDA"],["Castle","هشام محمد قرني","SDA"],["Black-D","ميرنا اشرف سعيد","SDA"],["Mienta","ندي سيد احمد عوض علي","SDA"],["HERVY","سمر صلاح عبدالحميد","SDA"],
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
  const [report,setReport]=useState<Report>({byEmployee:[],totalActual:0,invoiceCount:0,days:31,daily:[]}); const [special,setSpecial]=useState<Special>({warranty:null,agency:null}); const [theme,setTheme]=useState<"light"|"dark">("light"); const [manager,setManager]=useState(false); const [targetOpen,setTargetOpen]=useState(false); const [specialOpen,setSpecialOpen]=useState<"WARRANTY"|"AGENCY"|null>(null); const [targetDept,setTargetDept]=useState("SDA"); const [targetAmount,setTargetAmount]=useState(""); const [specialTotal,setSpecialTotal]=useState(""); const [specialTargets,setSpecialTargets]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true),[locked,setLocked]=useState(false),[loginOpen,setLoginOpen]=useState(false),[password,setPassword]=useState("");
  const [message,setMessage]=useState(""),[addOpen,setAddOpen]=useState(false),[invoiceOpen,setInvoiceOpen]=useState(false),[invoiceEdit,setInvoiceEdit]=useState<string|null>(null),[invoices,setInvoices]=useState<Invoice[]>([]);
  const [form,setForm]=useState({name:"",company:"",departmentCode:"SDA"}); const [invoiceSearch,setInvoiceSearch]=useState(""); const [invoiceDateFilter,setInvoiceDateFilter]=useState(""); const [invoiceEmployeeFilter,setInvoiceEmployeeFilter]=useState("");
  const [inv,setInv]=useState({invoiceNumber:"",date:now.toISOString().slice(0,10),employeeId:"",amount:"",warranty:"0",agency:"0",notes:""}); useEffect(()=>{const x=localStorage.getItem("sps-theme") as "light"|"dark"|null;if(x)setTheme(x)},[]); useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("sps-theme",theme)},[theme]);

  async function load(){
    setLoading(true);
    try{
      const [m,r,s,i]=await Promise.all([fetch(`/api/month?year=${year}&month=${month}`),fetch(`/api/reports?year=${year}&month=${month}`),fetch(`/api/special-targets?year=${year}&month=${month}`),fetch(`/api/invoices?year=${year}&month=${month}`)]);
      const md=await m.json(), rd=await r.json(), sd=await s.json(), id=await i.json();
      if(md?.employees?.length)setEmployees(md.employees);
      setLocked(!!md?.locked); if(rd?.byEmployee)setReport(rd); if(sd)setSpecial(sd); if(Array.isArray(id))setInvoices(id);
    }catch{setMessage("Unable to load this month.")}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[year,month]);

  const visible=useMemo(()=>report.byEmployee.length?report.byEmployee.filter(e=>(dept==="ALL"||e.department===dept)&&(e.name+" "+e.company).toLowerCase().includes(q.toLowerCase())):employees.filter(e=>(dept==="ALL"||e.department.code===dept)&&(e.name+" "+e.company).toLowerCase().includes(q.toLowerCase())).map(e=>({employeeId:e.id,name:e.name,company:e.company,department:e.department.code,target:0,actual:0,achievement:0,agencyTarget:0,agencyActual:0,agencyAchievement:0,warrantyTarget:0,warrantyActual:0,warrantyAchievement:0})),[report,employees,dept,q]);
  const monthName=new Date(2000,month-1,1).toLocaleString("en",{month:"long"});
  const filteredActual=visible.reduce((s,e)=>s+e.actual,0),filteredTarget=visible.reduce((s,e)=>s+e.target,0); const targetEmployees=employees.filter(e=>e.department.code===targetDept&&e.status==="ACTIVE");

  async function login(){
    const r=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password})});
    if(r.ok){setLoginOpen(false);setPassword("");setManager(true);setMessage("Manager access enabled.");}else setMessage("Invalid manager password.");
  }
  async function initMonth(){
    const r=await fetch("/api/month",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({year,month})});
    setMessage(r.ok?"Month initialized.":"Manager authentication required."); if(r.ok)load();
  }
  async function addEmployee(e:React.FormEvent){
    e.preventDefault(); const r=await fetch("/api/employees",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
    const d=await r.json(); setMessage(r.ok?"Promoter added.":d.error||"Unable to add promoter."); if(r.ok){setAddOpen(false);setForm({name:"",company:"",departmentCode:"SDA"});load()}
  }
  function requireManager(){if(!manager){setLoginOpen(true);return false}return true} async function openTargets(){if(!requireManager())return;const d=dept==="ALL"?"TV-AC":dept;setTargetDept(d);try{const r=await fetch(`/api/month?year=${year}&month=${month}`);const md=await r.json();const dep=md.departments?.find((x:any)=>x.code===d);const row=md.monthly?.find((x:any)=>x.departmentId===dep?.id);setTargetAmount(row?String(Number(row.amount)):"")}catch{setTargetAmount("")}setTargetOpen(true)} function openSpecial(type:"WARRANTY"|"AGENCY"){if(!requireManager())return;const obj=type==="WARRANTY"?special.warranty:special.agency;setSpecialTotal(obj?String(Number(obj.amount)):"");const map:Record<string,string>={};(obj?.employeeTargets||[]).forEach((x:any)=>map[x.employeeId]=String(Number(x.amount)));setSpecialTargets(map);setSpecialOpen(type)} async function saveTargets(e:React.FormEvent){e.preventDefault();const dep=employees.find(x=>x.department.code===targetDept)?.department.id;if(!dep)return setMessage("Department not found.");const r=await fetch("/api/targets",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({year,month,departmentId:dep,amount:Number(targetAmount)})});const d=await r.json();setMessage(r.ok?"Department target saved and distributed equally.":d.error||"Unable to save target.");if(r.ok){setTargetOpen(false);load()}} async function saveSpecial(e:React.FormEvent){e.preventDefault();const r=await fetch("/api/special-targets",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({year,month,type:specialOpen,total:Number(specialTotal),employeeTargets:Object.entries(specialTargets).filter(([,v])=>Number(v)>0).map(([employeeId,amount])=>({employeeId,amount:Number(amount)}))})});const d=await r.json();setMessage(r.ok?"Special target saved.":d.error||"Unable to save target.");if(r.ok){setSpecialOpen(null);load()}} async function addInvoice(e:React.FormEvent){e.preventDefault();const payload={date:inv.date,employeeId:inv.employeeId,amount:Number(inv.amount),warranty:Number(inv.warranty),agency:Number(inv.agency),notes:inv.notes};const r=await fetch("/api/invoices",{method:invoiceEdit?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(invoiceEdit?{...payload,id:invoiceEdit}:payload)});const d=await r.json();setMessage(r.ok?(invoiceEdit?"Invoice updated.":"Invoice saved."):d.error||"Unable to save invoice.");if(r.ok){setInvoiceOpen(false);setInvoiceEdit(null);setInv({...inv,invoiceNumber:"",amount:"",warranty:"0",agency:"0",notes:""});load()}}
