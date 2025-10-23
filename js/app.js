
const API = {
    searchByName: (q) =>
        fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`),
    filterByIngredient: (i) =>
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(i)}`),
    lookupById: (id) =>
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`)
};

const els = {
    form: document.getElementById('search-form'),
    query: document.getElementById('query'),
    sort: document.getElementById('sort'),
    status: document.getElementById('status'),
    grid: document.getElementById('grid'),
    tplCard: document.getElementById('card-template'),
    details: document.getElementById('details'),
    closeDetails: document.getElementById('close-details'),
    dThumb: document.getElementById('details-thumb'),
    dName: document.getElementById('details-name'),
    dCategory: document.getElementById('details-category'),
    dArea: document.getElementById('details-area'),
    dIngredients: document.getElementById('details-ingredients'),
    dInstructions: document.getElementById('details-instructions'),
    dSource: document.getElementById('details-source'),
};

let currentMeals = [];

(function init() {
    const saved = JSON.parse(localStorage.getItem('rf:last') || 'null');
    if (saved?.query) {
        els.query.value = saved.query;
        [...els.form.elements['mode']].forEach(r => (r.checked = r.value === saved.mode));
        els.sort.value = saved.sort || 'az';
        performSearch(saved.query, saved.mode, false);
    } else {
        els.query.value = 'chicken';
        performSearch('chicken', 'name', false);
    }
})();

/* == Events ==*/
els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = els.query.value.trim();
    const mode = els.form.elements['mode'].value; // 'name' | 'ingredient'
    if (!q) return;
    performSearch(q, mode, true);
});

els.sort.addEventListener('change', () => {
    currentMeals = sortMeals(currentMeals, els.sort.value);
    renderMeals(currentMeals);
});

els.closeDetails.addEventListener('click', () => {
    els.details.setAttribute('hidden', '');
    els.details.setAttribute('aria-hidden', 'true');
});
els.details.addEventListener('click', (e) => {
    if (e.target === els.details) els.closeDetails.click();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.details.hasAttribute('hidden')) els.closeDetails.click();
});

async function performSearch(query, mode, persist = true) {
    setStatus('Searching…');

    try {
        const resp = mode === 'ingredient'
            ? await API.filterByIngredient(query)
            : await API.searchByName(query);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        let meals = data.meals || [];

        if (meals.length === 0) {
            currentMeals = [];
            renderMeals(currentMeals);
            setStatus('No results.');
            return;
        }

        currentMeals = sortMeals(meals, els.sort.value);
        renderMeals(currentMeals);
        setStatus(`${meals.length} result${meals.length === 1 ? '' : 's'}.`);

        if (persist) {
            localStorage.setItem('rf:last', JSON.stringify({ query, mode, sort: els.sort.value }));
        }
    } catch (err) {
        console.error(err);
        setStatus('Something went wrong. Check your network or try another search.', true);
    }
}

function sortMeals(meals, order = 'az') {
    const copy = [...meals];
    const name = (m) => (m.strMeal || '').toLowerCase();
    copy.sort((a, b) => name(a).localeCompare(name(b), 'en'));
    if (order === 'za') copy.reverse();
    return copy;
}

function renderMeals(meals) {
    els.grid.innerHTML = '';
    if (!meals?.length) return;

    const frag = document.createDocumentFragment();

    meals.forEach(meal => {
        const card = els.tplCard.content.firstElementChild.cloneNode(true);
        const img = card.querySelector('.card-thumb');
        const title = card.querySelector('.card-title');
        const meta = card.querySelector('.card-meta');
        const btn = card.querySelector('.btn-details');

        img.src = meal.strMealThumb;
        img.alt = meal.strMeal ? `Photo of ${meal.strMeal}` : 'Meal';
        title.textContent = meal.strMeal || 'Untitled recipe';
        meta.textContent = [meal.strArea, meal.strCategory].filter(Boolean).join(' • ');

        btn.addEventListener('click', () => openDetails(meal.idMeal));
        frag.appendChild(card);
    });

    els.grid.appendChild(frag);
}

async function openDetails(id) {
    setStatus('Fetching details…');
    try {
        const res = await API.lookupById(id);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const meal = data.meals?.[0] || null;
        if (!meal) throw new Error('Empty response');

        els.dThumb.src = meal.strMealThumb;
        els.dThumb.alt = meal.strMeal ? `Photo of ${meal.strMeal}` : 'Meal';
        els.dName.textContent = meal.strMeal ?? '—';
        els.dCategory.textContent = meal.strCategory ?? '—';
        els.dArea.textContent = meal.strArea ?? '—';
        els.dInstructions.textContent = (meal.strInstructions || '').trim() || '—';

        els.dIngredients.innerHTML = '';
        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ing && ing.trim()) {
                const li = document.createElement('li');
                li.textContent = `${ing}${measure?.trim() ? ` — ${measure.trim()}` : ''}`;
                els.dIngredients.appendChild(li);
            }
        }

        const src = meal.strSource || meal.strYoutube || '#';
        els.dSource.href = src;
        els.dSource.textContent = src === '#' ? 'No source' : 'Source';

        els.details.removeAttribute('hidden');
        els.details.removeAttribute('aria-hidden');
        setStatus('Details loaded.');
    } catch (err) {
        console.error(err);
        setStatus('Could not fetch details.', true);
    }
}

function setStatus(text, isError = false) {
    els.status.textContent = text;
    els.status.style.color = isError ? '#e03131' : 'var(--muted)';
}
