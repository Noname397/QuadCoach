from flask import Blueprint, current_app, jsonify, request

from services.supabase_service import (
    authenticated_supabase,
    get_avatar_url,
    supabase,
    upload_avatar,
)

profile_bp = Blueprint("profile", __name__)


@profile_bp.put("/api/profile")
def save_profile():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing bearer token."}), 401

    token = auth_header.split(" ", 1)[1].strip()
    name = (request.form.get("name") or "").strip()
    picture = request.files.get("profile_picture")

    if not name:
        return jsonify({"error": "Name is required."}), 400

    try:
        response = supabase.auth.get_user(token)
        user = getattr(response, "user", None)
        if not user:
            return jsonify({"error": "Invalid session."}), 401

        profile_picture_path = None
        if picture and picture.filename:
            allowed_types = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp",
            }
            extension = allowed_types.get(picture.mimetype)
            picture_bytes = picture.read()
            if not extension:
                return jsonify({"error": "Use a JPEG, PNG, or WebP image."}), 400
            if len(picture_bytes) > 5 * 1024 * 1024:
                return jsonify(
                    {"error": "Profile pictures must be 5 MB or smaller."}
                ), 400

            profile_picture_path = f"{user.id}/profile.{extension}"
            upload_avatar(token, profile_picture_path, picture_bytes, picture.mimetype)

        profile = {"id": user.id, "name": name}
        if profile_picture_path:
            profile["profile_picture_path"] = profile_picture_path
        result = authenticated_supabase(token).table("profiles").upsert(profile).execute()
        saved_profile = result.data[0] if result.data else profile
        if saved_profile.get("profile_picture_path"):
            saved_profile["profile_picture_url"] = get_avatar_url(
                token, saved_profile["profile_picture_path"]
            )
        return jsonify({"profile": saved_profile})
    except Exception as exc:
        current_app.logger.exception("Profile update failed")
        return jsonify({"error": "Unable to update profile."}), 400
