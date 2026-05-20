# 🥜 Peanut Leads

Aplicación web fullstack para buscar y exportar leads B2B usando la API de Apollo.io.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Export | SheetJS (xlsx) |
| API | Apollo.io v1 |

## Funcionalidades

- **Búsqueda de leads** con filtros por cargo, industria y país
- **Enriquecimiento selectivo** — seleccioná contactos con checkbox y obtenés email/teléfono solo de los que elegís (sin gastar créditos innecesariamente)
- **Badges de estado** — cada contacto muestra "Sin email" o "Email obtenido"
- **Exportación** a Excel (.xlsx) y CSV con un clic
- **Dashboard** con métricas: total de leads, emails verificados, cantidad de países

---

## Instalación

### Requisitos

- Node.js 18+
- npm 9+
- API Key de [Apollo.io](https://app.apollo.io/#/settings/integrations/api)

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd peanut-leads
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Abrí `.env` y reemplazá `tu_api_key_aqui` con tu API Key de Apollo.io:

```env
APOLLO_API_KEY=tu_api_key_real_aqui
PORT=3001
```

### 3. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

---

## Uso

Necesitás dos terminales abiertas (una para backend, otra para frontend).

### Terminal 1 — Backend

```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
# App en http://localhost:5173
```

Abrí [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## Flujo de trabajo

1. **Buscar** — ingresá cargo (ej: "CEO, CTO"), seleccioná industria y país, y presioná "Buscar Leads"
2. **Seleccionar** — marcá los contactos que querés enriquecer con el checkbox
3. **Enriquecer** — presioná "Enriquecer (N seleccionados)" para obtener emails y teléfonos
4. **Exportar** — usá "Exportar Excel" o "Exportar CSV" para descargar todos los contactos

---

## Endpoints del backend

### `POST /api/search`

Busca leads en Apollo People Search.

**Body:**
```json
{
  "titles": ["CEO", "CTO"],
  "industries": ["Technology"],
  "countries": ["Argentina"],
  "page": 1,
  "perPage": 25
}
```

**Response:**
```json
{
  "contacts": [
    {
      "id": "...",
      "name": "John Doe",
      "title": "CEO",
      "company": "Acme Inc",
      "industry": "Technology",
      "country": "Argentina",
      "email": null,
      "emailStatus": "none"
    }
  ],
  "pagination": {
    "total": 1234,
    "page": 1,
    "perPage": 25,
    "totalPages": 50
  }
}
```

### `POST /api/enrich`

Enriquece contactos seleccionados con email y teléfono (Apollo People Bulk Match).

**Body:**
```json
{
  "personIds": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "enriched": [
    {
      "id": "id1",
      "email": "john@acme.com",
      "phone": "+1-555-0100",
      "emailStatus": "verified"
    }
  ]
}
```

---

## Notas sobre créditos de Apollo.io

- La búsqueda (`/api/search`) consume créditos de búsqueda
- El enriquecimiento (`/api/enrich`) consume créditos de exportación/enriquecimiento
- El botón "Enriquecer" solo actúa sobre los contactos marcados con checkbox para no gastar créditos innecesariamente

## Plan recomendado

Para usar el enriquecimiento bulk necesitás el plan **Basic** o superior de Apollo.io. El plan gratuito permite búsquedas pero limita el enriquecimiento.

---

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `APOLLO_API_KEY` | API Key de Apollo.io | — (requerida) |
| `PORT` | Puerto del backend | `3001` |

---

## Estructura del proyecto

```
peanut-leads/
├── backend/
│   ├── server.js          # Express server + endpoints Apollo
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Componente principal
│   │   ├── components/
│   │   │   ├── Dashboard.jsx     # Métricas
│   │   │   ├── FilterPanel.jsx   # Filtros + botones
│   │   │   ├── ResultsTable.jsx  # Tabla con checkboxes
│   │   │   └── ExportButtons.jsx # Export Excel/CSV
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```
