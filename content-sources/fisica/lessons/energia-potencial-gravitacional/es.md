---
title: Energía Potencial Gravitatoria
---

:::text
## La energía de estar en lo alto

Cuando levantas un objeto con rapidez constante, aplicas una fuerza igual a su peso ($m\,g$) a lo largo de una altura $h$. El trabajo que realizas es $m\,g\,h$, y esa energía no desaparece: queda **almacenada** en el sistema cuerpo–Tierra como **energía potencial gravitatoria**. Si el objeto se suelta, el peso realiza ese mismo trabajo de vuelta y esa energía se convierte en energía cinética.

$$E_{pg} = m\,g\,h$$

| Símbolo | Magnitud | Unidad en el SI |
|---|---|---|
| $E_{pg}$ | energía potencial gravitatoria | julio (J) |
| $m$ | masa | kg |
| $g$ | aceleración de la gravedad | m/s² |
| $h$ | altura respecto del nivel de referencia | m |

Cerca de la superficie de la Tierra, $g \approx 9{,}8\ \text{m/s}^2$; en muchos ejercicios se usa $g = 10\ \text{m/s}^2$ para simplificar las cuentas. **Usa siempre el valor que indique el enunciado.**
:::

:::text
## El nivel de referencia

La altura $h$ se mide a partir de un **nivel de referencia** elegido por nosotros, donde por definición $E_{pg} = 0$. Puede ser el suelo, la superficie de una mesa, el pie de una rampa... Consecuencias:

- Por encima de la referencia, $h > 0$ y $E_{pg} > 0$.
- En la referencia, $E_{pg} = 0$.
- **Por debajo** de la referencia, $h < 0$ y $E_{pg} < 0$. Una energía potencial negativa no es un error: solo significa que el cuerpo está por debajo del nivel elegido.

El valor de $E_{pg}$ cambia según la referencia, pero la **variación** $\Delta E_{pg} = m\,g\,\Delta h$ es siempre la misma. Como solo las variaciones tienen efecto físico (de ellas salen los trabajos y las rapideces), elegir la referencia es una cuestión de comodidad. Un consejo práctico: elige como referencia el **punto más bajo** del movimiento, así ninguna energía será negativa.

## Proporcionalidades

- $E_{pg}$ es proporcional a la **masa**: el doble de masa, el doble de energía.
- $E_{pg}$ es proporcional a la **altura**: el doble de altura, el doble de energía.
- $E_{pg}$ es proporcional a $g$: el mismo cuerpo, a la misma altura, tiene menos energía potencial en la Luna, donde $g \approx 1{,}6\ \text{m/s}^2$, que en la Tierra.

La gráfica de $E_{pg}$ en función de $h$ es una **recta** que pasa por el origen, con pendiente $m\,g$.
:::

:::text
## Cuerpos extensos: usa el centro de masa

Para un objeto que no es pequeño (una barra, una escalera, una persona), la altura que entra en la fórmula es la del **centro de masa**. Para un cuerpo homogéneo y simétrico, el centro de masa está en su centro geométrico. Por ejemplo, una barra uniforme de longitud $L$ tumbada en el suelo tiene el centro de masa prácticamente en el suelo; puesta de pie, el centro de masa queda a una altura $L/2$.

## Límite de validez

La fórmula $E_{pg} = m g h$ supone que $g$ es constante, lo cual es una aproximación excelente para alturas pequeñas comparadas con el radio de la Tierra (unos $6\,400\ \text{km}$). Para satélites y planetas, $g$ varía con la distancia y hay que usar la ley de gravitación universal, que estudiaremos en la sección de Gravitación.
:::

:::simulator energy-track
La energía potencial que se convierte en cinética
Suelta la bola y observa las barras: al bajar, la energía potencial disminuye y la cinética aumenta; al subir ocurre lo contrario. Cambia la altura de partida y la masa y compara la energía potencial inicial con m·g·h.
:::

:::solved_exercise Subiendo escaleras
Una persona de $50\ \text{kg}$ sube tres pisos de un edificio, y cada piso tiene $3\ \text{m}$ de altura. Usa $g = 10\ \text{m/s}^2$. ¿Cuál fue la variación de la energía potencial gravitatoria de la persona?
---resolution---
**Desnivel total:** $\Delta h = 3 \times 3 = 9\ \text{m}$.

$$\Delta E_{pg} = m\,g\,\Delta h = 50 \times 10 \times 9 = 4\,500\ \text{J}$$

**Respuesta:** la energía potencial aumentó $4\,500\ \text{J}$ (o $4{,}5\ \text{kJ}$). Este valor no depende de que la persona haya usado la escalera, una rampa o el ascensor: solo importa el desnivel.
:::

:::solved_exercise La misma lámpara, tres referencias
Una lámpara de $0{,}5\ \text{kg}$ cuelga a $2{,}5\ \text{m}$ del suelo de una sala. La mesa de la sala tiene $0{,}8\ \text{m}$ de altura y el techo está a $3\ \text{m}$ del suelo. Usa $g = 10\ \text{m/s}^2$ y calcula la energía potencial gravitatoria de la lámpara respecto: a) del suelo; b) de la superficie de la mesa; c) del techo.
---resolution---
**a) Suelo:** $h = 2{,}5\ \text{m}$

$$E_{pg} = 0{,}5 \times 10 \times 2{,}5 = 12{,}5\ \text{J}$$

**b) Mesa:** $h = 2{,}5 - 0{,}8 = 1{,}7\ \text{m}$

$$E_{pg} = 0{,}5 \times 10 \times 1{,}7 = 8{,}5\ \text{J}$$

**c) Techo:** la lámpara está $0{,}5\ \text{m}$ **por debajo** del techo, así que $h = -0{,}5\ \text{m}$

$$E_{pg} = 0{,}5 \times 10 \times (-0{,}5) = -2{,}5\ \text{J}$$

Tres valores distintos para la misma situación física. Sin embargo, si la lámpara cayera al suelo, la variación de energía potencial sería $-12{,}5\ \text{J}$ con cualquiera de las referencias (¡compruébalo!).
:::

:::solved_exercise Poner de pie una barra
Una barra homogénea de $4\ \text{m}$ de longitud y $10\ \text{kg}$ está tumbada en el suelo. ¿Cuál es el trabajo mínimo necesario para ponerla de pie, en vertical? Usa $g = 10\ \text{m/s}^2$.
---resolution---
El trabajo mínimo es igual al aumento de la energía potencial (levantándola despacio, sin ganar energía cinética). La altura relevante es la del **centro de masa**, que sube del suelo hasta la mitad de la barra:

$$\Delta h_{cm} = \frac{L}{2} = \frac{4}{2} = 2\ \text{m}$$

$$W_{\text{mín}} = \Delta E_{pg} = m\,g\,\Delta h_{cm} = 10 \times 10 \times 2 = 200\ \text{J}$$

Un error común es usar $h = 4\ \text{m}$, lo que daría 400 J: la barra entera no sube 4 m, solo su extremo.
:::

:::solved_exercise En la Tierra y en la Luna
Un astronauta levanta una caja de $10\ \text{kg}$ a $2\ \text{m}$ de altura. Compara la variación de energía potencial gravitatoria de la caja en la Tierra ($g = 10\ \text{m/s}^2$) y en la Luna ($g = 1{,}6\ \text{m/s}^2$).
---resolution---
**Tierra:** $\Delta E_{pg} = 10 \times 10 \times 2 = 200\ \text{J}$.

**Luna:** $\Delta E_{pg} = 10 \times 1{,}6 \times 2 = 32\ \text{J}$.

La masa es la misma en los dos lugares, pero como la gravedad lunar es mucho menor, levantar la caja en la Luna requiere un trabajo $\dfrac{200}{32} = 6{,}25$ veces menor.
:::

:::real_world_application El martinete
En la construcción de cimientos, un martinete levanta un martillo pesado hasta cierta altura y lo deja caer sobre un pilote. La energía potencial gravitatoria acumulada en la subida se transforma en energía cinética en la caída, y esa energía se usa para clavar el pilote en el suelo. Para clavar con más energía, la máquina puede usar un martillo más pesado o soltarlo desde más altura: en ambos casos, $m\,g\,h$ aumenta.
:::

:::curiosity ¿Cuántas escaleras vale una barra de chocolate?
Una barra de chocolate de unas $130\ \text{kcal}$ aporta aproximadamente $540\ \text{kJ}$ (cada kcal equivale a unos $4\,184\ \text{J}$). Si toda esa energía se convirtiera en energía potencial de una persona de $70\ \text{kg}$ (con $g = 10\ \text{m/s}^2$), podría subir $h = \dfrac{540\,000}{70 \times 10} \approx 770\ \text{m}$. En la práctica, el cuerpo humano convierte solo una fracción de la energía de los alimentos en trabajo mecánico (el resto se convierte sobre todo en calor), así que la altura real es mucho menor, pero aun así impresiona.
:::

:::text
## Resumen y errores comunes

- $E_{pg} = m\,g\,h$, con $h$ medida desde un nivel de referencia elegido.
- $E_{pg}$ puede ser negativa (por debajo de la referencia); las variaciones no dependen de la referencia.
- Para cuerpos extensos, usa la altura del centro de masa.
- Trabajo del peso: $W_P = -\Delta E_{pg} = m g (h_i - h_f)$.

**Errores comunes:**

- Usar la distancia recorrida (longitud de la rampa o de la escalera) en lugar del desnivel vertical.
- Olvidar convertir centímetros a metros.
- Usar la altura del extremo de un objeto en lugar de la altura de su centro de masa.
:::
