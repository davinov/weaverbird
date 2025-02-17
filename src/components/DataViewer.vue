<template>
  <div class="data-viewer" data-cy="weaverbird-data-viewer" v-if="pipeline">
    <ActionToolbar @actionClicked="openStepForm" />
    <div v-if="isLoading.dataset" class="data-viewer__loading">
      <div class="data-viewer__loading-spinner" />
      <div class="data-viewer__loading-text">Stay with us! Your data is on the way...</div>
    </div>
    <div v-else-if="!isEmpty" class="data-viewer-container">
      <div class="data-viewer-table-container">
        <table
          aria-hidden="true"
          class="data-viewer-table"
          data-cy="weaverbird-data-viewer-table"
          v-resizable="{
            columns: columnNames,
            labelTargetClass: 'data-viewer__header-label',
            classes: {
              table: 'data-viewer-table--resizable',
              handler: 'data-viewer__header-cell--resizable',
            },
          }"
        >
          <thead class="data-viewer__header">
            <tr>
              <td
                v-for="column in formattedColumns"
                :class="column.class"
                :key="column.name"
                @click="toggleColumnSelection({ column: column.name })"
              >
                <span
                  v-if="column.type"
                  :class="iconClass"
                  @click.stop="openDataTypeMenu(column.name)"
                >
                  <DataTypesMenu
                    :column-name="column.name"
                    :visible="isSupported('convert') && column.isDataTypeMenuOpened"
                    @actionClicked="openStepForm"
                    @closed="closeDataTypeMenu"
                  />
                  <FAIcon v-if="shouldUseFAIcon(column.type)" :icon="getIconType(column.type)" />
                  <span v-else v-html="getIconType(column.type)" />
                </span>
                <span
                  class="data-viewer__header-label"
                  data-cy="weaverbird-data-viewer-header-label"
                  v-tooltip.top="{
                    targetClasses: 'has-weaverbird__tooltip',
                    classes: 'weaverbird__tooltip',
                    content: column.name,
                    autoHide: false,
                    boundariesElement: 'td',
                    delay: { show: 500, hide: 100 },
                  }"
                  >{{ column.name }}</span
                >
                <span
                  class="data-viewer__header-action"
                  @click.stop="openMenu(column.name)"
                  v-if="hasSupportedActions"
                >
                  <ActionMenu
                    :column-name="column.name"
                    :visible="column.isActionMenuOpened"
                    @closed="closeMenu"
                    @actionClicked="openStepForm"
                  />
                  <FAIcon icon="angle-down" />
                </span>
              </td>
            </tr>
          </thead>
          <tbody class="data-viewer__body">
            <tr class="data-viewer__row" v-for="(row, index) in dataset.data" :key="index">
              <DataViewerCell
                class="data-viewer__cell"
                :class="{ 'data-viewer__cell--active': isSelected(columnHeaders[cellidx].name) }"
                v-for="(cell, cellidx) in row"
                :key="cellidx"
                :value="cell"
              />
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination />
    </div>
    <div v-else-if="isEmpty">No data available</div>
  </div>
  <div class="data-viewer data-viewer--no-pipeline" v-else />
</template>
<script lang="ts">
import _ from 'lodash';
import VTooltip from 'v-tooltip';
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import Pagination from '@/components/Pagination.vue';
import { resizable } from '@/directives/resizable/resizable';
import { DataSet, DataSetColumn, DataSetColumnType } from '@/lib/dataset';
import { Pipeline, PipelineStepName } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';
import { VQBModule } from '@/store';

import ActionMenu from './ActionMenu.vue';
import ActionToolbar from './ActionToolbar.vue';
import DataTypesMenu from './DataTypesMenu.vue';
import DataViewerCell from './DataViewerCell.vue';

Vue.use(VTooltip);

/**
 * @name DataViewer
 * @description A Vue Component that displays data into a table
 * @param {DataSet} dataset - The dataset that we want to display
 */
@Component({
  name: 'data-viewer',
  components: {
    ActionMenu,
    ActionToolbar,
    DataTypesMenu,
    DataViewerCell,
    Pagination,
    FAIcon,
  },
  directives: { resizable },
})
export default class DataViewer extends Vue {
  @VQBModule.State dataset!: DataSet;
  @VQBModule.State isLoading!: boolean;
  @VQBModule.State pagesize!: number;
  @VQBModule.State selectedColumns!: string[];

  @VQBModule.Getter('isDatasetEmpty') isEmpty!: boolean;
  @VQBModule.Getter isDatasetComplete!: boolean;
  @VQBModule.Getter columnHeaders!: DataSetColumn[];
  @VQBModule.Getter translator!: string;
  @VQBModule.Getter pipeline?: Pipeline;
  @VQBModule.Getter supportedSteps!: PipelineStepName[];

  @VQBModule.Mutation createStepForm!: ({
    stepName,
    stepFormDefaults,
  }: {
    stepName: PipelineStepName;
    stepFormDefaults?: object;
  }) => void;
  @VQBModule.Mutation toggleColumnSelection!: ({ column }: { column: string }) => void;
  @VQBModule.Mutation setSelectedColumns!: ({ column }: { column: string }) => void;

  activeActionMenuColumnName = '';
  activeDataTypeMenuColumnName = '';

  get hasSupportedActions(): boolean {
    return this.supportedSteps.filter(step => step !== 'domain').length > 0;
  }

  /**
   * @description Get our columns with their names and linked classes
   *
   * @return {Array<object>}
   */
  get formattedColumns() {
    return this.columnHeaders.map(d => {
      return {
        name: d.name,
        type: d.type || 'undefined',
        isActionMenuOpened: this.activeActionMenuColumnName === d.name,
        isDataTypeMenuOpened: this.activeDataTypeMenuColumnName === d.name,
        class: {
          'data-viewer__header-cell': true,
          'data-viewer__header-cell--disabled': !this.hasSupportedActions,
          'data-viewer__header-cell--active': this.isSelected(d.name),
        },
      };
    });
  }

  get columnNames(): string[] {
    return this.formattedColumns.map(({ name }: { name: string }) => name);
  }

  get iconClass() {
    if (this.isSupported('convert')) {
      return { 'data-viewer__header-icon': true, 'data-viewer__header-icon--active': true };
    } else {
      return { 'data-viewer__header-icon': true, 'data-viewer__header-icon--active': false };
    }
  }

  /**
   * @description Open the form to create a step
   *
   * @param {PipelineStepName} stepName - The name of the step we want to create
   */
  openStepForm(stepName: PipelineStepName, defaults = {}) {
    this.createStepForm({ stepName, stepFormDefaults: defaults });
  }

  /**
   * @description Tell us if our column is selected or not
   *
   * @param {string} column - A column name
   * @return {boolean}
   */
  isSelected(column: string) {
    return this.selectedColumns.includes(column);
  }

  isSupported(step: PipelineStepName) {
    return getTranslator(this.translator).supports(step);
  }

  getIconType(type: DataSetColumnType) {
    switch (type) {
      case 'string':
        return 'ABC';
      case 'integer':
        return '123';
      case 'long':
        return '123';
      case 'float':
        return '1.2';
      case 'date':
        return 'calendar-alt';
      case 'boolean':
        return 'check';
      case 'object':
        return '{ }';
      default:
        return '???';
    }
  }

  shouldUseFAIcon(type: DataSetColumnType): boolean {
    switch (type) {
      case 'date':
        return true;
      case 'boolean':
        return true;
      default:
        return false;
    }
  }

  openDataTypeMenu(name: string) {
    this.activeDataTypeMenuColumnName = name;
    this.setSelectedColumns({ column: name });
  }

  closeDataTypeMenu() {
    this.activeDataTypeMenuColumnName = '';
  }

  openMenu(name: string) {
    this.activeActionMenuColumnName = name;
    this.setSelectedColumns({ column: name });
  }

  closeMenu() {
    this.activeActionMenuColumnName = '';
  }

  /**
   * These menus are associated to the column headers.
   * It makes sense to close them when the headers change.
   */
  @Watch('columnHeaders')
  onSelectedColumnsChange(before: any, after: any) {
    // we compare old header to new header
    const columnsDifferences: DataSetColumn[] = _.differenceWith(before, after, _.isEqual);
    // if the difference is only on one column with same name that active one ...
    const isModifyingTheSameColumn =
      columnsDifferences.length === 1 &&
      columnsDifferences[0].name === this.activeActionMenuColumnName;
    // ... we won't close the menu because we are just editing a col (ex: loadAllValues )
    if (!isModifyingTheSameColumn) {
      // but we close it if changing the headers
      this.closeMenu();
      this.closeDataTypeMenu();
    }
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.data-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;

  @extend %main-font-style;
  ::v-deep *,
  ::v-deep ::after,
  ::v-deep ::before {
    box-sizing: border-box;
  }

  ::v-deep button {
    outline: none;
  }

  ::v-deep fieldset {
    border: none;
  }
}

.data-viewer-container {
  width: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.data-viewer-table-container {
  width: 100%;
  max-height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.data-viewer-table {
  border-collapse: collapse;
  width: 100%;
}

.data-viewer__header-cell,
.data-viewer__cell {
  position: relative;
  padding: 8px;
  background-color: white;
  border: 1px solid $data-viewer-border-color;
  font-size: 13px;
  text-align: left;
  text-overflow: ellipsis;
  //firefox hack for border-collapse issue
  background-clip: padding-box;
  max-width: 140px;
  min-width: 140px;
}

.data-viewer__cell {
  background-color: #fafafa;
  white-space: normal;
  overflow: hidden;
}

.data-viewer__header-cell--active,
.data-viewer__cell--active {
  // It's trick to have its left side colored cause of border-collapse
  border-left: 1px double;
  background-color: $active-color-faded-3;
  border-right-color: $active-color;
  border-left-color: $active-color;
}

.data-viewer__row:last-child {
  .data-viewer__cell--active {
    border-bottom-color: $active-color;
  }
}

.data-viewer__header-cell {
  cursor: pointer;
  font-weight: bold;
  padding: 6px 8px;
  padding-right: 23px;
}

.data-viewer__header-cell--active {
  border-top-color: $active-color;
  border-left: 1px double;
  color: $active-color;

  .data-viewer__header-action:hover {
    background-color: $active-color-faded-2;
  }

  .data-viewer__header-icon {
    color: $active-color-faded;
  }

  .data-viewer__header-icon--active:hover {
    color: $active-color;
  }
}

.data-viewer__header-cell--disabled {
  .data-viewer__header-icon {
    pointer-events: none;
  }
}

.data-viewer__header-label {
  display: inline-block;
  vertical-align: text-bottom;
  text-overflow: ellipsis;
  max-width: calc(100% - 40px);
  overflow: hidden;
  white-space: nowrap;
}

.data-viewer__header-icon {
  font-family: 'Roboto Slab', serif;
  color: #aaaaaa;
  margin-right: 6px;
}

.data-viewer__header-action {
  position: absolute;
  font-size: 18px;
  right: 10px;
  top: 6px;
  transition: opacity 300ms ease;
  display: flex;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  justify-content: center;
}

.data-viewer__header-action:hover {
  background-color: $data-viewer-border-color;
}

.data-viewer__header-icon--active:hover {
  color: $base-color;
}

.data-viewer__loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.data-viewer__loading-spinner {
  border-radius: 50%;
  border: 4px solid #efefef;
  border-top-color: $active-color;
  width: 50px;
  height: 50px;
  animation: spin 1500ms ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}

.data-viewer__loading-text {
  font-family: 'Roboto Slab', serif;
  margin-top: 30px;
  text-align: center;
  color: $active-color;
}
</style>

<style lang="scss">
@import '../styles/_variables';
.data-viewer__header-cell--resizable {
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  &:hover {
    border-left-color: $data-viewer-border-color;
    border-right-color: $data-viewer-border-color;
  }
}
</style>
