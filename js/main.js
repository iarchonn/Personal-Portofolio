(() => {
  'use strict';

  const githubUsername = 'iarchonn';
  const categories = ['All Projects', 'Web Development', 'Software Development', 'Data Analysis', 'Artificial Intelligence', 'IoT / Hardware', 'Other'];
  const selectedProjects = [
    { id:'smart-helmet', title:'SADAR Smart Helmet', category:'IoT / Hardware', description:'A smart-helmet prototype that explores microsleep indication detection with motion sensing and Arduino.', long:'A safety-focused hardware prototype that combines Arduino and a motion sensor to explore detecting signals associated with microsleep.', technologies:['Arduino','C++','MPU-6050'], features:['Motion-sensor integration','Arduino-based prototype','Safety-focused concept'], featured:true },
    { id:'scholarship-ai', title:'AI Scholarship Assistant', category:'Artificial Intelligence', description:'A conversational assistant concept for helping users find scholarship registration information.', long:'An AI-powered chatbot concept designed to make scholarship registration information easier for prospective applicants to find and understand.', technologies:['React','Python','OpenAI API'], features:['Conversational interface','Scholarship information discovery','AI-assisted responses'], featured:true },
    { id:'data-dashboard', title:'Data Dashboard', category:'Data Analysis', description:'An interactive dashboard for processing and presenting data through a data-driven interface.', long:'A data exploration project focused on turning processed data into an interactive, accessible dashboard.', technologies:['Python','Streamlit','Data'], features:['Interactive visual exploration','Data processing','Dashboard interface'], featured:true }
  ];
  const $ = (selector) => document.querySelector(selector);
  const grid = $('#grid'), status = $('#status'), empty = $('#empty'), modal = $('#modal');
  let projects = [...selectedProjects], category = 'All Projects', query = '', sort = 'featured';
  const esc = (value) => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));

  function currentProjects() {
    return projects.filter(project => (category === 'All Projects' || project.category === category) && (!query || [project.title, project.description, project.category, ...project.technologies].join(' ').toLowerCase().includes(query.toLowerCase()))).sort((a, b) => {
      if (sort === 'alpha') return a.title.localeCompare(b.title);
      if (sort === 'newest') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      return Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title);
    });
  }

  function renderProjects() {
    const list = currentProjects();
    grid.innerHTML = list.map(project => `<article class="card"><span class="type">${esc(project.category)}</span><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p><div class="tags">${project.technologies.slice(0,4).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="card-actions"><button class="text-button" type="button" data-id="${esc(project.id)}">View details →</button>${project.repository ? `<a class="text-button" href="${esc(project.repository)}" target="_blank" rel="noopener noreferrer">Repository ↗</a>` : ''}</div></article>`).join('');
    empty.hidden = list.length !== 0;
    grid.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => openProject(projects.find(project => project.id === button.dataset.id))));
  }

  function renderFilters() {
    $('#filters').innerHTML = categories.map(item => `<button class="filter" type="button" aria-pressed="${item === category}" data-category="${item}">${item}</button>`).join('');
  }

  function openProject(project) {
    $('#modal-content').innerHTML = `<p class="modal-label">${esc(project.category)}</p><h2 class="modal-title">${esc(project.title)}</h2><p class="modal-copy">${esc(project.long)}</p>${project.features.length ? `<h3>Key focus</h3><ul class="modal-features">${project.features.map(feature => `<li>${esc(feature)}</li>`).join('')}</ul>` : ''}<div class="tags">${project.technologies.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="modal-actions">${project.repository ? `<a class="button primary" href="${esc(project.repository)}" target="_blank" rel="noopener noreferrer">Repository ↗</a>` : ''}${project.demo ? `<a class="button" href="${esc(project.demo)}" target="_blank" rel="noopener noreferrer">Live demo ↗</a>` : ''}</div>`;
    modal.showModal();
  }

  async function loadRepositories() {
    const endpoint = `https://api.github.com/users/${githubUsername}/repos?type=owner&per_page=100&sort=updated`;
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.github+json' } });
      if (!response.ok) throw new Error(response.status === 404 ? `GitHub user “${githubUsername}” was not found.` : response.status === 403 ? 'GitHub rate limit reached.' : `GitHub returned ${response.status}.`);
      const repos = await response.json();
      const known = new Set(projects.map(project => project.title.toLowerCase()));
      const githubProjects = repos.filter(repo => !repo.fork && !known.has(repo.name.toLowerCase())).map(repo => ({ id:`github-${repo.id}`, title:repo.name, category:'Other', description:repo.description || 'Public GitHub repository.', long:repo.description || 'Public repository from GitHub.', technologies:[repo.language || 'Repository'], features:[], featured:false, repository:repo.html_url, demo:repo.homepage || '', updatedAt:repo.updated_at }));
      projects.push(...githubProjects);
      status.textContent = githubProjects.length ? `Showing ${selectedProjects.length} selected projects and ${githubProjects.length} public repositories from GitHub.` : `No public, non-fork repositories were found for @${githubUsername}.`;
    } catch (error) {
      status.textContent = `Selected projects are shown. ${error.message} Open GitHub directly to check the profile.`;
    }
    renderProjects();
  }

  $('#filters').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (button) { category = button.dataset.category; renderFilters(); renderProjects(); } });
  $('#search').addEventListener('input', event => { query = event.target.value; renderProjects(); });
  $('#sort').addEventListener('change', event => { sort = event.target.value; renderProjects(); });
  $('#close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  $('.menu').addEventListener('click', () => { const open = $('.menu').getAttribute('aria-expanded') === 'true'; $('.menu').setAttribute('aria-expanded', String(!open)); $('.links').classList.toggle('open', !open); });
  $('.links').addEventListener('click', event => { if (event.target.matches('a')) { $('.links').classList.remove('open'); $('.menu').setAttribute('aria-expanded', 'false'); } });
  if ('IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold:.12 }); document.querySelectorAll('.reveal').forEach(element => observer.observe(element)); } else { document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible')); }
  $('#year').textContent = new Date().getFullYear();
  renderFilters(); renderProjects(); loadRepositories();
})();
