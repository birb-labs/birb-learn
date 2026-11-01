---
title: Ley de Gravitación Universal
---

:::text
## La misma fuerza en el cielo y en la Tierra

Kepler describió **cómo** se mueven los planetas, pero no explicó **qué** los mantenía en órbita. La respuesta llegó con el inglés **Isaac Newton**, en el libro *Philosophiæ Naturalis Principia Mathematica* (los *Principia*), publicado en 1687.

La gran idea de Newton fue darse cuenta de que la fuerza que hace caer una manzana y la fuerza que mantiene a la Luna girando alrededor de la Tierra son **la misma**: la **gravitación**. Una única ley, válida para cualquier par de cuerpos del Universo (por eso es **universal**), explica la caída de los objetos, las mareas, las órbitas de los planetas y las leyes de Kepler.
:::

:::text
## El enunciado

> **Dos cuerpos cualesquiera se atraen con fuerzas proporcionales al producto de sus masas e inversamente proporcionales al cuadrado de la distancia entre sus centros.**

$$F = \frac{G\,M\,m}{d^2}$$

| Símbolo | Magnitud | Unidad en el SI |
|---|---|---|
| $F$ | módulo de la fuerza gravitatoria | N |
| $M$, $m$ | masas de los dos cuerpos | kg |
| $d$ | distancia entre los **centros** de los cuerpos | m |
| $G$ | constante de gravitación universal | N·m²/kg² |

El valor de $G$, determinado experimentalmente, es:

$$G \approx 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$$

Un número extremadamente pequeño. Por eso la atracción gravitatoria entre objetos cotidianos (dos personas, dos sillas) es imperceptible: la gravedad solo se vuelve importante cuando al menos una de las masas es enorme, como la de un planeta o una estrella.

**Atención a la distancia:** $d$ se mide **entre los centros**. Para un objeto en la superficie de la Tierra, $d$ es el radio de la Tierra, no cero. Para un satélite a una altitud $h$, $d = R + h$.
:::

:::text
## Características de la fuerza gravitatoria

**1. Es siempre atractiva.** No existe "repulsión gravitatoria" entre masas.

**2. Es un par de acción y reacción.** La Tierra atrae a la Luna con la misma intensidad con que la Luna atrae a la Tierra, en sentidos opuestos (tercera ley de Newton). Las fuerzas son iguales, pero los **efectos** son distintos: la misma fuerza produce una aceleración mucho menor en la Tierra, que tiene una masa mucho mayor ($a = F/m$).

**3. Es proporcional a cada una de las masas.** Si se duplica una de las masas, la fuerza se duplica; si se duplican las dos, la fuerza se cuadruplica.

**4. Varía con el inverso del cuadrado de la distancia.** Este es el punto más preguntado:

| Distancia | Fuerza |
|---|---|
| $d$ | $F$ |
| $2d$ | $F/4$ |
| $3d$ | $F/9$ |
| $d/2$ | $4F$ |
| $10d$ | $F/100$ |

**5. Actúa a distancia y no se puede bloquear.** No hace falta contacto, y ningún material "aísla" la gravedad.

**6. Para cuerpos esféricos**, Newton demostró que la atracción es la misma que si toda la masa estuviera concentrada en el centro. Por eso usamos la distancia entre los centros.
:::

:::text
## La prueba de la Luna

Newton puso a prueba su idea comparando la caída de una manzana con el "movimiento de caída" de la Luna. La Luna está a unos 60 radios terrestres del centro de la Tierra. Si la fuerza disminuye con el cuadrado de la distancia, la aceleración causada por la Tierra en la posición de la Luna debería ser unas $60^2 = 3\,600$ veces menor que $g$:

$$\frac{9{,}8}{3\,600} \approx 0{,}0027\ \text{m/s}^2$$

La aceleración centrípeta de la Luna puede calcularse con los datos de su órbita (radio de unos $3{,}84 \times 10^8\ \text{m}$ y periodo de unos $27{,}3$ días):

$$a = \frac{4\pi^2 r}{T^2} \approx 0{,}0027\ \text{m/s}^2$$

Los dos valores coinciden: la misma fuerza que hace caer la manzana mantiene a la Luna en órbita.

## La 3.ª ley de Kepler a partir de Newton

Para un cuerpo de masa $m$ en órbita circular de radio $r$ alrededor de un astro de masa $M$, la fuerza gravitatoria es la resultante centrípeta:

$$\frac{G M m}{r^2} = \frac{m v^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{G M}{r}}$$

Como $v = \dfrac{2\pi r}{T}$, sustituyendo y reordenando:

$$\frac{T^2}{r^3} = \frac{4\pi^2}{G M}$$

Esta es la **3.ª ley de Kepler**, ahora con la constante explicada: $K = \dfrac{4\pi^2}{GM}$ depende **solo de la masa del astro central**. La masa $m$ del satélite se cancela, y por eso la constante es la misma para todos los cuerpos que orbitan el mismo astro. Además, midiendo $T$ y $r$ de una órbita, podemos calcular la masa del astro central: así se "pesan" el Sol y los planetas.
:::

:::simulator universal-gravitation
Atracción gravitatoria
Elige un escenario y multiplica las masas y la distancia. Comprueba que duplicar la distancia divide la fuerza entre 4 y que duplicar una masa duplica la fuerza. Compara también la fuerza entre dos personas con la fuerza entre la Tierra y la Luna.
:::

:::solved_exercise ¿Se atraen dos personas?
Calcula la fuerza de atracción gravitatoria entre dos personas de $70\ \text{kg}$ y $60\ \text{kg}$ separadas $1\ \text{m}$ (trátalas como puntos). Usa $G = 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$.
---resolution---
$$F = \frac{G M m}{d^2} = \frac{6{,}67 \times 10^{-11} \times 70 \times 60}{1^2} = 6{,}67 \times 10^{-11} \times 4\,200 \approx 2{,}8 \times 10^{-7}\ \text{N}$$

Una fuerza de menos de una millonésima de newton: completamente imperceptible. El peso de cada persona (la atracción de la Tierra) es del orden de cientos de newtons.
:::

:::solved_exercise Cambiando masas y distancia
Dos cuerpos se atraen con una fuerza $F$. ¿Qué ocurre con la fuerza si la masa de uno de ellos se duplica, la del otro se triplica y la distancia entre ellos se duplica?
---resolution---
$$F' = \frac{G\,(2M)(3m)}{(2d)^2} = \frac{6\,G M m}{4\,d^2} = \frac{6}{4}\,F = 1{,}5\,F$$

La fuerza se hace **1,5 veces** mayor: las masas multiplican la fuerza por 6, y la distancia duplicada la divide entre 4.
:::

:::solved_exercise La fuerza entre la Tierra y la Luna
Con $M_{\text{Tierra}} \approx 5{,}97 \times 10^{24}\ \text{kg}$, $m_{\text{Luna}} \approx 7{,}35 \times 10^{22}\ \text{kg}$ y una distancia media entre centros de $3{,}84 \times 10^8\ \text{m}$, estima la fuerza gravitatoria entre la Tierra y la Luna.
---resolution---
$$F = \frac{6{,}67 \times 10^{-11} \times 5{,}97 \times 10^{24} \times 7{,}35 \times 10^{22}}{(3{,}84 \times 10^8)^2}$$

**Numerador:** $6{,}67 \times 5{,}97 \times 7{,}35 \approx 292{,}7$, y las potencias de 10 suman $-11 + 24 + 22 = 35$: $\approx 2{,}93 \times 10^{37}$.

**Denominador:** $3{,}84^2 \approx 14{,}75$, así que $(3{,}84 \times 10^8)^2 \approx 1{,}47 \times 10^{17}$.

$$F \approx \frac{2{,}93 \times 10^{37}}{1{,}47 \times 10^{17}} \approx 2{,}0 \times 10^{20}\ \text{N}$$

La Tierra atrae a la Luna con esta fuerza, y la Luna atrae a la Tierra con una fuerza de la misma intensidad y sentido opuesto.
:::

:::solved_exercise Dónde se anulan las atracciones
La masa de la Tierra es unas 81 veces la masa de la Luna. ¿En qué punto del segmento que une sus centros un objeto quedaría con fuerza gravitatoria resultante nula? Da la respuesta como fracción de la distancia $D$ entre los centros.
---resolution---
Sea $x$ la distancia del objeto al centro de la Tierra (y $D - x$ al centro de la Luna). Las dos atracciones tienen sentidos opuestos y deben tener la misma intensidad:

$$\frac{G\,(81\,m_L)\,m}{x^2} = \frac{G\,m_L\,m}{(D - x)^2} \quad\Rightarrow\quad \frac{81}{x^2} = \frac{1}{(D - x)^2}$$

Sacando la raíz cuadrada de ambos lados (las distancias son positivas):

$$\frac{9}{x} = \frac{1}{D - x} \quad\Rightarrow\quad 9D - 9x = x \quad\Rightarrow\quad x = \frac{9D}{10} = 0{,}9\,D$$

El punto está al **90% de la distancia**, mucho más cerca de la Luna, lo que tiene sentido: la Luna, con menos masa, tiene que estar más cerca para atraer con la misma fuerza.
:::

:::solved_exercise Pesando la Tierra con la órbita de la Luna
La Luna gira alrededor de la Tierra en una órbita aproximadamente circular de radio $3{,}84 \times 10^8\ \text{m}$, con un periodo de unos $27{,}3$ días. Usa $G = 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$ y estima la masa de la Tierra.
---resolution---
De la 3.ª ley de Kepler deducida por Newton:

$$\frac{T^2}{r^3} = \frac{4\pi^2}{G M} \quad\Rightarrow\quad M = \frac{4\pi^2 r^3}{G\,T^2}$$

**Periodo en segundos:** $T = 27{,}3 \times 86\,400 \approx 2{,}36 \times 10^6\ \text{s}$.

**Valores:** $r^3 = (3{,}84 \times 10^8)^3 \approx 5{,}66 \times 10^{25}\ \text{m}^3$ y $T^2 \approx 5{,}57 \times 10^{12}\ \text{s}^2$.

$$M \approx \frac{4 \times 9{,}87 \times 5{,}66 \times 10^{25}}{6{,}67 \times 10^{-11} \times 5{,}57 \times 10^{12}} \approx \frac{2{,}23 \times 10^{27}}{3{,}72 \times 10^{2}} \approx 6{,}0 \times 10^{24}\ \text{kg}$$

Muy cerca del valor aceptado, $5{,}97 \times 10^{24}\ \text{kg}$. La pequeña diferencia se debe a los redondeos y a que la órbita de la Luna no es exactamente circular.
:::

:::real_world_application Las mareas
La Luna atrae a toda la Tierra, pero no con la misma intensidad en todos los puntos: el lado de la Tierra que mira hacia la Luna está más cerca y es atraído con más fuerza que el centro, y el lado opuesto es atraído con menos fuerza. Esa **diferencia** de atracción a lo largo del planeta deforma ligeramente los océanos y forma dos "abultamientos" de agua, uno a cada lado. Con la rotación de la Tierra, la mayoría de las costas pasan por esos abultamientos y, por eso, suelen tener dos mareas altas y dos bajas al día. El Sol también produce mareas, pero su efecto es menos de la mitad del de la Luna. Cuando el Sol, la Tierra y la Luna están alineados (luna nueva y luna llena), los efectos se suman y las mareas son más intensas.
:::

:::curiosity La balanza que pesó la Tierra
En 1798, el inglés Henry Cavendish usó una balanza de torsión, diseñada antes por John Michell, para medir la minúscula atracción entre esferas de plomo en el laboratorio. Su objetivo declarado era determinar la **densidad media de la Tierra**, que encontró unas 5,5 veces la del agua, muy cerca del valor aceptado hoy. Ese resultado equivale a determinar la constante $G$, y el experimento se hizo conocido como el que "pesó la Tierra".
:::

:::text
## Resumen y errores comunes

- $F = \dfrac{G M m}{d^2}$, con $G \approx 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$ y $d$ entre los centros.
- Siempre atractiva; forma un par de acción y reacción (misma intensidad en los dos cuerpos).
- Proporcional a las masas; inversamente proporcional al cuadrado de la distancia.
- Órbita circular: $v = \sqrt{GM/r}$ y $\dfrac{T^2}{r^3} = \dfrac{4\pi^2}{GM}$.

**Errores comunes:**

- Olvidar elevar la distancia al cuadrado (duplicar la distancia divide la fuerza entre 4, no entre 2).
- Usar la altitud en lugar de la distancia al centro ($d = R + h$).
- Creer que el cuerpo de mayor masa ejerce una fuerza mayor sobre el de menor masa: las fuerzas son iguales; lo que cambia son las aceleraciones.
- Confundir $G$ (constante universal) con $g$ (aceleración de la gravedad en un lugar concreto).
:::
