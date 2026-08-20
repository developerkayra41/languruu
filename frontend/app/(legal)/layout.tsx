import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal">
      <Link href="/" className="back">← Ana sayfa</Link>
      {children}
      <p style={{ marginTop: "3rem", fontSize: "0.8rem", color: "#9ca3af" }}>
        © {new Date().getFullYear()} Languruu · <Link href="/privacy">Gizlilik</Link> · <Link href="/terms">Kullanım Şartları</Link>
      </p>
    </div>
  );
}