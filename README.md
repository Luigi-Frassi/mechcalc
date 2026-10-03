<div align="center">

# ⚙️ MechCalc

**Quick preliminary sizing of mechanical transmissions and fits: from the requirements to the first dimensions for your CAD.**

*Free, ad-free, runs entirely in the browser.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pure Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20HTML5-F7DF1E.svg?logo=javascript&logoColor=black)]()
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind%203.x-38B2AC.svg?logo=tailwind-css&logoColor=white)]()
[![Privacy](https://img.shields.io/badge/Privacy-Cookie--free%20analytics-10B981.svg)](#-privacy)
[![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg?logo=vercel)]()

[**Explore the Web App**](https://mechcalc-nu.vercel.app/) • [**Report an Issue**](https://github.com/Luigi-Frassi/mechcalc/issues)

</div>

---

## 📌 Overview

**MechCalc** is an open-source web application for **preliminary sizing** (*dimensionamento di massima*). It is meant for whoever has to design a gear pair, a belt drive or a shaft-hub fit from scratch and does not know where to start: enter the requirements (power, speed, ratio, center distance, diameter) and get first-attempt dimensions — module and number of teeth, face width, pitch diameters, belt length, tolerance limits — ready to be drawn in CAD and then refined.

It automates the repetitive, iterative hand calculations of machine design, shows the geometry with live SVG sketches and includes 1-click demo presets.

* **From requirements to dimensions**: the result of every module is a set of quotes to start the CAD model from.
* **Classic machine design methods**: Hertz / Lewis for gears (course charts for helical factors and Lewis form factor), ISO 286-2 tolerances, ISO 54 module series, ISO 5296 / DIN 7721 belt pitches. Values are **preliminary**: detailed verification (e.g. ISO 6336 for gears, the belt manufacturer's catalog, FEM) is the next step.
* **Validated**: the gear module is checked against worked exam problems (see [Validation](#-validation)).
* **Client-side**: every calculation runs in your browser; nothing you enter is sent to a server.

---

## 🚀 Core Modules

### 1. Cylindrical Gears Synthesis & Rating (ISO 54 / Hertz & Lewis)
Solves the full gear pair synthesis problem with strict mounting constraints:
* **Synthesis from Theoretical $z_{\min}$**: Scans valid tooth combinations starting from the undercut limit:
  $$z_{\min} = \left\lceil \frac{2(1 - x_{r1})}{\sin^2 \theta} \right\rceil$$
* **Exact Center Distance Closure**: Analytically recalculates the helix angle $\alpha$ to close on a fixed mounting distance $i$:
  $$\cos \alpha = \frac{m_n (z_1 + z_2 + 2x_{r1})}{2i}$$
* **Dual Hertz & Lewis Checks**:
  * Evaluates pitting resistance at the Hertzian contact limit to determine the required face width factor $\phi$.
  * Filters out combinations exceeding tooth root bending limits ($\sigma_L \le 800\text{ MPa}$).
* **Helical Correction Factors**: $\Phi$, $\Psi$ and $\Gamma_{t1} + \Gamma_{t2}$ are taken from the course chart (digitized from the original vector plot, $\alpha$ = 0–50°, $z$ = 9–100, interpolation in $1/\sqrt{z}$ between the curves).
* **Lewis Form Factor from the Course Chart**: $y(z', x)$ for profile shifts $x$ = −0.6…+0.6 and equivalent teeth $z' = z/\cos^3\alpha$ = 10–200 (digitized from the chart, interpolated in $\log z'$ and $x$).
* **Series 3 Warning System**: Detects non-preferred tooling modules (Series 3) and compares them against scalable Series 1/2 alternatives.
* **Inverse Rating Mode ($W_{\max}$)**: Calculates maximum allowable power and torque for existing gear geometry.

### 2. Synchronous Timing Belts (ISO 5296 / DIN 7721)
* **Supported Pitches**: GT2 (2 mm), HTD 3M, HTD 5M, HTD 8M, and T5.
* **Center Distance Recalculation**: Recalculates exact geometric center distance ($C$) following integer commercial belt tooth rounding ($z_b$).
* **Kinematic Verification**: Computes driver wrap angle $\theta_1$, teeth in mesh ($z_{\text{mesh}}$), tangential tension ($F_t$), and catalog service factors ($c_0, c_1, c_2$).

### 3. ISO Fits & Tolerances Selector (ISO 286-2)
* **H7 Hole-Basis System**: Covers diameters from 3 mm to 500 mm (0.118" to 19.68").
* **Interactive SVG Visualization**: Real-time rendering of tolerance zones relative to the zero line.
* **Reverse Lookup Engine**: Identifies matching ISO fit classes directly from target clearance or interference values.
* **Manufacturing Notes**: Provides machining guidelines and recommended surface roughness ($R_a$).

### 4. Shaft Design: beam model → critical section → fatigue design
The three steps of the classic method, in three tabs:
* **1 · Beam & loads**: the shaft of length $L$ on two bearings with up to four elements (spur/helical gears, couplings, generic forces). Points are named as in the course: **A and B are the shaft ends**, bearings and elements become C, D, E, … from left to right. Gear forces from the torque ($F_t = 2M_t/d$, $F_r = F_t\tan\theta/\cos\alpha$, $F_a = F_t\tan\alpha$, with the couple $F_a\,r$); the direction of each force on the shaft is either chosen in the vertical (V) and horizontal (H) plane or derived from where the mating gear is (any angle) and the rotation of the shaft (driven gear: Ft follows the rotation; driving gear: it opposes it; an idler is two meshes at the same x), and previewed in an oblique view of the whole shaft and in an end view of the gear. Each gear or coupling carries a share of the shaft torque (e.g. 50 % when two users split the power) or none (idler gear). Output: reactions, required dynamic load rating of the bearings ($C = R\,L^{1/p}$), the life in hours and, with a catalog $C$, the actual life $L = (C/P)^p$, separate diagrams for the **vertical plane** (forces and $M_v$), the **horizontal plane** (forces and $M_h$), the **resultant** $M_f = \sqrt{M_v^2 + M_h^2}$ and the torque, with the values at every named point, and the **most stressed section**, which is sent to the design step with one click. Optionally, up to four **real sections** (diameter, shoulder and fillet, keyway) are checked with the beam loads: the critical one is the section with the lowest safety factor, not necessarily the one with the largest moment (e.g. a relief groove next to a gear), and it goes to the Check tab with one click.
* **2 · Design section**: finds the minimum diameter $d$ of the critical section from the Goodman line, with every coefficient re-evaluated at the diameter being tried (the "first attempt" iteration done automatically), then rounds it up to the next standard bearing bore and re-checks the section.
* **3 · Check section**: safety factors against fatigue and yield for a known $d$, $D$, $r$, plus the **maximum load** at that diameter (the usual exam question "find the maximum torque / power / load"): all loads scale together, so $X \propto 1/\text{load}$ and the limit is the current load $\times\,X/X_{req}$. The same tab gives the **fatigue life at the required X** (the $\sigma_N$ that closes the Goodman line, then the Wöhler line) and the **remaining life with Miner's rule or Manson's double linear rule** ($N_{II} = 14\,N^{0.6}$) after up to two previous load phases. The yield card also shows a static von Mises check on the peak stresses, for shafts that do not rotate.
* **Loads**: rotating (alternating) or constant bending, torque from power and speed or direct, constant / pulsating / fully reversed torsion, constant axial force.
* **Method of the machine design course**:
  $$\sigma_{a,eq} = \sqrt{(K_e\,\sigma_{a})^2 + 3\,(K_e'\,\tau_{a})^2},\qquad \sigma_{m,eq} = \tfrac{\sigma_m}{2} + \sqrt{\left(\tfrac{\sigma_m}{2}\right)^2 + \tau_m^2},\qquad \frac{\sigma_{a,eq}}{b_1 b_2 \sigma_N} + \frac{\sigma_{m,eq}}{\sigma_R} = \frac{1}{X}$$
* **Coefficients from the course charts**: $K_t$ of shouldered shafts ($B\,(r/d)^a$, bending / torsion / axial), notch sensitivity $q$ (the charts follow Neuber's formula exactly), size factor $b_1$, surface factor $b_2$ (9 finishes), effective factors for keyways (from the table or given by the problem), and **shoulder + keyway in the same section** (factors multiplied); finite life through the Wöhler line between $10^3$ and $10^6$ cycles.
* **Output**: the dimensions for CAD ($d$, $D$, $r$), every coefficient and stress, a Goodman diagram with the working point.

---

## ⚡ 1-Click Demo Presets

Load fully calculated engineering cases with a single click:

| Preset Name | Description | Key Specs |
| :--- | :--- | :--- |
| **Helical Gearbox** | Industrial reduction with locked center distance | $50\text{ kW}$, $i = 182\text{ mm}$, optimal $(z_1=19, z_2=78)$ |
| **Spur Gear Pair** | Standard industrial motor reduction | $5.5\text{ kW}$, $1450\text{ rpm}$, ratio $1:2$ |
| **Bearing Fit** | Precision shaft-to-bearing tolerance | $\varnothing 30\text{ mm}$ (H7/k6) |
| **Reducer Shaft** | Intermediate shaft of a spur-gear reducer (exam problem): beam, critical section, design | $30\text{ kW}$, $200\text{ rpm}$, $M_f = 1887\text{ N·m}$ at the bearing → $\varnothing 65$ |

---

## 🔗 Shareable Links

Every calculation is kept in the page address (module, inputs, modes, language, units, selected optimizer row), so the URL can be bookmarked or sent as it is. The **Share** button copies it (on phones it opens the system share sheet). Only values that differ from the defaults are written, e.g.:

```
https://mechcalc-nu.vercel.app/?m=fits&nominalDiameter=30&fitType=H7%2Fk6
```

---

## 🛠️ Architecture & Tech Stack

```text
mechcalc/
├── index.html                # Core UI shell, demo presets, and translations
├── modules/
│   ├── core/                 # Analytical engines: pure functions, no DOM access
│   │   ├── fits-core.js      # ISO 286 tolerance tables, fit analysis, reverse lookup
│   │   ├── belts-core.js     # Synchronous timing belt sizing logic
│   │   ├── gears-core.js     # Hertz/Lewis synthesis, tooth optimizer, W_max rating
│   │   └── shafts-core.js    # Shaft fatigue design: Kt, q, b1, b2, Goodman, bearing bores
│   └── ui/                   # Read inputs, call the core, render results and SVG
│       ├── fits-ui.js
│       ├── belts-ui.js
│       ├── gears-ui.js
│       ├── shafts-ui.js
│       └── share.js          # Shareable links: state <-> URL
├── tests/
│   ├── validation.test.js    # Core vs. worked exam problems (node, no dependencies)
│   └── browser_test.py       # Share links & form behaviour in headless Chromium (Playwright)
└── README.md                 # Documentation
```

Each `ui/*.js` file depends on the matching `core/*.js` file, so `index.html` loads the core first.

* **Frontend**: Pure Vanilla JavaScript (ES6+, classic `<script>` files, no bundler) & HTML5
* **Styling**: Tailwind CSS
* **Rendering**: Inline Mathematical SVG

---

## 📄 Calculation Reports

The **Report** button (shafts module, more modules coming) opens a printable A4 calculation report, saved as PDF from the browser's print dialog: design data, shaft layout and gear forces with the force previews, reactions and bearings, V / H / resultant / torque diagrams, critical and real sections, the section design or check with every formula and substituted value, Goodman diagram and sketch, life and maximum load, the dimensions to take into CAD, assumptions, and a link that reopens the same calculation. It is generated entirely in the browser.

## ✅ Validation

The gear module is checked against worked exam problems of the course *Costruzione di Macchine* (exam papers 2018–2022, solved by hand): spur and helical $W_{\max}$, Hertz face-width factor $\phi$ in design mode, Lewis stresses and the helical correction factors read from the chart.

| Check | Cases | Max deviation |
| :--- | :---: | :---: |
| Hertz, spur gears ($W_{\max}$, $M_{\max}$, $\phi$, $L$, $F_c$) | 9 | 0.7 % |
| Hertz, helical gears ($W_{\max}$ / capacity at the designed face width) | 3 | 1.0 % |
| Lewis bending stress $\sigma_L$, spur and helical (same $y$ as the hand solution) | 5 | 0.7 % |
| Lewis factor $y$ vs. values read by eye from the chart | 5 | 0.021 |
| Helical factors $\Phi$, $\Gamma_t$, $\Psi$ vs. values read by eye from the chart | 11 | 0.02 |
| Shafts: design diameter and safety factors vs. the official solution (exam of 11 April 2003) | 5 | 1.2 % |
| Shafts, beam model: gear forces, reactions, bending moments, bearing $C$ vs. the official and the hand solution | 17 | 0.7 % (1.3 % on a hand-rounded value) |
| Shafts: $K_t$, $q$, $b_1$, $b_2$ vs. values read by eye from the charts | 7 | 0.09 on $K_t$, 0.015 otherwise |
| Shafts, exam of 9 December 2002 (hand solution): beam moments, critical section, shoulder + keyway design ($d$ = 61 mm) | 11 | 1.4 % |
| Shafts, 11 more exams 2004–2023 (hand solutions): beams with overhangs, idler gears and levers, design, maximum torque / power / load, bearings | 198 | 0.5 % with the same coefficients as the hand solution |

The factor deviations are reading errors of the hand solutions (e.g. $y$ = 0.32 read for $z$ = 18, where the chart gives 0.341; $K_t$ = 2.5 read where the course formula gives 2.41). For the shoulder $K_t$ the tool uses the course formula $B\,(r/d)^a$; checked against the digitized course chart it stays within ±3 %, while values read by eye in the hand solutions differ by up to +14 %. Every other gap in the shaft exams is a hand slip (documented in the test notes). The official shaft solution writes $X$ = 1.91 for the fatigue check, but that value leaves out the torsion term of the Goodman line: with it, the same coefficients give $X$ = 1.82 (still above the required 1.75). Run the suite (no dependencies) with:

```bash
node tests/validation.test.js
```

---

## 💻 Running Locally

No dependencies, package managers, or build steps required:

```bash
# Clone the repository
git clone https://github.com/Luigi-Frassi/mechcalc.git

# Enter project directory
cd mechcalc

# Run using Python 3 built-in server
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your web browser.

---

## 🔒 Privacy

* All calculations run in the browser: the values you enter are never sent to a server.
* The site uses [Vercel Web Analytics](https://vercel.com/docs/analytics/privacy-policy) to count page views: no cookies, no cross-site tracking, visitors are counted with an anonymous hash that is discarded after 24 hours, and only aggregated statistics are kept (page, referrer, country, browser, device type).
* Shareable links carry the calculation in the address; before a page view is sent, a filter removes everything except the open module (`?m=gears`), so your inputs are not recorded.
* No ads, no third-party cookies.

---

## 📄 License

This project is open-source and distributed under the [MIT License](https://opensource.org/licenses/MIT).
