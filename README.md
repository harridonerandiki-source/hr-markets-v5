# HR Markets V5

A **demo-only** broker platform starter for deployment on Render.

## Deploy
1. Create a Render PostgreSQL database.
2. Run `schema.sql` against that database.
3. Create a Render Web Service from this GitHub repository.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add the `DATABASE_URL` environment variable from the Render Postgres connection details.

## Important
This project is not a licensed brokerage system and does not process real customer money or execute live FX orders. Before any real-money launch, add proper authentication/session security, KYC/AML, audit controls, payment segregation, risk management, market-data/execution infrastructure, monitoring, backups, and obtain the required regulatory approvals/licences.
