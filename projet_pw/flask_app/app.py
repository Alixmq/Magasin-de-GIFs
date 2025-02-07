from flask import Flask, session, redirect, url_for, request, render_template, jsonify
import json
import os
import random
import string
from datetime import timedelta

app = Flask(__name__)
app.secret_key = "clef_secrète" 
app.permanent_session_lifetime = timedelta(minutes=30)

DATA_PATH = os.path.join("data", "gifs.json")

def generate_captcha():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def load_catalog():
    with open(DATA_PATH, "r") as file:
        return json.load(file)

def save_catalog(data):
    with open(DATA_PATH, "w") as file:
        json.dump(data, file, indent=4)
@app.route("/")
@app.route("/home")
def home():
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        session['captcha'] = generate_captcha()
        return render_template("login.html", captcha=session['captcha'])
        
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        user_captcha = request.form.get("captcha")

        if not user_captcha or user_captcha != session.get('captcha'):
            session['captcha'] = generate_captcha()
            return "Captcha incorrect!", 401

        users = {
            "Delta": "Ioritz",
            "Risi": "Richard",
            "Leroy": "Tangui",
            "Stagiaire": "Remi",
            "Apasyli": "Alix"
        }

        if username in users and users[username] == password:
            session["user"] = username 
            return redirect(url_for("admin"))
        
        session['captcha'] = generate_captcha()
        return "Identifiants incorrects !", 401

    return render_template("login.html")

@app.route("/catalog")
def catalog():
    gifs = load_catalog()
    return render_template("catalog.html", gifs=gifs)

@app.route("/buy", methods=["POST"])
def buy_gif():
    print("Route /buy atteinte")
    data = load_catalog()
    gif_id = request.json.get("id")
    for gif in data:
        if gif["id"] == gif_id and gif["stock"] > 0:
            gif["stock"] -= 1
            save_catalog(data)
            return jsonify({"success": True})
    return jsonify({"success": False}), 400

@app.route("/admin")
def admin():
    if "user" not in session:
        return redirect(url_for("login"))
    gifs = load_catalog()
    return render_template("admin.html", gifs=gifs)

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

@app.route("/admin/restock", methods=["POST"])
def restock():
    data = load_catalog()
    gif_id = int(request.form.get('id'))
    quantity = int(request.form.get('quantity'))
    for gif in data:
        if gif['id'] == gif_id: 
            gif['stock'] += quantity 
            save_catalog(data)  
            return jsonify({"success": True})  

    return jsonify({"success": False, "message": "Erreur le gif ce model ne peut pas etre reaprovisioné"}), 400  


@app.route("/admin/add", methods=["POST", "OPTION"])
def add_gif():
    if request.method == "OPTIONS":
        return jsonify({"success": True})
    
    print("Route /buy atteinte")
    data = load_catalog()
    gif_id = request.json.get("id")
    print(f"ID reçu : {gif_id}")
    if "user" not in session:
        return redirect(url_for("login"))
    
    data = load_catalog()
    new_gif = request.json
    if any(gif["id"] == new_gif["id"] for gif in data):
        return jsonify({"success": False, "message": "L'ID existe déjà"}), 400
    
    data.append(new_gif)
    save_catalog(data)
    return jsonify({"success": True})


@app.route("/checkout")
def checkout():
    return render_template('checkout.html')


@app.route("/api/stock/<int:gif_id>")
def APIstock(gif_id):
    stock_data = load_catalog()
    for gif in stock_data:
        if gif["id"] == gif_id:
            if gif["stock"] <= 0:
                return jsonify({"message": "GIF en rupture de stock"}), 200
            else:
                return jsonify({"stock": gif["stock"]}), 200
    return jsonify({"error": "GIF non trouvé"}), 404

@app.route('/payment', methods=['GET'])
def payment():
    panier = request.args.get('panier')
    print(f"Panier reçu : {panier}")  
    if panier:
        panier = json.loads(panier)  
    else:
        panier = []

    return render_template('payment.html', panier=panier)


if __name__ == "__main__":
    app.run(host='0.0.0.0')
