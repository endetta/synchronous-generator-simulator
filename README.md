# 📊 Synchronous Generator Simulator

Simulator interaktif untuk operasi generator sinkron dengan visualisasi real-time.

## 🎯 Fitur Utama

- **Swing Equation** (Kundur 11.1): M·d²δ/dt² = Pm - Pe - D·(dδ/dt)
- **TGOV1 Governor**: Model steam turbine dengan PID control
- **Equal Area Criterion (EAC)**: Analisis stabilitas transient
- **Real Load Response (RLR)**: Profil beban 24 jam IEEE Std 399-1997

## 🚀 Quick Start

### Development Server

```bash
npm run dev
```

Buka http://localhost:5173 di browser.

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Visual regression tests
npx playwright test
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 📁 Struktur Proyek

```
LEVEL 2 - SYNCHRONOUS GENERATOR SIMULATOR/
├── index.html              # Entry point
├── src/
│   ├── main.js             # Orchestrator
│   ├── state.js            # Global state
│   ├── constants.js        # Physics constants
│   ├── physics/            # Physics engines
│   │   ├── swing.js        # RK4 integrator
│   │   ├── tgov1.js        # Governor model
│   │   ├── eac.js          # Equal Area Criterion
│   │   └── rlr.js          # Load profile
│   ├── renderers/          # Visualizations
│   │   ├── phasor.js       # SVG phasor diagram
│   │   ├── pdelta.js       # P-δ curve
│   │   ├── timeSeries.js   # Canvas time series
│   │   └── rlrChart.js     # 24h load chart
│   └── ui/                 # User interface
│       ├── controls.js     # Sliders & buttons
│       ├── panels.js       # Panel toggles
│       └── oosAlarm.js     # Out-of-step alarm
├── tools/
│   ├── lens-harness.js     # DOM stub for testing
│   ├── physics.test.js     # Physics unit tests
│   ├── renderers.test.js   # Renderer tests
│   ├── integration.test.js # E2E tests
│   └── visual.test.js      # Playwright visual tests
├── docs/
│   ├── PRD.md              # Physics specification
│   ├── overview.md         # Project overview
│   └── INSTALL-GUIDE.md    # Installation guide
└── design-plans/           # Development logs

```

## 🧪 Testing Strategy

1. **Unit Tests** (`tools/*.test.js`): Physics & renderer logic
2. **Integration Tests**: End-to-end scenarios
3. **Visual Regression**: Playwright screenshot comparison
4. **Pre-commit Hooks**: Auto-run tests on git commit

## 📖 Referensi Fisika

Semua persamaan dan parameter mengacu pada:
- Kundur, P. (1994). *Power System Stability and Control*. IEEE Press.
- IEEE Std 421.5: Governor models (TGOV1)
- IEEE Std 399-1997: Load profiles (RLR)

Sumber kebenaran: `docs/PRD.md`

## 🛠️ Tools Stack

- **Runtime**: Vanilla ES modules (no build)
- **Dev Server**: Vite 5.x dengan HMR
- **Testing**: Vitest + Playwright
- **Linting**: ESLint 10.x
- **Formatting**: Prettier 3.x
- **Git Hooks**: Husky + lint-staged

## 📝 Development Workflow

1. Buka `CLAUDE.md` untuk panduan lengkap
2. Jalankan `npm run dev` untuk development
3. Tulis tests di `tools/*.test.js`
4. Commit dengan conventional commits (Bahasa Indonesia)
5. Push ke `endetta/synchronous-generator-simulator`

## 🐛 Known Issues

- ~~Bug #1: `none` vs `'none'` di line 1266~~ ✅ FIXED
- Canvas DPR scaling untuk retina displays
- Governor lag T2=3.5s (ini fitur, bukan bug)

## 📄 License

MIT License - Educational purpose

## 🤝 Contributing

Lihat `CLAUDE.md` untuk aturan kontribusi dan coding standards.

---

**Last updated**: 2026-09-08
**Version**: 1.0.0
**Status**: Active Development