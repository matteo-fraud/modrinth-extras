<template>
	<div class="option-field relative flex items-center gap-2" @click.stop>
		<span class="text-sm text-secondary flex-1">{{ label }}</span>
		<StyledInput v-model="text" size="small" wrapper-class="w-48" :placeholder="placeholder" />
	</div>
</template>

<script setup lang="ts">
import { StyledInput } from '@modrinth/ui'
import { ref, watch } from 'vue'

const props = withDefaults(
	defineProps<{
		label: string
		modelValue: string
		placeholder?: string
	}>(),
	{
		placeholder: undefined,
	},
)

const emit = defineEmits<{
	'update:modelValue': [value: string]
}>()

const text = ref(props.modelValue)

watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue !== text.value) text.value = newValue
	},
)

watch(text, (newValue) => {
	emit('update:modelValue', newValue)
})
</script>

<style scoped>
.option-field::before {
	content: '';
	position: absolute;
	left: -1.75rem;
	top: 0;
	height: 50%;
	width: 0.5rem;
	border-left: 2px solid var(--surface-5);
	border-bottom: 2px solid var(--surface-5);
	border-bottom-left-radius: 2px;
}

.option-field:not(:last-child)::after {
	content: '';
	position: absolute;
	left: -1.75rem;
	top: 50%;
	bottom: -0.5rem;
	border-left: 2px solid var(--surface-5);
}
</style>
