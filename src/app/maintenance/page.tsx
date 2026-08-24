import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Music2 } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Manutenzione | Concerti Italia",
  description: "Sito in manutenzione",
  robots: {
    index: false,
    follow: false,
  },
};

const mainStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  overflow: "hidden",

  backgroundImage: "url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGF4bjB2aGNiNjk1OHlpYXMydmRvOXBwZWVrdTVndThuZ3dvZTYwNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JumHZQU0IABMI/giphy.gif')",
  backgroundPosition: "center",
  backgroundSize: "cover" ,
  backgroundRepeat: "no-repeat",

  color: "#ffffff",
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
};

const contentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  textAlign: "center",
};

export default function MaintenancePage() {
  return (
    <main style={mainStyle}>
      <div style={overlayStyle} aria-hidden="true" />

      <div style={contentStyle}>
        <Image
          src="/concerti-italia-logo-dark-transparent.png"
          alt="Concerti Italia"
          width={180}
          height={180}
          priority
          style={{
            width: "90px",
            height: "auto",
            margin: "0 auto",
          }}
        />


        <h1 style={{ margin: "20px 0 0" }}>
          Concerti Italia
        </h1>

        <p style={{ marginTop: "12px", color: "#e5e5e5" }}>
          Sito in manutenzione
        </p>
      </div>
    </main>
  );
}