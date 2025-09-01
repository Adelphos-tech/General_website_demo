# Voice Agent + Real‑Estate Demo

A split‑screen demo that pairs a mock real‑estate website with a voice assistant. The left pane is a clean, PropertyGuru‑style site (search, cards, sections). The right pane hosts an AI globe assistant powered by `@vapi-ai/web` and renders live transcripts as chat.

## Routes

- `/` — Split view (Real‑Estate on the left, Voice Assistant on the right)
- `/assistant` — Assistant‑only view (full‑screen globe + chat)

## Features

- Real‑estate UI: hero + search, featured listings, neighborhood guides, agents, CTA
- Voice assistant: tap the globe to start/stop; transcripts appear as bubbles
- HTTPS‑ready preview for mic permissions (via Vite + basic SSL)
- Responsive layout (assistant stacks below on small screens)

## Tech Stack

- React 18 + Vite
- `@vapi-ai/web` (voice assistant SDK)
- Radix UI primitives (used by assistant chat components)
- `motion` for subtle animations
- React Router for routes

## Quick Start

Prereqs: Node 18+

1) Install

```bash
npm install
```

2) Configure environment

Create `.env.local` in the repo root:

```
VITE_VAPI_PUBLIC_KEY=YOUR_PUBLIC_KEY
VITE_VAPI_ASSISTANT_ID=YOUR_ASSISTANT_ID   # optional
```

3) Run (HTTPS dev server)

```bash
npm run dev
```

Open: https://localhost:5173/ (or the printed port). Mic works on localhost over HTTPS.

4) Production build + preview (also HTTPS)

```bash
npm run build
npm run preview
```

Open: https://localhost:4173/ (or the printed port).

## Project Structure

```
src/
  main.tsx                   # Router: '/' split view, '/assistant' assistant‑only
  NewUIApp.tsx               # Assistant‑only wrapper (used by '/assistant')
  site/
    RealEstateApp.tsx        # Split layout (website left, assistant right)
    AssistantSidebar.tsx     # Self‑contained assistant (globe + chat) used on the site
    site.css                 # Real‑estate styles (white pane, red CTAs)
  untitled/components/       # Assistant UI components (globe, conversation, UI primitives)
```

## Customization

- Branding/text: edit `src/site/RealEstateApp.tsx` and `src/site/site.css`
- Listings/cards: update the image URLs and titles in `RealEstateApp.tsx`
- Assistant behavior: tweak the inline fallback in `AssistantSidebar.tsx`
  - Model prompt, voice provider/voiceId, transcriber provider/model
- Route default: change the array in `src/main.tsx` if you want `/assistant` as the home page

## Deployment

Any static host (Vercel/Netlify/etc.).

- Build: `npm run build` (outputs `dist/`)
- Set Environment Variables in host settings:
  - `VITE_VAPI_PUBLIC_KEY`
  - `VITE_VAPI_ASSISTANT_ID` (optional)
- Use an HTTPS domain so mic permissions work across devices

## Troubleshooting

- White screen at start: check `.env.local` — `VITE_VAPI_PUBLIC_KEY` is required
- Mic not allowed: use HTTPS and a secure origin (localhost OK, LAN IPs need HTTPS)
- “start‑method‑error” or no audio: verify public key and assistant ID belong to the same Vapi project
- Port confusion: the preview/dev port is printed in your terminal; open that exact URL
- Cache: hard refresh (Cmd+Shift+R) if UI changes don’t appear

## Scripts

- `npm run dev` — Dev server (HTTPS)
- `npm run build` — Production build
- `npm run preview` — Serve production build (HTTPS)

---
Happy hacking! If you want this split layout embedded into another site or CMS, copy `src/site/AssistantSidebar.tsx` and mount it in your app’s layout.
