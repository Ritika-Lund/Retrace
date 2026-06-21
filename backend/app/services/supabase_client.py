import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Service client: full access, bypasses RLS — used only after we've verified the user
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_verified_user_id(access_token: str) -> str:
    """Verify a user's Supabase auth token and return their real user_id.
    Raises an exception if the token is invalid/expired."""
    user_response = supabase_admin.auth.get_user(access_token)
    if not user_response or not user_response.user:
        raise ValueError("Invalid or expired session. Please log in again.")
    return user_response.user.id