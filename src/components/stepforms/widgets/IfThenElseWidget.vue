<template>
  <div class="ifthenelse-widget">
    <div
      class="ifthenelse-widget__container"
      :class="{ 'ifthenelse-widget__container--collapsed': collapsed }"
    >
      <div class="ifthenelse-widget__header">
        <span class="ifthenelse-widget__collapse-button" @click="toggle" />
        <div class="ifthenelse-widget__tag">{{ isRoot ? 'IF' : 'ELSE IF' }}</div>
        <div v-if="!isRoot && !collapsed" class="ifthenelse-widget__remove" @click="deleteElseIf">
          <FAIcon icon="far trash-alt" />
        </div>
        <template v-if="collapsed">
          <div class="ifthenelse-widget__collapse-description" v-html="formulaToHumanFormat" />
          <div class="ifthenelse-widget__collapse-text" @click="toggle">
            EXPAND
          </div>
        </template>
      </div>
      <div class="ifthenelse-widget__row">
        <div class="ifthenelse-widget__row__link ifthenelse-widget__row__link--filter">
          <div class="ifthenelse-widget__row__link-top" />
          <div class="ifthenelse-widget__row__link-middle" />
          <div class="ifthenelse-widget__row__link-bottom" />
        </div>
        <FilterEditor
          :filter-tree="value.if"
          :errors="errors"
          :data-path="`${dataPath}.if`"
          :available-variables="availableVariables"
          :variable-delimiters="variableDelimiters"
          :column-types="columnTypes"
          @filterTreeUpdated="updateFilterTree"
        />
      </div>
      <div class="ifthenelse-widget__row">
        <div class="ifthenelse-widget__row__link">
          <div class="ifthenelse-widget__row__link-top" />
          <div class="ifthenelse-widget__row__link-bottom" />
        </div>
        <div class="ifthenelse-widget__tag">THEN</div>
      </div>
      <div class="ifthenelse-widget__row">
        <div class="ifthenelse-widget__row__link">
          <div class="ifthenelse-widget__row__link-top" />
          <div class="ifthenelse-widget__row__link-middle" />
          <div
            class="ifthenelse-widget__row__link-bottom"
            :class="{ 'ifthenelse-widget__row__link--hidden': hasElseIf }"
          />
        </div>
        <InputTextWidget
          class="ifthenelse-widget__input"
          :value="value.then"
          placeholder='Enter a "Text" with quotes, or a formula'
          :data-path="`${dataPath}.then`"
          :errors="errors"
          :available-variables="availableVariables"
          :variable-delimiters="variableDelimiters"
          @input="updateThenFormula"
        />
      </div>
      <template v-if="!hasElseIf">
        <div class="ifthenelse-widget__row">
          <div class="ifthenelse-widget__row__link">
            <div class="ifthenelse-widget__row__link-top" />
            <div class="ifthenelse-widget__row__link-bottom" />
          </div>
          <div class="ifthenelse-widget__tag">ELSE</div>
        </div>
        <div class="ifthenelse-widget__row">
          <div class="ifthenelse-widget__row__link">
            <div class="ifthenelse-widget__row__link-top" />
            <div class="ifthenelse-widget__row__link-middle" />
            <div class="ifthenelse-widget__row__link-bottom ifthenelse-widget__row__link--dashed" />
          </div>
          <InputTextWidget
            class="ifthenelse-widget__input"
            :value="value.else"
            placeholder='Enter a "Text" with quotes, or a formula'
            :data-path="`${dataPath}.else`"
            :errors="errors"
            :available-variables="availableVariables"
            :variable-delimiters="variableDelimiters"
            @input="updateElseFormula"
          />
        </div>
      </template>
    </div>
    <ifthenelse-widget
      v-if="hasElseIf"
      :value="value.else"
      :data-path="`${dataPath}.else`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :column-types="columnTypes"
      @input="updateElseFormula"
      @deletedElseIf="transformElseIfIntoElse"
    />
    <div class="ifthenelse-widget__footer" v-if="!hasElseIf">
      <div class="ifthenelse-widget__row">
        <div class="ifthenelse-widget__row__link">
          <div class="ifthenelse-widget__row__link-top ifthenelse-widget__row__link--dashed" />
          <div class="ifthenelse-widget__row__link-middle ifthenelse-widget__row__link--dashed" />
        </div>
        <div class="ifthenelse-widget__add" @click="transformElseIntoElseIf">
          Add nested condition
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import convertIfThenElseToHumanFormat from '@/components/convert-if-then-else-to-human-format';
import FAIcon from '@/components/FAIcon.vue';
import FilterEditor from '@/components/FilterEditor.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { FilterCondition, Formula, IfThenElseStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

@Component({
  name: 'ifthenelse-widget',
  components: {
    AutocompleteWidget,
    FilterEditor,
    InputTextWidget,
    FAIcon,
  },
})
export default class IfThenElseWidget extends Vue {
  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      if: { column: '', value: '', operator: 'eq' },
      then: '',
      else: '',
    }),
  })
  value!: Omit<IfThenElseStep, 'name' | 'newColumn'>;

  @Prop({ type: String, default: '' })
  dataPath!: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRoot!: boolean;

  @Prop({
    type: Array,
    default: () => [],
  })
  errors!: ErrorObject[];

  @Prop({
    type: Object,
    default: () => {},
  })
  columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Add a conditional column';
  collapsed = false;

  get formulaToHumanFormat() {
    return convertIfThenElseToHumanFormat(this.value);
  }

  get hasElseIf() {
    return typeof this.value.else !== 'string';
  }

  updateFilterTree(newFilterTree: FilterCondition) {
    this.$emit('input', {
      ...this.value,
      if: newFilterTree,
    });
  }

  updateThenFormula(formula: Formula) {
    this.$emit('input', {
      ...this.value,
      then: formula,
    });
  }

  updateElseFormula(elseObject: Omit<IfThenElseStep, 'name' | 'newColumn'> | Formula) {
    this.$emit('input', {
      ...this.value,
      else: elseObject || '',
    });
  }

  transformElseIntoElseIf() {
    this.updateElseFormula({
      if: { column: '', value: '', operator: 'eq' },
      then: '',
      else: this.value.else,
    });
  }

  transformElseIfIntoElse() {
    // This else case should never happen, "else if" being always an object
    //but is necessary for TypeScript completeness
    /* istanbul ignore else */
    if (typeof this.value.else === 'object') {
      this.collapsed = false;
      this.updateElseFormula(this.value.else.else);
    } else {
      return;
    }
  }

  deleteElseIf() {
    this.$emit('deletedElseIf');
  }

  toggle() {
    this.collapsed = !this.collapsed;
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';

%ifthenelse-widget__text {
  font-family: Montserrat, sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  color: $active-color;
}

%ifthenelse-widget__button {
  @extend %ifthenelse-widget__text;
  letter-spacing: 1px;
  font-size: 10px;
  cursor: pointer;
  &:hover {
    color: black;
  }
}
.ifthenelse-widget {
  .ifthenelse-widget__input {
    margin: 0;
    background-color: #e9eff5;
    padding: 5px;
    border: 1px solid $grey;
    border-radius: 5px;
  }
  ::v-deep .widget-input-text {
    background: white;
  }
  ::v-deep .filter-editor {
    width: 100%;
  }
  ::v-deep .conditions-group {
    padding-bottom: 0;
  }
  ::v-deep .conditions-group:not(.conditions-group--with-switch) {
    padding-top: 0;
  }
  ::v-deep .condition-row {
    background-color: #e9eff5;
  }
  ::v-deep .widget-variable__toggle {
    z-index: 1; // prevent inputs to be over multiselect dropdown
  }
}

.ifthenelse-widget__container {
  padding: 10px;
  border-radius: 5px;
  background-color: #f9fbfc;

  + .ifthenelse-widget {
    margin-top: 15px;
  }
}

.ifthenelse-widget__container--collapsed {
  background-color: #fbfbfb;
  .ifthenelse-widget__row:not(:first-child) {
    display: none;
  }
  .ifthenelse-widget__collapse-button {
    transform: translateY(-50%) rotate(180deg);
    &:before {
      border-color: #d9d9d9 transparent transparent;
    }
  }
  .ifthenelse-widget__tag {
    background-color: $grey;
    color: black;
  }
}

.ifthenelse-widget__row {
  position: relative;
  padding: 0 10px 0 15px;
}

.ifthenelse-widget__header {
  position: relative;
  padding: 0 10px 0 15px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  .ifthenelse-widget__tag,
  .ifthenelse-widget__collapse-text,
  .ifthenelse-widget__remove {
    flex: 0 auto;
  }
  .ifthenelse-widget__collapse-description {
    flex: 1;
  }
}

.ifthenelse-widget__footer {
  padding: 10px;
  margin-bottom: 10px;
  .ifthenelse-widget__row__link {
    top: -20px;
    bottom: -20px;
  }
}

.ifthenelse-widget__tag {
  @extend %ifthenelse-widget__text;
  font-size: 12px;
  line-height: 1.67;
  display: inline-flex;
  border-radius: 2px;
  padding: 0 6px;
  background-color: #e2ebf5;
}

.ifthenelse-widget__row {
  .ifthenelse-widget__tag {
    margin: 15px 0 10px;
  }
}

.ifthenelse-widget__collapse-button {
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 10px 5px;
  transition: transform 0.4s;
  cursor: pointer;
  &:before {
    content: '';
    display: block;
    border-color: #b8cce0 transparent transparent;
    border-width: 5px 5px 0;
    border-style: solid;
  }
}

.ifthenelse-widget__collapse-description {
  padding: 0 10px;
  font-family: Montserrat, sans-serif;
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  ::v-deep strong {
    font-size: 10px;
  }

  ::v-deep .empty {
    color: $grey-medium;
  }
}

.ifthenelse-widget__collapse-text {
  @extend %ifthenelse-widget__button;
}

.ifthenelse-widget__remove {
  color: $grey-medium;
  cursor: pointer;

  &:hover {
    color: black;
  }
}

.ifthenelse-widget__add {
  @extend %ifthenelse-widget__button;
  padding: 5px;
}

.ifthenelse-widget__row__link {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
}

.ifthenelse-widget__row__link-bottom,
.ifthenelse-widget__row__link-top {
  height: 50%;
  width: 0;
  border-left: 1px solid #d7e5f3;
  &.ifthenelse-widget__row__link--dashed {
    border-left-style: dashed;
  }
  &.ifthenelse-widget__row__link--hidden {
    height: 0;
  }
}

.ifthenelse-widget__row__link-middle {
  height: 0;
  width: 10px;
  border-bottom: 1px solid #d7e5f3;
  &.ifthenelse-widget__row__link--dashed {
    border-bottom-style: dashed;
  }
}

.ifthenelse-widget__row__link--filter {
  top: -10px;
  .ifthenelse-widget__row__link-top {
    height: 33px;
  }
  .ifthenelse-widget__row__link-bottom {
    height: 100%;
  }
}
</style>
