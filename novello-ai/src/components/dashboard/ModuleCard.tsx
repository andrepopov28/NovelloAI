import Image from 'next/image';
import Link from 'next/link';

interface ModuleCardProps {
    title: string;
    description: string;
    href: string;
    imageSrc: string;
    imageAlt: string;
    /** Whether the theme uses light-colored images (needs dark text). Defaults to false (dark text on dark image = white text). */
    lightTheme?: boolean;
}

export function ModuleCard({ title, description, href, imageSrc, imageAlt, lightTheme = false }: ModuleCardProps) {
    // For light themes: subtle light-to-dark-from-bottom overlay, dark text
    // For dark themes: classic dark gradient overlay, white text
    const overlayGradient = lightTheme
        ? 'linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.88) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.85) 100%)';

    const titleColor = lightTheme ? 'var(--text-primary)' : '#ffffff';
    const descColor = lightTheme ? 'var(--text-secondary)' : 'rgba(255,255,255,0.85)';
    const arrowStroke = lightTheme ? 'var(--text-primary)' : 'white';
    const arrowBg = lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)';

    return (
        <Link
            href={href}
            className="group relative overflow-hidden rounded-[var(--radius-lg)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{
                aspectRatio: '16 / 10',
                boxShadow: 'var(--shadow-md)',
            }}
        >
            {/* Background Image */}
            <div className="absolute inset-0" style={{ background: lightTheme ? '#f0ece4' : '#000' }}>
                <div className="absolute inset-0" style={{ opacity: lightTheme ? 1 : 0.5 }}>
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        data-no-filter="true"
                    />
                </div>
                {/* Gradient Overlay */}
                <div
                    className="absolute inset-0"
                    style={{ background: overlayGradient }}
                />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2
                    className="font-bold mb-1 transition-transform duration-300 group-hover:translate-y-[-2px]"
                    style={{
                        fontSize: 'var(--text-2xl)',
                        color: titleColor,
                        lineHeight: 1.2,
                        textShadow: lightTheme ? 'none' : '0 1px 4px rgba(0,0,0,0.4)',
                    }}
                >
                    {title}
                </h2>
                <p
                    className="transition-opacity duration-300"
                    style={{
                        fontSize: 'var(--text-base)',
                        color: descColor,
                        lineHeight: 1.4,
                        textShadow: lightTheme ? 'none' : '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                >
                    {description}
                </p>
            </div>

            {/* Hover Indicator */}
            <div
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: arrowBg,
                    backdropFilter: 'blur(10px)',
                }}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M6 12L10 8L6 4"
                        stroke={arrowStroke}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </Link>
    );
}
