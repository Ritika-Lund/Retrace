from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.repo_parser import parse_repo
from app.services.ai_interviewer import generate_interview_question, evaluate_answer

router = APIRouter(prefix="/interview", tags=["interview"])

class StartInterviewRequest(BaseModel):
    repo_url: str
    company_mode: str = "generic"

class ContinueInterviewRequest(BaseModel):
    repo_url: str
    conversation_history: list
    company_mode: str = "generic"

class EvaluateRequest(BaseModel):
    question: str
    answer: str
    repo_url: str

@router.post("/start")
async def start_interview(request: StartInterviewRequest):
    try:
        repo_data = parse_repo(request.repo_url)
        question = await generate_interview_question(
            repo_data=repo_data,
            conversation_history=[],
            company_mode=request.company_mode
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
async def continue_interview(request: ContinueInterviewRequest):
    try:
        repo_data = parse_repo(request.repo_url)
        question = await generate_interview_question(
            repo_data=repo_data,
            conversation_history=request.conversation_history,
            company_mode=request.company_mode
        )
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/evaluate")
async def evaluate(request: EvaluateRequest):
    try:
        result = await evaluate_answer(
            question=request.question,
            answer=request.answer,
            repo_data={}
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))