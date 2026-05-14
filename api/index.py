import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routes import router

load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Sunbird AI Pipeline API",
    description=(
        "Backend for the Sunbird AI pipeline: "
        "Speech-to-Text → Summarise → Translate → Text-to-Speech."
    ),
    version="1.0.0",
    docs_url="/docs",       # Swagger UI  →  http://localhost:8000/docs
    redoc_url="/redoc",     # ReDoc        →  http://localhost:8000/redoc
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Allows the Next.js dev server (port 3000) and any production origin you add.
# Tighten this list before deploying to production.

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.get("/", tags=["health"])
def root():
    """Health-check — confirms the API is reachable."""
    return {"status": "ok", "message": "Sunbird AI Pipeline API is running."}
