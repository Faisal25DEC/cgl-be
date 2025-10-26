# CGL Backend Foundation (ESM)

A clean Node.js (ESM) + Express 5 + Mongoose 8 foundation tuned for Raj's **Book → Chapter → Record** model with a **visible numbering** scheme:
- Book & Chapter: start `000.00`, increment by **5**
- Record: start `000.00`, increment by **10`** (per book scope)
- Internal MongoDB `_id` is kept for system integrity.

## Quick Start
```bash
cp .env.sample .env
# edit MONGO_URI and PORT as needed
npm install
npm run dev
```
