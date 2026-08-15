import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { MapPin, Navigation, User, Star, Award, Loader2 } from "lucide-react";

const MapComponent = lazy(() => import("@/components/MapComponent"));

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Skills Nearby — EARNGEN-AI" },
      { name: "description", content: "Find skilled people in real time in your surroundings." },
    ],
  }),
  component: ExploreSkills,
});

// Mock nearby users
const MOCK_USERS = [
  { id: 1, name: "Alice", skill: "React Developer", lat: 12.9715987, lng: 77.5945627, distance: "1.2 km", rating: 4.8, rate: "₹500/hr" },
  { id: 2, name: "Rahul", skill: "Graphic Designer", lat: 12.9785987, lng: 77.5995627, distance: "2.5 km", rating: 4.5, rate: "₹300/hr" },
  { id: 3, name: "Sneha", skill: "Content Writer", lat: 12.9615987, lng: 77.5845627, distance: "3.1 km", rating: 4.9, rate: "₹400/hr" },
];

function ExploreSkills() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState(MOCK_USERS);
  const [isMounted, setIsMounted] = useState(false);

  const locateUser = () => {
    setIsLocating(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation([lat, lng]);
          setIsLocating(false);
          
          // Generate nearby users based on current location for demo purposes
          setNearbyUsers(MOCK_USERS.map((u, i) => ({
            ...u,
            lat: lat + (Math.random() - 0.5) * 0.05,
            lng: lng + (Math.random() - 0.5) * 0.05,
          })));
        },
        (err) => {
          setError("Location access denied or unavailable.");
          setIsLocating(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    // Try to locate on mount
    locateUser();
  }, []);

  return (
    <Shell>
      <RequireAuth>
        <header className="mb-8 fade-up">
          <p className="text-sm text-brand font-semibold uppercase tracking-wider">Real-Time Discovery</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">Find Skills Nearby</h1>
          <p className="text-muted-foreground mt-2">
            Discover and connect with skilled professionals in your surroundings.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6 fade-up" style={{ animationDelay: "100ms" }}>
          {/* Map Section */}
          <div className="lg:col-span-2 bg-card rounded-xl overflow-hidden ring-1 ring-border min-h-[500px] relative">
            {location && isMounted ? (
              <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[500px]"><Loader2 className="size-8 animate-spin text-brand" /></div>}>
                <MapComponent location={location} nearbyUsers={nearbyUsers} />
              </Suspense>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MapPin className="size-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Location Required</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  To find skilled people near you, we need access to your location. This data is only used for matching.
                </p>
                <button 
                  onClick={locateUser}
                  disabled={isLocating}
                  className="bg-brand text-brand-foreground px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:brightness-105 transition disabled:opacity-50"
                >
                  <Navigation className="size-4" />
                  {isLocating ? "Locating..." : "Enable Location"}
                </button>
                {error && <p className="text-destructive text-sm mt-4">{error}</p>}
              </div>
            )}
          </div>

          {/* List Section */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="size-5 text-brand" /> Professionals Near You
            </h3>
            {location ? (
              <div className="space-y-3">
                {nearbyUsers.map((user, i) => (
                  <Card key={user.id} className="p-4 hover:ring-brand/50 transition cursor-pointer fade-up" style={{ animationDelay: `${200 + i * 50}ms` }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">{user.skill}</p>
                      </div>
                      <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        {user.distance}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium mt-3">
                      <span className="flex items-center gap-1"><Star className="size-3 text-yellow-500 fill-yellow-500" /> {user.rating}</span>
                      <span className="flex items-center gap-1"><Award className="size-3 text-brand" /> {user.rate}</span>
                    </div>
                    <button className="w-full mt-4 text-sm font-semibold ring-1 ring-border py-1.5 rounded-md hover:bg-muted transition">
                      Request Gig
                    </button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                <p className="text-sm">Enable location to see professionals around you.</p>
              </Card>
            )}
          </div>
        </div>
      </RequireAuth>
    </Shell>
  );
}
