<template>
  <div class="sensors-info--popup">
    <template v-if="$i18n.locale === 'ru'">
      <h2>Показатели</h2>
      <p class="text">
        Это карта независимых датчиков с разными техническими характеристиками.
        В зависимости от типа датчика показываются разные типы измерения. Вот
        что они значат:
      </p>
      <dl>
        <dt>PM10</dt>
        <dd class="text">
          Взвешенные частицы (РМ — particulate matter) того или иного вещества
          диаметром менее 10 микрометра (мкм). Представляют собой широко
          распространенный загрязнитель атмосферного воздуха. Способны проникать
          глубоко в легкие, раздражать дыхательные пути, слизистую поверхность.
          Источником PM10 обычно являются стройки, автомобильные трассы, пыльные
          бури, сухая земля без растительности. РМ10 могут влиять на показатели
          смертности, статистику возникновения респираторных,
          сердечно-сосудистых заболеваний и другие показатели здоровья. Согласно
          ВОЗ для среднесуточной концентрации не допускается превышения
          порогового уровня 50 мкг/м3 более чем 35 раз в течение года,
          среднегодовая концентрация не должна превышать уровня в 40 мкг/м3.
        </dd>
        <dt>PM2.5</dt>
        <dd class="text">
          Взвешенные частицы (РМ — particulate matter) того или иного вещества
          диаметром менее 2.5 микрометра (мкм).
        </dd>
      </dl>
    </template>
    <template v-else>
      <h2>Indicators</h2>
      <p class="text">
        This is a map of independent sensors with different technical
        characteristics. Depending on the sensor type, different measurement
        types are shown. Here's what they mean:
      </p>
      <dl>
        <dt>PM10</dt>
        <dd class="text">
          Suspended particles (PM - particulate matter) of a substance with a
          diameter of less than 10 micrometers (μm). They are a widespread air
          pollutant. They are able to penetrate deep into the lungs, irritate
          the respiratory tract and mucous surface. The source of PM10 is
          usually construction sites, highways, dust storms, dry land without
          vegetation. PM10 can affect mortality rates, statistics on the
          occurrence of respiratory, cardiovascular diseases and other health
          indicators. According to WHO, the daily average concentration is not
          allowed to exceed the threshold level of 50 µg/m3 more than 35 times
          during the year, the average annual concentration should not exceed
          the level of 40 µg/m3.
        </dd>
        <dt>PM2.5</dt>
        <dd class="text">
          Suspended particles (PM - particulate matter) of a substance with a
          diameter of less than 2.5 micrometers (µm).
        </dd>
      </dl>
    </template>
  </div>
</template>
