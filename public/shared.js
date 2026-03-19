// ==== 1. CONFIGURATION CONTRACT ====
const CONTRACT_ADDRESS = "0x49Eb8A690E9af0cF3cB1cf32ca54cbB705AD7D48";

const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "acceptOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "confirmDelivery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_seller",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_carrier",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_deadline",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_penaltyPerHour",
                "type": "uint256"
            }
        ],
        "name": "createOrder",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "payee",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "FundsWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "OrderCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "carrier",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            }
        ],
        "name": "OrderCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "finalPayment",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "penalty",
                "type": "uint256"
            }
        ],
        "name": "OrderDelivered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "OrderShipped",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_orderId",
                "type": "uint256"
            }
        ],
        "name": "shipOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "orderCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "orders",
        "outputs": [
            {
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "carrier",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "penaltyPerHour",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "finalPayment",
                "type": "uint256"
            },
            {
                "internalType": "enum LogisticsEscrow.State",
                "name": "state",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "pendingWithdrawals",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// ==== 2. VARIABLES GLOBALES ====
let web3;
let contract;
let userAccount;
const STATE_LABELS = ['Créée / Achetée', 'En transit', 'Livrée (Relais)', 'Terminée'];
const STATE_CLASSES = ['state-created', 'state-shipped', 'state-delivered', 'state-completed'];

// ==== 3. UI HELPERS ====
function showToast(message, type = 'success') {
    let area = document.getElementById('notificationArea');
    if (!area) {
        area = document.createElement('div');
        area.id = 'notificationArea';
        area.className = 'notification-area';
        document.body.appendChild(area);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    area.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 5000);
}

// ==== 4. INITIALISATION WEB3 & METAMASK ====
async function initWeb3(requireConnection = false) {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            userAccount = accounts[0];
            updateWalletUI();
        } else if (requireConnection) {
            await connectWallet();
        }

        // Ecouter les changements de compte sur MetaMask
        window.ethereum.on('accountsChanged', (newAccounts) => {
            if (newAccounts.length > 0) {
                userAccount = newAccounts[0];
                updateWalletUI();
                // trigger a custom event if page wants to react
                window.dispatchEvent(new Event('walletChanged'));
            } else {
                userAccount = null;
                window.location.reload();
            }
        });

    } else {
        if (requireConnection) showToast('Veuillez installer MetaMask !', 'error');
    }
}

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];

            if (!web3) {
                web3 = new Web3(window.ethereum);
                contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            }

            updateWalletUI();
            showToast('Portefeuille connecté !', 'success');
            window.dispatchEvent(new Event('walletChanged'));
        } catch (error) {
            console.error(error);
            showToast('Connexion refusée.', 'error');
        }
    } else {
        showToast('Veuillez installer MetaMask !', 'error');
    }
}

function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const userAddressSpan = document.getElementById('userAddress');

    if (userAccount) {
        if (connectBtn) connectBtn.classList.add('hidden');
        if (walletInfo) walletInfo.classList.remove('hidden');
        if (userAddressSpan) userAddressSpan.innerText = userAccount.substring(0, 6) + '...' + userAccount.substring(userAccount.length - 4);
        renderTxHistoryUI();
    }
}

// ==== 6. HISTORIQUE BLOCKCHAIN (TX LOG) ====
function saveTransaction(txHash, actionLabel) {
    if (!userAccount) return;
    const history = JSON.parse(localStorage.getItem('vinted_tx_history') || '[]');
    history.unshift({
        txHash: txHash,
        actionLabel: actionLabel,
        account: userAccount.toLowerCase(),
        date: new Date().toLocaleString()
    });
    localStorage.setItem('vinted_tx_history', JSON.stringify(history));
}

function openTxHistoryModal() {
    let modal = document.getElementById('txHistoryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'txHistoryModal';
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; align-items:center; justify-content:center;";
        modal.innerHTML = `
            <div class="card" style="width: 100%; max-width: 600px; margin: 2rem; max-height: 90vh; overflow-y: auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h2 style="margin:0; font-size: 1.25rem;">📜 Registre Blockchain</h2>
                    <button onclick="document.getElementById('txHistoryModal').style.display='none'" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div id="txHistoryContent" style="display: flex; flex-direction: column; gap: 0.5rem;">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const content = document.getElementById('txHistoryContent');
    const history = JSON.parse(localStorage.getItem('vinted_tx_history') || '[]');
    const myHistory = history.filter(tx => tx.account === userAccount.toLowerCase());

    if (myHistory.length === 0) {
        content.innerHTML = '<p style="color:#666; text-align:center;">Aucune transaction enregistrée pour ce compte.</p>';
    } else {
        content.innerHTML = myHistory.map(tx => `
            <div style="padding: 0.8rem; border: 1px solid var(--border); border-radius: 4px; background: #fafafa;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                    <strong>${tx.actionLabel}</strong>
                    <span style="font-size:0.8rem; color:#666;">${tx.date}</span>
                </div>
                <div style="font-size:0.75rem; font-family:monospace; color:var(--primary); word-break:break-all;">
                    TX: ${tx.txHash}
                </div>
            </div>
        `).join('');
    }

    modal.style.display = 'flex';
}

function renderTxHistoryUI() {
    if (!document.getElementById('txHistoryBtn') && userAccount) {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            const btn = document.createElement('button');
            btn.id = 'txHistoryBtn';
            btn.className = 'btn secondary';
            btn.style.marginRight = '1rem';
            btn.innerHTML = '📜 Blockchain';
            btn.onclick = openTxHistoryModal;
            headerRight.insertBefore(btn, headerRight.firstChild);
        }
    }
}

// ==== 7. FACTURE / REÇU PDF ====
window.generateInvoice = async (orderId) => {
    if (!contract) return;
    try {
        const order = await contract.methods.orders(orderId).call();
        const price = web3.utils.fromWei(order.price, 'ether');
        const finalPayment = web3.utils.fromWei(order.finalPayment, 'ether');
        const deadlineStr = new Date(Number(order.deadline) * 1000).toLocaleString();

        // Calcul pénalité sur le prix de rachat
        const penaltyTotal = parseFloat(price) - parseFloat(finalPayment);
        const penaltyStr = penaltyTotal > 0 ? `<div class="row"><span class="label">Pénalité de Retard:</span> <span class="value" style="color:#c60000">- ${penaltyTotal} ETH</span></div>` : '';

        const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="utf-8">
            <title>Facture Blockchain #${orderId}</title>
            <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
                .header { border-bottom: 2px solid #09B1BA; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                h1 { color: #09B1BA; margin: 0; font-size: 28px; font-weight: 700; }
                .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dotted #eee; padding-bottom: 5px; }
                .label { font-weight: bold; color: #666; width: 250px; }
                .value { font-family: monospace; font-size: 1.1em; color: #333; text-align: right; word-break: break-all; }
                .box { background: #f9f9f9; padding: 25px; border-radius: 8px; margin-top: 30px; border: 1px solid #ebedee; }
                .total { font-size: 1.5em; font-weight: bold; color: #2e7d32; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; }
                .footer { margin-top: 50px; font-size: 0.8em; color: #999; text-align: center; padding-top: 20px; }
            </style>
        </head>
        <body onload="window.print();">
            <div class="header">
                <div>
                    <h1>vinted <span style="font-size: 0.5em; color: #666; font-weight: normal;">Logistics Escrow Blockchain</span></h1>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 1.1em;">Rapport de Transaction Validée</p>
                </div>
                <div style="text-align: right; color: #666; line-height: 1.5;">
                    <strong>Dossier N° ${orderId}</strong><br>
                    Édité le: ${new Date().toLocaleDateString()}
                </div>
            </div>
            
            <div class="row" style="border:none;"><span class="label">Contrat intelligent (SLA):</span> <span class="value">${deadlineStr}</span></div>
            <div class="row" style="border:none;"><span class="label">Statut du Séquestre:</span> <span class="value" style="color:#2e7d32; font-weight:bold;">CLÔTURÉ (Fonds Livrés)</span></div>
            
            <div class="box">
                <h3 style="margin-top:0; color:#333; font-size: 1.1em; margin-bottom: 20px; text-transform: uppercase;">Membres de L'Échange (Adresses Publiques)</h3>
                <div class="row"><span class="label">Vendeur (Expéditeur):</span> <span class="value">${order.seller}</span></div>
                <div class="row"><span class="label">Acheteur (Destinataire):</span> <span class="value">${order.buyer}</span></div>
                <div class="row" style="margin-bottom:0; border:none;"><span class="label">Transporteur (Tiers):</span> <span class="value">${order.carrier}</span></div>
            </div>

            <div class="box">
                <h3 style="margin-top:0; color:#333; font-size: 1.1em; margin-bottom: 20px; text-transform: uppercase;">Synthèse Financière (en Ethers)</h3>
                <div class="row"><span class="label">Montant initial bloqué:</span> <span class="value">${price} ETH</span></div>
                ${penaltyStr}
                <div class="total">VERSEMENT FINAL : ${finalPayment} ETH</div>
            </div>
            
            <div class="footer">
                Document PDF généré nativement d'après les registres inaltérables de la blockchain Ethereum.<br>
                L'échange et le règlement des fonds ont été exécutés sans tiers de confiance ni organisme bancaire.
            </div>
            <script>
                // Astuce: ferme l'onglet automatiquement une fois l'impression lancée/annulée (selon les navigateurs)
                window.onafterprint = function(){ window.close(); }
            </script>
        </body>
        </html>
        `;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    } catch (e) {
        console.error(e);
        showToast("Erreur de récupération des données", "error");
    }
};

// ==== 5. Base de Données Mock (LocalStorage) ====
function getMarketplaceItems() {
    const items = localStorage.getItem('vinted_items');
    return items ? JSON.parse(items) : [];
}

function saveMarketplaceItem(item) {
    const items = getMarketplaceItems();
    item.id = Date.now().toString();
    items.push(item);
    localStorage.setItem('vinted_items', JSON.stringify(items));
}

function removeMarketplaceItem(itemId) {
    let items = getMarketplaceItems();
    items = items.filter(i => i.id !== itemId);
    localStorage.setItem('vinted_items', JSON.stringify(items));
}

// Lier le bouton au cas où
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('connectWalletBtn');
    if (btn) btn.addEventListener('click', connectWallet);
});
