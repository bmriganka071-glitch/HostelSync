from auth_utils import create_token
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash

from db import get_db_connection


auth_routes = Blueprint("auth_routes", __name__)


@auth_routes.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id,
            name,
            email,
            password_hash,
            role,
            room_id
        FROM users
        WHERE email = %s
    """, (email,))

    user = cursor.fetchone()

    cursor.close()
    db.close()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    token = create_token(
    user["id"],
    user["role"]
)

    return jsonify({
    "message": "Login successful",
    "token": token,
    "user": {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "room_id": user["room_id"]
    }
    }), 200