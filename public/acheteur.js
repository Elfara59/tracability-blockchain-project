let isFetching = false;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Charger la liste des annonces (MOCK DB)
    loadMarketplace();
    // 2. Initialiser Web3
    await initWeb3(true);
});

window.addEventListener('walletChanged', () => {
    fetchBuyerOrders();
});

// ==== AFFICHAGE CATALOGUE ====
function loadMarketplace() {
    const items = getMarketplaceItems();
    const grid = document.getElementById('marketplaceGrid');
    grid.innerHTML = "";

    if (items.length === 0) {
        grid.innerHTML = `<p style="color: #999; grid-column: 1/-1;">Aucun article en vente pour l'instant. (Allez sur l'espace Vendeur pour en ajouter un !)</p>`;
        return;
    }

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-image" style="background-image: url('${item.photo || 'https://via.placeholder.com/300'}')"></div>
            <div class="item-price">${item.price} ETH</div>
            <div class="item-info" style="color: #111; font-weight: 500; margin-bottom: 0.2rem;">${item.title}</div>
            <div class="item-info" style="font-size: 0.75rem;">Pénalité: ${item.penalty} ETH/h</div>
            <button class="btn secondary" style="width:100%; margin-top:0.8rem; font-size: 0.85rem;" onclick='openBuyModal(${JSON.stringify(item)})'>Sélectionner</button>
        `;
        grid.appendChild(card);
    });
}

// ==== GESTION ACHAT (MODAL) ====
window.openBuyModal = (item) => {
    document.getElementById('buyModal').style.display = 'flex';
    document.getElementById('modalTitle').innerText = item.title;
    document.getElementById('modalPrice').innerText = `${item.price} ETH`;

    // Hidden fields
    document.getElementById('modalSeller').value = item.seller;
    document.getElementById('modalCarrier').value = item.carrier;
    document.getElementById('modalPenalty').value = item.penalty;
    document.getElementById('modalPriceVal').value = item.price;

    setDeadlineDays(7); // default 7 days
};

window.setDeadlineDays = (days) => {
    // Current time + x days in seconds
    const targetTimestamp = Math.floor(Date.now() / 1000) + (days * 24 * 3600);
    document.getElementById('modalDeadline').value = targetTimestamp;
};

// Formulaire d'achat
document.getElementById('confirmBuyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contract || !userAccount) return showToast('Connectez votre wallet', 'error');

    const btn = document.getElementById('btnPlaceOrder');

    const seller = document.getElementById('modalSeller').value;
    const carrier = document.getElementById('modalCarrier').value;
    const deadline = document.getElementById('modalDeadline').value;

    try {
        const priceWei = web3.utils.toWei(document.getElementById('modalPriceVal').value.toString(), 'ether');
        const penaltyWei = web3.utils.toWei(document.getElementById('modalPenalty').value.toString(), 'ether');

        btn.disabled = true;
        btn.innerText = "Signature Ethereum...";

        await contract.methods.createOrder(seller, carrier, deadline, penaltyWei).send({
            from: userAccount,
            value: priceWei // Verrouille l'argent !
        });

        alert("Achat réussi ! Les fonds sont sécurisés.");
        showToast("Achat réussi ! Les fonds sont sécurisés.", "success");
        document.getElementById('buyModal').style.display = 'none';

        fetchBuyerOrders(); // Actualise
    } catch (error) {
        alert("Erreur de transaction : " + error.message);
        showToast("Transaction annulée ou en erreur", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = "Acheter & Séquestrer les fonds";
    }
});


// ==== CHARGEMENT DES ACHATS DU BUYER ====
async function fetchBuyerOrders() {
    if (!contract || !userAccount || isFetching) return;
    isFetching = true;

    const list = document.getElementById('buyerOrdersList');
    list.innerHTML = `<p style="color: #999; text-align: center; padding: 2rem;">Vérification de la blockchain...</p>`;
    let count = 0;

    try {
        const orderCountStr = await contract.methods.orderCount().call();
        const maxOrder = parseInt(BigInt(orderCountStr).toString());
        list.innerHTML = "";

        for (let i = 1; i <= maxOrder; i++) {
            const order = await contract.methods.orders(i).call();

            // Filtre : uniquement mes achats
            if (order.buyer.toLowerCase() === userAccount.toLowerCase()) {
                count++;
                createOrderCard(i, order, list);
            }
        }

        if (count === 0) {
            list.innerHTML = `<p style="color: #999; text-align: center; padding: 2rem; background: #f9f9f9; border-radius: 4px;">Vous n'avez aucun achat en cours sur la blockchain.</p>`;
        }
    } catch (err) {
        console.error(err);
        showToast("Erreur lecture contrats", "error");
    } finally {
        document.getElementById('ordersCount').innerText = count;
        isFetching = false;
    }
}

function createOrderCard(id, order, container) {
    const card = document.createElement('div');
    card.style.cssText = "border: 1px solid var(--border); padding: 1.5rem; border-radius: 4px; background: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;";

    const stateInt = Number(order.state);
    const dateLimit = new Date(Number(order.deadline) * 1000).toLocaleString();
    const price = web3.utils.fromWei(order.price, 'ether');

    let actionBtn = "";
    if (stateInt === 0) { // Created
        actionBtn = `<span style="color: #666; font-size: 0.9rem;">En attente d'expédition par le vendeur...</span>`;
    } else if (stateInt === 1) { // Shipped
        actionBtn = `<span style="color: var(--primary); font-size: 0.9rem;">En transit (Transporteur)</span>`;
    } else if (stateInt === 2) { // Delivered
        // C'est ICI que l'Acheteur doit agir !
        actionBtn = `<button class="btn primary" onclick="acceptOrder(${id}, this)">Tout est OK, libérer le paiement</button>`;
    } else { // Completed
        actionBtn = `<span style="color: #2e7d32; font-weight: 600;">✔️ Réception validée</span>`;
    }

    card.innerHTML = `
        <div style="flex: 1; min-width: 250px;">
            <div style="display:flex; align-items:center; gap: 1rem; margin-bottom:0.5rem;">
                <h3 style="margin:0; font-size: 1.1rem;">Commande #${id}</h3>
                <span class="badge ${STATE_CLASSES[stateInt]}">${STATE_LABELS[stateInt]}</span>
            </div>
            <p style="margin:0; font-size: 0.85rem; color: #666;">
                <strong>Vendeur:</strong> ${order.seller.substring(0, 6)}...<br>
                <strong>Date limite SLA:</strong> ${dateLimit}<br>
                <strong>Bloqué:</strong> ${price} ETH
            </p>
        </div>
        <div>
            ${actionBtn}
        </div>
    `;
    container.appendChild(card);
}

// ==== APPEL CONTRAT ====
window.acceptOrder = async (orderId, btnElement) => {
    try {
        btnElement.disabled = true;
        btnElement.innerText = "Signature... 🦊";
        await contract.methods.acceptOrder(orderId).send({ from: userAccount });
        showToast("Commande validée ! L'argent est libéré au vendeur.", "success");
        fetchBuyerOrders();
    } catch (error) {
        showToast("Erreur ou refus", "error");
        btnElement.disabled = false;
        btnElement.innerText = "Tout est OK, libérer le paiement";
    }
};
