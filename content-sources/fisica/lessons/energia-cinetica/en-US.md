---
title: Kinetic Energy
---

:::text
## What is energy?

In physics, **energy** is the quantity that measures **a system's capacity to do work**, that is, to produce changes: setting something in motion, heating it, deforming it, lifting it. It comes in many forms (thermal, chemical, electrical, light, nuclear...), and one of the most powerful ideas in physics is that **energy is neither created nor destroyed: it only changes from one form into another** (or moves from one body to another).

In mechanics we mainly study three forms:

- **kinetic energy**: associated with **motion**;
- **potential energy**: associated with **position** or **configuration** (height, a compressed spring);
- **mechanical energy**: the sum of the two.

Energy is a **scalar quantity**: it has a numerical value and a unit, but **no direction**. In the International System of Units (SI), its unit is the **joule** (J):

$$1\ \text{J} = 1\ \text{N}\cdot\text{m} = 1\ \text{kg}\cdot\text{m}^2/\text{s}^2$$

In this lesson we study the first of these forms: the energy of motion.
:::

:::text
## Kinetic energy: the energy of motion

Every moving body has **kinetic energy** ($KE$). The word comes from the Greek *kínesis*, meaning "motion". Intuitively:

- a fast bowling ball knocks down more pins than a slow one: **the greater the speed**, the greater the energy;
- a truck at 40 km/h does far more damage in a crash than a bicycle at the same speed: **the greater the mass**, the greater the energy.

The mathematical expression that combines these two observations is:

$$KE = \frac{m\,v^2}{2}$$

where:

| Symbol | Quantity | SI unit |
|---|---|---|
| $KE$ | kinetic energy | joule (J) |
| $m$ | mass of the body | kilogram (kg) |
| $v$ | speed (magnitude of the velocity) | meter per second (m/s) |

**Watch the units!** To get the energy in joules, the mass must be in **kg** and the speed in **m/s**. If the speed is given in km/h, divide by 3.6:

$$72\ \text{km/h} = \frac{72}{3.6}\ \text{m/s} = 20\ \text{m/s}$$
:::

:::text
## Important properties

**1. Kinetic energy is never negative.** Mass is positive and $v^2 \ge 0$, so $KE \ge 0$. It is zero only when the body is at rest.

**2. The direction of motion does not matter.** Because speed appears squared, a car moving north at 20 m/s has the same kinetic energy as the same car moving south at 20 m/s.

**3. Kinetic energy is proportional to mass.** At the same speed, if the mass doubles, the energy doubles; if the mass triples, the energy triples.

**4. Kinetic energy is proportional to the square of the speed.** This is the point that shows up most on tests:

| Speed | Kinetic energy |
|---|---|
| $v$ | $KE$ |
| $2v$ | $4\,KE$ |
| $3v$ | $9\,KE$ |
| $v/2$ | $KE/4$ |

In other words, **doubling the speed quadruples the kinetic energy**. The graph of $KE$ versus $v$ is an arc of a **parabola** (through the origin), while the graph of $KE$ versus $m$ (at fixed $v$) is a **straight line**.

**5. Kinetic energy depends on the frame of reference.** Speed is measured relative to something. A passenger sitting in a bus has $KE = 0$ relative to the bus, but has kinetic energy relative to the road. In school problems, unless stated otherwise, use the ground as the reference frame.
:::

:::simulator kinetic-energy-explorer
Explore kinetic energy
Change the mass and the speed. Notice that the curve of kinetic energy versus speed is a parabola: doubling the speed makes the energy four times larger, while doubling the mass only doubles it.
:::

:::solved_exercise Kinetic energy of a car
A car of mass $1\,000\ \text{kg}$ travels at $72\ \text{km/h}$. Find its kinetic energy.
---resolution---
**1. Convert the speed to m/s:**

$$v = \frac{72}{3.6} = 20\ \text{m/s}$$

**2. Apply the formula:**

$$KE = \frac{m v^2}{2} = \frac{1\,000 \times 20^2}{2} = \frac{1\,000 \times 400}{2} = 200\,000\ \text{J}$$

**Answer:** $KE = 2 \times 10^5\ \text{J} = 200\ \text{kJ}$.
:::

:::solved_exercise Comparing speeds
A cyclist speeds up from $5\ \text{m/s}$ to $15\ \text{m/s}$. By what factor was the cyclist's kinetic energy multiplied?
---resolution---
The mass does not change, so the ratio of the energies depends only on the ratio of the squared speeds:

$$\frac{KE_f}{KE_i} = \frac{\frac{m v_f^2}{2}}{\frac{m v_i^2}{2}} = \left(\frac{v_f}{v_i}\right)^2 = \left(\frac{15}{5}\right)^2 = 3^2 = 9$$

**Answer:** the kinetic energy became **9 times larger** (the speed tripled, and $3^2 = 9$).
:::

:::solved_exercise Finding the speed from the energy
A $0.5\ \text{kg}$ ball has $25\ \text{J}$ of kinetic energy. What is its speed?
---resolution---
Solve the formula for $v$:

$$KE = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = \frac{2\,KE}{m} \quad\Rightarrow\quad v = \sqrt{\frac{2\,KE}{m}}$$

Substituting:

$$v = \sqrt{\frac{2 \times 25}{0.5}} = \sqrt{100} = 10\ \text{m/s}$$

**Answer:** $v = 10\ \text{m/s}$.
:::

:::solved_exercise Mass or speed: which matters more?
A $6\,000\ \text{kg}$ truck moves at $10\ \text{m/s}$, and a $1\,500\ \text{kg}$ car moves at $20\ \text{m/s}$. Which one has more kinetic energy?
---resolution---
**Truck:**

$$KE_{\text{truck}} = \frac{6\,000 \times 10^2}{2} = \frac{6\,000 \times 100}{2} = 300\,000\ \text{J}$$

**Car:**

$$KE_{\text{car}} = \frac{1\,500 \times 20^2}{2} = \frac{1\,500 \times 400}{2} = 300\,000\ \text{J}$$

**Answer:** both have the **same** kinetic energy, $3 \times 10^5\ \text{J}$. The truck has 4 times the car's mass, but the car has twice the speed, and twice the speed is "worth" 4 times more energy. The effects cancel out exactly.
:::

:::real_world_application Why speed limits matter so much
Because kinetic energy grows with the **square** of the speed, small increases in speed produce large increases in energy. A car at 80 km/h has **4 times** the kinetic energy of the same car at 40 km/h. In a collision, that energy has to be dissipated (crumpling the body, heating, breaking things), which is why high-speed crashes are so much more destructive. For the same reason, to stop, the car has to "remove" all that energy: the braking distance also grows with $v^2$, as we will see in the next lesson.
:::

:::curiosity Where did the "½" come from?
In the late 17th century, Gottfried Leibniz called the quantity $m v^2$ *vis viva* ("living force") and argued that it was conserved in certain collisions. The factor $\frac{1}{2}$ only took hold in the 19th century: in 1829, the French engineer Gaspard-Gustave Coriolis, in his book *Du calcul de l'effet des machines*, started using half of $m v^2$ and gave the word *travail* ("work") a technical meaning. With the $\frac{1}{2}$, kinetic energy fits perfectly into the work theorem, which is the subject of the next lesson.
:::

:::text
## Summary and common mistakes

- $KE = \dfrac{m v^2}{2}$, in joules, with $m$ in kg and $v$ in m/s.
- $KE$ is a scalar and never negative; it is zero only when the body is at rest.
- $KE \propto m$ (double the mass, double the energy) and $KE \propto v^2$ (double the speed, quadruple the energy).

**Common mistakes:**

- Forgetting to convert km/h to m/s (divide by 3.6).
- Forgetting to square the speed, or squaring the mass by mistake.
- Thinking that doubling the speed doubles the energy (it actually quadruples it).
- Giving a negative kinetic energy to a body moving "backward": the direction does not matter.
:::
