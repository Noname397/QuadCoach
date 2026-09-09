from flask import Blueprint, current_app, jsonify, make_response, render_template_string, request

from config import AUTH_VERIFY_URL, FRONTEND_URL
from services.supabase_service import get_profile, serialize_user, supabase

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/api/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        signup_payload = {"email": email, "password": password}
        if AUTH_VERIFY_URL:
            signup_payload["options"] = {"email_redirect_to": AUTH_VERIFY_URL}

        response = supabase.auth.sign_up(signup_payload)
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
        current_app.logger.exception("Signup failed")
        return jsonify({"error": "Unable to create account."}), 400


@auth_bp.post("/api/login")
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
        if (
            "email not confirmed" in message.lower()
            or "verify your email" in message.lower()
        ):
            return jsonify(
                {
                    "error": "Please verify your email before logging in.",
                    "requires_confirmation": True,
                }
            ), 403
        current_app.logger.exception("Login failed")
        return jsonify({"error": "Unable to log in."}), 401


@auth_bp.get("/api/me")
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

        profile = get_profile(token, user.id)
        return jsonify(
            {
                "user": serialize_user(user),
                "profile": profile,
                "profile_complete": bool(profile and profile.get("name")),
            }
        )
    except Exception as exc:
        current_app.logger.exception("Loading current user failed")
        return jsonify({"error": "Unable to load your account."}), 401


@auth_bp.post("/api/logout")
def logout():
    try:
        supabase.auth.sign_out()
        return jsonify({"message": "Logged out successfully."})
    except Exception as exc:
        current_app.logger.exception("Logout failed")
        return jsonify({"error": "Unable to log out."}), 400


@auth_bp.get("/auth/verify")
def auth_verify():
    html = """
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Verifying...</title>
    </head>
    <body>
      <p>Verifying your account - if you are not redirected, click Continue.</p>
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
              goToFrontend();
            }).catch(err => {
              console.error('Failed to set session on server', err);
              const btn = document.getElementById('continue');
              btn.style.display = 'inline';
              btn.addEventListener('click', goToFrontend);
            });
          } else {
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


@auth_bp.post("/auth/session")
def auth_session():
    payload = request.get_json(silent=True) or {}
    access_token = payload.get("access_token")
    refresh_token = payload.get("refresh_token")
    expires_in = payload.get("expires_in")

    if not access_token:
        return jsonify({"error": "missing access_token"}), 400

    try:
        response = supabase.auth.get_user(access_token)
        user = getattr(response, "user", None)
        if not user:
            return jsonify({"error": "invalid token"}), 401
    except Exception as exc:
        current_app.logger.exception("Session validation failed")
        return jsonify({"error": "Unable to validate the session."}), 401

    response = make_response(jsonify({"ok": True}))
    secure_flag = not current_app.debug
    try:
        max_age = int(expires_in) if expires_in else None
    except (TypeError, ValueError):
        max_age = None

    cookie_options = {
        "httponly": True,
        "secure": secure_flag,
        "samesite": "Lax",
        "path": "/",
    }
    if max_age and max_age > 0:
        cookie_options["max_age"] = max_age
    response.set_cookie("sb_access_token", access_token, **cookie_options)

    if refresh_token:
        response.set_cookie(
            "sb_refresh_token",
            refresh_token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            max_age=60 * 60 * 24 * 30,
            path="/",
        )

    return response
