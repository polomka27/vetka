import re
import secrets

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from ..extensions import db
from ..models import Roadmap, RoadmapNode, User
from ..utils.errors import ApiError

_CYRILLIC_MAP = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "j", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


class AdminRoadmapService:
    @staticmethod
    def get_roadmaps(*, actor: User) -> list[Roadmap]:
        query = db.session.query(Roadmap)

        if actor.role != "admin":
            query = query.filter(Roadmap.author_id == actor.id)

        return query.order_by(Roadmap.updated_at.desc(), Roadmap.id.desc()).all()

    @staticmethod
    def get_roadmap_details(*, roadmap_id: int, actor: User) -> Roadmap:
        roadmap = (
            db.session.query(Roadmap)
            .options(
                selectinload(Roadmap.nodes).selectinload(RoadmapNode.resources),
            )
            .filter(Roadmap.id == roadmap_id)
            .first()
        )

        roadmap = AdminRoadmapService._ensure_roadmap_exists(roadmap)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)

        roadmap.nodes.sort(key=lambda node: (node.depth, node.position, node.id))
        for node in roadmap.nodes:
            node.resources.sort(key=lambda resource: (resource.position, resource.id))

        return roadmap

    @staticmethod
    def create_roadmap(*, author_id: int, data: dict) -> Roadmap:
        def _build(slug: str) -> Roadmap:
            return Roadmap(
                slug=slug,
                title=data["title"],
                short_description=data["short_description"],
                full_description=data.get("full_description"),
                category=data["category"],
                level=data["level"],
                is_published=data["is_published"],
                author_id=author_id,
            )

        base_slug = AdminRoadmapService._generate_unique_slug(data["title"])
        roadmap = _build(base_slug)
        db.session.add(roadmap)
        try:
            db.session.commit()
        except IntegrityError as exc:
            db.session.rollback()
            constraint_name = getattr(getattr(getattr(exc, "orig", None), "diag", None), "constraint_name", "") or ""
            if "slug" not in constraint_name:
                raise
            roadmap = _build(f"{base_slug}-{secrets.token_hex(3)}")
            db.session.add(roadmap)
            db.session.commit()

        return roadmap

    @staticmethod
    def update_roadmap(*, roadmap_id: int, data: dict, actor: User) -> Roadmap:
        roadmap = AdminRoadmapService._get_roadmap_or_404(roadmap_id)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)

        if "title" in data:
            roadmap.title = data["title"]

        if "short_description" in data:
            roadmap.short_description = data["short_description"]

        if "full_description" in data:
            roadmap.full_description = data["full_description"]

        if "category" in data:
            roadmap.category = data["category"]

        if "level" in data:
            roadmap.level = data["level"]

        if "is_published" in data:
            roadmap.is_published = data["is_published"]

        db.session.commit()
        return roadmap

    @staticmethod
    def delete_roadmap(*, roadmap_id: int, actor: User) -> None:
        roadmap = AdminRoadmapService._get_roadmap_or_404(roadmap_id)
        AdminRoadmapService._ensure_can_manage_roadmap(actor=actor, roadmap=roadmap)
        db.session.delete(roadmap)
        db.session.commit()

    @staticmethod
    def _get_roadmap_or_404(roadmap_id: int) -> Roadmap:
        roadmap = db.session.get(Roadmap, roadmap_id)
        return AdminRoadmapService._ensure_roadmap_exists(roadmap)

    @staticmethod
    def _ensure_roadmap_exists(roadmap: Roadmap | None) -> Roadmap:
        if roadmap is None:
            raise ApiError(
                message="Роадмап не найден.",
                status_code=404,
                error_code="roadmap_not_found",
            )

        return roadmap

    @staticmethod
    def _ensure_can_manage_roadmap(*, actor: User, roadmap: Roadmap) -> None:
        if actor.role == "admin":
            return

        if roadmap.author_id != actor.id:
            raise ApiError(
                message="Недостаточно прав для управления этим роадмапом.",
                status_code=403,
                error_code="roadmap_management_forbidden",
            )

    @staticmethod
    def _ensure_unique_slug(slug: str, exclude_roadmap_id: int | None = None) -> None:
        query = db.session.query(Roadmap).filter(Roadmap.slug == slug)

        if exclude_roadmap_id is not None:
            query = query.filter(Roadmap.id != exclude_roadmap_id)

        existing_roadmap = query.first()
        if existing_roadmap is not None:
            raise ApiError(
                message="Роадмап с таким slug уже существует.",
                status_code=409,
                error_code="roadmap_slug_already_exists",
            )

    @staticmethod
    def _slugify(value: str) -> str:
        lowered = value.strip().lower()
        transliterated = "".join(_CYRILLIC_MAP.get(ch, ch) for ch in lowered)
        normalized_value = re.sub(r"[^a-z0-9]+", "-", transliterated).strip("-")
        return normalized_value or "map"

    @staticmethod
    def _generate_unique_slug(title: str) -> str:
        base_slug = AdminRoadmapService._slugify(title)
        candidate_slug = base_slug
        suffix = 2

        while db.session.query(Roadmap.id).filter(Roadmap.slug == candidate_slug).first() is not None:
            candidate_slug = f"{base_slug}-{suffix}"
            suffix += 1

        return candidate_slug
