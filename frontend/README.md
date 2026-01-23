# Company Brain - Frontend

AI-Powered Internal Knowledge Platform for seamless company knowledge management.

## Tech Stack

- **React** + **TypeScript**
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **React Router** - Routing
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the app.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   ├── auth/        # Authentication components
│   └── dashboard/   # Dashboard components
├── pages/           # Page components
│   ├── admin/       # Admin pages
│   └── employee/    # Employee pages
├── contexts/        # React contexts (Auth, etc.)
├── services/        # API services
├── routes/          # Route configurations
├── hooks/           # Custom React hooks
└── lib/             # Utility functions
```

## Features

- 🔐 Secure authentication
- 📊 Role-based access control (Admin/Employee)
- 💬 AI-powered chat interface
- 📁 Document management
- 📈 Analytics dashboard
- 👥 User management

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## License

MIT
