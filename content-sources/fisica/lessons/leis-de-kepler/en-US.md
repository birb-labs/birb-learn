---
title: Kepler's Laws
---

:::text
## From the ancient sky to elliptical orbits

For many centuries the **geocentric model** prevailed: the Earth stood still at the center of the Universe and the heavenly bodies revolved around it. The most elaborate version of this model was set out by Claudius Ptolemy in the 2nd century, in a work known as the *Almagest*.

In 1543, Nicolaus Copernicus published *De revolutionibus orbium coelestium*, proposing the **heliocentric model**: the Sun at the center and the planets, including the Earth, revolving around it. Copernicus, however, still used **circular** orbits, and the predictions remained inaccurate.

The next step came from much better data. The Danish astronomer **Tycho Brahe** spent decades measuring the positions of the planets with the naked eye (the telescope was not yet used in astronomy) with unprecedented precision. His assistant, the German **Johannes Kepler**, inherited this data and spent years trying to explain the orbit of Mars. By abandoning the idea of circles, Kepler found three laws that describe the motion of the planets:

- the **1st and 2nd laws** were published in 1609, in the book *Astronomia Nova*;
- the **3rd law** was published in 1619, in the book *Harmonices Mundi*.

Kepler's laws are **descriptive**: they tell us **how** the planets move, but not **why**. The explanation came decades later, with Newton's universal gravitation (next lesson).
:::

:::text
## A little geometry: the ellipse

An **ellipse** is the set of points in a plane whose **sum of distances to two fixed points**, the **foci** ($F_1$ and $F_2$), is constant. Its main elements:

- **semi-major axis** $a$: half of the ellipse's longest diameter;
- **semi-minor axis** $b$: half of the shortest diameter;
- **focal distance** $c$: distance from the center of the ellipse to each focus;
- relationship between them: $a^2 = b^2 + c^2$;
- **eccentricity**: $e = \dfrac{c}{a}$, with $0 \le e < 1$.

The eccentricity measures how "flattened" the ellipse is: $e = 0$ is a circle (the two foci coincide at the center); the closer to 1, the more elongated the ellipse.
:::

:::text
## 1st law: the law of orbits

> **Each planet moves in an elliptical orbit around the Sun, with the Sun at one of the foci of the ellipse.**

Consequences:

- The distance between the planet and the Sun **changes** along the orbit.
- The point closest to the Sun is the **perihelion**, at a distance $r_p = a - c = a(1 - e)$.
- The farthest point is the **aphelion**, at a distance $r_a = a + c = a(1 + e)$.
- Adding them: $r_p + r_a = 2a$. The semi-major axis is the **average** of the perihelion and aphelion distances, which is why it is also called the **mean radius** of the orbit.

The planets' orbits are ellipses with **low eccentricity**, almost circular. Earth's has an eccentricity of about $0.017$: at perihelion (in early January) the Earth is about $147.1$ million km from the Sun, and at aphelion (in early July), about $152.1$ million km. Comets, on the other hand, can have very elongated orbits: Halley's comet has an eccentricity of about $0.967$.

**Beware of a classic mistake:** the **seasons are not caused** by the changing distance to the Sun. Notice that the Earth is closest to the Sun in January, which is summer in the Southern Hemisphere and winter in the Northern. The seasons are due to the **tilt of the Earth's rotation axis**.

Textbook drawings often exaggerate the flattening of planetary orbits so that the elliptical shape is visible.
:::

:::text
## 2nd law: the law of areas

> **The line segment joining the Sun and a planet sweeps out equal areas in equal intervals of time.**

Imagine an imaginary line connecting the Sun to the planet. If in one month it "paints" a certain area near perihelion, in any other month it will paint exactly the same area, even near aphelion. Since near perihelion the planet is closer to the Sun, it has to cover a **longer** arc in the same time to sweep the same area.

Consequences:

- The planet is **fastest at perihelion** and **slowest at aphelion**.
- From aphelion to perihelion the motion **speeds up**; from perihelion to aphelion it **slows down**.
- At perihelion and aphelion, the velocity is perpendicular to the Sun–planet line, and the following relationship holds:

$$r_p \, v_p = r_a \, v_a \qquad\Rightarrow\qquad \frac{v_p}{v_a} = \frac{r_a}{r_p}$$

The quantity "area swept per unit time" is constant and is called the **areal velocity**.
:::

:::text
## 3rd law: the law of periods

> **The square of a planet's orbital period is proportional to the cube of the semi-major axis of its orbit.**

$$\frac{T^2}{a^3} = K \qquad (\text{constant})$$

- $T$ is the **orbital period** (the time for one complete revolution, the planet's "year").
- $a$ is the **semi-major axis** (the mean radius of the orbit; for circular orbits, the radius itself).
- The constant $K$ is **the same for all bodies orbiting the same central body**. It depends on the mass of the central body, but **not** on the mass of the planet.

Consequence: **the farther from the Sun, the longer the period**, and it grows faster than the distance. Mercury goes around in about 88 days; Neptune takes about 165 years.

**A very useful choice of units:** measuring $T$ in **Earth years** and $a$ in **astronomical units** (1 AU ≈ 149.6 million km, the mean Earth–Sun distance), the Earth has $T = 1$ and $a = 1$, so $K = 1$ and, for any body orbiting the Sun:

$$T^2 = a^3$$

To compare two bodies orbiting the same central body:

$$\frac{T_1^2}{a_1^3} = \frac{T_2^2}{a_2^3}$$

The three laws also hold for other systems: moons around Jupiter, the Moon and artificial satellites around the Earth. Only the value of the constant $K$ changes, since it depends on the central body.
:::

:::simulator kepler-orbit
Kepler orbits
Change the eccentricity and the semi-major axis and start the animation. The colored slices are swept in equal times and have equal areas (2nd law): notice how the planet speeds up near perihelion. The period follows the 3rd law, T² = a³ (in years and AU).
:::

:::solved_exercise The eccentricity of Earth's orbit
The Earth is about $147.1 \times 10^6\ \text{km}$ from the Sun at perihelion and $152.1 \times 10^6\ \text{km}$ at aphelion. Find the semi-major axis and the eccentricity of the orbit.
---resolution---
**Semi-major axis** (average of perihelion and aphelion):

$$a = \frac{r_p + r_a}{2} = \frac{147.1 + 152.1}{2} \times 10^6 = 149.6 \times 10^6\ \text{km}$$

**Focal distance:** $c = a - r_p = (149.6 - 147.1) \times 10^6 = 2.5 \times 10^6\ \text{km}$.

**Eccentricity:**

$$e = \frac{c}{a} = \frac{2.5}{149.6} \approx 0.017$$

A very small value: Earth's orbit is almost a circle.
:::

:::solved_exercise Speed at perihelion and aphelion
A comet has its perihelion $1\ \text{AU}$ from the Sun and its aphelion $9\ \text{AU}$ away. How many times greater is its speed at perihelion than at aphelion?
---resolution---
By the 2nd law, at perihelion and aphelion $r_p v_p = r_a v_a$:

$$\frac{v_p}{v_a} = \frac{r_a}{r_p} = \frac{9}{1} = 9$$

The comet is **9 times faster** at perihelion than at aphelion.
:::

:::solved_exercise Using the 3rd law in the Solar System
a) An asteroid orbits the Sun with a semi-major axis of $4\ \text{AU}$. What is its period?

b) The semi-major axis of Mars's orbit is about $1.52\ \text{AU}$. Estimate the length of the Martian year.
---resolution---
With $T$ in years and $a$ in AU, $T^2 = a^3$ holds for any body orbiting the Sun.

**a)**

$$T^2 = 4^3 = 64 \quad\Rightarrow\quad T = 8\ \text{years}$$

**b)**

$$T^2 = 1.52^3 \approx 3.51 \quad\Rightarrow\quad T \approx \sqrt{3.51} \approx 1.87\ \text{years}$$

That is about $1.87 \times 365 \approx 684$ days, very close to the real length of the Martian year (about 687 days). The small difference comes from rounding $a$.
:::

:::solved_exercise Two satellites of the Earth
Satellite A moves in a circular orbit of radius $R$ around the Earth with period $T$. Satellite B moves in a circular orbit of radius $4R$. What is B's period in terms of $T$?
---resolution---
Both orbit the Earth, so the 3rd-law constant is the same:

$$\frac{T_A^2}{R_A^3} = \frac{T_B^2}{R_B^3} \quad\Rightarrow\quad T_B^2 = T^2 \cdot \frac{(4R)^3}{R^3} = 64\,T^2 \quad\Rightarrow\quad T_B = 8\,T$$

The radius quadrupled and the period became **8 times** longer.
:::

:::solved_exercise The orbit of Halley's comet
Halley's comet has a period of about $76$ years and passes about $0.59\ \text{AU}$ from the Sun at perihelion. Estimate the semi-major axis of its orbit and its aphelion distance.
---resolution---
**Semi-major axis** from the 3rd law ($T$ in years, $a$ in AU):

$$a^3 = T^2 = 76^2 = 5\,776 \quad\Rightarrow\quad a = \sqrt[3]{5\,776} \approx 17.9\ \text{AU}$$

**Aphelion**, using $r_p + r_a = 2a$:

$$r_a = 2a - r_p \approx 2 \times 17.9 - 0.59 \approx 35.2\ \text{AU}$$

That is farther than Neptune's orbit (about 30 AU). That is why Halley spends decades far away and is only visible from Earth near perihelion.
:::

:::solved_exercise Areas and times
A planet takes 20 days to sweep an area $A$ near perihelion. How long does it take to sweep an area $3A$ near aphelion?
---resolution---
By the 2nd law, the area swept is proportional to the time, in **any** part of the orbit (the areal velocity is constant):

$$\frac{A}{20\ \text{days}} = \frac{3A}{t} \quad\Rightarrow\quad t = 60\ \text{days}$$

The position in the orbit (perihelion or aphelion) does not change the relationship between area and time.
:::

:::real_world_application Geostationary satellites
The 3rd law holds for artificial satellites around the Earth. A **geostationary** satellite has to complete one orbit in exactly one sidereal day (about 23 h 56 min, the time of one rotation of the Earth), moving in the plane of the Equator and in the same direction as the rotation. That way it stays fixed relative to the ground, and an antenna pointed at it does not need to move. This fixed period determines the radius of the orbit: about $42\,000\ \text{km}$ from the Earth's center, that is, an altitude of roughly $36\,000\ \text{km}$. TV and communication satellites use this orbit.
:::

:::curiosity Eight minutes of arc
Kepler built a model with a circular orbit for Mars that agreed very well with Tycho's data but, at some positions, was off by about 8 minutes of arc (a little more than one eighth of a degree). For most astronomers of the time, the difference would have been negligible. Kepler, however, trusted the precision of Tycho's measurements and decided that this small error could not be ignored. It was by abandoning the circle that he arrived at the ellipse.
:::

:::text
## Summary and common mistakes

- **1st law (orbits):** elliptical orbits with the Sun at one focus. $r_p = a - c$, $r_a = a + c$, $e = c/a$.
- **2nd law (areas):** equal areas in equal times; fastest at perihelion. $r_p v_p = r_a v_a$.
- **3rd law (periods):** $T^2/a^3 = K$, the same for all bodies orbiting the same central body. In the Solar System, with years and AU: $T^2 = a^3$.

**Common mistakes:**

- Thinking the Sun is at the **center** of the ellipse: it is at a **focus**.
- Thinking the planet's speed is constant.
- Applying the same constant $K$ to bodies orbiting different central bodies (for example, the Moon and Mars).
- Explaining the seasons by the distance to the Sun.
- Thinking the constant $K$ depends on the mass of the planet.
:::
