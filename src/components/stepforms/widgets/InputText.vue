<template>
  <div class="widget-input-text__container" :class="toggleClassErrorWarning">
    <div class="widget-input-text__label">
      <label v-if="name" @click="$refs.input.focus()">{{ name }}</label>
      <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener">
        <FAIcon icon="question-circle" />
      </a>
    </div>

    <VariableInput
      :value="value"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      @input="updateValue"
    >
      <input
        ref="input"
        class="widget-input-text"
        data-cy="weaverbird-input-text"
        :placeholder="placeholder"
        type="text"
        :value="value"
        @input="updateValue($event.target.value)"
      />
    </VariableInput>

    <div v-if="messageError" class="field__msg-error">
      <FAIcon icon="exclamation-circle" />
      {{ messageError }}
    </div>
    <div v-if="messageWarning" class="field__msg-warning">
      <FAIcon icon="exclamation-triangle" />
      {{ messageWarning }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import FormWidget from './FormWidget.vue';
import VariableInput from './VariableInput.vue';

@Component({
  name: 'input-text-widget',
  components: { VariableInput, FAIcon },
})
export default class InputTextWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: undefined })
  value!: string | number | boolean | undefined;

  @Prop({ default: undefined })
  docUrl!: string | undefined;

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  updateValue(newValue: string | undefined) {
    this.$emit('input', newValue || undefined);
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';

.widget-input-text__container {
  @extend %form-widget__container;
}

.widget-input-text {
  @extend %form-widget__field;

  &:focus-within {
    @extend %form-widget__field--focused;
  }
}

.widget-input-text__label {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.widget-input-text__label label {
  @extend %form-widget__label;
}

::v-deep .fa-question-circle {
  margin-left: 5px;
  color: $base-color;
  font-size: 14px;

  &:hover {
    color: $active-color;
  }
}
</style>
