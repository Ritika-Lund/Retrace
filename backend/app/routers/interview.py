from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator, Field
from typing import Literal
from app.services.repo_parser import parse_repo
from app.services.ai_interviewer import generate_interview_question, evaluate_answer
from app.limiter import limiter
import time
from app.services.supabase_client import supabase_admin, get_verified_user_id
from datetime import datetime, timedelta
from app.services.weakness_logic import compute_advance, compute_reset, compute_new_weakness
from app.logger import get_logger


logger = get_logger("interview")
REPO_CACHE = {}
CACHE_TTL_SECONDS = 600  # 10 minutes

def get_cached_repo_data(repo_url: str) -> dict:
    cached = REPO_CACHE.get(repo_url)
    if cached and (time.time() - cached["timestamp"]) < CACHE_TTL_SECONDS:
        return cached["data"]
    repo_data = parse_repo(repo_url)
    REPO_CACHE[repo_url] = {"data": repo_data, "timestamp": time.time()}
    return repo_data

router = APIRouter(prefix="/interview", tags=["interview"])

class StartInterviewRequest(BaseModel):
    repo_url: str = Field(..., max_length=200)
    company_mode: Literal["generic", "meta", "google", "startup"] = "generic"
    due_topics: list[str] = Field(default=[], max_length=10)

    @field_validator("repo_url")
    @classmethod
    def repo_url_must_be_github(cls, v):
        if not v.startswith("https://github.com/"):
            raise ValueError("Repository URL must start with https://github.com/")
        return v


class ContinueInterviewRequest(BaseModel):
    repo_url: str = Field(..., max_length=200)
    conversation_history: list = Field(..., max_length=50)
    company_mode: Literal["generic", "meta", "google", "startup"] = "generic"

    @field_validator("repo_url")
    @classmethod
    def repo_url_must_be_github(cls, v):
        if not v.startswith("https://github.com/"):
            raise ValueError("Repository URL must start with https://github.com/")
        return v


class EvaluateRequest(BaseModel):
    question: str = Field(..., max_length=5000)
    answer: str = Field(..., max_length=5000)
    repo_url: str = Field(..., max_length=200)
    existing_topics: list[str] = Field(default=[], max_length=20)


class SaveSessionRequest(BaseModel):
    access_token: str = Field(..., max_length=2000)
    repo_url: str = Field(..., max_length=200)
    score: int = Field(..., ge=0)
    total: int = Field(..., ge=0)
    feedback: list = Field(..., max_length=20)

    @field_validator("repo_url")
    @classmethod
    def repo_url_must_be_github(cls, v):
        if not v.startswith("https://github.com/"):
            raise ValueError("Repository URL must start with https://github.com/")
        return v

@router.post("/start")
@limiter.limit("10/minute")
async def start_interview(request: Request, body: StartInterviewRequest):
    try:
        repo_data = get_cached_repo_data(body.repo_url)
        logger.info("Starting interview: repo=%s due_topics=%s", body.repo_url, len(body.due_topics))
        question = await generate_interview_question(
            repo_data=repo_data,
            conversation_history=[],
            company_mode=body.company_mode,
            due_topics=body.due_topics
        )
        return {
            "question": question,
            "repo_summary": {
                "file_count": repo_data["file_count"],
                "dependencies": repo_data["dependencies"],
                "commits": repo_data["commits"][:5]
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Something went wrong while reading this repository. Please try again.")

@router.post("/continue")
@limiter.limit("20/minute")
async def continue_interview(request: Request, body: ContinueInterviewRequest):
    try:
        repo_data = get_cached_repo_data(body.repo_url)
        question = await generate_interview_question(
            repo_data=repo_data,
            conversation_history=body.conversation_history,
            company_mode=body.company_mode
        )
        return {"question": question}
    except Exception as e:
        logger.error("Continue interview failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Something went wrong while generating the next question. Please try again.")

@router.post("/evaluate")
@limiter.limit("30/minute")
async def evaluate(request: Request, body: EvaluateRequest):
    try:
        result = await evaluate_answer(
            question=body.question,
            answer=body.answer,
            repo_data={},
            existing_topics=body.existing_topics
        )
        return result
    except Exception as e:
        logger.error("Evaluate endpoint failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Something went wrong while evaluating your answer. Please try again.")
@router.post("/save-session")
@limiter.limit("10/minute")
async def save_session(request: Request, body: SaveSessionRequest):
    try:
        user_id = get_verified_user_id(body.access_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    percentage = round((body.score / body.total) * 100) if body.total > 0 else 0

    supabase_admin.table("sessions").insert({
        "user_id": user_id,
        "repo_url": body.repo_url,
        "score": body.score,
        "total": body.total,
        "percentage": percentage,
        "feedback": body.feedback
    }).execute()

    confident_answers = [f for f in body.feedback if f.get("confident")]
    failed_answers = [f for f in body.feedback if not f.get("confident")]

    for good in confident_answers:
        topic = good.get("topic") or (good.get("question", "")[:100])
        existing = supabase_admin.table("weaknesses").select("*") \
            .eq("user_id", user_id).eq("topic", topic).execute()

        if existing.data:
            row = existing.data[0]
            update_data = compute_advance(row["review_stage"])
            supabase_admin.table("weaknesses").update(update_data).eq("id", row["id"]).execute()

    for failed in failed_answers:
        topic = failed.get("topic") or (failed.get("question", "")[:100])
        existing = supabase_admin.table("weaknesses").select("*") \
            .eq("user_id", user_id).eq("topic", topic).execute()


        if existing.data:
            row = existing.data[0]
            update_data = compute_reset(row["fail_count"])
            supabase_admin.table("weaknesses").update(update_data).eq("id", row["id"]).execute()
        else:
            new_data = compute_new_weakness()
            new_data["user_id"] = user_id
            new_data["topic"] = topic
            new_data["repo_url"] = body.repo_url
            supabase_admin.table("weaknesses").insert(new_data).execute()
    return {"success": True}