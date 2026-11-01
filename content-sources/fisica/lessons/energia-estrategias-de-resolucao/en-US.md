---
title: Energy: Problem-Solving Strategies and Combined Problems
---

:::text
## Formula overview

| Concept | Formula | Note |
|---|---|---|
| Work of a constant force | $W = F\,d\cos\theta$ | scalar, in J |
| Kinetic energy | $KE = \dfrac{m v^2}{2}$ | $\propto v^2$ |
| Work–energy theorem | $W_{\text{net}} = \Delta KE$ | all forces |
| Gravitational potential energy | $PE_g = m g h$ | $h$ from the reference |
| Hooke's law | $F = k\,x$ | restoring force |
| Elastic potential energy | $PE_{el} = \dfrac{k x^2}{2}$ | $x$ = deformation |
| Potential energy theorem | $W_{\text{cons}} = PE_i - PE_f$ | conservative forces only |
| Mechanical energy | $ME = KE + PE$ | |
| Mechanical energy theorem | $W_{\text{non-cons}} = \Delta ME$ | |
| Conservative system | $ME_i = ME_f$ | |
| Dissipative system | $ME_i = ME_f + E_{\text{diss}}$ | $E_{\text{diss}} = \lvert W_f \rvert$ |
:::

:::text
## A 5-step plan

1. **Sketch and identify the states.** Mark the initial and final points you care about. At each one, note the speed, the height and any spring deformation.
2. **Choose the reference level** for gravitational potential energy. Usually the lowest point of the motion.
3. **List the forces and classify them.** Which are conservative (weight, elastic)? Which are non-conservative (friction, air resistance, an engine, a person)? Which do no work (normal force and tension perpendicular to the motion)?
4. **Choose the theorem:**
   - only conservative forces do work → **conservation of mechanical energy**;
   - there is friction, an engine, etc. → **mechanical energy theorem** ($W_{\text{non-cons}} = \Delta ME$) or dissipated energy;
   - you want to relate work and a body's speed directly → **work–energy theorem**.
5. **Write the equation, solve for the unknown and check the units** (kg, m, m/s, N/m, J).

## Energy or kinematics?

Use **energy** when the problem involves **speeds and positions (heights, distances, deformations)** and does not ask for the **time**. It works even with curved paths (ramps, pendulums, roller coasters), where kinematics would be very hard. Use **kinematics and Newton's laws** when you need the **time** or the **acceleration** at each instant. Many problems combine the two: for example, energy to find the speed and Newton's second law (centripetal net force) to find the force at a point on the path.
:::

:::simulator energy-track
Energy lab
Use the simulator to check your answers: choose the mass, height and friction, predict the speed at the lowest point using conservation of energy (or the dissipated energy) and compare with the value shown.
:::

:::solved_exercise Spring and friction in the same problem
A $1\ \text{kg}$ block compresses a spring with constant $k = 400\ \text{N/m}$ by $20\ \text{cm}$, on a horizontal floor with coefficient of kinetic friction $\mu = 0.2$ ($g = 10\ \text{m/s}^2$). The block is released and touches the spring only while the spring pushes it. What total distance does the block travel, from the point where it was released, until it stops?
---resolution---
**Initial energy** (elastic only, since the block starts at rest and the floor is horizontal):

$$ME_i = \frac{k x^2}{2} = \frac{400 \times 0.2^2}{2} = \frac{400 \times 0.04}{2} = 8\ \text{J}$$

**Final energy:** the block stops and the spring is relaxed, so $ME_f = 0$.

**Friction:** acts during the whole trip (including while the spring is still pushing): $f = \mu m g = 0.2 \times 1 \times 10 = 2\ \text{N}$.

**Dissipated energy = initial energy:**

$$f\,d = 8 \quad\Rightarrow\quad d = \frac{8}{2} = 4\ \text{m}$$
:::

:::solved_exercise Tension at the bottom of a pendulum
A pendulum of length $L = 1\ \text{m}$ and mass $0.5\ \text{kg}$ is released from rest with the string horizontal. Ignoring air resistance ($g = 10\ \text{m/s}^2$), find the speed and the tension in the string at the lowest point.
---resolution---
**1. Energy** (the bob drops a height equal to $L$):

$$m g L = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = 2 g L = 2 \times 10 \times 1 = 20 \quad\Rightarrow\quad v = \sqrt{20} \approx 4.5\ \text{m/s}$$

**2. Dynamics of circular motion** at the lowest point: the net force (tension minus weight) is the centripetal force.

$$T - m g = \frac{m v^2}{L} \quad\Rightarrow\quad T = 0.5 \times 10 + \frac{0.5 \times 20}{1} = 5 + 10 = 15\ \text{N}$$

The tension is three times the weight ($3mg$), a result that holds for any pendulum released with the string horizontal.
:::

:::solved_exercise A real slide
A $30\ \text{kg}$ child starts from rest at the top of a $4\ \text{m}$-high slide and reaches the bottom at $6\ \text{m/s}$ ($g = 10\ \text{m/s}^2$). Calculate the dissipated energy and the percentage of the initial energy that turned into kinetic energy.
---resolution---
$$ME_i = 30 \times 10 \times 4 = 1\,200\ \text{J} \qquad ME_f = \frac{30 \times 6^2}{2} = 540\ \text{J}$$

$$E_{\text{diss}} = 1\,200 - 540 = 660\ \text{J} \qquad \frac{540}{1\,200} = 0.45 = 45\%$$

Only 45% of the potential energy became kinetic energy; the other 55% was dissipated (friction with the slide and air resistance).
:::

:::solved_exercise The direction of the throw does not matter
From the top of a $15\ \text{m}$ building, a stone is thrown at $10\ \text{m/s}$. Ignoring air resistance ($g = 10\ \text{m/s}^2$), with what speed does it reach the ground if it is thrown: a) upward; b) horizontally; c) downward?
---resolution---
Kinetic energy is a scalar: it does not depend on the direction of the velocity. By conservation of energy, with the reference at the ground:

$$\frac{m v_0^2}{2} + m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = v_0^2 + 2 g h = 100 + 2 \times 10 \times 15 = 400$$

$$v = 20\ \text{m/s}$$

**In all three cases** the stone arrives at $20\ \text{m/s}$. What changes is the time of fall and the direction of the velocity on arrival, not its magnitude.
:::

:::solved_exercise A block falling onto a spring
A $2\ \text{kg}$ block is dropped from rest $0.9\ \text{m}$ above the top of a vertical spring with constant $k = 4\,000\ \text{N/m}$. Ignoring friction ($g = 10\ \text{m/s}^2$), what is the maximum compression of the spring?
---resolution---
**States:** the start (at rest, $0.9\ \text{m}$ above the spring) and maximum compression $x$ (at rest again). Choose the point of maximum compression as the reference: in total, the block drops $0.9 + x$.

$$m g (0.9 + x) = \frac{k x^2}{2}$$

$$20\,(0.9 + x) = 2\,000\,x^2 \quad\Rightarrow\quad 2\,000\,x^2 - 20\,x - 18 = 0$$

**Quadratic formula:**

$$x = \frac{20 \pm \sqrt{20^2 + 4 \times 2\,000 \times 18}}{2 \times 2\,000} = \frac{20 \pm \sqrt{400 + 144\,000}}{4\,000} = \frac{20 \pm 380}{4\,000}$$

The positive root is $x = \dfrac{400}{4\,000} = 0.1\ \text{m}$ (the negative one has no physical meaning).

**Answer:** the maximum compression is $10\ \text{cm}$. Common mistake: forgetting that while compressing the spring the block still drops the distance $x$ and keeps losing potential energy.
:::

:::curiosity Energy is the same idea across all of science
The joule that measures a car's kinetic energy is the same joule that appears on the electricity bill (in kWh: $1\ \text{kWh} = 3.6 \times 10^6\ \text{J}$) and on food nutrition labels (in kcal: $1\ \text{kcal} \approx 4\,184\ \text{J}$). This common unit exists because all these forms of energy can be converted into one another, and the total amount is always conserved.
:::

:::text
## Checklist before handing in the test

- Are the units in SI? (g → kg, cm → m, km/h → m/s)
- Did I square the speed and the deformation?
- Did I use the **height difference** for the weight and the **distance traveled** for friction?
- Did I include the initial kinetic energy if the body was already moving?
- Does the sign of the work make sense (friction always negative; weight positive going down)?
- Is the answer physically reasonable? (a final speed greater than the initial one in a dissipative system with no height drop means there is a mistake.)
:::
