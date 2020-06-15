import os

from flask import Flask, session, request, redirect, render_template
from flask_session import Session
from flask_socketio import SocketIO, emit
from decor import login_required
import uuid

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

messages = {"Welcome": []}
users = []

@app.route("/username", methods=["GET", "POST"])
def username():
    session.clear()
    if request.method == "POST":
        username = request.form.get("username")
        if not username:
            return render_template("apology.html", error="must provide username", code=403)
        if username in [user[0] for user in users]:
            return render_template("apology.html", error="username in use", code=403)
        user_id = str(uuid.uuid4())
        users.append((username, user_id))
        session["user_id"] = user_id
        session["username"] = username
        return redirect("/")
    else:
        return render_template("login.html")

@app.route("/logout")
def logout():
    for user in users:
        if user[1] == session["user_id"]:
            users.remove(user)
            break
    return redirect("/username")

@app.route("/")
@login_required
def index():
    return render_template("index.html")

@socketio.on("connected")
def connection():
    emit('connection', [session["user_id"], messages])

@socketio.on("msg sent")
def messenger(msg):
    message = {'msg': msg["message"], "time": msg["time"], "username": session["username"], "user_id": session["user_id"]}
    messages[msg["channel"]].append(message)
    emit("msg", [message, msg["channel"]], broadcast=True)

@socketio.on('new channel')
def channeler(name):
    messages[name] = []
    emit("channel created", name, broadcast=True)

if __name__ == '__main__':
    socketio.run(app)