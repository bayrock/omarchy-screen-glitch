#version 300 es
// CRT / glitch screen shader modelled on the php2shell clip.
// Toggle with the bayrock.screen-glitch plugin (or bin/screen-glitch). Tweak the
// constants below; the file is re-read whenever the toggle turns it on (or on
// `hyprctl reload` while it's on).
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;
out vec4 fragColor;

// ---------------- tweakables ----------------
const float INTENSITY    = 1.0;   // master scale for the always-on look (0.5 = subtle, 1.5 = like the video at its worst)
const float ABERRATION   = 1.6;   // px of red/cyan split at screen centre (grows toward edges)
const float GHOST        = 0.22;  // strength of the horizontal double-image smear
const float GHOST_PX     = 5.0;   // how far the ghost trails, px
const float SCANLINES    = 0.13;  // scanline darkness
const float SCAN_PERIOD  = 3.0;   // px between scanlines
const float HALFTONE     = 0.06;  // diagonal dot-screen strength
const float VIGNETTE     = 0.38;
const float GRAIN        = 0.035;
const float FLICKER      = 0.02;
const float BURST_EVERY  = 4.0;   // seconds per burst window (one possible burst per window)
const float BURST_CHANCE = 0.7;   // probability a window actually glitches
// ---------------------------------------------

float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 sampleRGB(vec2 uv, float ab) {
    float r = texture(tex, uv - vec2(ab, 0.0)).r;
    float g = texture(tex, uv).g;
    float b = texture(tex, uv + vec2(ab, 0.0)).b;
    return vec3(r, g, b);
}

void main() {
    vec2 res = vec2(textureSize(tex, 0));
    vec2 px = 1.0 / res;
    vec2 uv = v_texcoord;
    vec2 q = v_texcoord - 0.5;

    // ---- glitch burst scheduling ----
    float win   = floor(time / BURST_EVERY);
    float local = time - win * BURST_EVERY;
    float start = hash1(win + 1.3) * (BURST_EVERY - 0.7);
    float dur   = 0.12 + 0.45 * hash1(win + 7.1);
    float burst = (hash1(win + 3.7) < BURST_CHANCE && local > start && local < start + dur) ? 1.0 : 0.0;
    float tick  = floor(time * 24.0);               // glitch pattern changes ~24x/s

    // ---- horizontal slice tearing (bursts only) ----
    float bands = mix(8.0, 36.0, hash1(tick + 2.0));
    float band  = floor(uv.y * bands);
    float rb    = hash2(vec2(band, tick));
    float shift = burst * step(0.55, rb) * (hash2(vec2(band + 5.0, tick)) - 0.5) * 0.10;
    // a thin rolling tear line even between bursts, now and then
    float tearY = fract(time * 0.13);
    shift += (1.0 - burst) * step(0.82, hash1(floor(time * 0.5))) * 0.004 * INTENSITY
             * smoothstep(0.006, 0.0, abs(uv.y - tearY));
    uv.x += shift;

    // ---- chromatic aberration + ghost smear ----
    float edge = 0.55 + 1.3 * length(q);
    float ab = (ABERRATION * INTENSITY * edge + burst * (5.0 + 12.0 * hash1(tick))) * px.x;
    vec3 col = sampleRGB(uv, ab);
    float gpx = (GHOST_PX + burst * 14.0) * px.x;
    vec3 ghost = sampleRGB(uv - vec2(gpx, 0.0), ab * 1.5);
    col = mix(col, max(col, ghost), GHOST * INTENSITY + burst * 0.25);

    // ---- burst colour bands ----
    if (burst > 0.5) {
        if (rb > 0.88) col *= vec3(1.35, 0.65, 1.30);          // magenta band
        else if (rb < 0.07) col *= vec3(0.55, 1.25, 1.35);     // cyan band
        col *= 1.0 + 0.15 * (hash1(tick + 9.0) - 0.5);
    }

    // ---- scanlines ----
    float y = v_texcoord.y * res.y;
    float scan = 0.5 + 0.5 * sin((y + time * 6.0) * 6.2831853 / SCAN_PERIOD);
    col *= 1.0 - SCANLINES * INTENSITY * scan;

    // ---- halftone dot screen (45 degrees) ----
    vec2 p = v_texcoord * res;
    vec2 rot = vec2(p.x + p.y, p.x - p.y) * 0.7071;
    vec2 cell = fract(rot / 4.0) - 0.5;
    float dots = smoothstep(0.18, 0.05, dot(cell, cell));
    col *= 1.0 - HALFTONE * INTENSITY * (1.0 - dots);

    // ---- vignette ----
    float v = smoothstep(0.15, 0.75, dot(q, q) * 2.2);
    col *= 1.0 - VIGNETTE * INTENSITY * v;

    // ---- grain + flicker ----
    col += (hash2(p + fract(time * 37.0) * 311.0) - 0.5) * GRAIN * INTENSITY;
    col *= 1.0 + FLICKER * INTENSITY * (hash1(tick) - 0.5);

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
