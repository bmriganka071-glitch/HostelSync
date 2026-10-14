import os
import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

from flask import Flask
from flask_cors import CORS

from routes.user_routes import user_routes
from routes.auth_routes import auth_routes
from routes.room_routes import room_routes
from routes.admin_routes import admin_routes
from routes.room_swap_routes import room_swap_routes
from routes.mess_rebate_routes import mess_rebate_routes
from routes.mess_bill_routes import mess_bill_routes
from routes.payment_routes import payment_routes
from routes.notice_routes import notice_routes
from routes.event_routes import event_routes

app = Flask(__name__)

# Enable CORS globally for all routes
frontend_origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
CORS(app, resources={r"/api/*": {"origins": frontend_origins}})

app.register_blueprint(user_routes)
app.register_blueprint(auth_routes)
app.register_blueprint(room_routes)
app.register_blueprint(admin_routes)
app.register_blueprint(room_swap_routes)
app.register_blueprint(mess_rebate_routes)
app.register_blueprint(mess_bill_routes)
app.register_blueprint(payment_routes)
app.register_blueprint(notice_routes)
app.register_blueprint(event_routes)


@app.route("/")
def home():
    return "HostelSync Backend is running"


if __name__ == "__main__":   #helps in running the web server   
    app.run(debug=True)