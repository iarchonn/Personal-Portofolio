/**
 * main.js
 * Primary application orchestrator for Irwan Wafi's Developer Portfolio.
 * Implements clean architecture, accessible interactive components,
 * resilient GitHub data synchronization, and high-fidelity project gallery previews.
 */

import { LOCAL_PROJECTS, CATEGORIES } from './projects-data.js';
import { fetchGitHubRepos, fetchRepoDetails, mergeProjects } from './github.js';

(() => {
  'use strict';

  // =========================================================================
  // State Management
  // =========================================================================
  const state = {
    projects: [...LOCAL_PROJECTS],
    selectedId: LOCAL_PROJECTS[0]?.id || '',
    activeCategory: 'All Projects',
    searchQuery: '',
    isLoadingGitHub: false,
    githubError: null
  };

  // =========================================================================
  // DOM Elements Cache
  // =========================================================================
  const dom = {
    // Gallery & Category
    gallerySection: document.getElementById('project-gallery'),
    galleryStatus: document.getElementById('gallery-status'),
    categoryFilters: document.getElementById('category-filters'),
    searchInput: document.getElementById('project-search-input'),
    projectCounter: document.getElementById('project-count-badge'),

    // Explorer
    explorerSection: document.getElementById('project-explorer'),
    projectList: document.getElementById('project-list'),
    projectSelect: document.getElementById('project-select'),
    projectDisplay: document.getElementById('project-display'),
    backToGalleryBtn: document.getElementById('back-to-gallery'),
    prevBtn: document.getElementById('previous-project'),
    nextBtn: document.getElementById('next-project'),
    positionIndicator: document.getElementById('project-position'),
    explorerSearchInput: document.getElementById('search'),
    explorerStatus: document.getElementById('status'),

    // Navigation & Global
    navMenuBtn: document.querySelector('.menu'),
    navLinks: document.getElementById('links'),
    yearSpan: document.getElementById('year'),
    lightbox: document.getElementById('image-lightbox'),
    lightboxImg: document.getElementById('lightbox-image'),
    lightboxCaption: document.getElementById('lightbox-caption'),
    lightboxClose: document.getElementById('lightbox-close')
  };

  // =========================================================================
  // Utility Functions
  // =========================================================================

  /**
   * Sanitizes strings to prevent XSS.
   * @param {string|number} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#039;',
      '"': '&quot;'
    }[char]));
  }

  /**
   * Safe markdown parser for GitHub README files and local text.
   * Converts common markdown tokens to semantic HTML.
   * @param {string} md
   * @returns {string}
   */
  function parseMarkdown(md) {
    if (!md) return '<p class="display-empty">No README documentation provided.</p>';

    const codeTokens = [];
    // Protect fenced code blocks
    let parsed = escapeHtml(md).replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const token = `__CODE_BLOCK_${codeTokens.length}__`;
      codeTokens.push(`<pre><code class="language-${escapeHtml(lang)}">${code.trim()}</code></pre>`);
      return token;
    });

    // Protect inline code
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    parsed = parsed
      .replace(/^### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^## (.*$)/gm, '<h4>$1</h4>')
      .replace(/^# (.*$)/gm, '<h3>$1</h3>');

    // Bold & Italics
    parsed = parsed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Bullet lists
    parsed = parsed.replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>');
    parsed = parsed.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
    parsed = parsed.replace(/<\/ul>\s*<ul>/g, ''); // Join consecutive list blocks

    // Line breaks
    parsed = parsed.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    // Restore fenced code blocks
    codeTokens.forEach((block, index) => {
      parsed = parsed.replace(`__CODE_BLOCK_${index}__`, block);
    });

    return parsed;
  }

  /**
   * Filters projects based on active category and search query.
   * @returns {Array}
   */
  function getFilteredProjects() {
    const query = state.searchQuery.trim().toLowerCase();
    return state.projects.filter(project => {
      const matchesCategory =
        state.activeCategory === 'All Projects' ||
        project.category.toLowerCase().includes(state.activeCategory.toLowerCase());

      if (!matchesCategory) return false;
      if (!query) return true;

      const searchableText = [
        project.title,
        project.description,
        project.category,
        ...(project.technologies || []),
        ...(project.topics || [])
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }

  /**
   * Retrieves the currently selected project object.
   * @returns {Object|null}
   */
  function getSelectedProject() {
    return state.projects.find(p => p.id === state.selectedId) || state.projects[0] || null;
  }

  // =========================================================================
  // Rendering: Category Filters
  // =========================================================================

  function renderCategoryFilters() {
    if (!dom.categoryFilters) return;

    dom.categoryFilters.innerHTML = CATEGORIES.map(category => {
      const isSelected = state.activeCategory === category;
      return `
        <button
          type="button"
          class="filter-pill ${isSelected ? 'active' : ''}"
          role="tab"
          aria-selected="${isSelected}"
          data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `;
    }).join('');

    dom.categoryFilters.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.category;
        renderCategoryFilters();
        renderGallery();
        renderExplorerList();
      });
    });
  }

  // =========================================================================
  // Rendering: Gallery View
  // =========================================================================

  function renderGallery() {
    if (!dom.gallerySection) return;

    const visibleProjects = getFilteredProjects();

    // Update counter
    if (dom.projectCounter) {
      dom.projectCounter.textContent = `${visibleProjects.length} ${visibleProjects.length === 1 ? 'project' : 'projects'}`;
    }

    if (!visibleProjects.length) {
      dom.gallerySection.innerHTML = `
        <div class="gallery-empty-state">
          <p>No projects match your current search or category filter.</p>
          <button type="button" class="button" id="reset-filter-btn">Reset Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filter-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.activeCategory = 'All Projects';
          state.searchQuery = '';
          if (dom.searchInput) dom.searchInput.value = '';
          if (dom.explorerSearchInput) dom.explorerSearchInput.value = '';
          renderCategoryFilters();
          renderGallery();
          renderExplorerList();
        });
      }
      return;
    }

    dom.gallerySection.innerHTML = visibleProjects.map(project => {
      const tags = Array.from(new Set([...(project.technologies || []), ...(project.topics || [])])).slice(0, 4);
      const imageSrc = project.image || `assets/images/${project.repoName}.png`;

      return `
        <article class="gallery-card" data-project-id="${escapeHtml(project.id)}">
          <div class="gallery-preview-container">
            <img
              src="${escapeHtml(imageSrc)}"
              alt="Screenshot preview for ${escapeHtml(project.title)}"
              class="gallery-preview-image"
              loading="lazy"
              onerror="this.onerror=null; this.src='https://opengraph.githubassets.com/1/${encodeURIComponent(project.fullName || 'iarchonn/' + project.repoName)}';"
            />
            <span class="gallery-category-badge">${escapeHtml(project.category)}</span>
            <button
              type="button"
              class="gallery-zoom-btn"
              aria-label="Enlarge image preview"
              data-zoom-src="${escapeHtml(imageSrc)}"
              data-zoom-title="${escapeHtml(project.title)}">
              🔍
            </button>
          </div>
          <div class="gallery-content">
            <h3 class="gallery-title">${escapeHtml(project.title)}</h3>
            <p class="gallery-description">${escapeHtml(project.description)}</p>
            <div class="gallery-tags" aria-label="Technologies used">
              ${tags.map(tag => `<span class="gallery-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="gallery-card-actions">
              <button
                type="button"
                class="gallery-explore-btn"
                data-open-id="${escapeHtml(project.id)}">
                View Project &amp; Readme →
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach click events to card buttons
    dom.gallerySection.querySelectorAll('[data-open-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openExplorer(btn.dataset.openId);
      });
    });

    // Make the entire card header/image open the explorer
    dom.gallerySection.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.gallery-zoom-btn')) return; // Allow zoom without opening explorer
        openExplorer(card.dataset.projectId);
      });
    });

    // Zoom buttons
    dom.gallerySection.querySelectorAll('.gallery-zoom-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(btn.dataset.zoomSrc, btn.dataset.zoomTitle);
      });
    });
  }

  // =========================================================================
  // Rendering: Explorer View
  // =========================================================================

  function renderExplorerList() {
    if (!dom.projectList || !dom.projectSelect) return;

    const visibleProjects = getFilteredProjects();

    // Sidebar list
    if (!visibleProjects.length) {
      dom.projectList.innerHTML = '<p class="explorer-empty">No matching projects found.</p>';
      dom.projectSelect.innerHTML = '<option value="">No matching projects</option>';
      return;
    }

    dom.projectList.innerHTML = visibleProjects.map(project => {
      const isSelected = project.id === state.selectedId;
      return `
        <button
          class="project-row ${isSelected ? 'active' : ''}"
          type="button"
          role="option"
          aria-selected="${isSelected}"
          data-project-id="${escapeHtml(project.id)}">
          <span class="project-row-category">${escapeHtml(project.category)}</span>
          <span class="project-row-name">${escapeHtml(project.title)}</span>
        </button>
      `;
    }).join('');

    // Mobile Select dropdown
    dom.projectSelect.innerHTML = visibleProjects.map(project => `
      <option value="${escapeHtml(project.id)}" ${project.id === state.selectedId ? 'selected' : ''}>
        ${escapeHtml(project.title)}
      </option>
    `).join('');

    // Bind sidebar clicks
    dom.projectList.querySelectorAll('[data-project-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectProject(btn.dataset.projectId);
      });
    });

    // Update pagination buttons & indicator
    updatePaginationControls(visibleProjects);
  }

  function updatePaginationControls(visibleProjects) {
    if (!dom.prevBtn || !dom.nextBtn || !dom.positionIndicator) return;

    const currentIndex = visibleProjects.findIndex(p => p.id === state.selectedId);
    dom.prevBtn.disabled = currentIndex <= 0;
    dom.nextBtn.disabled = currentIndex === -1 || currentIndex >= visibleProjects.length - 1;

    dom.positionIndicator.textContent = visibleProjects.length > 0
      ? `${Math.max(1, currentIndex + 1)} / ${visibleProjects.length}`
      : '0 / 0';
  }

  function renderProjectDisplay() {
    if (!dom.projectDisplay) return;

    const project = getSelectedProject();
    if (!project) {
      dom.projectDisplay.innerHTML = '<p class="display-empty">Select a project to explore its details.</p>';
      return;
    }

    const tags = Array.from(new Set([...(project.technologies || []), ...(project.topics || [])]));
    const imageSrc = project.image || `assets/images/${project.repoName}.png`;
    const readmeMarkup = parseMarkdown(project.readme);

    dom.projectDisplay.innerHTML = `
      <div class="display-preview-banner">
        <img
          src="${escapeHtml(imageSrc)}"
          alt="${escapeHtml(project.title)} screenshot showcase"
          class="display-preview-img"
          loading="lazy"
          onerror="this.onerror=null; this.src='https://opengraph.githubassets.com/1/${encodeURIComponent(project.fullName || 'iarchonn/' + project.repoName)}';"
        />
        <button
          type="button"
          class="display-preview-zoom"
          aria-label="View screenshot in full size"
          id="banner-zoom-btn">
          🔍 View Fullscreen
        </button>
      </div>

      <div class="display-header">
        <p class="display-category">${escapeHtml(project.category)}</p>
        <h3 class="display-title">${escapeHtml(project.title)}</h3>
        <p class="display-lead">${escapeHtml(project.description)}</p>
      </div>

      <div class="display-tags-group">
        ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>

      <div class="display-actions">
        <a class="button primary" href="${escapeHtml(project.repository)}" target="_blank" rel="noopener noreferrer">
          View on GitHub ↗
        </a>
        ${project.demo ? `
          <a class="button secondary" href="${escapeHtml(project.demo)}" target="_blank" rel="noopener noreferrer">
            Live Demo ↗
          </a>
        ` : ''}
      </div>

      <hr class="display-divider">

      <section class="readme-section" aria-label="Project Documentation">
        <div class="readme-header">
          <span class="readme-badge">README.md</span>
          <span class="readme-repo-slug">${escapeHtml(project.fullName || project.repoName)}</span>
        </div>
        <div class="markdown-body">
          ${readmeMarkup}
        </div>
      </section>
    `;

    // Banner zoom handler
    const zoomBtn = document.getElementById('banner-zoom-btn');
    if (zoomBtn) {
      zoomBtn.addEventListener('click', () => {
        openLightbox(imageSrc, project.title);
      });
    }

    // Lazy load fresh GitHub README & details if not fetched yet
    if (project.githubLoaded !== true && project.fullName) {
      enrichProjectFromGitHub(project);
    }
  }

  // =========================================================================
  // Asynchronous GitHub Enrichment
  // =========================================================================

  async function enrichProjectFromGitHub(project) {
    project.githubLoaded = true;
    try {
      const details = await fetchRepoDetails(project.fullName);
      if (details) {
        if (details.description && !project.description) project.description = details.description;
        if (details.demo) project.demo = details.demo;
        if (details.readme) project.readme = details.readme;
        if (details.topics && details.topics.length) {
          project.topics = Array.from(new Set([...(project.topics || []), ...details.topics]));
        }

        // Re-render if current
        if (state.selectedId === project.id) {
          renderProjectDisplay();
        }
      }
    } catch (err) {
      console.warn(`GitHub detail enrichment failed for ${project.id}:`, err);
    }
  }

  async function initGitHubSync() {
    state.isLoadingGitHub = true;
    try {
      const ghRepos = await fetchGitHubRepos();
      if (ghRepos && ghRepos.length > 0) {
        state.projects = mergeProjects(ghRepos, LOCAL_PROJECTS);
        if (dom.galleryStatus) {
          dom.galleryStatus.textContent = `Synchronized ${state.projects.length} repositories with GitHub.`;
        }
      }
    } catch (err) {
      console.warn('GitHub API sync fallback active:', err.message);
      state.githubError = err.message;
      if (dom.galleryStatus) {
        dom.galleryStatus.textContent = 'Showing offline curated portfolio projects.';
      }
    } finally {
      state.isLoadingGitHub = false;
      renderGallery();
      renderExplorerList();
      if (state.selectedId) {
        renderProjectDisplay();
      }
    }
  }

  // =========================================================================
  // Navigation & View Switching
  // =========================================================================

  function openExplorer(projectId) {
    if (projectId) state.selectedId = projectId;
    if (dom.gallerySection) dom.gallerySection.hidden = true;
    if (dom.explorerSection) dom.explorerSection.hidden = false;

    renderExplorerList();
    renderProjectDisplay();

    // Smooth scroll into explorer
    dom.explorerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeExplorer() {
    if (dom.explorerSection) dom.explorerSection.hidden = true;
    if (dom.gallerySection) dom.gallerySection.hidden = false;

    dom.gallerySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function selectProject(projectId) {
    state.selectedId = projectId;
    renderExplorerList();
    renderProjectDisplay();
  }

  function navigateProject(direction) {
    const visible = getFilteredProjects();
    const currentIndex = visible.findIndex(p => p.id === state.selectedId);
    const targetProject = visible[currentIndex + direction];
    if (targetProject) {
      selectProject(targetProject.id);
    }
  }

  // =========================================================================
  // Lightbox Modal
  // =========================================================================

  function openLightbox(src, caption) {
    if (!dom.lightbox || !dom.lightboxImg) return;
    dom.lightboxImg.src = src;
    dom.lightboxImg.alt = caption || 'Project preview screenshot';
    if (dom.lightboxCaption) dom.lightboxCaption.textContent = caption || '';
    dom.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!dom.lightbox) return;
    dom.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  // =========================================================================
  // Event Listeners & Global Setup
  // =========================================================================

  function setupEventListeners() {
    // Gallery search
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (dom.explorerSearchInput) dom.explorerSearchInput.value = state.searchQuery;
        renderGallery();
        renderExplorerList();
      });
    }

    // Explorer sidebar search
    if (dom.explorerSearchInput) {
      dom.explorerSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (dom.searchInput) dom.searchInput.value = state.searchQuery;
        renderExplorerList();
        renderGallery();
      });
    }

    // Mobile project selector
    if (dom.projectSelect) {
      dom.projectSelect.addEventListener('change', (e) => {
        selectProject(e.target.value);
      });
    }

    // Explorer buttons
    if (dom.backToGalleryBtn) {
      dom.backToGalleryBtn.addEventListener('click', closeExplorer);
    }
    if (dom.prevBtn) {
      dom.prevBtn.addEventListener('click', () => navigateProject(-1));
    }
    if (dom.nextBtn) {
      dom.nextBtn.addEventListener('click', () => navigateProject(1));
    }

    // Lightbox modal close
    if (dom.lightboxClose) {
      dom.lightboxClose.addEventListener('click', closeLightbox);
    }
    if (dom.lightbox) {
      dom.lightbox.addEventListener('click', (e) => {
        if (e.target === dom.lightbox || e.target === dom.lightboxClose) {
          closeLightbox();
        }
      });
    }

    // Global keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.lightbox && dom.lightbox.classList.contains('active')) {
          closeLightbox();
        } else if (dom.explorerSection && !dom.explorerSection.hidden) {
          closeExplorer();
        }
      }
      if (dom.explorerSection && !dom.explorerSection.hidden) {
        if (e.key === 'ArrowLeft') navigateProject(-1);
        if (e.key === 'ArrowRight') navigateProject(1);
      }
    });

    // Mobile navbar toggle
    if (dom.navMenuBtn && dom.navLinks) {
      dom.navMenuBtn.addEventListener('click', () => {
        const isOpen = dom.navMenuBtn.getAttribute('aria-expanded') === 'true';
        dom.navMenuBtn.setAttribute('aria-expanded', String(!isOpen));
        dom.navLinks.classList.toggle('open', !isOpen);
      });

      dom.navLinks.addEventListener('click', (e) => {
        if (e.target.matches('a')) {
          dom.navLinks.classList.remove('open');
          dom.navMenuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Reveal animations on scroll
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }

    // Dynamic copyright year
    if (dom.yearSpan) {
      dom.yearSpan.textContent = new Date().getFullYear();
    }
  }

  // =========================================================================
  // Application Entry Point
  // =========================================================================

  function init() {
    renderCategoryFilters();
    renderGallery();
    renderExplorerList();
    renderProjectDisplay();
    setupEventListeners();
    initGitHubSync();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
