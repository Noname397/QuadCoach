import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request, render_template_string, make_response
from flask_cors import CORS
from supabase import create_client

load_dotenv()

app = Flask(__name__)
# CORS will be initialized after loading FRONTEND_URL so we can allow credentials
# from the specific frontend origin rather than using a permissive '*'.
# (See below where AUTH_VERIFY_URL and FRONTEND_URL are read from env.)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
# URL Supabase should redirect to after email verification. This should be a backend route
# that reads the fragment and posts tokens to the server (e.g. http://localhost:5000/auth/verify).
AUTH_VERIFY_URL = os.getenv("AUTH_VERIFY_URL", "http://localhost:5000/auth/verify")

# Initialize CORS with credentials support for the frontend origin so the
# verify page can POST tokens and receive cookies. Do NOT use '*' when
# credentials are required.
CORS(app, supports_credentials=True, resources={
    r"/api/*": {"origins": FRONTEND_URL},
    r"/auth/*": {"origins": FRONTEND_URL}
})

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
        # Always pass AUTH_VERIFY_URL as the email redirect target so Supabase redirects to
                # our backend verify handler. Keep FRONTEND_URL for the final client redirect after
                # the backend sets cookies.
                if AUTH_VERIFY_URL:
                    payload_for_signup["options"] = {"email_redirect_to": AUTH_VERIFY_URL}

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


@app.get("/auth/verify")
def auth_verify():
    # This page reads the URL fragment (window.location.hash) which contains
    # Supabase-issued tokens (access_token, refresh_token, expires_in, ...)
    # and POSTs them to /auth/session so the server can set HttpOnly cookies.
    html = """
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Verifying...</title>
    </head>
    <body>
      <p>Verifying your account — if you are not redirected, click Continue.</p>
      <button id="continue" style="display:none;">Continue</button>
      <script>
      (function(){
        try {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          const expires_in = params.get('expires_in');
          const token_type = params.get('token_type');

          function goToFrontend() {
            // Remove fragment from URL so tokens are not left in history
            try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch(e){}
            window.location.href = "{{ frontend_url }}";
          }

          if (access_token) {
            fetch('/auth/session', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token, refresh_token, expires_in, token_type })
            }).then(resp => {
              // On success or failure, redirect to frontend; server will handle auth state.
              goToFrontend();
            }).catch(err => {
              console.error('Failed to set session on server', err);
              // Allow the user to continue manually if automatic step fails
              const btn = document.getElementById('continue');
              btn.style.display = 'inline';
              btn.addEventListener('click', goToFrontend);
            });
          } else {
            // No tokens in fragment: just redirect to frontend
            goToFrontend();
          }
        } catch (e) {
          console.error(e);
          window.location.href = "{{ frontend_url }}";
        }
      })();
      </script>
    </body>
    </html>
    """
    return render_template_string(html, frontend_url=FRONTEND_URL)


@app.post("/auth/session")
def auth_session():
    """Accepts tokens posted from the verify page, validates them with Supabase,
    and sets HttpOnly cookies for subsequent requests. This is the simple
    cookie-based approach (access and refresh tokens stored directly in cookies).
    """
    payload = request.get_json(silent=True) or {}
    access_token = payload.get("access_token")
    refresh_token = payload.get("refresh_token")
    expires_in = payload.get("expires_in")

    if not access_token:
        return jsonify({"error": "missing access_token"}), 400

    try:
        # Validate token with Supabase
        resp = supabase.auth.get_user(access_token)
        user = getattr(resp, "user", None)
        if not user:
            return jsonify({"error": "invalid token"}), 401
    except Exception as exc:
        return jsonify({"error": str(exc)}), 401

    # Set cookies
    response = make_response(jsonify({"ok": True}))
    secure_flag = not app.debug

    try:
        max_age = int(expires_in) if expires_in else None
    except Exception:
        max_age = None

    # Access token cookie (shorter lifetime)
    if max_age and max_age > 0:
        response.set_cookie(
            "sb_access_token",
            access_token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            max_age=max_age,
            path="/",
        )
    else:
        response.set_cookie(
            "sb_access_token",
            access_token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            path="/",
        )

    # Refresh token cookie (longer lifetime)
    if refresh_token:
        response.set_cookie(
            "sb_refresh_token",
            refresh_token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            max_age=60 * 60 * 24 * 30,  # 30 days
            path="/",
        )

    return response


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