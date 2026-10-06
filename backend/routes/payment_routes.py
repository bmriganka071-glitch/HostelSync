from flask import Blueprint, jsonify, request
from decimal import Decimal

from db import get_db_connection
from auth_utils import verify_token


payment_routes = Blueprint("payment_routes", __name__)


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


# ---------------------------------------------------------
# Submit payment
# ---------------------------------------------------------

@payment_routes.route("/api/payments", methods=["POST"])
def submit_payment():

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    if token_data["role"] != "BOARDER":
        return jsonify({
            "message": "Only boarders can submit payments"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    bill_id = data.get("bill_id")
    payment_reference = data.get("payment_reference")

    if not bill_id:
        return jsonify({
            "message": "bill_id is required"
        }), 400

    if not payment_reference:
        return jsonify({
            "message": "payment_reference is required"
        }), 400

    payment_reference = payment_reference.strip()

    if not payment_reference:
        return jsonify({
            "message": "payment_reference cannot be empty"
        }), 400

    user_id = token_data["user_id"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        # Get the bill belonging to the logged-in boarder
        cursor.execute("""
            SELECT
                id,
                user_id,
                base_fee,
                rebate_amount,
                fine_amount,
                status
            FROM mess_bills
            WHERE id = %s
        """, (bill_id,))

        bill = cursor.fetchone()

        if not bill:
            return jsonify({
                "message": "Bill not found"
            }), 404

        if bill["user_id"] != user_id:
            return jsonify({
                "message": "You can only pay your own bill"
            }), 403

        if bill["status"] == "PAID":
            return jsonify({
                "message": "This bill is already paid"
            }), 400

        # Calculate the actual bill amount on the server
        total_amount = (
            bill["base_fee"]
            - bill["rebate_amount"]
            + bill["fine_amount"]
        )

        # Check whether this transaction reference was already used
        cursor.execute("""
            SELECT id, status
            FROM payments
            WHERE payment_reference = %s
        """, (payment_reference,))

        existing_payment = cursor.fetchone()

        if existing_payment:
            return jsonify({
                "message": "This payment reference has already been submitted",
                "payment_id": existing_payment["id"],
                "status": existing_payment["status"]
            }), 400

        # Prevent another active payment for the same bill
        cursor.execute("""
            SELECT id, status
            FROM payments
            WHERE bill_id = %s
              AND status IN ('PENDING', 'VERIFIED')
        """, (bill_id,))

        existing_bill_payment = cursor.fetchone()

        if existing_bill_payment:
            return jsonify({
                "message": "A payment has already been submitted for this bill",
                "payment_id": existing_bill_payment["id"],
                "status": existing_bill_payment["status"]
            }), 400

        cursor.execute("""
            INSERT INTO payments
                (
                    payment_reference,
                    user_id,
                    bill_id,
                    amount
                )
            VALUES
                (%s, %s, %s, %s)
        """, (
            payment_reference,
            user_id,
            bill_id,
            total_amount
        ))

        payment_id = cursor.lastrowid

        db.commit()

        return jsonify({
            "message": "Payment submitted successfully",
            "payment_id": payment_id,
            "bill_id": bill_id,
            "amount": float(total_amount),
            "status": "PENDING"
        }), 201

    except Exception:

        db.rollback()

        return jsonify({
            "message": "Failed to submit payment"
        }), 500

    finally:

        cursor.close()
        db.close()


# ---------------------------------------------------------
# Boarder: View own payments
# ---------------------------------------------------------

@payment_routes.route("/api/payments", methods=["GET"])
def get_payments():

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    user_id = token_data["user_id"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                p.id,
                p.payment_reference,
                p.bill_id,
                p.amount,
                p.submitted_at,
                p.status,
                p.verified_at
            FROM payments p
            WHERE p.user_id = %s
            ORDER BY p.submitted_at DESC
        """, (user_id,))

        payments = cursor.fetchall()

        return jsonify(payments), 200

    finally:

        cursor.close()
        db.close()


# ---------------------------------------------------------
# Admin: View all payments
# ---------------------------------------------------------

@payment_routes.route("/api/admin/payments", methods=["GET"])
def get_all_payments():

    token_data, error_response, error_status = get_token_data()

    if error_response:
        return error_response, error_status

    if token_data["role"] != "ADMIN":
        return jsonify({
            "message": "Admin access required"
        }), 403

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                p.id,
                p.payment_reference,
                p.user_id,
                u.name AS user_name,
                u.email,
                p.bill_id,
                p.amount,
                p.submitted_at,
                p.status,
                p.verified_at,
                p.verified_by_id
            FROM payments p
            JOIN users u
                ON p.user_id = u.id
            ORDER BY p.submitted_at DESC
        """)

        payments = cursor.fetchall()

        return jsonify(payments), 200

    finally:

        cursor.close()
        db.close()


# ---------------------------------------------------------
# Admin: Verify or flag payment
# ---------------------------------------------------------

@payment_routes.route(
    "/api/admin/payments/<int:payment_id>",
    methods=["PUT"]
)
def verify_payment(payment_id):

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

    verified = data.get("verified")

    if verified is not True and verified is not False:
        return jsonify({
            "message": "verified must be true or false"
        }), 400

    admin_id = token_data["user_id"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                p.id,
                p.bill_id,
                p.amount,
                p.status,
                b.base_fee,
                b.rebate_amount,
                b.fine_amount,
                b.status AS bill_status
            FROM payments p
            JOIN mess_bills b
                ON p.bill_id = b.id
            WHERE p.id = %s
            FOR UPDATE
        """, (payment_id,))

        payment = cursor.fetchone()

        if not payment:
            return jsonify({
                "message": "Payment not found"
            }), 404

        if payment["status"] != "PENDING":
            return jsonify({
                "message": "This payment has already been processed"
            }), 400

        if verified:

            expected_amount = (
                payment["base_fee"]
                - payment["rebate_amount"]
                + payment["fine_amount"]
            )

            if payment["amount"] != expected_amount:
                return jsonify({
                    "message": "Payment amount does not match bill amount"
                }), 400

            cursor.execute("""
                UPDATE payments
                SET
                    status = 'VERIFIED',
                    verified_at = CURRENT_TIMESTAMP,
                    verified_by_id = %s
                WHERE id = %s
            """, (admin_id, payment_id))

            cursor.execute("""
                UPDATE mess_bills
                SET status = 'PAID'
                WHERE id = %s
            """, (payment["bill_id"],))

            db.commit()

            return jsonify({
                "message": "Payment verified successfully",
                "payment_id": payment_id,
                "status": "VERIFIED",
                "bill_status": "PAID"
            }), 200

        else:

            cursor.execute("""
                UPDATE payments
                SET
                    status = 'FLAGGED',
                    verified_at = CURRENT_TIMESTAMP,
                    verified_by_id = %s
                WHERE id = %s
            """, (admin_id, payment_id))

            db.commit()

            return jsonify({
                "message": "Payment flagged",
                "payment_id": payment_id,
                "status": "FLAGGED"
            }), 200

    except Exception:

        db.rollback()

        return jsonify({
            "message": "Failed to process payment"
        }), 500

    finally:

        cursor.close()
        db.close()