
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { stripe } from '@/lib/stripe';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const monthlyPriceId = 'price_1PgUTqB1kXn2Xy9fR5m1N0c1'; // Replace with your actual test price ID
const yearlyPriceId = 'price_1PgUUAB1kXn2Xy9fL2m2o1a1'; // Replace with your actual test price ID

export async function POST(request: Request) {
  try {
    const { plan, userId } = await request.json();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        return new NextResponse('User not found', { status: 404 });
    }

    let customerId = userDoc.data().stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: userDoc.data().email,
            name: userDoc.data().displayName,
            metadata: {
                firebaseUID: userId,
            },
        });
        customerId = customer.id;
    }


    const priceId = plan === 'monthly' ? monthlyPriceId : yearlyPriceId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL as string;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/`,
      cancel_url: `${appUrl}/pricing`,
       metadata: {
          firebaseUID: userId,
          plan: plan,
      }
    });

    if (!session.url) {
      return new NextResponse('Error creating checkout session', { status: 500 });
    }

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
