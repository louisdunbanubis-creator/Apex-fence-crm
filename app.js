const KEY='apexFenceCRM.v1';const defaultData={leads:[],jobs:[],estimates:[],settings:{laborRate:45,serviceCharge:175,materialMarkup:25,homeDepotMarkup:50,woodPost14:125,woodPost5:100,quikrete:6.47, bagsPerPost:2,woodRepairLF:25,reinstallLF:10,picketAmerican:8.21,railAmerican:14.47,postAmerican:48.69}};let data=load();let deferredInstall=null;
function load(){try{return {...defaultData,...JSON.parse(localStorage.getItem(KEY)||'{}'),settings:{...defaultData.settings,...(JSON.parse(localStorage.getItem(KEY)||'{}').settings||{})}}}catch{return structuredClone(defaultData)}}function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}function money(n){return '$'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function $(id){return document.getElementById(id)}function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function showView(v){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));window.scrollTo(0,0)}
document.addEventListener('click',e=>{const v=e.target.closest('[data-view]');if(v)showView(v.dataset.view);const a=e.target.closest('[data-action]');if(a){if(a.dataset.action==='new-lead')openLead();if(a.dataset.action==='new-job')openJob()}});
function renderDashboard(){const counts={};data.leads.forEach(x=>counts[x.status]=(counts[x.status]||0)+1);$('stats').innerHTML=[['Leads',data.leads.length],['Estimates',data.estimates.length],['Open Jobs',data.jobs.filter(x=>x.status!=='Complete').length],['Won',data.leads.filter(x=>x.status==='Won'||x.status==='Scheduled'||x.status==='Complete').length]].map(x=>'<div class="stat"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('');$('pipeline').innerHTML=['New','Contacted','Estimate Scheduled','Estimate Sent','Won','Scheduled','Complete','Lost'].map(s=>'<div class="pipeline-row"><span>'+s+'</span><strong>'+(counts[s]||0)+'</strong></div>').join('');const jobs=[...data.jobs].filter(x=>x.status!=='Complete').sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(0,5);$('upcoming').innerHTML=jobs.length?jobs.map(jobHTML).join(''):'<p class="muted">No upcoming jobs.</p>'}
function renderLeads(){const q=($('leadSearch')?.value||'').toLowerCase(),f=$('leadFilter')?.value||'all';const list=data.leads.filter(x=>(f==='all'||x.status===f)&&[x.name,x.phone,x.address,x.jobType].join(' ').toLowerCase().includes(q));$('leadList').innerHTML=list.length?list.map(leadHTML).join(''):'<div class="card"><p class="muted">No leads yet. Add your first customer.</p></div>'}
function leadHTML(x){return '<div class="lead"><div class="lead-top"><div><div class="lead-name">'+esc(x.name)+'</div><div class="mutedline">'+esc(x.phone||'')+' · '+esc(x.address||'')+'</div><div class="mutedline">'+esc(x.jobType||'')+(x.notes?' · '+esc(x.notes):'')+'</div></div><span class="badge">'+esc(x.status)+'</span></div><div class="row gap" style="margin-top:10px"><button class="secondary" onclick="editLead(\''+x.id+'\')">Edit</button><button class="secondary" onclick="openJobForLead(\''+x.id+'\')">Schedule Job</button></div></div>'}
function jobHTML(x){return '<div class="job"><div class="job-top"><div><strong>'+esc(x.title||x.name)+'</strong><div class="mutedline">'+esc(x.date||'No date')+' · '+esc(x.address||'')+'</div></div><span class="badge">'+esc(x.status||'Scheduled')+'</span></div></div>'}
function openModal(html){$('modalContent').innerHTML=html;$('modal').classList.remove('hidden')}function closeModal(){$('modal').classList.add('hidden')}
function openLead(existing){const x=existing||{status:'New',jobType:'Repair'};openModal('<h2>'+ (existing?'Edit':'New') +' Lead</h2><form id="leadForm"><div class="grid2"><label>Name<input name="name" required value="'+esc(x.name||'')+'"></label><label>Phone<input name="phone" value="'+esc(x.phone||'')+'"></label><label>Email<input name="email" value="'+esc(x.email||'')+'"></label><label>Address<input name="address" value="'+esc(x.address||'')+'"></label><label>Job type<select name="jobType">'+['Repair','Install','Staining','Removal'].map(o=>'<option '+(x.jobType===o?'selected':'')+'>'+o+'</option>').join('')+'</select></label><label>Status<select name="status">'+['New','Contacted','Estimate Scheduled','Estimate Sent','Won','Scheduled','Complete','Lost'].map(o=>'<option '+(x.status===o?'selected':'')+'>'+o+'</option>').join('')+'</select></label></div><label style="margin-top:14px">Notes<textarea name="notes" rows="4" style="background:#0b111b;color:#fff;border:1px solid var(--line);border-radius:9px;padding:12px">'+esc(x.notes||'')+'</textarea></label><div class="row form-actions"><button type="button" class="secondary" id="cancelModal">Cancel</button><button class="primary">Save Lead</button></div></form>');$('leadForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),obj=Object.fromEntries(fd);if(existing)Object.assign(existing,obj);else data.leads.unshift({id:crypto.randomUUID(),...obj,createdAt:new Date().toISOString()});save();closeModal();showView('leads')};$('cancelModal').onclick=closeModal}
function editLead(id){openLead(data.leads.find(x=>x.id===id))}function openJobForLead(id){openJob(data.leads.find(x=>x.id===id))}
function openJob(lead){const x={name:lead?.name||'',address:lead?.address||'',status:'Scheduled'};openModal('<h2>Schedule Job</h2><form id="jobForm"><div class="grid2"><label>Customer<input name="name" required value="'+esc(x.name)+'"></label><label>Date<input name="date" type="date" required></label><label>Address<input name="address" value="'+esc(x.address)+'"></label><label>Job status<select name="status"><option>Scheduled</option><option>In Progress</option><option>Complete</option></select></label><label>Job title<input name="title" value="'+esc(lead?.jobType||'Fence Job')+'"></label></div><div class="row form-actions"><button type="button" class="secondary" id="cancelModal">Cancel</button><button class="primary">Save Job</button></div></form>');$('jobForm').onsubmit=e=>{e.preventDefault();data.jobs.push({id:crypto.randomUUID(),...Object.fromEntries(new FormData(e.target))});if(lead&&lead.status==='Won')lead.status='Scheduled';save();closeModal();showView('jobs')};$('cancelModal').onclick=closeModal}
const GATES={4:{single:{3:161.23,4:172.82,5:184.45,6:196.04},double:{6:172.47,8:277.95,10:295.12,12:314.24,14:331.41}},6:{single:{3:216.73,4:230.33,5:243.89,6:170.02},double:{6:217.33,8:334.96,10:356.08,12:379.10,14:402.13}}};
const CL={
  "4-galv":{fabric:7.05,terminal:35.43,line:24.78,rail:58.55,tensionBar:4.70,termCap:2.08,tensionBand:0.96,lineTop:2.29,railEnd:1.65,endBand:1.12,wireTie:13.38,bolt:0.42},
  "6-galv":{fabric:10.28,terminal:47.76,line:33.04,rail:58.55,tensionBar:7.31,termCap:2.08,tensionBand:0.96,lineTop:2.29,railEnd:1.65,endBand:1.12,wireTie:13.38,bolt:0.42},
  "4-black":{fabric:7.73,terminal:50.50,line:27.67,rail:70.88,tensionBar:11.68,termCap:2.72,tensionBand:1.40,lineTop:2.94,railEnd:2.42,endBand:1.45,wireTie:62.46,bolt:0.53},
  "6-black":{fabric:11.55,terminal:48.42,line:43.19,rail:70.88,tensionBar:7.29,termCap:2.72,tensionBand:1.40,lineTop:3.95,railEnd:2.59,endBand:1.41,wireTie:34.48,bolt:0.53}
};
function clMaterialEstimate(){
  const lf=+$('lf').value||0,h=+$('clHeight').value||4,finish=$('clFinish').value||'galv';
  const terminals=Math.max(2,+$('terminalPosts').value||2),sg=+$('singleGates').value||0,dg=+$('doubleGates').value||0,sw=+$('singleGateWidth').value||3,dw=+$('doubleGateWidth').value||6;
  const key=h+'-'+finish,p=CL[key]; if(!p)return null;
  const linePosts=Math.max(0,Math.ceil(lf/10)+1-terminals-2*sg-2*dg);
  const totalTerminal=terminals+2*sg+2*dg;
  const railPieces=Math.ceil(lf/21);
  const bags=Math.ceil((linePosts+totalTerminal)*2);
  const materialMarkup=1+(data.settings.materialMarkup??25)/100;
  const homeDepotMarkup=1+(data.settings.homeDepotMarkup??50)/100;
  const qCost=(data.settings.quikrete??6.47);
  const rows=[
    ['Fabric',lf,p.fabric,'american'],
    ['Line posts',linePosts,p.line,'american'],
    ['Terminal/corner/gate posts',totalTerminal,p.terminal,'american'],
    ['Top rail (21 ft)',railPieces,p.rail,'american'],
    ['Tension bars',totalTerminal,p.tensionBar,'american'],
    ['Terminal caps',totalTerminal,p.termCap,'american'],
    ['Tension bands',totalTerminal*2,p.tensionBand,'american'],
    ['Line tops',linePosts,p.lineTop,'american'],
    ['Rail ends',Math.max(2,terminals+2*sg+2*dg),p.railEnd,'american'],
    ['End bands',Math.max(2,terminals),p.endBand,'american'],
    ['Wire ties / bags of 100',Math.ceil(lf/100),p.wireTie,'american'],
    ['Carriage bolts',Math.max(4,totalTerminal*2),p.bolt,'american']
  ];
  const gateRows=[];
  if(sg)gateRows.push(['Single swing gates ('+sw+' ft)',sg,GATES[h].single[sw],'american']);
  if(dg)gateRows.push(['Double drive gates ('+dw+' ft)',dg,GATES[h].double[dw],'american']);
  rows.push(...gateRows);
  const americanBase=rows.reduce((s,r)=>s+r[1]*r[2],0);
  const americanPrice=americanBase*materialMarkup;
  const concretePrice=bags*qCost*homeDepotMarkup;
  const material=americanPrice+concretePrice;
  $('chainLinkBreakdown').innerHTML='<div class="material-list">'+rows.map(r=>'<div class="row pipeline-row"><span>'+r[0]+' <small class="mutedline">× '+r[1]+'</small></span><strong>'+money(r[1]*r[2]*materialMarkup)+'</strong></div>').join('')+
  '<div class="row pipeline-row"><span>Quikrete 80-lb bags <small class="mutedline">× '+bags+' · Home Depot +50%</small></span><strong>'+money(concretePrice)+'</strong></div></div>'+
  '<div class="estimate-result"><div class="muted">American Fence material cost</div><strong>'+money(americanBase)+'</strong><div class="muted">Apex American Fence material price (+25%)</div><strong>'+money(americanPrice)+'</strong><div class="muted">Total material price</div><div class="estimate-price">'+money(material)+'</div><div class="mutedline">'+h+"' "+(finish==='black'?'black vinyl':'galvanized')+' · '+lf+' LF · 10-ft nominal post spacing · 2 × 80-lb bags/post</div></div>';
  return {americanBase,americanPrice,concretePrice,material,rows,linePosts,totalTerminal,bags};
}
function calcEstimate(){
  const lf=+$('lf').value||0,hours=+$('laborHours').value||0,rate=+$('laborRate').value||0,service=+$('serviceCharge').value||0,markup=(+$('markup').value||0)/100;
  let mat=+$('materialCost')?.value||0;
  let cl=null;
  if($('jobType').value==='Chain Link Install'){cl=clMaterialEstimate();mat=cl?.material||0}if($('jobType').value==='Wood Install'){const lf=+$('lf').value||0;const posts=Math.ceil(lf/8)+1;const pickets=Math.ceil((lf/(5.5/12))*1.05);const rails=Math.ceil(lf/8)*3;const bags=posts*2;const nails=Math.max(1,Math.ceil(pickets*3/740));mat=(pickets*4.28+rails*28.51+posts*12.98+nails*21+bags*6.47)*1.5}
  const cost=mat+hours*rate+service,price=cost*(1+markup);
  $('estimateResult').innerHTML='<div class="muted">Customer quote</div><div class="estimate-price">'+money(price)+'</div><div class="profit">Estimated gross profit: '+money(price-cost)+'</div><div class="mutedline">'+lf+' LF · Material '+money(mat)+' · Labor '+money(hours*rate)+' · Service '+money(service)+'</div>';
  return{lf,mat,h:hours,rate,service,markup,cost,price,chainLink:cl};
}
['lf','terminalPosts','singleGates','doubleGates','laborHours','laborRate','serviceCharge','markup'].forEach(id=>document.addEventListener('input',e=>{if(e.target.id===id)calcEstimate()}));document.addEventListener('change',e=>{if(['jobType','clHeight','clFinish','terminalPosts','singleGates','doubleGates','singleGateWidth','doubleGateWidth'].includes(e.target.id))calcEstimate()});
document.addEventListener('click',e=>{const p=e.target.closest('[data-preset]');if(!p)return;const s=data.settings;if(p.dataset.preset==='repair'){$('jobType').value='Wood Repair';$('lf').value=10;$('laborHours').value=2}if(p.dataset.preset==='reinstall'){$('jobType').value='Wood Repair';$('lf').value=20;$('laborHours').value=2}calcEstimate()});
$('applyRepairPreset').onclick=()=>{$('jobType').value='Wood Repair';$('serviceCharge').value=data.settings.serviceCharge;$('laborRate').value=data.settings.laborRate;$('markup').value=35;calcEstimate()};
$('saveEstimate').onclick=()=>{const c=calcEstimate();data.estimates.unshift({id:crypto.randomUUID(),type:$('jobType').value,...c,createdAt:new Date().toISOString()});save();alert('Estimate saved.')};
$('leadSearch').oninput=renderLeads;$('leadFilter').onchange=renderLeads;
$('saveSettings').onclick=()=>{data.settings={...data.settings,laborRate:+$('defaultLaborRate').value,serviceCharge:+$('defaultServiceCharge').value,materialMarkup:+$('materialMarkup').value,homeDepotMarkup:+$('homeDepotMarkup').value,woodPost14:+$('woodPost14').value,woodPost5:+$('woodPost5').value,quikrete:+$('quikrete').value,bagsPerPost:+$('bagsPerPost').value,woodRepairLF:+$('woodRepairLF').value,reinstallLF:+$('reinstallLF').value,picketAmerican:+$('picketAmerican').value,railAmerican:+$('railAmerican').value,postAmerican:+$('postAmerican').value};save();alert('Pricing settings saved.')};
function renderJobs(){$('jobList').innerHTML=data.jobs.length?data.jobs.sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(jobHTML).join(''):'<div class="card"><p class="muted">No jobs scheduled.</p></div>'}
function renderSettings(){const s=data.settings;if($('woodHeight'))$('woodHeight').value=s.woodHeight??6;[['defaultLaborRate',s.laborRate],['defaultServiceCharge',s.serviceCharge],['materialMarkup',s.materialMarkup??25],['homeDepotMarkup',s.homeDepotMarkup??50],['woodPost14',s.woodPost14],['woodPost5',s.woodPost5],['quikrete',s.quikrete??10],['bagsPerPost',s.bagsPerPost],['woodRepairLF',s.woodRepairLF],['reinstallLF',s.reinstallLF],['picketAmerican',s.picketAmerican??8.21],['railAmerican',s.railAmerican??14.47],['postAmerican',s.postAmerican??48.69]].forEach(([id,v])=>$(id).value=v)}
function renderAll(){renderDashboard();renderLeads();renderJobs();renderSettings();calcEstimate()}$('closeModal').onclick=closeModal;$('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
$('exportData').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='apex-fence-crm-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('importData').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();alert('Backup imported.')}catch{alert('Invalid backup file.')}};r.readAsText(f)};
$('resetData').onclick=()=>{if(confirm('Delete all CRM data from this browser? Export a backup first if needed.')){data=structuredClone(defaultData);save()}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}};
renderAll();
$('jobType').addEventListener('change',()=>{const cl=$('jobType').value==='Chain Link Install';document.querySelectorAll('#clHeight,#clFinish,#terminalPosts,#singleGates,#singleGateWidth,#doubleGates,#doubleGateWidth').forEach(x=>x.disabled=!cl);calcEstimate()});