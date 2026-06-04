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
  const res = await fetch(`${API}/filter.php?c=${category}`);
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