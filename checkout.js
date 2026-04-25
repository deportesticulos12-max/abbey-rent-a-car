// Checkout Page Interactivity

// Helper for stepper navigation
function goBackToFleet() {
    const params = new URLSearchParams(window.location.search);
    const fleetParams = new URLSearchParams({
        location: params.get('location') || '',
        pickup: params.get('pickup') || '',
        return: params.get('return') || ''
    });
    window.location.href = 'fleet.html?' + fleetParams.toString();
}

document.addEventListener('DOMContentLoaded', () => {

    // 1. Read URL params
    const params = new URLSearchParams(window.location.search);
    const locationMap = {
        'caballito': 'Oficina Caballito',
        'eze': 'Aeropuerto Ezeiza (EZE)',
        'aep': 'Aeroparque (AEP)'
    };

    const loc = params.get('location');
    const pickup = params.get('pickup');
    const returnDate = params.get('return');
    const carName = params.get('car') || 'Fiat Cronos';
    const category = params.get('category') || 'Económico';
    let dailyRate = parseInt(params.get('price') || '45000');
    const carImg = params.get('img');
    const payMethod = params.get('method') || 'destination';

    // Populate sidebar
    document.getElementById('sidebarCarName').textContent = carName + ' o similar';
    document.getElementById('sidebarCategory').textContent = category;
    
    if (carImg) {
        document.getElementById('sidebarCarImg').src = carImg;
    }

    if (loc && locationMap[loc]) {
        document.getElementById('sidebarLocation').textContent = locationMap[loc];
    }
    if (pickup) {
        document.getElementById('sidebarPickup').textContent = formatDate(pickup);
    }
    if (returnDate) {
        document.getElementById('sidebarReturn').textContent = formatDate(returnDate);
    }

    let days = 1;
    if (pickup && returnDate) {
        const d1 = new Date(pickup);
        const d2 = new Date(returnDate);
        days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
        document.getElementById('sidebarDays').textContent = days + ' día' + (days > 1 ? 's' : '');
    }

    document.getElementById('sidebarDailyRate').textContent = formatPrice(dailyRate) + '/día';

    // 1.5. Deductible (Franquicia) y Precios Dinámicos
    let deductible = 1000000; // Default
    let smartCoverPrice = 8500; // Default
    let protectionPlusPrice = 13600; // Default

    // Extras que se cobran POR DÍA
    let extraPrices = {
        'smart_cover': smartCoverPrice,
        'protection_plus': protectionPlusPrice,
        'extra_driver': 0,
        'baby_seat': 4000,
        'booster': 4000
    };

    // Extras que se cobran UNA SOLA VEZ (precio fijo por alquiler)
    const extraPricesFixed = {
        'pet_kit': 25000
    };

    function applyDatabasePrices() {
        const data = window.carDatabase[carName.trim().toLowerCase()];
        if (data) {
            console.log('Aplicando precios de DB para:', carName, data);
            
            // Actualizar Precio Diario Base
            if (data.precio) {
                dailyRate = data.precio;
            }

            // Actualizar Franquicia
            deductible = data.franquicia;
            document.getElementById('sidebarFranquicia').textContent = formatPrice(deductible);

            // Actualizar Coberturas
            smartCoverPrice = data.smartCover;
            protectionPlusPrice = Math.round(smartCoverPrice * 1.6);

            const smartCoverDisplay = document.getElementById('smartCoverPriceDisplay');
            if (smartCoverDisplay) smartCoverDisplay.textContent = `+$${smartCoverPrice.toLocaleString('es-AR')}/día`;
            
            const protectionPlusDisplay = document.getElementById('protectionPlusPriceDisplay');
            if (protectionPlusDisplay) protectionPlusDisplay.textContent = `+$${protectionPlusPrice.toLocaleString('es-AR')}/día`;

            // Actualizar el mapa de extras
            extraPrices['smart_cover'] = smartCoverPrice;
            extraPrices['protection_plus'] = protectionPlusPrice;

            updateTotal();
        }
    }

    // Escuchar a la base de datos
    if (window.isDatabaseReady) {
        applyDatabasePrices();
    } else {
        window.addEventListener('databaseReady', applyDatabasePrices);
    }

    // Llamada inicial
    updateTotal();

    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', updateTotal);
    });

    function updateTotal() {
        let extrasDailyTotal = 0;
        let extrasFixedTotal = 0;

        document.querySelectorAll('.toggle-switch input:checked').forEach(toggle => {
            const name = toggle.getAttribute('name');
            if (extraPrices[name] !== undefined) extrasDailyTotal += extraPrices[name];
            if (extraPricesFixed[name] !== undefined) extrasFixedTotal += extraPricesFixed[name];
        });

        // 1. Calcular Descuento Manual (Oferta del Sheets)
        const dbData = window.carDatabase[carName.trim().toLowerCase()];
        const manualDiscountPercent = dbData ? (dbData.oferta || 0) : 0;
        const manualDiscountFactor = 1 - (manualDiscountPercent / 100);
        
        let rateAfterManualDiscount = dailyRate * manualDiscountFactor;

        // 2. Calcular Descuento 6+1 (Automático)
        let finalDailyRate = rateAfterManualDiscount;
        const isPromo6plus1 = days >= 7;
        if (isPromo6plus1) {
            finalDailyRate = rateAfterManualDiscount * (6 / 7);
        }

        // --- Actualización Visual Sidebar Daily Rate ---
        const sidebarDailyRate = document.getElementById('sidebarDailyRate');
        if (manualDiscountPercent > 0) {
            sidebarDailyRate.innerHTML = `
                <div class="price-container">
                    <span class="price-original">${formatPrice(dailyRate)}/día</span>
                    <span class="price-new">${formatPrice(Math.round(rateAfterManualDiscount))}/día <span class="offer-badge">-${manualDiscountPercent}%</span></span>
                </div>
            `;
        } else {
            sidebarDailyRate.textContent = formatPrice(Math.round(dailyRate)) + '/día';
        }

        // --- Actualización Visual Franquicia ---
        const isProtectionPlusChecked = document.querySelector('input[name="protection_plus"]')?.checked;
        const currentDeductible = isProtectionPlusChecked ? (deductible * 0.5) : deductible;
        const sidebarFranquicia = document.getElementById('sidebarFranquicia');
        if (sidebarFranquicia) {
            sidebarFranquicia.textContent = formatPrice(currentDeductible);
        }

        // --- Actualización Visual Extras ---
        const extrasRow = document.getElementById('extrasRow');
        const sidebarExtras = document.getElementById('sidebarExtras');
        const extrasTotal = extrasDailyTotal * days + extrasFixedTotal;
        if (extrasTotal > 0) {
            extrasRow.style.display = 'flex';
            sidebarExtras.textContent = formatPrice(extrasTotal);
        } else {
            extrasRow.style.display = 'none';
        }

        // --- Actualización Visual Promo 6+1 ---
        const promoRow = document.getElementById('promoRow');
        if (isPromo6plus1) {
            if (promoRow) promoRow.style.display = 'flex';
        } else {
            if (promoRow) promoRow.style.display = 'none';
        }

        // --- Cálculo del TOTAL Final ---
        const totalBaseOriginal = dailyRate * days + extrasTotal;
        const totalConDescuentos = (finalDailyRate + extrasDailyTotal) * days + extrasFixedTotal;

        const sidebarTotal = document.getElementById('sidebarTotal');
        if (totalConDescuentos < totalBaseOriginal) {
            // Calcular porcentaje total de ahorro para el badge
            const totalSavingsPercent = Math.round((1 - (totalConDescuentos / totalBaseOriginal)) * 100);
            
            sidebarTotal.innerHTML = `
                <div class="price-container">
                    <span class="price-original">${formatPrice(Math.round(totalBaseOriginal))}</span>
                    <span class="price-new">${formatPrice(Math.round(totalConDescuentos))} <span class="offer-badge">-${totalSavingsPercent}%</span></span>
                </div>
            `;
        } else {
            sidebarTotal.textContent = formatPrice(Math.round(totalConDescuentos));
        }
    }

    // 3. Form submission — sends an availability inquiry via WhatsApp and redirects to success page
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('.btn-reserve');
            const originalBtnContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Procesando...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            // Collect User Data
            const name = document.getElementById('userName').value;
            const surname = document.getElementById('userSurname').value;
            const email = document.getElementById('userEmail').value;
            const phone = document.getElementById('userPhone').value;

            // Collect Extras
            const selectedExtras = [];
            document.querySelectorAll('.toggle-switch input:checked').forEach(toggle => {
                const label = toggle.closest('.extra-card').querySelector('h4').textContent;
                selectedExtras.push(label);
            });

            const pickupStr = formatDate(pickup);
            const returnStr = formatDate(returnDate);
            const totalStr = document.getElementById('sidebarTotal').textContent;

            const locName = document.getElementById('sidebarLocation').textContent;

            // Construct WhatsApp Message (Clean Text Version)
            let message = `*CONSULTA DE DISPONIBILIDAD - ABBEY RENT A CAR*\n\n`;
            message += `*VEHICULO:* ${carName}\n`;
            message += `*RETIRO:* ${pickupStr} (${locName})\n`;
            message += `*DEVOLUCION:* ${returnStr} (${locName})\n`;
            message += `*DURACION:* ${days} día${days > 1 ? 's' : ''}\n`;
            message += `*PRECIO REF:* ${totalStr}\n\n`;
            
            message += `*DATOS DEL CLIENTE:*\n`;
            message += `*Nombre:* ${name} ${surname}\n`;
            message += `*Teléfono:* ${phone}\n`;
            message += `*Email:* ${email}\n\n`;

            if (selectedExtras.length > 0) {
                message += `*EXTRAS:* ${selectedExtras.join(', ')}\n`;
            }

            message += `\n_Consulta enviada desde la web oficial._`;

            const waUrl = `https://wa.me/5491163842564?text=${encodeURIComponent(message)}`;

            // --- Google Sheets Integration (Background) ---
            // Calculate numeric total for the sheet (pure number, no formatting symbols)
            let extrasTotalSheet = 0;
            document.querySelectorAll('.toggle-switch input:checked').forEach(toggle => {
                const extraName = toggle.getAttribute('name');
                if (extraPrices[extraName] !== undefined) {
                    extrasTotalSheet += extraPrices[extraName];
                }
            });

            // Re-apply 6+1 logic for final total
            let extrasDailySheet = 0;
            let extrasFixedSheet = 0;
            document.querySelectorAll('.toggle-switch input:checked').forEach(toggle => {
                const extraName = toggle.getAttribute('name');
                if (extraPrices[extraName] !== undefined) {
                    extrasDailySheet += extraPrices[extraName];
                }
                if (extraPricesFixed[extraName] !== undefined) {
                    extrasFixedSheet += extraPricesFixed[extraName];
                }
            });

            let effectiveDailyRateSubmit = dailyRate;
            if (days >= 7) {
                effectiveDailyRateSubmit = dailyRate * (6 / 7);
            }
            const numericTotal = (effectiveDailyRateSubmit + extrasDailySheet) * days + extrasFixedSheet;

            const sheetData = {
                name: name,
                surname: surname,
                email: email,
                phone: phone,
                carName: carName,
                location: locName,
                pickup: pickupStr,
                return: returnStr,
                days: days,
                extras: selectedExtras.join(', '),
                total: Math.round(numericTotal)
            };

            console.log('Sending data to Sheet:', sheetData); // Debug log

            fetch('https://script.google.com/macros/s/AKfycbw4lYIUCAWRY4vlnH9SaBRr2WIZOBucb1ybU3nrd7aYS-CQjTKM1M71KYFVc423wVq5/exec', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sheetData)
            }).catch(err => console.error('Sheet sync error:', err));
            // ---------------------------------------------

            // Guardar el mensaje en sessionStorage de forma segura
            sessionStorage.setItem('waMessage', message);

            // Redirection logic
            setTimeout(() => {
                // Just go to success page
                window.location.href = 'success.html';
            }, 800);
        });
    }

    // Helpers
    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function formatPrice(num) {
        return '$' + num.toLocaleString('es-AR');
    }
});

// Inject spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .animate-spin {
        animation: spin 1s linear infinite;
        display: inline-block;
    }
`;
document.head.appendChild(style);
