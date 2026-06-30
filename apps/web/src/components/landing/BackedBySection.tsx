const BACKERS = [
  {
    name: "Stellar Development Foundation",
    style: {
      fontFamily: "'Times New Roman', serif",
      fontWeight: 400,
      letterSpacing: "0.02em",
      fontSize: "14px",
    },
  },
  {
    name: "Soroban",
    style: {
      fontFamily: "'Arial Black', sans-serif",
      fontWeight: 900,
      letterSpacing: "0.08em",
      fontSize: "16px",
    },
  },
  {
    name: "Blend",
    style: {
      fontFamily: "Impact, sans-serif",
      fontWeight: 700,
      letterSpacing: "0.05em",
      fontSize: "18px",
    },
  },
  {
    name: "Freighter",
    style: {
      fontFamily: "Georgia, serif",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      fontSize: "17px",
    },
  },
  {
    name: "OwlPay",
    style: {
      fontFamily: "Helvetica, sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      fontSize: "15px",
    },
  },
  {
    name: "Harbor",
    style: {
      fontFamily: "Verdana, sans-serif",
      fontWeight: 700,
      letterSpacing: "0.06em",
      fontSize: "14px",
      textTransform: "uppercase" as const,
    },
  },
  {
    name: "Circle",
    style: {
      fontFamily: "'Courier New', monospace",
      fontWeight: 700,
      letterSpacing: "0.18em",
      fontSize: "14px",
    },
  },
  {
    name: "Meridian",
    style: {
      fontFamily: "Palatino, serif",
      fontWeight: 500,
      letterSpacing: "0.03em",
      fontSize: "15px",
    },
  },
] as const;

function BackerList() {
  return (
    <>
      {BACKERS.map((backer) => (
        <span
          key={backer.name}
          className="mx-10 shrink-0 whitespace-nowrap text-black/50"
          style={backer.style}
        >
          {backer.name}
        </span>
      ))}
    </>
  );
}

export function BackedBySection() {
  return (
    <section id="ecosystem" className="bg-[#F5F5F5] px-6 py-16">
      <div className="mx-auto grid max-w-[88rem] grid-cols-1 items-center gap-8 md:grid-cols-4">
        <p className="text-base leading-relaxed text-black/70">
          Built on Stellar Soroban
          <br />
          with ecosystem partners.
        </p>

        <div className="overflow-hidden md:col-span-3">
          <style>{`
            @keyframes backers-marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .backers-track {
              display: flex;
              width: max-content;
              animation: backers-marquee 30s linear infinite;
            }
          `}</style>
          <div className="backers-track">
            <BackerList />
            <BackerList />
          </div>
        </div>
      </div>
    </section>
  );
}
