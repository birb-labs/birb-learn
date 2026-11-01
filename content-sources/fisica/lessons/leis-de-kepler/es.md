---
title: Leyes de Kepler
---

:::text
## Del cielo antiguo a las órbitas elípticas

Durante muchos siglos predominó el **modelo geocéntrico**: la Tierra inmóvil en el centro del Universo y los astros girando a su alrededor. La versión más elaborada de este modelo fue sistematizada por Claudio Ptolomeo en el siglo II, en una obra conocida como *Almagesto*.

En 1543, Nicolás Copérnico publicó *De revolutionibus orbium coelestium*, proponiendo el **modelo heliocéntrico**: el Sol en el centro y los planetas, incluida la Tierra, girando a su alrededor. Sin embargo, Copérnico seguía usando órbitas **circulares**, y las predicciones seguían siendo imprecisas.

El siguiente paso vino de datos mucho mejores. El astrónomo danés **Tycho Brahe** pasó décadas midiendo la posición de los planetas a simple vista (el telescopio aún no se usaba en astronomía) con una precisión sin precedentes. Su ayudante, el alemán **Johannes Kepler**, heredó esos datos y pasó años intentando explicar la órbita de Marte. Al abandonar la idea de los círculos, Kepler encontró tres leyes que describen el movimiento de los planetas:

- la **1.ª y la 2.ª leyes** se publicaron en 1609, en el libro *Astronomia Nova*;
- la **3.ª ley** se publicó en 1619, en el libro *Harmonices Mundi*.

Las leyes de Kepler son **descriptivas**: dicen **cómo** se mueven los planetas, pero no **por qué**. La explicación llegó décadas después, con la gravitación universal de Newton (próxima lección).
:::

:::text
## Un poco de geometría: la elipse

Una **elipse** es el conjunto de puntos de un plano cuya **suma de distancias a dos puntos fijos**, los **focos** ($F_1$ y $F_2$), es constante. Sus elementos principales:

- **semieje mayor** $a$: la mitad del diámetro mayor de la elipse;
- **semieje menor** $b$: la mitad del diámetro menor;
- **semidistancia focal** $c$: distancia del centro de la elipse a cada foco;
- relación entre ellos: $a^2 = b^2 + c^2$;
- **excentricidad**: $e = \dfrac{c}{a}$, con $0 \le e < 1$.

La excentricidad mide lo "achatada" que está la elipse: $e = 0$ es una circunferencia (los dos focos coinciden en el centro); cuanto más cerca de 1, más alargada es la elipse.
:::

:::text
## 1.ª ley: ley de las órbitas

> **Cada planeta describe una órbita elíptica alrededor del Sol, y el Sol ocupa uno de los focos de la elipse.**

Consecuencias:

- La distancia entre el planeta y el Sol **varía** a lo largo de la órbita.
- El punto más cercano al Sol es el **perihelio**, a una distancia $r_p = a - c = a(1 - e)$.
- El punto más alejado es el **afelio**, a una distancia $r_a = a + c = a(1 + e)$.
- Sumando: $r_p + r_a = 2a$. El semieje mayor es la **media** entre las distancias del perihelio y del afelio; por eso también se llama **radio medio** de la órbita.

Las órbitas de los planetas son elipses **poco excéntricas**, casi circulares. La de la Tierra tiene una excentricidad de unos $0{,}017$: en el perihelio (a principios de enero) la Tierra está a unos $147{,}1$ millones de km del Sol, y en el afelio (a principios de julio), a unos $152{,}1$ millones de km. Los cometas, en cambio, pueden tener órbitas muy alargadas: el cometa Halley tiene una excentricidad de aproximadamente $0{,}967$.

**Cuidado con un error clásico:** las **estaciones del año no se deben** a la variación de la distancia al Sol. Observa que la Tierra está más cerca del Sol justamente en enero, verano en el hemisferio sur e invierno en el norte. Las estaciones se deben a la **inclinación del eje de rotación** de la Tierra.

Los dibujos de los libros suelen exagerar el achatamiento de las órbitas planetarias para que se vea la forma elíptica.
:::

:::text
## 2.ª ley: ley de las áreas

> **El segmento que une el Sol con el planeta barre áreas iguales en intervalos de tiempo iguales.**

Imagina una línea imaginaria que une el Sol con el planeta. Si en un mes "pinta" cierta área cerca del perihelio, en cualquier otro mes pintará exactamente la misma área, incluso cerca del afelio. Como cerca del perihelio el planeta está más cerca del Sol, tiene que recorrer un arco **mayor** en el mismo tiempo para barrer la misma área.

Consecuencias:

- El planeta es **más rápido en el perihelio** y **más lento en el afelio**.
- Del afelio al perihelio, el movimiento es **acelerado**; del perihelio al afelio, es **retardado**.
- En el perihelio y en el afelio, la velocidad es perpendicular a la línea Sol–planeta, y se cumple la relación:

$$r_p \, v_p = r_a \, v_a \qquad\Rightarrow\qquad \frac{v_p}{v_a} = \frac{r_a}{r_p}$$

La magnitud "área barrida por unidad de tiempo" es constante y se llama **velocidad areolar**.
:::

:::text
## 3.ª ley: ley de los periodos

> **El cuadrado del periodo orbital de un planeta es proporcional al cubo del semieje mayor de su órbita.**

$$\frac{T^2}{a^3} = K \qquad (\text{constante})$$

- $T$ es el **periodo orbital** (el tiempo de una vuelta completa, el "año" del planeta).
- $a$ es el **semieje mayor** (el radio medio de la órbita; en órbitas circulares, el propio radio).
- La constante $K$ es **la misma para todos los cuerpos que orbitan el mismo astro central**. Depende de la masa del astro central, pero **no** de la masa del planeta.

Consecuencia: **cuanto más lejos del Sol, mayor es el periodo**, y crece más deprisa que la distancia. Mercurio da una vuelta en unos 88 días; Neptuno tarda unos 165 años.

**Una elección de unidades muy útil:** midiendo $T$ en **años terrestres** y $a$ en **unidades astronómicas** (1 UA ≈ 149,6 millones de km, la distancia media Tierra–Sol), la Tierra tiene $T = 1$ y $a = 1$, así que $K = 1$ y, para cualquier cuerpo que orbita el Sol:

$$T^2 = a^3$$

Para comparar dos cuerpos que orbitan el mismo astro:

$$\frac{T_1^2}{a_1^3} = \frac{T_2^2}{a_2^3}$$

Las tres leyes también valen para otros sistemas: las lunas alrededor de Júpiter, la Luna y los satélites artificiales alrededor de la Tierra. Solo cambia el valor de la constante $K$, que depende del astro central.
:::

:::simulator kepler-orbit
Órbitas de Kepler
Cambia la excentricidad y el semieje mayor e inicia la animación. Las porciones coloreadas se barren en tiempos iguales y tienen áreas iguales (2.ª ley): observa cómo el planeta acelera cerca del perihelio. El periodo sigue la 3.ª ley, T² = a³ (en años y UA).
:::

:::solved_exercise La excentricidad de la órbita de la Tierra
La Tierra está a unos $147{,}1 \times 10^6\ \text{km}$ del Sol en el perihelio y a $152{,}1 \times 10^6\ \text{km}$ en el afelio. Calcula el semieje mayor y la excentricidad de la órbita.
---resolution---
**Semieje mayor** (media entre perihelio y afelio):

$$a = \frac{r_p + r_a}{2} = \frac{147{,}1 + 152{,}1}{2} \times 10^6 = 149{,}6 \times 10^6\ \text{km}$$

**Semidistancia focal:** $c = a - r_p = (149{,}6 - 147{,}1) \times 10^6 = 2{,}5 \times 10^6\ \text{km}$.

**Excentricidad:**

$$e = \frac{c}{a} = \frac{2{,}5}{149{,}6} \approx 0{,}017$$

Un valor muy pequeño: la órbita de la Tierra es casi una circunferencia.
:::

:::solved_exercise Velocidad en el perihelio y en el afelio
Un cometa tiene su perihelio a $1\ \text{UA}$ del Sol y su afelio a $9\ \text{UA}$. ¿Cuántas veces es mayor su rapidez en el perihelio que en el afelio?
---resolution---
Por la 2.ª ley, en el perihelio y en el afelio se cumple $r_p v_p = r_a v_a$:

$$\frac{v_p}{v_a} = \frac{r_a}{r_p} = \frac{9}{1} = 9$$

El cometa es **9 veces más rápido** en el perihelio que en el afelio.
:::

:::solved_exercise Usando la 3.ª ley en el Sistema Solar
a) Un asteroide orbita el Sol con un semieje mayor de $4\ \text{UA}$. ¿Cuál es su periodo?

b) El semieje mayor de la órbita de Marte es de unas $1{,}52\ \text{UA}$. Estima la duración del año marciano.
---resolution---
Con $T$ en años y $a$ en UA, se cumple $T^2 = a^3$ para cualquier cuerpo que orbita el Sol.

**a)**

$$T^2 = 4^3 = 64 \quad\Rightarrow\quad T = 8\ \text{años}$$

**b)**

$$T^2 = 1{,}52^3 \approx 3{,}51 \quad\Rightarrow\quad T \approx \sqrt{3{,}51} \approx 1{,}87\ \text{años}$$

Eso son unos $1{,}87 \times 365 \approx 684$ días, muy cerca de la duración real del año marciano (unos 687 días). La pequeña diferencia se debe al redondeo de $a$.
:::

:::solved_exercise Dos satélites de la Tierra
Un satélite A describe una órbita circular de radio $R$ alrededor de la Tierra con periodo $T$. Un satélite B describe una órbita circular de radio $4R$. ¿Cuál es el periodo de B en función de $T$?
---resolution---
Los dos orbitan la Tierra, así que la constante de la 3.ª ley es la misma:

$$\frac{T_A^2}{R_A^3} = \frac{T_B^2}{R_B^3} \quad\Rightarrow\quad T_B^2 = T^2 \cdot \frac{(4R)^3}{R^3} = 64\,T^2 \quad\Rightarrow\quad T_B = 8\,T$$

El radio se cuadruplicó y el periodo se hizo **8 veces** mayor.
:::

:::solved_exercise La órbita del cometa Halley
El cometa Halley tiene un periodo de unos $76$ años y pasa a unas $0{,}59\ \text{UA}$ del Sol en el perihelio. Estima el semieje mayor de su órbita y la distancia del afelio.
---resolution---
**Semieje mayor** por la 3.ª ley ($T$ en años, $a$ en UA):

$$a^3 = T^2 = 76^2 = 5\,776 \quad\Rightarrow\quad a = \sqrt[3]{5\,776} \approx 17{,}9\ \text{UA}$$

**Afelio**, usando $r_p + r_a = 2a$:

$$r_a = 2a - r_p \approx 2 \times 17{,}9 - 0{,}59 \approx 35{,}2\ \text{UA}$$

Eso está más lejos que la órbita de Neptuno (unas 30 UA). Por eso el Halley pasa décadas lejos y solo es visible desde la Tierra cerca del perihelio.
:::

:::solved_exercise Áreas y tiempos
Un planeta tarda 20 días en barrer un área $A$ cerca del perihelio. ¿Cuánto tarda en barrer un área $3A$ cerca del afelio?
---resolution---
Por la 2.ª ley, el área barrida es proporcional al tiempo en **cualquier** parte de la órbita (la velocidad areolar es constante):

$$\frac{A}{20\ \text{días}} = \frac{3A}{t} \quad\Rightarrow\quad t = 60\ \text{días}$$

La posición en la órbita (perihelio o afelio) no cambia la relación entre área y tiempo.
:::

:::real_world_application Satélites geoestacionarios
La 3.ª ley vale para los satélites artificiales que orbitan la Tierra. Un satélite **geoestacionario** debe dar una vuelta en exactamente un día sidéreo (unas 23 h 56 min, el tiempo de una rotación de la Tierra), girando en el plano del ecuador y en el mismo sentido que la rotación. Así permanece fijo respecto del suelo, y una antena apuntada hacia él no necesita moverse. Ese periodo fijo determina el radio de la órbita: unos $42\,000\ \text{km}$ desde el centro de la Tierra, es decir, una altitud de aproximadamente $36\,000\ \text{km}$. Los satélites de televisión y de comunicaciones usan esta órbita.
:::

:::curiosity Ocho minutos de arco
Kepler llegó a construir un modelo con una órbita circular para Marte que concordaba muy bien con los datos de Tycho, pero que, en algunas posiciones, fallaba por unos 8 minutos de arco (algo más de un octavo de grado). Para la mayoría de los astrónomos de la época, la diferencia habría sido despreciable. Kepler, sin embargo, confiaba en la precisión de las medidas de Tycho y decidió que ese pequeño error no podía ignorarse. Fue al abandonar el círculo cuando llegó a la elipse.
:::

:::text
## Resumen y errores comunes

- **1.ª ley (órbitas):** órbitas elípticas con el Sol en uno de los focos. $r_p = a - c$, $r_a = a + c$, $e = c/a$.
- **2.ª ley (áreas):** áreas iguales en tiempos iguales; más rápido en el perihelio. $r_p v_p = r_a v_a$.
- **3.ª ley (periodos):** $T^2/a^3 = K$, igual para todos los cuerpos del mismo astro central. En el Sistema Solar, con años y UA: $T^2 = a^3$.

**Errores comunes:**

- Creer que el Sol está en el **centro** de la elipse: está en un **foco**.
- Creer que la rapidez del planeta es constante.
- Aplicar la misma constante $K$ a cuerpos que orbitan astros distintos (por ejemplo, la Luna y Marte).
- Explicar las estaciones del año por la distancia al Sol.
- Creer que la constante $K$ depende de la masa del planeta.
:::
