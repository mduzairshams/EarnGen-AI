import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { useAppState } from "@/lib/store";
import { Award, Gift, ArrowLeft, Copy, CheckCircle2, Sparkles, Pizza, ShoppingBag, Music, Coffee, Tv, Flame } from "lucide-react";

export const Route = createFileRoute("/redeem")({
  head: () => ({
    meta: [
      { title: "Redeem Rewards — EARNGEN-AI" },
      { name: "description", content: "Redeem your skill sprint reward points for exclusive brand discounts and premium vouchers." },
    ],
  }),
  component: RedeemPage,
});

type RewardItem = {
  id: string;
  brand: string;
  description: string;
  pointsCost: number;
  promoCode: string;
  colorClass: string;
  icon: any;
};

function RedeemPage() {
  const { state, deductPoints } = useAppState();
  const [successReward, setSuccessReward] = useState<RewardItem | null>(null);
  const [copied, setCopied] = useState(false);

  const balance = state.rewardPoints ?? 0;

  const rewards: RewardItem[] = [
    {
      id: "zomato-20",
      brand: "Zomato",
      description: "20% OFF on food orders up to ₹100",
      pointsCost: 2000,
      promoCode: "ZOMATO20-SKILL",
      colorClass: "from-red-500/10 to-red-600/10 border-red-500/20 text-red-600 dark:text-red-400",
      icon: Pizza,
    },
    {
      id: "amazon-100",
      brand: "Amazon",
      description: "₹100 Gift Voucher for shopping",
      pointsCost: 1000,
      promoCode: "AMZN100-SYNCS",
      colorClass: "from-amber-500/10 to-amber-600/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
      icon: ShoppingBag,
    },
    {
      id: "spotify-premium",
      brand: "Spotify",
      description: "1 Month of Spotify Premium Free",
      pointsCost: 1500,
      promoCode: "SPOTIFY-GENESIS",
      colorClass: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      icon: Music,
    },
    {
      id: "swiggy-delivery",
      brand: "Swiggy",
      description: "Free Delivery Voucher on food orders",
      pointsCost: 800,
      promoCode: "SWIGGY-FREESHIP",
      colorClass: "from-orange-500/10 to-orange-600/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
      icon: Pizza,
    },
    {
      id: "netflix-15",
      brand: "Netflix",
      description: "15% OFF on monthly subscription plan",
      pointsCost: 2500,
      promoCode: "NETFLIX15-EARN",
      colorClass: "from-rose-600/10 to-rose-700/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
      icon: Tv,
    },
    {
      id: "starbucks-coffee",
      brand: "Starbucks",
      description: "Free Size Upgrade on any beverage",
      pointsCost: 1200,
      promoCode: "STARBUCKS-UPGRADE",
      colorClass: "from-teal-600/10 to-teal-700/10 border-teal-500/20 text-teal-600 dark:text-teal-400",
      icon: Coffee,
    },
  ];

  const handleClaim = (reward: RewardItem) => {
    if (balance < reward.pointsCost) return;
    
    // Deduct the points in state
    deductPoints(reward.pointsCost);
    
    // Show success dialog
    setSuccessReward(reward);
    setCopied(false);
  };

  const handleCopyCode = () => {
    if (!successReward) return;
    navigator.clipboard.writeText(successReward.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Shell>
      <RequireAuth>
        <header className="mb-8 fade-up">
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-widest">Earner Benefits</p>
              <h1 className="text-3xl font-semibold tracking-tight mt-1">Redeem Rewards</h1>
            </div>
          </div>

          {/* Gamified Points HUD Banner */}
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-brand to-brand-light text-brand-foreground shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 size-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="size-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Gift className="size-7 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white tracking-tight">Reward Center</h3>
                <p className="text-xs text-white/80 mt-0.5">Diligence pays off. Exchange points for exclusive premium savings!</p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-6 py-3.5 flex flex-col items-center sm:items-end justify-center self-start sm:self-auto shrink-0 relative z-10 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">Available Balance</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-white tracking-tight">{balance.toLocaleString()}</span>
                <span className="text-white/80 font-bold text-xs uppercase">PTS</span>
              </div>
            </div>
          </div>
        </header>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const hasEnough = balance >= reward.pointsCost;
            const pct = Math.min(100, Math.round((balance / reward.pointsCost) * 100));
            const deficit = reward.pointsCost - balance;

            return (
              <Card
                key={reward.id}
                className={`p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
                  hasEnough
                    ? "ring-1 ring-brand/10 hover:ring-brand/30 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1"
                    : "opacity-80"
                }`}
              >
                <div>
                  {/* Card Header Badge */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br border ${reward.colorClass}`}>
                      <reward.icon className="size-6" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Cost</span>
                      <span className="text-lg font-black text-foreground tracking-tight">{reward.pointsCost.toLocaleString()} PTS</span>
                    </div>
                  </div>

                  {/* Brand & Detail */}
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{reward.brand}</h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[40px] leading-relaxed text-pretty">
                    {reward.description}
                  </p>
                </div>

                {/* Progress / Actions block */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  {!hasEnough ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span className="text-brand uppercase tracking-wider">{pct}% Completed</span>
                        <span className="text-muted-foreground">{deficit.toLocaleString()} PTS needed</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-brand/60 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <button
                        disabled
                        className="w-full py-3 rounded-xl bg-muted text-muted-foreground text-xs font-bold cursor-not-allowed select-none"
                      >
                        Insufficient Points
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaim(reward)}
                      className="w-full py-3 rounded-xl bg-brand text-brand-foreground shadow-md group-hover:shadow-brand/20 text-xs font-bold hover:opacity-95 hover:scale-102 active:scale-98 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="size-3.5 text-white/95" /> Redeem Now
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Claim Success Overlay Modal */}
        {successReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md select-none">
            <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl relative overflow-hidden fade-up animate-rocket-rumble-once">
              {/* Confetti details */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand via-yellow-500 to-brand-light" />

              <div className="text-center flex flex-col items-center mt-4">
                <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                  <CheckCircle2 className="size-10" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">Reward Claimed!</h2>
                <p className="text-sm text-muted-foreground mt-2 text-pretty px-4">
                  You have successfully redeemed **{successReward.pointsCost.toLocaleString()} PTS** for the **{successReward.brand}** savings code!
                </p>

                {/* Promo Code Box */}
                <div className="w-full mt-6 p-4 rounded-2xl bg-muted/60 border border-border/80 flex flex-col items-center justify-center gap-2 relative">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Exclusive Savings Code</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-lg font-black text-brand tracking-widest bg-background border border-border px-4 py-1.5 rounded-xl uppercase">
                      {successReward.promoCode}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="p-2.5 rounded-xl bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title="Copy promo code"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                  {copied && (
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 animate-pulse">
                      ✓ Copied to clipboard!
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground mt-4 italic leading-normal">
                  Apply this code during checkout on the official {successReward.brand} application to unlock your savings!
                </p>

                <button
                  onClick={() => setSuccessReward(null)}
                  className="mt-6 w-full py-3 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-95 active:scale-98 transition-all cursor-pointer"
                >
                  Back to Rewards
                </button>
              </div>
            </div>
          </div>
        )}
      </RequireAuth>
    </Shell>
  );
}
