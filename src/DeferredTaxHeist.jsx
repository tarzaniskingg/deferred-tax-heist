import { useState, useEffect, useRef, useMemo } from "react";

// ─── Design Tokens ───
const GOLD = "#D4AF37";
const DARK = "#080808";
const RED = "#C41E3D";
const CREAM = "#F5E6C8";
const EMERALD = "#2d8a2d";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@300;400;500;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&display=swap";
const ff = {
  display: "'Playfair Display', Georgia, serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
  body: "'Crimson Pro', Georgia, serif",
};

// ─── Crew Members ───
const CREW = [
  {
    id: "depreciation",
    name: "The Depreciation Guy",
    realName: 'Danny "Straight-Line" Ocean',
    role: "Mastermind",
    icon: "\u{1F4D0}",
    color: "#D4AF37",
    brief: "Handles the gap between accounting depreciation (straight-line) and tax depreciation (accelerated/capital allowances).",
    concept: "When tax depreciation > accounting depreciation \u2192 taxable temporary difference \u2192 Deferred Tax Liability",
    scenario: {
      title: "The Depreciation Job",
      narrative: "The company bought equipment for $500,000. Accounting depreciates it straight-line over 5 years ($100k/yr). Tax allows accelerated depreciation: $200k in Year 1. Your job: figure out what happens.",
      question: "In Year 1, the carrying amount is $400k and the tax base is $300k. What does the $100k difference create?",
      options: [
        { text: "Deferred Tax Asset", correct: false, explanation: "Not quite \u2014 the tax base is LOWER than carrying amount. The company got a bigger deduction now, so it\u2019ll pay MORE tax later." },
        { text: "Deferred Tax Liability", correct: true, explanation: "Correct! Carrying amount ($400k) > Tax base ($300k) = taxable temporary difference = DTL. The company deducted more for tax now, so future tax payments will be higher." },
        { text: "Permanent Difference", correct: false, explanation: "This difference WILL reverse over the asset\u2019s life \u2014 total depreciation is the same. It\u2019s temporary, not permanent." },
        { text: "No tax effect", correct: false, explanation: "There\u2019s definitely a tax effect \u2014 the two worlds are showing different numbers right now!" },
      ],
    },
  },
  {
    id: "warranty",
    name: "The Warranty Woman",
    realName: 'Tess "Provision" McGraw',
    role: "The Inside Agent",
    icon: "\u{1F6E1}\uFE0F",
    color: "#7B68EE",
    brief: "Manages warranty provisions \u2014 recognized as an expense in accounting but only deductible for tax when actually paid out.",
    concept: "When expense recognized in accounts before tax deduction \u2192 deductible temporary difference \u2192 Deferred Tax Asset",
    scenario: {
      title: "The Warranty Heist",
      narrative: "The company sells electronics with a 2-year warranty. They estimate $80,000 in warranty costs and recognize a provision. But the tax authority says: \u2018No deduction until you actually pay the claims.\u2019 So far, $0 has been paid out.",
      question: "The provision of $80k is recognized in accounts but has $0 tax base deduction so far. What does this create?",
      options: [
        { text: "Deferred Tax Asset", correct: true, explanation: "Yes! The expense is recognized NOW in accounting, but the tax deduction comes LATER when claims are paid. This creates a deductible temporary difference \u2192 DTA." },
        { text: "Deferred Tax Liability", correct: false, explanation: "It\u2019s the other way around \u2014 the company has already reduced its accounting profit, but hasn\u2019t gotten the tax benefit yet. Future tax will be LOWER, not higher." },
        { text: "Permanent Difference", correct: false, explanation: "The deduction will eventually happen \u2014 just later. This is a timing difference, not permanent." },
        { text: "Contingent Liability", correct: false, explanation: "The warranty provision is already recognized as a liability. The question is about the TAX effect of that provision." },
      ],
    },
  },
  {
    id: "losscarry",
    name: "The Loss Carry-Forward Hacker",
    realName: 'Linus "NOL" Caldwell',
    role: "Tech Specialist",
    icon: "\u{1F4BB}",
    color: "#00CED1",
    brief: "Exploits unused tax losses \u2014 losses from prior years that can offset future taxable income.",
    concept: "Tax losses carried forward \u2192 potential future tax savings \u2192 Deferred Tax Asset (if probable future taxable profits exist)",
    scenario: {
      title: "The Loss Heist",
      narrative: "The company had a terrible year \u2014 $2 million in tax losses. But next year looks promising with projected profits of $3 million. The tax rate is 25%. The board wants to recognize a DTA for the loss carry-forward.",
      question: "Can the company recognize a Deferred Tax Asset for the $2M loss carry-forward?",
      options: [
        { text: "Yes \u2014 DTA of $500,000", correct: true, explanation: "Correct! $2M \u00d7 25% = $500k DTA. Since future taxable profits ($3M) are probable and exceed the losses, the DTA is recognizable. The company will save $500k in future tax." },
        { text: "Yes \u2014 DTA of $2,000,000", correct: false, explanation: "Close but not quite \u2014 the DTA is the TAX EFFECT of the losses, not the losses themselves. It\u2019s $2M \u00d7 25% = $500k." },
        { text: "No \u2014 losses can never create a DTA", correct: false, explanation: "They absolutely can! IAS 12/ASC 740 allows recognition of DTAs for loss carry-forwards when future taxable profits are probable." },
        { text: "Only if the auditors approve", correct: false, explanation: "Recognition depends on whether future taxable profits are PROBABLE \u2014 that\u2019s a management judgment supported by evidence, not an auditor decision." },
      ],
    },
  },
  {
    id: "revaluation",
    name: "The Revaluation Artist",
    realName: 'Rusty "Fair Value" Ryan',
    role: "The Grifter",
    icon: "\u{1F3A8}",
    color: "#FF6B6B",
    brief: "Handles asset revaluations \u2014 when fair value goes up in the books but the tax base stays at historical cost.",
    concept: "Revaluation surplus \u2192 carrying amount increases, tax base unchanged \u2192 taxable temporary difference \u2192 DTL (through OCI)",
    scenario: {
      title: "The Revaluation Caper",
      narrative: "The company revalues its building from $1M (original cost) to $1.4M. The tax authority doesn\u2019t recognize revaluations \u2014 the tax base remains $1M. Tax rate is 30%.",
      question: "What\u2019s the deferred tax impact of this $400k revaluation surplus?",
      options: [
        { text: "DTL of $120,000 through OCI", correct: true, explanation: "Nailed it! $400k \u00d7 30% = $120k DTL. Since the revaluation went through OCI, the related deferred tax also goes through OCI \u2014 matching principle!" },
        { text: "DTL of $120,000 through P&L", correct: false, explanation: "Right amount, wrong location! The revaluation surplus goes to OCI, so the deferred tax must ALSO go through OCI. Matching matters." },
        { text: "DTA of $120,000", correct: false, explanation: "The carrying amount ($1.4M) is HIGHER than tax base ($1M). When you eventually sell/dispose, you\u2019ll have a bigger taxable gain. That\u2019s a liability, not an asset." },
        { text: "No deferred tax \u2014 revaluations are exempt", correct: false, explanation: "Revaluations are NOT exempt from deferred tax. The difference between carrying amount and tax base must be recognized." },
      ],
    },
  },
  {
    id: "twist",
    name: "The Mastermind\u2019s Reveal",
    realName: "The Whole Crew",
    role: "The Twist",
    icon: "\u{1F3AD}",
    color: GOLD,
    brief: "The final reveal \u2014 this was never about gaming the system.",
    concept: "Deferred tax ensures faithful representation: matching tax effects to the periods where the related transactions are recognized.",
    scenario: {
      title: "The Big Reveal",
      narrative: "You\u2019ve completed all the jobs. The company\u2019s financials are ready for the IPO. But here\u2019s the twist \u2014 none of this was about manipulation. Every deferred tax entry was about ONE thing\u2026",
      question: "What is the fundamental PURPOSE of deferred tax accounting?",
      options: [
        { text: "To minimize tax payments", correct: false, explanation: "Deferred tax accounting doesn\u2019t change how much tax you actually pay \u2014 it changes WHEN you recognize the expense in financial statements." },
        { text: "To match tax effects to the correct accounting periods", correct: true, explanation: "That\u2019s the twist! Deferred tax is about FAITHFUL REPRESENTATION \u2014 ensuring the tax consequences of transactions are recognized in the same period as the transactions themselves. It\u2019s not a heist \u2014 it\u2019s good accounting." },
        { text: "To comply with tax authority requirements", correct: false, explanation: "Tax authorities don\u2019t require deferred tax accounting \u2014 it\u2019s a FINANCIAL REPORTING requirement under IFRS/GAAP. The tax authority only cares about the tax return." },
        { text: "To increase reported profits", correct: false, explanation: "Deferred tax can increase OR decrease reported profits. Its purpose is accurate representation, not profit manipulation." },
      ],
    },
  },
];

// ═══════════════════════════════════════════
// SVG ILLUSTRATIONS
// ═══════════════════════════════════════════

// ─── Vault Door Scene ───
function VaultScene({ opening, phase }) {
  const [dialAngle, setDialAngle] = useState(0);
  const [doorAngle, setDoorAngle] = useState(0);

  useEffect(() => {
    if (!opening) return;
    let frame;
    let angle = 0;
    const spin = () => {
      angle += 6;
      setDialAngle(angle);
      if (angle < 720) {
        frame = requestAnimationFrame(spin);
      }
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [opening]);

  useEffect(() => {
    if (!opening) return;
    const t = setTimeout(() => {
      let a = 0;
      const swing = () => {
        a += 1.5;
        setDoorAngle(Math.min(a, 85));
        if (a < 85) requestAnimationFrame(swing);
      };
      requestAnimationFrame(swing);
    }, 2200);
    return () => clearTimeout(t);
  }, [opening]);

  return (
    <svg viewBox="0 0 800 600" style={{
      width: "100%", maxWidth: 800, height: "auto",
      filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.8))",
    }}>
      <defs>
        {/* Concrete wall texture */}
        <filter id="concrete">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" seed="2" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.08" intercept="0.08" />
            <feFuncG type="linear" slope="0.08" intercept="0.08" />
            <feFuncB type="linear" slope="0.08" intercept="0.09" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>

        {/* Metal gradient */}
        <linearGradient id="metalDoor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="20%" stopColor="#555" />
          <stop offset="40%" stopColor="#4a4a4a" />
          <stop offset="60%" stopColor="#333" />
          <stop offset="80%" stopColor="#4d4d4d" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </linearGradient>

        <linearGradient id="metalFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#444" />
          <stop offset="50%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>

        <radialGradient id="spotlight" cx="0.5" cy="0.15" r="0.6">
          <stop offset="0%" stopColor={`${GOLD}18`} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <radialGradient id="dialMetal" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#666" />
          <stop offset="50%" stopColor="#444" />
          <stop offset="100%" stopColor="#222" />
        </radialGradient>

        {/* Floor reflection */}
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background wall */}
      <rect x="0" y="0" width="800" height="480" fill="#0e0e0e" filter="url(#concrete)" />

      {/* Spotlight cone */}
      <rect x="0" y="0" width="800" height="480" fill="url(#spotlight)" />

      {/* Brick lines on wall */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`bh${i}`} x1="0" y1={i * 42} x2="800" y2={i * 42} stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
      ))}
      {Array.from({ length: 20 }).map((_, i) =>
        Array.from({ length: 12 }).map((_, j) => (
          <line key={`bv${i}-${j}`}
            x1={i * 80 + (j % 2 === 0 ? 0 : 40)} y1={j * 42}
            x2={i * 80 + (j % 2 === 0 ? 0 : 40)} y2={(j + 1) * 42}
            stroke="#1a1a1a" strokeWidth="1" opacity="0.3"
          />
        ))
      )}

      {/* Floor */}
      <rect x="0" y="480" width="800" height="120" fill="url(#floor)" />
      {/* Floor tiles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`fl${i}`} x1={i * 90} y1="480" x2={i * 90 + 45} y2="600" stroke="#151515" strokeWidth="1" opacity="0.4" />
      ))}
      <line x1="0" y1="530" x2="800" y2="530" stroke="#111" strokeWidth="0.5" opacity="0.3" />

      {/* Vault frame (thick steel border) */}
      <rect x="220" y="60" width="360" height="400" rx="8" fill="url(#metalFrame)"
        stroke="#555" strokeWidth="3" />
      {/* Inner frame bevel */}
      <rect x="228" y="68" width="344" height="384" rx="4" fill="none"
        stroke="#3a3a3a" strokeWidth="1" />

      {/* Door (swings open with perspective) */}
      <g style={{
        transformOrigin: "240px 260px",
        transform: `perspective(800px) rotateY(-${doorAngle}deg)`,
        transition: doorAngle > 0 ? "none" : "transform 0.3s ease",
      }}>
        {/* Main door surface */}
        <rect x="240" y="80" width="320" height="360" rx="4" fill="url(#metalDoor)"
          stroke="#4a4a4a" strokeWidth="2" />

        {/* Door panel details */}
        <rect x="260" y="100" width="120" height="140" rx="2" fill="none" stroke="#4a4a4a" strokeWidth="1.5" opacity="0.5" />
        <rect x="420" y="100" width="120" height="140" rx="2" fill="none" stroke="#4a4a4a" strokeWidth="1.5" opacity="0.5" />
        <rect x="260" y="270" width="120" height="140" rx="2" fill="none" stroke="#4a4a4a" strokeWidth="1.5" opacity="0.5" />
        <rect x="420" y="270" width="120" height="140" rx="2" fill="none" stroke="#4a4a4a" strokeWidth="1.5" opacity="0.5" />

        {/* Rivets / bolts */}
        {[
          [252, 92], [548, 92], [252, 428], [548, 428],
          [252, 250], [548, 250], [300, 92], [500, 92],
          [300, 428], [500, 428],
        ].map(([cx, cy], i) => (
          <g key={`rivet${i}`}>
            <circle cx={cx} cy={cy} r="5" fill="#3a3a3a" stroke="#555" strokeWidth="0.5" />
            <circle cx={cx - 1} cy={cy - 1} r="1.5" fill="#666" opacity="0.5" />
          </g>
        ))}

        {/* Locking bars */}
        {[160, 260, 360].map((y, i) => (
          <g key={`bar${i}`}>
            <rect x="230" y={y} width="15" height="8" rx="2" fill="#555" stroke="#666" strokeWidth="0.5" />
            <rect x="555" y={y} width="15" height="8" rx="2" fill="#555" stroke="#666" strokeWidth="0.5" />
          </g>
        ))}

        {/* Combination dial */}
        <g style={{ transformOrigin: "400px 260px", transform: `rotate(${dialAngle}deg)` }}>
          <circle cx="400" cy="260" r="52" fill="url(#dialMetal)" stroke="#666" strokeWidth="2" />
          <circle cx="400" cy="260" r="44" fill="none" stroke="#555" strokeWidth="0.5" />
          {/* Dial ticks */}
          {Array.from({ length: 40 }).map((_, i) => {
            const a = (i * 9) * Math.PI / 180;
            const isMajor = i % 5 === 0;
            const r1 = isMajor ? 36 : 39;
            const r2 = 44;
            return (
              <line key={`dt${i}`}
                x1={400 + r1 * Math.cos(a)} y1={260 + r1 * Math.sin(a)}
                x2={400 + r2 * Math.cos(a)} y2={260 + r2 * Math.sin(a)}
                stroke={GOLD} strokeWidth={isMajor ? 1.2 : 0.4} opacity={isMajor ? 0.7 : 0.3}
              />
            );
          })}
          {/* Numbers on dial */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = ((i * 45) - 90) * Math.PI / 180;
            return (
              <text key={`dn${i}`}
                x={400 + 28 * Math.cos(a)} y={260 + 28 * Math.sin(a)}
                fill={GOLD} fontSize="7" fontFamily={ff.mono}
                textAnchor="middle" dominantBaseline="central" opacity="0.5"
              >
                {i * 5}
              </text>
            );
          })}
          {/* Handle spokes */}
          {[0, 120, 240].map(deg => {
            const a = deg * Math.PI / 180;
            return (
              <line key={`sp${deg}`}
                x1="400" y1="260"
                x2={400 + 20 * Math.cos(a)} y2={260 + 20 * Math.sin(a)}
                stroke={GOLD} strokeWidth="3" opacity="0.5" strokeLinecap="round"
              />
            );
          })}
          <circle cx="400" cy="260" r="10" fill="#1a1a1a" stroke={GOLD} strokeWidth="1.5" />
          <circle cx="400" cy="260" r="4" fill={GOLD} opacity="0.4" />
        </g>

        {/* Dial pointer */}
        <polygon points="400,200 396,210 404,210" fill={RED} opacity="0.9" filter="url(#glow)" />

        {/* Handle */}
        <rect x="480" y="245" width="50" height="10" rx="3" fill="#555" stroke="#666" strokeWidth="1" />
        <circle cx="530" cy="250" r="8" fill="#444" stroke="#666" strokeWidth="1" />
        <circle cx="530" cy="250" r="3" fill="#333" />
      </g>

      {/* Light glow behind vault when opening */}
      {doorAngle > 20 && (
        <rect x="240" y="80" width="320" height="360" fill={GOLD} opacity={Math.min(doorAngle / 300, 0.15)}
          style={{ filter: "blur(20px)" }} />
      )}

      {/* Dust particles in light */}
      {phase >= 1 && Array.from({ length: 8 }).map((_, i) => (
        <circle key={`dust${i}`}
          cx={350 + Math.random() * 100} cy={150 + Math.random() * 200}
          r={0.5 + Math.random() * 1.5} fill={GOLD} opacity={0.1 + Math.random() * 0.2}
        >
          <animate attributeName="cy" values={`${150 + i * 30};${120 + i * 30}`} dur={`${3 + i}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// ─── Desk Scene (Briefing) ───
function DeskScene() {
  return (
    <svg viewBox="0 0 800 350" style={{ width: "100%", maxWidth: 800, height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#3a2415" />
          <stop offset="30%" stopColor="#4a3020" />
          <stop offset="60%" stopColor="#3d2618" />
          <stop offset="100%" stopColor="#35200f" />
        </linearGradient>
        <linearGradient id="paper" x1="0" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="#f0e6d0" />
          <stop offset="100%" stopColor="#e8dbc0" />
        </linearGradient>
        <linearGradient id="lampShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a5a2a" />
          <stop offset="100%" stopColor="#1a3a1a" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="0.5" cy="1" r="1">
          <stop offset="0%" stopColor={`${GOLD}30`} />
          <stop offset="60%" stopColor={`${GOLD}08`} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="paperShadow">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Desk surface */}
      <rect x="0" y="120" width="800" height="230" fill="url(#wood)" />
      {/* Wood grain lines */}
      {Array.from({ length: 15 }).map((_, i) => (
        <line key={`wg${i}`} x1="0" y1={130 + i * 15} x2="800" y2={128 + i * 15 + (i % 3) * 2}
          stroke="#2a1a0a" strokeWidth="0.5" opacity="0.3" />
      ))}
      {/* Desk edge highlight */}
      <rect x="0" y="120" width="800" height="3" fill="#5a4030" opacity="0.6" />

      {/* Scattered papers - back */}
      <g filter="url(#paperShadow)">
        <rect x="450" y="140" width="140" height="180" fill="url(#paper)" transform="rotate(-3 520 230)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`pl1${i}`} x1="465" y1={160 + i * 18} x2="575" y2={160 + i * 18}
            stroke="#bbb" strokeWidth="0.5" opacity="0.4" transform="rotate(-3 520 230)" />
        ))}
      </g>

      {/* Manila folder */}
      <g filter="url(#paperShadow)">
        <rect x="560" y="155" width="160" height="120" rx="2" fill="#c8a050" transform="rotate(5 640 215)" />
        <rect x="560" y="150" width="80" height="15" rx="2" fill="#b89040" transform="rotate(5 640 215)" />
        {/* CLASSIFIED stamp */}
        <text x="610" y="210" fill={RED} fontSize="11" fontFamily={ff.mono}
          fontWeight="700" opacity="0.7" transform="rotate(5 640 215)" letterSpacing="2">CLASSIFIED</text>
      </g>

      {/* Notebook */}
      <g filter="url(#paperShadow)">
        <rect x="70" y="150" width="130" height="170" rx="3" fill="#1a1a2e" />
        <rect x="73" y="153" width="124" height="164" rx="2" fill="#22223a" />
        {/* Spiral binding */}
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={`sp${i}`} cx="73" cy={162 + i * 16} r="4" fill="none" stroke="#888" strokeWidth="1" />
        ))}
        {/* Page lines */}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`nl${i}`} x1="88" y1={170 + i * 18} x2="185" y2={170 + i * 18}
            stroke="#444" strokeWidth="0.5" opacity="0.5" />
        ))}
        {/* Some "writing" */}
        {[0, 1, 2, 3].map(i => (
          <rect key={`wr${i}`} x="88" y={171 + i * 18} width={40 + Math.random() * 60} height="2"
            fill={GOLD} opacity="0.2" rx="1" />
        ))}
      </g>

      {/* Coffee mug */}
      <g>
        <ellipse cx="340" cy="180" rx="22" ry="6" fill="#1a1a1a" opacity="0.3" />
        <rect x="318" y="150" width="44" height="35" rx="3" fill="#e8e0d0" stroke="#ccc" strokeWidth="1" />
        <ellipse cx="340" cy="150" rx="22" ry="7" fill="#ddd" stroke="#ccc" strokeWidth="0.5" />
        <ellipse cx="340" cy="150" rx="17" ry="5" fill="#3a1a0a" />
        {/* Handle */}
        <path d="M362,158 C375,158 375,178 362,178" fill="none" stroke="#ccc" strokeWidth="3" />
        {/* Steam */}
        <path d="M332,142 C330,132 336,128 334,118" fill="none" stroke="#ffffff20" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="d" values="M332,142 C330,132 336,128 334,118;M332,142 C334,132 328,128 330,118;M332,142 C330,132 336,128 334,118" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M340,140 C342,130 336,125 338,115" fill="none" stroke="#ffffff15" strokeWidth="1" strokeLinecap="round">
          <animate attributeName="d" values="M340,140 C342,130 336,125 338,115;M340,140 C338,130 344,125 342,115;M340,140 C342,130 336,125 338,115" dur="4s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Pen */}
      <rect x="260" y="200" width="120" height="4" rx="2" fill="#222" transform="rotate(-15 320 202)" />
      <rect x="255" y="200" width="8" height="4" rx="1" fill={GOLD} transform="rotate(-15 320 202)" opacity="0.8" />

      {/* Desk lamp */}
      <g>
        {/* Light glow */}
        <ellipse cx="160" cy="200" rx="120" ry="100" fill="url(#lampGlow)" />
        {/* Lamp base */}
        <ellipse cx="155" cy="145" rx="30" ry="6" fill="#222" />
        <rect x="150" y="80" width="10" height="65" fill="#333" />
        {/* Arm */}
        <line x1="155" y1="80" x2="190" y2="50" stroke="#444" strokeWidth="4" strokeLinecap="round" />
        {/* Shade */}
        <path d="M170,45 L210,65 L170,65 Z" fill="url(#lampShade)" stroke="#2a4a2a" strokeWidth="1" />
        <line x1="190" y1="55" x2="190" y2="64" stroke={`${GOLD}66`} strokeWidth="1" />
      </g>

      {/* Calculator */}
      <g filter="url(#paperShadow)">
        <rect x="400" y="200" width="55" height="80" rx="3" fill="#222" stroke="#333" strokeWidth="1" />
        <rect x="405" y="205" width="45" height="18" rx="1" fill="#1a3a1a" />
        <text x="440" y="218" fill="#4ade80" fontSize="9" fontFamily={ff.mono} textAnchor="end" opacity="0.8">500,000</text>
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={`cb${i}`} x={408 + (i % 3) * 14} y={228 + Math.floor(i / 3) * 14}
            width="10" height="10" rx="1" fill="#333" stroke="#444" strokeWidth="0.5" />
        ))}
      </g>

      {/* Glasses */}
      <g opacity="0.6">
        <circle cx="650" cy="200" r="14" fill="none" stroke="#888" strokeWidth="1.5" />
        <circle cx="685" cy="200" r="14" fill="none" stroke="#888" strokeWidth="1.5" />
        <line x1="664" y1="200" x2="671" y2="200" stroke="#888" strokeWidth="1.5" />
        <line x1="636" y1="200" x2="620" y2="195" stroke="#888" strokeWidth="1" />
        <line x1="699" y1="200" x2="715" y2="195" stroke="#888" strokeWidth="1" />
      </g>
    </svg>
  );
}

// ─── Cork Board with Dossiers ───
function CorkBoard({ crew, completed, onSelect }) {
  const [hovered, setHovered] = useState(null);

  // Pin positions arranged on board
  const positions = [
    { x: 80, y: 60 }, { x: 300, y: 40 }, { x: 520, y: 55 },
    { x: 190, y: 280 }, { x: 430, y: 290 },
  ];

  // String connections (to show they're connected)
  const strings = [
    [0, 1], [1, 2], [0, 3], [2, 4], [1, 3], [1, 4], [3, 4],
  ];

  return (
    <svg viewBox="0 0 700 480" style={{
      width: "100%", maxWidth: 900, height: "auto",
      filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.6))",
    }}>
      <defs>
        <filter id="corkTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.5 0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
        <filter id="cardShadow">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <linearGradient id="photoCard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f0e0" />
          <stop offset="100%" stopColor="#e8e0c8" />
        </linearGradient>
      </defs>

      {/* Cork board */}
      <rect x="0" y="0" width="700" height="480" rx="4" fill="#8B6914" filter="url(#corkTexture)" />
      <rect x="0" y="0" width="700" height="480" rx="4" fill="#6B4F10" opacity="0.3" />

      {/* Wood frame */}
      <rect x="-4" y="-4" width="708" height="488" rx="6" fill="none" stroke="#3a2010" strokeWidth="12" />
      <rect x="-4" y="-4" width="708" height="488" rx="6" fill="none" stroke="#5a3820" strokeWidth="8" />
      <rect x="0" y="0" width="700" height="480" rx="4" fill="none" stroke="#4a2818" strokeWidth="2" />

      {/* Red strings connecting dossiers */}
      {strings.map(([a, b], i) => {
        const pa = positions[a];
        const pb = positions[b];
        // Slight sag in the string
        const mx = (pa.x + pb.x) / 2 + 60;
        const my = (pa.y + pb.y) / 2 + 60;
        return (
          <path key={`str${i}`}
            d={`M${pa.x + 60},${pa.y + 80} Q${mx},${my + 15} ${pb.x + 60},${pb.y + 80}`}
            fill="none" stroke={RED} strokeWidth="1" opacity="0.35"
          />
        );
      })}

      {/* Dossier cards */}
      {crew.map((member, i) => {
        const pos = positions[i];
        const done = completed.includes(member.id);
        const isLocked = member.id === "twist" && completed.length < 4;
        const isHov = hovered === i;
        const rotation = [-3, 2, -1, 4, -2][i];

        return (
          <g key={member.id}
            onClick={() => !isLocked && onSelect(member)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.35 : 1,
              transform: isHov && !isLocked ? `translate(${pos.x}px, ${pos.y - 4}px) rotate(${rotation}deg) scale(1.05)` : `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg)`,
              transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
            }}
            filter="url(#cardShadow)"
          >
            {/* Card background */}
            <rect x="0" y="0" width="120" height="160" rx="2" fill="url(#photoCard)" />

            {/* "Photo" area */}
            <rect x="10" y="12" width="100" height="80" fill={`${member.color}18`}
              stroke={done ? member.color : "#ccc"} strokeWidth={done ? 2 : 0.5} />

            {/* Silhouette inside photo */}
            <text x="60" y="62" textAnchor="middle" fontSize="36" dominantBaseline="central"
              style={{ filter: done ? "none" : "grayscale(0.8) brightness(0.7)" }}>
              {member.icon}
            </text>

            {/* Name text */}
            <text x="60" y="108" fill="#2a2a2a" fontSize="7" fontFamily={ff.mono}
              textAnchor="middle" fontWeight="700" letterSpacing="0.5">
              {member.role.toUpperCase()}
            </text>
            <text x="60" y="122" fill="#444" fontSize="7.5" fontFamily={ff.display}
              textAnchor="middle">
              {member.name.length > 18 ? member.name.slice(0, 18) + "..." : member.name}
            </text>

            {/* Status */}
            {done && (
              <g>
                <rect x="25" y="132" width="70" height="16" rx="2" fill={`${EMERALD}cc`} />
                <text x="60" y="143" fill="#fff" fontSize="7" fontFamily={ff.mono}
                  textAnchor="middle" fontWeight="700" letterSpacing="1">COMPLETE</text>
              </g>
            )}
            {isLocked && (
              <g>
                <rect x="25" y="132" width="70" height="16" rx="2" fill="#666" opacity="0.7" />
                <text x="60" y="143" fill="#ddd" fontSize="7" fontFamily={ff.mono}
                  textAnchor="middle" letterSpacing="1">LOCKED</text>
              </g>
            )}
            {!done && !isLocked && (
              <g>
                <rect x="25" y="132" width="70" height="16" rx="2" fill={`${member.color}22`}
                  stroke={member.color} strokeWidth="0.5" />
                <text x="60" y="143" fill={member.color} fontSize="6.5" fontFamily={ff.mono}
                  textAnchor="middle" fontWeight="500" letterSpacing="1">SELECT</text>
              </g>
            )}

            {/* Push pin */}
            <circle cx="60" cy="3" r="7" fill={done ? EMERALD : isLocked ? "#666" : member.color}
              stroke="#fff" strokeWidth="1" opacity="0.9" />
            <circle cx="58" cy="1" r="2" fill="#fff" opacity="0.4" />

            {/* Hover glow */}
            {isHov && !isLocked && (
              <rect x="-2" y="-2" width="124" height="164" rx="3" fill="none"
                stroke={member.color} strokeWidth="2" opacity="0.5" />
            )}
          </g>
        );
      })}

      {/* Tape / sticky notes */}
      <g opacity="0.6">
        <rect x="15" y="420" width="80" height="40" fill="#ffeb3b" transform="rotate(-5 55 440)" />
        <text x="55" y="442" fill="#555" fontSize="7" fontFamily={ff.mono}
          textAnchor="middle" transform="rotate(-5 55 440)">IPO: 48 HRS</text>
      </g>
      <g opacity="0.5">
        <rect x="600" y="15" width="70" height="35" fill="#ff8a80" transform="rotate(3 635 32)" />
        <text x="635" y="36" fill="#6a1a1a" fontSize="6" fontFamily={ff.mono}
          textAnchor="middle" transform="rotate(3 635 32)">URGENT</text>
      </g>
    </svg>
  );
}

// ─── Document / Evidence Card for Quiz ───
function EvidenceDocument({ member, scenario }) {
  return (
    <svg viewBox="0 0 500 200" style={{ width: "100%", maxWidth: 500, height: "auto", display: "block", margin: "0 auto" }}>
      <defs>
        <filter id="docShadow">
          <feDropShadow dx="3" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <linearGradient id="docPaper" x1="0" y1="0" x2="0.05" y2="1">
          <stop offset="0%" stopColor="#f5f0e0" />
          <stop offset="100%" stopColor="#ebe5d0" />
        </linearGradient>
      </defs>

      {/* Paper */}
      <rect x="20" y="10" width="460" height="180" fill="url(#docPaper)" filter="url(#docShadow)" />
      {/* Fold corner */}
      <polygon points="440,10 480,10 480,50" fill="#e0d8c0" />
      <polygon points="440,10 480,50 440,50" fill="#d8d0b8" />

      {/* Header line */}
      <line x1="40" y1="40" x2="460" y2="40" stroke={member.color} strokeWidth="2" opacity="0.6" />
      <text x="40" y="35" fill={member.color} fontSize="8" fontFamily={ff.mono}
        letterSpacing="3" fontWeight="700">{scenario.title.toUpperCase()}</text>

      {/* "Body text" lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={`docl${i}`} x="40" y={52 + i * 14} width={200 + Math.random() * 180} height="3"
          fill="#bbb" opacity="0.3" rx="1" />
      ))}

      {/* Stamp */}
      <g transform="rotate(-12 400 140)">
        <rect x="350" y="120" width="100" height="40" rx="3" fill="none"
          stroke={RED} strokeWidth="2" opacity="0.5" />
        <text x="400" y="144" fill={RED} fontSize="11" fontFamily={ff.mono}
          textAnchor="middle" fontWeight="700" opacity="0.5" letterSpacing="2">EVIDENCE</text>
      </g>

      {/* Paper clip */}
      <path d="M45,10 C45,0 55,0 55,10 L55,30 C55,38 47,38 47,30 L47,15" fill="none"
        stroke="#999" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Bookshelf Background ───
function BookshelfBg() {
  const books = useMemo(() => {
    const arr = [];
    const colors = ["#8B0000", "#2F4F4F", "#1a1a5e", "#4a0e2e", "#0a3a0a", "#3a2a1a", "#2e1a3a", "#5a4010", "#1a3a3a", "#4a2020"];
    let x = 0;
    for (let shelf = 0; shelf < 2; shelf++) {
      x = 0;
      const y = shelf * 160;
      while (x < 820) {
        const w = 14 + Math.random() * 28;
        const h = 110 + Math.random() * 35;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const tilt = (Math.random() - 0.5) * 3;
        arr.push({ x, y: y + (145 - h), w, h, color, tilt, shelf });
        x += w + 1;
      }
    }
    return arr;
  }, []);

  return (
    <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}>
      <defs>
        <linearGradient id="shelfWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3820" />
          <stop offset="50%" stopColor="#3a2010" />
          <stop offset="100%" stopColor="#2a1808" />
        </linearGradient>
      </defs>
      {/* Shelves */}
      <rect x="0" y="145" width="800" height="12" fill="url(#shelfWood)" />
      <rect x="0" y="305" width="800" height="12" fill="url(#shelfWood)" />
      {/* Books */}
      {books.map((b, i) => (
        <g key={i} transform={`rotate(${b.tilt} ${b.x + b.w / 2} ${b.y + b.h / 2})`}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color} rx="1"
            stroke={`${b.color}88`} strokeWidth="0.5" />
          {/* Spine detail */}
          {b.w > 18 && (
            <>
              <line x1={b.x + 3} y1={b.y + 10} x2={b.x + 3} y2={b.y + b.h - 10}
                stroke="#ffffff10" strokeWidth="0.5" />
              <rect x={b.x + b.w / 2 - 3} y={b.y + b.h * 0.3} width="6" height="2"
                fill={GOLD} opacity="0.2" rx="0.5" />
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════

const GLOBAL_STYLES = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulseGlow { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes shakeX { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes celebratePop { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes driftUp { from{transform:translateY(100vh) scale(0);opacity:0} 10%{opacity:0.8;transform:translateY(90vh) scale(1)} 90%{opacity:0.4} to{transform:translateY(-10vh) scale(0.5);opacity:0} }
  @keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes screenWipe { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0 0 0)} }
`;

// ─── Floating Particles ───
function Particles({ count = 25, color = GOLD }) {
  const particles = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 20,
      duration: 14 + Math.random() * 18, size: 1 + Math.random() * 2.5,
      opacity: 0.08 + Math.random() * 0.2,
    })), [count]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, bottom: "-10px",
          width: p.size, height: p.size, borderRadius: "50%", background: color,
          opacity: p.opacity, animation: `driftUp ${p.duration}s ${p.delay}s linear infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Typewriter Text ───
function TypewriterText({ text, speed = 30, delay = 0, style = {}, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => { i++; setDisplayed(text.slice(0, i)); if (i >= text.length) { clearInterval(iv); onDone?.(); } }, speed);
    return () => clearInterval(iv);
  }, [started, text, speed]);
  if (!started) return <div style={{ ...style, minHeight: "1.5em" }}>{"\u00A0"}</div>;
  return (
    <div style={style}>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ display: "inline-block", width: 2, height: "1em", background: GOLD, marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />
      )}
    </div>
  );
}

// ─── Heist Button ───
function HeistButton({ children, onClick, color = GOLD, size = "md", disabled = false, style: extraStyle = {} }) {
  const [hover, setHover] = useState(false);
  const sizes = {
    sm: { padding: "0.6rem 1.4rem", fontSize: "0.7rem", letterSpacing: "0.2em" },
    md: { padding: "0.85rem 2.5rem", fontSize: "0.78rem", letterSpacing: "0.25em" },
    lg: { padding: "1.1rem 3.2rem", fontSize: "0.85rem", letterSpacing: "0.3em" },
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} disabled={disabled}
      style={{
        position: "relative", background: hover && !disabled ? color : "transparent",
        border: `1px solid ${disabled ? "#333" : color}`,
        color: hover && !disabled ? DARK : disabled ? "#555" : color,
        ...sizes[size], textTransform: "uppercase", fontFamily: ff.mono, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden", opacity: disabled ? 0.4 : 1, ...extraStyle,
      }}>
      {hover && !disabled && (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`, animation: "screenWipe 0.6s ease forwards" }} />
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </button>
  );
}

// ─── Progress Bar ───
function ProgressBar({ completed }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 3, background: "#181818" }}>
      <div style={{ height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${RED})`, width: `${(completed.length / 5) * 100}%`, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)", boxShadow: `0 0 12px ${GOLD}44` }} />
    </div>
  );
}

// ─── Score Display ───
function ScoreDisplay({ score }) {
  return (
    <div style={{ position: "fixed", top: 14, right: 20, zIndex: 200, display: "flex", alignItems: "center", gap: 10, background: `${DARK}dd`, backdropFilter: "blur(12px)", border: `1px solid ${GOLD}33`, borderRadius: 4, padding: "6px 14px" }}>
      <div style={{ fontFamily: ff.mono, fontSize: "0.6rem", letterSpacing: "0.2em", color: GOLD, textTransform: "uppercase", opacity: 0.7 }}>Score</div>
      <div style={{ fontFamily: ff.mono, fontSize: "1.3rem", fontWeight: 700, color: CREAM, animation: "countUp 0.4s ease" }}>
        {score}<span style={{ color: "#555", fontSize: "0.75rem", fontWeight: 300 }}>/5</span>
      </div>
    </div>
  );
}

// ─── Screen Transition ───
function ScreenTransition({ children, screenKey }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(false); const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, [screenKey]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)" }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════

// ─── Title Screen ───
function TitleScreen({ onStart }) {
  const [phase, setPhase] = useState(0);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleStart = () => {
    setOpening(true);
    setTimeout(onStart, 3000);
  };

  return (
    <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      {/* Subtitle */}
      <div style={{ opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.8s ease", fontSize: "0.72rem", letterSpacing: "0.6em", color: GOLD, textTransform: "uppercase", fontFamily: ff.mono, marginBottom: "2rem", borderTop: `1px solid ${GOLD}22`, borderBottom: `1px solid ${GOLD}22`, padding: "0.6rem 2rem" }}>
        An Interactive Accounting Experience
      </div>

      {/* Vault scene */}
      <div style={{ width: "100%", maxWidth: 600, opacity: phase >= 1 ? 1 : 0, transition: "opacity 1s ease", marginBottom: "1.5rem" }}>
        <VaultScene opening={opening} phase={phase} />
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: ff.display, fontSize: "clamp(2.5rem, 7vw, 5rem)", color: CREAM, fontWeight: 400, letterSpacing: "0.06em", lineHeight: 1.05, margin: "0 0 0.3rem 0", opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)", textShadow: `0 0 60px ${GOLD}15` }}>
        DEFERRED TAX
      </h1>
      <h2 style={{ fontFamily: ff.display, fontSize: "clamp(1.2rem, 3.5vw, 2.2rem)", color: GOLD, fontWeight: 400, fontStyle: "italic", letterSpacing: "0.12em", margin: "0 0 2rem 0", opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s 0.15s cubic-bezier(0.16,1,0.3,1)" }}>
        The Heist
      </h2>

      {/* Description */}
      <div style={{ maxWidth: 520, color: "#888", fontFamily: ff.body, fontSize: "1.1rem", lineHeight: 1.9, marginBottom: "2.5rem", opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.8s ease" }}>
        A company is going public. The financials need to be spotless.
        Five specialists. Five jobs. One night to get the deferred tax right.
        <br /><span style={{ color: GOLD, fontStyle: "italic" }}>Are you in?</span>
      </div>

      {/* CTA */}
      <div style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(10px)", transition: "all 0.6s ease" }}>
        <HeistButton onClick={handleStart} size="lg" disabled={opening}>
          {opening ? "Cracking the vault\u2026" : "Enter The Vault"}
        </HeistButton>
      </div>
    </div>
  );
}

// ─── Briefing Screen ───
function BriefingScreen({ onNext }) {
  const [step, setStep] = useState(-1);
  const [typeDone, setTypeDone] = useState({});

  useEffect(() => {
    const timers = [];
    for (let i = 0; i < 4; i++) timers.push(setTimeout(() => setStep(i), 800 + i * 1400));
    return () => timers.forEach(clearTimeout);
  }, []);

  const lines = [
    { label: "TARGET", text: "TaxCorp Industries \u2014 IPO in 48 hours", icon: "\u{1F3AF}" },
    { label: "PROBLEM", text: "The tax expense doesn\u2019t match the tax paid. Investors are asking questions.", icon: "\u26A0\uFE0F" },
    { label: "MISSION", text: "Identify and correctly account for ALL deferred tax items before the roadshow.", icon: "\u{1F4CB}" },
    { label: "THE CREW", text: "Five specialists. Each handles one piece of the puzzle.", icon: "\u{1F465}" },
  ];

  return (
    <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 2rem 2rem" }}>
      {/* Desk scene at the top */}
      <div style={{ width: "100%", maxWidth: 700, marginBottom: "2rem", animation: "fadeIn 1s ease" }}>
        <DeskScene />
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.72rem", letterSpacing: "0.5em", color: RED, textTransform: "uppercase", fontFamily: ff.mono, marginBottom: "2rem" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: RED, animation: "pulseGlow 1.5s ease-in-out infinite", boxShadow: `0 0 8px ${RED}` }} />
        Classified Briefing
      </div>

      {/* Briefing lines */}
      <div style={{ width: "100%", maxWidth: 620 }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            opacity: step >= i ? 1 : 0, transform: step >= i ? "translateX(0)" : "translateX(-30px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)", marginBottom: "1.8rem",
            display: "flex", gap: "1rem", alignItems: "flex-start",
          }}>
            <div style={{ fontSize: "1.3rem", minWidth: 30, textAlign: "center", paddingTop: 2 }}>{line.icon}</div>
            <div>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.35em", color: GOLD, fontFamily: ff.mono, marginBottom: "0.3rem", fontWeight: 500 }}>{line.label}</div>
              {step >= i ? (
                <TypewriterText text={line.text} speed={18} delay={200} onDone={() => setTypeDone(d => ({ ...d, [i]: true }))}
                  style={{ color: CREAM, fontFamily: ff.body, fontSize: "1.05rem", lineHeight: 1.7 }} />
              ) : (
                <div style={{ color: CREAM, fontFamily: ff.body, fontSize: "1.05rem", lineHeight: 1.7, opacity: 0 }}>{line.text}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {step >= 3 && typeDone[3] && (
        <div style={{ marginTop: "1.5rem", animation: "fadeUp 0.5s ease" }}>
          <HeistButton onClick={onNext}>{"Meet The Crew \u2192"}</HeistButton>
        </div>
      )}
    </div>
  );
}

// ─── Crew Selection Screen ───
function CrewScreen({ onSelect, completed }) {
  const allDone = completed.length === 5;

  return (
    <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "3.5rem 1.5rem 3rem" }}>
      {/* Header */}
      <div style={{ fontSize: "0.68rem", letterSpacing: "0.5em", color: GOLD, textTransform: "uppercase", fontFamily: ff.mono, marginBottom: "0.5rem", fontWeight: 500, animation: "fadeIn 0.4s ease" }}>
        Assemble Your Crew
      </div>
      <p style={{ color: "#666", fontFamily: ff.body, fontSize: "1rem", marginBottom: "2rem", textAlign: "center", fontStyle: "italic" }}>
        Pin a dossier to begin their job. Complete all five to finish the heist.
      </p>

      {/* Cork board with dossier cards */}
      <div style={{ width: "100%", maxWidth: 900, animation: "fadeUp 0.6s ease" }}>
        <CorkBoard crew={CREW} completed={completed} onSelect={onSelect} />
      </div>

      {/* Completion */}
      {allDone && (
        <div style={{
          marginTop: "2.5rem", textAlign: "center", padding: "2rem 2.5rem",
          border: `1px solid ${GOLD}44`, background: `linear-gradient(135deg, ${GOLD}06, transparent, ${GOLD}04)`,
          maxWidth: 560, animation: "fadeUp 0.6s ease", position: "relative",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", animation: "celebratePop 0.6s ease" }}>{"\u{1F3C6}"}</div>
          <div style={{ color: GOLD, fontFamily: ff.display, fontSize: "1.5rem", fontStyle: "italic", marginBottom: "0.8rem" }}>
            The Heist Is Complete
          </div>
          <div style={{ color: "#999", fontFamily: ff.body, fontSize: "1.05rem", lineHeight: 1.7 }}>
            Every deferred tax entry accounted for. The IPO goes ahead.
            <span style={{ color: GOLD }}> It was about faithful representation all along.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mission Screen ───
function MissionScreen({ member, onComplete, onBack, score, setScore }) {
  const [phase, setPhase] = useState("intro");
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => { const t = setTimeout(() => setIntroReady(true), 300); return () => clearTimeout(t); }, []);

  const s = member.scenario;

  if (phase === "intro") {
    return (
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
        {/* Bookshelf background */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <BookshelfBg />
        </div>

        <div style={{ position: "relative", zIndex: 1, opacity: introReady ? 1 : 0, transform: introReady ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)", textAlign: "center", width: "100%" }}>
          {/* Large icon */}
          <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem", animation: "float 3s ease-in-out infinite" }}>{member.icon}</div>

          {/* Role badge */}
          <div style={{ display: "inline-block", background: `${member.color}15`, border: `1px solid ${member.color}33`, padding: "3px 16px", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.6rem", letterSpacing: "0.35em", color: member.color, textTransform: "uppercase", fontFamily: ff.mono, fontWeight: 500 }}>{member.role}</span>
          </div>

          <h2 style={{ color: CREAM, fontFamily: ff.display, fontSize: "2rem", fontWeight: 400, margin: "0 0 0.3rem 0" }}>{member.realName}</h2>
          <p style={{ color: `${member.color}cc`, fontFamily: ff.body, fontSize: "0.95rem", fontStyle: "italic", marginBottom: "2.5rem" }}>a.k.a. {member.name}</p>

          {/* Info in "file folder" style cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", textAlign: "left", marginBottom: "2.5rem" }}>
            {[
              { label: "Specialty", text: member.brief, col: CREAM },
              { label: "Key Concept", text: member.concept, col: member.color },
            ].map((block, i) => (
              <div key={i} style={{
                background: "#0c0c0c", border: `1px solid ${member.color}1a`, padding: "1.2rem",
                animation: `${i === 0 ? "slideInLeft" : "slideInRight"} 0.6s ${0.3 + i * 0.15}s cubic-bezier(0.16,1,0.3,1) both`,
                position: "relative",
              }}>
                {/* Tab at top */}
                <div style={{ position: "absolute", top: -1, left: 12, background: `${member.color}33`, padding: "1px 8px" }}>
                  <span style={{ fontSize: "0.5rem", letterSpacing: "0.3em", color: member.color, fontFamily: ff.mono, textTransform: "uppercase" }}>{block.label}</span>
                </div>
                <p style={{ color: block.col, fontFamily: ff.body, fontSize: "0.92rem", lineHeight: 1.7, margin: "0.5rem 0 0 0", fontStyle: i === 1 ? "italic" : "normal", opacity: i === 1 ? 0.85 : 1 }}>{block.text}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <HeistButton onClick={onBack} color="#666" size="sm">{"\u2190 Back"}</HeistButton>
            <HeistButton onClick={() => { setPhase("quiz"); setIntroReady(false); }} color={member.color} size="md">{"Start The Job \u2192"}</HeistButton>
          </div>
        </div>
      </div>
    );
  }

  // ─── Quiz Phase ───
  const handleReveal = () => {
    setRevealed(true);
    if (s.options[selected]?.correct) setScore(prev => prev + 1);
  };

  return (
    <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      {/* Evidence document illustration */}
      <div style={{ marginBottom: "1.5rem", animation: "fadeIn 0.6s ease", width: "100%" }}>
        <EvidenceDocument member={member} scenario={s} />
      </div>

      {/* Mission label */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem", animation: "fadeIn 0.4s ease" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: RED, animation: "pulseGlow 1.5s ease-in-out infinite", boxShadow: `0 0 6px ${RED}` }} />
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.4em", color: RED, textTransform: "uppercase", fontFamily: ff.mono, fontWeight: 500 }}>{s.title}</span>
      </div>

      {/* Narrative */}
      <TypewriterText text={s.narrative} speed={16} style={{ color: "#999", fontFamily: ff.body, fontSize: "1.02rem", lineHeight: 1.85, marginBottom: "1.8rem", textAlign: "center", maxWidth: 600 }} />

      {/* Question */}
      <div style={{ background: `linear-gradient(135deg, #111, #0c0c0c)`, border: `1px solid ${member.color}33`, padding: "1.4rem 1.8rem", marginBottom: "1.8rem", width: "100%", position: "relative", animation: "fadeUp 0.5s 0.3s ease both" }}>
        <div style={{ position: "absolute", top: -1, left: "20%", right: "20%", height: 2, background: `linear-gradient(90deg, transparent, ${member.color}66, transparent)` }} />
        <div style={{ color: CREAM, fontFamily: ff.display, fontSize: "1rem", lineHeight: 1.65, textAlign: "center", fontStyle: "italic" }}>{s.question}</div>
      </div>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", width: "100%", marginBottom: "1.5rem" }}>
        {s.options.map((opt, i) => {
          const isSelected = selected === i;
          let bg = "#0a0a0a", borderColor = "#1e1e1e", textColor = "#ccc", shadow = "none";
          if (revealed) {
            if (opt.correct) { bg = "#071a07"; borderColor = EMERALD; textColor = "#4ade80"; shadow = `0 0 20px ${EMERALD}22, inset 0 0 30px ${EMERALD}08`; }
            else if (isSelected) { bg = "#1a0707"; borderColor = RED; textColor = "#ff6b6b"; shadow = `0 0 20px ${RED}22`; }
          } else if (isSelected) { bg = `${member.color}0c`; borderColor = member.color; textColor = member.color; shadow = `0 0 20px ${member.color}15`; }

          return (
            <button key={i} onClick={() => { if (!revealed) setSelected(i); }}
              style={{
                background: bg, border: `1px solid ${borderColor}`, color: textColor,
                padding: "1.1rem 1rem", fontFamily: ff.body, fontSize: "0.92rem",
                cursor: revealed ? "default" : "pointer", transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                lineHeight: 1.55, textAlign: "left", boxShadow: shadow, position: "relative", overflow: "hidden",
                animation: `fadeUp 0.4s ${0.4 + i * 0.08}s cubic-bezier(0.16,1,0.3,1) both`,
                ...(revealed && isSelected && !opt.correct ? { animation: "shakeX 0.4s ease" } : {}),
              }}>
              <span style={{ fontFamily: ff.mono, fontSize: "0.6rem", fontWeight: 700, color: revealed && opt.correct ? "#4ade80" : isSelected ? member.color : "#444", display: "block", marginBottom: "0.3rem", letterSpacing: "0.1em", transition: "color 0.3s ease" }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt.text}
              {revealed && opt.correct && <span style={{ position: "absolute", top: 8, right: 10, fontSize: "1rem", animation: "celebratePop 0.3s ease" }}>{"\u2713"}</span>}
              {revealed && isSelected && !opt.correct && <span style={{ position: "absolute", top: 8, right: 10, fontSize: "1rem", color: "#ff6b6b" }}>{"\u2717"}</span>}
            </button>
          );
        })}
      </div>

      {/* Lock In */}
      {selected !== null && !revealed && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <HeistButton onClick={handleReveal} color={member.color} size="md">Lock It In</HeistButton>
        </div>
      )}

      {/* Result */}
      {revealed && (
        <div style={{ marginTop: "0.5rem", width: "100%", animation: "fadeUp 0.5s ease" }}>
          <div style={{
            background: s.options[selected]?.correct ? `linear-gradient(135deg, #071a07, #0a0a0a)` : `linear-gradient(135deg, #1a0707, #0a0a0a)`,
            border: `1px solid ${s.options[selected]?.correct ? EMERALD : RED}33`,
            padding: "1.5rem 1.8rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.options[selected]?.correct ? `linear-gradient(90deg, transparent, ${EMERALD}, transparent)` : `linear-gradient(90deg, transparent, ${RED}, transparent)` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.7rem" }}>
              <span style={{ fontSize: "1.3rem" }}>{s.options[selected]?.correct ? "\u{1F4B0}" : "\u{1F6A8}"}</span>
              <span style={{ color: s.options[selected]?.correct ? "#4ade80" : "#ff6b6b", fontFamily: ff.mono, fontSize: "0.7rem", letterSpacing: "0.25em", fontWeight: 700 }}>
                {s.options[selected]?.correct ? "JOB COMPLETE" : "NOT QUITE"}
              </span>
            </div>
            <div style={{ color: CREAM, fontFamily: ff.body, fontSize: "1rem", lineHeight: 1.8 }}>{s.options[selected]?.explanation}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <HeistButton onClick={() => onComplete(member.id)}>{"Return to Crew \u2192"}</HeistButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════

export default function DeferredTaxHeist() {
  const [screen, setScreen] = useState("title");
  const [activeMember, setActiveMember] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [score, setScore] = useState(0);

  const handleSelect = (member) => { setActiveMember(member); setScreen("mission"); };
  const handleComplete = (id) => {
    if (!completed.includes(id)) setCompleted([...completed, id]);
    setScreen("crew"); setActiveMember(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: CREAM, fontFamily: ff.body, overflow: "hidden" }}>
      <style>{GLOBAL_STYLES}</style>
      <link href={FONT_URL} rel="stylesheet" />

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: `radial-gradient(ellipse at 50% 20%, #141414 0%, ${DARK} 70%)` }} />
      <Particles />

      {screen !== "title" && <ProgressBar completed={completed} />}
      {screen !== "title" && <ScoreDisplay score={score} />}

      <ScreenTransition screenKey={screen + (activeMember?.id || "")}>
        {screen === "title" && <TitleScreen onStart={() => setScreen("briefing")} />}
        {screen === "briefing" && <BriefingScreen onNext={() => setScreen("crew")} />}
        {screen === "crew" && <CrewScreen onSelect={handleSelect} completed={completed} />}
        {screen === "mission" && activeMember && (
          <MissionScreen member={activeMember} onComplete={handleComplete} onBack={() => { setScreen("crew"); setActiveMember(null); }} score={score} setScore={setScore} />
        )}
      </ScreenTransition>
    </div>
  );
}
