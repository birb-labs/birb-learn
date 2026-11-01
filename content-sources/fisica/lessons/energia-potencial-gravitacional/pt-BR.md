---
title: Energia Potencial Gravitacional
---

:::text
## A energia de estar no alto

Quando você levanta um objeto com velocidade constante, aplica uma força igual ao peso dele ($m\,g$) ao longo de uma altura $h$. O trabalho que você realiza é $m\,g\,h$, e essa energia não some: fica **armazenada** no sistema corpo–Terra como **energia potencial gravitacional**. Se o objeto for solto, o peso realiza o mesmo trabalho de volta e essa energia vira energia cinética.

$$E_{pg} = m\,g\,h$$

| Símbolo | Grandeza | Unidade no SI |
|---|---|---|
| $E_{pg}$ | energia potencial gravitacional | joule (J) |
| $m$ | massa | kg |
| $g$ | aceleração da gravidade | m/s² |
| $h$ | altura em relação ao nível de referência | m |

Perto da superfície da Terra, $g \approx 9{,}8\ \text{m/s}^2$; em muitos exercícios se usa $g = 10\ \text{m/s}^2$ para simplificar as contas. **Sempre use o valor que o enunciado indicar.**
:::

:::text
## O nível de referência

A altura $h$ é medida a partir de um **nível de referência** escolhido por nós, onde por definição $E_{pg} = 0$. Pode ser o chão, o tampo de uma mesa, o pé de uma rampa... Consequências:

- Acima da referência, $h > 0$ e $E_{pg} > 0$.
- Na referência, $E_{pg} = 0$.
- **Abaixo** da referência, $h < 0$ e $E_{pg} < 0$. Energia potencial negativa não é um erro: significa apenas que o corpo está abaixo do nível escolhido.

O valor de $E_{pg}$ muda conforme a referência, mas a **variação** $\Delta E_{pg} = m\,g\,\Delta h$ é sempre a mesma. Como só as variações têm efeito físico (é delas que saem os trabalhos e as velocidades), a escolha da referência é uma questão de conveniência. Uma dica prática: escolha como referência o **ponto mais baixo** do movimento, assim nenhuma energia fica negativa.

## Proporcionalidades

- $E_{pg}$ é proporcional à **massa**: o dobro da massa, o dobro da energia.
- $E_{pg}$ é proporcional à **altura**: o dobro da altura, o dobro da energia.
- $E_{pg}$ é proporcional a $g$: o mesmo corpo, à mesma altura, tem menos energia potencial na Lua, onde $g \approx 1{,}6\ \text{m/s}^2$, do que na Terra.

O gráfico de $E_{pg}$ em função de $h$ é uma **reta** que passa pela origem, com inclinação $m\,g$.
:::

:::text
## Corpos extensos: use o centro de massa

Para um objeto que não é pequeno (uma barra, uma escada, uma pessoa), a altura que entra na fórmula é a do **centro de massa**. Para um corpo homogêneo e simétrico, o centro de massa fica no centro geométrico. Por exemplo, uma barra uniforme de comprimento $L$ deitada no chão tem o centro de massa praticamente no chão; colocada em pé, o centro de massa fica a $L/2$ de altura.

## Limite de validade

A fórmula $E_{pg} = m g h$ supõe que $g$ é constante, o que é uma ótima aproximação para alturas pequenas comparadas ao raio da Terra (cerca de $6\,400\ \text{km}$). Para satélites e planetas, $g$ varia com a distância e é preciso usar a lei da gravitação universal, que estudaremos na seção de Gravitação.
:::

:::simulator energy-track {"mass":1,"height":5,"g":10,"friction":false}
Energia potencial virando cinética
Solte a bola e observe as barras: na descida a energia potencial diminui e a cinética aumenta; na subida acontece o contrário. Mude a altura de soltura e a massa e compare a energia potencial inicial com m·g·h.
:::

:::solved_exercise Subindo escadas
Uma pessoa de $50\ \text{kg}$ sobe três andares de um prédio, e cada andar tem $3\ \text{m}$ de altura. Adote $g = 10\ \text{m/s}^2$. Qual foi a variação da energia potencial gravitacional da pessoa?
---resolution---
**Desnível total:** $\Delta h = 3 \times 3 = 9\ \text{m}$.

$$\Delta E_{pg} = m\,g\,\Delta h = 50 \times 10 \times 9 = 4\,500\ \text{J}$$

**Resposta:** a energia potencial aumentou $4\,500\ \text{J}$ (ou $4{,}5\ \text{kJ}$). Esse valor não depende de a pessoa ter usado a escada, uma rampa ou o elevador: só o desnível importa.
:::

:::solved_exercise A mesma lâmpada, três referências
Uma luminária de $0{,}5\ \text{kg}$ está pendurada a $2{,}5\ \text{m}$ do chão de uma sala. A mesa da sala tem $0{,}8\ \text{m}$ de altura e o teto está a $3\ \text{m}$ do chão. Adote $g = 10\ \text{m/s}^2$ e calcule a energia potencial gravitacional da luminária em relação: a) ao chão; b) ao tampo da mesa; c) ao teto.
---resolution---
**a) Chão:** $h = 2{,}5\ \text{m}$

$$E_{pg} = 0{,}5 \times 10 \times 2{,}5 = 12{,}5\ \text{J}$$

**b) Mesa:** $h = 2{,}5 - 0{,}8 = 1{,}7\ \text{m}$

$$E_{pg} = 0{,}5 \times 10 \times 1{,}7 = 8{,}5\ \text{J}$$

**c) Teto:** a luminária está $0{,}5\ \text{m}$ **abaixo** do teto, então $h = -0{,}5\ \text{m}$

$$E_{pg} = 0{,}5 \times 10 \times (-0{,}5) = -2{,}5\ \text{J}$$

Três valores diferentes para a mesma situação física. Se a luminária caísse até o chão, porém, a variação de energia potencial seria $-12{,}5\ \text{J}$ em qualquer uma das referências (confira!).
:::

:::solved_exercise Levantando uma barra
Uma barra homogênea de $4\ \text{m}$ de comprimento e $10\ \text{kg}$ está deitada no chão. Qual é o trabalho mínimo necessário para colocá-la em pé, na vertical? Adote $g = 10\ \text{m/s}^2$.
---resolution---
O trabalho mínimo é igual ao aumento da energia potencial (levantando devagar, sem ganhar energia cinética). A altura relevante é a do **centro de massa**, que sobe do chão até o meio da barra:

$$\Delta h_{cm} = \frac{L}{2} = \frac{4}{2} = 2\ \text{m}$$

$$W_{\text{mín}} = \Delta E_{pg} = m\,g\,\Delta h_{cm} = 10 \times 10 \times 2 = 200\ \text{J}$$

Um erro comum é usar $h = 4\ \text{m}$, o que daria 400 J: a barra inteira não sobe 4 m, só a ponta.
:::

:::solved_exercise Na Terra e na Lua
Um astronauta levanta uma caixa de $10\ \text{kg}$ a $2\ \text{m}$ de altura. Compare a variação de energia potencial gravitacional da caixa na Terra ($g = 10\ \text{m/s}^2$) e na Lua ($g = 1{,}6\ \text{m/s}^2$).
---resolution---
**Terra:** $\Delta E_{pg} = 10 \times 10 \times 2 = 200\ \text{J}$.

**Lua:** $\Delta E_{pg} = 10 \times 1{,}6 \times 2 = 32\ \text{J}$.

A massa é a mesma nos dois lugares, mas como a gravidade lunar é bem menor, levantar a caixa na Lua exige um trabalho $\dfrac{200}{32} = 6{,}25$ vezes menor.
:::

:::real_world_application O bate-estaca
Na construção de fundações, um bate-estaca levanta um martelo pesado até certa altura e o deixa cair sobre uma estaca. A energia potencial gravitacional acumulada na subida se transforma em energia cinética na queda, e essa energia é usada para cravar a estaca no solo. Para cravar com mais energia, a máquina pode usar um martelo mais pesado ou soltá-lo de uma altura maior: em ambos os casos, $m\,g\,h$ aumenta.
:::

:::curiosity Quanta escada vale uma barra de chocolate?
Uma barra de chocolate de cerca de $130\ \text{kcal}$ fornece aproximadamente $540\ \text{kJ}$ (cada kcal vale cerca de $4\,184\ \text{J}$). Se toda essa energia virasse energia potencial de uma pessoa de $70\ \text{kg}$ (com $g = 10\ \text{m/s}^2$), ela poderia subir $h = \dfrac{540\,000}{70 \times 10} \approx 770\ \text{m}$. Na prática, o corpo humano converte apenas uma fração da energia dos alimentos em trabalho mecânico (o resto vira principalmente calor), então a altura real é bem menor, mas ainda impressiona.
:::

:::text
## Resumo e erros comuns

- $E_{pg} = m\,g\,h$, com $h$ medida a partir de um nível de referência escolhido.
- $E_{pg}$ pode ser negativa (abaixo da referência); as variações não dependem da referência.
- Para corpos extensos, use a altura do centro de massa.
- Trabalho do peso: $W_P = -\Delta E_{pg} = m g (h_i - h_f)$.

**Erros comuns:**

- Usar a distância percorrida (comprimento de rampa ou escada) em vez do desnível vertical.
- Esquecer de converter centímetros para metros.
- Usar a altura da ponta de um objeto em vez da altura do seu centro de massa.
:::
