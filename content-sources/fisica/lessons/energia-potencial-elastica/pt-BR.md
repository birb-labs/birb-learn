---
title: Energia Potencial Elástica
---

:::text
## Molas e corpos elásticos

Um corpo é **elástico** quando, depois de deformado (esticado, comprimido, torcido), volta à forma original ao ser solto. Molas, elásticos de borracha, cordas de arco e camas elásticas são exemplos. Enquanto estão deformados, esses corpos **armazenam energia**, que é devolvida quando eles voltam à forma natural: é a **energia potencial elástica**.

Para estudá-la, precisamos primeiro da força que uma mola exerce.

## Lei de Hooke

Uma mola tem um **comprimento natural** (sem deformação). Se a esticamos ou comprimimos por uma distância $x$ (a **deformação**), ela reage com uma força que:

- tem módulo **proporcional à deformação**;
- aponta sempre **contra a deformação**, tentando devolver a mola ao comprimento natural (por isso é chamada de **força restauradora**).

$$F_{el} = k\,x \qquad \text{(em módulo)}$$

Considerando o sentido, costuma-se escrever $F_{el} = -k\,x$: o sinal negativo indica que a força é oposta à deformação.

A constante $k$ é a **constante elástica** da mola, medida em **N/m**. Ela mede a "dureza" da mola: quanto maior $k$, mais força é preciso fazer para deformá-la. Uma mola com $k = 200\ \text{N/m}$ precisa de $200\ \text{N}$ para ser deformada em $1\ \text{m}$, ou de $2\ \text{N}$ para ser deformada em $1\ \text{cm}$.

A lei de Hooke vale enquanto a mola está dentro do seu **limite de elasticidade**. Se a deformação for grande demais, a mola fica permanentemente deformada e a lei deixa de valer.
:::

:::text
## A energia armazenada

A força elástica é **variável**: começa em zero (mola relaxada) e cresce linearmente até $k\,x$. O trabalho para deformar a mola é a **área sob o gráfico** $F \times x$, que é um triângulo de base $x$ e altura $k\,x$:

$$W = \frac{x \cdot k\,x}{2} = \frac{k\,x^2}{2}$$

Essa é a energia que fica armazenada na mola deformada:

$$E_{pel} = \frac{k\,x^2}{2}$$

| Símbolo | Grandeza | Unidade no SI |
|---|---|---|
| $E_{pel}$ | energia potencial elástica | joule (J) |
| $k$ | constante elástica | N/m |
| $x$ | deformação (em relação ao comprimento natural) | m |

**Propriedades:**

- $E_{pel} \ge 0$ sempre: como $x$ aparece ao quadrado, esticar ou comprimir pela mesma distância armazena a mesma energia.
- $E_{pel}$ é proporcional a $k$ e ao **quadrado** da deformação: dobrar a deformação **quadruplica** a energia.
- Aqui o "nível de referência" não é arbitrário: $E_{pel} = 0$ na mola relaxada.
- A força elástica é **conservativa**: $W_{el} = E_{pel,i} - E_{pel,f}$.

**Cuidado:** $x$ é a **deformação**, não o comprimento da mola. Se uma mola de 20 cm passa a ter 25 cm, a deformação é $x = 5\ \text{cm} = 0{,}05\ \text{m}$.
:::

:::simulator spring-energy {"k":200,"x":0.1,"maxK":1000,"maxX":0.3}
Mola, força e energia
Mude a constante elástica e a deformação (valores negativos comprimem a mola). No gráfico, a reta é a lei de Hooke e a área do triângulo sombreado é a energia armazenada.
:::

:::solved_exercise Força e energia de uma mola esticada
Uma mola de constante elástica $k = 400\ \text{N/m}$ é esticada $5\ \text{cm}$. Determine a força elástica e a energia potencial elástica armazenada.
---resolution---
**Converter:** $x = 5\ \text{cm} = 0{,}05\ \text{m}$.

**Força (lei de Hooke):**

$$F = k\,x = 400 \times 0{,}05 = 20\ \text{N}$$

**Energia:**

$$E_{pel} = \frac{k x^2}{2} = \frac{400 \times 0{,}05^2}{2} = \frac{400 \times 0{,}0025}{2} = 0{,}5\ \text{J}$$
:::

:::solved_exercise Descobrindo a constante elástica
Um corpo de $2\ \text{kg}$ é pendurado em uma mola vertical, que se estica $10\ \text{cm}$ até o corpo ficar em equilíbrio. Adote $g = 10\ \text{m/s}^2$. Determine a constante elástica da mola e a energia elástica armazenada no equilíbrio.
---resolution---
**1. Equilíbrio:** a força elástica equilibra o peso.

$$k\,x = m\,g \quad\Rightarrow\quad k = \frac{m g}{x} = \frac{2 \times 10}{0{,}1} = 200\ \text{N/m}$$

**2. Energia armazenada:**

$$E_{pel} = \frac{200 \times 0{,}1^2}{2} = \frac{200 \times 0{,}01}{2} = 1\ \text{J}$$
:::

:::solved_exercise Lendo o gráfico força × deformação
O gráfico da força elástica de uma mola em função da deformação é uma reta que passa pela origem e pelo ponto $(0{,}15\ \text{m};\ 30\ \text{N})$. Determine a constante elástica e a energia armazenada quando a deformação é $0{,}15\ \text{m}$.
---resolution---
**Constante elástica** (inclinação da reta):

$$k = \frac{F}{x} = \frac{30}{0{,}15} = 200\ \text{N/m}$$

**Energia = área do triângulo** sob o gráfico, de $0$ a $0{,}15\ \text{m}$:

$$E_{pel} = \frac{\text{base} \times \text{altura}}{2} = \frac{0{,}15 \times 30}{2} = 2{,}25\ \text{J}$$

Conferindo com a fórmula: $\dfrac{200 \times 0{,}15^2}{2} = \dfrac{200 \times 0{,}0225}{2} = 2{,}25\ \text{J}$.
:::

:::solved_exercise Lançador de mola
Um brinquedo lança bolinhas de $0{,}1\ \text{kg}$ usando uma mola de constante $k = 800\ \text{N/m}$, comprimida $10\ \text{cm}$. Desprezando atritos e supondo que toda a energia da mola passa para a bolinha (lançada na horizontal), qual é a velocidade de lançamento?
---resolution---
**Energia armazenada na mola:**

$$E_{pel} = \frac{800 \times 0{,}1^2}{2} = \frac{800 \times 0{,}01}{2} = 4\ \text{J}$$

**Toda essa energia vira energia cinética da bolinha:**

$$\frac{m v^2}{2} = 4 \quad\Rightarrow\quad v^2 = \frac{2 \times 4}{0{,}1} = 80 \quad\Rightarrow\quad v = \sqrt{80} \approx 8{,}9\ \text{m/s}$$
:::

:::solved_exercise Triplicando a deformação
Uma mola armazena $0{,}2\ \text{J}$ quando deformada $2\ \text{cm}$. Quanta energia ela armazena quando deformada $6\ \text{cm}$?
---resolution---
A constante $k$ é a mesma, e a energia é proporcional a $x^2$:

$$\frac{E_2}{E_1} = \left(\frac{x_2}{x_1}\right)^2 = \left(\frac{6}{2}\right)^2 = 9 \quad\Rightarrow\quad E_2 = 9 \times 0{,}2 = 1{,}8\ \text{J}$$

A deformação triplicou e a energia ficou **9 vezes** maior.
:::

:::real_world_application Do arco e flecha à suspensão do carro
No arco e flecha, o arqueiro realiza trabalho ao puxar a corda, e essa energia fica armazenada como energia potencial elástica no arco curvado; ao soltar, ela vira energia cinética da flecha. Na cama elástica, a lona esticada devolve energia ao saltador. Na suspensão dos carros, as molas armazenam energia quando a roda passa por um buraco e a devolvem logo depois; os amortecedores dissipam parte dessa energia para o carro não ficar balançando.
:::

:::curiosity "Como a extensão, assim a força"
O inglês Robert Hooke publicou a relação entre força e deformação em 1678 resumida em latim como *ut tensio, sic vis*, que significa "como a extensão, assim a força". Ou seja: a força é proporcional à deformação. Antes disso, ele havia anunciado a descoberta na forma de um anagrama (uma sequência embaralhada de letras), um costume da época para garantir a prioridade de uma ideia sem revelá-la de imediato.
:::

:::text
## Resumo e erros comuns

- Lei de Hooke: $F = k\,x$ (força restauradora, oposta à deformação).
- $E_{pel} = \dfrac{k x^2}{2}$ = área sob o gráfico $F \times x$.
- $E_{pel} \propto x^2$: dobrar a deformação quadruplica a energia.
- A força elástica é conservativa: $W_{el} = E_{pel,i} - E_{pel,f}$.

**Erros comuns:**

- Usar o comprimento total da mola em vez da deformação.
- Esquecer de converter cm para m (lembre: $x$ ao quadrado amplifica o erro: $5^2 = 25$, mas $0{,}05^2 = 0{,}0025$).
- Escrever $E_{pel} = k x$ (essa é a força, não a energia) ou esquecer o fator $\frac{1}{2}$.
:::
