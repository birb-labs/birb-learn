---
title: Energía Mecánica y su Conservación
---

:::text
## Juntando las piezas

En las lecciones anteriores vimos la energía del movimiento (cinética) y las energías almacenadas (potencial gravitatoria y elástica). La suma de todas ellas es la **energía mecánica** ($E_m$) del sistema:

$$E_m = E_c + E_p = \frac{m v^2}{2} + m g h + \frac{k x^2}{2}$$

(incluye solo los términos que existen en el problema: si no hay resorte, no hay energía elástica.)

La energía mecánica es útil porque, en muchas situaciones, **no cambia**: la energía solo pasa de una forma a otra. Una pelota que cae pierde energía potencial y gana exactamente la misma cantidad de energía cinética.
:::

:::text
## Teorema de la energía mecánica

Separemos las fuerzas que actúan sobre un cuerpo en dos grupos: **conservativas** (peso, fuerza elástica) y **no conservativas** (rozamiento, resistencia del aire, la fuerza de un motor, la fuerza de una persona que empuja).

Por el teorema del trabajo y la energía cinética, el trabajo total es igual a $\Delta E_c$:

$$W_{\text{cons}} + W_{\text{no cons}} = \Delta E_c$$

Por el teorema de la energía potencial, $W_{\text{cons}} = -\Delta E_p$. Sustituyendo:

$$-\Delta E_p + W_{\text{no cons}} = \Delta E_c \quad\Rightarrow\quad W_{\text{no cons}} = \Delta E_c + \Delta E_p$$

Como $\Delta E_c + \Delta E_p = \Delta E_m$, llegamos al **teorema de la energía mecánica**:

$$W_{\text{no conservativas}} = \Delta E_m = E_{m,\text{final}} - E_{m,\text{inicial}}$$

> **La variación de la energía mecánica de un sistema es igual al trabajo de las fuerzas no conservativas.**

- Si las fuerzas no conservativas realizan trabajo **negativo** (rozamiento, resistencia del aire), la energía mecánica **disminuye**.
- Si realizan trabajo **positivo** (un motor, una persona que empuja), la energía mecánica **aumenta**.
- Si no realizan trabajo, la energía mecánica **se conserva**.
:::

:::text
## Principio de conservación de la energía mecánica

Cuando **solo las fuerzas conservativas realizan trabajo**, $W_{\text{no cons}} = 0$ y:

$$E_{m,\text{inicial}} = E_{m,\text{final}} \qquad\text{es decir}\qquad E_{c,i} + E_{p,i} = E_{c,f} + E_{p,f}$$

Este sistema se llama **sistema conservativo**.

**Atención:** "solo las fuerzas conservativas realizan trabajo" **no** significa que solo existan fuerzas conservativas. Las fuerzas que son siempre perpendiculares al movimiento (como la **normal** en una pista sin rozamiento o la **tensión** del hilo de un péndulo) **no realizan trabajo** y, por lo tanto, no alteran la energía mecánica.

## Consecuencias importantes

**Caída libre (sin resistencia del aire).** Un cuerpo soltado desde el reposo a una altura $h$ llega al suelo con:

$$m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v = \sqrt{2 g h}$$

La masa se cancela: sin resistencia del aire, un cuerpo ligero y uno pesado llegan con la misma rapidez.

**Rampas y pistas sin rozamiento.** La rapidez en un punto depende **solo del desnivel** respecto del punto de partida, y no de la forma de la pista. Una rampa suave y una rampa empinada de la misma altura dan la misma rapidez al final (la empinada solo lo hace más rápido).

**Gráficas.** En un sistema conservativo, la gráfica de $E_m$ en función del tiempo o de la posición es una recta horizontal; las curvas de $E_c$ y $E_p$ son "simétricas": cuando una sube, la otra baja en la misma cantidad.
:::

:::simulator energy-track
Conservación de la energía mecánica
Sin rozamiento, la barra de la energía mecánica no cambia: la bola intercambia energía potencial por cinética y viceversa, y siempre vuelve a la altura de la que partió. En el punto más bajo toda la energía es cinética; en los puntos más altos, toda es potencial.
:::

:::solved_exercise Caída libre
Una pelota se suelta desde el reposo a $20\ \text{m}$ de altura. Despreciando la resistencia del aire y usando $g = 10\ \text{m/s}^2$, calcula la rapidez de la pelota: a) cuando está a $15\ \text{m}$ del suelo; b) al llegar al suelo.
---resolution---
El sistema es conservativo (solo el peso realiza trabajo). Referencia en el suelo.

**a)** La pelota cayó $\Delta h = 20 - 15 = 5\ \text{m}$:

$$m g h_i = \frac{m v^2}{2} + m g h_f \quad\Rightarrow\quad v^2 = 2 g (h_i - h_f) = 2 \times 10 \times 5 = 100 \quad\Rightarrow\quad v = 10\ \text{m/s}$$

**b)** Ahora $\Delta h = 20\ \text{m}$:

$$v = \sqrt{2 \times 10 \times 20} = \sqrt{400} = 20\ \text{m/s}$$

Observa que no hizo falta la masa de la pelota.
:::

:::solved_exercise Péndulo simple
Un péndulo se suelta desde el reposo en un punto situado $45\ \text{cm}$ por encima del punto más bajo de su trayectoria. Despreciando la resistencia del aire ($g = 10\ \text{m/s}^2$), ¿cuál es la rapidez de la masa en el punto más bajo?
---resolution---
La tensión del hilo es siempre perpendicular a la velocidad, así que no realiza trabajo. Solo el peso realiza trabajo: la energía mecánica se conserva. Referencia en el punto más bajo:

$$m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v = \sqrt{2 g h} = \sqrt{2 \times 10 \times 0{,}45} = \sqrt{9} = 3\ \text{m/s}$$
:::

:::solved_exercise Montaña rusa
Un carrito de montaña rusa pasa por la cima de una elevación de $20\ \text{m}$ con una rapidez de $5\ \text{m/s}$. Despreciando el rozamiento ($g = 10\ \text{m/s}^2$), ¿cuál es su rapidez cuando pasa por un punto a $5\ \text{m}$ de altura?
---resolution---
Conservación de la energía mecánica, con referencia en el suelo:

$$\frac{m v_i^2}{2} + m g h_i = \frac{m v_f^2}{2} + m g h_f$$

Dividiendo todo entre $m$ y multiplicando por 2:

$$v_f^2 = v_i^2 + 2 g (h_i - h_f) = 5^2 + 2 \times 10 \times (20 - 5) = 25 + 300 = 325$$

$$v_f = \sqrt{325} \approx 18\ \text{m/s}$$
:::

:::solved_exercise Resorte que lanza un bloque rampa arriba
Un bloque de $0{,}5\ \text{kg}$ comprime $30\ \text{cm}$ un resorte de constante $k = 200\ \text{N/m}$ sobre una superficie horizontal. Al soltarlo, el bloque recorre la superficie y sube por una rampa. Sin rozamiento ($g = 10\ \text{m/s}^2$), ¿qué altura máxima alcanza?
---resolution---
Toda la energía elástica inicial se transforma en energía potencial gravitatoria en el punto más alto (donde la rapidez es cero):

$$\frac{k x^2}{2} = m g h_{\text{máx}}$$

$$\frac{200 \times 0{,}3^2}{2} = 0{,}5 \times 10 \times h_{\text{máx}} \quad\Rightarrow\quad 9 = 5\,h_{\text{máx}} \quad\Rightarrow\quad h_{\text{máx}} = 1{,}8\ \text{m}$$
:::

:::solved_exercise Altura mínima para dar el rizo
Una pequeña esfera se desliza sin rozamiento por una pista que termina en un rizo circular vertical de radio $R = 0{,}4\ \text{m}$. ¿Desde qué altura mínima (medida desde la base del rizo) debe partir del reposo para completar el rizo sin perder contacto con la pista?
---resolution---
**1. Condición en la parte alta del rizo.** En el punto más alto, la fuerza centrípeta la proporcionan el peso más la normal. La rapidez mínima se da cuando la normal es cero:

$$m g = \frac{m v^2}{R} \quad\Rightarrow\quad v_{\text{arriba}}^2 = g R$$

**2. Conservación de la energía** entre la salida (altura $h$, en reposo) y la parte alta del rizo (altura $2R$):

$$m g h = \frac{m v_{\text{arriba}}^2}{2} + m g (2R) = \frac{m g R}{2} + 2 m g R \quad\Rightarrow\quad h = \frac{5R}{2}$$

**3. Valor numérico:** $h = 2{,}5 \times 0{,}4 = 1{,}0\ \text{m}$.
:::

:::solved_exercise Lanzamiento vertical
Una pelota se lanza verticalmente hacia arriba desde el suelo a $20\ \text{m/s}$. Despreciando la resistencia del aire ($g = 10\ \text{m/s}^2$), ¿a qué altura su rapidez será $10\ \text{m/s}$?
---resolution---
$$\frac{m v_0^2}{2} = \frac{m v^2}{2} + m g h \quad\Rightarrow\quad h = \frac{v_0^2 - v^2}{2 g} = \frac{400 - 100}{20} = 15\ \text{m}$$

A esa altura la pelota sube a $10\ \text{m/s}$, y volverá a pasar por ella al bajar, también a $10\ \text{m/s}$.
:::

:::real_world_application Salto con pértiga
El salto con pértiga es una secuencia de transformaciones de energía. En la carrera, el atleta acumula energía cinética. Al clavar la pértiga, esta se curva y almacena parte de esa energía como energía potencial elástica. Al enderezarse, la pértiga devuelve esa energía y ayuda a elevar al atleta, transformándola en energía potencial gravitatoria. Por eso la rapidez de la carrera es tan importante: cuanta más energía cinética al principio, más alto puede llegar el atleta.
:::

:::curiosity El principio que unificó la física
La idea de que la energía se conserva, cambiando solo de forma, fue formulada en la década de 1840 por varios científicos que trabajaban de forma independiente, entre ellos Julius Robert von Mayer, James Prescott Joule y Hermann von Helmholtz. Joule mostró experimentalmente que una cierta cantidad de trabajo mecánico siempre produce la misma cantidad de calor. La conservación de la energía mecánica que estudiamos aquí es un caso particular de ese principio general: cuando no hay rozamiento, la energía no "se escapa" en forma térmica.
:::

:::text
## Resumen y errores comunes

- $E_m = E_c + E_p$.
- **Teorema de la energía mecánica:** $W_{\text{no cons}} = \Delta E_m$.
- **Sistema conservativo** (solo las fuerzas conservativas realizan trabajo): $E_{c,i} + E_{p,i} = E_{c,f} + E_{p,f}$.
- Caída libre desde el reposo: $v = \sqrt{2 g h}$, independiente de la masa.
- Rizo vertical sin rozamiento: altura mínima de salida $h = \dfrac{5R}{2}$.

**Errores comunes:**

- Creer que la presencia de la normal o de la tensión impide la conservación: no realizan trabajo cuando son perpendiculares al movimiento.
- Olvidar la energía cinética inicial cuando el cuerpo ya parte con rapidez.
- Olvidar que, en el punto más alto de un lanzamiento oblicuo, la rapidez **no** es cero (la componente horizontal continúa).
:::
