from ..models import UserNodeProgress
from ..utils.errors import ApiError


ALLOWED_PROGRESS_STATUSES = {"not_started", "in_progress", "done"}
MAX_PROGRESS_NOTE_LENGTH = 5000


def validate_progress_status_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    status = str(payload.get("status", "")).strip()

    if not status:
        raise ApiError(
            message="Поле status обязательно.",
            status_code=400,
            error_code="status_required",
        )

    if status not in ALLOWED_PROGRESS_STATUSES:
        raise ApiError(
            message="Недопустимый статус прогресса.",
            status_code=400,
            error_code="invalid_progress_status",
        )

    return {"status": status}


def validate_progress_note_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(
            message="Тело запроса должно быть JSON-объектом.",
            status_code=400,
            error_code="invalid_json_body",
        )

    note = payload.get("note", "")

    if note is None:
        note = ""

    normalized_note = str(note).strip()

    if len(normalized_note) > MAX_PROGRESS_NOTE_LENGTH:
        raise ApiError(
            message="Заметка не должна превышать 5000 символов.",
            status_code=400,
            error_code="note_too_long",
        )

    return {"note": normalized_note}


def serialize_progress_summary(progress_summary: dict) -> dict:
    return {
        "roadmap_id": progress_summary["roadmap_id"],
        "total_nodes": progress_summary["total_nodes"],
        "done_nodes": progress_summary["done_nodes"],
        "completion_percent": progress_summary["completion_percent"],
        "node_statuses": progress_summary["node_statuses"],
        "node_notes": progress_summary["node_notes"],
    }


def serialize_started_roadmaps(started_roadmaps: list[dict]) -> dict:
    return {
        "roadmaps": [
            {
                "roadmap_id": started_roadmap["roadmap"].id,
                "slug": started_roadmap["roadmap"].slug,
                "title": started_roadmap["roadmap"].title,
                "short_description": started_roadmap["roadmap"].short_description,
                "category": started_roadmap["roadmap"].category,
                "level": started_roadmap["roadmap"].level,
                "completion_percent": started_roadmap["completion_percent"],
                "total_nodes": started_roadmap["total_nodes"],
                "done_nodes": started_roadmap["done_nodes"],
                "last_progress_point": {
                    "node_id": started_roadmap["last_progress_point"]["node_id"],
                    "node_title": started_roadmap["last_progress_point"]["node_title"],
                    "status": started_roadmap["last_progress_point"]["status"],
                    "updated_at": (
                        started_roadmap["last_progress_point"]["updated_at"].isoformat()
                        if started_roadmap["last_progress_point"]["updated_at"] is not None
                        else None
                    ),
                }
                if started_roadmap["last_progress_point"] is not None
                else None,
            }
            for started_roadmap in started_roadmaps
        ]
    }


def serialize_progress_entry(progress_entry: UserNodeProgress) -> dict:
    return {
        "id": progress_entry.id,
        "user_id": progress_entry.user_id,
        "roadmap_id": progress_entry.roadmap_id,
        "node_id": progress_entry.node_id,
        "status": progress_entry.status,
        "note": progress_entry.note,
        "started_at": progress_entry.started_at.isoformat() if progress_entry.started_at else None,
        "completed_at": progress_entry.completed_at.isoformat() if progress_entry.completed_at else None,
        "updated_at": progress_entry.updated_at.isoformat() if progress_entry.updated_at else None,
    }
