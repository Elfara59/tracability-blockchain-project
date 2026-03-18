let isFetching = false;

document.addEventListener('DOMContentLoaded', async () => {
    await initWeb3(true);
});

window.addEventListener('walletChanged', () => {
    fetchCarrierOrders();
});

// ==== CHARGEMENT DES COURSES DU TRANSPORTEUR ====
async function fetchCarrierOrders() {
    if (!contract || !userAccount || isFetching) return;
    isFetching = true;

    const list = document.getElementById('carrierOrdersList');
    list.innerHTML = `<p style="color: #999; text-align: center; padding: 2rem;">Vérification de la blockchain...</p>`;
    let count = 0;

    try {
        const orderCountStr = await contract.methods.orderCount().call();
        const maxOrder = parseInt(BigInt(orderCountStr).toString());
        list.innerHTML = "";

        for (let i = 1; i <= maxOrder; i++) {
            const order = await contract.methods.orders(i).call();

            // Filtre : uniquement ce transporteur
            if (order.carrier.toLowerCase() === userAccount.toLowerCase()) {
                count++;
                createOrderCard(i, order, list);
            }
        }

        if (count === 0) {
            list.innerHTML = `<p style="color: #999; text-align: center; padding: 2rem; background: #f9f9f9; border-radius: 4px;">Aucun colis ne vous est assigné actuellement.</p>`;
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

    // Check SLA warning safely without crashing
    const now = Math.floor(Date.now() / 1000);
    const deadlineNum = Number(order.deadline);
    const isLate = now > deadlineNum && stateInt === 1;

    let actionBtn = "";
    if (stateInt === 0) { // Created
        actionBtn = `<span style="color: #666; font-size: 0.9rem;">En attente de dépôt par le Vendeur</span>`;
    } else if (stateInt === 1) { // Shipped
        // Le Transporteur doit confirmer
        const slaWarning = isLate ? `<br><small style="color:red; font-weight:bold;">SLA Dépassé ! Pénalité applicable.</small>` : `<br><small style="color:green;">Dans les temps.</small>`;
        actionBtn = `
            <div style="text-align:right;">
                <button class="btn primary" onclick="confirmDelivery(${id}, this)">Confirmer la livraison</button>
                ${slaWarning}
            </div>
        `;
    } else if (stateInt === 2 || stateInt === 3) { // Delivered / Completed
        actionBtn = `<span style="color: var(--primary); font-weight: 600;">✔️ Mission Accomplie</span>`;
    }

    card.innerHTML = `
        <div style="flex: 1; min-width: 250px;">
            <div style="display:flex; align-items:center; gap: 1rem; margin-bottom:0.5rem;">
                <h3 style="margin:0; font-size: 1.1rem;">Colis #${id}</h3>
                <span class="badge ${STATE_CLASSES[stateInt]}">${STATE_LABELS[stateInt]}</span>
            </div>
            <p style="margin:0; font-size: 0.85rem; color: #666;">
                <strong>Vendeur (Expéditeur):</strong> ${order.seller.substring(0, 6)}...<br>
                <strong>Acheteur (Destinataire):</strong> ${order.buyer.substring(0, 6)}...<br>
                <strong>Date limite SLA:</strong> ${dateLimit}
            </p>
        </div>
        <div>
            ${actionBtn}
        </div>
    `;
    container.appendChild(card);
}

// ==== APPEL CONTRAT (CONFIRM DELIVERY + ANIMATION) ====
window.confirmDelivery = async (orderId, btnElement) => {
    try {
        btnElement.disabled = true;
        btnElement.innerText = "Signature... 🦊";
        await contract.methods.confirmDelivery(orderId).send({ from: userAccount });

        // Jouer l'animation de livraison
        playTruckAnimation();

    } catch (error) {
        showToast("Erreur ou refus", "error");
        btnElement.disabled = false;
        btnElement.innerText = "Confirmer la livraison";
    }
};

function playTruckAnimation() {
    const overlay = document.getElementById('animationOverlay');
    overlay.style.display = 'flex';

    // Après 4 secondes, on cache l'animation et on rafraîchit
    setTimeout(() => {
        overlay.style.display = 'none';
        showToast("Colis validé sur la blockchain. SLA Vérifié !", "success");
        fetchCarrierOrders();
    }, 4000);
}
