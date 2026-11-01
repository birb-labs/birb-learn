---
title: Energía: Estrategias de Resolución y Problemas Integrados
---

:::text
## Cuadro general de fórmulas

| Concepto | Fórmula | Observación |
|---|---|---|
| Trabajo de una fuerza constante | $W = F\,d\cos\theta$ | escalar, en J |
| Energía cinética | $E_c = \dfrac{m v^2}{2}$ | $\propto v^2$ |
| Teorema del trabajo y la energía cinética | $W_{\text{total}} = \Delta E_c$ | todas las fuerzas |
| Energía potencial gravitatoria | $E_{pg} = m g h$ | $h$ desde la referencia |
| Ley de Hooke | $F = k\,x$ | fuerza recuperadora |
| Energía potencial elástica | $E_{pe} = \dfrac{k x^2}{2}$ | $x$ = deformación |
| Teorema de la energía potencial | $W_{\text{cons}} = E_{p,i} - E_{p,f}$ | solo fuerzas conservativas |
| Energía mecánica | $E_m = E_c + E_p$ | |
| Teorema de la energía mecánica | $W_{\text{no cons}} = \Delta E_m$ | |
| Sistema conservativo | $E_{m,i} = E_{m,f}$ | |
| Sistema disipativo | $E_{m,i} = E_{m,f} + E_{\text{dis}}$ | $E_{\text{dis}} = \lvert W_{roz} \rvert$ |
:::

:::text
## Guía en 5 pasos

1. **Dibuja e identifica los estados.** Marca el punto inicial y el punto final que interesan. Anota, en cada uno, la rapidez, la altura y la deformación de los resortes.
2. **Elige el nivel de referencia** para la energía potencial gravitatoria. En general, el punto más bajo del movimiento.
3. **Enumera las fuerzas y clasifícalas.** ¿Cuáles son conservativas (peso, elástica)? ¿Cuáles son no conservativas (rozamiento, resistencia del aire, motor, persona)? ¿Cuáles no realizan trabajo (normal y tensión perpendiculares al movimiento)?
4. **Elige el teorema:**
   - solo las fuerzas conservativas realizan trabajo → **conservación de la energía mecánica**;
   - hay rozamiento, motor, etc. → **teorema de la energía mecánica** ($W_{\text{no cons}} = \Delta E_m$) o energía disipada;
   - quieres relacionar directamente trabajo y rapidez de un cuerpo → **teorema del trabajo y la energía cinética**.
5. **Escribe la ecuación, despeja la incógnita y comprueba las unidades** (kg, m, m/s, N/m, J).

## ¿Energía o cinemática?

Usa la **energía** cuando el problema trate de **rapideces y posiciones (alturas, distancias, deformaciones)** y no pida el **tiempo**. Funciona incluso con trayectorias curvas (rampas, péndulos, montañas rusas), donde la cinemática sería muy difícil. Usa la **cinemática y las leyes de Newton** cuando necesites el **tiempo** o la **aceleración** en cada instante. Muchos problemas combinan las dos cosas: por ejemplo, energía para hallar la rapidez y la segunda ley de Newton (resultante centrípeta) para hallar la fuerza en un punto de la trayectoria.
:::

:::simulator energy-track
Laboratorio de energía
Usa el simulador para comprobar tus respuestas: elige masa, altura y rozamiento, predice la rapidez en el punto más bajo con la conservación de la energía (o con la energía disipada) y compárala con el valor mostrado.
:::

:::solved_exercise Resorte y rozamiento en el mismo problema
Un bloque de $1\ \text{kg}$ comprime $20\ \text{cm}$ un resorte de constante $k = 400\ \text{N/m}$, sobre un piso horizontal con coeficiente de rozamiento cinético $\mu = 0{,}2$ ($g = 10\ \text{m/s}^2$). Se suelta el bloque, que solo toca el resorte mientras este lo empuja. ¿Qué distancia total recorre el bloque, desde el punto donde se soltó, hasta detenerse?
---resolution---
**Energía inicial** (solo elástica, porque el bloque parte del reposo y el piso es horizontal):

$$E_{m,i} = \frac{k x^2}{2} = \frac{400 \times 0{,}2^2}{2} = \frac{400 \times 0{,}04}{2} = 8\ \text{J}$$

**Energía final:** el bloque se detiene y el resorte queda relajado, así que $E_{m,f} = 0$.

**Rozamiento:** actúa durante todo el recorrido (también mientras el resorte aún empuja): $f = \mu m g = 0{,}2 \times 1 \times 10 = 2\ \text{N}$.

**Energía disipada = energía inicial:**

$$f\,d = 8 \quad\Rightarrow\quad d = \frac{8}{2} = 4\ \text{m}$$
:::

:::solved_exercise Tensión en la parte más baja de un péndulo
Un péndulo de longitud $L = 1\ \text{m}$ y masa $0{,}5\ \text{kg}$ se suelta desde el reposo con el hilo horizontal. Despreciando la resistencia del aire ($g = 10\ \text{m/s}^2$), calcula la rapidez y la tensión del hilo en el punto más bajo.
---resolution---
**1. Energía** (la masa baja una altura igual a $L$):

$$m g L = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = 2 g L = 2 \times 10 \times 1 = 20 \quad\Rightarrow\quad v = \sqrt{20} \approx 4{,}5\ \text{m/s}$$

**2. Dinámica del movimiento circular** en el punto más bajo: la resultante (tensión menos peso) es la fuerza centrípeta.

$$T - m g = \frac{m v^2}{L} \quad\Rightarrow\quad T = 0{,}5 \times 10 + \frac{0{,}5 \times 20}{1} = 5 + 10 = 15\ \text{N}$$

La tensión es el triple del peso ($3mg$), un resultado válido para cualquier péndulo soltado con el hilo horizontal.
:::

:::solved_exercise Un tobogán real
Un niño de $30\ \text{kg}$ parte del reposo en lo alto de un tobogán de $4\ \text{m}$ de altura y llega abajo a $6\ \text{m/s}$ ($g = 10\ \text{m/s}^2$). Calcula la energía disipada y el porcentaje de la energía inicial que se transformó en energía cinética.
---resolution---
$$E_{m,i} = 30 \times 10 \times 4 = 1\,200\ \text{J} \qquad E_{m,f} = \frac{30 \times 6^2}{2} = 540\ \text{J}$$

$$E_{\text{dis}} = 1\,200 - 540 = 660\ \text{J} \qquad \frac{540}{1\,200} = 0{,}45 = 45\%$$

Solo el 45% de la energía potencial se convirtió en energía cinética; el 55% restante se disipó (rozamiento con el tobogán y resistencia del aire).
:::

:::solved_exercise La dirección del lanzamiento no importa
Desde lo alto de un edificio de $15\ \text{m}$ se lanza una piedra a $10\ \text{m/s}$. Despreciando la resistencia del aire ($g = 10\ \text{m/s}^2$), ¿con qué rapidez llega al suelo si se lanza: a) hacia arriba; b) en horizontal; c) hacia abajo?
---resolution---
La energía cinética es escalar: no depende de la dirección de la velocidad. Por la conservación de la energía, con referencia en el suelo:

$$\frac{m v_0^2}{2} + m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = v_0^2 + 2 g h = 100 + 2 \times 10 \times 15 = 400$$

$$v = 20\ \text{m/s}$$

**En los tres casos** la piedra llega a $20\ \text{m/s}$. Lo que cambia es el tiempo de caída y la dirección de la velocidad al llegar, no su módulo.
:::

:::solved_exercise Bloque que cae sobre un resorte
Un bloque de $2\ \text{kg}$ se suelta desde el reposo $0{,}9\ \text{m}$ por encima del extremo superior de un resorte vertical de constante $k = 4\,000\ \text{N/m}$. Despreciando el rozamiento ($g = 10\ \text{m/s}^2$), ¿cuál es la compresión máxima del resorte?
---resolution---
**Estados:** el inicio (en reposo, $0{,}9\ \text{m}$ por encima del resorte) y la compresión máxima $x$ (en reposo de nuevo). Elige como referencia el punto de compresión máxima: en total, el bloque baja $0{,}9 + x$.

$$m g (0{,}9 + x) = \frac{k x^2}{2}$$

$$20\,(0{,}9 + x) = 2\,000\,x^2 \quad\Rightarrow\quad 2\,000\,x^2 - 20\,x - 18 = 0$$

**Fórmula general de segundo grado:**

$$x = \frac{20 \pm \sqrt{20^2 + 4 \times 2\,000 \times 18}}{2 \times 2\,000} = \frac{20 \pm \sqrt{400 + 144\,000}}{4\,000} = \frac{20 \pm 380}{4\,000}$$

La raíz positiva es $x = \dfrac{400}{4\,000} = 0{,}1\ \text{m}$ (la negativa no tiene sentido físico).

**Respuesta:** la compresión máxima es $10\ \text{cm}$. Error común: olvidar que, mientras comprime el resorte, el bloque sigue bajando la distancia $x$ y sigue perdiendo energía potencial.
:::

:::curiosity La energía es la misma idea en toda la ciencia
El julio que mide la energía cinética de un coche es el mismo julio que aparece en la factura de la luz (en kWh: $1\ \text{kWh} = 3{,}6 \times 10^6\ \text{J}$) y en la tabla nutricional de los alimentos (en kcal: $1\ \text{kcal} \approx 4\,184\ \text{J}$). Esta unidad común existe porque todas esas formas de energía pueden convertirse unas en otras, y la cantidad total siempre se conserva.
:::

:::text
## Lista de comprobación antes de entregar el examen

- ¿Están las unidades en el SI? (g → kg, cm → m, km/h → m/s)
- ¿Elevé al cuadrado la rapidez y la deformación?
- ¿Usé el **desnivel** para el peso y la **distancia recorrida** para el rozamiento?
- ¿Tuve en cuenta la energía cinética inicial, si el cuerpo ya se movía?
- ¿Tiene sentido el signo del trabajo (rozamiento siempre negativo; peso positivo al bajar)?
- ¿Es la respuesta físicamente razonable? (una rapidez final mayor que la inicial en un sistema disipativo sin desnivel indica un error.)
:::
