export function TurkeyWait() {
  return (
    <div className="turkey-stage" role="img" aria-label="A turkey is waiting while the plate is made">
      <svg className="turkey" viewBox="0 0 180 120" aria-hidden="true">
        <g className="turkey-walk">
          <g className="turkey-tail">
            <ellipse cx="58" cy="58" rx="8" ry="28" transform="rotate(-28 58 58)" />
            <ellipse cx="68" cy="52" rx="8" ry="30" transform="rotate(-12 68 52)" />
            <ellipse cx="78" cy="50" rx="8" ry="32" />
            <ellipse cx="88" cy="52" rx="8" ry="30" transform="rotate(12 88 52)" />
            <ellipse cx="98" cy="58" rx="8" ry="28" transform="rotate(28 98 58)" />
          </g>
          <ellipse className="turkey-body" cx="108" cy="70" rx="28" ry="18" />
          <path className="turkey-wing" d="M96 66c10 2 18 12 16 20-8-2-18-8-16-20z" />
          <g className="turkey-leg turkey-leg-a">
            <path d="M100 86l-6 16" />
            <path d="M94 102h8" />
          </g>
          <g className="turkey-leg turkey-leg-b">
            <path d="M116 86l6 16" />
            <path d="M114 102h8" />
          </g>
          <g className="turkey-head">
            <path className="turkey-neck" d="M128 62c8-8 10-20 6-28" />
            <circle cx="136" cy="32" r="9" />
            <path className="turkey-snood" d="M140 28c4 6 2 12-1 14" />
            <path className="turkey-beak" d="M144 32h10l-10 4z" />
            <circle className="turkey-eye" cx="138" cy="30" r="1.3" />
          </g>
        </g>
      </svg>
    </div>
  );
}
