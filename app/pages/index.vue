<template>
  <div>
    <UPageHero
      class="relative overflow-hidden"
      :ui="{
        container: 'lg:gap-12',
        title: 'text-pretty max-w-3xl sm:text-5xl',
        description: 'text-pretty max-w-2xl text-lg text-muted'
      }"
    >
      <template #title>
        LKS Slavia Ruda Śląska
      </template>
      <template #description>
        Klub podnoszenia ciężarów z tradycją i pasją. Trenujemy młodzież i dorosłych — od pierwszych kroków na platformie po starty w zawodach ogólnopolskich.
      </template>
      <template #links>
        <UButton
          to="/zawodnicy"
          size="xl"
          trailing-icon="i-lucide-arrow-right"
        >
          Poznaj zawodników
        </UButton>
        <UButton
          to="/kalkulator-sinclair"
          size="xl"
          color="neutral"
          variant="subtle"
          icon="i-lucide-calculator"
        >
          Kalkulator Sinclair
        </UButton>
        <UButton
          to="/logowanie"
          size="xl"
          color="neutral"
          variant="outline"
          icon="i-lucide-shield"
        >
          Strefa klubu
        </UButton>
      </template>
    </UPageHero>

    <UPageSection
      title="Kim jesteśmy"
      description="Slavia to nie tylko medalowe nazwiska — przede wszystkim ludzie, codzienna praca i bezpieczna nauka techniki."
      :features="[
        {
          icon: 'i-lucide-users',
          title: 'Społeczność',
          description: 'Trenerzy i zawodnicy tworzą przyjazną atmosferę — tu każdy zaczyna od solidnych podstaw.'
        },
        {
          icon: 'i-lucide-medal',
          title: 'Sport i rozwój',
          description: 'Starty w zawodach, progres na platformie i cele dopasowane do wieku oraz poziomu zaawansowania.'
        },
        {
          icon: 'i-lucide-heart-pulse',
          title: 'Zdrowy trening',
          description: 'Nacisk na technikę, regenerację i długofalowe bezpieczeństwo — siła ma służyć latami.'
        }
      ]"
    />

    <UPageSection
      orientation="horizontal"
      class="pb-16"
      :features="[
        {
          icon: 'i-lucide-map-pin',
          title: 'Lokalizacja',
          description: 'Ruda Śląska — klub dla mieszkańców aglomeracji i okolic. Szczegóły treningów ustalamy bezpośrednio z trenerem.'
        },
        {
          icon: 'i-lucide-calendar-days',
          title: 'Sezon i zajęcia',
          description: 'Treningi i zgrupowania organizujemy zgodnie z kalendarzem związku — o aktualnościach informujemy na miejscu i w korespondencji z klubem.'
        }
      ]"
    />

    <UPageSection>
      <UPageCTA
        title="Zobacz naszą drużynę"
        description="Aktualna lista zawodników i ich osiągnięcia w jednym, przejrzystym widoku."
        variant="subtle"
        :links="[
          {
            label: 'Lista zawodników',
            to: '/zawodnicy',
            trailingIcon: 'i-lucide-arrow-right',
            color: 'primary'
          }
        ]"
      />
    </UPageSection>
  </div>
</template>
