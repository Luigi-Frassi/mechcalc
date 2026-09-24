<div align="center">

# ⚙️ MechCalc

**Fast, lightweight, ad-free, and privacy-first engineering toolbox for mechanical designers and students.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pure Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20HTML5-F7DF1E.svg?logo=javascript&logoColor=black)]()
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind%203.x-38B2AC.svg?logo=tailwind-css&logoColor=white)]()
[![Privacy](https://img.shields.io/badge/Privacy-Zero%20Tracking-10B981.svg)]()
[![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg?logo=vercel)]()

[**Explore the Web App**](https://mechcalc-nu.vercel.app/) • [**Report an Issue**](https://github.com/Luigi-Frassi/mechcalc/issues)

</div>

---

## 📌 Overview

**MechCalc** is an open-source, client-side web application designed to eliminate repetitive iterative calculations in mechanical transmission design and tolerance analysis. It provides immediate graphical feedback via mathematical SVGs and features 1-click demo presets.

* **Client-Side Speed**: 100% in-browser computation with zero server latency.
* **Standard-Compliant**: Follows ISO 286-2, ISO 54, and ISO 5296 / DIN 7721 standards.
* **Privacy by Design**: No telemetry, no third-party cookies, and no analytics scripts.

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

---

## ⚡ 1-Click Demo Presets

Load fully calculated engineering cases with a single click:

| Preset Name | Description | Key Specs |
| :--- | :--- | :--- |
| **Helical Gearbox** | Industrial reduction with locked center distance | $50\text{ kW}$, $i = 182\text{ mm}$, optimal $(z_1=19, z_2=78)$ |
| **Spur Gear Pair** | Standard industrial motor reduction | $5.5\text{ kW}$, $1450\text{ rpm}$, ratio $1:2$ |
| **Bearing Fit** | Precision shaft-to-bearing tolerance | $\varnothing 30\text{ mm}$ (H7/k6) |

---

## 🛠️ Architecture & Tech Stack

```text
mechcalc/
├── index.html          # Core UI shell, demo presets, and translations
├── modules/
│   ├── fits.js         # ISO 286 tolerance lookup tables and renderer
│   ├── belts.js        # Synchronous timing belt sizing logic
│   └── gears.js        # Hertz/Lewis synthesis and tooth optimizer
└── README.md           # Documentation
```

* **Frontend**: Pure Vanilla JavaScript (ES6+ Modules) & HTML5
* **Styling**: Tailwind CSS
* **Rendering**: Inline Mathematical SVG

---

## 💻 Running Locally

No dependencies, package managers, or build steps required:

```bash
# Clone the repository
git clone https://github.com/[Luigi-Frassi]/mechcalc.git

# Enter project directory
cd mechcalc

# Run using Python 3 built-in server
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your web browser.

---

## 📄 License

This project is open-source and distributed under the [MIT License](https://opensource.org/licenses/MIT).
