:::question ec-01 multiple_choice easy energia-cinetica
Um corpo possui energia cinética quando:
---options---
- [x] está em movimento em relação ao referencial adotado.
- [ ] está a certa altura em relação ao solo.
- [ ] está preso a uma mola comprimida.
- [ ] tem massa, mesmo estando em repouso.
---resolution---
A energia cinética é a **energia do movimento**: $E_c = \dfrac{m v^2}{2}$. Se a velocidade em relação ao referencial é zero, $E_c = 0$, não importa a massa.

- Estar no alto corresponde a **energia potencial gravitacional**.
- Estar preso a uma mola comprimida corresponde a **energia potencial elástica**.
- Ter massa não basta: sem velocidade, não há energia cinética.

**Resposta:** está em movimento em relação ao referencial adotado.
:::

:::question ec-02 numeric easy energia-cinetica answer=50
Um corpo de massa $4\ \text{kg}$ se move com velocidade de $5\ \text{m/s}$. Qual é a sua energia cinética, em joules?
---resolution---
**Fórmula:** $E_c = \dfrac{m v^2}{2}$.

**Substituindo:**

$$E_c = \frac{4 \times 5^2}{2} = \frac{4 \times 25}{2} = \frac{100}{2} = 50\ \text{J}$$

**Resposta:** $50\ \text{J}$.
:::

:::question ec-03 multiple_choice easy energia-cinetica
Se a velocidade de um corpo dobra (e a massa não muda), a sua energia cinética:
---options---
- [ ] também dobra.
- [x] fica quatro vezes maior.
- [ ] fica oito vezes maior.
- [ ] não se altera.
---resolution---
A energia cinética é proporcional ao **quadrado** da velocidade:

$$\frac{E_{c,2}}{E_{c,1}} = \left(\frac{2v}{v}\right)^2 = 2^2 = 4$$

**Resposta:** fica quatro vezes maior. "Dobra" seria verdade se dobrássemos a **massa**, não a velocidade.
:::

:::question ec-04 numeric medium energia-cinetica answer=250
Um carro de $800\ \text{kg}$ trafega a $90\ \text{km/h}$. Qual é a sua energia cinética, em **quilojoules** (kJ)?
---resolution---
**1. Converter a velocidade para m/s:**

$$v = \frac{90}{3{,}6} = 25\ \text{m/s}$$

**2. Calcular a energia cinética:**

$$E_c = \frac{800 \times 25^2}{2} = \frac{800 \times 625}{2} = 250\,000\ \text{J}$$

**3. Converter para kJ:** $250\,000\ \text{J} = 250\ \text{kJ}$.

**Resposta:** $250\ \text{kJ}$. Erro comum: usar $90$ diretamente na fórmula, sem converter de km/h para m/s.
:::

:::question ec-05 true_false easy energia-cinetica answer=false
A energia cinética de um corpo é negativa quando ele se move no sentido negativo do eixo de referência.
---resolution---
**Falso.** Na fórmula $E_c = \dfrac{m v^2}{2}$, a velocidade aparece **ao quadrado**, e $v^2$ nunca é negativo. A massa também é positiva. Portanto $E_c \ge 0$ sempre, e o **sentido** do movimento não influencia a energia cinética. Um corpo a $-10\ \text{m/s}$ tem a mesma energia cinética que a $+10\ \text{m/s}$.
:::

:::question ec-06 multiple_choice medium energia-cinetica
O corpo A tem massa $m$ e velocidade $2v$. O corpo B tem massa $2m$ e velocidade $v$. A razão $\dfrac{E_{c,A}}{E_{c,B}}$ entre suas energias cinéticas é:
---options---
- [ ] $\dfrac{1}{2}$
- [ ] $1$
- [x] $2$
- [ ] $4$
---resolution---
$$E_{c,A} = \frac{m\,(2v)^2}{2} = \frac{4 m v^2}{2} = 2 m v^2 \qquad E_{c,B} = \frac{2m\,v^2}{2} = m v^2$$

$$\frac{E_{c,A}}{E_{c,B}} = \frac{2 m v^2}{m v^2} = 2$$

**Resposta:** $2$. O dobro da velocidade "vale" mais (fator 4) do que o dobro da massa (fator 2).
:::

:::question ec-07 numeric medium energia-cinetica answer=10
Uma bola de $0{,}2\ \text{kg}$ tem energia cinética de $10\ \text{J}$. Qual é a sua velocidade, em m/s?
---resolution---
**Isolando $v$:**

$$E_c = \frac{m v^2}{2} \quad\Rightarrow\quad v = \sqrt{\frac{2 E_c}{m}}$$

**Substituindo:**

$$v = \sqrt{\frac{2 \times 10}{0{,}2}} = \sqrt{\frac{20}{0{,}2}} = \sqrt{100} = 10\ \text{m/s}$$

**Resposta:** $10\ \text{m/s}$.
:::

:::question ec-08 multiple_choice easy energia-cinetica
Para um corpo de massa constante, o gráfico da energia cinética em função da velocidade é:
---options---
- [ ] uma reta que passa pela origem.
- [x] um arco de parábola que passa pela origem.
- [ ] uma hipérbole.
- [ ] uma reta horizontal.
---resolution---
Com $m$ constante, $E_c = \dfrac{m}{2} \cdot v^2$ é uma função do **segundo grau** em $v$, cujo gráfico é uma **parábola**. Como $E_c = 0$ quando $v = 0$, ela passa pela origem (e, como a velocidade é positiva, desenhamos só um arco).

Uma **reta** pela origem seria o gráfico de $E_c$ em função da **massa**, com $v$ constante.

**Resposta:** um arco de parábola que passa pela origem.
:::

:::question ec-09 numeric medium energia-cinetica answer=8
Um bloco de $2\ \text{kg}$, inicialmente em repouso, sofre a ação de uma força resultante constante de $16\ \text{N}$ ao longo de $4\ \text{m}$, na direção e no sentido do deslocamento. Qual é a velocidade final do bloco, em m/s?
---resolution---
**1. Trabalho da força resultante:**

$$W_{\text{total}} = F_R \cdot d = 16 \times 4 = 64\ \text{J}$$

**2. Teorema da energia cinética** ($E_{c,i} = 0$, pois parte do repouso):

$$W_{\text{total}} = \frac{m v_f^2}{2} - 0 \quad\Rightarrow\quad 64 = \frac{2 \times v_f^2}{2} = v_f^2$$

$$v_f = \sqrt{64} = 8\ \text{m/s}$$

**Resposta:** $8\ \text{m/s}$.
:::

:::question ec-10 numeric medium energia-cinetica answer=6000
Um carro de $1\,200\ \text{kg}$, a $20\ \text{m/s}$, freia e para depois de percorrer $40\ \text{m}$. Qual é a intensidade da força média de frenagem, em newtons?
---resolution---
**1. Energia cinética inicial:**

$$E_{c,i} = \frac{1\,200 \times 20^2}{2} = \frac{1\,200 \times 400}{2} = 240\,000\ \text{J}$$

**2. Teorema da energia cinética:** o carro para ($E_{c,f} = 0$), e a força de frenagem $F$ se opõe ao movimento ($W = -F d$):

$$-F \times 40 = 0 - 240\,000 \quad\Rightarrow\quad F = \frac{240\,000}{40} = 6\,000\ \text{N}$$

**Resposta:** $6\,000\ \text{N}$.
:::

:::question ec-11 multiple_choice hard energia-cinetica
Um carro freia com força de atrito constante e para depois de percorrer uma distância $d$. Se a velocidade inicial fosse três vezes maior, com a mesma força de frenagem, a distância até parar seria:
---options---
- [ ] $3d$
- [ ] $6d$
- [x] $9d$
- [ ] $27d$
---resolution---
Pelo teorema da energia cinética, toda a energia cinética é retirada pelo trabalho do atrito:

$$f \cdot d = \frac{m v_0^2}{2} \quad\Rightarrow\quad d = \frac{m v_0^2}{2 f}$$

Com $m$ e $f$ fixos, $d \propto v_0^2$. Triplicando a velocidade:

$$\frac{d'}{d} = \left(\frac{3 v_0}{v_0}\right)^2 = 9$$

**Resposta:** $9d$.
:::

:::question ec-12 numeric medium energia-cinetica answer=150
Qual é o trabalho total, em **quilojoules**, necessário para acelerar um carro de $1\,000\ \text{kg}$ de $10\ \text{m/s}$ para $20\ \text{m/s}$?
---resolution---
Pelo teorema da energia cinética, $W_{\text{total}} = \Delta E_c$:

$$W = \frac{m v_f^2}{2} - \frac{m v_i^2}{2} = \frac{1\,000 \times 400}{2} - \frac{1\,000 \times 100}{2} = 200\,000 - 50\,000 = 150\,000\ \text{J}$$

$150\,000\ \text{J} = 150\ \text{kJ}$.

**Resposta:** $150\ \text{kJ}$. Erro comum: calcular $\dfrac{m (v_f - v_i)^2}{2} = 50\ \text{kJ}$. O correto é a **diferença dos quadrados**, não o quadrado da diferença.
:::

:::question ec-13 multiple_choice medium energia-cinetica
Um corpo realiza movimento circular uniforme. Sobre o trabalho da força resultante (centrípeta) e a energia cinética do corpo, é correto afirmar:
---options---
- [ ] O trabalho é positivo e a energia cinética aumenta.
- [ ] O trabalho é negativo e a energia cinética diminui.
- [x] O trabalho é nulo e a energia cinética permanece constante.
- [ ] O trabalho é nulo, mas a energia cinética varia.
---resolution---
A força centrípeta é sempre **perpendicular** à velocidade ($\theta = 90°$), então:

$$W = F\,d\cos 90° = 0$$

Pelo teorema da energia cinética, $\Delta E_c = W_{\text{total}} = 0$: o **módulo** da velocidade não muda (é por isso que o movimento é *uniforme*). A força centrípeta muda só a **direção** da velocidade.

**Resposta:** O trabalho é nulo e a energia cinética permanece constante.
:::

:::question ec-14 true_false medium energia-cinetica answer=true
Se um corpo se move com velocidade de módulo constante, o trabalho total realizado sobre ele (a soma dos trabalhos de todas as forças) é nulo.
---resolution---
**Verdadeiro.** Pelo teorema da energia cinética, $W_{\text{total}} = \Delta E_c$. Se o módulo da velocidade é constante, $E_c$ não varia e $\Delta E_c = 0$, então $W_{\text{total}} = 0$.

Isso **não** significa que nenhuma força realiza trabalho: pode haver forças realizando trabalho positivo e outras realizando trabalho negativo que se cancelam (por exemplo, um bloco puxado com velocidade constante contra o atrito).
:::

:::question ec-15 numeric hard energia-cinetica answer=6
Um bloco de $2\ \text{kg}$ desliza sobre um piso horizontal com velocidade inicial de $6\ \text{m/s}$. O coeficiente de atrito cinético entre o bloco e o piso é $0{,}3$. Adote $g = 10\ \text{m/s}^2$. Que distância, em metros, o bloco percorre até parar?
---resolution---
**1. Força de atrito:**

$$f = \mu\,m\,g = 0{,}3 \times 2 \times 10 = 6\ \text{N}$$

**2. Energia cinética inicial:**

$$E_{c,i} = \frac{2 \times 6^2}{2} = 36\ \text{J}$$

**3. Teorema da energia cinética** (só o atrito realiza trabalho na horizontal):

$$-f\,d = 0 - E_{c,i} \quad\Rightarrow\quad d = \frac{36}{6} = 6\ \text{m}$$

**Conferindo com a fórmula** $d = \dfrac{v_0^2}{2\mu g} = \dfrac{36}{2 \times 0{,}3 \times 10} = \dfrac{36}{6} = 6\ \text{m}$.

**Resposta:** $6\ \text{m}$.
:::

:::question ec-16 multiple_choice hard energia-cinetica
Um corpo de $2\ \text{kg}$, em repouso sobre uma superfície horizontal sem atrito, recebe uma força horizontal que **cresce linearmente** de $0$ (em $x = 0$) até $20\ \text{N}$ (em $x = 4\ \text{m}$). A velocidade do corpo em $x = 4\ \text{m}$ é:
---options---
- [ ] $4\ \text{m/s}$
- [x] $\sqrt{40}\ \text{m/s} \approx 6{,}3\ \text{m/s}$
- [ ] $\sqrt{80}\ \text{m/s} \approx 8{,}9\ \text{m/s}$
- [ ] $40\ \text{m/s}$
---resolution---
**1. Trabalho de uma força variável = área sob o gráfico $F \times x$.** O gráfico é um triângulo de base $4\ \text{m}$ e altura $20\ \text{N}$:

$$W = \frac{4 \times 20}{2} = 40\ \text{J}$$

**2. Teorema da energia cinética** (parte do repouso, sem atrito):

$$40 = \frac{2\,v^2}{2} = v^2 \quad\Rightarrow\quad v = \sqrt{40} \approx 6{,}3\ \text{m/s}$$

O valor $\sqrt{80}$ aparece se usarmos $W = F \cdot d = 20 \times 4 = 80\ \text{J}$, o que está errado: a força não vale $20\ \text{N}$ durante todo o percurso.

**Resposta:** $\sqrt{40}\ \text{m/s} \approx 6{,}3\ \text{m/s}$.
:::

:::question ec-17 multiple_response medium energia-cinetica
Marque **todas** as afirmações corretas sobre a energia cinética.
---options---
- [x] É uma grandeza escalar.
- [x] Seu valor depende do referencial adotado.
- [ ] É diretamente proporcional à velocidade.
- [x] No SI, é medida em joules.
- [ ] Pode assumir valores negativos.
---resolution---
- **É escalar:** correta. Energia não tem direção nem sentido.
- **Depende do referencial:** correta. A velocidade é medida em relação a um referencial; um passageiro parado dentro de um ônibus tem $E_c = 0$ em relação ao ônibus, mas não em relação à rua.
- **Proporcional à velocidade:** incorreta. É proporcional ao **quadrado** da velocidade.
- **Medida em joules:** correta. $1\ \text{J} = 1\ \text{kg}\cdot\text{m}^2/\text{s}^2$.
- **Pode ser negativa:** incorreta. $m > 0$ e $v^2 \ge 0$, então $E_c \ge 0$.
:::

:::question ec-18 numeric hard energia-cinetica answer=6000
Um projétil de $20\ \text{g}$, a $300\ \text{m/s}$, penetra $15\ \text{cm}$ em um bloco de madeira até parar. Qual é a intensidade da força média de resistência da madeira, em newtons?
---resolution---
**1. Unidades no SI:** $m = 20\ \text{g} = 0{,}02\ \text{kg}$; $d = 15\ \text{cm} = 0{,}15\ \text{m}$.

**2. Energia cinética inicial:**

$$E_{c,i} = \frac{0{,}02 \times 300^2}{2} = \frac{0{,}02 \times 90\,000}{2} = 900\ \text{J}$$

**3. Teorema da energia cinética:** a força média $F$ se opõe ao movimento:

$$-F \times 0{,}15 = 0 - 900 \quad\Rightarrow\quad F = \frac{900}{0{,}15} = 6\,000\ \text{N}$$

**Resposta:** $6\,000\ \text{N}$.
:::

:::question ec-19 multiple_choice medium energia-cinetica
Uma pessoa levanta uma caixa do chão até uma prateleira com **velocidade constante**. Sobre os trabalhos realizados durante a subida, é correto afirmar:
---options---
- [ ] O trabalho da pessoa é nulo, pois a velocidade é constante.
- [ ] O trabalho do peso é positivo.
- [x] O trabalho total sobre a caixa é nulo, pois o trabalho da pessoa é positivo e o do peso é negativo, de mesmo valor absoluto.
- [ ] O trabalho total sobre a caixa é positivo e igual ao aumento da energia cinética.
---resolution---
Com velocidade constante, $\Delta E_c = 0$; pelo teorema da energia cinética, $W_{\text{total}} = 0$.

- A pessoa puxa para cima e a caixa sobe: trabalho **positivo**, $W_{\text{pessoa}} = +m g h$.
- O peso aponta para baixo e a caixa sobe: trabalho **negativo**, $W_P = -m g h$.
- Total: $m g h - m g h = 0$.

O trabalho da pessoa não é zero: ele é armazenado como energia potencial gravitacional da caixa.

**Resposta:** O trabalho total sobre a caixa é nulo, pois o trabalho da pessoa é positivo e o do peso é negativo, de mesmo valor absoluto.
:::

:::question ec-20 matching easy energia-cinetica
Associe cada mudança (a partir de um corpo com energia cinética $E_c$) ao efeito sobre a energia cinética.
---pairs---
- Dobrar a massa, mantendo a velocidade ||| A energia cinética dobra
- Dobrar a velocidade, mantendo a massa ||| A energia cinética fica 4 vezes maior
- Reduzir a velocidade à metade ||| A energia cinética cai para um quarto
- Triplicar a velocidade ||| A energia cinética fica 9 vezes maior
---resolution---
Use $E_c = \dfrac{m v^2}{2}$:

- $E_c$ é proporcional a $m$: dobrar a massa **dobra** a energia.
- $E_c$ é proporcional a $v^2$:
  - velocidade $\times 2$ → energia $\times 2^2 = \times 4$;
  - velocidade $\times \frac{1}{2}$ → energia $\times \frac{1}{4}$;
  - velocidade $\times 3$ → energia $\times 3^2 = \times 9$.
:::
