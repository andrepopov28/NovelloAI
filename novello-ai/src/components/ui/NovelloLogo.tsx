
import React from 'react';

export default function NovelloLogo() {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="novello-logo"
        >
            <defs>
                {/* Gradients */}
                <linearGradient id="gold-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#DFBD69" />
                    <stop offset="50%" stopColor="#9E7C2D" />
                    <stop offset="100%" stopColor="#DFBD69" />
                </linearGradient>

                <linearGradient id="gold-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#CC9933" />
                    <stop offset="100%" stopColor="#F5D076" />
                </linearGradient>

                <linearGradient id="silver-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E0E0E0" />
                    <stop offset="50%" stopColor="#B0B0B0" />
                    <stop offset="100%" stopColor="#E0E0E0" />
                </linearGradient>
            </defs>

            {/* Using a group to center the mark.
        Isometric diamonds: width 70, height 40 (approx).
        Stack offset Y: 25px
     */}
            <g transform="translate(65, 10)">

                {/* Bottom Layer: Filled Gold */}
                <path
                    d="M35 65 L70 85 L35 105 L0 85 Z"
                    fill="url(#gold-fill)"
                />

                {/* Middle Layer: Silver with transparency */}
                {/* Offset slightly up from bottom layer */}
                <path
                    d="M35 40 L70 60 L35 80 L0 60 Z"
                    fill="url(#silver-fill)"
                    fillOpacity="0.8"
                    stroke="#A0A0A0"
                    strokeWidth="1"
                />

                {/* Top Layer: Gold Outline */}
                <path
                    d="M35 15 L70 35 L35 55 L0 35 Z"
                    fill="none"
                    stroke="url(#gold-stroke)"
                    strokeWidth="3"
                />

            </g>

            {/* Text: NOVELLO (Gold), AI (Silver) */}
            <g transform="translate(25, 130)">
                <text
                    x="0"
                    y="0"
                    fontFamily="Inter, sans-serif"
                    fontWeight="800"
                    fontSize="24"
                    fill="url(#gold-fill)"
                    letterSpacing="0.05em"
                >
                    NOVELLO
                </text>
                <text
                    x="125"
                    y="0"
                    fontFamily="Inter, sans-serif"
                    fontWeight="bold"
                    fontSize="24"
                    fill="#B0B0B0"
                    letterSpacing="0.05em"
                >
                    AI
                </text>
            </g>
        </svg>
    );
}
