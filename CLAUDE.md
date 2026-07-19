# pedro_luis_imoveis_backend

REST API for the Pedro Luis Imóveis listings site. Express 4 + Mongoose 7, ESM
(`"type": "module"`), path alias `@src` via `esm-module-alias`.

Sibling repos: `_frontend` (public site), `_dashboard` (admin), `_images`
(uploads), `_database` (MongoDB container).

## Working agreements

**Do not commit unless I ask.** Leave changes in the working tree so I can
review the diff. Describe what changed and let me decide.

- Portuguese for user-facing messages, English for code and comments.
- Never print or commit `.env`. Update `.env.example` when adding a variable.
- Verify by running the API against local Mongo, not just by starting it.

## Layout

```
src/
  features/<name>/
    controllers/   request handling, one default-exported object of handlers
    models/        mongoose schemas
    routes/        express routers, mounted in src/routes/index.js
  middlewares/     verifyToken, requireRole, realEstateUpload
  server.js        entry point
  init.js          seeds the super admin on boot
```

## Rules that matter here

- **Always set a real HTTP status.** Use `res.status(n).json({ status: n, ... })`.
  Handlers used to return 200 with `{status: 500}` in the body, which made
  failures invisible to clients — a rejected login read as success.
- **Never spread `req.body` into a write.** Whitelist fields (see `WRITABLE` in
  `real_estate_controller.js`); otherwise callers can set any schema field.
- Multipart payloads arrive as a JSON string in `metadata`, because form data
  cannot nest. `parseBody` merges it with the upload middleware's urls.
- Pass `runValidators: true` on updates; `findOneAndUpdate` skips schema
  validation by default.
- Regex-escape anything user-supplied before it reaches a `RegExp`, and clamp
  `limit` — see `real_estate_query.js`.
- `_id` is a uuid string, not an ObjectId.

## Environment

`PORT` `HOST` `MONGO_DB` `ACCESS_TOKEN_JWT` `IMAGE_SERVER` `ADMIN_*`
`OLD_MONGO_DB` `ENABLE_LEGACY_IMPORT`

The legacy import route only responds when `ENABLE_LEGACY_IMPORT=true` and the
caller is a Super Admin. Leave it off.

## District filtering

`district` accepts a csv and is matched **case-insensitively**, because the
public map's polygon data is uppercase (`CANCELLI`) while listings are title case
(`Cancelli`). Before that, exact matching meant clicking any district on the map
returned nothing.

It is still **accent-sensitive** — `CANADA` will not match a stored `Canadá`. The
frontend resolves polygon names to the catalogue's spelling before calling the
API, so that step is load-bearing. Folding accents here would make the API robust
on its own.

## Data problem to be aware of

17 of the 25 listings have `address.position = {lat: 0, lng: 0}`. `importOldDB`
wrote zeros where the source had no coordinates instead of leaving `position`
unset, so those listings plot in the Atlantic. The frontend filters them out,
which means the public map shows 8 of 25.

Two fixes worth making: backfill the coordinates, and change `importOldDB` to
leave `position` unset so it cannot recur.
