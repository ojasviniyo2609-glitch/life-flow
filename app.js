const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEY_USERS = "lifeflow_users_v1";
const KEY_SESSION = "lifeflow_session_v1";
let authMode = "login";
let currentUser = null;
let state = null;

function users(){ return JSON.parse(localStorage.getItem(KEY_USERS)||"{}"); }
function saveUsers(u){ localStorage.setItem(KEY_USERS, JSON.stringify(u)); }
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function blankState(){
  return {
    tasks: [
      {id:uid(), title:"Plan today's priorities", done:true, category:"Personal"},
      {id:uid(), title:"30 minute workout", done:false, category:"Health"},
      {id:uid(), title:"Review study notes", done:false, category:"Study"}
    ],
    reminders:[],
    transactions:[],
    water:0, waterGoal:2500,
    sleep:7.5, meals:[], exercises:[],
    notes:[],
    schedule:[],
    notifications:[
      {id:uid(), text:"Welcome to LifeFlow!", read:false, time:new Date().toISOString()}
    ]
  };
}
function saveState(){
  if(!currentUser) return;
  const u=users(); u[currentUser.email].state=state; saveUsers(u);
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function dateTime(v){return new Date(v).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}
function greeting(){let h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"}

function showAuth(mode="login"){
  authMode=mode; $("#authView").classList.remove("hidden"); $("#appView").classList.add("hidden");
  $("#authName").style.display=mode==="signup"?"block":"none";
  $("#authSubmit").textContent=mode==="signup"?"Create account":"Login";
  $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.auth===mode));
}
function enterApp(){
  $("#authView").classList.add("hidden"); $("#appView").classList.remove("hidden");
  $("#profileName").textContent=currentUser.name; $("#profileEmail").textContent=currentUser.email;
  $("#avatar").textContent=(currentUser.name||currentUser.email)[0].toUpperCase();
  render("dashboard");
}
$("#authForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#authEmail").value.trim().toLowerCase(), password=$("#authPassword").value;
  const name=$("#authName").value.trim();
  const u=users();
  if(authMode==="signup"){
    if(u[email]) return toast("Account already exists");
    u[email]={email,password,name:name||"User",state:blankState()};
    saveUsers(u); currentUser=u[email]; localStorage.setItem(KEY_SESSION,email); state=currentUser.state; toast("Account created"); enterApp();
  }else{
    if(!u[email] || u[email].password!==password) return toast("Invalid email or password");
    currentUser=u[email]; state=currentUser.state||blankState(); localStorage.setItem(KEY_SESSION,email); enterApp();
  }
});
$$(".tab").forEach(b=>b.addEventListener("click",()=>showAuth(b.dataset.auth)));
$("#logoutBtn").addEventListener("click",()=>{localStorage.removeItem(KEY_SESSION);currentUser=null;showAuth()});

function render(section){
  $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.section===section));
  const titles={dashboard:"Dashboard",tasks:"My Tasks",reminders:"Reminders",progress:"Progress tracking",finance:"Income / Expenses / Savings",water:"Water tracking",wellness:"Sleep / Meals / Exercise",notes:"Personal Notes",schedule:"Daily schedule",notifications:"Notifications",settings:"Settings"};
  $("#pageTitle").textContent=section==="dashboard"?greeting():titles[section];
  $("#notifDot").style.display=state.notifications.some(n=>!n.read)?"block":"none";
  const views={dashboard:viewDashboard,tasks:viewTasks,reminders:viewReminders,progress:viewProgress,finance:viewFinance,water:viewWater,wellness:viewWellness,notes:viewNotes,schedule:viewSchedule,notifications:viewNotifications,settings:viewSettings};
  $("#content").innerHTML=views[section]();
  bindView(section);
}
$("#nav").addEventListener("click",e=>{const b=e.target.closest("[data-section]");if(b)render(b.dataset.section)});
$(".icon-btn").addEventListener("click",()=>render("notifications"));

function viewDashboard(){
  const done=state.tasks.filter(t=>t.done).length, total=state.tasks.length||1, pct=Math.round(done/total*100);
  const income=state.transactions.filter(x=>x.type==="income").reduce((a,x)=>a+Number(x.amount),0);
  const expense=state.transactions.filter(x=>x.type==="expense").reduce((a,x)=>a+Number(x.amount),0);
  const unread=state.notifications.filter(n=>!n.read).length;
  return `<div class="hero"><div class="eyebrow">LIFEFLOW</div><h1>Welcome back, ${esc(currentUser.name)} 👋</h1><p>Keep your tasks, health, schedule and money moving in one place.</p><div class="hero-actions"><button class="secondary" data-go="tasks">Add a task</button><button class="secondary" data-go="finance">Track money</button></div></div>
  <div class="grid grid-4">
    ${statCard("✅","Tasks",`${done}/${total}`,`${pct}% completed`)}
    ${statCard("💧","Water",`${(state.water/1000).toFixed(1)} L`,`${state.waterGoal/1000} L goal`)}
    ${statCard("💰","Balance",money(income-expense),"income minus expenses")}
    ${statCard("🔔","Alerts",unread,"unread notifications")}
  </div>
  <div class="grid grid-2" style="margin-top:18px">
    <div class="card"><div class="card-head"><h3>Today's tasks</h3><button class="secondary" data-go="tasks">View all</button></div>
      <div class="list">${state.tasks.slice(0,5).map(taskRow).join("")||empty("No tasks yet.")}</div>
    </div>
    <div class="card"><div class="card-head"><h3>Daily health</h3><button class="secondary" data-go="wellness">Open wellness</button></div>
      <div class="quick-grid">
        <button class="quick" data-go="water">💧<b>${(state.water/1000).toFixed(1)} L</b><small>water</small></button>
        <button class="quick" data-go="wellness">😴<b>${state.sleep} h</b><small>sleep</small></button>
        <button class="quick" data-go="wellness">🍱<b>${state.meals.length}</b><small>meals</small></button>
        <button class="quick" data-go="wellness">🏃<b>${state.exercises.length}</b><small>exercises</small></button>
      </div>
    </div>
  </div>`;
}
function statCard(icon,label,val,sub){return `<div class="card"><div class="metric-top"><div class="metric-icon">${icon}</div><span class="pill">${label}</span></div><div class="stat">${val}</div><div class="stat-label">${sub}</div></div>`}
function empty(x){return `<div class="empty">${x}</div>`}
function taskRow(t){return `<div class="list-row"><div class="row-left"><button class="check ${t.done?"done":""}" data-task="${t.id}">${t.done?"✓":""}</button><span class="${t.done?"completed":""}">${esc(t.title)}</span></div><span class="tag">${esc(t.category||"General")}</span></div>`}

function viewTasks(){return `<div class="section-title"><h1>My Tasks</h1><div class="actions"><button class="primary" id="addTask">+ Add task</button></div></div><div class="grid grid-3">${["All","Today","Completed"].map((x,i)=>`<div class="card"><div class="card-head"><h3>${x}</h3><span class="pill">${i===0?state.tasks.length:i===1?state.tasks.filter(t=>!t.done).length:state.tasks.filter(t=>t.done).length}</span></div>${(i===0?state.tasks:i===1?state.tasks.filter(t=>!t.done):state.tasks.filter(t=>t.done)).map(taskRow).join("")||empty("Nothing here.")}</div>`).join("")}</div>`}
function viewReminders(){return `<div class="section-title"><h1>Reminders</h1><button class="primary" id="addReminder">+ Add reminder</button></div><div class="card"><div class="list">${state.reminders.map(r=>`<div class="list-row"><div><strong>${esc(r.title)}</strong><div class="stat-label">${dateTime(r.when)}</div></div><button class="danger" data-del-rem="${r.id}">Delete</button></div>`).join("")||empty("No reminders. Add one for something you don't want to forget.")}</div></div>`}
function viewProgress(){
  const done=state.tasks.filter(t=>t.done).length,total=state.tasks.length||1,p=Math.round(done/total*100);
  const weekly=[40,65,35,80,55,90,p||20];
  return `<div class="section-title"><h1>Progress tracking</h1></div><div class="grid grid-3">
    <div class="card"><h3>Task completion</h3><div class="ring" style="--pct:${p}%" data-label="${p}%"></div><p class="muted" style="text-align:center">Keep building consistent days.</p></div>
    <div class="card"><h3>Weekly activity</h3><div class="chart">${weekly.map(x=>`<i class="bar" style="height:${x}%"></i>`).join("")}</div><div class="chart-labels">${["M","T","W","T","F","S","S"].map(x=>`<span>${x}</span>`).join("")}</div></div>
    <div class="card"><h3>Life areas</h3>${areaBar("Tasks",p)}${areaBar("Water",Math.min(100,state.water/state.waterGoal*100))}${areaBar("Sleep",Math.min(100,state.sleep/8*100))}${areaBar("Exercise",Math.min(100,state.exercises.length/5*100))}</div>
  </div>`;
}
function areaBar(name,p){return `<div style="margin:18px 0"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>${name}</span><b>${Math.round(p)}%</b></div><div class="progressbar"><i style="width:${Math.min(100,p)}%"></i></div></div>`}
function viewFinance(){
  const income=state.transactions.filter(x=>x.type==="income").reduce((a,x)=>a+Number(x.amount),0),expense=state.transactions.filter(x=>x.type==="expense").reduce((a,x)=>a+Number(x.amount),0);
  return `<div class="section-title"><h1>Money</h1><button class="primary" id="addTxn">+ Add transaction</button></div>
  <div class="grid grid-3">${statCard("📈","Income",money(income),"total income")}${statCard("📉","Expenses",money(expense),"total spending")}${statCard("💰","Savings",money(income-expense),"current balance")}</div>
  <div class="card" style="margin-top:18px"><div class="card-head"><h3>Spending analysis</h3><span class="pill">All time</span></div>
  <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th></th></tr></thead><tbody>${state.transactions.map(t=>`<tr><td>${new Date(t.date).toLocaleDateString()}</td><td>${esc(t.desc)}</td><td>${esc(t.category)}</td><td>${t.type}</td><td>${money(t.amount)}</td><td><button class="danger" data-del-txn="${t.id}">Delete</button></td></tr>`).join("")||`<tr><td colspan="6">${empty("No transactions yet.")}</td></tr>`}</tbody></table></div>`;
}
function viewWater(){const pct=Math.min(100,state.water/state.waterGoal*100);return `<div class="section-title"><h1>Water tracking</h1><div class="actions"><button class="secondary" id="setWaterGoal">Goal: ${(state.waterGoal/1000).toFixed(1)} L</button><button class="primary" data-water="250">+250 ml</button><button class="primary" data-water="500">+500 ml</button></div></div><div class="grid grid-2"><div class="card"><h3>Today's hydration</h3><div class="ring" style="--pct:${pct}%" data-label="${Math.round(pct)}%"></div><h2 style="text-align:center">${(state.water/1000).toFixed(2)} L</h2><p class="muted" style="text-align:center">of ${(state.waterGoal/1000).toFixed(1)} L goal</p></div><div class="card"><h3>Quick tracking</h3><p class="muted">Tap an amount whenever you drink water.</p><div class="quick-grid"><button class="quick" data-water="150">🥤<b>150 ml</b></button><button class="quick" data-water="250">💧<b>250 ml</b></button><button class="quick" data-water="500">🧴<b>500 ml</b></button><button class="quick" data-water="-250">↩️<b>Undo 250</b></button></div></div></div>`}
function viewWellness(){return `<div class="section-title"><h1>Wellness</h1></div><div class="grid grid-3">
  <div class="card"><div class="card-head"><h3>😴 Sleep</h3><button class="secondary" id="sleepEdit">Edit</button></div><div class="stat">${state.sleep} h</div><div class="stat-label">target: 8 h</div>${areaBar("Sleep quality",Math.min(100,state.sleep/8*100))}</div>
  <div class="card"><div class="card-head"><h3>🍱 Meals</h3><button class="secondary" id="addMeal">+ Add</button></div>${state.meals.map(m=>`<div class="list-row"><span>${esc(m.name)}</span><span class="tag">${esc(m.type)}</span></div>`).join("")||empty("No meals logged.")}</div>
  <div class="card"><div class="card-head"><h3>🏃 Exercise</h3><button class="secondary" id="addExercise">+ Add</button></div>${state.exercises.map(x=>`<div class="list-row"><span>${esc(x.name)}</span><span class="tag">${x.minutes} min</span></div>`).join("")||empty("No exercise logged.")}</div>
</div>`}
function viewNotes(){return `<div class="section-title"><h1>Personal Notes</h1><button class="primary" id="addNote">+ New note</button></div><div class="grid grid-3">${state.notes.map(n=>`<div class="card"><div class="card-head"><h3>${esc(n.title)}</h3><button class="danger" data-del-note="${n.id}">Delete</button></div><p style="white-space:pre-wrap">${esc(n.body)}</p><small class="muted">${dateTime(n.date)}</small></div>`).join("")||empty("No notes yet.")}</div>`}
function viewSchedule(){return `<div class="section-title"><h1>Daily schedule</h1><button class="primary" id="addSchedule">+ Add event</button></div><div class="card"><div class="list">${state.schedule.sort((a,b)=>a.time.localeCompare(b.time)).map(s=>`<div class="list-row"><div><strong>${esc(s.time)} — ${esc(s.title)}</strong><div class="stat-label">${esc(s.detail||"")}</div></div><button class="danger" data-del-schedule="${s.id}">Delete</button></div>`).join("")||empty("Your day is open. Add a schedule item.")}</div></div>`}
function viewNotifications(){return `<div class="section-title"><h1>Notifications</h1><button class="secondary" id="readAll">Mark all read</button></div><div class="card"><div class="list">${state.notifications.map(n=>`<div class="list-row"><div><strong>${esc(n.text)}</strong><div class="stat-label">${dateTime(n.time)}</div></div><span class="pill">${n.read?"Read":"New"}</span></div>`).join("")||empty("No notifications.")}</div></div>`}
function viewSettings(){return `<div class="section-title"><h1>Settings</h1></div><div class="grid grid-2"><div class="card"><h3>Profile</h3><div class="form-grid"><div class="wide"><label>Name</label><input id="setName" value="${esc(currentUser.name)}"></div><div class="wide"><label>Email</label><input value="${esc(currentUser.email)}" disabled></div></div><button class="primary" id="saveProfile">Save profile</button></div><div class="card"><h3>Data & prototype</h3><p class="muted">Each account has its own data in browser local storage. This prototype can later be connected to Firebase, Supabase, or another backend for real multi-device accounts and actual push notifications.</p><button class="secondary" id="seedDemo">Restore demo data</button></div></div>`}

function modal(title,body,onSave){
  const wrap=document.createElement("div");wrap.className="modal";wrap.innerHTML=`<div class="modal-card"><div class="modal-head"><h3>${title}</h3><button class="close">×</button></div>${body}<div class="actions" style="justify-content:flex-end;margin-top:18px"><button class="secondary close">Cancel</button><button class="primary" id="modalSave">Save</button></div></div>`;
  document.body.appendChild(wrap);wrap.querySelectorAll(".close").forEach(b=>b.onclick=()=>wrap.remove());wrap.querySelector("#modalSave").onclick=()=>{if(onSave(wrap))wrap.remove()};
}
function bindView(section){
  $$("[data-go]").forEach(b=>b.onclick=()=>render(b.dataset.go));
  $$("[data-task]").forEach(b=>b.onclick=()=>{let t=state.tasks.find(x=>x.id===b.dataset.task);t.done=!t.done;saveState();render(section)});
  $$("[data-water]").forEach(b=>b.onclick=()=>{state.water=Math.max(0,state.water+Number(b.dataset.water));saveState();render("water"); if(state.water>=state.waterGoal) addNotif("Hydration goal reached 💧")});
  $$("[data-del-rem]").forEach(b=>b.onclick=()=>{state.reminders=state.reminders.filter(x=>x.id!==b.dataset.delRem);saveState();render("reminders")});
  $$("[data-del-txn]").forEach(b=>b.onclick=()=>{state.transactions=state.transactions.filter(x=>x.id!==b.dataset.delTxn);saveState();render("finance")});
  $$("[data-del-note]").forEach(b=>b.onclick=()=>{state.notes=state.notes.filter(x=>x.id!==b.dataset.delNote);saveState();render("notes")});
  $$("[data-del-schedule]").forEach(b=>b.onclick=()=>{state.schedule=state.schedule.filter(x=>x.id!==b.dataset.delSchedule);saveState();render("schedule")});
  if($("#addTask"))$("#addTask").onclick=()=>modal("Add task",`<label>Task</label><input id="mTitle" placeholder="e.g. Finish assignment"><label>Category</label><input id="mCat" value="Personal">`,w=>{let title=w.querySelector("#mTitle").value.trim();if(!title)return false;state.tasks.push({id:uid(),title,category:w.querySelector("#mCat").value.trim()||"General",done:false});saveState();render("tasks");return true});
  if($("#addReminder"))$("#addReminder").onclick=()=>modal("Add reminder",`<label>Reminder</label><input id="mTitle" placeholder="What should I remember?"><label>Date & time</label><input id="mWhen" type="datetime-local">`,w=>{let title=w.querySelector("#mTitle").value.trim();if(!title)return false;state.reminders.push({id:uid(),title,when:w.querySelector("#mWhen").value||new Date().toISOString()});addNotif("Reminder added: "+title);saveState();render("reminders");return true});
  if($("#addTxn"))$("#addTxn").onclick=()=>modal("Add transaction",`<div class="form-grid"><div><label>Description</label><input id="mDesc" placeholder="Salary / Food / Travel"></div><div><label>Amount</label><input id="mAmt" type="number" min="0" placeholder="0"></div><div><label>Type</label><select id="mType"><option value="expense">Expense</option><option value="income">Income</option></select></div><div><label>Category</label><input id="mCat" value="General"></div></div>`,w=>{let d=w.querySelector("#mDesc").value.trim(),a=Number(w.querySelector("#mAmt").value);if(!d||!a)return false;state.transactions.push({id:uid(),desc:d,amount:a,type:w.querySelector("#mType").value,category:w.querySelector("#mCat").value,date:new Date().toISOString()});saveState();render("finance");return true});
  if($("#setWaterGoal"))$("#setWaterGoal").onclick=()=>modal("Water goal",`<label>Daily goal (ml)</label><input id="mGoal" type="number" value="${state.waterGoal}" min="500" step="100">`,w=>{let g=Number(w.querySelector("#mGoal").value);if(!g)return false;state.waterGoal=g;saveState();render("water");return true});
  if($("#sleepEdit"))$("#sleepEdit").onclick=()=>modal("Sleep",`<label>Hours slept</label><input id="mSleep" type="number" step=".5" min="0" max="24" value="${state.sleep}">`,w=>{state.sleep=Number(w.querySelector("#mSleep").value);saveState();render("wellness");return true});
  if($("#addMeal"))$("#addMeal").onclick=()=>modal("Add meal",`<label>Meal</label><input id="mName" placeholder="Breakfast"><label>Type</label><select id="mType"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select>`,w=>{state.meals.push({id:uid(),name:w.querySelector("#mName").value||"Meal",type:w.querySelector("#mType").value});saveState();render("wellness");return true});
  if($("#addExercise"))$("#addExercise").onclick=()=>modal("Add exercise",`<label>Exercise</label><input id="mName" placeholder="Walking"><label>Minutes</label><input id="mMin" type="number" value="30">`,w=>{state.exercises.push({id:uid(),name:w.querySelector("#mName").value||"Exercise",minutes:Number(w.querySelector("#mMin").value)||0});saveState();render("wellness");return true});
  if($("#addNote"))$("#addNote").onclick=()=>modal("New note",`<label>Title</label><input id="mTitle" placeholder="Note title"><label>Note</label><textarea id="mBody" rows="7" placeholder="Write your thoughts..."></textarea>`,w=>{let title=w.querySelector("#mTitle").value.trim(),body=w.querySelector("#mBody").value.trim();if(!title||!body)return false;state.notes.unshift({id:uid(),title,body,date:new Date().toISOString()});saveState();render("notes");return true});
  if($("#addSchedule"))$("#addSchedule").onclick=()=>modal("Schedule item",`<label>Time</label><input id="mTime" type="time"><label>Title</label><input id="mTitle" placeholder="Class / work / football"><label>Details</label><input id="mDetail" placeholder="Optional">`,w=>{let title=w.querySelector("#mTitle").value.trim();if(!title)return false;state.schedule.push({id:uid(),time:w.querySelector("#mTime").value||"09:00",title,detail:w.querySelector("#mDetail").value});saveState();render("schedule");return true});
  if($("#readAll"))$("#readAll").onclick=()=>{state.notifications.forEach(n=>n.read=true);saveState();render("notifications")};
  if($("#saveProfile"))$("#saveProfile").onclick=()=>{currentUser.name=$("#setName").value.trim()||"User";const u=users();u[currentUser.email].name=currentUser.name;u[currentUser.email].state=state;saveUsers(u);saveState();$("#profileName").textContent=currentUser.name;$("#avatar").textContent=currentUser.name[0].toUpperCase();toast("Profile saved")};
  if($("#seedDemo"))$("#seedDemo").onclick=()=>{state=blankState();saveState();toast("Demo data restored");render("dashboard")};
}
function addNotif(text){state.notifications.unshift({id:uid(),text,read:false,time:new Date().toISOString()});}
function checkReminders(){
  const now=Date.now();
  state.reminders.forEach(r=>{if(!r.fired && new Date(r.when).getTime()<=now){r.fired=true;addNotif("Reminder: "+r.title);toast("Reminder: "+r.title);}});
  saveState();
}
(function init(){
  const email=localStorage.getItem(KEY_SESSION),u=users();
  if(email&&u[email]){currentUser=u[email];state=currentUser.state||blankState();enterApp();checkReminders();setInterval(checkReminders,30000)}
  else showAuth("login");
})();
