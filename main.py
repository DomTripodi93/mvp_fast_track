# app/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from brotli_asgi import BrotliMiddleware
from fastapi.middleware.cors import CORSMiddleware

from controllers.test_controller import router as test_router
from controllers.user_controller import router as user_router
from controllers.auth_controller import router as auth_router

import signal
import sys

from shared.auth_middleware import AuthMiddleware

# uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Create an instance of FastAPI
app = FastAPI()

dev = True

cors_origins = ["https://MVPFastTrack.com","https://www.MVPFastTrack.com"]

if dev:
    cors_origins = ["http://localhost:4200"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Allows all origins. Use specific domains in production!
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    print("hit custom handler")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Add middleware to FastAPI
app.add_middleware(AuthMiddleware)


app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(test_router, prefix="/api/v1/test", tags=["Test"])
app.include_router(user_router, prefix="/api/v1/user", tags=["User"])


# Graceful shutdown handler
def shutdown_handler(signum, frame):
    print("Shutting down gracefully...")
    sys.exit(0)


# Register signal handlers
signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)
