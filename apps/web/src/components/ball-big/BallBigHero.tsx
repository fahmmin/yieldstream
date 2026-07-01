import { MultiplierTicker } from "./MultiplierTicker";

export function BallBigHero() {
  return (
    <div className="mb-8 md:mb-10">
      <p className="mb-2 text-sm text-black/60">Micro-yield · Macro energy</p>
      <h1
        className="text-4xl font-medium leading-tight text-black md:text-5xl"
        style={{ letterSpacing: "-0.04em" }}
      >
        Who needs pennies
        <br />
        anyway?
      </h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-black/60 md:text-lg">
        Your monthly dust is sitting there. Claim it safe — or ball big and send it to
        high-stakes Polymarket. I&apos;d rather swing for 10x than be afraid of spare change.
      </p>
      <div className="mt-6">
        <MultiplierTicker />
      </div>
    </div>
  );
}
