---
title: Elastic Potential Energy
---

:::text
## Springs and elastic bodies

A body is **elastic** when, after being deformed (stretched, compressed, twisted), it returns to its original shape once released. Springs, rubber bands, bowstrings and trampolines are examples. While they are deformed, these bodies **store energy**, which they give back when they return to their natural shape: this is **elastic potential energy**.

To study it, we first need the force a spring exerts.

## Hooke's law

A spring has a **natural length** (no deformation). If we stretch or compress it by a distance $x$ (the **deformation**), it reacts with a force that:

- has a magnitude **proportional to the deformation**;
- always points **against the deformation**, trying to bring the spring back to its natural length (which is why it is called a **restoring force**).

$$F_{el} = k\,x \qquad \text{(magnitude)}$$

Taking direction into account, it is often written as $F_{el} = -k\,x$: the minus sign indicates that the force opposes the deformation.

The constant $k$ is the spring's **spring constant**, measured in **N/m**. It measures how "stiff" the spring is: the larger $k$, the more force it takes to deform it. A spring with $k = 200\ \text{N/m}$ needs $200\ \text{N}$ to be deformed by $1\ \text{m}$, or $2\ \text{N}$ to be deformed by $1\ \text{cm}$.

Hooke's law holds as long as the spring stays within its **elastic limit**. If the deformation is too large, the spring is permanently deformed and the law no longer applies.
:::

:::text
## The stored energy

The elastic force is **variable**: it starts at zero (relaxed spring) and grows linearly up to $k\,x$. The work needed to deform the spring is the **area under the** $F \times x$ **graph**, which is a triangle with base $x$ and height $k\,x$:

$$W = \frac{x \cdot k\,x}{2} = \frac{k\,x^2}{2}$$

That is the energy stored in the deformed spring:

$$PE_{el} = \frac{k\,x^2}{2}$$

| Symbol | Quantity | SI unit |
|---|---|---|
| $PE_{el}$ | elastic potential energy | joule (J) |
| $k$ | spring constant | N/m |
| $x$ | deformation (relative to the natural length) | m |

**Properties:**

- $PE_{el} \ge 0$ always: because $x$ is squared, stretching or compressing by the same distance stores the same energy.
- $PE_{el}$ is proportional to $k$ and to the **square** of the deformation: doubling the deformation **quadruples** the energy.
- Here the "reference level" is not arbitrary: $PE_{el} = 0$ for the relaxed spring.
- The elastic force is **conservative**: $W_{el} = PE_{el,i} - PE_{el,f}$.

**Careful:** $x$ is the **deformation**, not the length of the spring. If a 20 cm spring becomes 25 cm long, the deformation is $x = 5\ \text{cm} = 0.05\ \text{m}$.
:::

:::simulator spring-energy
Spring, force and energy
Change the spring constant and the deformation (negative values compress the spring). In the graph, the line is Hooke's law and the area of the shaded triangle is the stored energy.
:::

:::solved_exercise Force and energy of a stretched spring
A spring with spring constant $k = 400\ \text{N/m}$ is stretched by $5\ \text{cm}$. Find the elastic force and the stored elastic potential energy.
---resolution---
**Convert:** $x = 5\ \text{cm} = 0.05\ \text{m}$.

**Force (Hooke's law):**

$$F = k\,x = 400 \times 0.05 = 20\ \text{N}$$

**Energy:**

$$PE_{el} = \frac{k x^2}{2} = \frac{400 \times 0.05^2}{2} = \frac{400 \times 0.0025}{2} = 0.5\ \text{J}$$
:::

:::solved_exercise Finding the spring constant
A $2\ \text{kg}$ body is hung from a vertical spring, which stretches $10\ \text{cm}$ until the body is in equilibrium. Use $g = 10\ \text{m/s}^2$. Find the spring constant and the elastic energy stored at equilibrium.
---resolution---
**1. Equilibrium:** the elastic force balances the weight.

$$k\,x = m\,g \quad\Rightarrow\quad k = \frac{m g}{x} = \frac{2 \times 10}{0.1} = 200\ \text{N/m}$$

**2. Stored energy:**

$$PE_{el} = \frac{200 \times 0.1^2}{2} = \frac{200 \times 0.01}{2} = 1\ \text{J}$$
:::

:::solved_exercise Reading the force × deformation graph
The graph of a spring's elastic force versus deformation is a straight line through the origin and the point $(0.15\ \text{m};\ 30\ \text{N})$. Find the spring constant and the energy stored when the deformation is $0.15\ \text{m}$.
---resolution---
**Spring constant** (slope of the line):

$$k = \frac{F}{x} = \frac{30}{0.15} = 200\ \text{N/m}$$

**Energy = area of the triangle** under the graph, from $0$ to $0.15\ \text{m}$:

$$PE_{el} = \frac{\text{base} \times \text{height}}{2} = \frac{0.15 \times 30}{2} = 2.25\ \text{J}$$

Checking with the formula: $\dfrac{200 \times 0.15^2}{2} = \dfrac{200 \times 0.0225}{2} = 2.25\ \text{J}$.
:::

:::solved_exercise Spring launcher
A toy launches $0.1\ \text{kg}$ balls using a spring with constant $k = 800\ \text{N/m}$, compressed by $10\ \text{cm}$. Ignoring friction and assuming all the spring's energy goes into the ball (launched horizontally), what is the launch speed?
---resolution---
**Energy stored in the spring:**

$$PE_{el} = \frac{800 \times 0.1^2}{2} = \frac{800 \times 0.01}{2} = 4\ \text{J}$$

**All that energy becomes the ball's kinetic energy:**

$$\frac{m v^2}{2} = 4 \quad\Rightarrow\quad v^2 = \frac{2 \times 4}{0.1} = 80 \quad\Rightarrow\quad v = \sqrt{80} \approx 8.9\ \text{m/s}$$
:::

:::solved_exercise Tripling the deformation
A spring stores $0.2\ \text{J}$ when deformed by $2\ \text{cm}$. How much energy does it store when deformed by $6\ \text{cm}$?
---resolution---
The constant $k$ is the same, and the energy is proportional to $x^2$:

$$\frac{E_2}{E_1} = \left(\frac{x_2}{x_1}\right)^2 = \left(\frac{6}{2}\right)^2 = 9 \quad\Rightarrow\quad E_2 = 9 \times 0.2 = 1.8\ \text{J}$$

The deformation tripled and the energy became **9 times** larger.
:::

:::real_world_application From bows to car suspensions
In archery, the archer does work by drawing the string, and that energy is stored as elastic potential energy in the bent bow; when released, it becomes the arrow's kinetic energy. On a trampoline, the stretched mat gives energy back to the jumper. In car suspensions, the springs store energy when a wheel goes over a pothole and give it back right afterward; the shock absorbers dissipate part of that energy so the car does not keep bouncing.
:::

:::curiosity "As the extension, so the force"
The Englishman Robert Hooke published the relationship between force and deformation in 1678, summed up in Latin as *ut tensio, sic vis*, meaning "as the extension, so the force". In other words: the force is proportional to the deformation. Before that, he had announced the discovery as an anagram (a scrambled sequence of letters), a common practice at the time to secure priority for an idea without revealing it right away.
:::

:::text
## Summary and common mistakes

- Hooke's law: $F = k\,x$ (restoring force, opposite to the deformation).
- $PE_{el} = \dfrac{k x^2}{2}$ = area under the $F \times x$ graph.
- $PE_{el} \propto x^2$: doubling the deformation quadruples the energy.
- The elastic force is conservative: $W_{el} = PE_{el,i} - PE_{el,f}$.

**Common mistakes:**

- Using the total length of the spring instead of the deformation.
- Forgetting to convert cm to m (remember that squaring $x$ magnifies the error: $5^2 = 25$, but $0.05^2 = 0.0025$).
- Writing $PE_{el} = k x$ (that is the force, not the energy) or forgetting the factor $\frac{1}{2}$.
:::
