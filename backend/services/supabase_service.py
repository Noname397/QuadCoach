import json
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

from supabase import create_client

from config import SUPABASE_KEY, SUPABASE_URL

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def authenticated_supabase(token):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(token)
    return client


def serialize_user(user):
    if not user:
        return None
    app_metadata = getattr(user, "app_metadata", {}) or {}
    return {
        "id": getattr(user, "id", None),
        "email": getattr(user, "email", None),
        "email_confirmed_at": getattr(user, "email_confirmed_at", None),
        "auth_provider": app_metadata.get("provider", "email"),
    }


def get_profile(token, user_id):
    response = (
        authenticated_supabase(token)
        .table("profiles")
        .select("id,name,profile_picture_path")
        .eq("id", user_id)
        .execute()
    )
    profile = response.data[0] if response.data else None
    if profile and profile.get("profile_picture_path"):
        profile["profile_picture_url"] = get_avatar_url(
            token, profile["profile_picture_path"]
        )
    return profile


def upload_avatar(token, path, picture_bytes, content_type):
    storage_url = f"{SUPABASE_URL}/storage/v1/object/avatars/{quote(path, safe='/')}"
    upload_request = Request(
        storage_url,
        data=picture_bytes,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": SUPABASE_KEY,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
    )
    try:
        with urlopen(upload_request) as response:
            response.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Avatar upload failed ({exc.code}): {detail}") from exc


def get_avatar_url(token, path):
    sign_url = f"{SUPABASE_URL}/storage/v1/object/sign/avatars/{quote(path, safe='/')}"
    sign_request = Request(
        sign_url,
        data=json.dumps({"expiresIn": 3600}).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(sign_request) as response:
            payload = json.loads(response.read().decode("utf-8"))
        signed_url = payload.get("signedURL") or payload.get("signedUrl")
        if not signed_url:
            raise RuntimeError("Avatar URL response did not include a signed URL.")
        if signed_url.startswith("http"):
            return signed_url
        if signed_url.startswith("/storage/v1/"):
            return f"{SUPABASE_URL}{signed_url}"
        return f"{SUPABASE_URL}/storage/v1/{signed_url.lstrip('/')}"
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Avatar URL failed ({exc.code}): {detail}") from exc
