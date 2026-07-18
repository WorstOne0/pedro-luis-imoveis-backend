const TYPES = ["apartment", "house", "land", "shop", "sobrado"];
const SALES = ["sell", "rent", "both"];

const SORTS = {
  recent: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  area_asc: { area: 1 },
  area_desc: { area: -1 },
};

const toInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

// Escape user input before it reaches a RegExp, otherwise a search for "a("
// throws and characters like ".*" let callers scan the whole collection.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const atLeast = (value) => {
  const parsed = toInt(value);
  return parsed === null || parsed < 0 ? null : { $gte: parsed };
};

/**
 * Turns req.query into a mongoose filter plus pagination options.
 * Every field is optional; anything unrecognised is ignored rather than
 * passed through, so callers cannot inject arbitrary query operators.
 */
export default (query = {}) => {
  const filter = {};

  // type accepts a csv ("house,land") so the dashboard can send its
  // multi-select straight through.
  if (query.type) {
    const types = String(query.type)
      .split(",")
      .map((type) => type.trim())
      .filter((type) => TYPES.includes(type));

    if (types.length > 0) filter.type = { $in: types };
  }

  if (query.sale && SALES.includes(query.sale)) filter.sale = query.sale;

  if (query.featured === "true") filter.featured = true;
  if (query.featured === "false") filter.featured = false;

  const minPrice = toInt(query.minPrice);
  const maxPrice = toInt(query.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }

  const minArea = atLeast(query.minArea);
  if (minArea) filter.area = minArea;

  // Room counts are "at least N" — a 3 bedroom house still matches a
  // search for 2 bedrooms.
  const rooms = atLeast(query.rooms);
  if (rooms) filter.rooms = rooms;

  const bathrooms = atLeast(query.bathrooms);
  if (bathrooms) filter.bathrooms = bathrooms;

  const garages = atLeast(query.garages);
  if (garages) filter.garages = garages;

  if (query.district) filter["address.district"] = String(query.district);
  if (query.city) filter["address.city"] = String(query.city);

  if (query.search) {
    const term = new RegExp(escapeRegex(String(query.search).trim()), "i");

    filter.$or = [{ title: term }, { description: term }, { "address.street": term }, { "address.district": term }, { "address.city": term }];
  }

  const page = Math.max(toInt(query.page) ?? 1, 1);
  const limit = Math.min(Math.max(toInt(query.limit) ?? 20, 1), 100);

  return {
    filter,
    options: { page, limit, sort: SORTS[query.sort] ?? SORTS.recent },
  };
};

export { TYPES, SALES };
