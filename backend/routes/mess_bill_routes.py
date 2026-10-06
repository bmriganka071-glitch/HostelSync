from flask import Blueprint, jsonify, request

from db import get_db_connection
from auth_utils import token_required, admin_required


mess_bill_routes = Blueprint("mess_bill_routes", __name__)


# Admin creates a mess bill
@mess_bill_routes.route("/api/admin/mess-bills", methods=["POST"])
@admin_required
def create_mess_bill():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    user_id = data.get("user_id")
    bill_month = data.get("bill_month")
    base_fee = data.get("base_fee")
    rebate_amount = data.get("rebate_amount", 0)
    fine_amount = data.get("fine_amount", 0)
    due_date = data.get("due_date")

    if not user_id or not bill_month or base_fee is None or not due_date:
        return jsonify({
            "message": "user_id, bill_month, base_fee and due_date are required"
        }), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        # Check that user exists and is a boarder
        cursor.execute("""
            SELECT id, name, role
            FROM users
            WHERE id = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "message": "User not found"
            }), 404

        if user["role"] != "BOARDER":
            return jsonify({
                "message": "Mess bill can only be created for a boarder"
            }), 400

        # Create bill
        cursor.execute("""
            INSERT INTO mess_bills
                (
                    user_id,
                    bill_month,
                    base_fee,
                    rebate_amount,
                    fine_amount,
                    due_date,
                    status
                )
            VALUES
                (%s, %s, %s, %s, %s, %s, 'UNPAID')
        """, (
            user_id,
            bill_month,
            base_fee,
            rebate_amount,
            fine_amount,
            due_date
        ))

        bill_id = cursor.lastrowid

        db.commit()

        total_amount = (
            float(base_fee)
            - float(rebate_amount)
            + float(fine_amount)
        )

        return jsonify({
            "message": "Mess bill created successfully",
            "bill_id": bill_id,
            "user_id": user_id,
            "bill_month": bill_month,
            "base_fee": float(base_fee),
            "rebate_amount": float(rebate_amount),
            "fine_amount": float(fine_amount),
            "total_amount": total_amount,
            "due_date": due_date,
            "status": "UNPAID"
        }), 201

    except Exception:
        db.rollback()

        return jsonify({
            "message": "Failed to create mess bill"
        }), 500

    finally:
        cursor.close()
        db.close()


# Boarder views their own bills
@mess_bill_routes.route("/api/mess-bills", methods=["GET"])
@token_required
def get_my_mess_bills():

    if request.user["role"] != "BOARDER":
        return jsonify({
            "message": "Only boarders can view their mess bills"
        }), 403

    user_id = request.user["user_id"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                bill_month,
                base_fee,
                rebate_amount,
                fine_amount,
                due_date,
                status,
                created_at
            FROM mess_bills
            WHERE user_id = %s
            ORDER BY bill_month DESC
        """, (user_id,))

        bills = cursor.fetchall()

        for bill in bills:
            bill["base_fee"] = float(bill["base_fee"])
            bill["rebate_amount"] = float(bill["rebate_amount"])
            bill["fine_amount"] = float(bill["fine_amount"])

            bill["total_amount"] = (
                bill["base_fee"]
                - bill["rebate_amount"]
                + bill["fine_amount"]
            )

        return jsonify(bills), 200

    finally:
        cursor.close()
        db.close()