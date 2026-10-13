(() => {
  'use strict';
  const githubUsername = 'iarchonn';
  const selectedProjects = [
    { id:'smart-helmet', title:'SADAR Smart Helmet', category:'IoT / Hardware', description:'A smart-helmet prototype that explores microsleep indication detection with motion sensing and Arduino.', technologies:['Arduino','C++','MPU-6050'], features:['Motion-sensor integration','Arduino-based prototype','Safety-focused concept'] },
    { id:'scholarship-ai', title:'AI Scholarship Assistant', category:'Artificial Intelligence', description:'A conversational assistant concept for helping users find scholarship registration information.', technologies:['React','Python','OpenAI API'], features:['Conversational interface','Scholarship information discovery','AI-assisted responses'] },
    { id:'data-dashboard', title:'Data Dashboard', category:'Data Analysis', description:'An interactive dashboard for processing and presenting data through a data-driven interface.', technologies:['Python','Streamlit','Data'], features:['Interactive visual exploration','Data processing','Dashboard interface'] }
  ];
  const $ = selector => document.querySelector(selector);
  const list = $('#project-list'), display = $('#project-display'), search = $('#search'), status = $('#status'), projectSelect = $('#project-select'), previousButton = $('#previous-project'), nextButton = $('#next-project'), projectPosition = $('#project-position');
  let projects = [...selectedProjects], selectedId = projects[0].id, query = '';
  const esc = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const visibleProjects = () => projects.filter(project => [project.title,project.description,project.category,...project.technologies].join(' ').toLowerCase().includes(query.toLowerCase()));
  const selectedProject = () => projects.find(project => project.id === selectedId) || visibleProjects()[0];
  function renderList() {
    const visible = visibleProjects();
    $('#project-count').textContent = projects.length;
    list.innerHTML = visible.length ? visible.map(project => `<button class="project-row" type="button" role="option" aria-selected="${project.id === selectedId}" data-project="${esc(project.id)}"><span class="project-row-category">${esc(project.category)}</span><span class="project-row-name">${esc(project.title)}</span></button>`).join('') : '<p class="explorer-empty">No matching projects.</p>';
    projectSelect.innerHTML = visible.map(project => `<option value="${esc(project.id)}" ${project.id === selectedId ? 'selected' : ''}>${esc(project.title)}</option>`).join('');
    list.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => { selectedId = button.dataset.project; renderList(); renderDisplay(); }));
    if (!visible.some(project => project.id === selectedId) && visible[0]) { selectedId = visible[0].id; renderList(); renderDisplay(); return; }
    const selectedIndex = visible.findIndex(project => project.id === selectedId);
    previousButton.disabled = selectedIndex <= 0;
    nextButton.disabled = selectedIndex === -1 || selectedIndex >= visible.length - 1;
    projectPosition.textContent = visible.length ? `${selectedIndex + 1} / ${visible.length}` : '0 / 0';
  }
  function renderDisplay() {
    const project = selectedProject();
    if (!project) { display.innerHTML = '<p class="display-empty">Choose a project to see its details.</p>'; return; }
    display.innerHTML = `<p class="display-category">${esc(project.category)}</p><h3 class="display-title">${esc(project.title)}</h3><p class="display-summary">${esc(project.description)}</p><hr class="readme-rule"><div class="display-grid"><div><p class="display-label">Overview</p><p class="display-summary">${esc(project.description)}</p></div><div><p class="display-label">Key focus</p>${project.features.length ? `<ul class="display-features">${project.features.map(feature => `<li>${esc(feature)}</li>`).join('')}</ul>` : '<p class="display-empty">Repository details are available on GitHub.</p>'}</div></div><div class="tags">${project.technologies.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="display-actions">${project.repository ? `<a class="button primary" href="${esc(project.repository)}" target="_blank" rel="noopener noreferrer">Open repository ↗</a>` : ''}${project.demo ? `<a class="button" href="${esc(project.demo)}" target="_blank" rel="noopener noreferrer">Live demo ↗</a>` : ''}</div>`;
  }
  async function loadRepositories() {
    try {
      const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?type=owner&per_page=100&sort=updated`, { headers:{Accept:'application/vnd.github+json'} });
      if (!response.ok) throw new Error(response.status === 404 ? `GitHub user “${githubUsername}” was not found.` : response.status === 403 ? 'GitHub rate limit reached.' : `GitHub returned ${response.status}.`);
      const repos = await response.json(), known = new Set(projects.map(project => project.title.toLowerCase()));
      projects.push(...repos.filter(repo => !repo.fork && !known.has(repo.name.toLowerCase())).map(repo => ({ id:`github-${repo.id}`, title:repo.name, category:'GitHub Repository', description:repo.description || 'Public repository from GitHub.', technologies:[repo.language || 'Repository'], features:[], repository:repo.html_url, demo:repo.homepage || '' })));
      status.textContent = `Showing ${projects.length} projects. Select one to explore.`;
    } catch (error) { status.textContent = `Showing selected projects. ${error.message}`; }
    renderList(); renderDisplay();
  }
  search.addEventListener('input', event => { query = event.target.value; renderList(); renderDisplay(); });
  projectSelect.addEventListener('change', event => { selectedId = event.target.value; renderList(); renderDisplay(); });
  function moveProject(direction) { const visible = visibleProjects(); const index = visible.findIndex(project => project.id === selectedId); const next = visible[index + direction]; if (next) { selectedId = next.id; renderList(); renderDisplay(); } }
  previousButton.addEventListener('click', () => moveProject(-1));
  nextButton.addEventListener('click', () => moveProject(1));
  $('.menu').addEventListener('click', () => { const open = $('.menu').getAttribute('aria-expanded') === 'true'; $('.menu').setAttribute('aria-expanded', String(!open)); $('.links').classList.toggle('open', !open); });
  $('.links').addEventListener('click', event => { if (event.target.matches('a')) { $('.links').classList.remove('open'); $('.menu').setAttribute('aria-expanded','false'); } });
  if ('IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), {threshold:.12}); document.querySelectorAll('.reveal').forEach(element => observer.observe(element)); } else document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
  $('#year').textContent = new Date().getFullYear(); renderList(); renderDisplay(); loadRepositories();
})();
