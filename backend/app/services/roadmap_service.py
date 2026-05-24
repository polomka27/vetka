from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from ..extensions import db
from ..models import Roadmap, RoadmapNode, RoadmapTag, RoadmapTagLink, User
from ..utils.errors import ApiError


class RoadmapService:
    @staticmethod
    def get_published_roadmaps(
        *,
        category: str | None = None,
        level: str | None = None,
        tag: str | None = None,
        search: str | None = None,
    ) -> list[dict]:
        steps_count_subquery = (
            db.session.query(
                RoadmapNode.roadmap_id.label("roadmap_id"),
                func.count(RoadmapNode.id).label("steps_count"),
            )
            .group_by(RoadmapNode.roadmap_id)
            .subquery()
        )

        query = (
            db.session.query(
                Roadmap,
                func.coalesce(steps_count_subquery.c.steps_count, 0).label("steps_count"),
            )
            .outerjoin(steps_count_subquery, steps_count_subquery.c.roadmap_id == Roadmap.id)
            .filter(Roadmap.is_published.is_(True))
            .order_by(Roadmap.updated_at.desc(), Roadmap.id.desc())
        )

        if category:
            normalized_category = category.strip().lower()
            query = query.filter(func.lower(Roadmap.category) == normalized_category)

        if level:
            normalized_level = level.strip().lower()
            query = query.filter(func.lower(Roadmap.level) == normalized_level)

        if tag:
            normalized_tag = tag.strip().lower()
            query = query.filter(
                Roadmap.tag_links.any(
                    RoadmapTagLink.tag.has(
                        or_(
                            func.lower(RoadmapTag.slug) == normalized_tag,
                            func.lower(RoadmapTag.name) == normalized_tag,
                        )
                    )
                )
            )

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Roadmap.title.ilike(search_pattern),
                    Roadmap.short_description.ilike(search_pattern),
                    Roadmap.full_description.ilike(search_pattern),
                    Roadmap.category.ilike(search_pattern),
                    Roadmap.level.ilike(search_pattern),
                    Roadmap.author.has(User.username.ilike(search_pattern)),
                )
            )

        roadmap_rows = query.all()

        return [
            {
                "roadmap": roadmap,
                "steps_count": steps_count,
            }
            for roadmap, steps_count in roadmap_rows
        ]

    @staticmethod
    def get_published_roadmap_details(slug: str) -> dict:
        roadmap = (
            db.session.query(Roadmap)
            .options(
                selectinload(Roadmap.nodes).selectinload(RoadmapNode.resources),
                selectinload(Roadmap.tag_links).selectinload(RoadmapTagLink.tag),
            )
            .filter(
                Roadmap.slug == slug,
                Roadmap.is_published.is_(True),
            )
            .first()
        )

        if roadmap is None:
            raise ApiError(
                message="Роадмап не найден.",
                status_code=404,
                error_code="roadmap_not_found",
            )

        ordered_nodes = sorted(roadmap.nodes, key=lambda node: (node.depth, node.position, node.id))

        return {
            "roadmap": roadmap,
            "nodes": ordered_nodes,
            "total_steps_count": len(ordered_nodes),
        }
