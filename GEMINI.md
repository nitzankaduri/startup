# Spawn.gg — Master Engineering & Design Rules

This document is the single source of truth for all AI agents and engineers working on **Spawn.gg** (AI prompt-to-3D-game platform). Every rule here is non-negotiable.

---

## 1. Exact Tech Stack

- **Frontend:**
  - React (Vite) — **pure `.jsx` ONLY (STRICTLY NO TypeScript, NO `.ts` or `.tsx` files)**
  - Tailwind CSS
  - `shadcn/ui` conventions (Radix/accessible primitives styled with Tailwind)
  - Lucide Icons (`lucide-react`)
  - Zustand (`zustand`) for client state management
  - React Three Fiber (`@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `three`) for 3D rendering & physics
- **Backend:**
  - Python (`FastAPI`, `uvicorn`) inside `/backend`
- **Database:**
  - MongoDB (`motor` async driver) for flexible JSON game schemas
- **Hosting Target:**
  - Render.com

---

## 2. Code Architecture & File Limits

- **Feature-Based Modular Structure:**
  - `frontend/src/features/lobby/` — Game discovery, prompt input, and launch flow
  - `frontend/src/features/sandbox/` — 3D R3F runtime, Rapier physics, camera, and controls
  - `frontend/src/features/editor/` — Live scene/schema inspector and AI tweak controls
  - `frontend/src/shared/` — Reusable UI primitives (`shared/components`), hooks, and utilities
- **150-Line Hard Limit:**
  - Every code file MUST stay strictly under **150 lines**.
  - Proactively split logic into custom hooks, pure helper modules, and focused sub-components before a file approaches 150 lines.
- **Self-Documenting & Living Documentation:**
  - Maintain `docs/ARCHITECTURE.md` and `docs/CHANGELOG.md`.
  - Update both docs after every feature or architectural change.

---

## 3. UI & Design System Rules (Warm Editorial & Tactile Studio)

- **Aesthetic:**
  - Warm Editorial & Tactile Studio aesthetic inspired by **Apple**, **Notion**, **Linear Light**, and modern minimalist **Pinterest** UI.
- **FORBIDDEN:**
  - NEVER use neon colors (`cyan`, `magenta`, `lime`, `#00ff00`), heavy `box-shadow` glows, gloomy dark-gray boxes, or cluttered sci-fi borders.
- **Strict Dual-Theme Palette (Beige Light + Space Grey Black Dark):**
  - **Light Mode (Warm Beige):**
    - Primary Canvas Background: `#F6F4EF` (Warm Alabaster / Editorial Beige)
    - Elevated Cards / Panels: `#FFFFFF` (Crisp Pure White) with `1px solid #E6E2D8` border and soft ambient elevation `shadow-[0_4px_20px_rgba(24,22,18,0.05)]`
    - Secondary Surface / Chips: `#EFECE4` (Soft Sand)
    - Primary Text & Action Buttons: `#181715` fill with `#F6F4EF` crisp text, hover `#2E2C28`
    - Muted / Secondary Text: `#6E6A61` (Warm Stone)
  - **Dark Mode (Midnight Blue-Black-Grey):**
    - Primary Canvas Background: `#0A0D14` (Deep Midnight Black-Blue)
    - Elevated Cards / Panels: `#111622` (Midnight Navy-Slate) with `1px solid #232E42` border
    - Secondary Surface / Chips: `#182032` (Steel Blue-Grey Chip)
    - Primary Text & Action Buttons: `#F1F5F9` fill with `#0A0D14` crisp text, hover `#E2E8F0`
    - Muted / Secondary Text: `#94A3B8` (Cool Slate Grey)
  - **Shared Warm Accent:** `#D96B27` (Terracotta/Amber) used sparingly ONLY for active states, progress, or win badges
- **Layout & Typography:**
  - Generous whitespace (`p-6`, `gap-6`)
  - Softly rounded containers (`rounded-xl`, `rounded-2xl`)
  - Typography: `Inter` sans-serif font with tight display tracking (`tracking-tight`)
