from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from ..extensions import db
from ..models import Roadmap, RoadmapNode, UserNodeProgress
from ..utils.errors import ApiError


class ProgressService:
    @staticmethod
    def get_started_roadmaps(*, user_id: int) -> list[dict]:
        started_entries = (
            db.session.query(UserNodeProgress)
            .join(Roadmap, Roadmap.id == UserNodeProgress.roadmap_id)
            .options(
                selectinload(UserNodeProgress.roadmap),
                selectinload(UserNodeProgress.node),
            )
            .filter(
                UserNodeProgress.user_id == user_id,
                Roadmap.is_published.is_(True),
                or_(
                    UserNodeProgress.status != "not_started",
                    UserNodeProgress.started_at.isnot(None),
                    UserNodeProgress.completed_at.isnot(None),
                ),
            )
            .order_by(UserNodeProgress.updated_at.desc(), UserNodeProgress.id.desc())
            .all()
        )

        if not started_entries:
            return []

        roadmap_ids = {progress_entry.roadmap_id for progress_entry in started_entries}
        total_nodes_rows = (
            db.session.query(
                RoadmapNode.roadmap_id,
                func.count(RoadmapNode.id),
            )
            .filter(RoadmapNode.roadmap_id.in_(roadmap_ids))
            .group_by(RoadmapNode.roadmap_id)
            .all()
        )
        total_nodes_by_roadmap_id = {
            roadmap_id: total_nodes for roadmap_id, total_nodes in total_nodes_rows
        }

        started_entries_by_roadmap_id: dict[int, list[UserNodeProgress]] = {}
        for progress_entry in started_entries:
            started_entries_by_roadmap_id.setdefault(progress_entry.roadmap_id, []).append(progress_entry)

        started_roadmaps = []
        for roadmap_id, roadmap_entries in started_entries_by_roadmap_id.items():
            roadmap = roadmap_entries[0].roadmap
            total_nodes = total_nodes_by_roadmap_id.get(roadmap_id, 0)
            done_nodes = sum(1 for roadmap_entry in roadmap_entries if roadmap_entry.status == "done")
            completion_percent = round((done_nodes / total_nodes) * 100, 2) if total_nodes > 0 else 0.0
            last_progress_entry = max(
                roadmap_entries,
                key=lambda roadmap_entry: roadmap_entry.updated_at or datetime.min.replace(tzinfo=timezone.utc),
            )

            started_roadmaps.append(
                {
                    "roadmap": roadmap,
                    "completion_percent": completion_percent,
                    "total_nodes": total_nodes,
                    "done_nodes": done_nodes,
                    "last_progress_point": {
                        "node_id": last_progress_entry.node_id,
                        "node_title": last_progress_entry.node.title,
                        "status": last_progress_entry.status,
                        "updated_at": last_progress_entry.updated_at,
                    }
                    if last_progress_entry.node is not None
                    else None,
                }
            )

        started_roadmaps.sort(
            key=lambda roadmap_item: (
                roadmap_item["last_progress_point"]["updated_at"]
                if roadmap_item["last_progress_point"] is not None
                else datetime.min.replace(tzinfo=timezone.utc)
            ),
            reverse=True,
        )
        return started_roadmaps

    @staticmethod
    def get_roadmap_progress(*, slug: str, user_id: int) -> dict:
        roadmap = (
            db.session.query(Roadmap)
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

        roadmap_nodes = (
            db.session.query(RoadmapNode)
            .filter(RoadmapNode.roadmap_id == roadmap.id)
            .order_by(RoadmapNode.position.asc(), RoadmapNode.id.asc())
            .all()
        )

        progress_entries = (
            db.session.query(UserNodeProgress)
            .filter(
                UserNodeProgress.user_id == user_id,
                UserNodeProgress.roadmap_id == roadmap.id,
            )
            .all()
        )

        progress_by_node_id = {
            progress_entry.node_id: progress_entry.status for progress_entry in progress_entries
        }
        notes_by_node_id = {
            str(progress_entry.node_id): progress_entry.note or ""
            for progress_entry in progress_entries
            if progress_entry.note
        }
        total_nodes = len(roadmap_nodes)
        done_nodes = sum(1 for progress_entry in progress_entries if progress_entry.status == "done")
        completion_percent = round((done_nodes / total_nodes) * 100, 2) if total_nodes > 0 else 0.0

        node_statuses = {
            str(node.id): progress_by_node_id.get(node.id, "not_started") for node in roadmap_nodes
        }

        return {
            "roadmap_id": roadmap.id,
            "total_nodes": total_nodes,
            "done_nodes": done_nodes,
            "completion_percent": completion_percent,
            "node_statuses": node_statuses,
            "node_notes": notes_by_node_id,
        }

    @staticmethod
    def _get_or_create_progress_entry(
        *, slug: str, node_id: int, user_id: int
    ) -> tuple["Roadmap", "RoadmapNode", UserNodeProgress]:
        roadmap = (
            db.session.query(Roadmap)
            .filter(Roadmap.slug == slug, Roadmap.is_published.is_(True))
            .first()
        )
        if roadmap is None:
            raise ApiError(message="Роадмап не найден.", status_code=404, error_code="roadmap_not_found")

        node = (
            db.session.query(RoadmapNode)
            .filter(RoadmapNode.id == node_id, RoadmapNode.roadmap_id == roadmap.id)
            .first()
        )
        if node is None:
            raise ApiError(message="Узел роадмапа не найден.", status_code=404, error_code="roadmap_node_not_found")

        progress_entry = (
            db.session.query(UserNodeProgress)
            .filter(
                UserNodeProgress.user_id == user_id,
                UserNodeProgress.roadmap_id == roadmap.id,
                UserNodeProgress.node_id == node.id,
            )
            .first()
        )
        if progress_entry is None:
            progress_entry = UserNodeProgress(
                user_id=user_id, roadmap_id=roadmap.id, node_id=node.id, status="not_started"
            )
            db.session.add(progress_entry)

        return roadmap, node, progress_entry

    @staticmethod
    def update_node_status(*, slug: str, node_id: int, user_id: int, status: str) -> UserNodeProgress:
        _roadmap, _node, progress_entry = ProgressService._get_or_create_progress_entry(
            slug=slug, node_id=node_id, user_id=user_id
        )

        now = datetime.now(timezone.utc)
        progress_entry.status = status

        if status == "in_progress" and progress_entry.started_at is None:
            progress_entry.started_at = now

        if status == "done":
            progress_entry.completed_at = now
            if progress_entry.started_at is None:
                progress_entry.started_at = now
        else:
            progress_entry.completed_at = None

        progress_entry.updated_at = now

        db.session.commit()
        return progress_entry

    @staticmethod
    def update_node_note(*, slug: str, node_id: int, user_id: int, note: str) -> UserNodeProgress:
        _roadmap, _node, progress_entry = ProgressService._get_or_create_progress_entry(
            slug=slug, node_id=node_id, user_id=user_id
        )

        progress_entry.note = note or None
        progress_entry.updated_at = datetime.now(timezone.utc)

        db.session.commit()
        return progress_entry
