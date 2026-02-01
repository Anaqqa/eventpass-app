## EventPass – Contract API

Ce document décrit l’API du smart contract EventPass, utilisé pour gérer un
système de billetterie NFT avec règles anti-scalping.
Il sert de référence entre le smart contract et le frontend.

Fonctions principales (on-chain)

## buyTicket(ticketType, tokenURI) payable

Permet d’acheter un billet lors de la vente primaire.
	•	ticketType (uint8)
Type de billet :
	•	0 → EARLY_BIRD
	•	1 → STANDARD
	•	2 → PREMIUM
	•	3 → VIP
	•	tokenURI (string)
URI des métadonnées du billet (IPFS ou data URI)
	•	payable
Le montant envoyé (msg.value) doit être ≥ au prix du billet

Effets :
	•	Mint un NFT (ERC721)
	•	Associe les métadonnées au billet
	•	Enregistre le prix initial et le type
	•	Démarre le lock de 10 minutes
	•	Émet l’événement TicketPurchased


listForResale(tokenId, price)

Permet de mettre un billet en vente sur le marché secondaire.
	•	tokenId (uint256)
Identifiant du billet
	•	price (uint256)
Prix de revente (en wei)

Contraintes :
	•	L’appelant doit être propriétaire du billet
	•	Le billet ne doit pas avoir déjà été revendu
	•	Le billet doit avoir dépassé la période de lock (10 min)
	•	Le prix ≤ prix initial + 20 %

Effets :
	•	Crée un listing on-chain
	•	Émet l’événement TicketListed


## buyResale(listingId) payable

Permet d’acheter un billet listé sur le marché secondaire.
	•	listingId (uint256)
Identifiant du listing

Contraintes :
	•	Le listing doit être actif
	•	Le montant envoyé doit être ≥ au prix demandé
	•	Respect du cooldown (5 min)
	•	Maximum 4 billets par wallet

Effets :
	•	Transfert du NFT au nouvel acheteur
	•	Paiement du vendeur
	•	Désactivation du listing
	•	Incrément du compteur de revente
	•	Émet l’événement TicketResold


## validateAndBurn(tokenId)

Permet de valider un billet à l’entrée de l’événement.
	•	tokenId (uint256)
Identifiant du billet à valider

Contraintes :
	•	L’appelant doit être propriétaire du billet

Effets :
	•	Brûle définitivement le NFT
	•	Le billet devient inutilisable
	•	Émet l’événement TicketValidated

⸻

## Règles métier (on-chain)

Les règles suivantes sont strictement appliquées par le smart contract :
	•	Maximum 4 billets par wallet
	•	Cooldown de 5 minutes entre deux transactions par wallet
	•	Lock de 10 minutes après l’achat d’un billet
	•	Prix de revente maximum : +20 % du prix initial
	•	Un billet ne peut être revendu qu’une seule fois
	•	Un billet validé est définitivement brûlé


 Événements (Events)

TicketPurchased

event TicketPurchased(
  address indexed buyer,
  uint256 indexed tokenId,
  TicketType ticketType,
  uint256 price
);

Émis lors de l’achat initial d’un billet.


TicketListed

event TicketListed(
  address indexed seller,
  uint256 indexed tokenId,
  uint256 price
);

Émis lorsqu’un billet est mis en revente.


TicketResold

event TicketResold(
  address indexed from,
  address indexed to,
  uint256 indexed tokenId,
  uint256 price
);

Émis lorsqu’un billet est revendu avec succès.


TicketValidated

event TicketValidated(
  uint256 indexed tokenId,
  address indexed validator
);

Émis lorsqu’un billet est validé et brûlé à l’entrée de l’événement.


## Intégration Frontend

Le frontend utilise ces événements pour :
	•	Reconstruire la liste des billets détenus par un wallet
	•	Afficher l’historique des achats / reventes
	•	Mettre à jour l’état des billets en temps réel
	•	Générer et scanner des QR codes pour la validation

    ---

## Bonus – QR Code (off-chain)

Le QR code est une fonctionnalité **off-chain (frontend)** qui s’appuie sur les données on-chain du smart contract.

### Principe

- Chaque billet NFT est identifié par un `tokenId`
- Un QR code est généré côté frontend à partir de ce `tokenId`
- Le QR code peut contenir :
  - soit le `tokenId`
  - soit une URL du type `/validate?tokenId=123`

### Cas d’usage

- À l’entrée de l’événement, l’organisateur scanne le QR code
- Le scan redirige vers la page de validation
- La page appelle la fonction on-chain `validateAndBurn(tokenId)`
- Le NFT est burn et ne peut plus être réutilisé

### Sécurité

- La validation est vérifiée on-chain
- Un billet déjà utilisé (burn) ne peut pas être validé à nouveau
- Le QR code n’a aucune valeur sans interaction avec le smart contract

### Rôle du smart contract

Le smart contract ne gère pas le QR code directement.
Il garantit uniquement :
- l’unicité du billet (`tokenId`)
- la propriété du billet
- la destruction définitive du billet après validation
