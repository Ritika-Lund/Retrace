from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.services.repo_parser import parse_repo
from app.services.ai_interviewer import generate_interview_question, evaluate_answer
from app.limiter import limiter
import time
from app.services.supabase_client import supabase_admin, get_verified_user_id
from datetime import datetime, timedelta

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
    repo_url: str
    company_mode: str = "generic"
    due_topics: list[str] = []

class ContinueInterviewRequest(BaseModel):
    repo_url: str
    conversation_history: list
    company_mode: str = "generic"

class EvaluateRequest(BaseModel):
    question: str
    answer: str
    repo_url: str
    existing_topics: list[str] = []
class SaveSessionRequest(BaseModel):
    access_token: str
    repo_url: str
    score: int
    total: int
    feedback: list

@router.post("/start")
@limiter.limit("10/minute")
async def start_interview(request: Request, body: StartInterviewRequest):
    try:
        repo_data = get_cached_repo_data(body.repo_url)
        print("DUE TOPICS RECEIVED:", body.due_topics)
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
        print("CONTINUE INTERVIEW ERROR:", str(e))
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
        print("EVALUATE ENDPOINT ERROR:", str(e))
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
    stage_days = [1, 3, 7, 14]

    for good in confident_answers:
        topic = good.get("topic") or (good.get("question", "")[:100])
        existing = supabase_admin.table("weaknesses").select("*") \
            .eq("user_id", user_id).eq("topic", topic).execute()

        if existing.data:
            row = existing.data[0]
            new_stage = row["review_stage"] + 1
            is_resolved = new_stage >= len(stage_days)
            interval = stage_days[new_stage] if new_stage < len(stage_days) else 14
            next_review = (datetime.utcnow() + timedelta(days=interval)).isoformat()

            supabase_admin.table("weaknesses").update({
                "review_stage": new_stage,
                "next_review_at": next_review,
                "resolved": is_resolved
            }).eq("id", row["id"]).execute()

    for failed in failed_answers:
        topic = failed.get("topic") or (failed.get("question", "")[:100])
        existing = supabase_admin.table("weaknesses").select("*") \
            .eq("user_id", user_id).eq("topic", topic).execute()

        next_review = (datetime.utcnow() + timedelta(days=1)).isoformat()

        if existing.data:
            row = existing.data[0]
            supabase_admin.table("weaknesses").update({
                "fail_count": row["fail_count"] + 1,
                "last_seen": datetime.utcnow().isoformat(),
                "review_stage": 0,
                "next_review_at": next_review,
                "resolved": False
            }).eq("id", row["id"]).execute()
        else:
            supabase_admin.table("weaknesses").insert({
                "user_id": user_id,
                "topic": topic,
                "repo_url": body.repo_url,
                "review_stage": 0,
                "next_review_at": next_review
            }).execute()

    return {"success": True}