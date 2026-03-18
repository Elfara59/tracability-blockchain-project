let isFetching = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Demande immédiate de connexion Web3 sur la page vendeur
    await initWeb3(true);
    loadMyListings();
});

// Listener "walletChanged" (déclenché par shared.js)
window.addEventListener('walletChanged', () => {
    // Si l'utilisateur change de compte, on recharge ses données
    updatePendingWithdrawals();
    fetchSellerOrders();
    loadMyListings();
});

// ==== CRÉATION D'UNE ANNONCE (MOCK DB) ====
document.getElementById('createListingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!userAccount) return showToast('Veuillez connecter votre portefeuille (MetaMask)', 'error');

    const title = document.getElementById('itemTitle').value;
    const photo = document.getElementById('itemPhoto').value;
    const priceEth = document.getElementById('itemPrice').value;
    const carrier = document.getElementById('itemCarrier').value;
    const penaltyEth = document.getElementById('itemPenalty').value;

    const item = {
        seller: userAccount,
        carrier: carrier,
        price: priceEth,
        penalty: penaltyEth,
        title: title,
        photo: photo
    };

    saveMarketplaceItem(item);
    showToast('Votre article est en ligne !', 'success');
    e.target.reset(); // Vider le formulaire
    loadMyListings();
});

// ==== CHARGEMENT DES VENTES SUR LA BLOCKCHAIN ====
async function fetchSellerOrders() {
    if (!contract || !userAccount || isFetching) return;
    isFetching = true;
    const list = document.getElementById('ordersList');
    list.innerHTML = `<p style="color: #999; text-align: center; padding: 2rem;">Vérification de la blockchain...</p>`;
    let count = 0;

    try {
        const orderCountStr = await contract.methods.orderCount().call();
        const maxOrder = parseInt(BigInt(orderCountStr).toString());

        list.innerHTML = ""; // Clean loading text

        // On boucle sur toutes les commandes pour trouver celles de ce vendeur
        // (Attention : en prod, sur une grosse blockchain, on utiliserait un TheGraph ou une Base de données Eventulaire)
        for (let i = 1; i <= maxOrder; i++) {
            const order = await contract.methods.orders(i).call();

            // Si le vendeur de la commande correspond au compte actif
            if (order.seller.toLowerCase() === userAccount.toLowerCase()) {
                count++;
                createOrderCard(i, order, list);
            }
        }

        if (count === 0) {
            list.innerHTML = `<p style="color: #999; text-align: center; padding: 2rem; background: #f9f9f9; border-radius: 4px;">Aucune vente enregistrée sur la Blockchain pour le compte ${userAccount.substring(0, 6)}...</p>`;
        }

    } catch (err) {
        console.error(err);
        showToast("Erreur lors de la lecture des contrats", "error");
    } finally {
        document.getElementById('salesCount').innerText = count;
        isFetching = false;
    }
}

function createOrderCard(id, order, container) {
    const card = document.createElement('div');
    card.style.cssText = "border: 1px solid var(--border); padding: 1.5rem; border-radius: 4px; background: #fafafa; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;";

    const stateInt = Number(order.state);
    const dateLimit = new Date(Number(order.deadline) * 1000).toLocaleString();
    const price = web3.utils.fromWei(order.price, 'ether');

    let actionBtn = "";
    if (stateInt === 0) { // Created => Le vendeur doit envoyer
        actionBtn = `<button class="btn primary" onclick="shipOrder(${id}, this)">📦 Envoyer le colis</button>`;
    } else if (stateInt === 1) { // Shipped => Transporteur
        actionBtn = `<span style="color: var(--warning); font-size: 0.9rem;">En cours de transit...</span>`;
    } else if (stateInt === 2) { // Delivered => Acheteur
        actionBtn = `<span style="color: var(--primary); font-size: 0.9rem;">Livré, validation acheteur en attente</span>`;
    } else { // Completed
        actionBtn = `<span style="color: #2e7d32; font-weight: 600;">✔️ Terminée</span>`;
    }

    card.innerHTML = `
        <div style="flex: 1; min-width: 250px;">
            <div style="display:flex; align-items:center; gap: 1rem; margin-bottom:0.5rem;">
                <h3 style="margin:0; font-size: 1.1rem;">Commande #${id}</h3>
                <span class="badge ${STATE_CLASSES[stateInt]}">${STATE_LABELS[stateInt]}</span>
            </div>
            <p style="margin:0; font-size: 0.85rem; color: #666;">
                <strong>Acheteur:</strong> ${order.buyer.substring(0, 6)}...<br>
                <strong>Date limite:</strong> ${dateLimit}<br>
                <strong>Montant:</strong> ${price} ETH
            </p>
        </div>
        <div>
            ${actionBtn}
        </div>
    `;
    container.appendChild(card);
}

// ==== APPELS DE CONTRATS ====
window.shipOrder = async (orderId, btnElement) => {
    try {
        btnElement.disabled = true;
        btnElement.innerText = "Signature... 🦊";
        await contract.methods.shipOrder(orderId).send({ from: userAccount });
        showToast("Colis noté comme envoyé sur la blockchain !", "success");
        fetchSellerOrders(); // Rafraichir
    } catch (error) {
        showToast("Erreur ou transaction refusée", "error");
        btnElement.disabled = false;
        btnElement.innerText = "📦 Envoyer le colis";
    }
};

// ==== WITHDRAW (PORTE-MONNAIE) ====
async function updatePendingWithdrawals() {
    if (!contract || !userAccount) return;
    try {
        const balanceWei = await contract.methods.pendingWithdrawals(userAccount).call();
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        document.getElementById('displayPendingWithdrawal').innerText = parseFloat(balanceEth).toFixed(4);

        document.getElementById('btnWithdraw').disabled = balanceEth === "0";
    } catch (error) {
        console.error("Erreur balance", error);
    }
}

document.getElementById('btnWithdraw').addEventListener('click', async (e) => {
    const btn = e.target;
    try {
        btn.disabled = true;
        btn.innerText = "Retrait en cours...";
        await contract.methods.withdraw().send({ from: userAccount });
        showToast('Fonds transférés avec succès !', 'success');
        updatePendingWithdrawals();
    } catch (error) {
        showToast("Erreur ou annulation.", 'error');
    } finally {
        btn.innerText = "Transférer vers mon compte";
        updatePendingWithdrawals();
    }
});

// ==== GESTION DES ANNONCES VITRINE ====
function loadMyListings() {
    const container = document.getElementById('myListingsContainer');
    if (!container || !userAccount) return;

    container.innerHTML = "";
    const items = getMarketplaceItems().filter(i => i.seller.toLowerCase() === userAccount.toLowerCase());

    if (items.length === 0) {
        container.innerHTML = `<p style="color: #999; font-size:0.85rem; text-align:center; padding: 1rem 0;">Vous n'avez aucun article en ligne.</p>`;
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.style.cssText = "display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border); padding:0.8rem; border-radius:4px; background:white;";
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:1rem;">
                <div style="width:40px; height:40px; background:url('${item.photo || 'https://via.placeholder.com/40'}') center/cover; border-radius:4px;"></div>
                <div>
                    <strong style="color:var(--text-main); font-size:0.9rem;">${item.title}</strong><br>
                    <span style="font-size:0.8rem; color:var(--primary); font-weight:600;">${item.price} ETH</span>
                </div>
            </div>
            <button class="btn secondary" style="padding:0.4rem 0.8rem; color:var(--error); border-color:var(--error); font-size:0.8rem;" onclick="deleteListing('${item.id}')">Retirer</button>
        `;
        container.appendChild(div);
    });
}

window.deleteListing = (id) => {
    if (confirm("Voulez-vous vraiment retirer cet article du catalogue Acheteur (Il ne sera plus achetable) ?")) {
        removeMarketplaceItem(id);
        loadMyListings();
        showToast("Article retiré de la vitrine.", "success");
    }
}
