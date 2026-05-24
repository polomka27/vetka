from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint

from ..extensions import db


class RoadmapNode(db.Model):
    __tablename__ = "roadmap_nodes"
    __table_args__ = (
        UniqueConstraint("roadmap_id", "parent_id", "position", name="uq_node_sibling_position"),
    )

    id = db.Column(db.Integer, primary_key=True)
    roadmap_id = db.Column(
        db.Integer,
        ForeignKey("roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id = db.Column(
        db.Integer,
        ForeignKey("roadmap_nodes.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    title = db.Column(String(255), nullable=False)
    description = db.Column(Text, nullable=True)
    content_type = db.Column(
        String(50),
        nullable=False,
        default="article",
        server_default="article",
    )
    position = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    depth = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    canvas_x = db.Column(db.Float, nullable=True)
    canvas_y = db.Column(db.Float, nullable=True)
    is_optional = db.Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=db.false(),
    )

    roadmap = db.relationship("Roadmap", back_populates="nodes", lazy="joined")
    parent = db.relationship(
        "RoadmapNode",
        remote_side=[id],
        back_populates="children",
        lazy="joined",
    )
    children = db.relationship(
        "RoadmapNode",
        back_populates="parent",
        cascade="all, delete-orphan",
        order_by="RoadmapNode.position",
        lazy="selectin",
    )
    resources = db.relationship(
        "Resource",
        back_populates="node",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Resource.position",
        lazy="selectin",
    )
    progress_entries = db.relationship(
        "UserNodeProgress",
        back_populates="node",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<RoadmapNode id={self.id} roadmap_id={self.roadmap_id} title={self.title!r}>"
