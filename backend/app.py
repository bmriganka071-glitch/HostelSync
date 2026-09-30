import mysql.connector
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

from routes.user_routes import user_routes
from routes.auth_routes import auth_routes
from routes.room_routes import room_routes
from routes.admin_routes import admin_routes
from routes.room_swap_routes import room_swap_routes

from flask import Flask

app = Flask(__name__)
app.register_blueprint(user_routes)
app.register_blueprint(auth_routes)
app.register_blueprint(room_routes)
app.register_blueprint(admin_routes)
app.register_blueprint(room_swap_routes)





@app.route("/")
def home():
    return "HostelSync Backend is running"


if __name__ == "__main__":   #helps in running the web server   
    app.run(debug=True)
    
