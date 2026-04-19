import os
import boto3
from datetime import datetime, timezone

_kwargs = dict(region_name=os.getenv("AWS_REGION", "us-east-1"))
if endpoint := os.getenv("DYNAMODB_ENDPOINT"):
    _kwargs["endpoint_url"] = endpoint

_dynamodb = boto3.resource("dynamodb", **_kwargs)

logs_table = _dynamodb.Table("MedicationLogs")
schedule_table = _dynamodb.Table("MedicationSchedule")
users_table = _dynamodb.Table("Users")


def put_medication_log(uid: str, log: dict) -> None:
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    logs_table.put_item(Item={"pk": f"{uid}#{date}", "sk": log["log_id"], **log})


def get_logs(uid: str, date: str) -> list[dict]:
    response = logs_table.query(
        KeyConditionExpression="pk = :pk",
        ExpressionAttributeValues={":pk": f"{uid}#{date}"},
    )
    return response.get("Items", [])


def get_schedule(uid: str) -> list[dict]:
    response = schedule_table.query(
        KeyConditionExpression="pk = :pk",
        ExpressionAttributeValues={":pk": uid},
    )
    return response.get("Items", [])
