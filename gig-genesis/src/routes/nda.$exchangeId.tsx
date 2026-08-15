import { createFileRoute, useParams } from "@tanstack/react-router";
import { Shell, Card } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { ShieldCheck, Download, AlertTriangle } from "lucide-react";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useDisplayUser } from "@/lib/useDisplayUser";

export const Route = createFileRoute("/nda/$exchangeId")({
  head: () => ({
    meta: [
      { title: "Sign NDA — EARNGEN-AI" },
      { name: "description", content: "Review and sign your Non-Disclosure Agreement." },
    ],
  }),
  component: NDASignature,
});

function NDASignature() {
  const { exchangeId } = Route.useParams();
  const me = useDisplayUser();
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [isSigned, setIsSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }
    
    // In a real app, upload this dataURL to Supabase Storage
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
    console.log("Signature saved:", dataURL);
    setIsSigned(true);
  };

  return (
    <Shell>
      <RequireAuth>
        <div className="max-w-3xl mx-auto">
          <header className="mb-8 text-center fade-up">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-brand/10 text-brand mb-4">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Non-Disclosure Agreement</h1>
            <p className="text-muted-foreground mt-2">
              Exchange ID: <span className="font-mono text-foreground">{exchangeId}</span>
            </p>
          </header>

          <Card className="p-6 md:p-10 mb-8 fade-up" style={{ animationDelay: "100ms" }}>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <h2 className="text-foreground">1. Confidential Information</h2>
              <p>
                The "Confidential Information" to be disclosed under this Agreement is described as proprietary technical, financial, and business information relating to the project discussed on the EARNGEN-AI platform.
              </p>
              
              <h2 className="text-foreground">2. Obligations of Receiving Party</h2>
              <p>
                The Receiving Party shall hold and maintain the Confidential Information in strictest confidence for the sole and exclusive benefit of the Disclosing Party.
              </p>

              <h2 className="text-foreground">3. Time Periods</h2>
              <p>
                The nondisclosure provisions of this Agreement shall survive the termination of this Agreement and Receiving Party's duty to hold Confidential Information in confidence shall remain in effect until the Confidential Information no longer qualifies as a trade secret.
              </p>

              <div className="p-4 bg-muted/50 rounded-lg border border-border mt-6 flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs m-0">
                  By signing this document, you are entering into a legally binding contract. Ensure you have read and understood all terms before proceeding.
                </p>
              </div>
            </div>

            <hr className="my-8 border-border" />

            {!isSigned ? (
              <div className="space-y-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="size-5 rounded border-input bg-background text-brand focus:ring-brand"
                  />
                  <span className="text-sm font-medium">I have read and agree to the terms outlined in this NDA.</span>
                </label>

                <div className={agreed ? "opacity-100" : "opacity-50 pointer-events-none transition-opacity"}>
                  <p className="text-sm font-semibold mb-2">Draw your signature below:</p>
                  <div className="border border-border rounded-lg bg-background overflow-hidden relative">
                    <SignatureCanvas 
                      ref={sigCanvas} 
                      canvasProps={{ className: "w-full h-[200px] cursor-crosshair" }} 
                      backgroundColor="transparent"
                      penColor="hsl(var(--foreground))"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <button onClick={clearSignature} className="text-sm text-muted-foreground hover:text-foreground font-medium">
                      Clear Signature
                    </button>
                    <button onClick={saveSignature} className="bg-brand text-brand-foreground px-6 py-2 rounded-lg font-semibold hover:brightness-105">
                      Sign Document
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-brand/10 border border-brand/20 p-6 rounded-lg text-center">
                <ShieldCheck className="size-12 text-brand mx-auto mb-3" />
                <h3 className="text-xl font-bold text-foreground">Document Signed</h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  This NDA has been digitally signed and secured.
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg font-medium text-sm hover:bg-muted transition">
                  <Download className="size-4" /> Download PDF Copy
                </button>
              </div>
            )}
          </Card>
        </div>
      </RequireAuth>
    </Shell>
  );
}
