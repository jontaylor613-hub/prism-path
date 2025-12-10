# Paywall Activation Guide

This document explains how to activate the payment system when you're ready to monetize PrismPath.

## 📋 Current Status

**Payment System:** Currently **DISABLED** (free trial mode active)  
**Free Trial:** Users get 1 full Accommodation Assistant session per IP address  
**Authentication:** Firebase Auth is set up and ready  
**Subscription System:** Code is ready, just needs activation

## ✅ What's Already Built

1. **Subscription Service** (`src/subscription.js`)
   - Tier definitions (Free, Basic, Pro, Enterprise)
   - Feature flags per tier
   - User subscription checking
   - Ready for Stripe integration

2. **User Profile System** (`src/auth.js`)
   - Firebase user documents
   - Ready to store subscription data

3. **Usage Tracking** (`src/gemUsageTracker.js`)
   - IP-based tracking for free users
   - Can be upgraded to check subscription status

## 🚀 Steps to Activate Paywall

### Step 1: Set Up Stripe Account

1. Create a Stripe account at https://stripe.com
2. Get your API keys:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
3. Set up webhook endpoint (we'll create this)

### Step 2: Install Stripe Dependencies

```bash
npm install @stripe/stripe-js stripe
```

### Step 3: Create Stripe Products & Prices

In Stripe Dashboard:
1. Go to **Products** → **Add Product**
2. Create products for each tier:
   - **Basic Plan**: $9.99/month
   - **Pro Plan**: $24.99/month
   - **Enterprise**: Contact for custom pricing

3. Copy the **Price IDs** (starts with `price_`)

### Step 4: Update Environment Variables

Add to `.env` and Vercel:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 5: Create Stripe Checkout API Route

Create `prism-path/api/stripe/checkout.js`:

```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/educator?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/educator`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Step 6: Create Stripe Webhook Handler

Create `prism-path/api/stripe/webhook.js`:

```javascript
import Stripe from 'stripe';
import { SubscriptionService } from '../../src/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
    
    // Map Stripe price to tier
    const priceId = subscription.items.data[0].price.id;
    const tier = mapPriceIdToTier(priceId); // You'll need to implement this
    
    // Update user subscription
    await SubscriptionService.updateSubscription(userId, {
      tier: tier,
      status: 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id
    });
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    // Update subscription status
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    // Cancel subscription
  }

  res.json({ received: true });
}

function mapPriceIdToTier(priceId) {
  // Map your Stripe price IDs to subscription tiers
  // This should match what you set up in Stripe Dashboard
  const priceMap = {
    'price_basic_monthly': 'basic',
    'price_pro_monthly': 'pro',
    // Add your actual price IDs here
  };
  return priceMap[priceId] || 'free';
}
```

### Step 7: Enable Payment System

In `src/subscription.js`, change:

```javascript
const PAYMENT_SYSTEM_ENABLED = true; // Change from false to true
```

### Step 8: Update Usage Checks

Update `src/App.jsx` to check subscriptions:

```javascript
import { SubscriptionService } from './subscription';

// In GemRoute component, update the checkUsage function:
const checkUsage = async () => {
  if (devModeActive) {
    setCanUse(true);
    return;
  }

  // If user is logged in, check subscription
  if (user) {
    const canUse = await SubscriptionService.canUseAccommodationAssistant(user.uid);
    setCanUse(canUse);
    return;
  }

  // For non-logged-in users, use IP tracking
  const allowed = await GemUsageTracker.canUseGem();
  setCanUse(allowed);
};
```

### Step 9: Create Pricing Page Component

Create a pricing page that shows:
- Feature comparison
- "Upgrade" buttons that trigger Stripe Checkout
- Current subscription status for logged-in users

### Step 10: Test in Stripe Test Mode

1. Use Stripe test cards: https://stripe.com/docs/testing
2. Test subscription flow end-to-end
3. Verify webhooks are working

## 🔧 Configuration Options

### Subscription Tiers

Edit `src/subscription.js` to customize:
- Tier names and prices
- Feature limits per tier
- What features are included

### Free Trial Period

You can add a trial period by:
1. Setting `trial_period_days` in Stripe checkout
2. Updating subscription status to `trialing`
3. Checking trial status in `canUseAccommodationAssistant`

## 📊 Monitoring

After activation, monitor:
- Stripe Dashboard → Subscriptions
- Stripe Dashboard → Webhooks (check for failures)
- Firebase → Users collection (subscription fields)

## 🎯 Quick Activation Checklist

- [ ] Stripe account created
- [ ] Stripe products/prices created
- [ ] Environment variables added
- [ ] Stripe dependencies installed
- [ ] Checkout API route created
- [ ] Webhook handler created
- [ ] Webhook endpoint configured in Stripe
- [ ] `PAYMENT_SYSTEM_ENABLED = true` in subscription.js
- [ ] Usage checks updated to use subscriptions
- [ ] Pricing page created
- [ ] Tested in Stripe test mode

## 💡 Notes

- The system gracefully falls back to IP-based tracking if payment system is disabled
- All existing free trial logic remains intact
- Users with accounts automatically get subscription checks
- Non-logged-in users still use IP tracking until they sign up


