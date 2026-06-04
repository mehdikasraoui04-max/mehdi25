const API = (location.protocol === 'file:')
  ? 'file:///C:/Users/pc/Downloads/mealdb_mini_app.html'
  : 'https://www.themealdb.com/api/json/v1/1';

// ── BLOC 1 : Navigation entre écrans ──────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  document.getElementById('screen-' + name).classList.add('active');
}

// ── BLOC 2 : Appels API ───────────────────────────────

// API 1 — Toutes les catégories
async function loadCategories() {
  const res = await fetch(`${API}/categories.php`);
  const data = await res.json();
  return data.categories; // tableau d'objets
}

// API 2 — Plats d'une catégorie
async function filterByCategory(category) {
  // When testing locally (file://), try to read a local JSON test file.
  if (location.protocol === 'file:') {
    try {
      const res = await fetch('mealdb_mini_app.json');
      const data = await res.json();
      return data.meals || [];
    } catch (err) {
      console.warn('Local test file for filterByCategory not found or invalid', err);
      return [];
    }
  }

  const res = await fetch(`${API}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json();
  return data.meals;
}

// API 3 — Recherche par nom
async function searchByName(name) {
  const res = await fetch(`${API}/search.php?s=${name}`);
  const data = await res.json();
  return data.meals; // null si rien trouvé
}

// Détail d'un plat
async function getMealById(id) {
  const res = await fetch(`${API}/lookup.php?i=${id}`);
  const data = await res.json();
  return data.meals[0];
}

// ── BLOC 3 : Affichage dans le DOM ────────────────────

async function doSearch() {
  const query = document.getElementById('search-input').value;
  const meals = await searchByName(query);
  const container = document.getElementById('search-results');

  if (!meals) {
    container.innerHTML = '<p>Aucun résultat.</p>';
    return;
  }

  container.innerHTML = meals.map(meal => `
    <div class="card" onclick="openMeal(${meal.idMeal})">
      <img src="${meal.strMealThumb}/preview" />
      <p>${meal.strMeal}</p>
    </div>
  `).join('');
}

async function openMeal(id) {
  const meal = await getMealById(id);
  alert(meal.strMeal + '\n\n' + meal.strInstructions.slice(0, 200) + '...');
  // → remplace alert par un vrai écran détail
}
function showMeals() {
    const results = document.getElementById("home-results");

    results.innerHTML = `
        <div class="meal">
            <img src="images/food1.jpg" alt="Meal">
            <h3>Pizza</h3>
        </div>
    `;
}
// If running the page from the local filesystem, try to load a local test file.
// Place `mealdb_mini_app.html` or a JSON test file in the project root for easier local testing.
if (location.protocol === 'file:') {
  fetch('mealdb_mini_app.html')
    .then(resp => {
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return resp.json().then(data => ({ type: 'json', data }));
      }
      return resp.text().then(text => ({ type: 'html', text }));
    })
    .then(result => {
      const results = document.getElementById('home-results');
      if (!results) return;
      if (result.type === 'json') {
        const meals = result.data.meals || [];
        results.innerHTML = meals.map(meal => `
          <div class="meal">
            <img src="${meal.strMealThumb}" />
            <h3>${meal.strMeal}</h3>
          </div>
        `).join('');
      } else {
        // If the local file is HTML, show a simple notice so you know it was loaded.
        results.innerHTML = '<div class="empty">Local test file loaded. If you want JSON data, put a JSON file named mealdb_mini_app.html (or change the path) in the project root.</div>';
      }
    })
    .catch(err => {
      console.warn('No local test file found or failed to read it', err);
    });
}
// convert_html_to_json.js
// Usage: node convert_html_to_json.js
// Requires: npm install cheerio
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const inputFile = path.join(__dirname, 'downloaded_mealdb.html');
const outFile = path.join(__dirname, 'mealdb_mini_app_full.json');

if (!fs.existsSync(inputFile)) {
  console.error('Error: downloaded_mealdb.html not found in project root.');
  process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');
const $ = cheerio.load(html);

// Heuristic selectors - adjust if needed for your downloaded HTML
const candidateSelectors = ['.meal', '.meal-card', '.card', '.recipe', 'article', '.result', '.search-result', '.col-md-4'];

let nodes = [];
for (const sel of candidateSelectors) {
  const found = $(sel);
  if (found && found.length) {
    found.each((i, el) => nodes.push(el));
    if (nodes.length) break;
  }
}

// Fallback: find elements that contain an image + heading
if (!nodes.length) {
  $('img').each((i, el) => {
    const parent = $(el).closest('div, article');
    if (parent && parent.length) nodes.push(parent[0]);
  });
}

// Deduplicate by HTML
nodes = Array.from(new Map(nodes.map(n => [$(n).html(), n])).values());

const meals = [];
nodes.forEach((n, idx) => {
  const node = $(n);
  let name = node.find('.meal-name, .name, .title, h3, h2, h1').first().text().trim();
  if (!name) {
    name = node.contents().filter(function() { return this.type === 'text'; }).text().trim();
  }
  let img = node.find('img').first().attr('src') || '';
  let id = node.attr('data-id') || node.attr('id') || '';
  if (!id) {
    const anchor = node.find('a[href*="lookup.php?i="]');
    if (anchor && anchor.length) {
      const m = anchor.attr('href').match(/lookup\.php\?i=(\d+)/);
      if (m) id = m[1];
    }
  }
  if (!id) id = String(100000 + idx);
  if (img && img.startsWith('//')) img = 'https:' + img;
  if (name) meals.push({ idMeal: id, strMeal: name, strMealThumb: img });
});

// Final fallback: try to build from images + alt text
if (!meals.length) {
  $('img').each((i, im) => {
    const node = $(im);
    const src = node.attr('src') || '';
    const title = node.attr('alt') || node.parent().find('h3, h2, h1').first().text().trim() || '';
    if (title) meals.push({ idMeal: String(200000 + i), strMeal: title, strMealThumb: src });
  });
}

fs.writeFileSync(outFile, JSON.stringify({ meals }, null, 2), 'utf8');
console.log('Wrote', outFile, 'with', meals.length, 'meals.');