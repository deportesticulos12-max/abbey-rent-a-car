// Fleet Page Interactivity

document.addEventListener('DOMContentLoaded', () => {

    // 1. Read URL params and populate summary bar
    const params = new URLSearchParams(window.location.search);
    const locationNames = {
        'caballito': 'Sucursal Caballito',
        'eze': 'Aeropuerto Ezeiza (EZE)',
        'aep': 'Aeroparque (AEP)'
    };

    const loc = params.get('location');
    const pickup = params.get('pickup');
    const returnDate = params.get('return');

    if (loc && locationNames[loc]) {
        document.getElementById('summaryLocation').textContent = locationNames[loc];
    }

    if (pickup) {
        document.getElementById('summaryPickup').textContent = new Date(pickup + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    if (returnDate) {
        document.getElementById('summaryReturn').textContent = new Date(returnDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    if (pickup && returnDate) {
        const days = Math.ceil((new Date(returnDate) - new Date(pickup)) / (1000 * 60 * 60 * 24));
        document.getElementById('summaryDays').textContent = days > 0 ? days : '--';
    }

    // 2. Category filters
    const fleetCards = document.querySelectorAll('.fleet-card');
    const resultsCounter = document.querySelector('.fleet-results strong');

    function applyFilters() {
        const categoryChecks = document.querySelectorAll('.filter-group input[value="economy"], .filter-group input[value="familiar"], .filter-group input[value="confort"], .filter-group input[value="utilitario"]');
        const checkedCategories = [...categoryChecks].filter(cb => cb.checked).map(cb => cb.value);

        const transChecks = document.querySelectorAll('.filter-group input[value="manual"], .filter-group input[value="auto"]');
        const checkedTrans = [...transChecks].filter(cb => cb.checked).map(cb => cb.value);

        let visible = 0;
        fleetCards.forEach(card => {
            const cat = card.dataset.category;
            const trans = card.dataset.transmission;
            if (checkedCategories.includes(cat) && checkedTrans.includes(trans)) {
                card.style.display = '';
                visible++;
            } else {
                card.style.display = 'none';
            }
        });
        resultsCounter.textContent = visible;
    }

    const filterCheckboxes = document.querySelectorAll('.filter-checkbox input');
    filterCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    // 3. Sorting logic
    const sortSelect = document.querySelector('.filter-select');
    const fleetContainer = document.querySelector('.fleet-list');

    function applySorting() {
        const sortBy = sortSelect.value;
        const cards = Array.from(document.querySelectorAll('.fleet-card'));

        cards.sort((a, b) => {
            const isFiorinoA = a.querySelector('h3').textContent.includes('Fiorino');
            const isFiorinoB = b.querySelector('h3').textContent.includes('Fiorino');

            // Fiorino always goes last
            if (isFiorinoA && !isFiorinoB) return 1;
            if (!isFiorinoA && isFiorinoB) return -1;
            if (isFiorinoA && isFiorinoB) return 0;

            if (sortBy.startsWith('price')) {
                const priceA = parseInt(a.querySelector('.price-value').textContent.replace(/[^\d]/g, ''));
                const priceB = parseInt(b.querySelector('.price-value').textContent.replace(/[^\d]/g, ''));
                return sortBy === 'price-asc' ? priceA - priceB : priceB - priceA;
            } else if (sortBy === 'category') {
                const catA = a.dataset.category.toLowerCase();
                const catB = b.dataset.category.toLowerCase();
                return catA.localeCompare(catB);
            }
            return 0;
        });

        // Re-append cards in new order
        cards.forEach(card => fleetContainer.appendChild(card));
    }

    sortSelect.addEventListener('change', applySorting);

    // Run sorting once at start if default is set
    applySorting();

    // 4. Reserve button → redirect to checkout
    const categoryLabels = {
        'economy': 'Económico',
        'familiar': 'Familiar',
        'confort': 'Confort',
        'utilitario': 'Utilitario'
    };

    document.querySelectorAll('.fleet-card .btn-primary, .fleet-card .btn-secondary').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.fleet-card');
            const carName = card.querySelector('h3').childNodes[0].textContent.trim();
            const category = card.dataset.category;
            const categoryName = categoryLabels[category] || category;
            const paymentMethod = btn.classList.contains('btn-primary') ? 'now' : 'dest';
            const priceText = btn.closest('.price-option').querySelector('.price-value').textContent;
            const price = priceText.replace(/[^\d]/g, '');

            const carImg = card.querySelector('.car-photo').getAttribute('src');
            const checkoutParams = new URLSearchParams({
                location: params.get('location') || '',
                pickup: params.get('pickup') || '',
                return: params.get('return') || '',
                car: carName,
                category: categoryName,
                price: price,
                payment: paymentMethod,
                img: carImg
            });

            window.location.href = 'checkout.html?' + checkoutParams.toString();
        });
    });
});
