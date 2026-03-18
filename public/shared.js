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
    }
}

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
