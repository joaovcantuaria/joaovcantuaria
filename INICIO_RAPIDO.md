# 🚀 Guia de Início Rápido

## Landing Page João V. Cantuária - Publicidade e Fotografia

### ⏱️ Tempo estimado: 15-30 minutos

---

## 📝 Passo 1: Abrir os Arquivos (2 min)

1. Abra o arquivo `index.html` em um editor de texto (Notepad++, VS Code, Sublime Text)
2. Tenha também aberto: `styles.css` e `script.js`

---

## 🔧 Passo 2: Configurações Essenciais (5 min)

### 2.1 Número do WhatsApp

**Encontre e substitua** `5511999999999` pelo seu número real:

```
CTRL+F (ou CMD+F no Mac)
Buscar: 5511999999999
Substituir por: SEU_NUMERO
```

**Formato correto:** Código do país + DDD + Número (sem espaços)
- Exemplo: `5511987654321` para (11) 98765-4321

**Arquivos:** `index.html` (4 vezes) e `script.js` (1 vez)

### 2.2 E-mail

**Substitua:** `contato@joaovcantuaria.com` pelo seu e-mail

**Arquivo:** `index.html` (seção de contato)

### 2.3 Redes Sociais

**Substitua os links:**
- Instagram: `https://instagram.com/joaovcantuaria`
- TikTok: `https://tiktok.com/@joaovcantuaria`

**Arquivo:** `index.html` (seção contato e footer)

---

## 🖼️ Passo 3: Adicionar Imagens (10 min)

### Imagens Obrigatórias:

1. **Logo:** `logo-placeholder.png`
2. **Portfólio:** 
   - `portfolio-1-placeholder.jpg`
   - `portfolio-2-placeholder.jpg`
   - `portfolio-3-placeholder.jpg`
   - `portfolio-4-placeholder.jpg`
   - `portfolio-5-placeholder.jpg`
   - `portfolio-6-placeholder.jpg`
3. **Hero Background:** `hero-bg.jpg` (ou vídeo)

**Coloque todas as imagens na mesma pasta dos arquivos HTML, CSS e JS**

> 📖 Veja detalhes completos em: `LISTA_DE_IMAGENS_NECESSARIAS.txt`

---

## ✍️ Passo 4: Personalizar Textos (5 min)

Edite no `index.html`:

1. **Hero Section** (linha ~55):
   - Título principal
   - Subtítulo
   
2. **Sobre** (linha ~90):
   - Sua descrição pessoal
   
3. **Serviços** (linhas ~100-130):
   - Títulos e descrições dos 4 serviços
   
4. **Portfólio** (linhas ~145-220):
   - Títulos dos projetos
   - Descrições dos projetos
   
5. **Depoimentos** (linhas ~235-300):
   - Textos dos depoimentos
   - Nomes dos clientes
   - Empresas

---

## 🎨 Passo 5: Ajustar Cores (Opcional - 3 min)

Se quiser mudar as cores, edite o `styles.css` (linhas 11-15):

```css
:root {
    --color-primary: #000000;     /* Preto - Cor principal */
    --color-secondary: #FFFFFF;   /* Branco */
    --color-accent: #FFD700;      /* Dourado - Destaque */
    --color-accent-dark: #DAA520; /* Dourado escuro */
}
```

---

## 👀 Passo 6: Testar Localmente (2 min)

1. Clique duas vezes no arquivo `index.html`
2. O site abrirá no seu navegador
3. Teste:
   - [ ] Menu de navegação
   - [ ] Botões do WhatsApp
   - [ ] Carrossel do portfólio
   - [ ] Carrossel de depoimentos
   - [ ] Formulário de contato
   - [ ] Links das redes sociais

**Teste também no celular:**
- Abra o DevTools (F12)
- Clique no ícone de celular
- Teste o menu mobile

---

## 🌐 Passo 7: Publicar o Site (5-10 min)

### Opção A: GitHub Pages (Gratuito - Recomendado)

1. Crie conta em [github.com](https://github.com)
2. Clique em "New Repository"
3. Nome: `joaovcantuaria` (ou o que preferir)
4. Marque "Public"
5. Clique em "Create repository"
6. Clique em "uploading an existing file"
7. Arraste todos os arquivos do site
8. Clique em "Commit changes"
9. Vá em: **Settings** → **Pages**
10. Em "Branch", selecione "main"
11. Clique em "Save"
12. Aguarde 1-2 minutos
13. Seu site estará em: `https://seuusuario.github.io/joaovcantuaria`

### Opção B: Netlify (Gratuito - Mais Rápido)

1. Acesse [netlify.com](https://netlify.com)
2. Clique em "Add new site" → "Deploy manually"
3. Arraste a pasta do projeto
4. Pronto! Site publicado instantaneamente
5. URL: `https://nome-aleatorio.netlify.app`
6. Você pode personalizar o nome nas configurações

### Opção C: Vercel (Gratuito - Profissional)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New" → "Project"
3. Arraste a pasta do projeto
4. Clique em "Deploy"
5. Pronto!

---

## 📋 Checklist Final

Antes de considerar o site pronto:

- [ ] Número do WhatsApp está correto e funcionando
- [ ] E-mail está correto
- [ ] Links das redes sociais funcionam
- [ ] Logo aparece corretamente
- [ ] Todas as 6 imagens do portfólio estão visíveis
- [ ] Textos foram personalizados
- [ ] Depoimentos foram atualizados
- [ ] Testei no desktop
- [ ] Testei no celular
- [ ] Botão flutuante do WhatsApp funciona
- [ ] Formulário de contato redireciona para o WhatsApp
- [ ] Carrosséis funcionam (setas e indicadores)
- [ ] Menu mobile funciona
- [ ] Site foi publicado online

---

## 🆘 Problemas Comuns

### Imagens não aparecem
- Verifique se os nomes dos arquivos estão EXATAMENTE como no código
- Verifique se as imagens estão na mesma pasta do index.html
- Nomes de arquivo são case-sensitive (maiúsculas/minúsculas importam)

### WhatsApp não abre
- Confira o formato do número: código país + DDD + número
- Exemplo correto: `5511987654321`
- Sem espaços, parênteses ou traços

### Site não fica responsivo
- Limpe o cache do navegador (CTRL+SHIFT+DEL)
- Atualize a página (F5 ou CTRL+R)

### Carrossel não funciona
- Verifique se o arquivo `script.js` está na mesma pasta
- Abra o Console do navegador (F12) e veja se há erros

### Menu mobile não abre
- Certifique-se de ter todas as 3 tags `<span>` dentro do `.menu-toggle`
- Verifique se o `script.js` está carregando

---

## 📞 Próximos Passos

1. **Domínio personalizado** (opcional):
   - Registre `www.joaovcantuaria.com`
   - Conecte ao seu serviço de hospedagem

2. **Analytics** (recomendado):
   - Configure Google Analytics
   - Acompanhe visitantes e conversões

3. **SEO** (recomendado):
   - Registre no Google Search Console
   - Crie sitemap.xml
   - Adicione meta tags de redes sociais

4. **Melhorias**:
   - Adicione mais projetos ao portfólio
   - Atualize depoimentos reais de clientes
   - Adicione blog (opcional)

---

## 📚 Documentação Completa

- `README.md` - Documentação técnica completa
- `INSTRUCOES_PERSONALIZACAO.txt` - Guia detalhado de personalização
- `LISTA_DE_IMAGENS_NECESSARIAS.txt` - Especificações de imagens

---

## 🎉 Parabéns!

Seu site está pronto para impressionar clientes e gerar novos negócios!

**"Estratégias Visuais que Transformam"** ✨📸

---

*Desenvolvido para João V. Cantuária - Publicidade e Fotografia*
