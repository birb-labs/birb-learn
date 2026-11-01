---
title: Gravidade, Peso e Satélites
---

:::text
## De onde vem o g

Até aqui usamos $g \approx 9{,}8\ \text{m/s}^2$ como um número dado. Com a lei da gravitação universal, podemos **calcular** $g$.

O peso de um corpo de massa $m$ na superfície de um planeta de massa $M$ e raio $R$ é a força gravitacional que o planeta exerce sobre ele:

$$P = m\,g \qquad\text{e}\qquad P = \frac{G M m}{R^2}$$

Igualando as duas expressões, a massa $m$ do corpo se cancela:

$$g = \frac{G\,M}{R^2}$$

Conclusões importantes:

- $g$ **não depende da massa do corpo que cai**. Sem resistência do ar, uma pena e um martelo caem com a mesma aceleração.
- $g$ depende da **massa** e do **raio** do astro: é proporcional a $M$ e inversamente proporcional a $R^2$.
- $g$ tem duas interpretações equivalentes: é a **aceleração** de um corpo em queda livre (m/s²) e também a **intensidade do campo gravitacional** (força por unidade de massa, N/kg).

Para a Terra, com $M \approx 5{,}97 \times 10^{24}\ \text{kg}$ e $R \approx 6{,}37 \times 10^6\ \text{m}$:

$$g = \frac{6{,}67 \times 10^{-11} \times 5{,}97 \times 10^{24}}{(6{,}37 \times 10^6)^2} \approx 9{,}8\ \text{m/s}^2$$
:::

:::text
## A gravidade diminui com a altitude

A uma altitude $h$ acima da superfície, a distância ao centro do planeta é $R + h$:

$$g_h = \frac{G M}{(R + h)^2} \qquad\Rightarrow\qquad \frac{g_h}{g_0} = \left(\frac{R}{R + h}\right)^2$$

| Altitude | Distância ao centro | $g_h / g_0$ |
|---|---|---|
| $0$ | $R$ | $1$ |
| $R$ | $2R$ | $1/4$ |
| $2R$ | $3R$ | $1/9$ |
| $3R$ | $4R$ | $1/16$ |

Para altitudes pequenas comparadas ao raio da Terra (montanhas, aviões), a variação é pequena: no topo do Everest, a quase 9 km de altitude, $g$ é apenas cerca de 0,3% menor. Mesmo a cerca de 400 km de altitude, onde orbita a Estação Espacial Internacional (ISS), $g \approx 8{,}7\ \text{m/s}^2$, ainda perto de 90% do valor na superfície.

## A gravidade em outros astros

Cada astro tem o seu $g$, que depende de $M/R^2$. Valores aproximados na superfície (para os planetas gasosos, no nível da atmosfera onde a pressão é de 1 bar):

| Astro | $g$ aproximado (m/s²) |
|---|---|
| Lua | 1,6 |
| Marte | 3,7 |
| Vênus | 8,9 |
| Terra | 9,8 |
| Saturno | 10,4 |
| Júpiter | 24,8 |

Saturno tem cerca de 95 vezes a massa da Terra, mas seu $g$ é quase igual ao terrestre, porque o seu raio também é muito maior, e $g$ depende de $R^2$.

## Pequenas variações na Terra

Mesmo na superfície, $g$ não é exatamente o mesmo em todo lugar. Ele vale cerca de $9{,}78\ \text{m/s}^2$ no Equador e cerca de $9{,}83\ \text{m/s}^2$ nos polos, por dois motivos: a Terra é levemente achatada nos polos (o raio equatorial é maior) e a rotação da Terra reduz o peso aparente, especialmente no Equador. Também há pequenas variações causadas pela altitude e pela distribuição de rochas no subsolo.
:::

:::text
## Massa não é peso

- **Massa** ($m$, em kg) mede a quantidade de matéria e a inércia de um corpo. **Não muda** de lugar para lugar.
- **Peso** ($P = m g$, em N) é a força com que um astro atrai o corpo. **Muda** conforme o valor local de $g$.

Um astronauta de $60\ \text{kg}$ tem massa de $60\ \text{kg}$ na Terra, na Lua ou no espaço. Seu peso, porém, é de cerca de $600\ \text{N}$ na Terra e de cerca de $100\ \text{N}$ na Lua. No dia a dia dizemos "peso 60 quilos", mas fisicamente isso é a massa.

## Satélites em órbita

Um satélite em órbita circular de raio $r$ em torno de um planeta está sob uma única força relevante: a gravitação, que faz o papel de resultante centrípeta:

$$\frac{G M m}{r^2} = \frac{m v^2}{r} \quad\Rightarrow\quad v = \sqrt{\frac{G M}{r}} \qquad\text{e}\qquad T = \frac{2\pi r}{v}$$

- A velocidade orbital **não depende da massa do satélite**.
- **Quanto mais alta a órbita, menor a velocidade** e maior o período (como manda a 3ª lei de Kepler).
- Para órbitas baixas, perto de 400 km de altitude, $v \approx 7{,}7\ \text{km/s}$ (cerca de $28\,000\ \text{km/h}$) e o período é de aproximadamente 92 minutos: a ISS dá cerca de 15 a 16 voltas na Terra por dia.

## Por que os astronautas flutuam?

Um erro muito comum é dizer que "no espaço não há gravidade". Na altitude da ISS, a gravidade é cerca de 90% da superficial! Os astronautas flutuam porque a estação e todos os que estão dentro dela estão **em queda livre** ao redor da Terra: todos caem juntos, com a mesma aceleração, então nada empurra ninguém contra o "chão". A estação não bate na Terra porque se move tão rápido na horizontal que, enquanto cai, a superfície curva da Terra também "se afasta" por baixo dela. Esse estado é chamado de **imponderabilidade** (ou microgravidade), e não de ausência de gravidade.
:::

:::simulator surface-gravity {"body":"earth","personMass":60}
A gravidade em diferentes astros e altitudes
Escolha um corpo celeste, aumente a altitude e veja como g diminui com o quadrado da distância ao centro. A linha tracejada marca a altitude aproximada da ISS. Mude a massa da pessoa: o peso muda, mas g não depende dela.
:::

:::solved_exercise Calculando o g da Terra
Use $G = 6{,}67 \times 10^{-11}\ \text{N}\cdot\text{m}^2/\text{kg}^2$, $M = 5{,}97 \times 10^{24}\ \text{kg}$ e $R = 6{,}37 \times 10^6\ \text{m}$ para calcular a aceleração da gravidade na superfície da Terra.
---resolution---
$$g = \frac{G M}{R^2} = \frac{6{,}67 \times 10^{-11} \times 5{,}97 \times 10^{24}}{(6{,}37 \times 10^6)^2}$$

**Numerador:** $6{,}67 \times 5{,}97 \approx 39{,}8$, com potência $10^{-11+24} = 10^{13}$: $3{,}98 \times 10^{14}$.

**Denominador:** $6{,}37^2 \approx 40{,}6$, com potência $10^{12}$: $4{,}06 \times 10^{13}$.

$$g \approx \frac{3{,}98 \times 10^{14}}{4{,}06 \times 10^{13}} \approx 9{,}8\ \text{m/s}^2$$
:::

:::solved_exercise Gravidade a uma altitude igual ao raio
a) Qual é o valor de $g$ a uma altitude igual ao raio da Terra? Use $g_0 = 10\ \text{m/s}^2$.

b) A que altitude $g$ vale $\frac{1}{9}$ do valor na superfície?
---resolution---
**a)** A distância ao centro passa de $R$ para $2R$ (dobra), então $g$ fica 4 vezes menor:

$$g = g_0 \left(\frac{R}{2R}\right)^2 = \frac{10}{4} = 2{,}5\ \text{m/s}^2$$

**b)** Precisamos de $\left(\dfrac{R}{R + h}\right)^2 = \dfrac{1}{9}$, ou seja, $\dfrac{R}{R + h} = \dfrac{1}{3}$:

$$R + h = 3R \quad\Rightarrow\quad h = 2R$$

A altitude é igual a **dois raios terrestres** (cerca de $12\,700\ \text{km}$). Cuidado: a distância ao **centro** é $3R$, mas a **altitude** é $2R$.
:::

:::solved_exercise Um planeta imaginário
Um planeta tem o dobro da massa da Terra e o dobro do raio. Sabendo que na Terra $g = 10\ \text{m/s}^2$, quanto pesaria nesse planeta uma pessoa de $60\ \text{kg}$?
---resolution---
**Razão entre as gravidades:**

$$\frac{g_P}{g_T} = \frac{G M_P / R_P^2}{G M_T / R_T^2} = \frac{M_P}{M_T} \cdot \left(\frac{R_T}{R_P}\right)^2 = 2 \times \left(\frac{1}{2}\right)^2 = \frac{2}{4} = \frac{1}{2}$$

$$g_P = \frac{10}{2} = 5\ \text{m/s}^2 \qquad P = m\,g_P = 60 \times 5 = 300\ \text{N}$$

A massa continua $60\ \text{kg}$; o peso cai para a metade do terrestre ($600\ \text{N}$).
:::

:::solved_exercise A gravidade em Marte
A massa de Marte é cerca de $0{,}107$ vez a massa da Terra, e seu raio é cerca de $0{,}532$ vez o raio terrestre. Estime $g$ em Marte usando $g_T = 9{,}8\ \text{m/s}^2$.
---resolution---
$$\frac{g_M}{g_T} = \frac{0{,}107}{0{,}532^2} = \frac{0{,}107}{0{,}283} \approx 0{,}378$$

$$g_M \approx 0{,}378 \times 9{,}8 \approx 3{,}7\ \text{m/s}^2$$

Valor que concorda com as medidas: em Marte, um objeto pesa cerca de 38% do que pesa na Terra.
:::

:::solved_exercise A órbita da Estação Espacial
A ISS orbita a cerca de $400\ \text{km}$ de altitude. Use $GM_{\text{Terra}} \approx 4{,}0 \times 10^{14}\ \text{m}^3/\text{s}^2$ e $R \approx 6{,}4 \times 10^6\ \text{m}$ para estimar: a) $g$ nessa altitude; b) a velocidade orbital; c) o período.
---resolution---
**Raio da órbita:** $r = R + h = 6{,}4 \times 10^6 + 0{,}4 \times 10^6 = 6{,}8 \times 10^6\ \text{m}$.

**a)**

$$g = \frac{GM}{r^2} = \frac{4{,}0 \times 10^{14}}{(6{,}8 \times 10^6)^2} = \frac{4{,}0 \times 10^{14}}{4{,}62 \times 10^{13}} \approx 8{,}7\ \text{m/s}^2$$

**b)**

$$v = \sqrt{\frac{GM}{r}} = \sqrt{\frac{4{,}0 \times 10^{14}}{6{,}8 \times 10^6}} = \sqrt{5{,}9 \times 10^7} \approx 7{,}7 \times 10^3\ \text{m/s}$$

Cerca de $7{,}7\ \text{km/s}$, ou aproximadamente $28\,000\ \text{km/h}$.

**c)**

$$T = \frac{2\pi r}{v} = \frac{2 \times 3{,}14 \times 6{,}8 \times 10^6}{7{,}7 \times 10^3} \approx 5{,}5 \times 10^3\ \text{s} \approx 92\ \text{min}$$
:::

:::solved_exercise Massa e peso na Lua
Um astronauta de $60\ \text{kg}$ vai à Lua, onde $g \approx 1{,}6\ \text{m/s}^2$. Adotando $g = 10\ \text{m/s}^2$ na Terra, compare sua massa e seu peso nos dois lugares.
---resolution---
**Massa:** $60\ \text{kg}$ na Terra e $60\ \text{kg}$ na Lua (a massa não muda).

**Peso na Terra:** $P = 60 \times 10 = 600\ \text{N}$.

**Peso na Lua:** $P = 60 \times 1{,}6 = 96\ \text{N}$.

Na Lua o astronauta pesa cerca de um sexto do que pesa na Terra, por isso consegue dar saltos tão altos, mesmo usando um traje pesado.
:::

:::real_world_application Satélites de GPS
Os satélites do sistema GPS orbitam a cerca de $20\,200\ \text{km}$ de altitude, numa órbita bem mais alta que a da ISS. Pela 3ª lei de Kepler (ou por $T = 2\pi r / v$ com $v = \sqrt{GM/r}$), quanto maior o raio, maior o período: eles levam cerca de 12 horas para dar uma volta na Terra, enquanto a ISS leva cerca de 92 minutos. Os satélites geoestacionários, mais altos ainda (cerca de $36\,000\ \text{km}$ de altitude), levam um dia inteiro. A escolha da altitude é sempre uma escolha do período da órbita.
:::

:::curiosity O martelo e a pena na Lua
Em 1971, durante a missão Apollo 15, o astronauta David Scott soltou ao mesmo tempo um martelo e uma pena de falcão diante da câmera, na superfície da Lua. Sem ar para frear a pena, os dois objetos caíram juntos e tocaram o solo ao mesmo tempo, exatamente como prevê $g = GM/R^2$: a aceleração da queda não depende da massa do corpo que cai.
:::

:::text
## Resumo e erros comuns

- $g = \dfrac{G M}{R^2}$: depende da massa e do raio do astro, não da massa do corpo.
- Com altitude $h$: $g_h = \dfrac{G M}{(R + h)^2}$; dobrar a distância ao **centro** divide $g$ por 4.
- Massa (kg) não muda; peso ($P = mg$, em N) muda com o local.
- Órbita circular: $v = \sqrt{GM/r}$, independente da massa do satélite; órbitas mais altas são mais lentas.
- Astronautas em órbita flutuam porque estão em queda livre, não por falta de gravidade.

**Erros comuns:**

- Confundir altitude ($h$) com distância ao centro ($R + h$).
- Dizer que "no espaço não há gravidade".
- Dizer que um corpo mais pesado cai mais rápido (sem resistência do ar, todos caem com a mesma aceleração).
- Confundir massa com peso.
:::
