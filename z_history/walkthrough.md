# Project Scaffolding Walkthrough - UNSU Platform

We have successfully created all the directories and configuration files for the **UNSU Platform** based on the approved implementation plan. The design system is fully aligned with the premium editorial styling tokens extracted from the `unsu-ai-dashboard` prototype.

---

## 📁 Created Folder Structure

Here is a summary of the completed directory layout:

```text
d:/000_UNSU/ (프로젝트 루트)
├── 📄 package.json                     # Root monorepo configuration (npm workspaces)
├── 📄 DESIGN.md                        # [SSOT] Cream & gold design tokens, spacing, and typography
├── 📁 .docs/                           # Reference guides (GUIDE_FO, GUIDE_BO, GUIDE_API)
│
├── 📁 fo/                              # Frontend Client (Vite + React 19 + TypeScript + Tailwind v4)
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 📄 index.html
│   └── 📁 src/
│       ├── 📄 main.tsx
│       ├── 📄 App.tsx
│       ├── 📄 index.css                # Custom @theme with OKLCH colors, dot-fields, grid-lines
│       ├── 📁 components/
│       │   ├── 📄 TopAppBar.tsx        # Standard header with routing links
│       │   ├── 📄 BottomNavBar.tsx     # Large mobile touch navigation tab-bar
│       │   └── 📁 ui/
│       │       └── 📄 Button.tsx       # Reusable design button component
│       └── 📁 pages/
│           ├── 📄 HomePage.tsx         # Morning routine, horoscope card, route recommendations
│           └── 📄 SearchResultPage.tsx # G-PAN radar dashboard with simulated SSE RAG streaming
│
├── 📁 bo/                              # Back Office (Vite + React 19 + TypeScript + Tailwind v4)
│   ├── 📄 package.json
│   └── 📁 src/
│       ├── 📄 main.tsx
│       ├── 📄 App.tsx                  # Sidebar routing shell
│       ├── 📄 index.css
│       └── 📁 pages/
│           ├── 📄 PromptPlayground.tsx # Prompt template live testing terminal
│           ├── 📄 ScrapingControl.tsx  # Crawler log viewer & scraper control panel
│           └── 📄 VectorCapacity.tsx   # Supabase Vector DB capacity & latency dashboard
│
└── 📁 api/                             # Backend API (Node + Express + LangGraph + TypeScript)
    ├── 📄 package.json
    ├── 📄 tsconfig.json
    └── 📁 src/
        ├── 📄 server.ts                # Express server with /api/recommend/stream endpoint (SSE)
        ├── 📄 test_workflow.ts         # Local LangGraph state machine test script
        ├── 📁 agents/
        │   ├── 📄 state.ts             # AgentState annotation definitions
        │   ├── 📄 workflow.ts          # Compiled StateGraph (scrape ➔ vectorize ➔ retriever ➔ summarizer)
        │   └── 📁 nodes/
        │       ├── 📄 scrape.ts        # Traffic scraping simulation node (SRP)
        │       ├── 📄 vectorize.ts     # Embeddings (pass-through)
        │       ├── 📄 retriever.ts     # Vector similarity retrieval (pass-through)
        │       └── 📄 summarizer.ts    # AI markdown report & audio TTS script generator
        ├── 📁 schemas/
        │   └── 📄 validation.ts        # Zod input validation rules
        └── 📁 utils/
            └── 📄 urlValidator.ts      # WHATWG security URL whitelist checker
```

---

## 🎨 Design System Alignment (`DESIGN.md` Integration)

The frontend projects (`fo/` and `bo/`) have been configured with:
1. **Editorial Cream Theme**: Custom OKLCH palette mapping (`--color-background`, `--color-foreground`, `--color-card`) for high-contrast viewing.
2. **Gold Accent Point**: Used specifically for revenue metrics, lucky stars, and G-PAN hotzone statuses (`--color-gold`).
3. **Ergonomic Spacing & Layout**: Spacing classes, fluid grids, and custom background animations (`.grid-lines`, `.dot-field`).
4. **Touch Targets**: Buttons and tab links conform to the minimum ergonomic heights (large tap targets) to optimize usability for older drivers.

---

## 🚀 How to Run the Project

Due to an IDE terminal execution wrapper issue on mapped network drives (`D:`), we recommend running the installations directly via your host terminal:

1. **Install all dependencies**:
   ```bash
   npm install
   ```
2. **Run all three services concurrently** (api, fo, bo):
   ```bash
   npm run dev
   ```
   *   **API Server**: http://localhost:3001
   *   **Frontend Client (FO)**: http://localhost:5173
   *   **Back Office (BO)**: http://localhost:5174
