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

    // 2. Date range selection (Flatpickr)
    const pickupInput = document.getElementById('pickupDate');
    const returnInput = document.getElementById('returnDate');

    if (pickupInput && returnInput && typeof flatpickr !== 'undefined') {
        flatpickr(pickupInput, {
            "plugins": [new rangePlugin({ input: returnInput })],
            minDate: "today",
            showMonths: window.innerWidth > 768 ? 2 : 1, // 2 meses en PC, 1 en móvil
            locale: "es", // Español
            dateFormat: "Y-m-d", // Formato para procesar datos internamente
            altInput: true,
            altFormat: "D., j M", // Ej: Jue., 23 Abr
            disableMobile: true // Fuerza a usar este calendario en lugar del nativo del celular
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

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Buscando...';
            submitBtn.style.opacity = '0.7';
            submitBtn.disabled = true;

            // Gather form values
            const location = bookingForm.querySelector('select[required]').value;

            setTimeout(() => {
                // Redirect to fleet page with params
                const params = new URLSearchParams({ location, pickup, return: returnDate });
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
