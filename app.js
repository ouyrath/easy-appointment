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

function renderOptions(){
 const ll=document.getElementById('locationList');
 ll.innerHTML=locations.map((x,i)=>`<div class="option" data-location="${i}"><strong>${x.name}</strong><small>${x.address}</small></div>`).join('');
 const sl=document.getElementById('serviceList');
 sl.innerHTML=services.map((x,i)=>`<div class="option" data-service="${i}"><strong>${x.name}</strong><small>${x.detail}</small></div>`).join('');
 const tl=document.getElementById('timeList');
 tl.innerHTML=times.map(t=>`<button type="button" class="time" data-time="${t}">${t}</button>`).join('');
}
renderOptions();

document.addEventListener('click',e=>{
 const loc=e.target.closest('[data-location]');
 if(loc){selection.location=locations[+loc.dataset.location];document.querySelectorAll('[data-location]').forEach(x=>x.classList.remove('selected'));loc.classList.add('selected')}
 const ser=e.target.closest('[data-service]');
 if(ser){selection.service=services[+ser.dataset.service];document.querySelectorAll('[data-service]').forEach(x=>x.classList.remove('selected'));ser.classList.add('selected')}
 const tm=e.target.closest('[data-time]');
 if(tm){selection.time=tm.dataset.time;document.querySelectorAll('[data-time]').forEach(x=>x.classList.remove('selected'));tm.classList.add('selected')}
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
const today=new Date();
dateInput.min=today.toISOString().split('T')[0];

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

document.getElementById('apptForm').addEventListener('submit',e=>{
 e.preventDefault();
 const firstName=document.getElementById('firstName').value.trim();
 const lastName=document.getElementById('lastName').value.trim();
 const phone=document.getElementById('phone').value.trim();
 const email=document.getElementById('email').value.trim();
 if(!firstName||!lastName||!phone||!email||!document.getElementById('consent').checked) return alert('Please complete all required fields.');
 const code='EA-'+Math.random().toString(36).slice(2,8).toUpperCase();
 const appt={code,firstName,lastName,phone,email,date:dateInput.value,...selection,createdAt:new Date().toISOString()};
 localStorage.setItem('easyAppointment_'+code,JSON.stringify(appt));
 document.getElementById('apptForm').classList.add('hidden');
 document.querySelector('.progress').classList.add('hidden');
 document.getElementById('confirmation').classList.remove('hidden');
 document.getElementById('confirmationText').innerHTML=`Confirmation <strong>${code}</strong><br>${selection.location.name}<br>${dateInput.value} at ${selection.time}`;
});

document.getElementById('newBooking').addEventListener('click',()=>location.reload());

document.getElementById('lookupBtn').addEventListener('click',()=>{
 const code=document.getElementById('manageCode').value.trim().toUpperCase();
 const data=localStorage.getItem('easyAppointment_'+code);
 const msg=document.getElementById('lookupMessage');
 if(!data){msg.textContent='Appointment not found on this device.';return;}
 const a=JSON.parse(data);
 msg.textContent=`${a.firstName} ${a.lastName} — ${a.location.name} — ${a.date} at ${a.time}`;
});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
