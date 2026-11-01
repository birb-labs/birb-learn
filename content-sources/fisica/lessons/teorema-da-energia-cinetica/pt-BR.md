---
title: Teorema da Energia Cinética
---

:::text
## Relembrando: trabalho de uma força

Uma força **realiza trabalho** quando o corpo em que ela atua se desloca. Para uma força constante $F$ que forma um ângulo $\theta$ com o deslocamento $d$:

$$W = F\,d\,\cos\theta$$

- Se a força ajuda o movimento ($0° \le \theta < 90°$), o trabalho é **positivo** (trabalho motor).
- Se a força é perpendicular ao deslocamento ($\theta = 90°$), o trabalho é **zero**.
- Se a força se opõe ao movimento ($90° < \theta \le 180°$), o trabalho é **negativo** (trabalho resistente).

O trabalho, assim como a energia, é medido em **joules** e é uma grandeza **escalar**. Na verdade, trabalho é exatamente isto: **energia transferida por uma força** de um corpo para outro (ou convertida de uma forma em outra).
:::

:::text
## O teorema

O **teorema da energia cinética** (também chamado de **teorema trabalho–energia**) liga o trabalho das forças à variação da velocidade de um corpo:

> **O trabalho da força resultante (ou seja, a soma dos trabalhos de todas as forças que atuam no corpo) é igual à variação da sua energia cinética.**

$$W_{\text{total}} = \Delta E_c = E_{c,\text{final}} - E_{c,\text{inicial}} = \frac{m v_f^2}{2} - \frac{m v_i^2}{2}$$

Como interpretar:

- $W_{\text{total}} > 0$: a energia cinética **aumenta**, o corpo **acelera**.
- $W_{\text{total}} < 0$: a energia cinética **diminui**, o corpo **desacelera**.
- $W_{\text{total}} = 0$: a energia cinética **não muda**, a velocidade tem módulo constante.

O trabalho total pode ser calculado de duas maneiras equivalentes:

1. somando o trabalho de cada força: $W_{\text{total}} = W_1 + W_2 + W_3 + \dots$
2. calculando a força resultante e o seu trabalho: $W_{\text{total}} = F_R\,d\,\cos\theta$.
:::

:::text
## De onde vem o teorema (força constante)

Considere um corpo de massa $m$ sob uma força resultante constante $F_R$, na mesma direção e sentido do deslocamento $d$. Pela segunda lei de Newton, $F_R = m\,a$. Pela equação de Torricelli:

$$v_f^2 = v_i^2 + 2\,a\,d \quad\Rightarrow\quad a\,d = \frac{v_f^2 - v_i^2}{2}$$

Multiplicando os dois lados por $m$:

$$\underbrace{m\,a}_{F_R}\,d = \frac{m v_f^2}{2} - \frac{m v_i^2}{2} \quad\Rightarrow\quad W_{\text{total}} = \Delta E_c$$

A demonstração acima usa uma força constante, mas o teorema vale **sempre**: para forças variáveis e trajetórias curvas também (a demonstração geral usa cálculo integral).

## Por que esse teorema é tão útil

Ele permite relacionar **forças, deslocamento e velocidades sem precisar do tempo nem da aceleração**. Sempre que um problema fornecer (ou pedir) velocidades e distâncias, pense nele antes de pensar em cinemática.
:::

:::text
## Força variável: a área do gráfico

Quando a força varia ao longo do deslocamento, não dá para usar $W = Fd\cos\theta$ diretamente. Nesse caso, se a força tem a direção do deslocamento, o trabalho é numericamente igual à **área sob o gráfico de $F$ em função da posição $x$**:

$$W = \text{área sob a curva } F \times x$$

Áreas acima do eixo $x$ correspondem a trabalho positivo; áreas abaixo do eixo, a trabalho negativo. Com o trabalho em mãos, o teorema da energia cinética dá a velocidade final.

## Aplicação clássica: distância de frenagem

Um carro de massa $m$ e velocidade $v_0$ freia até parar, sob uma força de atrito constante $f$. O trabalho do atrito é $-f\,d$ e a energia cinética final é zero:

$$-f\,d = 0 - \frac{m v_0^2}{2} \quad\Rightarrow\quad d = \frac{m v_0^2}{2f}$$

Se o atrito vem das rodas travadas no asfalto, $f = \mu\,m\,g$ e a massa se cancela:

$$d = \frac{v_0^2}{2\,\mu\,g}$$

A distância de frenagem é **proporcional ao quadrado da velocidade**: dobrando a velocidade, a distância **quadruplica**.
:::

:::simulator work-energy-block {"mass":2,"initialSpeed":0,"force":20,"mu":0.5,"distance":4,"g":10}
Trabalho e energia cinética
Um bloco é empurrado por uma força horizontal sobre um piso com atrito. Compare as barras: a energia cinética final é sempre a inicial somada ao trabalho total. Experimente aumentar o atrito até o bloco parar antes do fim.
:::

:::solved_exercise Bloco puxado sobre um piso com atrito
Um bloco de $2\ \text{kg}$, inicialmente em repouso, é puxado por uma força horizontal de $20\ \text{N}$ ao longo de $4\ \text{m}$ sobre um piso com coeficiente de atrito cinético $\mu = 0{,}5$. Adote $g = 10\ \text{m/s}^2$. Determine a velocidade do bloco ao final do percurso.
---resolution---
**1. Forças e seus trabalhos.** A força normal equilibra o peso: $N = mg = 2 \times 10 = 20\ \text{N}$. O atrito vale $f = \mu N = 0{,}5 \times 20 = 10\ \text{N}$.

- Trabalho da força aplicada (mesmo sentido do deslocamento): $W_F = 20 \times 4 = 80\ \text{J}$.
- Trabalho do atrito (sentido oposto): $W_{at} = -10 \times 4 = -40\ \text{J}$.
- Peso e normal são perpendiculares ao deslocamento: trabalho zero.

**2. Trabalho total:** $W_{\text{total}} = 80 - 40 = 40\ \text{J}$.

**3. Teorema da energia cinética** (partindo do repouso, $E_{c,i} = 0$):

$$40 = \frac{2\,v_f^2}{2} - 0 \quad\Rightarrow\quad v_f^2 = 40 \quad\Rightarrow\quad v_f = \sqrt{40} \approx 6{,}3\ \text{m/s}$$
:::

:::solved_exercise Distância de frenagem
Um carro de $1\,000\ \text{kg}$ a $20\ \text{m/s}$ freia, e a força de atrito total sobre ele é constante e vale $8\,000\ \text{N}$.

a) Qual a distância até parar?

b) E se a velocidade inicial fosse $40\ \text{m/s}$, com a mesma força de frenagem?
---resolution---
**a)** Energia cinética inicial: $E_{c,i} = \dfrac{1\,000 \times 20^2}{2} = 200\,000\ \text{J}$. O carro para, então $E_{c,f} = 0$. Só o atrito realiza trabalho na horizontal:

$$-8\,000\,d = 0 - 200\,000 \quad\Rightarrow\quad d = \frac{200\,000}{8\,000} = 25\ \text{m}$$

**b)** Com o dobro da velocidade, a energia cinética fica 4 vezes maior: $E_{c,i} = 800\,000\ \text{J}$.

$$d = \frac{800\,000}{8\,000} = 100\ \text{m}$$

A velocidade dobrou e a distância de frenagem **quadruplicou**.
:::

:::solved_exercise Projétil atravessando a madeira
Um projétil de $10\ \text{g}$ atinge um bloco de madeira a $400\ \text{m/s}$ e para depois de penetrar $10\ \text{cm}$. Qual é a força média que a madeira exerce sobre o projétil?
---resolution---
**Unidades no SI:** $m = 10\ \text{g} = 0{,}01\ \text{kg}$ e $d = 10\ \text{cm} = 0{,}1\ \text{m}$.

**Energia cinética inicial:**

$$E_{c,i} = \frac{0{,}01 \times 400^2}{2} = \frac{0{,}01 \times 160\,000}{2} = 800\ \text{J}$$

**Teorema:** a força média $F$ da madeira se opõe ao movimento, então $W = -F\,d$:

$$-F \times 0{,}1 = 0 - 800 \quad\Rightarrow\quad F = \frac{800}{0{,}1} = 8\,000\ \text{N}$$
:::

:::solved_exercise Força variável: usando a área do gráfico
Um corpo de $2\ \text{kg}$, em repouso em uma superfície horizontal sem atrito, recebe uma força horizontal que diminui linearmente de $10\ \text{N}$ (em $x = 0$) até $0$ (em $x = 4\ \text{m}$). Qual é a velocidade do corpo em $x = 4\ \text{m}$?
---resolution---
**1. Trabalho = área do gráfico.** O gráfico $F \times x$ é um triângulo de base $4\ \text{m}$ e altura $10\ \text{N}$:

$$W = \frac{\text{base} \times \text{altura}}{2} = \frac{4 \times 10}{2} = 20\ \text{J}$$

**2. Teorema da energia cinética** (sem atrito, essa é a única força que realiza trabalho):

$$20 = \frac{2\,v^2}{2} - 0 \quad\Rightarrow\quad v^2 = 20 \quad\Rightarrow\quad v = \sqrt{20} \approx 4{,}5\ \text{m/s}$$
:::

:::solved_exercise Altura máxima sem usar cinemática
Uma bola de $0{,}2\ \text{kg}$ é lançada verticalmente para cima a $10\ \text{m/s}$. Desprezando a resistência do ar e adotando $g = 10\ \text{m/s}^2$, determine a altura máxima atingida.
---resolution---
Na subida, a única força é o peso, que aponta para baixo, contra o deslocamento: $W_P = -m\,g\,h$. No ponto mais alto, a velocidade é zero.

$$-m\,g\,h = 0 - \frac{m v_0^2}{2} \quad\Rightarrow\quad h = \frac{v_0^2}{2g} = \frac{10^2}{2 \times 10} = 5\ \text{m}$$

Repare que a massa se cancelou: qualquer corpo lançado a $10\ \text{m/s}$ sobe $5\ \text{m}$ (sem resistência do ar).
:::

:::real_world_application Airbags, capacetes e para-choques
Para parar um corpo, é preciso retirar toda a sua energia cinética: $F \cdot d = E_c$. A energia é fixa (depende da massa e da velocidade), mas a **distância** em que ela é retirada pode mudar. Airbags, capacetes com espuma e zonas de deformação dos carros fazem a parada acontecer ao longo de uma distância maior. Com $d$ maior, a força média $F = E_c/d$ fica menor, e o corpo humano sofre menos. É o teorema da energia cinética protegendo vidas.
:::

:::curiosity Movimento circular uniforme: força sem trabalho
Num movimento circular uniforme, há uma força resultante (a centrípeta) apontando sempre para o centro. Mas ela é sempre **perpendicular** à velocidade, então seu trabalho é zero. Pelo teorema, $\Delta E_c = 0$: o módulo da velocidade não muda. A força centrípeta muda apenas a **direção** do movimento, nunca a rapidez.
:::

:::text
## Resumo e erros comuns

- $W_{\text{total}} = \Delta E_c = \dfrac{m v_f^2}{2} - \dfrac{m v_i^2}{2}$.
- O trabalho total é a soma dos trabalhos de **todas** as forças (incluindo atrito e peso).
- Força variável: trabalho = área sob o gráfico $F \times x$.
- Distância de frenagem: $d = \dfrac{v_0^2}{2\mu g}$, proporcional a $v_0^2$.

**Erros comuns:**

- Usar o trabalho de apenas uma força quando o teorema exige o trabalho **total**.
- Esquecer o sinal negativo do trabalho do atrito.
- Calcular $\Delta E_c$ como $\frac{m(v_f - v_i)^2}{2}$: o correto é a diferença dos quadrados, $\frac{m(v_f^2 - v_i^2)}{2}$.
- Esquecer que forças perpendiculares ao deslocamento (normal, centrípeta) não realizam trabalho.
:::
