// script exemple interactif: app.js
// Objectif: Appeler la méthode "confirmDelivery" du Smart Contract avec Web3.js.

const Web3 = require('web3');

// 1. Connexion au noeud RPC (Le réseau local Ganache)
const web3 = new Web3('http://127.0.0.1:7545');

// 2. Définition de l'adresse de votre Smart Contract
// REMPLACER ICI PAR L'ADRESSE DONNÉE PAR REMIX APRES LE DEPLOIEMENT:
const contractAddress = '0xb61B991577e179a2A8239bdaa3C6B93DfD28D192';

// 3. Définition du fichier ABI permettant d'interagir avec le contrat.
// Normalement on charge le fichier .json complet. 
// Pour l'exemple, voici la signature réduite de 'confirmDelivery' :
const contractABI = [
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
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "finalPayment", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "penalty", "type": "uint256" }
        ],
        "name": "OrderDelivered",
        "type": "event"
    }
];

// Instanciation de l'objet contrat dans Web3
const logisticsEscrow = new web3.eth.Contract(contractABI, contractAddress);

// 4. L'adresse du transporteur (Carrier) issue de votre page Ganache.
// (La personne qui va payer le gaz de la confirmation de livraison)
// REMPLACER ICI PAR L'ADRESSE DE COMPTE DE VOTRE TRANSPORTEUR:
const carrierAddress = '0x5c91...';

async function executeConfirmDelivery(orderId) {
    try {
        console.log(`[Transporteur] Interaction Web3 pour l'Order n°${orderId}...`);

        // Lancement de la transaction 'confirmDelivery' de notre contract
        const receipt = await logisticsEscrow.methods.confirmDelivery(orderId).send({
            from: carrierAddress,
            gas: 3000000  // Montant max de Gas en Wei autorisé protégé contre les boucles infinies
        });

        console.log('✅ Transaction minée avec succès dans la blockchain !');
        console.log('Hash (reçu) de la transaction:', receipt.transactionHash);

        // Bonus: Lecture des événements (Event) Solidity grâce à Web3
        if (receipt.events.OrderDelivered) {
            const returnedValues = receipt.events.OrderDelivered.returnValues;
            console.log('\n--- Résultats du calcul SLA issu du Smart Contract ---');
            console.log(`💰 Paiement final débloqué au vendeur : ${returnedValues.finalPayment} Wei`);
            console.log(`📉 Montant de la pénalité retenue      : ${returnedValues.penalty} Wei`);
        }

    } catch (error) {
        console.error('❌ La transaction a échoué ! Motifs possibles :');
        console.error(' - L\'utilisateur n\'est pas le transporteur (onlyCarrier)');
        console.error(' - L\'état de la commande n\'est pas "Shipped" (inState)');
        console.error(' - Raison technique web3 :', error.message);
    }
}

// Déclenchement de l'exécution pour la première commande (orderId = 1)
executeConfirmDelivery(1);
