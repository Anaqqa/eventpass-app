# 🎫 EventPass - Blockchain Ticketing DApp

Plateforme de billetterie décentralisée permettant l'achat, la revente contrôlée et la validation sécurisée de billets d'événements via NFTs.

## 📋 Table des Matières

- [Architecture](#architecture)
- [Setup Backend (Smart Contracts)](#setup-backend)
- [Setup Frontend](#setup-frontend)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Workflow Git](#workflow-git)
- [Règles Métier](#règles-métier)

---

## 🏗️ Architecture

```
eventpass-app/
├── contracts/           # Smart contracts Solidity + Hardhat
│   ├── contracts/
│   │   └── EventPass.sol
│   ├── test/
│   │   └── EventPass.test.js
│   ├── scripts/
│   │   └── deploy.js
│   ├── hardhat.config.js
│   └── package.json
├── frontend/            # Interface Next.js + ethers.js
│   ├── src/
│   │   ├── app/
│   │   └── components/
│   └── package.json
└── docs/                # Documentation projet
```

---

## ⚙️ Setup Backend

### 1. Installation des dépendances

```bash
cd contracts
npm install
```

### 2. Compilation des smart contracts

```bash
npx hardhat compile
```

### 3. Lancer les tests

```bash
npx hardhat test
```

### 4. Lancer un nœud local

```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

---

## 🎨 Setup Frontend

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Configuration

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Adresse du contrat déployé
NEXT_PUBLIC_CHAIN_ID=31337        # Chain ID (31337 pour Hardhat local)
```

### 3. Lancement

```bash
npm run dev
```

Interface disponible sur `http://localhost:3000`

---

## 🧪 Tests

### Tests Smart Contracts (Hardhat)

```bash
cd contracts
npx hardhat test                 # Tous les tests
npx hardhat test --grep "Max 4"  # Test spécifique
npx hardhat coverage             # Couverture de code
```

### Tests attendus

✅ Mint de billets avec métadonnées IPFS  
✅ Limite de 4 billets par wallet  
✅ Cooldown de 5 minutes entre transactions  
✅ Lock de 10 minutes après achat  
✅ Revente max +20% du prix initial  
✅ Un seul transfert autorisé  
✅ Validation et burn du billet  

---

## 🚀 Déploiement

### Testnet (Sepolia)

1. Configurer `.env` :

```env
PRIVATE_KEY=votre_clé_privée
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

2. Déployer :

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

## 🔀 Workflow Git

### Branches

- `main` : Production (protected)
- `dev` : Intégration (protected)
- `feat/*` : Features individuelles

### Règles

1. **Jamais de push direct sur `main` ou `dev`**
2. **Une feature = une branche**
3. **Pull Request obligatoire** avec description
4. **Tests passants** avant merge

### Exemple de workflow

```bash
# Créer une branche feature
git checkout dev
git pull origin dev
git checkout -b feat/contracts-resale-logic

# Développer...
git add .
git commit -m "feat(contracts): add resale marketplace logic"

# Pousser et créer une PR
git push -u origin feat/contracts-resale-logic
# Créer la PR sur GitHub : feat/contracts-resale-logic → dev
```

### Conventions de commit

```
feat(scope): description courte
fix(scope): correction de bug
test(scope): ajout de tests
docs(scope): documentation
chore(scope): configuration/maintenance
```

---

## 📜 Règles Métier

### Tokenisation (4 niveaux)

| Type       | Prix | Description              |
|------------|------|--------------------------|
| EARLY_BIRD | 0.08 ETH | Achat anticipé      |
| STANDARD   | 0.10 ETH | Places générales    |
| PREMIUM    | 0.15 ETH | Meilleures places   |
| VIP        | 0.25 ETH | Front row + backstage |

### Contraintes Techniques

| Contrainte | Implémentation | Justification |
|------------|----------------|---------------|
| **Max 4 billets/personne** | `balanceOf() < 4` | Anti-scalping |
| **Cooldown 5 min** | `lastTx + 5 minutes` | Anti-spam/bot |
| **Lock 10 min post-achat** | `purchaseTime + 10 min` | Anti-flip immédiat |
| **1 seul transfert** | `transferCount[id] < 1` | Limite spéculation |
| **Prix max +20%** | `price ≤ initial × 1.2` | Contrôle revente |

### Métadonnées IPFS

```json
{
  "name": "Concert Coldplay - VIP A-45",
  "type": "VIP",
  "value": "250 EUR",
  "hash": "QmX7K8PqR...",
  "eventDetails": {
    "venue": "Stade de France",
    "date": "2026-06-15T20:00:00Z",
    "seatNumber": "A-45"
  },
  "qrCode": "ipfs://QmQR...",
  "previousOwners": ["0x742d35...", "0x8626f6..."],
  "createdAt": "1704672000",
  "lastTransferAt": "1704758400"
}
```

---

## 📊 API Smart Contract

### Fonctions Principales

```solidity
// Achat initial
buyTicket(TicketType ticketType, string tokenURI) payable
→ Retourne: uint256 tokenId
→ Events: TicketPurchased(buyer, tokenId, ticketType, price)

// Mise en vente
listForResale(uint256 tokenId, uint256 price)
→ Events: TicketListed(seller, tokenId, price)

// Achat revente
buyResale(uint256 listingId) payable
→ Events: TicketResold(from, to, tokenId, price)

// Validation entrée
validateAndBurn(uint256 tokenId)
→ Events: TicketValidated(tokenId, validator)
```

### Fonctions de Vue

```solidity
getTicketPrice(TicketType) → uint256
canTransact(address) → bool
canTransfer(uint256) → bool
getListing(uint256) → Listing
```

---

## 👥 Équipe & Répartition

| Développeur | Responsabilité |
|-------------|----------------|
| **Fat** | Smart contracts, Tests, Déploiement |
| **Giovanna** | Frontend, IPFS, Intégration Web3 |

---

## 🔗 Ressources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [Next.js Documentation](https://nextjs.org/docs)
- [IPFS Pinata](https://www.pinata.cloud/)

---

## 📝 License

MIT
