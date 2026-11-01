---
title: Energía Cinética
---

:::text
## ¿Qué es la energía?

En física, la **energía** es la magnitud que mide la **capacidad de un sistema para realizar trabajo**, es decir, para producir cambios: poner algo en movimiento, calentarlo, deformarlo, levantarlo. Se presenta en muchas formas (térmica, química, eléctrica, luminosa, nuclear...), y una de las ideas más poderosas de la física es que **la energía no se crea ni se destruye: solo se transforma de una forma en otra** (o pasa de un cuerpo a otro).

En mecánica estudiamos principalmente tres formas:

- **energía cinética**: asociada al **movimiento**;
- **energía potencial**: asociada a la **posición** o a la **configuración** (altura, un resorte comprimido);
- **energía mecánica**: la suma de las dos anteriores.

La energía es una **magnitud escalar**: tiene valor numérico y unidad, pero **no tiene dirección ni sentido**. En el Sistema Internacional (SI), su unidad es el **julio** (J):

$$1\ \text{J} = 1\ \text{N}\cdot\text{m} = 1\ \text{kg}\cdot\text{m}^2/\text{s}^2$$

En esta lección estudiamos la primera de esas formas: la energía del movimiento.
:::

:::text
## Energía cinética: la energía del movimiento

Todo cuerpo que se mueve tiene **energía cinética** ($E_c$). La palabra viene del griego *kínesis*, que significa "movimiento". Intuitivamente:

- una bola de bolos rápida derriba más bolos que una lenta: **cuanto mayor es la rapidez**, mayor es la energía;
- un camión a 40 km/h causa mucho más daño en un choque que una bicicleta a la misma rapidez: **cuanto mayor es la masa**, mayor es la energía.

La expresión matemática que reúne estas dos observaciones es:

$$E_c = \frac{m\,v^2}{2}$$

donde:

| Símbolo | Magnitud | Unidad en el SI |
|---|---|---|
| $E_c$ | energía cinética | julio (J) |
| $m$ | masa del cuerpo | kilogramo (kg) |
| $v$ | rapidez (módulo de la velocidad) | metro por segundo (m/s) |

**¡Atención a las unidades!** Para obtener la energía en julios, la masa debe estar en **kg** y la rapidez en **m/s**. Si la rapidez viene en km/h, divide entre 3,6:

$$72\ \text{km/h} = \frac{72}{3{,}6}\ \text{m/s} = 20\ \text{m/s}$$
:::

:::text
## Propiedades importantes

**1. La energía cinética nunca es negativa.** La masa es positiva y $v^2 \ge 0$, por lo que $E_c \ge 0$. Solo vale cero cuando el cuerpo está en reposo.

**2. El sentido del movimiento no importa.** Como la rapidez aparece al cuadrado, un coche a 20 m/s hacia el norte tiene la misma energía cinética que el mismo coche a 20 m/s hacia el sur.

**3. La energía cinética es proporcional a la masa.** Con la misma rapidez, si la masa se duplica, la energía se duplica; si la masa se triplica, la energía se triplica.

**4. La energía cinética es proporcional al cuadrado de la rapidez.** Este es el punto que más aparece en los exámenes:

| Rapidez | Energía cinética |
|---|---|
| $v$ | $E_c$ |
| $2v$ | $4E_c$ |
| $3v$ | $9E_c$ |
| $v/2$ | $E_c/4$ |

Es decir, **duplicar la rapidez cuadruplica la energía cinética**. La gráfica de $E_c$ en función de $v$ es un arco de **parábola** (que pasa por el origen), mientras que la gráfica de $E_c$ en función de $m$ (con $v$ fija) es una **recta**.

**5. La energía cinética depende del sistema de referencia.** La rapidez se mide respecto de algún sistema de referencia. Un pasajero sentado dentro de un autobús tiene $E_c = 0$ respecto del autobús, pero tiene energía cinética respecto de la carretera. En los problemas escolares, salvo que se indique otra cosa, usa el suelo como referencia.
:::

:::simulator kinetic-energy-explorer
Explora la energía cinética
Cambia la masa y la rapidez. Observa que la curva de la energía cinética en función de la rapidez es una parábola: al duplicar la rapidez, la energía se multiplica por cuatro; al duplicar la masa, solo se duplica.
:::

:::solved_exercise Energía cinética de un coche
Un coche de masa $1\,000\ \text{kg}$ circula a $72\ \text{km/h}$. Calcula su energía cinética.
---resolution---
**1. Convertir la rapidez a m/s:**

$$v = \frac{72}{3{,}6} = 20\ \text{m/s}$$

**2. Aplicar la fórmula:**

$$E_c = \frac{m v^2}{2} = \frac{1\,000 \times 20^2}{2} = \frac{1\,000 \times 400}{2} = 200\,000\ \text{J}$$

**Respuesta:** $E_c = 2 \times 10^5\ \text{J} = 200\ \text{kJ}$.
:::

:::solved_exercise Comparando rapideces
Un ciclista aumenta su rapidez de $5\ \text{m/s}$ a $15\ \text{m/s}$. ¿Por qué factor se multiplicó su energía cinética?
---resolution---
La masa no cambia, así que la razón entre las energías depende solo de la razón entre los cuadrados de las rapideces:

$$\frac{E_{c,f}}{E_{c,i}} = \frac{\frac{m v_f^2}{2}}{\frac{m v_i^2}{2}} = \left(\frac{v_f}{v_i}\right)^2 = \left(\frac{15}{5}\right)^2 = 3^2 = 9$$

**Respuesta:** la energía cinética se hizo **9 veces mayor** (la rapidez se triplicó, y $3^2 = 9$).
:::

:::solved_exercise Calcular la rapidez a partir de la energía
Una pelota de $0{,}5\ \text{kg}$ tiene una energía cinética de $25\ \text{J}$. ¿Cuál es su rapidez?
---resolution---
Despejamos $v$ en la fórmula:

$$E_c = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = \frac{2E_c}{m} \quad\Rightarrow\quad v = \sqrt{\frac{2E_c}{m}}$$

Sustituyendo:

$$v = \sqrt{\frac{2 \times 25}{0{,}5}} = \sqrt{100} = 10\ \text{m/s}$$

**Respuesta:** $v = 10\ \text{m/s}$.
:::

:::solved_exercise ¿Masa o rapidez: qué pesa más?
Un camión de $6\,000\ \text{kg}$ se mueve a $10\ \text{m/s}$, y un coche de $1\,500\ \text{kg}$ se mueve a $20\ \text{m/s}$. ¿Cuál de los dos tiene más energía cinética?
---resolution---
**Camión:**

$$E_{c,\text{camión}} = \frac{6\,000 \times 10^2}{2} = \frac{6\,000 \times 100}{2} = 300\,000\ \text{J}$$

**Coche:**

$$E_{c,\text{coche}} = \frac{1\,500 \times 20^2}{2} = \frac{1\,500 \times 400}{2} = 300\,000\ \text{J}$$

**Respuesta:** los dos tienen la **misma** energía cinética, $3 \times 10^5\ \text{J}$. El camión tiene 4 veces la masa del coche, pero el coche tiene el doble de rapidez, y el doble de rapidez "vale" 4 veces más energía. Los efectos se compensan exactamente.
:::

:::real_world_application Por qué importan tanto los límites de velocidad
Como la energía cinética crece con el **cuadrado** de la rapidez, pequeños aumentos de rapidez producen grandes aumentos de energía. Un coche a 80 km/h tiene **4 veces** la energía cinética del mismo coche a 40 km/h. En un choque, esa energía tiene que disiparse (deformando la carrocería, calentando, rompiendo objetos), y por eso los choques a alta velocidad son mucho más destructivos. Por la misma razón, para frenar, el coche tiene que "quitar" toda esa energía: la distancia de frenado también crece con $v^2$, como veremos en la próxima lección.
:::

:::curiosity ¿De dónde salió el "½"?
A finales del siglo XVII, Gottfried Leibniz llamó a la magnitud $m v^2$ *vis viva* ("fuerza viva") y defendió que se conservaba en ciertos choques. El factor $\frac{1}{2}$ solo se consolidó en el siglo XIX: en 1829, el ingeniero francés Gaspard-Gustave Coriolis, en el libro *Du calcul de l'effet des machines*, empezó a usar la mitad de $m v^2$ y dio un sentido técnico a la palabra *travail* ("trabajo"). Con el $\frac{1}{2}$, la energía cinética encaja perfectamente en el teorema del trabajo, que es el tema de la próxima lección.
:::

:::text
## Resumen y errores comunes

- $E_c = \dfrac{m v^2}{2}$, en julios, con $m$ en kg y $v$ en m/s.
- $E_c$ es escalar y nunca negativa; solo vale cero si el cuerpo está en reposo.
- $E_c \propto m$ (se duplica la masa, se duplica la energía) y $E_c \propto v^2$ (se duplica la rapidez, se cuadruplica la energía).

**Errores comunes:**

- Olvidar convertir km/h a m/s (divide entre 3,6).
- Olvidar elevar la rapidez al cuadrado, o elevar la masa al cuadrado por error.
- Creer que duplicar la rapidez duplica la energía (en realidad la cuadruplica).
- Asignar signo negativo a la energía cinética de un cuerpo que se mueve "hacia atrás": el sentido no importa.
:::
