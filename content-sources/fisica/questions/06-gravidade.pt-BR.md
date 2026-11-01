:::question gr-01 multiple_choice easy gravidade
Um astronauta vai da Terra para a Lua. Em relação à sua massa e ao seu peso, é correto afirmar:
---options---
- [ ] A massa e o peso diminuem.
- [x] A massa permanece a mesma e o peso diminui.
- [ ] A massa diminui e o peso permanece o mesmo.
- [ ] A massa e o peso permanecem os mesmos.
---resolution---
- **Massa** é a quantidade de matéria (e a medida da inércia): **não muda** de um lugar para outro.
- **Peso** é a força gravitacional, $P = m\,g$. Como $g$ na Lua (cerca de $1{,}6\ \text{m/s}^2$) é bem menor que na Terra (cerca de $9{,}8\ \text{m/s}^2$), o peso **diminui** (para cerca de um sexto).

**Resposta:** A massa permanece a mesma e o peso diminui.
:::

:::question gr-02 numeric easy gravidade answer=112
Qual é o peso, em newtons, de um astronauta de $70\ \text{kg}$ na superfície da Lua, onde $g = 1{,}6\ \text{m/s}^2$?
---resolution---
$$P = m\,g = 70 \times 1{,}6 = 112\ \text{N}$$

Na Terra (com $g = 10\ \text{m/s}^2$), o peso seria $700\ \text{N}$. A massa continua $70\ \text{kg}$ nos dois lugares.

**Resposta:** $112\ \text{N}$.
:::

:::question gr-03 numeric medium gravidade answer=2.5
Na superfície da Terra, $g = 10\ \text{m/s}^2$. Qual é o valor de $g$, em m/s², a uma **altitude** igual ao raio da Terra?
---resolution---
$$g_h = \frac{G M}{(R + h)^2}$$

Com $h = R$, a distância ao centro é $2R$:

$$g_h = \frac{G M}{(2R)^2} = \frac{1}{4} \cdot \frac{G M}{R^2} = \frac{g_0}{4} = \frac{10}{4} = 2{,}5\ \text{m/s}^2$$

**Resposta:** $2{,}5\ \text{m/s}^2$.
:::

:::question gr-04 multiple_choice medium gravidade
Um planeta tem o dobro da massa da Terra e o dobro do raio da Terra. A aceleração da gravidade na superfície desse planeta, em comparação com a da Terra ($g$), é:
---options---
- [ ] $2g$
- [ ] $g$
- [x] $g/2$
- [ ] $g/4$
---resolution---
$$g = \frac{G M}{R^2} \quad\Rightarrow\quad \frac{g_P}{g_T} = \frac{M_P}{M_T} \cdot \left(\frac{R_T}{R_P}\right)^2 = 2 \times \frac{1}{4} = \frac{1}{2}$$

A massa dobrada multiplica $g$ por 2, mas o raio dobrado o divide por 4.

**Resposta:** $g/2$.
:::

:::question gr-05 true_false easy gravidade answer=false
Os astronautas flutuam dentro da Estação Espacial Internacional porque, na altitude em que ela orbita, não existe gravidade.
---resolution---
**Falso.** Na altitude da ISS (cerca de 400 km), a aceleração da gravidade é de aproximadamente $8{,}7\ \text{m/s}^2$, cerca de 90% do valor na superfície. Os astronautas flutuam porque eles e a estação estão **em queda livre** juntos ao redor da Terra: todos caem com a mesma aceleração, então nada os pressiona contra o "chão". Esse estado se chama **imponderabilidade** (ou microgravidade).
:::

:::question gr-06 numeric medium gravidade answer=19200
Considere o raio da Terra igual a $6\,400\ \text{km}$. A que **altitude**, em quilômetros, a aceleração da gravidade vale $\frac{1}{16}$ do seu valor na superfície?
---resolution---
$$\frac{g_h}{g_0} = \left(\frac{R}{R + h}\right)^2 = \frac{1}{16} \quad\Rightarrow\quad \frac{R}{R + h} = \frac{1}{4} \quad\Rightarrow\quad R + h = 4R$$

$$h = 3R = 3 \times 6\,400 = 19\,200\ \text{km}$$

Erro comum: responder $4R = 25\,600\ \text{km}$, que é a distância ao **centro**, e não a altitude.

**Resposta:** $19\,200\ \text{km}$.
:::

:::question gr-07 multiple_choice easy gravidade
Na superfície da Lua, onde não há atmosfera, um martelo e uma pena são soltos ao mesmo tempo, da mesma altura. É correto afirmar que:
---options---
- [ ] o martelo chega primeiro, porque é mais pesado.
- [ ] a pena chega primeiro, porque é mais leve.
- [x] os dois chegam ao mesmo tempo.
- [ ] os dois flutuam, porque na Lua não há gravidade.
---resolution---
Sem resistência do ar, todos os corpos caem com a **mesma aceleração** $g = \dfrac{G M}{R^2}$, que não depende da massa do corpo que cai. Por isso chegam juntos. Essa experiência foi realmente feita pelo astronauta David Scott, na missão Apollo 15, em 1971.

**Resposta:** os dois chegam ao mesmo tempo.
:::

:::question gr-08 numeric hard gravidade answer=1000
Um planeta tem massa 8 vezes maior que a da Terra e raio 2 vezes maior. Na Terra, $g = 10\ \text{m/s}^2$. Qual seria o peso, em newtons, de uma pessoa de $50\ \text{kg}$ na superfície desse planeta?
---resolution---
**1. Gravidade no planeta:**

$$\frac{g_P}{g_T} = \frac{M_P}{M_T} \cdot \left(\frac{R_T}{R_P}\right)^2 = 8 \times \frac{1}{4} = 2 \quad\Rightarrow\quad g_P = 2 \times 10 = 20\ \text{m/s}^2$$

**2. Peso:**

$$P = m\,g_P = 50 \times 20 = 1\,000\ \text{N}$$

**Resposta:** $1\,000\ \text{N}$ (o dobro do peso na Terra).
:::

:::question gr-09 multiple_choice hard gravidade
Dois satélites descrevem órbitas circulares em torno da Terra: o satélite A, de raio $r$, e o satélite B, de raio $4r$. Sabendo que $v = \sqrt{GM/r}$, a velocidade orbital de B, em relação à de A ($v_A$), é:
---options---
- [ ] $4\,v_A$
- [ ] $2\,v_A$
- [x] $v_A / 2$
- [ ] $v_A / 4$
---resolution---
$$\frac{v_B}{v_A} = \sqrt{\frac{G M / (4r)}{G M / r}} = \sqrt{\frac{1}{4}} = \frac{1}{2}$$

Órbitas mais altas são **mais lentas**.

**Resposta:** $v_A / 2$.
:::

:::question gr-10 multiple_response medium gravidade
A aceleração da gravidade em um ponto acima da superfície de um planeta depende de quais fatores? Marque **todos** os corretos.
---options---
- [x] Da massa do planeta.
- [x] Da distância do ponto ao centro do planeta.
- [ ] Da massa do corpo que está caindo.
- [x] Da altitude do ponto.
---resolution---
$$g = \frac{G M}{(R + h)^2}$$

- **Massa do planeta ($M$):** sim.
- **Distância ao centro ($R + h$):** sim.
- **Altitude ($h$):** sim, pois ela altera a distância ao centro.
- **Massa do corpo que cai:** não. Ela se cancela ao igualar $m g$ com $\dfrac{G M m}{d^2}$.
:::

:::question gr-11 true_false medium gravidade answer=true
Na superfície da Terra, o valor de $g$ no Equador é ligeiramente menor que nos polos.
---resolution---
**Verdadeiro.** $g$ vale cerca de $9{,}78\ \text{m/s}^2$ no Equador e cerca de $9{,}83\ \text{m/s}^2$ nos polos. Dois fatores contribuem: a Terra é levemente achatada (no Equador a superfície está mais longe do centro) e a rotação da Terra reduz o peso aparente, efeito que é máximo no Equador.
:::

:::question gr-12 multiple_choice medium gravidade
Um satélite geoestacionário permanece sempre sobre o mesmo ponto do Equador. Para isso, o seu período de revolução deve ser:
---options---
- [ ] cerca de 90 minutos, como o da Estação Espacial Internacional.
- [ ] cerca de 12 horas, como o dos satélites de GPS.
- [x] igual ao período de rotação da Terra (cerca de 24 horas).
- [ ] cerca de 27 dias, como o da Lua.
---resolution---
Para ficar parado em relação ao solo, o satélite precisa girar **junto com a Terra**: mesmo período da rotação terrestre (um dia sideral, cerca de 23 h 56 min), no plano do Equador e no mesmo sentido. Pela 3ª lei de Kepler, esse período corresponde a uma órbita com raio de cerca de $42\,000\ \text{km}$ (altitude de aproximadamente $36\,000\ \text{km}$).

**Resposta:** igual ao período de rotação da Terra (cerca de 24 horas).
:::
