---
title: Potential Energy and Conservative Forces
---

:::text
## Stored energy

Think of a book on the top shelf of a bookcase. It is not moving, so it has no kinetic energy. But if it falls, it will gain speed: some energy was **stored** in it because it was up high. The same thing happens with:

- a drawn bow, ready to launch an arrow;
- a compressed spring inside a pen;
- water held behind the dam of a hydroelectric plant.

This stored energy, which depends on the **position** of a body or the **configuration** of a system (and not on its motion), is called **potential energy** ($PE$). The name comes precisely from the idea of *potential*: it is energy that **can** be turned into motion (or another form) when the body is released.

Potential energy is always associated with a **force** and an **interaction**:

| Force | Associated potential energy | Expression |
|---|---|---|
| Weight (gravitational attraction near Earth) | gravitational | $PE_g = m\,g\,h$ |
| Elastic force of an ideal spring | elastic | $PE_{el} = \dfrac{k\,x^2}{2}$ |

In the next lessons we will study each of them in detail. First, we need to understand **which forces** allow us to define a potential energy.
:::

:::text
## Conservative forces

A force is **conservative** when the work it does between two points **depends only on the initial and final positions**, and **not on the path taken**.

An equivalent way of saying this: **the work done by a conservative force around a closed path** (one that starts and ends at the same point) **is zero**.

**Examples of conservative forces:**

- **weight** (the gravitational force);
- the **elastic force** of an ideal spring;
- the electric force between charges at rest.

**Examples of non-conservative (dissipative) forces:**

- **kinetic friction**;
- **air resistance**;
- muscular forces and engine forces, which depend on how the agent acts along the path.

Why is friction not conservative? Drag a box 3 m forward and then 3 m back: friction opposed the motion **on both trips**, so it did negative work on both. Around the closed path, the total is **negative**, not zero. And the longer the path, the more work friction does: it depends on the path.

It only makes sense to talk about **potential energy for conservative forces**: since their work depends only on positions, we can assign to each position a "stock" of energy.
:::

:::text
## The work done by weight does not depend on the path

Imagine taking a box of mass $m$ from the floor up to a height $h$ along three different paths: straight up, along a ramp, or up a staircase.

- Straight up, the weight points down and the displacement points up: $W_g = -m\,g\,h$.
- Along the ramp, the path is longer, but only the component of the weight along the ramp does work, and the result is the same: $W_g = -m\,g\,h$.
- Up the stairs, the horizontal stretches contribute nothing (weight perpendicular to the displacement), and the vertical stretches add up to the total height $h$: again $W_g = -m\,g\,h$.

In general, if a body goes from a height $h_i$ to a height $h_f$:

$$W_g = m\,g\,(h_i - h_f)$$

**Going down** ($h_i > h_f$), the work done by weight is **positive**; **going up**, it is **negative**. The path does not matter.
:::

:::text
## The potential energy theorem

For any conservative force, the work it does equals **minus the change in the associated potential energy**:

$$W_{\text{conservative}} = -\Delta PE = PE_{\text{initial}} - PE_{\text{final}}$$

Physical meaning:

- When the conservative force does **positive work** (a body falling, a spring returning to its natural length), the potential energy **decreases**: it is being turned into another form (usually kinetic).
- When the conservative force does **negative work** (a body being lifted, a spring being compressed), the potential energy **increases**: energy is being stored.

For weight, the theorem reads:

$$W_g = m g h_i - m g h_f = m\,g\,(h_i - h_f)$$

exactly the result we found above.

**Important:** the value of the potential energy depends on where we choose the **reference level** (where $PE = 0$), but the **change** $\Delta PE$, which is what appears in the theorem, **does not depend** on that choice. That is why we can choose whichever reference makes the calculations simplest.
:::

:::solved_exercise The same work along three paths
A $2\ \text{kg}$ box goes down from a $5\ \text{m}$-high platform to the floor in three ways: (I) falling straight down, (II) sliding down a $10\ \text{m}$-long ramp and (III) being carried down a staircase. Use $g = 10\ \text{m/s}^2$. Calculate the work done by the weight in each case.
---resolution---
Weight is a conservative force: its work depends only on the initial and final heights.

$$W_g = m\,g\,(h_i - h_f) = 2 \times 10 \times (5 - 0) = 100\ \text{J}$$

**Answer:** $W_g = 100\ \text{J}$ in **all three** cases. The ramp length (10 m) does not affect the work done by the weight. It would matter for calculating the work of any **friction**, which depends on the path.
:::

:::solved_exercise Closed path: weight versus friction
a) A $1\ \text{kg}$ book is lifted $2\ \text{m}$ and then lowered back to its starting position. Calculate the total work done by the weight ($g = 10\ \text{m/s}^2$).

b) A box is dragged $3\ \text{m}$ forward and $3\ \text{m}$ back across a floor, with a constant friction force of $5\ \text{N}$. Calculate the total work done by friction.
---resolution---
**a)** Up: $W_1 = -m g h = -1 \times 10 \times 2 = -20\ \text{J}$. Down: $W_2 = +m g h = +20\ \text{J}$.

$$W_{\text{total}} = -20 + 20 = 0$$

Closed path, zero work: weight is **conservative**.

**b)** Friction always opposes the motion, on both trips: $W_1 = -5 \times 3 = -15\ \text{J}$ and $W_2 = -5 \times 3 = -15\ \text{J}$.

$$W_{\text{total}} = -15 - 15 = -30\ \text{J} \ne 0$$

Closed path, nonzero work: friction is **non-conservative** (dissipative).
:::

:::solved_exercise Applying the potential energy theorem
A $0.5\ \text{kg}$ ball falls from a height of $8\ \text{m}$ to a height of $3\ \text{m}$ above the ground. Use $g = 10\ \text{m/s}^2$ and the ground as the reference level.

a) What are the initial and final gravitational potential energies?

b) How much work does the weight do over this stretch?
---resolution---
**a)** $PE_i = m g h_i = 0.5 \times 10 \times 8 = 40\ \text{J}$ and $PE_f = m g h_f = 0.5 \times 10 \times 3 = 15\ \text{J}$.

**b)** By the potential energy theorem:

$$W_g = PE_i - PE_f = 40 - 15 = 25\ \text{J}$$

The work is positive (the ball went down) and the potential energy **decreased** by 25 J: $\Delta PE = -25\ \text{J}$.

**Check with another reference:** if the zero level were at a height of 3 m, we would have $PE_i = 0.5 \times 10 \times 5 = 25\ \text{J}$ and $PE_f = 0$, and the work would still be $25 - 0 = 25\ \text{J}$. The change does not depend on the reference.
:::

:::solved_exercise Work done by the elastic force
An ideal spring with spring constant $k = 100\ \text{N/m}$ is compressed by $0.2\ \text{m}$ and released until it returns to its natural length. How much work does the elastic force do?
---resolution---
The elastic force is conservative, so the potential energy theorem applies with $PE_{el} = \dfrac{k x^2}{2}$:

$$PE_i = \frac{100 \times 0.2^2}{2} = \frac{100 \times 0.04}{2} = 2\ \text{J} \qquad PE_f = 0 \ (\text{undeformed spring})$$

$$W_{el} = PE_i - PE_f = 2 - 0 = 2\ \text{J}$$

The work is positive: the spring "gave back" the energy that was stored in it.
:::

:::real_world_application Hydroelectric power plants
A hydroelectric plant is a huge machine for converting gravitational potential energy. The dam keeps the water at a high level. When the water flows down through the pipes, the weight does positive work and the potential energy decreases, turning into kinetic energy of the water, which spins the turbines. Generators connected to the turbines convert that energy into electrical energy. The greater the drop height and the water flow, the more energy is available.
:::

:::curiosity Who named potential energy
The expression "potential energy" was introduced in 1853 by the Scottish engineer and physicist William Rankine, at a time when scientists were organizing the idea that the different forms of energy convert into one another without the total changing. The adjective "potential" highlights that this energy is stored, waiting to be used.
:::

:::text
## Summary and common mistakes

- Potential energy: stored energy that depends on position or configuration.
- Conservative force: work independent of the path; zero work around a closed path. Examples: weight and elastic force.
- Dissipative forces (friction, air resistance) depend on the path and have no associated potential energy.
- **Potential energy theorem:** $W_{\text{conservative}} = -\Delta PE = PE_i - PE_f$.
- Work done by weight: $W_g = m g (h_i - h_f)$, positive going down, negative going up.

**Common mistakes:**

- Calculating the work done by weight using the ramp length instead of the height difference.
- Getting the sign wrong: remember that $W = PE_i - PE_f$ (initial **minus** final).
- Thinking the value of potential energy is absolute: it depends on the reference; only changes have physical meaning.
:::
