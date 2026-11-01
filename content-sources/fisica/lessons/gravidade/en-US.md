---
title: Gravity, Weight and Satellites
---

:::text
## Where g comes from

So far we have used $g \approx 9.8\ \text{m/s}^2$ as a given number. With the law of universal gravitation, we can **calculate** $g$.

The weight of a body of mass $m$ on the surface of a planet of mass $M$ and radius $R$ is the gravitational force the planet exerts on it:

$$W = m\,g \qquad\text{and}\qquad W = \frac{G M m}{R^2}$$

Setting the two expressions equal, the body's mass $m$ cancels:

$$g = \frac{G\,M}{R^2}$$

Important conclusions:

- $g$ **does not depend on the mass of the falling body**. Without air resistance, a feather and a hammer fall with the same acceleration.
- $g$ depends on the **mass** and the **radius** of the celestial body: it is proportional to $M$ and inversely proportional to $R^2$.
- $g$ has two equivalent interpretations: it is the **acceleration** of a body in free fall (m/s²) and also the **strength of the gravitational field** (force per unit mass, N/kg).

For the Earth, with $M \approx 5.97 \times 10^{24}\ \text{kg}$ and $R \approx 6.37 \times 10^6\ \text{m}$:

$$g = \frac{6.67 \times 10^{-11} \times 5.97 \times 10^{24}}{(6.37 \times 10^6)^2} \approx 9.8\ \text{m/s}^2$$
:::

:::text
## Gravity decreases with altitude

At an altitude $h$ above the surface, the distance to the planet's center is $R + h$:

$$g_h = \frac{G M}{(R + h)^2} \qquad\Rightarrow\qquad \frac{g_h}{g_0} = \left(\frac{R}{R + h}\right)^2$$

| Altitude | Distance to the center | $g_h / g_0$ |
|---|---|---|
| $0$ | $R$ | $1$ |
| $R$ | $2R$ | $1/4$ |
| $2R$ | $3R$ | $1/9$ |
| $3R$ | $4R$ | $1/16$ |

For altitudes that are small compared with the Earth's radius (mountains, airplanes), the change is small: at the top of Everest, almost 9 km up, $g$ is only about 0.3% smaller. Even at about 400 km of altitude, where the International Space Station (ISS) orbits, $g \approx 8.7\ \text{m/s}^2$, still close to 90% of the surface value.

## Gravity on other bodies

Each celestial body has its own $g$, which depends on $M/R^2$. Approximate surface values (for the gas planets, at the level of the atmosphere where the pressure is 1 bar):

| Body | Approximate $g$ (m/s²) |
|---|---|
| Moon | 1.6 |
| Mars | 3.7 |
| Venus | 8.9 |
| Earth | 9.8 |
| Saturn | 10.4 |
| Jupiter | 24.8 |

Saturn has about 95 times the Earth's mass, but its $g$ is almost the same as Earth's, because its radius is also much larger, and $g$ depends on $R^2$.

## Small variations on Earth

Even at the surface, $g$ is not exactly the same everywhere. It is about $9.78\ \text{m/s}^2$ at the Equator and about $9.83\ \text{m/s}^2$ at the poles, for two reasons: the Earth is slightly flattened at the poles (the equatorial radius is larger) and the Earth's rotation reduces the apparent weight, especially at the Equator. There are also small variations caused by altitude and by the distribution of rocks underground.
:::

:::text
## Mass is not weight

- **Mass** ($m$, in kg) measures the amount of matter and the inertia of a body. It **does not change** from place to place.
- **Weight** ($W = m g$, in N) is the force with which a celestial body attracts the object. It **changes** with the local value of $g$.

A $60\ \text{kg}$ astronaut has a mass of $60\ \text{kg}$ on Earth, on the Moon or in space. Their weight, however, is about $600\ \text{N}$ on Earth and about $100\ \text{N}$ on the Moon. In everyday speech we say "I weigh 60 kilos", but physically that is the mass.

## Satellites in orbit

A satellite in a circular orbit of radius $r$ around a planet is under a single relevant force: gravity, which acts as the centripetal net force:

$$\frac{G M m}{r^2} = \frac{m v^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{G M}{r}} \qquad\text{and}\qquad T = \frac{2\pi r}{v}$$

- The orbital speed **does not depend on the satellite's mass**.
- **The higher the orbit, the lower the speed** and the longer the period (as Kepler's 3rd law requires).
- For low orbits, around 400 km of altitude, $v \approx 7.7\ \text{km/s}$ (about $28\,000\ \text{km/h}$) and the period is roughly 92 minutes: the ISS goes around the Earth about 15 to 16 times a day.

## Why do astronauts float?

A very common mistake is to say that "there is no gravity in space". At the ISS's altitude, gravity is about 90% of its surface value! Astronauts float because the station and everyone inside it are **in free fall** around the Earth: they all fall together, with the same acceleration, so nothing presses anyone against the "floor". The station does not hit the Earth because it moves so fast horizontally that, while it falls, the curved surface of the Earth also "drops away" beneath it. This state is called **weightlessness** (or microgravity), not the absence of gravity.
:::

:::simulator surface-gravity
Gravity on different bodies and at different altitudes
Choose a celestial body, increase the altitude and see how g decreases with the square of the distance to the center. The dashed line marks the approximate altitude of the ISS. Change the person's mass: the weight changes, but g does not depend on it.
:::

:::solved_exercise Calculating Earth's g
Use $G = 6.67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$, $M = 5.97 \times 10^{24}\ \text{kg}$ and $R = 6.37 \times 10^6\ \text{m}$ to calculate the acceleration due to gravity at the Earth's surface.
---resolution---
$$g = \frac{G M}{R^2} = \frac{6.67 \times 10^{-11} \times 5.97 \times 10^{24}}{(6.37 \times 10^6)^2}$$

**Numerator:** $6.67 \times 5.97 \approx 39.8$, with power $10^{-11+24} = 10^{13}$: $3.98 \times 10^{14}$.

**Denominator:** $6.37^2 \approx 40.6$, with power $10^{12}$: $4.06 \times 10^{13}$.

$$g \approx \frac{3.98 \times 10^{14}}{4.06 \times 10^{13}} \approx 9.8\ \text{m/s}^2$$
:::

:::solved_exercise Gravity at an altitude equal to the radius
a) What is the value of $g$ at an altitude equal to the Earth's radius? Use $g_0 = 10\ \text{m/s}^2$.

b) At what altitude is $g$ equal to $\frac{1}{9}$ of its surface value?
---resolution---
**a)** The distance to the center goes from $R$ to $2R$ (it doubles), so $g$ becomes 4 times smaller:

$$g = g_0 \left(\frac{R}{2R}\right)^2 = \frac{10}{4} = 2.5\ \text{m/s}^2$$

**b)** We need $\left(\dfrac{R}{R + h}\right)^2 = \dfrac{1}{9}$, that is, $\dfrac{R}{R + h} = \dfrac{1}{3}$:

$$R + h = 3R \quad\Rightarrow\quad h = 2R$$

The altitude is equal to **two Earth radii** (about $12\,700\ \text{km}$). Careful: the distance to the **center** is $3R$, but the **altitude** is $2R$.
:::

:::solved_exercise An imaginary planet
A planet has twice the Earth's mass and twice its radius. Knowing that $g = 10\ \text{m/s}^2$ on Earth, how much would a $60\ \text{kg}$ person weigh on that planet?
---resolution---
**Ratio of the gravities:**

$$\frac{g_P}{g_E} = \frac{G M_P / R_P^2}{G M_E / R_E^2} = \frac{M_P}{M_E} \cdot \left(\frac{R_E}{R_P}\right)^2 = 2 \times \left(\frac{1}{2}\right)^2 = \frac{2}{4} = \frac{1}{2}$$

$$g_P = \frac{10}{2} = 5\ \text{m/s}^2 \qquad W = m\,g_P = 60 \times 5 = 300\ \text{N}$$

The mass is still $60\ \text{kg}$; the weight drops to half its value on Earth ($600\ \text{N}$).
:::

:::solved_exercise Gravity on Mars
The mass of Mars is about $0.107$ times the Earth's mass, and its radius is about $0.532$ times the Earth's radius. Estimate $g$ on Mars using $g_E = 9.8\ \text{m/s}^2$.
---resolution---
$$\frac{g_M}{g_E} = \frac{0.107}{0.532^2} = \frac{0.107}{0.283} \approx 0.378$$

$$g_M \approx 0.378 \times 9.8 \approx 3.7\ \text{m/s}^2$$

A value that agrees with measurements: on Mars, an object weighs about 38% of what it weighs on Earth.
:::

:::solved_exercise The Space Station's orbit
The ISS orbits at about $400\ \text{km}$ of altitude. Use $GM_{\text{Earth}} \approx 4.0 \times 10^{14}\ \text{m}^3/\text{s}^2$ and $R \approx 6.4 \times 10^6\ \text{m}$ to estimate: a) $g$ at that altitude; b) the orbital speed; c) the period.
---resolution---
**Orbital radius:** $r = R + h = 6.4 \times 10^6 + 0.4 \times 10^6 = 6.8 \times 10^6\ \text{m}$.

**a)**

$$g = \frac{GM}{r^2} = \frac{4.0 \times 10^{14}}{(6.8 \times 10^6)^2} = \frac{4.0 \times 10^{14}}{4.62 \times 10^{13}} \approx 8.7\ \text{m/s}^2$$

**b)**

$$v = \sqrt{\frac{GM}{r}} = \sqrt{\frac{4.0 \times 10^{14}}{6.8 \times 10^6}} = \sqrt{5.9 \times 10^7} \approx 7.7 \times 10^3\ \text{m/s}$$

About $7.7\ \text{km/s}$, or roughly $28\,000\ \text{km/h}$.

**c)**

$$T = \frac{2\pi r}{v} = \frac{2 \times 3.14 \times 6.8 \times 10^6}{7.7 \times 10^3} \approx 5.5 \times 10^3\ \text{s} \approx 92\ \text{min}$$
:::

:::solved_exercise Mass and weight on the Moon
A $60\ \text{kg}$ astronaut goes to the Moon, where $g \approx 1.6\ \text{m/s}^2$. Using $g = 10\ \text{m/s}^2$ on Earth, compare their mass and weight in the two places.
---resolution---
**Mass:** $60\ \text{kg}$ on Earth and $60\ \text{kg}$ on the Moon (mass does not change).

**Weight on Earth:** $W = 60 \times 10 = 600\ \text{N}$.

**Weight on the Moon:** $W = 60 \times 1.6 = 96\ \text{N}$.

On the Moon the astronaut weighs about one sixth of their weight on Earth, which is why they can make such high jumps, even in a heavy suit.
:::

:::real_world_application GPS satellites
GPS satellites orbit at about $20\,200\ \text{km}$ of altitude, much higher than the ISS. By Kepler's 3rd law (or by $T = 2\pi r / v$ with $v = \sqrt{GM/r}$), the larger the radius, the longer the period: they take about 12 hours to go around the Earth, while the ISS takes about 92 minutes. Geostationary satellites, even higher (about $36\,000\ \text{km}$ of altitude), take a whole day. Choosing an altitude is always choosing the period of the orbit.
:::

:::curiosity The hammer and the feather on the Moon
In 1971, during the Apollo 15 mission, astronaut David Scott dropped a hammer and a falcon feather at the same time in front of the camera, on the surface of the Moon. With no air to slow the feather down, the two objects fell together and hit the ground at the same time, exactly as $g = GM/R^2$ predicts: the acceleration of the fall does not depend on the mass of the falling body.
:::

:::text
## Summary and common mistakes

- $g = \dfrac{G M}{R^2}$: depends on the mass and radius of the celestial body, not on the mass of the falling object.
- At altitude $h$: $g_h = \dfrac{G M}{(R + h)^2}$; doubling the distance to the **center** divides $g$ by 4.
- Mass (kg) does not change; weight ($W = mg$, in N) changes with location.
- Circular orbit: $v = \sqrt{GM/r}$, independent of the satellite's mass; higher orbits are slower.
- Astronauts in orbit float because they are in free fall, not because there is no gravity.

**Common mistakes:**

- Confusing altitude ($h$) with distance to the center ($R + h$).
- Saying that "there is no gravity in space".
- Saying that a heavier body falls faster (without air resistance, all bodies fall with the same acceleration).
- Confusing mass with weight.
:::
