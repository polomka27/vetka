def build_node_tree(nodes: list[dict]) -> list[dict]:
    node_by_id = {}
    root_nodes = []

    for node in nodes:
        # Блок сбрасывает children перед сборкой дерева, чтобы избежать дубликатов и лишних пересортировок.
        node["children"] = []
        node_by_id[node["id"]] = node

    for node in nodes:
        parent_id = node["parent_id"]

        if parent_id is None:
            root_nodes.append(node)
            continue

        parent_node = node_by_id.get(parent_id)

        if parent_node is None:
            root_nodes.append(node)
            continue

        parent_node["children"].append(node)

    for node in node_by_id.values():
        node["children"].sort(key=lambda child: (child["position"], child["id"]))

    root_nodes.sort(key=lambda node: (node["position"], node["id"]))
    return root_nodes
