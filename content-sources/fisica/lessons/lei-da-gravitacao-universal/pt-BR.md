---
title: Lei da Gravitação Universal
---

:::text
## A mesma força no céu e na Terra

Kepler descreveu **como** os planetas se movem, mas não explicou **o que** os mantinha em órbita. A resposta veio com o inglês **Isaac Newton**, no livro *Philosophiæ Naturalis Principia Mathematica* (os *Principia*), publicado em 1687.

A grande ideia de Newton foi perceber que a força que faz uma maçã cair e a força que mantém a Lua girando em torno da Terra são **a mesma**: a **gravitação**. Uma única lei, válida para qualquer par de corpos no Universo (por isso, **universal**), explica a queda dos objetos, as marés, as órbitas dos planetas e as leis de Kepler.
:::

:::text
## O enunciado

> **Dois corpos quaisquer se atraem com forças proporcionais ao produto de suas massas e inversamente proporcionais ao quadrado da distância entre seus centros.**

$$F = \frac{G\,M\,m}{d^2}$$

| Símbolo | Grandeza | Unidade no SI |
|---|---|---|
| $F$ | intensidade da força gravitacional | N |
| $M$, $m$ | massas dos dois corpos | kg |
| $d$ | distância entre os **centros** dos corpos | m |
| $G$ | constante da gravitação universal | N·m²/kg² |

O valor de $G$, determinado experimentalmente, é:

$$G \approx 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$$

Um número extremamente pequeno. Por isso a atração gravitacional entre objetos do dia a dia (duas pessoas, duas cadeiras) é imperceptível: a gravidade só se torna importante quando pelo menos uma das massas é enorme, como a de um planeta ou de uma estrela.

**Atenção à distância:** $d$ é medida **entre os centros**. Para um objeto na superfície da Terra, $d$ é o raio da Terra, não zero. Para um satélite a uma altitude $h$, $d = R + h$.
:::

:::text
## Características da força gravitacional

**1. É sempre atrativa.** Não existe "repulsão gravitacional" entre massas.

**2. É um par ação e reação.** A Terra puxa a Lua com a mesma intensidade com que a Lua puxa a Terra, em sentidos opostos (terceira lei de Newton). As forças são iguais, mas os **efeitos** são diferentes: a mesma força produz uma aceleração muito menor na Terra, que tem massa muito maior ($a = F/m$).

**3. É proporcional a cada uma das massas.** Dobrando uma das massas, a força dobra; dobrando as duas, a força quadruplica.

**4. Varia com o inverso do quadrado da distância.** Este é o ponto mais cobrado:

| Distância | Força |
|---|---|
| $d$ | $F$ |
| $2d$ | $F/4$ |
| $3d$ | $F/9$ |
| $d/2$ | $4F$ |
| $10d$ | $F/100$ |

**5. Age a distância e não pode ser bloqueada.** Não é preciso contato, e nenhum material "isola" a gravidade.

**6. Para corpos esféricos**, Newton demonstrou que a atração é a mesma que se toda a massa estivesse concentrada no centro. Por isso usamos a distância entre os centros.
:::

:::text
## O teste da Lua

Newton testou sua ideia comparando a queda de uma maçã com o "movimento de queda" da Lua. A Lua está a cerca de 60 raios terrestres do centro da Terra. Se a força cai com o quadrado da distância, a aceleração causada pela Terra na posição da Lua deveria ser cerca de $60^2 = 3\,600$ vezes menor que $g$:

$$\frac{9{,}8}{3\,600} \approx 0{,}0027\ \text{m/s}^2$$

A aceleração centrípeta da Lua pode ser calculada pelos dados da sua órbita (raio de cerca de $3{,}84 \times 10^8\ \text{m}$ e período de cerca de $27{,}3$ dias):

$$a = \frac{4\pi^2 r}{T^2} \approx 0{,}0027\ \text{m/s}^2$$

Os dois valores concordam: a mesma força que derruba a maçã mantém a Lua em órbita.

## A 3ª lei de Kepler a partir de Newton

Para um corpo de massa $m$ em órbita circular de raio $r$ em torno de um astro de massa $M$, a força gravitacional é a resultante centrípeta:

$$\frac{G M m}{r^2} = \frac{m v^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{G M}{r}}$$

Como $v = \dfrac{2\pi r}{T}$, substituindo e reorganizando:

$$\frac{T^2}{r^3} = \frac{4\pi^2}{G M}$$

Essa é a **3ª lei de Kepler**, agora com a constante explicada: $K = \dfrac{4\pi^2}{GM}$ depende **apenas da massa do astro central**. A massa $m$ do satélite se cancela, e é por isso que a constante é a mesma para todos os corpos que orbitam o mesmo astro. De quebra, medindo $T$ e $r$ de uma órbita, podemos calcular a massa do astro central: é assim que se "pesa" o Sol e os planetas.
:::

:::simulator universal-gravitation {"preset":"earthMoon"}
Atração gravitacional
Escolha um cenário e multiplique as massas e a distância. Verifique que dobrar a distância divide a força por 4 e que dobrar uma massa dobra a força. Compare também a força entre duas pessoas com a força entre a Terra e a Lua.
:::

:::solved_exercise Duas pessoas se atraem?
Calcule a força de atração gravitacional entre duas pessoas de $70\ \text{kg}$ e $60\ \text{kg}$ separadas por $1\ \text{m}$ (trate-as como pontos). Use $G = 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$.
---resolution---
$$F = \frac{G M m}{d^2} = \frac{6{,}67 \times 10^{-11} \times 70 \times 60}{1^2} = 6{,}67 \times 10^{-11} \times 4\,200 \approx 2{,}8 \times 10^{-7}\ \text{N}$$

Uma força de menos de um milionésimo de newton: completamente imperceptível. O peso de cada pessoa (a atração da Terra) é da ordem de centenas de newtons.
:::

:::solved_exercise Mudando massas e distância
Dois corpos se atraem com força $F$. O que acontece com a força se a massa de um deles dobrar, a do outro triplicar e a distância entre eles dobrar?
---resolution---
$$F' = \frac{G\,(2M)(3m)}{(2d)^2} = \frac{6\,G M m}{4\,d^2} = \frac{6}{4}\,F = 1{,}5\,F$$

A força fica **1,5 vez** maior: as massas multiplicam a força por 6, e a distância dobrada a divide por 4.
:::

:::solved_exercise A força entre a Terra e a Lua
Com $M_{\text{Terra}} \approx 5{,}97 \times 10^{24}\ \text{kg}$, $m_{\text{Lua}} \approx 7{,}35 \times 10^{22}\ \text{kg}$ e distância média entre os centros de $3{,}84 \times 10^8\ \text{m}$, estime a força gravitacional entre a Terra e a Lua.
---resolution---
$$F = \frac{6{,}67 \times 10^{-11} \times 5{,}97 \times 10^{24} \times 7{,}35 \times 10^{22}}{(3{,}84 \times 10^8)^2}$$

**Numerador:** $6{,}67 \times 5{,}97 \times 7{,}35 \approx 292{,}7$, e as potências de 10 somam $-11 + 24 + 22 = 35$: $\approx 2{,}93 \times 10^{37}$.

**Denominador:** $3{,}84^2 \approx 14{,}75$, então $(3{,}84 \times 10^8)^2 \approx 1{,}47 \times 10^{17}$.

$$F \approx \frac{2{,}93 \times 10^{37}}{1{,}47 \times 10^{17}} \approx 2{,}0 \times 10^{20}\ \text{N}$$

A Terra puxa a Lua com essa força, e a Lua puxa a Terra com uma força de mesma intensidade e sentido oposto.
:::

:::solved_exercise Onde as atrações se cancelam
A massa da Terra é cerca de 81 vezes a massa da Lua. Em que ponto do segmento que liga seus centros um objeto ficaria com força gravitacional resultante nula? Dê a resposta como fração da distância $D$ entre os centros.
---resolution---
Seja $x$ a distância do objeto ao centro da Terra (e $D - x$ ao centro da Lua). As duas atrações têm sentidos opostos e devem ter a mesma intensidade:

$$\frac{G\,(81\,m_L)\,m}{x^2} = \frac{G\,m_L\,m}{(D - x)^2} \quad\Rightarrow\quad \frac{81}{x^2} = \frac{1}{(D - x)^2}$$

Tirando a raiz quadrada dos dois lados (distâncias são positivas):

$$\frac{9}{x} = \frac{1}{D - x} \quad\Rightarrow\quad 9D - 9x = x \quad\Rightarrow\quad x = \frac{9D}{10} = 0{,}9\,D$$

O ponto fica a **90% da distância**, bem mais perto da Lua, o que faz sentido: a Lua, menos massiva, precisa estar mais perto para puxar com a mesma força.
:::

:::solved_exercise Pesando a Terra com a órbita da Lua
A Lua gira em torno da Terra em uma órbita aproximadamente circular de raio $3{,}84 \times 10^8\ \text{m}$, com período de cerca de $27{,}3$ dias. Use $G = 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$ e estime a massa da Terra.
---resolution---
Da 3ª lei de Kepler deduzida por Newton:

$$\frac{T^2}{r^3} = \frac{4\pi^2}{G M} \quad\Rightarrow\quad M = \frac{4\pi^2 r^3}{G\,T^2}$$

**Período em segundos:** $T = 27{,}3 \times 86\,400 \approx 2{,}36 \times 10^6\ \text{s}$.

**Valores:** $r^3 = (3{,}84 \times 10^8)^3 \approx 5{,}66 \times 10^{25}\ \text{m}^3$ e $T^2 \approx 5{,}57 \times 10^{12}\ \text{s}^2$.

$$M \approx \frac{4 \times 9{,}87 \times 5{,}66 \times 10^{25}}{6{,}67 \times 10^{-11} \times 5{,}57 \times 10^{12}} \approx \frac{2{,}23 \times 10^{27}}{3{,}72 \times 10^{2}} \approx 6{,}0 \times 10^{24}\ \text{kg}$$

Bem próximo do valor aceito, $5{,}97 \times 10^{24}\ \text{kg}$. A pequena diferença vem dos arredondamentos e de a órbita da Lua não ser exatamente circular.
:::

:::real_world_application As marés
A Lua atrai a Terra inteira, mas não com a mesma intensidade em todos os pontos: o lado da Terra voltado para a Lua está mais perto e é puxado com mais força do que o centro, e o lado oposto é puxado com menos força. Essa **diferença** de atração ao longo do planeta deforma levemente os oceanos, formando dois "bojos" de água, um de cada lado. Com a rotação da Terra, a maioria dos litorais passa por esses bojos e, por isso, tem em geral duas marés altas e duas baixas por dia. O Sol também produz marés, mas o seu efeito é menor que a metade do efeito da Lua. Quando Sol, Terra e Lua estão alinhados (luas nova e cheia), os efeitos se somam e as marés ficam mais intensas.
:::

:::curiosity A balança que pesou a Terra
Em 1798, o inglês Henry Cavendish usou uma balança de torção, projetada antes por John Michell, para medir a minúscula atração entre esferas de chumbo em laboratório. Seu objetivo declarado era determinar a **densidade média da Terra**, que ele encontrou cerca de 5,5 vezes a da água, muito próxima do valor aceito hoje. Esse resultado equivale a determinar a constante $G$, e o experimento ficou conhecido como aquele que "pesou a Terra".
:::

:::text
## Resumo e erros comuns

- $F = \dfrac{G M m}{d^2}$, com $G \approx 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$ e $d$ entre os centros.
- Sempre atrativa; forma par ação e reação (mesma intensidade nos dois corpos).
- Proporcional às massas; inversamente proporcional ao quadrado da distância.
- Órbita circular: $v = \sqrt{GM/r}$ e $\dfrac{T^2}{r^3} = \dfrac{4\pi^2}{GM}$.

**Erros comuns:**

- Esquecer de elevar a distância ao quadrado (dobrar a distância divide a força por 4, não por 2).
- Usar a altitude em vez da distância ao centro ($d = R + h$).
- Achar que o corpo de maior massa exerce força maior sobre o de menor massa: as forças são iguais; as acelerações é que são diferentes.
- Confundir $G$ (constante universal) com $g$ (aceleração da gravidade em um lugar específico).
:::
