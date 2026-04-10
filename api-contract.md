# Detroit Public Housing Listings API Contract

**Base URL:** `TBD` (to be set by API team)
**Format:** JSON
**Auth:** None (hackathon scope)

---

## Data Types Reference

```typescript
// Categorical enums
type MaintenanceBurden = "low" | "medium" | "high";
type LeaseSecurity     = "low" | "medium" | "high";
type BusAccess         = "strong" | "moderate" | "limited";
type Appliances        = "standard" | "modern" | "mismatched";
type RepairsNeeded     = "none" | "minor" | "moderate" | "major";
type Stairs            = "none" | "one flight" | "few" | "multiple";
type InternetQuality   = "good" | "fair" | "poor";
type UnitType          = "apartment" | "townhouse" | "duplex" | "house";
type YardType          = "none" | "shared" | "private";
type BackyardOption    = "none" | "small" | "large";

// Numeric scores are integers 1-10
type Score = number; // 1-10
```

---

## Endpoints

### 1. List All Listings

```
GET /api/listings
```

Returns all available housing listings. Supports optional query parameters for filtering.

#### Query Parameters (all optional)

| Parameter | Type | Description | Example |
|---|---|---|---|
| `min_bedrooms` | integer | Minimum bedroom count | `2` |
| `max_bedrooms` | integer | Maximum bedroom count | `4` |
| `max_rent` | integer | Maximum monthly rent (USD) | `1500` |
| `wheelchair_access` | boolean | Requires wheelchair access | `true` |
| `elderly_friendly` | boolean | Requires elderly-friendly layout | `true` |
| `pet_friendly` | boolean | Requires pet-friendliness | `true` |
| `min_safety` | integer | Minimum safety score (1-10) | `6` |
| `bus_access` | string | Minimum bus access level | `moderate` |
| `unit_type` | string | Filter by unit type | `apartment` |
| `max_stairs` | string | Maximum stairs tolerance | `none` |

#### Response `200 OK`

```json
{
  "count": 3,
  "listings": [
    {
      "site_id": "HRD10176",
      "site_name": "Parkview Place",
      "address": "1401 Chene St",
      "coordinates": {
        "x": -83.0272671986912,
        "y": 42.3438277389423
      },
      "owner_developer_name": "MHT Housing",
      "construction_type": "Occupied Rehabilitation",

      "unit": {
        "unit_type": "apartment",
        "bedrooms": 4,
        "bathrooms": 2,
        "square_footage": 1430
      },

      "cost": {
        "monthly_rent": 1830,
        "utilities": 280
      },

      "accessibility": {
        "stairs": "one flight",
        "wheelchair_access": false,
        "elderly_friendly_layout": false
      },

      "location": {
        "distance_to_transit": 0.8,
        "distance_to_downtown": 1.3,
        "bus_access": "strong",
        "parking": 0,
        "school_quality": 5,
        "school_zone": "Zone B",
        "nearby_park": true
      },

      "quality": {
        "safety": 6,
        "noise": 2,
        "cleanliness": 5,
        "vibe": 7,
        "house_condition": 7,
        "appliances": "standard",
        "repairs_needed": "minor",
        "maintenance_burden": "medium"
      },

      "amenities": {
        "laundry": "in-unit",
        "ac": "central",
        "yard": "none",
        "backyard": "none",
        "balcony": false,
        "storage": "storage locker",
        "internet_quality": "good",
        "pet_friendliness": true,
        "lease_security": "medium"
      }
    }
  ]
}
```

---

### 2. Get Single Listing

```
GET /api/listings/:site_id
```

Returns a single listing by `site_id`.

#### Path Parameters

| Parameter | Type | Description | Example |
|---|---|---|---|
| `site_id` | string | Unique site identifier | `HRD10176` |

#### Response `200 OK`

Same shape as a single object from the `listings` array above.

#### Response `404 Not Found`

```json
{
  "error": "Listing not found",
  "site_id": "HRD99999"
}
```

---

## Field Reference (CSV → API mapping)

| CSV Column | API Path | Type | Notes |
|---|---|---|---|
| `X` | `coordinates.x` | float | Longitude |
| `Y` | `coordinates.y` | float | Latitude |
| `OBJECTID` | _(omitted)_ | - | Internal, not exposed |
| `site_id` | `site_id` | string | Primary key |
| `site_name` | `site_name` | string | |
| `address` | `address` | string | |
| `owner_developer_name` | `owner_developer_name` | string | |
| `construction_type` | `construction_type` | string | |
| `bedrooms` | `unit.bedrooms` | integer | |
| `bathrooms` | `unit.bathrooms` | integer | |
| `square_footage` | `unit.square_footage` | integer | |
| `unit_type` | `unit.unit_type` | UnitType | |
| `monthly_rent` | `cost.monthly_rent` | integer | USD |
| `utilities` | `cost.utilities` | integer | USD |
| `stairs` | `accessibility.stairs` | Stairs | |
| `wheelchair_access` | `accessibility.wheelchair_access` | boolean | CSV: yes/no → bool |
| `elderly_friendly_layout` | `accessibility.elderly_friendly_layout` | boolean | CSV: yes/no → bool |
| `distance_to_transit` | `location.distance_to_transit` | float | Miles |
| `distance_to_downtown` | `location.distance_to_downtown` | float | Miles |
| `bus_access` | `location.bus_access` | BusAccess | |
| `parking` | `location.parking` | integer | Number of spots |
| `school_quality` | `location.school_quality` | Score | 1-10 |
| `school_zone` | `location.school_zone` | string | |
| `nearby_park` | `location.nearby_park` | boolean | CSV: yes/no → bool |
| `safety` | `quality.safety` | Score | 1-10 |
| `noise` | `quality.noise` | Score | 1-10 (lower = quieter) |
| `cleanliness` | `quality.cleanliness` | Score | 1-10 |
| `vibe` | `quality.vibe` | Score | 1-10 |
| `house_condition` | `quality.house_condition` | Score | 1-10 |
| `appliances` | `quality.appliances` | Appliances | |
| `repairs_needed` | `quality.repairs_needed` | RepairsNeeded | |
| `maintenance_burden` | `quality.maintenance_burden` | MaintenanceBurden | |
| `laundry` | `amenities.laundry` | string | "in-unit", "shared", "none" |
| `ac` | `amenities.ac` | string | "central", "window", "none" |
| `yard` | `amenities.yard` | YardType | |
| `backyard` | `amenities.backyard` | BackyardOption | |
| `balcony` | `amenities.balcony` | boolean | CSV: yes/no → bool |
| `storage` | `amenities.storage` | string | "storage locker", "closet", "none" |
| `internet_quality` | `amenities.internet_quality` | InternetQuality | |
| `pet_friendliness` | `amenities.pet_friendliness` | boolean | CSV: true/false → bool |
| `lease_security` | `amenities.lease_security` | LeaseSecurity | |

---

## CSV → Boolean Conversion Rules

| CSV Value | API Value |
|---|---|
| `"yes"` | `true` |
| `"no"` | `false` |
| `"true"` | `true` |
| `"false"` | `false` |

---

## Notes for API Implementer

1. **Primary key** is `site_id` (e.g., `HRD10176`), not `OBJECTID`
2. **Filtering** should be AND-based (all specified filters must match)
3. **Bus access filtering** is hierarchical: `strong` > `moderate` > `limited`. Filtering by `moderate` should return `moderate` and `strong`
4. **Stairs filtering** is hierarchical: `none` > `one flight` > `few` > `multiple`. Filtering by `one flight` returns `none` and `one flight`
5. **No pagination needed** for hackathon scope (dataset is small)
6. **CORS** should be open (`*`) for local dev
