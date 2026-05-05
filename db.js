const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1gWb6JKa4esdFDuS9DEJ-6b82PeBT2vvZy6U53mufyAu_g9-v6Ep51sNmBkzrJfzQGg7LImhcPzNU/pub?output=csv';

window.carDatabase = {};
window.isDatabaseReady = false;

async function initDatabase() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        // Limpiar la base de datos antes de cargar
        window.carDatabase = {};
        
        // Empezar desde i=1 para saltar el encabezado
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Dividir por coma o punto y coma (según la región) y limpiar posibles caracteres raros
            let parts = line.split(',');
            if (parts.length < 4) parts = line.split(';');
            
            if (parts.length >= 4) {
                const vehiculo = parts[0].trim().toLowerCase();
                // Eliminar cualquier caracter que no sea número antes de parsear
                const precio = parseInt(parts[1].replace(/[^\d]/g, '')) || 0;
                const franquicia = parseInt(parts[2].replace(/[^\d]/g, '')) || 0;
                const smartCover = parseInt(parts[3].replace(/[^\d]/g, '')) || 0;
                const oferta = parts[4] ? (parseInt(parts[4].replace(/[^\d]/g, '')) || 0) : 0;
                
                window.carDatabase[vehiculo] = {
                    precio: precio,
                    franquicia: franquicia,
                    smartCover: smartCover,
                    oferta: oferta
                };
            }
        }
        
        console.log('Base de datos ABBEY cargada:', window.carDatabase);
        
    } catch (error) {
        console.error('Error cargando la base de datos de precios desde Google Sheets:', error);
    } finally {
        window.isDatabaseReady = true;
        window.dispatchEvent(new CustomEvent('databaseReady'));
        updatePricesOnPage();
    }
}

function updatePricesOnPage() {
    // Buscar elementos que tengan el atributo data-car-name
    const elements = document.querySelectorAll('[data-car-name]');
    
    // Calcular la oferta máxima directamente desde la base de datos
    // (no depende de que haya tarjetas con data-car-name en la página)
    let maxOffer = 0;
    for (const key in window.carDatabase) {
        if (window.carDatabase[key].oferta > maxOffer) {
            maxOffer = window.carDatabase[key].oferta;
        }
    }
    
    elements.forEach(el => {
        const carName = (el.getAttribute('data-car-name') || '').trim().toLowerCase();
        const data = window.carDatabase[carName];
        
        if (data) {

            // Buscamos clases comunes donde se muestran precios
            const target = el.querySelector('.price-value') || el.querySelector('.dynamic-price');
            
            if (target) {
                const formatter = new Intl.NumberFormat('es-AR', { 
                    style: 'currency', 
                    currency: 'ARS', 
                    maximumFractionDigits: 0 
                });

                const originalPrice = data.precio;
                const discount = data.oferta || 0;

                if (discount > 0) {
                    const discountedPrice = Math.round(originalPrice * (1 - discount / 100));
                    
                    // Si es una tarjeta de flota, solemos tener el prefijo "Desde"
                    const prefix = target.classList.contains('price-tag') ? 'Desde ' : '';
                    
                    // Ajustar alineación según el contexto
                    const isCheckout = el.closest('.checkout-sidebar') || el.classList.contains('price-total');
                    const alignment = isCheckout ? 'flex-end' : 'flex-start';

                    target.innerHTML = `
                        <div class="price-container" style="align-items: ${alignment};">
                            <span class="price-original">${prefix}${formatter.format(originalPrice)}</span>
                            <span class="price-new">${prefix}${formatter.format(discountedPrice)} <span class="offer-badge">-${discount}%</span></span>
                        </div>
                    `;
                } else {
                    const formatted = formatter.format(originalPrice);
                    if (target.classList.contains('price-tag')) {
                        target.textContent = `Desde ${formatted}/día`;
                    } else {
                        target.textContent = formatted;
                    }
                }
            }
        }
    });

    // Actualizar cartel de oferta en el Index si existe
    const dynamicCard = document.getElementById('dynamicPromoCard');
    const dynamicBadge = document.getElementById('dynamicOfferBadge');
    if (maxOffer > 0) {
        if (dynamicBadge) dynamicBadge.textContent = `¡Hasta ${maxOffer}% OFF!`;
        if (dynamicCard) dynamicCard.style.display = 'flex';
    } else {
        if (dynamicCard) dynamicCard.style.display = 'none';
    }
}

// Iniciar la carga
initDatabase();
