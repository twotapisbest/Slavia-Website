<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type { PaymentStatusResponse } from '~/types/models'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Składka klubowa — Panel zawodnika',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const paymentStatus = ref<PaymentStatusResponse | null>(null)

const paymentForm = reactive<{
  month: string
  amount_pln: number | null
  note: string
}>({
  month: new Date().toISOString().slice(0, 7),
  amount_pln: 50,
  note: ''
})

async function refreshPaymentStatus() {
  if (!auth.canAccessAthletePortal.value || !auth.isAthlete.value) {
    paymentStatus.value = null
    return
  }
  const q = paymentForm.month ? `?month=${encodeURIComponent(paymentForm.month)}` : ''
  paymentStatus.value = await apiFetch<PaymentStatusResponse>(`${apiRoutes.payments.myStatus}${q}`).catch(() => null)
}

async function submitMembershipPayment() {
  if (!auth.canAccessAthletePortal.value || !auth.isAthlete.value) return
  try {
    await apiFetch(apiRoutes.payments.my, {
      method: 'POST',
      body: {
        month: paymentForm.month,
        amount_pln: paymentForm.amount_pln != null ? Number(paymentForm.amount_pln) : null,
        note: paymentForm.note
      }
    })
    toast.add({
      title: 'Zgłoszono płatność',
      description: 'Zgłoszenie trafiło do weryfikacji przez kadrę.',
      color: 'success'
    })
    paymentForm.note = ''
    await refreshPaymentStatus()
  } catch (e) {
    toast.add({
      title: 'Błąd zgłoszenia płatności',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

onMounted(() => {
  void refreshPaymentStatus()
})
</script>

<template>
  <UContainer class="py-8 md:py-14">
    <div class="mb-6">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">Panel zawodnika</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">Składka klubowa</h1>
      <p class="mt-2 max-w-2xl text-sm text-muted">
        Składka miesięczna to <span class="font-bold">50 zł</span>. Jeśli zapłacisz więcej, nadpłata przechodzi na kolejne miesiące (po zatwierdzeniu przez kadrę).
      </p>
    </div>

    <UAlert
      v-if="auth.isAthlete.value && paymentStatus && paymentStatus.is_overdue && !paymentStatus.is_paid"
      icon="i-lucide-alert-triangle"
      title="Brak opłaconej składki"
      :description="`Nie masz zatwierdzonej płatności za ${paymentStatus.month}. Termin płatności to 10.${paymentStatus.month.slice(5,7)}.${paymentStatus.month.slice(0,4)}.`"
      color="error"
      variant="subtle"
      class="mb-4 rounded-2xl"
    />

    <UCard class="rounded-2xl border-default/70">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-black text-highlighted">Status</h2>
        <UBadge
          v-if="paymentStatus"
          :color="paymentStatus.is_paid ? 'success' : (paymentStatus.is_overdue ? 'error' : 'warning')"
          variant="subtle"
        >
          {{ paymentStatus.is_paid ? 'Opłacona' : (paymentStatus.is_overdue ? 'Nieopłacona' : 'Niepotwierdzona') }}
        </UBadge>
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-3">
        <UFormField label="Miesiąc">
          <UInput v-model="paymentForm.month" type="month" size="lg" class="w-full" @change="refreshPaymentStatus" />
        </UFormField>
        <UFormField label="Kwota (PLN)" description="Domyślnie 50; możesz wpisać więcej.">
          <UInputNumber v-model="paymentForm.amount_pln" :min="1" :step="1" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Opis" description="Opcjonalnie">
          <UInput v-model="paymentForm.note" size="lg" class="w-full" placeholder="np. składka maj / przelew" />
        </UFormField>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-2">
        <UButton color="primary" variant="soft" size="lg" icon="i-lucide-banknote" @click="submitMembershipPayment">
          Zgłoś płatność
        </UButton>
        <UButton color="neutral" variant="ghost" size="lg" icon="i-lucide-refresh-cw" @click="refreshPaymentStatus">
          Odśwież
        </UButton>
        <p v-if="paymentStatus" class="text-xs text-muted">Termin: {{ paymentStatus.due_date }}</p>
      </div>
    </UCard>
  </UContainer>
</template>

