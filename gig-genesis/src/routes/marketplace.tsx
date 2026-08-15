import { createFileRoute } from "@tanstack/react-router";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { ShoppingCart, Star, Gift, Tag, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Rewards Marketplace — EARNGEN-AI" },
      { name: "description", content: "Redeem your earned points for vouchers, brands, and premium features." },
    ],
  }),
  component: Marketplace,
});

const REWARDS = [
  { id: 1, title: "Amazon ₹500 Gift Card", points: 5000, category: "Shopping", icon: ShoppingCart },
  { id: 2, title: "Swiggy ₹250 Voucher", points: 2500, category: "Food", icon: Gift },
  { id: 3, title: "Premium Gig Profile (1 Month)", points: 10000, category: "App Feature", icon: Star },
  { id: 4, title: "Myntra 20% Off Coupon", points: 1500, category: "Fashion", icon: Tag },
  { id: 5, title: "1-on-1 Mentorship Session", points: 8000, category: "Learning", icon: CheckCircle2 },
  { id: 6, title: "Spotify Premium (1 Month)", points: 3000, category: "Entertainment", icon: Gift },
];

function Marketplace() {
  const [userPoints, setUserPoints] = useState(4500); // Mock starting points
  const [redeemed, setRedeemed] = useState<number[]>([]);

  const handleRedeem = (id: number, cost: number) => {
    if (userPoints >= cost) {
      setUserPoints(prev => prev - cost);
      setRedeemed(prev => [...prev, id]);
    } else {
      alert("Not enough points!");
    }
  };

  return (
    <Shell>
      <RequireAuth>
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 fade-up">
          <div>
            <p className="text-sm text-brand font-semibold uppercase tracking-wider">Marketplace</p>
            <h1 className="text-3xl font-semibold tracking-tight mt-2">Redeem Rewards</h1>
            <p className="text-muted-foreground mt-2">
              Exchange your earned points for exciting rewards from top brands.
            </p>
          </div>
          <Card className="p-4 bg-brand/10 border-brand/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-brand text-brand-foreground rounded-full flex items-center justify-center font-bold text-lg">
                <Star className="size-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand">Your Balance</p>
                <p className="text-2xl font-bold font-mono">{userPoints.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 fade-up" style={{ animationDelay: "100ms" }}>
          {REWARDS.map((reward, i) => {
            const Icon = reward.icon;
            const isRedeemed = redeemed.includes(reward.id);
            const canAfford = userPoints >= reward.points;

            return (
              <Card key={reward.id} className={`p-5 flex flex-col justify-between ${isRedeemed ? 'opacity-70' : 'hover:ring-brand/30'} transition`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-12 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center">
                      <Icon className="size-6" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-muted text-muted-foreground">
                      {reward.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{reward.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Redeem this special reward using your hard-earned points.
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5 text-brand font-bold">
                    <Star className="size-4 fill-current" />
                    <span>{reward.points.toLocaleString()} pts</span>
                  </div>
                  <button 
                    disabled={isRedeemed || !canAfford}
                    onClick={() => handleRedeem(reward.id, reward.points)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      isRedeemed 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : canAfford 
                          ? 'bg-foreground text-background hover:bg-foreground/90' 
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {isRedeemed ? "Redeemed ✓" : canAfford ? "Redeem" : "Need more"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </RequireAuth>
    </Shell>
  );
}
