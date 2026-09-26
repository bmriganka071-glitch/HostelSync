from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "HostelSync Backend is running"


if __name__ == "__main__":   #helps in running the web server   
    app.run(debug=True)