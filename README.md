<div align="center">
<img src="./src/assets/qr-code.png" alt="QR Code" width="200" height="200">
</div>




# Connect Now - Secure Video Conferencing Platform

Connect Now is a modern, secure video conferencing application designed for real-time communication. It is built with a robust, modern technology stack and focuses on providing a seamless and secure experience for IT professionals, support teams, and general users.

## ✨ Features

- **Real-Time Communication**: High-quality, low-latency video and audio calls powered by WebRTC.
- **End-to-End Encryption (E2EE)**: All communication is secured to ensure conversations remain private.
- **User Authentication**: Secure sign-up and login system with email/password and Google SSO, managed by Firebase Authentication.
- **Team Sign-in**: A separate, secure login portal for internal support staff.
- **Admin Dashboard**: A protected dashboard for authorized team members to manage users and their subscription plans.
- **Subscription Tiers**: Monthly and Yearly subscription plans integrated with Stripe for seamless checkout.
- **Custom Domain**: A premium feature for yearly subscribers to use their own domain for meeting links.
- **Screen Sharing**: High-quality remote desktop screen sharing, essential for technical support and presentations.
- **In-Call Chat**: Secure text-based messaging within a video call.
- **Responsive Design**: A mobile-first UI with a hamburger menu ensures a great user experience on any device.
- **Zero-Friction Access**: Users can join rooms via a simple link without needing to download or install any software.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore for database, Firebase Authentication for users)
- **Real-time Engine**: WebRTC for peer-to-peer connections.
- **Payments**: [Stripe](https://stripe.com/) for handling subscriptions.
- **Deployment**: Configured for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- `npm` or your preferred package manager

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of your project and add the necessary environment variables. You will need keys from both Firebase and Stripe.

    ```sh
    # Firebase Configuration (from your Firebase project settings)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    # ... add other Firebase config values

    # Stripe Configuration (from your Stripe dashboard)
    STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key
    STRIPE_MONTHLY_PRICE_ID="price_..." # Price ID for the monthly plan
    STRIPE_YEARLY_PRICE_ID="price_..." # Price ID for the yearly plan

    # Application URL
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Update Firebase Configuration:**

    Ensure the Firebase configuration object in `src/lib/firebase.ts` matches the one from your Firebase project.

### Running the Development Server

Once the installation is complete, you can start the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 Building for Production

To create an optimized production build, run:

```sh
npm run build
```

This will prepare your application for deployment.
