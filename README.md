# 🏎️ Floripa Racing - Galeria de Fotos

Galeria de fotos moderna desenvolvida em **React + Vite** com deploy automatizado para o **GitHub Pages**.

Inspirada na identidade visual oficial do Floripa Racing (logo original, paleta preta/vermelha/neon, tipografia Orbitron e estética automotiva de alta performance).

---

## 📸 Como adicionar novas fotos e datas

O processo é **100% automático**:

1. Crie uma pasta dentro de `public/assets/` com a data desejada (por exemplo: `DD_MM_AAAA` como `13_11_2026`).
2. Coloque as fotos dentro dela (suporta `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg`).

Exemplo de estrutura:
```text
public/assets/
  ├── 13_11_2026/
  │    ├── foto1.jpg
  │    ├── foto2.jpg
  │    └── foto3.jpg
  └── 20_11_2026/
       ├── carro1.png
       └── largada.jpg
```

3. Faça commit e push no GitHub:
```bash
git add public/assets/
git commit -m "feat: adiciona fotos de 13/11/2026"
git push origin main
```

O **GitHub Actions** compilará a galeria e atualizará o site do GitHub Pages automaticamente!

---

## ⚡ Recursos do Projeto

- **Organização por Datas**: Abas e botões dinâmicos ordenados da data mais recente para a mais antiga.
- **Download em Lote (.ZIP)**: Permite ao usuário baixar todas as fotos de uma data específica em um único arquivo compactado com apenas um clique.
- **Download Individual**: Botão de download direto em cada card de foto.
- **Visualizador Lightbox**: Permite navegar em tela cheia com setas do teclado (`←` e `→`) e tecla `Esc`.
- **Design Moderno e Responsivo**: UI dark mode com visual racing futurista, vidro fosco (glassmorphism) e badges com contadores.
- **Pronto para GitHub Pages**: Arquivo de workflow já configurado em `.github/workflows/deploy.yml`.

---

## 🛠️ Comandos Locais

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (já atualiza as pastas de fotos)
npm run dev

# Gerar build de produção
npm run build
```

---

## 🚀 Como ativar o GitHub Pages no seu repositório

1. No repositório do GitHub, vá em **Settings** > **Pages**.
2. Na seção **Build and deployment** > **Source**, selecione: **GitHub Actions**.
3. Ao fazer o push na branch `main` ou `master`, o workflow `.github/workflows/deploy.yml` fará o deploy automático!
