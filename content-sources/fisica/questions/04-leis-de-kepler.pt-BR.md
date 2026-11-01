:::question kp-01 multiple_choice easy leis-de-kepler
Segundo a 1ª lei de Kepler, as órbitas dos planetas em torno do Sol são:
---options---
- [ ] circunferências, com o Sol no centro.
- [x] elipses, com o Sol ocupando um dos focos.
- [ ] elipses, com o Sol no centro.
- [ ] parábolas, com o Sol no vértice.
---resolution---
**1ª lei de Kepler (lei das órbitas):** cada planeta descreve uma órbita **elíptica** em torno do Sol, e o Sol ocupa **um dos focos** da elipse (não o centro). Por isso a distância entre o planeta e o Sol varia ao longo da órbita.

**Resposta:** elipses, com o Sol ocupando um dos focos.
:::

:::question kp-02 multiple_choice easy leis-de-kepler
Em que ponto da órbita um planeta se move com **maior** velocidade?
---options---
- [x] No periélio (ponto mais próximo do Sol).
- [ ] No afélio (ponto mais distante do Sol).
- [ ] A velocidade é a mesma em todos os pontos.
- [ ] Nos pontos a meio caminho entre o periélio e o afélio.
---resolution---
Pela **2ª lei de Kepler**, a linha Sol–planeta varre áreas iguais em tempos iguais. Perto do Sol, essa linha é mais curta, então o planeta precisa percorrer um arco **maior** no mesmo tempo para varrer a mesma área: ele é **mais rápido no periélio** e mais lento no afélio.

**Resposta:** No periélio (ponto mais próximo do Sol).
:::

:::question kp-03 true_false easy leis-de-kepler answer=false
As estações do ano são causadas principalmente pela variação da distância entre a Terra e o Sol ao longo da órbita.
---resolution---
**Falso.** A órbita da Terra é quase circular (excentricidade de cerca de 0,017), e a Terra está **mais perto** do Sol no início de janeiro, quando é verão no hemisfério sul, mas inverno no hemisfério norte. Se a distância fosse a causa, os dois hemisférios teriam a mesma estação ao mesmo tempo. As estações são causadas pela **inclinação do eixo de rotação** da Terra.
:::

:::question kp-04 numeric medium leis-de-kepler answer=27
Um asteroide orbita o Sol com semieixo maior de $9\ \text{UA}$. Usando a 3ª lei de Kepler na forma $T^2 = a^3$ (com $T$ em anos terrestres e $a$ em unidades astronômicas), qual é o período do asteroide, em anos?
---resolution---
$$T^2 = a^3 = 9^3 = 729 \quad\Rightarrow\quad T = \sqrt{729} = 27\ \text{anos}$$

**Outra forma:** $T = a^{3/2} = (\sqrt{9})^3 = 3^3 = 27$.

**Resposta:** $27$ anos.
:::

:::question kp-05 numeric medium leis-de-kepler answer=4
Um cometa leva $8$ anos para dar uma volta completa em torno do Sol. Usando $T^2 = a^3$ ($T$ em anos e $a$ em UA), qual é o semieixo maior da sua órbita, em UA?
---resolution---
$$a^3 = T^2 = 8^2 = 64 \quad\Rightarrow\quad a = \sqrt[3]{64} = 4\ \text{UA}$$

**Resposta:** $4\ \text{UA}$.
:::

:::question kp-06 multiple_choice medium leis-de-kepler
Um satélite A descreve uma órbita circular de raio $R$ em torno da Terra, com período $T$. Um satélite B descreve uma órbita circular de raio $4R$ em torno da Terra. O período de B é:
---options---
- [ ] $2T$
- [ ] $4T$
- [x] $8T$
- [ ] $16T$
---resolution---
Os dois orbitam a **mesma** Terra, então a razão $\dfrac{T^2}{R^3}$ é a mesma para ambos:

$$\frac{T_B^2}{(4R)^3} = \frac{T^2}{R^3} \quad\Rightarrow\quad T_B^2 = 64\,T^2 \quad\Rightarrow\quad T_B = 8T$$

**Resposta:** $8T$.
:::

:::question kp-07 numeric medium leis-de-kepler answer=3
Um planeta está a $2\ \text{UA}$ do Sol no periélio e a $6\ \text{UA}$ no afélio. Quantas vezes a sua velocidade no periélio é maior que a velocidade no afélio?
---resolution---
Pela 2ª lei de Kepler, no periélio e no afélio (onde a velocidade é perpendicular à linha Sol–planeta) vale:

$$r_p\,v_p = r_a\,v_a \quad\Rightarrow\quad \frac{v_p}{v_a} = \frac{r_a}{r_p} = \frac{6}{2} = 3$$

**Resposta:** $3$ vezes.
:::

:::question kp-08 multiple_choice easy leis-de-kepler
A 2ª lei de Kepler afirma que:
---options---
- [ ] o quadrado do período é proporcional ao cubo do semieixo maior.
- [x] o segmento que liga o Sol ao planeta varre áreas iguais em intervalos de tempo iguais.
- [ ] a velocidade do planeta é constante ao longo da órbita.
- [ ] todos os planetas têm o mesmo período.
---resolution---
**2ª lei (lei das áreas):** a linha Sol–planeta varre **áreas iguais em tempos iguais**. Uma consequência é que a velocidade **não** é constante: o planeta é mais rápido no periélio.

A primeira alternativa é a **3ª lei**.

**Resposta:** o segmento que liga o Sol ao planeta varre áreas iguais em intervalos de tempo iguais.
:::

:::question kp-09 numeric hard leis-de-kepler answer=0.6
Um corpo orbita o Sol com periélio a $2\ \text{UA}$ e afélio a $8\ \text{UA}$. Qual é a excentricidade da órbita? (Responda com um número decimal.)
---resolution---
**1. Semieixo maior:**

$$a = \frac{r_p + r_a}{2} = \frac{2 + 8}{2} = 5\ \text{UA}$$

**2. Semidistância focal** (distância do centro da elipse ao foco, onde está o Sol):

$$c = a - r_p = 5 - 2 = 3\ \text{UA}$$

**3. Excentricidade:**

$$e = \frac{c}{a} = \frac{3}{5} = 0{,}6$$

**Resposta:** $0{,}6$.
:::

:::question kp-10 true_false medium leis-de-kepler answer=false
A constante $K = T^2/a^3$ da 3ª lei de Kepler tem o mesmo valor para a Lua (em órbita da Terra) e para Marte (em órbita do Sol).
---resolution---
**Falso.** A constante da 3ª lei é a mesma apenas para corpos que orbitam o **mesmo astro central**. Pela gravitação de Newton, $K = \dfrac{4\pi^2}{G M}$, em que $M$ é a massa do astro central. A Lua orbita a Terra e Marte orbita o Sol, que tem massa muito maior, então as constantes são diferentes.
:::

:::question kp-11 multiple_choice medium leis-de-kepler
Um planeta leva $30$ dias para varrer uma área $A$ (com a linha que o liga ao Sol) perto do periélio. Quanto tempo ele leva para varrer uma área $2A$ perto do afélio?
---options---
- [ ] $15$ dias
- [ ] $30$ dias
- [x] $60$ dias
- [ ] $120$ dias
---resolution---
Pela 2ª lei, a área varrida é **proporcional ao tempo** em qualquer parte da órbita (a velocidade areolar é constante):

$$\frac{A}{30} = \frac{2A}{t} \quad\Rightarrow\quad t = 60\ \text{dias}$$

A posição na órbita não muda essa proporção: perto do afélio o planeta é mais lento, mas a linha Sol–planeta é mais comprida, e os dois efeitos se compensam.

**Resposta:** $60$ dias.
:::

:::question kp-12 multiple_response medium leis-de-kepler
Marque **todas** as afirmações corretas.
---options---
- [x] As órbitas dos planetas são elípticas.
- [x] O quadrado do período de um planeta é proporcional ao cubo do semieixo maior da sua órbita.
- [ ] A velocidade de um planeta é constante ao longo da órbita.
- [ ] O Sol ocupa o centro da elipse descrita por cada planeta.
- [x] As leis de Kepler também valem para satélites em órbita da Terra.
---resolution---
- **Órbitas elípticas:** correta (1ª lei).
- **$T^2 \propto a^3$:** correta (3ª lei).
- **Velocidade constante:** incorreta. Pela 2ª lei, o planeta é mais rápido no periélio.
- **Sol no centro:** incorreta. O Sol ocupa um dos **focos**.
- **Satélites da Terra:** correta. As leis valem para qualquer corpo em órbita de um astro central; muda apenas a constante da 3ª lei.
:::

:::question kp-13 matching easy leis-de-kepler
Associe cada item à sua descrição.
---pairs---
- 1ª lei de Kepler ||| As órbitas são elipses com o Sol em um dos focos
- 2ª lei de Kepler ||| A linha Sol–planeta varre áreas iguais em tempos iguais
- 3ª lei de Kepler ||| A razão entre o quadrado do período e o cubo do semieixo maior é constante
- Tycho Brahe ||| Astrônomo cujas observações precisas Kepler usou
---resolution---
- **1ª lei (órbitas):** elipses com o Sol em um foco.
- **2ª lei (áreas):** áreas iguais em tempos iguais.
- **3ª lei (períodos):** $\dfrac{T^2}{a^3} = K$.
- **Tycho Brahe:** astrônomo dinamarquês que fez medidas muito precisas das posições dos planetas a olho nu; Kepler, seu assistente, usou esses dados (especialmente os de Marte) para chegar às leis.
:::

:::question kp-14 multiple_choice medium leis-de-kepler
Comparando dois planetas do Sistema Solar, o que está **mais distante** do Sol tem:
---options---
- [ ] período menor e velocidade orbital média maior.
- [x] período maior e velocidade orbital média menor.
- [ ] período maior e velocidade orbital média maior.
- [ ] o mesmo período, pois a constante de Kepler é a mesma.
---resolution---
- **Período:** pela 3ª lei, $T^2 \propto a^3$; quanto maior $a$, maior $T$.
- **Velocidade:** numa órbita aproximadamente circular, $v = \dfrac{2\pi a}{T}$. Como $T \propto a^{3/2}$, temos $v \propto \dfrac{a}{a^{3/2}} = a^{-1/2}$: quanto mais longe, **mais lento**. (Pela gravitação de Newton, $v = \sqrt{GM/r}$, o mesmo resultado.)

Exemplo: Mercúrio completa uma volta em cerca de 88 dias, e Netuno, em cerca de 165 anos.

**Resposta:** período maior e velocidade orbital média menor.
:::
