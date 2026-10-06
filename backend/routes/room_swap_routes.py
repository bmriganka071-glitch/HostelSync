from flask import Blueprint, jsonify, request

from db import get_db_connection
from auth_utils import verify_token


room_swap_routes = Blueprint("room_swap_routes", __name__)


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


# Create a room swap request
@room_swap_routes.route("/api/room-swaps", methods=["POST"])
def create_swap_request():

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    if token_data["role"] != "BOARDER":
        return jsonify({
            "message": "Only boarders can request room swaps"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    sender_id = token_data["user_id"]
    receiver_id = data.get("receiver_id")

    if not receiver_id:
        return jsonify({
            "message": "receiver_id is required"
        }), 400

    if sender_id == receiver_id:
        return jsonify({
            "message": "Cannot request a swap with yourself"
        }), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        # Get sender
        cursor.execute("""
            SELECT id, name, role, room_id
            FROM users
            WHERE id = %s
        """, (sender_id,))

        sender = cursor.fetchone()

        if not sender:
            return jsonify({
                "message": "Sender not found"
            }), 404

        if not sender["room_id"]:
            return jsonify({
                "message": "You must have a room before requesting a swap"
            }), 400

        # Get receiver
        cursor.execute("""
            SELECT id, name, role, room_id
            FROM users
            WHERE id = %s
        """, (receiver_id,))

        receiver = cursor.fetchone()

        if not receiver:
            return jsonify({
                "message": "Receiver not found"
            }), 404

        if receiver["role"] != "BOARDER":
            return jsonify({
                "message": "Receiver must be a boarder"
            }), 400

        if not receiver["room_id"]:
            return jsonify({
                "message": "Receiver must have a room"
            }), 400

        if sender["room_id"] == receiver["room_id"]:
            return jsonify({
                "message": "Both boarders are already in the same room"
            }), 400

        # Check for an existing active request
        cursor.execute("""
            SELECT id, status
            FROM room_swap_requests
            WHERE
                (
                    (sender_id = %s AND receiver_id = %s)
                    OR
                    (sender_id = %s AND receiver_id = %s)
                )
                AND status IN ('PENDING_B', 'PENDING_ADM')
        """, (
            sender_id,
            receiver_id,
            receiver_id,
            sender_id
        ))

        existing_request = cursor.fetchone()

        if existing_request:
            return jsonify({
                "message": "An active swap request already exists",
                "swap_id": existing_request["id"],
                "status": existing_request["status"]
            }), 400

        # Create swap request
        cursor.execute("""
            INSERT INTO room_swap_requests
                (sender_id, receiver_id, status)
            VALUES
                (%s, %s, 'PENDING_B')
        """, (sender_id, receiver_id))

        swap_id = cursor.lastrowid

        db.commit()

        return jsonify({
            "message": "Room swap request created",
            "swap_id": swap_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "status": "PENDING_B"
        }), 201

    except Exception:

        db.rollback()

        return jsonify({
            "message": "Failed to create room swap request"
        }), 500

    finally:

        cursor.close()
        db.close()


# Boarder B responds to a swap request
@room_swap_routes.route(
    "/api/room-swaps/<int:swap_id>/respond",
    methods=["PUT"]
)
def respond_to_swap(swap_id):

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    if token_data["role"] != "BOARDER":
        return jsonify({
            "message": "Only boarders can respond to swap requests"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    accepted = data.get("accepted")

    if accepted is not True and accepted is not False:
        return jsonify({
            "message": "accepted must be true or false"
        }), 400

    receiver_id = token_data["user_id"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        # Get the swap request
        cursor.execute("""
            SELECT
                id,
                sender_id,
                receiver_id,
                status
            FROM room_swap_requests
            WHERE id = %s
        """, (swap_id,))

        swap = cursor.fetchone()

        if not swap:
            return jsonify({
                "message": "Room swap request not found"
            }), 404

        # Only the receiver can respond
        if swap["receiver_id"] != receiver_id:
            return jsonify({
                "message": "You are not the receiver of this swap request"
            }), 403

        # Request must still be waiting for receiver
        if swap["status"] != "PENDING_B":
            return jsonify({
                "message": "This swap request cannot be responded to"
            }), 400

        if accepted:
            status = "PENDING_ADM"
        else:
            status = "REJECTED"

        cursor.execute("""
            UPDATE room_swap_requests
            SET status = %s
            WHERE id = %s
        """, (status, swap_id))

        db.commit()

        return jsonify({
            "message": "Room swap response recorded",
            "swap_id": swap_id,
            "status": status
        }), 200

    except Exception:

        db.rollback()

        return jsonify({
            "message": "Failed to respond to room swap request"
        }), 500

    finally:

        cursor.close()
        db.close()


# Admin approves or rejects a swap request
@room_swap_routes.route(
    "/api/admin/room-swaps/<int:swap_id>",
    methods=["PUT"]
)
def admin_respond_to_swap(swap_id):

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

    approved = data.get("approved")

    if approved is not True and approved is not False:
        return jsonify({
            "message": "approved must be true or false"
        }), 400

    admin_id = token_data["user_id"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        # Get swap request
        cursor.execute("""
            SELECT
                id,
                sender_id,
                receiver_id,
                status
            FROM room_swap_requests
            WHERE id = %s
            FOR UPDATE
        """, (swap_id,))

        swap = cursor.fetchone()

        if not swap:
            return jsonify({
                "message": "Room swap request not found"
            }), 404

        # Admin can act only after receiver accepts
        if swap["status"] != "PENDING_ADM":
            return jsonify({
                "message": "Swap request is not waiting for admin approval"
            }), 400

        # Admin rejects the request
        if not approved:

            cursor.execute("""
                UPDATE room_swap_requests
                SET
                    status = 'REJECTED',
                    admin_id = %s
                WHERE id = %s
            """, (admin_id, swap_id))

            db.commit()

            return jsonify({
                "message": "Room swap rejected",
                "swap_id": swap_id,
                "status": "REJECTED"
            }), 200

        # Get sender and receiver rooms
        cursor.execute("""
            SELECT id, room_id
            FROM users
            WHERE id IN (%s, %s)
            FOR UPDATE
        """, (swap["sender_id"], swap["receiver_id"]))

        users = cursor.fetchall()

        if len(users) != 2:
            db.rollback()

            return jsonify({
                "message": "Both users must exist"
            }), 400

        user_rooms = {
            user["id"]: user["room_id"]
            for user in users
        }

        sender_room = user_rooms.get(swap["sender_id"])
        receiver_room = user_rooms.get(swap["receiver_id"])

        if not sender_room or not receiver_room:
            db.rollback()

            return jsonify({
                "message": "Both users must have rooms"
            }), 400

        if sender_room == receiver_room:
            db.rollback()

            return jsonify({
                "message": "Both users are already in the same room"
            }), 400

        # Swap the rooms
        cursor.execute("""
            UPDATE users
            SET room_id = %s
            WHERE id = %s
        """, (
            receiver_room,
            swap["sender_id"]
        ))

        cursor.execute("""
            UPDATE users
            SET room_id = %s
            WHERE id = %s
        """, (
            sender_room,
            swap["receiver_id"]
        ))

        # Mark request as approved
        cursor.execute("""
            UPDATE room_swap_requests
            SET
                status = 'APPROVED',
                admin_id = %s
            WHERE id = %s
        """, (admin_id, swap_id))

        db.commit()

        return jsonify({
            "message": "Room swap approved successfully",
            "swap_id": swap_id,
            "status": "APPROVED"
        }), 200

    except Exception:

        db.rollback()

        return jsonify({
            "message": "Failed to process room swap"
        }), 500

    finally:

        cursor.close()
        db.close()