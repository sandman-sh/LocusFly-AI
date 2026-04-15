<div align="center">
  <img src="public/favicon.svg" alt="LocusFly AI Logo" width="100" />
  <h1>LocusFly AI ✈️💰</h1>
  <p><strong>Autonomous Flight Booking Agent powered by PayWithLocus</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Locus_Pay-4101F6?style=for-the-badge" alt="Locus Pay" />
    <img src="https://img.shields.io/badge/Base_Chain-0052FF?style=for-the-badge&logo=base&logoColor=white" alt="Base" />
  </p>
</div>

---

**LocusFly AI** is a fully functional web application that demonstrates the power of autonomous AI agents using the **[PayWithLocus](https://paywithlocus.com/)** platform. It acts as an autonomous travel agent capable of dynamically searching real-world flights, analyzing the shortest/cheapest paths, and seamlessly executing real USDC checkout sessions on the Base chain.

No mock data. The application uses **Locus Wrapped APIs** to execute the heavy-lifting logic and securely routes checkout payments via the Locus Pay API.

## ✨ Features

- **Real-Time Data Extraction**: Utilizes Locus Wrapped APIs (e.g., Brave, Tavily, OpenAI) to aggregate live flight logic.
- **Micro-transaction Agent**: Operates fully on API credits derived dynamically from an active Locus wallet balance (USDC on Base).
- **Intelligent Comparison AI**: Analyzes routes automatically, highlighting the most optimal "Best Route" dynamically minimizing total layover duration and cost.
- **Native USDC Checkout**: Seamless, secure one-click checkout leveraging Locus Checkout sessions. Generates boarding passes dynamically tied to the on-chain TX hash once confirmed.
- **Premium Glassmorphism UI**: Beautiful, lightweight, Framer-motion driven interface avoiding common generic templates.

## 🚀 Getting Started

### Prerequisites

- Node.js `18+`
- A [PayWithLocus](https://app.paywithlocus.com) account with a deployed, funded smart wallet on Base.

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/locusfly-ai.git
cd locusfly-ai
npm install
```

### 2. Environment Setup

Create an `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your **Locus Beta API Key**:

```env
# Your key should start with claw_dev_
VITE_LOCUS_API_KEY=claw_dev_your_actual_api_key_here
```

### 3. Run the Development Server

```bash
npm run dev
```

Visit **http://localhost:5173/** in your browser. The application will securely proxy requests through the Vite backend securely to `beta-api.paywithlocus.com` to completely bypass CORS constraints.

## 🏗️ Architecture

| Layer | Implementation | Purpose |
|-------|----------------|---------|
| **Core UI** | React, Vanilla CSS, Framer Motion | Smooth, premium rendering with highly dynamic micro-animations. |
| **Logic Orchestrator** | `App.jsx` + `flights.js` | Full lifecycle logic and state handling (Connect -> Search -> Results -> Checkouts -> Pass). |
| **Locus Handlers** | `src/lib/locus.js` | Direct interactions with the Locus PaaS (Auth, Balance Verification, X402 Proxy). |
| **Proxy Layer** | Vite Server Proxy | Prevents direct interaction CORS errors by proxying local `/api` calls safely to Locus. |

## 💡 How the Locus Flow Works

1. **Connect:** The app extracts `VITE_LOCUS_API_KEY` and calls `GET /api/pay/balance` (Proxied) to visualize the real USDC available.
2. **Search:** Real search queries are dispatched to autonomous endpoints. Locus deducts fractional micro-USDC natively.
3. **Checkout:** Upon flight selection, `Checkout.jsx` packages the `basePrice`, calculates platform fees, and mounts the external Locus payment portal structure.
4. **Processing:** USDC payment is tracked until the status becomes `CONFIRMED`, returning a verified on-chain `tx_hash` Base ledger proof.

## 🛡️ Best Practices Encountered

- **CORS Bypassing**: Client-side fetch limitations are solved smoothly using `vite.config.js` proxy setups instead of exposing direct fetches.
- **Defensive API Fallbacks**: Dynamic extraction logic gracefully structures Locus responses ignoring hidden characters and irregular object hierarchies to ensure the UI never crashes.
- **Agent Logs**: Real-time human-readable tracking helps operators realize the granular work the AI executes under the hood.

---

> Built dynamically via deep autonomous pairing using Google DeepMind's Antigravity AI framework + **Locus Pay Agent APIs**.
