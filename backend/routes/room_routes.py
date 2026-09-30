from flask import Blueprint, jsonify

from db import get_db_connection


room_routes = Blueprint("room_routes", __name__)


# Get all rooms
@room_routes.route("/api/rooms", methods=["GET"])
def get_rooms():

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            r.id,
            r.room_number,
            b.block_name AS block,
            rt.capacity,
            COUNT(u.id) AS occupants
        FROM rooms r
        JOIN blocks b
            ON r.block_id = b.id
        JOIN room_types rt
            ON r.room_type_id = rt.id
        LEFT JOIN users u
            ON u.room_id = r.id
        GROUP BY
            r.id,
            r.room_number,
            b.block_name,
            rt.capacity
        ORDER BY
            b.block_name,
            r.room_number
    """)

    rooms = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(rooms)


# Get one room with its occupants
@room_routes.route("/api/rooms/<int:room_id>", methods=["GET"])
def get_room(room_id):

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Get room information
    cursor.execute("""
        SELECT
            r.id,
            r.room_number,
            b.block_name AS block,
            rt.capacity
        FROM rooms r
        JOIN blocks b
            ON r.block_id = b.id
        JOIN room_types rt
            ON r.room_type_id = rt.id
        WHERE r.id = %s
    """, (room_id,))

    room = cursor.fetchone()

    if not room:
        cursor.close()
        db.close()

        return jsonify({
            "message": "Room not found"
        }), 404

    # Get users assigned to this room
    cursor.execute("""
        SELECT
            id,
            name,
            email,
            role
        FROM users
        WHERE room_id = %s
    """, (room_id,))

    occupants = cursor.fetchall()

    cursor.close()
    db.close()

    room["occupants"] = occupants
    room["occupant_count"] = len(occupants)

    return jsonify(room)