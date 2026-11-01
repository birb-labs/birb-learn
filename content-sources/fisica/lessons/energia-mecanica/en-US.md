---
title: Mechanical Energy and Its Conservation
---

:::text
## Putting the pieces together

In the previous lessons we saw the energy of motion (kinetic) and the stored energies (gravitational and elastic potential). The sum of all of them is the system's **mechanical energy** ($ME$):

$$ME = KE + PE = \frac{m v^2}{2} + m g h + \frac{k x^2}{2}$$

(include only the terms that exist in the problem: if there is no spring, there is no elastic energy.)

Mechanical energy is useful because, in many situations, it **does not change**: energy just moves from one form to another. A falling ball loses potential energy and gains exactly the same amount of kinetic energy.
:::

:::text
## The mechanical energy theorem

Let us split the forces acting on a body into two groups: **conservative** (weight, elastic force) and **non-conservative** (friction, air resistance, the force of an engine, the force of a person pushing).

By the work–energy theorem, the net work equals $\Delta KE$:

$$W_{\text{cons}} + W_{\text{non-cons}} = \Delta KE$$

By the potential energy theorem, $W_{\text{cons}} = -\Delta PE$. Substituting:

$$-\Delta PE + W_{\text{non-cons}} = \Delta KE \quad\Rightarrow\quad W_{\text{non-cons}} = \Delta KE + \Delta PE$$

Since $\Delta KE + \Delta PE = \Delta ME$, we arrive at the **mechanical energy theorem**:

$$W_{\text{non-conservative}} = \Delta ME = ME_{\text{final}} - ME_{\text{initial}}$$

> **The change in a system's mechanical energy equals the work done by the non-conservative forces.**

- If the non-conservative forces do **negative** work (friction, air resistance), the mechanical energy **decreases**.
- If they do **positive** work (an engine, a person pushing), the mechanical energy **increases**.
- If they do no work, the mechanical energy is **conserved**.
:::

:::text
## The principle of conservation of mechanical energy

When **only conservative forces do work**, $W_{\text{non-cons}} = 0$ and:

$$ME_{\text{initial}} = ME_{\text{final}} \qquad\text{that is}\qquad KE_i + PE_i = KE_f + PE_f$$

Such a system is called a **conservative system**.

**Watch out:** "only conservative forces do work" does **not** mean that only conservative forces exist. Forces that are always perpendicular to the motion (such as the **normal force** on a frictionless track or the **tension** in a pendulum string) **do no work** and therefore do not change the mechanical energy.

## Important consequences

**Free fall (no air resistance).** A body dropped from rest from a height $h$ reaches the ground with:

$$m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v = \sqrt{2 g h}$$

The mass cancels: without air resistance, a light body and a heavy one arrive with the same speed.

**Frictionless ramps and tracks.** The speed at a point depends **only on the height difference** from the starting point, not on the shape of the track. A gentle ramp and a steep ramp of the same height deliver the same speed at the bottom (the steep one just does it faster).

**Graphs.** In a conservative system, the graph of $ME$ versus time or position is a horizontal line; the curves of $KE$ and $PE$ are "mirror images": when one goes up, the other goes down by the same amount.
:::

:::simulator energy-track
Conservation of mechanical energy
Without friction, the mechanical energy bar does not change: the ball trades potential energy for kinetic energy and back, and always returns to the height it started from. At the lowest point all the energy is kinetic; at the highest points, all of it is potential.
:::

:::solved_exercise Free fall
A ball is dropped from rest from a height of $20\ \text{m}$. Ignoring air resistance and using $g = 10\ \text{m/s}^2$, find the ball's speed: a) when it is $15\ \text{m}$ above the ground; b) when it reaches the ground.
---resolution---
The system is conservative (only the weight does work). Reference at the ground.

**a)** The ball has fallen $\Delta h = 20 - 15 = 5\ \text{m}$:

$$m g h_i = \frac{m v^2}{2} + m g h_f \quad\Rightarrow\quad v^2 = 2 g (h_i - h_f) = 2 \times 10 \times 5 = 100 \quad\Rightarrow\quad v = 10\ \text{m/s}$$

**b)** Now $\Delta h = 20\ \text{m}$:

$$v = \sqrt{2 \times 10 \times 20} = \sqrt{400} = 20\ \text{m/s}$$

Notice that the ball's mass was not needed.
:::

:::solved_exercise Simple pendulum
A pendulum is released from rest at a point $45\ \text{cm}$ above the lowest point of its path. Ignoring air resistance ($g = 10\ \text{m/s}^2$), what is the speed of the bob at the lowest point?
---resolution---
The string tension is always perpendicular to the velocity, so it does no work. Only the weight does work: mechanical energy is conserved. Reference at the lowest point:

$$m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v = \sqrt{2 g h} = \sqrt{2 \times 10 \times 0.45} = \sqrt{9} = 3\ \text{m/s}$$
:::

:::solved_exercise Roller coaster
A roller coaster car passes over the top of a $20\ \text{m}$ hill at $5\ \text{m/s}$. Ignoring friction ($g = 10\ \text{m/s}^2$), what is its speed when it passes a point $5\ \text{m}$ high?
---resolution---
Conservation of mechanical energy, with the reference at the ground:

$$\frac{m v_i^2}{2} + m g h_i = \frac{m v_f^2}{2} + m g h_f$$

Dividing everything by $m$ and multiplying by 2:

$$v_f^2 = v_i^2 + 2 g (h_i - h_f) = 5^2 + 2 \times 10 \times (20 - 5) = 25 + 300 = 325$$

$$v_f = \sqrt{325} \approx 18\ \text{m/s}$$
:::

:::solved_exercise A spring launching a block up a ramp
A $0.5\ \text{kg}$ block compresses a spring with constant $k = 200\ \text{N/m}$ by $30\ \text{cm}$ on a horizontal surface. When released, the block travels along the surface and goes up a ramp. Without friction ($g = 10\ \text{m/s}^2$), what maximum height does it reach?
---resolution---
All the initial elastic energy turns into gravitational potential energy at the highest point (where the speed is zero):

$$\frac{k x^2}{2} = m g h_{\text{max}}$$

$$\frac{200 \times 0.3^2}{2} = 0.5 \times 10 \times h_{\text{max}} \quad\Rightarrow\quad 9 = 5\,h_{\text{max}} \quad\Rightarrow\quad h_{\text{max}} = 1.8\ \text{m}$$
:::

:::solved_exercise Minimum height for a loop-the-loop
A small sphere slides without friction along a track that ends in a vertical circular loop of radius $R = 0.4\ \text{m}$. From what minimum height (measured from the bottom of the loop) must the sphere start from rest to complete the loop without losing contact with the track?
---resolution---
**1. Condition at the top of the loop.** At the highest point, the centripetal force is provided by the weight plus the normal force. The minimum speed occurs when the normal force is zero:

$$m g = \frac{m v^2}{R} \quad\Rightarrow\quad v_{\text{top}}^2 = g R$$

**2. Conservation of energy** between the start (height $h$, at rest) and the top of the loop (height $2R$):

$$m g h = \frac{m v_{\text{top}}^2}{2} + m g (2R) = \frac{m g R}{2} + 2 m g R \quad\Rightarrow\quad h = \frac{5R}{2}$$

**3. Numerical value:** $h = 2.5 \times 0.4 = 1.0\ \text{m}$.
:::

:::solved_exercise Vertical throw
A ball is thrown straight up from the ground at $20\ \text{m/s}$. Ignoring air resistance ($g = 10\ \text{m/s}^2$), at what height will its speed be $10\ \text{m/s}$?
---resolution---
$$\frac{m v_0^2}{2} = \frac{m v^2}{2} + m g h \quad\Rightarrow\quad h = \frac{v_0^2 - v^2}{2 g} = \frac{400 - 100}{20} = 15\ \text{m}$$

At that height the ball is moving up at $10\ \text{m/s}$, and it will pass through it again on the way down, also at $10\ \text{m/s}$.
:::

:::real_world_application Pole vault
The pole vault is a sequence of energy transformations. During the run-up, the athlete builds up kinetic energy. When the pole is planted, it bends and stores part of that energy as elastic potential energy. As it straightens, the pole gives that energy back and helps lift the athlete, turning it into gravitational potential energy. That is why the run-up speed matters so much: the more kinetic energy at the start, the higher the athlete can go.
:::

:::curiosity The principle that unified physics
The idea that energy is conserved, only changing form, was formulated in the 1840s by several scientists working independently, among them Julius Robert von Mayer, James Prescott Joule and Hermann von Helmholtz. Joule showed experimentally that a given amount of mechanical work always produces the same amount of heat. The conservation of mechanical energy we studied here is a special case of that general principle: when there is no friction, energy does not "leak" into thermal form.
:::

:::text
## Summary and common mistakes

- $ME = KE + PE$.
- **Mechanical energy theorem:** $W_{\text{non-cons}} = \Delta ME$.
- **Conservative system** (only conservative forces do work): $KE_i + PE_i = KE_f + PE_f$.
- Free fall from rest: $v = \sqrt{2 g h}$, independent of mass.
- Frictionless vertical loop: minimum starting height $h = \dfrac{5R}{2}$.

**Common mistakes:**

- Thinking that the presence of the normal force or the tension prevents conservation: they do no work when they are perpendicular to the motion.
- Forgetting the initial kinetic energy when the body already starts with some speed.
- Forgetting that at the highest point of an oblique launch the speed is **not** zero (the horizontal component remains).
:::
