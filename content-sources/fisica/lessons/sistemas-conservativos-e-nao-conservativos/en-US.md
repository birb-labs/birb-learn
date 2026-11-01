---
title: Conservative and Non-Conservative Systems
---

:::text
## Two kinds of system

In the previous lesson we saw the mechanical energy theorem:

$$W_{\text{non-conservative}} = \Delta ME$$

It splits mechanical systems into two groups:

**Conservative system:** only conservative forces (weight, elastic force) do work. Non-conservative forces either do not exist or do no work (such as a normal force perpendicular to the motion). The mechanical energy is **constant**:

$$ME_i = ME_f$$

Idealized examples: free fall without air resistance, a frictionless pendulum, a block on a smooth ramp, a frictionless mass–spring system.

**Non-conservative system:** some non-conservative force does work, and the mechanical energy **changes**:

$$ME_f = ME_i + W_{\text{non-cons}}$$

There are two cases:

- **Dissipative system:** forces such as friction and air resistance do **negative** work, and the mechanical energy **decreases**. This is the most common case in the real world.
- **System receiving energy:** an engine, a person or some other external agent does **positive** work, and the mechanical energy **increases**. For example, an elevator going up, pulled by its motor.
:::

:::text
## Where does the "lost" energy go?

When friction slows a block down, the mechanical energy decreases, but **the total energy does not disappear**. The general principle of conservation of energy still holds: the mechanical energy is converted into other forms, mainly:

- **thermal energy** (the surfaces warm up: rub your hands together and feel it);
- **sound energy** (the squeal of brakes);
- energy spent on **permanent deformation** (crumpled bodywork in a crash).

We call **dissipated energy** the part of the mechanical energy that was converted into these other forms:

$$E_{\text{dissipated}} = ME_i - ME_f = |W_{\text{friction}}|$$

In other words, in a system where only friction (and other dissipative forces) act besides the conservative forces:

$$ME_i = ME_f + E_{\text{dissipated}}$$

This way of writing it is very handy for solving problems: **the energy at the start equals what is left plus what was dissipated**.

## Work of friction on inclined planes

On an incline of angle $\theta$, the normal force is $N = m g \cos\theta$, and kinetic friction is $f = \mu\,m\,g\cos\theta$. Along a length $L$ of the ramp:

$$W_f = -\mu\,m\,g\cos\theta\,L$$

Watch out: friction depends on the **distance traveled** along the surface, not on the height difference.
:::

:::text
## Special cases that show up on tests

**Terminal velocity.** A skydiver with the parachute open descends at constant speed. The kinetic energy does not change, but the potential energy decreases: **all** the potential energy lost is dissipated by air resistance. Over that stretch, $E_{\text{dissipated}} = m\,g\,\Delta h$.

**Bouncing ball.** A ball dropped from a height $h_1$ that, after bouncing, rises only to $h_2 < h_1$ lost mechanical energy in the collision with the floor (deformation, sound, heating). The dissipated energy is $m g (h_1 - h_2)$.

**Rising at constant speed.** An elevator rising at constant speed keeps its kinetic energy but gains potential energy. That gain comes from the positive work of the motor: $W_{\text{motor}} = m g \Delta h$ (ignoring friction).

**Connection with efficiency.** In real machines, the useful energy is always less than the energy supplied, because part of it is dissipated. The **efficiency** is $\eta = \dfrac{E_{\text{useful}}}{E_{\text{total}}}$, always less than 1 (or 100%).
:::

:::simulator energy-track
Energy dissipated by friction
Now there is a friction force. Watch the dissipated energy bar grow while the mechanical energy decreases: the ball no longer returns to its starting height and eventually stops. The sum of the mechanical and dissipated energy stays equal to the initial energy. Also try zero friction to compare.
:::

:::solved_exercise Skier on a slope
A $60\ \text{kg}$ skier starts from rest at the top of a $20\ \text{m}$-high slope and reaches the bottom at $10\ \text{m/s}$. Use $g = 10\ \text{m/s}^2$. How much energy was dissipated by friction and air resistance?
---resolution---
Reference at the bottom of the slope.

**Initial mechanical energy** (potential only):

$$ME_i = m g h = 60 \times 10 \times 20 = 12\,000\ \text{J}$$

**Final mechanical energy** (kinetic only):

$$ME_f = \frac{m v^2}{2} = \frac{60 \times 10^2}{2} = 3\,000\ \text{J}$$

**Dissipated energy:**

$$E_{\text{diss}} = 12\,000 - 3\,000 = 9\,000\ \text{J}$$

In other words, 75% of the initial mechanical energy was dissipated.
:::

:::solved_exercise How far does the block slide?
A $4\ \text{kg}$ block slides on a horizontal floor with an initial speed of $6\ \text{m/s}$. The coefficient of kinetic friction is $\mu = 0.3$ and $g = 10\ \text{m/s}^2$. How far does the block travel before stopping?
---resolution---
On the horizontal floor, the potential energy does not change; all the initial kinetic energy is dissipated by friction.

$$KE_i = \frac{4 \times 6^2}{2} = 72\ \text{J} \qquad f = \mu m g = 0.3 \times 4 \times 10 = 12\ \text{N}$$

$$f\,d = KE_i \quad\Rightarrow\quad d = \frac{72}{12} = 6\ \text{m}$$
:::

:::solved_exercise Ramp with friction
A $2\ \text{kg}$ block is released from the top of a $5\ \text{m}$-long ramp inclined at $\theta$ to the horizontal, with $\sin\theta = 0.6$ and $\cos\theta = 0.8$. The coefficient of kinetic friction between the block and the ramp is $0.25$ and $g = 10\ \text{m/s}^2$. At what speed does the block reach the bottom?
---resolution---
**1. Height of the ramp:** $h = L \sin\theta = 5 \times 0.6 = 3\ \text{m}$.

**2. Initial mechanical energy** (reference at the bottom): $ME_i = m g h = 2 \times 10 \times 3 = 60\ \text{J}$.

**3. Work of friction** along the 5 m:

$$W_f = -\mu\,m\,g\cos\theta\,L = -0.25 \times 2 \times 10 \times 0.8 \times 5 = -20\ \text{J}$$

**4. Mechanical energy theorem:**

$$ME_f = ME_i + W_f = 60 - 20 = 40\ \text{J}$$

At the bottom, all that energy is kinetic:

$$\frac{2\,v^2}{2} = 40 \quad\Rightarrow\quad v = \sqrt{40} \approx 6.3\ \text{m/s}$$

Without friction, the speed would be $\sqrt{2 \times 10 \times 3} = \sqrt{60} \approx 7.7\ \text{m/s}$.
:::

:::solved_exercise Skydiver at terminal velocity
An $80\ \text{kg}$ skydiver (with equipment) descends $100\ \text{m}$ at a constant speed of $5\ \text{m/s}$. Use $g = 10\ \text{m/s}^2$. How much energy was dissipated by air resistance over this stretch?
---resolution---
Since the speed is constant, the kinetic energy does not change: $\Delta KE = 0$. The potential energy decreases:

$$\Delta PE = -m g \Delta h = -80 \times 10 \times 100 = -80\,000\ \text{J}$$

The change in mechanical energy is $\Delta ME = 0 + (-80\,000) = -80\,000\ \text{J}$. Therefore, the energy dissipated by air resistance was $80\,000\ \text{J}$ ($80\ \text{kJ}$). The $5\ \text{m/s}$ speed does not change the result.
:::

:::solved_exercise Bouncing ball
A $0.2\ \text{kg}$ ball is dropped from a height of $2\ \text{m}$ and, after hitting the floor, rises to $1.5\ \text{m}$. Use $g = 10\ \text{m/s}^2$. What fraction of the mechanical energy was dissipated?
---resolution---
At the highest points the speed is zero, so the mechanical energy is potential only.

$$ME_i = 0.2 \times 10 \times 2 = 4\ \text{J} \qquad ME_f = 0.2 \times 10 \times 1.5 = 3\ \text{J}$$

$$E_{\text{diss}} = 4 - 3 = 1\ \text{J} \qquad \frac{E_{\text{diss}}}{ME_i} = \frac{1}{4} = 25\%$$
:::

:::solved_exercise Elevator: when mechanical energy increases
A motor raises a $500\ \text{kg}$ elevator $12\ \text{m}$ at constant speed. Ignoring friction ($g = 10\ \text{m/s}^2$), how much work does the motor do?
---resolution---
The motor's force (through the cable tension) is non-conservative. By the mechanical energy theorem, $W_{\text{motor}} = \Delta ME$. At constant speed, $\Delta KE = 0$:

$$W_{\text{motor}} = \Delta PE = m g \Delta h = 500 \times 10 \times 12 = 60\,000\ \text{J}$$

Here the system is non-conservative, but the mechanical energy **increased**: the motor supplied $60\ \text{kJ}$ to the elevator.
:::

:::real_world_application Brakes that become generators
In ordinary brakes, the car's kinetic energy is dissipated as heat in the discs and pads, which can get very hot. Electric and hybrid cars also use **regenerative braking**: the electric motor works as a generator, converting part of the kinetic energy into electrical energy that recharges the battery. Energy that would be wasted as heat is partly recovered.
:::

:::curiosity Joule's experiment
In the 1840s, James Prescott Joule built an apparatus in which descending weights turned paddles inside a container of water. The friction of the paddles with the water warmed the liquid slightly. By measuring the fall of the weights and the rise in temperature, Joule showed that the "lost" mechanical energy reappeared as thermal energy, always in the same proportion. This result was central to establishing the principle of conservation of energy, and that is why the unit of energy bears his name.
:::

:::text
## Summary and common mistakes

- **Conservative:** $ME_i = ME_f$.
- **Dissipative:** $ME_i = ME_f + E_{\text{dissipated}}$, with $E_{\text{dissipated}} = |W_f|$.
- **Receiving energy:** $ME_f = ME_i + W_{\text{motor}}$.
- Total energy is always conserved; what changes is how much of it is mechanical.
- Friction on a ramp: $W_f = -\mu m g \cos\theta \cdot L$ (use the length of the ramp).

**Common mistakes:**

- Saying the energy "was destroyed" by friction: it was transformed (mainly into thermal energy).
- Using the height of the ramp to calculate friction, instead of the distance traveled.
- Forgetting that constant speed does not mean constant mechanical energy (the potential energy may be changing).
:::
