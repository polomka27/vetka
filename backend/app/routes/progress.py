from flask import Blueprint, jsonify, request
from flask_jwt_extended import current_user, jwt_required

from ..schemas.progress import (
    validate_progress_note_payload,
    serialize_progress_entry,
    serialize_started_roadmaps,
    serialize_progress_summary,
    validate_progress_status_payload,
)
from ..services.progress_service import ProgressService

progress_bp = Blueprint("progress", __name__, url_prefix="/api/progress")


@progress_bp.get("/roadmaps")
@jwt_required()
def get_started_roadmaps():
    started_roadmaps = ProgressService.get_started_roadmaps(user_id=current_user.id)

    return jsonify(serialize_started_roadmaps(started_roadmaps)), 200


@progress_bp.get("/roadmaps/<string:slug>")
@jwt_required()
def get_roadmap_progress(slug: str):
    progress_summary = ProgressService.get_roadmap_progress(slug=slug, user_id=current_user.id)

    return jsonify(serialize_progress_summary(progress_summary)), 200


@progress_bp.patch("/roadmaps/<string:slug>/nodes/<int:node_id>")
@jwt_required()
def update_node_status(slug: str, node_id: int):
    payload = validate_progress_status_payload(request.get_json(silent=True))
    progress_entry = ProgressService.update_node_status(
        slug=slug,
        node_id=node_id,
        user_id=current_user.id,
        status=payload["status"],
    )

    return jsonify(serialize_progress_entry(progress_entry)), 200


@progress_bp.patch("/roadmaps/<string:slug>/nodes/<int:node_id>/note")
@jwt_required()
def update_node_note(slug: str, node_id: int):
    payload = validate_progress_note_payload(request.get_json(silent=True))
    progress_entry = ProgressService.update_node_note(
        slug=slug,
        node_id=node_id,
        user_id=current_user.id,
        note=payload["note"],
    )

    return jsonify(serialize_progress_entry(progress_entry)), 200
