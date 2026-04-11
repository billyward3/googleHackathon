# CivicHousing

A two-part civic technology platform built for the **Google x CSG x T4SG 2026 Hackathon** (Track 5: Housing & Urban Development). CivicHousing addresses the challenge of making public housing systems more accessible and transparent for the people who need them most — seniors, disabled individuals, and low-income families in Detroit.

## The Problem

Public housing allocation is opaque, difficult to navigate, and especially inaccessible for vulnerable populations. Applicants face confusing processes, limited visibility into available units, and no way to express meaningful preferences about where they live. Meanwhile, allocation algorithms like FIFO (first-come, first-served) often produce suboptimal outcomes that could be improved through coordinated exchange.

## What We Built

### 1. Personalized Housing Realtor (`/realtor`)

An accessibility-first wizard that acts as a "personal realtor" for public housing applicants. Designed for seniors and disabled users with large touch targets, plain language, and a guided step-by-step flow.

**How it works:**
- **Step 1 — Household:** Family size, bedroom needs, pets
- **Step 2 — Accessibility:** Wheelchair access, senior-friendly layout, stairs tolerance, free-text accommodations
- **Step 3 — Location:** Public transit importance, parking needs
- **Step 4 — Review:** Full summary with edit buttons, plus "Talk to a virtual agent" and "Call us" options

After completing the wizard, the system scores all 76 Detroit housing listings against the applicant's profile and presents ranked results alongside an interactive Leaflet map showing:
- Numbered listing markers (clickable)
- Points of interest: hospitals, transit hubs, schools, government services
- Detailed property cards with demo photos, specs, and match warnings

Applicants can **drag to reorder** their rankings, then save and feed their preferences directly into the allocation simulation.

### 2. Allocation Simulation (`/`)

An interactive visualization comparing two housing allocation algorithms:

- **FIFO (First-In, First-Out):** Sequential vacancy filling — each unit is assigned to the next eligible household in queue order. Simple but often produces suboptimal matches.
- **TTC (Top Trading Cycles):** Starting from the FIFO baseline, households participate in coordinated exchange cycles where everyone involved moves to a higher-preference unit simultaneously. No one is made worse off.

The simulation runs on real Detroit housing data (76 units from the One Billion Dollar Affordable Multifamily Housing Construction Sites dataset) and demonstrates how TTC can improve outcomes over FIFO.

**Features:**
- Animated step-by-step FIFO and TTC execution on a Leaflet map
- Speed control up to 20x for fast demos
- Skip to TTC / Skip to End buttons for instant computation
- Metrics dashboard: improved, unchanged, opted out counts with average rank comparisons
- Click any household or unit for detailed information
- State persistence — navigate to detail pages and back without losing simulation progress

### 3. The Connection

The realtor wizard's output (ranked preferences + household profile) feeds directly into the first queue entry (Maya Chen) in the allocation simulation. This demonstrates the full pipeline: **accessible intake → personalized ranking → fair allocation**.

## Tech Stack

- **Next.js 15** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations and drag-to-reorder
- **Leaflet / react-leaflet** for interactive maps
- **OpenStreetMap** tiles (no API key required)

## Data

Housing data sourced from Detroit's One Billion Dollar Affordable Multifamily Housing Construction Sites, augmented with simulated attributes (accessibility, transit proximity, amenities) for demonstration purposes.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/realtor](http://localhost:3000/realtor) to start the housing wizard, or [http://localhost:3000](http://localhost:3000) for the allocation simulation.

## Project Structure

```
src/
  app/
    page.tsx                  — Allocation simulation (FIFO + TTC)
    realtor/page.tsx          — Personalized housing wizard
    api/listings/             — Housing listings API (serves CSV data as JSON)
    house/page.tsx            — Unit detail page
    person/page.tsx           — Household detail page
  components/
    realtor/                  — Wizard steps, results panel, map, listing cards
    map-leaflet.tsx           — Simulation map with TTC visualization
    family-panel.tsx          — FIFO queue and household list
    house-panel.tsx           — Unit inspector and metrics
    top-bar.tsx               — Controls, speed slider, phase display
  lib/
    realtor/                  — Scoring engine, API client, rankings persistence
    fifoEngine.ts             — FIFO vacancy-fill logic
    ttcEngine.ts              — TTC graph building, cycle detection, settlement
    metrics.ts                — Before/after comparison metrics
  data/
    housingData.ts            — 76 Detroit housing units from CSV
    seedScenario.ts           — Simulation initialization
  types/
    housing.ts                — Domain types
```

## Hackathon Context

**Google x CSG x T4SG 2026 Hackathon**
Track 5: Housing & Urban Development
Prompt: *"How might we support tenants in navigating housing systems?"*

Built in one day. Repurposes patterns from [career-ops]((https://github.com/santifer/career-ops)), an open-source job search automation tool, applying the same profile-based evaluation pipeline to housing search.

## Verification

```bash
npm run lint
npm run build
```
