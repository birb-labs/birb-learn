---
title: Leis de Kepler
---

:::text
## Do céu antigo às órbitas elípticas

Por muitos séculos prevaleceu o **modelo geocêntrico**: a Terra parada no centro do Universo e os astros girando ao seu redor. A versão mais elaborada desse modelo foi sistematizada por Cláudio Ptolomeu no século II, em uma obra conhecida como *Almagesto*.

Em 1543, Nicolau Copérnico publicou *De revolutionibus orbium coelestium*, propondo o **modelo heliocêntrico**: o Sol no centro e os planetas, incluindo a Terra, girando ao seu redor. Copérnico, porém, ainda usava órbitas **circulares**, e as previsões continuavam imprecisas.

O passo seguinte veio de dados muito melhores. O astrônomo dinamarquês **Tycho Brahe** passou décadas medindo a posição dos planetas a olho nu (o telescópio ainda não era usado em astronomia) com uma precisão inédita. Seu assistente, o alemão **Johannes Kepler**, herdou esses dados e passou anos tentando explicar a órbita de Marte. Ao abandonar a ideia de círculos, Kepler encontrou três leis que descrevem o movimento dos planetas:

- a **1ª e a 2ª leis** foram publicadas em 1609, no livro *Astronomia Nova*;
- a **3ª lei** foi publicada em 1619, no livro *Harmonices Mundi*.

As leis de Kepler são **descritivas**: dizem **como** os planetas se movem, mas não **por quê**. A explicação veio décadas depois, com a gravitação universal de Newton (próxima lição).
:::

:::text
## Um pouco de geometria: a elipse

Uma **elipse** é o conjunto dos pontos de um plano cuja **soma das distâncias a dois pontos fixos**, os **focos** ($F_1$ e $F_2$), é constante. Seus elementos principais:

- **semieixo maior** $a$: metade do maior diâmetro da elipse;
- **semieixo menor** $b$: metade do menor diâmetro;
- **semidistância focal** $c$: distância do centro da elipse a cada foco;
- relação entre eles: $a^2 = b^2 + c^2$;
- **excentricidade**: $e = \dfrac{c}{a}$, com $0 \le e < 1$.

A excentricidade mede o quanto a elipse é "achatada": $e = 0$ é uma circunferência (os dois focos coincidem no centro); quanto mais perto de 1, mais alongada é a elipse.
:::

:::text
## 1ª lei: lei das órbitas

> **Cada planeta descreve uma órbita elíptica em torno do Sol, e o Sol ocupa um dos focos da elipse.**

Consequências:

- A distância entre o planeta e o Sol **varia** ao longo da órbita.
- O ponto mais próximo do Sol é o **periélio**, a uma distância $r_p = a - c = a(1 - e)$.
- O ponto mais afastado é o **afélio**, a uma distância $r_a = a + c = a(1 + e)$.
- Somando: $r_p + r_a = 2a$. O semieixo maior é a **média** entre as distâncias de periélio e de afélio, por isso ele também é chamado de **raio médio** da órbita.

As órbitas dos planetas são elipses **pouco excêntricas**, quase circulares. A da Terra tem excentricidade de cerca de $0{,}017$: no periélio (no início de janeiro) a Terra fica a cerca de $147{,}1$ milhões de km do Sol, e no afélio (no início de julho), a cerca de $152{,}1$ milhões de km. Já os cometas podem ter órbitas muito alongadas: o cometa Halley tem excentricidade de aproximadamente $0{,}967$.

**Cuidado com um erro clássico:** as **estações do ano não são causadas** pela variação da distância ao Sol. Repare que a Terra está mais perto do Sol justamente em janeiro, verão no hemisfério sul e inverno no norte. As estações se devem à **inclinação do eixo de rotação** da Terra.

Desenhos de livros costumam exagerar o achatamento das órbitas planetárias para que a forma elíptica fique visível.
:::

:::text
## 2ª lei: lei das áreas

> **O segmento de reta que liga o Sol ao planeta varre áreas iguais em intervalos de tempo iguais.**

Imagine uma linha imaginária ligando o Sol ao planeta. Se em um mês ela "pinta" uma certa área perto do periélio, em qualquer outro mês ela pintará exatamente a mesma área, mesmo perto do afélio. Como perto do periélio o planeta está mais próximo do Sol, ele precisa percorrer um arco **maior** no mesmo tempo para varrer a mesma área.

Consequências:

- O planeta é **mais rápido no periélio** e **mais lento no afélio**.
- Do afélio para o periélio, o movimento é **acelerado**; do periélio para o afélio, é **retardado**.
- No periélio e no afélio, a velocidade é perpendicular à linha Sol–planeta, e vale a relação:

$$r_p \, v_p = r_a \, v_a \qquad\Rightarrow\qquad \frac{v_p}{v_a} = \frac{r_a}{r_p}$$

A grandeza "área varrida por unidade de tempo" é constante e se chama **velocidade areolar**.
:::

:::text
## 3ª lei: lei dos períodos

> **O quadrado do período de revolução de um planeta é proporcional ao cubo do semieixo maior da sua órbita.**

$$\frac{T^2}{a^3} = K \qquad (\text{constante})$$

- $T$ é o **período de revolução** (o tempo de uma volta completa, o "ano" do planeta).
- $a$ é o **semieixo maior** (o raio médio da órbita; para órbitas circulares, o próprio raio).
- A constante $K$ é **a mesma para todos os corpos que orbitam o mesmo astro central**. Ela depende da massa do astro central, mas **não** da massa do planeta.

Consequência: **quanto mais longe do Sol, maior o período**, e cresce mais rápido do que a distância. Mercúrio dá uma volta em cerca de 88 dias; Netuno leva cerca de 165 anos.

**Uma escolha de unidades muito útil:** medindo $T$ em **anos terrestres** e $a$ em **unidades astronômicas** (1 UA ≈ 149,6 milhões de km, a distância média Terra–Sol), a Terra tem $T = 1$ e $a = 1$, então $K = 1$ e, para qualquer corpo que orbita o Sol:

$$T^2 = a^3$$

Para comparar dois corpos que orbitam o mesmo astro:

$$\frac{T_1^2}{a_1^3} = \frac{T_2^2}{a_2^3}$$

As três leis valem também para outros sistemas: luas em torno de Júpiter, a Lua e satélites artificiais em torno da Terra. Muda apenas o valor da constante $K$, que depende do astro central.
:::

:::simulator kepler-orbit {"eccentricity":0.5,"semiMajorAxis":1,"sectors":12}
Órbitas de Kepler
Mude a excentricidade e o semieixo maior e inicie a animação. As fatias coloridas são varridas em tempos iguais e têm áreas iguais (2ª lei): repare como o planeta acelera perto do periélio. O período segue a 3ª lei, T² = a³ (em anos e UA).
:::

:::solved_exercise A excentricidade da órbita da Terra
A Terra fica a cerca de $147{,}1 \times 10^6\ \text{km}$ do Sol no periélio e a $152{,}1 \times 10^6\ \text{km}$ no afélio. Determine o semieixo maior e a excentricidade da órbita.
---resolution---
**Semieixo maior** (média entre periélio e afélio):

$$a = \frac{r_p + r_a}{2} = \frac{147{,}1 + 152{,}1}{2} \times 10^6 = 149{,}6 \times 10^6\ \text{km}$$

**Semidistância focal:** $c = a - r_p = (149{,}6 - 147{,}1) \times 10^6 = 2{,}5 \times 10^6\ \text{km}$.

**Excentricidade:**

$$e = \frac{c}{a} = \frac{2{,}5}{149{,}6} \approx 0{,}017$$

Um valor muito pequeno: a órbita da Terra é quase uma circunferência.
:::

:::solved_exercise Velocidade no periélio e no afélio
Um cometa tem periélio a $1\ \text{UA}$ do Sol e afélio a $9\ \text{UA}$. Quantas vezes sua velocidade no periélio é maior que no afélio?
---resolution---
Pela 2ª lei, no periélio e no afélio vale $r_p v_p = r_a v_a$:

$$\frac{v_p}{v_a} = \frac{r_a}{r_p} = \frac{9}{1} = 9$$

O cometa é **9 vezes mais rápido** no periélio do que no afélio.
:::

:::solved_exercise Usando a 3ª lei no Sistema Solar
a) Um asteroide orbita o Sol com semieixo maior de $4\ \text{UA}$. Qual é o seu período?

b) O semieixo maior da órbita de Marte é de cerca de $1{,}52\ \text{UA}$. Estime o ano marciano.
---resolution---
Com $T$ em anos e $a$ em UA, vale $T^2 = a^3$ para qualquer corpo que orbita o Sol.

**a)**

$$T^2 = 4^3 = 64 \quad\Rightarrow\quad T = 8\ \text{anos}$$

**b)**

$$T^2 = 1{,}52^3 \approx 3{,}51 \quad\Rightarrow\quad T \approx \sqrt{3{,}51} \approx 1{,}87\ \text{ano}$$

Isso dá cerca de $1{,}87 \times 365 \approx 684$ dias, muito próximo do valor real do ano marciano (cerca de 687 dias). A pequena diferença vem do arredondamento de $a$.
:::

:::solved_exercise Dois satélites da Terra
Um satélite A gira em órbita circular de raio $R$ em torno da Terra com período $T$. Um satélite B gira em órbita circular de raio $4R$. Qual é o período de B em função de $T$?
---resolution---
Os dois orbitam a Terra, então a constante da 3ª lei é a mesma:

$$\frac{T_A^2}{R_A^3} = \frac{T_B^2}{R_B^3} \quad\Rightarrow\quad T_B^2 = T^2 \cdot \frac{(4R)^3}{R^3} = 64\,T^2 \quad\Rightarrow\quad T_B = 8\,T$$

O raio quadruplicou e o período ficou **8 vezes** maior.
:::

:::solved_exercise A órbita do cometa Halley
O cometa Halley tem período de cerca de $76$ anos e passa a cerca de $0{,}59\ \text{UA}$ do Sol no periélio. Estime o semieixo maior da órbita e a distância do afélio.
---resolution---
**Semieixo maior** pela 3ª lei ($T$ em anos, $a$ em UA):

$$a^3 = T^2 = 76^2 = 5\,776 \quad\Rightarrow\quad a = \sqrt[3]{5\,776} \approx 17{,}9\ \text{UA}$$

**Afélio**, usando $r_p + r_a = 2a$:

$$r_a = 2a - r_p \approx 2 \times 17{,}9 - 0{,}59 \approx 35{,}2\ \text{UA}$$

Isso é mais longe que a órbita de Netuno (cerca de 30 UA). Por isso o Halley passa décadas longe e só é visível da Terra perto do periélio.
:::

:::solved_exercise Áreas e tempos
Um planeta leva 20 dias para varrer uma área $A$ perto do periélio. Quanto tempo ele leva para varrer uma área $3A$ perto do afélio?
---resolution---
Pela 2ª lei, a área varrida é proporcional ao tempo, em **qualquer** parte da órbita (a velocidade areolar é constante):

$$\frac{A}{20\ \text{dias}} = \frac{3A}{t} \quad\Rightarrow\quad t = 60\ \text{dias}$$

A posição na órbita (periélio ou afélio) não muda a relação entre área e tempo.
:::

:::real_world_application Satélites geoestacionários
A 3ª lei vale para satélites artificiais em torno da Terra. Um satélite **geoestacionário** precisa dar uma volta em exatamente um dia sideral (cerca de 23 h 56 min, o tempo de uma rotação da Terra), girando no plano do Equador e no mesmo sentido da rotação. Assim ele fica parado em relação ao solo, e uma antena apontada para ele não precisa se mover. Esse período fixo determina o raio da órbita: cerca de $42\,000\ \text{km}$ a partir do centro da Terra, ou seja, uma altitude de aproximadamente $36\,000\ \text{km}$. Satélites de TV e de comunicação usam essa órbita.
:::

:::curiosity Oito minutos de arco
Kepler chegou a construir um modelo com órbita circular para Marte que concordava muito bem com os dados de Tycho, mas que, em algumas posições, errava por cerca de 8 minutos de arco (pouco mais de um oitavo de grau). Para a maioria dos astrônomos da época, a diferença seria desprezível. Kepler, porém, confiava na precisão das medidas de Tycho e decidiu que aquele pequeno erro não podia ser ignorado. Foi abandonando o círculo que ele chegou à elipse.
:::

:::text
## Resumo e erros comuns

- **1ª lei (órbitas):** órbitas elípticas com o Sol em um dos focos. $r_p = a - c$, $r_a = a + c$, $e = c/a$.
- **2ª lei (áreas):** áreas iguais em tempos iguais; mais rápido no periélio. $r_p v_p = r_a v_a$.
- **3ª lei (períodos):** $T^2/a^3 = K$, igual para todos os corpos do mesmo astro central. No Sistema Solar, com anos e UA: $T^2 = a^3$.

**Erros comuns:**

- Achar que o Sol fica no **centro** da elipse: ele fica em um **foco**.
- Achar que a velocidade do planeta é constante.
- Aplicar a mesma constante $K$ a corpos que orbitam astros diferentes (por exemplo, a Lua e Marte).
- Explicar as estações do ano pela distância ao Sol.
- Achar que a constante $K$ depende da massa do planeta.
:::
