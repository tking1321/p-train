# P-Train

A two-sided personal trainer marketplace connecting clients with certified trainers for in-person and online sessions.

## Features

### For Clients
- **Find Trainers**: Search and filter trainers by location, specialty, price, and availability
- **Book Sessions**: Book one-time sessions or recurring packages
- **Direct Messaging**: Communicate with trainers before and after booking
- **Secure Payments**: Pay safely through the platform (Stripe integration)

### For Trainers
- **Dashboard**: Manage your training business with analytics
- **Create Listings**: Offer single sessions, monthly coaching, or custom packages
- **Availability Calendar**: Set your weekly schedule and block off dates
- **Accept Bookings**: Review and confirm client requests
- **Client Management**: Track clients and session history

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (already configured)
- Stripe account (for payments)

### Installation

```bash
npm install
npm run dev
```

### Mobile App

Build for iOS and Android:
```bash
npm run setup:native
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for App Store submission guide.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Mobile**: Capacitor 8
- **Payments**: Stripe (Connect + Checkout)

## Architecture

### Database Schema

- **profiles**: Users with role (client/trainer)
- **trainer_profiles**: Extended trainer info (specialties, certifications, service radius)
- **listings**: Training services offered
- **bookings**: Session bookings with status tracking
- **messages**: Real-time messaging
- **conversations**: Message threads between clients and trainers
- **availability**: Weekly schedules for trainers
- **payments**: Transaction records with platform fees

### Role-Based Access

- **Client Dashboard**: `/dashboard` - Upcoming sessions, messages, saved trainers
- **Trainer Dashboard**: `/trainer` - Bookings, earnings, availability, listings

## Payments

The platform uses a **15% commission** model:

- Platform takes 15% of each transaction
- Trainers receive 85% automatically
- Stripe Connect handles trainer payouts

### Setting Up Stripe

To enable payments:

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys from the [Developers section](https://dashboard.stripe.com/apikeys)
3. Configure Stripe Connect for trainer payouts
4. Add your Stripe secret key to the project

See: https://bolt.new/setup/stripe

## Project Structure

```
src/
├── components/     # Shared UI components
├── context/        # Auth and toast contexts
├── lib/            # Supabase client, Capacitor setup
├── pages/
│   ├── client/     # Client-specific pages
│   ├── trainer/    # Trainer-specific pages
│   └── shared/     # Landing, auth, settings
└── data/           # Mock data for development
```

## API Endpoints (via Supabase)

All data access is through Supabase client with RLS policies ensuring:
- Clients can only see their own bookings
- Trainers manage only their listings and availability
- Messages are private between participants

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm test`
4. Submit a pull request

## License

MIT
