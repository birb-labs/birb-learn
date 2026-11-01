---
title: Gravitational Potential Energy
---

:::text
## The energy of being up high

When you lift an object at constant speed, you apply a force equal to its weight ($m\,g$) over a height $h$. The work you do is $m\,g\,h$, and that energy does not vanish: it is **stored** in the body–Earth system as **gravitational potential energy**. If the object is released, the weight does the same amount of work back, and that energy becomes kinetic energy.

$$PE_g = m\,g\,h$$

| Symbol | Quantity | SI unit |
|---|---|---|
| $PE_g$ | gravitational potential energy | joule (J) |
| $m$ | mass | kg |
| $g$ | acceleration due to gravity | m/s² |
| $h$ | height above the reference level | m |

Near the Earth's surface, $g \approx 9.8\ \text{m/s}^2$; many exercises use $g = 10\ \text{m/s}^2$ to simplify the arithmetic. **Always use the value given in the problem.**
:::

:::text
## The reference level

The height $h$ is measured from a **reference level** that we choose, where by definition $PE_g = 0$. It can be the floor, a tabletop, the bottom of a ramp... Consequences:

- Above the reference, $h > 0$ and $PE_g > 0$.
- At the reference, $PE_g = 0$.
- **Below** the reference, $h < 0$ and $PE_g < 0$. Negative potential energy is not a mistake: it simply means the body is below the chosen level.

The value of $PE_g$ changes with the reference, but the **change** $\Delta PE_g = m\,g\,\Delta h$ is always the same. Since only changes have physical effects (they are what give us work and speeds), choosing the reference is a matter of convenience. A practical tip: choose the **lowest point** of the motion as the reference, so no energy is negative.

## Proportionalities

- $PE_g$ is proportional to **mass**: twice the mass, twice the energy.
- $PE_g$ is proportional to **height**: twice the height, twice the energy.
- $PE_g$ is proportional to $g$: the same body at the same height has less potential energy on the Moon, where $g \approx 1.6\ \text{m/s}^2$, than on Earth.

The graph of $PE_g$ versus $h$ is a **straight line** through the origin, with slope $m\,g$.
:::

:::text
## Extended bodies: use the center of mass

For an object that is not small (a rod, a ladder, a person), the height in the formula is that of the **center of mass**. For a uniform, symmetric body, the center of mass is at its geometric center. For example, a uniform rod of length $L$ lying on the ground has its center of mass practically on the ground; standing upright, its center of mass is at height $L/2$.

## Range of validity

The formula $PE_g = m g h$ assumes $g$ is constant, which is an excellent approximation for heights that are small compared with the Earth's radius (about $6\,400\ \text{km}$). For satellites and planets, $g$ changes with distance and we need the law of universal gravitation, which we will study in the Gravitation section.
:::

:::simulator energy-track
Potential energy turning into kinetic energy
Release the ball and watch the bars: on the way down the potential energy decreases and the kinetic energy increases; on the way up the opposite happens. Change the release height and the mass and compare the initial potential energy with m·g·h.
:::

:::solved_exercise Climbing stairs
A $50\ \text{kg}$ person climbs three floors of a building, each $3\ \text{m}$ high. Use $g = 10\ \text{m/s}^2$. What was the change in the person's gravitational potential energy?
---resolution---
**Total height difference:** $\Delta h = 3 \times 3 = 9\ \text{m}$.

$$\Delta PE_g = m\,g\,\Delta h = 50 \times 10 \times 9 = 4\,500\ \text{J}$$

**Answer:** the potential energy increased by $4\,500\ \text{J}$ (or $4.5\ \text{kJ}$). This value does not depend on whether the person used the stairs, a ramp or the elevator: only the height difference matters.
:::

:::solved_exercise The same lamp, three references
A $0.5\ \text{kg}$ lamp hangs $2.5\ \text{m}$ above the floor of a room. The room's table is $0.8\ \text{m}$ high and the ceiling is $3\ \text{m}$ above the floor. Use $g = 10\ \text{m/s}^2$ and calculate the lamp's gravitational potential energy relative to: a) the floor; b) the tabletop; c) the ceiling.
---resolution---
**a) Floor:** $h = 2.5\ \text{m}$

$$PE_g = 0.5 \times 10 \times 2.5 = 12.5\ \text{J}$$

**b) Table:** $h = 2.5 - 0.8 = 1.7\ \text{m}$

$$PE_g = 0.5 \times 10 \times 1.7 = 8.5\ \text{J}$$

**c) Ceiling:** the lamp is $0.5\ \text{m}$ **below** the ceiling, so $h = -0.5\ \text{m}$

$$PE_g = 0.5 \times 10 \times (-0.5) = -2.5\ \text{J}$$

Three different values for the same physical situation. If the lamp fell to the floor, however, the change in potential energy would be $-12.5\ \text{J}$ with any of the references (check it!).
:::

:::solved_exercise Standing a rod upright
A uniform rod $4\ \text{m}$ long with a mass of $10\ \text{kg}$ lies on the ground. What is the minimum work needed to stand it upright, vertically? Use $g = 10\ \text{m/s}^2$.
---resolution---
The minimum work equals the increase in potential energy (lifting slowly, without gaining kinetic energy). The relevant height is that of the **center of mass**, which rises from the ground to the middle of the rod:

$$\Delta h_{cm} = \frac{L}{2} = \frac{4}{2} = 2\ \text{m}$$

$$W_{\text{min}} = \Delta PE_g = m\,g\,\Delta h_{cm} = 10 \times 10 \times 2 = 200\ \text{J}$$

A common mistake is to use $h = 4\ \text{m}$, which would give 400 J: the whole rod does not rise 4 m, only its tip does.
:::

:::solved_exercise On Earth and on the Moon
An astronaut lifts a $10\ \text{kg}$ box to a height of $2\ \text{m}$. Compare the change in the box's gravitational potential energy on Earth ($g = 10\ \text{m/s}^2$) and on the Moon ($g = 1.6\ \text{m/s}^2$).
---resolution---
**Earth:** $\Delta PE_g = 10 \times 10 \times 2 = 200\ \text{J}$.

**Moon:** $\Delta PE_g = 10 \times 1.6 \times 2 = 32\ \text{J}$.

The mass is the same in both places, but since lunar gravity is much weaker, lifting the box on the Moon takes $\dfrac{200}{32} = 6.25$ times less work.
:::

:::real_world_application The pile driver
When building foundations, a pile driver lifts a heavy hammer to a certain height and lets it fall onto a pile. The gravitational potential energy stored on the way up turns into kinetic energy on the way down, and that energy drives the pile into the ground. To drive it with more energy, the machine can use a heavier hammer or drop it from a greater height: either way, $m\,g\,h$ increases.
:::

:::curiosity How many stairs is a chocolate bar worth?
A chocolate bar of about $130\ \text{kcal}$ provides roughly $540\ \text{kJ}$ (each kcal is about $4\,184\ \text{J}$). If all that energy became potential energy of a $70\ \text{kg}$ person (with $g = 10\ \text{m/s}^2$), they could climb $h = \dfrac{540\,000}{70 \times 10} \approx 770\ \text{m}$. In practice, the human body converts only a fraction of the energy in food into mechanical work (the rest becomes mostly heat), so the real height is much smaller, but it is still impressive.
:::

:::text
## Summary and common mistakes

- $PE_g = m\,g\,h$, with $h$ measured from a chosen reference level.
- $PE_g$ can be negative (below the reference); changes do not depend on the reference.
- For extended bodies, use the height of the center of mass.
- Work done by weight: $W_g = -\Delta PE_g = m g (h_i - h_f)$.

**Common mistakes:**

- Using the distance traveled (length of a ramp or staircase) instead of the vertical height difference.
- Forgetting to convert centimeters to meters.
- Using the height of an object's tip instead of the height of its center of mass.
:::
