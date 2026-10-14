from flask import Blueprint, jsonify, request
from decimal import Decimal, InvalidOperation

from db import get_db_connection
from auth_utils import token_required, admin_required


mess_bill_routes = Blueprint("mess_bill_routes", __name__)


@mess_bill_routes.route("/api/admin/mess-bills", methods=["GET"])
@admin_required
def get_all_mess_bills():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                mb.id, mb.user_id, u.name AS user_name, u.email,
                mb.bill_month, mb.base_fee, mb.rebate_amount, mb.fine_amount,
                mb.due_date, mb.status, mb.created_at
            FROM mess_bills mb
            JOIN users u ON u.id = mb.user_id
            ORDER BY mb.bill_month DESC, u.name
        """)
        bills = cursor.fetchall()
        for bill in bills:
            bill["base_fee"] = float(bill["base_fee"])
            bill["rebate_amount"] = float(bill["rebate_amount"])
            bill["fine_amount"] = float(bill["fine_amount"])
            bill["total_amount"] = bill["base_fee"] - bill["rebate_amount"] + bill["fine_amount"]
        return jsonify(bills), 200
    finally:
        cursor.close()
        db.close()


# Admin creates a mess bill
@mess_bill_routes.route("/api/admin/mess-bills", methods=["POST"])
@admin_required
def create_mess_bill():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    bill_month = data.get("bill_month")
    base_fee = data.get("base_fee")
    due_date = data.get("due_date")

    if not bill_month or base_fee is None or not due_date:
        return jsonify({
            "message": "bill_month, base_fee and due_date are required"
        }), 400

    try:
        base_fee = Decimal(str(base_fee))
        if not base_fee.is_finite() or base_fee < 0:
            raise InvalidOperation
    except (InvalidOperation, ValueError):
        return jsonify({"message": "base_fee must be a valid non-negative amount"}), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT COUNT(*) AS boarder_count
            FROM users
            WHERE role = 'BOARDER'
        """)
        boarder_count = cursor.fetchone()["boarder_count"]
        if not boarder_count:
            return jsonify({"message": "There are no boarder accounts to bill"}), 400

        cursor.execute("""
            SELECT COUNT(*) AS existing_count
            FROM mess_bills
            WHERE bill_month = %s
        """, (bill_month,))
        if cursor.fetchone()["existing_count"]:
            return jsonify({
                "message": "Bills already exist for this month. No additional bills were created."
            }), 409

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
            SELECT id, %s, %s, 0, 0, %s, 'UNPAID'
            FROM users
            WHERE role = 'BOARDER'
        """, (bill_month, base_fee, due_date))

        created_count = cursor.rowcount
        db.commit()

        return jsonify({
            "message": "Common mess bill created successfully",
            "bill_month": bill_month,
            "base_fee": float(base_fee),
            "rebate_amount": 0,
            "fine_amount": 0,
            "total_amount": float(base_fee),
            "due_date": due_date,
            "status": "UNPAID",
            "boarders_billed": created_count
        }), 201

    except Exception as error:
        db.rollback()

        if getattr(error, "errno", None) == 1062:
            return jsonify({
                "message": "A bill already exists for this boarder and month"
            }), 409

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
