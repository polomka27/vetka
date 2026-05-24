from collections import deque

from sqlalchemy.orm import selectinload

from ..extensions import db
from ..models import Roadmap, RoadmapNode, User
from ..utils.errors import ApiError
from .admin_roadmap_service import AdminRoadmapService


class AdminNodeService:
    @staticmethod
    def create_node(*, roadmap_id: int, data: dict, actor: User) -> RoadmapNode:
        roadmap = db.session.get(Roadmap, roadmap_id)
        roadmap = AdminRoadmapService._ensure_roadmap_exists(roadmap)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)

        parent_node = None
        parent_id = data.get("parent_id")
        if parent_id is not None:
            parent_node = AdminNodeService._get_node_or_404(parent_id)
            AdminNodeService._validate_parent_belongs_to_same_roadmap(
                parent_node=parent_node,
                roadmap_id=roadmap_id,
            )

        AdminNodeService._ensure_position_available(
            roadmap_id=roadmap_id,
            parent_id=parent_node.id if parent_node is not None else None,
            position=data["position"],
        )

        node = RoadmapNode(
            roadmap_id=roadmap_id,
            parent_id=parent_node.id if parent_node is not None else None,
            title=data["title"],
            description=data.get("description"),
            content_type=data["content_type"],
            position=data["position"],
            depth=AdminNodeService._calculate_depth(parent_node),
            canvas_x=data.get("canvas_x"),
            canvas_y=data.get("canvas_y"),
            is_optional=data["is_optional"],
        )

        db.session.add(node)
        db.session.commit()
        return AdminNodeService._get_node_with_children(node.id)

    @staticmethod
    def update_node(*, node_id: int, data: dict, actor: User) -> RoadmapNode:
        node = AdminNodeService._get_node_or_404(node_id)
        roadmap = AdminRoadmapService._get_roadmap_or_404(node.roadmap_id)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)
        new_parent_node = node.parent
        target_parent_id = node.parent_id

        parent_changed = False
        if "parent_id" in data:
            new_parent_id = data["parent_id"]
            new_parent_node = None

            if new_parent_id is not None:
                new_parent_node = AdminNodeService._get_node_or_404(new_parent_id)
                AdminNodeService._validate_parent_belongs_to_same_roadmap(
                    parent_node=new_parent_node,
                    roadmap_id=node.roadmap_id,
                )
                AdminNodeService._validate_node_move(
                    node=node,
                    new_parent_node=new_parent_node,
                )

            node.parent_id = new_parent_id
            node.depth = AdminNodeService._calculate_depth(new_parent_node)
            target_parent_id = new_parent_id
            parent_changed = True

        target_position = data["position"] if "position" in data else node.position
        AdminNodeService._ensure_position_available(
            roadmap_id=node.roadmap_id,
            parent_id=target_parent_id,
            position=target_position,
            exclude_node_id=node.id,
        )

        if "title" in data:
            node.title = data["title"]

        if "description" in data:
            node.description = data["description"]

        if "content_type" in data:
            node.content_type = data["content_type"]

        if "position" in data:
            node.position = data["position"]

        if "canvas_x" in data:
            node.canvas_x = data["canvas_x"]

        if "canvas_y" in data:
            node.canvas_y = data["canvas_y"]

        if "is_optional" in data:
            node.is_optional = data["is_optional"]

        if parent_changed:
            AdminNodeService._recalculate_subtree_depths(node)

        db.session.commit()
        return AdminNodeService._get_node_with_children(node.id)

    @staticmethod
    def delete_node(*, node_id: int, actor: User) -> None:
        node = AdminNodeService._get_node_or_404(node_id)
        roadmap = AdminRoadmapService._get_roadmap_or_404(node.roadmap_id)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)
        db.session.delete(node)
        db.session.commit()

    @staticmethod
    def _get_node_or_404(node_id: int) -> RoadmapNode:
        node = db.session.get(RoadmapNode, node_id)
        if node is None:
            raise ApiError(
                message="Узел роадмапа не найден.",
                status_code=404,
                error_code="roadmap_node_not_found",
            )

        return node

    @staticmethod
    def _get_node_with_children(node_id: int) -> RoadmapNode:
        node = (
            db.session.query(RoadmapNode)
            .options(
                selectinload(RoadmapNode.resources),
                selectinload(RoadmapNode.children),
            )
            .filter(RoadmapNode.id == node_id)
            .first()
        )

        if node is None:
            raise ApiError(
                message="Узел роадмапа не найден.",
                status_code=404,
                error_code="roadmap_node_not_found",
            )

        return node

    @staticmethod
    def _validate_parent_belongs_to_same_roadmap(*, parent_node: RoadmapNode, roadmap_id: int) -> None:
        if parent_node.roadmap_id != roadmap_id:
            raise ApiError(
                message="Родительский узел должен принадлежать тому же роадмапу.",
                status_code=400,
                error_code="invalid_parent_roadmap",
            )

    @staticmethod
    def _ensure_position_available(
        *,
        roadmap_id: int,
        parent_id: int | None,
        position: int,
        exclude_node_id: int | None = None,
    ) -> None:
        # Блок заранее проверяет конфликт позиций среди соседних узлов и не даёт БД отвечать 500.
        query = db.session.query(RoadmapNode.id).filter(
            RoadmapNode.roadmap_id == roadmap_id,
            RoadmapNode.parent_id == parent_id,
            RoadmapNode.position == position,
        )

        if exclude_node_id is not None:
            query = query.filter(RoadmapNode.id != exclude_node_id)

        if query.first() is not None:
            raise ApiError(
                message="В этой ветке уже есть узел с такой позицией.",
                status_code=409,
                error_code="node_position_conflict",
            )

    @staticmethod
    def _validate_node_move(*, node: RoadmapNode, new_parent_node: RoadmapNode) -> None:
        if new_parent_node.id == node.id:
            raise ApiError(
                message="Узел не может быть родителем самому себе.",
                status_code=400,
                error_code="invalid_parent_node",
            )

        visited: set[int] = set()
        ancestor_id: int | None = new_parent_node.parent_id
        while ancestor_id is not None:
            if ancestor_id in visited:
                break
            visited.add(ancestor_id)
            if ancestor_id == node.id:
                raise ApiError(
                    message="Нельзя переместить узел внутрь собственного поддерева.",
                    status_code=400,
                    error_code="invalid_tree_move",
                )
            ancestor = db.session.get(RoadmapNode, ancestor_id)
            if ancestor is None:
                break
            ancestor_id = ancestor.parent_id

    @staticmethod
    def _calculate_depth(parent_node: RoadmapNode | None) -> int:
        return 0 if parent_node is None else parent_node.depth + 1

    @staticmethod
    def _recalculate_subtree_depths(root_node: RoadmapNode) -> None:
        all_nodes = (
            db.session.query(RoadmapNode)
            .filter(RoadmapNode.roadmap_id == root_node.roadmap_id)
            .all()
        )

        children_by_parent_id: dict[int, list[RoadmapNode]] = {}
        for n in all_nodes:
            if n.parent_id is not None:
                children_by_parent_id.setdefault(n.parent_id, []).append(n)

        queue: deque[RoadmapNode] = deque([root_node])
        while queue:
            current = queue.popleft()
            for child in children_by_parent_id.get(current.id, []):
                child.depth = current.depth + 1
                queue.append(child)
