import { shallowMount, Wrapper } from '@vue/test-utils';

import extractVariableName from '@/components/stepforms/widgets/VariableInput/extract-variable-name';
import VariableInput from '@/components/stepforms/widgets/VariableInput/VariableInput.vue';

describe('Variable Input', () => {
  let wrapper: Wrapper<VariableInput>;

  beforeEach(() => {
    wrapper = shallowMount(VariableInput, {
      sync: false,
      propsData: {
        availableVariables: [
          {
            name: 'App variables',
            variables: [
              { name: 'view', value: 'Product 123' },
              { name: 'date.month', value: 'Apr' },
              { name: 'date.year', value: '2020' },
            ],
          },
          {
            name: 'Story variables',
            variables: [
              { name: 'country', value: 'USA' },
              { name: 'city', value: 'New york' },
            ],
          },
        ],
      },
      slots: {
        default: '<input type="text"/>',
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should contain the input in the default slot', () => {
    expect(wrapper.find("input[type='text']").exists()).toBe(true);
  });

  describe('the variable (x) button', () => {
    it('should be present', () => {
      expect(wrapper.find('.widget-input-variable__variable-toggle').exists()).toBe(true);
    });

    describe('when there is no available variables', () => {
      beforeEach(async () => {
        wrapper.setProps({
          availableVariables: undefined,
        });
        await wrapper.vm.$nextTick();
      });

      it('should not be present', () => {
        expect(wrapper.find('.widget-input-variable__variable-toggle').exists()).toBe(false);
      });
    });

    describe('when clicked', () => {
      beforeEach(async () => {
        wrapper.find('.widget-input-variable__variable-toggle').trigger('click');
        await wrapper.vm.$nextTick();
      });

      it('should display the variable chooser', () => {
        expect(wrapper.find('.widget-input-variable__variable-chooser').props().visible).toBe(true);
      });

      it('should present all available variables organized in sections', () => {
        const sections = wrapper.findAll('.widget-input-variable__options-section');
        expect(sections).toHaveLength(2);
        const varsFromFirstSection = sections.at(0).findAll('.widget-input-variable__option');
        expect(varsFromFirstSection).toHaveLength(3);
      });

      it('should display variables current values along their names', () => {
        wrapper.findAll('.widget-input-variable__option').wrappers.forEach(w => {
          expect(w.find('.widget-input-variable__option-name').text()).not.toBe('');
          expect(w.find('.widget-input-variable__option-value').text()).not.toBe('');
        });
      });

      describe('when closing the popover', () => {
        beforeEach(async () => {
          wrapper.find('popover-stub').vm.$emit('closed');
          await wrapper.vm.$nextTick();
        });

        it('should hide the variable chooser', () => {
          expect(wrapper.find('.widget-input-variable__variable-chooser').props().visible).toBe(
            false,
          );
        });
      });

      describe('when choosing a variable', () => {
        beforeEach(async () => {
          wrapper.find('.widget-input-variable__option').trigger('click');
          await wrapper.vm.$nextTick();
        });

        it('should emit a new value with the chosen variable', () => {
          expect(wrapper.emitted('input')).toHaveLength(1);
          expect(wrapper.emitted('input')[0]).toEqual(['{{ view }}']);
        });

        it('should hide the variable chooser', () => {
          expect(wrapper.find('.widget-input-variable__variable-chooser').props().visible).toBe(
            false,
          );
        });
      });
    });
  });

  describe('when value is not a variable', () => {
    beforeEach(() => {
      wrapper.setProps({
        value: 'hummus',
      });
    });

    it('should display the regular input slot', () => {
      expect(wrapper.find('.widget-input-variable__input-container').exists()).toBe(true);
    });
  });

  describe('when value is a variable', () => {
    beforeEach(async () => {
      wrapper.setProps({
        value: '{{ hummus }}',
      });
      await wrapper.vm.$nextTick();
    });

    it('should not display the regular input slot', () => {
      expect(wrapper.find('.widget-input-variable__input-container').exists()).toBe(false);
    });

    it('should display the variable container', () => {
      expect(wrapper.find('.widget-input-variable__variable-container').exists()).toBe(true);
    });

    it('should display the name of the variable without delimiters', () => {
      expect(wrapper.find('.widget-input-variable__variable-name').text()).toBe('hummus');
    });

    describe('when dismissing the variable', () => {
      beforeEach(async () => {
        wrapper.find('.widget-input-variable__tag-close').trigger('click');
      });

      it('should reset the value', () => {
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0]).toEqual([undefined]);
      });
    });
  });
});

describe('extractVariableName', () => {
  it('should extract simple variable names', () => {
    expect(
      extractVariableName('{{ hummus }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus');
  });

  it('should extract variable names with dots', () => {
    expect(
      extractVariableName('{{ hummus.mtabal }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus.mtabal');
  });

  it('should extract variables with different delimiters', () => {
    expect(
      extractVariableName('<%= croissant %>', {
        start: '<%=',
        end: '%>',
      }),
    ).toBe('croissant');
  });
});
