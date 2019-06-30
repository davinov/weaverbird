export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Delete column step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['delete'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column to delete',
      description: 'Column to delete',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
  },
  required: ['name', 'column'],
  additionalProperties: false,
};
