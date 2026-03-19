# 📦 Logistics Escrow DApp - Vinted Style

Ce projet est une application décentralisée (DApp) de commerce sécurisé avec un système d'**Escrow** (tiers de confiance) et de **SLA** (Service Level Agreement). Il simule une plateforme type **Vinted**, où les fonds sont bloqués jusqu'à la livraison et où des pénalités automatiques sont appliquées en cas de retard.

## 🚀 Fonctionnalités Clés

### 🔐 Smart Contract (LogisticsEscrow.sol)
- **Escrow Sécurisé** : L'acheteur bloque les fonds (ETH) lors de la création de la commande.
- **Gestion du SLA** : Une pénalité par heure de retard est définie à la création.
- **Calcul Automatique** : Si le transporteur confirme la livraison après la `deadline`, le contrat calcule automatiquement une pénalité déduite du paiement du vendeur et remboursée à l'acheteur.
- **Pattern Withdrawal** : Sécurité accrue pour le retrait des fonds (évite les attaques de réentrance).

### 🎨 Frontend (Vinted Inspired)
- **Interface Intuitive** : Design épuré inspiré de Vinted (blanc, teal, gris clair).
- **Hero Section & Grid** : Simulation d'une marketplace avec des articles populaires.
- **Tableau de Bord de Suivi** : Suivi en temps réel de l'état de la commande (Créée, Envoyée, Livrée, Terminée).
- **Porte-monnaie Intégré** : Visualisation du solde disponible et retrait des fonds en un clic.

---

## 🛠 Technologies Utilisées

- **Solidity** : Langage du Smart Contract (v0.8.0).
- **Web3.js** : Bibliothèque pour l'interaction entre le frontend et la blockchain.
- **MetaMask** : Portefeuille pour signer les transactions.
- **Ganache** : Blockchain locale pour le développement et les tests.
- **HTML5 / CSS3 (Inter Font)** : Interface utilisateur moderne sans frameworks lourds.

---

## 📖 Guide d'Utilisation

### 1. Préparation
- Lancez **Ganache** (généralement sur `http://127.0.0.1:7545`).
- Déployez le contrat `LogisticsEscrow.sol` via **Remix IDE** sur votre réseau local.
- Copiez l'adresse du contrat déployé et collez-la dans `public/main.js` (variable `CONTRACT_ADDRESS`).

### 2. Flux de l'Application
1.  **Connexion** : Cliquez sur "Connect Wallet" pour lier votre compte MetaMask.
2.  **Acheter** : Remplissez le formulaire "Acheter un article". L'argent est envoyé et bloqué dans le Smart Contract.
3.  **Expédier (Vendeur)** : Le vendeur (adresse spécifiée lors de l'achat) clique sur "Envoyer le colis".
4.  **Livrer (Transporteur)** : Le transporteur clique sur "Confirmer la livraison". Si c'est après la date limite, le calcul du SLA s'active.
5.  **Accepter (Acheteur)** : L'acheteur confirme la réception. Les fonds sont alors répartis (Paiement final au vendeur, Pénalité éventuelle à l'acheteur).
6.  **Retrait** : Les utilisateurs retirent leur argent via la section "Mon Porte-monnaie".

---

## 📂 Structure du Projet

```text
.
├── LogisticsEscrow.sol    # Le code source Solidity (Logique métier)
├── app.js                 # Script exemple pour interactions backend (Node.js)
├── public/                # Dossier frontend
│   ├── index.html         # Structure de la DApp
│   ├── styles.css         # Design Vinted-style
│   └── main.js            # Logique d'interaction Web3.js
└── README.md              # Documentation du projet
```

## 📝 Auteurs
- **Rafael Piotrowski** & **Sael Bouzemarene**
- Mars 2026 - Projet Blockchain
# tracability-blockchain-project
