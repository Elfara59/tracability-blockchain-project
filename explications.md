# Explications du Smart Contract LogisticsEscrow

Ce document détaille les différentes variables d'état et la logique du Service Level Agreement (SLA) implémentées dans le contrat `LogisticsEscrow.sol`.

## 1. La structure `Order`
La structure `Order` regroupe l'ensemble des informations nécessaires au suivi et au paiement d'une expédition.
* `buyer` (address) : Adresse de l'acheteur (celui qui initie la transaction et paye le contrat).
* `seller` (address) : Adresse du vendeur (celui qui expédie la commande).
* `carrier` (address) : Adresse du transporteur.
* `price` (uint256) : Prix total payé par l'acheteur et bloqué dans le contrat (au format Wei).
* `deadline` (uint256) : Timestamp UNIX (secondes écoulées depuis 1970) représentant la date et l'heure limites de livraison.
* `penaltyPerHour` (uint256) : Indique le montant (en Wei) qui sera soustrait au paiement total pour chaque heure de retard de la part du transporteur.
* `finalPayment` (uint256) : Le montant final qui sera alloué au vendeur après le calcul de l'éventuelle pénalité de retard.
* `state` (State) : Représente l'état chronologique de la commande (`Created`, `Shipped`, `Delivered`, `Completed`) via une énumération Solidity (Enum).

## 2. Variables d'état globales
* `orders` (mapping) : Un dictionnaire associant un entier (l'ID de la commande) à une structure `Order`. L'utilisation d'un mapping permet  de gérer de multiples commandes simultanément dans le contrat avec une efficacité maximale au niveau des frais de gaz (plus performant que de devoir boucler sur un grand tableau).
* `orderCount` (uint256) : Un compteur incrémenté de 1 à chaque nouvelle commande. Il sert à générer des identifiants uniques pour peupler le mapping `orders`.
* `pendingWithdrawals` (mapping) : Un dictionnaire associant chaque adresse d'utilisateur à une somme d'argent sous forme de solde (en Wei). Cette variable est **strictement nécessaire** pour implémenter un retrait sécurisé qui suit le motif de conception ("Checks-Effects-Interactions"). Plutôt que d'envoyer l'argent directement et automatiquement à la fin de la transaction (ce qui exposerait le contrat à des failles fatales de "réentrance"), le contrat modifie cette variable. Les utilisateurs doivent ensuite venir retirer l'argent d'eux-même via `withdraw()`.

## 3. Logique de pénalité de retard automatique (SLA)
Le cœur du tiers de confiance financier opère en arrière plan lors de l'appel à la fonction `confirmDelivery()` par le transporteur :
1. Le contrat lit `block.timestamp` (qui représente l'heure précise à laquelle l'opération est validée sur la blockchain) et le compare à la `deadline`.
2. S'il n'y a pas de retard, l'argent sera transféré tel quel.
3. Si un retard de SLA est constaté, le contrat réalise une soustraction `block.timestamp - deadline` pour récupérer le délai en secondes exactes.
4. Ce délai est divisé par 3600 pour obtenir le retard en heures entières. *Note: Solidity ignore par défaut les décimales lors d'une division d'entiers, un retard de 1h59 serait comptabilisé comme 1h.*
5. La pénalité s'applique selon la formule cible : *$Pénalité = HeuresDeRetard \times PenaliteParHeure$*.
6. Par mesure de sécurité de gestion de fonds, le Smart Contract plafonne la pénalité à 100% de la valeur marchande (pour éviter le cas ou le `finalPayment` deviendrait un chiffre négatif causant un débordement d'entiers ou "Underflow").
7. A l'étape `acceptOrder`, le contrat lira ce résultat pour autoriser le solde complet (`finalPayment`) au retrait du vendeur, et rembourser dans un même temps la somme représentant la pénalité en autorisation de retrait vers le compte de l'acheteur pénalisé.
