from flask import Blueprint, jsonify, request
import mysql.connector

from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

room_swap_routes = Blueprint("room_swap_routes", __name__)

db = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)


from flask import Blueprint, jsonify, request

room_swap_routes = Blueprint("room_swap_routes", __name__)


@room_swap_routes.route("/api/room-swaps", methods=["POST"])
def create_swap_request():

    data = request.get_json()

    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")

    if not sender_id or not receiver_id:
        return jsonify({"message": "sender_id and receiver_id are required"}), 400

    if sender_id == receiver_id:
        return jsonify({"message": "Cannot request a swap with yourself"}), 400

    return jsonify({
        "message": "Room swap request created",
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "status": "PENDING_B"
    }), 201
    
    
@room_swap_routes.route("/api/room-swaps/<int:swap_id>/respond", methods=["PUT"])
def respond_to_swap(swap_id):

    data = request.get_json()
    accepted = data.get("accepted")

    if accepted is True:
        status = "PENDING_ADM"
    elif accepted is False:
        status = "REJECTED"
    else:
        return jsonify({"message": "accepted must be true or false"}), 400

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE room_swap_requests
        SET status = %s
        WHERE id = %s AND status = 'PENDING_B'
        """,
        (status, swap_id)
    )

    db.commit()
    cursor.close()

    return jsonify({
        "message": "Room swap response recorded",
        "swap_id": swap_id,
        "status": status
    })