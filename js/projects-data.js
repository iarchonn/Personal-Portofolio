/**
 * projects-data.js
 * Curated project definitions and local image mappings.
 * Acts as a resilient fallback and offline data source for the portfolio.
 */

export const LOCAL_PROJECTS = [
  {
    id: 'analyze-netflix-data',
    repoName: 'Analyze-Netflix-Data',
    title: 'Analyze Netflix Data',
    category: 'Data Analysis & AI',
    description: 'Interactive Streamlit dashboard to explore the Netflix catalog with filters, executive KPIs, visualizations, data-quality checks, and CSV export.',
    image: 'assets/images/Analyze-Netflix-Data.png',
    technologies: ['Python', 'Streamlit', 'Pandas', 'Matplotlib', 'Jupyter'],
    topics: ['data-analysis', 'streamlit', 'dashboard', 'python', 'visualization'],
    repository: 'https://github.com/iarchonn/Analyze-Netflix-Data',
    demo: '',
    featured: true,
    readme: `# Analyze Netflix Data

Interactive Streamlit dashboard designed to explore, filter, and extract actionable insights from the Netflix titles dataset.

### Key Capabilities
- **Executive KPIs**: Total titles, movie vs. TV show distribution, release year trends.
- **Dynamic Filters**: Instant filtering by rating, country, genre, and duration.
- **Data Quality & Hygiene**: Missing value inspections and content breakdown.
- **Export**: Filtered records exportable directly to CSV for reporting.`
  },
  {
    id: 'excel-dashboard-apps-script',
    repoName: 'Excel-Dashboard-Apps-Script',
    title: 'Excel Sales Dashboard',
    category: 'Web Development',
    description: 'Real-time sales dashboard built with HTML and Google Apps Script featuring live spreadsheet sync, executive KPIs, interactive charts, and sales leaderboard.',
    image: 'assets/images/Excel-Dashboard-Apps-Script.png',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'Google Apps Script', 'Chart.js'],
    topics: ['dashboard', 'google-apps-script', 'sales-analytics', 'charts'],
    repository: 'https://github.com/iarchonn/Excel-Dashboard-Apps-Script',
    demo: '',
    featured: true,
    readme: `# Excel Dashboard with Google Apps Script

A modern sales intelligence dashboard connecting a Google Sheets database to a fast, client-side web application.

### Features
- **Live Two-Way Sync**: Fetches live data via Google Apps Script web endpoints.
- **Executive KPIs**: Gross revenue, conversion rates, order counts, and target pacing.
- **Visual Analytics**: Grouped bar graphs and doughnut breakdowns powered by Chart.js.
- **Performance Leaderboard**: Real-time sales representative ranking.`
  },
  {
    id: 'personal-portofolio',
    repoName: 'Personal-Portofolio',
    title: 'Personal Developer Portfolio',
    category: 'Web Development',
    description: 'Modern developer portfolio and interactive repository explorer featuring GitHub API sync, rich project gallery preview, and responsive design.',
    image: 'assets/images/Personal-Portofolio.png',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'GitHub API', 'Responsive UI'],
    topics: ['portfolio', 'javascript', 'css3', 'github-api'],
    repository: 'https://github.com/iarchonn/Personal-Portofolio',
    demo: 'https://iarchonn.github.io/Personal-Portofolio/',
    featured: true,
    readme: `# Irwan Wafi — Developer Portfolio

Showcase of software engineering, hardware prototyping, data science, and web development projects.

### Highlights
- **Curated Gallery & Live Explorer**: Visual gallery with instant switching to a detailed README reader.
- **GitHub Sync**: Dynamic repository information with safe fallback.
- **Accessibility & Performance**: Semantic HTML5, dark theme aesthetics, zero third-party framework overhead.`
  },
  {
    id: 'sehatin-orderweb',
    repoName: 'Sehatin-OrderWeb',
    title: 'Sehatin Healthy Food Ordering',
    category: 'Web Development',
    description: 'Responsive healthy food ordering website featuring interactive cart management, checkout form validation, and automated WhatsApp order dispatch.',
    image: 'assets/images/Sehatin-OrderWeb.png',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'WhatsApp API', 'UI/UX'],
    topics: ['food-order', 'e-commerce', 'whatsapp-api', 'frontend'],
    repository: 'https://github.com/iarchonn/Sehatin-OrderWeb',
    demo: '',
    featured: true,
    readme: `# Sehatin Order Web

A clean, responsive food ordering experience designed for healthy meals, clean eating, and seamless ordering.

### Features
- **Menu Catalog**: Nutritional breakdowns and healthy meal selection.
- **Interactive Shopping Cart**: Quantity adjustments, item deletion, subtotal calculations.
- **WhatsApp Checkout**: Auto-generates structured order messages sent directly to business WhatsApp.`
  },
  {
    id: 'web-school',
    repoName: 'web-school',
    title: 'School Institutional Portal',
    category: 'Web Development',
    description: 'Modern prototype for an educational school portal, presenting academic curriculum, announcements, admissions guidelines, and student activities.',
    image: 'assets/images/web-school.png',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'Web Design'],
    topics: ['school-website', 'education', 'prototype', 'ui-design'],
    repository: 'https://github.com/iarchonn/web-school',
    demo: '',
    featured: false,
    readme: `# School Website Prototype

A responsive institutional website concept designed for schools and learning academies.

### Sections
- **Hero & Mission**: School vision and principal address.
- **Academic Programs**: Curriculum highlights and faculty credentials.
- **News & Announcements**: Dynamic calendar and event updates.
- **Admissions**: Registration instructions and contact forms.`
  },
  {
    id: 'sadar-helm',
    repoName: 'SADAR-Helm',
    title: 'SADAR Smart Helmet Prototype',
    category: 'IoT / Hardware',
    description: 'Arduino-based smart helmet prototype that detects abnormal head movements as potential signs of microsleep and triggers an audible warning using an MPU-6050 sensor.',
    image: 'assets/images/SADAR-Helm.png',
    technologies: ['Arduino', 'C++', 'MPU-6050', 'Hardware Prototyping', 'Sensors'],
    topics: ['iot', 'arduino', 'microsleep-detection', 'mpu6050', 'hardware'],
    repository: 'https://github.com/iarchonn/SADAR-Helm',
    demo: '',
    featured: true,
    readme: `# SADAR Smart Helmet (Sistem Alarm Deteksi Kantuk)

An IoT safety device designed for motorcyclists to combat drowsiness and microsleep incidents on the road.

### Technical Details
- **Microcontroller**: Arduino Nano / Uno.
- **Motion Sensor**: MPU-6050 6-axis accelerometer & gyroscope.
- **Algorithm**: Tracks sudden pitch/roll head drops indicative of involuntary sleep lapses.
- **Alert System**: Piezoelectric buzzer delivers instant auditory alert to wake the rider.`
  }
];

export const CATEGORIES = [
  'All Projects',
  'Web Development',
  'Data Analysis & AI',
  'IoT / Hardware'
];
