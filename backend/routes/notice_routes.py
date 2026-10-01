from flask import Blueprint, jsonify, request

from db import get_db_connection
from auth_utils import token_required, admin_required


notice_routes = Blueprint("notice_routes", __name__)


# GET all notices
@notice_routes.route("/api/notices", methods=["GET"])
@token_required
def get_notices():

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            n.id,
            n.title,
            n.content,
            n.created_at,
            n.admin_id,
            u.name AS created_by
        FROM notices n
        JOIN users u
            ON n.admin_id = u.id
        ORDER BY n.created_at DESC
    """)

    notices = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(notices), 200


# CREATE notice
@notice_routes.route("/api/notices", methods=["POST"])
@admin_required
def create_notice():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    title = data.get("title")
    content = data.get("content")

    if not title or not content:
        return jsonify({
            "message": "Title and content are required"
        }), 400

    admin_id = request.user["user_id"]

    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("""
            INSERT INTO notices
                (admin_id, title, content)
            VALUES
                (%s, %s, %s)
        """, (admin_id, title, content))

        notice_id = cursor.lastrowid

        db.commit()

        return jsonify({
            "message": "Notice created successfully",
            "notice_id": notice_id
        }), 201

    except Exception:
        db.rollback()

        return jsonify({
            "message": "Failed to create notice"
        }), 500

    finally:
        cursor.close()
        db.close()


# UPDATE notice
@notice_routes.route("/api/notices/<int:notice_id>", methods=["PUT"])
@admin_required
def update_notice(notice_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    title = data.get("title")
    content = data.get("content")

    if not title or not content:
        return jsonify({
            "message": "Title and content are required"
        }), 400

    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT id
            FROM notices
            WHERE id = %s
        """, (notice_id,))

        notice = cursor.fetchone()

        if not notice:
            return jsonify({
                "message": "Notice not found"
            }), 404

        cursor.execute("""
            UPDATE notices
            SET
                title = %s,
                content = %s
            WHERE id = %s
        """, (title, content, notice_id))

        db.commit()

        return jsonify({
            "message": "Notice updated successfully",
            "notice_id": notice_id
        }), 200

    except Exception:
        db.rollback()

        return jsonify({
            "message": "Failed to update notice"
        }), 500

    finally:
        cursor.close()
        db.close()


# DELETE notice
@notice_routes.route("/api/notices/<int:notice_id>", methods=["DELETE"])
@admin_required
def delete_notice(notice_id):

    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT id
            FROM notices
            WHERE id = %s
        """, (notice_id,))

        notice = cursor.fetchone()

        if not notice:
            return jsonify({
                "message": "Notice not found"
            }), 404

        cursor.execute("""
            DELETE FROM notices
            WHERE id = %s
        """, (notice_id,))

        db.commit()

        return jsonify({
            "message": "Notice deleted successfully",
            "notice_id": notice_id
        }), 200

    except Exception:
        db.rollback()

        return jsonify({
            "message": "Failed to delete notice"
        }), 500

    finally:
        cursor.close()
        db.close()