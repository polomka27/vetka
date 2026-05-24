from flask import Blueprint, jsonify, request

from ..schemas.roadmap import (
    parse_roadmap_filters,
    serialize_roadmap_details_response,
    serialize_roadmap_list_response,
)
from ..services.roadmap_service import RoadmapService

roadmaps_bp = Blueprint("roadmaps", __name__, url_prefix="/api/roadmaps")


@roadmaps_bp.get("")
@roadmaps_bp.get("/")
def get_roadmaps():
    filters = parse_roadmap_filters(request.args)
    roadmap_rows = RoadmapService.get_published_roadmaps(**filters)

    return jsonify(serialize_roadmap_list_response(roadmap_rows)), 200


@roadmaps_bp.get("/<string:slug>")
def get_roadmap_by_slug(slug: str):
    roadmap_details = RoadmapService.get_published_roadmap_details(slug=slug)

    return (
        jsonify(
            serialize_roadmap_details_response(
                roadmap=roadmap_details["roadmap"],
                nodes=roadmap_details["nodes"],
                total_steps_count=roadmap_details["total_steps_count"],
            )
        ),
        200,
    )
