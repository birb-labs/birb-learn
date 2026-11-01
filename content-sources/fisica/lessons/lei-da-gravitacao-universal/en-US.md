---
title: The Law of Universal Gravitation
---

:::text
## The same force in the sky and on Earth

Kepler described **how** the planets move, but did not explain **what** kept them in orbit. The answer came from the Englishman **Isaac Newton**, in the book *Philosophiæ Naturalis Principia Mathematica* (the *Principia*), published in 1687.

Newton's great insight was to realize that the force that makes an apple fall and the force that keeps the Moon going around the Earth are **the same**: **gravitation**. A single law, valid for any pair of bodies in the Universe (hence **universal**), explains falling objects, the tides, the orbits of the planets and Kepler's laws.
:::

:::text
## The statement

> **Any two bodies attract each other with forces proportional to the product of their masses and inversely proportional to the square of the distance between their centers.**

$$F = \frac{G\,M\,m}{d^2}$$

| Symbol | Quantity | SI unit |
|---|---|---|
| $F$ | magnitude of the gravitational force | N |
| $M$, $m$ | masses of the two bodies | kg |
| $d$ | distance between the **centers** of the bodies | m |
| $G$ | universal gravitational constant | N·m²/kg² |

The experimentally determined value of $G$ is:

$$G \approx 6.67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$$

An extremely small number. That is why the gravitational attraction between everyday objects (two people, two chairs) is imperceptible: gravity only becomes important when at least one of the masses is enormous, like that of a planet or a star.

**Watch the distance:** $d$ is measured **between the centers**. For an object on the Earth's surface, $d$ is the Earth's radius, not zero. For a satellite at an altitude $h$, $d = R + h$.
:::

:::text
## Features of the gravitational force

**1. It is always attractive.** There is no "gravitational repulsion" between masses.

**2. It is an action–reaction pair.** The Earth pulls the Moon with the same magnitude as the Moon pulls the Earth, in opposite directions (Newton's third law). The forces are equal, but the **effects** are different: the same force produces a much smaller acceleration on the Earth, which has a much larger mass ($a = F/m$).

**3. It is proportional to each of the masses.** Double one of the masses and the force doubles; double both and the force quadruples.

**4. It varies with the inverse square of the distance.** This is the point tested most often:

| Distance | Force |
|---|---|
| $d$ | $F$ |
| $2d$ | $F/4$ |
| $3d$ | $F/9$ |
| $d/2$ | $4F$ |
| $10d$ | $F/100$ |

**5. It acts at a distance and cannot be blocked.** No contact is needed, and no material "shields" gravity.

**6. For spherical bodies**, Newton showed that the attraction is the same as if all the mass were concentrated at the center. That is why we use the distance between the centers.
:::

:::text
## The Moon test

Newton tested his idea by comparing the fall of an apple with the "falling motion" of the Moon. The Moon is about 60 Earth radii from the Earth's center. If the force falls off with the square of the distance, the acceleration caused by the Earth at the Moon's position should be about $60^2 = 3\,600$ times smaller than $g$:

$$\frac{9.8}{3\,600} \approx 0.0027\ \text{m/s}^2$$

The Moon's centripetal acceleration can be calculated from its orbital data (radius of about $3.84 \times 10^8\ \text{m}$ and period of about $27.3$ days):

$$a = \frac{4\pi^2 r}{T^2} \approx 0.0027\ \text{m/s}^2$$

The two values agree: the same force that brings down the apple keeps the Moon in orbit.

## Kepler's 3rd law from Newton

For a body of mass $m$ in a circular orbit of radius $r$ around a body of mass $M$, the gravitational force is the centripetal net force:

$$\frac{G M m}{r^2} = \frac{m v^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{G M}{r}}$$

Since $v = \dfrac{2\pi r}{T}$, substituting and rearranging:

$$\frac{T^2}{r^3} = \frac{4\pi^2}{G M}$$

This is **Kepler's 3rd law**, now with the constant explained: $K = \dfrac{4\pi^2}{GM}$ depends **only on the mass of the central body**. The satellite's mass $m$ cancels, which is why the constant is the same for all bodies orbiting the same central body. As a bonus, by measuring $T$ and $r$ of an orbit, we can calculate the mass of the central body: that is how the Sun and the planets are "weighed".
:::

:::simulator universal-gravitation
Gravitational attraction
Choose a scenario and multiply the masses and the distance. Check that doubling the distance divides the force by 4 and that doubling one mass doubles the force. Also compare the force between two people with the force between the Earth and the Moon.
:::

:::solved_exercise Do two people attract each other?
Calculate the gravitational attraction between two people of $70\ \text{kg}$ and $60\ \text{kg}$ who are $1\ \text{m}$ apart (treat them as points). Use $G = 6.67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$.
---resolution---
$$F = \frac{G M m}{d^2} = \frac{6.67 \times 10^{-11} \times 70 \times 60}{1^2} = 6.67 \times 10^{-11} \times 4\,200 \approx 2.8 \times 10^{-7}\ \text{N}$$

A force of less than a millionth of a newton: completely imperceptible. Each person's weight (the Earth's attraction) is on the order of hundreds of newtons.
:::

:::solved_exercise Changing the masses and the distance
Two bodies attract each other with force $F$. What happens to the force if the mass of one of them doubles, the mass of the other triples and the distance between them doubles?
---resolution---
$$F' = \frac{G\,(2M)(3m)}{(2d)^2} = \frac{6\,G M m}{4\,d^2} = \frac{6}{4}\,F = 1.5\,F$$

The force becomes **1.5 times** larger: the masses multiply the force by 6, and the doubled distance divides it by 4.
:::

:::solved_exercise The force between the Earth and the Moon
With $M_{\text{Earth}} \approx 5.97 \times 10^{24}\ \text{kg}$, $m_{\text{Moon}} \approx 7.35 \times 10^{22}\ \text{kg}$ and a mean center-to-center distance of $3.84 \times 10^8\ \text{m}$, estimate the gravitational force between the Earth and the Moon.
---resolution---
$$F = \frac{6.67 \times 10^{-11} \times 5.97 \times 10^{24} \times 7.35 \times 10^{22}}{(3.84 \times 10^8)^2}$$

**Numerator:** $6.67 \times 5.97 \times 7.35 \approx 292.7$, and the powers of 10 add up to $-11 + 24 + 22 = 35$: $\approx 2.93 \times 10^{37}$.

**Denominator:** $3.84^2 \approx 14.75$, so $(3.84 \times 10^8)^2 \approx 1.47 \times 10^{17}$.

$$F \approx \frac{2.93 \times 10^{37}}{1.47 \times 10^{17}} \approx 2.0 \times 10^{20}\ \text{N}$$

The Earth pulls the Moon with this force, and the Moon pulls the Earth with a force of the same magnitude in the opposite direction.
:::

:::solved_exercise Where the attractions cancel
The Earth's mass is about 81 times the Moon's mass. At what point on the line segment joining their centers would an object feel zero net gravitational force? Give the answer as a fraction of the center-to-center distance $D$.
---resolution---
Let $x$ be the object's distance from the Earth's center (and $D - x$ from the Moon's center). The two attractions point in opposite directions and must have the same magnitude:

$$\frac{G\,(81\,m_M)\,m}{x^2} = \frac{G\,m_M\,m}{(D - x)^2} \quad\Rightarrow\quad \frac{81}{x^2} = \frac{1}{(D - x)^2}$$

Taking the square root of both sides (distances are positive):

$$\frac{9}{x} = \frac{1}{D - x} \quad\Rightarrow\quad 9D - 9x = x \quad\Rightarrow\quad x = \frac{9D}{10} = 0.9\,D$$

The point is at **90% of the distance**, much closer to the Moon, which makes sense: the less massive Moon has to be closer to pull with the same force.
:::

:::solved_exercise Weighing the Earth with the Moon's orbit
The Moon goes around the Earth in an approximately circular orbit of radius $3.84 \times 10^8\ \text{m}$, with a period of about $27.3$ days. Use $G = 6.67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$ and estimate the Earth's mass.
---resolution---
From Kepler's 3rd law as derived by Newton:

$$\frac{T^2}{r^3} = \frac{4\pi^2}{G M} \quad\Rightarrow\quad M = \frac{4\pi^2 r^3}{G\,T^2}$$

**Period in seconds:** $T = 27.3 \times 86\,400 \approx 2.36 \times 10^6\ \text{s}$.

**Values:** $r^3 = (3.84 \times 10^8)^3 \approx 5.66 \times 10^{25}\ \text{m}^3$ and $T^2 \approx 5.57 \times 10^{12}\ \text{s}^2$.

$$M \approx \frac{4 \times 9.87 \times 5.66 \times 10^{25}}{6.67 \times 10^{-11} \times 5.57 \times 10^{12}} \approx \frac{2.23 \times 10^{27}}{3.72 \times 10^{2}} \approx 6.0 \times 10^{24}\ \text{kg}$$

Very close to the accepted value, $5.97 \times 10^{24}\ \text{kg}$. The small difference comes from rounding and from the Moon's orbit not being exactly circular.
:::

:::real_world_application The tides
The Moon attracts the whole Earth, but not with the same strength everywhere: the side of the Earth facing the Moon is closer and is pulled harder than the center, and the far side is pulled less. This **difference** in attraction across the planet slightly deforms the oceans, forming two "bulges" of water, one on each side. As the Earth rotates, most coastlines pass through these bulges and therefore usually have two high tides and two low tides a day. The Sun also produces tides, but its effect is less than half the Moon's. When the Sun, the Earth and the Moon are aligned (new and full moon), the effects add up and the tides are stronger.
:::

:::curiosity The balance that weighed the Earth
In 1798, the Englishman Henry Cavendish used a torsion balance, designed earlier by John Michell, to measure the tiny attraction between lead spheres in a laboratory. His stated goal was to determine the **mean density of the Earth**, which he found to be about 5.5 times that of water, very close to the value accepted today. That result is equivalent to determining the constant $G$, and the experiment became known as the one that "weighed the Earth".
:::

:::text
## Summary and common mistakes

- $F = \dfrac{G M m}{d^2}$, with $G \approx 6.67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$ and $d$ between the centers.
- Always attractive; forms an action–reaction pair (same magnitude on both bodies).
- Proportional to the masses; inversely proportional to the square of the distance.
- Circular orbit: $v = \sqrt{GM/r}$ and $\dfrac{T^2}{r^3} = \dfrac{4\pi^2}{GM}$.

**Common mistakes:**

- Forgetting to square the distance (doubling the distance divides the force by 4, not by 2).
- Using the altitude instead of the distance to the center ($d = R + h$).
- Thinking the more massive body exerts a larger force on the less massive one: the forces are equal; it is the accelerations that differ.
- Confusing $G$ (universal constant) with $g$ (acceleration due to gravity at a specific place).
:::
