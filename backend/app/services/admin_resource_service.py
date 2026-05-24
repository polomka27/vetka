from ..extensions import db
from ..models import Resource, RoadmapNode, User
from ..utils.errors import ApiError
from .admin_roadmap_service import AdminRoadmapService


class AdminResourceService:
    @staticmethod
    def create_resource(*, node_id: int, data: dict, actor: User) -> Resource:
        node = db.session.get(RoadmapNode, node_id)
        if node is None:
            raise ApiError(
                message="Узел карты не найден.",
                status_code=404,
                error_code="roadmap_node_not_found",
            )

        roadmap = AdminRoadmapService._get_roadmap_or_404(node.roadmap_id)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)

        resource = Resource(
            node_id=node.id,
            title=data["title"],
            url=data["url"],
            resource_type=data["resource_type"],
            position=data["position"],
        )
        db.session.add(resource)
        db.session.commit()
        return resource

    @staticmethod
    def delete_resource(*, resource_id: int, actor: User) -> None:
        resource = db.session.get(Resource, resource_id)
        if resource is None:
            raise ApiError(
                message="Ресурс не найден.",
                status_code=404,
                error_code="resource_not_found",
            )

        node = db.session.get(RoadmapNode, resource.node_id)
        if node is None:
            raise ApiError(
                message="Узел карты не найден.",
                status_code=404,
                error_code="roadmap_node_not_found",
            )

        roadmap = AdminRoadmapService._get_roadmap_or_404(node.roadmap_id)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)

        db.session.delete(resource)
        db.session.commit()
