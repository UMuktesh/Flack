import os

from flask import Flask, session, request, redirect, render_template, jsonify
from flask_session import Session
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from datetime import datetime
from decor import login_required
import uuid
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

formatTime = "%I:%M %p"
messages = {"Welcome": [
    {"username": "WelcomeBot", "msg": "Welcome to Flack", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "You cannot send messages in this channel", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "<b>These are the features of Flack: </b>", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "On top left side, You can see your display name which will be visible to others", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "Channels can be created and Channels list accessed from the left sidebar", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "Messages can be seen in this area", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "Messages can be sent using the send box at the bottom of the messages section", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "Messages sent by you can be deleted if necessary by right clicking on the message and selecting delete from the context menu", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "If you accidentally close the Flack tab without logging out your session, your session and the channel on which you were will be still remembered", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "You can log out by selecting Logout on the top right side", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "You can see here if new users have logged in", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "You will be notified of entry and exit of users in your current channel", "time": datetime.now().strftime(formatTime)},
    {"username": "WelcomeBot", "msg": "Happy Chatting....", "time": datetime.now().strftime(formatTime)},
], "Hello": []}
mIndex = {"Welcome": 0, "Hello": 0}
users = [("WelcomeBot", "1")]
deleted = '<i style="color: #888"><i class="fas fa-ban"></i> This message was deleted</i>'

@app.route("/verify", methods=["POST"])
def validator():
    Ndict = request.get_json()
    print(Ndict)
    username = Ndict["username"]
    user = [user[0] for user in users]
    if username in user:
        print(username, user)
        return jsonify({"ok": False})
    return json.dumps({'ok':True}), 200, {'ContentType':'application/json'}

@app.route("/username", methods=["GET", "POST"])
def username():
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
        if "username" in session.keys() and session["username"] not in [user[0] for user in users]:
            session.clear()
            return render_template("login.html", logout=0)
        elif "username" in session.keys() and session["username"] in [user[0] for user in users]:
            return redirect("/")
        return render_template("login.html", logout=1)   

@app.route("/logout")
@login_required
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
    emit('connection', [session["user_id"], messages, session["username"]])
    emit('new user', session["username"], broadcast=True)

@socketio.on("msg sent")
def messenger(msg):
    excess = 1
    message = {'msg': msg["message"], "time": msg["time"], "username": session["username"], "user_id": session["user_id"], "index": mIndex[msg["channel"]]}
    if len(messages[msg["channel"]]) == 100:
        messages[msg["channel"]].pop(0)
        excess = 0
    mIndex[msg["channel"]] += 1
    if mIndex[msg["channel"]] == 100:
        mIndex[msg["channel"]] = 0
    messages[msg["channel"]].append(message)
    emit("msg", [message, msg["channel"], excess], broadcast=True)

@socketio.on('new channel')
def channeler(name):
    messages[name] = []
    mIndex[name] = 0
    emit("channel created", name, broadcast=True)

@socketio.on('leaving')
def left(channelName):
    emit('left', [session["username"], channelName], broadcast=True)

@socketio.on('joining')
def join(channelName):
    emit('joined', [session["username"], channelName], broadcast=True)

@socketio.on('delete')
def deleter(params):
    messages[params[0]][params[1]]['msg'] = deleted
    messages[params[0]][params[1]]['deleted'] = 0
    emit('deleted', params, broadcast=True)

if __name__ == '__main__':
    socketio.run(app)