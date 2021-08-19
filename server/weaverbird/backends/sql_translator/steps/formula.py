from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    complete_fields,
    handle_zero_division,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import FormulaStep


def translate_formula(
    step: FormulaStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    """
    Supported operators are:
    - "+"
    - "-"
    - "*"
    - "/" -> To avoid
    - "%"
    See: https://docs.snowflake.com/en/sql-reference/operators-arithmetic.html
    """

    query_name = f'FORMULA_STEP_{index}'
    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.formula: {step.formula}\n"
        f"step.new_column: {step.new_column}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.query_metadata}\n"
    )
    transformed_query = (
        f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {complete_fields(query)}, {handle_zero_division(step.formula)} AS {step.new_column}"""
        f""" FROM {query.query_name})"""
    )
    query.metadata_manager.add_column(column_name=step.new_column, column_type='float')
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(query.metadata_manager.query_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )
    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
