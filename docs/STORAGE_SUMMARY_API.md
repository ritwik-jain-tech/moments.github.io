# Storage summary API (admin)

Used by the **Storage & Archive** page (`/admin/storage`). All storage values should be consistent (same unit: prefer **bytes** with optional **GB** mirrors for display).

---

## Request

**Method:** `GET` (recommended)

**Path:** `/api/storage/summary`  
(Adjust to match your API prefix, e.g. `${API_BASE_URL}/api/storage/summary`.)

### Identification & authorization

Send the **admin user** identity the same way as other authenticated admin calls (e.g. headers already used in this app):

| Header | Example | Notes |
|--------|---------|--------|
| `X-User-Id` | `<userId>` | Required |
| `X-Phone-Number` | optional | If your backend uses it |
| `Authorization` | `Bearer <token>` | If you use JWT |

**Role:** Backend must verify the user has **`role: "admin"`** (or equivalent). Do **not** trust a `role` field from the client alone; resolve role from DB/session.

Optional query (only if you prefer not to use headers):

- `userId` — must match authenticated user

---

## Response (200 OK)

Wrap in your standard envelope if applicable (e.g. `{ "success": true, "data": { ... } }`). Below is the **payload shape** the UI expects inside `data` (or at root if you do not use an envelope).

### Exact JSON the frontend should receive

Numbers below are **examples**. All `id` fields should be strings. Prefer **ISO 8601** for dates.

```json
{
  "userId": "usr_01HZZZZZZZZZZZZZZZZZZZZZZ",
  "role": "admin",

  "activeStorage": {
    "usedBytes": 13851264798,
    "limitBytes": 53687091200,
    "usedGb": 12.9,
    "limitGb": 50,
    "percentUsed": 26
  },

  "usageBreakdown": {
    "photos": { "bytes": 9020717301, "gb": 8.4, "percentOfUsage": 65 },
    "videos": { "bytes": 4510358650, "gb": 4.2, "percentOfUsage": 33 },
    "documents": { "bytes": 322088847, "gb": 0.3, "percentOfUsage": 2 }
  },

  "usageTrend": {
    "granularity": "month",
    "points": [
      { "periodStart": "2025-10-01T00:00:00.000Z", "label": "Oct", "totalUsedGb": 6.2 },
      { "periodStart": "2025-11-01T00:00:00.000Z", "label": "Nov", "totalUsedGb": 7.1 },
      { "periodStart": "2025-12-01T00:00:00.000Z", "label": "Dec", "totalUsedGb": 8.4 },
      { "periodStart": "2026-01-01T00:00:00.000Z", "label": "Jan", "totalUsedGb": 9.2 },
      { "periodStart": "2026-02-01T00:00:00.000Z", "label": "Feb", "totalUsedGb": 10.8 },
      { "periodStart": "2026-03-01T00:00:00.000Z", "label": "Mar", "totalUsedGb": 12.9 }
    ]
  },

  "projects": [
    {
      "eventId": "evt_01HXXXXXXXXXXXXXXXXXXXXXXX",
      "eventName": "Ritwik Weds Shivani",
      "storageUsedBytes": 2576980377,
      "storageUsedGb": 2.4,
      "percentOfTotalAccount": 19,
      "lastUploadAt": "2026-03-15T10:22:00.000Z"
    },
    {
      "eventId": "evt_01HYYYYYYYYYYYYYYYYYYYYYYY",
      "eventName": "Corporate Event 2026",
      "storageUsedBytes": 3435973836,
      "storageUsedGb": 3.2,
      "percentOfTotalAccount": 25,
      "lastUploadAt": "2026-03-08T14:00:00.000Z"
    }
  ],

  "archivedProjects": [
    {
      "eventId": "evt_arch_001",
      "eventName": "Birthday Celebration",
      "archivedAt": "2026-02-15T12:00:00.000Z",
      "storageUsedBytes": 858993459,
      "storageUsedGb": 0.8
    }
  ],

  "upgradePlans": [
    {
      "planId": "plan_1y",
      "title": "1-Year Extension",
      "priceDisplay": "₹2,999",
      "priceMinorUnits": 299900,
      "currency": "INR",
      "badge": null
    },
    {
      "planId": "plan_3y",
      "title": "3-Year Extension",
      "priceDisplay": "₹7,999",
      "priceMinorUnits": 799900,
      "currency": "INR",
      "badge": "Save 20%"
    },
    {
      "planId": "plan_perm",
      "title": "Permanent Archive",
      "priceDisplay": "₹14,999",
      "priceMinorUnits": 1499900,
      "currency": "INR",
      "badge": null
    }
  ]
}
```

---

## Field notes

| Section | Purpose |
|--------|---------|
| `userId` / `role` | Echo for debugging; **role must be enforced server-side**. |
| `activeStorage` | Ring + “X GB / Y GB”. `percentUsed` = `usedBytes / limitBytes * 100` (cap at 100). |
| `usageBreakdown.*.percentOfUsage` | Share of **total used** (photos+videos+documents), should sum to ~100%. |
| `usageTrend.points` | Last 6 months (or rolling 6); `label` is short month for chart axis. |
| `projects` | Active events consuming quota; `percentOfTotalAccount` is share of **account** total used. |
| `archivedProjects` | Does not count toward active limit (copy can stay on frontend). |
| `upgradePlans` | Optional; drive “Need More Storage?” cards. `badge` nullable. |

---

## Errors

| Code | When |
|------|------|
| `401` | Not authenticated |
| `403` | Authenticated but `role` is not admin |
| `404` | User not found |

Example body:

```json
{
  "success": false,
  "errorCode": "FORBIDDEN",
  "message": "Admin role required"
}
```

---

## Optional standard envelope

If your API always returns `{ "data": ... }`:

```json
{
  "success": true,
  "data": { ...same payload as above without wrapping userId at top if you prefer... }
}
```

The frontend will read `response.data.data` or `response.data` depending on your axios interceptor; align with existing `/api/userProfile` patterns in this project.
