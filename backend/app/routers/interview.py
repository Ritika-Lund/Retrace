from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.services.repo_parser import parse_repo
from app.services.ai_interviewer import generate_interview_question, evaluate_answer
from app.limiter import limiter
import time

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