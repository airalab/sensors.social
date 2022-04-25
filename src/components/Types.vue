<template>
  <div class="sensors-panel-section">
    <section>
      <div class="sensors-info">
        <a href="#info" class="sensors-info--link"
          ><i class="fa-solid fa-circle-info"></i
        ></a>

        <div id="info" class="sensors-info--popup">
          <h2>Показатели</h2>
          <p class="text">
            Это карта независимых датчиков с разными техническими
            характеристиками. В зависимости от типа датчика показываются разные
            типы измерения. Вот что они значат:
          </p>
          <dl>
            <dt>PM10</dt>
            <dd class="text">
              Взвешенные частицы (РМ — particulate matter) того или иного
              вещества диаметром менее 10 микрометра (мкм). Представляют собой
              широко распространенный загрязнитель атмосферного воздуха.
              Способны проникать глубоко в легкие, раздражать дыхательные пути,
              слизистую поверхность. Источником PM10 обычно являются стройки,
              автомобильные трассы, пыльные бури, сухая земля без
              растительности. РМ10 могут влиять на показатели смертности,
              статистику возникновения респираторных, сердечно-сосудистых
              заболеваний и другие показатели здоровья. Согласно ВОЗ для
              среднесуточной концентрации не допускается превышения порогового
              уровня 50 мкг/м3 более чем 35 раз в течение года, среднегодовая
              концентрация не должна превышать уровня в 40 мкг/м3.
            </dd>
            <dt>PM2.5</dt>
            <dd class="text">
              Взвешенные частицы (РМ — particulate matter) того или иного
              вещества диаметром менее 2.5 микрометра (мкм).
            </dd>
          </dl>
        </div>

        <a class="sensors-info--close" href="#"
          ><i class="fa-solid fa-circle-xmark"></i
        ></a>
      </div>
    </section>

    <section>
      <div class="sensors-select blue">
        <select v-model="type">
          <option
            v-for="(measurement, k) in measurements"
            :key="k"
            :value="measurement[0]"
          >
            {{ measurement[1] }}
          </option>
        </select>
        <i class="fa-solid fa-sort-down"></i>
      </div>

      <div class="text-small">{{ unit }}</div>
    </section>

    <section>
      <Color :type="type.toLowerCase()" />
    </section>
  </div>
</template>

<script>
import { measurements } from "../utils/measurement";
import Color from "./Color";

export default {
  props: ["current"],
  components: {
    Color,
  },
  data() {
    return {
      type: this.current,
      measurements: Object.entries(measurements)
        .map((item) => {
          return item[1].colors ? [item[0], item[1].label] : null;
        })
        .filter((item) => item),
    };
  },
  computed: {
    unit() {
      return measurements[this.current].unit;
    },
  },
  watch: {
    type: function () {
      this.$router.push({
        name: "main",
        params: {
          provider: this.$route.params.provider || "ipfs",
          type: this.type,
          zoom: this.$route.params.zoom,
          lat: this.$route.params.lat,
          lng: this.$route.params.lng,
        },
      });
      window.location.reload(false);
    },
  },
};
</script>
