from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import users, invites, support, feed, webhooks

app = FastAPI(title="Tamago API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(invites.router)
app.include_router(support.router)
app.include_router(feed.router)
app.include_router(webhooks.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
