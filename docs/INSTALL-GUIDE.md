# 📦 INSTALLATION GUIDE — Synchronous Generator Simulator

**Status**: Base setup COMPLETED, masih perlu manual installation untuk Vite + Playwright

---

## ✅ PHASE 1 — COMPLETED (Auto-install)

Package yang sudah terinstall:

```json
{
  "devDependencies": {
    "c8": "^12.0.0",
    "eslint": "^10.10.0",
    "husky": "^9.1.7",
    "lint-staged": "^17.5.0",
    "prettier": "^3.9.6",
    "vitest": "^5.0.0"
  }
}
```

Setup yang sudah dibuat:
- ✅ `eslint.config.js` - ESLint configuration untuk mencegah bug subtle
- ✅ `.prettierrc.json` - Prettier format config
- ✅ `vitest.config.js` - Vitest test config
- ✅ `package.json` - Updated dengan scripts & lint-staged
- ✅ `install-tools.sh` - Script instalasi otomatis

---

## 🔧 PHASE 2 — VITE INSTALLATION (MANUAL)

Pindah ke folder proyek:

```bash
cd "LEVEL 2 - SYNCHRONOUS GENERATOR SIMULATOR"
```

Install Vite:

```bash
npm install --save-dev vite
```

**Script yang sudah ditambahkan ke package.json:**
```json
"scripts": {
  "dev": "vite",
  "preview": "vite preview",
  "build": "vite build"
}
```

**Quick start dev server:**
```bash
npm run dev
# Port default: http://localhost:5173 (otomatis dibuka di browser)
```

---

## 🌐 PHASE 3 — PLAYWRIGHT VISUAL TESTING (MANUAL)

Install Playwright browser:

```bash
# Install package
npm install --save-dev @playwright/test

# Install Chromium browser
npx playwright install chromium
```

**Script yang siap (check package.json sudah ada):**

```json
// npm test: Cover physics & renderer tests dengan coverage
// npm run lint: Run ESLint
// npm run format: Format code dengan Prettier
// npm run lint:fix: Fix auto ESLint
// npm run format:check: Cek format tanpa ubah
// npm run prepare: Setup Githooks (jika ingin otomatis)
```

---

## 🐚 ALTERNATIVE: Jalankan Script Otomatis (RECOMMENDED)

Jika tidak ingin install manual, ada script yang sudah dibuat:

```bash
cd "LEVEL 2 - SYNCHRONOUS GENERATOR SIMULATOR"
chmod +x install-tools.sh
./install-tools.sh
```

Script akan:
1. ✅ Install Vite + Playwright
2. ✅ Setup Husky gut hooks
3. ✅ Generate .husky/pre-commit dengan auto test
4. ✅ Update package.json scripts
5. ✅ Generate packages-lock.json

---

## 🧪 QUICK TEST SETELAH INSTALL

Jika Vite sudah terinstall:

```bash
# Jalankan test suite
npm test

# Jalankan lint
npm run lint

# Jalankan format check
npm run format:check

# Jalankan dev server
npm run dev
```

---

## 📁 FILE SETUP SEKARANG

Sudah dibuat:
- `eslint.config.js` - ESLint configuration (#1 bug prevention)
- `.prettierrc.json` - Code formatting
- `vitest.config.js` - Vitest coverage settings
- `install-tools.sh` - Auto-install script

---

## 🎯 NEXT STEPS

1. **Install Vite** (Phase 2):
   ```bash
   npm install --save-dev vite
   ```

2. **Setup Playwright** (Phase 3):
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install chromium
   ```

3. **Jalankan install script** (alternatif):
   ```bash
   ./install-tools.sh
   ```

4. **Test segera:**
   ```bash
   npm test
   npm run dev
   ```

---

## 🆘 TROUBLESHOOTING

**Error: "kiro-cf[1m] is temporarily unavailable"**

Ini bug classifier yang bersifat sementara. Cara workaround:

1. Tunggu beberapa menit
2. Jalankan install manual (seperti di atas)
3. ATAU gunakan `install-tools.sh`

**Error: "npm install-scripts blocked"**

```bash
# Pilih salah satu:
npm install-scripts approve puppeteer
# atau
npm install-scripts ls
```

---

## 📚 REFERENCES

- Vitest docs: https://vi.sh
- Playwright test: https://playwright.dev
- ESLint config: `/eslint.config.js`
- Prettier: `.prettierrc.json`
- CLAUDE.md: Panduan proyek lengkap

---

**Last updated**: 2026-09-08
**Package versions**: vitest@^5.0.0, c8@^12.0.0, eslint@^10.10.0, prettier@^3.9.6, husky@^9.1.7, lint-staged@^17.5.0