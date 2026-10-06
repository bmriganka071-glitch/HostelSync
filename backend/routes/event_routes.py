from flask import Blueprint, jsonify, request

from db import get_db_connection
from auth_utils import verify_token


event_routes = Blueprint("event_routes", __name__)


def get_token_data():

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None, jsonify({
            "message": "Authorization header is required"
        }), 401

    if not auth_header.startswith("Bearer "):
        return None, jsonify({
            "message": "Invalid authorization format"
        }), 401

    token = auth_header.split(" ", 1)[1]

    token_data = verify_token(token)

    if not token_data:
        return None, jsonify({
            "message": "Invalid or expired token"
        }), 401

    return token_data, None, None


@event_routes.route("/api/events", methods=["GET"])
def get_events():

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            e.id,
            e.title,
            e.description,
            e.event_date,
            e.created_at,
            e.admin_id,
            u.name AS created_by
        FROM events e
        JOIN users u
            ON e.admin_id = u.id
        ORDER BY e.event_date ASC
    """)

    events = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(events), 200


@event_routes.route("/api/events", methods=["POST"])
def create_event():

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    if token_data["role"] != "ADMIN":
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    title = data.get("title")
    description = data.get("description")
    event_date = data.get("event_date")

    if not title or not event_date:
        return jsonify({
            "message": "title and event_date are required"
        }), 400

    admin_id = token_data["user_id"]

    db = get_db_connection()
    cursor = db.cursor()

    try:

        cursor.execute("""
            INSERT INTO events
                (admin_id, title, description, event_date)
            VALUES
                (%s, %s, %s, %s)
        """, (
            admin_id,
            title,
            description,
            event_date
        ))

        event_id = cursor.lastrowid

        db.commit()

        return jsonify({
            "message": "Event created successfully",
            "event_id": event_id
        }), 201

    except Exception:

        db.rollback()

        return jsonify({
            "message": "Failed to create event"
        }), 500

    finally:

        cursor.close()
        db.close()


@event_routes.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    if token_data["role"] != "ADMIN":
        return jsonify({
            "message": "Admin access required"
        }), 403

    db = get_db_connection()
    cursor = db.cursor()

    try:

        cursor.execute("""
            DELETE FROM events
            WHERE id = %s
        """, (event_id,))

        if cursor.rowcount == 0:
            return jsonify({
                "message": "Event not found"
            }), 404

        db.commit()

        return jsonify({
            "message": "Event deleted successfully",
            "event_id": event_id
        }), 200

    except Exception:

        db.rollback()

        return jsonify({
            "message": "Failed to delete event"
        }), 500

    finally:

        cursor.close()
        db.close()