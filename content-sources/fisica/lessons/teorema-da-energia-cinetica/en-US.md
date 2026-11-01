---
title: The Work–Energy Theorem
---

:::text
## Recap: work done by a force

A force **does work** when the body it acts on moves. For a constant force $F$ at an angle $\theta$ with the displacement $d$:

$$W = F\,d\,\cos\theta$$

- If the force helps the motion ($0° \le \theta < 90°$), the work is **positive**.
- If the force is perpendicular to the displacement ($\theta = 90°$), the work is **zero**.
- If the force opposes the motion ($90° < \theta \le 180°$), the work is **negative**.

Work, like energy, is measured in **joules** and is a **scalar** quantity. In fact, that is exactly what work is: **energy transferred by a force** from one body to another (or converted from one form into another).
:::

:::text
## The theorem

The **work–energy theorem** (also called the kinetic energy theorem) connects the work done by forces with the change in a body's speed:

> **The work done by the net force (that is, the sum of the work done by all the forces acting on the body) equals the change in its kinetic energy.**

$$W_{\text{net}} = \Delta KE = KE_{\text{final}} - KE_{\text{initial}} = \frac{m v_f^2}{2} - \frac{m v_i^2}{2}$$

How to read it:

- $W_{\text{net}} > 0$: kinetic energy **increases**, the body **speeds up**.
- $W_{\text{net}} < 0$: kinetic energy **decreases**, the body **slows down**.
- $W_{\text{net}} = 0$: kinetic energy **does not change**, the speed stays constant.

The net work can be calculated in two equivalent ways:

1. adding up the work of each force: $W_{\text{net}} = W_1 + W_2 + W_3 + \dots$
2. finding the net force and its work: $W_{\text{net}} = F_{\text{net}}\,d\,\cos\theta$.
:::

:::text
## Where the theorem comes from (constant force)

Consider a body of mass $m$ under a constant net force $F_{\text{net}}$ in the same direction as the displacement $d$. By Newton's second law, $F_{\text{net}} = m\,a$. By the kinematic equation $v_f^2 = v_i^2 + 2ad$ (Torricelli's equation):

$$a\,d = \frac{v_f^2 - v_i^2}{2}$$

Multiplying both sides by $m$:

$$\underbrace{m\,a}_{F_{\text{net}}}\,d = \frac{m v_f^2}{2} - \frac{m v_i^2}{2} \quad\Rightarrow\quad W_{\text{net}} = \Delta KE$$

The derivation above uses a constant force, but the theorem **always** holds: for variable forces and curved paths too (the general proof uses integral calculus).

## Why the theorem is so useful

It relates **forces, displacement and speeds without needing the time or the acceleration**. Whenever a problem gives (or asks for) speeds and distances, think of it before reaching for kinematics.
:::

:::text
## Variable force: the area under the graph

When the force changes along the displacement, you cannot use $W = Fd\cos\theta$ directly. In that case, if the force points along the displacement, the work is numerically equal to the **area under the graph of $F$ versus position $x$**:

$$W = \text{area under the } F \times x \text{ curve}$$

Areas above the $x$-axis correspond to positive work; areas below the axis, to negative work. With the work in hand, the work–energy theorem gives the final speed.

## Classic application: braking distance

A car of mass $m$ and speed $v_0$ brakes to a stop under a constant friction force $f$. The work of friction is $-f\,d$, and the final kinetic energy is zero:

$$-f\,d = 0 - \frac{m v_0^2}{2} \quad\Rightarrow\quad d = \frac{m v_0^2}{2f}$$

If the friction comes from locked wheels on the asphalt, $f = \mu\,m\,g$ and the mass cancels:

$$d = \frac{v_0^2}{2\,\mu\,g}$$

The braking distance is **proportional to the square of the speed**: double the speed and the distance **quadruples**.
:::

:::simulator work-energy-block
Work and kinetic energy
A block is pushed by a horizontal force across a floor with friction. Compare the bars: the final kinetic energy is always the initial one plus the net work. Try increasing friction until the block stops before the end.
:::

:::solved_exercise Block pulled across a rough floor
A $2\ \text{kg}$ block, initially at rest, is pulled by a horizontal $20\ \text{N}$ force over $4\ \text{m}$ on a floor with coefficient of kinetic friction $\mu = 0.5$. Use $g = 10\ \text{m/s}^2$. Find the block's speed at the end.
---resolution---
**1. Forces and their work.** The normal force balances the weight: $N = mg = 2 \times 10 = 20\ \text{N}$. Friction is $f = \mu N = 0.5 \times 20 = 10\ \text{N}$.

- Work of the applied force (same direction as the displacement): $W_F = 20 \times 4 = 80\ \text{J}$.
- Work of friction (opposite direction): $W_f = -10 \times 4 = -40\ \text{J}$.
- Weight and normal force are perpendicular to the displacement: zero work.

**2. Net work:** $W_{\text{net}} = 80 - 40 = 40\ \text{J}$.

**3. Work–energy theorem** (starting from rest, $KE_i = 0$):

$$40 = \frac{2\,v_f^2}{2} - 0 \quad\Rightarrow\quad v_f^2 = 40 \quad\Rightarrow\quad v_f = \sqrt{40} \approx 6.3\ \text{m/s}$$
:::

:::solved_exercise Braking distance
A $1\,000\ \text{kg}$ car moving at $20\ \text{m/s}$ brakes, and the total friction force on it is constant and equal to $8\,000\ \text{N}$.

a) How far does it travel before stopping?

b) What if the initial speed were $40\ \text{m/s}$, with the same braking force?
---resolution---
**a)** Initial kinetic energy: $KE_i = \dfrac{1\,000 \times 20^2}{2} = 200\,000\ \text{J}$. The car stops, so $KE_f = 0$. Only friction does work along the horizontal:

$$-8\,000\,d = 0 - 200\,000 \quad\Rightarrow\quad d = \frac{200\,000}{8\,000} = 25\ \text{m}$$

**b)** With twice the speed, the kinetic energy is 4 times larger: $KE_i = 800\,000\ \text{J}$.

$$d = \frac{800\,000}{8\,000} = 100\ \text{m}$$

The speed doubled and the braking distance **quadrupled**.
:::

:::solved_exercise A bullet going into wood
A $10\ \text{g}$ bullet hits a wooden block at $400\ \text{m/s}$ and stops after penetrating $10\ \text{cm}$. What is the average force the wood exerts on the bullet?
---resolution---
**SI units:** $m = 10\ \text{g} = 0.01\ \text{kg}$ and $d = 10\ \text{cm} = 0.1\ \text{m}$.

**Initial kinetic energy:**

$$KE_i = \frac{0.01 \times 400^2}{2} = \frac{0.01 \times 160\,000}{2} = 800\ \text{J}$$

**Theorem:** the wood's average force $F$ opposes the motion, so $W = -F\,d$:

$$-F \times 0.1 = 0 - 800 \quad\Rightarrow\quad F = \frac{800}{0.1} = 8\,000\ \text{N}$$
:::

:::solved_exercise Variable force: using the area under the graph
A $2\ \text{kg}$ body at rest on a frictionless horizontal surface is acted on by a horizontal force that decreases linearly from $10\ \text{N}$ (at $x = 0$) to $0$ (at $x = 4\ \text{m}$). What is the body's speed at $x = 4\ \text{m}$?
---resolution---
**1. Work = area under the graph.** The $F \times x$ graph is a triangle with base $4\ \text{m}$ and height $10\ \text{N}$:

$$W = \frac{\text{base} \times \text{height}}{2} = \frac{4 \times 10}{2} = 20\ \text{J}$$

**2. Work–energy theorem** (with no friction, this is the only force doing work):

$$20 = \frac{2\,v^2}{2} - 0 \quad\Rightarrow\quad v^2 = 20 \quad\Rightarrow\quad v = \sqrt{20} \approx 4.5\ \text{m/s}$$
:::

:::solved_exercise Maximum height without kinematics
A $0.2\ \text{kg}$ ball is thrown straight up at $10\ \text{m/s}$. Ignoring air resistance and using $g = 10\ \text{m/s}^2$, find the maximum height reached.
---resolution---
On the way up, the only force is the weight, which points down, against the displacement: $W_g = -m\,g\,h$. At the top, the speed is zero.

$$-m\,g\,h = 0 - \frac{m v_0^2}{2} \quad\Rightarrow\quad h = \frac{v_0^2}{2g} = \frac{10^2}{2 \times 10} = 5\ \text{m}$$

Notice that the mass cancelled out: any body thrown up at $10\ \text{m/s}$ rises $5\ \text{m}$ (without air resistance).
:::

:::real_world_application Airbags, helmets and bumpers
To stop a body, all its kinetic energy has to be removed: $F \cdot d = KE$. The energy is fixed (it depends on the mass and the speed), but the **distance** over which it is removed can change. Airbags, padded helmets and car crumple zones make the stop happen over a longer distance. With a larger $d$, the average force $F = KE/d$ is smaller, and the human body suffers less. It is the work–energy theorem saving lives.
:::

:::curiosity Uniform circular motion: a force that does no work
In uniform circular motion there is a net force (the centripetal force) always pointing toward the center. But it is always **perpendicular** to the velocity, so its work is zero. By the theorem, $\Delta KE = 0$: the speed does not change. The centripetal force changes only the **direction** of motion, never the speed.
:::

:::text
## Summary and common mistakes

- $W_{\text{net}} = \Delta KE = \dfrac{m v_f^2}{2} - \dfrac{m v_i^2}{2}$.
- The net work is the sum of the work of **all** the forces (including friction and weight).
- Variable force: work = area under the $F \times x$ graph.
- Braking distance: $d = \dfrac{v_0^2}{2\mu g}$, proportional to $v_0^2$.

**Common mistakes:**

- Using the work of just one force when the theorem requires the **net** work.
- Forgetting the negative sign on the work of friction.
- Computing $\Delta KE$ as $\frac{m(v_f - v_i)^2}{2}$: the correct expression is the difference of the squares, $\frac{m(v_f^2 - v_i^2)}{2}$.
- Forgetting that forces perpendicular to the displacement (normal, centripetal) do no work.
:::
