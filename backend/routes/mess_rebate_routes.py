from datetime import date

from flask import Blueprint, jsonify, request

from db import get_db_connection
from auth_utils import token_required, admin_required


mess_rebate_routes = Blueprint(
    "mess_rebate_routes",
    __name__
)


# ---------------------------------------------------------
# Boarder: Apply for mess rebate
# ---------------------------------------------------------

@mess_rebate_routes.route(
    "/api/mess-rebates",
    methods=["POST"]
)
@token_required
def create_rebate():

    if request.user["role"] != "BOARDER":
        return jsonify({
            "message": "Only boarders can apply for mess rebates"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if not start_date or not end_date:
        return jsonify({
            "message": "start_date and end_date are required"
        }), 400

    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)

    except ValueError:
        return jsonify({
            "message": "Dates must be in YYYY-MM-DD format"
        }), 400

    if end < start:
        return jsonify({
            "message": "end_date cannot be before start_date"
        }), 400

    days = (end - start).days + 1

    if days < 3:
        return jsonify({
            "message": "Mess rebate must be for at least 3 consecutive days"
        }), 400

    user_id = request.user["user_id"]

    db = get_db_connection()
    cursor = db.cursor()

    try:

        cursor.execute("""
            INSERT INTO mess_rebates
                (user_id, start_date, end_date, status)
            VALUES
                (%s, %s, %s, 'PENDING')
        """, (
            user_id,
            start,
            end
        ))

        rebate_id = cursor.lastrowid

        db.commit()

        return jsonify({
            "message": "Mess rebate request submitted",
            "rebate_id": rebate_id,
            "status": "PENDING"
        }), 201

    except Exception:
        db.rollback()

        return jsonify({
            "message": "Failed to submit mess rebate"
        }), 500

    finally:
        cursor.close()
        db.close()


# ---------------------------------------------------------
# View rebate requests
# ---------------------------------------------------------

@mess_rebate_routes.route(
    "/api/mess-rebates",
    methods=["GET"]
)
@token_required
def get_rebates():

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        if request.user["role"] == "ADMIN":

            cursor.execute("""
                SELECT
                    mr.id,
                    mr.user_id,
                    u.name,
                    u.email,
                    mr.start_date,
                    mr.end_date,
                    mr.status,
                    mr.approved_by_id,
                    mr.created_at
                FROM mess_rebates mr
                JOIN users u
                    ON mr.user_id = u.id
                ORDER BY mr.created_at DESC
            """)

        else:

            cursor.execute("""
                SELECT
                    mr.id,
                    mr.user_id,
                    mr.start_date,
                    mr.end_date,
                    mr.status,
                    mr.approved_by_id,
                    mr.created_at
                FROM mess_rebates mr
                WHERE mr.user_id = %s
                ORDER BY mr.created_at DESC
            """, (request.user["user_id"],))

        rebates = cursor.fetchall()

        return jsonify(rebates), 200

    finally:
        cursor.close()
        db.close()


# ---------------------------------------------------------
# Admin: Approve / Reject rebate
# ---------------------------------------------------------

@mess_rebate_routes.route(
    "/api/admin/mess-rebates/<int:rebate_id>",
    methods=["PUT"]
)
@admin_required
def admin_update_rebate(rebate_id):

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

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                user_id,
                start_date,
                end_date,
                status
            FROM mess_rebates
            WHERE id = %s
            FOR UPDATE
        """, (rebate_id,))

        rebate = cursor.fetchone()

        if not rebate:
            return jsonify({
                "message": "Mess rebate request not found"
            }), 404

        if rebate["status"] != "PENDING":
            return jsonify({
                "message": "This rebate request has already been processed"
            }), 400

        if approved:

            cursor.execute("""
                UPDATE mess_rebates
                SET
                    status = 'APPROVED',
                    approved_by_id = %s
                WHERE id = %s
            """, (
                request.user["user_id"],
                rebate_id
            ))

            status = "APPROVED"

        else:

            cursor.execute("""
                UPDATE mess_rebates
                SET
                    status = 'REJECTED'
                WHERE id = %s
            """, (rebate_id,))

            status = "REJECTED"

        db.commit()

        return jsonify({
            "message": "Mess rebate processed successfully",
            "rebate_id": rebate_id,
            "status": status
        }), 200

    except Exception:
        db.rollback()

        return jsonify({
            "message": "Failed to process mess rebate"
        }), 500

    finally:
        cursor.close()
        db.close()