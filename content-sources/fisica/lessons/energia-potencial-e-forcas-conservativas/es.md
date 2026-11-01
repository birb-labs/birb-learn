---
title: Energía Potencial y Fuerzas Conservativas
---

:::text
## Energía almacenada

Piensa en un libro en el estante más alto de una librería. Está quieto, así que no tiene energía cinética. Pero, si se cae, ganará rapidez: había alguna energía **almacenada** en él por estar en lo alto. Lo mismo ocurre con:

- un arco tensado, listo para lanzar una flecha;
- un resorte comprimido dentro de un bolígrafo;
- el agua acumulada en el embalse de una central hidroeléctrica.

Esa energía almacenada, que depende de la **posición** de un cuerpo o de la **configuración** de un sistema (y no de su movimiento), se llama **energía potencial** ($E_p$). El nombre viene justamente de la idea de *potencial*: es energía que **puede** convertirse en movimiento (o en otra forma) cuando el cuerpo se libera.

La energía potencial siempre está asociada a una **fuerza** y a una **interacción**:

| Fuerza | Energía potencial asociada | Expresión |
|---|---|---|
| Peso (atracción gravitatoria cerca de la Tierra) | gravitatoria | $E_{pg} = m\,g\,h$ |
| Fuerza elástica de un resorte ideal | elástica | $E_{pe} = \dfrac{k\,x^2}{2}$ |

En las próximas lecciones estudiaremos cada una en detalle. Antes, necesitamos entender **qué fuerzas** permiten definir una energía potencial.
:::

:::text
## Fuerzas conservativas

Una fuerza es **conservativa** cuando el trabajo que realiza entre dos puntos **depende solo de las posiciones inicial y final**, y **no del camino recorrido**.

Una forma equivalente de decirlo: **el trabajo de una fuerza conservativa a lo largo de un camino cerrado** (que empieza y termina en el mismo punto) **es nulo**.

**Ejemplos de fuerzas conservativas:**

- el **peso** (fuerza gravitatoria);
- la **fuerza elástica** de un resorte ideal;
- la fuerza eléctrica entre cargas en reposo.

**Ejemplos de fuerzas no conservativas (disipativas):**

- el **rozamiento cinético**;
- la **resistencia del aire**;
- las fuerzas musculares y de motores, que dependen de cómo actúa el agente a lo largo del camino.

¿Por qué el rozamiento no es conservativo? Arrastra una caja 3 m hacia delante y luego 3 m de vuelta: el rozamiento se opuso al movimiento **en los dos viajes**, así que realizó trabajo negativo en ambos. En el camino cerrado, el total es **negativo**, no cero. Y cuanto más largo el camino, mayor el trabajo del rozamiento: depende de la trayectoria.

Solo tiene sentido hablar de **energía potencial para fuerzas conservativas**: como su trabajo solo depende de las posiciones, podemos asociar a cada posición una "reserva" de energía.
:::

:::text
## El trabajo del peso no depende del camino

Imagina llevar una caja de masa $m$ desde el suelo hasta una altura $h$ por tres caminos distintos: subiendo en vertical, por una rampa o por una escalera.

- En vertical, el peso apunta hacia abajo y el desplazamiento hacia arriba: $W_P = -m\,g\,h$.
- En la rampa, el camino es más largo, pero solo la componente del peso a lo largo de la rampa realiza trabajo, y el resultado es el mismo: $W_P = -m\,g\,h$.
- En la escalera, los tramos horizontales no contribuyen (peso perpendicular al desplazamiento), y los tramos verticales suman la altura total $h$: de nuevo $W_P = -m\,g\,h$.

En general, si un cuerpo va de una altura $h_i$ a una altura $h_f$:

$$W_P = m\,g\,(h_i - h_f)$$

**Bajando** ($h_i > h_f$), el trabajo del peso es **positivo**; **subiendo**, es **negativo**. El camino no importa.
:::

:::text
## Teorema de la energía potencial

Para cualquier fuerza conservativa, el trabajo que realiza es igual a **menos la variación de la energía potencial** asociada:

$$W_{\text{conservativa}} = -\Delta E_p = E_{p,\text{inicial}} - E_{p,\text{final}}$$

Lectura física:

- Cuando la fuerza conservativa realiza **trabajo positivo** (un cuerpo que cae, un resorte que vuelve a su longitud natural), la energía potencial **disminuye**: se está convirtiendo en otra forma (normalmente cinética).
- Cuando la fuerza conservativa realiza **trabajo negativo** (un cuerpo que se levanta, un resorte que se comprime), la energía potencial **aumenta**: se está almacenando energía.

Para el peso, el teorema queda:

$$W_P = m g h_i - m g h_f = m\,g\,(h_i - h_f)$$

exactamente el resultado que obtuvimos arriba.

**Importante:** el valor de la energía potencial depende de dónde elijamos el **nivel de referencia** (donde $E_p = 0$), pero la **variación** $\Delta E_p$, que es lo que aparece en el teorema, **no depende** de esa elección. Por eso podemos elegir la referencia que haga más sencillos los cálculos.
:::

:::solved_exercise El mismo trabajo por tres caminos
Una caja de $2\ \text{kg}$ baja desde una plataforma de $5\ \text{m}$ de altura hasta el suelo de tres formas: (I) cayendo en vertical, (II) deslizándose por una rampa de $10\ \text{m}$ de longitud y (III) siendo bajada por una escalera. Usa $g = 10\ \text{m/s}^2$. Calcula el trabajo del peso en cada caso.
---resolution---
El peso es una fuerza conservativa: su trabajo solo depende de las alturas inicial y final.

$$W_P = m\,g\,(h_i - h_f) = 2 \times 10 \times (5 - 0) = 100\ \text{J}$$

**Respuesta:** $W_P = 100\ \text{J}$ en **los tres** casos. La longitud de la rampa (10 m) no interviene en el trabajo del peso. Sería importante para calcular el trabajo de un posible **rozamiento**, que depende del camino.
:::

:::solved_exercise Camino cerrado: peso frente a rozamiento
a) Un libro de $1\ \text{kg}$ se levanta $2\ \text{m}$ y luego se baja de vuelta a la posición inicial. Calcula el trabajo total del peso ($g = 10\ \text{m/s}^2$).

b) Una caja se arrastra $3\ \text{m}$ hacia delante y $3\ \text{m}$ de vuelta sobre un piso, con una fuerza de rozamiento constante de $5\ \text{N}$. Calcula el trabajo total del rozamiento.
---resolution---
**a)** Subida: $W_1 = -m g h = -1 \times 10 \times 2 = -20\ \text{J}$. Bajada: $W_2 = +m g h = +20\ \text{J}$.

$$W_{\text{total}} = -20 + 20 = 0$$

Camino cerrado, trabajo nulo: el peso es **conservativo**.

**b)** El rozamiento siempre se opone al movimiento, en los dos viajes: $W_1 = -5 \times 3 = -15\ \text{J}$ y $W_2 = -5 \times 3 = -15\ \text{J}$.

$$W_{\text{total}} = -15 - 15 = -30\ \text{J} \ne 0$$

Camino cerrado, trabajo distinto de cero: el rozamiento es **no conservativo** (disipativo).
:::

:::solved_exercise Aplicando el teorema de la energía potencial
Una pelota de $0{,}5\ \text{kg}$ cae desde una altura de $8\ \text{m}$ hasta una altura de $3\ \text{m}$ respecto del suelo. Usa $g = 10\ \text{m/s}^2$ y el suelo como nivel de referencia.

a) ¿Cuáles son las energías potenciales gravitatorias inicial y final?

b) ¿Cuál es el trabajo del peso en ese tramo?
---resolution---
**a)** $E_{p,i} = m g h_i = 0{,}5 \times 10 \times 8 = 40\ \text{J}$ y $E_{p,f} = m g h_f = 0{,}5 \times 10 \times 3 = 15\ \text{J}$.

**b)** Por el teorema de la energía potencial:

$$W_P = E_{p,i} - E_{p,f} = 40 - 15 = 25\ \text{J}$$

El trabajo es positivo (la pelota bajó) y la energía potencial **disminuyó** 25 J: $\Delta E_p = -25\ \text{J}$.

**Comprobación con otra referencia:** si el nivel cero estuviera a 3 m de altura, tendríamos $E_{p,i} = 0{,}5 \times 10 \times 5 = 25\ \text{J}$ y $E_{p,f} = 0$, y el trabajo seguiría siendo $25 - 0 = 25\ \text{J}$. La variación no depende de la referencia.
:::

:::solved_exercise Trabajo de la fuerza elástica
Un resorte ideal de constante elástica $k = 100\ \text{N/m}$ está comprimido $0{,}2\ \text{m}$ y se suelta hasta volver a su longitud natural. ¿Cuál es el trabajo realizado por la fuerza elástica?
---resolution---
La fuerza elástica es conservativa, así que vale el teorema de la energía potencial con $E_{pe} = \dfrac{k x^2}{2}$:

$$E_{p,i} = \frac{100 \times 0{,}2^2}{2} = \frac{100 \times 0{,}04}{2} = 2\ \text{J} \qquad E_{p,f} = 0 \ (\text{resorte sin deformar})$$

$$W_{el} = E_{p,i} - E_{p,f} = 2 - 0 = 2\ \text{J}$$

El trabajo es positivo: el resorte "devolvió" la energía que tenía almacenada.
:::

:::real_world_application Centrales hidroeléctricas
Una central hidroeléctrica es una gran máquina para convertir energía potencial gravitatoria. La presa mantiene el agua a un nivel alto. Cuando el agua baja por los conductos, el peso realiza trabajo positivo y la energía potencial disminuye, convirtiéndose en energía cinética del agua, que hace girar las turbinas. Los generadores conectados a las turbinas convierten esa energía en energía eléctrica. Cuanto mayor es la altura del salto y el caudal de agua, más energía hay disponible.
:::

:::curiosity Quién bautizó la energía potencial
La expresión "energía potencial" fue introducida en 1853 por el ingeniero y físico escocés William Rankine, en una época en que los científicos estaban organizando la idea de que las distintas formas de energía se convierten unas en otras sin que el total cambie. El adjetivo "potencial" destaca que esa energía está guardada, a la espera de ser usada.
:::

:::text
## Resumen y errores comunes

- Energía potencial: energía almacenada que depende de la posición o de la configuración.
- Fuerza conservativa: el trabajo no depende del camino; en un camino cerrado, el trabajo es nulo. Ejemplos: peso y fuerza elástica.
- Las fuerzas disipativas (rozamiento, resistencia del aire) dependen del camino y no tienen energía potencial asociada.
- **Teorema de la energía potencial:** $W_{\text{conservativa}} = -\Delta E_p = E_{p,i} - E_{p,f}$.
- Trabajo del peso: $W_P = m g (h_i - h_f)$, positivo al bajar, negativo al subir.

**Errores comunes:**

- Calcular el trabajo del peso usando la longitud de la rampa en lugar del desnivel.
- Equivocarse de signo: recuerda que $W = E_{p,i} - E_{p,f}$ (inicial **menos** final).
- Creer que el valor de la energía potencial es absoluto: depende de la referencia; solo las variaciones tienen significado físico.
:::
