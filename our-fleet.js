document.addEventListener('DOMContentLoaded', () => {
    // Category & Transmission filters
    const fleetCards = document.querySelectorAll('.showcase-card');
    const resultsCounter = document.querySelector('.fleet-results strong');
    const filterSelect = document.querySelector('.filter-select');
    const fleetListSection = document.querySelector('.fleet-list');

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
        sortFleet(); // Re-apply sorting on visible cards
    }

    const filterCheckboxes = document.querySelectorAll('.filter-checkbox input');
    filterCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    // Sorting logic
    function sortFleet() {
        const order = filterSelect.value;
        const cardsArray = Array.from(fleetCards);

        cardsArray.sort((a, b) => {
            if (order === 'category') {
                const catA = a.dataset.category;
                const catB = b.dataset.category;
                return catA.localeCompare(catB);
            } else {
                // sort by price
                const priceTextA = a.querySelector('.price-value').textContent;
                const priceTextB = b.querySelector('.price-value').textContent;
                const priceA = parseInt(priceTextA.replace(/[^\d]/g, ''), 10);
                const priceB = parseInt(priceTextB.replace(/[^\d]/g, ''), 10);

                return order === 'price-asc' ? priceA - priceB : priceB - priceA;
            }
        });

        // Append sorted cards back to the container
        cardsArray.forEach(card => fleetListSection.appendChild(card));
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', sortFleet);
    }
});
