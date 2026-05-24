from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ws, webhook
from app.core.logger import get_logger

logger = get_logger("main")

app = FastAPI(title="DevOps Flight Simulator", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws.router)
app.include_router(webhook.router)

@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info("DevOps Flight Simulator backend launched.")
    logger.info("Port: 8002")
    logger.info("WebSocket: ws://localhost:8002/ws")
    logger.info("Webhook:   POST http://localhost:8002/webhook")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown():
    logger.warning("Backend is being shut down...")

@app.get("/health")
async def health():
    return {"status": "ok"}