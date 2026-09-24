const API_URL='https://cnhnwwnvnqovgorrtkca.supabase.co/functions/v1/appointments';

const locations=[
 {name:'Fresno Appointment Center',address:'Fresno, TX 77545'},
 {name:'Pearland Appointment Center',address:'Pearland, TX 77584'},
 {name:'Sugar Land Appointment Center',address:'Sugar Land, TX 77479'}
];
const services=[
 {name:'Routine Lab / General Appointment',detail:'Standard appointment'},
 {name:'Employment / Screening',detail:'Work-related visit'},
 {name:'Wellness Visit',detail:'General wellness appointment'},
 {name:'Other',detail:'Choose this if your service is not listed'}
];
const times=['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM'];

let step=1, selection={location:null,service:null,time:null};
let managedAppointment=null, newTime=null;

function localDateString(d=new Date()){
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function formatDbTime(v){
 if(!v) return '';
 const [hh,mm]=v.split(':').map(Number);
 const ap=hh>=12?'PM':'AM';
 const h=hh%12||12;
 return `${h}:${String(mm).padStart(2,'0')} ${ap}`;
}
async function api(payload){
 const res=await fetch(API_URL,{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify(payload)
 });
 let data={};
 try{data=await res.json()}catch{}
 if(!res.ok) throw new Error(data.error||'Something went wrong. Please try again.');
 return data;
}
function renderOptions(){
 const ll=document.getElementById('locationList');
 ll.innerHTML=locations.map((x,i)=>`<div class="option" data-location="${i}"><strong>${x.name}</strong><small>${x.address}</small></div>`).join('');
 const sl=document.getElementById('serviceList');
 sl.innerHTML=services.map((x,i)=>`<div class="option" data-service="${i}"><strong>${x.name}</strong><small>${x.detail}</small></div>`).join('');
 document.getElementById('timeList').innerHTML=times.map(t=>`<button type="button" class="time" data-time="${t}">${t}</button>`).join('');
 document.getElementById('newTimeList').innerHTML=times.map(t=>`<button type="button" class="time" data-new-time="${t}">${t}</button>`).join('');
}
renderOptions();

document.addEventListener('click',e=>{
 const loc=e.target.closest('[data-location]');
 if(loc){selection.location=locations[+loc.dataset.location];document.querySelectorAll('[data-location]').forEach(x=>x.classList.remove('selected'));loc.classList.add('selected')}
 const ser=e.target.closest('[data-service]');
 if(ser){selection.service=services[+ser.dataset.service];document.querySelectorAll('[data-service]').forEach(x=>x.classList.remove('selected'));ser.classList.add('selected')}
 const tm=e.target.closest('[data-time]');
 if(tm){selection.time=tm.dataset.time;document.querySelectorAll('[data-time]').forEach(x=>x.classList.remove('selected'));tm.classList.add('selected')}
 const nt=e.target.closest('[data-new-time]');
 if(nt){newTime=nt.dataset.newTime;document.querySelectorAll('[data-new-time]').forEach(x=>x.classList.remove('selected'));nt.classList.add('selected')}
 if(e.target.classList.contains('next')) nextStep();
 if(e.target.classList.contains('back')) showStep(step-1);
});

document.getElementById('locationSearch').addEventListener('input',e=>{
 const q=e.target.value.toLowerCase();
 document.querySelectorAll('[data-location]').forEach((el,i)=>{
  const s=(locations[i].name+' '+locations[i].address).toLowerCase();
  el.style.display=s.includes(q)?'block':'none';
 });
});

const dateInput=document.getElementById('date');
const newDate=document.getElementById('newDate');
dateInput.min=localDateString();
newDate.min=localDateString();

function nextStep(){
 if(step===1 && !selection.location) return alert('Please choose a location.');
 if(step===2 && !selection.service) return alert('Please choose a service.');
 if(step===3 && (!dateInput.value || !selection.time)) return alert('Please choose a date and time.');
 showStep(Math.min(4,step+1));
}
function showStep(n){
 step=n;
 document.querySelectorAll('.step').forEach(s=>s.classList.toggle('active',+s.dataset.step===step));
 document.querySelectorAll('[data-step-dot]').forEach(d=>d.classList.toggle('active',+d.dataset.stepDot<=step));
 window.scrollTo({top:0,behavior:'smooth'});
}

document.getElementById('apptForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const firstName=document.getElementById('firstName').value.trim();
 const lastName=document.getElementById('lastName').value.trim();
 const phone=document.getElementById('phone').value.trim();
 const email=document.getElementById('email').value.trim();
 const msg=document.getElementById('formMessage');
 const btn=document.getElementById('bookBtn');
 msg.textContent='';
 if(!firstName||!lastName||!phone||!email||!document.getElementById('consent').checked){
  msg.textContent='Please complete all required fields.';
  return;
 }
 btn.disabled=true;btn.textContent='Booking...';
 try{
  const data=await api({
   action:'book',
   location_name:selection.location.name,
   service_name:selection.service.name,
   appointment_date:dateInput.value,
   appointment_time:selection.time,
   first_name:firstName,last_name:lastName,phone,email
  });
  const a=data.appointment;
  document.getElementById('apptForm').classList.add('hidden');
  document.querySelector('.progress').classList.add('hidden');
  document.getElementById('confirmation').classList.remove('hidden');
  const emailNote=data.confirmation_email_sent
   ? '<br><span class="email-success">Confirmation email sent.</span>'
   : '<br><span class="email-note">Appointment saved. Email confirmation is not configured yet.</span>';
  document.getElementById('confirmationText').innerHTML=
   `Confirmation <strong>${a.confirmation_code}</strong><br>${a.location_name}<br>${a.appointment_date} at ${formatDbTime(a.appointment_time)}${emailNote}`;
 }catch(err){
  msg.textContent=err.message;
 }finally{
  btn.disabled=false;btn.textContent='Book appointment';
 }
});

document.getElementById('newBooking').addEventListener('click',()=>location.reload());

async function lookupAppointment(){
 const code=document.getElementById('manageCode').value.trim().toUpperCase();
 const email=document.getElementById('manageEmail').value.trim();
 const msg=document.getElementById('lookupMessage');
 const result=document.getElementById('manageResult');
 msg.textContent='Looking up appointment...';
 result.classList.add('hidden');
 try{
  const data=await api({action:'lookup',confirmation_code:code,email});
  managedAppointment=data.appointment;
  document.getElementById('manageDetails').innerHTML=
   `<strong>${managedAppointment.first_name} ${managedAppointment.last_name}</strong><br>
    ${managedAppointment.location_name}<br>
    ${managedAppointment.service_name}<br>
    ${managedAppointment.appointment_date} at ${formatDbTime(managedAppointment.appointment_time)}<br>
    Status: <strong>${managedAppointment.status}</strong>`;
  msg.textContent='';
  result.classList.remove('hidden');
  document.getElementById('reschedulePanel').classList.add('hidden');
  const active=managedAppointment.status==='booked';
  document.getElementById('showRescheduleBtn').disabled=!active;
  document.getElementById('cancelBtn').disabled=!active;
 }catch(err){
  managedAppointment=null;
  msg.textContent=err.message;
 }
}
document.getElementById('lookupBtn').addEventListener('click',lookupAppointment);

document.getElementById('showRescheduleBtn').addEventListener('click',()=>{
 document.getElementById('reschedulePanel').classList.toggle('hidden');
 document.getElementById('manageMessage').textContent='';
});

document.getElementById('cancelBtn').addEventListener('click',async()=>{
 if(!managedAppointment) return;
 if(!confirm('Cancel this appointment?')) return;
 const btn=document.getElementById('cancelBtn');
 btn.disabled=true;btn.textContent='Cancelling...';
 try{
  await api({
   action:'cancel',
   confirmation_code:document.getElementById('manageCode').value.trim().toUpperCase(),
   email:document.getElementById('manageEmail').value.trim()
  });
  await lookupAppointment();
 }catch(err){
  document.getElementById('lookupMessage').textContent=err.message;
 }finally{
  btn.textContent='Cancel appointment';
 }
});

document.getElementById('rescheduleBtn').addEventListener('click',async()=>{
 const msg=document.getElementById('manageMessage');
 if(!managedAppointment||!newDate.value||!newTime){msg.textContent='Choose a new date and time.';return}
 const btn=document.getElementById('rescheduleBtn');
 btn.disabled=true;btn.textContent='Saving...';msg.textContent='';
 try{
  await api({
   action:'reschedule',
   confirmation_code:document.getElementById('manageCode').value.trim().toUpperCase(),
   email:document.getElementById('manageEmail').value.trim(),
   appointment_date:newDate.value,
   appointment_time:newTime
  });
  await lookupAppointment();
  document.getElementById('lookupMessage').textContent='Appointment updated successfully.';
 }catch(err){
  msg.textContent=err.message;
 }finally{
  btn.disabled=false;btn.textContent='Save new date/time';
 }
});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
