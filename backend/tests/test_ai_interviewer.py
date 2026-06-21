import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.ai_interviewer import parse_evaluation_response


def test_parses_clean_json():
    text = '{"score": 1, "feedback": "Good job", "confident": true, "explanation": null, "topic": "Database design", "topic_index": -1}'
    result = parse_evaluation_response(text)
    assert result["score"] == 1
    assert result["confident"] is True
    assert result["topic"] == "Database design"


def test_strips_markdown_code_fences():
    text = '```json\n{"score": 0, "feedback": "Vague", "confident": false, "explanation": "Needs detail", "topic": "API design", "topic_index": -1}\n```'
    result = parse_evaluation_response(text)
    assert result["score"] == 0
    assert result["topic"] == "API design"


def test_topic_index_replaces_topic_with_existing_match():
    existing_topics = ["Modular code structure", "Database design"]
    text = '{"score": 0, "feedback": "Vague", "confident": false, "explanation": "x", "topic": "Code organization", "topic_index": 0}'
    result = parse_evaluation_response(text, existing_topics)
    assert result["topic"] == "Modular code structure"


def test_topic_index_minus_one_keeps_ai_generated_topic():
    existing_topics = ["Modular code structure"]
    text = '{"score": 1, "feedback": "Good", "confident": true, "explanation": null, "topic": "Brand new topic", "topic_index": -1}'
    result = parse_evaluation_response(text, existing_topics)
    assert result["topic"] == "Brand new topic"


def test_invalid_topic_index_is_ignored_safely():
    existing_topics = ["Modular code structure"]
    text = '{"score": 0, "feedback": "x", "confident": false, "explanation": "x", "topic": "Something", "topic_index": 99}'
    result = parse_evaluation_response(text, existing_topics)
    assert result["topic"] == "Something"


def test_completely_broken_json_returns_safe_fallback():
    text = "this is not json at all"
    result = parse_evaluation_response(text)
    assert result["confident"] is False
    assert result["topic"] == "Unclear answer (parsing error)"