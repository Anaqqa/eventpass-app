# EventPass – Contract API (Draft)

Ce document définit les fonctions et événements attendus du smart contract
afin de permettre le développement du frontend en parallèle.

## Fonctions principales

- buyTicket(ticketType, tokenURI) payable
- listForResale(tokenId, price)
- buyResale(listingId) payable
- validateAndBurn(tokenId)

## Règles métier (on-chain)

- Maximum 4 billets par wallet
- Cooldown de 5 minutes entre deux transactions par wallet
- Lock de 10 minutes après l’achat d’un billet
- Prix de revente maximum : +20% du prix initial
- Un billet ne peut être revendu qu’une seule fois

## Events attendus

- TicketPurchased(buyer, tokenId, ticketType, price)
- TicketListed(seller, tokenId, price)
- TicketResold(from, to, tokenId, price)
- TicketValidated(tokenId, validator)
