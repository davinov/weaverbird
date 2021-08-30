from weaverbird.backends.sql_translator.steps import translate_percentage
from weaverbird.pipeline.steps import PercentageStep


def test_translate_no_new_column_percentage(query):
    step = PercentageStep(name='percentage', column='RAICHU')

    query = translate_percentage(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), PERCENTAGE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "100 * RATIO_TO_REPORT(RAICHU) AS PERCENT_RATIO_TO_REPORT_RAICHU FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, PERCENT_RATIO_TO_REPORT_RAICHU FROM PERCENTAGE_STEP_1'
    )
    assert query.query_name == 'PERCENTAGE_STEP_1'


def test_translate_simple_percentage(query):
    step = PercentageStep(name='percentage', column='RAICHU', new_column_name="RAICHU_COLUMN")

    query = translate_percentage(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), PERCENTAGE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "100 * RATIO_TO_REPORT(RAICHU) AS RAICHU_COLUMN FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, RAICHU_COLUMN FROM PERCENTAGE_STEP_1'
    )
    assert query.query_name == 'PERCENTAGE_STEP_1'


def test_translate_group_percentage(query):
    step = PercentageStep(
        name='percentage',
        column='RAICHU',
        group=['TOTO', 'FLORIZARRE'],
        new_column_name="RAICHU_COLUMN",
    )

    query = translate_percentage(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), PERCENTAGE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "100 * RATIO_TO_REPORT(RAICHU) AS RAICHU_COLUMN FROM SELECT_STEP_0 GROUP BY TOTO, FLORIZARRE)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, RAICHU_COLUMN FROM PERCENTAGE_STEP_1'
    )
    assert query.query_name == 'PERCENTAGE_STEP_1'
