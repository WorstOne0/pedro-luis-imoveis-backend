# Pedro Luis Imóveis — Backend API

> RESTful API for a real estate listing platform — manages properties, authentication, and image uploads.

---

## 🚀 Features

- **JWT Authentication** — Secure login with bcrypt password hashing and 5-hour token expiry
- **Real Estate CRUD** — Create, update, and query property listings with filtering and pagination
- **Image Upload Pipeline** — Thumbnail and gallery uploads (up to 10 images) proxied to an external image server
- **Role-Based Access Control** — User roles: Super Admin, Admin, Moderator, User, Guest
- **Auto Super Admin Init** — On startup, seeds the database with a Super Admin account from environment variables
- **Docker Ready** — Ships with a `Dockerfile` and `docker-compose.yml` for easy deployment

---

## 📸 Preview

This is a backend-only API. No UI is included. Integration with a frontend client (web or mobile) is expected via HTTP REST calls.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 7 |
| Auth | jsonwebtoken + bcrypt |
| File Handling | Multer + Axios (external image server) |
| Pagination | mongoose-paginate-v2 |
| Config | dotenv |
| Container | Docker + Docker Compose |

---

## 📂 Project Structure

```
src/
├── server.js                  # Entry point — Express app setup, DB connection
├── init.js                    # Seeds Super Admin on startup
├── routes/
│   ├── index.js               # Aggregates all routes
│   └── version.js             # GET /version health check
├── features/
│   ├── auth/
│   │   ├── controllers/       # login, session logic
│   │   └── routes/            # POST /login, GET /session
│   ├── real_estate/
│   │   ├── controllers/       # get, getById, create, update, importOldDB
│   │   ├── models/            # RealEstate Mongoose schema
│   │   └── routes/            # Real estate endpoints
│   └── user/
│       └── models/            # User Mongoose schema
└── middlewares/
    ├── index.js               # Re-exports jwt and upload middlewares
    ├── jwt.js                 # createToken / verifyToken
    └── real_estate_upload.js  # Proxies file uploads to IMAGE_SERVER
```

---

## ⚙️ Installation

**Prerequisites:** Node.js 18+, MongoDB instance

```bash
# Clone the repository
git clone <repo-url>
cd pedro_luis_imoveis_backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_DB=mongodb://user:pass@localhost:27017/pedro_luis_imoveis
ACCESS_TOKEN_JWT=your_jwt_secret

# External image server URL
IMAGE_SERVER=http://your-image-server

# Initial Super Admin
ADMIN_ACCOUNT=admin@example.com
ADMIN_PASSWORD=strongpassword
ADMIN_USERNAME=admin
ADMIN_SCREENNAME=Admin
ADMIN_PICTURE=https://example.com/avatar.jpg
```

---

## ▶️ Usage

```bash
# Development (with hot reload via nodemon)
npm run dev

# Production
npm start
```

### Docker

```bash
# Build and run with Docker Compose
HOST=api.yourdomain.com PORT=3000 docker-compose up -d
```

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/login` | No | Login and receive a JWT |
| `GET` | `/session` | Yes | Get current authenticated user |

**Login request body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Login response:**
```json
{
  "status": 200,
  "accessToken": "<jwt>"
}
```

---

### Real Estate

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/real_estate` | No | List all properties (paginated) |
| `POST` | `/real_estate/:_id` | No | Get a single property by ID |
| `POST` | `/real_estate` | Yes | Create a new property listing |
| `PUT` | `/real_estate` | Yes | Update an existing property |
| `POST` | `/real_estate/oldDB/import` | Yes | Import records from legacy DB |

**Protected routes** require the header:
```
Authorization: Bearer <jwt>
```

**File upload fields** (`multipart/form-data`):
- `thumbnail` — 1 image
- `images` — up to 10 images

**Property fields:** `type` (apartment | house | land | shop | sobrado), `sale` (sell | rent | both), `price`, `area`, `rooms`, `bathrooms`, `garages`, `address` (cep, street, district, city, state, number), `featured`

---

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/version` | Returns API version info |

---

## 🧪 Testing

No automated test suite is configured in the current codebase.

---

## 📌 Roadmap

- Add automated tests (unit + integration)
- Add user management endpoints (create, update, delete users)
- Add property search/filtering by price, type, location
- Add refresh token support
- Integrate AWS S3 directly for image storage (AWS SDK is already a dependency)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

> **Short description (for GitHub):** RESTful backend API for real estate listings with JWT auth, MongoDB, image upload, and Docker support.

**Suggested GitHub tags:** `nodejs` `express` `mongodb` `mongoose` `rest-api` `jwt` `real-estate` `docker` `javascript` `esm`
