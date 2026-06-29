export type PaymentProvider = "stripe" | "mobile_money" | "bank" | "manual";
export type CheckoutPurpose = "marketplace_order" | "impact_donation";

export interface CheckoutRequest { purpose:CheckoutPurpose; internalId:string; amountMinor:number; currency:string; customerEmail?:string }
export interface CheckoutResult { provider:PaymentProvider; externalReference:string; redirectUrl:string }

// New local payment rails should implement this interface rather than leaking
// provider-specific fields throughout the marketplace domain.
export interface PaymentGateway {
  createCheckout(input:CheckoutRequest):Promise<CheckoutResult>;
  verifyWebhook(payload:string,signature:string):Promise<{eventId:string;type:string;internalId?:string}>;
}
