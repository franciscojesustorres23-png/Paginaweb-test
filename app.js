document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. CABECERA: STICKY ON SCROLL & MENÚ RESPONSIVO MÓVIL
       ========================================================================== */
    const header = document.getElementById('main-header');
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Efecto de vidrio (glassmorphism) al hacer scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Highlight active nav item depending on scroll position
        highlightNavLinkOnScroll();
    });

    // Menú móvil toggle
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Cerrar menú al hacer clic en un enlace de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuToggle && navMenu) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Resaltar sección activa al hacer scroll
    const sections = document.querySelectorAll('section');
    function highlightNavLinkOnScroll() {
        let scrollPosition = window.scrollY + 120; // offset

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }


    /* ==========================================================================
       2. PRECIOS Y LÓGICA DE TARIFAS (COTIZADOR INTERACTIVO)
       ========================================================================== */
    // Configuración base de tarifas en USD
    const PRICING_CONFIG = {
        express: {
            basePrice: 45, // incluye 1 hab y 1 baño
            roomRate: 10,  // extra room
            bathRate: 15,  // extra bathroom
            label: 'Limpieza Express'
        },
        profunda: {
            basePrice: 85,
            roomRate: 15,
            bathRate: 20,
            label: 'Limpieza Profunda'
        },
        mudanza: {
            basePrice: 120,
            roomRate: 20,
            bathRate: 25,
            label: 'Mudanza / Post-Obra'
        }
    };

    // Precios de servicios adicionales
    const EXTRA_PRICES = {
        fridge: { price: 15, label: 'Refrigerador' },
        oven: { price: 20, label: 'Horno Interno' },
        windows: { price: 25, label: 'Ventanas Completas' },
        ironing: { price: 20, label: 'Servicio Planchado' },
        cabinet: { price: 15, label: 'Muebles de Cocina' },
        pets: { price: 10, label: 'Pelo de Mascotas' }
    };

    // Estado del Cotizador
    const calculatorState = {
        plan: 'express',
        rooms: 2,
        bathrooms: 1,
        extras: [],
        total: 0
    };

    // Elementos del DOM del Cotizador
    const roomsValEl = document.getElementById('rooms-val');
    const roomsMinusBtn = document.getElementById('rooms-minus');
    const roomsPlusBtn = document.getElementById('rooms-plus');

    const bathroomsValEl = document.getElementById('bathrooms-val');
    const bathroomsMinusBtn = document.getElementById('bathrooms-minus');
    const bathroomsPlusBtn = document.getElementById('bathrooms-plus');

    const planRadios = document.querySelectorAll('input[name="calc-plan"]');
    const extraCheckboxes = document.querySelectorAll('input[name="extra-item"]');
    const realtimePriceEl = document.getElementById('realtime-price');
    const summaryDetailsList = document.getElementById('summary-details-list');

    // Botones de acción entre secciones
    const selectServiceBtns = document.querySelectorAll('.select-service-btn');
    const calcApplyBtn = document.getElementById('calc-apply-btn');

    // Elementos del Resumen de Cotización en Formulario de Contacto
    const formSummaryPlan = document.getElementById('form-summary-plan');
    const formSummaryRooms = document.getElementById('form-summary-rooms');
    const formSummaryBathrooms = document.getElementById('form-summary-bathrooms');
    const formSummaryExtras = document.getElementById('form-summary-extras');
    const formSummaryTotal = document.getElementById('form-summary-total');

    // Inputs ocultos del formulario para envío
    const hiddenPlan = document.getElementById('hidden-plan');
    const hiddenRooms = document.getElementById('hidden-rooms');
    const hiddenBathrooms = document.getElementById('hidden-bathrooms');
    const hiddenExtras = document.getElementById('hidden-extras');
    const hiddenTotal = document.getElementById('hidden-total');

    // Inicializar Contadores
    function updateCounterDisplay() {
        roomsValEl.textContent = calculatorState.rooms;
        bathroomsValEl.textContent = calculatorState.bathrooms;
    }

    // Manejador del número de Habitaciones (Rango: 1 a 10)
    if (roomsMinusBtn && roomsPlusBtn) {
        roomsMinusBtn.addEventListener('click', () => {
            if (calculatorState.rooms > 1) {
                calculatorState.rooms--;
                updateCounterDisplay();
                calculateTotal();
            }
        });
        roomsPlusBtn.addEventListener('click', () => {
            if (calculatorState.rooms < 10) {
                calculatorState.rooms++;
                updateCounterDisplay();
                calculateTotal();
            }
        });
    }

    // Manejador del número de Baños (Rango: 1 a 10)
    if (bathroomsMinusBtn && bathroomsPlusBtn) {
        bathroomsMinusBtn.addEventListener('click', () => {
            if (calculatorState.bathrooms > 1) {
                calculatorState.bathrooms--;
                updateCounterDisplay();
                calculateTotal();
            }
        });
        bathroomsPlusBtn.addEventListener('click', () => {
            if (calculatorState.bathrooms < 10) {
                calculatorState.bathrooms++;
                updateCounterDisplay();
                calculateTotal();
            }
        });
    }

    // Manejador de cambio de Plan
    planRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                calculatorState.plan = e.target.value;
                calculateTotal();
            }
        });
    });

    // Manejador de Extras
    extraCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedExtras = [];
            extraCheckboxes.forEach(cb => {
                if (cb.checked) {
                    selectedExtras.push(cb.value);
                }
            });
            calculatorState.extras = selectedExtras;
            calculateTotal();
        });
    });

    // Animación de contador de precio rodante (Rolling counter animation)
    let currentAnimatedPrice = 0;
    function animatePriceChange(targetPrice) {
        const duration = 300; // ms
        const frameRate = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameRate);
        let frame = 0;
        
        const startPrice = currentAnimatedPrice;
        const priceDiff = targetPrice - startPrice;
        
        if (priceDiff === 0) {
            realtimePriceEl.textContent = targetPrice;
            return;
        }

        const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            // Easing de salida cúbica
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.round(startPrice + (priceDiff * easeProgress));
            
            realtimePriceEl.textContent = currentVal;
            currentAnimatedPrice = currentVal;
            
            if (frame >= totalFrames) {
                clearInterval(timer);
                realtimePriceEl.textContent = targetPrice;
                currentAnimatedPrice = targetPrice;
            }
        }, frameRate);
    }

    // Función Central de Cálculo de Precios
    function calculateTotal() {
        const config = PRICING_CONFIG[calculatorState.plan];
        
        // Base Price (incluye 1 hab y 1 baño)
        let total = config.basePrice;
        const breakDownHtml = [];

        breakDownHtml.push(`<li><span>Base Plan ${config.label}</span><span>$${config.basePrice}</span></li>`);

        // Extra rooms
        if (calculatorState.rooms > 1) {
            const extraRooms = calculatorState.rooms - 1;
            const extraRoomsCost = extraRooms * config.roomRate;
            total += extraRoomsCost;
            breakDownHtml.push(`<li><span>${extraRooms} Hab. Adicional(es)</span><span>+$${extraRoomsCost}</span></li>`);
        }

        // Extra bathrooms
        if (calculatorState.bathrooms > 1) {
            const extraBaths = calculatorState.bathrooms - 1;
            const extraBathsCost = extraBaths * config.bathRate;
            total += extraBathsCost;
            breakDownHtml.push(`<li><span>${extraBaths} Baño(s) Adicional(es)</span><span>+$${extraBathsCost}</span></li>`);
        }

        // Extras
        calculatorState.extras.forEach(extraKey => {
            const extraObj = EXTRA_PRICES[extraKey];
            if (extraObj) {
                total += extraObj.price;
                breakDownHtml.push(`<li><span>Servicio: ${extraObj.label}</span><span>+$${extraObj.price}</span></li>`);
            }
        });

        calculatorState.total = total;
        
        // Ejecutar animación numérica
        animatePriceChange(total);
        
        // Renderizar desglose en panel
        summaryDetailsList.innerHTML = breakDownHtml.join('');

        // Sincronizar automáticamente con el resumen del formulario
        syncWithBookingForm();
    }

    // Sincronización con el formulario de reserva
    function syncWithBookingForm() {
        const config = PRICING_CONFIG[calculatorState.plan];
        
        // Traducir extras para mostrar
        let extrasString = 'Ninguno';
        if (calculatorState.extras.length > 0) {
            extrasString = calculatorState.extras.map(e => EXTRA_PRICES[e].label).join(', ');
        }

        // Actualizar visualizaciones del resumen
        if (formSummaryPlan) formSummaryPlan.textContent = config.label;
        if (formSummaryRooms) formSummaryRooms.textContent = calculatorState.rooms;
        if (formSummaryBathrooms) formSummaryBathrooms.textContent = calculatorState.bathrooms;
        if (formSummaryExtras) formSummaryExtras.textContent = extrasString;
        if (formSummaryTotal) formSummaryTotal.textContent = `$${calculatorState.total} USD`;

        // Llenar inputs ocultos para su posterior envío
        if (hiddenPlan) hiddenPlan.value = calculatorState.plan;
        if (hiddenRooms) hiddenRooms.value = calculatorState.rooms;
        if (hiddenBathrooms) hiddenBathrooms.value = calculatorState.bathrooms;
        if (hiddenExtras) hiddenExtras.value = extrasString;
        if (hiddenTotal) hiddenTotal.value = calculatorState.total;
    }

    // Inicializar el cotizador por primera vez
    updateCounterDisplay();
    calculateTotal();


    /* ==========================================================================
       3. BOTONES DE ACCIÓN: INTERCONEXIONES FLUIDAS DE SECCIONES
       ========================================================================== */
    // Botón "Seleccionar Plan" en las tarjetas de servicios principales
    selectServiceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetPackage = e.target.getAttribute('data-target-package');
            
            // Auto seleccionar en el cotizador
            const planRadio = document.querySelector(`input[name="calc-plan"][value="${targetPackage}"]`);
            if (planRadio) {
                planRadio.checked = true;
                calculatorState.plan = targetPackage;
                calculateTotal();
            }

            // Scroll suave hacia el cotizador
            const calcSection = document.getElementById('cotizador');
            if (calcSection) {
                calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Botón "Continuar con esta Reserva" desde el panel resumen del cotizador
    if (calcApplyBtn) {
        calcApplyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Scroll suave al formulario de contacto
            const contactSection = document.getElementById('contacto');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Foco en el primer input del formulario
            const nameInput = document.getElementById('booking-name');
            if (nameInput) {
                setTimeout(() => nameInput.focus(), 800);
            }
        });
    }



    /* ==========================================================================
       4. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQS TRANSICIÓN SUAVE)
       ========================================================================== */
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const answer = item.querySelector('.faq-answer');
            const isActive = item.classList.contains('active');

            // Cerrar todos los demás acordeones abiertos
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0px';
                }
            });

            // Toggle item activo actual
            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = '0px';
            } else {
                item.classList.add('active');
                // Ajustar dinámicamente según scrollHeight para animación fluida en CSS
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });


    /* ==========================================================================
       5. FORMULARIO DE RESERVA & MODAL DE ÉXITO INTERACTIVO
       ========================================================================== */
    const bookingForm = document.getElementById('booking-form');
    const successModal = document.getElementById('success-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBtnConfirm = document.getElementById('modal-btn-confirm');

    // Inyectar fecha mínima en el input de fecha (Hoy)
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }

    // Manejar envío de formulario
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Extraer valores
            const userName = document.getElementById('booking-name').value.trim();
            const userEmail = document.getElementById('booking-email').value.trim();
            const serviceDate = document.getElementById('booking-date').value;
            const serviceAddress = document.getElementById('booking-address').value.trim();

            const planLabel = PRICING_CONFIG[calculatorState.plan].label;
            const totalUSD = calculatorState.total;
            const areasText = `${calculatorState.rooms} Habitación(es), ${calculatorState.bathrooms} Baño(s)`;

            // Rellenar datos en el Modal
            document.getElementById('modal-user-name').textContent = userName;
            document.getElementById('modal-summary-plan').textContent = planLabel;
            document.getElementById('modal-summary-date').textContent = formatDate(serviceDate);
            document.getElementById('modal-summary-address').textContent = serviceAddress;
            document.getElementById('modal-summary-detail').textContent = areasText;
            document.getElementById('modal-summary-price').textContent = `$${totalUSD}.00 USD`;

            // Mostrar el modal
            successModal.classList.add('active');

            // Resetear el formulario e inicializar cotizador a valores base
            bookingForm.reset();
            resetCalculatorState();
        });
    }

    // Funciones para cerrar modal de éxito
    function closeModal() {
        successModal.classList.remove('active');
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalBtnConfirm) modalBtnConfirm.addEventListener('click', closeModal);
    
    // Cerrar al hacer clic fuera del card del modal
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeModal();
            }
        });
    }

    // Formateador de Fecha de yyyy-mm-dd a dd/mm/yyyy
    function formatDate(dateString) {
        if (!dateString) return '';
        const parts = dateString.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Resetear Cotizador
    function resetCalculatorState() {
        calculatorState.plan = 'express';
        calculatorState.rooms = 2;
        calculatorState.bathrooms = 1;
        calculatorState.extras = [];
        
        // Resetear controles visuales
        const expressRadio = document.querySelector('input[name="calc-plan"][value="express"]');
        if (expressRadio) expressRadio.checked = true;

        extraCheckboxes.forEach(cb => cb.checked = false);

        updateCounterDisplay();
        calculateTotal();
    }
});
