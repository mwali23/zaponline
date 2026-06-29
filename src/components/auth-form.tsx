"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(event:React.FormEvent){event.preventDefault();setLoading(true);const supabase=createClient();if(!supabase){setMessage("Demo mode is active. Add Supabase keys to enable sign-in.");setLoading(false);return;}const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}});setMessage(error?.message??"Check your email for a secure sign-in link.");setLoading(false);}
  return <form onSubmit={submit} className="form-card"><div className="step-icon" style={{width:58,height:58,margin:"0 0 20px"}}><Mail/></div><h2>Welcome to ZAP</h2><p>Sign in with a secure email link—no password to remember.</p><div className="field"><label htmlFor="email">Email address</label><input id="email" className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div><button className="button button-primary full" style={{marginTop:16}} disabled={loading}>{loading?"Sending…":"Continue with email"}<ArrowRight size={17}/></button>{message&&<div className="notice" role="status">{message}</div>}<small>By continuing you agree to the Terms and Privacy Policy.</small></form>;
}
