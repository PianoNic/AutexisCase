import { QRCodeSVG } from "qrcode.react";

export function MobileOnlyOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] hidden md:flex flex-col items-center justify-center bg-background px-8 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Track my Food</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        Diese App ist für Mobilgeräte optimiert. Scanne den QR-Code mit deinem Smartphone.
      </p>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <QRCodeSVG
          value={window.location.origin}
          size={160}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground font-mono break-all max-w-xs">
        {window.location.origin}
      </p>
    </div>
  );
}
