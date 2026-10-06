const KEY='apexFenceCRM.v1';const defaultData={leads:[],jobs:[],estimates:[],settings:{laborRate:45,serviceCharge:175,materialMarkup:25,homeDepotMarkup:50,woodPost14:125,woodPost5:100,woodPicketHD:4.28,woodRailHD:28.51,woodPostHD:12.98,woodNailsHD:21,quikrete:6.47, bagsPerPost:2,woodRepairLF:25,reinstallLF:10,businessName:'Apex Fence',businessEmail:'Apexinstallsne@gmail.com',businessPhone:''}};let data=load();let deferredInstall=null;
function load(){try{return {...defaultData,...JSON.parse(localStorage.getItem(KEY)||'{}'),settings:{...defaultData.settings,...(JSON.parse(localStorage.getItem(KEY)||'{}').settings||{})}}}catch{return structuredClone(defaultData)}}function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}function money(n){return '$'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function $(id){return document.getElementById(id)}function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function showView(v){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));window.scrollTo(0,0)}
document.addEventListener('click',e=>{const p=e.target.closest('[data-pipeline]');if(p){showView('leads');$('leadFilter').value=p.dataset.pipeline;renderLeads()}const v=e.target.closest('[data-view]');if(v)showView(v.dataset.view);const a=e.target.closest('[data-action]');if(a){if(a.dataset.action==='new-lead')openLead();if(a.dataset.action==='new-job')openJob()}});
function renderDashboard(){const counts={};data.leads.forEach(x=>counts[x.status]=(counts[x.status]||0)+1);$('stats').innerHTML=[['Leads',data.leads.length],['Estimates',data.estimates.length],['Open Jobs',data.jobs.filter(x=>x.status!=='Complete').length],['Won',data.leads.filter(x=>x.status==='Won'||x.status==='Scheduled'||x.status==='Complete').length]].map(x=>'<div class="stat"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('');$('pipeline').innerHTML=['New','Contacted','Estimate Scheduled','Estimate Sent','Won','Scheduled','Complete','Lost'].map(s=>'<button class="pipeline-row pipeline-button" data-pipeline="'+s+'"><span>'+s+'</span><strong>'+(counts[s]||0)+'</strong></button>').join('');const jobs=[...data.jobs].filter(x=>x.status!=='Complete').sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(0,5);$('upcoming').innerHTML=jobs.length?jobs.map(jobHTML).join(''):'<p class="muted">No upcoming jobs.</p>'}
function renderLeads(){const q=($('leadSearch')?.value||'').toLowerCase(),f=$('leadFilter')?.value||'all';const list=data.leads.filter(x=>(f==='all'||x.status===f)&&[x.name,x.phone,x.address,x.jobType].join(' ').toLowerCase().includes(q));$('leadList').innerHTML=list.length?list.map(leadHTML).join(''):'<div class="card"><p class="muted">No leads yet. Add your first customer.</p></div>'}
function leadHTML(x){const phone=x.phone||'',email=x.email||'';return '<div class="lead"><div class="lead-top"><div><div class="lead-name">'+esc(x.name||'Unnamed lead')+'</div><div class="mutedline">'+esc(phone)+(x.email?' · '+esc(email):'')+'</div><div class="mutedline">'+esc(x.address||'No address yet')+'</div><div class="mutedline">'+esc(x.jobType||'')+(x.notes?' · '+esc(x.notes):'')+'</div></div><span class="badge">'+esc(x.status||'New')+'</span></div><div class="row gap lead-actions" style="margin-top:10px">'+(phone?'<a class="secondary action-link" href="tel:'+encodeURIComponent(phone)+'">Call</a><a class="secondary action-link" href="sms:'+encodeURIComponent(phone)+'">Text</a>':'')+(email?'<a class="secondary action-link" href="mailto:'+encodeURIComponent(email)+'">Email</a>':'')+'<button class="secondary" onclick="createEstimateFromLead(\''+x.id+'\')">Estimate</button><button class="secondary" onclick="editLead(\''+x.id+'\')">Edit</button><button class="secondary" onclick="openJobForLead(\''+x.id+'\')">Schedule</button></div></div>'}
function jobHTML(x){return '<div class="job"><div class="job-top"><div><strong>'+esc(x.title||x.name)+'</strong><div class="mutedline">'+esc(x.date||'No date')+' · '+esc(x.address||'')+'</div></div><span class="badge">'+esc(x.status||'Scheduled')+'</span></div></div>'}
function openModal(html){$('modalContent').innerHTML=html;$('modal').classList.remove('hidden')}function closeModal(){$('modal').classList.add('hidden')}
function openLead(existing){const x=existing||{status:'New',jobType:'Wood Repair'};openModal('<h2>'+ (existing?'Edit':'New') +' Lead</h2><form id="leadForm"><div class="grid2"><label>Name<input name="name" required value="'+esc(x.name||'')+'"></label><label>Phone<input name="phone" value="'+esc(x.phone||'')+'"></label><label>Email<input name="email" type="email" value="'+esc(x.email||'')+'"></label><label>Address<input name="address" value="'+esc(x.address||'')+'"></label><label>Project type<select name="jobType">'+['Wood Repair','Vinyl Repair','Chain Link Repair','Ornamental Repair','Wood Install','Vinyl Install','Chain Link Install','Fence Staining','Fence Removal'].map(o=>'<option '+(x.jobType===o?'selected':'')+'>'+o+'</option>').join('')+'</select></label><label>Status<select name="status">'+['New','Contacted','Estimate Scheduled','Estimate Sent','Won','Scheduled','Complete','Lost'].map(o=>'<option '+(x.status===o?'selected':'')+'>'+o+'</option>').join('')+'</select></label></div><label style="margin-top:14px">Project details / notes<textarea name="notes" rows="5" placeholder="Fence style, approximate footage, damage, staining, access, timing, etc." style="background:#0b111b;color:#fff;border:1px solid var(--line);border-radius:9px;padding:12px">'+esc(x.notes||'')+'</textarea></label><div class="row form-actions"><button type="button" class="secondary" id="cancelModal">Cancel</button><button class="primary">Save Lead</button></div></form>');$('leadForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),obj=Object.fromEntries(fd);if(existing){Object.assign(existing,obj);existing.updatedAt=new Date().toISOString()}else data.leads.unshift({id:crypto.randomUUID(),...obj,source:'Manual',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});save();closeModal();showView('leads')};$('cancelModal').onclick=closeModal}
function editLead(id){openLead(data.leads.find(x=>x.id===id))}
function createEstimateFromLead(id){const l=data.leads.find(x=>x.id===id);if(!l)return;showView('estimates');setTimeout(()=>{renderEstimateLeadOptions();$('estimateLead').value=l.id;loadLeadIntoEstimate();$('jobType').value=l.jobType||'Wood Repair';renderEstimatorFields();calcEstimate();},0)}
function openJobForLead(id){openJob(data.leads.find(x=>x.id===id))}
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
const WOOD_WALK_GATES={3:350,4:400,5:475};
function woodMaterialEstimate(){
  const lf=+$('lf').value||0,h=+$('woodHeight').value||6;
  const gateCount=+$('woodGateCount')?.value||0,gateWidth=+$('woodGateWidth')?.value||3;
  const gateCharge=gateCount*(WOOD_WALK_GATES[gateWidth]||350);
  const picket=+(data.settings.woodPicketHD??4.28),rail=+(data.settings.woodRailHD??28.51),post=+(data.settings.woodPostHD??12.98),nails=+(data.settings.woodNailsHD??21),q=+(data.settings.quikrete??6.47);
  const markup=1+(data.settings.homeDepotMarkup??50)/100;
  const postCount=Math.ceil(lf/8)+1;
  const pickets=Math.ceil((lf/(5.5/12))*1.05);
  const rails=Math.ceil(lf/8)*(h===4?2:3);
  const bags=postCount*(data.settings.bagsPerPost??2);
  const nailBoxes=Math.max(1,Math.ceil((pickets*(h===4?2:3))/740));
  const base={pickets:pickets*picket,rails:rails*rail,posts:postCount*post,nails:nailBoxes*nails,quikrete:bags*q};
  const material=Object.values(base).reduce((a,b)=>a+b,0)*markup;
  const rows=[
    ['Cedar pickets',pickets,picket*markup],
    ['Cedar 2×4 rails',rails,rail*markup],
    ['Cedar-Tone 4×4×8 posts',postCount,post*markup],
    ['Exterior galvanized nails',nailBoxes,nails*markup],
    ['Quikrete 80-lb bags',bags,q*markup]
  ];
  $('chainLinkBreakdown').innerHTML='<h3>Wood material breakdown</h3><div class="material-list">'+rows.map(r=>'<div class="row pipeline-row"><span>'+r[0]+' <small class="mutedline">× '+r[1]+'</small></span><strong>'+money(r[1]*r[2])+'</strong></div>').join('')+'</div><div class="estimate-result"><div class="muted">Home Depot material cost</div><strong>'+money(Object.values(base).reduce((a,b)=>a+b,0))+'</strong><div class="muted">Apex material price (+50%)</div><div class="estimate-price">'+money(material)+'</div><div class="mutedline">'+h+"' wood privacy · "+lf+" LF · "+postCount+" posts · "+bags+" bags of concrete</div></div>";
  return {material,base,pickets,rails,postCount,bags,nailBoxes,rows,gateCount,gateWidth,gateCharge};
}
function woodRepairEstimate(){
  const lf=+$('lf').value||0;
  const type=$('woodRepairType')?.value||'basic';
  const postCount=+$('woodRepairPosts')?.value||0;
  const rate=type==='reinstall'?(data.settings.reinstallLF??10):(data.settings.woodRepairLF??25);
  const postRate=postCount>=5?(data.settings.woodPost5??100):(data.settings.woodPost14??125);
  const service=data.settings.serviceCharge??175;
  const quote=Math.max(service,lf*rate+postCount*postRate);
  return {quote,lf,rate,postCount,postRate,service,type};
}
function calcEstimate(){
  const lf=+$('lf').value||0,hours=+$('laborHours').value||0,rate=+$('laborRate').value||0,service=+$('serviceCharge').value||0,markup=(+$('markup').value||0)/100;
  let mat=+$('materialCost')?.value||0,cl=null,wood=null,repair=null,price=0,cost=0;
  const type=$('jobType').value;
  if(type==='Chain Link Install'){cl=clMaterialEstimate();mat=cl?.material||0;cost=mat+hours*rate+service;price=cost*(1+markup)}
  else if(type==='Wood Install'){wood=woodMaterialEstimate();mat=wood.material;cost=mat+hours*rate+service;price=cost*(1+markup)+wood.gateCharge}
  else if(type==='Wood Repair'){repair=woodRepairEstimate();price=repair.quote;cost=Math.max(0,price-repair.postCount*repair.postRate);mat=repair.postCount*repair.postRate}
  else {cost=mat+hours*rate+service;price=cost*(1+markup)}
  $('estimateResult').innerHTML='<div class="muted">Customer quote</div><div class="estimate-price">'+money(price)+'</div><div class="profit">Estimated gross profit: '+money(price-cost)+'</div><div class="mutedline">'+lf+' LF · Material '+money(mat)+' · Labor '+money(hours*rate)+' · Service '+money(service)+(repair?' · '+(repair.type==='reinstall'?'Reinstall':'Basic repair')+' '+money(lf*repair.rate)+' · Posts '+repair.postCount:'')+'</div>';
  return{lf,mat,h:hours,rate,service,markup,cost,price,chainLink:cl,wood,repair};
}
function renderEstimatorFields(){
  const type=$('jobType').value,woodInstall=type==='Wood Install',woodRepair=type==='Wood Repair',chain=type==='Chain Link Install';
  $('woodGateCountLabel').style.display=woodInstall?'':'none';$('woodGateWidthLabel').style.display=woodInstall?'':'none';$('materialBreakdownTitle').textContent=chain?'Chain-link material calculator':woodInstall?'Wood material calculator':'Material calculator';
  $('clHeight').closest('label').style.display=chain?'':'none';$('clFinish').closest('label').style.display=chain?'':'none';
  $('terminalPosts').closest('label').style.display=chain?'':'none';$('singleGates').closest('label').style.display=chain?'':'none';$('doubleGates').closest('label').style.display=chain?'':'none';
  $('woodHeight').closest('label').style.display=woodInstall?'':'none';
  if($('woodRepairType'))$('woodRepairType').closest('label').style.display=woodRepair?'':'none';
  if($('woodRepairPosts'))$('woodRepairPosts').closest('label').style.display=woodRepair?'':'none';
  $('laborHours').closest('label').style.display=(woodRepair?'none':'');
  $('laborRate').closest('label').style.display=(woodRepair?'none':'');
  $('markup').closest('label').style.display=(woodRepair?'none':'');
  $('serviceCharge').value=woodRepair?(data.settings.serviceCharge??175):$('serviceCharge').value;
  if(woodRepair){$('applyRepairPreset').style.display='none'}else{$('applyRepairPreset').style.display=''}
}

['lf','terminalPosts','singleGates','doubleGates','laborHours','laborRate','serviceCharge','markup','woodHeight','woodGateCount','woodGateWidth','woodRepairType','woodRepairPosts'].forEach(id=>document.addEventListener('input',e=>{if(e.target.id===id)calcEstimate()}));document.addEventListener('change',e=>{if(['jobType','clHeight','clFinish','terminalPosts','singleGates','doubleGates','singleGateWidth','doubleGateWidth','woodHeight','woodGateCount','woodGateWidth','woodRepairType','woodRepairPosts'].includes(e.target.id)){renderEstimatorFields();calcEstimate()}});
document.addEventListener('click',e=>{const p=e.target.closest('[data-preset]');if(!p)return;const s=data.settings;if(p.dataset.preset==='post1'||p.dataset.preset==='post5'){$('jobType').value='Wood Repair';$('woodRepairType').value='basic';$('woodRepairPosts').value=p.dataset.preset==='post1'?1:5;$('lf').value=0}if(p.dataset.preset==='repair'){$('jobType').value='Wood Repair';$('woodRepairType').value='basic';$('woodRepairPosts').value=0;$('lf').value=10}if(p.dataset.preset==='reinstall'){$('jobType').value='Wood Repair';$('woodRepairType').value='reinstall';$('woodRepairPosts').value=0;$('lf').value=20}renderEstimatorFields();calcEstimate()});
$('applyRepairPreset').onclick=()=>{$('jobType').value='Wood Repair';$('serviceCharge').value=data.settings.serviceCharge;$('laborRate').value=data.settings.laborRate;$('markup').value=35;calcEstimate()};
function nextEstimateNumber(){const year=new Date().getFullYear();const used=data.estimates.map(x=>String(x.estimateNumber||'')).filter(x=>x.startsWith('AF-'+year+'-')).map(x=>parseInt(x.split('-').pop(),10)).filter(Number.isFinite);const n=(used.length?Math.max(...used):0)+1;return 'AF-'+year+'-'+String(n).padStart(4,'0')}
function getEstimateCustomer(){return {name:($('estimateCustomerName')?.value||'').trim(),phone:($('estimateCustomerPhone')?.value||'').trim(),email:($('estimateCustomerEmail')?.value||'').trim(),address:($('estimateCustomerAddress')?.value||'').trim()}}
function loadLeadIntoEstimate(){const id=$('estimateLead')?.value;if(!id)return;const l=data.leads.find(x=>x.id===id);if(!l)return;$('estimateCustomerName').value=l.name||'';$('estimateCustomerPhone').value=l.phone||'';$('estimateCustomerEmail').value=l.email||'';$('estimateCustomerAddress').value=l.address||''}
function renderEstimateLeadOptions(){$('estimateLead').innerHTML='<option value="">— Select a lead —</option>'+data.leads.map(l=>'<option value="'+esc(l.id)+'">'+esc(l.name||'Unnamed')+(l.address?' · '+esc(l.address):'')+'</option>').join('')}
function renderCustomerQuote(){const c=calcEstimate(),cust=getEstimateCustomer(),type=$('jobType').value,number=$('activeEstimateNumber').value||nextEstimateNumber();let details=type;if(type==='Wood Install'){details+=" · "+$('woodHeight').value+"' privacy";const gc=+$('woodGateCount').value||0;if(gc)details+=" · "+gc+" × "+$('woodGateWidth').value+"' walk gate";}if(type==='Chain Link Install'){details+=" · "+$('clHeight').value+"' "+($('clFinish').value==='black'?'black vinyl':'galvanized')+" · "+($('lf').value||0)+" LF";}else if(type!=='Wood Install'&&$('lf').value)details+=" · "+$('lf').value+" LF";$('customerQuoteContent').innerHTML='<div class="quote-meta"><div><span class="muted">Estimate #</span><strong>'+esc(number)+'</strong></div><div><span class="muted">Date</span><strong>'+new Date().toLocaleDateString()+'</strong></div><div><span class="muted">Prepared for</span><strong>'+esc(cust.name||'Customer')+'</strong></div><div><span class="muted">Project address</span><strong>'+esc(cust.address||'To be determined')+'</strong></div></div><div class="quote-project"><span class="muted">Project</span><strong>'+esc(details)+'</strong></div><div class="quote-total"><span>Estimated project price</span><strong>'+money(c.price)+'</strong></div><p class="muted">This estimate is based on the project details entered and is subject to final site inspection and material availability.</p><div class="quote-contact"><strong>'+esc(data.settings.businessName||'Apex Fence')+'</strong><span>'+esc(data.settings.businessEmail||'Apexinstallsne@gmail.com')+(data.settings.businessPhone?' · '+esc(data.settings.businessPhone):'')+'</span></div><div class="quote-footer">Apex Fence — Quality at its Peak</div>}
function saveCurrentEstimate(){const c=calcEstimate(),cust=getEstimateCustomer(),number=$('activeEstimateNumber').value||nextEstimateNumber();data.estimates.unshift({id:crypto.randomUUID(),estimateNumber:number,type:$('jobType').value,customer:cust,...c,createdAt:new Date().toISOString(),leadId:$('estimateLead')?.value||''});const linkedLead=$('estimateLead')?.value?data.leads.find(x=>x.id===$('estimateLead').value):null;if(linkedLead&&linkedLead.status!=='Lost'){linkedLead.status='Estimate Sent';linkedLead.updatedAt=new Date().toISOString()};$('activeEstimateNumber').value=nextEstimateNumber();save();alert('Estimate '+number+' saved.');return number}
$('saveEstimate').onclick=()=>saveCurrentEstimate();
$('openCustomerQuote').onclick=()=>{renderCustomerQuote();showView('customerQuote')};
$('saveAndQuote').onclick=()=>{saveCurrentEstimate();renderCustomerQuote();showView('customerQuote')};

$('leadSearch').oninput=renderLeads;$('leadFilter').onchange=renderLeads;
$('saveSettings').onclick=()=>{data.settings={...data.settings,businessName:$('businessName').value.trim(),businessEmail:$('businessEmail').value.trim(),businessPhone:$('businessPhone').value.trim(),laborRate:+$('defaultLaborRate').value,serviceCharge:+$('defaultServiceCharge').value,materialMarkup:+$('materialMarkup').value,homeDepotMarkup:+$('homeDepotMarkup').value,woodPost14:+$('woodPost14').value,woodPost5:+$('woodPost5').value,quikrete:+$('quikrete').value,bagsPerPost:+$('bagsPerPost').value,woodRepairLF:+$('woodRepairLF').value,reinstallLF:+$('reinstallLF').value,woodPicketHD:+$('woodPicketHD').value,woodRailHD:+$('woodRailHD').value,woodPostHD:+$('woodPostHD').value,woodNailsHD:+$('woodNailsHD').value};save();alert('Pricing settings saved.')};
function renderJobs(){$('jobList').innerHTML=data.jobs.length?data.jobs.sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(jobHTML).join(''):'<div class="card"><p class="muted">No jobs scheduled.</p></div>'}
function renderSettings(){const s=data.settings;if($('businessName'))$('businessName').value=s.businessName||'Apex Fence';if($('businessEmail'))$('businessEmail').value=s.businessEmail||'Apexinstallsne@gmail.com';if($('businessPhone'))$('businessPhone').value=s.businessPhone||'';if($('woodHeight'))$('woodHeight').value=s.woodHeight??6;[['defaultLaborRate',s.laborRate],['defaultServiceCharge',s.serviceCharge],['materialMarkup',s.materialMarkup??25],['homeDepotMarkup',s.homeDepotMarkup??50],['woodPost14',s.woodPost14],['woodPost5',s.woodPost5],['woodPicketHD',s.woodPicketHD??4.28],['woodRailHD',s.woodRailHD??28.51],['woodPostHD',s.woodPostHD??12.98],['woodNailsHD',s.woodNailsHD??21],['quikrete',s.quikrete??10],['bagsPerPost',s.bagsPerPost],['woodRepairLF',s.woodRepairLF],['reinstallLF',s.reinstallLF]].forEach(([id,v])=>$(id).value=v)}
function renderAll(){renderDashboard();renderLeads();renderJobs();renderSettings();if($('estimateLead'))renderEstimateLeadOptions();calcEstimate()}$('closeModal').onclick=closeModal;$('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
$('exportData').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='apex-fence-crm-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('importData').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();alert('Backup imported.')}catch{alert('Invalid backup file.')}};r.readAsText(f)};
$('resetData').onclick=()=>{if(confirm('Delete all CRM data from this browser? Export a backup first if needed.')){data=structuredClone(defaultData);save()}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}};
renderAll();if($('activeEstimateNumber'))$('activeEstimateNumber').value=nextEstimateNumber();renderEstimatorFields();
$('jobType').addEventListener('change',()=>{const cl=$('jobType').value==='Chain Link Install';document.querySelectorAll('#clHeight,#clFinish,#terminalPosts,#singleGates,#singleGateWidth,#doubleGates,#doubleGateWidth').forEach(x=>x.disabled=!cl);renderEstimatorFields();calcEstimate()});