import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { CreditCard, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/checkout/$gigId")({
  head: () => ({
    meta: [
      { title: "Checkout — EARNGEN-AI" },
      { name: "description", content: "Instant payment processing for your skill exchange." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { gigId } = Route.useParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mockGig = {
    title: "React Native Performance Optimization",
    provider: "Alice Developer",
    amount: 5000,
    platformFee: 150,
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate Stripe processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <Shell>
        <RequireAuth>
          <div className="max-w-xl mx-auto mt-12 fade-up">
            <Card className="p-8 text-center border-brand/20 bg-brand/5">
              <CheckCircle2 className="size-16 text-brand mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Your instant payment of ₹{(mockGig.amount + mockGig.platformFee).toLocaleString()} has been securely processed and sent to {mockGig.provider}.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => navigate({ to: "/nda/" + gigId })}
                  className="bg-brand text-brand-foreground px-5 py-2.5 rounded-lg font-semibold hover:brightness-105 transition"
                >
                  Proceed to NDA
                </button>
                <button 
                  onClick={() => navigate({ to: "/" })}
                  className="bg-background text-foreground ring-1 ring-border px-5 py-2.5 rounded-lg font-semibold hover:bg-muted transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </Card>
          </div>
        </RequireAuth>
      </Shell>
    );
  }

  return (
    <Shell>
      <RequireAuth>
        <div className="max-w-2xl mx-auto fade-up">
          <header className="mb-8">
            <div className="flex items-center gap-2 text-brand font-semibold mb-2">
              <Zap className="size-5 fill-current" /> Instant Payments
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Secure Checkout</h1>
            <p className="text-muted-foreground mt-2">
              Complete your payment for gig <span className="font-mono text-foreground">{gigId}</span>
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 h-fit order-2 md:order-1">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="size-5 text-muted-foreground" /> Payment Details
              </h3>
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Cardholder Name</span>
                  <input type="text" placeholder="John Doe" className="w-full mt-1.5 flex items-center gap-2 rounded-lg ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-brand px-3 py-2 text-sm focus:outline-none" />
                </label>
                
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Card Number</span>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full mt-1.5 pl-9 rounded-lg ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-brand px-3 py-2 text-sm focus:outline-none" />
                  </div>
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Expiry Date</span>
                    <input type="text" placeholder="MM/YY" className="w-full mt-1.5 rounded-lg ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-brand px-3 py-2 text-sm focus:outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">CVC</span>
                    <input type="password" placeholder="123" className="w-full mt-1.5 rounded-lg ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-brand px-3 py-2 text-sm focus:outline-none" />
                  </label>
                </div>

                <div className="pt-4 border-t border-border">
                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-foreground text-background py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-foreground/90 transition"
                  >
                    {isProcessing ? "Processing..." : `Pay ₹${(mockGig.amount + mockGig.platformFee).toLocaleString()}`}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="size-3" /> Secured by Stripe
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-muted/30 border-muted order-1 md:order-2 h-fit">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gig Title</span>
                  <span className="font-medium text-right max-w-[150px] truncate">{mockGig.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">{mockGig.provider}</span>
                </div>
                
                <hr className="border-border my-2" />
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{mockGig.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>₹{mockGig.platformFee.toLocaleString()}</span>
                </div>
                
                <hr className="border-border my-2" />
                
                <div className="flex justify-between text-base font-bold">
                  <span>Total Due</span>
                  <span>₹{(mockGig.amount + mockGig.platformFee).toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </RequireAuth>
    </Shell>
  );
}
