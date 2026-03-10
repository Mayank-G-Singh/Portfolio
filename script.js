document.body.style.opacity = 0;

window.addEventListener("load", () => {
  document.body.style.transition = "opacity 0.6s";
  document.body.style.opacity = 1;
});

/* -----------------------------
   Fetch GitHub Language Colors
   ----------------------------- */

let languageColors = {};

async function fetchLanguageColors() {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/ozh/github-colors@master/colors.json",
    );
    if (!res.ok) throw new Error("Failed to load colors");
    languageColors = await res.json();
  } catch (err) {
    console.warn("Language colors failed to load", err);
    languageColors = {};
  }
}

/* Case‑insensitive lookup */
function getLanguageColor(lang) {
  if (!lang) return "#6c757d"; // fallback gray
  const nameLower = lang.toLowerCase();
  for (const key in languageColors) {
    if (key.toLowerCase() === nameLower) {
      return languageColors[key].color || "#6c757d";
    }
  }
  return "#6c757d";
}

function getContrastColor(hex){

  hex = hex.replace("#","");

  const r = parseInt(hex.substring(0,2),16);
  const g = parseInt(hex.substring(2,4),16);
  const b = parseInt(hex.substring(4,6),16);

  const brightness = (r*299 + g*587 + b*114) / 1000;

  return brightness > 155 ? "#000000" : "#ffffff";

}

/* -----------------------------
   Load GitHub Repos
   ----------------------------- */
   
async function loadProjects() {
  await fetchLanguageColors();

  const username = "Mayank-G-Singh";
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?sort=created`,
  );
  const repos = await response.json();

  const container = document.getElementById("projectsContainer");
  if (!container) return;

  repos.filter((repo) => !repo.fork);
  for (const repo of repos.filter((repo) => !repo.fork)) {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4";

    const langs = await getRepoLanguages(repo);

    /* choose which languages to show */

    const visibleLangs = langs
      .filter((l) => l.percent >= 5) // show only >=5%
      .slice(0, 3); // max 3 languages

    const langBadges = visibleLangs
      .map((lang) => {
        const color = getLanguageColor(lang.name);

        return `
      <span class="badge language-badge"
            style="background:${color};
            color:${getContrastColor(color)};">
        ${lang.name}
      </span>
      `;
      
      }).join("");

    card.innerHTML = `

  <div class="card h-100 p-4 d-flex flex-column">

    <h5 class="mb-2">${repo.name}</h5>

    <p class="text-secondary small">
      ${repo.description || "No description provided."}
    </p>

    <div class="mt-auto">

      <div class="mb-3">
        ${langBadges}
        <span class="badge bg-dark border">⭐ ${repo.stargazers_count}</span>
      </div>

      <a href="${repo.html_url}" target="_blank" rel="noopener"
         class="btn btn-primary w-100">
         View Repository
      </a>

    </div>

  </div>

  `;

    container.appendChild(card);
  }
}

async function getRepoLanguages(repo) {
  const res = await fetch(repo.languages_url);
  const data = await res.json();

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  const langs = Object.entries(data).map(([name, bytes]) => {
    return {
      name,
      percent: ((bytes / total) * 100).toFixed(1),
    };
  });

  return langs;
}

loadProjects();
