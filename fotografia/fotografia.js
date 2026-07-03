// ========================================
// FOTOGRAFIA — JAVASCRIPT
// ========================================

// Fade-in observer
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

// Header scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    });
});

// Smooth scroll para links internos
document.querySelectorAll('.nav-link, .hero-ctas a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offset = header.offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - offset,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ========================================
// FILTRO DE PORTFÓLIO
// ========================================
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Atualizar botão ativo
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filtrar itens
        portfolioItems.forEach(item => {
            if (filter === 'todos' || item.dataset.category === filter) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });
});

// ========================================
// SELEÇÃO DE FOTOS — FORMULÁRIO
// ========================================
const selecaoForm = document.getElementById('selecaoForm');

if (selecaoForm) {
    selecaoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const codigo = document.getElementById('codigoAcesso').value.trim().toLowerCase().replace(/\s+/g, '_');

        if (!codigo) return;

        // Redirecionar para a galeria com o código
        window.location.href = `galeria.html?codigo=${codigo}`;
    });
}
