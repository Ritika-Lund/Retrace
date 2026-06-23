import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime
from app.services.weakness_logic import compute_advance, compute_reset, compute_new_weakness


FIXED_NOW = datetime(2026, 6, 21, 12, 0, 0)


def test_advance_increments_stage():
    result = compute_advance(current_stage=0, now=FIXED_NOW)
    assert result["review_stage"] == 1
    assert result["resolved"] is False


def test_advance_schedules_correct_interval():
    result = compute_advance(current_stage=0, now=FIXED_NOW)
    next_review = datetime.fromisoformat(result["next_review_at"])
    assert (next_review - FIXED_NOW).days == 3


def test_advance_resolves_at_final_stage():
    result = compute_advance(current_stage=3, now=FIXED_NOW)
    assert result["review_stage"] == 4
    assert result["resolved"] is True


def test_advance_from_zero_to_one_schedules_three_days():
    result = compute_advance(current_stage=0, now=FIXED_NOW)
    next_review = datetime.fromisoformat(result["next_review_at"])
    assert (next_review - FIXED_NOW).days == 3


def test_reset_always_goes_to_stage_zero():
    result = compute_reset(current_fail_count=5, now=FIXED_NOW)
    assert result["review_stage"] == 0
    assert result["resolved"] is False


def test_reset_increments_fail_count():
    result = compute_reset(current_fail_count=2, now=FIXED_NOW)
    assert result["fail_count"] == 3


def test_reset_schedules_one_day_out():
    result = compute_reset(current_fail_count=0, now=FIXED_NOW)
    next_review = datetime.fromisoformat(result["next_review_at"])
    assert (next_review - FIXED_NOW).days == 1


def test_reset_from_high_stage_still_resets_to_zero():
    # Even though review_stage isn't passed into compute_reset directly,
    # this confirms the function's contract: failing always means stage 0,
    # regardless of how advanced the user previously was.
    result = compute_reset(current_fail_count=8, now=FIXED_NOW)
    assert result["review_stage"] == 0


def test_new_weakness_starts_at_stage_zero():
    result = compute_new_weakness(now=FIXED_NOW)
    assert result["review_stage"] == 0


def test_new_weakness_schedules_one_day_out():
    result = compute_new_weakness(now=FIXED_NOW)
    next_review = datetime.fromisoformat(result["next_review_at"])
    assert (next_review - FIXED_NOW).days == 1
    
def test_advance_already_resolved_stays_resolved():
    result = compute_advance(current_stage=4, now=FIXED_NOW)
    assert result["resolved"] is True
    assert result["review_stage"] <= 4