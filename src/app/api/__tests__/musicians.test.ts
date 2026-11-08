import {
  applyGeo,
  averageRating,
  parseCsv,
  parseNumber,
  sortItems,
  toPublicItem,
  SearchItem,
} from "@/lib/musician-search";

function item(over: Partial<SearchItem>): SearchItem {
  return {
    id: "x",
    stageName: "X",
    photoUrl: null,
    priceMin: null,
    priceMax: null,
    serviceRadiusKm: 50,
    skills: [],
    genres: [],
    rating: null,
    distanceKm: null,
    createdAt: 0,
    _lat: -23.55,
    _lng: -46.63,
    ...over,
  };
}

describe("musician search helpers", () => {
  it("parses CSV and numbers", () => {
    expect(parseCsv("a, b,a,,")).toEqual(["a", "b"]);
    expect(parseNumber("12")).toBe(12);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBe("invalid");
  });

  it("averages ratings", () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating([{ rating: 5 }, { rating: 4 }])).toBe(4.5);
  });

  it("uses the smaller of requested radius and service radius", () => {
    const origin = { lat: -23.55, lng: -46.63 };
    const near = item({ id: "near", _lat: -23.56, _lng: -46.63, serviceRadiusKm: 50 });
    const narrow = item({ id: "narrow", _lat: -23.56, _lng: -46.63, serviceRadiusKm: 0.1 });
    const far = item({ id: "far", _lat: -22.9, _lng: -43.2, serviceRadiusKm: 1000 });
    const out = applyGeo([near, narrow, far], origin, 100);
    expect(out.map((i) => i.id)).toEqual(["near"]);
    expect(out[0].distanceKm).toBeGreaterThan(0);
  });

  it("sorts by price, rating and default", () => {
    const a = item({ id: "a", priceMin: 100, rating: 3, createdAt: 1 });
    const b = item({ id: "b", priceMin: 50, rating: 5, createdAt: 2 });
    expect(sortItems([a, b], "price_asc")[0].id).toBe("b");
    expect(sortItems([a, b], "price_desc")[0].id).toBe("a");
    expect(sortItems([a, b], "rating")[0].id).toBe("b");
    expect(sortItems([a, b], null)[0].id).toBe("b");
  });

  it("never exposes raw coordinates", () => {
    const pub = toPublicItem(item({}));
    expect(pub).not.toHaveProperty("_lat");
    expect(pub).not.toHaveProperty("_lng");
    expect(pub).not.toHaveProperty("latitude");
  });
});
