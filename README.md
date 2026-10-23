# NEON RUN: 2099 🏎️🌃

### Own the Midnight Highway

**NEON RUN: 2099** is a cyberpunk arcade racing game set in a futuristic megacity. Drive through neon-lit highways, dodge traffic, perform daring overtakes, and earn credits to customize and unlock futuristic cars.

Built as a browser-based 3D game, NEON RUN: 2099 combines fast-paced arcade driving with a neon-noir visual atmosphere.

> **Genre:** Cyberpunk | 3D Arcade Racing | Endless Highway
> **Platform:** Web Browser
> **Built for:** Gamathon
> **Technology:** React, TypeScript, Three.js, Vite

---

## 🎮 Game Overview

Welcome to Vanta City, 2099.

The city never sleeps. Elevated highways stretch between futuristic skyscrapers, holographic advertisements illuminate the night, and underground drivers compete to dominate the midnight roads.

You are one of those drivers.

Your objective is to survive the highway, overtake traffic, maintain your speed, and earn credits through your driving performance.

Every run is an opportunity to improve your score, push your limits, and build your collection of futuristic cars.

### Core Gameplay

* Drive a futuristic vehicle through a neon highway.
* Avoid collisions with traffic.
* Overtake vehicles and travel greater distances.
* Earn points and credits through driving performance.
* Unlock and customize vehicles through the garage.
* Switch between supported camera perspectives.
* Challenge yourself to beat your previous records.

---

## ✨ Features

### 3D Cyberpunk Environment

Experience a futuristic nighttime highway with neon-inspired visuals, atmospheric lighting, and a cityscape designed to create a sense of speed.

### Arcade Driving

Control your vehicle using responsive driving inputs. Navigate traffic and avoid collisions while maintaining your momentum.

### Traffic and Near-Miss Gameplay

Navigate through traffic and reward risky but skillful driving. Near misses and overtakes contribute to the arcade racing experience.

### Multiple Camera Perspectives

Switch between supported camera modes, including chase, cockpit, and bumper views.

### Garage and Vehicle Customization

Explore the garage, select available cars, and personalize supported vehicle appearance options such as paint and underglow.

### Progression System

Earn credits based on your run performance. Use your credits to progress through the vehicle collection and customization system.

### Performance HUD

Monitor gameplay information such as:

* Current speed
* Distance travelled
* Score
* Overtakes
* Near misses
* Nitro status
* Gear and RPM indicators

### Run Results

After a crash, review your performance, credits earned, and progress toward your best run.

### Browser-Based Experience

Play directly in a compatible web browser without installing a traditional desktop game.

---

## 🕹️ Controls

The game supports keyboard controls and includes a touch-control interface.

| Action          | Control                                      |
| --------------- | -------------------------------------------- |
| Steer           | Use the configured left/right steering keys  |
| Accelerate      | Use the configured acceleration key          |
| Brake           | Use the configured brake key                 |
| Pause / Resume  | `Esc`                                        |
| Change camera   | Use the camera control in the game interface |
| Mobile steering | Use on-screen touch controls                 |

**Note:** Check the actual in-game control labels before publishing this table. Update the keyboard bindings to match the final implementation.

---

## 🛠️ Technology Stack

| Technology     | Purpose                                                         |
| -------------- | --------------------------------------------------------------- |
| React          | Game interface and UI state                                     |
| TypeScript     | Type-safe application and game logic                            |
| Three.js       | Real-time 3D rendering                                          |
| Vite           | Development server and production build                         |
| HTML and CSS   | Menus, HUD, overlays, and responsive styling                    |
| LocalStorage   | Local game progression and saved preferences, where implemented |
| Git and GitHub | Version control and collaboration                               |
| Vercel         | Suggested platform for hosting the browser demo                 |

---

## 🏗️ Project Structure

```text
neon-run-2099/
├── public/
│   └── assets/
│       └── aistudio/
├── src/
│   ├── components/
│   │   ├── GarageModal.tsx
│   │   ├── HUD.tsx
│   │   ├── MainMenu.tsx
│   │   ├── PauseModal.tsx
│   │   ├── ResultsModal.tsx
│   │   └── TouchControls.tsx
│   ├── game/
│   │   ├── audio.ts
│   │   ├── cars.ts
│   │   ├── engine.ts
│   │   ├── highway.ts
│   │   ├── models.ts
│   │   ├── particles.ts
│   │   ├── textures.ts
│   │   └── traffic.ts
│   ├── types/
│   │   └── game.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

Install:

* Node.js (a version compatible with the project's Vite dependencies)
* npm or Bun
* Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd neon-run-2099
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Install dependencies

Using npm:

```bash
npm install
```

Or, if you use Bun:

```bash
bun install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed in your terminal. The project is configured to use port `3000` by default.

### 4. Create a production build

```bash
npm run build
```

The production files should be generated in the `dist/` directory.

### 5. Preview the production build

```bash
npm run preview
```

---

## 🌐 Deployment

We recommend deploying the game using **Vercel**.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Select Vite as the framework if it is not detected automatically.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Deploy the project.
7. Test the public link on a separate browser and device.

### Submission Links

* **Live Demo:** ADD_YOUR_VERCEL_URL
* **GitHub Repository:** ADD_YOUR_GITHUB_URL
* **Demo Video:** ADD_YOUR_VIDEO_URL

---

## 🧪 Testing Checklist

Before presenting the game to judges, verify:

* [ ] The main menu opens correctly.
* [ ] A player can start a run.
* [ ] The vehicle responds to steering and acceleration.
* [ ] Traffic appears and can be avoided.
* [ ] Collisions trigger the appropriate game-over flow.
* [ ] The results screen displays the final run information.
* [ ] Restarting a run works.
* [ ] Camera switching works.
* [ ] The garage and available customization options work.
* [ ] Credits and saved progression behave correctly.
* [ ] The game runs in a production build.
* [ ] The game is playable using the public deployment URL.
* [ ] The game can be demonstrated reliably on the device used for judging.

---

## 👥 Team

Created by: **[Innovexa]**

Gamathon project: **NEON RUN: 2099**

---

## 🔮 Future Improvements

Potential future enhancements include:

* Additional futuristic vehicles and vehicle classes.
* More highway environments and scenery variations.
* Improved traffic AI and difficulty progression.
* Additional driving challenges and time trials.
* Enhanced audio and environmental effects.
* Optimized mobile performance.
* Controller support.
* Online leaderboards, if a suitable backend is added.

---

## 📄 Credits and Acknowledgements

This project was developed as a student game-development project.

Add credits for any third-party models, textures, fonts, audio, libraries, or other assets used in the final game. Ensure that all external assets comply with their respective licenses.

**NEON RUN: 2099 — Own the Midnight Highway.**
