---
title: Energia Potencial e Forças Conservativas
---

:::text
## Energia guardada

Pense em um livro na prateleira mais alta de uma estante. Ele está parado, então não tem energia cinética. Mas, se cair, vai ganhar velocidade: alguma energia estava **armazenada** nele por estar no alto. O mesmo acontece com:

- um arco esticado, pronto para lançar uma flecha;
- uma mola comprimida dentro de uma caneta;
- a água acumulada na represa de uma usina hidrelétrica.

Essa energia armazenada, que depende da **posição** de um corpo ou da **configuração** de um sistema (e não do seu movimento), é chamada de **energia potencial** ($E_p$). O nome vem justamente da ideia de *potencial*: é energia que **pode** ser convertida em movimento (ou em outra forma) quando o corpo for liberado.

A energia potencial está sempre associada a uma **força** e a uma **interação**:

| Força | Energia potencial associada | Expressão |
|---|---|---|
| Peso (atração gravitacional perto da Terra) | gravitacional | $E_{pg} = m\,g\,h$ |
| Força elástica de uma mola ideal | elástica | $E_{pel} = \dfrac{k\,x^2}{2}$ |

Nas próximas lições estudaremos cada uma delas em detalhe. Antes, precisamos entender **quais forças** permitem definir uma energia potencial.
:::

:::text
## Forças conservativas

Uma força é **conservativa** quando o trabalho que ela realiza entre dois pontos **depende apenas das posições inicial e final**, e **não do caminho percorrido**.

Uma forma equivalente de dizer isso: **o trabalho de uma força conservativa ao longo de um caminho fechado** (que começa e termina no mesmo ponto) **é zero**.

**Exemplos de forças conservativas:**

- o **peso** (força gravitacional);
- a **força elástica** de uma mola ideal;
- a força elétrica entre cargas paradas.

**Exemplos de forças não conservativas (dissipativas):**

- o **atrito cinético**;
- a **resistência do ar**;
- forças musculares e de motores, que dependem de como o agente age ao longo do caminho.

Por que o atrito não é conservativo? Arraste uma caixa 3 m para a frente e depois 3 m de volta: o atrito se opôs ao movimento **nas duas viagens**, então realizou trabalho negativo nas duas. No caminho fechado, o total é **negativo**, não zero. E quanto mais longo o caminho, maior o trabalho do atrito: ele depende da trajetória.

Só faz sentido falar em **energia potencial para forças conservativas**: como o trabalho delas só depende das posições, podemos associar a cada posição um "estoque" de energia.
:::

:::text
## O trabalho do peso não depende do caminho

Imagine levar uma caixa de massa $m$ do chão até uma altura $h$ por três caminhos diferentes: subindo na vertical, por uma rampa ou por uma escada.

- Na vertical, o peso aponta para baixo e o deslocamento para cima: $W_P = -m\,g\,h$.
- Na rampa, o caminho é mais longo, mas só a componente do peso ao longo da rampa realiza trabalho, e o resultado é o mesmo: $W_P = -m\,g\,h$.
- Na escada, os trechos horizontais não contribuem (peso perpendicular ao deslocamento), e os trechos verticais somam a altura total $h$: novamente $W_P = -m\,g\,h$.

Em geral, se um corpo vai de uma altura $h_i$ até uma altura $h_f$:

$$W_P = m\,g\,(h_i - h_f)$$

**Descendo** ($h_i > h_f$), o trabalho do peso é **positivo**; **subindo**, é **negativo**. O caminho não importa.
:::

:::text
## Teorema da energia potencial

Para qualquer força conservativa, o trabalho que ela realiza é igual a **menos a variação da energia potencial** associada:

$$W_{\text{conservativa}} = -\Delta E_p = E_{p,\text{inicial}} - E_{p,\text{final}}$$

Leitura física:

- Quando a força conservativa realiza **trabalho positivo** (um corpo caindo, uma mola voltando ao normal), a energia potencial **diminui**: ela está sendo convertida em outra forma (geralmente cinética).
- Quando a força conservativa realiza **trabalho negativo** (um corpo sendo levantado, uma mola sendo comprimida), a energia potencial **aumenta**: energia está sendo armazenada.

Para o peso, o teorema fica:

$$W_P = m g h_i - m g h_f = m\,g\,(h_i - h_f)$$

exatamente o resultado que encontramos acima.

**Importante:** o valor da energia potencial depende de onde escolhemos o **nível de referência** (onde $E_p = 0$), mas a **variação** $\Delta E_p$, que é o que aparece no teorema, **não depende** dessa escolha. Por isso podemos escolher a referência que deixar as contas mais simples.
:::

:::solved_exercise O mesmo trabalho por três caminhos
Uma caixa de $2\ \text{kg}$ desce de uma plataforma de $5\ \text{m}$ de altura até o chão, de três formas: (I) caindo na vertical, (II) escorregando por uma rampa de $10\ \text{m}$ de comprimento e (III) sendo carregada por uma escada. Adote $g = 10\ \text{m/s}^2$. Calcule o trabalho do peso em cada caso.
---resolution---
O peso é uma força conservativa: seu trabalho só depende das alturas inicial e final.

$$W_P = m\,g\,(h_i - h_f) = 2 \times 10 \times (5 - 0) = 100\ \text{J}$$

**Resposta:** $W_P = 100\ \text{J}$ nos **três** casos. O comprimento da rampa (10 m) é um dado que não interfere no trabalho do peso. Ele seria importante para calcular o trabalho de um eventual **atrito**, que depende do caminho.
:::

:::solved_exercise Caminho fechado: peso versus atrito
a) Um livro de $1\ \text{kg}$ é levantado $2\ \text{m}$ e depois baixado de volta à posição inicial. Calcule o trabalho total do peso ($g = 10\ \text{m/s}^2$).

b) Uma caixa é arrastada $3\ \text{m}$ para a frente e $3\ \text{m}$ de volta sobre um piso, com força de atrito constante de $5\ \text{N}$. Calcule o trabalho total do atrito.
---resolution---
**a)** Subida: $W_1 = -m g h = -1 \times 10 \times 2 = -20\ \text{J}$. Descida: $W_2 = +m g h = +20\ \text{J}$.

$$W_{\text{total}} = -20 + 20 = 0$$

Caminho fechado, trabalho zero: o peso é **conservativo**.

**b)** O atrito sempre se opõe ao movimento, nas duas viagens: $W_1 = -5 \times 3 = -15\ \text{J}$ e $W_2 = -5 \times 3 = -15\ \text{J}$.

$$W_{\text{total}} = -15 - 15 = -30\ \text{J} \ne 0$$

Caminho fechado, trabalho diferente de zero: o atrito é **não conservativo** (dissipativo).
:::

:::solved_exercise Aplicando o teorema da energia potencial
Uma bola de $0{,}5\ \text{kg}$ cai de uma altura de $8\ \text{m}$ até uma altura de $3\ \text{m}$ em relação ao solo. Adote $g = 10\ \text{m/s}^2$ e o solo como nível de referência.

a) Quais são as energias potenciais gravitacionais inicial e final?

b) Qual é o trabalho do peso nesse trecho?
---resolution---
**a)** $E_{p,i} = m g h_i = 0{,}5 \times 10 \times 8 = 40\ \text{J}$ e $E_{p,f} = m g h_f = 0{,}5 \times 10 \times 3 = 15\ \text{J}$.

**b)** Pelo teorema da energia potencial:

$$W_P = E_{p,i} - E_{p,f} = 40 - 15 = 25\ \text{J}$$

O trabalho é positivo (a bola desceu) e a energia potencial **diminuiu** 25 J: $\Delta E_p = -25\ \text{J}$.

**Verificação com outra referência:** se o nível zero fosse a altura de 3 m, teríamos $E_{p,i} = 0{,}5 \times 10 \times 5 = 25\ \text{J}$ e $E_{p,f} = 0$, e o trabalho continuaria $25 - 0 = 25\ \text{J}$. A variação não depende da referência.
:::

:::solved_exercise Trabalho da força elástica
Uma mola ideal de constante elástica $k = 100\ \text{N/m}$ está comprimida $0{,}2\ \text{m}$ e é liberada até voltar ao seu comprimento natural. Qual é o trabalho realizado pela força elástica?
---resolution---
A força elástica é conservativa, então vale o teorema da energia potencial com $E_{pel} = \dfrac{k x^2}{2}$:

$$E_{p,i} = \frac{100 \times 0{,}2^2}{2} = \frac{100 \times 0{,}04}{2} = 2\ \text{J} \qquad E_{p,f} = 0 \ (\text{mola sem deformação})$$

$$W_{el} = E_{p,i} - E_{p,f} = 2 - 0 = 2\ \text{J}$$

O trabalho é positivo: a mola "devolveu" ao sistema a energia que estava armazenada.
:::

:::real_world_application Usinas hidrelétricas
Uma usina hidrelétrica é uma grande máquina de converter energia potencial gravitacional. A barragem mantém a água em um nível alto. Quando a água desce pelos dutos, o peso realiza trabalho positivo e a energia potencial diminui, virando energia cinética da água, que gira as turbinas. Os geradores ligados às turbinas convertem essa energia em energia elétrica. Quanto maior a altura da queda e a vazão de água, maior a energia disponível.
:::

:::curiosity Quem batizou a energia potencial
A expressão "energia potencial" foi introduzida em 1853 pelo engenheiro e físico escocês William Rankine, numa época em que os cientistas estavam organizando a ideia de que as diferentes formas de energia se convertem umas nas outras sem que o total mude. O adjetivo "potencial" destaca que essa energia está guardada, à espera de ser usada.
:::

:::text
## Resumo e erros comuns

- Energia potencial: energia armazenada que depende da posição ou da configuração.
- Força conservativa: trabalho independe do caminho; em caminho fechado, trabalho nulo. Exemplos: peso e força elástica.
- Forças dissipativas (atrito, resistência do ar) dependem do caminho e não têm energia potencial associada.
- **Teorema da energia potencial:** $W_{\text{conservativa}} = -\Delta E_p = E_{p,i} - E_{p,f}$.
- Trabalho do peso: $W_P = m g (h_i - h_f)$, positivo na descida, negativo na subida.

**Erros comuns:**

- Calcular o trabalho do peso usando o comprimento da rampa em vez do desnível.
- Trocar o sinal: lembre que $W = E_{p,i} - E_{p,f}$ (inicial **menos** final).
- Achar que o valor da energia potencial é absoluto: ele depende da referência; só as variações têm significado físico.
:::
