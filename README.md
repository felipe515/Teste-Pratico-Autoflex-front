# Production & Stock Management Front-end

React + Vite frontend for managing products, raw materials and composition, and visualizing production suggestions based on stock.

## Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development:
   ```bash
   npm run dev
   ```

## API and CORS in local development

By default the app uses `VITE_API_BASE_URL=/api` and Vite proxy forwards `/api/*` to `http://localhost:8080`.
This avoids browser CORS issues while developing locally.

If you want to call a remote API directly, set `VITE_API_BASE_URL` to the full URL, e.g.

```bash
VITE_API_BASE_URL=https://my-api.example.com/api
```

In this direct mode, the backend must enable CORS for the frontend origin.

## Backend API expectation

Expected resources:

- `GET/POST /products`
- `PUT/DELETE /products/:id`
- `GET/POST /products/:id/materials`
- `PUT/DELETE /products/:id/materials/:materialId`
- `GET/POST /raw-materials`
- `PUT/DELETE /raw-materials/:id`
- `GET /production/suggestions`
