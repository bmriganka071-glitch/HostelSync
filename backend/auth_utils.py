import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import request, jsonify

from config import JWT_SECRET


def create_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }

    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_token(token):
    try:
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

    except jwt.ExpiredSignatureError:
        return None

    except jwt.InvalidTokenError:
        return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "message": "Authorization header is required"
            }), 401

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "message": "Invalid authorization format"
            }), 401

        token = auth_header.split(" ", 1)[1]

        payload = verify_token(token)

        if not payload:
            return jsonify({
                "message": "Invalid or expired token"
            }), 401

        request.user = payload

        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):

        if request.user["role"] != "ADMIN":
            return jsonify({
                "message": "Admin access required"
            }), 403

        return f(*args, **kwargs)

    return decorated