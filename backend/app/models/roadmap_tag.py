from sqlalchemy import ForeignKey, String, UniqueConstraint

from ..extensions import db


class RoadmapTag(db.Model):
    __tablename__ = "roadmap_tags"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(String(100), unique=True, nullable=False, index=True)
    slug = db.Column(String(140), unique=True, nullable=False, index=True)

    roadmap_links = db.relationship(
        "RoadmapTagLink",
        back_populates="tag",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<RoadmapTag id={self.id} slug={self.slug!r}>"


class RoadmapTagLink(db.Model):
    __tablename__ = "roadmap_tag_links"
    __table_args__ = (
        UniqueConstraint("roadmap_id", "tag_id", name="uq_roadmap_tag_link"),
    )

    id = db.Column(db.Integer, primary_key=True)
    roadmap_id = db.Column(
        db.Integer,
        ForeignKey("roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag_id = db.Column(
        db.Integer,
        ForeignKey("roadmap_tags.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    roadmap = db.relationship("Roadmap", back_populates="tag_links", lazy="joined")
    tag = db.relationship("RoadmapTag", back_populates="roadmap_links", lazy="joined")

    def __repr__(self) -> str:
        return f"<RoadmapTagLink roadmap_id={self.roadmap_id} tag_id={self.tag_id}>"
