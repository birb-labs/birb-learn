---
title: Energia Mecânica e sua Conservação
---

:::text
## Juntando as peças

Nas lições anteriores, vimos a energia do movimento (cinética) e as energias armazenadas (potencial gravitacional e elástica). A soma de todas elas é a **energia mecânica** ($E_m$) do sistema:

$$E_m = E_c + E_p = \frac{m v^2}{2} + m g h + \frac{k x^2}{2}$$

(inclua só os termos que existem no problema: se não há mola, não há energia elástica.)

A energia mecânica é útil porque, em muitas situações, ela **não muda**: a energia apenas passa de uma forma para a outra. Uma bola caindo perde energia potencial e ganha exatamente a mesma quantidade de energia cinética.
:::

:::text
## Teorema da energia mecânica

Vamos separar as forças que atuam em um corpo em dois grupos: **conservativas** (peso, força elástica) e **não conservativas** (atrito, resistência do ar, força de um motor, força de uma pessoa empurrando).

Pelo teorema da energia cinética, o trabalho total é igual a $\Delta E_c$:

$$W_{\text{cons}} + W_{\text{não cons}} = \Delta E_c$$

Pelo teorema da energia potencial, $W_{\text{cons}} = -\Delta E_p$. Substituindo:

$$-\Delta E_p + W_{\text{não cons}} = \Delta E_c \quad\Rightarrow\quad W_{\text{não cons}} = \Delta E_c + \Delta E_p$$

Como $\Delta E_c + \Delta E_p = \Delta E_m$, chegamos ao **teorema da energia mecânica**:

$$W_{\text{não conservativas}} = \Delta E_m = E_{m,\text{final}} - E_{m,\text{inicial}}$$

> **A variação da energia mecânica de um sistema é igual ao trabalho das forças não conservativas.**

- Se as forças não conservativas realizam trabalho **negativo** (atrito, resistência do ar), a energia mecânica **diminui**.
- Se realizam trabalho **positivo** (um motor, uma pessoa empurrando), a energia mecânica **aumenta**.
- Se não realizam trabalho, a energia mecânica **se conserva**.
:::

:::text
## Princípio da conservação da energia mecânica

Quando **apenas forças conservativas realizam trabalho**, temos $W_{\text{não cons}} = 0$ e:

$$E_{m,\text{inicial}} = E_{m,\text{final}} \qquad\text{ou seja}\qquad E_{c,i} + E_{p,i} = E_{c,f} + E_{p,f}$$

Esse sistema é chamado de **sistema conservativo**.

**Atenção:** "apenas forças conservativas realizam trabalho" **não** significa que só existem forças conservativas. Forças que são sempre perpendiculares ao movimento (como a **normal** em uma pista sem atrito ou a **tração** no fio de um pêndulo) **não realizam trabalho** e, portanto, não alteram a energia mecânica.

## Consequências importantes

**Queda livre (sem resistência do ar).** Um corpo solto do repouso de uma altura $h$ chega ao solo com:

$$m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v = \sqrt{2 g h}$$

A massa se cancela: sem resistência do ar, um corpo leve e um pesado chegam com a mesma velocidade.

**Rampas e pistas sem atrito.** A velocidade em um ponto depende **apenas do desnível** em relação ao ponto de partida, e não da forma da pista. Uma rampa suave e uma rampa íngreme de mesma altura entregam a mesma velocidade no final (a íngreme só faz isso mais rápido).

**Gráficos.** Num sistema conservativo, o gráfico de $E_m$ em função do tempo ou da posição é uma reta horizontal; as curvas de $E_c$ e $E_p$ são "espelhadas": quando uma sobe, a outra desce na mesma quantidade.
:::

:::simulator energy-track {"mass":1,"height":6,"g":10,"friction":false}
Conservação da energia mecânica
Sem atrito, a barra da energia mecânica não se altera: a bola troca energia potencial por cinética e vice-versa, e sempre volta à altura de onde partiu. No ponto mais baixo toda a energia é cinética; nos pontos mais altos, toda é potencial.
:::

:::solved_exercise Queda livre
Uma bola é solta do repouso a $20\ \text{m}$ de altura. Desprezando a resistência do ar e adotando $g = 10\ \text{m/s}^2$, determine a velocidade da bola: a) quando ela está a $15\ \text{m}$ do solo; b) ao chegar ao solo.
---resolution---
O sistema é conservativo (só o peso realiza trabalho). Referência no solo.

**a)** A bola caiu $\Delta h = 20 - 15 = 5\ \text{m}$:

$$m g h_i = \frac{m v^2}{2} + m g h_f \quad\Rightarrow\quad v^2 = 2 g (h_i - h_f) = 2 \times 10 \times 5 = 100 \quad\Rightarrow\quad v = 10\ \text{m/s}$$

**b)** Agora $\Delta h = 20\ \text{m}$:

$$v = \sqrt{2 \times 10 \times 20} = \sqrt{400} = 20\ \text{m/s}$$

Repare que a massa da bola não foi necessária.
:::

:::solved_exercise Pêndulo simples
Um pêndulo é solto do repouso em um ponto que está $45\ \text{cm}$ acima do ponto mais baixo da sua trajetória. Desprezando a resistência do ar ($g = 10\ \text{m/s}^2$), qual é a velocidade da massa no ponto mais baixo?
---resolution---
A tração do fio é sempre perpendicular à velocidade, então não realiza trabalho. Só o peso realiza trabalho: a energia mecânica se conserva. Referência no ponto mais baixo:

$$m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v = \sqrt{2 g h} = \sqrt{2 \times 10 \times 0{,}45} = \sqrt{9} = 3\ \text{m/s}$$
:::

:::solved_exercise Montanha-russa
Um carrinho de montanha-russa passa pelo topo de uma elevação de $20\ \text{m}$ com velocidade de $5\ \text{m/s}$. Desprezando atritos ($g = 10\ \text{m/s}^2$), qual é a sua velocidade quando ele passa por um ponto a $5\ \text{m}$ de altura?
---resolution---
Conservação da energia mecânica, com referência no solo:

$$\frac{m v_i^2}{2} + m g h_i = \frac{m v_f^2}{2} + m g h_f$$

Dividindo tudo por $m$ e multiplicando por 2:

$$v_f^2 = v_i^2 + 2 g (h_i - h_f) = 5^2 + 2 \times 10 \times (20 - 5) = 25 + 300 = 325$$

$$v_f = \sqrt{325} \approx 18\ \text{m/s}$$
:::

:::solved_exercise Mola que lança um bloco rampa acima
Um bloco de $0{,}5\ \text{kg}$ comprime em $30\ \text{cm}$ uma mola de constante $k = 200\ \text{N/m}$, sobre uma superfície horizontal. Ao ser solto, o bloco percorre a superfície e sobe uma rampa. Sem atritos ($g = 10\ \text{m/s}^2$), qual a altura máxima que ele atinge?
---resolution---
Toda a energia elástica inicial se transforma em energia potencial gravitacional no ponto mais alto (onde a velocidade é zero):

$$\frac{k x^2}{2} = m g h_{\text{máx}}$$

$$\frac{200 \times 0{,}3^2}{2} = 0{,}5 \times 10 \times h_{\text{máx}} \quad\Rightarrow\quad 9 = 5\,h_{\text{máx}} \quad\Rightarrow\quad h_{\text{máx}} = 1{,}8\ \text{m}$$
:::

:::solved_exercise Altura mínima para fazer o loop
Uma pequena esfera desliza, sem atrito, por um trilho que termina em um loop circular vertical de raio $R = 0{,}4\ \text{m}$. De que altura mínima (medida a partir da base do loop) a esfera deve partir do repouso para completar o loop sem perder contato com o trilho?
---resolution---
**1. Condição no topo do loop.** No ponto mais alto, a força centrípeta é dada pelo peso mais a normal. A velocidade mínima acontece quando a normal é zero:

$$m g = \frac{m v^2}{R} \quad\Rightarrow\quad v_{\text{topo}}^2 = g R$$

**2. Conservação da energia** entre a partida (altura $h$, repouso) e o topo do loop (altura $2R$):

$$m g h = \frac{m v_{\text{topo}}^2}{2} + m g (2R) = \frac{m g R}{2} + 2 m g R \quad\Rightarrow\quad h = \frac{5R}{2}$$

**3. Valor numérico:** $h = 2{,}5 \times 0{,}4 = 1{,}0\ \text{m}$.
:::

:::solved_exercise Lançamento vertical
Uma bola é lançada verticalmente para cima a partir do solo com velocidade de $20\ \text{m/s}$. Desprezando a resistência do ar ($g = 10\ \text{m/s}^2$), a que altura sua velocidade será $10\ \text{m/s}$?
---resolution---
$$\frac{m v_0^2}{2} = \frac{m v^2}{2} + m g h \quad\Rightarrow\quad h = \frac{v_0^2 - v^2}{2 g} = \frac{400 - 100}{20} = 15\ \text{m}$$

Nessa altura a bola está subindo com $10\ \text{m/s}$, e passará por ela de novo, na descida, também com $10\ \text{m/s}$.
:::

:::real_world_application Salto com vara
O salto com vara é uma sequência de transformações de energia. Na corrida, o atleta acumula energia cinética. Ao fincar a vara, ela se curva e armazena parte dessa energia como energia potencial elástica. Ao se endireitar, a vara devolve essa energia e ajuda a elevar o atleta, transformando-a em energia potencial gravitacional. Por isso a velocidade da corrida é tão importante: quanto mais energia cinética no início, mais alto o atleta pode chegar.
:::

:::curiosity O princípio que unificou a física
A ideia de que a energia se conserva, mudando apenas de forma, foi formulada na década de 1840 por vários cientistas que trabalhavam de forma independente, entre eles Julius Robert von Mayer, James Prescott Joule e Hermann von Helmholtz. Joule mostrou experimentalmente que uma certa quantidade de trabalho mecânico sempre produz a mesma quantidade de calor. A conservação da energia mecânica que estudamos aqui é um caso particular desse princípio geral: quando não há atrito, a energia não "escapa" para a forma térmica.
:::

:::text
## Resumo e erros comuns

- $E_m = E_c + E_p$.
- **Teorema da energia mecânica:** $W_{\text{não cons}} = \Delta E_m$.
- **Sistema conservativo** (só forças conservativas realizam trabalho): $E_{c,i} + E_{p,i} = E_{c,f} + E_{p,f}$.
- Queda livre a partir do repouso: $v = \sqrt{2 g h}$, independente da massa.
- Loop vertical sem atrito: altura mínima de partida $h = \dfrac{5R}{2}$.

**Erros comuns:**

- Achar que a presença da força normal ou da tração impede a conservação: elas não realizam trabalho quando são perpendiculares ao movimento.
- Esquecer a energia cinética inicial quando o corpo já parte com velocidade.
- Esquecer que, no ponto mais alto de um lançamento oblíquo, a velocidade **não** é zero (a componente horizontal continua).
:::
