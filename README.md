# RFQ System with British Auction

A simple RFQ (Request for Quotation) system where suppliers bid against each other in a **British Auction** (reverse auction - lowest price wins).
If bidding happens close to the end, the auction gets **extended automatically**, but it can never go beyond the **forced close time**.

Built with the **MERN stack** - React frontend and Express backend run as two separate services and talk over REST + Socket.io.

## Features

- Create RFQ with British Auction config (trigger window X, extension Y, trigger type)
- Suppliers submit quotes (freight, origin, destination charges, transit time, validity)
- Live ranking L1, L2, L3... (one row per supplier, their latest bid)
- Auto extension with 3 trigger types:
  - Bid received in last X minutes
  - Any supplier rank change in last X minutes
  - Lowest bidder (L1) change in last X minutes
- Extension is always capped at forced close time
- Auction status: Upcoming / Active / Closed / Force Closed
- Activity log with bid submissions, extensions and reason for each extension
- Real time updates on all open screens using Socket.io (no refresh needed)

## Tech Stack

| Part      | Tech                                         |
| --------- | -------------------------------------------- |
| Frontend  | React 19, Vite, React Router, Axios, socket.io-client |
| Backend   | Node.js, Express 5, Mongoose, Socket.io      |
| Database  | MongoDB Atlas                                |

## HLD and Schema Diagrams

Animated diagrams are in the `docs` folder. Download / clone the repo and open them in a browser:

- `docs/architecture.html` - architecture, bid request flow, extension demo
- `docs/schema.html` - collections, relations, indexes, sample documents

Quick view of the same:

```mermaid
flowchart LR
    subgraph Frontend [React App - Vite]
        A[Auction List]
        B[Create RFQ]
        C[Auction Details + Bid Form]
    end

    subgraph Backend [Express Server]
        R[Routes] --> M[Middleware<br/>validation]
        M --> CT[Controllers]
        CT --> H[auctionHelper<br/>status, ranking, extension]
        S[Socket.io]
    end

    DB[(MongoDB Atlas<br/>rfqs, bids, activitylogs)]

    Frontend -- REST / JSON --> R
    CT -- Mongoose --> DB
    CT --> S
    S -- auction-updated / rfq-list-updated --> Frontend
```

```mermaid
erDiagram
    RFQS ||--o{ BIDS : has
    RFQS ||--o{ ACTIVITYLOGS : has

    RFQS {
        ObjectId _id PK
        string referenceId UK
        string name
        date pickupDate
        date bidStartTime
        date bidCloseTime "original, never changes"
        date currentCloseTime "moves on extension"
        date forcedCloseTime "hard limit"
        number triggerWindowMinutes "X"
        number extensionMinutes "Y"
        string extensionTrigger
        number extensionCount
        number totalBids
        number lowestBid
    }

    BIDS {
        ObjectId _id PK
        ObjectId rfq FK
        string carrierName
        number freightCharges
        number originCharges
        number destinationCharges
        number totalAmount
        number transitTimeDays
        date quoteValidity
        date createdAt
    }

    ACTIVITYLOGS {
        ObjectId _id PK
        ObjectId rfq FK
        string type "RFQ_CREATED, BID_PLACED, TIME_EXTENDED"
        string message
        date oldCloseTime
        date newCloseTime
        string reason
        date createdAt
    }
```

## Folder Structure

```
rfq-british-auction/
├── backend/
│   ├── config/db.js              # mongodb connection
│   ├── models/                   # Rfq, Bid, ActivityLog schemas
│   ├── routes/rfqRoutes.js       # all /api/rfqs routes
│   ├── controllers/              # rfqController, bidController
│   ├── middleware/               # validation + error handler
│   ├── utils/auctionHelper.js    # status, ranking and extension logic
│   ├── tests/                    # tests for auction logic
│   ├── socket.js                 # socket.io setup
│   ├── seed.js                   # demo data
│   └── server.js                 # entry point
├── frontend/
│   └── src/
│       ├── pages/                # AuctionList, CreateRfq, AuctionDetails
│       ├── components/           # BidForm, RankingTable, ActivityLog, Countdown...
│       ├── api.js                # axios calls
│       └── socket.js             # socket.io client
└── docs/                         # HLD and schema diagrams
```

## How to Run

You need Node.js 18+ and a MongoDB connection string (free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) works).

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env      # then put your MONGO_URI in .env
npm run seed              # optional - adds demo auctions
npm run dev               # runs on http://localhost:8000
```

**2. Frontend** (new terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev               # runs on http://localhost:5173
```

**3. Tests** (auction logic)

```bash
cd backend
npm test
```

### Environment variables

`backend/.env`

| Name       | Example                         |
| ---------- | ------------------------------- |
| PORT       | 8000                            |
| MONGO_URI  | mongodb+srv://user:pass@cluster0.xxx.mongodb.net/rfq_auction |
| CLIENT_URL | http://localhost:5173           |

`frontend/.env`

| Name         | Example               |
| ------------ | --------------------- |
| VITE_API_URL | http://localhost:8000 |

## API

Base URL: `http://localhost:8000/api`

| Method | Endpoint          | What it does |
| ------ | ----------------- | ------------ |
| GET    | `/rfqs`           | List all auctions with status, lowest bid, close times |
| POST   | `/rfqs`           | Create RFQ (British Auction) |
| GET    | `/rfqs/:id`       | Auction details - rfq, ranking, all bids, activity log |
| POST   | `/rfqs/:id/bids`  | Place a bid (may extend the auction) |

**Create RFQ body**

```json
{
  "name": "Mumbai to Delhi - 20ft Container",
  "pickupDate": "2026-10-30",
  "bidStartTime": "2026-10-27T17:00:00.000Z",
  "bidCloseTime": "2026-10-27T18:00:00.000Z",
  "forcedCloseTime": "2026-10-27T18:20:00.000Z",
  "triggerWindowMinutes": 10,
  "extensionMinutes": 5,
  "extensionTrigger": "BID_RECEIVED"
}
```

`extensionTrigger` can be `BID_RECEIVED`, `ANY_RANK_CHANGE` or `L1_RANK_CHANGE`.

**Place bid body**

```json
{
  "carrierName": "BlueDart Logistics",
  "freightCharges": 40000,
  "originCharges": 2500,
  "destinationCharges": 2000,
  "transitTimeDays": 4,
  "quoteValidity": "2026-11-15"
}
```

**Socket events** (server → client)

| Event              | Sent to              | When |
| ------------------ | -------------------- | ---- |
| `auction-updated`  | room of that RFQ id  | new bid / extension on that auction |
| `rfq-list-updated` | everyone             | RFQ created or any bid placed |

Client sends `join-auction` / `leave-auction` with the RFQ id when it opens / closes the details page.

## Auction Rules (how I implemented them)

- **Status** is calculated from time, not stored:
  - now < start → `Upcoming`
  - now < currentCloseTime → `Active`
  - closed and close time reached forced close → `Force Closed`
  - otherwise → `Closed`
- **Ranking**: take the latest bid of each supplier, sort by total amount (freight + origin + destination). Same price → who bid first stays ahead.
- A supplier can only **lower** their own price. Higher or same bid is rejected.
- **Trigger window**: bid time is between `currentCloseTime - X` and `currentCloseTime`.
- **Rank change**: some supplier who already had a rank is now at a different position (a new supplier joining at the bottom does not count).
- **L1 change**: the lowest bidder is a different supplier than before.
- **Extension**: `newClose = min(currentCloseTime + Y, forcedCloseTime)`. Once close time reaches forced close no more extensions happen.
- If two bids come at the exact same time, the close time is updated with a condition (`currentCloseTime` must still be the old value), so the auction is not extended twice for the same close time.

## Deployment

- Backend on **Render** (Web Service, root directory `backend`, build `npm install`, start `npm start`)
- Frontend on **Vercel** (root directory `frontend`, `vercel.json` sends all routes to `index.html`)
- Database on **MongoDB Atlas**

Render free plan sleeps after 15 min without requests. To avoid the slow first request, the server pings its own url every 10 min (`utils/keepAlive.js`). It only runs on Render, because it uses the `RENDER_EXTERNAL_URL` variable that Render sets.

## Assumptions

- No login. Supplier is identified by carrier name typed in the bid form.
- All prices are in INR.
- Times are stored in UTC and shown in the browser's local time.

## Things I would add with more time

- Login with roles (buyer / supplier) and hide other suppliers' names from suppliers
- Use a queue or lock per RFQ (Redis) so bids on the same auction are processed one by one
- Pagination on listing page
- A background job to send "auction closed" notification
- More tests (API tests with supertest)
