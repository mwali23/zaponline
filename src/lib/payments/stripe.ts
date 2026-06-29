import Stripe from "stripe";

export function getStripe(){const key=process.env.STRIPE_SECRET_KEY;if(!key||key.includes("placeholder")||key.endsWith("..."))return null;return new Stripe(key);}
