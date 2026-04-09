(function(){
  const STORAGE_KEY = 'studentActivities_v2';
  const app = document.getElementById('app');
  const listEl = document.getElementById('activity-list');
  const template = document.getElementById('item-template');
  const badge = document.getElementById('total-badge');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const toastUndo = document.getElementById('toast-undo');

  let activities = [];
  let lastSnapshot = null; // for undo
  let filter = 'all';
  let searchTerm = '';

  // Default activities
  const defaultActivities = [
    {id:1,name:'Learn HTML Basics',desc:'Tags, elements and semantics',completed:false},
    {id:2,name:'Practice CSS',desc:'Selectors, Flexbox and Grid',completed:false},
    {id:3,name:'JavaScript Fundamentals',desc:'Variables, loops, functions',completed:false},
    {id:4,name:'Build Mini Project',desc:'Combine HTML/CSS/JS',completed:false},
    {id:5,name:'Responsive Design',desc:'Media queries and breakpoints',completed:false}
  ];

  // Load
  function load(){
    const raw = localStorage.getItem(STORAGE_KEY);
    activities = raw ? JSON.parse(raw) : defaultActivities.slice();
    render();
  }

  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }

  // Utilities
  function uid(){return Date.now()+Math.floor(Math.random()*1000)}

  function snapshot(){ lastSnapshot = JSON.parse(JSON.stringify(activities)); }
  function restoreSnapshot(){ if(lastSnapshot){ activities = lastSnapshot; lastSnapshot = null; save(); render(); showToast('Restored',false); } }

  // Toast
  function showToast(message='Saved',withUndo=true){ toastMsg.textContent = message; toast.classList.add('show'); if(withUndo){ toastUndo.style.display='inline-block'; } else { toastUndo.style.display='none'; }
    clearTimeout(toast._t);
    toast._t = setTimeout(()=> toast.classList.remove('show'),3500);
  }
  toastUndo.addEventListener('click', ()=>{ restoreSnapshot(); toast.classList.remove('show'); });

  // Progress
  function updateProgress(){ const total = activities.length; const done = activities.filter(a=>a.completed).length; const pct = total===0?0:Math.round((done/total)*100); progressText.textContent = `${done} of ${total}`; progressPercent.textContent = `${pct}%`; progressFill.style.width = pct + '%'; badge.textContent = total; }

  // Render
  function render(){ listEl.innerHTML='';
    const visible = activities.filter(a=>{
      if(filter==='pending') return !a.completed;
      if(filter==='completed') return a.completed;
      return true;
    }).filter(a=> a.name.toLowerCase().includes(searchTerm) || (a.desc||'').toLowerCase().includes(searchTerm));

    visible.forEach(activity=>{ const node = template.content.cloneNode(true);
      const li = node.querySelector('li'); li.dataset.id = activity.id;
      // checkbox
      const checkbox = node.querySelector('.select-checkbox'); checkbox.checked = false;
      checkbox.addEventListener('change', ()=> updateBulkUI());
      const title = node.querySelector('.title'); const desc = node.querySelector('.desc'); const toggle = node.querySelector('.toggle'); const editBtn = node.querySelector('.edit'); const delBtn = node.querySelector('.delete');
      title.textContent = activity.name; desc.textContent = activity.desc || '';
      if(activity.completed) toggle.classList.add('completed'); else toggle.classList.remove('completed');
      const metaCat = node.querySelector('.category'); const metaDue = node.querySelector('.due'); if(metaCat) metaCat.textContent = activity.category || '' ; if(metaDue) metaDue.textContent = activity.due ? friendlyDue(activity.due) : '';
      // priority chip
      const priChip = document.createElement('span'); priChip.className = `priority-chip priority-${activity.priority||'Medium'}`; priChip.textContent = activity.priority || 'Medium';
      const middle = node.querySelector('.middle'); middle.querySelector('.meta').insertBefore(priChip, middle.querySelector('.meta').firstChild);
      // overdue style
      if(activity.due){ const dueDate = new Date(activity.due); if(dueDate < new Date() && !activity.completed) li.classList.add('overdue'); }

      // Update accessible state and visible label for the toggle button
      toggle.setAttribute('aria-pressed', activity.completed ? 'true' : 'false');
      toggle.title = activity.completed ? 'Completed' : 'Mark as completed';
      // remove width-shifting labels; icon visibility handled by CSS when .completed class present

      // Toggle completion
      toggle.addEventListener('click', ()=>{ snapshot(); activity.completed = !activity.completed; save(); recordToday(); render(); renderCharts(); showToast(activity.completed? 'Marked completed':'Marked pending'); });
      // Edit
      editBtn.addEventListener('click', ()=>{ enterEdit(li,activity); });
      // Delete
      delBtn.addEventListener('click', ()=>{ if(!confirm('Delete this activity?')) return; snapshot(); activities = activities.filter(a=>a.id!==activity.id); save(); render(); showToast('Deleted (undo available)'); });

      // Drag and drop
      li.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', activity.id); li.classList.add('dragging'); });
      li.addEventListener('dragend', ()=>{ li.classList.remove('dragging'); });
      li.addEventListener('dragover', (e)=>{ e.preventDefault(); li.classList.add('drag-over'); });
      li.addEventListener('dragleave', ()=>{ li.classList.remove('drag-over'); });
      li.addEventListener('drop', (e)=>{ e.preventDefault(); li.classList.remove('drag-over'); const id = Number(e.dataTransfer.getData('text/plain')); if(id===activity.id) return; snapshot(); const fromIdx = activities.findIndex(a=>a.id===id); const toIdx = activities.findIndex(a=>a.id===activity.id); const [item] = activities.splice(fromIdx,1); activities.splice(toIdx,0,item); save(); render(); showToast('Reordered (undo available)'); });

      listEl.appendChild(node);
    });
    updateProgress();
    updateHero();
  }

  // Page navigation (with slide)
  const pagesWrapper = document.getElementById('pages-wrapper');
  const homePage = document.getElementById('home-page');
  const activitiesPage = document.getElementById('activities-page');
  const viewActivitiesBtn = document.getElementById('view-activities-btn');
  const backHomeBtn = document.getElementById('back-home-btn');
  const getStartedBtn = document.getElementById('get-started');
  const fullHero = document.querySelector('.full-hero');

  function showPage(page){
    // make sure the app container is visible
    if(pagesWrapper) pagesWrapper.style.display = 'block';
    if(page==='activities'){
      if(fullHero) fullHero.style.display = 'none';
      homePage.classList.remove('active'); homePage.classList.add('left');
      activitiesPage.classList.add('active'); activitiesPage.classList.remove('right');
      backHomeBtn.style.display='inline-block';
    } else {
      // show app's small home card + reveal full hero as desired
      activitiesPage.classList.remove('active'); activitiesPage.classList.add('right');
      homePage.classList.add('active'); homePage.classList.remove('left');
      backHomeBtn.style.display='none';
      if(fullHero) fullHero.style.display = 'block';
    }
  }

  // Get Started reveals the full app and opens activities
  if(getStartedBtn){
    getStartedBtn.addEventListener('click', ()=>{
      if(pagesWrapper) pagesWrapper.style.display = 'block';
      if(fullHero) fullHero.style.display = 'none';
      showPage('activities');
      const nameInput = document.getElementById('new-name'); if(nameInput) nameInput.focus();
    });
  }

  if(viewActivitiesBtn){
    viewActivitiesBtn.addEventListener('click', ()=>{ if(pagesWrapper) pagesWrapper.style.display='block'; showPage('activities'); const nameInput = document.getElementById('new-name'); if(nameInput) nameInput.focus(); });
  }

  if(backHomeBtn){
    backHomeBtn.addEventListener('click', ()=>{ showPage('home'); if(fullHero) fullHero.style.display = 'block'; });
  }

  // Ensure hero updates when rendering
  function updateHero(){ const total = activities.length; const done = activities.filter(a=>a.completed).length; const pct = total===0?0:Math.round((done/total)*100); document.getElementById('hero-completed').textContent = done; document.getElementById('hero-total').textContent = total; document.getElementById('hero-percent').textContent = pct + '%'; badge.textContent = total; }

  // Edit inline
  function enterEdit(li,activity){ const titleEl = li.querySelector('.title'); const descEl = li.querySelector('.desc'); const editBtn = li.querySelector('.edit'); const delBtn = li.querySelector('.delete');
    const nameInput = document.createElement('input'); nameInput.value = activity.name; nameInput.className='edit-name'; nameInput.style.width='100%'; nameInput.style.marginBottom='6px';
    const descInput = document.createElement('input'); descInput.value = activity.desc || ''; descInput.className='edit-desc'; descInput.style.width='100%';
    const catInput = document.createElement('select'); catInput.innerHTML = '<option>General</option><option>Study</option><option>Practice</option><option>Project</option>'; catInput.value = activity.category || 'General';
    const dueInput = document.createElement('input'); dueInput.type = 'date'; dueInput.value = activity.due || '';
    const saveBtn = document.createElement('button'); saveBtn.textContent='Save'; saveBtn.className='edit';
    const cancelBtn = document.createElement('button'); cancelBtn.textContent='Cancel'; cancelBtn.className='delete';
    // swap
    const middle = li.querySelector('.middle'); middle.innerHTML=''; middle.appendChild(nameInput); middle.appendChild(descInput);
    middle.appendChild(catInput); middle.appendChild(dueInput);
    const right = li.querySelector('.right'); right.innerHTML=''; right.appendChild(saveBtn); right.appendChild(cancelBtn);
    nameInput.focus();
    saveBtn.addEventListener('click', ()=>{ if(!nameInput.value.trim()){ alert('Name required'); return; } snapshot(); activity.name = nameInput.value.trim(); activity.desc = descInput.value.trim(); activity.category = catInput.value; activity.due = dueInput.value; save(); render(); showToast('Updated (undo available)'); });
    cancelBtn.addEventListener('click', ()=>{ render(); });
  }

  // Add form
  const form = document.getElementById('add-form'); form.addEventListener('submit',(e)=>{ e.preventDefault(); const n = document.getElementById('new-name'); const d = document.getElementById('new-desc'); const c = document.getElementById('new-category'); const due = document.getElementById('new-due'); if(!n.value.trim()) return; snapshot(); const item = {id:uid(), name:n.value.trim(), desc:d.value.trim(), category:c.value, due: due.value || '', completed:false}; activities.unshift(item); save(); render(); showToast('Added (undo available)'); form.reset(); n.focus(); });

  // Filters
  document.getElementById('btn-all').addEventListener('click', ()=>{ setFilter('all'); });
  document.getElementById('btn-pending').addEventListener('click', ()=>{ setFilter('pending'); });
  document.getElementById('btn-completed').addEventListener('click', ()=>{ setFilter('completed'); });
  function setFilter(f){ filter=f; document.querySelectorAll('.actions .chip').forEach(b=>{ b.classList.toggle('active', b.id==='btn-'+f); b.setAttribute('aria-pressed', b.classList.contains('active')); }); render(); }

  // Search
  document.getElementById('search').addEventListener('input', (e)=>{ searchTerm = e.target.value.trim().toLowerCase(); render(); });

  // Clear completed
  document.getElementById('clear-completed').addEventListener('click', ()=>{ if(!confirm('Remove all completed activities?')) return; snapshot(); activities = activities.filter(a=>!a.completed); save(); render(); showToast('Cleared completed (undo available)'); });

  // Sorting control
  const sortSelect = document.getElementById('sort-select');
  if(sortSelect){ sortSelect.addEventListener('change', ()=>{ const v = sortSelect.value; if(v==='custom'){ /* manual order */ load(); } else if(v==='name'){ activities.sort((a,b)=>a.name.localeCompare(b.name)); save(); render(); } else if(v==='due'){ activities.sort((a,b)=>{ if(!a.due) return 1; if(!b.due) return -1; return new Date(a.due) - new Date(b.due); }); save(); render(); } else if(v==='priority'){ const pri = {High:0,Medium:1,Low:2}; activities.sort((a,b)=> (pri[a.priority||'Medium'] - pri[b.priority||'Medium'])); save(); render(); } }); }

  // Bulk actions elements
  const bulkToolbar = document.getElementById('bulk-toolbar');
  const selectAll = document.getElementById('select-all');
  const bulkCount = document.getElementById('bulk-count');
  const bulkComplete = document.getElementById('bulk-complete');
  const bulkDelete = document.getElementById('bulk-delete');
  const bulkAssign = document.getElementById('bulk-assign');

  // Track selected IDs
  function getSelectedIds(){ return Array.from(document.querySelectorAll('.select-checkbox:checked')).map(cb=> Number(cb.closest('li').dataset.id)); }

  // Bulk actions handlers
  if(selectAll){ selectAll.addEventListener('change', (e)=>{ document.querySelectorAll('.select-checkbox').forEach(cb=> cb.checked = e.target.checked); updateBulkUI(); }); }
  function updateBulkUI(){ const ids = getSelectedIds(); if(ids.length>0){ bulkToolbar.style.display='flex'; bulkCount.textContent = `${ids.length} selected`; } else { bulkToolbar.style.display='none'; } }
  if(bulkComplete){ bulkComplete.addEventListener('click', ()=>{ const ids = getSelectedIds(); if(ids.length===0) return; snapshot(); activities.forEach(a=>{ if(ids.includes(a.id)) a.completed = true; }); save(); render(); showToast('Marked selected completed (undo)'); }); }
  if(bulkDelete){ bulkDelete.addEventListener('click', ()=>{ const ids = getSelectedIds(); if(ids.length===0) return; if(!confirm(`Delete ${ids.length} items?`)) return; snapshot(); activities = activities.filter(a=>!ids.includes(a.id)); save(); render(); showToast('Deleted selected (undo)'); }); }
  if(bulkAssign){ bulkAssign.addEventListener('change', (e)=>{ const cat = e.target.value; if(!cat) return; const ids = getSelectedIds(); if(ids.length===0) return; snapshot(); activities.forEach(a=>{ if(ids.includes(a.id)) a.category = cat; }); save(); render(); showToast('Assigned category to selected (undo)'); bulkAssign.value = ''; }); }

  // Friendly due display and overdue detection
  function friendlyDue(d){ if(!d) return ''; const date = new Date(d); const now = new Date(); const diff = Math.ceil((date - now)/(1000*60*60*24)); const opts = {month:'short',day:'numeric'}; const fmt = date.toLocaleDateString(undefined,opts); if(diff<0) return `Due ${fmt} (overdue)`; if(diff===0) return `Due today`; if(diff===1) return `Due tomorrow`; return `Due ${fmt}`; }

  // Call render after initial load
  // Initial load
  load();

  // Expose for debug
  window._level2 = {load,save,render};
})();
