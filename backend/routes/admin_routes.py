from flask import Blueprint, jsonify, request

from db import get_db_connection


admin_routes = Blueprint("admin_routes", __name__)


# Get all boarders
@admin_routes.route("/api/admin/boarders", methods=["GET"])
def get_boarders():

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.room_id,
            r.room_number,
            b.block_name AS block
        FROM users u
        LEFT JOIN rooms r
            ON u.room_id = r.id
        LEFT JOIN blocks b
            ON r.block_id = b.id
        WHERE u.role = 'BOARDER'
        ORDER BY u.id
    """)

    boarders = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(boarders)


# Allocate a room to a boarder
@admin_routes.route(
    "/api/admin/boarders/<int:boarder_id>/room",
    methods=["PUT"]
)
def allocate_room(boarder_id):

    data = request.get_json()

    room_id = data.get("room_id")

    if not room_id:
        return jsonify({
            "message": "room_id is required"
        }), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Check boarder exists
    cursor.execute("""
        SELECT id, name, role, room_id
        FROM users
        WHERE id = %s
    """, (boarder_id,))

    boarder = cursor.fetchone()

    if not boarder:
        cursor.close()
        db.close()

        return jsonify({
            "message": "Boarder not found"
        }), 404

    if boarder["role"] != "BOARDER":
        cursor.close()
        db.close()

        return jsonify({
            "message": "User is not a boarder"
        }), 400

    # Check room exists and get capacity
    cursor.execute("""
        SELECT
            r.id,
            r.room_number,
            rt.capacity,
            COUNT(u.id) AS occupants
        FROM rooms r
        JOIN room_types rt
            ON r.room_type_id = rt.id
        LEFT JOIN users u
            ON u.room_id = r.id
        WHERE r.id = %s
        GROUP BY
            r.id,
            r.room_number,
            rt.capacity
    """, (room_id,))

    room = cursor.fetchone()

    if not room:
        cursor.close()
        db.close()

        return jsonify({
            "message": "Room not found"
        }), 404

    # If boarder is already in another room,
    # don't count that boarder toward the target room.
    if boarder["room_id"] != room_id and room["occupants"] >= room["capacity"]:
        cursor.close()
        db.close()

        return jsonify({
            "message": "Room is full"
        }), 400

    # Allocate room
    cursor.execute("""
        UPDATE users
        SET room_id = %s
        WHERE id = %s
    """, (room_id, boarder_id))

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "message": "Room allocated successfully",
        "boarder_id": boarder_id,
        "room_id": room_id
    }), 200