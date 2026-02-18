#!/bin/sh
# Download curated Unsplash images for all 9 Novello AI themes × 6 modules
# Compatible with macOS /bin/sh (bash 3)

DEST="/Users/andrepopov/Documents/NovelloAI/novello-ai/public/images/themes"
SUCCESS=0
FAIL=0

dl() {
    theme="$1" module="$2" url="$3"
    outfile="$DEST/$theme/$module.webp"
    if curl -sL --max-time 30 -o "$outfile" "$url" && [ -s "$outfile" ]; then
        echo "  ✓ $theme/$module"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  ✗ $theme/$module (failed)"
        FAIL=$((FAIL + 1))
    fi
}

echo "Downloading 54 theme module images..."

# ── DARK (Cinematic noir, deep shadows, neon/gold) ──────────────────────────
dl dark write      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&h=1000&fit=crop&q=90"
dl dark brainstorm "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1600&h=1000&fit=crop&q=90"
dl dark data       "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&h=1000&fit=crop&q=90"
dl dark audiobook  "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&h=1000&fit=crop&q=90"
dl dark publish    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=1000&fit=crop&q=90"
dl dark settings   "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=1000&fit=crop&q=90"

# ── LIGHT (Apple minimalist, bright studio, white surfaces) ─────────────────
dl light write      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1600&h=1000&fit=crop&q=90"
dl light brainstorm "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=1600&h=1000&fit=crop&q=90"
dl light data       "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&h=1000&fit=crop&q=90"
dl light audiobook  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600&h=1000&fit=crop&q=90"
dl light publish    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1600&h=1000&fit=crop&q=90"
dl light settings   "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=1600&h=1000&fit=crop&q=90"

# ── SWISS (Bauhaus/International, bold geometry, primary colors) ─────────────
dl swiss write      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1600&h=1000&fit=crop&q=90"
dl swiss brainstorm "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600&h=1000&fit=crop&q=90"
dl swiss data       "https://images.unsplash.com/photo-1568667256549-094345857637?w=1600&h=1000&fit=crop&q=90"
dl swiss audiobook  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&h=1000&fit=crop&q=90"
dl swiss publish    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1600&h=1000&fit=crop&q=90"
dl swiss settings   "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1600&h=1000&fit=crop&q=90"

# ── EINK (Warm paper, cream stock, fountain pen, brass lamp) ────────────────
dl eink write      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&h=1000&fit=crop&q=90"
dl eink brainstorm "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1600&h=1000&fit=crop&q=90"
dl eink data       "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=1000&fit=crop&q=90"
dl eink audiobook  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1600&h=1000&fit=crop&q=90"
dl eink publish    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1600&h=1000&fit=crop&q=90"
dl eink settings   "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=1600&h=1000&fit=crop&q=90"

# ── CUPERTINO (Apple Glass, frosted surfaces, soft bokeh) ───────────────────
dl cupertino write      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1600&h=1000&fit=crop&q=90"
dl cupertino brainstorm "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=1600&h=1000&fit=crop&q=90"
dl cupertino data       "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&h=1000&fit=crop&q=90"
dl cupertino audiobook  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600&h=1000&fit=crop&q=90"
dl cupertino publish    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1600&h=1000&fit=crop&q=90"
dl cupertino settings   "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1600&h=1000&fit=crop&q=90"

# ── ACADEMIA (Dark Academia, candlelight, leather, aged wood) ───────────────
dl academia write      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&h=1000&fit=crop&q=90"
dl academia brainstorm "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1600&h=1000&fit=crop&q=90"
dl academia data       "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&h=1000&fit=crop&q=90"
dl academia audiobook  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1600&h=1000&fit=crop&q=90"
dl academia publish    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=1000&fit=crop&q=90"
dl academia settings   "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=1600&h=1000&fit=crop&q=90"

# ── BRUTALIST (Raw concrete, stark black outlines, bold contrast) ────────────
dl brutalist write      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1600&h=1000&fit=crop&q=90"
dl brutalist brainstorm "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600&h=1000&fit=crop&q=90"
dl brutalist data       "https://images.unsplash.com/photo-1568667256549-094345857637?w=1600&h=1000&fit=crop&q=90"
dl brutalist audiobook  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&h=1000&fit=crop&q=90"
dl brutalist publish    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1600&h=1000&fit=crop&q=90"
dl brutalist settings   "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=1000&fit=crop&q=90"

# ── TERMINAL (Cyber-Terminal, green phosphor glow, dark screens) ─────────────
dl terminal write      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&h=1000&fit=crop&q=90"
dl terminal brainstorm "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&h=1000&fit=crop&q=90"
dl terminal data       "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=1000&fit=crop&q=90"
dl terminal audiobook  "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&h=1000&fit=crop&q=90"
dl terminal publish    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&h=1000&fit=crop&q=90"
dl terminal settings   "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&h=1000&fit=crop&q=90"

# ── EDITORIAL (High-Fashion, stark white studio, editorial photography) ───────
dl editorial write      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1600&h=1000&fit=crop&q=90"
dl editorial brainstorm "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=1600&h=1000&fit=crop&q=90"
dl editorial data       "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&h=1000&fit=crop&q=90"
dl editorial audiobook  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600&h=1000&fit=crop&q=90"
dl editorial publish    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1600&h=1000&fit=crop&q=90"
dl editorial settings   "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1600&h=1000&fit=crop&q=90"

echo ""
echo "Done: $SUCCESS downloaded, $FAIL failed"
