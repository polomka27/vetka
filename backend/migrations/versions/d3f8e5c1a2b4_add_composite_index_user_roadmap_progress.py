"""add composite index user_id+roadmap_id on user_node_progress

Revision ID: d3f8e5c1a2b4
Revises: c1f6e42ab9c3
Create Date: 2026-05-23 00:00:00.000000
"""

from alembic import op


revision = "d3f8e5c1a2b4"
down_revision = "c1f6e42ab9c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_user_node_progress_user_roadmap",
        "user_node_progress",
        ["user_id", "roadmap_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_node_progress_user_roadmap", table_name="user_node_progress")
