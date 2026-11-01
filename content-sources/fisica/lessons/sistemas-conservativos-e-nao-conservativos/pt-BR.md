---
title: Sistemas Conservativos e Não Conservativos
---

:::text
## Dois tipos de sistema

Na lição anterior vimos o teorema da energia mecânica:

$$W_{\text{não conservativas}} = \Delta E_m$$

Ele divide os sistemas mecânicos em dois grupos:

**Sistema conservativo:** apenas forças conservativas (peso, força elástica) realizam trabalho. As forças não conservativas não existem ou não realizam trabalho (como a normal perpendicular ao movimento). A energia mecânica é **constante**:

$$E_{m,i} = E_{m,f}$$

Exemplos idealizados: queda livre sem resistência do ar, pêndulo sem atrito, bloco em rampa lisa, sistema massa–mola sem atrito.

**Sistema não conservativo:** alguma força não conservativa realiza trabalho, e a energia mecânica **varia**:

$$E_{m,f} = E_{m,i} + W_{\text{não cons}}$$

Há dois casos:

- **Sistema dissipativo:** forças como o atrito e a resistência do ar realizam trabalho **negativo**, e a energia mecânica **diminui**. É o caso mais comum no mundo real.
- **Sistema que recebe energia:** um motor, uma pessoa ou outro agente externo realiza trabalho **positivo**, e a energia mecânica **aumenta**. Por exemplo, um elevador subindo, puxado pelo motor.
:::

:::text
## Para onde vai a energia "perdida"?

Quando o atrito freia um bloco, a energia mecânica diminui, mas **a energia total não desaparece**. O princípio geral da conservação da energia continua valendo: a energia mecânica é convertida em outras formas, principalmente:

- **energia térmica** (as superfícies esquentam: esfregue as mãos e sinta);
- **energia sonora** (o chiado de uma freada);
- energia gasta em **deformações permanentes** (a lataria amassada numa batida).

Chamamos de **energia dissipada** a parte da energia mecânica que foi convertida nessas outras formas:

$$E_{\text{dissipada}} = E_{m,i} - E_{m,f} = |W_{\text{atrito}}|$$

Ou seja, num sistema em que só o atrito (e outras forças dissipativas) atua além das forças conservativas:

$$E_{m,i} = E_{m,f} + E_{\text{dissipada}}$$

Essa forma de escrever é muito prática para resolver exercícios: **a energia que havia no início é igual à que sobrou mais a que foi dissipada**.

## Trabalho do atrito em planos inclinados

Num plano inclinado de ângulo $\theta$, a normal vale $N = m g \cos\theta$, e o atrito cinético vale $f = \mu\,m\,g\cos\theta$. Ao longo de um comprimento $L$ da rampa:

$$W_{at} = -\mu\,m\,g\cos\theta\,L$$

Atenção: o atrito depende da **distância percorrida** ao longo da superfície, não do desnível.
:::

:::text
## Casos especiais que caem em prova

**Velocidade terminal.** Um paraquedista com o paraquedas aberto desce com velocidade constante. A energia cinética não muda, mas a energia potencial diminui: **toda** a energia potencial perdida é dissipada pela resistência do ar. Nesse trecho, $E_{\text{dissipada}} = m\,g\,\Delta h$.

**Bola quicando.** Uma bola solta de uma altura $h_1$ que, depois de quicar, sobe só até $h_2 < h_1$ perdeu energia mecânica no choque com o chão (deformação, som, aquecimento). A energia dissipada é $m g (h_1 - h_2)$.

**Velocidade constante subindo.** Um elevador que sobe com velocidade constante mantém a energia cinética, mas ganha energia potencial. Esse ganho vem do trabalho positivo do motor: $W_{\text{motor}} = m g \Delta h$ (desprezando atritos).

**Relação com o rendimento.** Em máquinas reais, a energia útil é sempre menor que a energia fornecida, porque parte é dissipada. O **rendimento** é $\eta = \dfrac{E_{\text{útil}}}{E_{\text{total}}}$, sempre menor que 1 (ou 100%).
:::

:::simulator energy-track {"mass":1,"height":6,"g":10,"friction":true,"frictionForce":2}
Energia dissipada pelo atrito
Agora há uma força de atrito. Observe a barra da energia dissipada crescendo enquanto a mecânica diminui: a bola não volta mais à altura inicial e, com o tempo, para. A soma da energia mecânica com a dissipada permanece igual à energia inicial. Teste também atrito zero para comparar.
:::

:::solved_exercise Esquiador numa encosta
Um esquiador de $60\ \text{kg}$ parte do repouso do alto de uma encosta de $20\ \text{m}$ de altura e chega à base com velocidade de $10\ \text{m/s}$. Adote $g = 10\ \text{m/s}^2$. Quanta energia foi dissipada pelo atrito e pela resistência do ar?
---resolution---
Referência na base da encosta.

**Energia mecânica inicial** (só potencial):

$$E_{m,i} = m g h = 60 \times 10 \times 20 = 12\,000\ \text{J}$$

**Energia mecânica final** (só cinética):

$$E_{m,f} = \frac{m v^2}{2} = \frac{60 \times 10^2}{2} = 3\,000\ \text{J}$$

**Energia dissipada:**

$$E_{\text{dis}} = 12\,000 - 3\,000 = 9\,000\ \text{J}$$

Ou seja, 75% da energia mecânica inicial foi dissipada.
:::

:::solved_exercise Até onde o bloco desliza
Um bloco de $4\ \text{kg}$ desliza sobre um piso horizontal com velocidade inicial de $6\ \text{m/s}$. O coeficiente de atrito cinético é $\mu = 0{,}3$ e $g = 10\ \text{m/s}^2$. Que distância o bloco percorre até parar?
---resolution---
No piso horizontal, a energia potencial não muda; toda a energia cinética inicial é dissipada pelo atrito.

$$E_{c,i} = \frac{4 \times 6^2}{2} = 72\ \text{J} \qquad f = \mu m g = 0{,}3 \times 4 \times 10 = 12\ \text{N}$$

$$f\,d = E_{c,i} \quad\Rightarrow\quad d = \frac{72}{12} = 6\ \text{m}$$
:::

:::solved_exercise Rampa com atrito
Um bloco de $2\ \text{kg}$ é solto do topo de uma rampa de $5\ \text{m}$ de comprimento inclinada de $\theta$ em relação à horizontal, com $\sin\theta = 0{,}6$ e $\cos\theta = 0{,}8$. O coeficiente de atrito cinético entre o bloco e a rampa é $0{,}25$ e $g = 10\ \text{m/s}^2$. Com que velocidade o bloco chega à base?
---resolution---
**1. Altura da rampa:** $h = L \sin\theta = 5 \times 0{,}6 = 3\ \text{m}$.

**2. Energia mecânica inicial** (referência na base): $E_{m,i} = m g h = 2 \times 10 \times 3 = 60\ \text{J}$.

**3. Trabalho do atrito** ao longo dos 5 m:

$$W_{at} = -\mu\,m\,g\cos\theta\,L = -0{,}25 \times 2 \times 10 \times 0{,}8 \times 5 = -20\ \text{J}$$

**4. Teorema da energia mecânica:**

$$E_{m,f} = E_{m,i} + W_{at} = 60 - 20 = 40\ \text{J}$$

Na base, toda essa energia é cinética:

$$\frac{2\,v^2}{2} = 40 \quad\Rightarrow\quad v = \sqrt{40} \approx 6{,}3\ \text{m/s}$$

Sem atrito, a velocidade seria $\sqrt{2 \times 10 \times 3} = \sqrt{60} \approx 7{,}7\ \text{m/s}$.
:::

:::solved_exercise Paraquedista em velocidade terminal
Um paraquedista de $80\ \text{kg}$ (com o equipamento) desce $100\ \text{m}$ com velocidade constante de $5\ \text{m/s}$. Adote $g = 10\ \text{m/s}^2$. Quanta energia foi dissipada pela resistência do ar nesse trecho?
---resolution---
Como a velocidade é constante, a energia cinética não muda: $\Delta E_c = 0$. A energia potencial diminui:

$$\Delta E_p = -m g \Delta h = -80 \times 10 \times 100 = -80\,000\ \text{J}$$

A variação da energia mecânica é $\Delta E_m = 0 + (-80\,000) = -80\,000\ \text{J}$. Portanto, a energia dissipada pela resistência do ar foi $80\,000\ \text{J}$ ($80\ \text{kJ}$). A velocidade $5\ \text{m/s}$ é um dado que não muda o resultado.
:::

:::solved_exercise Bola que quica
Uma bola de $0{,}2\ \text{kg}$ é solta de $2\ \text{m}$ de altura e, depois de bater no chão, sobe até $1{,}5\ \text{m}$. Adote $g = 10\ \text{m/s}^2$. Que fração da energia mecânica foi dissipada?
---resolution---
Nos pontos mais altos, a velocidade é zero, então a energia mecânica é só potencial.

$$E_{m,i} = 0{,}2 \times 10 \times 2 = 4\ \text{J} \qquad E_{m,f} = 0{,}2 \times 10 \times 1{,}5 = 3\ \text{J}$$

$$E_{\text{dis}} = 4 - 3 = 1\ \text{J} \qquad \frac{E_{\text{dis}}}{E_{m,i}} = \frac{1}{4} = 25\%$$
:::

:::solved_exercise Elevador: quando a energia mecânica aumenta
Um motor eleva, com velocidade constante, um elevador de $500\ \text{kg}$ por $12\ \text{m}$. Desprezando atritos ($g = 10\ \text{m/s}^2$), qual é o trabalho realizado pelo motor?
---resolution---
A força do motor (pela tração do cabo) é não conservativa. Pelo teorema da energia mecânica, $W_{\text{motor}} = \Delta E_m$. Com velocidade constante, $\Delta E_c = 0$:

$$W_{\text{motor}} = \Delta E_p = m g \Delta h = 500 \times 10 \times 12 = 60\,000\ \text{J}$$

Aqui o sistema é não conservativo, mas a energia mecânica **aumentou**: o motor forneceu $60\ \text{kJ}$ ao elevador.
:::

:::real_world_application Freios que viram geradores
Nos freios comuns, a energia cinética do carro é dissipada como calor nos discos e pastilhas, que podem ficar muito quentes. Carros elétricos e híbridos usam também a **frenagem regenerativa**: o motor elétrico passa a funcionar como gerador, convertendo parte da energia cinética em energia elétrica que recarrega a bateria. A energia que seria desperdiçada como calor é parcialmente reaproveitada.
:::

:::curiosity A experiência de Joule
Na década de 1840, James Prescott Joule montou um aparelho em que pesos, ao descer, giravam pás dentro de um recipiente com água. O atrito das pás com a água aquecia levemente o líquido. Medindo a queda dos pesos e o aumento de temperatura, Joule mostrou que a energia mecânica "perdida" reaparecia como energia térmica, sempre na mesma proporção. Esse resultado foi uma peça central para estabelecer o princípio da conservação da energia, e é por isso que a unidade de energia leva o seu nome.
:::

:::text
## Resumo e erros comuns

- **Conservativo:** $E_{m,i} = E_{m,f}$.
- **Dissipativo:** $E_{m,i} = E_{m,f} + E_{\text{dissipada}}$, com $E_{\text{dissipada}} = |W_{at}|$.
- **Recebendo energia:** $E_{m,f} = E_{m,i} + W_{\text{motor}}$.
- A energia total sempre se conserva; o que muda é quanto dela é mecânica.
- Atrito em rampa: $W_{at} = -\mu m g \cos\theta \cdot L$ (use o comprimento da rampa).

**Erros comuns:**

- Dizer que a energia "foi destruída" pelo atrito: ela foi transformada (principalmente em energia térmica).
- Usar a altura da rampa no cálculo do atrito, em vez do comprimento percorrido.
- Esquecer que velocidade constante não significa energia mecânica constante (a potencial pode estar mudando).
:::
