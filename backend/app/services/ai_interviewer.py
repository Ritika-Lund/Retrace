import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

def build_codebase_summary(repo_data: dict) -> str:
    summary = f"Repository: {repo_data['repo_url']}\n"
    summary += f"Total files: {repo_data['file_count']}\n\n"

    if repo_data['dependencies'].get('npm'):
        summary += f"NPM Dependencies: {', '.join(repo_data['dependencies']['npm'][:20])}\n"
    if repo_data['dependencies'].get('pip'):
        summary += f"Python Dependencies: {', '.join(repo_data['dependencies']['pip'][:20])}\n"

    summary += f"\nRecent Commits:\n"
    for commit in repo_data['commits'][:5]:
        summary += f"- {commit['hash']}: {commit['message']}\n"

    summary += f"\nKey Files:\n"
    for file_path, content in list(repo_data['files'].items())[:10]:
        summary += f"\n--- {file_path} ---\n"
        summary += content[:500] + "...\n" if len(content) > 500 else content + "\n"

    return summary

async def generate_interview_question(
    repo_data: dict,
    conversation_history: list,
    company_mode: str = "generic"
) -> str:

    codebase_summary = build_codebase_summary(repo_data)

    company_styles = {
        "generic": "a senior software engineer conducting a technical interview",
        "meta": "a Meta/Facebook senior engineer focusing on scale, performance, and system design",
        "google": "a Google SWE interviewer focusing on code quality, algorithms, and architecture",
        "startup": "a startup CTO who wants to understand every technical decision deeply"
    }

    interviewer_style = company_styles.get(company_mode, company_styles["generic"])

    system_prompt = f"""You are {interviewer_style}.
You have thoroughly reviewed the candidate's codebase below and are now interviewing them about it.

CODEBASE CONTEXT:
{codebase_summary}

INTERVIEW RULES:
- Ask ONE specific question at a time about their actual code
- Reference specific files, functions, or decisions from their codebase
- Be direct and slightly challenging — this should feel like a real interview
- If they give a vague answer, push back and ask for more detail
- Focus on: architecture decisions, technology choices, trade-offs, and problem solving
- Never ask generic questions — always tie it back to their specific code
- Keep questions concise and clear

Start with an opening question about their most significant architectural decision."""

    messages = [{"role": "system", "content": system_prompt}]

    for msg in conversation_history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    if len(messages) == 1:
        messages.append({
            "role": "user",
            "content": "Please start the interview."
        })

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.8,
                "max_tokens": 500
            },
            timeout=30.0
        )

        result = response.json()
        print("GROQ RESPONSE:", result)
        return result["choices"][0]["message"]["content"]
async def evaluate_answer(
    question: str,
    answer: str,
    repo_data: dict
) -> dict:
    
    system_prompt = """You are a technical interview evaluator.
Given a question about a codebase and the candidate's answer, evaluate how well they understood and explained their code.

Respond ONLY with a JSON object like this:
{
  "score": 1,
  "feedback": "Brief feedback here",
  "confident": true
}

Where:
- score is 0 (poor) or 1 (good)
- feedback is 1-2 sentences of honest feedback
- confident is true if they clearly understood, false if they were vague"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Question: {question}\n\nAnswer: {answer}"}
    ]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 150
            },
            timeout=30.0
        )

        result = response.json()
        text = result["choices"][0]["message"]["content"]
        
        try:
            import json
            clean = text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except:
            return {"score": 0, "feedback": "Could not evaluate answer", "confident": False}