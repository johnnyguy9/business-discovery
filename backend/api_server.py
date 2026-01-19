#!/usr/bin/env python3
"""
Business Discovery API Server v2.1 - Production
================================================
FastAPI backend for Google Places business discovery.
"""

import os
import csv
import re
import uuid
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor
from io import StringIO

import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)-7s | %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

# Constants
GOOGLE_PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
GOOGLE_PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
DEFAULT_MIN_BUSINESSES = 500
PAGINATION_DELAY = 2.0
REQUEST_DELAY = 0.1
PREVIEW_LIMIT = 10

FAKE_PHONE_PATTERNS = [r'555', r'123-456', r'000-000', r'111-111']
FAKE_EMAIL_DOMAINS = ['example.com', 'test.com', 'demo.com', 'fake.com', 'sample.com', 'domain.com']
FAKE_EMAIL_PREFIXES = ['test@', 'demo@', 'example@', 'fake@', 'noreply@']

CSV_HEADERS = ['Business Name', 'Phone Number', 'Email', 'Website', 'Address', 'City', 'State', 'Search Keyword', 'Google Place ID', 'Email Source', 'Data Completeness Score']

US_STATES = {"AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia"}

STATE_CITIES = {
    "TX": [{"city": "Houston", "lat": 29.7604, "lng": -95.3698}, {"city": "San Antonio", "lat": 29.4241, "lng": -98.4936}, {"city": "Dallas", "lat": 32.7767, "lng": -96.7970}, {"city": "Austin", "lat": 30.2672, "lng": -97.7431}, {"city": "Fort Worth", "lat": 32.7555, "lng": -97.3308}, {"city": "El Paso", "lat": 31.7619, "lng": -106.4850}, {"city": "Arlington", "lat": 32.7357, "lng": -97.1081}, {"city": "Corpus Christi", "lat": 27.8006, "lng": -97.3964}, {"city": "Plano", "lat": 33.0198, "lng": -96.6989}, {"city": "Lubbock", "lat": 33.5779, "lng": -101.8552}],
    "CA": [{"city": "Los Angeles", "lat": 34.0522, "lng": -118.2437}, {"city": "San Diego", "lat": 32.7157, "lng": -117.1611}, {"city": "San Jose", "lat": 37.3382, "lng": -121.8863}, {"city": "San Francisco", "lat": 37.7749, "lng": -122.4194}, {"city": "Fresno", "lat": 36.7378, "lng": -119.7871}, {"city": "Sacramento", "lat": 38.5816, "lng": -121.4944}, {"city": "Oakland", "lat": 37.8044, "lng": -122.2712}],
    "FL": [{"city": "Miami", "lat": 25.7617, "lng": -80.1918}, {"city": "Orlando", "lat": 28.5383, "lng": -81.3792}, {"city": "Tampa", "lat": 27.9506, "lng": -82.4572}, {"city": "Jacksonville", "lat": 30.3322, "lng": -81.6557}, {"city": "Fort Lauderdale", "lat": 26.1224, "lng": -80.1373}],
    "NY": [{"city": "New York City", "lat": 40.7128, "lng": -74.0060}, {"city": "Buffalo", "lat": 42.8864, "lng": -78.8784}, {"city": "Rochester", "lat": 43.1566, "lng": -77.6088}, {"city": "Albany", "lat": 42.6526, "lng": -73.7562}],
    "GA": [{"city": "Atlanta", "lat": 33.7490, "lng": -84.3880}, {"city": "Savannah", "lat": 32.0809, "lng": -81.0912}, {"city": "Augusta", "lat": 33.4735, "lng": -82.0105}],
    "NC": [{"city": "Charlotte", "lat": 35.2271, "lng": -80.8431}, {"city": "Raleigh", "lat": 35.7796, "lng": -78.6382}, {"city": "Greensboro", "lat": 36.0726, "lng": -79.7920}],
    "AZ": [{"city": "Phoenix", "lat": 33.4484, "lng": -112.0740}, {"city": "Tucson", "lat": 32.2226, "lng": -110.9747}, {"city": "Mesa", "lat": 33.4152, "lng": -111.8315}],
    "IL": [{"city": "Chicago", "lat": 41.8781, "lng": -87.6298}, {"city": "Aurora", "lat": 41.7606, "lng": -88.3201}, {"city": "Rockford", "lat": 42.2711, "lng": -89.0940}],
    "PA": [{"city": "Philadelphia", "lat": 39.9526, "lng": -75.1652}, {"city": "Pittsburgh", "lat": 40.4406, "lng": -79.9959}],
    "OH": [{"city": "Columbus", "lat": 39.9612, "lng": -82.9988}, {"city": "Cleveland", "lat": 41.4993, "lng": -81.6944}, {"city": "Cincinnati", "lat": 39.1031, "lng": -84.5120}],
    "CO": [{"city": "Denver", "lat": 39.7392, "lng": -104.9903}, {"city": "Colorado Springs", "lat": 38.8339, "lng": -104.8214}],
    "WA": [{"city": "Seattle", "lat": 47.6062, "lng": -122.3321}, {"city": "Spokane", "lat": 47.6588, "lng": -117.4260}],
    "TN": [{"city": "Nashville", "lat": 36.1627, "lng": -86.7816}, {"city": "Memphis", "lat": 35.1495, "lng": -90.0490}],
    "NV": [{"city": "Las Vegas", "lat": 36.1699, "lng": -115.1398}, {"city": "Reno", "lat": 39.5296, "lng": -119.8138}],
}

DEFAULT_CITIES = {"AL": [{"city": "Birmingham", "lat": 33.5207, "lng": -86.8025}], "AK": [{"city": "Anchorage", "lat": 61.2181, "lng": -149.9003}], "AR": [{"city": "Little Rock", "lat": 34.7465, "lng": -92.2896}], "CT": [{"city": "Hartford", "lat": 41.7658, "lng": -72.6734}], "DE": [{"city": "Wilmington", "lat": 39.7391, "lng": -75.5398}], "HI": [{"city": "Honolulu", "lat": 21.3069, "lng": -157.8583}], "ID": [{"city": "Boise", "lat": 43.6150, "lng": -116.2023}], "IN": [{"city": "Indianapolis", "lat": 39.7684, "lng": -86.1581}], "IA": [{"city": "Des Moines", "lat": 41.5868, "lng": -93.6250}], "KS": [{"city": "Wichita", "lat": 37.6872, "lng": -97.3301}], "KY": [{"city": "Louisville", "lat": 38.2527, "lng": -85.7585}], "LA": [{"city": "New Orleans", "lat": 29.9511, "lng": -90.0715}], "ME": [{"city": "Portland", "lat": 43.6591, "lng": -70.2568}], "MD": [{"city": "Baltimore", "lat": 39.2904, "lng": -76.6122}], "MA": [{"city": "Boston", "lat": 42.3601, "lng": -71.0589}], "MI": [{"city": "Detroit", "lat": 42.3314, "lng": -83.0458}], "MN": [{"city": "Minneapolis", "lat": 44.9778, "lng": -93.2650}], "MS": [{"city": "Jackson", "lat": 32.2988, "lng": -90.1848}], "MO": [{"city": "Kansas City", "lat": 39.0997, "lng": -94.5786}], "MT": [{"city": "Billings", "lat": 45.7833, "lng": -108.5007}], "NE": [{"city": "Omaha", "lat": 41.2565, "lng": -95.9345}], "NH": [{"city": "Manchester", "lat": 42.9956, "lng": -71.4548}], "NJ": [{"city": "Newark", "lat": 40.7357, "lng": -74.1724}], "NM": [{"city": "Albuquerque", "lat": 35.0844, "lng": -106.6504}], "ND": [{"city": "Fargo", "lat": 46.8772, "lng": -96.7898}], "OK": [{"city": "Oklahoma City", "lat": 35.4676, "lng": -97.5164}], "OR": [{"city": "Portland", "lat": 45.5152, "lng": -122.6784}], "RI": [{"city": "Providence", "lat": 41.8240, "lng": -71.4128}], "SC": [{"city": "Charleston", "lat": 32.7765, "lng": -79.9311}], "SD": [{"city": "Sioux Falls", "lat": 43.5446, "lng": -96.7311}], "UT": [{"city": "Salt Lake City", "lat": 40.7608, "lng": -111.8910}], "VT": [{"city": "Burlington", "lat": 44.4759, "lng": -73.2121}], "VA": [{"city": "Virginia Beach", "lat": 36.8529, "lng": -75.9780}], "WV": [{"city": "Charleston", "lat": 38.3498, "lng": -81.6326}], "WI": [{"city": "Milwaukee", "lat": 43.0389, "lng": -87.9065}], "WY": [{"city": "Cheyenne", "lat": 41.1400, "lng": -104.8202}], "DC": [{"city": "Washington", "lat": 38.9072, "lng": -77.0369}]}

class GeographyMode(str, Enum):
    STATE = "state"
    CITY = "city"

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class SearchRequest(BaseModel):
    keywords: List[str] = Field(..., min_items=1)
    geographyMode: GeographyMode = GeographyMode.STATE
    state: str = Field(..., min_length=2, max_length=2)
    cities: Optional[List[Dict[str, Any]]] = None
    minResults: int = Field(default=500, ge=1, le=5000)

class SearchResponse(BaseModel):
    jobId: str
    status: str
    message: str

@dataclass
class Business:
    business_name: str = ""
    phone_number: str = ""
    email: str = ""
    website: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    search_keyword: str = ""
    google_place_id: str = ""
    email_source: str = ""
    data_completeness_score: int = 0
    
    def to_dict(self): return asdict(self)
    def to_csv_row(self): return {'Business Name': self.business_name, 'Phone Number': self.phone_number, 'Email': self.email, 'Website': self.website, 'Address': self.address, 'City': self.city, 'State': self.state, 'Search Keyword': self.search_keyword, 'Google Place ID': self.google_place_id, 'Email Source': self.email_source, 'Data Completeness Score': self.data_completeness_score}

@dataclass
class JobData:
    job_id: str
    status: JobStatus = JobStatus.PENDING
    progress: int = 0
    config: Dict = field(default_factory=dict)
    businesses: List[Business] = field(default_factory=list)
    stats: Dict = field(default_factory=dict)
    stop_reason: str = ""
    stop_reason_detail: str = ""
    current_keyword: str = ""
    current_city: str = ""
    created_at: datetime = field(default_factory=datetime.now)

def slugify(text, max_len=30):
    if not text: return "search"
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:max_len] or "search"

def generate_csv_filename(job):
    ts = datetime.now().strftime('%Y-%m-%d_%H-%M')
    kw = slugify(job.config.get('keywords', ['search'])[0])
    st = job.config.get('state', 'US')
    geo = f"{st}_multi-city" if job.config.get('geographyMode') == 'city' else st
    return f"business_discovery_{ts}_{kw}_{geo}_{len(job.businesses)}rows.csv"

def get_stop_reason_detail(reason):
    return {"Target reached": "Found enough valid businesses to meet your target.", "All locations exhausted": "All cities searched. Try different keywords or state.", "API quota exceeded": "Google API rate limit reached. Wait and retry.", "": "Search completed."}.get(reason, f"Search ended: {reason}")

def is_fake_phone(phone):
    if not phone: return False
    norm = re.sub(r'[^\d]', '', phone)
    if '555' in norm: return True
    if len(norm) >= 7 and len(set(norm)) == 1: return True
    return any(re.search(p, phone) for p in FAKE_PHONE_PATTERNS)

def is_fake_email(email):
    if not email: return False
    e = email.lower()
    return any(e.endswith('@' + d) for d in FAKE_EMAIL_DOMAINS) or any(e.startswith(p) for p in FAKE_EMAIL_PREFIXES)

def extract_city_state(address):
    if not address: return "", ""
    for p in [r',\s*([^,]+),\s*([A-Z]{2})\s*\d{5}', r',\s*([^,]+),\s*([A-Z]{2})\s*$']:
        m = re.search(p, address)
        if m: return m.group(1).strip(), m.group(2)
    return "", ""

def calc_completeness(b):
    return sum(1 for f in [b.phone_number, b.email, b.website, b.address] if f and f.strip())

def extract_emails(text):
    if not text: return []
    return [e for e in set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text.lower())) if not is_fake_email(e)]

def scrape_email(website, timeout=8):
    if not website: return None
    if not website.startswith(('http://', 'https://')): website = 'https://' + website
    for page in [website, website.rstrip('/') + '/contact', website.rstrip('/') + '/about']:
        try:
            r = requests.get(page, headers={'User-Agent': 'Mozilla/5.0'}, timeout=timeout, allow_redirects=True)
            if r.status_code == 200:
                emails = extract_emails(r.text)
                if emails: return emails[0]
        except: pass
    return None

class PlacesClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.quota_exceeded = False
    
    def nearby_search(self, lat, lng, keyword, radius=40000, page_token=None):
        params = {'key': self.api_key, 'location': f"{lat},{lng}", 'radius': radius, 'keyword': keyword}
        if page_token: params['pagetoken'] = page_token
        try:
            r = requests.get(GOOGLE_PLACES_NEARBY_URL, params=params, timeout=30)
            data = r.json()
            if data.get('status') == 'OVER_QUERY_LIMIT': self.quota_exceeded = True
            return data
        except Exception as e:
            logger.error(f"Search error: {e}")
            return {'status': 'ERROR', 'results': []}
    
    def get_details(self, place_id):
        try:
            r = requests.get(GOOGLE_PLACES_DETAILS_URL, params={'key': self.api_key, 'place_id': place_id, 'fields': 'name,formatted_phone_number,formatted_address,website'}, timeout=30)
            time.sleep(REQUEST_DELAY)
            return r.json()
        except Exception as e:
            logger.error(f"Details error: {e}")
            return {'status': 'ERROR', 'result': {}}

class DiscoveryEngine:
    def __init__(self, api_key, job, config):
        self.client = PlacesClient(api_key)
        self.job = job
        self.config = config
        self.businesses = {}
        self.seen_domains = {}
        self.stats = {'total_searched': 0, 'duplicates': 0, 'fake_phones': 0, 'fake_emails': 0, 'validation_failed': 0, 'emails_scraped': 0}
    
    def _get_domain(self, url):
        if not url: return None
        try: return urlparse(url if url.startswith('http') else f'https://{url}').netloc.lower().replace('www.', '')
        except: return None
    
    def _process_place(self, place, keyword):
        pid = place.get('place_id', '')
        if not pid or pid in self.businesses:
            self.stats['duplicates'] += 1
            return None
        
        details = self.client.get_details(pid).get('result', {})
        website = details.get('website', '')
        domain = self._get_domain(website)
        if domain and domain in self.seen_domains:
            self.stats['duplicates'] += 1
            return None
        
        b = Business(
            business_name=details.get('name', place.get('name', '')),
            phone_number=details.get('formatted_phone_number', ''),
            address=details.get('formatted_address', place.get('vicinity', '')),
            website=website, search_keyword=keyword, google_place_id=pid
        )
        b.city, b.state = extract_city_state(b.address)
        
        if is_fake_phone(b.phone_number):
            self.stats['fake_phones'] += 1
            b.phone_number = ""
        
        if website:
            email = scrape_email(website)
            if email:
                b.email = email
                b.email_source = "website_scrape"
                self.stats['emails_scraped'] += 1
        
        if is_fake_email(b.email):
            self.stats['fake_emails'] += 1
            b.email = ""
            b.email_source = ""
        
        b.data_completeness_score = calc_completeness(b)
        if b.data_completeness_score < 2:
            self.stats['validation_failed'] += 1
            return None
        return b
    
    def _search_location(self, city_data, keyword):
        lat, lng = city_data['lat'], city_data['lng']
        page_token = None
        while True:
            resp = self.client.nearby_search(lat, lng, keyword, page_token=page_token)
            status = resp.get('status', 'ERROR')
            if status == 'OVER_QUERY_LIMIT':
                time.sleep(60)
                if self.client.quota_exceeded: return
                continue
            if status not in ['OK', 'ZERO_RESULTS']: break
            for place in resp.get('results', []):
                self.stats['total_searched'] += 1
                b = self._process_place(place, keyword)
                if b:
                    self.businesses[b.google_place_id] = b
                    d = self._get_domain(b.website)
                    if d: self.seen_domains[d] = b.google_place_id
            page_token = resp.get('next_page_token')
            if not page_token: break
            time.sleep(PAGINATION_DELAY)
    
    def run(self):
        keywords = self.config['keywords']
        state = self.config['state'].upper()
        min_results = self.config.get('minResults', DEFAULT_MIN_BUSINESSES)
        cities = self.config.get('cities') if self.config.get('geographyMode') == 'city' else None
        if not cities: cities = STATE_CITIES.get(state, DEFAULT_CITIES.get(state, []))
        if not cities:
            self.job.stop_reason = "No cities configured"
            self.job.stop_reason_detail = f"No cities for state {state}."
            return []
        
        total_steps = len(keywords) * len(cities)
        step = 0
        for keyword in keywords:
            self.job.current_keyword = keyword
            for city_data in cities:
                self.job.current_city = city_data.get('city', 'Unknown')
                logger.info(f"Searching: {keyword} in {self.job.current_city}, {state}")
                self._search_location(city_data, keyword)
                step += 1
                self.job.progress = int((step / total_steps) * 100)
                self.job.stats = {**self.stats, 'valid': len(self.businesses)}
                if len(self.businesses) >= min_results:
                    self.job.stop_reason = "Target reached"
                    self.job.stop_reason_detail = get_stop_reason_detail("Target reached")
                    return self._sorted()
        self.job.stop_reason = "All locations exhausted"
        self.job.stop_reason_detail = get_stop_reason_detail("All locations exhausted")
        return self._sorted()
    
    def _sorted(self):
        r = list(self.businesses.values())
        r.sort(key=lambda b: (-b.data_completeness_score, b.business_name.lower()))
        return r

jobs: Dict[str, JobData] = {}

def run_job(job_id, config):
    job = jobs.get(job_id)
    if not job: return
    api_key = os.getenv('GOOGLE_PLACES_API_KEY')
    if not api_key:
        job.status = JobStatus.FAILED
        job.stop_reason = "API key not configured"
        job.stop_reason_detail = "Set GOOGLE_PLACES_API_KEY environment variable."
        return
    try:
        job.status = JobStatus.RUNNING
        job.config = config
        engine = DiscoveryEngine(api_key, job, config)
        job.businesses = engine.run()
        job.stats = engine.stats
        job.status = JobStatus.COMPLETED
        job.progress = 100
        logger.info(f"Job {job_id}: {len(job.businesses)} valid businesses")
    except Exception as e:
        logger.exception(f"Job {job_id} failed")
        job.status = JobStatus.FAILED
        job.stop_reason = "Error"
        job.stop_reason_detail = str(e)

app = FastAPI(title="Business Discovery API", version="2.1.0")

# CORS Configuration - Allow frontend domains
allowed_origins = [
    "https://www.pointwakeglobal.com",  # Production frontend (with www)
    "https://pointwakeglobal.com",       # Production frontend (without www)
    "https://business-discovery-5h72.vercel.app",  # Vercel deployment
    "http://localhost:5173",             # Local development
    "http://localhost:8000",             # Local backend testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "healthy", "apiKeyConfigured": bool(os.getenv('GOOGLE_PLACES_API_KEY')), "version": "2.1.0"}

@app.get("/api/states")
async def get_states():
    return {"states": [{"code": k, "name": v} for k, v in sorted(US_STATES.items(), key=lambda x: x[1])]}

@app.get("/api/cities/{state}")
async def get_cities(state: str):
    state = state.upper()
    return {"state": state, "cities": [c['city'] for c in STATE_CITIES.get(state, DEFAULT_CITIES.get(state, []))]}

@app.post("/api/search", response_model=SearchResponse)
async def start_search(request: SearchRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())[:8]
    job = JobData(job_id=job_id, config={'keywords': request.keywords, 'geographyMode': request.geographyMode.value, 'state': request.state.upper(), 'cities': request.cities, 'minResults': request.minResults})
    jobs[job_id] = job
    background_tasks.add_task(run_job, job_id, job.config)
    return SearchResponse(jobId=job_id, status="started", message=f"Discovery started for {', '.join(request.keywords)} in {request.state}")

@app.get("/api/results/{job_id}")
async def get_results(job_id: str, preview: int = Query(default=PREVIEW_LIMIT, ge=1, le=100)):
    job = jobs.get(job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    total = len(job.businesses)
    preview_count = min(preview, total)
    preview_list = [b.to_dict() for b in job.businesses[:preview_count]]
    wPhone = sum(1 for b in job.businesses if b.phone_number)
    wEmail = sum(1 for b in job.businesses if b.email)
    wWeb = sum(1 for b in job.businesses if b.website)
    low_warn = {"message": "Fewer than 10 valid businesses found.", "suggestions": ["Try broader keywords", "Select different state", "Some industries have fewer listings"]} if job.status == JobStatus.COMPLETED and total < 10 else None
    return {"jobId": job.job_id, "status": job.status.value, "progress": job.progress, "totalValid": total, "previewCount": preview_count, "preview": preview_list, "counts": {"withPhone": wPhone, "withEmail": wEmail, "withWebsite": wWeb, "statesCovered": len(set(b.state for b in job.businesses if b.state)), "totalSearched": job.stats.get('total_searched', 0), "duplicatesRemoved": job.stats.get('duplicates', 0), "fakePhonesFiltered": job.stats.get('fake_phones', 0), "fakeEmailsFiltered": job.stats.get('fake_emails', 0), "validationFailed": job.stats.get('validation_failed', 0), "emailsScraped": job.stats.get('emails_scraped', 0)}, "stopReason": job.stop_reason, "stopReasonDetail": job.stop_reason_detail, "lowResultWarning": low_warn, "currentKeyword": job.current_keyword, "currentCity": job.current_city}

@app.get("/api/results/{job_id}/csv")
async def download_csv(job_id: str):
    job = jobs.get(job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.COMPLETED: raise HTTPException(status_code=400, detail=f"Job not completed ({job.status.value})")
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_HEADERS, extrasaction='ignore')
    writer.writeheader()
    for b in job.businesses: writer.writerow(b.to_csv_row())
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="{generate_csv_filename(job)}"', "X-Total-Rows": str(len(job.businesses))})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    if not os.getenv('GOOGLE_PLACES_API_KEY'): print("WARNING: GOOGLE_PLACES_API_KEY not set!")
    uvicorn.run(app, host="0.0.0.0", port=port)
