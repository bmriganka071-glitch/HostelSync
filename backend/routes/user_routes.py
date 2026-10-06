from flask import Blueprint, jsonify

from db import get_db_connection


user_routes = Blueprint("user_routes", __name__)


@user_routes.route("/api/users", methods=["GET"])
def get_users():

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, name, email, role, room_id
        FROM users
    """)

    users = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(users)