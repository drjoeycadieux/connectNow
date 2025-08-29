
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
      return NextResponse.json({ error: 'Invalid plan specified' }, { status: 400 });
    }
    
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists() || !userDoc.data()?.email) {
       return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userEmail = userDoc.data()?.email;


    const priceId = plan === 'monthly'
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;
      
    if (!priceId) {
        throw new Error("Stripe Price ID is not configured in environment variables.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/profile?payment=success`,
      cancel_url: `${appUrl}/pricing?payment=cancelled`,
      metadata: {
        userId,
        plan,
      }
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
