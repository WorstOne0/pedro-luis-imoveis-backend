# Pedro Luis Imóveis — Backend API

> REST API for a real estate listing platform. Property CRUD with rich
> filtering, JWT auth with roles, and an upload pipeline that proxies to a
> separate image service.

One of five repositories that make up the product:

| Repository | Role |
|---|---|
| frontend | Public site — map + listings |
| dashboard | Admin panel — listing CRUD, uploads, auth |
| **backend** (this one) | REST API |
| images | Upload, resize and serve photos/video |
| database | MongoDB container + backup scripts |

---

## Features

- **Listing CRUD** with filtering by type, sale kind, price, area, rooms,
  bathrooms, garages, district, city and free-text search.
- **JWT auth** — bcrypt hashing, 5-hour tokens, role-based access
  (`super_admin`, `admin`, `moderator`, `user`, `guest`).
- **Upload proxy** — accepts multipart writes and forwards files to the image
  service, propagating its status rather than swallowing it.
- **Write whitelist** — anything outside a known field list is dropped, so a
  caller cannot reach schema fields that were never meant to be exposed.
- **Seeded super admin** on first boot, from environment variables.
- **Docker ready** — `Dockerfile` and `docker-compose.yml` for the nginx-proxy
  setup.

---

## Tech stack

Node.js · Express 4 · MongoDB + Mongoose 7 · JWT · bcrypt · multer

---

## Getting started

Requires Node 20+ and MongoDB on `127.0.0.1:27017` (local service, or the
`pedro_luis_imoveis_database` container).

```bash
npm install
cp .env.example .env     # then fill it in
npm start                # http://localhost:4000
```

### Environment

| Variable | Purpose |
|---|---|
| `PORT` | Listen port (4000) |
| `MONGO_DB` | Connection string |
| `ACCESS_TOKEN_JWT` | Token signing secret — must match the images service |
| `IMAGE_SERVER` | Base url of the images service |
| `ADMIN_ACCOUNT` `ADMIN_USERNAME` `ADMIN_PASSWORD` `ADMIN_SCREENNAME` `ADMIN_PICTURE` | Seed super admin, created on first boot |
| `ENABLE_LEGACY_IMPORT` | Must be `"true"` to expose the legacy import route — leave it off |
| `OLD_MONGO_DB` | Source connection string for that import |

---

## API

Every response is `{ status, message, ... }`, with the HTTP status matching the
body. List endpoints return `payload` as an array; single-resource endpoints
return `payload` as the document.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/real_estate` | `GET` | — | List, filterable |
| `/real_estate/:_id` | `GET` | — | One listing |
| `/real_estate` | `POST` | ✅ | Create (multipart) |
| `/real_estate/:_id` | `PUT` | ✅ | Update (multipart, id in path) |
| `/real_estate/:_id` | `DELETE` | ✅ | Delete |
| `/login` | `POST` | — | Returns `accessToken` |
| `/session` | `GET` | ✅ | Current user |
| `/real_estate/oldDB/import` | `POST` | ✅ `super_admin` | Legacy import, env-gated |

### `GET /real_estate` query parameters

`limit`, `sort` (`recent|oldest|price_asc|price_desc|area_asc|area_desc`),
`type` (csv), `sale`, `featured`, `minPrice`, `maxPrice`, `minArea`, `maxArea`,
`rooms`, `bathrooms`, `garages`, `district` (csv), `city`, `search`, `exclude`.

Property types are `apartment | house | land | shop | sobrado`.

**There is no default limit.** The public map needs every match to draw its
markers, so paging would break it. `limit` stays available for callers that only
want a slice.

**Room, bathroom and garage counts are "at least N"** — a 3-bedroom house
matches a search for 2.

**`district` is matched case-insensitively** because the public map's polygon
data is uppercase (`CANCELLI`) while listings are title case (`Cancelli`). It is
still **accent-sensitive**: `CANADA` will not match a stored `Canadá`.

---

## Project structure

```
src/
  features/
    real_estate/
      controllers/  models/  routes/
      utils/real_estate_query.js    query builder
    user/
  middlewares/      auth, role guard, upload proxy
  init.js           seeds the super admin, migrates legacy role values
  server.js
```

---

## Notes for anyone reading the code

**Responses carry real HTTP status codes.** They used to return HTTP 200 with
`{status: 500}` in the body, which meant clients checking `response.status`
never saw failures — logins appeared to succeed silently.

**User input is regex-escaped** before reaching a `$regex` filter, so a search
for `a(` can't throw and `.*` can't be used to scan the collection.

**The query builder lives in `utils/`, not `controllers/`** — it builds a filter,
it doesn't handle a request.

---

## Known limitations

- 17 of the 25 current listings have `address.position = {lat: 0, lng: 0}` from
  the legacy import, which wrote zeros instead of leaving coordinates unset. They
  need geocoding, and `importOldDB` should be changed to leave `position` unset
  so it can't recur.
- District filtering is accent-sensitive; the frontend compensates.
- No test suite. Verification is manual, against local MongoDB.

---

## Project status and contributions

This is a commissioned project built for a specific business. It is **not** an
open source project and is not accepting contributions, feature requests or
pull requests.

## Copyright and licence

**Copyright © 2026 Lucca Gabriel. All rights reserved.**

This repository is published so the source can be **read**, as a portfolio piece
and for reference. It is deliberately published **without a licence**, which
under default copyright law means all rights are reserved.

Viewing and forking within GitHub are permitted by GitHub's Terms of Service.
That does **not** grant permission to use, copy, modify, deploy or redistribute
this code. Third-party dependencies keep their own licences, and Pedro Luis
Imóveis brand assets are the property of their owner.

See [`COPYRIGHT.md`](COPYRIGHT.md) for the full terms.
