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

  // `sold=false` has to match documents predating the field, which have no
  // `sold` key at all — hence $ne rather than a plain equality.
  if (query.sold === "true") filter.sold = true;
  if (query.sold === "false") filter.sold = { $ne: true };

  const minPrice = toInt(query.minPrice);
  const maxPrice = toInt(query.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }

  const minArea = toInt(query.minArea);
  const maxArea = toInt(query.maxArea);
  if (minArea !== null || maxArea !== null) {
    filter.area = {};
    if (minArea !== null) filter.area.$gte = minArea;
    if (maxArea !== null) filter.area.$lte = maxArea;
  }

  // Excludes a single listing, used by "imóveis similares" so the listing being
  // viewed does not appear among its own suggestions.
  if (query.exclude) filter._id = { $ne: String(query.exclude) };

  // Room counts are "at least N" — a 3 bedroom house still matches a
  // search for 2 bedrooms.
  const rooms = atLeast(query.rooms);
  if (rooms) filter.rooms = rooms;

  const bathrooms = atLeast(query.bathrooms);
  if (bathrooms) filter.bathrooms = bathrooms;

  const garages = atLeast(query.garages);
  if (garages) filter.garages = garages;

  // Districts arrive as a csv so the public map can filter by several at once.
  // Matched case-insensitively on purpose: the map's polygon names are
  // uppercase ("CANCELLI") while the listings are title case ("Cancelli"), so
  // an exact match returned nothing for every district drawn on the map.
  if (query.district) {
    const districts = String(query.district)
      .split(",")
      .map((district) => district.trim())
      .filter(Boolean)
      .map((district) => new RegExp(`^${escapeRegex(district)}$`, "i"));

    if (districts.length === 1) filter["address.district"] = districts[0];
    else if (districts.length > 1) filter["address.district"] = { $in: districts };
  }

  if (query.city) filter["address.city"] = new RegExp(`^${escapeRegex(String(query.city).trim())}$`, "i");

  if (query.search) {
    const term = new RegExp(escapeRegex(String(query.search).trim()), "i");

    filter.$or = [{ title: term }, { description: term }, { "address.street": term }, { "address.district": term }, { "address.city": term }];
  }

  // No default limit. The catalogue is a few hundred listings at most, and the
  // public map needs every match to draw its markers, so paging would actively
  // break it. `limit` stays available for callers that only want a slice.
  const limit = toInt(query.limit);

  return {
    filter,
    sort: SORTS[query.sort] ?? SORTS.recent,
    limit: limit && limit > 0 ? limit : null,
  };
};

export { TYPES, SALES };
