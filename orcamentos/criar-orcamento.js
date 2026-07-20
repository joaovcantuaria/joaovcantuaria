// ========================================
// CRIAR ORÇAMENTO - LÓGICA
// ========================================

let uploadedImages = [];

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
            showToast('Erro ao conectar com o servidor. Recarregue a página.', true);
        }
    }, 100);
}

// Toast
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    toast.className = `toast show ${isError ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// Formatar moeda
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Parse valor do input
function parseValue(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

// ========================================
// ITENS
// ========================================
const itemsList = document.getElementById('itemsList');
const addItemBtn = document.getElementById('addItemBtn');

addItemBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" class="item-name" placeholder="Nome do serviço">
        <input type="text" class="item-value" placeholder="R$ 0,00">
        <button class="btn-remove-item" title="Remover"><i class="fas fa-trash"></i></button>
    `;
    itemsList.appendChild(row);
    bindItemEvents(row);
    row.querySelector('.item-name').focus();
});

function bindItemEvents(row) {
    row.querySelector('.btn-remove-item').addEventListener('click', () => {
        if (itemsList.children.length > 1) {
            row.remove();
            updateTotals();
        }
    });
    row.querySelector('.item-value').addEventListener('input', updateTotals);
}

// Bind initial row
document.querySelectorAll('.item-row').forEach(bindItemEvents);

// ========================================
// TOTAIS
// ========================================
function updateTotals() {
    const values = document.querySelectorAll('.item-value');
    let subtotal = 0;
    values.forEach(input => { subtotal += parseValue(input.value); });

    const discountType = document.getElementById('discountType').value;
    const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;

    let discountAmount = 0;
    if (discountType === 'percent') {
        discountAmount = subtotal * (discountValue / 100);
    } else {
        discountAmount = discountValue;
    }

    const total = Math.max(0, subtotal - discountAmount);

    document.getElementById('subtotalDisplay').textContent = formatCurrency(subtotal);
    document.getElementById('discountDisplay').textContent = `- ${formatCurrency(discountAmount)}`;
    document.getElementById('totalDisplay').textContent = formatCurrency(total);
}

document.getElementById('discountType').addEventListener('change', updateTotals);
document.getElementById('discountValue').addEventListener('input', updateTotals);

// ========================================
// IMAGENS
// ========================================
const imagesGrid = document.getElementById('imagesGrid');
const addImageBtn = document.getElementById('addImageBtn');
const imageInput = document.getElementById('imageInput');

addImageBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Imagem muito grande (máx 5MB): ' + file.name, true);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const imgData = ev.target.result;
            uploadedImages.push(imgData);
            renderImages();
        };
        reader.readAsDataURL(file);
    });
    imageInput.value = '';
});

function renderImages() {
    // Remove all except the add button
    const boxes = imagesGrid.querySelectorAll('.image-upload-box:not(#addImageBtn)');
    boxes.forEach(b => b.remove());

    uploadedImages.forEach((img, index) => {
        const box = document.createElement('div');
        box.className = 'image-upload-box';
        box.innerHTML = `
            <img src="${img}" alt="Imagem ${index + 1}">
            <button class="btn-remove-img" data-index="${index}"><i class="fas fa-times"></i></button>
        `;
        imagesGrid.insertBefore(box, addImageBtn);
    });

    // Bind remove
    imagesGrid.querySelectorAll('.btn-remove-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index);
            uploadedImages.splice(idx, 1);
            renderImages();
        });
    });
}

// ========================================
// SALVAR ORÇAMENTO
// ========================================
document.getElementById('saveBtn').addEventListener('click', async () => {
    const data = collectFormData();
    if (!data) return;

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

    try {
        // Gerar ID único
        const id = generateId();

        const orcamento = {
            id: id,
            client_name: data.clientName,
            password: data.password,
            project_title: data.projectTitle,
            project_description: data.projectDescription,
            items: data.items,
            images: uploadedImages,
            discount_type: data.discountType,
            discount_value: data.discountValue,
            discount_note: data.discountNote,
            subtotal: data.subtotal,
            discount_amount: data.discountAmount,
            total: data.total,
            validity_days: data.validityDays,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + data.validityDays * 86400000).toISOString(),
            status: 'pending'
        };

        const { error } = await supabase
            .from('orcamentos')
            .insert([orcamento]);

        if (error) throw error;

        // Mostrar link
        const link = `${window.location.origin}/orcamentos/?id=${id}`;
        document.getElementById('generatedLink').value = link;
        document.getElementById('displayPassword').textContent = data.password;
        document.getElementById('linkResult').style.display = 'block';
        document.getElementById('linkResult').scrollIntoView({ behavior: 'smooth' });

        showToast('Orçamento criado com sucesso!');

    } catch (error) {
        console.error(error);
        showToast('Erro ao salvar: ' + error.message, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Gerar Link do Orçamento';
    }
});

// Copiar link
document.getElementById('copyLinkBtn').addEventListener('click', () => {
    const input = document.getElementById('generatedLink');
    input.select();
    document.execCommand('copy');
    showToast('Link copiado!');
});

// Preview
document.getElementById('previewBtn').addEventListener('click', () => {
    const data = collectFormData();
    if (!data) return;

    // Salvar preview no sessionStorage e abrir
    const preview = {
        client_name: data.clientName,
        project_title: data.projectTitle,
        project_description: data.projectDescription,
        items: data.items,
        images: uploadedImages,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        discount_note: data.discountNote,
        subtotal: data.subtotal,
        discount_amount: data.discountAmount,
        total: data.total,
        validity_days: data.validityDays,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + data.validityDays * 86400000).toISOString(),
        status: 'pending'
    };
    sessionStorage.setItem('orcamento_preview', JSON.stringify(preview));
    window.open('/orcamentos/?preview=true', '_blank');
});

// ========================================
// HELPERS
// ========================================
function collectFormData() {
    const clientName = document.getElementById('clientName').value.trim();
    const password = document.getElementById('clientPassword').value.trim();
    const projectTitle = document.getElementById('projectTitle').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const validityDays = parseInt(document.getElementById('validityDays').value) || 7;
    const discountType = document.getElementById('discountType').value;
    const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
    const discountNote = document.getElementById('discountNote').value.trim();

    if (!clientName) { showToast('Preencha o nome do cliente.', true); return null; }
    if (!password) { showToast('Defina uma senha para o cliente.', true); return null; }
    if (!projectTitle) { showToast('Preencha o título do projeto.', true); return null; }

    // Coletar itens
    const items = [];
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const value = parseValue(row.querySelector('.item-value').value);
        if (name && value > 0) {
            items.push({ name, value });
        }
    });

    if (items.length === 0) {
        showToast('Adicione pelo menos um item com valor.', true);
        return null;
    }

    const subtotal = items.reduce((sum, item) => sum + item.value, 0);
    let discountAmount = 0;
    if (discountType === 'percent') {
        discountAmount = subtotal * (discountValue / 100);
    } else {
        discountAmount = discountValue;
    }
    const total = Math.max(0, subtotal - discountAmount);

    return {
        clientName, password, projectTitle, projectDescription,
        items, discountType, discountValue, discountNote,
        subtotal, discountAmount, total, validityDays
    };
}

function generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Init
waitForSupabase(() => {
    console.log('✅ Sistema de orçamentos pronto');
});
