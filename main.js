// Main Interactivity for Abbery Rent a Car

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const bookingForm = document.getElementById('bookingForm');
    
    // 1. Sticky Navbar Transition
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Update active link on scroll
        highlightNavOnScroll();
    });

    // 2. Time selector logic
    const pickupTimeSelect = document.getElementById('pickupTime');
    const returnTimeSelect = document.getElementById('returnTime');

    // Generate time options from 09:00 to 18:00 in 15-min intervals
    function populateTimeOptions(selectEl, minTime) {
        const currentVal = selectEl.value;
        selectEl.innerHTML = '';
        for (let h = 9; h <= 18; h++) {
            for (let m = 0; m < 60; m += 15) {
                if (h === 18 && m > 0) break; // Stop at 18:00
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                if (minTime && timeStr < minTime) continue;
                const opt = document.createElement('option');
                opt.value = timeStr;
                opt.textContent = timeStr;
                selectEl.appendChild(opt);
            }
        }
        // Restore previous value if still available, else keep first option
        if (currentVal && selectEl.querySelector(`option[value="${currentVal}"]`)) {
            selectEl.value = currentVal;
        }
    }

    // Get the earliest pickup time allowed for today (now + 2 hours, rounded to 15 min)
    function getMinPickupTimeToday() {
        const now = new Date();
        now.setHours(now.getHours() + 2);
        const remainder = now.getMinutes() % 15;
        if (remainder > 0) now.setMinutes(now.getMinutes() + (15 - remainder));
        now.setSeconds(0, 0);

        const h = now.getHours();
        const m = now.getMinutes();
        if (h > 18 || (h === 18 && m > 0)) return null; // No time available today
        if (h < 9) return '09:00';
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Initialize time selects
    if (pickupTimeSelect && returnTimeSelect) {
        populateTimeOptions(pickupTimeSelect, null);
        populateTimeOptions(returnTimeSelect, null);
        // Default both to 10:00
        pickupTimeSelect.value = '10:00';
        returnTimeSelect.value = '10:00';

        // Sync: when pickup time changes, set return time to same value
        pickupTimeSelect.addEventListener('change', () => {
            const val = pickupTimeSelect.value;
            if (returnTimeSelect.querySelector(`option[value="${val}"]`)) {
                returnTimeSelect.value = val;
            }
        });
    }

    // 2b. Date range selection (Flatpickr) with same-day time validation
    const pickupInput = document.getElementById('pickupDate');
    const returnInput = document.getElementById('returnDate');

    if (pickupInput && returnInput && typeof flatpickr !== 'undefined') {
        const fp = flatpickr(pickupInput, {
            "plugins": [new rangePlugin({ input: returnInput })],
            minDate: "today",
            showMonths: window.innerWidth > 768 ? 2 : 1,
            locale: "es",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "D., j M",
            disableMobile: true,
            onChange: function(selectedDates) {
                if (selectedDates.length > 0 && pickupTimeSelect) {
                    const pickupDate = selectedDates[0];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday = pickupDate.getTime() === today.getTime();

                    if (isToday) {
                        const minTime = getMinPickupTimeToday();
                        if (minTime === null) {
                            // No time available today — move to tomorrow
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            fp.set('minDate', tomorrow);
                            fp.setDate([tomorrow, selectedDates[1] || tomorrow]);
                            populateTimeOptions(pickupTimeSelect, null);
                            populateTimeOptions(returnTimeSelect, null);
                            pickupTimeSelect.value = '10:00';
                            returnTimeSelect.value = '10:00';
                            return;
                        }
                        populateTimeOptions(pickupTimeSelect, minTime);
                        // Sync return time to new pickup time
                        const newPickupVal = pickupTimeSelect.value;
                        if (returnTimeSelect.querySelector(`option[value="${newPickupVal}"]`)) {
                            returnTimeSelect.value = newPickupVal;
                        }
                    } else {
                        populateTimeOptions(pickupTimeSelect, null);
                        populateTimeOptions(returnTimeSelect, null);
                    }
                }
            }
        });
    }

    // 3. Booking Form Submission → Redirect to fleet.html
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let pickup = '';
            let returnDate = '';

            // Obtener fechas exactas desde Flatpickr para evitar formatos rotos
            if (pickupInput && pickupInput._flatpickr && pickupInput._flatpickr.selectedDates.length > 0) {
                pickup = flatpickr.formatDate(pickupInput._flatpickr.selectedDates[0], "Y-m-d");
                if (pickupInput._flatpickr.selectedDates.length > 1) {
                    returnDate = flatpickr.formatDate(pickupInput._flatpickr.selectedDates[1], "Y-m-d");
                }
            } else {
                pickup = pickupInput ? pickupInput.value : '';
                returnDate = returnInput ? returnInput.value : '';
            }

            // Validate dates
            if (!pickup || !returnDate || returnDate <= pickup) {
                alert('Por favor selecciona una fecha de retiro y una de devolución válidas.');
                if (pickupInput._flatpickr) pickupInput._flatpickr.open();
                return;
            }

            const pickupTime = pickupTimeSelect ? pickupTimeSelect.value : '10:00';
            const returnTime = returnTimeSelect ? returnTimeSelect.value : '10:00';

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Buscando...';
            submitBtn.style.opacity = '0.7';
            submitBtn.disabled = true;

            // Gather form values
            const location = bookingForm.querySelector('select[required]').value;

            setTimeout(() => {
                // Redirect to fleet page with params (including times)
                const params = new URLSearchParams({ location, pickup, return: returnDate, pickupTime, returnTime });
                window.location.href = 'fleet.html?' + params.toString();
            }, 800);
        });
    }

    // 3. Highlight Nav on Scroll
    function highlightNavOnScroll() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        let currentSection = "";
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= (sectionTop - 150)) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(currentSection)) {
                link.classList.add('active');
            }
        });
    }

    // 4. Car Card Selection
    const carBtns = document.querySelectorAll('.car-card .btn-primary');
    carBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const carName = this.closest('.car-card').querySelector('.car-title').innerText;
            alert(`Has seleccionado: ${carName}. Procediendo a la reserva...`);
        });
    });

    // 5. Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.glass, .car-card, .feature-item').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
});

// Helper for animations
// We need to add the CSS for .animate-spin
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
    .nav-links a.active {
        color: var(--accent-yellow);
        font-weight: 600;
    }
    .animate {
        opacity: 1 !important;
        animation: fadeInUp 0.8s forwards;
    }
`;
document.head.appendChild(style);
