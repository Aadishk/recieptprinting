# Valliyottuchal Sree Bhadrakali Kalasthanam - Temple Receipt & Report System

A full-stack Web Application for Temple Receipt Printing, Pooja Management, Devotee History Tracking, and Customized A4 Report Generation.

---

## 🌟 Key Features

1. **Receipt Creation & Thermal Paper Preview**:
   - Live side-by-side receipt preview with dynamic temple header and customizable background overlays.
   - Dynamic line items (Devotee Name, Star, Quantity, Amount).
   - Manglish transliteration support for typing Malayalam names and stars easily.

2. **Automated Pooja Rate Fill**:
   - Selecting a pooja (`കരിംകലശം`, `ശക്തിപൂജ`, `രക്തപുഷ്പാഞ്ജലി`, etc.) automatically populates the default amount while keeping fields fully editable.

3. **History Classification & Advanced Filtering**:
   - Real-time search by Devotee Name, Receipt Number, Deity, or Pooja.
   - Filter by **Pooja Name** or **Date Classifications** (**Offering Date** vs **Receipt Created Date**).
   - Dynamic live statistics (Devotee Count, Total Receipts, Total Collection Amount).

4. **Printable Document Reports**:
   - **Generic Pooja Report**: Generates an A4 summary list of filtered receipts.
   - **Dedicated Shakthi Pooja Print List**: Special 4-column ritual list (**Sl No, Name, Star, Receipt No**) with prominent Date Header formatted for temple rituals.

5. **History & Record Management**:
   - Delete individual receipt records or clear the entire history database with 1 click.

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine.

### Running Locally
```bash
# Install dependencies (if needed)
npm install

# Start the Node.js server
npm start
# or
node server.js
```

Open your web browser and navigate to:
**`http://localhost:3000`**

---

## ☁️ Deploying to Vercel

This repository is **100% pre-configured for Vercel Serverless Deployment**:

### Option 1: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: Via GitHub / Vercel Dashboard
1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep default settings (`Framework Preset: Other` or `Express`).
4. Click **Deploy**. Vercel will automatically detect `vercel.json` and `api/index.js`!

---

## 📁 File Structure

- `index.html` — Main UI, receipt form, history modal, and printable report templates.
- `style.css` — Modern responsive styling, glassmorphism UI, and `@media print` rules.
- `script.js` — Client-side event handling, live calculations, auto-fill logic, and filter engine.
- `server.js` — Express backend API with SQLite support and serverless fallback DB.
- `api/index.js` — Vercel Serverless Function entrypoint.
- `vercel.json` — Vercel routing configuration.
- `receipts_db.json` — Local JSON database for receipt history storage.
- `manglish.js` — Malayalam transliteration engine.
