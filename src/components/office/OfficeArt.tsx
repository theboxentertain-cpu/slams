import { useId } from "react";
import type { PropKind } from "./office-data";

/** Original vector props are independent of the room painting and actual links. */
export function OfficeArt({ kind }: { kind: PropKind }) {
  const id = useId().replaceAll(":", "");
  const paper = `${id}-paper`,
    wood = `${id}-wood`,
    metal = `${id}-metal`;
  return (
    <svg viewBox="0 0 240 240" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={paper} x2="1" y2="1">
          <stop stopColor="#f1dfb3" />
          <stop offset="1" stopColor="#ad8b58" />
        </linearGradient>
        <linearGradient id={wood} x2="1" y2="1">
          <stop stopColor="#8b5430" />
          <stop offset=".45" stopColor="#4c2c1e" />
          <stop offset="1" stopColor="#211813" />
        </linearGradient>
        <linearGradient id={metal} x2="1" y2="1">
          <stop stopColor="#c7ad78" />
          <stop offset=".25" stopColor="#353933" />
          <stop offset=".65" stopColor="#171e1d" />
          <stop offset="1" stopColor="#8a7650" />
        </linearGradient>
      </defs>
      {kind === "clapper" && (
        <g transform="rotate(-8 120 120)">
          <rect
            x="20"
            y="78"
            width="200"
            height="123"
            rx="6"
            fill="#202322"
            stroke="#aa936d"
            strokeWidth="3"
          />
          <path d="M23 91h194M40 142h160M40 173h160M110 143v43" stroke="#bfb8a0" opacity=".6" />
          <text
            x="120"
            y="126"
            textAnchor="middle"
            fill="#ecdfbd"
            fontFamily="Georgia,serif"
            fontSize="21"
          >
            LIVING SCENE
          </text>
          <text x="68" y="165" textAnchor="middle" fill="#e9d9b5" fontSize="11">
            SCENE 01
          </text>
          <text x="158" y="165" textAnchor="middle" fill="#e9d9b5" fontSize="11">
            TAKE 01
          </text>
          <g className="clapper-arm" transform="rotate(-12 24 77)">
            <rect
              x="20"
              y="48"
              width="200"
              height="31"
              rx="3"
              fill="#e5dcc5"
              stroke="#302b23"
              strokeWidth="2"
            />
            {[20, 65, 110, 155, 200].map((x) => (
              <path key={x} d={`M${x} 49h22l-21 29h-22z`} fill="#202322" />
            ))}
          </g>
          <circle cx="30" cy="76" r="5" fill="#bd9657" />
        </g>
      )}
      {kind === "script" && (
        <g transform="rotate(6 120 120)">
          <path d="M47 26h152l-5 199H42z" fill="#785f42" />
          <path d="M40 19h152v199H40z" fill={`url(#${paper})`} stroke="#dfc895" />
          <rect x="90" y="10" width="52" height="21" rx="4" fill={`url(#${metal})`} />
          <text
            x="116"
            y="64"
            textAnchor="middle"
            fontFamily="Georgia,serif"
            fontSize="16"
            fill="#332c27"
          >
            THE SCENE
          </text>
          {[86, 101, 116, 131, 146, 161, 176, 191].map((y, i) => (
            <path
              key={y}
              d={`M59 ${y}h${i % 3 === 0 ? 76 : 112}`}
              stroke="#665e4d"
              strokeWidth="2"
              opacity=".65"
            />
          ))}
          <path
            d="M53 100l116 4M65 137q60-26 105-3M174 78q28 28 0 48M53 169l9 9 13-18"
            stroke="#952b32"
            strokeWidth="3"
          />
          <path d="M173 170l28-91 5 2-27 92-6 8z" fill="#9d3439" stroke="#d8aa6c" />
        </g>
      )}
      {kind === "casting" && (
        <>
          <rect
            x="14"
            y="12"
            width="212"
            height="210"
            rx="3"
            fill={`url(#${wood})`}
            stroke="#a27b49"
            strokeWidth="5"
          />
          <rect x="24" y="22" width="192" height="190" fill="#75583c" />
          <g transform="rotate(-5 85 100)">
            <path d="M38 40h111v153H38z" fill={`url(#${paper})`} />
            <text
              x="94"
              y="72"
              textAnchor="middle"
              fill="#493728"
              fontFamily="Georgia,serif"
              fontSize="16"
            >
              CASTING
            </text>
            <path
              d="M52 86h80M52 104h68M52 115h74M52 126h52M52 144h74M52 157h67"
              stroke="#776347"
              strokeWidth="3"
            />
            <circle cx="93" cy="46" r="5" fill="#922f34" />
          </g>
          <g transform="rotate(8 174 146)">
            <path d="M139 100h62v90h-62z" fill="#c9b994" />
            <path
              d="M148 126h43M148 140h32M148 153h39M148 166h36"
              stroke="#6e5f48"
              strokeWidth="2"
            />
            <circle cx="170" cy="106" r="5" fill="#b49c59" />
          </g>
        </>
      )}
      {kind === "portfolio" && (
        <g transform="rotate(-7 120 120)">
          <path
            d="M17 57q55-17 103 3 48-20 103-3v145q-54-12-103 4-50-16-103-4z"
            fill="#36231b"
            stroke="#a37c4e"
            strokeWidth="4"
          />
          <path
            d="M27 45q48-8 87 11v137q-39-16-87-8zM126 56q41-19 86-11v140q-47-8-86 8z"
            fill={`url(#${paper})`}
            stroke="#e7cfa0"
          />
          <rect x="40" y="69" width="59" height="68" fill="#9c927b" />
          <circle cx="69" cy="91" r="13" fill="#5e5c50" />
          <path d="M48 128q0-33 22-24 19-8 22 24" fill="#5e5c50" />
          <path
            d="M40 153h57M40 165h46M140 78h55M140 92h45M140 106h51M140 134h47M140 148h51M140 163h39"
            stroke="#77684c"
            strokeWidth="3"
          />
          <path d="M188 38v57l-10-8-9 8V41" fill="#8e3439" />
        </g>
      )}
      {kind === "diagram" && (
        <>
          <rect
            x="12"
            y="26"
            width="216"
            height="181"
            rx="4"
            fill={`url(#${wood})`}
            stroke="#ae8b56"
            strokeWidth="4"
          />
          <rect x="22" y="36" width="196" height="161" fill="#24312d" />
          <path
            d="M56 77l67 54 62-53M56 77l6 89 61-35 58 35 4-88M62 166h119M123 131V64"
            stroke="#d6cba6"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          {[
            [56, 77],
            [123, 131],
            [185, 78],
            [62, 166],
            [181, 166],
            [123, 64],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === 1 ? 13 : 7}
              fill={i === 1 ? "#a2423f" : "#ccb98a"}
            />
          ))}
          <text
            x="120"
            y="56"
            textAnchor="middle"
            fill="#ded3b4"
            fontFamily="Georgia,serif"
            fontSize="11"
          >
            ACTION · SPACE · RELATION
          </text>
        </>
      )}
      {kind === "mirror" && (
        <>
          <path
            d="M51 219V57a69 47 0 0 1 138 0v162z"
            fill={`url(#${wood})`}
            stroke="#bb9760"
            strokeWidth="6"
          />
          <path
            d="M63 206V59a57 36 0 0 1 114 0v147z"
            fill={`url(#${metal})`}
            stroke="#7c765c"
            strokeWidth="3"
          />
          <path d="M75 190l83-139M88 202l79-135" stroke="#d8d8be" strokeWidth="9" opacity=".12" />
          <path d="M42 224h157" stroke="#7e532f" strokeWidth="9" />
        </>
      )}
      {kind === "camera" && (
        <>
          <path
            d="M126 135l-56 98M126 135l55 98M126 135v98"
            stroke={`url(#${metal})`}
            strokeWidth="8"
          />
          <path d="M55 79h105v67H55z" fill={`url(#${metal})`} stroke="#af966d" strokeWidth="3" />
          <path d="M160 91l45-17v69l-45-15z" fill="#353b34" stroke="#b19a70" strokeWidth="3" />
          <circle cx="82" cy="57" r="32" fill="#252b28" stroke="#ae996c" strokeWidth="4" />
          <circle cx="143" cy="53" r="30" fill="#252b28" stroke="#ae996c" strokeWidth="4" />
          {[
            [82, 57],
            [143, 53],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="7" fill="#c4ab73" />
              <circle cx={x! - 13} cy={y! - 10} r="6" fill="#121b19" />
              <circle cx={x! + 13} cy={y! - 10} r="6" fill="#121b19" />
              <circle cx={x} cy={y! + 16} r="6" fill="#121b19" />
            </g>
          ))}
        </>
      )}
      {kind === "chair" && (
        <>
          <path
            d="M65 44l13 179M177 44l-15 179M70 140l110 83M171 140L66 223"
            stroke={`url(#${wood})`}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M60 39q58 10 121 0l-5 61q-55-9-109 0z"
            fill="#5c3131"
            stroke="#b48b55"
            strokeWidth="3"
          />
          <path
            d="M57 130q65-12 126 0l-12 18H69z"
            fill="#48352c"
            stroke="#ae8a55"
            strokeWidth="3"
          />
          <path
            d="M51 119l15-4M177 115l15 4"
            stroke="#ba9662"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <text
            x="121"
            y="76"
            textAnchor="middle"
            fill="#d3bc8d"
            fontFamily="Georgia,serif"
            fontSize="13"
          >
            TAKE YOUR TIME
          </text>
        </>
      )}
    </svg>
  );
}

export function DeskArt() {
  return (
    <svg viewBox="0 0 1000 270" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="desk-top" x2="0" y2="1">
          <stop stopColor="#9e653d" />
          <stop offset=".45" stopColor="#68402a" />
          <stop offset="1" stopColor="#3e271c" />
        </linearGradient>
        <linearGradient id="desk-front" x2="0" y2="1">
          <stop stopColor="#68432c" />
          <stop offset="1" stopColor="#211914" />
        </linearGradient>
      </defs>
      <path d="M80 10h840l80 102H0z" fill="url(#desk-top)" stroke="#b17a47" strokeWidth="3" />
      {[25, 42, 60, 80, 97].map((y) => (
        <path
          key={y}
          d={`M${80 - y * 0.7} ${y}Q500 ${y + 7} ${920 + y * 0.7} ${y}`}
          stroke="#c8975c"
          opacity=".22"
        />
      ))}
      <path d="M0 112h1000v20H0z" fill="#9a693e" />
      <path d="M15 132h970l-18 135H33z" fill="url(#desk-front)" stroke="#543721" strokeWidth="4" />
      <path
        d="M55 153h240v86H55zM705 153h240v86H705zM320 153h360v104H320z"
        stroke="#a37948"
        opacity=".4"
        strokeWidth="2"
      />
      <path d="M155 177h40M805 177h40" stroke="#b8965e" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
