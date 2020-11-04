from typing import Any, List, Union

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import DomainRetriever, PipelineExecutor, ColumnName


class FillNaStep(BaseStep):
    name = Field('fillna', const=True)
    columns: List[ColumnName] = Field(min_items=1)
    value: Any

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        pipeline_executor: PipelineExecutor = None,
    ) -> DataFrame:
        return df.fillna({col_name: self.value for col_name in self.columns})
