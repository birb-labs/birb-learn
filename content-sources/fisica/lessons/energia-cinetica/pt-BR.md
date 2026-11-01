---
title: Energia Cinética
---

:::text
## O que é energia?

Em física, **energia** é a grandeza que mede a **capacidade de um sistema realizar trabalho**, ou seja, de produzir mudanças: colocar algo em movimento, aquecer, deformar, levantar. Ela aparece em várias formas (térmica, química, elétrica, luminosa, nuclear...), e uma das ideias mais poderosas da física é que **a energia não é criada nem destruída: ela apenas se transforma de uma forma em outra** (ou passa de um corpo para outro).

Na mecânica, estudamos principalmente três formas:

- **energia cinética**: associada ao **movimento**;
- **energia potencial**: associada à **posição** ou à **configuração** (altura, mola comprimida);
- **energia mecânica**: a soma das duas anteriores.

A energia é uma **grandeza escalar**: tem valor numérico e unidade, mas **não tem direção nem sentido**. No Sistema Internacional (SI), sua unidade é o **joule** (J):

$$1\ \text{J} = 1\ \text{N}\cdot\text{m} = 1\ \text{kg}\cdot\text{m}^2/\text{s}^2$$

Nesta lição vamos estudar a primeira dessas formas: a energia do movimento.
:::

:::text
## Energia cinética: a energia do movimento

Todo corpo que se move tem **energia cinética** ($E_c$). A palavra vem do grego *kínesis*, que significa "movimento". Intuitivamente:

- uma bola de boliche rápida derruba mais pinos do que uma lenta: **quanto maior a velocidade**, maior a energia;
- um caminhão a 40 km/h causa muito mais estrago numa batida do que uma bicicleta à mesma velocidade: **quanto maior a massa**, maior a energia.

A expressão matemática que junta essas duas observações é:

$$E_c = \frac{m\,v^2}{2}$$

em que:

| Símbolo | Grandeza | Unidade no SI |
|---|---|---|
| $E_c$ | energia cinética | joule (J) |
| $m$ | massa do corpo | quilograma (kg) |
| $v$ | módulo da velocidade | metro por segundo (m/s) |

**Atenção às unidades!** Para obter a energia em joules, a massa precisa estar em **kg** e a velocidade em **m/s**. Se a velocidade vier em km/h, divida por 3,6:

$$72\ \text{km/h} = \frac{72}{3{,}6}\ \text{m/s} = 20\ \text{m/s}$$
:::

:::text
## Propriedades importantes

**1. A energia cinética nunca é negativa.** A massa é positiva e $v^2 \ge 0$, então $E_c \ge 0$. Ela vale zero apenas quando o corpo está parado.

**2. O sentido do movimento não importa.** Como a velocidade aparece ao quadrado, um carro a 20 m/s indo para o norte tem a mesma energia cinética que o mesmo carro a 20 m/s indo para o sul.

**3. A energia cinética é proporcional à massa.** Mantendo a velocidade, se a massa dobra, a energia dobra; se a massa triplica, a energia triplica.

**4. A energia cinética é proporcional ao quadrado da velocidade.** Este é o ponto que mais cai em prova:

| Velocidade | Energia cinética |
|---|---|
| $v$ | $E_c$ |
| $2v$ | $4E_c$ |
| $3v$ | $9E_c$ |
| $v/2$ | $E_c/4$ |

Ou seja, **dobrar a velocidade quadruplica a energia cinética**. O gráfico de $E_c$ em função de $v$ é um arco de **parábola** (passando pela origem), enquanto o gráfico de $E_c$ em função de $m$ (com $v$ fixo) é uma **reta**.

**5. A energia cinética depende do referencial.** A velocidade é medida em relação a algum referencial. Um passageiro sentado dentro de um ônibus tem $E_c = 0$ em relação ao ônibus, mas tem energia cinética em relação à estrada. Em problemas de escola, salvo aviso, use o solo como referencial.
:::

:::simulator kinetic-energy-explorer {"mass":2,"speed":10,"maxMass":10,"maxSpeed":30}
Explore a energia cinética
Mude a massa e a velocidade. Repare que a curva da energia cinética em função da velocidade é uma parábola: ao dobrar a velocidade, a energia fica quatro vezes maior; ao dobrar a massa, ela apenas dobra.
:::

:::solved_exercise Calculando a energia cinética de um carro
Um carro de massa $1\,000\ \text{kg}$ trafega a $72\ \text{km/h}$. Determine sua energia cinética.
---resolution---
**1. Converter a velocidade para m/s:**

$$v = \frac{72}{3{,}6} = 20\ \text{m/s}$$

**2. Aplicar a fórmula:**

$$E_c = \frac{m v^2}{2} = \frac{1\,000 \times 20^2}{2} = \frac{1\,000 \times 400}{2} = 200\,000\ \text{J}$$

**Resposta:** $E_c = 2 \times 10^5\ \text{J} = 200\ \text{kJ}$.
:::

:::solved_exercise Comparando velocidades
Um ciclista aumenta sua velocidade de $5\ \text{m/s}$ para $15\ \text{m/s}$. Por qual fator a sua energia cinética foi multiplicada?
---resolution---
A massa não muda, então a razão entre as energias depende apenas da razão entre os quadrados das velocidades:

$$\frac{E_{c,f}}{E_{c,i}} = \frac{\frac{m v_f^2}{2}}{\frac{m v_i^2}{2}} = \left(\frac{v_f}{v_i}\right)^2 = \left(\frac{15}{5}\right)^2 = 3^2 = 9$$

**Resposta:** a energia cinética ficou **9 vezes maior** (a velocidade triplicou, e $3^2 = 9$).
:::

:::solved_exercise Descobrindo a velocidade a partir da energia
Uma bola de $0{,}5\ \text{kg}$ tem energia cinética de $25\ \text{J}$. Qual é a sua velocidade?
---resolution---
Isolamos $v$ na fórmula:

$$E_c = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = \frac{2E_c}{m} \quad\Rightarrow\quad v = \sqrt{\frac{2E_c}{m}}$$

Substituindo:

$$v = \sqrt{\frac{2 \times 25}{0{,}5}} = \sqrt{100} = 10\ \text{m/s}$$

**Resposta:** $v = 10\ \text{m/s}$.
:::

:::solved_exercise Massa ou velocidade: o que pesa mais?
Um caminhão de $6\,000\ \text{kg}$ anda a $10\ \text{m/s}$, e um carro de $1\,500\ \text{kg}$ anda a $20\ \text{m/s}$. Qual dos dois tem maior energia cinética?
---resolution---
**Caminhão:**

$$E_{c,\text{caminhão}} = \frac{6\,000 \times 10^2}{2} = \frac{6\,000 \times 100}{2} = 300\,000\ \text{J}$$

**Carro:**

$$E_{c,\text{carro}} = \frac{1\,500 \times 20^2}{2} = \frac{1\,500 \times 400}{2} = 300\,000\ \text{J}$$

**Resposta:** os dois têm a **mesma** energia cinética, $3 \times 10^5\ \text{J}$. O caminhão tem 4 vezes a massa do carro, mas o carro tem o dobro da velocidade, e o dobro da velocidade "vale" 4 vezes mais energia. Os efeitos se compensam exatamente.
:::

:::real_world_application Por que os limites de velocidade importam tanto
Como a energia cinética cresce com o **quadrado** da velocidade, pequenos aumentos de velocidade geram grandes aumentos de energia. Um carro a 80 km/h tem **4 vezes** a energia cinética do mesmo carro a 40 km/h. Numa colisão, essa energia precisa ser dissipada (deformando a lataria, aquecendo, quebrando objetos), e por isso batidas em alta velocidade são tão mais destrutivas. Pelo mesmo motivo, para frear, o carro precisa "retirar" toda essa energia: a distância de frenagem também cresce com $v^2$, como veremos na próxima lição.
:::

:::curiosity De onde veio o "½"?
No fim do século XVII, Gottfried Leibniz chamou a grandeza $m v^2$ de *vis viva* ("força viva") e defendeu que ela se conservava em certos choques. O fator $\frac{1}{2}$ só se firmou no século XIX: em 1829, o engenheiro francês Gaspard-Gustave Coriolis, no livro *Du calcul de l'effet des machines*, passou a usar metade de $m v^2$ e deu sentido técnico à palavra *travail* ("trabalho"). Com o $\frac{1}{2}$, a energia cinética se encaixa perfeitamente no teorema do trabalho, que é o assunto da próxima lição.
:::

:::text
## Resumo e erros comuns

- $E_c = \dfrac{m v^2}{2}$, em joules, com $m$ em kg e $v$ em m/s.
- $E_c$ é escalar e nunca negativa; só é zero se o corpo estiver em repouso.
- $E_c \propto m$ (dobra a massa, dobra a energia) e $E_c \propto v^2$ (dobra a velocidade, quadruplica a energia).

**Erros comuns:**

- Esquecer de converter km/h para m/s (divida por 3,6).
- Esquecer de elevar a velocidade ao quadrado, ou elevar a massa ao quadrado por engano.
- Achar que dobrar a velocidade dobra a energia (na verdade, quadruplica).
- Atribuir sinal negativo à energia cinética de um corpo que se move "para trás": o sentido não importa.
:::
