from flask import Blueprint, jsonify, request

from ..schemas.roadmap import (
    serialize_admin_resource,
    serialize_admin_node,
    serialize_admin_roadmap_details_response,
    serialize_admin_roadmap_list_response,
    serialize_admin_roadmap,
    validate_admin_create_resource_payload,
    validate_admin_create_node_payload,
    validate_admin_create_roadmap_payload,
    validate_admin_update_node_payload,
    validate_admin_update_roadmap_payload,
)
from ..services.admin_resource_service import AdminResourceService
from ..services.admin_node_service import AdminNodeService
from ..services.admin_roadmap_service import AdminRoadmapService
from flask_jwt_extended import current_user, jwt_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.get("/roadmaps")
@jwt_required()
def get_roadmaps():
    roadmaps = AdminRoadmapService.get_roadmaps(actor=current_user)

    return jsonify(serialize_admin_roadmap_list_response(roadmaps)), 200


@admin_bp.get("/roadmaps/<int:roadmap_id>")
@jwt_required()
def get_roadmap_details(roadmap_id: int):
    roadmap = AdminRoadmapService.get_roadmap_details(roadmap_id=roadmap_id, actor=current_user)

    return jsonify(serialize_admin_roadmap_details_response(roadmap)), 200


@admin_bp.post("/roadmaps")
@jwt_required()
def create_roadmap():
    payload = validate_admin_create_roadmap_payload(request.get_json(silent=True))
    roadmap = AdminRoadmapService.create_roadmap(author_id=current_user.id, data=payload)

    return jsonify(serialize_admin_roadmap(roadmap)), 201


@admin_bp.patch("/roadmaps/<int:roadmap_id>")
@jwt_required()
def update_roadmap(roadmap_id: int):
    payload = validate_admin_update_roadmap_payload(request.get_json(silent=True))
    roadmap = AdminRoadmapService.update_roadmap(
        roadmap_id=roadmap_id,
        data=payload,
        actor=current_user,
    )

    return jsonify(serialize_admin_roadmap(roadmap)), 200


@admin_bp.delete("/roadmaps/<int:roadmap_id>")
@jwt_required()
def delete_roadmap(roadmap_id: int):
    AdminRoadmapService.delete_roadmap(roadmap_id=roadmap_id, actor=current_user)

    return jsonify({"message": "Роадмап успешно удалён."}), 200


@admin_bp.post("/roadmaps/<int:roadmap_id>/nodes")
@jwt_required()
def create_node(roadmap_id: int):
    payload = validate_admin_create_node_payload(request.get_json(silent=True))
    node = AdminNodeService.create_node(roadmap_id=roadmap_id, data=payload, actor=current_user)

    return jsonify(serialize_admin_node(node)), 201


@admin_bp.patch("/nodes/<int:node_id>")
@jwt_required()
def update_node(node_id: int):
    payload = validate_admin_update_node_payload(request.get_json(silent=True))
    node = AdminNodeService.update_node(node_id=node_id, data=payload, actor=current_user)

    return jsonify(serialize_admin_node(node)), 200


@admin_bp.delete("/nodes/<int:node_id>")
@jwt_required()
def delete_node(node_id: int):
    AdminNodeService.delete_node(node_id=node_id, actor=current_user)

    return jsonify({"message": "Узел роадмапа успешно удалён."}), 200


@admin_bp.post("/nodes/<int:node_id>/resources")
@jwt_required()
def create_resource(node_id: int):
    payload = validate_admin_create_resource_payload(request.get_json(silent=True))
    resource = AdminResourceService.create_resource(node_id=node_id, data=payload, actor=current_user)

    return jsonify(serialize_admin_resource(resource)), 201


@admin_bp.delete("/resources/<int:resource_id>")
@jwt_required()
def delete_resource(resource_id: int):
    AdminResourceService.delete_resource(resource_id=resource_id, actor=current_user)

    return jsonify({"message": "Ресурс успешно удалён."}), 200
