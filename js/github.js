/**
 * github.js
 * GitHub API service module.
 * Provides resilient repository fetching, README decoding, and merging with local project definitions.
 */

const GITHUB_USERNAME = 'iarchonn';
const API_BASE = 'https://api.github.com';

/**
 * Decodes a base64 string from GitHub into a UTF-8 string.
 * @param {string} base64
 * @returns {string}
 */
export function decodeReadme(base64) {
  try {
    const cleaned = base64.replace(/\s/g, '');
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    console.warn('Failed to decode README base64:', err);
    return '';
  }
}

/**
 * Fetches all public repositories for the configured user.
 * @returns {Promise<Array>}
 */
export async function fetchGitHubRepos() {
  const url = `${API_BASE}/users/${GITHUB_USERNAME}/repos?type=owner&per_page=100&sort=updated`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit reached. Displaying local project data.');
    }
    if (response.status === 404) {
      throw new Error(`GitHub user "${GITHUB_USERNAME}" not found.`);
    }
    throw new Error(`GitHub request failed with status ${response.status}.`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data.filter(repo => !repo.fork) : [];
}

/**
 * Fetches additional repository details and README.md content.
 * @param {string} fullName e.g. "iarchonn/Analyze-Netflix-Data"
 * @returns {Promise<{ description?: string, topics?: string[], demo?: string, readme?: string }>}
 */
export async function fetchRepoDetails(fullName) {
  const headers = { Accept: 'application/vnd.github+json' };
  const result = {};

  try {
    const [repoRes, readmeRes] = await Promise.allSettled([
      fetch(`${API_BASE}/repos/${fullName}`, { headers }),
      fetch(`${API_BASE}/repos/${fullName}/readme`, { headers })
    ]);

    if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
      const repo = await repoRes.value.json();
      result.description = repo.description;
      result.topics = repo.topics || [];
      result.demo = repo.homepage || '';
      result.stars = repo.stargazers_count || 0;
      if (repo.language) {
        result.primaryLanguage = repo.language;
      }
    }

    if (readmeRes.status === 'fulfilled' && readmeRes.value.ok) {
      const readmeData = await readmeRes.value.json();
      if (readmeData && readmeData.content) {
        result.readme = decodeReadme(readmeData.content);
      }
    }
  } catch (err) {
    console.warn(`Could not fetch details for ${fullName}:`, err);
  }

  return result;
}

/**
 * Intelligently merges GitHub repositories with local curated project definitions.
 * Preserves curated local screenshot images, categories, and titles.
 * @param {Array} ghRepos
 * @param {Array} localProjects
 * @returns {Array}
 */
export function mergeProjects(ghRepos, localProjects) {
  const localMap = new Map();
  localProjects.forEach(proj => {
    const key = (proj.repoName || proj.title || '').toLowerCase();
    localMap.set(key, { ...proj });
  });

  const merged = [];
  const processedKeys = new Set();

  // First enrich projects from GitHub
  ghRepos.forEach(repo => {
    const key = repo.name.toLowerCase();
    const existing = localMap.get(key);

    if (existing) {
      processedKeys.add(key);
      merged.push({
        ...existing,
        fullName: repo.full_name,
        repository: repo.html_url,
        demo: repo.homepage || existing.demo,
        description: existing.description || repo.description || 'Public repository on GitHub.',
        topics: Array.from(new Set([...(existing.topics || []), ...(repo.topics || [])])),
        technologies: existing.technologies?.length ? existing.technologies : [repo.language || 'Code'],
        stars: repo.stargazers_count || 0,
        updatedAt: repo.updated_at
      });
    } else {
      // New repo not yet in local map
      processedKeys.add(key);
      const guessedImage = `assets/images/${repo.name}.png`;
      merged.push({
        id: `github-${repo.id}`,
        repoName: repo.name,
        title: repo.name.replace(/[-_]/g, ' '),
        category: determineCategory(repo),
        description: repo.description || 'Public repository on GitHub.',
        image: guessedImage,
        fullName: repo.full_name,
        repository: repo.html_url,
        demo: repo.homepage || '',
        technologies: repo.language ? [repo.language] : ['Repository'],
        topics: repo.topics || [],
        stars: repo.stargazers_count || 0,
        updatedAt: repo.updated_at
      });
    }
  });

  // Then add any local projects that might not be on GitHub or if rate limit occurred
  localProjects.forEach(proj => {
    const key = (proj.repoName || proj.title || '').toLowerCase();
    if (!processedKeys.has(key)) {
      merged.push({
        ...proj,
        fullName: `${GITHUB_USERNAME}/${proj.repoName}`
      });
    }
  });

  return merged;
}

/**
 * Helper to infer a clean category from repo languages/topics.
 */
function determineCategory(repo) {
  const text = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  if (text.includes('data') || text.includes('netflix') || text.includes('ai') || text.includes('model') || text.includes('streamlit')) {
    return 'Data Analysis & AI';
  }
  if (text.includes('arduino') || text.includes('sensor') || text.includes('iot') || text.includes('hardware') || text.includes('helm')) {
    return 'IoT / Hardware';
  }
  return 'Web Development';
}
