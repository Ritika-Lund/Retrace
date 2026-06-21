from datetime import datetime, timedelta

STAGE_DAYS = [1, 3, 7, 14]


def compute_advance(current_stage: int, now: datetime = None) -> dict:
    """Called when a user answers confidently on an existing weakness."""
    if now is None:
        now = datetime.utcnow()
    new_stage = current_stage + 1
    is_resolved = new_stage >= len(STAGE_DAYS)
    interval = STAGE_DAYS[new_stage] if new_stage < len(STAGE_DAYS) else 14
    next_review = now + timedelta(days=interval)
    return {
        "review_stage": new_stage,
        "next_review_at": next_review.isoformat(),
        "resolved": is_resolved
    }


def compute_reset(current_fail_count: int, now: datetime = None) -> dict:
    """Called when a user fails on an existing weakness."""
    if now is None:
        now = datetime.utcnow()
    next_review = now + timedelta(days=1)
    return {
        "fail_count": current_fail_count + 1,
        "last_seen": now.isoformat(),
        "review_stage": 0,
        "next_review_at": next_review.isoformat(),
        "resolved": False
    }


def compute_new_weakness(now: datetime = None) -> dict:
    """Called when a user fails on a topic with no existing weakness row."""
    if now is None:
        now = datetime.utcnow()
    next_review = now + timedelta(days=1)
    return {
        "review_stage": 0,
        "next_review_at": next_review.isoformat()
    }