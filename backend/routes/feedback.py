from flask import Blueprint, current_app, jsonify, request

from services.coaching_rag import CoachingIndexError, retrieve_relevant_chunks
from services.feedback_llm import (
    FeedbackLLMNotConfiguredError,
    generate_behavioral_feedback,
)
from services.supabase_service import supabase


feedback_bp = Blueprint("feedback", __name__)
MAX_ANSWER_CHARS = 10_000


@feedback_bp.post("/api/feedback/behavioral")
def behavioral_feedback():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing bearer token."}), 401

    token = auth_header.split(" ", 1)[1].strip()
    payload = request.get_json(silent=True)
    answer = payload.get("answer") if isinstance(payload, dict) else None
    if not isinstance(answer, str) or not answer.strip():
        return jsonify({"error": "Enter an answer before requesting feedback."}), 400
    if len(answer) > MAX_ANSWER_CHARS:
        return jsonify({"error": "Answers must be 10,000 characters or fewer."}), 400

    try:
        auth_response = supabase.auth.get_user(token)
        if not getattr(auth_response, "user", None):
            return jsonify({"error": "Invalid session."}), 401

        chunks = retrieve_relevant_chunks(answer.strip(), top_k=3)
        feedback = generate_behavioral_feedback(answer.strip(), chunks)
        sources = []
        seen_sources = set()
        for chunk in chunks:
            key = (chunk["source"], chunk["section"])
            if key not in seen_sources:
                seen_sources.add(key)
                sources.append(
                    {
                        "title": chunk["source"],
                        "section": chunk["section"],
                        "score": chunk["score"],
                    }
                )
        return jsonify({"feedback": feedback, "sources": sources})
    except CoachingIndexError as exc:
        current_app.logger.warning("Behavioral feedback retrieval failed: %s", exc)
        return jsonify({"error": str(exc)}), 503
    except FeedbackLLMNotConfiguredError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception:
        current_app.logger.exception("Behavioral feedback generation failed")
        return jsonify({"error": "Unable to generate feedback right now."}), 502
