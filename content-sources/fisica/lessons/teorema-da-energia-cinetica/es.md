---
title: Teorema del Trabajo y la Energía Cinética
---

:::text
## Repaso: trabajo de una fuerza

Una fuerza **realiza trabajo** cuando el cuerpo sobre el que actúa se desplaza. Para una fuerza constante $F$ que forma un ángulo $\theta$ con el desplazamiento $d$:

$$W = F\,d\,\cos\theta$$

- Si la fuerza favorece el movimiento ($0° \le \theta < 90°$), el trabajo es **positivo** (trabajo motor).
- Si la fuerza es perpendicular al desplazamiento ($\theta = 90°$), el trabajo es **nulo**.
- Si la fuerza se opone al movimiento ($90° < \theta \le 180°$), el trabajo es **negativo** (trabajo resistente).

El trabajo, igual que la energía, se mide en **julios** y es una magnitud **escalar**. De hecho, eso es exactamente el trabajo: **energía transferida por una fuerza** de un cuerpo a otro (o convertida de una forma en otra).
:::

:::text
## El teorema

El **teorema del trabajo y la energía cinética** relaciona el trabajo de las fuerzas con la variación de la rapidez de un cuerpo:

> **El trabajo de la fuerza resultante (es decir, la suma de los trabajos de todas las fuerzas que actúan sobre el cuerpo) es igual a la variación de su energía cinética.**

$$W_{\text{total}} = \Delta E_c = E_{c,\text{final}} - E_{c,\text{inicial}} = \frac{m v_f^2}{2} - \frac{m v_i^2}{2}$$

Cómo interpretarlo:

- $W_{\text{total}} > 0$: la energía cinética **aumenta**, el cuerpo **acelera**.
- $W_{\text{total}} < 0$: la energía cinética **disminuye**, el cuerpo **frena**.
- $W_{\text{total}} = 0$: la energía cinética **no cambia**, la rapidez es constante.

El trabajo total puede calcularse de dos maneras equivalentes:

1. sumando el trabajo de cada fuerza: $W_{\text{total}} = W_1 + W_2 + W_3 + \dots$
2. calculando la fuerza resultante y su trabajo: $W_{\text{total}} = F_R\,d\,\cos\theta$.
:::

:::text
## De dónde sale el teorema (fuerza constante)

Considera un cuerpo de masa $m$ sometido a una fuerza resultante constante $F_R$, en la misma dirección y sentido que el desplazamiento $d$. Por la segunda ley de Newton, $F_R = m\,a$. Por la ecuación de Torricelli:

$$v_f^2 = v_i^2 + 2\,a\,d \quad\Rightarrow\quad a\,d = \frac{v_f^2 - v_i^2}{2}$$

Multiplicando ambos lados por $m$:

$$\underbrace{m\,a}_{F_R}\,d = \frac{m v_f^2}{2} - \frac{m v_i^2}{2} \quad\Rightarrow\quad W_{\text{total}} = \Delta E_c$$

La demostración anterior usa una fuerza constante, pero el teorema vale **siempre**: también para fuerzas variables y trayectorias curvas (la demostración general usa cálculo integral).

## Por qué es tan útil este teorema

Permite relacionar **fuerzas, desplazamiento y rapideces sin necesitar el tiempo ni la aceleración**. Siempre que un problema dé (o pida) rapideces y distancias, piensa en él antes de recurrir a la cinemática.
:::

:::text
## Fuerza variable: el área bajo la gráfica

Cuando la fuerza cambia a lo largo del desplazamiento, no se puede usar $W = Fd\cos\theta$ directamente. En ese caso, si la fuerza tiene la dirección del desplazamiento, el trabajo es numéricamente igual al **área bajo la gráfica de $F$ en función de la posición $x$**:

$$W = \text{área bajo la curva } F \times x$$

Las áreas por encima del eje $x$ corresponden a trabajo positivo; las áreas por debajo, a trabajo negativo. Con el trabajo calculado, el teorema da la rapidez final.

## Aplicación clásica: distancia de frenado

Un coche de masa $m$ y rapidez $v_0$ frena hasta detenerse bajo una fuerza de rozamiento constante $f$. El trabajo del rozamiento es $-f\,d$ y la energía cinética final es cero:

$$-f\,d = 0 - \frac{m v_0^2}{2} \quad\Rightarrow\quad d = \frac{m v_0^2}{2f}$$

Si el rozamiento proviene de las ruedas bloqueadas sobre el asfalto, $f = \mu\,m\,g$ y la masa se cancela:

$$d = \frac{v_0^2}{2\,\mu\,g}$$

La distancia de frenado es **proporcional al cuadrado de la rapidez**: al duplicar la rapidez, la distancia se **cuadruplica**.
:::

:::simulator work-energy-block
Trabajo y energía cinética
Un bloque es empujado por una fuerza horizontal sobre un piso con rozamiento. Compara las barras: la energía cinética final es siempre la inicial más el trabajo total. Prueba a aumentar el rozamiento hasta que el bloque se detenga antes del final.
:::

:::solved_exercise Bloque arrastrado sobre un piso con rozamiento
Un bloque de $2\ \text{kg}$, inicialmente en reposo, es arrastrado por una fuerza horizontal de $20\ \text{N}$ a lo largo de $4\ \text{m}$ sobre un piso con coeficiente de rozamiento cinético $\mu = 0{,}5$. Usa $g = 10\ \text{m/s}^2$. Calcula la rapidez del bloque al final del recorrido.
---resolution---
**1. Fuerzas y sus trabajos.** La normal equilibra el peso: $N = mg = 2 \times 10 = 20\ \text{N}$. El rozamiento vale $f = \mu N = 0{,}5 \times 20 = 10\ \text{N}$.

- Trabajo de la fuerza aplicada (mismo sentido que el desplazamiento): $W_F = 20 \times 4 = 80\ \text{J}$.
- Trabajo del rozamiento (sentido opuesto): $W_r = -10 \times 4 = -40\ \text{J}$.
- El peso y la normal son perpendiculares al desplazamiento: trabajo nulo.

**2. Trabajo total:** $W_{\text{total}} = 80 - 40 = 40\ \text{J}$.

**3. Teorema** (parte del reposo, $E_{c,i} = 0$):

$$40 = \frac{2\,v_f^2}{2} - 0 \quad\Rightarrow\quad v_f^2 = 40 \quad\Rightarrow\quad v_f = \sqrt{40} \approx 6{,}3\ \text{m/s}$$
:::

:::solved_exercise Distancia de frenado
Un coche de $1\,000\ \text{kg}$ a $20\ \text{m/s}$ frena, y la fuerza de rozamiento total sobre él es constante e igual a $8\,000\ \text{N}$.

a) ¿Qué distancia recorre hasta detenerse?

b) ¿Y si la rapidez inicial fuera $40\ \text{m/s}$, con la misma fuerza de frenado?
---resolution---
**a)** Energía cinética inicial: $E_{c,i} = \dfrac{1\,000 \times 20^2}{2} = 200\,000\ \text{J}$. El coche se detiene, así que $E_{c,f} = 0$. Solo el rozamiento realiza trabajo en la horizontal:

$$-8\,000\,d = 0 - 200\,000 \quad\Rightarrow\quad d = \frac{200\,000}{8\,000} = 25\ \text{m}$$

**b)** Con el doble de rapidez, la energía cinética es 4 veces mayor: $E_{c,i} = 800\,000\ \text{J}$.

$$d = \frac{800\,000}{8\,000} = 100\ \text{m}$$

La rapidez se duplicó y la distancia de frenado se **cuadruplicó**.
:::

:::solved_exercise Proyectil que atraviesa la madera
Un proyectil de $10\ \text{g}$ golpea un bloque de madera a $400\ \text{m/s}$ y se detiene después de penetrar $10\ \text{cm}$. ¿Cuál es la fuerza media que la madera ejerce sobre el proyectil?
---resolution---
**Unidades del SI:** $m = 10\ \text{g} = 0{,}01\ \text{kg}$ y $d = 10\ \text{cm} = 0{,}1\ \text{m}$.

**Energía cinética inicial:**

$$E_{c,i} = \frac{0{,}01 \times 400^2}{2} = \frac{0{,}01 \times 160\,000}{2} = 800\ \text{J}$$

**Teorema:** la fuerza media $F$ de la madera se opone al movimiento, así que $W = -F\,d$:

$$-F \times 0{,}1 = 0 - 800 \quad\Rightarrow\quad F = \frac{800}{0{,}1} = 8\,000\ \text{N}$$
:::

:::solved_exercise Fuerza variable: usando el área de la gráfica
Un cuerpo de $2\ \text{kg}$, en reposo sobre una superficie horizontal sin rozamiento, recibe una fuerza horizontal que disminuye linealmente de $10\ \text{N}$ (en $x = 0$) a $0$ (en $x = 4\ \text{m}$). ¿Cuál es la rapidez del cuerpo en $x = 4\ \text{m}$?
---resolution---
**1. Trabajo = área de la gráfica.** La gráfica $F \times x$ es un triángulo de base $4\ \text{m}$ y altura $10\ \text{N}$:

$$W = \frac{\text{base} \times \text{altura}}{2} = \frac{4 \times 10}{2} = 20\ \text{J}$$

**2. Teorema** (sin rozamiento, es la única fuerza que realiza trabajo):

$$20 = \frac{2\,v^2}{2} - 0 \quad\Rightarrow\quad v^2 = 20 \quad\Rightarrow\quad v = \sqrt{20} \approx 4{,}5\ \text{m/s}$$
:::

:::solved_exercise Altura máxima sin usar cinemática
Una pelota de $0{,}2\ \text{kg}$ se lanza verticalmente hacia arriba a $10\ \text{m/s}$. Despreciando la resistencia del aire y usando $g = 10\ \text{m/s}^2$, calcula la altura máxima alcanzada.
---resolution---
En la subida, la única fuerza es el peso, que apunta hacia abajo, contra el desplazamiento: $W_P = -m\,g\,h$. En el punto más alto, la rapidez es cero.

$$-m\,g\,h = 0 - \frac{m v_0^2}{2} \quad\Rightarrow\quad h = \frac{v_0^2}{2g} = \frac{10^2}{2 \times 10} = 5\ \text{m}$$

Observa que la masa se canceló: cualquier cuerpo lanzado a $10\ \text{m/s}$ sube $5\ \text{m}$ (sin resistencia del aire).
:::

:::real_world_application Airbags, cascos y parachoques
Para detener un cuerpo hay que quitarle toda su energía cinética: $F \cdot d = E_c$. La energía es fija (depende de la masa y de la rapidez), pero la **distancia** en la que se retira puede cambiar. Los airbags, los cascos acolchados y las zonas de deformación de los coches hacen que la detención ocurra a lo largo de una distancia mayor. Con $d$ mayor, la fuerza media $F = E_c/d$ es menor, y el cuerpo humano sufre menos. Es el teorema del trabajo y la energía salvando vidas.
:::

:::curiosity Movimiento circular uniforme: una fuerza que no realiza trabajo
En un movimiento circular uniforme hay una fuerza resultante (la centrípeta) que apunta siempre hacia el centro. Pero es siempre **perpendicular** a la velocidad, así que su trabajo es cero. Por el teorema, $\Delta E_c = 0$: la rapidez no cambia. La fuerza centrípeta cambia solo la **dirección** del movimiento, nunca la rapidez.
:::

:::text
## Resumen y errores comunes

- $W_{\text{total}} = \Delta E_c = \dfrac{m v_f^2}{2} - \dfrac{m v_i^2}{2}$.
- El trabajo total es la suma de los trabajos de **todas** las fuerzas (incluidos el rozamiento y el peso).
- Fuerza variable: trabajo = área bajo la gráfica $F \times x$.
- Distancia de frenado: $d = \dfrac{v_0^2}{2\mu g}$, proporcional a $v_0^2$.

**Errores comunes:**

- Usar el trabajo de una sola fuerza cuando el teorema exige el trabajo **total**.
- Olvidar el signo negativo del trabajo del rozamiento.
- Calcular $\Delta E_c$ como $\frac{m(v_f - v_i)^2}{2}$: lo correcto es la diferencia de los cuadrados, $\frac{m(v_f^2 - v_i^2)}{2}$.
- Olvidar que las fuerzas perpendiculares al desplazamiento (normal, centrípeta) no realizan trabajo.
:::
