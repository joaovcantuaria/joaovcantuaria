// ========================================
// GERADOR DE CARROSSEL INFINITO
// ========================================

const SLIDE_W = 1080;
const SLIDE_H = 1350;
const PADDING = 40; // padding interno de cada layout

// ========================================
// TEMPLATES - 4 Modelos de layout
// Cada slot define: x, y, w, h (em % da lamina)
// O sistema renderiza uma faixa continua e depois fatia
// ========================================

const TEMPLATES = [
    {
        id: 'album-classico',
        name: 'Album Classico',
        description: 'Layout editorial com fotos grandes e mosaico',
        maxPhotos: 12,
        slides: 4,
        // Cada slide tem slots (posicoes das fotos em % do slide)
        // x, y, w, h em % relativo ao slide (1080x1350)
        layout: [
            // Slide 1: 1 grande esquerda + 2 menores direita
            [
                { x: 3, y: 8, w: 55, h: 84 },
                { x: 61, y: 8, w: 36, h: 40 },
                { x: 61, y: 52, w: 36, h: 40 }
            ],
            // Slide 2: grid 2x2
            [
                { x: 3, y: 8, w: 46, h: 40 },
                { x: 51, y: 8, w: 46, h: 40 },
                { x: 3, y: 52, w: 46, h: 40 },
                { x: 51, y: 52, w: 46, h: 40 }
            ],
            // Slide 3: 1 grande centro + 2 laterais
            [
                { x: 3, y: 8, w: 30, h: 55 },
                { x: 36, y: 8, w: 40, h: 84 },
                { x: 78, y: 37, w: 19, h: 55 }
            ],
            // Slide 4: 2 fotos + texto
            [
                { x: 3, y: 8, w: 46, h: 60 },
                { x: 51, y: 8, w: 46, h: 60 },
                { x: 3, y: 72, w: 94, h: 0, isText: true }
            ]
        ]
    },
    {
        id: 'mosaico-dinamico',
        name: 'Mosaico Dinamico',
        description: 'Composicao variada com cortes assimetricos',
        maxPhotos: 10,
        slides: 4,
        layout: [
            // Slide 1: topo largo + 2 embaixo
            [
                { x: 3, y: 5, w: 94, h: 45 },
                { x: 3, y: 53, w: 46, h: 42 },
                { x: 51, y: 53, w: 46, h: 42 }
            ],
            // Slide 2: 3 verticais
            [
                { x: 3, y: 8, w: 30, h: 84 },
                { x: 35, y: 8, w: 30, h: 84 },
                { x: 67, y: 8, w: 30, h: 84 }
            ],
            // Slide 3: 1 grande + 2 pequenas empilhadas
            [
                { x: 3, y: 8, w: 60, h: 84 },
                { x: 66, y: 8, w: 31, h: 40 },
                { x: 66, y: 52, w: 31, h: 40 }
            ],
            // Slide 4: foto centralizada + texto
            [
                { x: 15, y: 10, w: 70, h: 55 },
                { x: 3, y: 72, w: 94, h: 0, isText: true }
            ]
        ]
    },
    {
        id: 'editorial-moderno',
        name: 'Editorial Moderno',
        description: 'Estilo magazine com espacamento elegante',
        maxPhotos: 9,
        slides: 3,
        layout: [
            // Slide 1: 2 empilhadas esquerda + 1 grande direita
            [
                { x: 3, y: 8, w: 35, h: 40 },
                { x: 3, y: 52, w: 35, h: 40 },
                { x: 41, y: 8, w: 56, h: 84 }
            ],
            // Slide 2: colunas irregulares
            [
                { x: 3, y: 5, w: 46, h: 55 },
                { x: 51, y: 5, w: 46, h: 35 },
                { x: 51, y: 43, w: 46, h: 52 }
            ],
            // Slide 3: destaque central + texto
            [
                { x: 10, y: 5, w: 80, h: 60 },
                { x: 3, y: 70, w: 94, h: 0, isText: true }
            ]
        ]
    },
    {
        id: 'panoramico-flow',
        name: 'Panoramico Flow',
        description: 'Fotos grandes que fluem entre as laminas',
        maxPhotos: 8,
        slides: 4,
        layout: [
            // Slide 1: full bleed (foto pega tela toda)
            [
                { x: 0, y: 0, w: 100, h: 100 }
            ],
            // Slide 2: 2 horizontais empilhadas
            [
                { x: 3, y: 5, w: 94, h: 45 },
                { x: 3, y: 53, w: 94, h: 42 }
            ],
            // Slide 3: 4 quadradas
            [
                { x: 3, y: 5, w: 46, h: 44 },
                { x: 51, y: 5, w: 46, h: 44 },
                { x: 3, y: 52, w: 46, h: 44 },
                { x: 51, y: 52, w: 46, h: 44 }
            ],
            // Slide 4: 1 foto + texto
            [
                { x: 10, y: 8, w: 80, h: 55 },
                { x: 3, y: 70, w: 94, h: 0, isText: true }
            ]
        ]
    }
];

// ========================================
// STATE
// ========================================
let selectedModel = null;
let uploadedPhotos = []; // array of { file, url }
let bgColor = '#ffffff';
let generatedSlides = []; // array of canvas data URLs

// ========================================
// INIT - Render model cards
// ========================================
function init() {
    const grid = document.getElementById('modelsGrid');
    grid.innerHTML = TEMPLATES.map(t => {
        const miniSlides = t.layout.map(slide => {
            const slots = slide.filter(s => !s.isText).map(s =>
                `<div class="mini-slot" style="grid-column:span 1;"></div>`
            ).join('');
            return `<div class="mini-slide" style="grid-template-columns:repeat(${Math.min(slide.filter(s=>!s.isText).length, 3)},1fr);grid-template-rows:repeat(2,1fr);">${slots}</div>`;
        }).join('');

        return `<div class="model-card" data-model="${t.id}" onclick="selectModel('${t.id}')">
            <div class="model-preview"><div class="mini-layout">${miniSlides}</div></div>
            <div class="model-name">${t.name}</div>
            <div class="model-info">${t.slides} laminas · ate ${t.maxPhotos} fotos</div>
        </div>`;
    }).join('');

    // Color options
    document.querySelectorAll('.color-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            bgColor = opt.dataset.color;
        });
    });

    // Dropzone
    const dz = document.getElementById('carouselDropzone');
    const fi = document.getElementById('carouselFileInput');
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('dragover'); addPhotos(e.dataTransfer.files); });
    fi.addEventListener('change', (e) => addPhotos(e.target.files));

    // Buttons
    document.getElementById('btnToStep2').addEventListener('click', () => goToStep(2));
    document.getElementById('btnGenerate').addEventListener('click', generateCarousel);
    document.getElementById('btnDownloadAll').addEventListener('click', downloadAll);
}

// ========================================
// MODEL SELECTION
// ========================================
function selectModel(id) {
    selectedModel = TEMPLATES.find(t => t.id === id);
    document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-model="${id}"]`).classList.add('selected');
    document.getElementById('btnToStep2').disabled = false;
}

// ========================================
// STEP NAVIGATION
// ========================================
function goToStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');
    if (n === 2 && selectedModel) {
        document.getElementById('photoLimit').textContent = `Ate ${selectedModel.maxPhotos} fotos (JPG, PNG, WebP)`;
        updateGenerateBtn();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// PHOTO UPLOAD
// ========================================
function addPhotos(files) {
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const maxPhotos = selectedModel ? selectedModel.maxPhotos : 12;

    for (const file of newFiles) {
        if (uploadedPhotos.length >= maxPhotos) break;
        const url = URL.createObjectURL(file);
        uploadedPhotos.push({ file, url });
    }

    renderPhotosPrev();
    updateGenerateBtn();
}

function removePhoto(index) {
    URL.revokeObjectURL(uploadedPhotos[index].url);
    uploadedPhotos.splice(index, 1);
    renderPhotosPrev();
    updateGenerateBtn();
}

function renderPhotosPrev() {
    const grid = document.getElementById('photosPreview');
    const count = document.getElementById('photoCount');
    const maxPhotos = selectedModel ? selectedModel.maxPhotos : 12;

    if (uploadedPhotos.length === 0) {
        grid.innerHTML = '';
        count.style.display = 'none';
        return;
    }

    count.style.display = 'block';
    count.textContent = `${uploadedPhotos.length} / ${maxPhotos} fotos selecionadas`;

    grid.innerHTML = uploadedPhotos.map((p, i) =>
        `<div class="photo-thumb">
            <img src="${p.url}" alt="Foto ${i+1}">
            <button class="remove" onclick="removePhoto(${i})"><i class="fas fa-times"></i></button>
        </div>`
    ).join('');
}

function updateGenerateBtn() {
    const btn = document.getElementById('btnGenerate');
    btn.disabled = uploadedPhotos.length === 0;
}

// ========================================
// GENERATE CAROUSEL
// ========================================
async function generateCarousel() {
    if (!selectedModel || uploadedPhotos.length === 0) return;

    // Verificar se ja esta cadastrado (sessao)
    if (!sessionStorage.getItem('carrossel_lead')) {
        showRegistrationModal();
        return;
    }

    const btn = document.getElementById('btnGenerate');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

    try {
        // Load all images
        const images = await Promise.all(uploadedPhotos.map(p => loadImage(p.url)));

        // Determine how many slides to generate based on photos available
        const layout = selectedModel.layout;
        const totalSlots = layout.reduce((sum, slide) => sum + slide.filter(s => !s.isText).length, 0);
        const photosToUse = images.slice(0, totalSlots);

        // Generate each slide
        generatedSlides = [];
        let photoIndex = 0;

        for (let slideIdx = 0; slideIdx < layout.length; slideIdx++) {
            const slideLayout = layout[slideIdx];
            const photoSlots = slideLayout.filter(s => !s.isText);

            // If no more photos and this slide only has photo slots, skip
            if (photoIndex >= photosToUse.length && photoSlots.length > 0 && !slideLayout.some(s => s.isText)) {
                continue;
            }

            const canvas = document.createElement('canvas');
            canvas.width = SLIDE_W;
            canvas.height = SLIDE_H;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

            // Draw photo slots
            for (const slot of slideLayout) {
                if (slot.isText) continue;
                if (photoIndex >= photosToUse.length) continue;

                const img = photosToUse[photoIndex];
                const sx = (slot.x / 100) * SLIDE_W;
                const sy = (slot.y / 100) * SLIDE_H;
                const sw = (slot.w / 100) * SLIDE_W;
                const sh = (slot.h / 100) * SLIDE_H;

                drawImageCover(ctx, img, sx, sy, sw, sh);
                photoIndex++;
            }

            // Draw text if this slide has a text slot
            const textSlot = slideLayout.find(s => s.isText);
            if (textSlot) {
                const userText = document.getElementById('carouselText').value.trim();
                if (userText) {
                    const tx = (textSlot.x / 100) * SLIDE_W;
                    const ty = (textSlot.y / 100) * SLIDE_H;
                    const tw = (textSlot.w / 100) * SLIDE_W;

                    // Text color based on background brightness
                    const isLight = isColorLight(bgColor);
                    ctx.fillStyle = isLight ? '#1a1a1a' : '#ffffff';
                    ctx.font = 'italic 500 52px "Playfair Display", serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(userText, tx + tw / 2, ty + 40);
                }
            }

            generatedSlides.push(canvas.toDataURL('image/jpeg', 0.92));
        }

        // Show result
        renderResult();
        goToStep(3);

    } catch (err) {
        console.error('Erro ao gerar:', err);
        alert('Erro ao gerar carrossel. Tente novamente.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Gerar Carrossel';
    }
}

// ========================================
// RENDER RESULT
// ========================================
function renderResult() {
    const container = document.getElementById('slidesPreview');
    container.innerHTML = generatedSlides.map((dataUrl, i) =>
        `<div class="slide-card">
            <span class="slide-num">${i + 1}</span>
            <img src="${dataUrl}" alt="Lamina ${i+1}">
            <button class="slide-dl" onclick="downloadSlide(${i})" title="Baixar"><i class="fas fa-download"></i></button>
        </div>`
    ).join('');
}

// ========================================
// DOWNLOADS
// ========================================
function downloadSlide(index) {
    const link = document.createElement('a');
    link.href = generatedSlides[index];
    link.download = `carrossel_lamina_${index + 1}.jpg`;
    link.click();
}

async function downloadAll() {
    for (let i = 0; i < generatedSlides.length; i++) {
        downloadSlide(i);
        await new Promise(r => setTimeout(r, 400));
    }
}

// ========================================
// HELPERS
// ========================================
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Draw image with "cover" behavior (fill area, crop excess)
function drawImageCover(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height;
    const slotRatio = w / h;

    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

    if (imgRatio > slotRatio) {
        // Image is wider - crop sides
        srcW = img.height * slotRatio;
        srcX = (img.width - srcW) / 2;
    } else {
        // Image is taller - crop top/bottom
        srcH = img.width / slotRatio;
        srcY = (img.height - srcH) / 2;
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, w, h);
}

function isColorLight(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ========================================
// START
// ========================================
document.addEventListener('DOMContentLoaded', init);


// ========================================
// REGISTRATION GATE
// ========================================
const SUPABASE_URL = 'https://gzetvnqnqmjrkcfsjxyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_i5bIlH9xOl7Oeh3MEVnuXg_F7Zp3aZ5';

function showRegistrationModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('regModal')) {
        const modal = document.createElement('div');
        modal.id = 'regModal';
        modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000;align-items:center;justify-content:center;padding:2rem;backdrop-filter:blur(6px);';
        modal.innerHTML = `
            <div style="background:#161616;border:1px solid rgba(198,169,114,0.2);border-radius:16px;padding:2.5rem;max-width:420px;width:100%;">
                <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:400;margin-bottom:0.5rem;">Quase la!</h3>
                <p style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:2rem;font-weight:300;">Cadastre-se gratuitamente para gerar seus carrosseis ilimitados.</p>
                <form id="regForm">
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block;font-size:0.65rem;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.38);margin-bottom:0.4rem;">Seu Nome</label>
                        <input type="text" id="regNome" required placeholder="Nome completo" style="width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.13);padding:0.7rem 0;font-size:0.95rem;color:#fff;font-family:'DM Sans',sans-serif;outline:none;">
                    </div>
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block;font-size:0.65rem;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.38);margin-bottom:0.4rem;">E-mail</label>
                        <input type="email" id="regEmail" required placeholder="seu@email.com" style="width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.13);padding:0.7rem 0;font-size:0.95rem;color:#fff;font-family:'DM Sans',sans-serif;outline:none;">
                    </div>
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block;font-size:0.65rem;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.38);margin-bottom:0.4rem;">Telefone</label>
                        <input type="tel" id="regTelefone" required placeholder="(11) 99999-9999" style="width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.13);padding:0.7rem 0;font-size:0.95rem;color:#fff;font-family:'DM Sans',sans-serif;outline:none;">
                    </div>
                    <div style="display:flex;gap:0.75rem;margin-top:2rem;">
                        <button type="button" onclick="document.getElementById('regModal').style.display='none'" style="flex:1;background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:0.75rem;font-family:'DM Sans',sans-serif;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">Cancelar</button>
                        <button type="submit" id="regSubmitBtn" style="flex:1;background:#C6A972;color:#0a0a0a;border:none;padding:0.75rem;font-family:'DM Sans',sans-serif;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">Criar Conta</button>
                    </div>
                    <p id="regError" style="color:#f87171;font-size:0.78rem;margin-top:0.75rem;display:none;"></p>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('regForm').addEventListener('submit', handleRegistration);
    } else {
        document.getElementById('regModal').style.display = 'flex';
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const telefone = document.getElementById('regTelefone').value.trim();

    if (!nome || !email || !telefone) {
        document.getElementById('regError').textContent = 'Preencha todos os campos.';
        document.getElementById('regError').style.display = 'block';
        return;
    }

    const btn = document.getElementById('regSubmitBtn');
    btn.textContent = 'Salvando...';
    btn.disabled = true;

    try {
        // Salvar lead no Supabase
        await fetch(`${SUPABASE_URL}/rest/v1/cadastros_leads`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                nome: nome,
                email: email,
                telefone: telefone,
                background_titulo: 'Gerador de Carrossel'
            })
        });

        // Salvar na sessao para nao pedir novamente
        sessionStorage.setItem('carrossel_lead', JSON.stringify({ nome, email }));

        // Fechar modal e gerar
        document.getElementById('regModal').style.display = 'none';
        generateCarousel();

    } catch (err) {
        document.getElementById('regError').textContent = 'Erro ao salvar. Tente novamente.';
        document.getElementById('regError').style.display = 'block';
    } finally {
        btn.textContent = 'Criar Conta';
        btn.disabled = false;
    }
}
