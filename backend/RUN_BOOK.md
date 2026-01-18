# Business Discovery System v2.1 - RUN BOOK

## Quick Start

### 1. Set API Key (REQUIRED)
```bash
export GOOGLE_PLACES_API_KEY='your-api-key-here'
```

### 2. Install & Run Backend
```bash
cd backend
pip install -r requirements.txt
python api_server.py
# Server starts at http://localhost:8000
```

### 3. Run Frontend
Import `BusinessDiscoveryDashboard.jsx` into your React project.

---

## CSV Downloads

### Filename Format
CSV files use a timestamped, descriptive filename:
```
business_discovery_YYYY-MM-DD_HH-MM_keyword-slug_STATE_XXXrows.csv
```

**Examples:**
- `business_discovery_2026-01-18_21-05_party-rental_TX_742rows.csv`
- `business_discovery_2026-01-18_14-30_bounce-house_CA_multi-city_523rows.csv`

### Column Headers (Friendly Names)
The CSV uses human-readable headers in this exact order:
1. Business Name
2. Phone Number
3. Email
4. Website
5. Address
6. City
7. State
8. Search Keyword
9. Google Place ID
10. Email Source
11. Data Completeness Score

### CSV Characteristics
- **Encoding:** UTF-8
- **Format:** RFC 4180 compliant
- **Rows:** One business per row (no JSON blobs)
- **Row count:** ALWAYS matches `totalValid` from API

---

## Stop Reasons

| Stop Reason | Plain English Explanation |
|-------------|---------------------------|
| `Target reached` | The search found enough valid businesses to meet your minimum target. |
| `All locations exhausted` | All cities in the selected state have been searched. Try adding more keywords or selecting a different state. |
| `API quota exceeded` | Google API rate limit reached. Please wait a few minutes and try again. |
| `User interrupted` | The search was stopped by the user. |
| `No cities configured` | No cities are configured for the selected state. |

---

## Low Result Warnings

If fewer than 10 valid businesses are found, the UI displays:
- **Warning banner** explaining the low result count
- **Suggestions:** 
  - Try broader or additional keywords
  - Select a different or larger state
  - Some industries have fewer businesses with complete online profiles

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/states` | GET | List all US states |
| `/api/cities/{state}` | GET | Get cities for a state |
| `/api/search` | POST | Start discovery job |
| `/api/results/{jobId}?preview=10` | GET | Get status + preview (10 businesses) |
| `/api/results/{jobId}/csv` | GET | Download full CSV |
| `/api/verify/{jobId}` | GET | Verify data integrity |

### Response: `/api/results/{jobId}`
```json
{
  "jobId": "abc12345",
  "status": "completed",
  "progress": 100,
  "totalValid": 523,
  "previewCount": 10,
  "preview": [...],
  "counts": {
    "withPhone": 412,
    "withEmail": 89,
    "withWebsite": 498,
    "totalSearched": 1247,
    "fakePhonesFiltered": 23,
    "validationFailed": 701
  },
  "stopReason": "Target reached",
  "stopReasonDetail": "The search found enough valid businesses...",
  "lowResultWarning": null
}
```

---

## Validation Rules (STRICT)

### 2-of-4 Rule
A business is VALID only if it has **at least 2** of:
- Phone number
- Email
- Website
- Address

### Fake Data Filtering
**Phones rejected:**
- Any number containing `555`
- Patterns: 123-456-xxxx, 000-000-xxxx, all same digits

**Emails rejected:**
- Domains: example.com, test.com, demo.com, fake.com
- Prefixes: test@, demo@, noreply@, fake@

---

## Verification

Test endpoint: `GET /api/verify/{jobId}`

Checks:
- ✅ Preview length = min(10, totalValid)
- ✅ CSV row count = totalValid
- ✅ No fake 555 phones in results
- ✅ Headers match required friendly names

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not configured" | Run `export GOOGLE_PLACES_API_KEY='your-key'` |
| Low results | Try broader keywords, different state |
| CORS error | Ensure backend runs on port 8000 |
| Quota exceeded | Wait 60 seconds, or upgrade API plan |
