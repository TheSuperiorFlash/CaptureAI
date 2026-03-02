-- Migration: Create total_usage view for global cost analytics
-- Provides aggregated token/cost data across all users at 4 grouping levels:
--   sort_order 1: Grand total  (all prompt_types, all models)
--   sort_order 2: Per prompt_type (all models combined)
--   sort_order 3: Per model       (all prompt_types combined)
--   sort_order 4: Per model + prompt_type combination

DROP VIEW IF EXISTS total_usage;

CREATE VIEW total_usage AS
-- Row 1: Grand total across all prompt_types and all models
SELECT
  1 AS sort_order,
  'ALL' AS prompt_type,
  'ALL' AS model,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  COALESCE(SUM(total_cost), 0.0) AS total_cost
FROM usage_records

UNION ALL

-- Rows: Each prompt_type, all models combined
SELECT
  2 AS sort_order,
  prompt_type,
  'ALL' AS model,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  COALESCE(SUM(total_cost), 0.0) AS total_cost
FROM usage_records
GROUP BY prompt_type

UNION ALL

-- Rows: Each model, all prompt_types combined (3 rows for low/medium/high)
SELECT
  3 AS sort_order,
  'ALL' AS prompt_type,
  model,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  COALESCE(SUM(total_cost), 0.0) AS total_cost
FROM usage_records
GROUP BY model

UNION ALL

-- Rows: Each model + each prompt_type combination
SELECT
  4 AS sort_order,
  prompt_type,
  model,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  COALESCE(SUM(total_cost), 0.0) AS total_cost
FROM usage_records
GROUP BY model, prompt_type;
