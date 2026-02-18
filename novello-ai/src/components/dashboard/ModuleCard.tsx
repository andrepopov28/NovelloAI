import Image from 'next/image';
import Link from 'next/link';

interface ModuleCardProps {
    title: string;
    description: string;
    href: string;
    imageSrc: string;
    imageAlt: string;
}

export function ModuleCard({ title, description, href, imageSrc, imageAlt }: ModuleCardProps) {
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
            <div className="absolute inset-0 bg-black">
                <div className="absolute inset-0 opacity-50">
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                {/* Enhanced Gradient Overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.85) 100%)',
                    }}
                />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2
                    className="font-bold mb-1 transition-transform duration-300 group-hover:translate-y-[-2px]"
                    style={{
                        fontSize: 'var(--text-2xl)',
                        color: 'var(--text-inverse)',
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </h2>
                <p
                    className="transition-opacity duration-300"
                    style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-inverse)',
                        opacity: 0.85,
                        lineHeight: 1.4,
                    }}
                >
                    {description}
                </p>
            </div>

            {/* Hover Indicator */}
            <div
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: 'rgba(255,255,255,0.2)',
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
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </Link>
    );
}
