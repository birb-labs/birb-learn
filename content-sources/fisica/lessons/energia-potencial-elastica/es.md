---
title: Energía Potencial Elástica
---

:::text
## Resortes y cuerpos elásticos

Un cuerpo es **elástico** cuando, después de deformarse (estirarse, comprimirse, torcerse), recupera su forma original al soltarlo. Los resortes, las gomas elásticas, las cuerdas de los arcos y las camas elásticas son ejemplos. Mientras están deformados, estos cuerpos **almacenan energía**, que devuelven al recuperar su forma natural: es la **energía potencial elástica**.

Para estudiarla, primero necesitamos la fuerza que ejerce un resorte.

## Ley de Hooke

Un resorte tiene una **longitud natural** (sin deformación). Si lo estiramos o comprimimos una distancia $x$ (la **deformación**), reacciona con una fuerza que:

- tiene un módulo **proporcional a la deformación**;
- apunta siempre **en contra de la deformación**, intentando devolver el resorte a su longitud natural (por eso se llama **fuerza recuperadora**).

$$F_{el} = k\,x \qquad \text{(en módulo)}$$

Teniendo en cuenta el sentido, suele escribirse $F_{el} = -k\,x$: el signo negativo indica que la fuerza es opuesta a la deformación.

La constante $k$ es la **constante elástica** del resorte, medida en **N/m**. Mide la "dureza" del resorte: cuanto mayor es $k$, más fuerza hay que hacer para deformarlo. Un resorte con $k = 200\ \text{N/m}$ necesita $200\ \text{N}$ para deformarse $1\ \text{m}$, o $2\ \text{N}$ para deformarse $1\ \text{cm}$.

La ley de Hooke vale mientras el resorte está dentro de su **límite de elasticidad**. Si la deformación es demasiado grande, el resorte queda deformado permanentemente y la ley deja de valer.
:::

:::text
## La energía almacenada

La fuerza elástica es **variable**: empieza en cero (resorte relajado) y crece linealmente hasta $k\,x$. El trabajo para deformar el resorte es el **área bajo la gráfica** $F \times x$, que es un triángulo de base $x$ y altura $k\,x$:

$$W = \frac{x \cdot k\,x}{2} = \frac{k\,x^2}{2}$$

Esa es la energía que queda almacenada en el resorte deformado:

$$E_{pe} = \frac{k\,x^2}{2}$$

| Símbolo | Magnitud | Unidad en el SI |
|---|---|---|
| $E_{pe}$ | energía potencial elástica | julio (J) |
| $k$ | constante elástica | N/m |
| $x$ | deformación (respecto de la longitud natural) | m |

**Propiedades:**

- $E_{pe} \ge 0$ siempre: como $x$ aparece al cuadrado, estirar o comprimir la misma distancia almacena la misma energía.
- $E_{pe}$ es proporcional a $k$ y al **cuadrado** de la deformación: duplicar la deformación **cuadruplica** la energía.
- Aquí el "nivel de referencia" no es arbitrario: $E_{pe} = 0$ con el resorte relajado.
- La fuerza elástica es **conservativa**: $W_{el} = E_{pe,i} - E_{pe,f}$.

**Cuidado:** $x$ es la **deformación**, no la longitud del resorte. Si un resorte de 20 cm pasa a medir 25 cm, la deformación es $x = 5\ \text{cm} = 0{,}05\ \text{m}$.
:::

:::simulator spring-energy
Resorte, fuerza y energía
Cambia la constante elástica y la deformación (los valores negativos comprimen el resorte). En la gráfica, la recta es la ley de Hooke y el área del triángulo sombreado es la energía almacenada.
:::

:::solved_exercise Fuerza y energía de un resorte estirado
Un resorte de constante elástica $k = 400\ \text{N/m}$ se estira $5\ \text{cm}$. Calcula la fuerza elástica y la energía potencial elástica almacenada.
---resolution---
**Convertir:** $x = 5\ \text{cm} = 0{,}05\ \text{m}$.

**Fuerza (ley de Hooke):**

$$F = k\,x = 400 \times 0{,}05 = 20\ \text{N}$$

**Energía:**

$$E_{pe} = \frac{k x^2}{2} = \frac{400 \times 0{,}05^2}{2} = \frac{400 \times 0{,}0025}{2} = 0{,}5\ \text{J}$$
:::

:::solved_exercise Calcular la constante elástica
Un cuerpo de $2\ \text{kg}$ se cuelga de un resorte vertical, que se estira $10\ \text{cm}$ hasta que el cuerpo queda en equilibrio. Usa $g = 10\ \text{m/s}^2$. Calcula la constante elástica del resorte y la energía elástica almacenada en el equilibrio.
---resolution---
**1. Equilibrio:** la fuerza elástica equilibra el peso.

$$k\,x = m\,g \quad\Rightarrow\quad k = \frac{m g}{x} = \frac{2 \times 10}{0{,}1} = 200\ \text{N/m}$$

**2. Energía almacenada:**

$$E_{pe} = \frac{200 \times 0{,}1^2}{2} = \frac{200 \times 0{,}01}{2} = 1\ \text{J}$$
:::

:::solved_exercise Leyendo la gráfica fuerza × deformación
La gráfica de la fuerza elástica de un resorte en función de la deformación es una recta que pasa por el origen y por el punto $(0{,}15\ \text{m};\ 30\ \text{N})$. Calcula la constante elástica y la energía almacenada cuando la deformación es $0{,}15\ \text{m}$.
---resolution---
**Constante elástica** (pendiente de la recta):

$$k = \frac{F}{x} = \frac{30}{0{,}15} = 200\ \text{N/m}$$

**Energía = área del triángulo** bajo la gráfica, de $0$ a $0{,}15\ \text{m}$:

$$E_{pe} = \frac{\text{base} \times \text{altura}}{2} = \frac{0{,}15 \times 30}{2} = 2{,}25\ \text{J}$$

Comprobando con la fórmula: $\dfrac{200 \times 0{,}15^2}{2} = \dfrac{200 \times 0{,}0225}{2} = 2{,}25\ \text{J}$.
:::

:::solved_exercise Lanzador de resorte
Un juguete lanza bolitas de $0{,}1\ \text{kg}$ usando un resorte de constante $k = 800\ \text{N/m}$, comprimido $10\ \text{cm}$. Despreciando el rozamiento y suponiendo que toda la energía del resorte pasa a la bolita (lanzada en horizontal), ¿cuál es la rapidez de lanzamiento?
---resolution---
**Energía almacenada en el resorte:**

$$E_{pe} = \frac{800 \times 0{,}1^2}{2} = \frac{800 \times 0{,}01}{2} = 4\ \text{J}$$

**Toda esa energía se convierte en energía cinética de la bolita:**

$$\frac{m v^2}{2} = 4 \quad\Rightarrow\quad v^2 = \frac{2 \times 4}{0{,}1} = 80 \quad\Rightarrow\quad v = \sqrt{80} \approx 8{,}9\ \text{m/s}$$
:::

:::solved_exercise Triplicando la deformación
Un resorte almacena $0{,}2\ \text{J}$ cuando se deforma $2\ \text{cm}$. ¿Cuánta energía almacena cuando se deforma $6\ \text{cm}$?
---resolution---
La constante $k$ es la misma, y la energía es proporcional a $x^2$:

$$\frac{E_2}{E_1} = \left(\frac{x_2}{x_1}\right)^2 = \left(\frac{6}{2}\right)^2 = 9 \quad\Rightarrow\quad E_2 = 9 \times 0{,}2 = 1{,}8\ \text{J}$$

La deformación se triplicó y la energía se hizo **9 veces** mayor.
:::

:::real_world_application Del arco a la suspensión del coche
En el tiro con arco, el arquero realiza trabajo al tensar la cuerda, y esa energía queda almacenada como energía potencial elástica en el arco curvado; al soltarla, se convierte en energía cinética de la flecha. En la cama elástica, la lona estirada devuelve energía al saltador. En la suspensión de los coches, los resortes almacenan energía cuando una rueda pasa por un bache y la devuelven justo después; los amortiguadores disipan parte de esa energía para que el coche no siga rebotando.
:::

:::curiosity "Como la extensión, así la fuerza"
El inglés Robert Hooke publicó la relación entre fuerza y deformación en 1678, resumida en latín como *ut tensio, sic vis*, que significa "como la extensión, así la fuerza". Es decir: la fuerza es proporcional a la deformación. Antes de eso, había anunciado el descubrimiento en forma de anagrama (una secuencia de letras desordenada), una costumbre de la época para asegurarse la prioridad de una idea sin revelarla de inmediato.
:::

:::text
## Resumen y errores comunes

- Ley de Hooke: $F = k\,x$ (fuerza recuperadora, opuesta a la deformación).
- $E_{pe} = \dfrac{k x^2}{2}$ = área bajo la gráfica $F \times x$.
- $E_{pe} \propto x^2$: duplicar la deformación cuadruplica la energía.
- La fuerza elástica es conservativa: $W_{el} = E_{pe,i} - E_{pe,f}$.

**Errores comunes:**

- Usar la longitud total del resorte en lugar de la deformación.
- Olvidar convertir cm a m (recuerda que elevar $x$ al cuadrado amplifica el error: $5^2 = 25$, pero $0{,}05^2 = 0{,}0025$).
- Escribir $E_{pe} = k x$ (esa es la fuerza, no la energía) u olvidar el factor $\frac{1}{2}$.
:::
