# 🌴 Vice City: Next-Gen (3D Open World)

An expansive 3D open-world action experience set in neon-lit Vice City with GTA V caliber visuals, driving physics, police chases, missions, and procedural 80s synth radio. Built with **React**, **Three.js**, **TypeScript**, and **Tailwind CSS**.

---

## 🌟 Key Features

- **Massive 3D Map (800m × 800m)**:
  - **Ocean Drive & Beach**: Iconic beachfront boulevard lined with swaying palm trees, ocean waves, and neon Art Deco hotels (*The Malibu Club, Ocean View Hotel, Flamingo Suites, Pink Palms, Neon Horizon*).
  - **Starfish Island**: Sprawling waterfront mansion villa with classical columns, fountain driveway, and helipad.
  - **Downtown Skyscrapers**: High-rise towers (up to 95m tall) with reflective window grids, aviation beacons, and multi-lane expressways.
  - **Viceport Docks**: Shipping container yards and a moored luxury yacht.

- **GTA V Driving & Physics**:
  - Drivable vehicles: **Infernus Wedge Supercar**, **Stallion V8 Muscle Car**, **Vice Police Interceptor**, and **PCJ-600 Sports Bike**.
  - Dynamic suspension roll/pitch, handbrake drifting with tire skid marks, tire smoke, and nitro boost (`Shift`).
  - Seamless vehicle hijacking / entry & exit (`F` or `Enter`).

- **Alive World & Police AI**:
  - Autonomous AI civilian traffic cars cruising lanes.
  - Pedestrians walking sidewalks and fleeing when gunfire breaks out.
  - **1–5 Star Wanted Heat**: Police patrol cruisers chase, PIT maneuver, and box in the player with flashing red/blue lightbars and sirens.

- **Weapons Arsenal**:
  - Brass Knuckles, Vice 9mm Pistol, Micro-Uzi SMG, M4 Assault Rifle, and RPG-7 Rocket Launcher with explosive shockwaves and particle sparks.

- **Procedural 80s Synthesized Radio**:
  - Zero-dependency Web Audio procedural FM synthesis:
    - **Vice Wave 103** (80s synthwave arpeggios & retro bass)
    - **Flash FM** (Miami electro-funk groove)
    - **V-Rock** (80s overdrive rock chords)
  - Dynamic vehicle engine audio, sirens, gunshots, tire screech, and crash impacts.

- **Modern Low-Occlusion HUD**:
  - Rotating circular GPS mini-map radar with roads, player heading, traffic blips, and mission waypoints.
  - Speedometer (digital MPH gauge, drift indicator, nitro bar).
  - Time-of-day switcher (Sunset, Neon Midnight, Sunny Day).
  - Virtual touch controls for mobile & tablet devices.

---

## 🎮 Controls

| Action | Keyboard / Mouse | Touch Controls |
|---|---|---|
| **Move / Drive** | `WASD` or Arrow Keys | On-screen D-Pad |
| **Sprint / Nitro Boost** | `Shift` | `RUN` / `NITRO` button |
| **Jump / Handbrake Drift** | `Space` | `JUMP` / `DRIFT` button |
| **Enter / Exit / Carjack** | `F` or `Enter` | `ENTER CAR (F)` button |
| **Attack / Shoot** | Left Click | `FIRE` button |
| **Aim Stance** | Right Click (Hold) | Automatic crosshair |
| **Weapon Select** | `1`, `2`, `3`, `4`, `5` | Weapon Bar on HUD |
| **Change Radio Station** | `Q` | Radio HUD button |
| **Vehicle Horn** | `H` | - |
| **Look / Rotate Camera** | Mouse Movement | Swipe Screen |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed on your machine
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# Navigate to the project directory
cd vice-city-next-gen

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open your browser at `http://localhost:3000`.

### Production Build

```bash
# Compile and build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 🛠 Tech Stack

- **Three.js** (WebGL 3D Rendering, PBR Shaders, PCF Shadows, RoomEnvironment)
- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Web Audio API** (Procedural Synthesizers & Sound FX)

---

## 📄 License

MIT License. Free to use, modify, and build upon!
