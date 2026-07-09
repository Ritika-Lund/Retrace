from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import  _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routers import interview
from app.limiter import limiter


app = FastAPI(title="Retrace API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://retrace-bay.vercel.app",
        "https://retrace-2fubis3j0-ritika-projects-vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)

@app.get("/")
def root():
    return {"message": "Retrace API is running"}
    