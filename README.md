# eventpass-app

 EventPass — Blockchain Ticketing dApp

EventPass est une application de billetterie décentralisée (dApp) basée sur Ethereum, permettant :
	•	l’achat de billets NFT,
	•	la revente encadrée (anti-scalping),
	•	la validation des billets via burn on-chain,
	•	l’affichage de QR codes pour le contrôle à l’entrée.

Le projet est composé de :
	•	Smart contract Solidity (Hardhat)
	•	Frontend Next.js + ethers.js
	•	Wallet MetaMask (réseau local Hardhat)


 # Architecture du projet

eventpass-app/
├── contracts/        # Smart contracts (Hardhat)
│   ├── EventPass.sol
│   ├── scripts/
│   └── hardhat.config.ts
│
├── frontend/         # Frontend Next.js
│   ├── app/
│   ├── src/lib/
│   └── .env.local
│
├── docs/
│   └── CONTRACT_API.md
│
└── README.md

# Prérequis
	•	Node.js ≥ 18
	•	npm ou pnpm
	•	MetaMask installé sur le navigateur

⸻

# Installation & Lancement (local)

1️⃣ Cloner le projet

git clone https://github.com/Anaqqa/eventpass-app.git
cd eventpass-app

2️⃣ Lancer la blockchain locale (Hardhat)

cd contracts
npm install
npx hardhat node

➡️ Laisse ce terminal ouvert
➡️ Réseau local : Hardhat Local (chainId 31337)


3️⃣ Déployer le smart contract

Dans un nouveau terminal :

cd contracts
npx hardhat run scripts/deploy.ts --network localhost

 Copie l’adresse du contrat affichée (exemple) :

Contract deployed to: 0x...

4️⃣ Configurer le frontend

cd frontend
npm install

Créer le fichier .env.local :

NEXT_PUBLIC_CONTRACT_ADDRESS=0xADRESSE_DU_CONTRAT
NEXT_PUBLIC_CHAIN_ID=31337


5️⃣ Lancer le frontend

npm run dev

 Ouvre :
 http://localhost:3000

Configuration MetaMask

Dans MetaMask :
	•	Réseau : Hardhat Local
	•	RPC : http://127.0.0.1:8545
	•	Chain ID : 31337

Importer un compte Hardhat (clé privée affichée dans le terminal Hardhat).

 Scénario de démo (pour le professeur)

1. Connexion au wallet
	•	MetaMask → réseau Hardhat

2. Achat de billet
	•	Page Buy
	•	Choisir un type (STANDARD / VIP / PREMIUM)
	•	Confirmer la transaction

3. Mes billets
	•	Page My Tickets
	•	Affichage des billets NFT
	•	QR code généré à partir des metadata
	•	Boutons : Revendre / Valider

4. Revente
	•	Cliquer Revendre
	•	Définir un prix (≤ +20%)
	•	Le billet apparaît dans Offres disponibles

5. Achat en revente
	•	Changer de wallet
	•	Acheter le billet listé

6. Validation
	•	Cliquer Valider
	•	Transaction on-chain
	•	Le billet est burn
	•	Il disparaît de “Mes billets”


# Règles métier (on-chain)

Toutes ces règles sont implémentées dans le smart contract :
	•	Max 4 billets par wallet
	•	Cooldown 5 min entre deux transactions
	• Lock 10 min après achat avant revente
	•	Prix de revente max +20%
	• Une seule revente par billet
	•	Validation = burn définitif

Toute violation = transaction revert (preuve on-chain)


# Documentation Smart Contract

Voir :

docs/CONTRACT_API.md

Inclut :
	•	Fonctions
	•	Events
	•	Règles
	•	Bonus QR Code

# Bonus implémentés
	•	✅ QR Code par billet
	•	✅ Metadata on-chain / data URI
	•	✅ Marketplace de revente
	•	✅ Validation par burn
	•	✅ Sécurité anti-scalping

 # Conclusion

EventPass démontre une billetterie Web3 complète, sécurisée et testable,
avec des règles métier impossibles à contourner côté frontend.
