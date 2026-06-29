import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/payments/stripe";

const input=z.object({donationId:z.string().uuid()});
export async function POST(request:Request){
  const stripe=getStripe();const supabase=createAdminClient();if(!stripe||!supabase)return NextResponse.json({error:"Payments are not configured"},{status:503});
  const parsed=input.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"Invalid donation"},{status:400});
  const {data:donation,error}=await supabase.from("donations").select("id,amount_minor,currency,status,impact_projects(title)").eq("id",parsed.data.donationId).single();
  if(error||!donation||donation.status!=="pending")return NextResponse.json({error:"Donation is unavailable"},{status:404});
  const site=process.env.NEXT_PUBLIC_SITE_URL??new URL(request.url).origin;
  const project=Array.isArray(donation.impact_projects)?donation.impact_projects[0]:donation.impact_projects as {title?:string}|null;
  const session=await stripe.checkout.sessions.create({mode:"payment",line_items:[{quantity:1,price_data:{currency:donation.currency.toLowerCase(),unit_amount:donation.amount_minor,product_data:{name:`ZAP Impact: ${project?.title??"Community energy project"}`}}}],success_url:`${site}/impact?donation=success`,cancel_url:`${site}/impact?donation=cancelled`,metadata:{purpose:"impact_donation",donation_id:donation.id}});
  await supabase.from("payments").insert({donation_id:donation.id,provider:"stripe",external_reference:session.id,amount_minor:donation.amount_minor,currency:donation.currency,status:"pending"});
  return NextResponse.json({url:session.url});
}
