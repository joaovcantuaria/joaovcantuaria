# Landing Page - João V. Cantuária

Landing page profissional e elegante para serviços de publicidade e fotografia.

## 🎨 Design

- **Paleta de Cores:**
  - Preto (#000000) - Cor principal
  - Dourado (#FFD700) - Cor de destaque
  - Branco (#FFFFFF) - Cor secundária

- **Tipografia:**
  - Playfair Display (títulos)
  - Montserrat (corpo do texto)

## 📋 Funcionalidades

- ✅ Design responsivo (desktop, tablet e mobile)
- ✅ Menu de navegação com rolagem suave
- ✅ Hero section impactante com CTA
- ✅ Seção de serviços com cards animados
- ✅ Carrossel de portfólio interativo
- ✅ Carrossel de depoimentos com autoplay
- ✅ Formulário de contato integrado com WhatsApp
- ✅ Botão flutuante do WhatsApp
- ✅ Botão "Voltar ao topo"
- ✅ Animações suaves ao rolar a página
- ✅ Menu mobile responsivo

## 🚀 Como Usar

### 1. Substituir Conteúdo

#### Número do WhatsApp
Substitua `5511999999999` pelo seu número no formato internacional (código do país + DDD + número):

**Arquivos a editar:**
- `index.html` (4 ocorrências)
- `script.js` (1 ocorrência)

**Exemplo:** Para o número (11) 98765-4321, use: `5511987654321`

#### Links de Redes Sociais
Substitua os links das redes sociais:

```html
<!-- Instagram -->
https://instagram.com/joaovcantuaria

<!-- TikTok -->
https://tiktok.com/@joaovcantuaria
```

#### E-mail
Substitua `contato@joaovcantuaria.com` pelo seu e-mail real.

### 2. Adicionar Imagens

#### Logo
Substitua o placeholder `logo-placeholder.png` pela logo real da empresa.

#### Imagem/Vídeo de Fundo do Hero
Para adicionar um vídeo de fundo, descomente o código no `index.html`:

```html
<video autoplay muted loop class="hero-video">
    <source src="hero-video.mp4" type="video/mp4">
</video>
```

Ou adicione uma imagem de fundo via CSS no `.hero-background`.

#### Portfólio
Substitua os placeholders das imagens do portfólio:
- `portfolio-1-placeholder.jpg`
- `portfolio-2-placeholder.jpg`
- `portfolio-3-placeholder.jpg`
- `portfolio-4-placeholder.jpg`
- `portfolio-5-placeholder.jpg`
- `portfolio-6-placeholder.jpg`

**Dimensões recomendadas:** 800x600px (proporção 4:3)

### 3. Personalizar Conteúdo

#### Títulos e Textos
Edite os textos no arquivo `index.html` conforme sua necessidade:
- Títulos das seções
- Descrições dos serviços
- Depoimentos de clientes
- Informações de contato

#### Cores
Para alterar as cores, edite as variáveis CSS no início do arquivo `styles.css`:

```css
:root {
    --color-primary: #000000;     /* Preto */
    --color-secondary: #FFFFFF;   /* Branco */
    --color-accent: #FFD700;      /* Dourado */
    --color-accent-dark: #DAA520; /* Dourado escuro */
}
```

## 📁 Estrutura de Arquivos

```
├── index.html          # Estrutura HTML da página
├── styles.css          # Estilos CSS
├── script.js           # Funcionalidades JavaScript
├── README.md           # Este arquivo
└── [imagens]           # Suas imagens (logo, portfólio, etc.)
```

## 🌐 Hospedagem

### Opções de Hospedagem Gratuita:
1. **GitHub Pages** (recomendado)
2. **Netlify**
3. **Vercel**
4. **Hostinger** (planos pagos)

### Deploy no GitHub Pages:
1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Vá em Settings > Pages
4. Selecione a branch main
5. Seu site estará em: `https://seuusuario.github.io/nome-do-repositorio`

## 🔧 Customizações Avançadas

### Desativar Autoplay dos Carrosséis
Comente as linhas no `script.js`:

```javascript
// setInterval(nextSlide, 5000);            // Portfólio
// setInterval(nextTestimonialSlide, 6000); // Depoimentos
```

### Adicionar Google Analytics
Adicione antes do fechamento da tag `</head>` no `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXXXX-X"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXXXXXX-X');
</script>
```

### Adicionar Favicon
Adicione no `<head>` do `index.html`:

```html
<link rel="icon" type="image/png" href="favicon.png">
```

## 📱 Responsividade

O site é totalmente responsivo e se adapta a:
- 📱 Smartphones (até 480px)
- 📱 Tablets (481px - 768px)
- 💻 Laptops (769px - 1024px)
- 🖥️ Desktops (1025px+)

## 🎯 Otimizações SEO

Para melhorar o SEO, adicione:
1. Meta tags personalizadas
2. Sitemap.xml
3. Robots.txt
4. Schema.org markup
5. Otimização de imagens (comprima antes de fazer upload)

## 📞 Suporte

Para dúvidas ou customizações adicionais, entre em contato através das informações no site.

---

**Desenvolvido com ❤️ para João V. Cantuária**

*"Estratégias Visuais que Transformam"*
