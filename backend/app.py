import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_ANON_KEY must be set in the backend .env file."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def serialize_user(user):
    if not user:
        return None
    return {
        "id": getattr(user, "id", None),
        "email": getattr(user, "email", None),
        "email_confirmed_at": getattr(user, "email_confirmed_at", None),
    }


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "quadcoach-backend"})


@app.post("/api/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        payload_for_signup = {
            "email": email,
            "password": password,
        }
        if FRONTEND_URL:
            payload_for_signup["options"] = {"email_redirect_to": FRONTEND_URL}

        response = supabase.auth.sign_up(payload_for_signup)
        user = getattr(response, "user", None)
        email_confirmed_at = getattr(user, "email_confirmed_at", None)

        if user and not email_confirmed_at:
            return jsonify(
                {
                    "user": serialize_user(user),
                    "requires_confirmation": True,
                    "message": "Account created. Check your email to verify your account before logging in.",
                }
            )

        return jsonify(
            {
                "user": serialize_user(user),
                "requires_confirmation": False,
                "message": "Account created. You can log in now.",
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        response = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        user = getattr(response, "user", None)
        session = getattr(response, "session", None)

        if user and not getattr(user, "email_confirmed_at", None):
            return jsonify(
                {
                    "error": "Please verify your email before logging in.",
                    "requires_confirmation": True,
                }
            ), 403

        return jsonify(
            {
                "user": serialize_user(user),
                "session": {
                    "access_token": getattr(session, "access_token", None),
                }
                if session
                else None,
            }
        )
    except Exception as exc:
        message = str(exc)
        lower_message = message.lower()
        if "email not confirmed" in lower_message or "verify your email" in lower_message:
            return jsonify(
                {
                    "error": "Please verify your email before logging in.",
                    "requires_confirmation": True,
                }
            ), 403
        return jsonify({"error": message}), 401


@app.get("/api/me")
def me():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing bearer token."}), 401

    token = auth_header.split(" ", 1)[1].strip()

    try:
        response = supabase.auth.get_user(token)
        user = getattr(response, "user", None)
        if not user:
            return jsonify({"error": "Invalid session."}), 401

        return jsonify({"user": serialize_user(user)})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 401


@app.post("/api/logout")
def logout():
    try:
        supabase.auth.sign_out()
        return jsonify({"message": "Logged out successfully."})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)