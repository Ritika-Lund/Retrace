from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import interview

app = FastAPI(title="Retrace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)

@app.get("/")
def root():
    return {"message": "Retrace API is running"}