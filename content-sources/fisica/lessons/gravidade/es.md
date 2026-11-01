---
title: Gravedad, Peso y Satélites
---

:::text
## De dónde sale g

Hasta ahora hemos usado $g \approx 9{,}8\ \text{m/s}^2$ como un dato. Con la ley de gravitación universal podemos **calcular** $g$.

El peso de un cuerpo de masa $m$ en la superficie de un planeta de masa $M$ y radio $R$ es la fuerza gravitatoria que el planeta ejerce sobre él:

$$P = m\,g \qquad\text{y}\qquad P = \frac{G M m}{R^2}$$

Igualando las dos expresiones, la masa $m$ del cuerpo se cancela:

$$g = \frac{G\,M}{R^2}$$

Conclusiones importantes:

- $g$ **no depende de la masa del cuerpo que cae**. Sin resistencia del aire, una pluma y un martillo caen con la misma aceleración.
- $g$ depende de la **masa** y del **radio** del astro: es proporcional a $M$ e inversamente proporcional a $R^2$.
- $g$ tiene dos interpretaciones equivalentes: es la **aceleración** de un cuerpo en caída libre (m/s²) y también la **intensidad del campo gravitatorio** (fuerza por unidad de masa, N/kg).

Para la Tierra, con $M \approx 5{,}97 \times 10^{24}\ \text{kg}$ y $R \approx 6{,}37 \times 10^6\ \text{m}$:

$$g = \frac{6{,}67 \times 10^{-11} \times 5{,}97 \times 10^{24}}{(6{,}37 \times 10^6)^2} \approx 9{,}8\ \text{m/s}^2$$
:::

:::text
## La gravedad disminuye con la altitud

A una altitud $h$ sobre la superficie, la distancia al centro del planeta es $R + h$:

$$g_h = \frac{G M}{(R + h)^2} \qquad\Rightarrow\qquad \frac{g_h}{g_0} = \left(\frac{R}{R + h}\right)^2$$

| Altitud | Distancia al centro | $g_h / g_0$ |
|---|---|---|
| $0$ | $R$ | $1$ |
| $R$ | $2R$ | $1/4$ |
| $2R$ | $3R$ | $1/9$ |
| $3R$ | $4R$ | $1/16$ |

Para altitudes pequeñas comparadas con el radio de la Tierra (montañas, aviones), la variación es pequeña: en la cima del Everest, a casi 9 km de altitud, $g$ es solo un 0,3% menor aproximadamente. Incluso a unos 400 km de altitud, donde orbita la Estación Espacial Internacional (EEI), $g \approx 8{,}7\ \text{m/s}^2$, todavía cerca del 90% del valor en la superficie.

## La gravedad en otros astros

Cada astro tiene su propio $g$, que depende de $M/R^2$. Valores aproximados en la superficie (para los planetas gaseosos, en el nivel de la atmósfera donde la presión es de 1 bar):

| Astro | $g$ aproximado (m/s²) |
|---|---|
| Luna | 1,6 |
| Marte | 3,7 |
| Venus | 8,9 |
| Tierra | 9,8 |
| Saturno | 10,4 |
| Júpiter | 24,8 |

Saturno tiene unas 95 veces la masa de la Tierra, pero su $g$ es casi igual al terrestre, porque su radio también es mucho mayor, y $g$ depende de $R^2$.

## Pequeñas variaciones en la Tierra

Incluso en la superficie, $g$ no es exactamente igual en todas partes. Vale unos $9{,}78\ \text{m/s}^2$ en el ecuador y unos $9{,}83\ \text{m/s}^2$ en los polos, por dos motivos: la Tierra está ligeramente achatada en los polos (el radio ecuatorial es mayor) y la rotación de la Tierra reduce el peso aparente, sobre todo en el ecuador. También hay pequeñas variaciones causadas por la altitud y por la distribución de las rocas del subsuelo.
:::

:::text
## La masa no es el peso

- La **masa** ($m$, en kg) mide la cantidad de materia y la inercia de un cuerpo. **No cambia** de un lugar a otro.
- El **peso** ($P = m g$, en N) es la fuerza con la que un astro atrae al cuerpo. **Cambia** según el valor local de $g$.

Un astronauta de $60\ \text{kg}$ tiene una masa de $60\ \text{kg}$ en la Tierra, en la Luna o en el espacio. Su peso, en cambio, es de unos $600\ \text{N}$ en la Tierra y de unos $100\ \text{N}$ en la Luna. En el día a día decimos "peso 60 kilos", pero físicamente eso es la masa.

## Satélites en órbita

Un satélite en órbita circular de radio $r$ alrededor de un planeta está sometido a una única fuerza relevante: la gravitación, que hace de resultante centrípeta:

$$\frac{G M m}{r^2} = \frac{m v^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{G M}{r}} \qquad\text{y}\qquad T = \frac{2\pi r}{v}$$

- La rapidez orbital **no depende de la masa del satélite**.
- **Cuanto más alta la órbita, menor la rapidez** y mayor el periodo (como dice la 3.ª ley de Kepler).
- Para órbitas bajas, a unos 400 km de altitud, $v \approx 7{,}7\ \text{km/s}$ (unos $28\,000\ \text{km/h}$) y el periodo es de aproximadamente 92 minutos: la EEI da unas 15 a 16 vueltas a la Tierra al día.

## ¿Por qué flotan los astronautas?

Un error muy común es decir que "en el espacio no hay gravedad". ¡A la altitud de la EEI, la gravedad es cerca del 90% de la de la superficie! Los astronautas flotan porque la estación y todos los que están dentro de ella están **en caída libre** alrededor de la Tierra: todos caen juntos, con la misma aceleración, así que nada empuja a nadie contra el "suelo". La estación no choca con la Tierra porque se mueve tan rápido en horizontal que, mientras cae, la superficie curva de la Tierra también "se aleja" por debajo de ella. Este estado se llama **ingravidez** (o microgravedad), y no ausencia de gravedad.
:::

:::simulator surface-gravity
La gravedad en distintos astros y altitudes
Elige un cuerpo celeste, aumenta la altitud y observa cómo g disminuye con el cuadrado de la distancia al centro. La línea discontinua marca la altitud aproximada de la EEI. Cambia la masa de la persona: el peso cambia, pero g no depende de ella.
:::

:::solved_exercise Calculando la g de la Tierra
Usa $G = 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$, $M = 5{,}97 \times 10^{24}\ \text{kg}$ y $R = 6{,}37 \times 10^6\ \text{m}$ para calcular la aceleración de la gravedad en la superficie de la Tierra.
---resolution---
$$g = \frac{G M}{R^2} = \frac{6{,}67 \times 10^{-11} \times 5{,}97 \times 10^{24}}{(6{,}37 \times 10^6)^2}$$

**Numerador:** $6{,}67 \times 5{,}97 \approx 39{,}8$, con potencia $10^{-11+24} = 10^{13}$: $3{,}98 \times 10^{14}$.

**Denominador:** $6{,}37^2 \approx 40{,}6$, con potencia $10^{12}$: $4{,}06 \times 10^{13}$.

$$g \approx \frac{3{,}98 \times 10^{14}}{4{,}06 \times 10^{13}} \approx 9{,}8\ \text{m/s}^2$$
:::

:::solved_exercise Gravedad a una altitud igual al radio
a) ¿Cuál es el valor de $g$ a una altitud igual al radio de la Tierra? Usa $g_0 = 10\ \text{m/s}^2$.

b) ¿A qué altitud $g$ vale $\frac{1}{9}$ de su valor en la superficie?
---resolution---
**a)** La distancia al centro pasa de $R$ a $2R$ (se duplica), así que $g$ se hace 4 veces menor:

$$g = g_0 \left(\frac{R}{2R}\right)^2 = \frac{10}{4} = 2{,}5\ \text{m/s}^2$$

**b)** Necesitamos $\left(\dfrac{R}{R + h}\right)^2 = \dfrac{1}{9}$, es decir, $\dfrac{R}{R + h} = \dfrac{1}{3}$:

$$R + h = 3R \quad\Rightarrow\quad h = 2R$$

La altitud es igual a **dos radios terrestres** (unos $12\,700\ \text{km}$). Cuidado: la distancia al **centro** es $3R$, pero la **altitud** es $2R$.
:::

:::solved_exercise Un planeta imaginario
Un planeta tiene el doble de la masa de la Tierra y el doble del radio. Sabiendo que en la Tierra $g = 10\ \text{m/s}^2$, ¿cuánto pesaría en ese planeta una persona de $60\ \text{kg}$?
---resolution---
**Razón entre las gravedades:**

$$\frac{g_P}{g_T} = \frac{G M_P / R_P^2}{G M_T / R_T^2} = \frac{M_P}{M_T} \cdot \left(\frac{R_T}{R_P}\right)^2 = 2 \times \left(\frac{1}{2}\right)^2 = \frac{2}{4} = \frac{1}{2}$$

$$g_P = \frac{10}{2} = 5\ \text{m/s}^2 \qquad P = m\,g_P = 60 \times 5 = 300\ \text{N}$$

La masa sigue siendo $60\ \text{kg}$; el peso se reduce a la mitad del terrestre ($600\ \text{N}$).
:::

:::solved_exercise La gravedad en Marte
La masa de Marte es unas $0{,}107$ veces la masa de la Tierra, y su radio es unas $0{,}532$ veces el radio terrestre. Estima $g$ en Marte usando $g_T = 9{,}8\ \text{m/s}^2$.
---resolution---
$$\frac{g_M}{g_T} = \frac{0{,}107}{0{,}532^2} = \frac{0{,}107}{0{,}283} \approx 0{,}378$$

$$g_M \approx 0{,}378 \times 9{,}8 \approx 3{,}7\ \text{m/s}^2$$

Un valor que concuerda con las mediciones: en Marte, un objeto pesa alrededor del 38% de lo que pesa en la Tierra.
:::

:::solved_exercise La órbita de la Estación Espacial
La EEI orbita a unos $400\ \text{km}$ de altitud. Usa $GM_{\text{Tierra}} \approx 4{,}0 \times 10^{14}\ \text{m}^3/\text{s}^2$ y $R \approx 6{,}4 \times 10^6\ \text{m}$ para estimar: a) $g$ a esa altitud; b) la rapidez orbital; c) el periodo.
---resolution---
**Radio de la órbita:** $r = R + h = 6{,}4 \times 10^6 + 0{,}4 \times 10^6 = 6{,}8 \times 10^6\ \text{m}$.

**a)**

$$g = \frac{GM}{r^2} = \frac{4{,}0 \times 10^{14}}{(6{,}8 \times 10^6)^2} = \frac{4{,}0 \times 10^{14}}{4{,}62 \times 10^{13}} \approx 8{,}7\ \text{m/s}^2$$

**b)**

$$v = \sqrt{\frac{GM}{r}} = \sqrt{\frac{4{,}0 \times 10^{14}}{6{,}8 \times 10^6}} = \sqrt{5{,}9 \times 10^7} \approx 7{,}7 \times 10^3\ \text{m/s}$$

Unos $7{,}7\ \text{km/s}$, o aproximadamente $28\,000\ \text{km/h}$.

**c)**

$$T = \frac{2\pi r}{v} = \frac{2 \times 3{,}14 \times 6{,}8 \times 10^6}{7{,}7 \times 10^3} \approx 5{,}5 \times 10^3\ \text{s} \approx 92\ \text{min}$$
:::

:::solved_exercise Masa y peso en la Luna
Un astronauta de $60\ \text{kg}$ va a la Luna, donde $g \approx 1{,}6\ \text{m/s}^2$. Usando $g = 10\ \text{m/s}^2$ en la Tierra, compara su masa y su peso en los dos lugares.
---resolution---
**Masa:** $60\ \text{kg}$ en la Tierra y $60\ \text{kg}$ en la Luna (la masa no cambia).

**Peso en la Tierra:** $P = 60 \times 10 = 600\ \text{N}$.

**Peso en la Luna:** $P = 60 \times 1{,}6 = 96\ \text{N}$.

En la Luna el astronauta pesa alrededor de una sexta parte de lo que pesa en la Tierra; por eso puede dar saltos tan altos, incluso con un traje pesado.
:::

:::real_world_application Satélites de GPS
Los satélites del sistema GPS orbitan a unos $20\,200\ \text{km}$ de altitud, en una órbita mucho más alta que la de la EEI. Por la 3.ª ley de Kepler (o por $T = 2\pi r / v$ con $v = \sqrt{GM/r}$), cuanto mayor es el radio, mayor es el periodo: tardan unas 12 horas en dar una vuelta a la Tierra, mientras que la EEI tarda unos 92 minutos. Los satélites geoestacionarios, todavía más altos (unos $36\,000\ \text{km}$ de altitud), tardan un día entero. Elegir la altitud es siempre elegir el periodo de la órbita.
:::

:::curiosity El martillo y la pluma en la Luna
En 1971, durante la misión Apolo 15, el astronauta David Scott soltó al mismo tiempo un martillo y una pluma de halcón delante de la cámara, en la superficie de la Luna. Sin aire que frenara la pluma, los dos objetos cayeron juntos y tocaron el suelo al mismo tiempo, tal como predice $g = GM/R^2$: la aceleración de la caída no depende de la masa del cuerpo que cae.
:::

:::text
## Resumen y errores comunes

- $g = \dfrac{G M}{R^2}$: depende de la masa y del radio del astro, no de la masa del cuerpo.
- A una altitud $h$: $g_h = \dfrac{G M}{(R + h)^2}$; duplicar la distancia al **centro** divide $g$ entre 4.
- La masa (kg) no cambia; el peso ($P = mg$, en N) cambia según el lugar.
- Órbita circular: $v = \sqrt{GM/r}$, independiente de la masa del satélite; las órbitas más altas son más lentas.
- Los astronautas en órbita flotan porque están en caída libre, no por falta de gravedad.

**Errores comunes:**

- Confundir la altitud ($h$) con la distancia al centro ($R + h$).
- Decir que "en el espacio no hay gravedad".
- Decir que un cuerpo más pesado cae más deprisa (sin resistencia del aire, todos caen con la misma aceleración).
- Confundir masa con peso.
:::
