# Fortius Consulting + AI Assistant

A split‑screen application that embeds the Fortius Consulting website with an AI voice assistant. The left pane displays the full Fortius website, while the right pane hosts an AI assistant powered by `@vapi-ai/web` with voice and chat capabilities.

## Routes

- `/` — Split view (Fortius website on the left, AI Assistant on the right)
- `/assistant` — Assistant‑only view (full‑screen globe + chat)

## Features

- **Fortius Consulting website** embedded in left pane (https://www.fortius.consulting/)
- **Voice assistant**: tap the globe to start talking; transcripts appear as bubbles
- **Chat mode**: switch to text chat powered by custom n8n webhook
- **Dual mode**: Toggle between Voice and Chat seamlessly
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

Deploy to any static hosting platform (Netlify, Vercel, Cloudflare Pages, etc.).

**⚠️ IMPORTANT**: The `.env.local` file only works locally. For deployment, you must set environment variables in your hosting platform's settings.

### Environment Variables Required

Set these in your hosting platform's environment variable settings:

```
VITE_VAPI_PUBLIC_KEY=da0c9502-f36f-4468-8777-95380cd55a88
VITE_VAPI_ASSISTANT_ID=b3576d6a-b364-4022-9a27-b68d7c693698
```

### Netlify Deployment

This repo includes a `netlify.toml` with a working configuration.

**Steps:**

1. **Connect Repository**
   - Go to Netlify Dashboard → Add new site → Import from Git
   - Connect to GitHub → Select `Adelphos-tech/fortius`

2. **Configure Build Settings** (auto-detected from `netlify.toml`)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20 (set in `netlify.toml`)

3. **Set Environment Variables**
   - Go to Site settings → Environment variables → Add
   - Add `VITE_VAPI_PUBLIC_KEY` = `da0c9502-f36f-4468-8777-95380cd55a88`
   - Add `VITE_VAPI_ASSISTANT_ID` = `b3576d6a-b364-4022-9a27-b68d7c693698`

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Access your live site at the provided HTTPS URL

### Vercel Deployment

**Steps:**

1. **Import Project**
   - Go to Vercel Dashboard → Add New → Project
   - Import from GitHub → Select `Adelphos-tech/fortius`

2. **Configure Build**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables**
   - Add `VITE_VAPI_PUBLIC_KEY` = `da0c9502-f36f-4468-8777-95380cd55a88`
   - Add `VITE_VAPI_ASSISTANT_ID` = `b3576d6a-b364-4022-9a27-b68d7c693698`

4. **Deploy**
   - Click "Deploy"
   - Your site will be live at `yourproject.vercel.app`

## Troubleshooting

- **"⚠️ This demo requires a Vapi API key"** message:
  - **Locally**: Check `.env.local` file exists and has `VITE_VAPI_PUBLIC_KEY`
  - **After deploying**: Set environment variables in your hosting platform (Netlify/Vercel settings)
  - The `.env.local` file does NOT work in production - you MUST set env vars in hosting settings
- **Mic not allowed**: use HTTPS and a secure origin (localhost OK, LAN IPs need HTTPS)
- **"start‑method‑error" or no audio**: verify public key and assistant ID belong to the same Vapi project
- **Port confusion**: the preview/dev port is printed in your terminal; open that exact URL
- **Cache issues**: hard refresh (Cmd+Shift+R) if UI changes don't appear
- **White screen after deploy**: Check that environment variables are set correctly in hosting platform

## Scripts

- `npm run dev` — Dev server (HTTPS)
- `npm run build` — Production build
- `npm run preview` — Serve production build (HTTPS)

---
Happy hacking! If you want this split layout embedded into another site or CMS, copy `src/site/AssistantSidebar.tsx` and mount it in your app’s layout.
