import hmac
import hashlib
import smtplib
import ssl
from email.message import EmailMessage

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from auth_utils import create_token
from config import (INITIAL_ADMIN_SETUP_KEY, FRONTEND_URL, JWT_SECRET,
                    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM)
from flask import Blueprint, request, jsonify
from mysql.connector.errors import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_db_connection


auth_routes = Blueprint("auth_routes", __name__)


def _send_password_reset_email(recipient, reset_url):
    message = EmailMessage()
    message["Subject"] = "Reset your HostelSync password"
    message["From"] = SMTP_FROM
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your HostelSync password.\n\n"
        f"Choose a new password using this one-time link (valid for 30 minutes):\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )
    context = ssl.create_default_context()
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=15) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)


@auth_routes.route("/api/password-reset/request", methods=["POST"])
def request_password_reset():
    data = request.get_json(silent=True)
    email = data.get("email") if isinstance(data, dict) else None
    if not isinstance(email, str) or not email.strip():
        return jsonify({"message": "Email is required"}), 400
    if not all((JWT_SECRET, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM)):
        return jsonify({"message": "Password reset email is not configured"}), 503

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (email.strip().lower(),))
        user = cursor.fetchone()
    finally:
        cursor.close()
        db.close()

    # Keep the response identical for existing and unknown email addresses.
    if user:
        serializer = URLSafeTimedSerializer(JWT_SECRET, salt="hostelsync-password-reset")
        fingerprint = hmac.new(JWT_SECRET.encode(), user["password_hash"].encode(), hashlib.sha256).hexdigest()
        token = serializer.dumps({"id": user["id"], "email": user["email"], "fingerprint": fingerprint})
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        try:
            _send_password_reset_email(user["email"], reset_url)
        except (OSError, smtplib.SMTPException):
            auth_routes.logger.exception("Could not send password reset email")

    return jsonify({"message": "If an account exists for that email, a password reset link has been sent."}), 200


@auth_routes.route("/api/password-reset/confirm", methods=["POST"])
def confirm_password_reset():
    data = request.get_json(silent=True)
    token = data.get("token") if isinstance(data, dict) else None
    password = data.get("password") if isinstance(data, dict) else None
    if not isinstance(token, str) or not isinstance(password, str):
        return jsonify({"message": "A reset token and new password are required"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400
    if not JWT_SECRET:
        return jsonify({"message": "Password reset is not configured"}), 503

    serializer = URLSafeTimedSerializer(JWT_SECRET, salt="hostelsync-password-reset")
    try:
        payload = serializer.loads(token, max_age=1800)
    except SignatureExpired:
        return jsonify({"message": "This reset link has expired. Request a new one."}), 400
    except BadSignature:
        return jsonify({"message": "This reset link is invalid. Request a new one."}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT password_hash FROM users WHERE id = %s AND email = %s",
                       (payload.get("id"), payload.get("email")))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "This reset link is invalid or has already been used. Request a new one."}), 400
        expected_fingerprint = hmac.new(JWT_SECRET.encode(), user["password_hash"].encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_fingerprint, payload.get("fingerprint", "")):
            return jsonify({"message": "This reset link is invalid or has already been used. Request a new one."}), 400
        cursor.execute("""UPDATE users SET password_hash = %s
                          WHERE id = %s AND email = %s AND password_hash = %s""",
                       (generate_password_hash(password), payload.get("id"),
                        payload.get("email"), user["password_hash"]))
        updated = cursor.rowcount == 1
        if updated:
            db.commit()
        else:
            db.rollback()
    finally:
        cursor.close()
        db.close()

    if not updated:
        return jsonify({"message": "This reset link is invalid or has already been used. Request a new one."}), 400
    return jsonify({"message": "Your password has been updated. You can now sign in."}), 200


@auth_routes.route("/api/admin-bootstrap/status", methods=["GET"])
def admin_bootstrap_status():
    if not INITIAL_ADMIN_SETUP_KEY:
        return jsonify({"available": False}), 200

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
        return jsonify({"available": cursor.fetchone() is None}), 200
    finally:
        cursor.close()
        db.close()


@auth_routes.route("/api/admin-bootstrap", methods=["POST"])
def bootstrap_first_admin():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"message": "A JSON request body is required"}), 400

    if not INITIAL_ADMIN_SETUP_KEY:
        return jsonify({"message": "Initial administrator setup is not configured"}), 503

    setup_key = data.get("setup_key")
    if not isinstance(setup_key, str) or not hmac.compare_digest(setup_key, INITIAL_ADMIN_SETUP_KEY):
        return jsonify({"message": "The initial setup key is invalid"}), 403

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    if not all(isinstance(value, str) for value in (name, email, password)):
        return jsonify({"message": "Name, email, and password are required"}), 400

    name = name.strip()
    email = email.strip().lower()
    if not name or not email or not password:
        return jsonify({"message": "Name, email, and password are required"}), 400
    if len(name) > 100 or len(email) > 150:
        return jsonify({"message": "Name or email exceeds the allowed length"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    lock_name = "hostelsync_initial_admin_bootstrap"
    lock_acquired = False

    try:
        cursor.execute("SELECT GET_LOCK(%s, 10) AS acquired", (lock_name,))
        lock_result = cursor.fetchone()
        lock_acquired = bool(lock_result and lock_result["acquired"] == 1)
        if not lock_acquired:
            return jsonify({"message": "Initial administrator setup is busy. Please try again"}), 503

        cursor.execute("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
        if cursor.fetchone():
            return jsonify({"message": "An administrator account already exists"}), 409

        cursor.execute("""
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, 'ADMIN')
        """, (name, email, generate_password_hash(password)))
        db.commit()
        admin_id = cursor.lastrowid
    except IntegrityError as error:
        db.rollback()
        if error.errno == 1062:
            return jsonify({"message": "An account with this email already exists"}), 409
        raise
    finally:
        if lock_acquired:
            cursor.execute("SELECT RELEASE_LOCK(%s)", (lock_name,))
        cursor.close()
        db.close()

    return jsonify({
        "message": "Initial administrator account created. Sign in to continue",
        "user": {"id": admin_id, "name": name, "email": email, "role": "ADMIN"}
    }), 201


@auth_routes.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"message": "A JSON request body is required"}), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if (
        not isinstance(name, str)
        or not isinstance(email, str)
        or not isinstance(password, str)
    ):
        return jsonify({
            "message": "Name, email, and password are required"
        }), 400

    name = name.strip()
    email = email.strip().lower()

    if not name or not email or not password:
        return jsonify({
            "message": "Name, email, and password are required"
        }), 400

    if len(name) > 100 or len(email) > 150:
        return jsonify({
            "message": "Name or email exceeds the allowed length"
        }), 400

    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, 'BOARDER')
        """, (name, email, generate_password_hash(password)))
        db.commit()
        user_id = cursor.lastrowid
    except IntegrityError as error:
        db.rollback()
        if error.errno == 1062:
            return jsonify({"message": "An account with this email already exists"}), 409
        raise
    finally:
        cursor.close()
        db.close()

    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": "BOARDER"
        }
    }), 201


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
