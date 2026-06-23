// ========================================
// ANIMAÇÕES FADE-IN (Intersection Observer)
// ========================================

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

// ========================================
// NAVEGAÇÃO E MENU MOBILE
// ========================================

// Elementos do DOM
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.getElementById('header');

// Toggle Menu Mobile
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Fechar menu ao clicar em um link (mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    });
});

// Rolagem Suave para as Seções (apenas links internos)
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        
        // Verificar se é um link interno (começa com #)
        if (targetId && targetId.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
        // Se não começar com #, deixa o navegador fazer a navegação normal
    });
});

// Header com efeito ao rolar
window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ========================================
// CARROSSEL DE PORTFÓLIO
// ========================================

const portfolioTrack = document.getElementById('portfolioTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carouselIndicators = document.getElementById('carouselIndicators');

let currentIndex = 0;
let itemsToShow = 3;
let portfolioItems = [];

// Função para atualizar o número de itens visíveis baseado na largura da tela
function updateItemsToShow() {
    const width = window.innerWidth;
    if (width <= 768) {
        itemsToShow = 1;
    } else if (width <= 1024) {
        itemsToShow = 2;
    } else {
        itemsToShow = 3;
    }
}

// Inicializar Carrossel de Portfólio
function initPortfolioCarousel() {
    portfolioItems = document.querySelectorAll('.portfolio-item');
    const totalItems = portfolioItems.length;
    
    updateItemsToShow();
    
    // Criar indicadores
    carouselIndicators.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsToShow);
    
    for (let i = 0; i < totalPages; i++) {
        const indicator = document.createElement('button');
        indicator.classList.add('carousel-indicator');
        if (i === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(i));
        carouselIndicators.appendChild(indicator);
    }
    
    updateCarousel();
}

// Atualizar posição do carrossel
function updateCarousel() {
    const itemWidth = portfolioItems[0].offsetWidth;
    const offset = -currentIndex * itemWidth * itemsToShow;
    portfolioTrack.style.transform = `translateX(${offset}px)`;
    
    // Atualizar indicadores
    const indicators = carouselIndicators.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
    });
}

// Ir para um slide específico
function goToSlide(index) {
    const totalItems = portfolioItems.length;
    const maxIndex = Math.ceil(totalItems / itemsToShow) - 1;
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel();
}

// Próximo slide
function nextSlide() {
    const totalItems = portfolioItems.length;
    const maxIndex = Math.ceil(totalItems / itemsToShow) - 1;
    if (currentIndex < maxIndex) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    updateCarousel();
}

// Slide anterior
function prevSlide() {
    const totalItems = portfolioItems.length;
    const maxIndex = Math.ceil(totalItems / itemsToShow) - 1;
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = maxIndex;
    }
    updateCarousel();
}

// Event Listeners
if (prevBtn) prevBtn.addEventListener('click', prevSlide);
if (nextBtn) nextBtn.addEventListener('click', nextSlide);

// Redimensionar carrossel ao mudar tamanho da janela
window.addEventListener('resize', () => {
    updateItemsToShow();
    currentIndex = 0;
    initPortfolioCarousel();
});

// Inicializar quando a página carregar
if (portfolioTrack) {
    initPortfolioCarousel();
}

// Autoplay opcional (descomente para ativar)
// setInterval(nextSlide, 5000);

// ========================================
// CARROSSEL DE DEPOIMENTOS
// ========================================

const testimonialsTrack = document.getElementById('testimonialsTrack');
const prevTestimonial = document.getElementById('prevTestimonial');
const nextTestimonial = document.getElementById('nextTestimonial');

let currentTestimonial = 0;
let testimonialCards = [];

// Inicializar Carrossel de Depoimentos
function initTestimonialsCarousel() {
    testimonialCards = document.querySelectorAll('.testimonial-card');
    updateTestimonialsCarousel();
}

// Atualizar posição do carrossel de depoimentos
function updateTestimonialsCarousel() {
    if (testimonialCards.length === 0) return;
    
    const cardWidth = testimonialCards[0].offsetWidth;
    const offset = -currentTestimonial * cardWidth;
    testimonialsTrack.style.transform = `translateX(${offset}px)`;
}

// Próximo depoimento
function nextTestimonialSlide() {
    if (currentTestimonial < testimonialCards.length - 1) {
        currentTestimonial++;
    } else {
        currentTestimonial = 0;
    }
    updateTestimonialsCarousel();
}

// Depoimento anterior
function prevTestimonialSlide() {
    if (currentTestimonial > 0) {
        currentTestimonial--;
    } else {
        currentTestimonial = testimonialCards.length - 1;
    }
    updateTestimonialsCarousel();
}

// Event Listeners
if (prevTestimonial) prevTestimonial.addEventListener('click', prevTestimonialSlide);
if (nextTestimonial) nextTestimonial.addEventListener('click', nextTestimonialSlide);

// Redimensionar ao mudar tamanho da janela
window.addEventListener('resize', updateTestimonialsCarousel);

// Inicializar
if (testimonialsTrack) {
    initTestimonialsCarousel();
}

// Autoplay para depoimentos
setInterval(nextTestimonialSlide, 6000);

// ========================================
// FORMULÁRIO DE CONTATO — EmailJS
// ========================================

(function () {
    emailjs.init('aklgngWaGQf1P-1Ck');
})();

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = contactForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        // Feedback: enviando
        btn.textContent = 'Enviando...';
        btn.disabled = true;

        const templateParams = {
            from_name: document.getElementById('name').value.trim(),
            from_email: document.getElementById('email').value.trim(),
            phone:      document.getElementById('phone').value.trim() || 'Não informado',
            message:    document.getElementById('message').value.trim()
        };

        emailjs.send('service_3l97srp', 'template_qdcs4oq', templateParams)
            .then(() => {
                btn.textContent = 'Mensagem enviada ✓';
                contactForm.reset();

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 4000);
            })
            .catch((error) => {
                console.error('Erro ao enviar:', error);
                btn.textContent = 'Erro ao enviar. Tente novamente.';
                btn.style.background = '#c0392b';

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    btn.style.background = '';
                }, 4000);
            });
    });
}

// ========================================
// BOTÃO SCROLL TO TOP
// ========================================

const scrollTopBtn = document.getElementById('scrollTopBtn');

// Mostrar/Ocultar botão baseado na rolagem
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTopBtn.classList.add('show');
    } else {
        scrollTopBtn.classList.remove('show');
    }
});

// Rolar para o topo ao clicar
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ========================================
// LOADING INICIAL
// ========================================

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

console.log('Site João V. Cantuária carregado com sucesso! 🎨📸');
