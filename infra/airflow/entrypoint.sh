#!/bin/bash
set -euo pipefail

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Initialize the database if it hasn't been done yet
# if ! airflow users list 2>/dev/null | grep -q airflow; then
  echo "Initializing Airflow database..."
  airflow db migrate

  # 5) Idempotent helper functions
  var_exists() { airflow variables get "$1" >/dev/null 2>&1; }
  conn_exists() { airflow connections get "$1" >/dev/null 2>&1; }

  echo "Setting up Airflow variables..."
  airflow variables set datalake-aws-region "${AWS_REGION}"
  airflow variables set datalake-s3-bucket "${S3_DATA_LAKE_BUCKET_NAME}"
  airflow variables set ntreis-s3-bucket "${S3_BUCKET}"
  airflow variables set datalake-glue-database "${GLUE_DATABASE}"
  airflow variables set rets-username "${RETS_USERNAME}"
  airflow variables set rets-password "${RETS_PASSWORD}"
  airflow variables set ercot-public-api-key "${ERCOT_PUBLIC_API_KEY}"
  airflow variables set ercot-username "${ERCOT_USERNAME}"
  airflow variables set ercot-password "${ERCOT_PASSWORD}"
  airflow variables set ercot-client-id "${ERCOT_CLIENT_ID}"

  user_exists() { airflow users list | awk '{print $1}' | grep -qx "$1"; }

  if ! user_exists airflow; then
    echo "Creating admin user..."
    airflow users create \
      --role Admin \
      --username airflow \
      --password airflow \
      --email airflow@airflow.com \
      --firstname airflow \
      --lastname airflow
  fi

  # 8) Connections (idempotent)
  if [ -n "${TIMESCALE_POSTGRES_HOST:-}" ] && ! conn_exists timescale_default; then

    airflow connections add timescale_default \
      --conn-type postgres \
      --conn-host "${TIMESCALE_POSTGRES_HOST}" \
      --conn-schema "${TIMESCALE_POSTGRES_DB}" \
      --conn-login "${TIMESCALE_POSTGRES_USER}" \
      --conn-password "${TIMESCALE_POSTGRES_PASSWORD}" \
      --conn-port "${TIMESCALE_POSTGRES_PORT}" \
      --conn-extra '{"options": "-c timezone=America/Chicago"}'
  fi

    if [ -n "${TIMESCALE_CLOUD_POSTGRES_HOST:-}" ] && ! conn_exists timescale_cloud; then

    airflow connections add timescale_cloud \
      --conn-type postgres \
      --conn-host "${TIMESCALE_CLOUD_POSTGRES_HOST}" \
      --conn-schema "${TIMESCALE_CLOUD_POSTGRES_DB}" \
      --conn-login "${TIMESCALE_CLOUD_POSTGRES_USER}" \
      --conn-password "${TIMESCALE_CLOUD_POSTGRES_PASSWORD}" \
      --conn-port "${TIMESCALE_CLOUD_POSTGRES_PORT}" \
      --conn-extra '{"options": "-c timezone=America/Chicago"}'
  fi

  if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ] && ! conn_exists aws_default; then
    airflow connections add aws_default \
        --conn-type aws \
        --conn-login "${AWS_ACCESS_KEY_ID}" \
        --conn-password "${AWS_SECRET_ACCESS_KEY}" \
        --conn-extra "{\"region_name\": \"us-east-1\"}"
  fi

  if [ -n "${RETS_USERNAME:-}" ] && [ -n "${RETS_PASSWORD:-}" ] && ! conn_exists ntreis_rets; then
    airflow connections add ntreis_rets \
        --conn-type http \
        --conn-host ntrdd.mlsmatrix.com \
        --conn-schema https \
        --conn-login "${RETS_USERNAME}" \
        --conn-password "${RETS_PASSWORD}" \
        --conn-extra "{\"endpoint\": \"/rets/login.ashx\"}"
  fi
#   echo "Airflow initialization complete!"
# else
#   echo "Airflow already initialized, skipping..."
# fi

# Execute the provided command
exec "$@"
