// ==== 1. CONFIGURATION CONTRACT ====
// Remplacez cette adresse par celle de votre contrat déployé sur Ganache
const CONTRACT_ADDRESS = "0xb61B991577e179a2A8239bdaa3C6B93DfD28D192";

// L'ABI du contrat complet (Compilé depuis Remix/Solidity)
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
const STATE_LABELS = ['Created', 'Shipped', 'Delivered', 'Completed'];
const STATE_CLASSES = ['state-created', 'state-shipped', 'state-delivered', 'state-completed'];

// ==== 3. ELEMENTS DOM ====
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletInfo = document.getElementById('walletInfo');
const userAddressSpan = document.getElementById('userAddress');
const hintTimestamp = document.getElementById('hintTimestamp');

// ==== 4. INITIALISATION WEB3 & METAMASK ====
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Demande à MetaMask l'autorisation de se connecter
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];

            // Initialiser Web3
            web3 = new Web3(window.ethereum);
            contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

            // MAJ Interface
            connectWalletBtn.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            userAddressSpan.innerText = userAccount.substring(0, 6) + '...' + userAccount.substring(userAccount.length - 4);

            showToast('Wallet connected successfully!', 'success');

            // Ecouter les changements de compte sur MetaMask
            window.ethereum.on('accountsChanged', (newAccounts) => {
                userAccount = newAccounts[0];
                userAddressSpan.innerText = userAccount.substring(0, 6) + '...' + userAccount.substring(userAccount.length - 4);
                updatePendingWithdrawals(); // Mettre à jour les sous dispos
            });

            // Lancer les fetch initiaux
            updatePendingWithdrawals();

        } catch (error) {
            console.error(error);
            showToast('User denied connection or error occurred.', 'error');
        }
    } else {
        showToast('Please install MetaMask to use this DApp!', 'error');
    }
}

// ==== 5. UI HELPERS ====
setInterval(() => {
    hintTimestamp.innerText = Math.floor(Date.now() / 1000);
}, 1000);

document.getElementById('btnPastTime').addEventListener('click', () => {
    document.getElementById('deadlineInput').value = Math.floor(Date.now() / 1000) - (3 * 24 * 3600); // - 3 Jours
});

function showToast(message, type = 'success') {
    const area = document.getElementById('notificationArea');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    area.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 5000);
}

// ==== 6. FONCTIONS SMART CONTRACT ====

// [ACHETEUR] Créer une commande
document.getElementById('createOrderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contract) return showToast('Please connect wallet first', 'error');

    const seller = document.getElementById('sellerInput').value;
    const carrier = document.getElementById('carrierInput').value;
    const deadline = document.getElementById('deadlineInput').value;

    // Conversion ETH en Wei
    const priceWei = web3.utils.toWei(document.getElementById('priceInput').value, 'ether');
    const penaltyWei = web3.utils.toWei(document.getElementById('penaltyInput').value, 'ether');

    try {
        const btn = document.getElementById('btnCreateOrder');
        btn.disabled = true;
        btn.innerText = "Transaction pending...";

        await contract.methods.createOrder(seller, carrier, deadline, penaltyWei).send({
            from: userAccount,
            value: priceWei // L'argent bloqué pour le contrat !
        });

        showToast('Order created & funds locked!', 'success');
        document.getElementById('searchOrderId').value = await contract.methods.orderCount().call();
        fetchOrder(); // Actualiser

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        const btn = document.getElementById('btnCreateOrder');
        btn.disabled = false;
        btn.innerText = "Create & Lock Funds";
    }
});

// Récupérer et afficher les détails d'une commande
async function fetchOrder() {
    if (!contract) return showToast('Please connect wallet first', 'error');

    const orderId = document.getElementById('searchOrderId').value;
    if (!orderId) return;

    try {
        const orderCountStr = await contract.methods.orderCount().call();
        const orderCountInt = parseInt(BigInt(orderCountStr).toString());

        if (orderId > orderCountInt) {
            return showToast('This order does not exist yet', 'error');
        }

        const order = await contract.methods.orders(orderId).call();

        document.getElementById('orderDetails').classList.remove('hidden');
        document.getElementById('displayOrderId').innerText = orderId;

        // Populate fields
        document.getElementById('displayBuyer').innerText = order.buyer;
        document.getElementById('displaySeller').innerText = order.seller;
        document.getElementById('displayCarrier').innerText = order.carrier;

        document.getElementById('displayPrice').innerText = web3.utils.fromWei(order.price, 'ether');
        document.getElementById('displayPenalty').innerText = web3.utils.fromWei(order.penaltyPerHour, 'ether');
        document.getElementById('displayDeadline').innerText = new Date(Number(order.deadline) * 1000).toLocaleString();

        // Status logic
        const stateInt = Number(order.state);
        const stateBadge = document.getElementById('displayState');
        stateBadge.innerText = STATE_LABELS[stateInt];
        stateBadge.className = `badge state-badge ${STATE_CLASSES[stateInt]}`;

        // Buttons logic
        const btnShip = document.getElementById('btnShip');
        const btnDeliver = document.getElementById('btnDeliver');
        const btnAccept = document.getElementById('btnAccept');

        btnShip.disabled = stateInt !== 0; // Seul etat: "Created"
        btnDeliver.disabled = stateInt !== 1; // Seul etat: "Shipped"
        btnAccept.disabled = stateInt !== 2; // Seul etat: "Delivered"

    } catch (error) {
        showToast('Error fetching order', 'error');
        console.error(error);
    }
}

// Action sur l'order (Générique)
async function contractAction(methodName, btnId, successMsg) {
    if (!contract) return;
    const orderId = document.getElementById('searchOrderId').value;
    const btn = document.getElementById(btnId);

    try {
        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = "Loading...";

        await contract.methods[methodName](orderId).send({ from: userAccount });
        showToast(successMsg, 'success');
        fetchOrder(); // Maj interface

    } catch (error) {
        showToast(error.message, 'error');
        btn.disabled = false;
        // Restaurer le texte original via fetch
        fetchOrder();
    }
}

// Fetch Withdrawal balance
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

// Withdraw call
async function withdrawFunds() {
    if (!contract) return;
    const btn = document.getElementById('btnWithdraw');
    try {
        btn.disabled = true;
        btn.innerText = "Withdrawing...";

        await contract.methods.withdraw().send({ from: userAccount });

        showToast('Funds successfully transferred to your wallet!', 'success');
        updatePendingWithdrawals();

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.innerText = "Withdraw to Wallet";
        updatePendingWithdrawals(); // Va disabled ou pas le bouton
    }
}

// Bindings
connectWalletBtn.addEventListener('click', connectWallet);
document.getElementById('btnFetchOrder').addEventListener('click', fetchOrder);
document.getElementById('searchOrderId').addEventListener('change', fetchOrder);

document.getElementById('btnShip').addEventListener('click', () => contractAction('shipOrder', 'btnShip', 'Order Shipped!'));
document.getElementById('btnDeliver').addEventListener('click', () => contractAction('confirmDelivery', 'btnDeliver', 'Delivery Confirmed (SLA Calculated)!'));
document.getElementById('btnAccept').addEventListener('click', () => contractAction('acceptOrder', 'btnAccept', 'Order Accepted! Funds are now available for withdrawal.'));
document.getElementById('btnWithdraw').addEventListener('click', withdrawFunds);
