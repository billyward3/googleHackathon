# CivicHousing

A single-page hackathon demo that compares sequential FIFO public housing allocation against a TTC-inspired constrained reallocation mechanism.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo flow

1. Start in the initial setup state.
2. Edit queue household attributes, preferences, house properties, and house priority orderings.
3. Click `Run FIFO`.
4. Watch original occupants move out one by one while the queue visibly advances and fills vacancies.
5. After FIFO completes, edit household preferences again, toggle TTC participation, and revise house priority orderings.
6. Click `Run TTC`.
7. Watch the map overlay reveal active exchange edges and highlighted cycles.
8. Use the right panel to narrate:
   - who improved
   - who stayed the same
   - who opted out
   - who had no reachable beneficial exchange

## What the demo emphasizes

- FIFO is local, sequential, and vacancy-by-vacancy.
- TTC starts from the FIFO baseline and coordinates mutually beneficial exchange cycles.
- House properties lock as soon as FIFO starts.
- Household preferences and attributes reopen after FIFO so the presenter can tee up TTC.
- Participating households never move to a worse-ranked valid home.

## Seeded scenario notes

- 12 homes start fully occupied by original residents.
- 12 waiting households sit in a FIFO queue.
- The seeded preferences and house priorities intentionally create a visually suboptimal FIFO outcome.
- TTC then uncovers several clear cycles, including accessibility-sensitive exchange.

## Project structure

- `src/app/page.tsx`: page orchestration, controls, phase transitions, and animation timing
- `src/components/`: top bar, family panel, central map, and house/results panel
- `src/data/seedScenario.ts`: seeded houses, households, priorities, and FIFO move-out order
- `src/lib/fifoEngine.ts`: FIFO vacancy fill logic
- `src/lib/ttcEngine.ts`: TTC-inspired graph building, cycle detection, and settlement
- `src/lib/metrics.ts`: before/after summary metrics
- `src/types/housing.ts`: domain types

## Verification

```bash
npm run lint
npm run build
```
