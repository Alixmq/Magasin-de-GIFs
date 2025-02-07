function addgif() {
    const name = document.getElementById("gifName").value;
    const price = parseFloat(document.getElementById("gifPrice").value);
    const stock = parseInt(document.getElementById("gifStock").value);
    const id = parseInt(document.getElementById("gifId").value);

    // Validation des champs
    if (!name || isNaN(price) || isNaN(stock) || isNaN(id) || price <= 0 || stock < 0) {
        alert("Veuillez remplir tous les champs avec des valeurs valides !");
        return;
    }

    fetch('/admin/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name, price, stock })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Gif ajouté avec succès !");
                location.reload(); // Recharge la page pour afficher le nouveau gif
            } else {
                alert("Erreur lors de l'ajout : " + data.message);
            }
        })
        .catch(err => console.error("Erreur réseau :", err));
}


function restockgif(gifId) {
    console.log("tentative de raprovisionnement");
    const quantity = parseInt(document.getElementById(gifId).value);
    const data = new FormData();
    data.append('id', gifId);
    data.append('quantity', quantity);
    fetch('/admin/restock', {
        method: 'POST',
        body: data
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById(gifId).textContent = data.new_stock;
                document.getElementById(gifId).value = '';
                location.reload();
            }
        });
}

function buygif(gifId, quantity) {
    console.log("achat");
    fetch('/buy', {  // Utilisez la route /buy correcte
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: gifId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Achat réussi");
            } else {
                console.error("Erreur lors de l'achat");
            }
        })
        .catch(error => console.error('Erreur:', error));
}

function buyPanier(panier) {
    panier.forEach((quantity, gifId) => {
        buygif(gifId, quantity);
    });
}

function addPanier(gif_id) {
    console.log("ID du GIF :", gif_id);
    // Récupérer le panier actuel depuis sessionStorage
    let panier = JSON.parse(sessionStorage.getItem('panier')) || [];

    // Vérifiez si l'article est déjà dans le panier
    const existingItem = panier.find(item => item.id === gif_id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const gifName = document.querySelector(`#catalog div[data-gif-id="${gif_id}"] h3`).innerText;
        const gifPrice = document.querySelector(`#catalog div[data-gif-id="${gif_id}"] p`).innerText; panier.push({ id: gif_id, name: gifName, price: gifPrice, quantity: 1 });
    }

    // Enregistrez le panier mis à jour dans sessionStorage
    sessionStorage.setItem('panier', JSON.stringify(panier));

    // Afficher le message "Ajouté au panier"
    const message = document.getElementById(`added-${gif_id}`);
    message.style.display = 'inline';
    setTimeout(() => {
        message.style.display = 'none';
    }, 2000);
    buygif(gif_id);

}
function checkStock(gifId) {
    fetch(`/api/stock/${gifId}`)
        .then(response => response.json())
        .then(data => {
            const stockElement = document.getElementById(`stock-${gifId}`);
            if (data.error) {
                console.log(data.error);
                stockElement.innerText = "Stock : non disponible";
            } else if (data.message) {
                stockElement.innerText = `Stock : ${data.message}`;
            } else {
                stockElement.innerText = `Stock : ${data.stock}`;
            }
        })
        .catch(error => console.error('Erreur:', error));
}

function updateAllStocks() {
    const stockElements = document.querySelectorAll('[id^="stock-"]');
    stockElements.forEach(function (element) {
        const elementId = element.id;
        const gifId = elementId.replace('stock-', '');
        checkStock(gifId);
    });
}

setInterval(updateAllStocks, 5000);

updateAllStocks();
// Fichier: scripts.js

let panier = []; // Contient les articles ajoutés au panier

// Ajout d'un gif au panier et stockage dans sessionStorage
function addPanier(gifId) {
    // Récupérer le panier actuel depuis sessionStorage
    let panier = JSON.parse(sessionStorage.getItem('panier')) || [];

    // Vérifiez si l'article est déjà dans le panier
    const existingItem = panier.find(item => item.id === gifId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const gifName = document.querySelector(`#catalog div:nth-child(${gifId}) h2`).innerText;
        const gifPrice = document.querySelector(`#catalog div:nth-child(${gifId}) p:nth-child(2)`).innerText;
        panier.push({ id: gifId, name: gifName, price: gifPrice, quantity: 1 });
    }

    // Enregistrez le panier mis à jour dans sessionStorage
    sessionStorage.setItem('panier', JSON.stringify(panier));

    // Afficher le message "Ajouté au panier"
    const message = document.getElementById(`added-${gifId}`);
    message.style.display = 'inline';
    setTimeout(() => {
        message.style.display = 'none';
    }, 2000); // Masquer le message après 2 secondes
}

// Charger le panier dans la page checkout
function loadPanier() {
    const panier = JSON.parse(sessionStorage.getItem('panier')) || [];
    const panierDiv = document.getElementById('checkoutPanier');

    if (panier.length === 0) {
        panierDiv.innerHTML = '<p>Votre panier est vide.</p>';
    } else {
        panierDiv.innerHTML = `<h3>Votre panier :</h3>`;
        panier.forEach(item => {
            panierDiv.innerHTML += `
                <p>${item.name} - ${item.price} x ${item.quantity}</p>
            `;
        });
    }
}

// Rediriger vers la page de paiement
function redirectToPayment() {
    window.location.href = '/payment';
}

// Vérifie le format de l'email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Vérifie le format du numéro de carte (16 chiffres)
function validateCardNumber(cardNumber) {
    const cardRegex = /^\d{16}$/; // Regex pour 16 chiffres
    return cardRegex.test(cardNumber);
}

// Valide le formulaire avant soumission
function validateForm() {
    const email = document.getElementById('emailCheckout').value;
    const cardNumber = document.getElementById('carteCheckout').value;

    // Vérification de l'email
    if (!validateEmail(email)) {
        alert('Veuillez entrer un email valide.');
        return false;
    }

    // Vérification du numéro de carte
    if (!validateCardNumber(cardNumber)) {
        alert('Veuillez entrer un numéro de carte valide (16 chiffres).');
        return false;
    }

    // Si tout est valide
    alert('Paiement validé !');
    return true;
}

// Afficher une erreur si l'email est invalide en temps réel
function checkEmail() {
    const email = document.getElementById('emailCheckout').value;
    const emailError = document.getElementById('emailError');
    if (!validateEmail(email)) {
        emailError.style.display = 'inline';
    } else {
        emailError.style.display = 'none';
    }
}

// Charger automatiquement le panier si la page de checkout est détectée
if (document.getElementById('checkoutPanier')) {
    loadPanier();
}
