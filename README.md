<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=EarnGen+AI" alt="EarnGen AI Logo" width="120" height="120" />
  <h1>🚀 EarnGen AI: The Next-Gen Autonomous Gig Ecosystem</h1>
  <p>
    <b>Where AI meets human potential. A gamified, secure, and intelligent marketplace for the future of work.</b>
  </p>
</div>

---

## 🌟 The Vision

**EarnGen AI** is not just another freelance marketplace—it is an intelligent ecosystem designed to bridge the gap between talent, upskilling, and opportunity. Built with a modern, cutting-edge tech stack, it gamifies the freelance experience, integrates AI directly into the workflow, and provides built-in enterprise-grade security.

Whether you're managing complex projects in **Sprints**, signing **Digital NDAs**, learning new skills, or proving your work, EarnGen AI is designed to make earning intuitive and autonomous.

---

## 🔥 Novel Features & Differentiators

### 🤖 1. "Speak with AI" (Interactive Assistant)
Why work alone? EarnGen AI features a dedicated `/speak-with-ai` module. This allows freelancers and clients to converse with an AI agent for project brainstorming, requirement analysis, interview preparation, and dynamic support.

### 📈 2. Gamified Work (Leaderboards & Sprints)
Freelancing can be isolating. We bring the thrill of progression through our `/leaderboard` and `/sprint` features.
- **Sprints:** Manage your workflow in agile sprints, keeping you on track.
- **Leaderboard:** Earn points, rank up, and compete globally based on successful gig completions and earnings.

### 🔒 3. Frictionless Digital NDAs & Security
Enterprise clients require privacy. Instead of relying on third-party tools, EarnGen AI features built-in NDA signing (`/nda/:exchangeId`) powered by interactive signature canvases (`react-signature-canvas`).

### 🎓 4. Integrated Upskilling
The platform doesn't just extract value; it builds it. The `/upskill` portal provides users with learning paths and assessments (`/assessment`). Improve your skills, prove your knowledge, and automatically unlock higher-paying tiers.

### 🌍 5. Geospatial Discovery (Interactive Maps)
Powered by `Leaflet`, our marketplace goes beyond simple lists. Discover local gigs, localized networking, and visual representations of where opportunities are geographically dense.

### 🧾 6. "Proof of Work" Architecture
Through the `/proof` route, freelancers submit undeniable proof of their completed milestones, ensuring trust and minimizing disputes before payouts are released.

### 💸 7. Granular Income Tracking & Rewards
The dashboard provides rich data visualizations (powered by `Recharts`) for your `/income`. Users can also navigate to `/redeem` to claim rewards, withdraw funds, or exchange points earned on the platform.

---

## 🏗️ Technical Architecture & Stack

EarnGen AI is built for speed, SEO, and massive scalability.

- **Framework:** [TanStack Start](https://tanstack.com/start) / React 19 (SSR enabled for instant loads and SEO).
- **Routing:** File-based routing via `TanStack Router` (Type-safe and lightning fast).
- **State & Data Fetching:** `TanStack Query` seamlessly integrated with the router.
- **Styling:** `Tailwind CSS v4` + `Radix UI` primitives for accessible, beautiful components.
- **Backend & Auth:** [Supabase](https://supabase.com) (PostgreSQL, Edge Functions, Realtime subscriptions).
- **Animations & UI:** `Embla Carousel`, `tw-animate-css`, and custom micro-interactions for a premium feel.

---

## 🗺️ Platform Topography

| Route | Purpose |
| :--- | :--- |
| `/` | Landing & Hero Page |
| `/dashboard` | The central command center for active users. |
| `/explore` | Discover users, gigs, and global opportunities. |
| `/marketplace` | The core bazaar for buying and selling gigs. |
| `/opportunities` | Recommended jobs based on user profiles. |
| `/chats` | Real-time messaging and negotiation. |
| `/profile` & `/r/$username` | Private user management and public portfolio views. |
| `/checkout/$gigId` | Secure checkout and escrow funding for a gig. |

---
