// ========================================
// VER ORÇAMENTO - LÓGICA DO CLIENTE
// ========================================

let currentBudget = null;

// Aguardar Supabase
function waitForSupabase(callback) {
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (typeof supabase !== 'undefined' && supabase !== null) {
            clearInterval(interval);
            callback();
        } else if (attempts >= 50) {
            clearInterval(interval);
            // Se for preview, não precisa do supabase
            if (isPreview()) {
                callback();
            }
        }
    }, 100);
}

function isPreview() {
    return new URLSearchParams(window.location.search).has('preview');
}

function getOrcamentoId() {
    return new URLSearchParams(window.location.search).get('id');
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ========================================
// INIT
// ========================================
waitForSupabase(() => {
    if (isPreview()) {
        // Modo preview - pegar do sessionStorage
        const data = sessionStorage.getItem('orcamento_preview');
        if (data) {
            currentBudget = JSON.parse(data);
            showBudget();
        } else {
            document.querySelector('.login-box h2').textContent = 'Preview não encontrado';
            document.querySelector('.login-box p').textContent = 'Volte à tela de criação e clique em Pré-visualizar novamente.';
            document.getElementById('passwordInput').style.display = 'none';
            document.getElementById('accessBtn').style.display = 'none';
        }
        return;
    }

    const id = getOrcamentoId();
    if (!id) {
        document.querySelector('.login-box h2').textContent = 'Link inválido';
        document.querySelector('.login-box p').textContent = 'Este link de orçamento não é válido.';
        document.getElementById('passwordInput').style.display = 'none';
        document.getElementById('accessBtn').style.display = 'none';
        return;
    }

    // Login
    document.getElementById('accessBtn').addEventListener('click', handleLogin);
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

async function handleLogin() {
    const password = document.getElementById('passwordInput').value.trim();
    if (!password) return;

    const id = getOrcamentoId();
    const btn = document.getElementById('accessBtn');
    btn.textContent = 'Verificando...';
    btn.disabled = true;

    try {
        const { data, error } = await supabase
            .from('orcamentos')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            showLoginError('Orçamento não encontrado.');
            return;
        }

        if (data.password !== password) {
            showLoginError('Senha incorreta. Tente novamente.');
            return;
        }

        currentBudget = data;
        showBudget();

    } catch (err) {
        showLoginError('Erro ao carregar. Tente novamente.');
    } finally {
        btn.textContent = 'Acessar Orçamento';
        btn.disabled = false;
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}

// ========================================
// RENDER BUDGET
// ========================================
function showBudget() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('budgetView').style.display = 'block';

    const b = currentBudget;

    // Header
    document.getElementById('budgetTitle').textContent = b.project_title;
    document.getElementById('budgetClient').textContent = b.client_name;
    document.getElementById('budgetDate').textContent = formatDate(b.created_at);
    document.getElementById('budgetExpiry').textContent = formatDate(b.expires_at);

    // Status
    const now = new Date();
    const expiry = new Date(b.expires_at);
    const badge = document.getElementById('statusBadge');

    if (b.status === 'accepted') {
        badge.className = 'status-badge accepted';
        badge.innerHTML = '<i class="fas fa-check-circle"></i> Aprovado';
    } else if (now > expiry) {
        badge.className = 'status-badge expired';
        badge.innerHTML = '<i class="fas fa-calendar-times"></i> Expirado';
        document.getElementById('expiredNotice').style.display = 'block';
    } else {
        badge.className = 'status-badge pending';
        badge.innerHTML = '<i class="fas fa-hourglass-half"></i> Aguardando aprovação';
    }

    // Description
    if (b.project_description) {
        document.getElementById('budgetDescription').textContent = b.project_description;
    } else {
        document.getElementById('descriptionSection').style.display = 'none';
    }

    // Images
    if (b.images && b.images.length > 0) {
        document.getElementById('imagesSection').style.display = 'block';
        const gallery = document.getElementById('imagesGallery');
        b.images.forEach((img, i) => {
            const div = document.createElement('div');
            div.className = 'gallery-img';
            div.innerHTML = `<img src="${img}" alt="Referência ${i + 1}">`;
            div.addEventListener('click', () => openLightbox(img));
            gallery.appendChild(div);
        });
    }

    // Items
    const tbody = document.getElementById('itemsBody');
    b.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.name}</td><td>${formatCurrency(item.value)}</td>`;
        tbody.appendChild(tr);
    });

    // Totals
    document.getElementById('viewSubtotal').textContent = formatCurrency(b.subtotal);
    document.getElementById('viewDiscount').textContent = `- ${formatCurrency(b.discount_amount)}`;
    document.getElementById('viewTotal').textContent = formatCurrency(b.total);

    if (b.discount_amount <= 0) {
        document.getElementById('discountRow').style.display = 'none';
        // Don't show line-through if there's no discount
        document.querySelector('.total-row.subtotal').style.display = 'none';
    }

    if (b.discount_note) {
        document.getElementById('viewDiscountNote').textContent = b.discount_note;
        document.getElementById('viewDiscountNote').style.display = 'block';
    }
}

// ========================================
// LIGHTBOX
// ========================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');

function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('show');
}

lightbox.addEventListener('click', () => {
    lightbox.classList.remove('show');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') lightbox.classList.remove('show');
});
