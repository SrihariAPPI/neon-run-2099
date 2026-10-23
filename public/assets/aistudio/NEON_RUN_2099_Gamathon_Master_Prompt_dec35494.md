# NEON RUN: 2099 — Gamathon Game-Building Master Specification

> **Project:** NEON RUN: 2099  
> **Genre:** Cyberpunk first-person / chase-camera arcade car racer  
> **Setting:** Night-only futuristic megacity  
> **Target:** A polished, playable browser game suitable for a gamathon demo  
> **Audience:** Beginner student team using AI coding assistants such as Claude or Antigravity  
> **Core promise:** Drive an original futuristic car through a neon highway, weave through traffic, earn credits, and unlock new machines.

---

## 0. Instructions for the AI coding assistant

You are the team's senior gameplay engineer, technical designer, and patient mentor. Help us build a real, working game—not just a mockup.

Before changing anything:

1. Inspect the existing repository and identify its framework, entry points, scripts, and current functionality.
2. If the repository already contains a working prototype, preserve useful systems and make focused changes. Do not blindly replace the whole project.
3. If it is empty, create a clean Vite + Three.js project.
4. Summarize the proposed implementation and identify the smallest playable milestone.
5. Implement in the phases in this document. Finish and test each phase before proceeding.

**Important working rules**

- Do not try to implement every feature in one response.
- Do not leave important buttons decorative or nonfunctional.
- Do not claim something works unless you ran and checked it.
- Prefer simple, robust gameplay systems over complex simulations.
- Use original game branding and original procedural/low-poly vehicle designs. Do not copy copyrighted game assets, logos, tracks, or UI.
- Avoid paid APIs, paid assets, accounts, multiplayer, or backend services unless the team explicitly chooses them later.
- Explain new files and changes in beginner-friendly language.
- Keep the game runnable after each phase.
- If an error occurs, fix it before adding more features.
- Ask for the exact console error or screenshot when needed; do not guess at unseen errors.

**First task:** inspect the repository and implement only the first playable vertical slice: a car, a road, responsive driving controls, and a stable camera.

---

# 1. Game vision

## 1.1 Title and hook

**NEON RUN: 2099 — Own the Midnight Highway**

In 2099, Vanta City never sleeps. Elevated roads cut through rain-soaked skyscrapers, glowing tunnels, industrial districts, and holographic billboards. The player is an underground driver entering illegal midnight highway runs.

The player starts with a modest street tuner and earns credits by surviving traffic, overtaking vehicles, and completing driving challenges. Credits unlock more distinctive futuristic cars and upgrades.

The experience should immediately communicate:

- Speed and danger
- A striking night-only cyberpunk world
- Responsive arcade driving
- A clear reward loop
- A memorable, original visual identity

## 1.2 Design pillars

1. **Instantly playable:** A judge should be able to start driving within seconds.
2. **Readable speed:** Road movement, passing traffic, sound, and camera feedback communicate velocity.
3. **Nighttime cyberpunk atmosphere:** Neon, dark architecture, reflective roads, haze, and a cohesive palette.
4. **Skill rewards:** Near misses, clean overtakes, distance, and challenges earn credits.
5. **Car identity:** Unlockable vehicles feel visually and mechanically distinct.
6. **Small but polished:** One excellent route and a satisfying loop are better than a huge empty map.

## 1.3 Scope guardrail

This is a focused highway arcade racer, not a full Forza/NFS open-world simulation.

**MVP (must be completed):**
- One playable futuristic car
- One endless or long-repeating neon highway
- First-person cockpit/hood view
- Optional simple chase camera if feasible
- Keyboard controls
- Traffic vehicles
- Collision/crash and restart
- Distance and speed HUD
- A clear start screen and end-of-run results
- Reliable browser build

**Polish and stretch goals (only after MVP works):**
- Second and third unlockable cars
- Credits and garage
- Near-miss bonuses
- Mobile touch controls
- Paint and underglow customization
- Time trial / contract challenges
- Additional highway scenery sets
- Soundtrack, engine audio, and enhanced effects

Do not sacrifice the core game to implement stretch goals.

---

# 2. Platform and technology

## 2.1 Recommended stack

Use a simple browser game stack:

- **Three.js** — 3D scene, camera, geometry, materials, lighting
- **Vite** — local development and production build
- **JavaScript ES modules** — keep the code approachable for beginners
- **HTML/CSS** — menus, HUD, garage, responsive overlays
- **Web Audio API** — optional lightweight synthesized audio / effects
- **LocalStorage** — local progress/settings if progression is implemented
- **Git + GitHub** — version control and collaboration
- **Vercel** — public live demo and judge-facing deployment

Use compatible stable package versions. Avoid adding a heavy physics engine at the start. Arcade driving can be implemented with a small, understandable controller.

## 2.2 Expected project commands

Set up and verify the project has working scripts similar to:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Use the actual scripts in the repository if they differ, and document them in the README.

## 2.3 Suggested structure

Adapt this to the existing repository; do not reorganize working code without a reason.

```text
neon-run-2099/
  index.html
  package.json
  README.md
  public/
    audio/
    textures/
  src/
    main.js
    styles.css
    game/
      Game.js
      GameState.js
      InputManager.js
      PlayerCar.js
      Highway.js
      TrafficManager.js
      CollisionSystem.js
      ScoreManager.js
      AudioManager.js
      SaveManager.js
    ui/
      MainMenu.js
      HUD.js
      PauseMenu.js
      ResultsScreen.js
      Garage.js
      Settings.js
```

Keep each module responsible for one area. Do not put the entire game into one huge file.

---

# 3. Gameplay and controls

## 3.1 Player vehicle

The player drives an original futuristic sports coupe. For the MVP, use a visually appealing low-poly/procedural model made from simple Three.js geometry.

The car should have:
- Distinct body silhouette
- Front hood visible in cockpit/hood view
- Windshield and basic interior/dashboard
- Headlights and taillights
- Four visible wheels in chase-camera view
- Emissive accents or restrained underglow

The first-person view is the primary experience. Add a chase camera only when the main driving loop is stable. A camera toggle is a useful polish feature, not a reason to delay the MVP.

## 3.2 Arcade driving model

Implement a stable, forgiving arcade controller—not realistic vehicle simulation.

Required behavior:
- Accelerate smoothly
- Brake and slow down
- Reach a capped maximum speed
- Steer left/right with smooth lateral response
- Steering should feel controllable at both low and high speeds
- Car stays within road boundaries
- Collision reduces speed and triggers a clear crash/end state
- Restart resets the run without duplicating loops or objects

Use delta time for movement so speed is not tied to frame rate. Keep gameplay values centralized and tune them through testing.

Avoid:
- Unbounded sideways movement
- Excessive camera shake
- Complex tire/suspension physics
- A car that feels like a floating cursor
- Unfair collision/spawn behavior

## 3.3 Controls

**Desktop**
- W / Arrow Up: accelerate
- S / Arrow Down: brake
- A / Arrow Left: steer left
- D / Arrow Right: steer right
- C: switch camera, if chase camera is implemented
- Escape: pause

**Mobile stretch goal**
- Large left/right steering buttons
- Accelerate and brake buttons
- Camera toggle if available
- Support holding controls
- Prevent page scrolling while driving
- Make controls fit a phone screen without covering essential HUD information

The game should be designed for landscape gameplay if that provides the best driving view. Make the orientation and control instructions clear.

---

# 4. World and visual direction

## 4.1 Vanta City at midnight

The entire game takes place at night. No daytime tracks, sunny environments, or daylight transitions.

Visual ingredients:
- Dark futuristic skyline
- Elevated highway
- Rain-slick asphalt or convincing dark reflective road material
- Cyan, magenta, violet, blue, and restrained amber/red accents
- Neon signs and holographic billboards
- Repeating streetlights
- Tunnel lights
- Distant building silhouettes
- Atmospheric fog/haze used carefully

**Visual hierarchy:** The road, lane markings, and traffic must remain easy to see. Neon should create atmosphere without making the screen unreadable.

## 4.2 Build a convincing highway efficiently

Create reusable road segments with:
- Road surface
- Lane markings
- Barriers
- Light poles
- A small number of roadside props

Recycle segments as they move behind the player to create an endless-road illusion. Reuse geometry/materials where possible. Avoid continuously adding objects to the scene.

For the MVP, make one straight or gently curving route. Do not attempt a large free-roaming city.

## 4.3 Environment variety

Start with **Neon Downtown** only.

Stretch environments, using the same road system:
1. Neon Downtown — cyan/magenta skyline
2. Industrial Night — factories and amber lights
3. Cyber Tunnel — enclosed tunnel with repeating luminous panels
4. Skyline Express — elevated road and distant city panorama

Variety can initially come from swapping scenery, lighting, and decorations—not building four separate maps.

---

# 5. Traffic, collision, and skill rewards

## 5.1 Traffic

Create simple original traffic vehicles from low-poly shapes:
- Futuristic sedans
- Autonomous taxis
- Delivery vans
- Buses
- Trucks

For the first version, two or three traffic shapes are enough.

Each vehicle should have:
- Lane assignment
- Speed
- Simple forward movement
- Collision bounds
- Safe spawning distance
- Recycling/removal once it is far behind

Traffic speeds should vary so the player can overtake. Do not spawn traffic directly in front of the player or block every lane unfairly.

## 5.2 Collision

Use simple bounding boxes or distance checks.

On collision:
- Stop or sharply reduce the player's speed
- Show a brief visual/audio impact cue if available
- End the run or enter a short crash state
- Display results and a retry action

Ensure collision is checked consistently and that the player cannot keep earning rewards after the run ends.

## 5.3 Near-miss scoring (polish)

A near miss is a close pass of a traffic vehicle without a collision.

Reward with:
- Bonus credits/score
- Short HUD callout
- Brief sound or visual feedback

Each traffic vehicle should award at most one near-miss reward per pass. Avoid false rewards when the player is far away.

---

# 6. Cars, garage, and progression

Add this only after the MVP is stable.

## 6.1 Original car roster

Use fictional names and original silhouettes. Do not use real automaker logos or copy recognizable licensed car models.

- **KAIRO S1:** balanced starter tuner
- **VANTA GT:** sleek grand tourer, higher top speed
- **RAZOR V8:** aggressive muscle-inspired car, strong acceleration
- **PHANTOM X:** expensive exotic hypercar, high top speed
- **NIGHTFALL RS:** responsive performance car, strong handling

Initially, implement KAIRO S1 and one additional car. The rest can be future content.

For simple procedural models, distinguish cars through proportions, body shapes, lights, and colors—not merely by changing a label.

## 6.2 Garage

The garage should:
- Show the selected vehicle in a dark neon presentation area
- Display name and relative stats
- Let the player select unlocked cars
- Show the credit price for locked cars
- Allow paint/underglow changes if feasible

Do not make a complex 3D showroom before the game is playable. A simple model display with a rotating camera is sufficient.

## 6.3 Rewards and saving

Award credits for:
- Distance
- Overtakes
- Near misses
- Completed challenges

If progression is included, save:
- Credits
- Unlocked cars
- Selected car
- Upgrade levels
- Settings

Use LocalStorage and handle missing/corrupt saved data gracefully. Provide a reset-progress action.

---

# 7. Game modes and UI

## 7.1 MVP mode: Midnight Run

The player begins a run, drives through traffic, and tries to travel as far as possible without crashing.

Track:
- Current speed
- Distance
- Overtakes
- Near misses (if implemented)
- Score/credits
- Best distance (optional)

After a crash, show a results screen with:
- Distance
- Maximum speed
- Overtakes
- Score/credits
- Retry
- Main menu

## 7.2 Main menu

Include:
- NEON RUN: 2099 logo/title
- Short one-line hook
- Play
- Garage (if implemented)
- Settings
- Controls/help

The main menu should be visually impressive but lightweight. The Play action should be obvious.

## 7.3 HUD

Use a clear cyberpunk HUD:
- Digital speedometer with readable units
- Distance
- Score/credits
- Pause button
- Near-miss callout if implemented

Avoid clutter and tiny text. Ensure HUD remains readable on a laptop and phone.

## 7.4 Pause and restart

Pause must stop gameplay updates, traffic, and scoring. Resume should continue the same run. Restart should reset run statistics and create no duplicate animation loops.

All visible buttons must work.

---

# 8. Audio and feedback

Audio is a polish layer. Implement it after driving, traffic, and restart are reliable.

Possible sounds:
- Engine tone that changes with speed
- Passing traffic
- Braking
- Near miss
- Collision
- UI click
- Original electronic/cyberpunk music loop, if a suitable original or properly licensed track is available

Browser audio may require a user gesture before playback. Respect this restriction and provide mute/volume settings.

Use original, generated, or properly licensed audio. Do not download copyrighted game soundtracks.

If audio assets are unavailable, the game must still work. Basic Web Audio synthesized effects are acceptable.

---

# 9. Gamathon judge experience

Judges should be able to understand and play the game quickly.

## 9.1 First 30 seconds

When the live game opens:
1. Show a polished title screen.
2. Explain the controls briefly.
3. Make Play immediately available.
4. Start the player on a visually striking neon highway.
5. Ensure the car moves and traffic is visible without requiring a lengthy tutorial.

## 9.2 Demo-ready quality checklist

Before submitting:
- The live URL opens without a developer console or setup steps.
- The first screen looks intentional and finished.
- The player can start a run quickly.
- Controls are explained and responsive.
- The car, road, and traffic are visually coherent.
- A crash/results/retry loop works.
- No critical console errors.
- No missing assets or broken links.
- The game has a clear original identity.
- The README explains the concept, controls, technology, and how to run it.
- The team has a short demo video as backup in case venue internet or deployment fails.

Do not add fake features or claim multiplayer, realistic physics, or extensive content if those are not implemented.

## 9.3 Suggested judge pitch

> NEON RUN: 2099 is a cyberpunk midnight highway racer. Players weave through futuristic traffic, earn rewards for daring overtakes, and unlock original high-performance cars. We focused on making a fast, accessible browser racing experience with a distinctive night-city atmosphere.

Customize this pitch to describe only features that actually work in the submitted build.

---

# 10. Development phases

**Complete each phase, run it, and test it before continuing.**

### Phase 1 — Setup and scene
- Vite + Three.js project
- Camera, renderer, dark sky/background
- Basic road and lighting
- Confirm dev server and production build

### Phase 2 — Player car
- Simple car geometry
- First-person/hood camera
- Acceleration, brake, steering
- Road boundaries
- Speed display

**Milestone:** The car is fun enough to drive on a simple road.

### Phase 3 — Endless highway
- Reusable road segments
- Lane markings and barriers
- Basic neon scenery
- Stable recycling

**Milestone:** The road appears continuous.

### Phase 4 — Traffic and collision
- Traffic spawning and lane movement
- Safe spacing
- Overtaking
- Collision and crash/restart

**Milestone:** A complete risk/reward driving run works.

### Phase 5 — Menu, HUD, results
- Start screen
- Pause/resume
- HUD
- Results screen
- Retry and return to menu

**Milestone:** Judges can play without developer assistance.

### Phase 6 — Polish
- Lighting and materials
- Better procedural car and traffic models
- Speed feedback and effects
- Sound
- Performance optimization

**Milestone:** The game looks and feels cohesive.

### Phase 7 — Stretch features
Only if time permits:
- Second car and garage
- Credits/unlocks
- Near-miss bonuses
- Mobile controls
- More scenery themes
- Time attack contracts

Do not start stretch features while core bugs remain.

---

# 11. Testing and performance

Test the game in the actual browser, not just by inspecting code.

Verify:
- App starts
- No uncaught console errors
- Keyboard input works
- Acceleration/braking/steering work
- Road recycling does not visibly break
- Traffic appears safely
- Collision ends the run
- Results and retry work
- Pause truly pauses
- No duplicate animation loops after restarting
- Production build succeeds
- Deployed version loads assets correctly

Performance:
- Reuse road segments and traffic objects where practical
- Share geometries/materials
- Keep lights and shadows modest
- Avoid heavy post-processing until needed
- Keep traffic count bounded
- Clean up resources when removing objects
- Do not promise a frame rate without testing it

If performance is poor, reduce traffic, scenery detail, and lighting complexity before adding optimization libraries.

---

# 12. GitHub collaboration and deployment

## 12.1 GitHub repository

Use one shared GitHub repository as the source of truth.

Recommended repository name: `neon-run-2099`

The repository should include:
- Source code
- `package.json` and lockfile
- README
- Controls and gameplay description
- Credits/licensing notes for any external assets
- Screenshots or a short demo GIF/video link, if available

Never commit API keys, passwords, private credentials, or unnecessary large files.

Beginner collaboration:
1. Assign one person as integration owner.
2. Give teammates separate tasks/modules.
3. Commit small working changes.
4. Pull and test before combining changes.
5. Keep the main branch deployable.
6. Tag or record the final gamathon submission version.

## 12.2 Vercel live demo

Use Vercel for the judge-facing playable URL.

Typical workflow:
1. Push the working project to GitHub.
2. Sign in to Vercel and import the GitHub repository.
3. Select Vite if prompted.
4. Confirm the build command is `npm run build`.
5. Confirm the output directory is `dist`.
6. Deploy.
7. Open the live URL on another device/browser and test the game.
8. Keep the GitHub repository and Vercel URL linked in the README/submission.

If Vercel's settings differ for the project, follow the detected framework configuration and verify the deployment logs.

**Important:** A successful deployment does not prove the game is playable. Test the deployed URL, including controls and asset loading.

## 12.3 Submission package

Prepare:
- Live Vercel URL
- GitHub repository URL
- Short README
- 30–60 second gameplay capture as backup
- One-sentence game pitch
- Brief list of implemented features and known limitations

The live URL is the easiest way for judges to try the product. GitHub demonstrates the source and development work. Both strengthen the presentation.

---

# 13. Final instruction to the coding assistant

Begin by inspecting the current repository.

Then:
1. Report what already exists.
2. Identify the smallest set of changes needed for a playable car-driving prototype.
3. Implement Phase 1 and Phase 2 only.
4. Run the project and production build.
5. Tell us how to test the controls and what remains.

Keep the work beginner-friendly, original, and focused. The priority is a real, stable, enjoyable cyberpunk highway racer that can be shown to gamathon judges.
