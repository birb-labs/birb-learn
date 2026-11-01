---
title: Energia: Estratégias de Resolução e Problemas Integrados
---

:::text
## Quadro geral das fórmulas

| Conceito | Fórmula | Observação |
|---|---|---|
| Trabalho de força constante | $W = F\,d\cos\theta$ | escalar, em J |
| Energia cinética | $E_c = \dfrac{m v^2}{2}$ | $\propto v^2$ |
| Teorema da energia cinética | $W_{\text{total}} = \Delta E_c$ | todas as forças |
| Energia potencial gravitacional | $E_{pg} = m g h$ | $h$ a partir da referência |
| Lei de Hooke | $F = k\,x$ | força restauradora |
| Energia potencial elástica | $E_{pel} = \dfrac{k x^2}{2}$ | $x$ = deformação |
| Teorema da energia potencial | $W_{\text{cons}} = E_{p,i} - E_{p,f}$ | só forças conservativas |
| Energia mecânica | $E_m = E_c + E_p$ | |
| Teorema da energia mecânica | $W_{\text{não cons}} = \Delta E_m$ | |
| Sistema conservativo | $E_{m,i} = E_{m,f}$ | |
| Sistema dissipativo | $E_{m,i} = E_{m,f} + E_{\text{dis}}$ | $E_{\text{dis}} = \lvert W_{at} \rvert$ |
:::

:::text
## Roteiro em 5 passos

1. **Desenhe e identifique os estados.** Marque o ponto inicial e o ponto final que interessam. Anote, em cada um, a velocidade, a altura e a deformação de molas.
2. **Escolha o nível de referência** para a energia potencial gravitacional. Em geral, o ponto mais baixo do movimento.
3. **Liste as forças e classifique-as.** Quais são conservativas (peso, elástica)? Quais são não conservativas (atrito, resistência do ar, motor, pessoa)? Quais não realizam trabalho (normal e tração perpendiculares ao movimento)?
4. **Escolha o teorema:**
   - só forças conservativas realizam trabalho → **conservação da energia mecânica**;
   - há atrito, motor etc. → **teorema da energia mecânica** ($W_{\text{não cons}} = \Delta E_m$) ou energia dissipada;
   - quer relacionar diretamente trabalho e velocidade de um corpo → **teorema da energia cinética**.
5. **Escreva a equação, isole a incógnita e confira as unidades** (kg, m, m/s, N/m, J).

## Energia ou cinemática?

Use **energia** quando o problema envolver **velocidades e posições (alturas, distâncias, deformações)** e não pedir o **tempo**. Ela funciona mesmo com trajetórias curvas (rampas, pêndulos, montanhas-russas), onde a cinemática ficaria muito difícil. Use **cinemática e leis de Newton** quando precisar do **tempo** ou da **aceleração** em cada instante. Muitos problemas combinam os dois: por exemplo, energia para achar a velocidade e a segunda lei de Newton (resultante centrípeta) para achar a força num ponto da trajetória.
:::

:::simulator energy-track {"mass":2,"height":4,"g":10,"friction":true,"frictionForce":0}
Laboratório de energia
Use o simulador para conferir suas respostas: escolha massa, altura e atrito, preveja a velocidade no ponto mais baixo com a conservação da energia (ou com a energia dissipada) e compare com o valor mostrado.
:::

:::solved_exercise Mola e atrito no mesmo problema
Um bloco de $1\ \text{kg}$ comprime em $20\ \text{cm}$ uma mola de constante $k = 400\ \text{N/m}$, sobre um piso horizontal com coeficiente de atrito cinético $\mu = 0{,}2$ ($g = 10\ \text{m/s}^2$). O bloco é solto e só se encosta na mola enquanto ela o empurra. Que distância total o bloco percorre, a partir do ponto em que foi solto, até parar?
---resolution---
**Energia inicial** (só elástica, pois o bloco parte do repouso e o piso é horizontal):

$$E_{m,i} = \frac{k x^2}{2} = \frac{400 \times 0{,}2^2}{2} = \frac{400 \times 0{,}04}{2} = 8\ \text{J}$$

**Energia final:** o bloco para e a mola fica relaxada, então $E_{m,f} = 0$.

**Atrito:** age durante todo o percurso (inclusive enquanto a mola ainda empurra): $f = \mu m g = 0{,}2 \times 1 \times 10 = 2\ \text{N}$.

**Energia dissipada = energia inicial:**

$$f\,d = 8 \quad\Rightarrow\quad d = \frac{8}{2} = 4\ \text{m}$$
:::

:::solved_exercise Tração na parte mais baixa de um pêndulo
Um pêndulo de comprimento $L = 1\ \text{m}$ e massa $0{,}5\ \text{kg}$ é solto do repouso com o fio na horizontal. Desprezando a resistência do ar ($g = 10\ \text{m/s}^2$), determine a velocidade e a tração no fio no ponto mais baixo.
---resolution---
**1. Energia** (a massa desce uma altura igual a $L$):

$$m g L = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = 2 g L = 2 \times 10 \times 1 = 20 \quad\Rightarrow\quad v = \sqrt{20} \approx 4{,}5\ \text{m/s}$$

**2. Dinâmica do movimento circular** no ponto mais baixo: a resultante (tração menos peso) é a força centrípeta.

$$T - m g = \frac{m v^2}{L} \quad\Rightarrow\quad T = 0{,}5 \times 10 + \frac{0{,}5 \times 20}{1} = 5 + 10 = 15\ \text{N}$$

A tração é o triplo do peso ($3mg$), um resultado que vale para qualquer pêndulo solto com o fio na horizontal.
:::

:::solved_exercise Escorregador real
Uma criança de $30\ \text{kg}$ parte do repouso no alto de um escorregador de $4\ \text{m}$ de altura e chega embaixo a $6\ \text{m/s}$ ($g = 10\ \text{m/s}^2$). Calcule a energia dissipada e a porcentagem da energia inicial que se transformou em energia cinética.
---resolution---
$$E_{m,i} = 30 \times 10 \times 4 = 1\,200\ \text{J} \qquad E_{m,f} = \frac{30 \times 6^2}{2} = 540\ \text{J}$$

$$E_{\text{dis}} = 1\,200 - 540 = 660\ \text{J} \qquad \frac{540}{1\,200} = 0{,}45 = 45\%$$

Só 45% da energia potencial virou energia cinética; os outros 55% foram dissipados (atrito com o escorregador e resistência do ar).
:::

:::solved_exercise A direção do lançamento não importa
Do alto de um prédio de $15\ \text{m}$, uma pedra é lançada com velocidade de $10\ \text{m/s}$. Desprezando a resistência do ar ($g = 10\ \text{m/s}^2$), com que velocidade ela chega ao solo se for lançada: a) para cima; b) na horizontal; c) para baixo?
---resolution---
A energia cinética é escalar: não depende da direção da velocidade. Pela conservação da energia, com referência no solo:

$$\frac{m v_0^2}{2} + m g h = \frac{m v^2}{2} \quad\Rightarrow\quad v^2 = v_0^2 + 2 g h = 100 + 2 \times 10 \times 15 = 400$$

$$v = 20\ \text{m/s}$$

**Nos três casos** a pedra chega com $20\ \text{m/s}$. O que muda é o tempo de queda e a direção da velocidade ao chegar, não o seu módulo.
:::

:::solved_exercise Bloco caindo sobre uma mola
Um bloco de $2\ \text{kg}$ é solto do repouso a $0{,}9\ \text{m}$ acima do topo de uma mola vertical de constante $k = 4\,000\ \text{N/m}$. Desprezando atritos ($g = 10\ \text{m/s}^2$), qual é a compressão máxima da mola?
---resolution---
**Estados:** início (repouso, $0{,}9\ \text{m}$ acima da mola) e compressão máxima $x$ (repouso de novo). Escolha como referência o ponto de compressão máxima: o bloco desce, no total, $0{,}9 + x$.

$$m g (0{,}9 + x) = \frac{k x^2}{2}$$

$$20\,(0{,}9 + x) = 2\,000\,x^2 \quad\Rightarrow\quad 2\,000\,x^2 - 20\,x - 18 = 0$$

**Fórmula de Bhaskara:**

$$x = \frac{20 \pm \sqrt{20^2 + 4 \times 2\,000 \times 18}}{2 \times 2\,000} = \frac{20 \pm \sqrt{400 + 144\,000}}{4\,000} = \frac{20 \pm 380}{4\,000}$$

A raiz positiva é $x = \dfrac{400}{4\,000} = 0{,}1\ \text{m}$ (a negativa não tem sentido físico).

**Resposta:** a compressão máxima é $10\ \text{cm}$. Erro comum: esquecer que, enquanto comprime a mola, o bloco ainda desce a distância $x$ e continua perdendo energia potencial.
:::

:::curiosity Energia é a mesma ideia em toda a ciência
O joule que mede a energia cinética de um carro é o mesmo joule que aparece na conta de luz (em kWh: $1\ \text{kWh} = 3{,}6 \times 10^6\ \text{J}$) e na tabela nutricional dos alimentos (em kcal: $1\ \text{kcal} \approx 4\,184\ \text{J}$). Essa unidade comum existe porque todas essas formas de energia podem se converter umas nas outras, e a quantidade total é sempre conservada.
:::

:::text
## Checklist antes de entregar a prova

- As unidades estão no SI? (g → kg, cm → m, km/h → m/s)
- Elevei a velocidade e a deformação ao quadrado?
- Usei o **desnível** para o peso e a **distância percorrida** para o atrito?
- Considerei a energia cinética inicial, se o corpo já estava em movimento?
- O sinal do trabalho faz sentido (atrito sempre negativo; peso positivo na descida)?
- A resposta é fisicamente razoável? (velocidade final maior que a inicial num sistema dissipativo sem desnível indica erro.)
:::
