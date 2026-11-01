---
title: Sistemas Conservativos y No Conservativos
---

:::text
## Dos tipos de sistema

En la lección anterior vimos el teorema de la energía mecánica:

$$W_{\text{no conservativas}} = \Delta E_m$$

Este teorema divide los sistemas mecánicos en dos grupos:

**Sistema conservativo:** solo las fuerzas conservativas (peso, fuerza elástica) realizan trabajo. Las fuerzas no conservativas no existen o no realizan trabajo (como la normal perpendicular al movimiento). La energía mecánica es **constante**:

$$E_{m,i} = E_{m,f}$$

Ejemplos idealizados: caída libre sin resistencia del aire, péndulo sin rozamiento, bloque en una rampa lisa, sistema masa–resorte sin rozamiento.

**Sistema no conservativo:** alguna fuerza no conservativa realiza trabajo, y la energía mecánica **varía**:

$$E_{m,f} = E_{m,i} + W_{\text{no cons}}$$

Hay dos casos:

- **Sistema disipativo:** fuerzas como el rozamiento y la resistencia del aire realizan trabajo **negativo**, y la energía mecánica **disminuye**. Es el caso más común en el mundo real.
- **Sistema que recibe energía:** un motor, una persona u otro agente externo realiza trabajo **positivo**, y la energía mecánica **aumenta**. Por ejemplo, un ascensor que sube, tirado por el motor.
:::

:::text
## ¿Adónde va la energía "perdida"?

Cuando el rozamiento frena un bloque, la energía mecánica disminuye, pero **la energía total no desaparece**. El principio general de conservación de la energía sigue valiendo: la energía mecánica se convierte en otras formas, principalmente:

- **energía térmica** (las superficies se calientan: frótate las manos y lo notarás);
- **energía sonora** (el chirrido de una frenada);
- energía gastada en **deformaciones permanentes** (la carrocería abollada en un choque).

Llamamos **energía disipada** a la parte de la energía mecánica que se convirtió en esas otras formas:

$$E_{\text{disipada}} = E_{m,i} - E_{m,f} = |W_{\text{roz}}|$$

Es decir, en un sistema en el que solo el rozamiento (y otras fuerzas disipativas) actúa además de las fuerzas conservativas:

$$E_{m,i} = E_{m,f} + E_{\text{disipada}}$$

Esta forma de escribirlo es muy práctica para resolver ejercicios: **la energía que había al principio es igual a la que queda más la que se disipó**.

## Trabajo del rozamiento en planos inclinados

En un plano inclinado de ángulo $\theta$, la normal vale $N = m g \cos\theta$, y el rozamiento cinético vale $f = \mu\,m\,g\cos\theta$. A lo largo de una longitud $L$ de la rampa:

$$W_{roz} = -\mu\,m\,g\cos\theta\,L$$

Atención: el rozamiento depende de la **distancia recorrida** sobre la superficie, no del desnivel.
:::

:::text
## Casos especiales que aparecen en los exámenes

**Velocidad terminal.** Un paracaidista con el paracaídas abierto desciende con rapidez constante. La energía cinética no cambia, pero la energía potencial disminuye: **toda** la energía potencial perdida la disipa la resistencia del aire. En ese tramo, $E_{\text{disipada}} = m\,g\,\Delta h$.

**Pelota que rebota.** Una pelota soltada desde una altura $h_1$ que, después de rebotar, sube solo hasta $h_2 < h_1$ perdió energía mecánica en el choque con el suelo (deformación, sonido, calentamiento). La energía disipada es $m g (h_1 - h_2)$.

**Subir con rapidez constante.** Un ascensor que sube con rapidez constante mantiene su energía cinética, pero gana energía potencial. Esa ganancia viene del trabajo positivo del motor: $W_{\text{motor}} = m g \Delta h$ (despreciando rozamientos).

**Relación con el rendimiento.** En las máquinas reales, la energía útil siempre es menor que la energía suministrada, porque una parte se disipa. El **rendimiento** es $\eta = \dfrac{E_{\text{útil}}}{E_{\text{total}}}$, siempre menor que 1 (o que el 100%).
:::

:::simulator energy-track
Energía disipada por el rozamiento
Ahora hay una fuerza de rozamiento. Observa cómo crece la barra de la energía disipada mientras la mecánica disminuye: la bola ya no vuelve a la altura inicial y, con el tiempo, se detiene. La suma de la energía mecánica y la disipada sigue siendo igual a la energía inicial. Prueba también con rozamiento cero para comparar.
:::

:::solved_exercise Esquiador en una ladera
Un esquiador de $60\ \text{kg}$ parte del reposo en lo alto de una ladera de $20\ \text{m}$ de altura y llega a la base a $10\ \text{m/s}$. Usa $g = 10\ \text{m/s}^2$. ¿Cuánta energía disiparon el rozamiento y la resistencia del aire?
---resolution---
Referencia en la base de la ladera.

**Energía mecánica inicial** (solo potencial):

$$E_{m,i} = m g h = 60 \times 10 \times 20 = 12\,000\ \text{J}$$

**Energía mecánica final** (solo cinética):

$$E_{m,f} = \frac{m v^2}{2} = \frac{60 \times 10^2}{2} = 3\,000\ \text{J}$$

**Energía disipada:**

$$E_{\text{dis}} = 12\,000 - 3\,000 = 9\,000\ \text{J}$$

Es decir, se disipó el 75% de la energía mecánica inicial.
:::

:::solved_exercise ¿Hasta dónde se desliza el bloque?
Un bloque de $4\ \text{kg}$ se desliza sobre un piso horizontal con una rapidez inicial de $6\ \text{m/s}$. El coeficiente de rozamiento cinético es $\mu = 0{,}3$ y $g = 10\ \text{m/s}^2$. ¿Qué distancia recorre el bloque hasta detenerse?
---resolution---
En el piso horizontal, la energía potencial no cambia; toda la energía cinética inicial la disipa el rozamiento.

$$E_{c,i} = \frac{4 \times 6^2}{2} = 72\ \text{J} \qquad f = \mu m g = 0{,}3 \times 4 \times 10 = 12\ \text{N}$$

$$f\,d = E_{c,i} \quad\Rightarrow\quad d = \frac{72}{12} = 6\ \text{m}$$
:::

:::solved_exercise Rampa con rozamiento
Un bloque de $2\ \text{kg}$ se suelta desde lo alto de una rampa de $5\ \text{m}$ de longitud inclinada un ángulo $\theta$ respecto de la horizontal, con $\sin\theta = 0{,}6$ y $\cos\theta = 0{,}8$. El coeficiente de rozamiento cinético entre el bloque y la rampa es $0{,}25$ y $g = 10\ \text{m/s}^2$. ¿Con qué rapidez llega el bloque a la base?
---resolution---
**1. Altura de la rampa:** $h = L \sin\theta = 5 \times 0{,}6 = 3\ \text{m}$.

**2. Energía mecánica inicial** (referencia en la base): $E_{m,i} = m g h = 2 \times 10 \times 3 = 60\ \text{J}$.

**3. Trabajo del rozamiento** a lo largo de los 5 m:

$$W_{roz} = -\mu\,m\,g\cos\theta\,L = -0{,}25 \times 2 \times 10 \times 0{,}8 \times 5 = -20\ \text{J}$$

**4. Teorema de la energía mecánica:**

$$E_{m,f} = E_{m,i} + W_{roz} = 60 - 20 = 40\ \text{J}$$

En la base, toda esa energía es cinética:

$$\frac{2\,v^2}{2} = 40 \quad\Rightarrow\quad v = \sqrt{40} \approx 6{,}3\ \text{m/s}$$

Sin rozamiento, la rapidez sería $\sqrt{2 \times 10 \times 3} = \sqrt{60} \approx 7{,}7\ \text{m/s}$.
:::

:::solved_exercise Paracaidista en velocidad terminal
Un paracaidista de $80\ \text{kg}$ (con el equipo) desciende $100\ \text{m}$ con una rapidez constante de $5\ \text{m/s}$. Usa $g = 10\ \text{m/s}^2$. ¿Cuánta energía disipó la resistencia del aire en ese tramo?
---resolution---
Como la rapidez es constante, la energía cinética no cambia: $\Delta E_c = 0$. La energía potencial disminuye:

$$\Delta E_p = -m g \Delta h = -80 \times 10 \times 100 = -80\,000\ \text{J}$$

La variación de la energía mecánica es $\Delta E_m = 0 + (-80\,000) = -80\,000\ \text{J}$. Por lo tanto, la resistencia del aire disipó $80\,000\ \text{J}$ ($80\ \text{kJ}$). El dato de $5\ \text{m/s}$ no cambia el resultado.
:::

:::solved_exercise Pelota que rebota
Una pelota de $0{,}2\ \text{kg}$ se suelta desde $2\ \text{m}$ de altura y, después de chocar con el suelo, sube hasta $1{,}5\ \text{m}$. Usa $g = 10\ \text{m/s}^2$. ¿Qué fracción de la energía mecánica se disipó?
---resolution---
En los puntos más altos la rapidez es cero, así que la energía mecánica es solo potencial.

$$E_{m,i} = 0{,}2 \times 10 \times 2 = 4\ \text{J} \qquad E_{m,f} = 0{,}2 \times 10 \times 1{,}5 = 3\ \text{J}$$

$$E_{\text{dis}} = 4 - 3 = 1\ \text{J} \qquad \frac{E_{\text{dis}}}{E_{m,i}} = \frac{1}{4} = 25\%$$
:::

:::solved_exercise Ascensor: cuando la energía mecánica aumenta
Un motor eleva con rapidez constante un ascensor de $500\ \text{kg}$ a lo largo de $12\ \text{m}$. Despreciando rozamientos ($g = 10\ \text{m/s}^2$), ¿cuál es el trabajo realizado por el motor?
---resolution---
La fuerza del motor (a través de la tensión del cable) es no conservativa. Por el teorema de la energía mecánica, $W_{\text{motor}} = \Delta E_m$. Con rapidez constante, $\Delta E_c = 0$:

$$W_{\text{motor}} = \Delta E_p = m g \Delta h = 500 \times 10 \times 12 = 60\,000\ \text{J}$$

Aquí el sistema es no conservativo, pero la energía mecánica **aumentó**: el motor le suministró $60\ \text{kJ}$ al ascensor.
:::

:::real_world_application Frenos que se convierten en generadores
En los frenos comunes, la energía cinética del coche se disipa como calor en los discos y las pastillas, que pueden calentarse mucho. Los coches eléctricos e híbridos usan además el **frenado regenerativo**: el motor eléctrico funciona como generador y convierte parte de la energía cinética en energía eléctrica que recarga la batería. La energía que se desperdiciaría como calor se aprovecha en parte.
:::

:::curiosity El experimento de Joule
En la década de 1840, James Prescott Joule construyó un aparato en el que unas pesas, al bajar, hacían girar unas paletas dentro de un recipiente con agua. El rozamiento de las paletas con el agua calentaba ligeramente el líquido. Midiendo la caída de las pesas y el aumento de temperatura, Joule mostró que la energía mecánica "perdida" reaparecía como energía térmica, siempre en la misma proporción. Ese resultado fue clave para establecer el principio de conservación de la energía, y por eso la unidad de energía lleva su nombre.
:::

:::text
## Resumen y errores comunes

- **Conservativo:** $E_{m,i} = E_{m,f}$.
- **Disipativo:** $E_{m,i} = E_{m,f} + E_{\text{disipada}}$, con $E_{\text{disipada}} = |W_{roz}|$.
- **Recibiendo energía:** $E_{m,f} = E_{m,i} + W_{\text{motor}}$.
- La energía total siempre se conserva; lo que cambia es cuánta es mecánica.
- Rozamiento en una rampa: $W_{roz} = -\mu m g \cos\theta \cdot L$ (usa la longitud de la rampa).

**Errores comunes:**

- Decir que el rozamiento "destruyó" la energía: se transformó (sobre todo en energía térmica).
- Usar la altura de la rampa para calcular el rozamiento, en lugar de la distancia recorrida.
- Olvidar que rapidez constante no significa energía mecánica constante (la potencial puede estar cambiando).
:::
