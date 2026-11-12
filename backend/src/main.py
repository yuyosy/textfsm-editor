from datetime import datetime

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from src.api import router as api_router
from src.config import get_settings
from src.middleware import SecurityHeadersMiddleware
from src.my_logger import logger

# Load settings from environment variables (cached)
settings = get_settings()

# Validate paths and log warnings
for warning in settings.validate_paths():
    logger.warning(warning)

# Configure OpenAPI docs based on settings
docs_url = "/docs" if settings.docs_enabled else None
redoc_url = "/redoc" if settings.docs_enabled else None
openapi_url = "/openapi.json" if settings.docs_enabled else None

# Root
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description=settings.app_description,
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)

logger.info(f"Running in {settings.mode} mode")
logger.info(f"Allowed hosts: {settings.allowed_hosts}")
logger.info(f"CORS origins: {settings.cors_origins}")
logger.info(f"Public directory: {settings.public_dir}")
logger.info(f"Static directory: {settings.static_dir}")
logger.info(f"Assets directory: {settings.assets_dir}")
logger.info(f"HTTPS redirect enabled: {settings.enable_https_redirect}")

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add TrustedHostMiddleware in production only to avoid "Invalid host header" error in development
if not settings.is_development and "*" not in settings.allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

if not settings.is_development and settings.enable_https_redirect:
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

    logger.info("Enabling HTTPS redirect middleware")
    app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=5)

app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")
if settings.is_development or settings.assets_dir != settings.static_dir / "assets":
    app.mount("/assets", StaticFiles(directory=settings.assets_dir), name="assets")


@app.get("/", include_in_schema=False)
async def root():
    logger.info("Serving root endpoint")  # Log when root endpoint is called
    if settings.is_development:
        return {
            "mode": settings.mode,
            "message": "This Path is the entry point in production mode.",
            "datetime": datetime.now().isoformat(),
        }

    index_file = settings.static_dir.joinpath("index.html")
    if index_file.exists():
        return FileResponse(index_file)
    else:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Index file not found."},
        )


app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "version": settings.app_version,
    }


if not settings.is_development:
    # Vite's public files are served at their original paths. Register this
    # after the API and health routes so the root mount does not handle them.
    app.mount("/", StaticFiles(directory=settings.static_dir), name="frontend")
