// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LogisticsEscrow {
    // 1. Définition des états de la commande
    enum State { Created, Shipped, Delivered, Completed }

    // 2. Définition de la structure de commande avec la logique du SLA
    struct Order {
        address buyer;
        address seller;
        address carrier;
        uint256 price;           // Prix total (ou somme bloquée) de la commande en Wei
        uint256 deadline;        // Timestamp limite de livraison
        uint256 penaltyPerHour;  // Pénalité financière par heure de retard en Wei
        uint256 finalPayment;    // Montant final qui sera donné au vendeur après calcul SLA
        State state;             // Etat actuel de la commande
    }

    // 3. Variables d'état
    mapping(uint256 => Order) public orders;
    uint256 public orderCount;
    
    // Mapping pour sécuriser les retraits d'argent (Withdrawal pattern)
    mapping(address => uint256) public pendingWithdrawals;

    // 4. Événements pour que Web3.js puisse réagir
    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, address carrier, uint256 price, uint256 deadline);
    event OrderShipped(uint256 indexed orderId);
    event OrderDelivered(uint256 indexed orderId, uint256 finalPayment, uint256 penalty);
    event OrderCompleted(uint256 indexed orderId);
    event FundsWithdrawn(address indexed payee, uint256 amount);

    // 5. Modifiers de restriction d'accès
    modifier onlyBuyer(uint256 _orderId) {
        require(msg.sender == orders[_orderId].buyer, "Seul l'acheteur peut appeler cette fonction");
        _;
    }

    modifier onlySeller(uint256 _orderId) {
        require(msg.sender == orders[_orderId].seller, "Seul le vendeur peut appeler cette fonction");
        _;
    }

    modifier onlyCarrier(uint256 _orderId) {
        require(msg.sender == orders[_orderId].carrier, "Seul le transporteur peut appeler cette fonction");
        _;
    }

    modifier inState(uint256 _orderId, State _state) {
        require(orders[_orderId].state == _state, "Action invalide pour l'etat actuel");
        _;
    }

    // 6. Implémentation de la logique métier

    // L'acheteur crée la commande et bloque les fonds (payable)
    function createOrder(address _seller, address _carrier, uint256 _deadline, uint256 _penaltyPerHour) public payable {
        require(msg.value > 0, "Le prix (msg.value) doit etre superieur a zero");
        require(_deadline > block.timestamp, "La deadline doit etre superieure au timestamp actuel");

        orderCount++;
        orders[orderCount] = Order({
            buyer: msg.sender,
            seller: _seller,
            carrier: _carrier,
            price: msg.value,
            deadline: _deadline,
            penaltyPerHour: _penaltyPerHour,
            finalPayment: 0,
            state: State.Created
        });

        emit OrderCreated(orderCount, msg.sender, _seller, _carrier, msg.value, _deadline);
    }

    // Le vendeur expédie le colis
    function shipOrder(uint256 _orderId) public onlySeller(_orderId) inState(_orderId, State.Created) {
        orders[_orderId].state = State.Shipped;
        emit OrderShipped(_orderId);
    }

    // Le transporteur confirme la livraison -> Calcul du SLA automatique
    function confirmDelivery(uint256 _orderId) public onlyCarrier(_orderId) inState(_orderId, State.Shipped) {
        Order storage order = orders[_orderId];
        order.state = State.Delivered;

        uint256 penalty = 0;
        
        // SLA : Retard par rapport à la deadline fixe
        if (block.timestamp > order.deadline) {
            penalty = order.penaltyPerHour;
            
          //   La pénalité ne peut excéder le prix de la commande
            if (penalty > order.price) {
                penalty = order.price;
            }
        }

        // On calcule combien le vendeur retouchera au final (Price - penalty)
        order.finalPayment = order.price - penalty;

        emit OrderDelivered(_orderId, order.finalPayment, penalty);
    }

    // L'acheteur valide la réception, ce qui alloue les fonds pour le retrait
    function acceptOrder(uint256 _orderId) public onlyBuyer(_orderId) inState(_orderId, State.Delivered) {
        Order storage order = orders[_orderId];
        order.state = State.Completed;

        uint256 penalty = order.price - order.finalPayment;

        // Allocation des fonds
        // Le vendeur gagne le 'finalPayment'
        pendingWithdrawals[order.seller] += order.finalPayment;
        
        // Si SLA non respecté, l'acheteur est dédommagé
        if (penalty > 0) {
            pendingWithdrawals[order.buyer] += penalty;
        }

        emit OrderCompleted(_orderId);
    }

    // 7. Fonction de retrait sécurisée : modèle "Checks-Effects-Interactions"
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        
        // Checks
        require(amount > 0, "Aucun fonds disponible pour le retrait");

        // Effects : On met à zéro avant l'envoi effectif au cas où une faille de réentrance exploite l'envoi
        pendingWithdrawals[msg.sender] = 0;

        // Interactions : On envoie l'argent à la toute fin
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Le transfert d'ETH a echoue");

        emit FundsWithdrawn(msg.sender, amount);
    }
}
